from django.contrib import admin
from .models import Payment, Subscription


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['user', 'order_id', 'amount', 'currency', 'status', 'paid_at', 'created_at']
    list_filter = ['status', 'currency', 'created_at']
    search_fields = ['user__username', 'user__email', 'order_id', 'customer_id']
    readonly_fields = ['created_at', 'updated_at', 'webhook_data']
    date_hierarchy = 'created_at'


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'subscription_id', 'status', 'renews_at', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'user__email', 'subscription_id', 'customer_id']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
