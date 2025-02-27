from rest_framework import serializers
from recruitmentAPI.serializers.comment_serializers import CommentSerializer
from recruitmentAPI.models.post_model import Post
from .user_serializers import UserMinimalSerializer

class PostListSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    media_urls = serializers.SerializerMethodField()
    is_recommended = serializers.SerializerMethodField()
    recommendation_score = serializers.FloatField(read_only=True, default=0)
    content = serializers.CharField(required=False, allow_blank=True)
    # content = serializers.CharField(required=False, initial=empty)
    class Meta:
        model = Post
        fields = [
            'id', 'user', 'content', 'media_type', 'media_urls',
            'created_at', 'comments_count', 'likes_count',
            'is_liked', 'is_recommended', 'recommendation_score'
        ]
        read_only_fields = ['id', 'created_at', 'comments_count', 'likes_count']

    def get_is_liked(self, obj):
        user = self.context['request'].user
        return obj.likes.filter(id=user.id).exists()

    def get_media_urls(self, obj):
        urls = {}
        if obj.image:
            urls['image'] = obj.image.url
        if obj.video:
            urls['video'] = obj.video.url
        return urls

    def get_is_recommended(self, obj):
        return getattr(obj, 'recommendation_score', 0) > 0.35

    def validate(self, data):
        image = self.context['request'].FILES.get('image')
        video = self.context['request'].FILES.get('video')
        
        if image:
            self.validate_image(image)
            data['image'] = image
            data['media_type'] = 'image'
        
        if video:
            self.validate_video(video)
            data['video'] = video
            data['media_type'] = 'video'
        
        if image and video:
            data['media_type'] = 'both'
        elif not image and not video:
            data['media_type'] = 'none'

        return data

    def validate_image(self, image):
        max_size = 10 * 1024 * 1024  # 10MB
        if image.size > max_size:
            raise serializers.ValidationError("Image file too large. Max size is 10MB")
        
        allowed_types = ['image/jpeg', 'image/png', 'image/gif']
        if image.content_type not in allowed_types:
            raise serializers.ValidationError("Invalid image format. Supported formats: JPEG, PNG, GIF")

    def validate_video(self, video):
        max_size = 100 * 1024 * 1024  # 100MB
        if video.size > max_size:
            raise serializers.ValidationError("Video file too large. Max size is 100MB")
        
        allowed_types = ['video/mp4', 'video/quicktime']
        if video.content_type not in allowed_types:
            raise serializers.ValidationError("Invalid video format. Supported formats: MP4, MOV")

class PostDetailSerializer(PostListSerializer):
    top_level_comments = serializers.SerializerMethodField()
    
    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + ['top_level_comments']

    def get_top_level_comments(self, obj):
        # Get comments directly from the prefetched cache if available
        if hasattr(obj, '_prefetched_objects_cache') and 'comments' in obj._prefetched_objects_cache:
            comments = obj._prefetched_objects_cache['comments']
        else:
            # Fallback to querying if not prefetched
            comments = obj.comments.filter(parent_comment=None)\
                                 .select_related('user')\
                                 .prefetch_related('likes')\
                                 .order_by('-created_at')[:5]
        
        return CommentSerializer(
            comments,
            many=True,
            context=self.context
        ).data
