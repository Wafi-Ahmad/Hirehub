from django.contrib import admin
from django.utils.html import format_html
from recruitmentAPI.models import User, Post, Comment, Role, ConnectionRequest

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'user_type', 'is_active', 'is_staff', 'profile_picture_preview')
    list_filter = ('user_type', 'is_active', 'is_staff', 'preferred_job_type')
    search_fields = ('email', 'first_name', 'last_name', 'company_name')
    fieldsets = (
        ('Basic Information', {
            'fields': ('email', 'password', 'first_name', 'last_name', 'date_of_birth', 'profile_picture')
        }),
        ('User Type & Company', {
            'fields': ('user_type', 'company_name')
        }),
        ('Job Preferences', {
            'fields': ('preferred_job_category', 'preferred_job_type', 'desired_salary_range', 'preferred_location')
        }),
        ('Profile Details', {
            'fields': ('skills', 'experience', 'recent_work', 'current_work', 'contact_details')
        }),
        ('Privacy Settings', {
            'fields': ('is_profile_public', 'show_email', 'show_skills', 'show_experience', 
                      'show_recent_work', 'show_current_work')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser')
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
