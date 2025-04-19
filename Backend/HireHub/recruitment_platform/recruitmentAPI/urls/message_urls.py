from django.urls import path, include
from rest_framework.routers import DefaultRouter
from recruitmentAPI.views.message_view import (
    ConversationViewSet,
    MessageViewSet,
    UserSearchView
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
    path('search-users/', UserSearchView.as_view(), name='search-users'),
] 