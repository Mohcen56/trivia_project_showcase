from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model"""
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['avatar', 'avatar_url', 'bio', 'date_updated']
    
    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return '/media/avatars/default.jpg'


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with optimized queries"""
    avatar = serializers.SerializerMethodField()
    is_premium = serializers.SerializerMethodField()
    premium_expiry = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined', 'avatar', 'is_premium', 'premium_expiry']
        read_only_fields = ['id', 'date_joined', 'is_premium', 'premium_expiry']
    
    def get_avatar(self, obj):
        # Use prefetched userprofile if available to avoid N+1 queries
        try:
            profile = obj.userprofile
        except (UserProfile.DoesNotExist, AttributeError):
            return '/avatars/thumbs.svg'
        
        if not profile.avatar:
            return '/avatars/thumbs.svg'
        
        request = self.context.get('request')
        avatar_url = profile.avatar.url
        
        # Build absolute URL if request is available
        if request:
            return request.build_absolute_uri(avatar_url)
        
        # Fallback for background tasks without request
        return f'http://127.0.0.1:8000{avatar_url}' if avatar_url.startswith('/') else avatar_url
    
    def get_is_premium(self, obj):
        """Premium based on profile only (membership removed)."""
        try:
            prof = obj.userprofile
            if prof.is_premium:
                if prof.premium_expiry is None:
                    return True
                from django.utils import timezone
                return prof.premium_expiry >= timezone.now().date()
            return False
        except (UserProfile.DoesNotExist, AttributeError):
            return False

    def get_premium_expiry(self, obj):
        try:
            return obj.userprofile.premium_expiry
        except (UserProfile.DoesNotExist, AttributeError):
            return None


# Membership removed; no MembershipSerializer