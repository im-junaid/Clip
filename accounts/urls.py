from django.urls import path
from django.contrib.auth import views as auth_views
from .forms import CustomSetPasswordForm
from . import views

app_name = 'accounts'

urlpatterns = [
    # Authentication URLs
    path("signin/", views.signin_view, name="signin"),
    path("signup/", views.signup_view, name="signup"),
    path("signout/", views.signout_view, name="signout"),
    path("profile/", views.profile_view, name="profile"),
    path('change-email/', views.change_email, name='change_email'),
    path('change-password/', views.change_password, name='change_password'),
    # Password reset URLs
    path("password_reset/", views.CustomPasswordResetView.as_view(), name="password_reset"),
    
    path(
        "password_reset_done/",
        auth_views.PasswordResetDoneView.as_view(
            template_name="password_reset_done.html"
        ),
        name="password_reset_done",
    ),
    path(
        "password_reset_confirm/<uidb64>/<token>/",
        auth_views.PasswordResetConfirmView.as_view(
            form_class=CustomSetPasswordForm,
            template_name="password_reset_confirm.html",
        ),
        name="password_reset_confirm",
    ),
    path(
        "password_reset_complete/",
        auth_views.PasswordResetCompleteView.as_view(
            template_name="password_reset_complete.html"
        ),
        name="password_reset_complete",
    ),
]
