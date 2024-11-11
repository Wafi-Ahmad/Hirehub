from django.urls import path
from recruitmentAPI.views.user_views import (
    RegisterUserView, CustomLoginUserView, UpdateUserInterestsView,
    PasswordResetRequestView, PasswordResetConfirmView, UpdateUserProfileView,
    UpdateBasicUserInfoView, UpdatePrivacySettingsView, DeleteUserAccountView,
    ViewUserProfileView, SearchProfilesView, SomeNormalUserView, SomeCompanyUserView
)
from recruitmentAPI.views.connection_views import SendConnectionRequestView, HandleConnectionRequestView

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
    path('view-profile/<int:user_id>/', ViewUserProfileView.as_view(), name='view_user_profile'),
    path('search-profiles/', SearchProfilesView.as_view(), name='search_user_profiles'),
    path('normal-user-action/', SomeNormalUserView.as_view(), name='normal_user_action'),
    path('company-user-action/', SomeCompanyUserView.as_view(), name='company_user_action'),
    path('connections/send/<int:receiver_id>/', SendConnectionRequestView.as_view(), name='send_connection_request'),
    path('connections/handle/<int:request_id>/', HandleConnectionRequestView.as_view(), name='handle_connection_request'),
]
