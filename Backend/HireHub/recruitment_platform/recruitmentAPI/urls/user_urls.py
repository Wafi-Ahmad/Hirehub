from django.urls import path
from ..views.user_views import (
    RegisterUserView, CustomLoginUserView, UpdateUserInterestsView,
    PasswordResetRequestView, PasswordResetConfirmView, UpdateUserProfileView,
    UpdateBasicUserInfoView, UpdatePrivacySettingsView, DeleteUserAccountView,
    ViewOwnProfileView, ViewUserProfileView, SearchProfilesView, SomeNormalUserView, SomeCompanyUserView,FollowUserView,
    GetFollowersFollowingView, LogoutView, ConnectionRecommendationsView, HandleFollowRequestView, CancelFollowRequestView,
    GetNotificationsView
)
from ..views import cv_views

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register_user'),
    path('login/', CustomLoginUserView.as_view(), name='login_user'),
    path('update-interests/', UpdateUserInterestsView.as_view(), name='update_user_interests'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('reset-password-confirm/<uidb64>/<token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('update-profile/', UpdateUserProfileView.as_view(), name='update_user_profile'),
    path('update-basic-info/', UpdateBasicUserInfoView.as_view(), name='update_basic_user_info'),
    path('update-privacy/', UpdatePrivacySettingsView.as_view(), name='update_privacy_settings'),
    path('delete-account/', DeleteUserAccountView.as_view(), name='delete_user_account'),
    path('profile/me/', ViewOwnProfileView.as_view(), name='view_own_profile'),
    path('profile/<int:user_id>/', ViewUserProfileView.as_view(), name='view_user_profile'),
    path('search-profiles/', SearchProfilesView.as_view(), name='search_user_profiles'),
    path('normal-user-action/', SomeNormalUserView.as_view(), name='normal_user_action'),
    path('company-user-action/', SomeCompanyUserView.as_view(), name='company_user_action'),
    path('follow/<int:user_id>/', FollowUserView.as_view(), name='follow-user'),
    path('follow-request/<int:notification_id>/', HandleFollowRequestView.as_view(), name='handle-follow-request'),
    path('<int:user_id>/cancel-follow-request/', CancelFollowRequestView.as_view(), name='cancel-follow-request'),
    path('<int:user_id>/followers-following/', GetFollowersFollowingView.as_view(), name='followers-following'),
    path('me/followers-following/', GetFollowersFollowingView.as_view(), name='followers-following-me'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('followers-following/', GetFollowersFollowingView.as_view(), name='followers-following'),
    path('recommendations/', ConnectionRecommendationsView.as_view(), name='connection-recommendations'),
    path('cv/', cv_views.CVUploadView.as_view(), name='cv-upload'),
    path('notifications/', GetNotificationsView.as_view(), name='notifications'),
]
    