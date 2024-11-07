from django.urls import path
from recruitmentAPI.views.comment_views import CreateCommentView, DeleteCommentView, LikeCommentView

urlpatterns = [
    path('posts/<int:post_id>/comments/', CreateCommentView.as_view(), name='create_comment'),
    path('comments/<int:comment_id>/delete/', DeleteCommentView.as_view(), name='delete_comment'),
    path('comments/<int:comment_id>/like/', LikeCommentView.as_view(), name='like_comment'),  # New URL for liking comments
]
