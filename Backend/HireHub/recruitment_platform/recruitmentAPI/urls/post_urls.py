from django.urls import path
from recruitmentAPI.views.post_views import PostListView, PostDetailView, PostLikeView

urlpatterns = [


    path('', PostListView.as_view(), name='post-list'),

    path('<int:post_id>/', PostDetailView.as_view(), name='post-detail'),

    path('<int:post_id>/like/', PostLikeView.as_view(), name='post-like'),


]










