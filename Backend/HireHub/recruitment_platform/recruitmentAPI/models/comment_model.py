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

    def __str__(self):
        return f"Comment by {self.user.email} on {self.post}"

    class Meta:
        ordering = ['-created_at']  # Newest comments first

    def like_count(self):
        """Returns the number of likes on the comment."""
        return self.likes.count()
