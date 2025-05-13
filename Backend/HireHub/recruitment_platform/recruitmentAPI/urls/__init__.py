from .user_urls import urlpatterns as user_urls
from .post_urls import urlpatterns as post_urls
from .comment_urls import urlpatterns as comment_urls
from .connection_urls import urlpatterns as connection_urls
from .role_urls import urlpatterns as role_urls
from .job_urls import urlpatterns as job_urls
from .notification_urls import urlpatterns as notification_urls
from .message_urls import urlpatterns as message_urls
from .interview_urls import urlpatterns as interview_urls

# For backward compatibility
from .message_urls import urlpatterns as messaging_urls

from django.urls import path, include

urlpatterns = [
    path('user/', include(user_urls)),
    path('posts/', include(post_urls)),
    path('comment/', include(comment_urls)),
    path('connection/', include(connection_urls)),
    path('role/', include(role_urls)),
    path('job/', include(job_urls)),
    path('notification/', include(notification_urls)),
    path('messaging/', include(message_urls)),
    path('interview/', include(interview_urls)),
]
