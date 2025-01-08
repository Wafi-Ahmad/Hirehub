from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import F
from ..models import QuizAttempt, JobPost, User
from ..permissions import IsCompanyUser
from ..services.recommendation_service import RecommendationService

class JobApplicantsView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyUser]

    def get(self, request, job_id):
        """
        Get all applicants for a specific job with their quiz scores and match scores
        """
        try:
            # Verify the job belongs to the company
            job = JobPost.objects.get(
                id=job_id,
                posted_by=request.user
            )

            # Get all successful quiz attempts for this job with user details
            quiz_attempts = QuizAttempt.objects.filter(
                quiz__job=job
            ).select_related('user').order_by('-score')

            # Initialize recommendation service
            recommendation_service = RecommendationService()

            # Prepare response data
            applicants_data = []
            for attempt in quiz_attempts:
                user = attempt.user
                # Only include normal users
                if user.user_type == User.NORMAL_USER:
                    # Calculate match score using embeddings if available
                    try:
                        match_score = recommendation_service.calculate_job_candidate_match(
                            job_id=job.id,
                            candidate_id=user.id
                        )
                    except Exception:
                        match_score = 0

                    applicants_data.append({
                        'id': attempt.id,
                        'user_id': user.id,
                        'full_name': f"{user.first_name} {user.last_name}".strip() or user.email,
                        'email': user.email,
                        'profile_picture': user.profile_picture.url if hasattr(user, 'profile_picture') and user.profile_picture else None,
                        'cv_url': user.cv_file.url if hasattr(user, 'cv_file') and user.cv_file else None,
                        'quiz_score': attempt.score,
                        'match_score': match_score,
                        'applied_date': attempt.completed_at.isoformat() if attempt.completed_at else None
                    })

            return Response(applicants_data)

        except JobPost.DoesNotExist:
            return Response(
                {"error": "Job not found or you don't have permission to view its applicants"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
