import json
import random
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db import transaction
from ..models import Quiz, QuizAttempt, JobPost
import requests

class QuizService:
    @staticmethod
    def generate_quiz(job_id: int) -> Quiz:
        """
        Generate a quiz for a job using the local LLM.
        """
        try:
            job = JobPost.objects.get(id=job_id)
            
            # Prepare the prompt for LLM
            prompt = {
                "model": "llama-3.2-3b-instruct",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are an expert at creating job-specific quiz questions. "
                            f"Create questions appropriate for {job.experience_level} level candidates. "
                            "For entry-level positions, focus on basic concepts and fundamental skills. "
                            "For mid-level positions, include practical scenarios and problem-solving. "
                            "For senior positions, focus on strategic thinking and complex scenarios."
                        )
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Create 10 multiple choice questions for a {job.title} position.\n\n"
                            f"Job Description: {job.description}\n"
                            f"Required Skills: {job.required_skills}\n"
                            f"Experience Level: {job.experience_level}\n\n"
                            "Requirements:\n"
                            "1. Each answer must be a complete phrase\n"
                            "2. Make answers specific and job-related\n"
                            "3. Avoid any single-letter or number-only answers\n"
                            "4. No cross-references between answers\n"
                            "5. Difficulty level must match the experience level:\n"
                            "   - Entry Level: Basic concepts and fundamentals\n"
                            "   - Mid Level: Practical scenarios and problem-solving\n"
                            "   - Senior Level: Strategic decisions and complex situations\n\n"
                            "Format the response as a JSON object with this structure:\n"
                            "{\n"
                            "  \"questions\": [\n"
                            "    {\n"
                            "      \"id\": 1,\n"
                            "      \"question\": \"What is the best approach for [scenario]?\",\n"
                            "      \"answers\": [\n"
                            "        \"[Correct answer as a complete phrase]\",\n"
                            "        \"[Wrong answer 1 as a complete phrase]\",\n"
                            "        \"[Wrong answer 2 as a complete phrase]\",\n"
                            "        \"[Wrong answer 3 as a complete phrase]\"\n"
                            "      ]\n"
                            "    }\n"
                            "  ]\n"
                            "}\n\n"
                            "Example difficulty levels:\n"
                            "Entry Level: 'What is the first step when greeting a customer?'\n"
                            "Mid Level: 'How would you handle a customer who is comparing prices with competitors?'\n"
                            "Senior Level: 'What strategy would you implement to improve team performance during low seasons?'\n"
                        )
                    }
                ],
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "quiz_questions",
                        "strict": "true",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "questions": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "id": {"type": "integer"},
                                            "question": {"type": "string"},
                                            "answers": {
                                                "type": "array",
                                                "items": {"type": "string"},
                                                "minItems": 4,
                                                "maxItems": 4
                                            }
                                        },
                                        "required": ["id", "question", "answers"]
                                    },
                                    "minItems": 10,
                                    "maxItems": 10
                                }
                            },
                            "required": ["questions"]
                        }
                    }
                },
                "temperature": 0.7,
                "max_tokens": 2000,
                "stream": False
            }

            # Call local LLM with increased timeout
            try:
                response = requests.post(
                    "http://localhost:1234/v1/chat/completions",
                    json=prompt,
                    timeout=180
                )
                
                if response.status_code != 200:
                    print(f"LLM Error: {response.text}")
                    raise ValidationError("Failed to generate quiz questions")

                result = response.json()
                if 'choices' not in result or not result['choices']:
                    raise ValidationError("Invalid response from LLM")

                content = result['choices'][0]['message']['content']
                
                # Check if response is complete
                if content.strip().endswith('}'):
                    questions_data = json.loads(content)
                else:
                    raise ValidationError("Received incomplete response from LLM")
                
                # Validate questions
                if ('questions' not in questions_data or 
                    not questions_data['questions'] or 
                    len(questions_data['questions']) != 10):
                    raise ValidationError("Invalid or incomplete questions from LLM")

                # Process questions
                questions = questions_data['questions']
                for i, q in enumerate(questions):
                    # Validate answer format
                    for answer in q['answers']:
                        if len(answer.split()) < 3 or answer.strip() in ['A', 'B', 'C', 'D'] or 'same as' in answer.lower():
                            print(f"Invalid answer format detected: {answer}")
                            raise ValidationError(f"Invalid answer format in question {i}")
                    
                    q['correctAnswer'] = 0  # First answer (index 0) is correct
                    q['id'] = i  # Zero-based indexing to match frontend

                # Shuffle questions order only (not the answers)
                random.shuffle(questions)
                questions_data['questions'] = questions

                # Create and save the quiz
                quiz = Quiz.objects.create(
                    job_id=job_id,
                    questions=questions_data,
                    is_active=True
                )
                
                return quiz

            except requests.Timeout:
                print("LLM request timed out")
                raise ValidationError("Quiz generation timed out. Please try again.")
            except requests.RequestException as e:
                print(f"Request Error: {str(e)}")
                raise ValidationError("Failed to connect to LLM service")
            except json.JSONDecodeError as e:
                print(f"JSON Error: {str(e)}")
                raise ValidationError("Invalid response format from LLM")

        except JobPost.DoesNotExist:
            raise ValidationError("Job not found")
        except Exception as e:
            print(f"Unexpected Error: {str(e)}")
            raise ValidationError(f"Failed to generate quiz: {str(e)}")

    @staticmethod
    @transaction.atomic
    def submit_attempt(quiz_id: int, user_id: int, answers: dict) -> dict:
        """
        Submit and grade a quiz attempt.
        """
        try:
            quiz = Quiz.objects.get(id=quiz_id)
            
            # Check if user already attempted this quiz
            if QuizAttempt.objects.filter(quiz=quiz, user_id=user_id).exists():
                attempt = QuizAttempt.objects.get(quiz=quiz, user_id=user_id)
                return {
                    'message': 'You have already attempted this quiz',
                    'result': {
                        'score': attempt.score,
                        'passed': attempt.passed,
                        'completed_at': attempt.completed_at
                    }
                }
            
            # Calculate score
            correct_count = 0
            total_questions = len(quiz.questions['questions'])
            
            for q in quiz.questions['questions']:
                question_id = q['id']
                print("question_id", question_id)
                print("answers", answers)
                print("q['correctAnswer']", q['correctAnswer'])
                print("answers[question_id]", answers.get(str(question_id), None))
                if answers.get(str(question_id), None) == q['correctAnswer']:
                    print("correct")
                    correct_count += 1
            
            score = (correct_count / total_questions) * 100
            passed = score >= quiz.passing_score
            
            # Create attempt record
            attempt = QuizAttempt.objects.create(
                quiz=quiz,
                user_id=user_id,
                answers=answers,
                score=score,
                passed=passed,
                completed_at=timezone.now()
            )
            
            return {
                'score': score,
                'passed': passed,
                'total_questions': total_questions,
                'correct_answers': correct_count
            }
            
        except Quiz.DoesNotExist:
            raise ValidationError("Quiz not found")
        except Exception as e:
            raise ValidationError(f"Failed to submit quiz: {str(e)}")

    @staticmethod
    def get_quiz_result(quiz_id: int, user_id: int) -> dict:
        """
        Get the result of a user's quiz attempt.
        """
        try:
            attempt = QuizAttempt.objects.get(
                quiz_id=quiz_id,
                user_id=user_id
            )
            
            return {
                'score': attempt.score,
                'passed': attempt.passed,
                'completed_at': attempt.completed_at,
                'answers': attempt.answers
            }
            
        except QuizAttempt.DoesNotExist:
            return None 