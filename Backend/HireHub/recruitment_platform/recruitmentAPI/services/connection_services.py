from ..models.connection_model import ConnectionRequest
from django.core.exceptions import ValidationError

class ConnectionService:
    @staticmethod
    def send_request(sender_id, receiver_id):
        """Send a connection request"""
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
                return existing_request
        
        return ConnectionRequest.objects.create(
            sender_id=sender_id,
            receiver_id=receiver_id
        )

    @staticmethod
    def handle_request(request_id, action, user_id):
        """Handle a connection request (accept/reject/ignore)"""
        try:
            request = ConnectionRequest.objects.get(id=request_id, receiver_id=user_id)
            if request.status != 'PENDING':
                raise ValidationError("Request already handled")
            
            request.status = action.upper()
            request.save()
            return request
        except ConnectionRequest.DoesNotExist:
            raise ValidationError("Request not found")