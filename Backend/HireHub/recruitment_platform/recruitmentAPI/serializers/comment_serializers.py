from rest_framework import serializers

from recruitmentAPI.models.comment_model import Comment

from .user_serializers import UserMinimalSerializer



class ReplySerializer(serializers.ModelSerializer):

    user = UserMinimalSerializer(read_only=True)

    is_liked = serializers.SerializerMethodField()

    

    class Meta:

        model = Comment

        fields = [

            'id', 'user', 'content', 'created_at', 

            'likes_count', 'is_liked'

        ]

        read_only_fields = ['id', 'created_at', 'likes_count']



    def get_is_liked(self, obj):

        user = self.context['request'].user

        return obj.likes.filter(id=user.id).exists()



class CommentSerializer(serializers.ModelSerializer):

    user = UserMinimalSerializer(read_only=True)

    replies = serializers.SerializerMethodField()

    is_liked = serializers.SerializerMethodField()

    

    class Meta:

        model = Comment

        fields = [

            'id', 'user', 'content', 'created_at',

            'likes_count', 'replies_count', 'is_liked', 

            'replies'

        ]

        read_only_fields = ['id', 'created_at', 'likes_count', 'replies_count']



    def get_is_liked(self, obj):

        user = self.context['request'].user

        return obj.likes.filter(id=user.id).exists()



    def get_replies(self, obj):

        # Get first few replies

        replies = obj.replies.select_related('user')\
            .prefetch_related('likes')[:3]

        return ReplySerializer(

            replies, 

            many=True, 

            context=self.context

        ).data
