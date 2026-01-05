from content.models import Question, Category
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.db.models import FileField, ImageField

@receiver(post_delete)
def auto_delete_files_on_delete(sender, instance, **kwargs):
    """
    Deletes all ImageField and FileField files from storage when their model instance is deleted.
    Works across all apps.
    """
    # Skip built-in Django apps (admin, auth, etc.)
    if sender._meta.app_label in ['contenttypes', 'sessions', 'admin', 'auth']:
        return

    for field in sender._meta.get_fields():
        if isinstance(field, (FileField, ImageField)):
            file_field = getattr(instance, field.name)
            if file_field:
                try:
                    file_field.delete(save=False)
                except Exception as e:
                    print(f"Failed to delete {sender.__name__}.{field.name}: {e}")

