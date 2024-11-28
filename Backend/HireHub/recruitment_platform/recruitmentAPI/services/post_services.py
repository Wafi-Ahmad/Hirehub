from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Prefetch
from recruitmentAPI.models.post_model import Post
from recruitmentAPI.models.comment_model import Comment
from django.core.cache import cache
from django.conf import settings
import time

class PostService:
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
    ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif']
    ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime']
    CACHE_TTL = getattr(settings, 'POST_CACHE_TTL', 300)  # 5 minutes default
    POSTS_PER_PAGE = 10

    @staticmethod
    def create_post(user, content, image=None, video=None):
        """
        Create a new post with optional media
        """
        try:
            post_data = {
                'user': user,
                'content': content,
                'media_type': 'none'
            }

            if image:
                PostService._validate_image(image)
                post_data['image'] = image
                post_data['media_type'] = 'image'

            if video:
                PostService._validate_video(video)
                post_data['video'] = video
                post_data['media_type'] = 'video'

            if image and video:
                post_data['media_type'] = 'both'

            post = Post.objects.create(**post_data)
            return post
        except Exception as e:
            raise ValueError(str(e))

    @staticmethod
    def _validate_image(image):
        if image.size > PostService.MAX_IMAGE_SIZE:
            raise ValueError("Image file too large. Max size is 10MB")
        if image.content_type not in PostService.ALLOWED_IMAGE_TYPES:
            raise ValueError("Invalid image format. Supported formats: JPEG, PNG, GIF")

    @staticmethod
    def _validate_video(video):
        if video.size > PostService.MAX_VIDEO_SIZE:
            raise ValueError("Video file too large. Max size is 100MB")
        if video.content_type not in PostService.ALLOWED_VIDEO_TYPES:
            raise ValueError("Invalid video format. Supported formats: MP4, MOV")

    @staticmethod
    def get_posts_paginated(cursor=None, limit=POSTS_PER_PAGE, user=None):
        """
        Get paginated posts with caching and optimized queries
        """
        # Generate cache key
        cache_key = f"posts:list:{cursor}:{limit}"
        if user:
            cache_key += f":{user.id}"

        # Try to get from cache
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result

        # Build base query
        posts = Post.objects.filter(
            is_active=True,
            is_hidden=False
        ).select_related(
            'user'
        ).prefetch_related(
            'likes'
        )

        if cursor:
            posts = posts.filter(created_at__lt=cursor)

        # Get posts with one extra for next page check
        posts = posts[:limit + 1]
        posts_list = list(posts)
        
        has_next = len(posts_list) > limit
        result_posts = posts_list[:limit]
        
        next_cursor = None
        if has_next and result_posts:
            next_cursor = result_posts[-1].created_at.isoformat()

        result = {
            'posts': result_posts,
            'next_cursor': next_cursor,
            'timestamp': int(time.time())
        }

        # Cache the result
        cache.set(cache_key, result, PostService.CACHE_TTL)
        
        return result

    @staticmethod
    def get_post_detail(post_id, user=None):
        """
        Get single post with caching
        """
        cache_key = f"post:detail:{post_id}"
        if user:
            cache_key += f":{user.id}"

        cached_post = cache.get(cache_key)
        if cached_post:
            return cached_post

        try:
            post = Post.objects.select_related(
                'user'
            ).prefetch_related(
                'likes',
                Prefetch(
                    'comments',
                    queryset=Comment.objects.filter(
                        parent_comment=None
                    ).select_related(
                        'user'
                    ).prefetch_related(
                        'likes'
                    )[:5]
                )
            ).get(
                id=post_id,
                is_active=True,
                is_hidden=False
            )

            cache.set(cache_key, post, PostService.CACHE_TTL)
            return post

        except ObjectDoesNotExist:
            return None

    @staticmethod
    def toggle_like(post_id, user):
        """
        Toggle like status for a post
        """
        try:
            post = Post.objects.get(id=post_id)
            if user in post.likes.all():
                post.remove_like(user)
                action = 'unliked'
            else:
                post.add_like(user)
                action = 'liked'
            
            post.update_counts()
            return post, action
            
        except ObjectDoesNotExist:
            return None, None

    @staticmethod
    def invalidate_post_caches(post_id):
        """
        Invalidate all caches related to a post
        """
        # Clear post detail cache
        cache.delete(f"post:detail:{post_id}")
        
        # Clear post list caches (pattern-based deletion)
        cache.delete_pattern("posts:list:*")
