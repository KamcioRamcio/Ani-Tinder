from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Follow
from .serializers import FollowListSerializer, FollowersListSerializer


class FollowUserView(APIView):
    """Follow a user"""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user  # Authenticated user making the request
        user_to_follow_id = self.kwargs.get('user_id')

        # Validate request
        if user.id == user_to_follow_id:
            return Response(
                {'error': 'You cannot follow yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user_to_follow = User.objects.get(id=user_to_follow_id)
        except User.DoesNotExist:
            return Response(
                {'error': f'User with ID {user_to_follow_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get or create the Follow instance for the current user
        follow_instance, created = Follow.objects.get_or_create(user=user)

        # Check if already following
        if follow_instance.is_following(user_to_follow):
            return Response(
                {'message': 'You are already following this user.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Add the user to the following list
        follow_instance.add_following(user_to_follow)
        return Response(
            {'message': 'User followed successfully'},
            status=status.HTTP_200_OK
        )


class UnfollowUserView(APIView):
    """Unfollow a user"""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        user_to_unfollow_id = self.kwargs.get('user_id')

        try:
            user_to_unfollow = User.objects.get(id=user_to_unfollow_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get the Follow instance for the current user
        try:
            follow_instance = Follow.objects.get(user=user)
        except Follow.DoesNotExist:
            return Response(
                {'error': 'You are not following anyone'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if actually following
        if not follow_instance.is_following(user_to_unfollow):
            return Response(
                {'message': 'You are not following this user'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Remove user from following list
        follow_instance.remove_following(user_to_unfollow)
        return Response(
            {'message': 'Unfollowed successfully'},
            status=status.HTTP_200_OK
        )


class FollowingListByIdView(generics.RetrieveAPIView):
    """Get the list of users a user is following"""
    serializer_class = FollowListSerializer
    permission_classes = [AllowAny]
    lookup_field = 'user__id'
    lookup_url_kwarg = 'id'

    def get_object(self):
        id = self.kwargs.get('id')
        try:
            user = User.objects.get(id=id)
            # Get or create the Follow instance
            follow, created = Follow.objects.get_or_create(user=user)
            return follow
        except User.DoesNotExist:
            raise NotFound("User not found")


class FollowersListByIdView(generics.RetrieveAPIView):
    """Get the list of users following a user"""
    serializer_class = FollowersListSerializer
    permission_classes = [AllowAny]
    lookup_field = 'user__id'
    lookup_url_kwarg = 'id'

    def get_object(self):
        id = self.kwargs.get('id')
        try:
            user = User.objects.get(id=id)
            # Get or create the Follow instance
            follow, created = Follow.objects.get_or_create(user=user)
            return follow
        except User.DoesNotExist:
            raise NotFound("User not found")