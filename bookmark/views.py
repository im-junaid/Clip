from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import (
    csrf_exempt,
)  # or remove if using CSRF middleware
from django.shortcuts import get_object_or_404
from .models import Bookmark
import json


# home page
def index(request):
    return render(request, "home/home.html")


# dashboard page
@login_required
def dashbord(request):
    # get the last 9 bookmarks for this user, newest first
    recent = Bookmark.objects.filter(user=request.user).order_by("-created_at")[:9]
    return render(
        request,
        "dashboard.html",
        {
            "bookmarks": recent,
        },
    )


# @login_required
# def bookmark_list(request):
#     # get the last 9 bookmarks for this user, newest first
#     recent = (
#         Bookmark.objects
#         .filter(user=request.user)
#         .order_by('-created_at')[:9]
#     )
#     return render(request, 'bookmarks/list.html', {
#         'bookmarks': recent,
#     })


# add bookmark
@require_POST
@login_required
def add_bookmark(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON"}, status=400)

    # extract & trim
    name = data.get("name", "").strip()
    url = data.get("url", "").strip()
    desc = data.get("description", "").strip()
    platform = data.get("platform", "").strip()
    tags = data.get("tags", [])

    # server-side validation
    if not all([name, desc, platform]):
        return JsonResponse(
            {"success": False, "error": "Missing required fields"}, status=400
        )

    if platform not in dict(Bookmark.CATEGORY_CHOICES):
        return JsonResponse({"success": False, "error": "Invalid category"}, status=400)

    try:
        bm = Bookmark.objects.create(
            user=request.user,
            name=name,
            url=url,
            description=desc,
            platform=platform,
            tags=tags,
        )
        print("\n\nbookmark added")
        return JsonResponse({"success": True, "id": bm.id})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


# edit bookmark
@require_POST
@login_required
def edit_bookmark(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON"}, status=400)

    bm_id = data.get("id")
    name = data.get("name", "").strip()
    url = data.get("url", "").strip()
    desc = data.get("description", "").strip()
    platform = data.get("platform", "").strip()
    tags = data.get("tags", [])

    if not all([bm_id, name, desc, platform]):
        return JsonResponse(
            {"success": False, "error": "Missing required fields"}, status=400
        )

    try:
        bm = Bookmark.objects.get(id=bm_id, user=request.user)
    except Bookmark.DoesNotExist:
        return JsonResponse(
            {"success": False, "error": "Bookmark not found"}, status=404
        )

    if platform not in dict(Bookmark.CATEGORY_CHOICES):
        return JsonResponse({"success": False, "error": "Invalid platform"}, status=400)

    bm.name = name
    bm.url = url
    bm.description = desc
    bm.platform = platform
    bm.tags = tags
    bm.save()

    return JsonResponse({"success": True})


# edit bookmark
@require_http_methods(["POST", "DELETE"])
@login_required
def delete_bookmark(request, bookmark_id):
    try:
        bookmark = Bookmark.objects.get(id=bookmark_id, user=request.user)
    except Bookmark.DoesNotExist:
        return JsonResponse(
            {"success": False, "error": "Bookmark not found"}, status=404
        )

    try:
        bookmark.delete()
        print("\n\nbookmark deleted")
        return JsonResponse({"success": True})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)



from django.db.models import Q

@login_required
def search_bookmark(request):
    q       = request.GET.get('q', '').strip()
    category= request.GET.get('category', '').strip()
    tags    = request.GET.getlist('tags[]')  # expecting multiple tags

    qs = Bookmark.objects.all()

    if q:
        qs = qs.filter(
            Q(name__icontains=q) |
            Q(description__icontains=q) |
            Q(platform__icontains=q) |
            Q(tags__icontains=q)      # JSONField contains substring
        )

    if category:
        qs = qs.filter(platform__iexact=category)

    if tags:
        # JSONField “contains” a list: every tag we want must be present
        for tag in tags:
            qs = qs.filter(tags__contains=[tag])

    results = []
    for bm in qs:
        results.append({
            'id':          bm.id,
            'name':        bm.name,
            'url':         bm.url,
            'description': bm.description,
            'platform':    bm.platform,
            # bm.tags is already a list of strings
            'tags':        bm.tags,  
        })
        
    return JsonResponse({'results': results})



# test pages
def t1(request):
    # Your logic here
    return render(request, "t1.html")


def t2(request):
    # Your logic here
    return render(request, "t2.html")
