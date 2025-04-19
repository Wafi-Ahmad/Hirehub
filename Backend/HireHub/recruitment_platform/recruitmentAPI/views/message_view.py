from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from recruitmentAPI.models import Conversation, Message, User
from recruitmentAPI.serializers.message_serializers import (
    ConversationSerializer, 
    ConversationCreateSerializer,
    MessageSerializer,
    UserBasicSerializer
)
from recruitmentAPI.services.message_services import MessageService

class ConversationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling conversation operations
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return ConversationCreateSerializer
        return ConversationSerializer

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(participants=user).prefetch_related(
            'participants', 'messages'
        ).order_by('-updated_at')

    def create(self, request):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            conversation = serializer.save()
            return Response(
                ConversationSerializer(conversation, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages for a conversation"""
        conversation = get_object_or_404(Conversation, pk=pk, participants=request.user)
        
        # Check if after_id parameter is provided (for fetching only new messages)
        after_id = request.query_params.get('after_id')
        if after_id:
            # Fetch only messages newer than the specified ID
            messages = Message.objects.filter(
                conversation=conversation,
                id__gt=after_id
            ).select_related('sender')
        else:
            # Fetch all messages
            messages = Message.objects.filter(
                conversation=conversation
            ).select_related('sender')
        
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = MessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = MessageSerializer(messages, many=True)
        
        # Mark messages as read
        MessageService.mark_messages_as_read(request.user, pk)
        
        return Response(serializer.data)

class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling message operations
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(sender=self.request.user)

    def create(self, request):
        conversation_id = request.data.get('conversation')
        content = request.data.get('content')
        
        if not conversation_id or not content:
            return Response(
                {'error': 'Conversation ID and content are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        message = MessageService.create_message(request.user, conversation_id, content)
        
        if message:
            return Response(
                MessageSerializer(message).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            {'error': 'Unable to create message. Conversation not found or you are not a participant.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def update(self, request, pk=None):
        message = get_object_or_404(Message, pk=pk, sender=request.user)
        content = request.data.get('content')
        
        if not content:
            return Response(
                {'error': 'Content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if message is within 24 hours
        if not MessageService.is_within_timeframe(message):
            return Response(
                {'error': 'Messages can only be edited within 24 hours of sending'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        updated_message = MessageService.edit_message(request.user, pk, content)
        
        if updated_message:
            return Response(MessageSerializer(updated_message).data)
        
        return Response(
            {'error': 'Unable to update message'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, pk=None):
        message = get_object_or_404(Message, pk=pk, sender=request.user)
        
        # Check if message is within 24 hours
        if not MessageService.is_within_timeframe(message):
            return Response(
                {'error': 'Messages can only be deleted within 24 hours of sending'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        deleted_message = MessageService.delete_message(request.user, pk)
        
        if deleted_message:
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        return Response(
            {'error': 'Unable to delete message'},
            status=status.HTTP_400_BAD_REQUEST
        )

class UserSearchView(APIView):
    """
    API view for searching users to start a conversation with
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        users = MessageService.search_users(request.user, query)
        
        serializer = UserBasicSerializer(users, many=True)
        return Response(serializer.data) 