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

            # Invalidate job list cache
            cache.delete_many([
                'jobs:list:recent',
                f'jobs:company:{user.id}:list'
            ])
            print(job.required_skills)
            res =  JobResponseSerializer(job).data
            print(res.get('required_skills'))
            return res
            

        except User.DoesNotExist:
            raise ValidationError("Invalid user")

    @staticmethod
    def search_jobs(filters: Dict, cursor=None, limit=JOBS_PER_PAGE) -> Dict:
        """
        Search for jobs with filters and cursor-based pagination.
        """
        query = Q(status='ACTIVE', is_active=True, expires_at__gt=timezone.now())

        # Apply filters
        if title := filters.get('title'):
            # Clean and normalize the search term
            search_term = title.strip().lower()
            if search_term:
                # Split search terms and create OR conditions for each word
                search_words = search_term.split()
                title_query = Q()
                
                # First try exact matches
                title_query |= Q(title__iexact=search_term)
                
                # Then try contains for the full phrase
                title_query |= Q(title__icontains=search_term)
                
                # Then try individual word matches (including single characters)
                for word in search_words:
                    title_query |= (
                        Q(title__icontains=word) |
                        Q(description__icontains=word) |
                        Q(required_skills__icontains=word)
                    )
                
                query &= title_query

        # Location filter
        if location := filters.get('location'):
            location = location.strip().lower()
            if location:
                query &= Q(location__icontains=location)

        # Employment type filter
        if employment_type := filters.get('employment_type'):
            query &= Q(employment_type=employment_type)

        # Location type filter
        if location_type := filters.get('location_type'):
            query &= Q(location_type=location_type)

        # Experience level filter
        if experience_level := filters.get('experience_level'):
            query &= Q(experience_level=experience_level)

        # Salary range filter
        if min_salary := filters.get('min_salary'):
            query &= Q(salary_max__gte=min_salary)
        
        if max_salary := filters.get('max_salary'):
            query &= Q(salary_min__lte=max_salary)

        # Skills filter
        if skills := filters.get('skills'):
            print("Received skills:", skills)  # Debug log
            skills_query = Q()
            for skill in skills:
                if skill := skill.strip():
                    # Create exact match pattern for comma-separated list
                    pattern = fr'(^|,\s*){re.escape(skill)}(\s*,|$)'
                    skills_query &= Q(required_skills__iregex=pattern)
            if skills_query:
                print("Skills query:", skills_query)  # Debug log
                query &= skills_query
        

        try:
            # Add relevance ordering for title searches
            if title and title.strip():
                jobs = (
                    JobPost.objects.filter(query)
                    .select_related('posted_by')
                    .annotate(
                        title_relevance=Case(
                            When(title__iexact=search_term, then=100),
                            When(title__istartswith=search_term, then=75),
                            When(title__icontains=search_term, then=50),
                            When(description__icontains=search_term, then=25),
                            default=0,
                            output_field=IntegerField(),
                        )
                    )
                    .order_by('-title_relevance', '-created_at')
                )
            else:
                jobs = JobPost.objects.filter(query).select_related('posted_by').order_by('-created_at')

            # Get limit+1 so we can see if there's another page
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