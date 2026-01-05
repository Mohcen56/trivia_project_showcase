from django.contrib import admin
from django.db.models import Count
from django.urls import path
from django.shortcuts import redirect
from django.contrib import messages
from .models import Collection, Category, Question, SavedCategory, CategoryLike
from .utils import shuffle_category_questions


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'order']
    ordering = ['order', 'name']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'is_hidden', 'locked', 'is_custom', 'is_approved', 'created_by', 'privacy', 'collection', 'likes_count', 'created_at']
    list_filter = ['is_hidden', 'locked', 'is_custom', 'is_approved', 'privacy', 'collection']
    search_fields = ['id', 'name', 'description', 'created_by__username']
    fields = ['name', 'description', 'image', 'collection', 'locked', 'is_hidden', 'is_custom', 'is_approved', 'privacy', 'created_by', 'created_at', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['approve_categories', 'reject_categories', 'hide_categories', 'unhide_categories']
    inlines = []

    def save_model(self, request, obj, form, change):
        """Ensure reassigned categories are visible to the new owner by saving to their collection."""
        previous_owner_id = None
        if change and obj.pk:
            previous_owner_id = Category.objects.filter(pk=obj.pk).values_list("created_by_id", flat=True).first()

        super().save_model(request, obj, form, change)

        # If category has an owner, make sure it is saved for them
        if obj.created_by:
            from content.models import SavedCategory
            SavedCategory.objects.get_or_create(user=obj.created_by, category=obj)

        # Optionally clean up the old owner's saved link when ownership changes
        if change and previous_owner_id and previous_owner_id != obj.created_by_id:
            from content.models import SavedCategory
            SavedCategory.objects.filter(user_id=previous_owner_id, category=obj).delete()
    
    def get_urls(self):
        """Add custom URL for shuffle action"""
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:category_id>/shuffle/',
                self.admin_site.admin_view(self.shuffle_questions_view),
                name='content_category_shuffle',
            ),
        ]
        return custom_urls + urls
    
    def shuffle_questions_view(self, request, category_id):
        """Handle shuffle button click"""
        category = Category.objects.get(pk=category_id)
        count = shuffle_category_questions(category_id)
        messages.success(request, f'🎲 Shuffled {count} questions in category "{category.name}"!')
        return redirect('admin:content_category_change', category_id)
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        """Add shuffle button to category change page"""
        extra_context = extra_context or {}
        extra_context['show_shuffle_button'] = True
        return super().change_view(request, object_id, form_url, extra_context)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Annotate likes count for efficient list display and sorting
        return qs.annotate(_likes_count=Count('likes'))

    @admin.display(description='Likes')
    def likes_count(self, obj):
        return getattr(obj, '_likes_count', obj.likes.count())
    likes_count.admin_order_field = '_likes_count'
    
    def approve_categories(self, request, queryset):
        """Bulk approve selected categories"""
        updated = queryset.update(is_approved=True)
        self.message_user(request, f'{updated} categories have been approved.')
    approve_categories.short_description = "Approve selected categories"
    
    def reject_categories(self, request, queryset):
        """Bulk reject selected categories"""
        updated = queryset.update(is_approved=False)
        self.message_user(request, f'{updated} categories have been rejected.')
    reject_categories.short_description = "Reject selected categories"
    
    def hide_categories(self, request, queryset):
        """Hide selected categories from users"""
        updated = queryset.update(is_hidden=True)
        self.message_user(request, f'🙈 Hidden {updated} categories from users.')
    hide_categories.short_description = "Hide selected categories"
    
    def unhide_categories(self, request, queryset):
        """Unhide selected categories"""
        updated = queryset.update(is_hidden=False)
        self.message_user(request, f'👁️ Unhidden {updated} categories (now visible to users).')
    unhide_categories.short_description = "Unhide selected categories"


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'text','answer', 'category', 'difficulty', 'points', 'has_image', 'has_answer_image']
    # Use field-based empty filters to emulate "has_image"/"has_answer_image" booleans
    # This avoids admin.E116 since these refer to real model fields
    list_filter = [
        'category',
        'difficulty',
        ('image', admin.EmptyFieldListFilter),
        ('answer_image', admin.EmptyFieldListFilter),
    ]
    search_fields = ['id', 'text', 'answer']
    readonly_fields = ['points']
    actions = ['duplicate_to_categories']

    @admin.display(description='Image', boolean=True)
    def has_image(self, obj):
        return bool(obj.image)

    @admin.display(description='Answer Image', boolean=True)
    def has_answer_image(self, obj):
        return bool(obj.answer_image)
    
    @admin.action(description='Duplicate selected questions')
    def duplicate_to_categories(self, request, queryset):
        """Admin action to duplicate questions (you can then edit the category manually)"""
        from django.contrib import messages
        
        duplicated_count = 0
        
        for question in queryset:
            # Create duplicate with same category and images
            Question.objects.create(
                category=question.category,  # Same category - you'll change it manually
                text=question.text,
                text_ar=question.text_ar,
                answer=question.answer,
                answer_ar=question.answer_ar,
                choice_2=question.choice_2,
                choice_3=question.choice_3,
                choice_4=question.choice_4,
                difficulty=question.difficulty,
                image=question.image,  # Same image reference
                answer_image=question.answer_image,  # Same answer image reference
                image_hash=question.image_hash,
                answer_image_hash=question.answer_image_hash,
            )
            duplicated_count += 1
        
        messages.success(request, f'✅ Successfully duplicated {duplicated_count} question(s)! Now you can edit them to change the category.')
        return


@admin.register(SavedCategory)
class SavedCategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'category', 'saved_at']
    list_filter = ['saved_at']
    search_fields = ['id', 'user__username', 'category__name']
    readonly_fields = ['saved_at']


@admin.register(CategoryLike)
class CategoryLikeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'category', 'created_at']
    list_filter = ['created_at']
    search_fields = ['id', 'user__username', 'category__name']
    readonly_fields = ['created_at']

class CategoryLikeInline(admin.TabularInline):
    model = CategoryLike
    extra = 0
    readonly_fields = ['user', 'created_at']

# Attach inline to Category admin (after class definition)
CategoryAdmin.inlines.append(CategoryLikeInline)
