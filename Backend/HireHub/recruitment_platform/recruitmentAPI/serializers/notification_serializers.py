from rest_framework import serializers
from ..models.notification_model import Notification
from .user_serializers import UserMinimalSerializer

class NotificationSerializer(serializers.ModelSerializer):
    sender = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'sender', 'notification_type', 'content',
            'related_object_id', 'related_object_type',
            'is_read', 'created_at', 'status'
        ] 