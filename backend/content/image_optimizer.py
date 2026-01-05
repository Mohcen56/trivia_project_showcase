"""
Image optimization utilities using pyvips for high performance and low memory usage.
Optimizes images for Cloudflare R2 storage with minimal footprint.
"""
import io
import pyvips
from typing import Optional, Tuple
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)


def validate_and_optimize_image(image_file, max_size_mb=5, allowed_types=None):
    """
    Centralized function to validate and optimize image uploads.
    
    Args:
        image_file: Django UploadedFile or ImageFieldFile object
        max_size_mb: Maximum file size in megabytes (default: 10MB)
        allowed_types: List of allowed MIME types (default: common image types)
    
    Returns:
        ContentFile: Optimized image as ContentFile (WebP format)
    
    Raises:
        ValueError: If validation fails (wrong type or too large)
        Exception: If optimization fails
    """
    if allowed_types is None:
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
    
    # Handle both UploadedFile (has content_type) and ImageFieldFile (already saved)
    content_type = getattr(image_file, 'content_type', None)
    
    # Validate file type (skip if already saved ImageFieldFile)
    if content_type and content_type not in allowed_types:
        raise ValueError(
            f'Invalid file type. Allowed types: {", ".join(allowed_types)}'
        )
    
    # Validate file size
    max_size_bytes = max_size_mb * 1024 * 1024
    if image_file.size > max_size_bytes:
        raise ValueError(
            f'File too large. Maximum size is {max_size_mb}MB.'
        )
    
    try:
        # Read uploaded file
        image_file.seek(0)
        image_data = image_file.read()
        
        logger.info(f'Starting optimization for {image_file.name} ({len(image_data)} bytes)')
        
        # Optimize to WebP
        optimized_data = optimize_for_cloudflare(image_data)
        
        # Create new filename with .webp extension (strip directory path to avoid duplication)
        original_name = image_file.name
        # Extract just the filename without path (e.g., 'questions/image.jpg' -> 'image.jpg')
        filename_only = original_name.split('/')[-1]
        base_name = filename_only.rsplit('.', 1)[0] if '.' in filename_only else filename_only
        new_name = f"{base_name}.webp"
        
        logger.info(f'✅ Optimized image: {original_name} -> {new_name} ({len(optimized_data)} bytes, {(1 - len(optimized_data)/len(image_data))*100:.1f}% reduction)')
        
        # Return optimized image as ContentFile
        return ContentFile(optimized_data, name=new_name)
        
    except Exception as e:
        logger.error(f'Image optimization failed: {str(e)}', exc_info=True)
        raise


