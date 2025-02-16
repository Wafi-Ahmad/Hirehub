from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from recruitmentAPI.models import User, Post, Comment, Role, ConnectionRequest
from .models.job_model import JobPost
from .models.notification_model import Notification
from .models.quiz_model import Quiz, QuizAttempt
from django.contrib.auth import get_user_model

admin.site.site_header = 'HireHub Administration'
admin.site.site_title = 'HireHub Admin Portal'
admin.site.index_title = 'Welcome to HireHub Admin Portal'

User = get_user_model()

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('profile_picture_preview', 'email', 'full_name', 'user_type', 'status_badge')
    list_filter = ('user_type', 'is_active', 'is_staff', 'preferred_job_type')
    search_fields = ('email', 'first_name', 'last_name', 'company_name')
    list_per_page = 20
    ordering = ('-date_joined',)
    
    def status_badge(self, obj):
        if obj.is_active:
            return mark_safe('<span style="background-color: #28a745; color: white; padding: 3px 10px; border-radius: 10px;">Active</span>')
        return mark_safe('<span style="background-color: #dc3545; color: white; padding: 3px 10px; border-radius: 10px;">Inactive</span>')
    status_badge.short_description = 'Status'

    def profile_picture_preview(self, obj):
        if obj.profile_picture:
            return format_html('<img src="{}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />', obj.profile_picture.url)
        return format_html('<span style="color: #999;">No Image</span>')
    profile_picture_preview.short_description = 'Profile'

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_content_preview', 'engagement_stats', 'created_at')
    list_filter = ('created_at', 'user')
    search_fields = ('content', 'user__email')
    readonly_fields = ('created_at', 'updated_at', 'likes_count', 'comments_count')
    date_hierarchy = 'created_at'
    list_per_page = 15
    
    def get_content_preview(self, obj):
        return obj.content[:100] + "..." if len(obj.content) > 100 else obj.content
    get_content_preview.short_description = 'Content'
    
    def engagement_stats(self, obj):
        return format_html(
            '<div style="text-align: center;">'
            '<span style="margin-right: 15px;"><i class="fas fa-heart"></i> {}</span>'
            '<span><i class="fas fa-comment"></i> {}</span>'
            '</div>',
            obj.likes_count,
            obj.comments_count
        )
    engagement_stats.short_description = 'Engagement'

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
    list_display = ('title', 'company_info', 'status_badge', 'get_applicants_count', 'created_at')
    search_fields = ('title', 'description', 'posted_by__company_name')
    list_filter = ('status', 'employment_type', 'location_type', 'created_at')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    list_per_page = 15
    
    def get_applicants_count(self, obj):
        return obj.applications.count() if hasattr(obj, 'applications') else 0
    get_applicants_count.short_description = 'Applicants'
    
    def company_info(self, obj):
        return format_html(
            '<div style="min-width: 200px;">'
            '<strong>{}</strong><br>'
            '<small style="color: #666;">{}</small>'
            '</div>',
            obj.posted_by.company_name,
            obj.location
        )
    company_info.short_description = 'Company'
    
    def status_badge(self, obj):
        colors = {
            'OPEN': '#28a745',
            'CLOSED': '#dc3545',
            'DRAFT': '#ffc107',
            'ARCHIVED': '#6c757d'
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 10px;">{}</span>',
            colors.get(obj.status, '#6c757d'),
            obj.status
        )
    status_badge.short_description = 'Status'

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'notification_preview', 'status_badge', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('content', 'recipient__email', 'sender__email')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    list_per_page = 20
    
    def notification_preview(self, obj):
        return format_html(
            '<div style="min-width: 300px;">'
            '<strong>{}</strong><br>'
            '<small style="color: #666;">{}</small>'
            '</div>',
            obj.notification_type,
            obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
        )
    notification_preview.short_description = 'Notification'
    
    def status_badge(self, obj):
        if obj.is_read:
            return mark_safe('<span style="background-color: #28a745; color: white; padding: 3px 10px; border-radius: 10px;">Read</span>')
        return mark_safe('<span style="background-color: #ffc107; color: white; padding: 3px 10px; border-description: 10px;">Unread</span>')
    status_badge.short_description = 'Status'

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('job_title', 'attempts_count', 'created_at')
    search_fields = ('job__title',)
    date_hierarchy = 'created_at'
    list_per_page = 15
    
    def job_title(self, obj):
        return format_html(
            '<div style="min-width: 200px;">'
            '<strong>{}</strong><br>'
            '<small style="color: #666;">{}</small>'
            '</div>',
            obj.job.title,
            obj.job.posted_by.company_name
        )
    job_title.short_description = 'Job'
    
    def attempts_count(self, obj):
        return format_html(
            '<span style="background-color: #17a2b8; color: white; padding: 3px 10px; border-radius: 10px;">{}</span>',
            obj.attempts.count()
        )
    attempts_count.short_description = 'Attempts'

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz_info', 'score_badge', 'completed_at')
    list_filter = ('completed_at', 'score')
    search_fields = ('user__email', 'quiz__job__title')
    date_hierarchy = 'completed_at'
    list_per_page = 15
    
    def quiz_info(self, obj):
        return format_html(
            '<div style="min-width: 200px;">'
            '<strong>{}</strong><br>'
            '<small style="color: #666;">{}</small>'
            '</div>',
            obj.quiz.job.title,
            obj.quiz.job.posted_by.company_name
        )
    quiz_info.short_description = 'Quiz'
    
    def score_badge(self, obj):
        color = '#28a745' if obj.score >= 70 else '#dc3545'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 10px;">{}</span>',
            color,
            f"{obj.score}%"
        )
    score_badge.short_description = 'Score'
