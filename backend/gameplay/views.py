import logging
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import Game, PlayedQuestion
from .serializers import (
    GameSerializer, PlayedQuestionSerializer, 
    GameCreateSerializer, QuestionAnswerSerializer, LightweightGameSerializer
)
from content.models import Question
from content.serializers import QuestionSerializer
from authentication.serializers import UserSerializer

logger = logging.getLogger(__name__)


class GameViewSet(viewsets.ModelViewSet):
    """ViewSet for Game model"""
    permission_classes = [permissions.IsAuthenticated]
    
   
    
    def get_queryset(self):
        """Return games for the current user with optimized queries"""
        logger.debug(f"Fetching games for user: {self.request.user.username} (authenticated: {self.request.user.is_authenticated})")
        
        queryset = Game.objects.filter(player=self.request.user).prefetch_related(
            'playedquestion_set__question__category'
        ).order_by('-date_played')
        
        logger.debug(f"Found {queryset.count()} games for user {self.request.user.username}")
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializer for create action"""
        if self.action == 'create':
            return GameCreateSerializer
        # Use lightweight serializer for retrieve to prevent heavy nested payloads causing 500
        if self.action == 'retrieve':
            return LightweightGameSerializer
        return GameSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new game and return full game data"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create the game using the GameCreateSerializer
        game = serializer.save()
        
        # Return the full game data using the regular GameSerializer
        game_serializer = GameSerializer(game, context={'request': request})
        return Response(game_serializer.data, status=status.HTTP_201_CREATED)
    
    
    
    @action(detail=True, methods=['post'])
    def finish_round(self, request, pk=None):
        """Record a batch of played questions at the end of a round"""
        game = self.get_object()
        played_ids = request.data.get('played_question_ids', [])

        if not isinstance(played_ids, list):
            return Response(
                {'error': 'played_question_ids must be a list'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            normalized_ids = {int(q_id) for q_id in played_ids}
        except (TypeError, ValueError):
            return Response(
                {'error': 'played_question_ids must contain integers'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not normalized_ids:
            return Response({'status': 'ok', 'saved': 0})

        questions = {
            q.id: q
            for q in Question.objects.filter(id__in=normalized_ids)
        }

        if not questions:
            return Response({'status': 'ok', 'saved': 0})

        existing_ids = set(
            PlayedQuestion.objects.filter(
                game=game,
                question_id__in=questions.keys(),
            ).values_list('question_id', flat=True)
        )

        to_create = [
            PlayedQuestion(
                game=game,
                question=questions[q_id],
            )
            for q_id in questions.keys()
            if q_id not in existing_ids
        ]

        if to_create:
            PlayedQuestion.objects.bulk_create(to_create)

            from django.core.cache import cache
            cache.delete(f"game_{game.id}_questions")

        return Response({'status': 'ok', 'saved': len(to_create)})

    @action(detail=True, methods=['get'])
    def available_questions(self, request, pk=None):
        """Get available questions for the game"""
        game = self.get_object()

        questions = game.get_available_questions()
        logger.debug(f"Available questions count for game {pk}: {len(questions)}")
        
        serializer = QuestionSerializer(questions, many=True)
        response_data = serializer.data
        
        return Response(response_data)



    @action(detail=True, methods=['get'])
    def prefetch_outside_board(self, request, pk=None):
        """
        Return up to N questions outside the current board for this game.
        Query param: count (default 4, max 10)
        
        Uses deterministic ordering via random_key field.
        """
        game = self.get_object()
        try:
            count = int(request.query_params.get('count', 4))
        except (TypeError, ValueError):
            count = 4
        count = max(1, min(count, 10))

        available_ids = [q.id for q in game.get_available_questions()]
        played_ids = list(PlayedQuestion.objects.filter(game=game).values_list('question_id', flat=True))
        board_ids = set(available_ids) | set(played_ids)

        category_ids = list(game.categories.values_list('id', flat=True))
        if not category_ids:
            return Response([], status=status.HTTP_200_OK)

        # Randomize selection (excludes board & played questions, so no duplicates across games)
        pool_qs = Question.objects.filter(category_id__in=category_ids).exclude(id__in=board_ids).order_by('?')[:count]
        questions = list(pool_qs)
        
        if not questions:
            return Response([], status=status.HTTP_200_OK)

        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def game_stats(request):
    """Get user's game statistics"""
    user = request.user
    games = Game.objects.filter(player=user)
    
    total_games = games.count()
    total_questions_answered = PlayedQuestion.objects.filter(game__player=user).count()
    
  
    stats = {
        'total_games': total_games,
        'total_questions_answered': total_questions_answered,
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recent_games(request):
    """Get last 3 games with their categories for the current user"""
    games = Game.objects.filter(player=request.user).prefetch_related(
        'categories'
    ).order_by('-date_played')[:3]
    
    result = []
    for game in games:
        result.append({
            'id': game.id,
            'mode': game.mode,
            'date_played': game.date_played.isoformat(),
            'categories': [
                {
                    'id': cat.id,
                    'name': cat.name,
                    'description': cat.description,
                    'image_url': cat.image.url if cat.image else None,
                    'is_premium': cat.locked,
                }
                for cat in game.categories.all()
            ]
        })
    
    return Response(result)
