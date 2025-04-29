from django.contrib import admin
from .models import Profile, UserAnimeList, TempDeletedAnime


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['username', 'user', 'anime_list_public']
    search_fields = ['username', 'user__username']
    list_filter = ['anime_list_public']


@admin.register(UserAnimeList)
class UserAnimeListAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'watched', 'plan_to_watch', 'add_time']
    search_fields = ['title', 'author__username']
    list_filter = ['watched', 'plan_to_watch']


@admin.register(TempDeletedAnime)
class TempDeletedAnimeAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'time_deleted']
    search_fields = ['title', 'author__username']
    list_filter = ['time_deleted']