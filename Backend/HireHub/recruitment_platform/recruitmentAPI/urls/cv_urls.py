from django.urls import path
from ..views.cv_views import CVUploadView, CVParseView, CVParseAndUpdateProfileView
 
urlpatterns = [
    path('upload/', CVUploadView.as_view(), name='cv-upload'),
    path('parse/', CVParseView.as_view(), name='cv-parse'),
    path('parse-and-update/', CVParseAndUpdateProfileView.as_view(), name='cv-parse-and-update'),
] 