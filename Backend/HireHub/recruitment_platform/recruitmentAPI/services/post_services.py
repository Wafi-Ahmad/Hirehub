from recruitmentAPI.models.post_model import Post
from django.shortcuts import get_object_or_404

class PostService:
    @staticmethod
    def create_post(user, content, attachment=None):
        """
        Create a new post with optional attachment.
        """
        post = Post.objects.create(
            user=user,
            content=content,
            attachment=attachment
        )
        return post

    @staticmethod
    def like_post(user, post_id):
        """
        Like or unlike a post.
        """
        post = get_object_or_404(Post, pk=post_id)  # Use get_object_or_404 for cleaner error handling

        if user in post.likes.all():
            post.likes.remove(user)  # Unlike the post if already liked
        else:
            post.likes.add(user)  # Like the post if not liked
        return post
