from rest_framework import serializers
from .models import EmailTemplate, BulkEmailTask, EmailLog

class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = '__all__'

class BulkEmailTaskSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    contest_title = serializers.CharField(source='contest.title', read_only=True)
    
    class Meta:
        model = BulkEmailTask
        fields = [
            'id', 'contest', 'contest_title', 'template', 'template_name',
            'file', 'status', 'total_emails', 'sent_emails', 'failed_emails',
            'created_at', 'completed_at', 'error_log'
        ]
        read_only_fields = ['status', 'total_emails', 'sent_emails', 'failed_emails', 'completed_at', 'error_log']

class EmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = '__all__'
        read_only_fields = ['task', 'sent_at']
