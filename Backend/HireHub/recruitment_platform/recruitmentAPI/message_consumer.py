import json
import urllib.parse
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
import jwt
from django.conf import settings
from recruitmentAPI.models import Conversation

# Set up logging
logger = logging.getLogger(__name__)
User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get token from URL parameters
        token = self.scope['url_route']['kwargs'].get('token')
        if not token:
            logger.error("WebSocket connection failed: No token provided")
            await self.close()
            return
        
        try:
            # URL decode the token (it may be URL encoded from frontend)
            decoded_token = urllib.parse.unquote(token)
            logger.info(f"Attempting WebSocket connection with token: {token[:10]}...")
            
            # Authenticate the user from the token
            user = await self.get_user_from_token(decoded_token)
            if not user:
                logger.error(f"Failed to authenticate user with token")
                await self.close()
                return
            
            self.user = user
            self.conversations = await self.get_user_conversations(user)
            
            # Join conversation groups
            for conversation_id in self.conversations:
                group_name = f"conversation_{conversation_id}"
                await self.channel_layer.group_add(
                    group_name,
                    self.channel_name
                )
                logger.debug(f"User {user.id} joined group: {group_name}")
            
            await self.accept()
            logger.info(f"WebSocket connected for user {user.id} with {len(self.conversations)} conversations")
        except Exception as e:
            logger.exception(f"WebSocket connection error: {str(e)}")
            await self.close()
    
    async def disconnect(self, close_code):
        # Leave conversation groups
        if hasattr(self, 'conversations'):
            for conversation_id in self.conversations:
                group_name = f"conversation_{conversation_id}"
                await self.channel_layer.group_discard(
                    group_name,
                    self.channel_name
                )
            logger.info(f"WebSocket disconnected for user {self.user.id if hasattr(self, 'user') else 'unknown'}, code: {close_code}")
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'message.read':
                # Handle read receipts
                conversation_id = data.get('conversation_id')
                if conversation_id and str(conversation_id) in self.conversations:
                    await self.mark_messages_as_read(conversation_id)
                    logger.debug(f"Marked messages as read in conversation {conversation_id} for user {self.user.id}")
            
            # Additional message types can be handled here
        except json.JSONDecodeError:
            logger.warning(f"Received invalid JSON from user {self.user.id if hasattr(self, 'user') else 'unknown'}")
    
    # WebSocket event handlers
    async def chat_message(self, event):
        """Send message to WebSocket"""
        message = event['message']
        
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': message
        }))
        logger.debug(f"Sent new message to user {self.user.id if hasattr(self, 'user') else 'unknown'}")
    
    async def chat_message_updated(self, event):
        """Send message update to WebSocket"""
        message = event['message']
        
        await self.send(text_data=json.dumps({
            'type': 'message_updated',
            'message': message
        }))
        logger.debug(f"Sent message update to user {self.user.id if hasattr(self, 'user') else 'unknown'}")
    
    async def chat_message_deleted(self, event):
        """Send message deletion to WebSocket"""
        message = event['message']
        
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message': message
        }))
        logger.debug(f"Sent message deletion to user {self.user.id if hasattr(self, 'user') else 'unknown'}")
    
    # Database helper methods
    @database_sync_to_async
    def get_user_from_token(self, token):
        """Authenticate user from JWT token"""
        try:
            # Decode token
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY,
                algorithms=['HS256']
            )
            user_id = payload.get('user_id')
            
            # Get user
            return User.objects.get(id=user_id)
        except (jwt.InvalidTokenError, User.DoesNotExist) as e:
            logger.error(f"Token authentication error: {str(e)}")
            return None
    
    @database_sync_to_async
    def get_user_conversations(self, user):
        """Get all conversation IDs for a user"""
        conversations = Conversation.objects.filter(participants=user).values_list('id', flat=True)
        return [str(conv_id) for conv_id in conversations]
    
    @database_sync_to_async
    def mark_messages_as_read(self, conversation_id):
        """Mark all messages in a conversation as read by the current user"""
        from recruitmentAPI.services.message_services import MessageService
        return MessageService.mark_messages_as_read(self.user, conversation_id) 