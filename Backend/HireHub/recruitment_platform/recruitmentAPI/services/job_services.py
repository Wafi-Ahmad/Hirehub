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
            print(f"Filters received: {filters}")
            
            # Base query for active jobs
            query = Q(status='active', is_active=True, expires_at__gt=timezone.now())

            # Company-specific filtering
            if user and user.user_type == 'Company':
                query &= Q(posted_by=user)
                print(f"Filtering for company: {user.id}")

            # Title search
            if title := filters.get('title'):
                title = title.strip()
                if title:
                    print(f"Applying title filter: {title}")
                    # Split search terms for better matching
                    title_terms = [term.strip() for term in title.split() if term.strip()]
                    title_query = Q()
                    for term in title_terms:
                        title_query |= Q(title__icontains=term) | Q(description__icontains=term)
                    query &= title_query

            # Skills filter
            if skills := filters.get('skills'):
                if isinstance(skills, str):
                    skills = [skill.strip().lower() for skill in skills.split(',') if skill.strip()]
                elif isinstance(skills, list):
                    skills = [skill.strip().lower() for skill in skills if skill.strip()]
                
                if skills:
                    print(f"Applying skills filter: {skills}")
                    skills_query = Q()
                    for skill in skills:
                        # Use regex to match whole words or words at boundaries
                        # This prevents partial matching like "java" matching "javascript"
                        pattern = r'(^|[,\s])' + re.escape(skill) + r'($|[,\s])'
                        skills_query |= Q(required_skills__iregex=pattern)
                    query &= skills_query

            # Location filter
            if location := filters.get('location'):
                location = location.strip()
                if location:
                    print(f"Applying location filter: {location}")
                    # Split location terms for better matching
                    location_terms = [term.strip() for term in location.split() if term.strip()]
                    location_query = Q()
                    for term in location_terms:
                        location_query |= Q(location__icontains=term)
                    query &= location_query

            # Exact match filters
            for field in ['employment_type', 'location_type', 'experience_level']:
                if value := filters.get(field):
                    value = value.strip()
                    if value:
                        print(f"Applying {field} filter: {value}")
                        query &= Q(**{field: value})

            # Salary range filter
            if min_salary := filters.get('min_salary'):
                try:
                    min_salary = float(min_salary)
                    print(f"Applying min salary filter: {min_salary}")
                    query &= Q(salary_max__gte=min_salary)
                except (ValueError, TypeError):
                    pass

            if max_salary := filters.get('max_salary'):
                try:
                    max_salary = float(max_salary)
                    print(f"Applying max salary filter: {max_salary}")
                    query &= Q(salary_min__lte=max_salary)
                except (ValueError, TypeError):
                    pass

            # Filter by followed companies if specified
            if user and user.user_type == 'Normal' and filters.get('followed_only'):
                # Check if followed_only is explicitly set to "true" (string)
                followed_only = str(filters.get('followed_only')).lower()
                if followed_only == 'true':
                    print("Filtering by followed companies")
                    following_ids = user.following.values_list('id', flat=True)
                    query &= Q(posted_by__in=following_ids)
                else:
                    print("Not filtering by followed companies")

            # Execute query
            jobs = JobPost.objects.filter(query).select_related('posted_by').order_by('-created_at')
            print(f"SQL Query: {jobs.query}")

            # Calculate recommendations if user is normal type
            recommendations = {}
            if user and user.user_type == 'Normal':
                recommendations = JobService.calculate_job_recommendations(jobs, user)

            # Apply cursor pagination
            if cursor:
                try:
                    cursor_date = datetime.fromisoformat(cursor.replace('Z', '+00:00'))
                    jobs = jobs.filter(created_at__lt=cursor_date)
                except (ValueError, TypeError):
                    pass

            # Get paginated results
            jobs = jobs[:limit + 1]
            jobs_list = list(jobs)
            has_next = len(jobs_list) > limit
            result_jobs = jobs_list[:limit]

            # Prepare next cursor
            next_cursor = None
            if has_next and result_jobs:
                next_cursor = result_jobs[-1].created_at.isoformat()

            # Serialize results
            serialized_jobs = JobResponseSerializer(result_jobs, many=True).data
            
            # Add recommendation scores
            for job_data in serialized_jobs:
                job_data['is_recommended'] = job_data['id'] in recommendations
                if job_data['is_recommended']:
                    job_data['match_score'] = recommendations[job_data['id']]

            print(f"Found {len(result_jobs)} jobs")
            print("=== End Job Search Debug ===\n")

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