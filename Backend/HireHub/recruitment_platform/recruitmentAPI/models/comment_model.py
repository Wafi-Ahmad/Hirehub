from django.db import models
from django.conf import settings
from recruitmentAPI.models.post_model import Post  # Import the Post model

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_comments', blank=True)  # New field
    
    # New fields for optimization
    replies_count = models.PositiveIntegerField(default=0)
    likes_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Comment by {self.user.email} on {self.post}"

    class Meta:
        ordering = ['-created_at']  # Newest comments first
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['post', 'parent_comment']),
        ]

    def update_counts(self):
        """Update the cached counts"""
        self.replies_count = self.replies.count()
        self.likes_count = self.likes.count()
        self.save(update_fields=['replies_count', 'likes_count'])

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new and not self.parent_comment:
            # Update post's comment count when a new top-level comment is created
            self.post.update_counts()
        elif is_new and self.parent_comment:
            # Update parent comment's reply count when a new reply is created
            self.parent_comment.update_counts()

    def like_count(self):
        """Returns the number of likes on the comment."""
        return self.likes.count()

    def add_like(self, user):
        """Method to add a like from a user."""
        self.likes.add(user)
        self.update_counts()

    def remove_like(self, user):
        """Method to remove a like from a user."""
        self.likes.remove(user)
        self.update_counts()
