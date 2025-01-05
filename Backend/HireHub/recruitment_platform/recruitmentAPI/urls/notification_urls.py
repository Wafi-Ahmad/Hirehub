from django.urls import path
from ..views.notification_views import NotificationListView, MarkNotificationsReadView, UnreadCountView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('mark-read/', MarkNotificationsReadView.as_view(), name='mark-notifications-read'),
    path('unread-count/', UnreadCountView.as_view(), name='unread-count'),
] 