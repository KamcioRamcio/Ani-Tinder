from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Follow


@receiver(post_save, sender=User)
def create_follow(sender, instance, created, **kwargs):
    """Create a Follow instance for each new User"""
    if created:
        Follow.objects.create(user=instance)