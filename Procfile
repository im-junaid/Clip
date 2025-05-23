release: python manage.py migrate && python manage.py collectstatic --noinput
web: gunicorn clip.wsgi --log-file - --timeout 120
