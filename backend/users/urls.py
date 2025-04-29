from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from rest_framework.authtoken.views import obtain_auth_token


app_name = 'users'

urlpatterns = [

    # Authentication
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/', obtain_auth_token, name='token_obtain'),  # Alternative token endpoint
    path('me/', views.UserDetailsView.as_view(), name='user_details'),

    # User management
    path('register/', views.UserCreateView.as_view(), name='register'),
    path('profile/<int:id>/', views.UserProfileView.as_view(), name='profile'),
    path('profile/<int:id>/update/', views.UserProfileUpdateView.as_view(), name='profile_update'),
    path('all/', views.AllUsersView.as_view(), name='all_users'),

    # Anime list management
    path('anime/', views.UserAnimeView.as_view(), name='user_anime'),
    path('anime/recent/<int:id>/', views.RecentAnimeView.as_view(), name='recent_anime'),
    path('anime/<int:id>/', views.UserAnimeByIdView.as_view(), name='user_anime_by_id'),
    path('anime/username/<int:id>/', views.UserAnimeByUsernameView.as_view(), name='user_anime_by_username'),
    path('anime/delete/<int:pk>/', views.UserAnimeDeleteView.as_view(), name='user_anime_delete'),
    path('anime/update/<int:mal_id>/', views.UserAnimeUpdateView.as_view(), name='user_anime_update'),

    # Temporary deleted anime
    path('anime/temp-deleted/', views.TempDeletedAnimeView.as_view(), name='temp_deleted_anime'),
    path('anime/temp-deleted/<int:pk>/', views.DeleteTempDeletedAnimeView.as_view(), name='delete_temp_deleted_anime'),
    path('anime/temp-deleted/delete-all/<int:pk>/', views.DeleteAllTmpDeletedAnimeView.as_view(),
         name='delete_all_temp_deleted_anime'),

    # Password management
    path('password-reset/', auth_views.PasswordResetView.as_view(), name='password_reset'),
    path('password-reset/done/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    path('password-change/', auth_views.PasswordChangeView.as_view(), name='password_change'),
    path('password-change/done/', auth_views.PasswordChangeDoneView.as_view(), name='password_change_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),
]