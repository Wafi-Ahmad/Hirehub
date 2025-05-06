import json
import random
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db import transaction
from ..models import Quiz, QuizAttempt, JobPost, User
import requests

# Define difficulty levels and quiz length
DIFFICULTY_LEVELS = ['easy', 'medium', 'hard']
TARGET_QUIZ_LENGTH = 10
CORRECT_STREAK_THRESHOLD = 2 # Increase difficulty after 2 correct
INCORRECT_STREAK_THRESHOLD = 1 # Decrease difficulty after 1 incorrect

class QuizService:
    @staticmethod
    @transaction.atomic
    def generate_quiz(job_id: int) -> Quiz:
        """
        Generate a quiz for a job using the local LLM, categorized by difficulty.
        """
        try:
            job = JobPost.objects.get(id=job_id)
            
            # Prepare the prompt for LLM (Modified for difficulty levels)
            prompt = {
                "model": "llama-3.2-3b-instruct",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are an expert at creating job-specific quiz questions categorized by difficulty. "
                            f"Create questions appropriate for {job.experience_level} level candidates. "
                            "Generate questions for 'easy', 'medium', and 'hard' difficulty levels. "
                            "Easy: Basic concepts. Medium: Practical scenarios. Hard: Strategic/Complex situations."
                        )
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Create 5 easy, 5 medium, and 5 hard multiple choice questions (15 total) for a {job.title} position.\n\n"
                            f"Job Description: {job.description}\n"
                            f"Required Skills: {job.required_skills}\n"
                            f"Experience Level: {job.experience_level}\n\n"
                            "Requirements:\n"
                            "1. Each answer must be a complete phrase (at least 3 words).\n"
                            "2. Make answers specific and job-related.\n"
                            "3. Avoid single-letter, number-only, or cross-referencing answers.\n"
                            "4. Difficulty must match the level (Easy, Medium, Hard).\n\n"
                            "Format the response as a JSON object with this structure:\n"
                            "{\n"
                            "  \"easy\": [ { \"question\": \"...\", \"answers\": [\"Correct\", \"Wrong1\", \"Wrong2\", \"Wrong3\"] } ],\n"
                            "  \"medium\": [ { \"question\": \"...\", \"answers\": [\"Correct\", \"Wrong1\", \"Wrong2\", \"Wrong3\"] } ],\n"
                            "  \"hard\": [ { \"question\": \"...\", \"answers\": [\"Correct\", \"Wrong1\", \"Wrong2\", \"Wrong3\"] } ]\n"
                            "}\n\n"
                            "Ensure exactly 5 questions per difficulty level."
                        )
                    }
                ],
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "categorized_quiz_questions",
                        "strict": "true",
                        "schema": {
                            "type": "object",
                            "properties": {
                                difficulty: {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "question": {"type": "string"},
                                            "answers": {
                                                "type": "array",
                                                "items": {"type": "string"},
                                                "minItems": 4,
                                                "maxItems": 4
                                            }
                                        },
                                        "required": ["question", "answers"]
                                    },
                                    "minItems": 5, # Expect 5 per difficulty
                                    "maxItems": 5
                                } for difficulty in DIFFICULTY_LEVELS
                            },
                            "required": DIFFICULTY_LEVELS
                        }
                    }
                },
                "temperature": 0.7,
                "max_tokens": 3000, # Increased tokens slightly for more questions
                "stream": False
            }

            # Call local LLM
            try:
                response = requests.post(
                    "http://localhost:1234/v1/chat/completions",
                    json=prompt,
                    timeout=180
                )
                
                if response.status_code != 200:
                    print(f"LLM Error ({response.status_code}): {response.text}")
                    raise ValidationError("Failed to generate quiz questions from LLM")

                result = response.json()
                if 'choices' not in result or not result['choices']:
                    raise ValidationError("Invalid response structure from LLM (no choices)")

                content = result['choices'][0]['message']['content']
                
                # Basic check for completeness
                if not content.strip().endswith('}'):
                     print(f"Incomplete JSON received: {content}")
                     raise ValidationError("Received incomplete JSON response from LLM")

                questions_data = json.loads(content)

                # Validate structure and content
                question_pool = {'easy': [], 'medium': [], 'hard': []}
                total_questions = 0
                for difficulty in DIFFICULTY_LEVELS:
                    if difficulty not in questions_data or not isinstance(questions_data[difficulty], list):
                        raise ValidationError(f"Missing or invalid '{difficulty}' questions in LLM response")
                    
                    if len(questions_data[difficulty]) != 5:
                         print(f"Warning: Expected 5 '{difficulty}' questions, got {len(questions_data[difficulty])}")
                         # Allow proceeding if at least some questions exist, but log it. Might need adjustment.

                    for i, q in enumerate(questions_data[difficulty]):
                        if 'question' not in q or 'answers' not in q or len(q['answers']) != 4:
                            raise ValidationError(f"Invalid question structure in '{difficulty}' at index {i}")
                        
                        # Validate answer format
                        for answer in q['answers']:
                            if len(answer.split()) < 3 or answer.strip() in ['A', 'B', 'C', 'D'] or 'same as' in answer.lower():
                                print(f"Invalid answer format detected: {answer}")
                                raise ValidationError(f"Invalid answer format in '{difficulty}' question {i+1}")

                        # Add internal ID and correct answer index (always 0)
                        processed_q = {
                            'id': i, # ID within the difficulty level
                            'question': q['question'],
                            'answers': q['answers'],
                            'correctAnswerIndex': 0 # Assume first answer is correct
                        }
                        question_pool[difficulty].append(processed_q)
                        total_questions += 1
                
                if total_questions < TARGET_QUIZ_LENGTH: # Need at least enough for a full quiz
                    raise ValidationError(f"LLM generated insufficient questions ({total_questions})")

                # Shuffle answers within each question
                for difficulty in question_pool:
                    for q in question_pool[difficulty]:
                        correct_answer = q['answers'][q['correctAnswerIndex']]
                        random.shuffle(q['answers'])
                        q['correctAnswerIndex'] = q['answers'].index(correct_answer)


                # Create and save the quiz with the structured pool
                quiz, created = Quiz.objects.update_or_create(
                    job_id=job_id,
                    defaults={
                        'question_pool': question_pool,
                        'start_difficulty': 'medium', # Default start
                        'is_active': True
                    }
                )
                
                print(f"Quiz {'created' if created else 'updated'} successfully for job {job_id}")
                return quiz

            except requests.Timeout:
                print("LLM request timed out")
                raise ValidationError("Quiz generation timed out. Please try again.")
            except requests.RequestException as e:
                print(f"Request Error: {str(e)}")
                raise ValidationError("Failed to connect to LLM service")
            except json.JSONDecodeError as e:
                print(f"JSON Decode Error: {str(e)}. Content: {content[:500]}...") # Log partial content
                raise ValidationError("Invalid JSON format received from LLM")
            except ValidationError as e: # Re-raise validation errors
                print(f"Quiz Generation Validation Error: {str(e)}")
                raise e
            except Exception as e: # Catch other unexpected errors
                 print(f"Unexpected Error during LLM processing: {str(e)}")
                 raise ValidationError(f"Failed to process LLM response: {str(e)}")

        except JobPost.DoesNotExist:
            raise ValidationError("Job not found")
        except Exception as e:
            print(f"Unexpected Error in generate_quiz: {str(e)}")
            raise ValidationError(f"Failed to generate quiz: {str(e)}")


    @staticmethod
    @transaction.atomic
    def start_quiz_attempt(user_id: int, job_id: int) -> dict:
        """
        Starts a new quiz attempt for the user or resumes an incomplete one.
        Returns the first/next question or results if already completed.
        """
        try:
            user = User.objects.get(id=user_id)
            job = JobPost.objects.get(id=job_id)
            quiz = Quiz.objects.get(job=job, is_active=True)

            # Check for existing attempt
            attempt, created = QuizAttempt.objects.get_or_create(
                user=user,
                quiz=quiz,
                defaults={
                    'current_difficulty': quiz.start_difficulty,
                    'score': None, # Ensure score is null on creation
                    'passed': None,
                    'completed_at': None,
                }
            )

            if attempt.is_finished:
                return {
                    'status': 'finished',
                    'message': 'You have already completed this quiz.',
                    'score': attempt.score,
                    'passed': attempt.passed,
                    'total_questions': TARGET_QUIZ_LENGTH,
                    'correct_answers': QuizService._count_correct_answers(attempt)
                }

            # If resuming, get the next question based on current state
            if not created and attempt.total_questions_served > 0:
                 # We could try to refetch the last question if needed, but simpler to just get the next one
                 print(f"Resuming quiz attempt {attempt.id} for user {user_id}")
                 pass # Proceed to get next question logic

            elif created:
                 print(f"Starting new quiz attempt {attempt.id} for user {user_id}")
            
            # Get the next question (or first question if new attempt)
            next_question_data = QuizService._get_next_question(attempt)
            
            if next_question_data['status'] == 'finished':
                 # This case shouldn't happen right after start/resume unless pool is empty
                 print(f"Warning: Quiz attempt {attempt.id} finished immediately.")
                 return next_question_data 
            
            # Save the ref of the question we are about to serve
            attempt.last_question_ref = next_question_data['question']['ref']
            attempt.save()

            return next_question_data # Contains {'status': 'in_progress', 'question': {...}}

        except User.DoesNotExist:
            raise ValidationError("User not found")
        except JobPost.DoesNotExist:
            raise ValidationError("Job not found")
        except Quiz.DoesNotExist:
            raise ValidationError("Active quiz not found for this job")
        except Exception as e:
            print(f"Error starting quiz attempt: {str(e)}")
            raise ValidationError(f"Failed to start quiz: {str(e)}")

    @staticmethod
    @transaction.atomic
    def process_quiz_step(user_id: int, job_id: int, answer_data: dict) -> dict:
        """
        Processes a single answer submission and returns the next question or final results.
        answer_data expected: {'question_ref': 'medium_2', 'answer_index': 1}
        """
        try:
            user = User.objects.get(id=user_id)
            job = JobPost.objects.get(id=job_id)
            quiz = Quiz.objects.get(job=job, is_active=True)
            attempt = QuizAttempt.objects.get(user=user, quiz=quiz)

            if attempt.is_finished:
                return {
                    'status': 'finished',
                    'message': 'Quiz already completed.',
                    'score': attempt.score,
                    'passed': attempt.passed,
                    'total_questions': TARGET_QUIZ_LENGTH,
                    'correct_answers': QuizService._count_correct_answers(attempt)
                }

            submitted_ref = answer_data.get('question_ref')
            submitted_answer_index = answer_data.get('answer_index')

            # --- Validation ---
            if submitted_ref is None or submitted_answer_index is None:
                raise ValidationError("Missing 'question_ref' or 'answer_index' in submission")
            
            if submitted_ref != attempt.last_question_ref:
                 print(f"Mismatch refs: submitted={submitted_ref}, expected={attempt.last_question_ref}")
                 # Optionally, resend the last question or return error
                 raise ValidationError("Submitted answer does not match the last question sent.")

            if submitted_ref in attempt.questions_answered:
                raise ValidationError("This question has already been answered.")

            try:
                submitted_answer_index = int(submitted_answer_index)
            except (ValueError, TypeError):
                 raise ValidationError("Invalid answer index provided.")

            # --- Find Question and Check Answer ---
            difficulty, q_id_str = submitted_ref.split('_')
            q_id = int(q_id_str)
            
            question_pool = quiz.question_pool.get(difficulty, [])
            question_data = next((q for q in question_pool if q['id'] == q_id), None)

            if not question_data:
                raise ValidationError(f"Question reference '{submitted_ref}' not found in quiz pool.")
            
            is_correct = False # Default to False
            if submitted_answer_index == -1:
                # Treat -1 as a skipped/timed-out answer (incorrect)
                print(f"Processing answer index -1 (timeout/skip) as incorrect for {submitted_ref}")
                is_correct = False 
            elif not (0 <= submitted_answer_index < len(question_data['answers'])):
                 # Validate index only if it's not -1
                 raise ValidationError("Answer index out of range.")
            else:
                 # Check correctness if index is valid and not -1
                 is_correct = (submitted_answer_index == question_data['correctAnswerIndex'])

            # --- Update Attempt State ---
            # Store the submitted answer index (even if -1, indicates a skip)
            attempt.answers[submitted_ref] = submitted_answer_index 
            
            # Log the answered question reference
            attempt.questions_answered.append(submitted_ref)
            
            attempt.total_questions_served += 1

            if is_correct:
                attempt.correct_streak += 1
                attempt.incorrect_streak = 0
            else:
                attempt.incorrect_streak += 1
                attempt.correct_streak = 0

            # --- Adaptive Logic ---
            current_difficulty_index = DIFFICULTY_LEVELS.index(attempt.current_difficulty)
            new_difficulty_index = current_difficulty_index

            if attempt.correct_streak >= CORRECT_STREAK_THRESHOLD and current_difficulty_index < len(DIFFICULTY_LEVELS) - 1:
                new_difficulty_index += 1
                attempt.correct_streak = 0 # Reset streak after adjusting
                print(f"Difficulty Increased to {DIFFICULTY_LEVELS[new_difficulty_index]}")
            elif attempt.incorrect_streak >= INCORRECT_STREAK_THRESHOLD and current_difficulty_index > 0:
                new_difficulty_index -= 1
                attempt.incorrect_streak = 0 # Reset streak after adjusting
                print(f"Difficulty Decreased to {DIFFICULTY_LEVELS[new_difficulty_index]}")
            
            attempt.current_difficulty = DIFFICULTY_LEVELS[new_difficulty_index]

            # --- Check for Quiz Completion ---
            if attempt.total_questions_served >= TARGET_QUIZ_LENGTH:
                score = QuizService._calculate_final_score(attempt)
                passed = score >= quiz.passing_score
                
                attempt.score = score
                attempt.passed = passed
                attempt.completed_at = timezone.now()
                attempt.last_question_ref = None # Clear last question ref on completion
                attempt.save()
                
                print(f"Quiz attempt {attempt.id} completed. Score: {score}, Passed: {passed}")
                return {
                    'status': 'finished',
                    'score': score,
                    'passed': passed,
                    'total_questions': TARGET_QUIZ_LENGTH,
                    'correct_answers': QuizService._count_correct_answers(attempt)
                }
            
            # --- Get Next Question ---
            next_question_data = QuizService._get_next_question(attempt)
            
            if next_question_data['status'] == 'finished':
                 # Quiz finished unexpectedly (e.g., ran out of questions)
                 score = QuizService._calculate_final_score(attempt)
                 passed = score >= quiz.passing_score
                 attempt.score = score
                 attempt.passed = passed
                 attempt.completed_at = timezone.now()
                 attempt.last_question_ref = None
                 attempt.save()
                 print(f"Quiz attempt {attempt.id} finished early. Score: {score}, Passed: {passed}")
                 return next_question_data

            # Save the ref of the question we are about to serve
            attempt.last_question_ref = next_question_data['question']['ref']
            attempt.save()

            return next_question_data

        except QuizAttempt.DoesNotExist:
            raise ValidationError("Quiz attempt not found or already completed.")
        except (User.DoesNotExist, JobPost.DoesNotExist, Quiz.DoesNotExist):
             raise ValidationError("Invalid user, job, or quiz.")
        except Exception as e:
            print(f"Error processing quiz step: {str(e)}")
            # Consider logging the full traceback here
            raise ValidationError(f"Failed to process quiz step: {str(e)}")

    @staticmethod
    def _get_next_question(attempt: QuizAttempt) -> dict:
        """Selects the next appropriate question based on difficulty and history."""
        quiz = attempt.quiz
        difficulty_order = DIFFICULTY_LEVELS # ['easy', 'medium', 'hard']
        current_difficulty_index = difficulty_order.index(attempt.current_difficulty)
        
        # Try current difficulty first, then expand search outwards
        search_indices = [current_difficulty_index]
        if current_difficulty_index > 0:
            search_indices.append(current_difficulty_index - 1) # Easier
        if current_difficulty_index < len(difficulty_order) - 1:
            search_indices.append(current_difficulty_index + 1) # Harder
        
        # Ensure we check all difficulties if needed, prioritize closer ones
        remaining_indices = [i for i in range(len(difficulty_order)) if i not in search_indices]
        search_indices.extend(remaining_indices)

        for diff_index in search_indices:
             difficulty = difficulty_order[diff_index]
             pool = quiz.question_pool.get(difficulty, [])
             
             potential_questions = []
             for q_data in pool:
                 q_ref = f"{difficulty}_{q_data['id']}"
                 if q_ref not in attempt.questions_answered:
                     potential_questions.append(q_data)
             
             if potential_questions:
                 # Select a random question from the available ones at this difficulty
                 chosen_question = random.choice(potential_questions)
                 chosen_ref = f"{difficulty}_{chosen_question['id']}"
                 
                 # Prepare question for frontend (remove correct answer index)
                 frontend_question = {
                     'ref': chosen_ref, # Unique reference for this question in this attempt
                     'text': chosen_question['question'],
                     'options': chosen_question['answers'] # Answers already shuffled during generation
                 }
                 
                 print(f"Serving question {chosen_ref} (Difficulty: {difficulty}) for attempt {attempt.id}")
                 return {
                     'status': 'in_progress',
                     'question': frontend_question
                 }

        # If no unanswered questions are found anywhere
        print(f"No more questions available for attempt {attempt.id}")
        return {
            'status': 'finished',
            'message': 'No more questions available.',
            'score': QuizService._calculate_final_score(attempt), # Calculate score based on answers so far
            'passed': (QuizService._calculate_final_score(attempt) or 0) >= quiz.passing_score,
            'total_questions': attempt.total_questions_served,
            'correct_answers': QuizService._count_correct_answers(attempt)
        }

    @staticmethod
    def _calculate_final_score(attempt: QuizAttempt) -> int:
        """Calculates the final score based on answers stored in the attempt."""
        correct_count = QuizService._count_correct_answers(attempt)
        total_served = attempt.total_questions_served

        if total_served == 0:
            return 0
        
        score = round((correct_count / total_served) * 100)
        return score

    @staticmethod
    def _count_correct_answers(attempt: QuizAttempt) -> int:
         """Counts correct answers based on the attempt's answer log."""
         correct_count = 0
         quiz = attempt.quiz
         for q_ref, submitted_answer_index in attempt.answers.items():
             try:
                 difficulty, q_id_str = q_ref.split('_')
                 q_id = int(q_id_str)
                 
                 question_pool = quiz.question_pool.get(difficulty, [])
                 question_data = next((q for q in question_pool if q['id'] == q_id), None)
                 
                 if question_data and submitted_answer_index == question_data['correctAnswerIndex']:
                     correct_count += 1
             except (ValueError, IndexError, KeyError):
                 # Log error if reference is invalid or data structure issue
                 print(f"Error processing answer for ref {q_ref} in attempt {attempt.id}")
                 continue
         return correct_count

    @staticmethod
    def get_quiz_result(quiz_id: int, user_id: int) -> dict:
        """
        Get the result of a user's *completed* quiz attempt.
        """
        try:
            attempt = QuizAttempt.objects.get(
                quiz_id=quiz_id,
                user_id=user_id
            )
            
            if not attempt.is_finished:
                 return None # Or raise error, indicating attempt not finished

            # Ensure score and passed are calculated if somehow missed
            if attempt.score is None or attempt.passed is None:
                 print(f"Warning: Finalizing score for attempt {attempt.id} during result fetch.")
                 attempt.score = QuizService._calculate_final_score(attempt)
                 attempt.passed = attempt.score >= attempt.quiz.passing_score
                 attempt.completed_at = attempt.completed_at or timezone.now() # Ensure completed_at is set
                 attempt.save()

            return {
                'score': attempt.score,
                'passed': attempt.passed,
                'completed_at': attempt.completed_at.isoformat() if attempt.completed_at else None,
                'total_questions': TARGET_QUIZ_LENGTH, # Use target length for consistency
                'correct_answers': QuizService._count_correct_answers(attempt)
            }
            
        except QuizAttempt.DoesNotExist:
            return None 