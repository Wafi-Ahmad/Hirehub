from rest_framework import serializers
from recruitmentAPI.models import Conversation, Message, User

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'company_name', 
                 'user_type', 'profile_picture']
                 
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Handle company vs individual user display
        if instance.user_type == 'Company':
            data['display_name'] = instance.company_name or instance.email
        else:
            first_name = data.get('first_name', '')
            last_name = data.get('last_name', '')
            if first_name or last_name:
                data['display_name'] = f"{first_name} {last_name}".strip()
            else:
                data['display_name'] = instance.email
        return data

class MessageSerializer(serializers.ModelSerializer):
    sender = UserBasicSerializer(read_only=True)
    read_by = UserBasicSerializer(many=True, read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'created_at', 
                 'is_edited', 'is_deleted', 'read_by', 'conversation']
        read_only_fields = ['is_edited', 'is_deleted', 'created_at']
        
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['sender'] = user
        message = Message.objects.create(**validated_data)
        return message

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserBasicSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'created_at', 'updated_at', 'last_message']
        read_only_fields = ['created_at', 'updated_at']
        
    def get_last_message(self, obj):
        last_message = obj.messages.order_by('-created_at').first()
        if last_message:
            return MessageSerializer(last_message).data
        return None

class ConversationCreateSerializer(serializers.ModelSerializer):
    participants = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=True
    )
    
    class Meta:
        model = Conversation
        fields = ['participants']
        
    def validate_participants(self, value):
        # Ensure the current user is included in participants
        user = self.context['request'].user
        if user not in value:
            value.append(user)
        
        # Ensure at least two participants
        if len(value) < 2:
            raise serializers.ValidationError("Conversation must have at least two participants")
            
        return value
        
    def create(self, validated_data):
        participants = validated_data.pop('participants')
        conversation = Conversation.objects.create(**validated_data)
        conversation.participants.set(participants)
        return conversation 