"""
Utility functions for content management.
"""
import random
from django.db import transaction
from .models import Question


def shuffle_category_questions(category_id):
    """
    Shuffle questions in a specific category by assigning new random_key values.
    
    This is a ONE-TIME operation that should be triggered manually via admin action.
    It assigns each question a random float between 0 and 1, which is then used
    for deterministic "random" ordering in queries.
    
    Args:
        category_id: The ID of the category to shuffle
        
    Returns:
        int: Number of questions shuffled
        
    Performance:
        - Uses bulk_update for optimal database performance
        - Wrapped in transaction for atomicity
        - Only updates questions in the specified category
    """
    with transaction.atomic():
        # Get all questions for this category
        questions = list(Question.objects.filter(category_id=category_id))
        
        if not questions:
            return 0
        
        # Assign random keys
        for question in questions:
            question.random_key = random.random()
        
        # Bulk update for performance (much faster than saving individually)
        Question.objects.bulk_update(questions, ['random_key'], batch_size=500)
        
        return len(questions)


def shuffle_all_categories():
    """
    Shuffle questions in ALL categories.
    
    This is useful for initial setup or bulk re-shuffling.
    Use with caution in production as it affects all questions.
    
    Returns:
        dict: Statistics about the shuffle operation
    """
    from .models import Category
    
    categories = Category.objects.all()
    total_questions = 0
    categories_shuffled = 0
    
    for category in categories:
        count = shuffle_category_questions(category.id)
        if count > 0:
            categories_shuffled += 1
            total_questions += count
    
    return {
        'categories_shuffled': categories_shuffled,
        'total_questions': total_questions
    }
