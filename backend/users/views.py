from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsOwnerOrReadOnly, IsSelfOrReadOnly

from django.contrib.auth import authenticate, login, logout
from rest_framework.authtoken.models import Token

from .models import Profile, UserAnimeList, TempDeletedAnime
from .serializers import (
    UserSerializer, ProfileSerializer, UserAnimeSerializer,
    AllUsersSerializer, TempDeletedAnimeSerializer, LoginSerializer
)


class UserCreateView(generics.CreateAPIView):
    """Create a new user"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        user.set_password(self.request.data['password'])
        user.save()


class UserProfileView(generics.RetrieveAPIView):
    """Get user profile details"""
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'
    lookup_url_kwarg = 'id'

    def get_object(self):
        try:
            return Profile.objects.get(user__id=self.kwargs['id'])
        except Profile.DoesNotExist:
            raise NotFound("Profile not found")


class UserProfileUpdateView(generics.UpdateAPIView):
    """Update user profile"""
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsSelfOrReadOnly]
    lookup_field = 'id'
    lookup_url_kwarg = 'id'

    def get_object(self):
        try:
            profile = Profile.objects.get(user__id=self.kwargs['id'])
            self.check_object_permissions(self.request, profile.user)
            return profile
        except Profile.DoesNotExist:
            raise NotFound("Profile not found")


class UserAnimeByUsernameView(generics.ListAPIView):
    """Get a user's anime list by their username ID"""
    serializer_class = UserAnimeSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        id = self.kwargs.get('id')
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            raise NotFound("User not found")

        return UserAnimeList.objects.filter(author=user)


class UserAnimeByIdView(generics.ListAPIView):
    """Get a user's anime list by their user ID"""
    serializer_class = UserAnimeSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        id = self.kwargs.get('id')
        try:
            user = User.objects.get(id=id)
            return UserAnimeList.objects.filter(author=user)
        except User.DoesNotExist:
            raise NotFound("User not found")


class UserAnimeView(generics.ListCreateAPIView):
    """List and create user anime entries"""
    serializer_class = UserAnimeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return UserAnimeList.objects.filter(author=user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class RecentAnimeView(generics.ListAPIView):
    """Get a user's most recent anime entries"""
    serializer_class = UserAnimeSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        id = self.kwargs.get('id')
        try:
            user = User.objects.get(id=id)
            return UserAnimeList.objects.filter(author=user).order_by('-add_time')[:5]
        except User.DoesNotExist:
            raise NotFound("User not found")


class UserAnimeDeleteView(generics.DestroyAPIView):
    """Delete a user's anime entry"""
    serializer_class = UserAnimeSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        return UserAnimeList.objects.filter(author=self.request.user)


class UserAnimeUpdateView(generics.UpdateAPIView):
    """Update a user's anime entry by MAL ID"""
    serializer_class = UserAnimeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserAnimeList.objects.filter(author=self.request.user)

    def put(self, request, mal_id):
        try:
            user_anime = UserAnimeList.objects.get(mal_id=mal_id, author=request.user)
            serializer = self.get_serializer(user_anime, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({'message': 'Anime status updated successfully'}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except UserAnimeList.DoesNotExist:
            return Response({'error': 'Anime not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TempDeletedAnimeView(generics.ListCreateAPIView):
    """List and create temporarily deleted anime entries"""
    serializer_class = TempDeletedAnimeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TempDeletedAnime.objects.filter(author=self.request.user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class AllUsersView(generics.ListAPIView):
    """List all users with basic profile information"""
    queryset = Profile.objects.all()
    serializer_class = AllUsersSerializer
    permission_classes = [AllowAny]


class DeleteTempDeletedAnimeView(generics.DestroyAPIView):
    """Delete a single temporarily deleted anime entry"""
    serializer_class = TempDeletedAnimeSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        return TempDeletedAnime.objects.filter(author=self.request.user)


class DeleteAllTmpDeletedAnimeView(generics.DestroyAPIView):
    """Delete all temporarily deleted anime entries for a user"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, *args, **kwargs):
        user = request.user
        temp_deleted_anime = TempDeletedAnime.objects.filter(author=user)

        if temp_deleted_anime.exists():
            temp_deleted_anime.delete()
            return Response({"detail": "All temporarily deleted anime were successfully deleted."},
                            status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({"detail": "No temporarily deleted anime found."}, status=status.HTTP_404_NOT_FOUND)


class LoginView(APIView):
    """User login view"""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {"detail": "Please provide both username and password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)

        if not user:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        token, created = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user_id': user.id,
            'username': user.username,
        })


class LogoutView(APIView):
    """User logout view"""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Delete the user's token to logout
        try:
            request.user.auth_token.delete()
        except (AttributeError, Token.DoesNotExist):
            pass

        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


class UserDetailsView(generics.RetrieveAPIView):
    """Get currently authenticated user details"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user