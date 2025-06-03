from django.utils.http import url_has_allowed_host_and_scheme
from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import PasswordResetView
from django.views.decorators.http import require_POST
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.shortcuts import render, redirect
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.urls import reverse_lazy
from django.contrib import messages
from bookmark.models import Bookmark
import json
import re


# ------------------------------------
#          Authentication
# ------------------------------------

User = get_user_model()

# signup
def signup_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("reg_password")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists.")
            return redirect("accounts:signup")

        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already in use.")
            return redirect("accounts:signup")

        user = User.objects.create_user(
            username=username, email=email, password=password
        )
        user.save()
        messages.success(request, "Account created successfully.")
        return redirect("accounts:signin")
    return render(request, "signup.html")


# signin
def signin_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        next_url = request.POST.get("next", "accounts:home")

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, "Signin successfully.")

            # Redirect to the next URL if safe
            if url_has_allowed_host_and_scheme(
                next_url, allowed_hosts={request.get_host()}
            ):
                return redirect(next_url)
            return redirect("bookmark:home")

        messages.error(request, "Invalid username or password.")
        return redirect("accounts:signin")
    return render(request, "signin.html")


# signout
@login_required
def signout_view(request):
    logout(request)
    messages.success(request, "Signout successfully.")
    return redirect("bookmark:home")


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
            return redirect("accounts:password_reset")
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


#------------------------------------
#        Profile views
#------------------------------------

@login_required
@ensure_csrf_cookie
def profile_view(request):
    user = request.user
    total_bookmarks = Bookmark.objects.filter(user=user).count()
    context = {
        "user": user,
        "total_bookmarks": total_bookmarks,
    }
    return render(request, "profile.html", context)

@login_required
@require_POST
def change_email(request):
    try:
        data = json.loads(request.body.decode('utf-8'))
        current_password = data.get('current_password', '').strip()
        new_email = data.get('new_email', '').strip().lower()
    except (json.JSONDecodeError, UnicodeDecodeError):
        return HttpResponseBadRequest('Invalid JSON')

    if not current_password or not new_email:
        return JsonResponse({'success': False, 'error': 'Both fields are required.'})

    user = request.user
    if not user.check_password(current_password):
        return JsonResponse({'success': False, 'error': 'Incorrect current password.'})

    if User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
        return JsonResponse({'success': False, 'error': 'This email is already in use.'})

    user.email = new_email
    user.save()

    return JsonResponse({'success': True})


@login_required
@require_POST
def change_password(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Invalid request method.'})

    try:
        data = json.loads(request.body)
        current_password = data.get('current_password', '').strip()
        new_password = data.get('new_password', '').strip()
    except (ValueError, KeyError):
        return JsonResponse({'success': False, 'error': 'Invalid JSON data.'})

    # Check all fields are provided
    if not current_password or not new_password:
        return JsonResponse({'success': False, 'error': 'All password fields are required.'})

    # Validate password strength
    pwd_regex = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$')
    if not pwd_regex.match(new_password):
        return JsonResponse({'success': False, 'error': 'Password must have 8+ chars, uppercase, lowercase, number & symbol.'})

    user = request.user

    # Check current password
    if not user.check_password(current_password):
        return JsonResponse({'success': False, 'error': 'Current password is incorrect.'})

    # Set new password
    user.set_password(new_password)
    user.save()
    return JsonResponse({'success': True})


