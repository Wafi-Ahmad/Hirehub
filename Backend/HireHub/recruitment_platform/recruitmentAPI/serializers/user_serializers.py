from rest_framework import serializers

from django.contrib.auth.hashers import check_password

from recruitmentAPI.serializers.json_list_field import JSONListField
from ..models.user_model import User  # Use relative import

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'user_type', 'company_name', 'first_name', 'last_name', 'date_of_birth']

    def validate(self, data):
        user_type = data.get('user_type')
        
        if user_type == 'Company':
            # Validate company user
            if not data.get('company_name'):
                raise serializers.ValidationError({'company_name': 'Company name is required for company users'})
            
            # Remove individual user fields for company
            if 'first_name' in data:
                del data['first_name']
            if 'last_name' in data:
                del data['last_name']
            if 'date_of_birth' in data:
                del data['date_of_birth']
                
        elif user_type == 'Normal':
            # Validate normal user
            if not data.get('first_name'):
                raise serializers.ValidationError({'first_name': 'First name is required for individual users'})
            if not data.get('last_name'):
                raise serializers.ValidationError({'last_name': 'Last name is required for individual users'})
            
            # Remove company fields
            if 'company_name' in data:
                del data['company_name']
        
        return data

    def create(self, validated_data):
        user = User(
            email=validated_data['email'],
            user_type=validated_data['user_type']
        )
        
        if user.user_type == 'Company':
            user.company_name = validated_data['company_name']
        else:
            user.first_name = validated_data['first_name']
            user.last_name = validated_data['last_name']
            if 'date_of_birth' in validated_data:
                user.date_of_birth = validated_data['date_of_birth']
            
        user.set_password(validated_data['password'])
        user.save()
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
            "user_type": user.user_type,
            "profile_picture": user.profile_picture.url if user.profile_picture else None,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "company_name": user.company_name if user.user_type == 'Company' else None
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
    profile_picture = serializers.SerializerMethodField()
    cover_picture = serializers.SerializerMethodField()
    skills = JSONListField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'user_type',
            # Company specific fields
            'company_name', 'industry', 'company_size', 'about_company', 'specializations',
            # Normal user specific fields
            'first_name', 'last_name',
            # Common fields
            'profile_picture', 'cover_picture',
            'bio', 'location', 'website',
            'headline', 'skills', 'experience',
            'education', 'certifications',
            'recent_work', 'current_work',
            'phone', 'linkedin_url', 'github_url',
            'is_profile_public', 'show_email', 'show_phone',
            'show_skills', 'show_experience', 'show_education',
            'show_certifications', 'show_recent_work', 'show_current_work'
        ]
        read_only_fields = ['id', 'email', 'user_type']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.user_type == 'Company':
            # Remove individual user fields for company
            fields_to_remove = ['first_name', 'last_name', 'date_of_birth']
            for field in fields_to_remove:
                data.pop(field, None)
            # Ensure company_name is included
            data['company_name'] = instance.company_name
        else:
            # Remove company fields for individual users
            fields_to_remove = ['company_name', 'industry', 'company_size', 'about_company', 'specializations']
            for field in fields_to_remove:
                data.pop(field, None)
        return data

    def get_profile_picture(self, obj):
        if obj.profile_picture and hasattr(obj.profile_picture, 'url'):
            return self.context['request'].build_absolute_uri(obj.profile_picture.url)
        return None

    def get_cover_picture(self, obj):
        if obj.cover_picture and hasattr(obj.cover_picture, 'url'):
            return self.context['request'].build_absolute_uri(obj.cover_picture.url)
        return None

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
        fields = [
            'id', 'email', 'first_name', 'last_name', 'profile_picture',
            'company_name', 'industry', 'company_size', 'bio',
            'skills', 'experience', 'recent_work', 'current_work',
            'contact_details', 'user_type'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not instance.is_profile_public:
            return {'error': 'This profile is private'}
        
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
        fields = ['id', 'email', 'first_name', 'last_name', 'profile_picture', 'user_type', 'company_name']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.user_type == 'Company':
            # Remove individual user fields for company
            data.pop('first_name', None)
            data.pop('last_name', None)
        else:
            # Remove company fields for individual users
            data.pop('company_name', None)
        return data

class ConnectionRecommendationSerializer(serializers.ModelSerializer):
    mutual_connections_count = serializers.IntegerField(read_only=True)
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 
            'profile_picture', 'current_work', 
            'headline', 'mutual_connections_count'
        ]

    def get_profile_picture(self, obj):
        if obj.profile_picture and hasattr(obj.profile_picture, 'url'):
            return self.context['request'].build_absolute_uri(obj.profile_picture.url)
        return None
