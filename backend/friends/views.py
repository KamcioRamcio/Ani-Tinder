from django.contrib.auth.models import User
from django.db import models
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FriendList, FriendRequest
from .serializers import (
    FriendRequestSerializer,
    FriendRequestAcceptDeclineSerializer,
    FriendListSerializer,
    UnfriendSerializer
)


class FriendRequestListView(generics.ListAPIView):
    """List friend requests for the current user"""
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get all active friend requests received by the current user"""
        return FriendRequest.objects.filter(
            receiver=self.request.user,
            is_active=True
        )


class SentFriendRequestView(generics.ListAPIView):
    """List friend requests sent by the current user"""
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get all active friend requests sent by the current user"""
        return FriendRequest.objects.filter(
            sender=self.request.user,
            is_active=True
        )


class FriendRequestCreateView(APIView):
    """Create a friend request"""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        friend_id = self.kwargs.get('friend_id')

        # Validate request
        if user.id == friend_id:
            return Response(
                {"error": "You cannot send a friend request to yourself."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            friend = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if already friends
        user_friend_list = FriendList.objects.get(user=user)
        if user_friend_list.is_mutual_friend(friend):
            return Response(
                {"error": "You are already friends with this user."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if request already exists
        if FriendRequest.objects.filter(sender=user, receiver=friend, is_active=True).exists():
            return Response(
                {"error": "Friend request already sent."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if there's an incoming request
        if FriendRequest.objects.filter(sender=friend, receiver=user, is_active=True).exists():
            return Response(
                {"error": "This user has already sent you a friend request. Accept their request instead."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create friend request
        friend_request = FriendRequest.objects.create(sender=user, receiver=friend)
        serializer = FriendRequestSerializer(friend_request)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AcceptFriendRequestView(APIView):
    """Accept a friend request"""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = FriendRequestAcceptDeclineSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            success = serializer.accept()
            if success:
                return Response(
                    {'message': 'Friend request accepted'},
                    status=status.HTTP_200_OK
                )
            return Response(
                {'error': 'Unable to accept friend request'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeclineFriendRequestView(APIView):
    """Decline a friend request"""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = FriendRequestAcceptDeclineSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            success = serializer.decline()
            if success:
                return Response(
                    {'message': 'Friend request declined'},
                    status=status.HTTP_200_OK
                )
            return Response(
                {'error': 'Unable to decline friend request'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CancelFriendRequestView(APIView):
    """Cancel a sent friend request"""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        request_id = self.kwargs.get('request_id')

        try:
            friend_request = FriendRequest.objects.get(
                id=request_id,
                sender=user,
                is_active=True
            )

            success = friend_request.cancel()
            if success:
                return Response(
                    {'message': 'Friend request cancelled'},
                    status=status.HTTP_200_OK
                )

            return Response(
                {'error': 'Unable to cancel friend request'},
                status=status.HTTP_400_BAD_REQUEST
            )

        except FriendRequest.DoesNotExist:
            return Response(
                {'error': 'Friend request not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class UnfriendView(APIView):
    """Unfriend a user"""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        user_id = self.kwargs.get('user_id')

        try:
            friend = User.objects.get(id=user_id)

            # Get friend lists
            friend_list = FriendList.objects.get(user=user)

            # Check if they are friends
            if not friend_list.is_mutual_friend(friend):
                return Response(
                    {'error': 'You are not friends with this user'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Unfriend
            friend_list.unfriend(friend)
            return Response(
                {'message': 'Unfriended successfully'},
                status=status.HTTP_200_OK
            )

        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except FriendList.DoesNotExist:
            return Response(
                {'error': 'Friend list not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class FriendListView(generics.ListAPIView):
    """Get the current user's friend list"""
    serializer_class = FriendListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return FriendList.objects.filter(user=user)


class FriendListByIdView(generics.RetrieveAPIView):
    """Get a user's friend list by their ID"""
    serializer_class = FriendListSerializer
    permission_classes = [AllowAny]
    lookup_field = 'user__id'
    lookup_url_kwarg = 'id'

    def get_object(self):
        id = self.kwargs.get('id')
        try:
            user = User.objects.get(id=id)
            return FriendList.objects.get(user=user)
        except User.DoesNotExist:
            raise NotFound("User not found")
        except FriendList.DoesNotExist:
            raise NotFound("Friend list not found")