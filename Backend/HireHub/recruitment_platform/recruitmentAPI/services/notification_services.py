from ..models.notification_model import Notification
from django.db.models import Q
from django.core.paginator import Paginator
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def create_notification(recipient, notification_type, content, sender=None, 
                          related_object_id=None, related_object_type=None):
        """Create a new notification"""
        return Notification.objects.create(
            recipient=recipient,
            sender=sender,
            notification_type=notification_type,
            content=content,
            related_object_id=related_object_id,
            related_object_type=related_object_type
        )

    @staticmethod
    def get_user_notifications(user_id, page=1, limit=20, notification_type=None):
        """Get paginated notifications for a user"""
        try:
            logger.debug(f"Getting notifications for user {user_id}")
            notifications = Notification.objects.filter(recipient_id=user_id)
            
            if notification_type:
                logger.debug(f"Filtering by type: {notification_type}")
                if notification_type == 'connection':
                    notifications = notifications.filter(
                        notification_type__in=['CONNECTION_REQUEST', 'CONNECTION_ACCEPTED']
                    )
            
            # Order by created_at
            notifications = notifications.order_by('-created_at')
            
            logger.debug(f"Found {notifications.count()} notifications")
            
            paginator = Paginator(notifications, limit)
            page_obj = paginator.get_page(page)
            
            logger.debug(f"Returning page {page} of {paginator.num_pages}")
            return page_obj
        except Exception as e:
            logger.error(f"Error in get_user_notifications: {str(e)}")
            raise

    @staticmethod
    def mark_as_read(notification_ids, user_id):
        """Mark notifications as read"""
        return Notification.objects.filter(
            id__in=notification_ids,
            recipient_id=user_id
        ).update(is_read=True)

    @staticmethod
    def get_unread_count(user_id):
        """Get count of unread notifications"""
        return Notification.objects.filter(
            recipient_id=user_id,
            is_read=False
        ).count() 