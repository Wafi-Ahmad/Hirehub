from django.urls import path
from ..views.interview_views import (
    ScheduleInterviewView,
    InterviewListView,
    JobInterviewsView,
    InterviewDetailView,
    UpcomingInterviewsView,
    CompletedInterviewsView
)

urlpatterns = [
    # Schedule interview for a job applicant
    path('schedule/<int:job_id>/<int:applicant_id>/', ScheduleInterviewView.as_view(), name='schedule-interview'),
    
    # List interviews for a specific job
    path('job/<int:job_id>/', JobInterviewsView.as_view(), name='job-interviews'),
    
    # List all interviews for current user
    path('', InterviewListView.as_view(), name='interview-list'),
    
    # Get, update, or delete a specific interview
    path('<int:interview_id>/', InterviewDetailView.as_view(), name='interview-detail'),
    
    # List upcoming interviews for current user
    path('upcoming/', UpcomingInterviewsView.as_view(), name='upcoming-interviews'),
    
    # List completed interviews for current user
    path('completed/', CompletedInterviewsView.as_view(), name='completed-interviews'),
] 