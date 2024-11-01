from .user_urls import urlpatterns as user_urls
from .post_urls import urlpatterns as post_urls
from .comment_urls import urlpatterns as comment_urls
from django.urls import path, include

urlpatterns = [
    path('user/', include(user_urls)),
    path('post/', include(post_urls)),
    path('comment/', include(comment_urls)),
]
