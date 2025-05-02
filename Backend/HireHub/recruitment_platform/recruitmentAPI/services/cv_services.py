from django.utils import timezone
from django.core.exceptions import ValidationError
import os
import logging
import json
import requests
from .cv_parser_service import LLMCVParser

# Setup logging
logger = logging.getLogger(__name__)

class CVService:
    ALLOWED_EXTENSIONS = {'.pdf'}
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
            raise ValidationError("Only PDF files are allowed at this time.")

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

            logger.info(f"CV uploaded successfully for user {user.email}")
            return {
                "message": "CV uploaded successfully",
                "file_name": cv_file.name,
                "upload_date": user.cv_upload_date
            }
        except ValidationError as e:
            logger.error(f"Validation error during CV upload for user {user.email}: {str(e)}")
            raise ValidationError(str(e))
        except Exception as e:
            logger.exception(f"Failed to upload CV for user {user.email}: {str(e)}")
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
    
    @staticmethod
    def parse_cv(user):
        """Parse CV file of a user and extract structured information using LLM."""
        if not user.cv_file:
            logger.error(f"No CV file found for user {user.email}")
            raise ValidationError("No CV file found for this user.")
            
        try:
            file_path = user.cv_file.path
            logger.info(f"Parsing CV at path: {file_path}")
            
            # Check if file exists
            if not os.path.exists(file_path):
                logger.error(f"CV file does not exist at path: {file_path}")
                raise ValidationError("CV file not found on disk.")
            
            # Create LLM parser instance
            logger.info("Creating LLM CV parser instance")
            parser = LLMCVParser()
            
            # Parse the CV file using the LLM API
            logger.info(f"Starting LLM CV parsing for file: {os.path.basename(file_path)}")
            parsed_data = parser.parse_cv(file_path)
            
            logger.info("LLM CV parsing completed successfully")
            return parsed_data
        except (ValidationError, ValueError, ConnectionError, RuntimeError) as e:
            # Catch specific errors from the parser or validation
            logger.exception(f"Failed to parse CV for user {user.email}: {str(e)}")
            # Re-raise as a generic exception or specific type if needed by view
            raise Exception(f"Failed to parse CV: {str(e)}") 
        except Exception as e:
            # Catch any other unexpected errors
            logger.exception(f"Unexpected error during CV parsing for user {user.email}: {str(e)}")
            raise Exception(f"An unexpected error occurred during CV parsing: {str(e)}")
    
    @staticmethod
    def parse_and_update_profile(user, cv_file=None):
        """Parse CV and update user profile with extracted information"""
        try:
            # If a new CV file is provided, upload it first
            if cv_file:
                logger.info(f"Uploading new CV file for user {user.email}")
                CVService.upload_cv(user, cv_file)
            
            # Make sure user has a CV
            if not user.cv_file:
                logger.error(f"No CV file found for user {user.email}")
                raise ValidationError("No CV file found for this user.")
            
            # Parse the CV
            logger.info(f"Parsing CV for user {user.email}")
            parsed_data = CVService.parse_cv(user)
            
            # Update user profile with parsed data
            logger.info(f"Updating profile for user {user.email} with parsed data from LLM")
            CVService._update_user_profile(user, parsed_data)
            
            return {
                "message": "Profile updated successfully from CV",
                "parsed_data": parsed_data
            }
        except ValidationError as e:
            logger.error(f"Validation error during CV parsing for user {user.email}: {str(e)}")
            raise ValidationError(str(e))
        except Exception as e:
            logger.exception(f"Failed to update profile from CV for user {user.email}: {str(e)}")
            raise Exception(f"Failed to update profile from CV: {str(e)}")
    
    @staticmethod
    def _update_user_profile(user, parsed_data):
        """Update user profile with parsed CV data from LLM."""
        # parsed_data is now expected to match LLMCVParser.EXPECTED_JSON_STRUCTURE
        try:
            logger.info(f"Attempting to update profile with LLM data keys: {list(parsed_data.keys())}")

            # --- Update Basic Information --- 
            # Only update if the field is currently empty/blank and the LLM provided a value

            # Name (handle potential split)
            candidate_name = parsed_data.get("candidate_name")
            if candidate_name and not user.full_name.strip():
                name_parts = candidate_name.strip().split(" ", 1)
                if len(name_parts) > 0 and not user.first_name.strip():
                    user.first_name = name_parts[0]
                    logger.info(f"Updated first_name to {name_parts[0]}")
                if len(name_parts) > 1 and not user.last_name.strip():
                    user.last_name = name_parts[1]
                    logger.info(f"Updated last_name to {name_parts[1]}")
                # If only one name part found, maybe assign to first_name?
                elif len(name_parts) == 1 and not user.first_name.strip() and not user.last_name.strip():
                     user.first_name = name_parts[0]
                     logger.info(f"Updated first_name to {name_parts[0]} (only one name part found)")

            # Phone Number (Assuming user model has a phone_number field)
            phone_number = parsed_data.get("phone_number")
            if phone_number and hasattr(user, 'phone_number') and not user.phone_number:
                 user.phone_number = phone_number
                 logger.info(f"Updated phone_number to {phone_number}")
            elif phone_number and not hasattr(user, 'phone_number'):
                logger.warning("LLM provided phone_number, but User model has no 'phone_number' attribute.")

            # Location (Assuming user model has a location field)
            location = parsed_data.get("location")
            if location and hasattr(user, 'location') and not user.location:
                user.location = location
                logger.info(f"Updated location to {location}")
            elif location and not hasattr(user, 'location'):
                 logger.warning("LLM provided location, but User model has no 'location' attribute.")

            # LinkedIn URL (Assuming user model has a linkedin_url field)
            linkedin_url = parsed_data.get("linkedin_url")
            if linkedin_url and hasattr(user, 'linkedin_url') and not user.linkedin_url:
                user.linkedin_url = linkedin_url
                logger.info(f"Updated linkedin_url to {linkedin_url}")
            elif linkedin_url and not hasattr(user, 'linkedin_url'):
                 logger.warning("LLM provided linkedin_url, but User model has no 'linkedin_url' attribute.")

            # Summary/Bio (Assuming user model has a bio or summary field)
            summary = parsed_data.get("summary")
            if summary and hasattr(user, 'bio') and not user.bio:
                 user.bio = summary
                 logger.info(f"Updated bio with summary from CV.")
            elif summary and not hasattr(user, 'bio'):
                 logger.warning("LLM provided summary, but User model has no 'bio' attribute.")
            
            # --- Update Skills --- 
            # Assuming user model has a 'skills' field (e.g., TextField or ManyToManyField)
            skills_list = parsed_data.get("skills", [])
            if skills_list and isinstance(skills_list, list):
                 # Option 1: Store as comma-separated string (if user.skills is TextField)
                 if hasattr(user, 'skills') and isinstance(user.skills, str):
                     # Only update if skills field is empty
                     if not user.skills.strip():
                         user.skills = ", ".join(skills_list)
                         logger.info(f"Updated skills (as string) to: {user.skills}")
                 # Option 2: Update ManyToMany relationship (More complex, requires Skill model)
                 # elif hasattr(user, 'skills') and isinstance(user.skills, ManyToManyRelatedManager):
                 #     # Find or create Skill objects and add them
                 #     # current_skills = set(user.skills.values_list('name', flat=True))
                 #     # for skill_name in skills_list:
                 #     #     if skill_name not in current_skills:
                 #     #         skill_obj, created = Skill.objects.get_or_create(name=skill_name)
                 #     #         user.skills.add(skill_obj)
                 #     # logger.info(f"Updated skills (ManyToMany)")
                 #     pass # Requires Skill model implementation
                 else:
                      logger.warning("LLM provided skills, but User model's 'skills' attribute type is unclear or missing.")

            # --- Update Experience --- (Requires Experience model related to User)
            experience_list = parsed_data.get("experience", [])
            if experience_list and isinstance(experience_list, list) and hasattr(user, 'experience_set'): # Check for related manager
                 # Clear existing experience derived from CV? Or just add new ones?
                 # Decide on strategy: Overwrite vs Append
                 # Example: Add new experience entries (requires Experience model)
                 # for exp_data in experience_list:
                 #     if isinstance(exp_data, dict) and exp_data.get('company') and exp_data.get('position'):
                 #         # Avoid creating duplicates if possible
                 #         Experience.objects.update_or_create(
                 #             user=user,
                 #             company=exp_data.get('company'),
                 #             position=exp_data.get('position'),
                 #             defaults={
                 #                 'start_date': exp_data.get('dates'), # Needs parsing
                 #                 'description': exp_data.get('description')
                 #             }
                 #         )
                 # logger.info(f"Processed {len(experience_list)} experience entries.")
                 pass # Requires Experience model implementation
            elif experience_list and not hasattr(user, 'experience_set'):
                 logger.warning("LLM provided experience, but no related Experience model found for User.")

            # --- Update Education --- (Requires Education model related to User)
            education_list = parsed_data.get("education", [])
            if education_list and isinstance(education_list, list) and hasattr(user, 'education_set'): # Check for related manager
                 # Similar logic to Experience: Add new education entries
                 # Example: Add new education entries (requires Education model)
                 # for edu_data in education_list:
                 #     if isinstance(edu_data, dict) and edu_data.get('institution') and edu_data.get('degree'):
                 #         Education.objects.update_or_create(
                 #             user=user,
                 #             institution=edu_data.get('institution'),
                 #             degree=edu_data.get('degree'),
                 #             defaults={
                 #                 'field_of_study': edu_data.get('field_of_study'),
                 #                 'graduation_date': edu_data.get('dates') # Needs parsing
                 #             }
                 #         )
                 # logger.info(f"Processed {len(education_list)} education entries.")
                 pass # Requires Education model implementation
            elif education_list and not hasattr(user, 'education_set'):
                 logger.warning("LLM provided education, but no related Education model found for User.")

            # --- Update Certifications --- (Requires dedicated field or Certification model)
            certifications_list = parsed_data.get("certifications", [])
            if certifications_list and isinstance(certifications_list, list):
                 # Option 1: Store as comma-separated string (if user.certifications is TextField)
                 if hasattr(user, 'certifications') and isinstance(user.certifications, str):
                     if not user.certifications.strip():
                         user.certifications = ", ".join(certifications_list)
                         logger.info(f"Updated certifications (as string) to: {user.certifications}")
                 # Option 2: Update ManyToMany relationship (Requires Certification model)
                 # elif hasattr(user, 'certifications') and ...
                 else:
                      logger.warning("LLM provided certifications, but User model's 'certifications' attribute type is unclear or missing.")

            # Save the user object with updated information
            user.save()
            logger.info(f"Profile update attempt finished for user {user.email}")
            
        except Exception as e:
            logger.exception(f"Error updating user profile with LLM parsed data: {str(e)}")
            # Do not re-raise here, as the parsing itself might have succeeded.
            # The calling function handles the overall success/failure message.
            # Consider if partial updates should be rolled back (transaction).
            pass
        