from django.urls import path
from . import views

# Authentication API URL patterns
urlpatterns = [
    # Authentication endpoints
    path('login/', views.CustomAuthToken.as_view(), name='api_login'),
    path('register/', views.register_user, name='api_register'),
    path('google-oauth/', views.google_oauth, name='google_oauth'),
    path('change-password/', views.change_password, name='change_password'),
    
    # User profile endpoints
    path('profile/', views.user_profile, name='user_profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('profile/avatar/', views.update_avatar, name='update_avatar'),
    path("password-reset/", views.PasswordResetRequestAPI.as_view(), name="password_reset_api"),
    path("password-reset-confirm/", views.PasswordResetConfirmAPI.as_view(), name="password_reset_confirm_api"),
    
]