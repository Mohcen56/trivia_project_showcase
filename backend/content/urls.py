from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'collections', views.CollectionViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'questions', views.QuestionViewSet)
router.register(r'user-categories', views.UserCategoryViewSet, basename='user-category')

# Content API URL patterns
urlpatterns = [
    # Include router URLs (collections, categories, questions)
    path('', include(router.urls)),
]