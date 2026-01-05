from django.urls import path
from . import views

urlpatterns = [
    # Checkout
    path('checkout/', views.create_checkout, name='create_checkout'),
    
    # Webhook (must be publicly accessible)
    path('webhook/', views.lemonsqueezy_webhook, name='lemonsqueezy_webhook'),
    
    # Payment history
    path('history/', views.payment_history, name='payment_history'),
]
