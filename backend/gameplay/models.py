import logging
from django.db import models
from django.contrib.auth.models import User
from content.models import Category, Question
from django.core.cache import cache
logger = logging.getLogger(__name__)


class Game(models.Model):
    player = models.ForeignKey(User, on_delete=models.CASCADE)
    mode = models.CharField(max_length=20, choices=[("offline", "Offline"), ("solo", "Solo"), ("online", "Online")])
    categories = models.ManyToManyField(Category)
    teams = models.JSONField(default=list, help_text='List of teams: [{"name": "...", "avatar": "..."}]')
    date_played = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['player', '-date_played']),  # Composite index for recent games query
        ]
        ordering = ['-date_played']  # Default ordering by newest first

    def __str__(self):
        return f"Game {self.id} by {self.player.username}"
    
    def get_available_questions(self):
        """Get available questions with variety and limits per category - OPTIMIZED VERSION
        
        Uses pre-shuffled random_key field for deterministic, consistent ordering.
        """
   
        
        # Track which questions have already been played to keep cache keys stable
        played_question_ids = sorted(self.playedquestion_set.values_list('question__id', flat=True))
        # Cache key version: v1 - allows easy invalidation if format changes
        cache_key = f"v1:game_{self.id}_board_{len(played_question_ids)}_{hash(tuple(played_question_ids))}"
        
        cached_question_ids = cache.get(cache_key)
        if cached_question_ids is not None:
            logger.debug(f"Game {self.id}: Using cached question ids (cache hit)")
            # Backwards compatibility: older cache entries stored Question instances
            if cached_question_ids and isinstance(cached_question_ids[0], Question):
                cached_ids = [q.id for q in cached_question_ids]
            else:
                cached_ids = list(cached_question_ids)
            # Re-fetch fresh Question objects to ensure latest media/fields
            questions = list(Question.objects.filter(id__in=cached_ids))
            by_id = {q.id: q for q in questions}
            ordered_questions = [by_id[q_id] for q_id in cached_ids if q_id in by_id]
            return ordered_questions
        
        logger.debug(f"Game {self.id}: Cache miss - generating questions")
        
        # No seed() needed - using database ordering via random_key field
        
        # Check if we already have a fixed question board by looking at game questions
        if self.playedquestion_set.exists():
            # Board is already fixed - get the original questions for this game
            logger.debug(f"Game {self.id}: Board is fixed, reconstructing original questions")
            questions = self._get_fixed_question_board_for_existing_game()
        else:
            # First time - generate the question board
            logger.debug(f"Game {self.id}: Generating initial question board")
            questions = self._generate_initial_question_board()
        
        # Cache the result for 10 minutes (longer cache time)
        cache.set(cache_key, [q.id for q in questions], 600)
        logger.debug(f"Game {self.id}: Cached {len(questions)} question ids")
        return questions
    
    def _get_fixed_question_board_for_existing_game(self):
        """Get the fixed question board for a game that already has played questions
        
        Uses deterministic ordering via random_key field.
        """
        
        
        # No seed() needed - using database ordering
        
        # Get questions played by this user across ALL their games WHEN THE GAME STARTED
        # We need to simulate the state when this game was created
        # For simplicity, we'll exclude questions from games created AFTER this game
        user_played_question_ids = PlayedQuestion.objects.filter(
            game__player=self.player,
            game__date_played__lt=self.date_played  # Only games created before this one
        ).values_list('question__id', flat=True)
        
        return self._generate_question_board(user_played_question_ids)
    
    def _generate_initial_question_board(self):
        """Generate the initial question board for a new game
        
        Uses deterministic ordering via random_key field.
        """
        
        
        # No seed() needed - using database ordering
        
        # Get questions played by this user across ALL their games
        user_played_question_ids = PlayedQuestion.objects.filter(
            game__player=self.player
        ).exclude(game=self).values_list('question__id', flat=True)
        
        return self._generate_question_board(user_played_question_ids)
    
    def _generate_question_board(self, exclude_question_ids):
        """Generate the question board with given exclusions
        
        Uses pre-shuffled random_key field for deterministic ordering.
        All users get the same questions from the shuffled order for their first game.
        """
        
        
        fixed_questions = []
        
        logger.debug(f"Game {self.id}: Excluding {len(exclude_question_ids)} questions from board generation")
        
        for category in self.categories.all():
            # Get all questions from this category, excluding previously played ones
            # This ensures no repeats regardless of random selection method used
            category_questions = Question.objects.filter(category=category)
            unplayed_questions = category_questions.exclude(id__in=exclude_question_ids)
            
            # Organize questions by difficulty (points) and use random_key for deterministic ordering
            # Order by random_key to ensure ALL users get the same questions (from pre-shuffled order)
            easy_questions = list(unplayed_questions.filter(difficulty='200').order_by('random_key'))
            medium_questions = list(unplayed_questions.filter(difficulty='400').order_by('random_key'))
            hard_questions = list(unplayed_questions.filter(difficulty='600').order_by('random_key'))
            
            logger.debug(f"Category {category.name}: Easy={len(easy_questions)}, Medium={len(medium_questions)}, Hard={len(hard_questions)}")
            
            # NO shuffle() here - questions are already in shuffled order via random_key
            # This ensures deterministic selection: all new users get questions 1-6 from each difficulty
            
            # Select questions ensuring variety (max 6 per category) - FIXED FOR ENTIRE GAME
            category_selected = []
            
            # Try to get at least one from each difficulty if available
            if easy_questions:
                category_selected.extend(easy_questions[:2])  # Max 2 easy
            if medium_questions:
                category_selected.extend(medium_questions[:2])  # Max 2 medium
            if hard_questions:
                category_selected.extend(hard_questions[:2])  # Max 2 hard
            
            # If we have less than 6 questions, fill up with remaining questions
            remaining_slots = 6 - len(category_selected)
            if remaining_slots > 0:
                # Get remaining questions from all difficulties
                all_remaining = []
                all_remaining.extend(easy_questions[2:])  # Skip already selected
                all_remaining.extend(medium_questions[2:])
                all_remaining.extend(hard_questions[2:])
                # NO shuffle - keep deterministic order
                category_selected.extend(all_remaining[:remaining_slots])
            
            logger.debug(f"Category {category.name}: Selected {len(category_selected)} questions for game board")
            
            # Add to final list
            fixed_questions.extend(category_selected)
        
        # NO final shuffle - keep deterministic order so all users get same questions
        # Questions are already in shuffled order via random_key field
        
        # Return only questions not yet played in this game
        game_played_question_ids = set(self.playedquestion_set.values_list('question__id', flat=True))
        available = [q for q in fixed_questions if q.id not in game_played_question_ids]
        
        logger.debug(f"Game {self.id}: Generated board with {len(fixed_questions)} total questions, {len(available)} currently available")
        return available
    
    # Scores are managed client-side; no server-side aggregate provided


class PlayedQuestion(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)


    def __str__(self):
        return f"Q{self.question.id} in Game {self.game.id}"
