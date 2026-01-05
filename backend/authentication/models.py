from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, help_text='User profile picture')
    bio = models.TextField(blank=True, help_text='User biography')
    date_updated = models.DateTimeField(auto_now=True)
    # Flattened membership fields for unified admin and faster reads
    is_premium = models.BooleanField(default=False)
    premium_expiry = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        """Optimize avatar before saving"""
        import logging
        from content.image_optimizer import validate_and_optimize_image
        
        logger = logging.getLogger(__name__)
        
        # Optimize avatar if uploaded
        if self.avatar and hasattr(self.avatar, 'file'):
            try:
                optimized = validate_and_optimize_image(
                    self.avatar,
                    max_size_mb=5,
                    allowed_types=['image/jpeg', 'image/png', 'image/gif', 'image/webp']
                )
                if optimized != self.avatar:
                    self.avatar = optimized
                    logger.debug(f'Optimized avatar for user {self.user.username}')
            except Exception as e:
                logger.warning(f"Avatar optimization failed for {self.user.username}: {e}")
                # Continue with original avatar
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    @property
    def avatar_url(self):
        """Return avatar URL or default avatar"""
        if self.avatar and hasattr(self.avatar, 'url'):
            return self.avatar.url
        return '/media/avatars/default.jpg'


# Extend User model with additional properties
def get_avatar_url(self):
    """Get user avatar URL"""
    try:
        return self.userprofile.avatar_url
    except UserProfile.DoesNotExist:
        return '/media/avatars/default.jpg'

def get_avatar(self):
    """Get user avatar field"""
    try:
        return self.userprofile.avatar
    except UserProfile.DoesNotExist:
        return None

# Add avatar methods to User model
User.add_to_class("avatar_url", property(get_avatar_url))
User.add_to_class("avatar", property(get_avatar))


# Premium helpers on User for unified access
def get_is_premium(self):
    """Unified premium flag from profile only (membership removed)."""
    try:
        prof = self.userprofile
        if prof.is_premium:
            if prof.premium_expiry is None:
                return True
            from django.utils import timezone
            return prof.premium_expiry >= timezone.now().date()
        return False
    except UserProfile.DoesNotExist:
        return False


def get_premium_expiry(self):
    try:
        return self.userprofile.premium_expiry
    except UserProfile.DoesNotExist:
        return None


User.add_to_class("is_premium", property(get_is_premium))
User.add_to_class("premium_expiry", property(get_premium_expiry))


# Signal handlers to automatically create UserProfile when User is created
@receiver(post_save, sender=User)
def create_user_related_objects(sender, instance, created, **kwargs):
    """Create UserProfile when a new User is created"""
    if created:
        UserProfile.objects.get_or_create(user=instance)
