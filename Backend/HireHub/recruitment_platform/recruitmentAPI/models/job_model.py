from datetime import timezone
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from ..constants import (
    EMPLOYMENT_TYPES,
    LOCATION_TYPES,
    EXPERIENCE_LEVELS,
    JOB_STATUS_CHOICES
)

User = get_user_model()

class JobPost(models.Model):
    # Basic Information
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Skills and Requirements
    required_skills = models.CharField(
        max_length=500,
        null=True, 
        blank=True,
        help_text="Comma-separated list of required skills"
    )
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS)
    
    # Employment Details
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES)
    location_type = models.CharField(max_length=20, choices=LOCATION_TYPES)
    location = models.CharField(max_length=200)
    
    # Salary Information
    salary_min = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    salary_max = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    
    # Status and Metadata
    status = models.CharField(
        max_length=20,
        choices=JOB_STATUS_CHOICES,
        default='active'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    filled_at = models.DateTimeField(null=True, blank=True)
    
    # Relations
    posted_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='posted_jobs'
    )
    saved_by = models.ManyToManyField(
        User,
        related_name='saved_jobs',
        blank=True
    )
    quiz = models.OneToOneField(
        'recruitmentAPI.Quiz',  
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quiz_job'
    )
    
    # Engagement Metrics
    positive_feedback_count = models.IntegerField(default=0)
    negative_feedback_count = models.IntegerField(default=0)
    recommendation_count = models.IntegerField(default=0)
    ai_matching_score = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'is_active']),
            models.Index(fields=['created_at']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.posted_by.company_name if self.posted_by.company_name else self.posted_by.email}"

    def get_applicants(self):
        """Get all users who have attempted the quiz for this job"""
        if not self.quiz:
            return []
        return User.objects.filter(quiz_attempts__quiz=self.quiz).distinct()

    def get_applicant_count(self):
        """Get the number of applicants for this job"""
        if not self.quiz:
            return 0
        return self.quiz.attempts.count()

    def is_expired(self):
        """Check if the job posting has expired"""
        return self.expires_at and self.expires_at < timezone.now()

    def days_until_expiry(self):
        """Get the number of days until the job posting expires"""
        if not self.expires_at:
            return None
        delta = self.expires_at - timezone.now()
        return max(0, delta.days)