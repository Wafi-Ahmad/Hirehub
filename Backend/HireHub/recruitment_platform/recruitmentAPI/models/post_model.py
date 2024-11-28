from django.db import models
from django.conf import settings
from django.contrib.postgres.indexes import BTreeIndex

class Post(models.Model):
    MEDIA_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('both', 'Both'),
        ('none', 'None')
    ]

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_posts', blank=True)
    
    # Media fields
    media_type = models.CharField(max_length=5, choices=MEDIA_TYPE_CHOICES, default='none')
    image = models.ImageField(upload_to='post_images/%Y/%m/%d/', null=True, blank=True)
    video = models.FileField(upload_to='post_videos/%Y/%m/%d/', null=True, blank=True)
    
    # Cached counts for better performance
    comments_count = models.PositiveIntegerField(default=0)
    likes_count = models.PositiveIntegerField(default=0)
    
    # Add status for soft delete and visibility
    is_active = models.BooleanField(default=True)
    is_hidden = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            BTreeIndex(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['is_active', 'is_hidden', '-created_at']),
        ]

    def __str__(self):
        return f"Post by {self.user.email} at {self.created_at}"

    def update_counts(self):
        """Update the cached counts"""
        self.comments_count = self.comments.filter(parent_comment=None).count()
        self.likes_count = self.likes.count()
        self.save(update_fields=['comments_count', 'likes_count'])

    def add_like(self, user):
        """Method to add a like from a user."""
        self.likes.add(user)
        self.update_counts()

    def remove_like(self, user):
        """Method to remove a like from a user."""
        self.likes.remove(user)
        self.update_counts()
