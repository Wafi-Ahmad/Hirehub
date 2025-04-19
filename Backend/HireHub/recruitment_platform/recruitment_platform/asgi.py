"""
ASGI config for recruitment_platform project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path

# Set up Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitment_platform.settings')
django.setup()

# Import after django setup
from recruitmentAPI.routing import websocket_urlpatterns

# Define the ASGI application with both HTTP and WebSocket support
application = ProtocolTypeRouter({
    # Django's ASGI application for regular HTTP requests
    "http": get_asgi_application(),
    
    # WebSocket handler with authentication middleware
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
