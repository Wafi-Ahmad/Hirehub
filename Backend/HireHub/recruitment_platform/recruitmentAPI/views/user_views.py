from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from ..services.user_services import UserService  # Use relative import
from ..serializers.user_serializers import UserSerializer, CustomLoginSerializer, UserInterestSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer, UserProfileSerializer  , PrivacySettingsSerializer, UserProfilePublicSerializer # Use relative import
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
import logging
from recruitmentAPI.permissions import IsNormalUser, IsCompanyUser

User = get_user_model()

logger = logging.getLogger(__name__)


class RegisterUserView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = UserService.create_user(
                    email=serializer.validated_data['email'],
                    first_name=serializer.validated_data['first_name'],
                    last_name=serializer.validated_data['last_name'],
                    password=serializer.validated_data['password'],
                    date_of_birth=serializer.validated_data.get('date_of_birth'),
                    company_name=serializer.validated_data.get('company_name'),
                    user_type=serializer.validated_data['user_type'],
                    #profile_picture=serializer.validated_data.get('profile_picture') #This should to remove , we don't need to add the picture while registration
                )
                return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomLoginUserView(APIView):
    def post(self, request):
        serializer = CustomLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = User.objects.get(email=serializer.validated_data['email'])
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Login successful",
                "user": {
                    "email": user.email,
                    "user_type": user.user_type
                },
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProtectedView(APIView):

    permission_classes = [IsAuthenticated] 
    def get(self, request):
        return Response({"message": "This is a protected view"}, status=status.HTTP_200_OK)

class UpdateUserInterestsView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def put(self, request):
        user = request.user
        serializer = UserInterestSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))   
                reset_link = f"http://localhost:8000/api/reset-password-confirm/{uid}/{token}/"
                send_mail(
                    'Password Reset Request',
                    f'Click the link to reset your password: {reset_link}',
                    'from@example.com',
                    [email],
                    fail_silently=False,
                )
                return Response({"message": "Password reset link sent."}, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({"error": "User with this email does not exist."}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Error sending email: {e}")
                return Response({"error": "Failed to send email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    def post(self, request, uidb64, token):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            try:
                uid = urlsafe_base64_decode(uidb64).decode()
                user = User.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response({"error": "Invalid link."}, status=status.HTTP_400_BAD_REQUEST)

            if default_token_generator.check_token(user, token):
                user.set_password(serializer.validated_data['new_password'])
                user.save()
                return Response({"message": "Password has been reset."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UpdateUserProfileView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def put(self, request):
        serializer = UserProfileSerializer(instance=request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateBasicUserInfoView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser, IsCompanyUser]

    def put(self, request):
        """
        This method updates the user's basic information: skills, experience, recent work, current work, and contact details.
        """
        serializer = UserProfileSerializer(instance=request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Basic information updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdatePrivacySettingsView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser, IsCompanyUser]

    def put(self, request):
        user = request.user
        serializer = PrivacySettingsSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Privacy settings updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteUserAccountView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser, IsCompanyUser]

    def delete(self, request):
        user = request.user
        try:
            # Call the service to delete the user
            response = UserService.delete_user(user.id)
            return Response(response, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class ViewUserProfileView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly, IsNormalUser, IsCompanyUser]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserProfilePublicSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)        


class SearchProfilesView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser, IsCompanyUser]

    def get(self, request):
        query = request.GET.get('query', '')
        if not query:
            return Response({"error": "Search query not provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Filter profiles by name, skills, or other fields
        users = User.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(skills__icontains=query)
        )

        # Check privacy settings for each user
        result = []
        for user in users:
            if user.is_profile_public:
                # Respect privacy settings for individual fields
                user_data = {
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "profile_picture": request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None,
                }
                
                if user.show_skills:
                    user_data["skills"] = user.skills
                if user.show_experience:
                    user_data["experience"] = user.experience
                if user.show_current_work:
                    user_data["current_work"] = user.current_work
                if user.show_recent_work:
                    user_data["recent_work"] = user.recent_work
                if user.show_email:
                    user_data["email"] = user.email

                result.append(user_data)

        # Check if result is empty
        if not result:
            return Response({"message": "No results found."}, status=status.HTTP_200_OK)

        return Response(result, status=status.HTTP_200_OK)

class SomeNormalUserView(APIView):
    permission_classes = [IsAuthenticated, IsNormalUser]

    def get(self, request):
        # Logic for normal users
        return Response({"message": "This is accessible only to normal users."})

class SomeCompanyUserView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyUser]

    def get(self, request):
        # Logic for company users
        return Response({"message": "This is accessible only to company users."})