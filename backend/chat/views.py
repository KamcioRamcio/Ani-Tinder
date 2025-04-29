from django.db import models
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from core.permissions import IsParticipant

from .models import Chat, ChatMessage
from .serializers import ChatSerializer, ChatMessageSerializer, ChatCreateSerializer


class ChatListView(generics.ListAPIView):
    """List all chats for the current user"""
    serializer_class = ChatSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get all chats where the current user is a participant"""
        user = self.request.user
        return Chat.objects.filter(participants=user)


class ChatCreateView(generics.CreateAPIView):
    """Create a new chat with another user"""
    serializer_class = ChatCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChatMessageListView(generics.ListAPIView):
    """List all messages in a chat"""
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get all messages for a specific chat room"""
        room_name = self.kwargs['room_name']
        try:
            # Find the chat by either room name
            chat = Chat.objects.get(models.Q(room_name_1=room_name) | models.Q(room_name_2=room_name))

            # Check if the user is a participant
            if self.request.user not in chat.participants.all():
                return ChatMessage.objects.none()

            return ChatMessage.objects.filter(chat=chat).order_by('timestamp')
        except Chat.DoesNotExist:
            return ChatMessage.objects.none()