from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    path('', views.ChatListView.as_view(), name='chat_list'),
    path('messages/<str:room_name>/', views.ChatMessageListView.as_view(), name='chat_messages'),
    path('create/', views.ChatCreateView.as_view(), name='chat_create'),
]