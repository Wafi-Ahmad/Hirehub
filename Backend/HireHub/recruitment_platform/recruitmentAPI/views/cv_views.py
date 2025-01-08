from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from ..services.cv_services import CVService
from ..permissions import IsNormalUser

class CVUploadView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def post(self, request):
        """
        Upload CV file for the authenticated user
        """
        try:
            if 'cv_file' not in request.FILES:
                return Response(
                    {'error': 'No CV file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            result = CVService.upload_cv(request.user, request.FILES['cv_file'])
            return Response(result, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get(self, request):
        """
        Get CV information for the authenticated user
        """
        try:
            cv_info = CVService.get_cv_info(request.user)
            if not cv_info:
                return Response(
                    {'message': 'No CV found for this user'},
                    status=status.HTTP_404_NOT_FOUND
                )
            return Response(cv_info, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
