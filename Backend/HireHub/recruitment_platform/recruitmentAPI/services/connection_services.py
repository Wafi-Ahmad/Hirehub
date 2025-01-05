from ..models.connection_model import ConnectionRequest
from ..models.notification_model import Notification
from django.core.exceptions import ValidationError
import logging
from django.utils import timezone
from django.contrib.auth.models import User

logger = logging.getLogger(__name__)

class ConnectionService:
    @staticmethod
    def send_request(sender_id, receiver_id):
        """Send a connection request"""
        try:
            if sender_id == receiver_id:
                raise ValidationError("Cannot send request to yourself")
            
            # Check if request already exists
            existing_request = ConnectionRequest.objects.filter(
                sender_id=sender_id, 
                receiver_id=receiver_id
            ).first()
            
            if existing_request:
                if existing_request.status == 'PENDING':
                    raise ValidationError("Request already sent")
                elif existing_request.status == 'ACCEPTED':
                    raise ValidationError("Already connected")
                else:
                    existing_request.status = 'PENDING'
                    existing_request.save()
                    connection_request = existing_request
            else:
                # Create connection request
                connection_request = ConnectionRequest.objects.create(
                    sender_id=sender_id,
                    receiver_id=receiver_id,
                    status='PENDING'
                )

            # Create notification for receiver
            Notification.objects.create(
                recipient_id=receiver_id,
                sender_id=sender_id,
                notification_type='CONNECTION_REQUEST',
                content='sent you a connection request',
                related_object_id=connection_request.id,
                related_object_type='ConnectionRequest'
            )

            logger.info(f"Created connection request: sender={sender_id}, receiver={receiver_id}")
            return connection_request
        except Exception as e:
            logger.error(f"Error in send_request: {str(e)}")
            raise

    @staticmethod
    def handle_request(request_id, action, user_id):
        """Handle a connection request (accept/reject/ignore)"""
        try:
            request = ConnectionRequest.objects.get(id=request_id, receiver_id=user_id)
            if request.status != 'PENDING':
                raise ValidationError("Request already handled")
            
            request.status = action.upper()
            request.save()

            # Create notification for sender if request is accepted
            if action.upper() == 'ACCEPT':
                Notification.objects.create(
                    recipient_id=request.sender_id,
                    sender_id=user_id,
                    notification_type='CONNECTION_ACCEPTED',
                    content='accepted your connection request',
                    related_object_id=request_id,
                    related_object_type='ConnectionRequest'
                )

            return request
        except ConnectionRequest.DoesNotExist:
            raise ValidationError("Request not found")
        except Exception as e:
            logger.error(f"Error in handle_request: {str(e)}")
            raise