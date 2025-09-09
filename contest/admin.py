from django.contrib import admin
from .models import Contest, Problem, Submission, TestCase
# Register your models here.
admin.site.register(Contest)
admin.site.register(Problem)
admin.site.register(Submission)
admin.site.register(TestCase)
