from django.urls import path

from recruitmentAPI.views.comment_views import CommentListView, ReplyListView, CommentLikeView



urlpatterns = [

    # Comment URLs

    path('<int:post_id>/comments/', CommentListView.as_view(), name='comment-list'),

    path('<int:comment_id>/replies/', ReplyListView.as_view(), name='reply-list'),

    path('<int:comment_id>/like/', CommentLikeView.as_view(), name='comment-like'),

]


