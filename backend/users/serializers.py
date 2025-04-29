from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserAnimeList, Profile, TempDeletedAnime


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'email': {'write_only': True, 'required': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        # Create the profile with the username field
        Profile.objects.create(user=user, username=user.username)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(style={'input_type': 'password'}, trim_whitespace=False)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(request=self.context.get('request'), username=username, password=password)
            if not user:
                msg = 'Unable to log in with provided credentials.'
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = 'Must include "username" and "password".'
            raise serializers.ValidationError(msg, code='authorization')

        data['user'] = user
        return data


class UserAnimeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = UserAnimeList
        fields = ['id', 'author', 'username', 'title', 'image_url', 'mal_id', 'watched', 'plan_to_watch', 'add_time']
        extra_kwargs = {'author': {'read_only': True}}


class TempDeletedAnimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TempDeletedAnime
        fields = ['id', 'author', 'title', 'image_url', 'mal_id', 'time_deleted']
        extra_kwargs = {'author': {'read_only': True}}


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'username', 'bio', 'profile_image', 'user_id', 'anime_list_public']


class AllUsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'username', 'profile_image', 'user_id']