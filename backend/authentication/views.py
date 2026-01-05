import logging
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.cache import cache
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile
from .serializers import UserSerializer

logger = logging.getLogger(__name__)


# Custom throttle for login attempts (stricter than global)
class LoginRateThrottle(AnonRateThrottle):
    """Stricter rate limit for login attempts: 5 per minute"""
    rate = '5/min'


# Custom throttle for registration (stricter than global)
class RegisterRateThrottle(AnonRateThrottle):
    """Stricter rate limit for registration: 3 per minute"""
    rate = '3/min'


class CustomAuthToken(ObtainAuthToken):
    """Custom authentication view that accepts email and password"""
    throttle_classes = [LoginRateThrottle]
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        
        logger.debug(f"Login attempt for email: {email}")
        
        if not email or not password:
            logger.warning("Login failed: Missing email or password")
            return Response(
                {'error': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid email or password'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Authenticate user
        user = authenticate(username=user.username, password=password)
        if not user:
            return Response(
                {'error': 'Invalid email or password'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Create or get token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([RegisterRateThrottle])
def register_user(request):
    """Register a new user with email and password"""
    
    email = request.data.get('email')
    password = request.data.get('password')
    username = request.data.get('username')  # Optional: let user choose username
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    logger.info(f"Registration attempt for email: {email}, username: {username}")
    
    if not email or not password:
        return Response(
            {'error': 'Email and password are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if email already exists
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already exists'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Handle username
    if username:
        # User provided username - check if it's unique
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        # Auto-generate unique username from email
        username = email.split('@')[0]
        counter = 1
        original_username = username
        
        while User.objects.filter(username=username).exists():
            username = f"{original_username}{counter}"
            counter += 1
    
    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                first_name=first_name,
                last_name=last_name
            )
            
            # Create token
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Registration error for email {email}: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Failed to create user: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    """Get current user profile"""
    # Re-fetch user with related profile in a single query
    user = User.objects.select_related('userprofile').get(pk=request.user.pk)
    logger.info(f"Profile fetched for the user")
    return Response({
        
        'user': UserSerializer(user).data
        
    })


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    """Update user profile information"""
    user = request.user
    data = request.data
    
    # Update allowed fields
    if 'username' in data:
        if User.objects.filter(username=data['username']).exclude(id=user.id).exists():
            return Response(
                {'error': 'Username already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        user.username = data['username']
    
    if 'email' in data:
        if User.objects.filter(email=data['email']).exclude(id=user.id).exists():
            return Response(
                {'error': 'Email already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        user.email = data['email']
    
    if 'first_name' in data:
        user.first_name = data['first_name']
    
    if 'last_name' in data:
        user.last_name = data['last_name']
    
    user.save()
    logger.info(f"Profile updated for the user {user.id}")
    
    return Response({
        'user': UserSerializer(user).data,
        'message': 'Profile updated successfully'
    })


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_avatar(request):
    """Update user profile picture with automatic optimization"""
    if 'avatar' not in request.FILES:
        return Response(
            {'error': 'No avatar file provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = request.user
    avatar_file = request.FILES['avatar']
    
    # Import centralized image utility
    from content.image_optimizer import validate_and_optimize_image
    
    try:
        # Validate and optimize avatar (max 5MB, converts to WebP)
        optimized_avatar = validate_and_optimize_image(
            avatar_file,
            max_size_mb=5,
            allowed_types=['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        )
    except ValueError as e:
        # Validation failed (wrong type or too large)
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        # Optimization failed
        logger.error(f"Avatar optimization failed for user {user.id}: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to process image. Please try a different file.'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Get or create user profile
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    # Update avatar with optimized version
    profile.avatar = optimized_avatar
    profile.save()
    
    logger.info(f"Avatar updated for user {user.id}")
    
    return Response({
        'user': UserSerializer(user, context={'request': request}).data,
        'avatar_url': profile.avatar_url,
        'message': 'Avatar updated successfully'
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password"""
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not current_password or not new_password:
        return Response(
            {'error': 'Current password and new password are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify current password
    if not user.check_password(current_password):
        return Response(
            {'error': 'Current password is incorrect'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate new password
    if len(new_password) < 6:
        return Response(
            {'error': 'New password must be at least 6 characters long'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    return Response({
        'message': 'Password changed successfully'
    })

User = get_user_model()
def too_many_requests(email):
    key = f"reset_rate_{email}"
    if cache.get(key):
        return True
    cache.set(key, True, timeout=60)  # 1 request/minute per email
    return False


class PasswordResetRequestAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "If an account exists, we'll send an email."}, status=200)

        if too_many_requests(email):
            return Response({"detail": "Please wait before requesting again."}, status=429)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "If an account exists, we'll send an email."}, status=200)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = f"{settings.FRONTEND_URL}/ResetPassword?uid={uid}&token={token}"

        # HTML email template
        html_message = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #0b66c3;">Reset Your Password</h2>
                    <p>Hi {user.first_name or 'there'},</p>
                    <p>We received a request to reset your Trivia Spirit password. Click the button below to proceed:</p>
                    <p>
                        <a href="{reset_link}" style="display: inline-block; background-color: #0b66c3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Reset Password
                        </a>
                    </p>
                    <p>Or copy this link: <a href="{reset_link}">{reset_link}</a></p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
                    <p style="font-size: 12px; color: #666;">Trivia Spirit Support Team</p>
                </div>
            </body>
        </html>
        """

        try:
            from django.core.mail import EmailMultiAlternatives
            msg = EmailMultiAlternatives(
                subject="Reset your password",
                body=f"Click the link to reset your password:\n{reset_link}\n\nIf you didn't request this, ignore it.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email]
            )
            msg.attach_alternative(html_message, "text/html")
            msg.send(fail_silently=False)
            logger.info(f"Password reset email sent successfully to {email}")
        except Exception as e:
            # Log the error but don't reveal it to user (security best practice)
            logger.error(f"Failed to send password reset email to {email}: {str(e)}", exc_info=True)
            # Still return success message to prevent email enumeration

        return Response({"detail": "If an account exists, we'll send an email."}, status=200)


class PasswordResetConfirmAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not all([uid, token, new_password]):
            return Response({"detail": "Missing fields."}, status=400)

        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response({"detail": "Invalid link or user."}, status=400)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid or expired token."}, status=400)

        try:
            validate_password(new_password, user)
        except Exception as e:
            return Response({"detail": str(e)}, status=400)

        user.set_password(new_password)
        user.save()

        return Response({"detail": "Password has been reset successfully."}, status=200)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def google_oauth(request):
    """
    Handle Google OAuth login/signup.
    Frontend sends Google ID token, we verify it and create/login user.
    """
    token = request.data.get('token')
    
    if not token:
        return Response(
            {'error': 'Google token is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token
        import requests as req

        idinfo = None
        payload_source = "id_token"

        # First try to treat the incoming token as an ID token (JWT)
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID
            )
        except ValueError:
            # If it is not a JWT, treat it as an access token and fetch the userinfo
            payload_source = "access_token"
            userinfo_resp = req.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
            if userinfo_resp.status_code != 200:
                raise ValueError("Invalid Google token")
            idinfo = userinfo_resp.json()

        # Extract user info from token/userinfo
        email = idinfo.get('email')
        name = idinfo.get('name') or ' '.join(
            filter(None, [idinfo.get('given_name'), idinfo.get('family_name')])
        )
        picture = idinfo.get('picture', '')

        if not email:
            return Response(
                {'error': 'Email not provided by Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user exists
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0],
                'first_name': name.split()[0] if name else '',
                'last_name': ' '.join(name.split()[1:]) if len(name.split()) > 1 else '',
            }
        )
        
        # Create or get token
        auth_token, _ = Token.objects.get_or_create(user=user)
        
        # Update profile picture if new user and picture provided
        if created and picture:
            try:
                import requests as req
                from django.core.files.base import ContentFile
                
                response = req.get(picture)
                if response.status_code == 200:
                    profile, _ = UserProfile.objects.get_or_create(user=user)
                    # Store picture URL directly (assuming CDN storage)
                    profile.avatar = picture
                    profile.save()
            except Exception as e:
                logger.warning(f"Failed to update Google profile picture: {e}")
        
        logger.info(f"Google OAuth {'signup' if created else 'login'} via {payload_source} for {email}")
        
        return Response({
            'token': auth_token.key,
            'user': UserSerializer(user).data,
            'is_new': created
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
    except ValueError as e:
        logger.error(f"Invalid Google token: {e}")
        return Response(
            {'error': 'Invalid or expired Google token'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        logger.exception(f"Google OAuth error: {e}")
        return Response(
            {'error': 'Failed to process Google login'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )