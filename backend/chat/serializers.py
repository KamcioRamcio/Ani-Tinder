from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Chat, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages"""
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'sender_username', 'content', 'timestamp']


class ChatSerializer(serializers.ModelSerializer):
    """Serializer for chats"""
    participants = serializers.SlugRelatedField(
        many=True,
        slug_field='username',
        queryset=User.objects.all()
    )
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Chat
        fields = ['id', 'participants', 'messages', 'room_name_1']


class ChatCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new chat"""
    participant_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Chat
        fields = ['id', 'participant_id']

    def create(self, validated_data):
        user = self.context['request'].user
        participant_id = validated_data.pop('participant_id')

        try:
            participant = User.objects.get(id=participant_id)
        except User.DoesNotExist:
            raise serializers.ValidationError("Specified user does not exist")

        # Check if chat already exists between these users
        participant_ids = sorted([str(user.id), str(participant.id)])
        room_name_1 = '_'.join(participant_ids)
        room_name_2 = '_'.join(participant_ids[::-1])

        existing_chat = Chat.objects.filter(
            models.Q(room_name_1=room_name_1) |
            models.Q(room_name_2=room_name_2)
        ).first()

        if existing_chat:
            return existing_chat

        # Create new chat
        chat = Chat.objects.create()
        chat.participants.add(user, participant)
        return chat