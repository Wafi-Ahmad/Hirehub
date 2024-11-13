from rest_framework import permissions

class IsNormalUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.user_type == 'Normal'

class IsCompanyUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.user_type == 'Company'

class IsNormalOrCompanyUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.user_type in ['Normal', 'Company']