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

class IsJobOwner(permissions.BasePermission):
    """
    Custom permission to only allow company owners of a job to edit or delete it.
    """
    def has_permission(self, request, view):
        # First check if user is a company
        return request.user.user_type == 'Company'

    def has_object_permission(self, request, view, obj):
        # Check if user is both a company and the job owner
        return (request.user.user_type == 'Company' and 
                obj.posted_by == request.user)