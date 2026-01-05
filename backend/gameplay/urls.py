from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'games', views.GameViewSet, basename='game')

# Gameplay API URL patterns
urlpatterns = [
    # Game statistics
    path('stats/', views.game_stats, name='game_stats'),
    
    # Recent games history
    path('recent/', views.recent_games, name='recent_games'),
    
    # Include router URLs (games)
    path('', include(router.urls)),
]