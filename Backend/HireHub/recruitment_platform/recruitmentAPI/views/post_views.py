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
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.request.method == 'POST':
            # Allow both normal and company users to create posts
            return [IsAuthenticated(), IsNormalOrCompanyUser()]
        return [IsAuthenticated()]

    def get(self, request):
        """
        Get paginated list of posts
        """
        cursor = request.GET.get('cursor')
        limit = int(request.GET.get('limit', 10))
        followed_only = request.GET.get('followed_only', '').lower() == 'true'
        
        result = PostService.get_posts_paginated(
            cursor=cursor,
            limit=limit,
            user=request.user,
            followed_only=followed_only
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

    def put(self, request, post_id):
        """Update a post (full update)"""
        try:
            post = PostService.get_post_detail(post_id)
            if not post:
                return Response(
                    {"error": "Post not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user is the post owner
            if post.user != request.user:
                return Response(
                    {"error": "You don't have permission to edit this post"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = PostDetailSerializer(
                post, 
                data=request.data,
                context={'request': request},
                partial=False
            )
            
            if serializer.is_valid():
                updated_post = PostService.update_post(
                    post_id=post_id,
                    content=serializer.validated_data.get('content'),
                    image=request.FILES.get('image'),
                    video=request.FILES.get('video'),
                    user=request.user
                )
                return_serializer = PostDetailSerializer(updated_post, context={'request': request})
                return Response(return_serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def patch(self, request, post_id):
        """Update a post (partial update)"""
        try:
            post = PostService.get_post_detail(post_id)
            if not post:
                return Response(
                    {"error": "Post not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user is the post owner
            if post.user != request.user:
                return Response(
                    {"error": "You don't have permission to edit this post"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = PostDetailSerializer(
                post, 
                data=request.data,
                context={'request': request},
                partial=True
            )
            
            if serializer.is_valid():
                # Check if media should be removed
                remove_media = request.data.get('remove_media') == 'true'
                
                updated_post = PostService.update_post(
                    post_id=post_id,
                    content=serializer.validated_data.get('content'),
                    image=request.FILES.get('image'),
                    video=request.FILES.get('video'),
                    user=request.user,
                    remove_media=remove_media
                )
                return_serializer = PostDetailSerializer(updated_post, context={'request': request})
                return Response(return_serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, post_id):
        """Delete a post"""
        try:
            # Get the post
            post = PostService.get_post_detail(post_id)
            if not post:
                return Response(
                    {"error": "Post not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user is the post owner
            if post.user != request.user:
                return Response(
                    {"error": "You don't have permission to delete this post"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Delete the post
            PostService.delete_post(post_id, request.user.id)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )



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

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Handle media removal
        if request.data.get('remove_image') == 'true':
            if instance.image:
                instance.image.delete()
            instance.image = None
        
        if request.data.get('remove_video') == 'true':
            if instance.video:
                instance.video.delete()
            instance.video = None
        
        return super().update(request, *args, **kwargs)
