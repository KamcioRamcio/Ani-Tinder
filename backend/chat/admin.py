from django.contrib import admin
from .models import Chat, ChatMessage


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'chat', 'timestamp', 'content_preview']
    search_fields = ['content', 'sender__username']
    list_filter = ['timestamp', 'chat']

    def content_preview(self, obj):
        return obj.content[:50] + ('...' if len(obj.content) > 50 else '')

    content_preview.short_description = 'Content'


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ['id', 'participants_list']
    search_fields = ['participants__username']
    filter_horizontal = ['participants']

    def participants_list(self, obj):
        return ", ".join([user.username for user in obj.participants.all()])

    participants_list.short_description = 'Participants'