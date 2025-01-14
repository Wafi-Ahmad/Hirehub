from django.urls import path
from ..views.comment_views import CommentListView, ReplyListView, CommentLikeView, CommentDetailView

urlpatterns = [
    # Comment URLs
    path('post/<int:post_id>/', CommentListView.as_view(), name='comment-list'),
    path('<int:comment_id>/replies/', ReplyListView.as_view(), name='reply-list'),
    path('<int:comment_id>/like/', CommentLikeView.as_view(), name='comment-like'),
    path('<int:comment_id>/', CommentDetailView.as_view(), name='comment-detail'),
]
