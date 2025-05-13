from datetime import datetime, timedelta
import logging
import json
import uuid # For generating unique request IDs
import requests
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q

# Google API Imports
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from ..models.interview_model import Interview
from ..models.job_model import JobPost
from ..models import User
from ..services.notification_services import NotificationService

logger = logging.getLogger(__name__)

# Define the SCOPES for Google Calendar API
CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events']

class InterviewService:
    """Service class for interview scheduling and management"""
    
    @classmethod
    @transaction.atomic
    def schedule_interview(cls, job_id, applicant_id, interviewer_id, data):
        """
        Schedule a new interview
        
        Args:
            job_id: ID of the job
            applicant_id: ID of the applicant
            interviewer_id: ID of the interviewer
            data: Dictionary containing interview details
        
        Returns:
            Interview object
        """
        try:
            job = JobPost.objects.get(id=job_id)
            applicant = User.objects.get(id=applicant_id)
            interviewer = User.objects.get(id=interviewer_id)
            
            # Validate that interviewer belongs to the company
            if interviewer.id != job.posted_by.id and interviewer.company_id != job.posted_by.id:
                raise ValidationError("Interviewer must belong to the company that posted the job")
            
            # Create interview object
            interview = Interview(
                job=job,
                applicant=applicant,
                interviewer=interviewer,
                scheduled_date=data['scheduled_date'],
                duration_minutes=data.get('duration_minutes', 30),
                platform=data.get('platform', Interview.PLATFORM_ZOOM),
                notes=data.get('notes', ''),
                status=Interview.STATUS_SCHEDULED
            )
            
            # Generate meeting link based on platform
            if interview.platform == Interview.PLATFORM_ZOOM:
                cls._generate_zoom_meeting(interview)
            elif interview.platform == Interview.PLATFORM_GOOGLE_MEET:
                cls._generate_google_meet(interview)
            
            interview.save()
            
            # Send notifications
            cls._send_interview_notifications(interview)
            
            return interview
            
        except (JobPost.DoesNotExist, User.DoesNotExist) as e:
            logger.error(f"Error scheduling interview: {str(e)}")
            raise ValidationError(str(e))
        except Exception as e:
            logger.error(f"Unexpected error scheduling interview: {str(e)}")
            raise ValidationError(f"Failed to schedule interview: {str(e)}")
    
    @classmethod
    def _generate_zoom_meeting(cls, interview):
        """
        Generate Zoom meeting link and details
        
        In production, this would use the Zoom API to create meetings,
        but for this implementation, we'll use placeholder values
        """
        # In a real implementation, this would call the Zoom API
        # For now, we'll just set placeholder values
        
        # TODO: Replace with actual Zoom API integration
        interview.meeting_link = f"https://zoom.us/j/123456789?pwd=placeholder"
        interview.meeting_id = "123456789"
        interview.meeting_password = "password123"
        
        return interview
    
    @classmethod
    def _generate_google_meet(cls, interview):
        """Generate Google Meet link by creating a Google Calendar event."""
        try:
            if not settings.GOOGLE_CREDENTIALS_FILE_PATH:
                logger.error("Google credentials file path not configured.")
                # Fallback to placeholder or raise error
                interview.meeting_link = "https://meet.google.com/placeholder-credentials-missing"
                interview.meeting_id = "placeholder-credentials-missing"
                return interview

            creds = service_account.Credentials.from_service_account_file(
                settings.GOOGLE_CREDENTIALS_FILE_PATH,
                scopes=CALENDAR_SCOPES,
                subject='platformhirehub@gmail.com'
            )
            service = build('calendar', 'v3', credentials=creds)

            start_time = interview.scheduled_date
            end_time = interview.scheduled_date + timedelta(minutes=interview.duration_minutes)

            event_summary = f"Interview: {interview.job.title} with {interview.applicant.first_name or interview.applicant.email}"
            
            attendees_list = []
            if interview.applicant and interview.applicant.email:
                attendees_list.append({'email': interview.applicant.email})
            if interview.interviewer and interview.interviewer.email:
                attendees_list.append({'email': interview.interviewer.email})
            # You might want to add the job poster/company email as an attendee too
            # if interview.job.posted_by and interview.job.posted_by.email:
            #     attendees_list.append({'email': interview.job.posted_by.email})

            event = {
                'summary': event_summary,
                'description': f'Interview for the position of {interview.job.title}.\nApplicant: {interview.applicant.first_name or interview.applicant.email}\nInterviewer: {interview.interviewer.first_name or interview.interviewer.email}',
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': str(start_time.tzinfo or timezone.get_current_timezone()), # Ensure timezone aware
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': str(end_time.tzinfo or timezone.get_current_timezone()), # Ensure timezone aware
                },
                'attendees': attendees_list,
                'conferenceData': {
                    'createRequest': {
                        'requestId': str(uuid.uuid4()), # Unique ID for the Meet creation request
                        'conferenceSolutionKey': {
                            'type': 'hangoutsMeet'
                        }
                    }
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},
                        {'method': 'popup', 'minutes': 30},
                    ],
                },
            }

            # Use 'primary' for the service account's own calendar.
            # Or, use a specific calendarId if the service account has access to it.
            calendar_id = 'primary' 
            created_event = service.events().insert(calendarId=calendar_id, body=event,
                                                 sendNotifications=True, # Send email notifications to attendees
                                                 conferenceDataVersion=1).execute()

            interview.meeting_link = created_event.get('hangoutLink')
            interview.meeting_id = created_event.get('conferenceData', {}).get('conferenceId')
            # Optionally, store the Google Calendar event ID if you need to update/delete it later
            # interview.google_calendar_event_id = created_event.get('id')
            logger.info(f"Successfully created Google Meet event: {interview.meeting_link}")

        except HttpError as error:
            logger.error(f"An API error occurred while creating Google Meet: {error}")
            # Fallback or re-raise
            interview.meeting_link = "https://meet.google.com/placeholder-api-error"
            interview.meeting_id = "placeholder-api-error"
        except Exception as e:
            logger.error(f"Unexpected error creating Google Meet: {str(e)}")
            # Fallback or re-raise
            interview.meeting_link = "https://meet.google.com/placeholder-general-error"
            interview.meeting_id = "placeholder-general-error"
        
        return interview
    
    @classmethod
    def _send_interview_notifications(cls, interview):
        """Send email and in-app notifications for interview"""
        # Create in-app notification for applicant
        NotificationService.create_notification(
            recipient=interview.applicant,
            sender=interview.interviewer,
            notification_type='INTERVIEW_SCHEDULED',
            content=f"scheduled an interview with you for {interview.job.title}",
            related_object_id=interview.id,
            related_object_type='Interview'
        )
        
        # Send email to applicant
        cls._send_interview_email(interview)
    
    @classmethod
    def _send_interview_email(cls, interview):
        """Send email notification about the interview"""
        try:
            # Prepare email content
            subject = f"Interview Scheduled: {interview.job.title}"
            
            interviewer_name = f"{interview.interviewer.first_name} {interview.interviewer.last_name}".strip()
            if not interviewer_name or interviewer_name == "None None":
                interviewer_name = interview.interviewer.email

            message = f"""
Hello {interview.applicant.first_name or interview.applicant.email},

An interview has been scheduled for the position of {interview.job.title} at {interview.job.posted_by.company_name}.

Interview Details:
- Date and Time: {interview.scheduled_date.strftime('%A, %B %d, %Y at %I:%M %p')}
- Duration: {interview.duration_minutes} minutes
- Platform: {dict(Interview.PLATFORM_CHOICES)[interview.platform]}
- Meeting Link: {interview.meeting_link}
- Meeting ID: {interview.meeting_id}
"""
            if interview.meeting_password:
                message += f"- Password: {interview.meeting_password}\n"
                
            message += f"""
Your interviewer will be: {interviewer_name}

Please ensure you're ready 5 minutes before the scheduled time and have tested your audio/video equipment.

If you need to reschedule, please contact us as soon as possible.

Best regards,
{interview.job.posted_by.company_name} Recruitment Team
"""
            
            # Send email
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[interview.applicant.email],
                fail_silently=False,
            )
            
            return True
        except Exception as e:
            logger.error(f"Error sending interview email: {str(e)}")
            return False
    
    @classmethod
    def reschedule_interview(cls, interview_id, new_date, update_meeting=True):
        """
        Reschedule an existing interview
        
        Args:
            interview_id: ID of the interview to reschedule
            new_date: New datetime for the interview
            update_meeting: Whether to update the meeting link
        
        Returns:
            Updated Interview object
        """
        try:
            interview = Interview.objects.get(id=interview_id)
            old_date = interview.scheduled_date
            
            # Update the scheduled date
            interview.scheduled_date = new_date
            interview.status = Interview.STATUS_RESCHEDULED
            
            # Regenerate meeting link if needed
            if update_meeting:
                if interview.platform == Interview.PLATFORM_ZOOM:
                    cls._generate_zoom_meeting(interview)
                elif interview.platform == Interview.PLATFORM_GOOGLE_MEET:
                    cls._generate_google_meet(interview)
            
            interview.save()
            
            # Create notification for applicant
            NotificationService.create_notification(
                recipient=interview.applicant,
                sender=interview.interviewer,
                notification_type='INTERVIEW_RESCHEDULED',
                content=f"rescheduled your interview for {interview.job.title}",
                related_object_id=interview.id,
                related_object_type='Interview'
            )
            
            # Send email notification
            subject = f"Interview Rescheduled: {interview.job.title}"
            message = f"""
Hello {interview.applicant.first_name or interview.applicant.email},

Your interview for the position of {interview.job.title} has been rescheduled.

Previous Date: {old_date.strftime('%A, %B %d, %Y at %I:%M %p')}
New Date: {interview.scheduled_date.strftime('%A, %B %d, %Y at %I:%M %p')}

Other interview details remain the same.

Best regards,
{interview.job.posted_by.company_name} Recruitment Team
"""
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[interview.applicant.email],
                fail_silently=False,
            )
            
            return interview
            
        except Interview.DoesNotExist:
            raise ValidationError("Interview not found")
        except Exception as e:
            logger.error(f"Error rescheduling interview: {str(e)}")
            raise ValidationError(f"Failed to reschedule interview: {str(e)}")
    
    @classmethod
    def cancel_interview(cls, interview_id, reason=None):
        """
        Cancel an interview
        
        Args:
            interview_id: ID of the interview to cancel
            reason: Reason for cancellation
        
        Returns:
            Cancelled Interview object
        """
        try:
            interview = Interview.objects.get(id=interview_id)
            
            # Update the interview status
            interview.status = Interview.STATUS_CANCELLED
            interview.notes = f"{interview.notes}\n\nCancellation reason: {reason}" if reason else interview.notes
            interview.save()
            
            # Create notification for applicant
            NotificationService.create_notification(
                recipient=interview.applicant,
                sender=interview.interviewer,
                notification_type='INTERVIEW_CANCELLED',
                content=f"cancelled your interview for {interview.job.title}",
                related_object_id=interview.id,
                related_object_type='Interview'
            )
            
            # Send email notification
            subject = f"Interview Cancelled: {interview.job.title}"
            message = f"""
Hello {interview.applicant.first_name or interview.applicant.email},

We regret to inform you that your interview for the position of {interview.job.title} scheduled for {interview.scheduled_date.strftime('%A, %B %d, %Y at %I:%M %p')} has been cancelled.
"""
            
            if reason:
                message += f"\nReason: {reason}\n"
                
            message += f"""
We apologize for any inconvenience this may cause.

Best regards,
{interview.job.posted_by.company_name} Recruitment Team
"""
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[interview.applicant.email],
                fail_silently=False,
            )
            
            return interview
            
        except Interview.DoesNotExist:
            raise ValidationError("Interview not found")
        except Exception as e:
            logger.error(f"Error cancelling interview: {str(e)}")
            raise ValidationError(f"Failed to cancel interview: {str(e)}")
    
    @classmethod
    def get_upcoming_interviews(cls, user_id):
        """
        Get upcoming interviews for a user
        
        Args:
            user_id: ID of the user (can be applicant or interviewer)
        
        Returns:
            QuerySet of upcoming interviews
        """
        try:
            user = User.objects.get(id=user_id)
            now = timezone.now()
            
            # Get interviews where user is either applicant or interviewer
            interviews = Interview.objects.filter(
                (Q(applicant=user) | Q(interviewer=user)) &
                Q(scheduled_date__gt=now) &
                Q(status__in=[Interview.STATUS_SCHEDULED, Interview.STATUS_RESCHEDULED])
            ).select_related('job', 'applicant', 'interviewer').order_by('scheduled_date')
            
            return interviews
            
        except User.DoesNotExist:
            raise ValidationError("User not found")
        except Exception as e:
            logger.error(f"Error getting upcoming interviews: {str(e)}")
            raise ValidationError(f"Failed to get upcoming interviews: {str(e)}")
    
    @classmethod
    def get_completed_interviews(cls, user_id):
        """
        Get completed interviews for a user
        
        Args:
            user_id: ID of the user (can be applicant or interviewer)
        
        Returns:
            QuerySet of completed interviews
        """
        try:
            user = User.objects.get(id=user_id)
            
            # Get interviews where user is either applicant or interviewer
            interviews = Interview.objects.filter(
                (Q(applicant=user) | Q(interviewer=user)) &
                Q(status=Interview.STATUS_COMPLETED)
            ).select_related('job', 'applicant', 'interviewer').order_by('-scheduled_date')
            
            return interviews
            
        except User.DoesNotExist:
            raise ValidationError("User not found")
        except Exception as e:
            logger.error(f"Error getting completed interviews: {str(e)}")
            raise ValidationError(f"Failed to get completed interviews: {str(e)}")
    
    @classmethod
    def mark_interview_completed(cls, interview_id, notes=None):
        """
        Mark an interview as completed
        
        Args:
            interview_id: ID of the interview to mark as completed
            notes: Post-interview notes
        
        Returns:
            Updated Interview object
        """
        try:
            interview = Interview.objects.get(id=interview_id)
            
            # Update the interview status
            interview.status = Interview.STATUS_COMPLETED
            if notes:
                interview.notes = f"{interview.notes}\n\nInterview notes: {notes}" if interview.notes else f"Interview notes: {notes}"
            interview.save()
            
            return interview
            
        except Interview.DoesNotExist:
            raise ValidationError("Interview not found")
        except Exception as e:
            logger.error(f"Error marking interview as completed: {str(e)}")
            raise ValidationError(f"Failed to mark interview as completed: {str(e)}")
    
    @classmethod
    def get_interview_by_id(cls, interview_id):
        """
        Get interview by ID
        
        Args:
            interview_id: ID of the interview
        
        Returns:
            Interview object
        """
        try:
            interview = Interview.objects.select_related('job', 'applicant', 'interviewer').get(id=interview_id)
            return interview
        except Interview.DoesNotExist:
            raise ValidationError("Interview not found")
        except Exception as e:
            logger.error(f"Error getting interview: {str(e)}")
            raise ValidationError(f"Failed to get interview: {str(e)}")
    
    @classmethod
    def get_job_interviews(cls, job_id):
        """
        Get all interviews for a job
        
        Args:
            job_id: ID of the job
        
        Returns:
            QuerySet of interviews for the job
        """
        try:
            job = JobPost.objects.get(id=job_id)
            interviews = Interview.objects.filter(job=job).select_related('applicant', 'interviewer').order_by('-scheduled_date')
            return interviews
        except JobPost.DoesNotExist:
            raise ValidationError("Job not found")
        except Exception as e:
            logger.error(f"Error getting job interviews: {str(e)}")
            raise ValidationError(f"Failed to get job interviews: {str(e)}") 