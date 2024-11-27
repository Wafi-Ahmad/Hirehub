"""
URL configuration for recruitment_platform project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView, SpectacularJSONAPIView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('recruitmentAPI.urls.user_urls')),
    path('api/posts/', include('recruitmentAPI.urls.post_urls')),
    path('api/comments/', include('recruitmentAPI.urls.comment_urls')),
    path('api/connections/', include('recruitmentAPI.urls.connection_urls')),
    path('api/roles/', include('recruitmentAPI.urls.role_urls')),
    # JWT Authentication URLs
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # YOUR API DOCUMENTATION
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema.json/', SpectacularJSONAPIView.as_view(), name='schema-json'),
    # Optional UI - you can use either Swagger or Redoc
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
