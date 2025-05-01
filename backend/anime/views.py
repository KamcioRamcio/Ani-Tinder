
from django.db.models.functions import Lower, Substr
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from core.permissions import IsOwnerOrReadOnly

from .models import Genre, Anime, AnimeQuotes
from .serializers import GenreSerializer, AnimeSerializer, QuoteSerializer

import json
import os
from django.http import JsonResponse
from .models import Anime, AnimeListGenres


def import_anime_data(request):
    """Import anime data from JSON file to the database"""
    file_path = os.path.join(os.path.dirname(__file__), '../static', 'anime.json')

    try:
        with open(file_path, 'r') as file:
            anime_data = json.load(file)

        imported_count = 0
        skipped_count = 0

        for item in anime_data:
            # Check if anime already exists by MAL ID or title
            if item.get('mal_id') and Anime.objects.filter(mal_id=item.get('mal_id')).exists():
                skipped_count += 1
                continue

            # Create new anime record
            anime = Anime(
                title=item.get('title'),
                score=item.get('score'),
                episodes=item.get('episodes'),
                year=item.get('year'),
                image_url=item.get('image_url'),
                synopsis=item.get('synopsis'),
                trailer_url=item.get('trailer_url'),
                mal_id=item.get('mal_id')
            )
            anime.save()

            # Process genres (assuming they're in a list)
            if 'genres' in item and isinstance(item['genres'], list):
                for genre_name in item['genres']:
                    # Get or create genre
                    genre, created = AnimeListGenres.objects.get_or_create(name=genre_name)
                    # Add genre to anime
                    anime.genres.add(genre)

            imported_count += 1

        return JsonResponse({
            'status': 'success',
            'imported': imported_count,
            'skipped': skipped_count,
            'message': f'Successfully imported {imported_count} anime entries to database'
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)



class GenreList(generics.ListCreateAPIView):
    """List and create genres"""
    serializer_class = GenreSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Genre.objects.filter(author=user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class GenreDelete(generics.DestroyAPIView):
    """Delete a genre"""
    serializer_class = GenreSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        return Genre.objects.filter(author=self.request.user)


class AnimeView(generics.ListCreateAPIView):
    """List all anime"""
    queryset = Anime.objects.all()
    serializer_class = AnimeSerializer
    permission_classes = [AllowAny]


def read_json_file_view(request):
    """Read JSON data from file"""
    file_path = os.path.join(os.path.dirname(__file__), 'data', 'anime_data.json')
    with open(file_path, 'r') as file:
        json_data = json.load(file)

    return JsonResponse(json_data)


class AnimeQuotesView(generics.ListCreateAPIView):
    """List and create anime quotes"""
    permission_classes = [AllowAny]
    serializer_class = QuoteSerializer
    queryset = AnimeQuotes.objects.all()


class AnimeAllView(generics.ListAPIView):
    """List all anime sorted alphabetically"""
    permission_classes = [AllowAny]
    serializer_class = AnimeSerializer

    def get_queryset(self):
        return Anime.objects.annotate(
            first_letter=Lower(Substr('title', 1, 1))
        ).order_by('first_letter')