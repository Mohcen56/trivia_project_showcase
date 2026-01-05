
from rest_framework import serializers
from .models import Collection, Category, Question, CategoryLike


class CollectionSerializer(serializers.ModelSerializer):
    """Serializer for Collection model"""
    categories = serializers.SerializerMethodField()
    categories_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Collection
        fields = ['id', 'name', 'order', 'categories', 'categories_count']
    
    def get_categories(self, obj):
        # Get categories for this collection with question counts
        categories = obj.categories.all()
        return CategorySerializer(categories, many=True, context=self.context).data
    
    def get_categories_count(self, obj):
        return obj.categories.count()


class CategoryBasicSerializer(serializers.ModelSerializer):
    """Lightweight serializer for Category - used in nested serialization to avoid N+1 queries"""
    is_premium = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'locked', 'is_premium', 'image', 'description']
    
    def get_is_premium(self, obj):
        return obj.locked
    
    def get_image(self, obj):
        if obj.image:
            url = obj.image.url
            if url and not url.startswith('http'):
                url = f'https://{url}'
            return url
        return None


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model with all computed fields"""
    questions_count = serializers.SerializerMethodField()
    total_questions = serializers.SerializerMethodField()
    user_played_questions = serializers.SerializerMethodField()
    is_premium = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    created_by_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'locked', 'is_premium', 'image', 'description', 'questions_count', 'total_questions', 'user_played_questions', 'is_custom', 'is_approved', 'privacy', 'created_by_id']
        
    def get_questions_count(self, obj):
        return obj.question_set.count()
    
    def get_total_questions(self, obj):
        return obj.question_set.count()
    
    def get_user_played_questions(self, obj):
        # Get the count of questions in this category that have been played by the current user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Import here to avoid circular imports
            from gameplay.models import PlayedQuestion
            return obj.question_set.filter(
                playedquestion__game__player=request.user
            ).distinct().count()
        return 0
    
    def get_created_by_id(self, obj):
        """Return the ID of the user who created this category"""
        if obj.created_by:
            return obj.created_by.id
        return None
    
    def get_is_premium(self, obj):
        # Map locked field to is_premium for frontend compatibility
        return obj.locked
    
    def get_image(self, obj):
        if obj.image:
            # Get the URL from storage backend
            url = obj.image.url
            # Ensure it has https:// protocol
            if url and not url.startswith('http'):
                url = f'https://{url}'
            return url
        return None


class UserQuestionSerializer(serializers.ModelSerializer):
    """Serializer for creating user questions"""
    class Meta:
        model = Question
        fields = ['id', 'text', 'answer', 'points', 'image', 'answer_image']
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True},
            'answer_image': {'required': False, 'allow_null': True},
        }
    
    def validate(self, data):
        """Optimize images during validation using centralized utility"""
        import logging
        from content.image_optimizer import validate_and_optimize_image
        
        logger = logging.getLogger(__name__)
        
        # Optimize image if provided
        if 'image' in data and data['image']:
            try:
                logger.debug('Optimizing question image...')
                data['image'] = validate_and_optimize_image(data['image'])
            except Exception as e:
                logger.warning(f"Question image optimization failed: {e}")
                # Continue with original if optimization fails
            
        # Optimize answer_image if provided
        if 'answer_image' in data and data['answer_image']:
            try:
                logger.debug('Optimizing answer image...')
                data['answer_image'] = validate_and_optimize_image(data['answer_image'])
            except Exception as e:
                logger.warning(f"Answer image optimization failed: {e}")
                # Continue with original if optimization fails
            
        return data
        

class UserCategoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating user-generated categories"""
    questions = UserQuestionSerializer(many=True, write_only=True, required=False, allow_null=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'image', 'privacy', 'questions']

    def to_internal_value(self, data):
        questions = data.get('questions')
        import logging, re
        logger = logging.getLogger(__name__)
        logger.debug('UserCategoryCreateSerializer incoming raw data keys: %s', list(data.keys()))

        # If questions provided as JSON string, parse it
        if isinstance(questions, str):
            import json
            try:
                parsed = json.loads(questions)
                data['questions'] = parsed
                logger.debug('Parsed questions JSON length: %s', len(parsed) if isinstance(parsed, list) else 'not-list')
            except Exception as e:
                logger.exception('Failed to parse questions JSON: %s', e)

        # If questions not present but sent as form fields like questions[0][text], reconstruct
        if not data.get('questions'):
            pattern = re.compile(r'^questions\[(\d+)\]\[(\w+)\]$')
            temp: dict[int, dict] = {}
            for key in list(data.keys()):
                m = pattern.match(key)
                if m:
                    idx = int(m.group(1))
                    field = m.group(2)
                    # Django's request.data may return lists for values; get first
                    val = data.get(key)
                    if isinstance(val, (list, tuple)):
                        val = val[0]
                    temp.setdefault(idx, {})[field] = val

            if temp:
                # Build ordered list
                questions_list = [temp[i] for i in sorted(temp.keys())]
                data['questions'] = questions_list
                logger.debug('Reconstructed questions from form fields, count=%s', len(questions_list))

        return super().to_internal_value(data)

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        user = self.context['request'].user

        # Create category
        category = Category.objects.create(
            **validated_data,
            is_custom=True,
            created_by=user,
            is_approved=False  # Requires admin approval
        )

        # Create questions (if provided)
        if questions_data:
            for question_data in questions_data:
                Question.objects.create(category=category, **question_data)

        return category
    
    def update(self, instance, validated_data):
        """Update category and ADD new questions (don't replace existing ones)"""
        import logging
        logger = logging.getLogger(__name__)
        
        questions_data = validated_data.pop('questions', None)
        
        logger.debug(f'Serializer update: Category {instance.id}, questions_data: {questions_data}')
        logger.debug(f'Serializer update: validated_data keys: {list(validated_data.keys())}')
        
        # Update category fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # ADD new questions (if provided) - don't delete existing ones
        if questions_data:
            logger.info(f'Adding {len(questions_data)} new questions to category {instance.id}')
            for idx, question_data in enumerate(questions_data):
                q = Question.objects.create(category=instance, **question_data)
                logger.debug(f'Created question {idx + 1}: ID={q.id}, text={question_data.get("text", "")[:50]}')
        else:
            logger.debug(f'No questions_data provided for category {instance.id} update')

        return instance


