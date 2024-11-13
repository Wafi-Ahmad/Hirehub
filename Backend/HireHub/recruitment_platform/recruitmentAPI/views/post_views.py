from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from recruitmentAPI.serializers.post_serializers import PostSerializer
from recruitmentAPI.services.post_services import PostService
from recruitmentAPI.permissions import IsCompanyUser, IsNormalUser, IsNormalOrCompanyUser

class CreatePostView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def post(self, request):
        """
        Create a new post with optional attachment
        """
        serializer = PostSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            post = PostService.create_post(
                user=request.user,
                content=serializer.validated_data['content'],
                attachment=serializer.validated_data.get('attachment')
            )
            return Response(PostSerializer(post).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LikePostView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def post(self, request, post_id):
        """
        Like or unlike a post.
        """
        try:
            post = PostService.like_post(user=request.user, post_id=post_id)
            return Response(PostSerializer(post).data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
