from rest_framework import serializers
from django.utils import timezone
from ..models.interview_model import Interview
from ..models import User

class InterviewSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    applicant_name = serializers.SerializerMethodField()
    interviewer_name = serializers.SerializerMethodField()
    company_name = serializers.CharField(source='job.posted_by.company_name', read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Interview
        fields = [
            'id',
            'job',
            'job_title',
            'applicant',
            'applicant_name',
            'interviewer',
            'interviewer_name',
            'company_name',
            'scheduled_date',
            'duration_minutes',
            'platform',
            'meeting_link',
            'meeting_id',
            'meeting_password',
            'status',
            'notes',
            'created_at',
            'updated_at',
            'is_recorded',
            'recording_url',
            'is_upcoming'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'recording_url']
    
    def get_applicant_name(self, obj):
        if not obj.applicant:
            return ''
        return f"{obj.applicant.first_name} {obj.applicant.last_name}".strip() or obj.applicant.email
    
    def get_interviewer_name(self, obj):
        if not obj.interviewer:
            return ''
        return f"{obj.interviewer.first_name} {obj.interviewer.last_name}".strip() or obj.interviewer.email
    
    def validate_scheduled_date(self, value):
        """Validate that scheduled date is in the future"""
        if value < timezone.now():
            raise serializers.ValidationError("Interview date must be in the future")
        return value
    
    def to_representation(self, instance):
        """Add dynamic fields to the serialized representation"""
        representation = super().to_representation(instance)
        representation['is_upcoming'] = instance.is_upcoming()
        
        # Customize fields based on user role
        request = self.context.get('request')
        if request and request.user:
            if request.user.id == instance.applicant.id:
                # For applicants, hide certain fields
                representation.pop('notes', None)
            elif request.user.id != instance.interviewer.id and not request.user.is_staff:
                # For users not involved in the interview, hide certain fields
                representation.pop('meeting_password', None)
                
        return representation

class ScheduleInterviewSerializer(serializers.ModelSerializer):
    interviewer = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        required=False,
        allow_null=True
    )
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Interview
        fields = [
            'interviewer',
            'scheduled_date',
            'duration_minutes',
            'platform',
            'notes'
        ]
        
    def validate_interviewer(self, value):
        """Validate that interviewer is from the same company as the job."""
        if value is None:
            return None

        job = self.context.get('job')
        if job and value.id != job.posted_by.id and value.company_id != job.posted_by.id:
            raise serializers.ValidationError("Interviewer must belong to the company that posted the job.")
        return value
        
    def validate_scheduled_date(self, value):
        """Validate that scheduled date is in the future"""
        if value < timezone.now():
            raise serializers.ValidationError("Interview date must be in the future")
        return value 