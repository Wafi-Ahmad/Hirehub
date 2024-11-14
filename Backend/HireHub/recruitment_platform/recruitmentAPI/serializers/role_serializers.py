from rest_framework import serializers
from recruitmentAPI.models.role_model import Role

class RoleAssignmentSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    role = serializers.ChoiceField(choices=Role.ROLE_CHOICES)

    def validate_user_id(self, value):
        from recruitmentAPI.models.user_model import User
        try:
            user = User.objects.get(id=value)
            if user.user_type != 'Normal':
                raise serializers.ValidationError("Only normal users can be assigned roles.")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")

class RoleRemovalSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        from recruitmentAPI.models.role_model import Role
        if not Role.objects.filter(user_id=value).exists():
            raise serializers.ValidationError("Role not found for this user.")
        return value