from django.db import models
from django.contrib.auth.models import User


class Payment(models.Model):
    """Track payment transactions"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    
    # Lemon Squeezy identifiers
    order_id = models.CharField(max_length=255, unique=True, help_text='Lemon Squeezy order ID')
    customer_id = models.CharField(max_length=255, blank=True, help_text='Lemon Squeezy customer ID')
    
    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text='Payment amount')
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Product info
    variant_id = models.CharField(max_length=255, help_text='Product variant purchased')
    product_name = models.CharField(max_length=255, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # Raw webhook data for debugging
    webhook_data = models.JSONField(null=True, blank=True, help_text='Raw webhook payload')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['order_id']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.order_id} - {self.status}"


class Subscription(models.Model):
    """Track subscription status"""
    
    STATUS_CHOICES = [
        ('on_trial', 'On Trial'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('past_due', 'Past Due'),
        ('unpaid', 'Unpaid'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    
    # Lemon Squeezy identifiers
    subscription_id = models.CharField(max_length=255, unique=True, help_text='Lemon Squeezy subscription ID')
    customer_id = models.CharField(max_length=255, help_text='Lemon Squeezy customer ID')
    order_id = models.CharField(max_length=255, blank=True, help_text='Initial order ID')
    
    # Subscription details
    variant_id = models.CharField(max_length=255)
    product_name = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    
    # Dates
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    renews_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['subscription_id']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.subscription_id} - {self.status}"
    
    def is_active(self):
        """Check if subscription provides access"""
        return self.status in ['on_trial', 'active']
