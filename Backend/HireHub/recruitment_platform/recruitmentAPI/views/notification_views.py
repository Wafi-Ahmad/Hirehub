from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..services.notification_services import NotificationService
from ..serializers.notification_serializers import NotificationSerializer
import logging

logger = logging.getLogger(__name__)

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user's notifications"""
        try:
            logger.debug(f"Getting notifications for user {request.user.id}")
            page = int(request.GET.get('page', 1))
            limit = int(request.GET.get('limit', 20))
            notification_type = request.GET.get('type')
            
            notifications = NotificationService.get_user_notifications(
                user_id=request.user.id,
                page=page,
                limit=limit,
                notification_type=notification_type
            )
            
            logger.debug(f"Found {len(notifications)} notifications")
            serializer = NotificationSerializer(notifications, many=True)
            
            # Get unread count
            unread_count = NotificationService.get_unread_count(request.user.id)
            logger.debug(f"Unread count: {unread_count}")
            
            return Response({
                'notifications': serializer.data,
                'has_next': notifications.has_next() if hasattr(notifications, 'has_next') else False,
                'total_pages': notifications.paginator.num_pages if hasattr(notifications, 'paginator') else 1,
                'unread_count': unread_count
            })
        except Exception as e:
            logger.error(f"Error in NotificationListView: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MarkNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Mark notifications as read"""
        notification_ids = request.data.get('notification_ids', [])
        NotificationService.mark_as_read(notification_ids, request.user.id)
        return Response({'message': 'Notifications marked as read'}) 
    
class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get unread count"""
        unread_count = NotificationService.get_unread_count(request.user.id)
        return Response({'unread_count': unread_count}) 
