from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.contrib.auth.models import User
from channels.db import database_sync_to_async
from .models import Chat, ChatMessage


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time chat communications.
    """

    async def connect(self):
        """Handle WebSocket connection"""
        self.sender_id = self.scope['url_route']['kwargs'].get('sender_id')
        self.receiver_id = self.scope['url_route']['kwargs'].get('receiver_id')

        if not self.sender_id or not self.receiver_id:
            await self.close()
            return

        # Create consistent room name based on sorted participant IDs
        participant_ids = sorted([self.sender_id, self.receiver_id])
        self.room_name_1 = f'{participant_ids[0]}_{participant_ids[1]}'
        self.room_name_2 = f'{participant_ids[1]}_{participant_ids[0]}'
        self.room_group_name = f'chat_{self.room_name_1}'

        # Add channel to group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Handle incoming messages"""
        data = json.loads(text_data)
        sender_id = data['sender']
        receiver_id = data['receiver']
        message_content = data['content']

        # Get or create chat and users
        chat = await self.get_chat(sender_id, receiver_id)
        sender = await self.get_user(sender_id)
        receiver = await self.get_user(receiver_id)

        # Create and save message
        chat_message = await self.create_chat_message(chat, sender, message_content)

        # Send message to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': chat_message.content,
                'sender': sender.id,
                'receiver': receiver.id,
                'timestamp': chat_message.timestamp.isoformat()
            }
        )

    async def chat_message(self, event):
        """Send message to WebSocket"""
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender'],
            'receiver': event['receiver'],
            'timestamp': event['timestamp']
        }))

    @database_sync_to_async
    def get_chat(self, sender_id, receiver_id):
        """Get or create a chat between two users"""
        participant_ids = sorted([sender_id, receiver_id])
        room_name_1 = '_'.join(map(str, participant_ids))
        room_name_2 = '_'.join(map(str, participant_ids[::-1]))

        # Look for existing chat
        chat = Chat.objects.filter(room_name_1=room_name_1).first() or Chat.objects.filter(
            room_name_2=room_name_2).first()

        # Create new chat if none exists
        if not chat:
            chat = Chat.objects.create()
            chat.participants.set([sender_id, receiver_id])
            chat.save()

        return chat

    @database_sync_to_async
    def get_user(self, user_id):
        """Get user by ID"""
        return User.objects.get(id=user_id)

    @database_sync_to_async
    def create_chat_message(self, chat, sender, message):
        """Create a new chat message"""
        return ChatMessage.objects.create(chat=chat, sender=sender, content=message)