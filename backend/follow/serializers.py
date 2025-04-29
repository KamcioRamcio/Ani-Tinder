from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Follow


class FollowUserSerializer(serializers.ModelSerializer):
    """Simple user serializer for follow relations"""
    class Meta:
        model = User
        fields = ['id', 'username']


class FollowListSerializer(serializers.ModelSerializer):
    """Serializer for users being followed by a user"""
    username = serializers.CharField(source='user.username', read_only=True)
    following = FollowUserSerializer(many=True, read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Follow
        fields = ['username', 'user_id', 'following']


class FollowersListSerializer(serializers.ModelSerializer):
    """Serializer for users following a user"""
    username = serializers.CharField(source='user.username', read_only=True)
    followers = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Follow
        fields = ['username', 'followers', 'user_id']

    def get_followers(self, obj):
        """Get the followers of a user"""
        # Find users who have this user in their following list
        followers = User.objects.filter(following_users__following=obj.user)
        return FollowUserSerializer(followers, many=True).data