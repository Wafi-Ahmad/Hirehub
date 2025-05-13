from django.db import models
from django.utils import timezone
from django.conf import settings

class Interview(models.Model):
    # Interview Platform Choices
    PLATFORM_ZOOM = 'zoom'
    PLATFORM_GOOGLE_MEET = 'google_meet'
    PLATFORM_TEAMS = 'teams'
    PLATFORM_CHOICES = [
        (PLATFORM_ZOOM, 'Zoom'),
        (PLATFORM_GOOGLE_MEET, 'Google Meet'),
        (PLATFORM_TEAMS, 'Microsoft Teams'),
    ]
    
    # Interview Status Choices
    STATUS_SCHEDULED = 'scheduled'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_RESCHEDULED = 'rescheduled'
    STATUS_CHOICES = [
        (STATUS_SCHEDULED, 'Scheduled'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_RESCHEDULED, 'Rescheduled'),
    ]
    
    # Core Fields
    job = models.ForeignKey(
        'recruitmentAPI.JobPost',
        on_delete=models.CASCADE,
        related_name='interviews'
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='interviews_as_applicant'
    )
    interviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='interviews_as_interviewer'
    )
    
    # Scheduling Details
    scheduled_date = models.DateTimeField()
    duration_minutes = models.IntegerField(default=30)
    
    # Meeting Platform Details
    platform = models.CharField(
        max_length=20,
        choices=PLATFORM_CHOICES,
        default=PLATFORM_ZOOM
    )
    meeting_link = models.URLField(max_length=500, blank=True, null=True)
    meeting_id = models.CharField(max_length=100, blank=True, null=True)
    meeting_password = models.CharField(max_length=100, blank=True, null=True)
    
    # Status and Tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_SCHEDULED
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Recording Details
    is_recorded = models.BooleanField(default=False)
    recording_url = models.URLField(max_length=500, blank=True, null=True)
    
    class Meta:
        ordering = ['-scheduled_date']
        indexes = [
            models.Index(fields=['scheduled_date']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Interview for {self.job.title} with {self.applicant.email}"
    
    def is_upcoming(self):
        """Check if the interview is upcoming"""
        return self.status == self.STATUS_SCHEDULED and self.scheduled_date > timezone.now()
    
    def is_past(self):
        """Check if the interview is in the past"""
        return self.scheduled_date < timezone.now()
    
    def time_until_interview(self):
        """Get time until interview in minutes"""
        if self.is_past():
            return 0
        delta = self.scheduled_date - timezone.now()
        return int(delta.total_seconds() / 60) 