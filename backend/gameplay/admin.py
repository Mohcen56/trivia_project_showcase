from django.contrib import admin
from .models import Game, PlayedQuestion


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ['id', 'player', 'mode', 'date_played', 'team_count']
    list_filter = ['mode', 'date_played']
    search_fields = ['player__username']
    filter_horizontal = ['categories']
    
    def team_count(self, obj):
        """Show number of teams in the game"""
        return len(obj.teams) if obj.teams else 0
    team_count.short_description = 'Teams'


@admin.register(PlayedQuestion)
class PlayedQuestionAdmin(admin.ModelAdmin):
    list_display = ['game', 'question']
    list_filter = ['game__mode']
    search_fields = ['game__player__username', 'question__text']
