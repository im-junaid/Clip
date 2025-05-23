from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.utils.http import url_has_allowed_host_and_scheme
from django.contrib.auth.views import PasswordResetView
from django.contrib.auth.models import User
from django.contrib import messages

from django.template.loader import render_to_string
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.urls import reverse_lazy


# ------------------------------------
#          Authentication
# ------------------------------------


# signup
def signup_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("reg_password")
        confirm_password = request.POST.get("confirm_password")

        if password != confirm_password:
            messages.error(request, "Passwords do not match.")
            return redirect("signup")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists.")
            return redirect("signup")

        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already in use.")
            return redirect("signup")

        user = User.objects.create_user(
            username=username, email=email, password=password
        )
        user.save()
        messages.success(request, "Account created successfully.")
        return redirect("signin")
    return render(request, "signup.html")


# signin
def signin_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        next_url = request.POST.get("next", "home")

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, "Signin successfully.")

            # Redirect to the next URL if safe
            if url_has_allowed_host_and_scheme(
                next_url, allowed_hosts={request.get_host()}
            ):
                return redirect(next_url)
            return redirect("home")

        messages.error(request, "Invalid username or password.")
        return redirect("signin")
    return render(request, "signin.html")


# signout
@login_required
def signout_view(request):
    logout(request)
    messages.success(request, "Signout successfully.")
    return redirect("home")


# ------------------------------------
#          Forgot Password
# ------------------------------------


# password-reset-view
    
class CustomPasswordResetView(PasswordResetView):
    template_name = "password_reset_form.html"
    email_template_name = "emails/password_reset_email.txt"
    html_email_template_name = "emails/password_reset_email.html"
    success_url = reverse_lazy('password_reset_done')
    from_email = "Clip Support <riderentals10@gmail.com>"

    def form_valid(self, form):
        email = form.cleaned_data["email"]
        if not User.objects.filter(email=email).exists():
            messages.error(self.request, "The email address does not exist in our records.")
            return redirect("password_reset")
        return super().form_valid(form)

    def send_mail(self, subject_template_name, email_template_name,
                  context, from_email, to_email, html_email_template_name=None):
        subject = "Reset your password"
        body = render_to_string(email_template_name, context)
        email_message = EmailMultiAlternatives(subject, body, self.from_email, [to_email])
        if html_email_template_name:
            html_email = render_to_string(html_email_template_name, context)
            email_message.attach_alternative(html_email, 'text/html')
        email_message.send()
        