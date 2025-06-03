from django.urls import path
from . import views

app_name = 'bookmark'

urlpatterns = [
    # Homepage URL
    path("", views.index, name="home"),
    path("bookmarks/", views.dashbord, name="bookmarks"),
    path("bookmarks/search/", views.search_bookmark, name="search_bookmark"),
    path("bookmarks/add/", views.add_bookmark, name="add_bookmark"),
    path("bookmarks/edit/", views.edit_bookmark, name="edit_bookmark"),
    path("bookmarks/delete/<int:bookmark_id>/", views.delete_bookmark, name="delete_bookmark"),
    
    path('bookmarks/export/', views.export_bookmark, name='export_bookmark'),
    path('bookmarks/import/', views.import_bookmark, name='import_bookmark'),

]
