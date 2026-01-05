"""
Management command to shuffle questions in all categories or specific categories.
"""
from django.core.management.base import BaseCommand
from content.models import Category
from content.utils import shuffle_category_questions, shuffle_all_categories


class Command(BaseCommand):
    help = 'Shuffle questions by assigning random_key values for optimized random queries'

    def add_arguments(self, parser):
        parser.add_argument(
            '--category',
            type=int,
            help='Shuffle only this category ID',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Shuffle all categories',
        )

    def handle(self, *args, **options):
        category_id = options.get('category')
        shuffle_all = options.get('all')

        if category_id:
            # Shuffle single category
            try:
                category = Category.objects.get(pk=category_id)
                self.stdout.write(f'🎲 Shuffling category: {category.name}...')
                count = shuffle_category_questions(category_id)
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Shuffled {count} questions in "{category.name}"')
                )
            except Category.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'❌ Category with ID {category_id} not found')
                )
                return

        elif shuffle_all:
            # Shuffle all categories
            self.stdout.write('🎲 Shuffling ALL categories...')
            stats = shuffle_all_categories()
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Shuffled {stats["total_questions"]} questions '
                    f'across {stats["categories_shuffled"]} categories'
                )
            )

        else:
            self.stdout.write(
                self.style.WARNING(
                    'Please specify --category <id> or --all\n'
                    'Examples:\n'
                    '  python manage.py shuffle_questions --category 5\n'
                    '  python manage.py shuffle_questions --all'
                )
            )
