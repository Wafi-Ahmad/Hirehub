from recruitmentAPI.models.comment_model import Comment

class CommentService:
    @staticmethod
    def create_comment(user, post, content, parent_comment=None):
        """
        Create a new comment or reply for a given post.
        """
        comment = Comment.objects.create(
            user=user,
            post=post,
            content=content,
            parent_comment=parent_comment
        )
        return comment

    @staticmethod
    def delete_comment(user, comment_id):
        """
        Delete a comment if the user is the owner of the comment.
        """
        try:
            comment = Comment.objects.get(pk=comment_id, user=user)
            comment.delete()
            return {"message": "Comment deleted successfully."}
        except Comment.DoesNotExist:
            raise ValueError("Comment not found or you're not authorized to delete it.")

    @staticmethod
    def like_comment(user, comment_id):
        """
        Like or dislike a comment.
        """
        try:
            comment = Comment.objects.get(pk=comment_id)
            if user in comment.likes.all():
                comment.likes.remove(user)  # Dislike the comment if already liked
            else:
                comment.likes.add(user)  # Like the comment if not liked
            return comment
        except Comment.DoesNotExist:
            raise ValueError("Comment not found.")
