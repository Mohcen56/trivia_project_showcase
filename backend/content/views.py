from rest_framework.exceptions import ValidationError
from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import MethodNotAllowed, ValidationError as DRFValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
import logging, re
from django.core.cache import cache
from .models import SavedCategory
from django.db.models import Q
from .models import Collection, Category, Question, CategoryLike
from .serializers import (
    CollectionSerializer, CategorySerializer, QuestionSerializer,
    UserCategoryCreateSerializer, UserCategorySerializer
)


class CollectionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Collection model - read only"""
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer
    permission_classes = [permissions.AllowAny]  # Allow both authenticated and unauthenticated access
    
    @action(detail=False, methods=['get'])
    def with_categories(self, request):

        """Get all collections with their categories, plus uncategorized categories
        ONLY shows official categories (is_custom=False) - custom categories appear only on /categories/add
        """
        from django.db.models import Q
        user = request.user
        # Targeted caching: vary by premium tier (premium vs free/anon)
        tier = 'premium' if (user.is_authenticated and getattr(user, 'is_premium', False)) else 'free'
        # Cache key version: v1 - allows easy invalidation if format changes
        cache_key = f'v1:collections:with_categories:{tier}'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)
        
        # Filter categories: ONLY official categories (no custom) and NOT hidden
        # Custom categories should ONLY appear in UserCategoryViewSet
        category_queryset = Category.objects.filter(is_custom=False, is_hidden=False)
        
        # Show locked categories to everyone; the frontend will display them as locked.
        # Access to QUESTIONS for locked categories is enforced in QuestionViewSet.
        
        # Get all collections and prefetch only the filtered categories to avoid N+1 queries
        from django.db.models import Prefetch
        collections = Collection.objects.prefetch_related(
            Prefetch('categories', queryset=category_queryset, to_attr='filtered_categories')
        ).all()

        # Build collections data using the prefetched filtered_categories attribute
        collections_data = []
        for collection in collections:
            collection_categories = getattr(collection, 'filtered_categories', [])
            if collection_categories:
                categories_data = CategorySerializer(collection_categories, many=True, context={'request': request}).data

                collection_data = {
                    'id': collection.id,
                    'name': collection.name,
                    'order': collection.order,
                    'categories': categories_data,
                    'categories_count': len(categories_data)
                }
                collections_data.append(collection_data)
        
        # Get categories that don't belong to any collection (and user can access)
        uncategorized_categories = category_queryset.filter(collection__isnull=True)
        
        # If there are uncategorized categories, create a virtual "Other Categories" collection
        if uncategorized_categories.exists():
            uncategorized_data = CategorySerializer(uncategorized_categories, many=True, context={'request': request}).data
            
            # Create a virtual collection for uncategorized items
            other_collection = {
                'id': -1,  # Use negative ID to indicate it's virtual
                'name': 'Other Categories',
                'order': 999,  # Put it at the end
                'categories': uncategorized_data,
                'categories_count': len(uncategorized_data)
            }
            
            # Add the virtual collection to the response
            collections_data.append(other_collection)
        
        # Sort collections by order
        collections_data.sort(key=lambda x: x['order'])

        # Store in cache for 15 minutes
        cache.set(cache_key, collections_data, timeout=60 * 15)
        return Response(collections_data)
    @action(detail=False, methods=['get'])
    def all_data(self, request):
        """
        Combined endpoint:
        - Returns all collections with official categories
        - User's saved categories (if logged in)
        - Fallback all categories (for extra safety)
        """
        user = request.user

        # 1️⃣ Include all official categories (locked or unlocked) for visibility, but exclude hidden
        category_queryset = Category.objects.filter(is_custom=False, is_hidden=False)

        # 2️⃣ Prefetch for all collections (reuse your optimization)
        from django.db.models import Prefetch
        collections = Collection.objects.prefetch_related(
            Prefetch('categories', queryset=category_queryset, to_attr='filtered_categories')
        ).all()

        collections_data = []
        for collection in collections:
            cats = getattr(collection, 'filtered_categories', [])
            if cats:
                collections_data.append({
                    'id': collection.id,
                    'name': collection.name,
                    'order': collection.order,
                    'categories': CategorySerializer(cats, many=True, context={'request': request}).data,
                    'categories_count': len(cats)
                })

        # 3️⃣ Saved categories (from your SavedCategory model)
        saved_categories = []
        if user.is_authenticated:
          
            # Only include saved categories the user is allowed to see:
            # - Their own custom categories (any approval/privacy)
            # - Approved public custom categories from others
            saved_qs = (
                SavedCategory.objects
                .filter(user=user)
                .select_related('category', 'category__created_by')
                .filter(
                    Q(category__created_by=user) |
                    Q(category__is_custom=True, category__is_approved=True, category__privacy='public')
                )
            )
            saved_categories = [
                UserCategorySerializer(sc.category, context={'request': request}).data
                for sc in saved_qs
            ]

        # 4️⃣ Fallback categories (uncategorized)
        fallback_qs = category_queryset.filter(collection__isnull=True)
        fallback_categories = CategorySerializer(fallback_qs, many=True, context={'request': request}).data

        # 5️⃣ Combine and return
        return Response({
            'collections': collections_data,
            'saved_categories': saved_categories,
            'fallback_categories': fallback_categories
        }, status=status.HTTP_200_OK)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Category model - read only"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]  # Allow both authenticated and unauthenticated access
    
    def get_queryset(self):
        """Filter categories based on user membership - ONLY official categories (no custom)"""
        from django.db.models import Q
        user = self.request.user
        
        # Only show official categories (is_custom=False)
        # Custom categories should ONLY appear in UserCategoryViewSet (on /categories/add page)
        queryset = Category.objects.filter(is_custom=False)
        # Do not filter out locked here; allow visibility. Enforcement for questions is in QuestionViewSet.
        return queryset

class QuestionViewSet(viewsets.ModelViewSet):
    """Secure + validated ViewSet for Question model."""
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    # ------------------------------
    # VALIDATORS
    # ------------------------------

    def _validate_integer(self, value, field_name):
        """Ensures query params expecting integers never allow strings/SQL text."""
        try:
            return int(value)
        except (TypeError, ValueError):
            raise DRFValidationError({field_name: f"{field_name} must be an integer"})

    def _validate_integer_list(self, values, field_name):
        """Ensures ?category_ids=1&category_ids=2&category_ids=abc -> error"""
        cleaned = []
        for v in values:
            try:
                cleaned.append(int(v))
            except (TypeError, ValueError):
                raise ValidationError({field_name: f"Invalid ID: {v}"})
        return cleaned

    # ------------------------------
    # BASE GET QUERYSET
    # ------------------------------

    def get_queryset(self):
        """Filter questions safely based on a category parameter and enforce access controls.

        Security improvements:
        - Accept both 'category_id' (canonical) and legacy 'category' param; validate strictly as int.
        - Always apply locked filtering for non-premium users (previous logic only did so when category filter present).
        - Prevent silent fallback that exposed locked questions when an unknown param (e.g. 'category') contained injection text.
        """
        queryset = Question.objects.all()

        # Canonical param name ONLY; legacy 'category' now rejected explicitly in list()
        raw_category = self.request.query_params.get("category_id")

        if raw_category is not None and raw_category != "":
            # Validate strictly as integer; injection attempts like "' OR 1=1 --" will raise.
            category_id = self._validate_integer(raw_category, "category_id")
            queryset = queryset.filter(category_id=category_id)

        # Membership filtering ALWAYS applied (previously only when category filter used)
        user = self.request.user
        is_premium = (
            user.is_authenticated
            and hasattr(user, "membership")
            and user.membership.is_active_premium()
        )
        if not is_premium:
            queryset = queryset.filter(category__locked=False)

        return queryset

    def list(self, request, *args, **kwargs):
        """Hardened list endpoint.

        Requirements implemented:
        - Never return ALL questions without an explicit valid category_id.
        - Reject unknown query parameters (only category_id allowed here).
        - Return 405 if category_id omitted (disabling broad listing).
        - Validate category_id strictly as integer; malformed / injection attempts -> 400.
        - Enforce locked filtering for non-premium users (handled in get_queryset but also validated here).
        """
        allowed_params = {"category_id"}
        received_params = set(request.query_params.keys())

        if not received_params:
            # No params -> disable broad listing
            raise MethodNotAllowed(method="GET", detail="Listing all questions without category_id is disabled.")

        # Unknown params
        unknown = received_params - allowed_params
        if unknown:
            raise DRFValidationError({"detail": f"Unknown query parameter(s): {', '.join(sorted(unknown))}. Only 'category_id' is permitted."})

        raw_category = request.query_params.get("category_id")
        if raw_category is None or raw_category == "":
            raise MethodNotAllowed(method="GET", detail="category_id is required to list questions.")

        category_id = self._validate_integer(raw_category, "category_id")

        # Base queryset filtered by category
        qs = Question.objects.filter(category_id=category_id)

        # Membership enforcement (duplicate of get_queryset logic, kept explicit for clarity)
        user = request.user
        is_premium = (
            user.is_authenticated
            and hasattr(user, "membership")
            and user.membership.is_active_premium()
        )
        if not is_premium:
            qs = qs.filter(category__locked=False)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    # ------------------------------
    # RANDOM ACTION
    # ------------------------------

    @action(detail=False, methods=["get"])
    def random(self, request):
        """
        Secure deterministic question fetch with pagination support:
        - Requires ?category_ids=1&category_ids=2
        - Optional: ?count=10
        - Optional: ?offset=0 (for pagination - skip N questions)
        - Optional: ?direction=asc/desc
        - Optional: ?exclude_ids=5&exclude_ids=10 (skip specific question IDs)
        """

        # ---- 1. Validate & sanitize all inputs ----
        raw_ids = request.query_params.getlist("category_ids")
        if not raw_ids:
            return Response(
                {"error": "category_ids parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate category IDs
        category_ids = self._validate_integer_list(raw_ids, "category_ids")

        # Validate count
        count_raw = request.query_params.get("count", "10")
        count = self._validate_integer(count_raw, "count")
        MAX_COUNT = 50
        if count < 1 or count > MAX_COUNT:
            raise ValidationError({
        "count": f"count must be between 1 and {MAX_COUNT}"
        })
        
        # Validate offset (for pagination)
        offset_raw = request.query_params.get("offset", "0")
        offset = self._validate_integer(offset_raw, "offset")
        if offset < 0:
            raise ValidationError({"offset": "offset must be >= 0"})
        
        # Validate direction
        direction = request.query_params.get("direction", "asc").lower()
        if direction not in ("asc", "desc"):
            raise ValidationError({"direction": "Must be 'asc' or 'desc'"})
        
        # Optional: exclude specific question IDs (for already-answered questions)
        exclude_ids_raw = request.query_params.getlist("exclude_ids")
        exclude_ids = []
        if exclude_ids_raw:
            exclude_ids = self._validate_integer_list(exclude_ids_raw, "exclude_ids")

        # ---- 2. Membership logic ----
        user = request.user
        is_premium = (
            user.is_authenticated 
            and hasattr(user, "membership")
            and user.membership.is_active_premium()
        )

        # ---- 3. Queryset filtering ----
        qs = Question.objects.filter(category_id__in=category_ids)

        if not is_premium:
            qs = qs.filter(category__locked=False)
        
        # Exclude specific questions if provided
        if exclude_ids:
            qs = qs.exclude(id__in=exclude_ids)

        # Deterministic ordering using pre-shuffled random_key (fastest for PostgreSQL)
        order_field = "-random_key" if direction == "desc" else "random_key"
        qs = qs.order_by(order_field)
        
        # Apply offset and limit (pagination)
        # This allows users to get "next batch" of questions
        qs = qs[offset:offset + count]

        # ---- 4. Serialize and return ----
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class UserCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for user-created categories"""
    serializer_class = UserCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    # Use custom permission selection for specific actions to reduce duplication
    def get_permissions(self):
        from .permissions import IsOwnerOrReadOnly
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]
        # Admin-only actions already define permission_classes on the action
        return [permissions.IsAuthenticated()]
    
    def get_object(self):
        """
        Override to allow users to retrieve their own categories even if not approved.
        This fixes the 404 error when editing/viewing own categories.
        """
        from django.shortcuts import get_object_or_404
        from django.db.models import Q
        
        pk = self.kwargs.get('pk')
        user = self.request.user
        
        # Allow access to:
        # 1. User's own categories (any status)
        # 2. Approved public categories
        # 3. All categories if admin
        if user.is_staff:
            queryset = Category.objects.filter(is_custom=True)
        else:
            queryset = Category.objects.filter(
                Q(is_custom=True, created_by=user) |
                Q(is_custom=True, is_approved=True, privacy='public')
            )
        
        obj = get_object_or_404(queryset.select_related('created_by__userprofile'), pk=pk)
        
        # Check object permissions (will use IsOwnerOrReadOnly for update/delete actions)
        self.check_object_permissions(self.request, obj)
        
        return obj
    
    def get_queryset(self):
        """
        Get categories for the "Add Categories" page.
        
        Rules:
        - Regular users: ONLY see approved public categories from others
        - Admins: see all custom categories
        
        User's own unapproved categories DON'T appear here - they only show in saved collection
        This prevents unapproved categories from cluttering the browse/add page
        """
        user = self.request.user
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f'🔍 UserCategoryViewSet.get_queryset called for user: {user} (ID: {user.id if user.is_authenticated else "Not authenticated"})')
        
        if user.is_staff:
            # Admins see all custom categories
            # Use select_related to avoid N+1 queries when accessing created_by user and profile
            queryset = Category.objects.filter(is_custom=True).select_related('created_by__userprofile')
            logger.info(f'✅ Admin user - returning {queryset.count()} categories')
            return queryset
        else:
            # Regular users ONLY see approved public categories from others
            # Their own categories (approved or not) are in SavedCategory and appear only in saved collection
            # Use select_related to avoid N+1 queries when accessing created_by user and profile
            from django.db.models import Q
            queryset = Category.objects.filter(
                is_custom=True, 
                is_approved=True, 
                privacy='public'
            ).exclude(created_by=user).select_related('created_by__userprofile')
            logger.info(f'✅ Regular user - returning {queryset.count()} approved public categories')
            return queryset
    
    def get_serializer_class(self):
        """Use different serializers for create/update vs read"""
        if self.action in ['create', 'update', 'partial_update']:
            return UserCategoryCreateSerializer
        return UserCategorySerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new user category with questions"""
        import logging
        logger = logging.getLogger(__name__)
        logger.debug('UserCategory create called. request.data keys: %s', list(request.data.keys()))
        logger.debug('UserCategory create called. request.FILES keys: %s', list(request.FILES.keys()))

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error('UserCategory create validation errors: %s', serializer.errors)
            # Build debug payload to return to frontend for easier debugging
            debug_payload = {
                'errors': serializer.errors,
                'received_keys': list(request.data.keys()),
                'received_files': list(request.FILES.keys()),
            }
            # If serializer initial_data contains parsed 'questions', include a preview
            try:
                q = serializer.initial_data.get('questions')
                debug_payload['questions_preview'] = q if q else None
            except Exception:
                debug_payload['questions_preview'] = None

            return Response(debug_payload, status=status.HTTP_400_BAD_REQUEST)

        # Save the category
        self.perform_create(serializer)
        
        # Automatically add to user's "Added Categories" collection
        # This ensures the user's created categories appear in their saved collection by default
        category = serializer.instance
        SavedCategory.objects.get_or_create(
            user=request.user,
            category=category
        )
        logger.info(f'✅ Category "{category.name}" (ID: {category.id}) created and automatically saved to user collection')
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'message': 'Category created successfully and submitted for approval',
                'category': serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        """Update a user category and add new questions"""
        import logging
        logger = logging.getLogger(__name__)
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Log before update
        questions_before = instance.question_set.count()
        logger.debug(f'UserCategory update called for category {instance.id}. Questions before: {questions_before}')
        logger.debug('Update request.data keys: %s', list(request.data.keys()))
        logger.debug('Update request.FILES keys: %s', list(request.FILES.keys()))
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            logger.error('UserCategory update validation errors: %s', serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_update(serializer)
        
        # Log after update
        questions_after = instance.question_set.count()
        logger.info(f'✅ Category {instance.id} updated. Questions before: {questions_before}, after: {questions_after}')
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_categories(self, request):
        """Get all categories created by the current user"""
        categories = Category.objects.filter(
            is_custom=True,
            created_by=request.user
        ).order_by('-created_at')
        
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAdminUser])
    def pending_approval(self, request):
        """Get all categories pending approval (admin only)"""
        categories = Category.objects.filter(
            is_custom=True,
            is_approved=False
        ).order_by('-created_at')
        
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        """Approve a user category (admin only)"""
        category = self.get_object()
        category.is_approved = True
        category.save()
        
        return Response({
            'message': f'Category "{category.name}" has been approved',
            'category': self.get_serializer(category).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        """Reject/unapprove a user category (admin only)"""
        category = self.get_object()
        category.is_approved = False
        category.save()
        
        return Response({
            'message': f'Category "{category.name}" has been rejected/unapproved',
            'category': self.get_serializer(category).data
        })
    
    @action(detail=True, methods=['post', 'put'])
    def add_questions(self, request, pk=None):
        """Add or update questions to an existing user category"""
        category = self.get_object()
        
        # Prevent modifying official categories (is_custom=False)
        if not category.is_custom:
            return Response({'error': 'Cannot modify questions for official categories'}, status=status.HTTP_403_FORBIDDEN)
        
        # Ownership enforced via permission class in get_permissions for update-like actions
        if category.created_by != request.user and not request.user.is_staff:
            # Preserve explicit check for clarity and early return
            return Response({'error': 'You do not have permission to modify this category'}, status=status.HTTP_403_FORBIDDEN)
        
        
        logger = logging.getLogger(__name__)
        
        # Parse questions from request data
        questions_data = request.data.get('questions')
        
        # If questions as JSON string, parse it
        if isinstance(questions_data, str):
            import json
            try:
                questions_data = json.loads(questions_data)
            except Exception as e:
                logger.exception('Failed to parse questions JSON: %s', e)
                return Response({'error': 'Invalid questions format'}, status=status.HTTP_400_BAD_REQUEST)
        
        # If questions not present but sent as form fields, reconstruct
        if not questions_data:
            pattern = re.compile(r'^questions\[(\d+)\]\[(\w+)\]$')
            temp: dict[int, dict] = {}
            for key in list(request.data.keys()):
                m = pattern.match(key)
                if m:
                    idx = int(m.group(1))
                    field = m.group(2)
                    val = request.data.get(key)
                    if isinstance(val, (list, tuple)):
                        val = val[0]
                    temp.setdefault(idx, {})[field] = val
            
            if temp:
                questions_data = [temp[i] for i in sorted(temp.keys())]
        
        if not questions_data:
            return Response({'error': 'No questions provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate questions
        from .serializers import UserQuestionSerializer
        serializer = UserQuestionSerializer(data=questions_data, many=True)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
        # ADD new questions (don't delete existing ones) - use bulk create for better performance
        questions_before = category.question_set.count()
        to_create = [Question(category=category, **question_data) for question_data in serializer.validated_data]
        if to_create:
            Question.objects.bulk_create(to_create)
        
        questions_after = category.question_set.count()
        logger.info(f'✅ Added {len(to_create)} questions to category {category.id}. Total: {questions_before} -> {questions_after}')
        
        return Response({
            'message': f'Added {len(serializer.validated_data)} questions to category "{category.name}"',
            'category': UserCategorySerializer(category, context={'request': request}).data
        })
    
    @action(detail=True, methods=['post'])
    def add_to_collection(self, request, pk=None):
        """Save this category to the user's personal 'Added Categories' collection"""
        category = self.get_object()
        user = request.user
        
        # Import SavedCategory model
        from .models import SavedCategory
        
        # Check if already saved
        saved_category, created = SavedCategory.objects.get_or_create(
            user=user,
            category=category
        )
        
        if created:
            return Response({
                'message': f'Category "{category.name}" added to your collection',
                'category': UserCategorySerializer(category, context={'request': request}).data,
                'saved': True
            })
        else:
            return Response({
                'message': f'Category "{category.name}" is already in your collection',
                'category': UserCategorySerializer(category, context={'request': request}).data,
                'saved': False
            })
    
    @action(detail=True, methods=['post', 'delete'])
    def remove_from_collection(self, request, pk=None):
        """Remove this category from the user's personal collection"""
        category = self.get_object()
        user = request.user
        
        
        
        try:
            saved_category = SavedCategory.objects.get(user=user, category=category)
            saved_category.delete()
            return Response({
                'message': f'Category "{category.name}" removed from your collection',
                'removed': True
            })
        except SavedCategory.DoesNotExist:
            return Response({
                'message': f'Category "{category.name}" was not in your collection',
                'removed': False
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def my_saved_categories(self, request):
        """Get all categories saved by the current user"""
        
        user = request.user

        # Only return saved categories the user is allowed to view
        saved_qs = (
            SavedCategory.objects
            .filter(user=user)
            .select_related('category', 'category__created_by')
            .filter(
                Q(category__created_by=user) |
                Q(category__is_custom=True, category__is_approved=True, category__privacy='public')
            )
        )
        categories = [sc.category for sc in saved_qs]

        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Like a category for the current user"""
        category = self.get_object()
        user = request.user
        # Enforce likes only on user-created categories and not by the owner
        if not category.is_custom:
            return Response({'error': 'Likes are only available for user-created categories.'}, status=status.HTTP_400_BAD_REQUEST)
        if category.created_by_id == user.id:
            return Response({'error': "You can't like your own category."}, status=status.HTTP_400_BAD_REQUEST)
        like, created = CategoryLike.objects.get_or_create(user=user, category=category)
        return Response({
            'liked': True,
            'likes_count': CategoryLike.objects.filter(category=category).count()
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'delete'])
    def unlike(self, request, pk=None):
        """Remove like for the current user"""
        category = self.get_object()
        user = request.user
        # Enforce likes only on user-created categories
        if not category.is_custom:
            return Response({'error': 'Likes are only available for user-created categories.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            CategoryLike.objects.get(user=user, category=category).delete()
            liked = False
        except CategoryLike.DoesNotExist:
            liked = False
        return Response({
            'liked': liked,
            'likes_count': CategoryLike.objects.filter(category=category).count()
        }, status=status.HTTP_200_OK)
