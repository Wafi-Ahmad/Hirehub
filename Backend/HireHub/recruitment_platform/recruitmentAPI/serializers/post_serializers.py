from rest_framework import serializers
from recruitmentAPI.models.post_model import Post
from recruitmentAPI.serializers.user_serializers import UserSerializer  # Assuming a user serializer exists

class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)  # Display selected user details in the post output
    like_count = serializers.SerializerMethodField()  # Return like count instead of user list

    class Meta:
        model = Post
        fields = ['id', 'user', 'content', 'attachment', 'created_at', 'updated_at', 'like_count']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'like_count']

    def create(self, validated_data):
        """
        Overriding create to ensure the user is set from the request context.
        """
        user = self.context['request'].user
        post = Post.objects.create(user=user, **validated_data)
        return post

    def get_like_count(self, obj):
        return obj.likes.count()

    def validate_attachment(self, value):
        """
        File type and size validation for attachment uploads.
        """
        allowed_types = ['image/jpeg', 'image/png', 'application/pdf']  # Example allowed types
        max_file_size = 10 * 1024 * 1024  # 10MB size limit

        if value.size > max_file_size:
            raise serializers.ValidationError("The file size exceeds the limit of 10MB.")
        if value.content_type not in allowed_types:
            raise serializers.ValidationError("Invalid file type. Only images and PDFs are allowed.")
        return value
