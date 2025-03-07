from django.urls import path
from ..views.post_views import PostListView, PostDetailView, PostLikeView, UserPostsView

urlpatterns = [
    path('', PostListView.as_view(), name='post-list'),
    path('user/<int:user_id>/', UserPostsView.as_view(), name='user-posts'),
    path('<int:post_id>/', PostDetailView.as_view(), name='post-detail'),
    path('<int:post_id>/like/', PostLikeView.as_view(), name='post-like'),
]
