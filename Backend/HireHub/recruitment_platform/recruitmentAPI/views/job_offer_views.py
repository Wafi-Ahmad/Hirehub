from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail, BadHeaderError
from django.conf import settings
from socket import timeout
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from ..models.job_model import JobPost
from ..models.user_model import User
from ..permissions import IsCompanyUser
from ..services.notification_services import NotificationService

logger = logging.getLogger(__name__)

class SendJobOfferView(APIView):
    permission_classes = [IsAuthenticated, IsCompanyUser]

    def send_email_smtp(self, subject, message, to_email):
        try:
            msg = MIMEMultipart()
            msg['From'] = settings.EMAIL_HOST_USER
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(message, 'plain'))

            # Create SMTP connection
            server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
            server.set_debuglevel(1)  # Enable debug output
            
            # Start TLS
            logger.info("Starting TLS connection...")
            server.starttls()
            
            # Login
            logger.info("Attempting login...")
            server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            
            # Send email
            logger.info("Sending email...")
            server.send_message(msg)
            
            # Close connection
            server.quit()
            return True, None
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP Authentication Error: {str(e)}")
            return False, "Authentication failed. Please check email credentials."
        except Exception as e:
            logger.error(f"Email Error: {str(e)}")
            return False, str(e)

    def post(self, request, job_id, applicant_id):
        try:
            job = JobPost.objects.select_related('posted_by').get(pk=job_id)
            applicant = User.objects.get(pk=applicant_id)
            company = job.posted_by

            # Create notification using the new service method
            notification = NotificationService.create_job_offer_notification(
                recipient=applicant,
                sender=company,
                job_id=job.id,
                job_title=job.title
            )

            # Prepare email content
            email_subject = f"Job Offer from {company.company_name}"
            email_message = f"""
Dear {applicant.first_name or applicant.email},

We are pleased to inform you that {company.company_name} would like to offer you the position of {job.title}.

Please contact them at {company.email} to discuss the next steps.

Best regards,
HireHub Team
"""
            # Try to send email
            success, error = self.send_email_smtp(email_subject, email_message, applicant.email)
            
            if success:
                return Response({
                    'message': 'Job offer sent successfully with email',
                    'notification_type': notification.notification_type
                })
            else:
                return Response({
                    'message': f'Email sending failed: {error}. Job offer notification created.',
                    'status': 'notification_only',
                    'notification_type': notification.notification_type,
                    'error_details': error
                }, status=status.HTTP_502_BAD_GATEWAY)

        except (JobPost.DoesNotExist, User.DoesNotExist) as e:
            return Response({
                'message': str(e)
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return Response({
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
