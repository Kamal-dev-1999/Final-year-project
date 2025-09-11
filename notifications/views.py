import csv
import io
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mass_mail
from django.conf import settings
from .models import EmailTemplate, BulkEmailTask, EmailLog
from .serializers import EmailTemplateSerializer, BulkEmailTaskSerializer, EmailLogSerializer
from contest.permissions import IsAdminUser

class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

from contest.models import Contest
from contest.serializers import ContestSerializer

class BulkEmailTaskViewSet(viewsets.ModelViewSet):
    queryset = BulkEmailTask.objects.all()
    serializer_class = BulkEmailTaskSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    @action(detail=False, methods=['get'])
    def available_contests(self, request):
        contests = Contest.objects.all()
        serializer = ContestSerializer(contests, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        task = serializer.save(created_by=self.request.user)
        self.process_email_task(task)

    @action(detail=True, methods=['post'])
    def send_emails(self, request, pk=None):
        task = self.get_object()
        self.process_email_task(task)
        return Response({'status': 'Email sending initiated'})

    def process_email_task(self, task):
        try:
            print("Starting email task processing...")
            
            if not task.file:
                raise ValueError("No CSV file uploaded")
            print(f"File name: {task.file.name}")

            if not task.template:
                raise ValueError("No email template selected")
            print(f"Template: {task.template.name}")

            if not task.contest:
                raise ValueError("No contest selected")
            print(f"Contest: {task.contest.title}")

            # Read CSV file
            try:
                # Reset file pointer to the beginning
                task.file.seek(0)
                
                # Read the file content
                content = task.file.read().decode('utf-8').splitlines()
                csv_reader = csv.reader(content)
                
                # Get headers from first row
                headers = next(csv_reader)
                if not headers or 'email' not in headers:
                    raise ValueError("CSV file must have an 'email' column")
                email_index = headers.index('email')
                
                # Get all emails from the CSV
                emails = []
                for row in csv_reader:
                    if row and len(row) > email_index:
                        email = row[email_index].strip()
                        if email and '@' in email:  # Basic email validation
                            emails.append(email)
                        else:
                            task.error_log += f"Invalid email format: {email}\\n"
            except Exception as e:
                raise ValueError(f"Error reading CSV file: {str(e)}")

            if not emails:
                raise ValueError("No valid email addresses found in CSV file")

            task.total_emails = len(emails)
            task.status = 'in_progress'
            task.error_log = ''  # Clear any previous errors
            task.save()

            # Prepare email content
            contest = task.contest
            template = task.template
            subject = template.subject

            if not settings.DEFAULT_FROM_EMAIL:
                raise ValueError("DEFAULT_FROM_EMAIL is not configured in Django settings")

            if not settings.FRONTEND_URL:
                raise ValueError("FRONTEND_URL is not configured in Django settings")
            
            # Create email messages
            messages = []
            failed_emails = []
            
            for email in emails:
                try:
                    # Replace placeholders in template
                    body = template.body.format(
                        contest_title=contest.title,
                        start_time=contest.start_time.strftime("%B %d, %Y, %I:%M %p"),
                        end_time=contest.end_time.strftime("%B %d, %Y, %I:%M %p"),
                        contest_link=f"{settings.FRONTEND_URL}/contests/share/{contest.share_link}",
                    )
                    
                    messages.append((
                        subject,
                        body,
                        settings.DEFAULT_FROM_EMAIL,
                        [email]
                    ))
                except Exception as e:
                    failed_emails.append(f"{email}: {str(e)}")
                    task.error_log += f"Error preparing email for {email}: {str(e)}\\n"

            if not messages:
                raise ValueError("No valid messages could be prepared")

            # Send emails in batches
            try:
                send_mass_mail(messages, fail_silently=False)
                task.sent_emails = len(messages)
                task.failed_emails = len(failed_emails)
                task.status = 'completed'
                if failed_emails:
                    task.error_log += f"\\nFailed to send to {len(failed_emails)} recipients:\\n"
                    task.error_log += "\\n".join(failed_emails)
            except Exception as e:
                task.status = 'failed'
                task.error_log += f"\\nEmail sending failed: {str(e)}"
                task.failed_emails = len(emails)
                raise

        except Exception as e:
            task.status = 'failed'
            if not task.error_log:
                task.error_log = str(e)
            print(f"Task failed: {str(e)}")  # For server logs
        finally:
            task.completed_at = timezone.now()
            task.save()

class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EmailLog.objects.all()
    serializer_class = EmailLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        queryset = EmailLog.objects.all()
        task_id = self.request.query_params.get('task_id', None)
        if task_id is not None:
            queryset = queryset.filter(task_id=task_id)
        return queryset
