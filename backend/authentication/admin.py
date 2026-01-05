from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    fk_name = 'user'
    extra = 0
    fields = ('avatar', 'bio', 'is_premium', 'premium_expiry', 'date_updated')
    readonly_fields = ('date_updated',)
    verbose_name_plural = 'Profile'


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_select_related = ('userprofile',)


# Unregister the original User admin and register the customized one
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user_username', 'user_email', 'avatar', 'is_premium', 'premium_expiry', 'date_updated']
    search_fields = ['user__username', 'user__email', 'bio']
    list_filter = ['is_premium', 'date_updated']
    readonly_fields = ('date_updated',)
    fields = ('user', 'avatar', 'bio', 'is_premium', 'premium_expiry', 'date_updated')

    def user_username(self, obj):
        return obj.user.username
    user_username.short_description = 'Username'

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'
