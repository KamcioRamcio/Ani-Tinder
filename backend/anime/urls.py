from django.urls import path
from . import views

app_name = 'anime'

urlpatterns = [
    path('genres/', views.GenreList.as_view(), name='genre_list'),
    path('genres/delete/<int:pk>/', views.GenreDelete.as_view(), name='genre_delete'),
    path('data/json/', views.read_json_file_view, name='read_json'),
    path('quotes/', views.AnimeQuotesView.as_view(), name='quotes'),
    path('all/', views.AnimeAllView.as_view(), name='all'),
    path('import/', views.import_anime_data, name='import_anime'),
]