from django.core.exceptions import ObjectDoesNotExist, PermissionDenied

from django.db.models import Prefetch

from recruitmentAPI.models.comment_model import Comment

from recruitmentAPI.models.post_model import Post



class CommentService:

    MAX_COMMENT_LENGTH = 1000

    MAX_REPLY_DEPTH = 1  # Only allow one level of replies



    @staticmethod

    def validate_content(content):

        """Validate comment content"""

        if not content or len(content.strip()) == 0:

            raise ValueError("Comment content cannot be empty")

        if len(content) > CommentService.MAX_COMMENT_LENGTH:

            raise ValueError(f"Comment cannot exceed {CommentService.MAX_COMMENT_LENGTH} characters")

        return content.strip()



    @staticmethod

    def create_comment(user, post_id, content):

        """Create a top-level comment on a post"""

        try:

            # Validate content

            content = CommentService.validate_content(content)

            

            # Get post

            post = Post.objects.get(id=post_id)

            

            # Create comment

            comment = Comment.objects.create(

                user=user,

                post=post,

                content=content

            )

            

            return comment

        except Post.DoesNotExist:

            raise ValueError("Post not found")

        except Exception as e:

            raise ValueError(str(e))



    @staticmethod

    def create_reply(user, comment_id, content):

        """Create a reply to a comment"""

        try:

            # Validate content

            content = CommentService.validate_content(content)

            

            # Get parent comment

            parent_comment = Comment.objects.select_related('post').get(id=comment_id)

            

            # Check reply depth

            if parent_comment.parent_comment:

                raise ValueError("Cannot reply to a reply")

            

            # Create reply

            reply = Comment.objects.create(

                user=user,

                post=parent_comment.post,

                content=content,

                parent_comment=parent_comment

            )

            

            return reply

        except Comment.DoesNotExist:

            raise ValueError("Parent comment not found")

        except Exception as e:

            raise ValueError(str(e))



    @staticmethod
    def get_comments_paginated(post_id, cursor=None, limit=10):
        """Get paginated comments for a post"""
        try:
            # Verify post exists
            if not Post.objects.filter(id=post_id).exists():
                raise ValueError("Post not found")

            # Build base queryset
            base_comments = Comment.objects.filter(
                post_id=post_id,
                parent_comment=None
            ).select_related('user')\
.prefetch_related(
                'likes',
                Prefetch(
                    'replies',
                    queryset=Comment.objects.select_related('user')\
                                         .prefetch_related('likes')\
                                         .order_by('-created_at')
                )
            ).order_by('-created_at')

            # Apply cursor pagination
            if cursor:
                base_comments = base_comments.filter(created_at__lt=cursor)

            # Get one extra to determine if there are more results
            paginated_comments = list(base_comments[:limit + 1])
            has_next = len(paginated_comments) > limit
            
            # Remove the extra item if it exists
            if has_next:
                paginated_comments.pop()

            # For each comment, get limited replies using list slicing after evaluation
            for comment in paginated_comments:
                replies_list = list(comment.replies.all())
                comment.limited_replies = replies_list[:3]

            next_cursor = paginated_comments[-1].created_at.isoformat() if has_next and paginated_comments else None

            return {
                'comments': paginated_comments,
                'next_cursor': next_cursor
            }
        except Exception as e:
            raise ValueError(str(e))



    @staticmethod

    def get_replies_paginated(comment_id, cursor=None, limit=10):

        """Get paginated replies for a comment"""

        try:

            # Verify parent comment exists and is not a reply

            parent_comment = Comment.objects.get(id=comment_id)

            if parent_comment.parent_comment:

                raise ValueError("Cannot get replies of a reply")



            replies = Comment.objects.filter(

                parent_comment_id=comment_id

            ).select_related('user')\
.prefetch_related('likes')

            

            if cursor:

                replies = replies.filter(created_at__lt=cursor)

                

            replies = replies[:limit + 1]

            has_next = len(replies) > limit

            replies = replies[:limit]

            

            next_cursor = replies[limit-1].created_at.isoformat() if has_next and replies else None

            

            return {

                'replies': replies,

                'next_cursor': next_cursor

            }

        except Comment.DoesNotExist:

            raise ValueError("Comment not found")

        except Exception as e:

            raise ValueError(str(e))



    @staticmethod

    def toggle_like(comment_id, user):

        """Toggle like status for a comment"""

        try:

            comment = Comment.objects.get(id=comment_id)

            if user in comment.likes.all():

                comment.remove_like(user)

                action = 'unliked'

            else:

                comment.add_like(user)

                action = 'liked'

            

            return comment, action

        except Comment.DoesNotExist:

            raise ValueError("Comment not found")


