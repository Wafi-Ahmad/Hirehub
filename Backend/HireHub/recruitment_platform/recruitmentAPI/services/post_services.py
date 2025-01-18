from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Prefetch
from recruitmentAPI.models.post_model import Post
from recruitmentAPI.models.comment_model import Comment
from django.core.cache import cache
from django.conf import settings
import time
from django.db.models import Q
from ..models.notification_model import Notification
from sentence_transformers import SentenceTransformer, util
import numpy as np
from django.db.models import Case, When, FloatField

class PostService:
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
    ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif']
    ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime']
    CACHE_TTL = getattr(settings, 'POST_CACHE_TTL', 300)  # 5 minutes default
    POSTS_PER_PAGE = 10
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            # Use same model as job matching for consistency
            cls._model = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._model

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
            
            # Create notifications for followers using IDs
            for follower_id in user.followers.values_list('id', flat=True):
                Notification.objects.create(
                    recipient_id=follower_id,
                    sender_id=user.id,
                    notification_type='NEW_POST',
                    content='created a new post',
                    related_object_id=post.id,
                    related_object_type='Post'
                )
            
            # Delete all feed-related caches
            keys_to_delete = [
                # Delete main feed cache
                f"posts:list:None:{PostService.POSTS_PER_PAGE}",
                # Delete user's specific feed cache
                f"posts:list:None:{PostService.POSTS_PER_PAGE}:{user.id}"
            ]
            
            # Also delete any cursor-based caches that might exist
            for i in range(5):  # Clear first 5 pages to be safe
                cursor_key = f"posts:list:page_{i}:{PostService.POSTS_PER_PAGE}"
                keys_to_delete.append(cursor_key)
                if user:
                    keys_to_delete.append(f"{cursor_key}:{user.id}")
            
            cache.delete_many(keys_to_delete)
            
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
    def calculate_post_recommendations(posts, user):
        """Calculate recommendation scores for posts based on user profile using embeddings"""
        recommendations = {}
        
        try:
            # Get user profile text based on user type
            if user.user_type == 'Normal':
                user_profile = f"{user.skills or ''} {user.experience or ''} {user.current_work or ''} "
                user_profile += f"{user.recent_work or ''} {user.certifications or ''} "
                user_profile += f"{user.preferred_job_type or ''} {user.preferred_job_category or ''}"
            else:  # Company user
                user_profile = f"{user.industry or ''} {user.about_company or ''} {user.specializations or ''}"

            # If no profile data, return empty recommendations
            if not user_profile.strip():
                return recommendations

            # Get embeddings using the model
            model = PostService.get_model()
            user_embedding = model.encode(user_profile, convert_to_tensor=True)

            # Calculate similarity scores for all posts
            for post in posts:
                post_content = post.content
                post_embedding = model.encode(post_content, convert_to_tensor=True)
                
                # Calculate cosine similarity using PyTorch
                similarity = float(util.pytorch_cos_sim(user_embedding, post_embedding)[0][0])
                
                # Only include posts with similarity above threshold
                if similarity > 0.35:
                    recommendations[post.id] = similarity

        except Exception as e:
            print(f"Error calculating post recommendations: {str(e)}")

        return recommendations

    @staticmethod
    def get_posts_paginated(cursor=None, limit=POSTS_PER_PAGE, user=None, followed_only=False):
        """
        Get paginated posts with recommendations when followed_only is False
        """
        print(f"Debug - followed_only: {followed_only}")  # Debug log
        
        # Generate cache key
        cache_key = f"posts:list:{cursor}:{limit}:{followed_only}"
        if user:
            cache_key += f":{user.id}"
            
        # Build base query
        posts = Post.objects.filter(
            is_active=True,
            is_hidden=False
        )

        if user:
            if followed_only:
                # Show only posts from followed users and own posts
                following_ids = list(user.following.values_list('id', flat=True))
                posts = posts.filter(
                    Q(user=user) |  # Include user's own posts
                    Q(user__in=following_ids)  # Include posts from followed users
                )
            else:
                # Show all posts with recommendations
                all_posts = list(posts)
                recommendations = PostService.calculate_post_recommendations(all_posts, user)
                posts = posts.annotate(
                    recommendation_score=Case(
                        *[When(id=post_id, then=score) for post_id, score in recommendations.items()],
                        default=0,
                        output_field=FloatField(),
                    )
                )

        posts = posts.select_related(
            'user'
        ).prefetch_related(
            'likes'
        ).order_by('-created_at')  # Ensure newest posts appear first

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

        # Add user-specific data
        if user:
            for post in result_posts:
                post.user_has_liked = user in post.likes.all()

        result = {
            'posts': result_posts,
            'next_cursor': next_cursor,
            'timestamp': int(time.time())
        }

        # Cache the result
        cache.set(cache_key, result, 300)  # 5 minutes
        
        return result

    @staticmethod
    def get_user_posts_paginated(user_id, cursor=None, limit=10, requesting_user=None):
        """
        Get paginated posts for a specific user
        """
        try:
            # Get posts for the specific user
            posts_query = Post.objects.filter(user_id=user_id)
            
            # Apply cursor pagination
            if cursor:
                posts_query = posts_query.filter(created_at__lt=cursor)
            
            # Order by creation date
            posts_query = posts_query.order_by('-created_at')
            
            # Get one extra post to determine if there are more
            posts = list(posts_query[:limit + 1])
            
            next_cursor = None
            if len(posts) > limit:
                next_cursor = posts[limit - 1].created_at.isoformat()
                posts = posts[:limit]
            
            return {
                'posts': posts,
                'next_cursor': next_cursor
            }
            
        except Exception as e:
            print(f"Error fetching user posts: {str(e)}")
            return {
                'posts': [],
                'next_cursor': None
            }

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
            # Get the post with all necessary relations
            post = Post.objects.select_related(
                'user'
            ).prefetch_related(
                'likes'
            ).get(
                id=post_id,
                is_active=True,
                is_hidden=False
            )

            # Fetch top-level comments with all necessary relations
            comments = list(Comment.objects.filter(
                post_id=post_id,
                parent_comment=None
            ).select_related(
                'user'
            ).prefetch_related(
                'likes'
            ).order_by('-created_at')[:5])

            # Manually set the prefetched comments
            post._prefetched_objects_cache = {
                'comments': comments
            }

            # Add user-specific data
            if user:
                post.user_has_liked = user in post.likes.all()

            # Cache the result
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
                # Create notification for post owner
                if post.user != user:  # Don't notify if user likes their own post
                    Notification.objects.create(
                        recipient=post.user,
                        sender=user,
                        notification_type='POST_LIKE',
                        content='liked your post',
                        related_object_id=post.id,
                        related_object_type='Post'
                    )
            
            post.update_counts()
            
            # Invalidate specific post cache
            cache.delete(f"post:detail:{post_id}")
            if user:
                cache.delete(f"post:detail:{post_id}:{user.id}")
            
            # Update feed version to invalidate all feed caches
            cache.set('post_feed_version', int(time.time()))
            
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
        
        # Update feed version to invalidate all feed caches
        cache.set('post_feed_version', int(time.time()))

    @staticmethod
    def delete_post(post_id, user_id):
        """
        Delete a post and clear related caches
        """
        try:
            post = Post.objects.get(id=post_id, user_id=user_id)
            
            # Delete all related caches
            keys_to_delete = [
                f"post:detail:{post_id}",
                f"post:detail:{post_id}:{user_id}",
                f"posts:list:None:{PostService.POSTS_PER_PAGE}",
                f"posts:list:None:{PostService.POSTS_PER_PAGE}:{user_id}"
            ]
            
            # Also delete any cursor-based caches
            for i in range(5):  # Clear first 5 pages to be safe
                cursor_key = f"posts:list:page_{i}:{PostService.POSTS_PER_PAGE}"
                keys_to_delete.append(cursor_key)
                if user_id:
                    keys_to_delete.append(f"{cursor_key}:{user_id}")
            
            cache.delete_many(keys_to_delete)
            
            # Delete the post
            post.delete()
            
            return True
        except Post.DoesNotExist:
            raise ValueError("Post not found or you don't have permission to delete it")

    @staticmethod
    def update_post(post_id: int, content: str, image=None, video=None, user=None, remove_media=False) -> Post:
        """Update a post with new content and/or media"""
        try:
            post = Post.objects.get(id=post_id, user=user)
            
            # Update content if provided
            if content is not None:
                post.content = content
            
            # Handle media deletion first
            if remove_media:
                if post.image:
                    post.image.delete(save=False)
                if post.video:
                    post.video.delete(save=False)
                post.image = None
                post.video = None
                post.media_type = 'none'
            else:
                # Handle media updates only if not deleting
                if image:
                    PostService._validate_image(image)
                    # Delete old image if exists
                    if post.image:
                        post.image.delete(save=False)
                    post.image = image
                    post.media_type = 'image'
                
                if video:
                    PostService._validate_video(video)
                    # Delete old video if exists
                    if post.video:
                        post.video.delete(save=False)
                    post.video = video
                    post.media_type = 'video'
                
                if image and video:
                    post.media_type = 'both'
                elif not image and not video and not post.image and not post.video:
                    post.media_type = 'none'
            
            post.save()
            
            # Clear post caches
            PostService.invalidate_post_caches(post_id)
            
            return post
            
        except Post.DoesNotExist:
            raise ValueError("Post not found or you don't have permission to edit it")
        except Exception as e:
            raise ValueError(str(e))
