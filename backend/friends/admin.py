from django.contrib import admin
from .models import FriendList, FriendRequest


@admin.register(FriendList)
class FriendListAdmin(admin.ModelAdmin):
    list_display = ['user', 'friend_count']
    search_fields = ['user__username']
    filter_horizontal = ['friends']
    readonly_fields = ['user']

    def friend_count(self, obj):
        return obj.friends.count()

    friend_count.short_description = 'Friends Count'


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'is_active', 'is_accepted', 'created_at']
    search_fields = ['sender__username', 'receiver__username']
    list_filter = ['is_active', 'is_accepted', 'created_at']
    readonly_fields = ['sender', 'receiver', 'created_at']