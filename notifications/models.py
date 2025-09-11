from django.db import models
from django.conf import settings
from contest.models import Contest

class EmailTemplate(models.Model):
    name = models.CharField(max_length=100)
    subject = models.CharField(max_length=200)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class BulkEmailTask(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ]

    contest = models.ForeignKey(Contest, on_delete=models.CASCADE)
    template = models.ForeignKey(EmailTemplate, on_delete=models.SET_NULL, null=True)
    file = models.FileField(upload_to='email_lists/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_emails = models.IntegerField(default=0)
    sent_emails = models.IntegerField(default=0)
    failed_emails = models.IntegerField(default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_log = models.TextField(blank=True)

    def __str__(self):
        return f"Bulk Email Task for {self.contest.title} - {self.status}"

class EmailLog(models.Model):
    task = models.ForeignKey(BulkEmailTask, on_delete=models.CASCADE)
    email = models.EmailField()
    status = models.CharField(max_length=20)
    sent_at = models.DateTimeField(auto_now_add=True)
    error_message = models.TextField(blank=True)

    def __str__(self):
        return f"Email to {self.email} - {self.status}"
