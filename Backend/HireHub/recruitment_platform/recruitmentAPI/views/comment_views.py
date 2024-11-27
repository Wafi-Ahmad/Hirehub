from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from recruitmentAPI.permissions import IsNormalOrCompanyUser
from recruitmentAPI.serializers.comment_serializers import CommentSerializer, ReplySerializer
from recruitmentAPI.services.comment_services import CommentService

class CommentListView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def get(self, request, post_id):
        """Get paginated comments for a post"""
        try:
            cursor = request.GET.get('cursor')
            limit = int(request.GET.get('limit', 10))
            
            result = CommentService.get_comments_paginated(
                post_id=post_id,
                cursor=cursor,
                limit=limit
            )
            
            serializer = CommentSerializer(
                result['comments'], 
                many=True, 
                context={'request': request}
            )
            
            return Response({
                'comments': serializer.data,
                'next_cursor': result['next_cursor']
            })
        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def post(self, request, post_id):
        """Create a new comment on a post"""
        try:
            comment = CommentService.create_comment(
                user=request.user,
                post_id=post_id,
                content=request.data.get('content')
            )
            
            serializer = CommentSerializer(
                comment, 
                context={'request': request}
            )
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class ReplyListView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def get(self, request, comment_id):
        """Get paginated replies for a comment"""
        try:
            cursor = request.GET.get('cursor')
            limit = int(request.GET.get('limit', 10))
            
            result = CommentService.get_replies_paginated(
                comment_id=comment_id,
                cursor=cursor,
                limit=limit
            )
            
            serializer = ReplySerializer(
                result['replies'], 
                many=True, 
                context={'request': request}
            )
            
            return Response({
                'replies': serializer.data,
                'next_cursor': result['next_cursor']
            })
        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def post(self, request, comment_id):
        """Create a reply to a comment"""
        try:
            reply = CommentService.create_reply(
                user=request.user,
                comment_id=comment_id,
                content=request.data.get('content')
            )
            
            serializer = ReplySerializer(
                reply, 
                context={'request': request}
            )
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class CommentLikeView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def post(self, request, comment_id):
        """Toggle like status for a comment"""
        try:
            comment, action = CommentService.toggle_like(
                comment_id=comment_id,
                user=request.user
            )
            
            return Response({
                "message": f"Comment {action} successfully",
                "likes_count": comment.likes_count
            })
        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


