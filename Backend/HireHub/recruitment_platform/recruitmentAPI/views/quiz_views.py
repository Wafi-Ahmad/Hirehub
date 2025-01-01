from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from ..services.quiz_services import QuizService
from ..models import Quiz, JobPost
from ..permissions import IsNormalUser

class QuizView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def get(self, request, job_id):
        """
        Get quiz for a specific job.
        If quiz doesn't exist, returns 404.
        """
        try:
            quiz = Quiz.objects.get(job_id=job_id, is_active=True)
            
            # Check if user has already attempted this quiz
            previous_attempt = quiz.attempts.filter(user=request.user).first()
            if previous_attempt:
                return Response({
                    'message': 'You have already attempted this quiz',
                    'result': {
                        'score': previous_attempt.score,
                        'passed': previous_attempt.passed,
                        'completed_at': previous_attempt.completed_at
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Return quiz questions without correct answers
            questions = quiz.questions['questions']
            for q in questions:
                q.pop('correctAnswer', None)
            
            return Response({
                'quiz_id': quiz.id,
                'questions': questions,
                'passing_score': quiz.passing_score
            })
            
        except Quiz.DoesNotExist:
            return Response(
                {'error': 'Quiz not found for this job'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class QuizSubmissionView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def post(self, request, quiz_id):
        """
        Submit answers for a quiz attempt.
        """
        try:
            answers = request.data.get('answers')
            if not answers:
                return Response(
                    {'error': 'No answers provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = QuizService.submit_attempt(
                quiz_id=quiz_id,
                user_id=request.user.id,
                answers=answers
            )
            
            return Response(result)
            
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class QuizResultView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def get(self, request, quiz_id):
        """
        Get the result of a user's quiz attempt.
        """
        try:
            result = QuizService.get_quiz_result(
                quiz_id=quiz_id,
                user_id=request.user.id
            )
            
            if not result:
                return Response(
                    {'error': 'No attempt found for this quiz'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response(result)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 