from django.contrib.auth import get_user_model
from recruitmentAPI.models.role_model import Role

class RoleService:
    @staticmethod
    def assign_role(user_id, role):
        User = get_user_model()
        try:
            user = User.objects.get(pk=user_id)
            if user.user_type != User.NORMAL_USER:
                raise ValueError("Only normal users can be assigned roles.")
            Role.objects.update_or_create(user=user, defaults={'role': role})
            return {"message": f"Role {role} assigned to {user.full_name}."}
        except User.DoesNotExist:
            raise ValueError("User not found")

    @staticmethod
    def remove_role(user_id):
        try:
            role = Role.objects.get(user_id=user_id)
            role.delete()
            return {"message": "Role removed successfully."}
        except Role.DoesNotExist:
            raise ValueError("Role not found for this user")