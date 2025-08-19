from django.views.decorators.http import require_http_methods
from django.http import JsonResponse, StreamingHttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.db import IntegrityError, transaction
from django.shortcuts import render, redirect
from django.utils.timezone import localtime
from django.core.paginator import Paginator
from django.contrib import messages
from django.conf import settings
from django.urls import reverse
from django.db.models import Q

import google.generativeai as genai
from bs4 import BeautifulSoup
from .models import Bookmark
import requests
import json


from django.core.paginator import Paginator
from django.shortcuts import render
from django.http import HttpResponse

# Configure the Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)


# home page
def index(request):
    return render(request, "home/home.html")

# dashboard page


@login_required
def dashbord(request):
    all_bookmarks = Bookmark.objects.filter(
        user=request.user).order_by("-created_at")
    total_bookmarks_count = all_bookmarks.count()

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        page_number = int(request.GET.get('page', '2'))

        items_after_first_page = all_bookmarks[6:]
        paginator = Paginator(items_after_first_page, 12)

        # We need to check if the page exists and has a next page
        real_page_number = page_number - 1
        if real_page_number > paginator.num_pages:
            return HttpResponse("", headers={'X-Has-Next': 'false'})

        page_obj = paginator.get_page(real_page_number)

        # Render the partial template to a string
        html_content = render(request, '_bookmark_list.html', {
                              'bookmarks': page_obj}).content.decode('utf-8')

        # ✅ Create a response and add the custom header
        response = HttpResponse(html_content)
        response['X-Has-Next'] = 'true' if page_obj.has_next() else 'false'
        return response

    else:  # Initial page load
        first_page_items = all_bookmarks[:6]
        has_next = total_bookmarks_count > 6

        context = {
            "bookmarks": first_page_items,
            "total_bookmarks": total_bookmarks_count,
            "has_next": has_next,
            "page_number": 1
        }
        return render(request, "dashboard.html", context)


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
        return JsonResponse({"success": True})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

# search bookmark


@login_required
def search_bookmark(request):
    q = request.GET.get('q', '').strip()
    category = request.GET.get('category', '').strip()
    tags = request.GET.getlist('tags[]')  # expecting multiple tags

    qs = Bookmark.objects.filter(user=request.user)

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
            errors.append(
                f"Item {idx}: 'name', 'url', and 'platform' are required.")
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
                    Bookmark.objects.bulk_create(
                        to_create, batch_size=batch_size)
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

    messages.success(
        request, f"Import successful: {total_created} bookmarks added")

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


# test pages
def t1(request):
    # Your logic here
    return render(request, "test-1.html")


def t2(request):
    # Your logic here
    return render(request, "test-2.html")


@login_required
@require_POST
def auto_add_bookmark(request):
    try:
        data = json.loads(request.body)
        url = data.get('url')
        if not url:
            return JsonResponse({'error': 'URL is required'}, status=400)

        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        # 1. Fetch and Scrape Website Content
        headers = {
            # A more recent User-Agent for Chrome on Windows
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',

            # Standard Accept headers
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',

            # Tells the server what compression your script can handle
            'Accept-Encoding': 'gzip, deflate, br, zstd',

            # Signals a preference for secure (HTTPS) connections
            'Upgrade-Insecure-Requests': '1',

            # A generic Referer, making it look like you came from Google
            'Referer': 'https://www.google.com/'
        }

        # Use the headers in your request
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')

        # Get the title and main text content
        page_title = soup.title.string if soup.title else 'No Title Found'

        # Remove script and style elements
        for script_or_style in soup(['script', 'style']):
            script_or_style.decompose()

        page_text = ' '.join(soup.stripped_strings)
        # Limit the text to avoid exceeding API token limits
        page_text = page_text[:4000]

        # 2. Prompt Engineering for the AI
        model = genai.GenerativeModel('gemini-1.5-flash-latest')

        common_tags = ["development", "android", "linux", "mac",
                       "hacking", "script", "editing", "design", "video", "image", "ai"]

        prompt = f"""
        Your task is to create bookmark details for the given URL. You will use a two-step process.

        URL: "{url}"
        Scraped Page Title: "{page_title}"
        Scraped Content: "{page_text}"

        # This part identifies the login page
        Step 1: Assess the Scraped Content.
        First, analyze the "Scraped Content". Is it meaningful, or is it corrupted, a login page, an error message, or just gibberish?

        Step 2: Generate JSON Output.
        # This part tells the AI what to do when it finds a login page
        - IF the "Scraped Content" is NOT useful, IGNORE IT.
        - Instead, use your own knowledge about the URL ("{url}") to generate the JSON object.
        - IF you cannot determine the purpose of the URL from either the content or your own knowledge, return EXACTLY this JSON object: {{"status": "no_data"}}

        The JSON object should have the following structure:
        1. "name": A concise name for the bookmark.
        2. "description": A brief, one-sentence description.
        3. "platform": Classify from: [Web, Desktop, Mobile, Bot, Script, Tool, Library].
        4. "tags": An array of 3-5 relevant lowercase tags. Include specific tags and relevant ones from this list: {json.dumps(common_tags)}.

        Example of a good output:
        {{
            "name": "Django - The web framework for perfectionists",
            "description": "The official website for Django, a high-level Python web framework.",
            "platform": "development",
            "tags": ["python", "django", "web development", "development"]
        }}

        Now, analyze the provided data and generate the appropriate JSON response.
        """

        # 3. Call the AI and Parse the Response
        ai_response = model.generate_content(prompt)

        # Clean up the response to get only the JSON part
        json_text = ai_response.text.strip().lstrip('```json').rstrip('```')
        ai_data = json.loads(json_text)

        if ai_data.get("status") == "no_data":
            return JsonResponse({'error': 'Could not determine bookmark details from the URL.'}, status=400)

        try:
            bm = Bookmark.objects.create(
                user=request.user,
                name=ai_data.get('name', page_title),
                url=url,
                description=ai_data.get('description', ''),
                platform=ai_data.get('platform', 'Web'),
                tags=ai_data.get('tags', [])
            )
            bm.save()

            bookmark_data = {
                'id': bm.id,
                'name': bm.name,
                'url': bm.url,
                'description': bm.description,
                'platform': bm.platform,
                'tags': bm.tags
            }

            return JsonResponse({
                'status': 'success',
                'bookmark': bookmark_data
            })

        except Exception as e:
            return JsonResponse(ai_data)

    except requests.exceptions.RequestException as e:
        # This is the code that returns the 400 Bad Request to your browser
        return JsonResponse({'error': f'Could not fetch URL: {e}'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'An error occurred: {e}'}, status=500)
