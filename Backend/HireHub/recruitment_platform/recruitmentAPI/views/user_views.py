from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from ..services.user_services import UserService  # Use relative import
from ..services.notification_services import NotificationService
from ..serializers.user_serializers import UserSerializer, CustomLoginSerializer, UserInterestSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer, UserProfileSerializer  , PrivacySettingsSerializer, UserProfilePublicSerializer, ConnectionRecommendationSerializer # Use relative import
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.db.models import Q
import logging
from recruitmentAPI.permissions import IsNormalUser, IsCompanyUser, IsNormalOrCompanyUser
from django.conf import settings
from ..models.notification_model import Notification

User = get_user_model()

logger = logging.getLogger(__name__)


class RegisterUserView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Extract common fields
                user_data = {
                    'email': serializer.validated_data['email'],
                    'password': serializer.validated_data['password'],
                    'user_type': serializer.validated_data['user_type']
                }

                # Add type-specific fields
                if user_data['user_type'] == 'Company':
                    user_data['company_name'] = serializer.validated_data.get('company_name')
                else:  # Normal user
                    user_data.update({
                        'first_name': serializer.validated_data.get('first_name'),
                        'last_name': serializer.validated_data.get('last_name'),
                        'date_of_birth': serializer.validated_data.get('date_of_birth')
                    })

                user = UserService.create_user(**user_data)
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
                "id": user.id,
                "message": "Login successful",
                "user": {
                    "email": user.email,
                    "user_type": user.user_type,
                    "profile_picture": user.profile_picture.url if user.profile_picture else None,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "company_name": user.company_name if user.user_type == 'Company' else None
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
                reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
                
                # Send email with HTML formatting
                html_message = f"""
                <h3>Password Reset Request</h3>
                <p>You requested to reset your password. Click the link below to proceed:</p>
                <p><a href="{reset_link}">Reset Password</a></p>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p>The link will expire in 24 hours.</p>
                """
                
                send_mail(
                    'Password Reset Request',
                    f'Click the link to reset your password: {reset_link}',
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                    html_message=html_message
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
        print(request.data)
        serializer = UserProfileSerializer(instance=request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile Information has submitted   successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateBasicUserInfoView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def get(self, request):
        """Get user's basic information"""
        user = request.user
        serializer = UserProfileSerializer(user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        """Update user's basic information"""
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True, context={'request': request})
        print("####1")
        if serializer.is_valid():
            # Handle file uploads
            if 'profile_picture' in request.FILES:
                # Delete old profile picture if it exists
                if user.profile_picture:
                    user.profile_picture.delete(save=False)
                user.profile_picture = request.FILES['profile_picture']
            
            if 'cover_picture' in request.FILES:
                # Delete old cover picture if it exists
                if user.cover_picture:
                    user.cover_picture.delete(save=False)
                user.cover_picture = request.FILES['cover_picture']
            
            # Save the updated user data
            print("####2")
            serializer.save()
            UserService.update_user_embedding(user.id)
            print("####3")
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ViewOwnProfileView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def get(self, request):
        """Get the current user's profile"""
        user = request.user
        serializer = UserProfileSerializer(user, context={'request': request})
        return Response(serializer.data)

class ViewUserProfileView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def get(self, request, user_id):
        """Get another user's profile by ID"""
        try:
            user = User.objects.get(id=user_id)
            
            # Check if the profile is public or if the viewer is the profile owner
            if not user.is_profile_public and request.user.id != user_id:
                return Response(
                    {"detail": "This profile is private"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = UserProfileSerializer(user, context={'request': request})
            data = serializer.data
            
            # Filter out private information based on privacy settings
            if not user.show_email:
                data.pop('email', None)
            if not user.show_phone:
                data.pop('phone', None)
            if not user.show_skills:
                data.pop('skills', None)
            if not user.show_experience:
                data.pop('experience', None)
            if not user.show_education:
                data.pop('education', None)
            if not user.show_certifications:
                data.pop('certifications', None)
            if not user.show_recent_work:
                data.pop('recent_work', None)
            if not user.show_current_work:
                data.pop('current_work', None)
            
            return Response(data)
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class UpdatePrivacySettingsView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def get(self, request):
        user = request.user
        serializer = PrivacySettingsSerializer(user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        serializer = PrivacySettingsSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Privacy settings updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteUserAccountView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def delete(self, request):
        user = request.user
        try:
            # Call the service to delete the user
            response = UserService.delete_user(user.id)
            return Response(response, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class SearchProfilesView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def get(self, request):
        query = request.GET.get('query', '')
        if not query:
            return Response({"error": "Search query not provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Filter profiles by name, skills, or other fields
        users = User.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(skills__icontains=query)
        ).exclude(id=request.user.id)

        # Check privacy settings for each user
        result = []
        for user in users:
            if user.is_profile_public:
                # Respect privacy settings for individual fields
                user_data = {
                    "id": user.id,  # Add user ID
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
    
class FollowUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        try:
            user_to_follow = User.objects.get(id=user_id)
            current_user = request.user

            if current_user == user_to_follow:
                return Response(
                    {"error": "You cannot follow yourself"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if already following
            is_following = current_user.following.filter(id=user_to_follow.id).exists()

            if is_following:
                # Unfollow
                current_user.following.remove(user_to_follow)
                return Response({
                    "message": "Successfully unfollowed user",
                    "is_following": False,
                    "followers_count": user_to_follow.followers.count(),
                    "following_count": user_to_follow.following.count()
                })
            else:
                # Follow
                current_user.following.add(user_to_follow)
                
                # Create notification for the user being followed
                Notification.objects.create(
                    recipient=user_to_follow,
                    sender=current_user,
                    notification_type='NEW_FOLLOWER',
                    content='started following you',
                    related_object_id=current_user.id,
                    related_object_type='User'
                )
                
                return Response({
                    "message": "Successfully followed user",
                    "is_following": True,
                    "followers_count": user_to_follow.followers.count(),
                    "following_count": user_to_follow.following.count()
                })

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GetFollowersFollowingView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def get(self, request, user_id=None):
        try:
            # If user_id is provided, get that user's data, otherwise use the current user
            target_user = User.objects.get(id=user_id) if user_id else request.user
            
            # Get followers and following
            followers = target_user.followers.all()
            following = target_user.following.all()

            # Serialize the data
            follower_data = UserProfilePublicSerializer(followers, many=True).data
            following_data = UserProfilePublicSerializer(following, many=True).data

            # Return counts and data
            return Response({
                "followers": follower_data,
                "following": following_data,
                "followers_count": len(follower_data),
                "following_count": len(following_data)
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                # Add token to blacklist
                token.blacklist()
                return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        except TokenError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ConnectionRecommendationsView(APIView):
    permission_classes = [IsAuthenticated, IsNormalOrCompanyUser]

    def get(self, request):
        """
        Get personalized connection recommendations using hybrid approach:
        - Mutual connections
        - Profile similarity (embeddings)
        """
        try:
            limit = int(request.GET.get('limit', 5))
            use_hybrid = request.GET.get('hybrid', 'true').lower() == 'true'
            
            if use_hybrid:
                print("consolelog")
                recommendations = UserService.get_hybrid_recommendations(
                    user_id=request.user.id,
                    limit=limit
                )
                print(recommendations)
            else:
                
                recommendations = UserService.get_connection_recommendations(
                    user_id=request.user.id,
                    limit=limit
                )
            
            serializer = ConnectionRecommendationSerializer(
                recommendations,
                many=True,
                context={'request': request}
            )
            
            return Response(serializer.data)
            
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": "Failed to get recommendations"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
