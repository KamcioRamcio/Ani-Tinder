from rest_framework import serializers
from .models import Genre, Anime, AnimeQuotes, AnimeListGenres


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'author', 'name']
        extra_kwargs = {'author': {'read_only': True}}


class AnimeListGenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnimeListGenres
        fields = ['id', 'name']


class AnimeSerializer(serializers.ModelSerializer):
    genres = AnimeListGenreSerializer(many=True, read_only=True)

    class Meta:
        model = Anime
        fields = ['id', 'title', 'genres', 'score', 'episodes', 'year', 'image_url', 'synopsis', 'trailer_url',
                  'mal_id']


class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnimeQuotes
        fields = ['id', 'anime', 'character', 'quote']