from django.urls import path
from ..views.connection_views import SendConnectionRequestView, HandleConnectionRequestView

urlpatterns = [
    path('connections/send/<int:receiver_id>/', SendConnectionRequestView.as_view(), name='send_connection_request'),
    path('connections/handle/<int:request_id>/', HandleConnectionRequestView.as_view(), name='handle_connection_request'),
]
