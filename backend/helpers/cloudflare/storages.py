try:
    # django-storages >= 1.14 renames the backend module to storages.backends.s3
    from storages.backends.s3 import S3Storage
except ImportError:  # pragma: no cover - fallback for older versions
    from storages.backends.s3boto3 import S3Boto3Storage as S3Storage

class StaticFileStorage(S3Storage):
# helpers.cloudflare.storages.StaticFileStorage
    location = "static"

class MediaFileStorage(S3Storage):
# helpers.cloudflare.storages.MediaFileStorage
    location = "media"
