from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from ..models.interview_model import Interview
from ..models.job_model import JobPost
from ..serializers.interview_serializers import InterviewSerializer, ScheduleInterviewSerializer
from ..services.interview_services import InterviewService
from ..permissions import IsCompanyUser

class ScheduleInterviewView(APIView):
    """API view for scheduling an interview"""
    permission_classes = [IsAuthenticated, IsCompanyUser]
    
    def post(self, request, job_id, applicant_id):
        try:
            # Get job and verify ownership
            job = get_object_or_404(JobPost, id=job_id)
            
            # Check if company owns the job
            if job.posted_by.id != request.user.id and job.posted_by.id != request.user.company_id:
                return Response(
                    {"error": "You do not have permission to schedule interviews for this job"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Validate and prepare data
            serializer = ScheduleInterviewSerializer(
                data=request.data,
                context={"job": job, "request": request}
            )
            serializer.is_valid(raise_exception=True)
            
            # Determine the interviewer ID
            interviewer_object = serializer.validated_data.get('interviewer')
            if interviewer_object:
                interviewer_id_to_use = interviewer_object.id
            else:
                interviewer_id_to_use = request.user.id

            # Use service to schedule interview
            interview = InterviewService.schedule_interview(
                job_id=job_id,
                applicant_id=applicant_id,
                interviewer_id=interviewer_id_to_use,
                data=serializer.validated_data
            )
            
            # Return response
            response_serializer = InterviewSerializer(interview)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class InterviewListView(generics.ListAPIView):
    """API view for listing interviews"""
    permission_classes = [IsAuthenticated]
    serializer_class = InterviewSerializer
    
    def get_queryset(self):
        """Get interviews based on user role"""
        user = self.request.user
        
        # If company user, get interviews for jobs they posted
        if user.user_type == 'Company':
            return Interview.objects.filter(
                job__posted_by=user
            ).select_related('job', 'applicant', 'interviewer').order_by('-scheduled_date')
        
        # If normal user, get interviews they are involved in
        return Interview.objects.filter(
            applicant=user
        ).select_related('job', 'applicant', 'interviewer').order_by('-scheduled_date')

class JobInterviewsView(generics.ListAPIView):
    """API view for listing interviews for a specific job"""
    permission_classes = [IsAuthenticated, IsCompanyUser]
    serializer_class = InterviewSerializer
    
    def get_queryset(self):
        """Get interviews for a specific job"""
        job_id = self.kwargs.get('job_id')
        job = get_object_or_404(JobPost, id=job_id)
        
        # Verify ownership
        user = self.request.user
        if job.posted_by.id != user.id and job.posted_by.id != user.company_id:
            return Interview.objects.none()
        
        return InterviewService.get_job_interviews(job_id)

class InterviewDetailView(APIView):
    """API view for retrieving, updating, or deleting an interview"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, interview_id):
        try:
            interview = InterviewService.get_interview_by_id(interview_id)
            
            # Check permissions
            user = request.user
            if (user.id != interview.applicant.id and 
                user.id != interview.interviewer.id and
                user.id != interview.job.posted_by.id and
                user.company_id != interview.job.posted_by.id):
                return Response(
                    {"error": "You do not have permission to view this interview"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = InterviewSerializer(interview, context={"request": request})
            return Response(serializer.data)
            
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, interview_id):
        try:
            interview = InterviewService.get_interview_by_id(interview_id)
            
            # Check permissions (only company/interviewer can update)
            user = request.user
            if (user.id != interview.interviewer.id and
                user.id != interview.job.posted_by.id and
                user.company_id != interview.job.posted_by.id):
                return Response(
                    {"error": "You do not have permission to update this interview"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Handle reschedule
            if 'scheduled_date' in request.data:
                interview = InterviewService.reschedule_interview(
                    interview_id=interview_id,
                    new_date=request.data['scheduled_date'],
                    update_meeting=request.data.get('update_meeting', True)
                )
            
            # Handle status change
            if 'status' in request.data:
                if request.data['status'] == Interview.STATUS_COMPLETED:
                    interview = InterviewService.mark_interview_completed(
                        interview_id=interview_id,
                        notes=request.data.get('notes')
                    )
                elif request.data['status'] == Interview.STATUS_CANCELLED:
                    interview = InterviewService.cancel_interview(
                        interview_id=interview_id,
                        reason=request.data.get('cancellation_reason')
                    )
            
            serializer = InterviewSerializer(interview)
            return Response(serializer.data)
            
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, interview_id):
        try:
            interview = InterviewService.get_interview_by_id(interview_id)
            
            # Check permissions (only company/interviewer can delete)
            user = request.user
            if (user.id != interview.interviewer.id and
                user.id != interview.job.posted_by.id and
                user.company_id != interview.job.posted_by.id):
                return Response(
                    {"error": "You do not have permission to delete this interview"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Cancel instead of delete
            InterviewService.cancel_interview(
                interview_id=interview_id,
                reason="Interview cancelled by administrator"
            )
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UpcomingInterviewsView(APIView):
    """API view for listing upcoming interviews for the current user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            interviews = InterviewService.get_upcoming_interviews(request.user.id)
            serializer = InterviewSerializer(interviews, many=True, context={"request": request})
            return Response(serializer.data)
            
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CompletedInterviewsView(APIView):
    """API view for listing completed interviews for the current user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            interviews = InterviewService.get_completed_interviews(request.user.id)
            serializer = InterviewSerializer(interviews, many=True, context={"request": request})
            return Response(serializer.data)
            
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST) 