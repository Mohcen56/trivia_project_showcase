from rest_framework import serializers
from .models import Game, PlayedQuestion
from content.models import Category, Question
from content.serializers import CategorySerializer, QuestionSerializer
from authentication.serializers import UserSerializer


class PlayedQuestionSerializer(serializers.ModelSerializer):
    """Serializer for PlayedQuestion model"""
    question = QuestionSerializer(read_only=True)
    
    
    class Meta:
        model = PlayedQuestion
        fields = ['id', 'question']


class GameSerializer(serializers.ModelSerializer):
    """Serializer for Game model"""
    player = UserSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    teams = serializers.SerializerMethodField()
    played_questions = PlayedQuestionSerializer(many=True, read_only=True, source='playedquestion_set')
    # team_scores removed; scores are managed client-side
    
    def get_teams(self, obj):
        """Add IDs to teams for frontend compatibility"""
        teams = obj.teams if obj.teams else []
        # Ensure each team has an id (use index as id if not present)
        return [
            {**team, 'id': team.get('id', idx + 1)}
            for idx, team in enumerate(teams)
        ]
    
    class Meta:
        model = Game
        fields = [
            'id', 'player', 'mode', 'categories', 'teams', 
            'played_questions', 'date_played'
        ]
        read_only_fields = ['id', 'date_played']


class LightweightGameSerializer(serializers.ModelSerializer):
    """Reduced Game serializer for gameplay screen: excludes played_questions for performance."""
    player = UserSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    teams = serializers.SerializerMethodField()
    available_questions = serializers.SerializerMethodField()
    outside_board_questions = serializers.SerializerMethodField()
    
    def get_teams(self, obj):
        """Add IDs to teams for frontend compatibility"""
        teams = obj.teams if obj.teams else []
        return [
            {**team, 'id': team.get('id', idx + 1)}
            for idx, team in enumerate(teams)
        ]

    class Meta:
        model = Game
        fields = [
            'id', 'player', 'mode', 'categories', 'teams', 'date_played',
            'available_questions', 'outside_board_questions',
        ]
        read_only_fields = ['id', 'date_played']

    def get_available_questions(self, obj):
        """Return the questions currently active on the board for this game."""
        questions = obj.get_available_questions()
        return QuestionSerializer(questions, many=True).data

    def get_outside_board_questions(self, obj):
        """Return backup questions that are not currently on the board or already played."""
        # Reuse the selection logic from the prefetch_outside_board action (default to 4 items)
        count = 4

        available_ids = [q.id for q in obj.get_available_questions()]
        played_ids = list(PlayedQuestion.objects.filter(game=obj).values_list('question_id', flat=True))
        board_ids = set(available_ids) | set(played_ids)

        category_ids = list(obj.categories.values_list('id', flat=True))
        if not category_ids:
            return []

        # Randomize selection (excludes board & played questions, so no duplicates across games)
        pool_qs = Question.objects.filter(category_id__in=category_ids).exclude(id__in=board_ids).order_by('?')[:count]
        questions = list(pool_qs)

        if not questions:
            return []

        return QuestionSerializer(questions, many=True).data


class GameCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new game"""
    category_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True
    )
    team_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True,
        required=False
    )
    teams = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text='List of team objects with name and avatar'
    )
    
    class Meta:
        model = Game
        fields = ['mode', 'category_ids', 'team_names', 'teams']
        
    def create(self, validated_data):
        category_ids = validated_data.pop('category_ids')
        team_names = validated_data.pop('team_names', [])
        teams_data = validated_data.pop('teams', [])
        
        # Create the game
        game = Game.objects.create(
            player=self.context['request'].user,
            **validated_data
        )
        
        # Add categories
        categories = Category.objects.filter(id__in=category_ids)
        game.categories.set(categories)
        
        # Store teams as JSON - prioritize teams data over team_names
        if teams_data:
            # Teams already in correct format: [{"name": "...", "avatar": "..."}]
            # Add IDs for frontend compatibility
            game.teams = [
                {**team, 'id': idx + 1}
                for idx, team in enumerate(teams_data)
            ]
        elif team_names:
            # Fallback to old format - convert to new format with IDs
            game.teams = [
                {"id": idx + 1, "name": name, "avatar": "cat"}
                for idx, name in enumerate(team_names)
            ]
        
        game.save()
        return game


class QuestionAnswerSerializer(serializers.Serializer):
    """Serializer for answering a question"""
    question_id = serializers.IntegerField()
    team_id = serializers.IntegerField(required=False, allow_null=True)
    is_correct = serializers.BooleanField()
    
    def validate_question_id(self, value):
        try:
            Question.objects.get(id=value)
        except Question.DoesNotExist:
            raise serializers.ValidationError("Question does not exist.")
        return value
        
    def validate_team_id(self, value):
        # Team validation removed - teams are now stored as JSON in Game model
        # Frontend manages team state in Redux
        return value