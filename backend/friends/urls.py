from django.urls import path
from . import views

app_name = 'friends'

urlpatterns = [
    # Friend lists
    path('', views.FriendListView.as_view(), name='friend_list'),
    path('<int:id>/', views.FriendListByIdView.as_view(), name='friend_list_by_id'),

    # Friend requests
    path('requests/', views.FriendRequestListView.as_view(), name='friend_requests'),
    path('requests/sent/', views.SentFriendRequestView.as_view(), name='sent_friend_requests'),
    path('requests/add/<int:friend_id>/', views.FriendRequestCreateView.as_view(), name='add_friend'),
    path('requests/accept/', views.AcceptFriendRequestView.as_view(), name='accept_friend_request'),
    path('requests/decline/', views.DeclineFriendRequestView.as_view(), name='decline_friend_request'),
    path('requests/cancel/<int:request_id>/', views.CancelFriendRequestView.as_view(), name='cancel_friend_request'),

    # Unfriend
    path('unfriend/<int:user_id>/', views.UnfriendView.as_view(), name='unfriend'),
]