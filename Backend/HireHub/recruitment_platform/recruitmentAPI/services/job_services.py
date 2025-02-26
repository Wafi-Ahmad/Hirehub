from datetime import datetime, timedelta
from typing import List, Dict, Any
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q, F, Case, When, IntegerField
from django.core.cache import cache
from ..models.job_model import JobPost
from ..models import User
from ..serializers.job_serializers import JobResponseSerializer, CreateJobSerializer
from .quiz_services import QuizService
from ..models.notification_model import Notification
from .job_matching_service import JobMatchingService
import re

class JobService:
    JOBS_PER_PAGE = 10
    CACHE_TTL = 300  # 5 minutes

    @staticmethod
    @transaction.atomic
    def create_job(validated_data: dict, user_id: int) -> dict:
        """Create a new job posting with business logic validation"""
        try:
            user = User.objects.get(id=user_id)
            
            if not user.is_company:
                raise ValidationError("Only company users can create job postings")

            # Process skills
            print(validated_data['required_skills'])
            skills = [skill.strip().lower() for skill in validated_data['required_skills'] if skill.strip()]
            print(skills)
            if not skills:
                raise ValidationError("At least one skill is required")

            job = JobPost(
                title=validated_data['title'],
                description=validated_data['description'],
                required_skills=','.join(skills),
                employment_type=validated_data['employment_type'],
                salary_min=validated_data.get('salary_min'),
                salary_max=validated_data.get('salary_max'),
                location_type=validated_data['location_type'],
                location=validated_data['location'],
                experience_level=validated_data['experience_level'],
                posted_by=user,
                expires_at=timezone.now() + timezone.timedelta(days=30)
            )
            
            job.save()

            # Create notifications for all users
            # Get all users except the company that posted the job
            users = User.objects.exclude(id=user_id).filter(is_active=True)
            
            # Create notifications in bulk
            notifications = [
                Notification(
                    recipient=recipient,
                    sender=user,
                    notification_type='NEW_JOB_POST',
                    content=f'posted a new job: {job.title}',
                    related_object_id=job.id,
                    related_object_type='JobPost'
                )
                for recipient in users
            ]
            
            # Bulk create notifications
            if notifications:
                Notification.objects.bulk_create(notifications)

            # Generate quiz for the job
            try:
                QuizService.generate_quiz(job.id)
            except Exception as e:
                print(f"Failed to generate quiz: {str(e)}")
                # Don't fail job creation if quiz generation fails
                # We can regenerate it later if needed

            # Invalidate job list cache
            cache.delete_many([
                'jobs:list:recent',
                f'jobs:company:{user.id}:list'
            ])
            
            res = JobResponseSerializer(job).data
            return res

        except User.DoesNotExist:
            raise ValidationError("Invalid user")

    @staticmethod
    def search_jobs(filters: Dict, cursor=None, limit=JOBS_PER_PAGE, user=None) -> Dict:
        """Search for jobs with filters and cursor-based pagination."""
        try:
            print("\n=== Job Search Debug ===")
            print(f"User: {user.email if user else 'No user'}")
            print(f"User Type: {user.user_type if user else 'No type'}")
            print(f"Filters: {filters}")

            query = Q(status='ACTIVE', is_active=True, expires_at__gt=timezone.now())

            if user and user.user_type == 'Company':
                query &= Q(posted_by=user)
                print(f"Filtering jobs for company user: {user.id}")
                
            jobs = JobPost.objects.filter(query).select_related('posted_by').order_by('-created_at')

            # Filter by followed companies if specified
            if user and user.user_type == 'Normal' and filters.get('followed_only'):
                print("Filtering by followed companies")
                following_ids = user.following.values_list('id', flat=True)
                jobs = jobs.filter(posted_by__in=following_ids)
                print(f"Following IDs: {following_ids}")

            # Calculate recommendations if user is provided and is normal type
            recommendations = {}
            if user and user.user_type == 'Normal':
                print(f"\nCalculating recommendations for user: {user.email}")
                print(f"User Skills: {user.skills}")
                print(f"User Experience: {user.experience}")
                
                # Process each job individually for recommendations
                for job in jobs:
                    try:
                        # Calculate match score
                        score = JobMatchingService.calculate_match_score(job, user)
                        print(f"\nJob {job.id} - {job.title}")
                        print(f"Calculated Score: {score}")
                        
                        # Add to recommendations if meets threshold
                        if score >= JobMatchingService.SCORE_THRESHOLD:
                            recommendations[job.id] = score / 100
                            print(f"Added to recommendations with score: {score}")
                        else:
                            print(f"Not recommended (below threshold of {JobMatchingService.SCORE_THRESHOLD})")
                    except Exception as e:
                        print(f"Error processing job {job.id}: {str(e)}")
                        continue
                
                print(f"\nFinal recommendations: {recommendations}")

            # Apply cursor pagination
            if cursor:
                jobs = jobs.filter(created_at__lt=cursor)

            jobs = jobs[:limit + 1]
            jobs_list = list(jobs)
            has_next = len(jobs_list) > limit
            result_jobs = jobs_list[:limit]

            next_cursor = None
            if has_next and result_jobs:
                next_cursor = result_jobs[-1].created_at.isoformat()

            # Add recommendation scores to job data
            serialized_jobs = JobResponseSerializer(result_jobs, many=True).data
            for job_data in serialized_jobs:
                is_recommended = job_data['id'] in recommendations
                job_data['is_recommended'] = is_recommended
                if is_recommended:
                    job_data['match_score'] = recommendations[job_data['id']]
                print(f"\nJob {job_data['id']} - {job_data['title']}")
                print(f"Is Recommended: {job_data['is_recommended']}")
                print(f"Match Score: {job_data.get('match_score', 'No score')}")

            print("\n=== End Job Search Debug ===")
            return {
                'jobs': serialized_jobs,
                'next_cursor': next_cursor
            }

        except Exception as e:
            print(f"Error in search_jobs: {str(e)}")
            return {
                'jobs': [],
                'next_cursor': None
            }

    @staticmethod
    def calculate_job_recommendations(jobs, user) -> Dict[int, float]:
        """Calculate recommendation scores for jobs based on user profile."""
        try:
            print("\n=== Calculating Recommendations ===")
            recommendations = {}
            
            if not user.skills:
                print("No user skills found")
                return recommendations

            # Use JobMatchingService for consistent skill normalization
            from .job_matching_service import JobMatchingService
            
            for job in jobs:
                print(f"\nProcessing job {job.id} - {job.title}")
                # Calculate match score using JobMatchingService
                score = JobMatchingService.calculate_match_score(job, user)
                print(f"Score calculated: {score}")
                
                # Only include jobs that meet the threshold
                if score >= JobMatchingService.SCORE_THRESHOLD:
                    recommendations[job.id] = score / 100  # Convert to 0-1 scale
                    print(f"Job {job.id} recommended with score {score}")
                else:
                    print(f"Job {job.id} not recommended (score below threshold)")
            
            print(f"\nFinal recommendations: {recommendations}")
            print("=== End Calculating Recommendations ===\n")
            return recommendations
            
        except Exception as e:
            print(f"Error calculating recommendations: {str(e)}")
            return {}

    @staticmethod
    def get_job_by_id(job_id: int) -> dict:
        """Get a single job by ID"""
        cache_key = f'job:detail:{job_id}'
        cached_job = cache.get(cache_key)
        
        if cached_job:
            return cached_job

        try:
            job = JobPost.objects.select_related('posted_by').get(id=job_id)
            job_data = JobResponseSerializer(job).data
            cache.set(cache_key, job_data, JobService.CACHE_TTL)
            return job_data
        except JobPost.DoesNotExist:
            raise ValidationError("Job not found")

    @staticmethod
    def save_job(user_id: int, job_id: int) -> bool:
        """Save a job for later reference"""
        try:
            job = JobPost.objects.get(id=job_id, status='ACTIVE', is_active=True)
            user = User.objects.get(id=user_id)
            
            # Add to saved jobs with expiration
            user.saved_jobs.add(
                job,
                through_defaults={'saved_at': timezone.now(), 'expires_at': timezone.now() + timezone.timedelta(days=30)}
            )

            # Invalidate relevant caches
            cache.delete_many([
                f'job:detail:{job_id}',
                f'jobs:saved:{user_id}'
            ])

            return True
        except (JobPost.DoesNotExist, User.DoesNotExist):
            return False

    @staticmethod
    def provide_recommendation_feedback(user_id: int, job_id: int, is_positive: bool) -> bool:
        """Handle job recommendation feedback"""
        try:
            job = JobPost.objects.get(id=job_id)
            
            if is_positive:
                job.positive_feedback_count = F('positive_feedback_count') + 1
            else:
                job.negative_feedback_count = F('negative_feedback_count') + 1
            
            job.save(update_fields=['positive_feedback_count', 'negative_feedback_count'])
            
            # Invalidate job cache
            cache.delete(f'job:detail:{job_id}')
            
            return True
        except JobPost.DoesNotExist:
            return False

    @staticmethod
    def expire_jobs() -> int:
        """Automatically expire jobs"""
        now = timezone.now()
        expired_count = JobPost.objects.filter(
            Q(expires_at__lte=now) | Q(status='FILLED'),
            is_active=True
        ).update(
            is_active=False,
            status='EXPIRED'
        )

        if expired_count > 0:
            # Invalidate job list cache if any jobs were expired
            cache.delete('jobs:list:recent')

        return expired_count

    @staticmethod
    def get_job_applicants(job_id: int) -> List[Dict[str, Any]]:
        """Get all applicants for a specific job with their quiz results"""
        try:
            # Get job with posted_by user details
            job = JobPost.objects.select_related('posted_by').get(id=job_id)
            if not job.quiz:
                return []
                
            # Get all quiz attempts for this job with user details
            quiz_attempts = job.quiz.attempts.select_related('user').all()
            
            applicants_data = []
            for attempt in quiz_attempts:
                user = attempt.user
                # Only include users who are normal users (job seekers)
                if user.user_type == user.NORMAL_USER:
                    applicant_data = {
                        'id': user.id,
                        'full_name': f"{user.first_name} {user.last_name}".strip() or user.email,
                        'email': user.email,
                        'profile_picture': user.profile_picture.url if hasattr(user, 'profile_picture') and user.profile_picture else None,
                        'cv_url': user.cv_file.url if hasattr(user, 'cv_file') and user.cv_file else None,
                        'quiz_score': attempt.score,
                        'match_score': attempt.ai_matching_score if hasattr(attempt, 'ai_matching_score') else 0,
                        'applied_date': attempt.completed_at.isoformat() if attempt.completed_at else None
                    }
                    applicants_data.append(applicant_data)
            
            return applicants_data
            
        except JobPost.DoesNotExist:
            raise ValidationError("Job not found")

    @staticmethod
    def get_recommended_jobs(user, limit=10):
        """Get recommended jobs for a user based on their profile"""
        try:
            # Get all active jobs
            jobs = JobPost.objects.filter(status='ACTIVE')
            
            # Calculate match scores for each job
            job_scores = []
            for job in jobs:
                score = JobMatchingService.calculate_match_score(job, user)
                if score >= 70:  # Only include jobs with a score of 70 or higher
                    job_scores.append((job, score))
            
            # Sort by score and get top recommendations
            job_scores.sort(key=lambda x: x[1], reverse=True)
            recommended_jobs = [job for job, _ in job_scores[:limit]]
            
            return recommended_jobs
        except Exception as e:
            print(f"Error getting recommended jobs: {str(e)}")
            return []