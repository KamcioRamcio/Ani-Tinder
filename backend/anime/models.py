from django.contrib.auth.models import User
from django.db import models
from core.models import TimeStampedModel


class Genre(models.Model):
    """Genre model for user-created genres"""
    name = models.CharField(max_length=100, unique=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name


class AnimeListGenres(models.Model):
    """Predefined genres from anime lists"""
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Anime List Genre"
        verbose_name_plural = "Anime List Genres"


class Anime(models.Model):
    """Main anime model containing details about each anime"""
    title = models.CharField(max_length=255)
    score = models.FloatField(blank=True, null=True)
    episodes = models.IntegerField(blank=True, null=True)
    genres = models.ManyToManyField(AnimeListGenres, related_name='anime')
    year = models.IntegerField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    synopsis = models.TextField(blank=True, null=True)
    trailer_url = models.URLField(blank=True, null=True)
    mal_id = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Anime"
        verbose_name_plural = "Anime"
        ordering = ['title']


class AnimeQuotes(models.Model):
    """Quotes from anime series"""
    anime = models.CharField(max_length=255)
    quote = models.TextField()
    character = models.CharField(max_length=255)

    def __str__(self):
        return f'"{self.quote}" - {self.character} from {self.anime}'

    class Meta:
        verbose_name = "Anime Quote"
        verbose_name_plural = "Anime Quotes"