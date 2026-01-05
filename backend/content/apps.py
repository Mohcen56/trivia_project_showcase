from django.apps import AppConfig


class ContentConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'content'

    def ready(self):
        import helpers.cloudflare.post_delete
        # Signals removed - optimization now happens in model.save()