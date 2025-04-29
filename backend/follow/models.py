from django.contrib.auth.models import User
from django.db import models
from core.models import TimeStampedModel


class Follow(models.Model):
    """
    User following model.
    Each user can follow multiple other users.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_users')
    following = models.ManyToManyField(User, related_name='followers', blank=True)

    def __str__(self):
        return f"{self.user.username} follows {self.following.count()} users"

    def add_following(self, account):
        """Add a user to the following list"""
        if not self.is_following(account):
            self.following.add(account)
            self.save()

    def remove_following(self, account):
        """Remove a user from the following list"""
        if self.is_following(account):
            self.following.remove(account)
            self.save()

    def is_following(self, account):
        """Check if a user is being followed"""
        return self.following.filter(id=account.id).exists()

    class Meta:
        verbose_name = "Follow"
        verbose_name_plural = "Follows"