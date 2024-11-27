from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Prefetch
from recruitmentAPI.models.post_model import Post
from recruitmentAPI.models.comment_model import Comment

class PostService:
    @staticmethod
    def get_posts_paginated(cursor=None, limit=10):
        """
        Get paginated posts with optimized queries
        """
        posts = Post.objects.select_related('user')\
                          .prefetch_related('likes')\
                          .all()
        
        if cursor:
            posts = posts.filter(created_at__lt=cursor)
        
        # Get one extra to determine if there are more
        posts = posts[:limit + 1]
        
        has_next = len(posts) > limit
        posts = posts[:limit]
        
        next_cursor = posts[limit-1].created_at.isoformat() if has_next else None
        
        return {
            'posts': posts,
            'next_cursor': next_cursor
        }

    @staticmethod
    def get_post_detail(post_id):
        """
        Get single post with related data
        """
        try:
            post = Post.objects.select_related('user')\
                             .prefetch_related(
                                 'likes',
                                 Prefetch(
                                     'comments',
                                     queryset=Comment.objects.filter(parent_comment=None)\
                                                          .select_related('user')\
                                                          .prefetch_related('likes')[:5]
                                 )
                             )\
                             .get(id=post_id)
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
