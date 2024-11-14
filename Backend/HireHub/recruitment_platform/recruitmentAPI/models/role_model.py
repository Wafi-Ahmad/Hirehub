from django.db import models
from django.contrib.auth import get_user_model

class Role(models.Model):
    HR = 'HR'
    CEO = 'CEO'
    ROLE_CHOICES = [
        (HR, 'HR'),
        (CEO, 'CEO'),
    ]

    user = models.OneToOneField(get_user_model(), on_delete=models.CASCADE, related_name='role')
    role = models.CharField(max_length=3, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.user.email} - {self.role}"