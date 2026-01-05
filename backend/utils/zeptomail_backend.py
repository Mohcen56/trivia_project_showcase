"""
Custom Django email backend for ZeptoMail (Zoho transactional email service).
Uses REST API instead of SMTP for better reliability and no timeout issues.
"""
import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.message import sanitize_address
import logging

logger = logging.getLogger(__name__)


class ZeptoMailBackend(BaseEmailBackend):
    """
    Email backend using ZeptoMail REST API.
    
    Required settings:
    - ZEPTOMAIL_API_KEY: Your ZeptoMail API key (from Zoho account)
    - ZEPTOMAIL_API_ENDPOINT: Usually "https://api.zeptomail.eu/" for EU or "https://api.zeptomail.com/" for US
    - DEFAULT_FROM_EMAIL: Sender email address (must be verified in ZeptoMail)
    """
    
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently)
        self.api_key = getattr(settings, 'ZEPTOMAIL_API_KEY', '')
        self.api_endpoint = getattr(settings, 'ZEPTOMAIL_API_ENDPOINT', '')
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '')
        
        if not self.api_key or not self.api_endpoint:
            msg = f"ZeptoMail missing: api_key={bool(self.api_key)}, endpoint={bool(self.api_endpoint)}"
            logger.warning(msg)
            if not fail_silently:
                raise ValueError(msg)
    
    def send_messages(self, email_messages):
        """
        Send one or more EmailMessage objects and return the number of emails sent.
        """
        if not email_messages:
            return 0
        
        num_sent = 0
        for message in email_messages:
            try:
                sent = self._send(message)
                if sent:
                    num_sent += sent
            except Exception as e:
                if not self.fail_silently:
                    raise
                logger.error(f"Failed to send email to {message.to}: {str(e)}", exc_info=True)
        
        return num_sent
    
    def _send(self, message):
        """Send a single EmailMessage via ZeptoMail API."""
        if not message.recipients():
            return False
        
        # Prepare payload
        payload = {
            "from": {
                "address": self.from_email,
            },
            "to": [
                {"email_address": {"address": recipient}}
                for recipient in message.to
            ],
            "subject": message.subject,
        }
        
        # Add CC and BCC if present
        if message.cc:
            payload["cc"] = [
                {"email_address": {"address": recipient}}
                for recipient in message.cc
            ]
        
        if message.bcc:
            payload["bcc"] = [
                {"email_address": {"address": recipient}}
                for recipient in message.bcc
            ]
        
        # Add body (plain text or HTML)
        if message.body:
            payload["textbody"] = message.body
        
        if message.alternatives:
            for content, mimetype in message.alternatives:
                if mimetype == "text/html":
                    payload["htmlbody"] = content
                    break
        
        # Add reply-to if present
        if message.reply_to:
            payload["reply_to"] = {
                "address": message.reply_to[0]
            }
        
        # Send via ZeptoMail API
        headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json",
        }
        
        try:
            response = requests.post(
                f"{self.api_endpoint}v1.1/email",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"Email sent successfully to {message.to} via ZeptoMail")
                return True
            else:
                error_msg = f"ZeptoMail API error: {response.status_code} - {response.text}"
                logger.error(error_msg)
                logger.error(f"Request payload: {payload}")
                logger.error(f"Request headers: {headers}")
                if not self.fail_silently:
                    raise Exception(error_msg)
                return False
                
        except requests.exceptions.Timeout:
            error_msg = "ZeptoMail API request timed out"
            logger.error(error_msg)
            if not self.fail_silently:
                raise Exception(error_msg)
            return False
        except Exception as e:
            logger.error(f"Error sending email via ZeptoMail: {str(e)}", exc_info=True)
            if not self.fail_silently:
                raise
            return False
