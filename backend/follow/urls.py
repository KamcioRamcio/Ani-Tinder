from django.urls import path
from . import views

app_name = 'follow'

urlpatterns = [
    path('user/<int:user_id>/', views.FollowUserView.as_view(), name='follow_user'),
    path('unfollow/<int:user_id>/', views.UnfollowUserView.as_view(), name='unfollow_user'),
    path('followers/<int:id>/', views.FollowersListByIdView.as_view(), name='followers'),
    path('following/<int:id>/', views.FollowingListByIdView.as_view(), name='following'),
]