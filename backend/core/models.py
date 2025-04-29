"""
Abstract base models that can be used across apps.
"""
from django.db import models
from django.contrib.auth.models import User


class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    'created' and 'modified' fields.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AuthoredModel(TimeStampedModel):
    """
    An abstract base class model that is authored by a user.
    """
    author = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        abstract = True