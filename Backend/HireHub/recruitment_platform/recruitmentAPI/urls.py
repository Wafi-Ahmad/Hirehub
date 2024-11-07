from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('users/', include('recruitmentAPI.urls.user_urls')),
    # In the future , If i want to add any urls relates to other moduls like  jobs ,you should to create jobs_urls and make it initilization in __init__.py,then
    # we should to add like this " path('jobs/', include'recruitmentAPI.urls.job_urls')"
    
    # Add other app-specific URLs here if needed
    # JWT Authentication URLs
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
