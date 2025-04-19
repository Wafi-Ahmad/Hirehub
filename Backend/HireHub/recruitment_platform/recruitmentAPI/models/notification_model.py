from django.db import models
from django.conf import settings

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('NEW_FOLLOWER', 'New Follower'),
        ('CONNECTION_ACCEPTED', 'Connection Accepted'),
        ('POST_LIKE', 'Post Like'),
        ('POST_COMMENT', 'Post Comment'),
        ('NEW_JOB_POST', 'New Job Post'),
        ('JOB_OFFER_INITIAL', 'Job Offer Initial'),
        ('JOB_OFFER_ACCEPTED', 'Job Offer Accepted'),
        ('JOB_OFFER_REJECTED', 'Job Offer Rejected'),
        ('NEW_MESSAGE', 'New Message'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('IGNORED', 'Ignored'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications_received'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications_sent',
        null=True,
        blank=True
    )
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    related_object_type = models.CharField(max_length=50, null=True, blank=True)
    related_object_id = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['status']),
        ] 