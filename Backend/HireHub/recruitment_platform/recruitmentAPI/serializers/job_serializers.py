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

class JobSearchSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    employment_type = serializers.ChoiceField(choices=EMPLOYMENT_TYPES, required=False)
    location_type = serializers.ChoiceField(choices=LOCATION_TYPES, required=False)
    experience_level = serializers.ChoiceField(choices=EXPERIENCE_LEVELS, required=False)
    min_salary = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    max_salary = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    skills = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )

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
        # 'ReturnDict' object has no attribute 'required_skills'
        if isinstance(obj, dict):
            return obj.get('required_skills', [])
        return obj.required_skills.split(',')


class JobFeedbackSerializer(serializers.Serializer):
    is_positive = serializers.BooleanField(required=True)
    feedback_text = serializers.CharField(required=False, allow_blank=True)