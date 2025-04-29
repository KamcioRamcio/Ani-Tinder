from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from core.models import TimeStampedModel


class Chat(models.Model):
    """
    Chat model for conversations between users.
    A chat has multiple participants and uses room names for WebSocket connections.
    """
    participants = models.ManyToManyField(User, related_name='chats')
    room_name_1 = models.CharField(max_length=255, unique=True, blank=True)
    room_name_2 = models.CharField(max_length=255, unique=True, blank=True)

    def save(self, *args, **kwargs):
        """
        Custom save method to generate room names based on participant IDs.
        Room names are used for WebSocket connections.
        """
        if not self.room_name_1 or not self.room_name_2:
            participant_ids = sorted([str(participant.id) for participant in self.participants.all()])
            self.room_name_1 = '_'.join(participant_ids)
            self.room_name_2 = '_'.join(participant_ids[::-1])

            if Chat.objects.filter(room_name_1=self.room_name_1).exists() or Chat.objects.filter(
                    room_name_2=self.room_name_2).exists():
                raise ValidationError(
                    f"Chat with room_name '{self.room_name_1}' or '{self.room_name_2}' already exists.")

        super().save(*args, **kwargs)

    def __str__(self):
        participants = ", ".join([user.username for user in self.participants.all()])
        return f"Chat between {participants}"

    class Meta:
        verbose_name = "Chat"
        verbose_name_plural = "Chats"


class ChatMessage(TimeStampedModel):
    """
    Messages within a chat.
    Each message belongs to a chat and has a sender.
    """
    chat = models.ForeignKey(Chat, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"

    class Meta:
        verbose_name = "Chat Message"
        verbose_name_plural = "Chat Messages"
        ordering = ['timestamp']