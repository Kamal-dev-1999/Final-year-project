from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        STUDENT = "STUDENT", "Student" 

    # We add the 'role' field to distinguish between user types
    role = models.CharField(max_length=50, choices=Role.choices)


class UserSession(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)