class ImageOptimizer:
    """
    High-performance image optimizer using libvips.
    Provides aggressive compression while maintaining visual quality.
    """
    
    # Responsive breakpoints for generating variants
    SIZES = {
        'small': 480,   # Mobile portrait
        'medium': 768,  # Tablet/mobile landscape
        'large': 1280,  # Desktop (most questions don't need larger)
    }
    
    # WebP quality settings (70-80 is sweet spot for size vs quality)
    WEBP_QUALITY = 70
    WEBP_EFFORT = 6  # Compression effort (0-6, higher = smaller but slower)
    
    # Strip all metadata to save space
    STRIP_METADATA = True
    
    @staticmethod
    def optimize_image(
        image_bytes: bytes,
        max_width: int = 1280,
        max_height: int = 768,
        quality: int = 65,
        format: str = 'webp',
        strip_metadata: bool = True
    ) -> bytes:
        """
        Optimize a single image with specified parameters.
        
        Args:
            image_bytes: Raw image data
            max_width: Maximum width in pixels
            max_height: Maximum height in pixels
            quality: Output quality (1-100)
            format: Output format ('webp', 'jpeg', 'png')
            strip_metadata: Remove EXIF/metadata to save space
            
        Returns:
            Optimized image bytes
        """
        try:
            logger.debug(f'Loading image with pyvips (size: {len(image_bytes)} bytes)')
            
            # Load image from buffer (access=sequential for low memory)
            image = pyvips.Image.new_from_buffer(image_bytes, '', access='sequential')
            
            logger.debug(f'Image loaded: {image.width}x{image.height}, format: {image.format}')
            
            # Auto-rotate based on EXIF orientation
            if image.get_typeof('orientation') != 0:
                image = image.autorot()
            
            # Resize if needed (maintains aspect ratio, respects both width and height limits)
            if image.width > max_width or image.height > max_height:
                # Calculate scale factor to fit within both dimensions
                width_scale = max_width / image.width if image.width > max_width else 1.0
                height_scale = max_height / image.height if image.height > max_height else 1.0
                scale = min(width_scale, height_scale)  # Use smaller scale to fit both constraints
                logger.debug(f'Resizing image with scale factor: {scale}')
                image = image.resize(scale, kernel='lanczos3')
            
            # Strip metadata if requested (saves significant space)
            if strip_metadata:
                image = image.copy()  # Create clean copy without metadata
            
            # Encode to target format
            if format.lower() == 'webp':
                logger.debug(f'Encoding to WebP (quality={quality}, effort={ImageOptimizer.WEBP_EFFORT})')
                output = image.webpsave_buffer(
                    Q=quality,
                    effort=ImageOptimizer.WEBP_EFFORT,
                    strip=strip_metadata,
                    smart_subsample=True,  # Better quality at same size
                    alpha_q=quality,  # Also compress alpha channel
                )
            elif format.lower() == 'jpeg' or format.lower() == 'jpg':
                # Convert to RGB if has alpha channel
                if image.hasalpha():
                    image = image.flatten(background=[255, 255, 255])
                output = image.jpegsave_buffer(
                    Q=quality,
                    optimize_coding=True,
                    strip=strip_metadata,
                    interlace=True,  # Progressive JPEG
                )
            elif format.lower() == 'png':
                output = image.pngsave_buffer(
                    compression=9,
                    strip=strip_metadata,
                )
            else:
                # Default to WebP
                output = image.webpsave_buffer(Q=quality, strip=strip_metadata)
            
            logger.debug(f'Image encoded successfully: {len(output)} bytes')
            return output
            
        except ImportError as e:
            logger.error(f"❌ pyvips not available: {e}")
            raise Exception(f"Image optimization library (pyvips) not installed. Please install libvips and pyvips.")
        except Exception as e:
            logger.error(f"❌ Failed to optimize image: {str(e)}", exc_info=True)
            raise Exception(f"Failed to optimize image: {str(e)}")
    
    @staticmethod
    def create_responsive_variants(image_bytes: bytes) -> dict:
        """
        Create multiple optimized variants for responsive delivery.
        Returns dict with size names as keys and optimized bytes as values.
        
        This is the most storage-efficient approach: create exactly the sizes
        you need and delete the original.
        
        Returns:
            {
                'small': bytes,   # 480px width WebP
                'medium': bytes,  # 768px width WebP
                'large': bytes,   # 1280px width WebP
            }
        """
        variants = {}
        
        for size_name, width in ImageOptimizer.SIZES.items():
            try:
                optimized = ImageOptimizer.optimize_image(
                    image_bytes,
                    max_width=width,
                    quality=ImageOptimizer.WEBP_QUALITY,
                    format='webp',
                    strip_metadata=ImageOptimizer.STRIP_METADATA
                )
                variants[size_name] = optimized
            except Exception as e:
                print(f"Warning: Failed to create {size_name} variant: {e}")
        
        return variants
    
    @staticmethod
    def get_optimized_size(original_bytes: bytes, optimized_bytes: bytes) -> Tuple[int, int, float]:
        """
        Calculate size savings.
        
        Returns:
            (original_kb, optimized_kb, savings_percent)
        """
        orig_kb = len(original_bytes) / 1024
        opt_kb = len(optimized_bytes) / 1024
        savings = ((orig_kb - opt_kb) / orig_kb) * 100
        return (round(orig_kb, 2), round(opt_kb, 2), round(savings, 2))


def optimize_for_cloudflare(image_bytes: bytes) -> bytes:
    """
    Quick helper: optimize image with sensible defaults for Cloudflare R2.
    This is the simplest API - just pass bytes, get optimized bytes.
    
    - Resizes to max 1280px (good for desktop)
    - Converts to WebP with Q=75
    - Strips all metadata
    - Typical savings: 50-80% smaller
    
    Usage:
        optimized = optimize_for_cloudflare(original_bytes)
    """
    return ImageOptimizer.optimize_image(
        image_bytes,
        max_width=1280,
        max_height=768,
        quality=70,
        format='webp',
        strip_metadata=True
    )
