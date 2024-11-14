from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from ..services.connection_services import ConnectionService
from django.core.exceptions import ValidationError
from ..models.user_model import User
from ..permissions import IsNormalOrCompanyUser, IsNormalUser, IsCompanyUser    

class SendConnectionRequestView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def post(self, request, receiver_id):
        try:
            # Verify receiver exists
            try:
                receiver = User.objects.get(id=receiver_id)
            except User.DoesNotExist:
                return Response({
                    "error": "Receiver not found"
                }, status=status.HTTP_404_NOT_FOUND)

            connection = ConnectionService.send_request(
                sender_id=request.user.id,
                receiver_id=receiver_id
            )
            return Response({
                "message": "Connection request sent successfully",
                "request_id": connection.id
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HandleConnectionRequestView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def post(self, request, request_id):
        action = request.data.get('action')
        if action not in ['ACCEPT', 'REJECT', 'IGNORE']:
            return Response({
                "error": "Invalid action. Must be ACCEPT, REJECT, or IGNORE"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            ConnectionService.handle_request(
                request_id=request_id,
                action=action,
                user_id=request.user.id
            )
            return Response({
                "message": f"Connection request {action.lower()}ed successfully"
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)