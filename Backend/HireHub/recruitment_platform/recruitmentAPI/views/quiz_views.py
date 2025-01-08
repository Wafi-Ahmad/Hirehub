from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

from ..models.job_model import JobPost
from ..models.quiz_model import Quiz, QuizAttempt
from ..serializers.quiz_serializers import QuizSerializer, QuizAttemptSerializer
from ..permissions import IsNormalUser, IsCompanyUser
from ..services.job_matching_service import JobMatchingService

class QuizView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        try:
            # Get the quiz
            job = get_object_or_404(JobPost, id=job_id)
            quiz = get_object_or_404(Quiz, job=job)

            # Check if user has already attempted this quiz
            existing_attempt = QuizAttempt.objects.filter(
                quiz=quiz,
                user=request.user
            ).first()

            if existing_attempt:
                return Response({
                    'message': 'You have already taken this quiz',
                    'score': existing_attempt.score,
                    'passed': existing_attempt.score >= quiz.passing_score,
                    'correct_count': sum(1 for a, q in zip(existing_attempt.answers.values(), quiz.questions['questions']) 
                                      if str(a) == str(q['correctAnswer'])),
                    'total_questions': len(quiz.questions['questions'])
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Serialize the quiz data
            quiz_data = QuizSerializer(quiz).data
            
            # Remove correct answers from questions
            if 'questions' in quiz_data and isinstance(quiz_data['questions'], list):
                for question in quiz_data['questions']:
                    if isinstance(question, dict) and 'correct_answer' in question:
                        del question['correct_answer']
            
            return Response(quiz_data)
            
        except Exception as e:
            return Response({
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class QuizSubmissionView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def post(self, request, job_id):
        try:
            # Get the quiz
            job = get_object_or_404(JobPost, id=job_id)
            quiz = get_object_or_404(Quiz, job=job)

            # Check if user has already attempted this quiz
            existing_attempt = QuizAttempt.objects.filter(quiz=quiz, user=request.user).first()
            if existing_attempt:
                return Response({
                    'message': 'You have already taken this quiz',
                    'score': existing_attempt.score,
                    'correct_count': sum(1 for a, q in zip(existing_attempt.answers.values(), quiz.questions['questions']) 
                                      if str(a) == str(q['correctAnswer'])),
                    'total_questions': len(quiz.questions['questions'])
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get answers from request
            answers = request.data.get('answers', {})
            if not answers:
                return Response({
                    'message': 'No answers provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Calculate score
            total_questions = len(quiz.questions['questions'])
            correct_answers = 0
            
            for question in quiz.questions['questions']:
                question_id = str(question['id'])
                if question_id in answers and str(answers[question_id]) == str(question['correctAnswer']):
                    correct_answers += 1
            
            score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
            
            # Save attempt
            attempt = QuizAttempt.objects.create(
                quiz=quiz,
                user=request.user,
                answers=answers,
                score=score
            )
            
            return Response({
                'message': 'Quiz submitted successfully',
                'score': score,
                'correct_count': correct_answers,
                'total_questions': total_questions
            })
            
        except Exception as e:
            return Response({
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class QuizResultView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = get_object_or_404(JobPost, id=job_id)
            quiz = get_object_or_404(Quiz, job=job)
            attempt = get_object_or_404(QuizAttempt, quiz=quiz, user=request.user)
            
            return Response({
                'score': attempt.score,
                'passed': attempt.score >= quiz.passing_score,
                'passing_score': quiz.passing_score
            })
            
        except Quiz.DoesNotExist:
            return Response({
                'message': 'Quiz not found for this job'
            }, status=status.HTTP_404_NOT_FOUND)
        except QuizAttempt.DoesNotExist:
            return Response({
                'message': 'You have not attempted this quiz yet'
            }, status=status.HTTP_404_NOT_FOUND)

class JobApplicantsView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyUser]

    def get(self, request, job_id):
        try:
            job = get_object_or_404(JobPost, pk=job_id)
            
            # Get applicants for this job through quiz attempts
            quiz_attempts = QuizAttempt.objects.filter(quiz__job=job).select_related('user')
            
            applicants_data = []
            for attempt in quiz_attempts:
                applicant = attempt.user
                # Get the full URL for profile picture and CV
                profile_picture_url = request.build_absolute_uri(applicant.profile_picture.url) if applicant.profile_picture else None
                cv_url = request.build_absolute_uri(applicant.cv_file.url) if applicant.cv_file else None
                
                applicants_data.append({
                    'id': applicant.id,
                    'full_name': f"{applicant.first_name} {applicant.last_name}".strip() or applicant.email,
                    'email': applicant.email,
                    'quiz_score': attempt.score,
                    'match_score': JobMatchingService.calculate_match_score(job, applicant),
                    'cv_url': cv_url,
                    'profile_picture': profile_picture_url,
                    'applied_at': applicant.cv_upload_date or attempt.started_at  # Use CV upload date if available, otherwise quiz start date
                })
            
            return Response(applicants_data)
            
        except Exception as e:
            return Response({
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)