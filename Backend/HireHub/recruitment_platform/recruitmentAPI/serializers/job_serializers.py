from rest_framework import serializers
from ..constants import EMPLOYMENT_TYPES, LOCATION_TYPES, EXPERIENCE_LEVELS, JOB_STATUS_CHOICES
from ..models.job_model import JobPost
from django.utils import timezone

class CreateJobSerializer(serializers.ModelSerializer):
    required_skills = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True
    )

    class Meta:
        model = JobPost
        fields = [
            'title',
            'description',
            'required_skills',
            'employment_type',
            'salary_min',
            'salary_max',
            'location_type',
            'location',
            'experience_level',
        ]

    def validate(self, data):
        # Validate salary range
        if data.get('salary_min') and data.get('salary_max'):
            if data['salary_min'] > data['salary_max']:
                raise serializers.ValidationError({
                    'salary_range': 'Minimum salary cannot be greater than maximum salary'
                })

        # Validate required skills
        if not data.get('required_skills'):
            raise serializers.ValidationError({
                'required_skills': 'At least one skill is required'
            })

        return data

    def validate_required_skills(self, value):
        """Clean and validate skills"""
        if not value:
            raise serializers.ValidationError("At least one skill is required")
        
        # Clean and deduplicate skills while preserving case
        cleaned_skills = []
        seen_skills = set()
        
        for skill in value:
            cleaned = skill.strip()
            if cleaned and cleaned.lower() not in seen_skills:
                cleaned_skills.append(cleaned)
                seen_skills.add(cleaned.lower())
        
        return cleaned_skills

    def create(self, validated_data):
        skills = validated_data.pop('required_skills', [])
        instance = super().create(validated_data)
        instance.set_required_skills(skills)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        skills = validated_data.pop('required_skills', None)
        instance = super().update(instance, validated_data)
        if skills is not None:
            instance.set_required_skills(skills)
            instance.save()
        return instance

class JobSearchSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True, allow_null=True, min_length=None)
    location = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    employment_type = serializers.ChoiceField(choices=EMPLOYMENT_TYPES, required=False, allow_null=True, allow_blank=True)
    location_type = serializers.ChoiceField(choices=LOCATION_TYPES, required=False, allow_null=True, allow_blank=True)
    experience_level = serializers.ChoiceField(choices=EXPERIENCE_LEVELS, required=False, allow_null=True, allow_blank=True)
    min_salary = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    max_salary = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    skills = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True,
        default=list,
        max_length=10
    )

    def validate(self, data):
        # Validate salary range if both are provided
        if data.get('min_salary') and data.get('max_salary'):
            if data['min_salary'] > data['max_salary']:
                raise serializers.ValidationError({
                    'salary_range': 'Minimum salary cannot be greater than maximum salary'
                })
        return data

    def validate_title(self, value):
        if value:
            return value.strip()
        return ''

    def validate_skills(self, value):
        if value:
            # Clean skills and validate length
            cleaned_skills = []
            seen = set()
            for skill in value:
                cleaned = skill.strip()
                if len(cleaned) > 50:
                    raise serializers.ValidationError("Each skill must be 50 characters or less")
                if cleaned and cleaned.lower() not in seen:
                    cleaned_skills.append(cleaned)
                    seen.add(cleaned.lower())
            if len(cleaned_skills) > 10:
                raise serializers.ValidationError("Maximum 10 skills allowed")
            return cleaned_skills
        return []

class JobResponseSerializer(serializers.ModelSerializer):
    required_skills = serializers.SerializerMethodField(read_only=True)  # Will receive list from service layer
    posted_by_name = serializers.CharField(read_only=True)
    company_name = serializers.CharField(read_only=True)
    company_id = serializers.IntegerField(read_only=True)
    ai_matching_score = serializers.FloatField(read_only=True)
    is_saved = serializers.SerializerMethodField()
    days_until_expiry = serializers.SerializerMethodField()
    
    class Meta:
        model = JobPost
        fields = [
            'id',
            'title',
            'description',
            'required_skills',
            'employment_type',
            'salary_min',
            'salary_max',
            'location_type',
            'location',
            'experience_level',
            'status',
            'is_active',
            'posted_by_name',
            'company_name',
            'company_id',
            'created_at',
            'expires_at',
            'ai_matching_score',
            'is_saved',
            'days_until_expiry'
        ]

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user.saved_jobs.filter(id=obj.id).exists()
        return False

    def get_days_until_expiry(self, obj):
        if isinstance(obj, JobPost) and obj.expires_at:
            now = timezone.now()
            if obj.expires_at > now:
                return (obj.expires_at - now).days
        if isinstance(obj, dict) and obj.get('expires_at'):
            now = timezone.now()
            # '>' not supported between instances of 'str' and 'datetime.datetime'
            # Convert to datetime.datetime
            from django.utils.dateparse import parse_datetime
            expires_at = parse_datetime(obj.get('expires_at'))
            if expires_at > now:
                return (expires_at - now).days
        return 0
    
    def get_required_skills(self, obj):
        """Convert stored skills string to list, handling both model instances and dicts"""
        if isinstance(obj, dict):
            skills_str = obj.get('required_skills', '')
        else:
            skills_str = obj.required_skills

        if not skills_str:
            return []
            
        # Split by comma and clean each skill
        return [skill.strip() for skill in skills_str.split(',') if skill.strip()]


class JobFeedbackSerializer(serializers.Serializer):
    is_positive = serializers.BooleanField(required=True)
    feedback_text = serializers.CharField(required=False, allow_blank=True)