from django.utils import timezone
from django.core.exceptions import ValidationError
import os

class CVService:
    ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx'}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

    @staticmethod
    def validate_cv_file(file):
        """Validate CV file type and size"""
        if not file:
            raise ValidationError("No file was submitted.")

        # Check file size
        if file.size > CVService.MAX_FILE_SIZE:
            raise ValidationError("File size cannot exceed 5MB.")

        # Check file extension
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in CVService.ALLOWED_EXTENSIONS:
            raise ValidationError("Only PDF, DOC, and DOCX files are allowed.")

    @staticmethod
    def upload_cv(user, cv_file):
        """Upload CV file for a user"""
        try:
            # Validate the file
            CVService.validate_cv_file(cv_file)

            # Delete old CV if exists
            if user.cv_file:
                user.cv_file.delete()

            # Save new CV
            user.cv_file = cv_file
            user.cv_upload_date = timezone.now()
            user.save()

            return {
                "message": "CV uploaded successfully",
                "file_name": cv_file.name,
                "upload_date": user.cv_upload_date
            }
        except ValidationError as e:
            raise ValidationError(str(e))
        except Exception as e:
            raise Exception(f"Failed to upload CV: {str(e)}")

    @staticmethod
    def get_cv_info(user):
        """Get CV information for a user"""
        if not user.cv_file:
            return None

        return {
            "file_name": os.path.basename(user.cv_file.name),
            "upload_date": user.cv_upload_date,
            "file_url": user.cv_file.url if user.cv_file else None
        }
