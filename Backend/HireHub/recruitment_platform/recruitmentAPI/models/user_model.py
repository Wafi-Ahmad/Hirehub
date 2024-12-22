from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.apps import apps
import numpy as np  # Import apps to dynamically get models

# Try to import ArrayField, use TextField as fallback
try:
    from django.contrib.postgres.fields import ArrayField
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False

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
    
    # Profile and cover pictures
    profile_picture = models.ImageField(upload_to='profiles/avatars/', null=True, blank=True)
    cover_picture = models.ImageField(upload_to='profiles/covers/', null=True, blank=True)
    
    # Bio and location
    bio = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=100, null=True, blank=True)
    website = models.URLField(max_length=200, null=True, blank=True)
    
    # Professional information
    headline = models.CharField(max_length=100, null=True, blank=True)
    preferred_job_category = models.CharField(max_length=255, null=True, blank=True)
    preferred_job_type = models.CharField(max_length=10, choices=JOB_TYPE_CHOICES, default=ONSITE)
    desired_salary_range = models.CharField(max_length=50, null=True, blank=True)
    preferred_location = models.CharField(max_length=100, null=True, blank=True)

    # Detailed profile information
    skills = models.TextField(null=True, blank=True)
    experience = models.TextField(null=True, blank=True)
    education = models.TextField(null=True, blank=True)
    certifications = models.TextField(null=True, blank=True)
    recent_work = models.TextField(null=True, blank=True)
    current_work = models.TextField(null=True, blank=True)
    
    # Contact information
    contact_details = models.TextField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    linkedin_url = models.URLField(max_length=200, null=True, blank=True)
    github_url = models.URLField(max_length=200, null=True, blank=True)

    # Privacy settings
    is_profile_public = models.BooleanField(default=True)
    show_email = models.BooleanField(default=True)
    show_phone = models.BooleanField(default=False)
    show_skills = models.BooleanField(default=True)
    show_experience = models.BooleanField(default=True)
    show_education = models.BooleanField(default=True)
    show_certifications = models.BooleanField(default=True)
    show_recent_work = models.BooleanField(default=True)
    show_current_work = models.BooleanField(default=True)

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

    # Define embedding field based on database backend
    profile_embedding = models.TextField(
        null=True,
        blank=True,
        help_text="Vector embedding of user profile for similarity matching (stored as JSON string)"
    )
    embedding_updated_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the profile embedding was last updated"
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def set_profile_embedding(self, embedding):
        """Set the profile embedding, converting it to JSON string if needed."""
        import json
        self.profile_embedding = json.dumps(embedding.tolist())

    def get_profile_embedding(self):
        """Get the profile embedding as a Python object."""
        import json
        return np.array(json.loads(self.profile_embedding), dtype=np.float32) if self.profile_embedding else None
