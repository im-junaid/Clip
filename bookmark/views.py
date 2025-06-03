from django.views.decorators.http import require_http_methods
from django.http import JsonResponse, StreamingHttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.db import IntegrityError, transaction
from django.shortcuts import render, redirect
from django.utils.timezone import localtime
from django.contrib import messages
from django.urls import reverse
from django.db.models import Q
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
    return render(request, "dashboard.html", { "bookmarks": recent})


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
        return JsonResponse({"success": False, "error": "Missing required fields"}, status=400)

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
        # print("\n\nbookmark added")
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
        return JsonResponse({"success": False, "error": "Missing required fields"}, status=400)

    try:
        bm = Bookmark.objects.get(id=bm_id, user=request.user)
    except Bookmark.DoesNotExist:
        return JsonResponse({"success": False, "error": "Bookmark not found"}, status=404)

    if platform not in dict(Bookmark.CATEGORY_CHOICES):
        return JsonResponse({"success": False, "error": "Invalid platform"}, status=400)

    bm.name = name
    bm.url = url
    bm.description = desc
    bm.platform = platform
    bm.tags = tags
    bm.save()

    # print("\n\nbookmark updated")
    return JsonResponse({"success": True})

# delete bookmark
@require_http_methods(["POST", "DELETE"])
@login_required
def delete_bookmark(request, bookmark_id):
    try:
        bookmark = Bookmark.objects.get(id=bookmark_id, user=request.user)
    except Bookmark.DoesNotExist:
        return JsonResponse({"success": False, "error": "Bookmark not found"}, status=404)

    try:
        bookmark.delete()
        # print("\n\nbookmark deleted")
        return JsonResponse({"success": True})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

# search bookmark
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


@login_required
@require_POST
def import_bookmark(request):
    # 1) Check that a file was uploaded
    if 'file' not in request.FILES:
        return JsonResponse({"success": False, "error": "No file uploaded."}, status=400)

    uploaded_file = request.FILES['file']
    # 2) Optional: Reject overly large uploads (e.g. > 10 MB)
    max_size = 10 * 1024 * 1024  # 10 MB
    if uploaded_file.size > max_size:
        return JsonResponse({"success": False, "error": "File too large (max 10 MB)."}, status=400)

    # 3) Read and parse JSON
    try:
        raw_data = uploaded_file.read().decode('utf-8')
        data = json.loads(raw_data)
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({"success": False, "error": "Cannot parse JSON file."}, status=400)

    if not isinstance(data, list):
        return JsonResponse({"success": False, "error": "JSON must be a top-level array of objects."}, status=400)

    # 4) Prepare for validation & bulk insertion
    allowed_platforms = {choice[0] for choice in Bookmark.CATEGORY_CHOICES}
    batch_size = 500
    to_create = []
    total_created = 0
    errors = []  # Collect row-level validation errors

    # 5) Loop through each item in JSON array
    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            errors.append(f"Item {idx}: must be an object/dictionary.")
            continue

        name = item.get('name', '').strip()
        url = item.get('url', '').strip()
        description = item.get('description', '').strip()
        platform = item.get('platform', '').strip()
        tags = item.get('tags', [])

        # a) Required fields
        if not name or not url or not platform:
            errors.append(f"Item {idx}: 'name', 'url', and 'platform' are required.")
            continue

        # b) Length/Type checks
        if len(name) > 200:
            errors.append(f"Item {idx}: 'name' too long (max 200 chars).")
            continue

        if platform not in allowed_platforms:
            errors.append(f"Item {idx}: invalid platform '{platform}'.")
            continue

        if not isinstance(tags, list) or not all(isinstance(t, str) for t in tags):
            errors.append(f"Item {idx}: 'tags' must be a list of strings.")
            continue

        # c) Construct an unsaved Bookmark instance
        bm = Bookmark(
            user=request.user,
            name=name,
            url=url,
            description=description,
            platform=platform,
            tags=tags
        )
        to_create.append(bm)

        # d) Once batch_size is reached, bulk insert
        if len(to_create) >= batch_size:
            try:
                with transaction.atomic():
                    Bookmark.objects.bulk_create(to_create, batch_size=batch_size)
                total_created += len(to_create)
            except IntegrityError:
                return JsonResponse({"success": False, "error": "Database error during bulk insert."}, status=500)
            to_create = []

    # 6) Insert any remaining bookmarks
    if to_create:
        try:
            with transaction.atomic():
                Bookmark.objects.bulk_create(to_create, batch_size=batch_size)
            total_created += len(to_create)
        except IntegrityError:
            return JsonResponse({"success": False, "error": "Database error during final insert."}, status=500)

    messages.success(request, f"Import successful: {total_created} bookmarks added")
    
    return JsonResponse({
        "success": True,
        "imported": total_created,
        "errors": errors
    })

@login_required
def export_bookmark(request):
    qs = Bookmark.objects.filter(user=request.user)
    if not qs.exists():
        # Add a Django message and redirect back to the profile page
        messages.info(request, "You have no bookmarks to export.")
        return redirect(reverse('accounts:profile'))

    def bookmark_generator():
        yield '['
        first = True
        # Use .iterator() to avoid loading all objects into memory at once
        for b in qs.order_by('created_at').iterator():
            obj = {
                "name": b.name,
                "url": b.url,
                "description": b.description,
                "platform": b.platform,
                "tags": b.tags,
                "created_at": localtime(b.created_at).isoformat(),
            }
            if not first:
                yield ','
            else:
                first = False

            yield json.dumps(obj, ensure_ascii=False)
        yield ']'

    response = StreamingHttpResponse(
        bookmark_generator(),
        content_type="application/json"
    )
    
    messages.success(request, "Bookmarks were successfully exported")

    response['Content-Disposition'] = f'attachment; filename="Clip-{request.user.username}-bookmarks.json"'
    return response

