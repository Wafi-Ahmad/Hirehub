from django.db.models import Q
from recruitmentAPI.models import Conversation, Message, User
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
from django.db import transaction
from recruitmentAPI.services.notification_services import NotificationService
from django.utils import timezone
from datetime import timedelta

class MessageService:
    @staticmethod
    def get_user_conversations(user):
        """Get all conversations for a user"""
        return Conversation.objects.filter(participants=user).prefetch_related('participants')
    
    @staticmethod
    def get_conversation_messages(conversation_id, user):
        """Get all messages for a conversation"""
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=user)
            return Message.objects.filter(conversation=conversation).select_related('sender')
        except Conversation.DoesNotExist:
            return None
    
    @staticmethod
    def create_conversation(user, participant_ids):
        """Create a new conversation with the given participants"""
        # Check if a conversation with exactly these participants already exists
        participants = list(User.objects.filter(id__in=participant_ids))
        participants.append(user)
        participants = list(set(participants))  # Remove duplicates
        
        # Check if a conversation with EXACTLY these participants exists
        existing_conversations = Conversation.objects.all()
        for conversation in existing_conversations:
            conv_participants = set(conversation.participants.all())
            if set(participants) == conv_participants:
                return conversation
        
        # If no existing conversation found, create a new one
        conversation = Conversation.objects.create()
        conversation.participants.set(participants)
        return conversation
    
    @staticmethod
    def create_message(user, conversation_id, content):
        """Create a new message in the conversation"""
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=user)
            message = Message.objects.create(
                conversation=conversation,
                sender=user,
                content=content
            )
            
            # Update conversation timestamp
            conversation.save()  # This will update the updated_at field
            
            # Notify clients via WebSocket
            channel_layer = get_channel_layer()
            message_data = {
                'id': message.id,
                'content': message.content,
                'created_at': message.created_at.isoformat(),
                'sender': {
                    'id': user.id,
                    'display_name': user.full_name,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                },
                'conversation_id': conversation.id,
                'is_edited': False,
                'is_deleted': False
            }
            
            async_to_sync(channel_layer.group_send)(
                f"conversation_{conversation_id}",
                {
                    'type': 'chat_message',
                    'message': message_data
                }
            )
            
            # Create notification for each recipient
            for recipient in conversation.participants.all():
                # Don't notify the sender
                if recipient.id != user.id:
                    NotificationService.create_notification(
                        recipient=recipient,
                        sender=user,
                        notification_type='NEW_MESSAGE',
                        content=f"{user.full_name} sent you a message",
                        related_object_id=conversation.id,
                        related_object_type='conversation'
                    )
            
            return message
        except Conversation.DoesNotExist:
            return None
    
    @staticmethod
    def is_within_timeframe(message, hours=24):
        """Check if message is within the specified timeframe (default 24 hours)"""
        return timezone.now() - message.created_at <= timedelta(hours=hours)
    
    @staticmethod
    def edit_message(user, message_id, new_content):
        """Edit a message (only allowed within 24 hours)"""
        try:
            message = Message.objects.get(id=message_id, sender=user)
            
            # Check if message is within 24 hours
            if not MessageService.is_within_timeframe(message):
                return None
                
            message.content = new_content
            message.is_edited = True
            message.save()
            
            # Notify clients via WebSocket
            channel_layer = get_channel_layer()
            message_data = {
                'id': message.id,
                'content': message.content,
                'is_edited': True,
                'conversation_id': message.conversation.id
            }
            
            async_to_sync(channel_layer.group_send)(
                f"conversation_{message.conversation.id}",
                {
                    'type': 'chat_message_updated',
                    'message': message_data
                }
            )
            
            return message
        except Message.DoesNotExist:
            return None
    
    @staticmethod
    def delete_message(user, message_id):
        """Mark a message as deleted (only allowed within 24 hours)"""
        try:
            message = Message.objects.get(id=message_id, sender=user)
            
            # Check if message is within 24 hours
            if not MessageService.is_within_timeframe(message):
                return None
                
            message.is_deleted = True
            message.content = "[This message has been deleted]"
            message.save()
            
            # Notify clients via WebSocket
            channel_layer = get_channel_layer()
            message_data = {
                'id': message.id,
                'is_deleted': True,
                'conversation_id': message.conversation.id
            }
            
            async_to_sync(channel_layer.group_send)(
                f"conversation_{message.conversation.id}",
                {
                    'type': 'chat_message_deleted',
                    'message': message_data
                }
            )
            
            return message
        except Message.DoesNotExist:
            return None
    
    @staticmethod
    def mark_messages_as_read(user, conversation_id):
        """Mark all messages in a conversation as read by the user"""
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=user)
            unread_messages = Message.objects.filter(
                conversation=conversation
            ).exclude(
                sender=user
            ).exclude(
                read_by=user
            )
            
            with transaction.atomic():
                for message in unread_messages:
                    message.read_by.add(user)
            
            return True
        except Conversation.DoesNotExist:
            return False
    
    @staticmethod
    def search_users(user, query):
        """Search for users to start a conversation with"""
        if not query:
            return []
            
        return User.objects.filter(
            Q(email__icontains=query) | 
            Q(first_name__icontains=query) | 
            Q(last_name__icontains=query) |
            Q(company_name__icontains=query)
        ).exclude(id=user.id)[:20]  # Limit to 20 results 