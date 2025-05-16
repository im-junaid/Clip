from django.urls import path
from . import views

urlpatterns = [
    # Homepage URL
    path("", views.index, name="home"),
    path("bookmark/", views.dashbord, name="bookmark"),
    path("bookmark/search/", views.search_bookmark, name="search_bookmark"),
    path("bookmark/add/", views.add_bookmark, name="add_bookmark"),
    path("bookmark/edit/", views.edit_bookmark, name="edit_bookmark"),
    path("bookmark/delete/<int:bookmark_id>/", views.delete_bookmark, name="delete_bookmark"),


    # test pages
    path("t1/", views.t1, name="t1"),
    path("t2/", views.t2, name="t2"),
]
