from django.contrib.auth.models import User
from django.db import models
from core.models import TimeStampedModel


class FriendList(models.Model):
    """
    Model to store a user's friends.
    Each user has a single FriendList that contains multiple friends.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='friend_list')
    friends = models.ManyToManyField(User, related_name='friend_lists', blank=True)

    def __str__(self):
        return f"{self.user.username}'s friends"

    def add_friend(self, account):
        """Add a user to the friend list"""
        if account not in self.friends.all():
            self.friends.add(account)
            self.save()

    def remove_friend(self, account):
        """Remove a user from the friend list"""
        if account in self.friends.all():
            self.friends.remove(account)
            self.save()

    def unfriend(self, removee):
        """
        Remove friend from both users' friend lists.
        This ensures friendship is reciprocal.
        """
        # Remove friend from this user's friend list
        self.remove_friend(removee)

        # Remove this user from the friend's friend list
        friend_friend_list = FriendList.objects.get(user=removee)
        friend_friend_list.remove_friend(self.user)
        return True

    def is_mutual_friend(self, friend):
        """Check if a user is in the friend list"""
        return friend in self.friends.all()

    class Meta:
        verbose_name = "Friend List"
        verbose_name_plural = "Friend Lists"


class FriendRequest(TimeStampedModel):
    """
    Friend request model.
    Stores pending, accepted, and declined friend requests.
    """
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_friend_requests')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_friend_requests')
    is_active = models.BooleanField(default=True)
    is_accepted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender.username} to {self.receiver.username}"

    def accept(self):
        """
        Accept a friend request.
        Adds each user to the other's friend list.
        """
        # Get both users' friend lists
        sender_friend_list = FriendList.objects.get(user=self.sender)
        receiver_friend_list = FriendList.objects.get(user=self.receiver)

        if sender_friend_list and receiver_friend_list:
            # Add each user to the other's friend list
            sender_friend_list.add_friend(self.receiver)
            receiver_friend_list.add_friend(self.sender)

            # Update request status
            self.is_accepted = True
            self.is_active = False
            self.save()
            return True
        return False

    def decline(self):
        """Decline a friend request"""
        self.is_active = False
        self.save()
        return True

    def cancel(self):
        """Cancel a friend request"""
        self.is_active = False
        self.save()
        return True

    class Meta:
        verbose_name = "Friend Request"
        verbose_name_plural = "Friend Requests"
        unique_together = ['sender', 'receiver']  # Prevent duplicate requests