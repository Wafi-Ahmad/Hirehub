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
            # Check if user has already attempted this quiz
            existing_attempt = QuizAttempt.objects.filter(
                quiz__job_id=job_id,
                user=request.user
            ).first()

            if existing_attempt:
                return Response({
                    'message': 'You have already taken this quiz',
                    'score': existing_attempt.score
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get the quiz for this job
            job = get_object_or_404(JobPost, id=job_id)
            quiz = get_object_or_404(Quiz, job=job)
            
            # Only return questions without answers
            quiz_data = QuizSerializer(quiz).data
            for question in quiz_data['questions']:
                question.pop('correct_answer', None)
            
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
            if QuizAttempt.objects.filter(quiz=quiz, user=request.user).exists():
                return Response({
                    'message': 'You have already taken this quiz'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create quiz attempt
            answers = request.data.get('answers', [])
            
            # Calculate score
            total_questions = len(quiz.questions)
            correct_answers = 0
            
            for i, question in enumerate(quiz.questions):
                if i < len(answers) and answers[i] == question['correct_answer']:
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
                'passed': score >= quiz.passing_score
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
                applicants_data.append({
                    'id': applicant.id,
                    'full_name': f"{applicant.first_name} {applicant.last_name}".strip() or applicant.email,
                    'email': applicant.email,
                    'quiz_score': attempt.score,
                    'match_score': JobMatchingService.calculate_match_score(job, applicant),
                    'cv_url': applicant.cv.url if hasattr(applicant, 'cv') and applicant.cv else None,
                    'profile_picture': applicant.profile_picture.url if hasattr(applicant, 'profile_picture') and applicant.profile_picture else None,
                    'applied_at': attempt.started_at
                })
            
            return Response(applicants_data)
            
        except Exception as e:
            return Response({
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)