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
    def search_jobs(filters: Dict, cursor=None, limit=JOBS_PER_PAGE) -> Dict:
        """
        Search for jobs with filters and cursor-based pagination.
        """
        try:
            query = Q(status='ACTIVE', is_active=True, expires_at__gt=timezone.now())

            # Skills filter
            if skills := filters.get('skills'):
                if isinstance(skills, str):
                    # If single skill is passed
                    skill = skills.strip().lower()
                    if skill:
                        # Simple contains match for now
                        query &= Q(required_skills__icontains=skill)
                        print(f"Skills filter applied: {skill}")  # Debug log
                elif isinstance(skills, list):
                    # If multiple skills are passed
                    skills_query = Q()
                    for skill in skills:
                        if skill := skill.strip().lower():
                            skills_query &= Q(required_skills__icontains=skill)
                    if skills_query:
                        query &= skills_query
                        print(f"Skills filter applied: {skills}")  # Debug log

            # Title filter
            if title := filters.get('title'):
                search_term = title.strip().lower()
                if search_term:
                    title_query = (
                        Q(title__icontains=search_term) |
                        Q(description__icontains=search_term)
                    )
                    query &= title_query

            # Location filter
            if location := filters.get('location'):
                query &= Q(location__icontains=location.strip())

            # Other filters
            for field in ['employment_type', 'location_type', 'experience_level']:
                if value := filters.get(field):
                    query &= Q(**{field: value})

            # Salary range filter
            if min_salary := filters.get('min_salary'):
                query &= Q(salary_max__gte=min_salary)
            if max_salary := filters.get('max_salary'):
                query &= Q(salary_min__lte=max_salary)

            # Get jobs with pagination
            jobs = JobPost.objects.filter(query).select_related('posted_by').order_by('-created_at')

            # Apply cursor pagination
            if cursor:
                jobs = jobs.filter(created_at__lt=cursor)

            # Get limit+1 for pagination
            jobs = jobs[:limit + 1]
            jobs_list = list(jobs)
            has_next = len(jobs_list) > limit
            result_jobs = jobs_list[:limit]

            next_cursor = None
            if has_next and result_jobs:
                next_cursor = result_jobs[-1].created_at.isoformat()

            return {
                'jobs': JobResponseSerializer(result_jobs, many=True).data,
                'next_cursor': next_cursor
            }

        except Exception as e:
            print(f"Error in search_jobs: {str(e)}")
            return {
                'jobs': [],
                'next_cursor': None
            }

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