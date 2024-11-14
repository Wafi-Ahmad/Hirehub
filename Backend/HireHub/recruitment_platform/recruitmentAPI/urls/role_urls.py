from django.urls import path
from recruitmentAPI.views.role_views import AssignRoleView, RemoveRoleView

urlpatterns = [
    path('assign-role/', AssignRoleView.as_view(), name='assign_role'),
    path('remove-role/<int:user_id>/', RemoveRoleView.as_view(), name='remove_role'),
]