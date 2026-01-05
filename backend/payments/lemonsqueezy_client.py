"""
Lemon Squeezy API client for handling checkouts and webhooks.
"""
import hashlib
import hmac
import logging
from typing import Dict, Optional
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class LemonSqueezyClient:
    """Client for interacting with Lemon Squeezy API"""
    
    BASE_URL = "https://api.lemonsqueezy.com/v1"
    
    def __init__(self):
        self.api_key = settings.LEMONSQUEEZY_API_KEY
        self.store_id = settings.LEMONSQUEEZY_STORE_ID
        self.webhook_secret = settings.LEMONSQUEEZY_WEBHOOK_SECRET
        
        # Validate credentials
        if not self.api_key or not self.store_id:
            raise ValueError(
                "Lemon Squeezy credentials not configured. "
                "Please set LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID in your .env file. "
                
            )
        
    def _get_headers(self) -> Dict[str, str]:
        """Get API headers with authentication"""
        return {
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
    def create_checkout(
        self,
        variant_id: str,
        customer_email: Optional[str] = None,
        customer_name: Optional[str] = None,
        custom_data: Optional[Dict] = None
    ) -> Dict:
        """
        Create a checkout session.
        
        Args:
            variant_id: Lemon Squeezy product variant ID
            customer_email: Customer email for prefill
            customer_name: Customer name for prefill
            custom_data: Additional data to pass through webhooks
            
        Returns:
            Dict containing checkout URL and session data
        """
        url = f"{self.BASE_URL}/checkouts"
        
        payload = {
            "data": {
                "type": "checkouts",
                "attributes": {
                    "checkout_data": {
                        "custom": custom_data or {}
                    }
                },
                "relationships": {
                    "store": {
                        "data": {
                            "type": "stores",
                            "id": str(self.store_id)
                        }
                    },
                    "variant": {
                        "data": {
                            "type": "variants",
                            "id": str(variant_id)
                        }
                    }
                }
            }
        }
        
        # Add customer prefill if provided
        if customer_email:
            payload["data"]["attributes"]["checkout_data"]["email"] = customer_email
        if customer_name:
            payload["data"]["attributes"]["checkout_data"]["name"] = customer_name
        
        try:
            response = requests.post(
                url,
                json=payload,
                headers=self._get_headers(),
                timeout=10
            )
            if response.status_code >= 400:
                # Log detailed error info to help diagnose 404s (e.g., invalid variant/store)
                try:
                    error_body = response.json()
                except ValueError:
                    error_body = {"raw": response.text}
                logger.error(
                    "Checkout creation failed (HTTP %s). Store: %s, Variant: %s, Response: %s",
                    response.status_code,
                    self.store_id,
                    variant_id,
                    error_body,
                )
                response.raise_for_status()

            data = response.json()
            checkout_url = data.get("data", {}).get("attributes", {}).get("url")
            if not checkout_url:
                logger.error("Checkout response missing URL. Payload: %s", data)
                return {"success": False, "error": "Missing checkout URL in API response"}

            logger.info(f"Created checkout session: {checkout_url}")
            return {
                "success": True,
                "checkout_url": checkout_url,
                "data": data.get("data")
            }

        except requests.exceptions.RequestException as e:
            # Provide actionable hint for common 404 causes
            hint = None
            if "404" in str(e):
                hint = (
                    "Verify LEMONSQUEEZY_STORE_ID and LEMONSQUEEZY_VARIANT_ID are correct and belong to the same store. "
                    "Also ensure the API key has access to the store."
                )
            logger.error("Failed to create checkout: %s%s", e, f". Hint: {hint}" if hint else "")
            return {
                "success": False,
                "error": str(e),
                "hint": hint,
                "debug": {
                    "store_id": str(self.store_id),
                    "variant_id": str(variant_id),
                    "endpoint": url,
                }
            }
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify webhook signature from Lemon Squeezy.
        
        Args:
            payload: Raw request body bytes
            signature: X-Signature header value
            
        Returns:
            True if signature is valid
        """
        if not self.webhook_secret:
            logger.warning("Webhook secret not configured")
            return False
        
        # Compute HMAC signature
        computed = hmac.new(
            self.webhook_secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures (constant-time comparison)
        return hmac.compare_digest(computed, signature)
    
    def get_order(self, order_id: str) -> Optional[Dict]:
        """
        Retrieve order details.
        
        Args:
            order_id: Lemon Squeezy order ID
            
        Returns:
            Order data or None if not found
        """
        url = f"{self.BASE_URL}/orders/{order_id}"
        
        try:
            response = requests.get(
                url,
                headers=self._get_headers(),
                timeout=10
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to retrieve order {order_id}: {e}")
            return None
    
    def get_subscription(self, subscription_id: str) -> Optional[Dict]:
        """
        Retrieve subscription details.
        
        Args:
            subscription_id: Lemon Squeezy subscription ID
            
        Returns:
            Subscription data or None if not found
        """
        url = f"{self.BASE_URL}/subscriptions/{subscription_id}"
        
        try:
            response = requests.get(
                url,
                headers=self._get_headers(),
                timeout=10
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to retrieve subscription {subscription_id}: {e}")
            return None
