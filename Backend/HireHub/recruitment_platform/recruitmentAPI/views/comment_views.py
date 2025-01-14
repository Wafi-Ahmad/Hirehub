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

                "likes_count": comment.likes_count,

                "is_liked": action == 'liked'

            })

        except ValueError as e:

            return Response(

                {'error': str(e)}, 

                status=status.HTTP_400_BAD_REQUEST

            )



class CommentDetailView(APIView):

    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]



    def put(self, request, comment_id):

        """Update a comment or reply"""

        try:

            comment = CommentService.update_comment(

                comment_id=comment_id,

                user=request.user,

                content=request.data.get('content')

            )

            

            serializer = CommentSerializer(comment, context={'request': request})

            return Response(serializer.data)

        except ValueError as e:

            return Response(

                {'error': str(e)}, 

                status=status.HTTP_400_BAD_REQUEST

            )

        except PermissionError as e:

            return Response(

                {'error': str(e)}, 

                status=status.HTTP_403_FORBIDDEN

            )



    def delete(self, request, comment_id):

        """Delete a comment or reply"""

        try:

            print("=== View Debug Information ===")
            print(f"Request user ID: {request.user.id}")
            print(f"Request user email: {request.user.email}")
            print(f"Comment ID to delete: {comment_id}")
            print(f"User is authenticated: {request.user.is_authenticated}")
            print("============================")
            
            CommentService.delete_comment(
                comment_id=comment_id,
                user_id=request.user.id
            )
            return Response(status=status.HTTP_204_NO_CONTENT)

        except PermissionError as e:

            print(f"Permission Error: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_403_FORBIDDEN
            )

        except ValueError as e:

            print(f"Value Error: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )






