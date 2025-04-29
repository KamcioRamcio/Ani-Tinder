import json
import os

from django.db.models.functions import Lower, Substr
from django.http import JsonResponse
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from core.permissions import IsOwnerOrReadOnly

from .models import Genre, Anime, AnimeQuotes
from .serializers import GenreSerializer, AnimeSerializer, QuoteSerializer


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