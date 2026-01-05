"""
Payment views for Lemon Squeezy integration.
"""
import json
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from authentication.models import UserProfile
from .models import Payment, Subscription
from .lemonsqueezy_client import LemonSqueezyClient

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout(request):
    """
    Create a Lemon Squeezy checkout session.
    
    Expected payload:
    {
        "variant_id": "123456",  # Required: Lemon Squeezy variant ID
        "plan": "premium"         # Optional: plan identifier
    }
    """
    user = request.user
    # ALWAYS use server-configured variant_id (ignore client-supplied value)
    variant_id = settings.LEMONSQUEEZY_VARIANT_ID
    
    if not variant_id:
        return Response(
            {
                "error": "Payment system not configured",
                "detail": "LEMONSQUEEZY_VARIANT_ID missing in server environment",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    # Initialize Lemon Squeezy client
    try:
        client = LemonSqueezyClient()
    except ValueError as e:
        logger.error(f"Lemon Squeezy configuration error: {e}")
        return Response(
            {
                "error": "Payment system not configured",
                "detail": "Please contact support. Payment processing is currently unavailable."
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    # Log which variant_id is being used (helps debug Railway env issues)
    logger.info(
        f"Creating checkout for user {user.id} with STORE_ID={settings.LEMONSQUEEZY_STORE_ID} VARIANT_ID={variant_id}"
    )
    
    # Custom data to pass through webhook
    custom_data = {
        "user_id": str(user.id),
        "username": user.username,
        "plan": request.data.get('plan', 'premium')
    }
    
    # Create checkout session
    result = client.create_checkout(
        variant_id=variant_id,
        customer_email=user.email,
        customer_name=user.username,
        custom_data=custom_data
    )
    
    if not result.get('success'):
        logger.error(
            "Checkout creation failed for user %s: %s | debug=%s",
            user.id,
            result.get('error'),
            result.get('debug')
        )
        return Response(
            {
                "error": "Failed to create checkout session",
                "hint": result.get('hint'),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response({
        "checkout_url": result['checkout_url'],
        "message": "Checkout session created successfully"
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def lemonsqueezy_webhook(request):
    """
    Handle Lemon Squeezy webhooks.
    
    Events handled:
    - order_created: One-time purchase completed (lifetime access)
    - order_refunded: One-time purchase refunded (revoke access)
    - affiliate_activated: (optional, currently disabled)
    """
    logger.info("=== Webhook received ===")
    logger.info(f"Headers: {dict(request.headers)}")
    
    # Verify webhook signature (optional in DEBUG mode)
    signature = request.headers.get('X-Signature', '')
    
    if settings.DEBUG:
        logger.info("🔓 DEBUG mode: Skipping signature verification")
    else:
        client = LemonSqueezyClient()
        if not client.verify_webhook_signature(request.body, signature):
            logger.warning("❌ Invalid webhook signature received")
            return Response(
                {"error": "Invalid signature"},
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    # Parse webhook data
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        logger.error("Invalid JSON in webhook payload")
        return Response(
            {"error": "Invalid JSON"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    event_name = data.get('meta', {}).get('event_name')
    logger.info(f"Received webhook: {event_name}")
    
    # Route to appropriate handler
    handlers = {
        'order_created': _handle_order_created,
        'order_refunded': _handle_order_refunded,
        # 'affiliate_activated': _handle_affiliate_activated,  # Optional: not enabled
    }
    
    handler = handlers.get(event_name)
    if handler:
        try:
            handler(data)
            return Response({"status": "success"})
        except Exception as e:
            logger.error(f"Error handling {event_name}: {e}", exc_info=True)
            return Response(
                {"error": "Processing failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    else:
        logger.warning(f"Unhandled webhook event: {event_name}")
        return Response({"status": "ignored"})


def _handle_order_created(data):
    """Handle one-time purchase (lifetime access)"""
    attributes = data.get('data', {}).get('attributes', {})
    # Lemon Squeezy passes checkout custom data under meta.custom_data
    custom_data = data.get('meta', {}).get('custom_data', {})
    
    user_id = custom_data.get('user_id')
    if not user_id:
        logger.error("No user_id in custom_data")
        return
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return
    
    # Determine order identifiers safely
    order_id = str(data.get('data', {}).get('id') or attributes.get('order_id') or attributes.get('order_number'))
    customer_id = str(attributes.get('customer_id', ''))
    first_item = attributes.get('first_order_item') or {}
    variant_id = str(first_item.get('variant_id', ''))
    product_name = first_item.get('product_name', '')
    amount = attributes.get('total', 0)
    currency = attributes.get('currency', '')
    status_value = attributes.get('status', 'paid')

    # Create payment record
    Payment.objects.create(
        user=user,
        order_id=order_id,
        customer_id=customer_id,
        amount=amount,
        currency=currency,
        status=status_value,
        variant_id=variant_id,
        product_name=product_name,
        paid_at=timezone.now(),
        webhook_data=data
    )
    
    # Grant lifetime premium access (no expiry)
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.is_premium = True
    profile.premium_expiry = None  # Lifetime access
    profile.save()
    
    logger.info(f"Granted lifetime premium to user {user.username} (order {order_id})")


def _handle_order_refunded(data):
    """Handle refund of a one-time purchase: revoke lifetime access"""
    attributes = data.get('data', {}).get('attributes', {})
    custom_data = data.get('meta', {}).get('custom_data', {})

    user_id = custom_data.get('user_id')
    if not user_id:
        logger.error("No user_id in custom_data for refund")
        return

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found (refund)")
        return

    # Update payment record if exists
    try:
        order_id = str(data.get('data', {}).get('id') or attributes.get('order_id') or attributes.get('order_number'))
        payment = Payment.objects.filter(order_id=order_id).first()
        if payment:
            payment.status = 'refunded'
            payment.webhook_data = data
            payment.save()
    except Exception:
        logger.warning("Failed to update payment record on refund", exc_info=True)

    # Revoke premium
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.is_premium = False
    # For lifetime, clear expiry; optionally set to today
    profile.premium_expiry = timezone.now().date()
    profile.save()

    logger.info(f"Revoked lifetime premium from user {user.username} (order refunded {order_id})")


def _handle_subscription_created(data):
    """Handle new subscription"""
    attributes = data['data']['attributes']
    # Use meta.custom_data to retrieve our user mapping
    custom_data = data.get('meta', {}).get('custom_data', {})
    
    user_id = custom_data.get('user_id')
    if not user_id:
        logger.error("No user_id in custom_data")
        return
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return
    
    # Parse dates
    renews_at = None
    if attributes.get('renews_at'):
        renews_at = datetime.fromisoformat(attributes['renews_at'].replace('Z', '+00:00'))
    
    trial_ends_at = None
    if attributes.get('trial_ends_at'):
        trial_ends_at = datetime.fromisoformat(attributes['trial_ends_at'].replace('Z', '+00:00'))
    
    # Create subscription record
    subscription = Subscription.objects.create(
        user=user,
        subscription_id=str(data['data']['id']),
        customer_id=str(attributes['customer_id']),
        order_id=str(attributes.get('order_id', '')),
        variant_id=str(attributes['variant_id']),
        product_name=attributes['product_name'],
        status=attributes['status'],
        trial_ends_at=trial_ends_at,
        renews_at=renews_at
    )
    
    # Grant premium access if subscription is active
    if subscription.is_active():
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.is_premium = True
        
        # Set expiry to renewal date
        if renews_at:
            profile.premium_expiry = renews_at.date()
        
        profile.save()
        logger.info(f"Granted premium to user {user.username} (subscription {subscription.subscription_id})")


def _handle_subscription_updated(data):
    """Handle subscription status changes (or create if doesn't exist)"""
    attributes = data['data']['attributes']
    subscription_id = str(data['data']['id'])
    custom_data = data.get('meta', {}).get('custom_data', {})
    
    logger.info(f"📦 Processing subscription_updated for subscription {subscription_id}")
    
    try:
        subscription = Subscription.objects.get(subscription_id=subscription_id)
        logger.info(f"✅ Found existing subscription {subscription_id}")
    except Subscription.DoesNotExist:
        # Subscription doesn't exist yet - create it (first webhook might be update, not create)
        logger.info(f"⚠️ Subscription {subscription_id} not found, creating it now")
        
        # Get user from custom_data
        user_id = custom_data.get('user_id')
        if not user_id:
            logger.error("❌ No user_id in custom_data for new subscription")
            return
        
        try:
            user = User.objects.get(id=user_id)
            logger.info(f"🎯 Found user: {user.username} (ID: {user.id})")
        except User.DoesNotExist:
            logger.error(f"❌ User {user_id} not found")
            return
        
        # Parse dates
        renews_at = None
        if attributes.get('renews_at'):
            renews_at = datetime.fromisoformat(attributes['renews_at'].replace('Z', '+00:00'))
        
        trial_ends_at = None
        if attributes.get('trial_ends_at'):
            trial_ends_at = datetime.fromisoformat(attributes['trial_ends_at'].replace('Z', '+00:00'))
        
        ends_at = None
        if attributes.get('ends_at'):
            ends_at = datetime.fromisoformat(attributes['ends_at'].replace('Z', '+00:00'))
        
        # Create subscription
        subscription = Subscription.objects.create(
            user=user,
            subscription_id=subscription_id,
            customer_id=str(attributes['customer_id']),
            order_id=str(attributes.get('order_id', '')),
            variant_id=str(attributes['variant_id']),
            product_name=attributes['product_name'],
            status=attributes['status'],
            trial_ends_at=trial_ends_at,
            renews_at=renews_at,
            ends_at=ends_at
        )
        logger.info(f"💳 Created subscription with ID: {subscription.id}")
    
    # Update subscription fields
    subscription.status = attributes['status']
    
    if attributes.get('renews_at'):
        subscription.renews_at = datetime.fromisoformat(attributes['renews_at'].replace('Z', '+00:00'))
    
    if attributes.get('ends_at'):
        subscription.ends_at = datetime.fromisoformat(attributes['ends_at'].replace('Z', '+00:00'))
    
    subscription.save()
    logger.info(f"📝 Updated subscription status to: {subscription.status}")
    
    # Update profile-based premium status
    profile, _ = UserProfile.objects.get_or_create(user=subscription.user)
    
    if subscription.is_active():
        profile.is_premium = True
        if subscription.renews_at:
            profile.premium_expiry = subscription.renews_at.date()
        logger.info(f"✅ Granted premium to user {subscription.user.username}")
    else:
        # Subscription not active - revoke premium
        profile.is_premium = False
        if subscription.ends_at:
            profile.premium_expiry = subscription.ends_at.date()
        logger.info(f"❌ Revoked premium from user {subscription.user.username}")
    
    profile.save()
    logger.info(f"Final premium status: is_premium={profile.is_premium}, expiry={profile.premium_expiry}")


def _handle_subscription_cancelled(data):
    """Handle subscription cancellation"""
    _handle_subscription_updated(data)


def _handle_subscription_expired(data):
    """Handle subscription expiration"""
    _handle_subscription_updated(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_history(request):
    """Get user's payment history"""
    user = request.user
    
    payments = Payment.objects.filter(user=user).values(
        'order_id',
        'amount',
        'currency',
        'status',
        'product_name',
        'paid_at',
        'created_at'
    )
    
    subscriptions = Subscription.objects.filter(user=user).values(
        'subscription_id',
        'product_name',
        'status',
        'renews_at',
        'ends_at',
        'created_at'
    )
    
    return Response({
        'payments': list(payments),
        'subscriptions': list(subscriptions)
    })
