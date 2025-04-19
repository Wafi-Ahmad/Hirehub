from django.urls import re_path
from .message_consumer import ChatConsumer

# We need to make sure the path in the backend matches the path in the frontend
# The frontend is using ws://{hostname}:8000/ws/chat/{token}/
websocket_urlpatterns = [
    # This pattern will match any token character except slash
    re_path(r'^ws/chat/(?P<token>[^/]+)/$', ChatConsumer.as_asgi()),
] 