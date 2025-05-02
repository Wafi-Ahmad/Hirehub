from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from ..services.cv_services import CVService
from ..permissions import IsNormalUser
import logging

# Setup logging
logger = logging.getLogger(__name__)

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
            logger.exception("Error in CV upload: %s", str(e))
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
            logger.exception("Error retrieving CV info: %s", str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CVParseView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]
    
    def get(self, request):
        """
        Parse existing CV file of authenticated user without updating profile
        """
        try:
            parsed_data = CVService.parse_cv(request.user)
            return Response(parsed_data, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception("Error parsing CV: %s", str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CVParseAndUpdateProfileView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]
    
    def post(self, request):
        """
        Upload CV (if provided), parse it, and update user profile
        """
        try:
            # Check if a new CV file is being uploaded
            cv_file = request.FILES.get('cv_file', None)
            
            logger.info("Starting CV parse and update for user %s", request.user.email)
            if cv_file:
                logger.info("New CV file provided: %s", cv_file.name)
            
            result = CVService.parse_and_update_profile(request.user, cv_file)
            return Response(result, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            logger.error("Validation error in CV parse and update: %s", str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception("Error in CV parse and update: %s", str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
