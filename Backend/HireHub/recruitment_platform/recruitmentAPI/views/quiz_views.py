from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from drf_spectacular.utils import extend_schema

from ..models.job_model import JobPost
from ..models.quiz_model import Quiz, QuizAttempt
from ..models.user_model import User
from ..serializers.quiz_serializers import (
    QuizMetadataSerializer,
    QuizAttemptSerializer,
    QuizStepResponseSerializer,
    QuizAnswerSubmissionSerializer,
    QuizResultSerializer
)
from ..permissions import IsNormalUser, IsCompanyUser
from ..services.job_matching_service import JobMatchingService
from ..services.quiz_services import QuizService

class QuizStartView(APIView):
    """
    Starts or resumes a quiz attempt for the current user and returns the first/
    next question or final results if already completed.
    """
    permission_classes = [IsAuthenticated, IsNormalUser]

    @extend_schema(
        summary="Start or Resume Quiz",
        description="Initiates a quiz attempt for the specified job. If an incomplete attempt exists, it resumes it. If completed, shows a message.",
        responses={
            200: QuizStepResponseSerializer,
            400: {'description': 'Validation Error (e.g., Quiz not found, already completed)'},
            404: {'description': 'Job not found'}
        }
    )
    def post(self, request, job_id):
        try:
            result_data = QuizService.start_quiz_attempt(user_id=request.user.id, job_id=job_id)
            
            # Use the appropriate serializer based on the status
            serializer = QuizStepResponseSerializer(result_data)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except (JobPost.DoesNotExist, Quiz.DoesNotExist):
             return Response({'message': 'Active quiz not found for this job'}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error in QuizStartView: {str(e)}") # Log unexpected errors
            return Response({'message': 'An unexpected error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdaptiveQuizStepView(APIView):
    """
    Processes a user's answer to the previous question and returns the next 
    question or the final quiz results.
    """
    permission_classes = [IsAuthenticated, IsNormalUser]

    @extend_schema(
        summary="Submit Quiz Answer and Get Next Step",
        request=QuizAnswerSubmissionSerializer,
        responses={
            200: QuizStepResponseSerializer,
            400: {'description': 'Validation Error (e.g., Invalid input, question mismatch, already answered)'},
            404: {'description': 'Job or Quiz Attempt not found'}
        }
    )
    def post(self, request, job_id):
        serializer = QuizAnswerSubmissionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            result_data = QuizService.process_quiz_step(
                user_id=request.user.id,
                job_id=job_id,
                answer_data=serializer.validated_data
            )
            
            response_serializer = QuizStepResponseSerializer(result_data)
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        except QuizAttempt.DoesNotExist:
             return Response({'message': 'Active quiz attempt not found. Please start the quiz first.'}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error in AdaptiveQuizStepView: {str(e)}") # Log unexpected errors
            return Response({'message': 'An unexpected error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class QuizResultView(APIView):
    """
    Retrieves the result of a *completed* quiz attempt for the current user.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get Completed Quiz Result",
        description="Fetches the final score and status for a completed quiz attempt.",
        responses={
            200: QuizResultSerializer,
            404: {'description': 'Quiz or completed attempt not found'}
        }
    )
    def get(self, request, job_id):
        try:
            # Ensure the job and quiz exist first
            job = get_object_or_404(JobPost, id=job_id)
            quiz = get_object_or_404(Quiz, job=job)
            
            # Use the service method to get the result
            result_data = QuizService.get_quiz_result(quiz_id=quiz.id, user_id=request.user.id)
            
            if result_data is None:
                 # This covers both attempt not existing and attempt not finished
                 return Response({'message': 'Completed quiz attempt not found.'}, status=status.HTTP_404_NOT_FOUND)

            # Serialize the result data
            # We need the attempt object to pass to the serializer for context if needed
            # Let's refetch the completed attempt to serialize it
            attempt = get_object_or_404(QuizAttempt, quiz=quiz, user=request.user, completed_at__isnull=False)
            serializer = QuizResultSerializer(attempt)
            return Response(serializer.data)
            
        except JobPost.DoesNotExist:
            return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
        except Quiz.DoesNotExist:
            return Response({'message': 'Quiz not found for this job'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error in QuizResultView: {str(e)}") # Log unexpected errors
            return Response({'message': 'An unexpected error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class JobApplicantsView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyUser]

    def get(self, request, job_id):
        try:
            job = get_object_or_404(JobPost, pk=job_id)
            
            # Ensure the job has an associated quiz
            if not hasattr(job, 'job_quiz') or not job.job_quiz:
                return Response({'message': 'No quiz associated with this job.'}, status=status.HTTP_404_NOT_FOUND)

            quiz = job.job_quiz
            
            # Get attempts for this quiz, ensuring they are completed
            # Filter by passing score if required (adjust logic as needed)
            # For now, let's fetch all *completed* attempts and include score/pass status
            quiz_attempts = QuizAttempt.objects.filter(
                quiz=quiz,
                completed_at__isnull=False # Only fetch completed attempts
            ).select_related('user') # Preload user data
            
            applicants_data = []
            for attempt in quiz_attempts:
                applicant = attempt.user
                
                # Skip if user is not a normal user (shouldn't happen often but good practice)
                if applicant.user_type != User.NORMAL_USER:
                    continue
                    
                # Get the full URL for profile picture and CV
                profile_picture_url = request.build_absolute_uri(applicant.profile_picture.url) if applicant.profile_picture else None
                cv_url = request.build_absolute_uri(applicant.cv_file.url) if applicant.cv_file else None
                
                applicants_data.append({
                    'id': applicant.id,
                    'full_name': f"{applicant.first_name} {applicant.last_name}".strip() or applicant.email,
                    'email': applicant.email,
                    'quiz_score': attempt.score, # Use the stored score from the completed attempt
                    'quiz_passed': attempt.passed, # Use the stored passed status
                    'match_score': JobMatchingService.calculate_match_score(job, applicant), # Keep existing match score logic
                    'cv_url': cv_url,
                    'profile_picture': profile_picture_url,
                    'applied_at': attempt.completed_at.isoformat() if attempt.completed_at else attempt.started_at.isoformat()
                })
            
            # Optionally sort applicants, e.g., by score or match_score
            applicants_data.sort(key=lambda x: (x.get('quiz_passed', False) is not True, -x.get('quiz_score', 0), -x.get('match_score', 0)))
            
            return Response(applicants_data)
            
        except JobPost.DoesNotExist:
             return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error in JobApplicantsView: {str(e)}") # Log unexpected errors
            return Response({'message': 'An unexpected error occurred fetching applicants'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)