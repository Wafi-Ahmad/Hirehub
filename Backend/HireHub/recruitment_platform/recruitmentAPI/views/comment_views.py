from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from recruitmentAPI.serializers.comment_serializers import CommentSerializer
from recruitmentAPI.services.comment_services import CommentService
from recruitmentAPI.models.post_model import Post
from recruitmentAPI.models.comment_model import Comment

class CreateCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        """
        Create a new comment on a specific post.
        """
        try:
            post = Post.objects.get(pk=post_id)
        except Post.DoesNotExist:
            return Response({"error": "Post not found."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            parent_comment_id = request.data.get("parent_comment")
            parent_comment = None
            if parent_comment_id:
                parent_comment = Comment.objects.get(pk=parent_comment_id)
            serializer.save(post=post, parent_comment=parent_comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DeleteCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, comment_id):
        try:
            comment = Comment.objects.get(pk=comment_id, user=request.user)
            comment.delete()
            return Response({"message": "Comment deleted successfully."}, status=status.HTTP_200_OK)
        except Comment.DoesNotExist:
            return Response({"error": "Comment not found or you do not have permission to delete it."}, status=status.HTTP_404_NOT_FOUND)

class LikeCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, comment_id):
        """
        Like or dislike a comment.
        """
        try:
            comment = CommentService.like_comment(user=request.user, comment_id=comment_id)
            return Response({"message": "Comment liked/disliked successfully.", "like_count": comment.like_count()}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
