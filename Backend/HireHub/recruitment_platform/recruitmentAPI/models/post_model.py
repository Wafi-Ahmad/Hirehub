from django.db import models
from django.conf import settings

class Post(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit primary key
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    attachment = models.FileField(upload_to='post_attachments/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_posts', blank=True)

    def __str__(self):
        return f"Post by {self.user.email} at {self.created_at}"

    def like_count(self):
        """Returns the number of likes on the post."""
        return self.likes.count()

    def add_like(self, user):
        """Method to add a like from a user."""
        self.likes.add(user)

    def remove_like(self, user):
        """Method to remove a like from a user."""
        self.likes.remove(user)
