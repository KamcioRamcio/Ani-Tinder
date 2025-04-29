from django.contrib.auth.models import User
from django.db import models
from core.models import TimeStampedModel


class Profile(models.Model):
    """User profile model extending the base User model"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    username = models.CharField(max_length=150)
    bio = models.TextField(default='No bio')
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True,
                                      default='profile_images/pfp1_CMiXTdg.jpg')
    anime_list_public = models.BooleanField(default=True)

    def __str__(self):
        return self.user.username


class UserAnimeList(TimeStampedModel):
    """User's anime list"""
    author = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    mal_id = models.IntegerField(blank=True, null=True)
    watched = models.BooleanField(default=False)
    add_time = models.DateTimeField(auto_now_add=True)
    plan_to_watch = models.BooleanField(default=True)

    def __str__(self):
        return self.title or f"Anime #{self.mal_id}"

    class Meta:
        verbose_name = "User Anime"
        verbose_name_plural = "User Anime Lists"


class TempDeletedAnime(models.Model):
    """Temporarily deleted anime entries for potential recovery"""
    author = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255)
    image_url = models.URLField(blank=True, null=True)
    mal_id = models.IntegerField(blank=True, null=True)
    time_deleted = models.DateTimeField(auto_now_add=True, blank=True, null=True)

    def __str__(self):
        return self.title