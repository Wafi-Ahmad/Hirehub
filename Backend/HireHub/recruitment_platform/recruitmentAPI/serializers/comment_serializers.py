from rest_framework import serializers
from recruitmentAPI.models.comment_model import Comment

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'content', 'created_at', 'user']
        read_only_fields = ['id', 'created_at', 'user', 'post']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies, many=True).data
        return []