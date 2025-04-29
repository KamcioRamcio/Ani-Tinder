from django.contrib import admin
from .models import Follow


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ['user', 'following_count']
    search_fields = ['user__username', 'following__username']
    filter_horizontal = ['following']

    def following_count(self, obj):
        return obj.following.count()
    following_count.short_description = 'Following Count'