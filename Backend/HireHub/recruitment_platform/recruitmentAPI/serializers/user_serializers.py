from rest_framework import serializers

from django.contrib.auth.hashers import check_password
from ..models.user_model import User  # Use relative import

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'date_of_birth', 'company_name', 'user_type']

    def create(self, validated_data):
        user = User(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            date_of_birth=validated_data.get('date_of_birth'),
            company_name=validated_data.get('company_name'),
            user_type=validated_data['user_type'],
        )
        user.set_password(validated_data['password'])
        return user
    

class CustomLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        try:
            # Check if the user exists
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")

        # Verify the password
        if not check_password(password, user.password):
            raise serializers.ValidationError("Invalid email or password.")

        # Return user information if successful
        return {
            "email": user.email,
            "user_type": user.user_type
        }    

class UserInterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'preferred_job_category', 'preferred_job_type', 
            'desired_salary_range', 'preferred_location'
        ]

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'skills', 'experience', 'recent_work', 
            'current_work', 'contact_details'
        ]

class PrivacySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'is_profile_public', 'show_email', 'show_skills', 
            'show_experience', 'show_recent_work', 'show_current_work'
        ]

class UserProfilePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'profile_picture', 'skills', 'experience', 'recent_work', 'current_work', 'contact_details', 'email']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        # Check privacy settings and remove fields accordingly
        if not instance.is_profile_public:
            return {"message": "This profile is private."}

        if not instance.show_email:
            data.pop('email', None)
        if not instance.show_skills:
            data.pop('skills', None)
        if not instance.show_experience:
            data.pop('experience', None)
        if not instance.show_recent_work:
            data.pop('recent_work', None)
        if not instance.show_current_work:
            data.pop('current_work', None)
        if not instance.contact_details:
            data.pop('contact_details', None)

        return data
    
class FollowUserSerializer(serializers.Serializer):
    user_to_follow = serializers.IntegerField()

    def validate_user_to_follow(self, value):
        try:
            user = User.objects.get(id=value)
            if user == self.context['request'].user:
                raise serializers.ValidationError("You cannot follow yourself.")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")
    
class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'profile_picture']
    
