from rest_framework import status

from rest_framework.response import Response

from rest_framework.views import APIView

from rest_framework.permissions import IsAuthenticated

from recruitmentAPI.permissions import IsNormalOrCompanyUser

from recruitmentAPI.serializers.post_serializers import PostListSerializer, PostDetailSerializer

from recruitmentAPI.services.post_services import PostService



class PostListView(APIView):

    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]


from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from recruitmentAPI.permissions import IsNormalOrCompanyUser, IsCompanyUser
from recruitmentAPI.serializers.post_serializers import PostListSerializer, PostDetailSerializer
from recruitmentAPI.services.post_services import PostService

class PostListView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsCompanyUser()]
        return [IsAuthenticated(), IsNormalOrCompanyUser()]

    def get(self, request):
        """
        Get paginated list of posts
        """
        cursor = request.GET.get('cursor')
        limit = int(request.GET.get('limit', 10))
        
        result = PostService.get_posts_paginated(
            cursor=cursor,
            limit=limit,
            user=request.user
        )
        
        serializer = PostListSerializer(
            result['posts'], 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'posts': serializer.data,
            'next_cursor': result['next_cursor']
        })



    def post(self, request):
        """
        Create a new post
        """
        serializer = PostListSerializer(
            data=request.data, 
            context={'request': request}
        )

        if serializer.is_valid():
            # Get validated data
            data = serializer.validated_data
            
            # Create post using PostService
            post = PostService.create_post(
                user=request.user,
                content=data.get('content'),
                image=request.FILES.get('image'),
                video=request.FILES.get('video')
            )
            
            # Serialize the created post
            return_serializer = PostListSerializer(
                post,
                context={'request': request}
            )
            return Response(return_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class UserPostsView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def get(self, request, user_id):
        """
        Get paginated list of posts for a specific user
        """
        cursor = request.GET.get('cursor')
        limit = int(request.GET.get('limit', 10))
        
        result = PostService.get_user_posts_paginated(
            user_id=user_id,
            cursor=cursor,
            limit=limit,
            requesting_user=request.user
        )
        
        serializer = PostListSerializer(
            result['posts'], 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'posts': serializer.data,
            'next_cursor': result['next_cursor']
        })



class PostDetailView(APIView):

    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]



    def get(self, request, post_id):
        """
        Get detailed post view including initial comments
        """
        post = PostService.get_post_detail(post_id)
        if not post:
            return Response(
                {"error": "Post not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

            

        serializer = PostDetailSerializer(post, context={'request': request})

        return Response(serializer.data)



class PostLikeView(APIView):

    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]



    def post(self, request, post_id):
        """
        Toggle like status for a post
        """
        post, action = PostService.toggle_like(post_id, request.user)

        

        if not post:
            return Response(
                {"error": "Post not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

            

        return Response({
            "message": f"Post {action} successfully",
            "likes_count": post.likes_count
        })
