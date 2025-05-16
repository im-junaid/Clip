from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Bookmark(models.Model):
    CATEGORY_CHOICES = [
        ('Mobile', 'Mobile App'),
        ('Desktop', 'Desktop'),
        ('Web', 'Web App'),
        ('Bot', 'Bot'),
        ('Script','Script'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    url = models.URLField()
    description = models.TextField(blank=True)
    platform = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    tags = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)