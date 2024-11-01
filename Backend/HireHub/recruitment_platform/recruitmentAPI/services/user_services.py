from recruitmentAPI.models.user_model import User

class UserService:
    @staticmethod
    def create_user(email, first_name, last_name, password, **extra_fields):
        """
        Handle the business logic of creating a user.
        """
        if User.objects.filter(email=email).exists():
            raise ValueError('A user with this email already exists.')

        user = User.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
            **extra_fields
        )
        return user

    @staticmethod
    def update_user(user_id, **data):
        """
        Update the user's profile information.
        """
        try:
            user = User.objects.get(pk=user_id)
            user.first_name = data.get('first_name', user.first_name)
            user.last_name = data.get('last_name', user.last_name)
            user.date_of_birth = data.get('date_of_birth', user.date_of_birth)
            user.company_name = data.get('company_name', user.company_name)
            user.profile_picture = data.get('profile_picture', user.profile_picture)
            user.save()
            return user
        except User.DoesNotExist:
            raise ValueError("User not found")


    @staticmethod
    def update_basic_info(user_id, **data):
        """
        Update the user's basic profile information, such as skills, experience, recent work, etc.
        """
        try:
            user = User.objects.get(pk=user_id)
            user.skills = data.get('skills', user.skills)
            user.experience = data.get('experience', user.experience)
            user.recent_work = data.get('recent_work', user.recent_work)
            user.current_work = data.get('current_work', user.current_work)
            user.contact_details = data.get('contact_details', user.contact_details)
            user.save()
            return user
        except User.DoesNotExist:
            raise ValueError("User not found")
        

    @staticmethod
    def update_privacy_settings(user_id, **data):
        """
        Update privacy settings for a user.
        """
        try:
            user = User.objects.get(pk=user_id)
            user.is_profile_public = data.get('is_profile_public', user.is_profile_public)
            user.show_email = data.get('show_email', user.show_email)
            user.show_skills = data.get('show_skills', user.show_skills)
            user.show_experience = data.get('show_experience', user.show_experience)
            user.show_recent_work = data.get('show_recent_work', user.show_recent_work)
            user.show_current_work = data.get('show_current_work', user.show_current_work)
            user.save()
            return user
        except User.DoesNotExist:
            raise ValueError("User not found")
        
        
    @staticmethod
    def delete_user(user_id):
        """
        Permanently delete a user account and all related data.
        """
        try:
            user = User.objects.get(pk=user_id)
            user.delete()
            return {"message": "User account deleted successfully."}
        except User.DoesNotExist:
            raise ValueError("User not found")