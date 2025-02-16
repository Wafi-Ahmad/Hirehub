from django.contrib import admin
from django.utils.html import format_html
from recruitmentAPI.models import User, Post, Comment, Role, ConnectionRequest
from .models.job_model import JobPost
from .models.notification_model import Notification
from .models.quiz_model import Quiz, QuizAttempt
from django.contrib.auth import get_user_model

User = get_user_model()

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'user_type', 'is_active', 'is_staff', 'profile_picture_preview')
    list_filter = ('user_type', 'is_active', 'is_staff', 'preferred_job_type')
    search_fields = ('email', 'first_name', 'last_name', 'company_name')
    fieldsets = (
        ('Basic Information', {
            'fields': ('email', 'password', 'user_type')
        }),
        ('Normal User Fields', {
            'fields': ('first_name', 'last_name', 'date_of_birth'),
            'classes': ('collapse',),
        }),
        ('Job Preferences', {
            'fields': ('preferred_job_category', 'preferred_job_type', 
                      'desired_salary_range', 'preferred_location'),
            'classes': ('collapse',),
        }),
        ('Company Fields', {
            'fields': ('company_name', 'industry', 'company_size', 'about_company', 'specializations'),
            'classes': ('collapse',),
        }),
        ('Profile Media', {
            'fields': ('profile_picture', 'cover_picture'),
            'classes': ('collapse',),
        }),
        ('Contact & Location', {
            'fields': ('location', 'website', 'phone', 'linkedin_url', 'github_url', 'contact_details'),
            'classes': ('collapse',),
        }),
        ('Profile Details', {
            'fields': ('headline', 'bio', 'skills', 'experience', 'education', 'certifications', 
                      'recent_work', 'current_work'),
            'classes': ('collapse',),
        }),
        ('Privacy Settings', {
            'fields': ('is_profile_public', 'show_email', 'show_phone', 'show_skills', 
                      'show_experience', 'show_education', 'show_certifications', 
                      'show_recent_work', 'show_current_work'),
            'classes': ('collapse',),
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser'),
            'classes': ('collapse',),
        }),
    )
    
    def profile_picture_preview(self, obj):
        if obj.profile_picture:
            return format_html('<img src="{}" width="50" height="50" />', obj.profile_picture.url)
        return "No picture"
    profile_picture_preview.short_description = 'Profile Picture'

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'content_preview', 'created_at', 'likes_count', 'comments_count')
    list_filter = ('created_at', 'user')
    search_fields = ('content', 'user__email')
    readonly_fields = ('created_at', 'updated_at', 'likes_count', 'comments_count')
    date_hierarchy = 'created_at'
    
    def content_preview(self, obj):
        return obj.content[:100] + "..." if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content'
    
    # def has_attachment(self, obj):
    #     return bool(obj.attachment)
    # has_attachment.boolean = True
    # has_attachment.short_description = 'Has Attachment'

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'post', 'content_preview', 'created_at', 'like_count', 'has_replies')
    list_filter = ('created_at', 'user', 'post')
    search_fields = ('content', 'user__email', 'post__content')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    def content_preview(self, obj):
        return obj.content[:100] + "..." if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content'
    
    def has_replies(self, obj):
        return obj.replies.exists()
    has_replies.boolean = True
    has_replies.short_description = 'Has Replies'

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    list_filter = ('role',)
    search_fields = ('user__email', 'role')

@admin.register(ConnectionRequest)
class ConnectionRequestAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('sender__email', 'receiver__email')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'

@admin.register(JobPost)
class JobPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'posted_by', 'status', 'created_at')
    search_fields = ('title', 'description')
    list_filter = ('status', 'employment_type', 'location_type')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'sender', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read')
    search_fields = ('content',)

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('job', 'created_at')

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'score', 'completed_at')
    list_filter = ('completed_at',)