class UserCategorySerializer(serializers.ModelSerializer):
    """Serializer for displaying user categories"""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    created_by_id = serializers.IntegerField(source='created_by.id', read_only=True)
    created_by_avatar = serializers.SerializerMethodField()
    created_by_is_premium = serializers.SerializerMethodField()
    questions_count = serializers.SerializerMethodField()
    total_questions = serializers.SerializerMethodField()
    user_played_questions = serializers.SerializerMethodField()
    is_premium = serializers.SerializerMethodField()  # mirror locked mapping for consistency with CategorySerializer
    image_url = serializers.SerializerMethodField()  # Renamed to avoid conflict with writable image field
    is_saved = serializers.SerializerMethodField()
    saves_count = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'image', 'image_url', 'privacy', 
            'is_custom', 'is_approved', 'created_by', 'created_by_id', 'created_by_username', 'created_by_avatar',
            'created_by_is_premium', 'created_at', 'updated_at', 'questions_count', 'total_questions', 'user_played_questions',
            'is_premium', 'is_saved', 'saves_count', 'likes_count', 'is_liked'
        ]
        read_only_fields = ['is_custom', 'is_approved', 'created_by', 'created_at', 'updated_at']
        extra_kwargs = {
            'image': {'write_only': True}  # Image field for uploads, image_url for display
        }
    
    def get_questions_count(self, obj):
        return obj.question_set.count()
    def get_total_questions(self, obj):
        # Keep a separate field for frontend expecting total_questions
        return obj.question_set.count()

    def get_user_played_questions(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                from gameplay.models import PlayedQuestion
                return obj.question_set.filter(
                    playedquestion__game__player=request.user
                ).distinct().count()
            except Exception:
                return 0
        return 0

    def get_is_premium(self, obj):
        # Align with CategorySerializer: locked => is_premium
        return getattr(obj, 'locked', False)
    
    def get_is_saved(self, obj):
        """Check if the current user has saved this category"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .models import SavedCategory
            return SavedCategory.objects.filter(user=request.user, category=obj).exists()
        return False
    
    def get_saves_count(self, obj):
        """Get the total number of saves for this category"""
        from .models import SavedCategory
        return SavedCategory.objects.filter(category=obj).count()

    def get_likes_count(self, obj):
        return CategoryLike.objects.filter(category=obj).count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return CategoryLike.objects.filter(user=request.user, category=obj).exists()
        return False
    
    def get_created_by_is_premium(self, obj):
        """Get premium status of the creator"""
        if not obj.created_by:
            return False

        try:
            # Prefer a direct `is_premium` attribute on User (helper that reads UserProfile)
            if hasattr(obj.created_by, 'is_premium'):
                return bool(getattr(obj.created_by, 'is_premium'))

            # Fallback: check UserProfile attached to the user
            userprofile = getattr(obj.created_by, 'userprofile', None)
            if userprofile is not None:
                return bool(getattr(userprofile, 'is_premium', False))

            # Legacy fallback for old Membership model (if still present)
            if hasattr(obj.created_by, 'membership'):
                try:
                    membership = getattr(obj.created_by, 'membership')
                    return bool(membership.is_active_premium())
                except Exception:
                    return False
        except Exception:
            return False

        return False
    
    def get_created_by_avatar(self, obj):
        """Get the avatar URL of the user who created this category"""
        if obj.created_by and hasattr(obj.created_by, 'avatar') and obj.created_by.avatar:
            # Get the URL from storage backend
            url = obj.created_by.avatar.url
            # Ensure it has https:// protocol
            if url and not url.startswith('http'):
                url = f'https://{url}'
            return url
        return None
    
    def get_image_url(self, obj):  # Renamed from get_image
        if obj.image:
            # Get the URL from storage backend
            url = obj.image.url
            # Ensure it has https:// protocol
            if url and not url.startswith('http'):
                url = f'https://{url}'
            return url
        return None


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for Question model - handles both read and write for images"""
    category = CategoryBasicSerializer(read_only=True)  # Use lightweight serializer to avoid N+1 queries
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'category', 'category_name', 'text', 'text_ar', 
            'answer', 'choice_2', 'choice_3', 'choice_4', 'answer_ar', 
            'image', 'answer_image',
            'difficulty', 'points'
        ]
    
    def validate(self, data):
        """Optimize images during validation using centralized utility"""
        import logging
        from content.image_optimizer import validate_and_optimize_image
        
        logger = logging.getLogger(__name__)
        
        # Optimize image if provided
        if 'image' in data and data['image']:
            try:
                logger.debug('Optimizing question image...')
                data['image'] = validate_and_optimize_image(data['image'])
            except Exception as e:
                logger.warning(f"Question image optimization failed: {e}")
                # Continue with original if optimization fails
            
        # Optimize answer_image if provided
        if 'answer_image' in data and data['answer_image']:
            try:
                logger.debug('Optimizing answer image...')
                data['answer_image'] = validate_and_optimize_image(data['answer_image'])
            except Exception as e:
                logger.warning(f"Answer image optimization failed: {e}")
                # Continue with original if optimization fails
            
        return data

    def to_representation(self, instance):
        """Transform image fields to URLs when reading"""
        data = super().to_representation(instance)
        
        # Transform image field to URL
        if instance.image:
            image_str = str(instance.image)
            if image_str.startswith("http"):
                data['image'] = image_str
            else:
                data['image'] = instance.image.url
        else:
            data['image'] = None
        
        # Transform answer_image field to URL
        if instance.answer_image:
            answer_image_str = str(instance.answer_image)
            if answer_image_str.startswith("http"):
                data['answer_image'] = answer_image_str
            else:
                data['answer_image'] = instance.answer_image.url
        else:
            data['answer_image'] = None
        
        return data
