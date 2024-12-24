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
    required_skills = models.TextField(null=True, blank=True)
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
    posted_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='job_posts'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    filled_at = models.DateTimeField(null=True, blank=True)
    
    # AI/ML Related
    ai_matching_score = models.FloatField(default=0.0)
    recommendation_count = models.IntegerField(default=0)
    positive_feedback_count = models.IntegerField(default=0)
    negative_feedback_count = models.IntegerField(default=0)

    class Meta:
        db_table = 'job_posts'
        indexes = [
            models.Index(fields=['status', 'is_active']),
            models.Index(fields=['location_type']),
            models.Index(fields=['employment_type']),
            models.Index(fields=['experience_level']),
            models.Index(fields=['created_at']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.posted_by.company_name}"

    def save(self, *args, **kwargs):
        # Ensure expires_at is set if not provided
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(days=30)
        super().save(*args, **kwargs)