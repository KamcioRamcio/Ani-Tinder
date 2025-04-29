from django.contrib.auth.models import User
from rest_framework import serializers
from .models import FriendList, FriendRequest


class FriendRequestSerializer(serializers.ModelSerializer):
    """Serializer for friend requests"""
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'sender_username', 'receiver', 'receiver_username', 'is_active', 'created_at']
        extra_kwargs = {'sender': {'read_only': True}, 'receiver': {'read_only': True}}


class FriendRequestAcceptDeclineSerializer(serializers.Serializer):
    """Serializer for accepting or declining a friend request"""
    request_id = serializers.IntegerField()

    def validate(self, data):
        request_id = data.get('request_id')
        user = self.context['request'].user

        try:
            friend_request = FriendRequest.objects.get(id=request_id, receiver=user, is_active=True)
        except FriendRequest.DoesNotExist:
            raise serializers.ValidationError("Friend request not found or already processed.")

        return data

    def accept(self):
        """Accept the friend request"""
        request_id = self.validated_data.get('request_id')
        user = self.context['request'].user

        try:
            friend_request = FriendRequest.objects.get(id=request_id, receiver=user, is_active=True)
            return friend_request.accept()
        except FriendRequest.DoesNotExist:
            return False

    def decline(self):
        """Decline the friend request"""
        request_id = self.validated_data.get('request_id')
        user = self.context['request'].user

        try:
            friend_request = FriendRequest.objects.get(id=request_id, receiver=user, is_active=True)
            return friend_request.decline()
        except FriendRequest.DoesNotExist:
            return False


class UnfriendSerializer(serializers.Serializer):
    """Serializer for unfriending a user"""
    friend_id = serializers.IntegerField()

    def validate(self, data):
        friend_id = data.get('friend_id')
        user = self.context['request'].user

        try:
            friend = User.objects.get(id=friend_id)
            if friend == user:
                raise serializers.ValidationError("You cannot unfriend yourself.")
        except User.DoesNotExist:
            raise serializers.ValidationError("Friend not found.")

        return data

    def unfriend(self):
        """Remove the friendship connection between users"""
        friend_id = self.validated_data.get('friend_id')
        user = self.context['request'].user

        try:
            friend = User.objects.get(id=friend_id)
            user_friend_list = FriendList.objects.get(user=user)
            friend_friend_list = FriendList.objects.get(user=friend)

            # Ensure both users are in each other's friend lists before unfriending
            if user_friend_list.is_mutual_friend(friend) and friend_friend_list.is_mutual_friend(user):
                user_friend_list.unfriend(friend)
                return True
            else:
                raise serializers.ValidationError("You are not friends.")
        except (User.DoesNotExist, FriendList.DoesNotExist):
            raise serializers.ValidationError("Friend or friend list not found.")


class FriendUserSerializer(serializers.ModelSerializer):
    """Serializer for basic user info in friend lists"""

    class Meta:
        model = User
        fields = ['id', 'username']


class FriendListSerializer(serializers.ModelSerializer):
    """Serializer for friend lists"""
    user = serializers.CharField(source='user.username', read_only=True)
    friends = FriendUserSerializer(many=True, read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = FriendList
        fields = ['user', 'user_id', 'friends']