# models.py
from django.db import models
from django.contrib.auth.models import User

class AndroidApp(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    subCategory = models.CharField(max_length=100)
    url = models.URLField()
    points = models.IntegerField()

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    points_earned = models.IntegerField(default=0)
    tasksCompleted = models.IntegerField(default=0)


class Task(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    app = models.ForeignKey(AndroidApp, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    screenshot = models.ImageField(upload_to='screenshots/', null=True, blank=True)