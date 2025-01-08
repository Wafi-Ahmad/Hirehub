from rest_framework import permissions
from .models.user_model import User

class IsNormalUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.user_type == User.NORMAL_USER

class IsCompanyUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.user_type == User.COMPANY_USER

class IsNormalOrCompanyUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.user_type in [User.NORMAL_USER, User.COMPANY_USER]

class IsJobOwner(permissions.BasePermission):
    """
    Custom permission to only allow company owners of a job to edit or delete it.
    """
    def has_permission(self, request, view):
        # First check if user is a company
        return request.user.user_type == User.COMPANY_USER

    def has_object_permission(self, request, view, obj):
        # Check if user is both a company and the job owner
        return (request.user.user_type == User.COMPANY_USER and 
                obj.posted_by == request.user)