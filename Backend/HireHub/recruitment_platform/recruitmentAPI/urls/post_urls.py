from django.urls import path
from recruitmentAPI.views.post_views import CreatePostView, LikePostView

urlpatterns = [
    path('posts/create/', CreatePostView.as_view(), name='create_post'),  # Explicit path for creating posts
    path('posts/<int:post_id>/like/', LikePostView.as_view(), name='like_post'),  # Like or unlike post
]
