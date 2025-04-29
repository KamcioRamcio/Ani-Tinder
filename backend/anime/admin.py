from django.contrib import admin
from .models import Genre, Anime, AnimeQuotes, AnimeListGenres


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ['name', 'author']
    search_fields = ['name', 'author__username']
    list_filter = ['author']


@admin.register(AnimeListGenres)
class AnimeListGenresAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(Anime)
class AnimeAdmin(admin.ModelAdmin):
    list_display = ['title', 'score', 'episodes', 'year', 'mal_id']
    search_fields = ['title', 'synopsis']
    list_filter = ['year', 'genres']
    filter_horizontal = ['genres']


@admin.register(AnimeQuotes)
class AnimeQuotesAdmin(admin.ModelAdmin):
    list_display = ['anime', 'character', 'quote']
    search_fields = ['anime', 'character', 'quote']
    list_filter = ['anime', 'character']