from django.urls import path
from recruitmentAPI.views.job_views import (
    JobPostViewSet,
)

urlpatterns = [
    # Job URLs
    path('create/', JobPostViewSet.as_view({'post': 'create'}), name='job-create'),
    path('', JobPostViewSet.as_view({'get': 'list'}), name='job-list'),
    path('<int:pk>/', JobPostViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='job-detail'),
    path('<int:pk>/save/', JobPostViewSet.as_view({'post': 'save'}), name='job-save'),
    path('<int:pk>/feedback/', JobPostViewSet.as_view({'post': 'feedback'}), name='job-feedback'),
]

