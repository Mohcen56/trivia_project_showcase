import hashlib
from django.db import models
from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from io import BytesIO

def get_file_hash(file):
    """Return a SHA-256 hash of the uploaded file contents."""
    hasher = hashlib.sha256()
    for chunk in file.chunks():
        hasher.update(chunk)
    return hasher.hexdigest()

class Collection(models.Model):
    name = models.CharField(max_length=100, help_text='Collection name (e.g., "Anime & Manga")')
    order = models.IntegerField(default=0, help_text='Display order (lower numbers first)')

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Category(models.Model):
    PRIVACY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]
    
    name = models.CharField(max_length=100)
    locked = models.BooleanField(default=False)  # True = only premium users can access
    is_hidden = models.BooleanField(default=False, help_text='True = category is hidden from users (but not deleted)')
    image = models.ImageField(upload_to='categories/', blank=True, null=True, help_text='Category image/icon')
    description = models.TextField(blank=True, help_text='Optional description for the category')
    collection = models.ForeignKey(Collection, on_delete=models.SET_NULL, null=True, blank=True, related_name='categories')
    
    # User-created category fields
    is_custom = models.BooleanField(default=False, help_text='True if created by a user')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='created_categories', help_text='User who created this category')
    is_approved = models.BooleanField(default=False, help_text='True if approved by admin for public use')
    privacy = models.CharField(max_length=10, choices=PRIVACY_CHOICES, default='public', help_text='Public or private category')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['is_custom', 'is_approved', 'privacy']),
            models.Index(fields=['created_by', 'created_at']),
            models.Index(fields=['is_custom', 'privacy']),
        ]
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        """Optimize category image before saving"""
        import logging
        from content.image_optimizer import validate_and_optimize_image
        
        logger = logging.getLogger(__name__)
        
        # Optimize category image if uploaded and not already WebP
        if self.image and hasattr(self.image, 'file') and not self.image.name.endswith('.webp'):
            try:
                optimized = validate_and_optimize_image(self.image)
                if optimized != self.image:
                    self.image = optimized
                    logger.info(f'✅ Optimized category image for "{self.name}" to WebP')
            except Exception as e:
                logger.warning(f"Category image optimization failed: {e}")
                # Continue with original image
        
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Question(models.Model):
    DIFFICULTY_CHOICES = [
        ('200', '200 '),
        ('400', '400 '),
        ('600', '600 '),
    ]

    category = models.ForeignKey('Category', on_delete=models.CASCADE)
    text = models.TextField()
    text_ar = models.TextField(blank=True)

    answer = models.CharField(max_length=200)
    choice_2 = models.CharField(max_length=255, blank=True, null=True)
    choice_3 = models.CharField(max_length=255, blank=True, null=True)
    choice_4 = models.CharField(max_length=255, blank=True, null=True)
    answer_ar = models.CharField(max_length=200, blank=True)

    image = models.ImageField(upload_to='questions/', blank=True, null=True, max_length=200)
    answer_image = models.ImageField(upload_to='answers/', blank=True, null=True, max_length=200)

    image_hash = models.CharField(max_length=64, blank=True, null=True, editable=False)
    answer_image_hash = models.CharField(max_length=64, blank=True, null=True, editable=False)

    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='200')
    random_key = models.FloatField(default=0.5, db_index=True, help_text='Pre-shuffled order key for fast random queries')

    class Meta:
        indexes = [
            models.Index(fields=['category', 'difficulty']),
            models.Index(fields=['category', 'random_key']),
        ]

    def __init__(self, *args, **kwargs):
        """Track original image paths to detect changes"""
        super().__init__(*args, **kwargs)
        # Store original image paths from database
        # Use try/except because field might not be loaded yet
        try:
            self._original_image = self.image.name if self.image else None
        except:
            self._original_image = None
        try:
            self._original_answer_image = self.answer_image.name if self.answer_image else None
        except:
            self._original_answer_image = None

    def save(self, *args, **kwargs):
        """Optimize images before saving using centralized utility"""
        import logging
        import hashlib
        from django.core.files.base import ContentFile
        from content.image_optimizer import validate_and_optimize_image
        
        logger = logging.getLogger(__name__)
        
        # Detect if this is a new object
        is_new = self.pk is None
        
        # Debug logging
        logger.info(f'📋 Question save() called: pk={self.pk}, is_new={is_new}')
        logger.info(f'   Image: current={self.image.name if self.image else None}, original={self._original_image}')
        logger.info(f'   Answer Image: current={self.answer_image.name if self.answer_image else None}, original={self._original_answer_image}')
        
        # Check if image field has changed from original database value
        # For new objects, _original_image is None, so any image is "changed"
        # For existing objects, compare current name to original
        image_changed = (
            self.image and self.image.name and
            self.image.name != self._original_image
        )
        
        answer_image_changed = (
            self.answer_image and self.answer_image.name and
            self.answer_image.name != self._original_answer_image
        )
        
        logger.info(f'   Detection: image_changed={image_changed}, answer_image_changed={answer_image_changed}')
        
        # Special case: Check if JPG file is missing but WebP version exists
        # This handles when user re-uploads a broken JPG image
        # Do this BEFORE checking hasattr to avoid trying to open missing files
        if self.image and self.image.name and self.image.name.endswith(('.jpg', '.jpeg')):
            # Generate the .webp equivalent filename
            webp_name = self.image.name.rsplit('.', 1)[0] + '.webp'
            if default_storage.exists(webp_name):
                logger.info(f'🔄 JPG missing but WebP exists: {self.image.name} → {webp_name}')
                self.image.name = webp_name
                image_changed = False  # Don't process as changed since we're just fixing reference
        
        if self.answer_image and self.answer_image.name and self.answer_image.name.endswith(('.jpg', '.jpeg')):
            webp_name = self.answer_image.name.rsplit('.', 1)[0] + '.webp'
            if default_storage.exists(webp_name):
                logger.info(f'🔄 JPG missing but WebP exists: {self.answer_image.name} → {webp_name}')
                self.answer_image.name = webp_name
                answer_image_changed = False
        
        # Optimize if: has image AND not already WebP (force optimization even if filename unchanged)
        # This fixes the issue where re-uploading same JPG filename doesn't trigger conversion
        # Use try-except to safely check for 'file' attribute without triggering file access
        should_optimize_image = False
        if self.image and not self.image.name.endswith('.webp'):
            try:
                should_optimize_image = hasattr(self.image, 'file')
            except Exception:
                should_optimize_image = False
        
        should_optimize_answer = False
        if self.answer_image and not self.answer_image.name.endswith('.webp'):
            try:
                should_optimize_answer = hasattr(self.answer_image, 'file')
            except Exception:
                should_optimize_answer = False
        
        logger.info(f'   Should optimize: image={should_optimize_image}, answer={should_optimize_answer}')
        
        # Optimize and deduplicate question image if needed
        if should_optimize_image:
            try:
                logger.info(f'🔄 Optimizing question image: {self.image.name}')
                optimized = validate_and_optimize_image(self.image)
                
                # Calculate hash of optimized image for deduplication
                optimized.seek(0)
                image_data = optimized.read()
                optimized.seek(0)
                image_hash = hashlib.sha256(image_data).hexdigest()
                
                # Check if current image file exists - if not, don't deduplicate (user is fixing broken reference)
                current_exists = self._original_image and default_storage.exists(self._original_image)
                
                # Check if this exact image already exists in another question
                # Only deduplicate if current image exists (not fixing a broken reference)
                existing = None
                if current_exists:
                    existing = Question.objects.filter(image_hash=image_hash).exclude(pk=self.pk).first()
                
                if existing and existing.image and current_exists:
                    # Reuse existing image path instead of uploading duplicate
                    logger.info(f'♻️ Reusing existing image from question {existing.pk} (hash: {image_hash[:8]}...)')
                    self.image = existing.image.name
                    self.image_hash = image_hash
                else:
                    # New unique image OR fixing broken reference - save it with new name
                    if optimized != self.image:
                        self.image = optimized
                    self.image_hash = image_hash
                    if not current_exists:
                        logger.info(f'✅ Replacing broken image with new upload (hash: {image_hash[:8]}...)')
                    else:
                        logger.info(f'✅ Question image optimized and converted to WebP (hash: {image_hash[:8]}...)')
                    
            except Exception as e:
                logger.error(f"❌ Question image optimization failed: {e}", exc_info=True)
                # Continue with original
                
        # Optimize and deduplicate answer image if needed
        if should_optimize_answer:
            try:
                logger.info(f'🔄 Optimizing answer image: {self.answer_image.name}')
                optimized = validate_and_optimize_image(self.answer_image)
                
                # Calculate hash of optimized image for deduplication
                optimized.seek(0)
                image_data = optimized.read()
                optimized.seek(0)
                answer_hash = hashlib.sha256(image_data).hexdigest()
                
                # Check if current answer image file exists - if not, don't deduplicate
                current_exists = self._original_answer_image and default_storage.exists(self._original_answer_image)
                
                # Check if this exact image already exists in another question
                # Only deduplicate if current image exists (not fixing a broken reference)
                existing = None
                if current_exists:
                    existing = Question.objects.filter(answer_image_hash=answer_hash).exclude(pk=self.pk).first()
                
                if existing and existing.answer_image and current_exists:
                    # Reuse existing image path instead of uploading duplicate
                    logger.info(f'♻️ Reusing existing answer image from question {existing.pk} (hash: {answer_hash[:8]}...)')
                    self.answer_image = existing.answer_image.name
                    self.answer_image_hash = answer_hash
                else:
                    # New unique image OR fixing broken reference - save it
                    if optimized != self.answer_image:
                        self.answer_image = optimized
                    self.answer_image_hash = answer_hash
                    if not current_exists:
                        logger.info(f'✅ Replacing broken answer image with new upload (hash: {answer_hash[:8]}...)')
                    else:
                        logger.info(f'✅ Answer image optimized and converted to WebP (hash: {answer_hash[:8]}...)')
                    
            except Exception as e:
                logger.error(f"❌ Answer image optimization failed: {e}", exc_info=True)
                # Continue with original
        
        super().save(*args, **kwargs)
        
        # Update tracking after save so subsequent saves work correctly
        self._original_image = self.image.name if self.image else None
        self._original_answer_image = self.answer_image.name if self.answer_image else None

    @property
    def points(self):
        return int(self.difficulty)
class SavedCategory(models.Model):
    """Track which users have saved which categories to their personal collection"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_categories')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='saved_by_users')
    saved_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'category']),
        ]
        unique_together = ['user', 'category']
        ordering = ['-saved_at']
    
    def __str__(self):
        return f"{self.user.username} saved {self.category.name}"


class CategoryLike(models.Model):
    """Tracks user likes on categories"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='category_likes')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'category']),
        ]
        unique_together = ['user', 'category']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} liked {self.category.name}"
