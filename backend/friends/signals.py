from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.db import models
from .models import FriendList, FriendRequest

# Import Chat model from chat app
# Note: to prevent circular imports, we can use Django's apps.get_model
# or import inside the function
from django.apps import apps


@receiver(post_save, sender=User)
def create_friend_list(sender, instance, created, **kwargs):
    """Create a FriendList for each new User"""
    if created:
        FriendList.objects.create(user=instance)


@receiver(post_save, sender=FriendRequest)
def create_chat_room(sender, instance, **kwargs):
    """Create a chat room when a friend request is accepted"""
    if instance.is_accepted:
        # Get the Chat model dynamically to avoid circular imports
        Chat = apps.get_model('chat', 'Chat')

        user1 = instance.sender
        user2 = instance.receiver

        # Create a chat room if one doesn't already exist
        participant_ids = sorted([str(user1.id), str(user2.id)])
        room_name_1 = '_'.join(participant_ids)
        room_name_2 = '_'.join(participant_ids[::-1])

        # Check if chat already exists
        existing_chat = Chat.objects.filter(
            models.Q(room_name_1=room_name_1) |
            models.Q(room_name_2=room_name_2)
        ).first()

        if not existing_chat:
            # Create new chat
            chat = Chat.objects.create()
            chat.participants.add(user1, user2)
            chat.save()