from django.db import models
from django.utils import timezone
from users.models import User
import json

class Contest(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': User.Role.ADMIN})
    departments = models.JSONField(default=list, help_text="List of departments that can access this contest", blank=True, null=True)
    share_enabled = models.BooleanField(default=False, help_text="Whether the contest can be shared publicly")
    share_link = models.CharField(max_length=255, blank=True, null=True, help_text="Public link that can be shared if sharing is enabled")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

class Problem(models.Model):
    contest = models.ForeignKey(Contest, related_name='problems', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    statement = models.TextField()
    difficulty = models.CharField(max_length=50, default='Medium')
    points = models.IntegerField(default=100)
    
    # Judge0 API configuration
    time_limit = models.IntegerField(default=2000, help_text="Time limit in milliseconds")
    memory_limit = models.IntegerField(default=128000, help_text="Memory limit in bytes")
    cpu_time_limit = models.IntegerField(default=2000, help_text="CPU time limit in milliseconds")
    enable_network = models.BooleanField(default=False, help_text="Enable network access")
    
    # Problem constraints and metadata
    max_submissions = models.IntegerField(default=10, help_text="Maximum submissions allowed per user")
    allow_multiple_languages = models.BooleanField(default=True, help_text="Allow multiple programming languages")
    
    # Default language for the problem (Judge0 language ID)
    default_language_id = models.IntegerField(default=54, help_text="Default Judge0 language ID (54 = Python3)")

    def __str__(self):
        return self.title

class TestCase(models.Model):
    problem = models.ForeignKey(Problem, related_name='test_cases', on_delete=models.CASCADE)
    name = models.CharField(max_length=100, help_text="Test case name/description")
    input_data = models.TextField(help_text="Input data for the test case")
    expected_output = models.TextField(help_text="Expected output (hidden from users)")
    is_sample = models.BooleanField(default=False, help_text="Whether this is a sample test case shown to users")
    is_public = models.BooleanField(default=False, help_text="Whether this test case is visible to users")
    order = models.IntegerField(default=0, help_text="Order of test case display")
    
    class Meta:
        ordering = ['order', 'id']
    
    def __str__(self):
        return f"{self.problem.title} - {self.name}"

class Submission(models.Model):
    STATUS_CHOICES = [
        ('In Queue', 'In Queue'),
        ('Processing', 'Processing'),
        ('Accepted', 'Accepted'),
        ('Wrong Answer', 'Wrong Answer'),
        ('Time Limit Exceeded', 'Time Limit Exceeded'),
        ('Memory Limit Exceeded', 'Memory Limit Exceeded'),
        ('Runtime Error', 'Runtime Error'),
        ('Compilation Error', 'Compilation Error'),
        ('Internal Error', 'Internal Error'),
    ]
    
    problem = models.ForeignKey(Problem, related_name='submissions', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='submissions', on_delete=models.CASCADE)
    language_id = models.IntegerField(help_text="Judge0 language ID")
    source_code = models.TextField(help_text="User's source code")
    stdin = models.TextField(blank=True, help_text="Input data for testing")
    expected_output = models.TextField(blank=True, help_text="Expected output for comparison")
    
    # Judge0 response fields
    judge0_token = models.CharField(max_length=100, blank=True, help_text="Judge0 submission token")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='In Queue')
    stdout = models.TextField(blank=True, help_text="Program output")
    stderr = models.TextField(blank=True, help_text="Error output")
    compile_output = models.TextField(blank=True, help_text="Compilation output")
    time = models.FloatField(null=True, blank=True, help_text="Execution time in seconds")
    memory = models.IntegerField(null=True, blank=True, help_text="Memory used in bytes")
    
    # Metadata
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Enhanced tracking fields for analytics and security
    ip_address = models.GenericIPAddressField(null=True, blank=True, help_text="User's IP address")
    user_agent = models.TextField(blank=True, help_text="User's browser/client information")
    session_id = models.CharField(max_length=100, blank=True, help_text="User session identifier")
    time_spent_coding = models.IntegerField(null=True, blank=True, help_text="Time spent coding in seconds")
    keystrokes_count = models.IntegerField(null=True, blank=True, help_text="Number of keystrokes")
    copy_paste_events = models.IntegerField(default=0, help_text="Number of copy-paste events detected")
    tab_switches = models.IntegerField(default=0, help_text="Number of tab switches during coding")
    code_similarity_score = models.FloatField(null=True, blank=True, help_text="Similarity score with other submissions")
    
    class Meta:
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.problem.title} - {self.submitted_at}"


class UserActivity(models.Model):
    """Track detailed user activity during problem solving"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='user_activities')
    session_id = models.CharField(max_length=100, help_text="Unique session identifier")
    
    # Activity tracking
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    total_time_spent = models.IntegerField(default=0, help_text="Total time in seconds")
    
    # Behavioral analytics
    code_changes = models.JSONField(default=list, help_text="History of code changes")
    keystroke_patterns = models.JSONField(default=dict, help_text="Keystroke timing patterns")
    mouse_movements = models.IntegerField(default=0, help_text="Mouse movement count")
    idle_time = models.IntegerField(default=0, help_text="Total idle time in seconds")
    
    # Security metrics
    suspicious_activities = models.JSONField(default=list, help_text="List of suspicious activities")
    browser_focus_lost = models.IntegerField(default=0, help_text="Times browser lost focus")
    copy_paste_attempts = models.IntegerField(default=0, help_text="Copy-paste attempts")
    external_resource_access = models.JSONField(default=list, help_text="External resources accessed")
    
    class Meta:
        unique_together = ['user', 'problem', 'session_id']
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.problem.title} - Session {self.session_id}"


class PlagiarismCheck(models.Model):
    """Store plagiarism detection results"""
    submission1 = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='plagiarism_checks_as_first')
    submission2 = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='plagiarism_checks_as_second')
    similarity_score = models.FloatField(help_text="Similarity percentage (0-100)")
    algorithm_used = models.CharField(max_length=50, default='levenshtein', help_text="Algorithm used for comparison")
    details = models.JSONField(default=dict, help_text="Detailed comparison results")
    flagged_at = models.DateTimeField(auto_now_add=True)
    reviewed = models.BooleanField(default=False, help_text="Whether this has been reviewed by admin")
    
    class Meta:
        unique_together = ['submission1', 'submission2']
        ordering = ['-similarity_score', '-flagged_at']
    
    def __str__(self):
        return f"Similarity: {self.similarity_score}% - {self.submission1.user.username} vs {self.submission2.user.username}"