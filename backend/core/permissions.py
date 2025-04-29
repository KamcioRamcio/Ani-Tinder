"""
Custom permissions that can be used across apps.
"""
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner
        return obj.author == request.user


class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to view or edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Permissions are only allowed to the owner
        return obj.author == request.user


class IsSelfOrReadOnly(permissions.BasePermission):
    """
    Custom permission for User objects to only allow users to edit their own information.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the user themselves
        return obj == request.user


class IsParticipant(permissions.BasePermission):
    """
    Custom permission to only allow participants of a chat to view or interact with it.
    """
    def has_object_permission(self, request, view, obj):
        # Check if the user is a participant of the chat
        return request.user in obj.participants.all()