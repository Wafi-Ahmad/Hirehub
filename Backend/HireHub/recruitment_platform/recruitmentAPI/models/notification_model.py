from django.db import models
from django.conf import settings

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('CONNECTION_REQUEST', 'Connection Request'),
        ('CONNECTION_ACCEPTED', 'Connection Accepted'),
        ('NEW_JOB_POST', 'New Job Post'),
        ('NEW_POST', 'New Post'),
        ('POST_LIKE', 'Post Like'),
        ('POST_COMMENT', 'Post Comment'),
        ('COMMENT_REPLY', 'Comment Reply'),
        ('COMMENT_LIKE', 'Comment Like'),
        ('NEW_FOLLOWER', 'New Follower'),
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
        null=True
    )
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    content = models.TextField()
    related_object_id = models.IntegerField(null=True)  # ID of related post/job/connection
    related_object_type = models.CharField(max_length=50, null=True)  # Type of related object
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['is_read']),
        ] 