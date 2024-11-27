from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.apps import apps  # Import apps to dynamically get models

# Custom user manager for handling user creation
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        """
        Creates and saves a User with the given email and password.
        """
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Creates and saves a superuser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


# User model
class User(AbstractBaseUser, PermissionsMixin):
    NORMAL_USER = 'Normal'
    COMPANY_USER = 'Company'

    USER_TYPE_CHOICES = [
        (NORMAL_USER, 'Normal User'),
        (COMPANY_USER, 'Company User'),
    ]

    ONSITE = 'On-site'
    REMOTE = 'Remote'
    JOB_TYPE_CHOICES = [
        (ONSITE, 'On-site'),
        (REMOTE, 'Remote'),
    ]

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, null=True, blank=True)
    last_name = models.CharField(max_length=30, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    company_name = models.CharField(max_length=100, null=True, blank=True)
    user_type = models.CharField(max_length=7, choices=USER_TYPE_CHOICES, default=NORMAL_USER)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)

    # New fields for profile interests
    preferred_job_category = models.CharField(max_length=255, null=True, blank=True)
    preferred_job_type = models.CharField(max_length=10, choices=JOB_TYPE_CHOICES, default=ONSITE)
    desired_salary_range = models.CharField(max_length=50, null=True, blank=True)
    preferred_location = models.CharField(max_length=100, null=True, blank=True)

    # New fields for user profile
    skills = models.TextField(null=True, blank=True)
    experience = models.TextField(null=True, blank=True)
    recent_work = models.TextField(null=True, blank=True)
    current_work = models.TextField(null=True, blank=True)
    contact_details = models.TextField(null=True, blank=True)

    # Fields to manage privacy settings
    is_profile_public = models.BooleanField(default=True)  # Controls overall profile visibility
    show_email = models.BooleanField(default=True)  # Controls whether email is visible
    show_skills = models.BooleanField(default=True)  # Controls whether skills are visible
    show_experience = models.BooleanField(default=True)  # Controls whether experience is visible
    show_recent_work = models.BooleanField(default=True)  # Controls whether recent work is visible
    show_current_work = models.BooleanField(default=True)  # Controls whether current work is visible

    # Permissions
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    # Add this new field for following relationships
    following = models.ManyToManyField(
        'self',
        related_name='followers',
        symmetrical=False,
        blank=True
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def has_perm(self, perm, obj=None):
        """Does the user have a specific permission?"""
        # Simplest possible answer: Yes, always
        return True

    def has_module_perms(self, app_label):
        """Does the user have permissions to view the app `app_label`?"""
        # Simplest possible answer: Yes, always
        return True

    @property
    def is_admin(self):
        """Is the user a member of staff?"""
        return self.is_staff

class RoleService:
    @staticmethod
    def assign_role(user_id, role):
        try:
            user = User.objects.get(pk=user_id)
            if user.user_type != User.NORMAL_USER:
                raise ValueError("Only normal users can be assigned roles.")
            Role = apps.get_model('recruitmentAPI', 'Role')  # Dynamically get Role model
            Role.objects.update_or_create(user=user, defaults={'role': role})
            return {"message": f"Role {role} assigned to {user.email}."}
        except User.DoesNotExist:
            raise ValueError("User not found")

    @staticmethod
    def remove_role(user_id):
        try:
            Role = apps.get_model('recruitmentAPI', 'Role')  # Dynamically get Role model
            role = Role.objects.get(user_id=user_id)
            role.delete()
            return {"message": "Role removed successfully."}
        except Role.DoesNotExist:
            raise ValueError("Role not found for this user")
