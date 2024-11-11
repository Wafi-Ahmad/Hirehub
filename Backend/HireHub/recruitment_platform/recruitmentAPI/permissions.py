from rest_framework.permissions import BasePermission

class IsNormalUser(BasePermission):
    """
    Allows access only to normal users.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'Normal'

class IsCompanyUser(BasePermission):
    """
    Allows access only to company users.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'Company'
