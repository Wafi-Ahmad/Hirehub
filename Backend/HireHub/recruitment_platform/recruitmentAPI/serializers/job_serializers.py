from rest_framework import serializers
from ..models.job_model import JobPost
from ..constants import EMPLOYMENT_TYPES, LOCATION_TYPES, EXPERIENCE_LEVELS, JOB_STATUS_CHOICES
from django.utils import timezone
from datetime import datetime

class CreateJobSerializer(serializers.ModelSerializer):
    required_skills = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False
    )
    
    class Meta:
        model = JobPost
        fields = [
            'id',
            'title',
            'description',
            'required_skills',
            'experience_level',
            'employment_type',
            'location_type',
            'location',
            'salary_min',
            'salary_max',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        # Validate salary range
        salary_min = data.get('salary_min')
        salary_max = data.get('salary_max')
        
        if salary_min and salary_max and salary_min > salary_max:
            raise serializers.ValidationError(
                "Minimum salary cannot be greater than maximum salary"
            )
        
        return data

    def validate_required_skills(self, skills):
        if not skills:
            return []
            
        # Clean skills
        cleaned_skills = []
        for skill in skills:
            # Remove extra whitespace and convert to lowercase
            cleaned_skill = skill.strip().lower()
            if cleaned_skill and cleaned_skill not in cleaned_skills:
                cleaned_skills.append(cleaned_skill)
        
        return cleaned_skills

    def create(self, validated_data):
        skills = validated_data.pop('required_skills', [])
        instance = JobPost.objects.create(**validated_data)
        instance.required_skills = ','.join(skills)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        skills = validated_data.pop('required_skills', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if skills is not None:
            instance.required_skills = ','.join(skills)
        instance.save()
        return instance

class JobResponseSerializer(serializers.ModelSerializer):
    required_skills = serializers.SerializerMethodField()
    posted_by_name = serializers.SerializerMethodField()
    days_until_expiry = serializers.SerializerMethodField()
    company_name = serializers.CharField(source='posted_by.company_name', read_only=True)
    company_id = serializers.IntegerField(source='posted_by.id', read_only=True)
    is_saved = serializers.SerializerMethodField()
    is_recommended = serializers.BooleanField(default=False)
    
    class Meta:
        model = JobPost
        fields = [
            'id',
            'title',
            'description',
            'required_skills',
            'experience_level',
            'employment_type',
            'location_type',
            'location',
            'salary_min',
            'salary_max',
            'status',
            'posted_by_name',
            'days_until_expiry',
            'company_name',
            'company_id',
            'is_saved',
            'is_recommended',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'posted_by_name', 'days_until_expiry', 'created_at', 'updated_at', 'company_name', 'company_id', 'is_saved', 'is_recommended']

    def get_posted_by_name(self, obj):
        # Handle both model instances and dictionaries
        if isinstance(obj, dict):
            posted_by = obj.get('posted_by', None)
            if not posted_by:
                return ''
            if isinstance(posted_by, dict):
                return posted_by.get('company_name') or f"{posted_by.get('first_name', '')} {posted_by.get('last_name', '')}".strip() or posted_by.get('email', '')
            return ''
        
        # Handle model instance
        if obj.posted_by:
            if hasattr(obj.posted_by, 'company_name') and obj.posted_by.company_name:
                return obj.posted_by.company_name
            return f"{obj.posted_by.first_name} {obj.posted_by.last_name}".strip() or obj.posted_by.email
        return ''

    def get_days_until_expiry(self, obj):
        # Handle both model instances and dictionaries
        if isinstance(obj, dict):
            expires_at = obj.get('expires_at')
        else:
            expires_at = getattr(obj, 'expires_at', None)
            
        if expires_at:
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            delta = expires_at - timezone.now()
            return max(0, delta.days)
        return None

    def get_required_skills(self, obj):
        # Handle both model instances and dictionaries
        if isinstance(obj, dict):
            skills = obj.get('required_skills', '')
        else:
            skills = getattr(obj, 'required_skills', '')
            
        if not skills:
            return []
            
        if isinstance(skills, list):
            return skills
            
        return [skill.strip() for skill in skills.split(',') if skill.strip()]

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
            
        if isinstance(obj, dict):
            saved_by = obj.get('saved_by', [])
            return request.user.id in saved_by
            
        return request.user in obj.saved_by.all()

class JobSearchSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    location = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    employment_type = serializers.ChoiceField(choices=EMPLOYMENT_TYPES, required=False)
    experience_level = serializers.ChoiceField(choices=EXPERIENCE_LEVELS, required=False)
    salary_min = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    salary_max = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

class JobFeedbackSerializer(serializers.Serializer):
    is_positive = serializers.BooleanField(required=True)
    feedback_text = serializers.CharField(required=False, allow_blank=True)