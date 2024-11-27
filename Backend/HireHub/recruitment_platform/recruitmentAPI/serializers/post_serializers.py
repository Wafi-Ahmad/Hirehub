from rest_framework import serializers
from recruitmentAPI.serializers.comment_serializers import CommentSerializer
from recruitmentAPI.models.post_model import Post
from .user_serializers import UserMinimalSerializer

class PostListSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'user', 'content', 'attachment', 
            'created_at', 'comments_count', 'likes_count',
            'is_liked'
        ]
        read_only_fields = ['id', 'created_at', 'comments_count', 'likes_count']

    def get_is_liked(self, obj):
        user = self.context['request'].user
        return obj.likes.filter(id=user.id).exists()

class PostDetailSerializer(PostListSerializer):
    top_level_comments = serializers.SerializerMethodField()
    
    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + ['top_level_comments']

    def get_top_level_comments(self, obj):
        # Get first page of comments
        comments = obj.comments.filter(parent_comment=None)\
                             .select_related('user')\
                             .prefetch_related('likes')[:5]
        return CommentSerializer(
            comments, 
            many=True, 
            context=self.context
        ).data
