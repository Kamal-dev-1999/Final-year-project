from rest_framework import status, generics, viewsets, filters, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q, F, Case, When, IntegerField, Value, Sum, Avg
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings
from datetime import timedelta
import difflib
import requests
from .permissions import get_client_ip, IsAdminUser, IsContestCreator
from .models import Contest, Problem, TestCase, Submission, UserActivity, PlagiarismCheck
from .serializers import (
    ContestSerializer, ProblemSerializer, ProblemDetailSerializer, 
    TestCaseSerializer, TestCaseAdminSerializer, SubmissionSerializer, 
    SubmissionDetailSerializer, BulkProblemSerializer, ProblemAdminSerializer,
    SubmissionAnalyticsSerializer, UserActivitySerializer, PlagiarismCheckSerializer,
    SubmissionStatsSerializer, UserSubmissionSummarySerializer
)
from django.core.exceptions import PermissionDenied

# Judge0 API configuration
JUDGE0_API_URL = getattr(settings, 'JUDGE0_API_URL', 'http://localhost:2358')

# This custom permission ensures only users with the 'ADMIN' role can access the view
# class IsAdminUser(permissions.BasePermission):
#     def has_permission(self, request, view):
#         return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'

# class IsContestCreator(permissions.BasePermission):
#     def has_object_permission(self, request, view, obj):
#         # Check if the user is the creator of the contest
#         if isinstance(obj, Contest):
#             return obj.created_by == request.user
#         elif isinstance(obj, Problem):
#             return obj.contest.created_by == request.user
#         return False

import logging
logger = logging.getLogger('contest.views')

class ContestViewSet(viewsets.ModelViewSet):
    serializer_class = ContestSerializer
    permission_classes = [IsAuthenticated]
    
    def initial(self, request, *args, **kwargs):
        """
        Runs anything that needs to occur prior to calling the method handler.
        """
        logger.info("\n" + "="*80)
        logger.info(f"Initial request - {request.method} {request.path}")
        logger.info(f"User: {request.user} (ID: {request.user.id if request.user.is_authenticated else 'Anonymous'})")
        logger.info(f"User role: {getattr(request.user, 'role', 'No role')}")
        logger.info(f"Action: {self.action}")
        logger.info(f"View class: {self.__class__.__name__}")
        logger.info("="*80 + "\n")
        super().initial(request, *args, **kwargs)
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        logger.info(f"\n{'='*80}")
        logger.info(f"PERMISSIONS CHECK - Action: {self.action}")
        logger.info(f"User: {self.request.user} (ID: {getattr(self.request.user, 'id', 'None')})")
        logger.info(f"User role: {getattr(self.request.user, 'role', 'None')}")
        
        # For admin users, allow all actions with just IsAuthenticated
        if hasattr(self.request.user, 'role') and self.request.user.role == 'ADMIN':
            logger.info("Admin user detected, allowing all actions")
            permission_classes = [IsAuthenticated]
        # For other users, apply role-based permissions
        elif self.action in ['create']:
            logger.info("Using IsAdminUser permission for create action")
            permission_classes = [IsAuthenticated, IsAdminUser]
        elif self.action in ['update', 'partial_update', 'destroy']:
            logger.info("Using IsAdminUser | IsContestCreator permission for update/delete actions")
            permission_classes = [IsAuthenticated, (IsAdminUser | IsContestCreator)]
        else:
            logger.info("Using IsAuthenticated permission for read actions")
            permission_classes = [IsAuthenticated]
        
        logger.info(f"Permission classes: {[p.__name__ if hasattr(p, '__name__') else str(p) for p in permission_classes]}")
        logger.info(f"{'='*80}\n")
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        logger.info(f"get_queryset called. User: {user} (ID: {user.id if user.is_authenticated else 'Anonymous'})")
        
        if self.action in ['update', 'partial_update', 'destroy']:
            if user.role == 'ADMIN':
                logger.info("User is ADMIN, returning all contests")
                return Contest.objects.all()
            logger.info(f"Non-admin user, filtering contests by creator: {user.id}")
            return Contest.objects.filter(created_by=user)
            
        logger.info("Returning all contests for read operation")
        return Contest.objects.all()

    def perform_create(self, serializer):
        user = self.request.user
        logger.info(f"Creating new contest. Creator: {user} (ID: {user.id})")
        serializer.save(created_by=user)
        logger.info(f"Contest created by user {user.id}")
        
    def list(self, request, *args, **kwargs):
        logger.info(f"List view accessed by user: {request.user} (ID: {request.user.id if request.user.is_authenticated else 'Anonymous'})")
        return super().list(request, *args, **kwargs)
        
    def retrieve(self, request, *args, **kwargs):
        logger.info(f"Retrieve view accessed by user: {request.user} (ID: {request.user.id if request.user.is_authenticated else 'Anonymous'})")
        logger.info(f"Requested contest ID: {kwargs.get('pk')}")
        return super().retrieve(request, *args, **kwargs)

class ProblemViewSet(viewsets.ModelViewSet):
    serializer_class = ProblemSerializer
    permission_classes = [IsAdminUser, IsContestCreator]

    def get_queryset(self):
        # Only show problems from contests created by the current admin
        return Problem.objects.filter(contest__created_by=self.request.user)

    def get_serializer_class(self):
        if self.action in ['retrieve', 'list'] and self.request.user.role == 'ADMIN':
            return ProblemAdminSerializer
        return ProblemSerializer

class ContestProblemView(generics.GenericAPIView):
    permission_classes = [IsAdminUser, IsContestCreator]
    serializer_class = BulkProblemSerializer

    def post(self, request, contest_id):
        try:
            # Validate request format
            if 'problems' not in request.data:
                return Response(
                    {"problems": "This field is required. Expected format: {'problems': [...]}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not isinstance(request.data['problems'], list):
                return Response(
                    {"problems": "Must be a list of problems"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            contest = Contest.objects.get(id=contest_id)
            # Check if the user is the creator of the contest
            self.check_object_permissions(request, contest)
            
            serializer = self.get_serializer(data=request.data, context={'contest': contest})
            
            try:
                serializer.is_valid(raise_exception=True)
            except serializers.ValidationError as e:
                # Add more context to the error message
                error_detail = {
                    "error": "Invalid problem data",
                    "message": "Please check the format of your request",
                    "details": e.detail
                }
                return Response(error_detail, status=status.HTTP_400_BAD_REQUEST)
                
            problems = serializer.save()
            
            return Response({
                "message": "Problems created successfully",
                "problems": ProblemAdminSerializer(problems['problems'], many=True).data
            }, status=status.HTTP_201_CREATED)
            
        except Contest.DoesNotExist:
            return Response(
                {"detail": "Contest not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ContestDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Contest.objects.all()
    serializer_class = ContestSerializer
    permission_classes = [permissions.IsAuthenticated, IsContestCreator]
    lookup_field = 'id'
    
    def get_queryset(self):
        if self.request.method == 'GET':
            return Contest.objects.all()
        return Contest.objects.filter(created_by=self.request.user)

class ProblemDetailView(generics.RetrieveAPIView):
    """View for users to get problem details with test cases"""
    queryset = Problem.objects.all()
    serializer_class = ProblemDetailSerializer
    permission_classes = []  # Remove authentication requirement for testing
    lookup_field = 'id'

    def get_object(self):
        problem = super().get_object()
        # Allow access to problem for testing (no authentication required)
        return problem

class ProblemSubmissionView(generics.CreateAPIView):
    """View for users to submit solutions to problems"""
    serializer_class = SubmissionSerializer
    permission_classes = []  # Remove authentication requirement for testing

    def get(self, request, *args, **kwargs):
        """Get submission status and remaining attempts"""
        problem_id = self.kwargs.get('problem_id')
        try:
            problem = Problem.objects.get(id=problem_id)
            
            # Get or create default user for testing
            default_user = get_user_model().objects.get(username='anonymous_user')
            
            # Get submission statistics
            submissions = Submission.objects.filter(
                problem=problem,
                user=default_user
            ).order_by('-submitted_at')
            
            submission_count = submissions.count()
            last_submission = submissions.first()
            
            return Response({
                "problem_id": problem_id,
                "submissions_made": submission_count,
                "submissions_remaining": max(0, problem.max_submissions - submission_count),
                "max_submissions": problem.max_submissions,
                "last_submission": {
                    "time": last_submission.submitted_at if last_submission else None,
                    "status": last_submission.status if last_submission else None,
                    "id": last_submission.id if last_submission else None
                } if last_submission else None
            })
            
        except Problem.DoesNotExist:
            return Response(
                {"detail": "Problem not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        problem_id = self.kwargs.get('problem_id')
        try:
            problem = Problem.objects.get(id=problem_id)
        except Problem.DoesNotExist:
            return Response(
                {"detail": "Problem not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # For testing: Create or get a default user for anonymous submissions
        default_user, created = get_user_model().objects.get_or_create(
            username='anonymous_user',
            defaults={
                'email': 'anonymous@test.com',
                'role': 'USER',
                'is_staff': False,
                'is_superuser': False
            }
        )

        # Check submission limit (using default user for testing)
        user_submissions = Submission.objects.filter(
            problem=problem, 
            user=default_user
        )
        
        # Get the last submission and its status
        last_submission = user_submissions.order_by('-submitted_at').first()
        
        # Count only completed submissions (not in queue/processing/error)
        completed_submissions = user_submissions.exclude(
            status__in=['In Queue', 'Processing', 'Internal Error']
        ).count()
        
        # Allow new submission if under limit or if last submission is still processing
        if completed_submissions < problem.max_submissions:
            pass  # Continue with submission
        elif last_submission and last_submission.status in ['In Queue', 'Processing']:
            # Last submission is still processing, return status
            return Response({
                "detail": "Previous submission is still being processed",
                "submissions_made": completed_submissions,
                "max_submissions": problem.max_submissions,
                "last_submission": {
                    'id': last_submission.id,
                    'time': last_submission.submitted_at,
                    'status': last_submission.status
                },
                "message": "Please wait for your previous submission to complete"
            }, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Maximum submissions reached
            return Response({
                "detail": f"Maximum submissions ({problem.max_submissions}) reached for this problem",
                "submissions_made": completed_submissions,
                "max_submissions": problem.max_submissions,
                "last_submission": {
                    'id': last_submission.id if last_submission else None,
                    'time': last_submission.submitted_at if last_submission else None,
                    'status': last_submission.status if last_submission else None
                },
                "message": "Only completed submissions count towards the limit"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get client information
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Create submission with client info
        submission_data = request.data.copy()
        submission_data['problem'] = problem.id
        submission_data['user'] = default_user.id  # Use default user for testing
        submission_data['ip_address'] = ip_address
        submission_data['user_agent'] = user_agent
        # Generate a simple session ID for tracking
        submission_data['session_id'] = request.session.session_key or f'anonymous_{ip_address}'
        
        serializer = self.get_serializer(data=submission_data)
        serializer.is_valid(raise_exception=True)
        submission = serializer.save()

        # Automatic test case judging: run against all test cases
        import base64
        import requests
        def b64(s):
            return base64.b64encode(s.encode()).decode()
        def decode_base64(s):
            if not s:
                return ''
            try:
                return base64.b64decode(s).decode('utf-8')
            except:
                return s
        
        test_cases = problem.test_cases.all()
        results = []
        all_passed = True
        
        for test_case in test_cases:
            # Enforce Judge0 free tier limits
            cpu_time_limit = min(problem.cpu_time_limit / 1000.0, 20.0)  # Convert to seconds and cap at 20
            memory_limit = min(problem.memory_limit, 512000)  # Cap at 512KB
            
            judge0_data = {
                "source_code": b64(submission.source_code),
                "language_id": submission.language_id,
                "stdin": b64(test_case.input_data),
                "cpu_time_limit": cpu_time_limit,
                "memory_limit": memory_limit,
                "enable_network": problem.enable_network
            }
            headers = {
                'Content-Type': 'application/json',
                'X-RapidAPI-Host': settings.JUDGE0_API_HOST,
                'X-RapidAPI-Key': settings.JUDGE0_API_KEY,
            }
            response = requests.post(
                f"{settings.JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true",
                json=judge0_data,
                headers=headers
            )
            if response.status_code in (200, 201):
                judge0_result = response.json()
            elif response.status_code == 429:
                # Quota exceeded - return error
                raise Exception("Judge0 API quota exceeded. Please upgrade your plan or try again later.")
            else:
                judge0_result = {"error": f"Judge0 API error: {response.status_code} - {response.text}"}
            
            # Debug logging
            print(f"DEBUG: Test case {test_case.name} - Judge0 response: {judge0_result}")
            
            user_output = decode_base64(judge0_result.get('stdout', '')).strip()
            expected_output = test_case.expected_output.strip()
            
            # Robust comparison: strip trailing whitespace from both
            passed = user_output.rstrip() == expected_output.rstrip()
            
            results.append({
                'test_case_id': test_case.id,
                'test_case_name': test_case.name,
                'input': test_case.input_data,
                'expected_output': expected_output,
                'user_output': user_output,
                'passed': passed,
                'stderr': decode_base64(judge0_result.get('stderr', '')),
                'time': judge0_result.get('time'),
                'memory': judge0_result.get('memory'),
                'judge0_status': judge0_result.get('status', {}),
            })
            
            if not passed:
                all_passed = False
        
        # Update submission status
        submission.status = 'Accepted' if all_passed else 'Wrong Answer'
        submission.save()
        
        return Response({
            "all_passed": all_passed,
            "results": results,
            "submission_id": submission.id,
            "status": submission.status,
            "message": "Automatic test case judging completed"
        }, status=status.HTTP_201_CREATED)

    def get_language_id(self, submission_language_id):
        """Map submission language to correct Judge0 language ID"""
        # Define supported languages and their Judge0 IDs
        language_mapping = {
            # Python
            'python': 71,  # Python (3.8.1)
            'python3': 71,
            'python2': 70,
            'python (3.8.1)': 71,
            'python (3.11.2)': 92,
            'python (3.12.5)': 100,
            'python (3.13.2)': 109,
            'python (2.7.17)': 70,
            # C
            'c': 50,  # C (GCC 9.2.0)
            'c (gcc 9.2.0)': 50,
            'c (gcc 8.3.0)': 49,
            'c (gcc 7.4.0)': 48,
            'c (clang 18.1.8)': 104,
            'c (clang 19.1.7)': 110,
            'c (clang 7.0.1)': 75,
            'c (gcc 14.1.0)': 103,
            # C++
            'cpp': 54,  # C++ (GCC 9.2.0)
            'c++': 54,
            'c++ (gcc 9.2.0)': 54,
            'c++ (gcc 8.3.0)': 53,
            'c++ (gcc 7.4.0)': 52,
            'c++ (clang 7.0.1)': 76,
            'c++ (gcc 14.1.0)': 105,
            # Java
            'java': 62,  # Java (OpenJDK 13.0.1)
            'java (openjdk 13.0.1)': 62,
            'java (jdk 17.0.6)': 91,
            # JavaScript
            'javascript': 63,  # JavaScript (Node.js 12.14.0)
            'js': 63,
            'javascript (node.js 12.14.0)': 63,
            'javascript (node.js 18.15.0)': 93,
            'javascript (node.js 20.17.0)': 97,
            'javascript (node.js 22.08.0)': 102,
            # TypeScript
            'typescript': 74,
            'typescript (3.7.4)': 74,
            'typescript (5.0.3)': 94,
            'typescript (5.6.2)': 101,
            # C#
            'c#': 51,  # C# (Mono 6.6.0.161)
            'csharp': 51,
            'c# (mono 6.6.0.161)': 51,
            # Go
            'go': 60,  # Go (1.13.5)
            'go (1.13.5)': 60,
            'go (1.18.5)': 95,
            'go (1.22.0)': 106,
            'go (1.23.5)': 107,
            # Ruby
            'ruby': 72,  # Ruby (2.7.0)
            'ruby (2.7.0)': 72,
            # Rust
            'rust': 73,  # Rust (1.40.0)
            'rust (1.40.0)': 73,
            'rust (1.85.0)': 108,
            # PHP
            'php': 68,  # PHP (7.4.1)
            'php (7.4.1)': 68,
            'php (8.3.11)': 98,
            # Swift
            'swift': 83,  # Swift (5.2.3)
            'swift (5.2.3)': 83,
            # Kotlin
            'kotlin': 78,  # Kotlin (1.3.70)
            'kotlin (1.3.70)': 78,
            'kotlin (2.1.10)': 111,
            # Scala
            'scala': 81,  # Scala (2.13.2)
            'scala (2.13.2)': 81,
            # R
            'r': 80,  # R (4.0.0)
            'r (4.0.0)': 80,
            'r (4.4.1)': 99,
            # Bash
            'bash': 46,  # Bash (5.0.0)
            'bash (5.0.0)': 46,
            # Perl
            'perl': 85,  # Perl (5.28.1)
            'perl (5.28.1)': 85,
            # Lua
            'lua': 64,  # Lua (5.3.5)
            'lua (5.3.5)': 64,
            # Haskell
            'haskell': 61,  # Haskell (GHC 8.8.1)
            'haskell (ghc 8.8.1)': 61,
            # SQL
            'sql': 82,  # SQL (SQLite 3.27.2)
            'sql (sqlite 3.27.2)': 82,
            # Pascal
            'pascal': 67,  # Pascal (FPC 3.0.4)
            'pascal (fpc 3.0.4)': 67,
            # Fortran
            'fortran': 59,  # Fortran (GFortran 9.2.0)
            'fortran (gfortran 9.2.0)': 59,
            # Assembly
            'assembly': 45,  # Assembly (NASM 2.14.02)
            'assembly (nasm 2.14.02)': 45,
            # Others can be added as needed
        }
        
        # If submission_language_id is already a number and in the values, return it
        if isinstance(submission_language_id, int) and submission_language_id in language_mapping.values():
            return submission_language_id
            
        # If it's a string, try to map it
        if isinstance(submission_language_id, str):
            language_id = language_mapping.get(submission_language_id.lower())
            if language_id:
                return language_id
                
        # Default to Python if unknown
        return 71  # Python (3.8.1)

    def send_to_judge0(self, submission, problem):
        """Send submission to Judge0 API (RapidAPI version)"""
        # Get test cases for the problem
        test_cases = problem.test_cases.filter(is_public=True)
        if not test_cases.exists():
            test_cases = problem.test_cases.filter(is_sample=True)
        if not test_cases.exists():
            test_cases = problem.test_cases.all()
        test_case = test_cases.first()
        import base64
        def b64(s):
            if s is None:
                return ""
            return base64.b64encode(s.encode()).decode()
        
        # Get correct language ID
        language_id = self.get_language_id(submission.language_id)
        
        # Use the user's code as-is for full script support
        code_template = submission.source_code
        
        # Enforce Judge0 free tier limits
        cpu_time_limit = min(problem.cpu_time_limit / 1000.0, 20.0)  # Convert to seconds and cap at 20
        memory_limit = min(problem.memory_limit, 512000)  # Cap at 512KB
        
        judge0_data = {
            "source_code": b64(code_template),
            "language_id": language_id,
            "stdin": b64(submission.stdin if getattr(submission, 'stdin', None) else (test_case.input_data if test_case else "")),
            "expected_output": b64(test_case.expected_output if test_case else ""),
            "cpu_time_limit": cpu_time_limit,
            "memory_limit": memory_limit,
            "enable_network": problem.enable_network
        }

        headers = {
            'Content-Type': 'application/json',
            'X-RapidAPI-Host': settings.JUDGE0_API_HOST,
            'X-RapidAPI-Key': settings.JUDGE0_API_KEY,
        }

        
        response = requests.post(
            f"{settings.JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true",
            json=judge0_data,
            headers=headers
        )
        
        if response.status_code in (200, 201):
            judge0_result = response.json()
            
            # Apply robust comparison logic here too
            if judge0_result.get('status', {}).get('id') == 4:  # Wrong Answer
                def decode_base64(s):
                    if not s:
                        return ''
                    try:
                        return base64.b64decode(s).decode('utf-8')
                    except:
                        return s
                
                user_output = decode_base64(judge0_result.get('stdout', '')).strip()
                expected_output = test_case.expected_output.strip() if test_case else ""
                
                # Debug logging
                print(f"DEBUG: user_output='{repr(user_output)}'")
                print(f"DEBUG: expected_output='{repr(expected_output)}'")
                print(f"DEBUG: user_output.rstrip()='{repr(user_output.rstrip())}'")
                print(f"DEBUG: expected_output.rstrip()='{repr(expected_output.rstrip())}'")
                print(f"DEBUG: Comparison result: {user_output.rstrip() == expected_output.rstrip()}")
                
                # Handle empty expected_output
                if not expected_output:
                    print("DEBUG: WARNING - expected_output is empty!")
                    # If expected_output is empty, accept any non-empty output
                    if user_output.strip():
                        judge0_result['status'] = {'id': 3, 'description': 'Accepted'}
                        print("DEBUG: Status changed to Accepted (empty expected_output)")
                else:
                    # Robust comparison: strip trailing whitespace from both
                    if user_output.rstrip() == expected_output.rstrip():
                        judge0_result['status'] = {'id': 3, 'description': 'Accepted'}
                        print("DEBUG: Status changed to Accepted")
            
            return judge0_result
        else:
            raise Exception(f"Judge0 API error: {response.status_code} - {response.text}")

class SubmissionStatusView(generics.RetrieveAPIView):
    """View to check submission status from Judge0"""
    queryset = Submission.objects.all()  # Fix: required for RetrieveAPIView
    serializer_class = SubmissionDetailSerializer
    permission_classes = []  # Remove authentication requirement for testing
    lookup_field = 'id'

    def get_object(self):
        submission = super().get_object()
        # Allow access to any submission for testing (no authentication required)
        return submission

    def retrieve(self, request, *args, **kwargs):
        submission = self.get_object()
        
        # If submission is still in queue/processing, check with Judge0
        if submission.status in ['In Queue', 'Processing'] and submission.judge0_token:
            try:
                judge0_status = self.get_judge0_status(submission.judge0_token)
                self.update_submission_status(submission, judge0_status)
            except Exception as e:
                submission.status = 'Internal Error'
                submission.save()
        
        serializer = self.get_serializer(submission)
        return Response(serializer.data)

    def get_judge0_status(self, token):
        headers = {
            'Content-Type': 'application/json',
            'X-RapidAPI-Host': settings.JUDGE0_API_HOST,
            'X-RapidAPI-Key': settings.JUDGE0_API_KEY,
        }
        response = requests.get(
            f"{settings.JUDGE0_API_URL}/submissions/{token}?base64_encoded=true",
            headers=headers
        )
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Judge0 API error: {response.status_code}")

    def update_submission_status(self, submission, judge0_data):
        """Update submission with Judge0 response data"""
        import base64

        def decode_base64(s):
            if not s:
                return ''
            try:
                return base64.b64decode(s).decode('utf-8')
            except:
                return s

        status_mapping = {
            1: 'In Queue',
            2: 'Processing',
            3: 'Accepted',
            4: 'Wrong Answer',
            5: 'Time Limit Exceeded',
            6: 'Compilation Error',
            7: 'Runtime Error',
            8: 'Memory Limit Exceeded',
            9: 'Internal Error'
        }
        
        # Get the status from Judge0
        judge0_status_id = judge0_data.get('status', {}).get('id')
        submission.status = status_mapping.get(judge0_status_id, 'Internal Error')
        
        # Decode outputs
        submission.stdout = decode_base64(judge0_data.get('stdout', ''))
        submission.stderr = decode_base64(judge0_data.get('stderr', ''))
        submission.compile_output = decode_base64(judge0_data.get('compile_output', ''))
        submission.time = judge0_data.get('time')
        submission.memory = judge0_data.get('memory')
        
        # If Judge0 marked it as Wrong Answer, do a robust comparison
        if judge0_status_id == 4:  # Wrong Answer
            # Get the expected output from the test case
            test_case = submission.problem.test_cases.first()
            if test_case:
                expected_output = test_case.expected_output.strip()
                user_output = submission.stdout.strip()
                
                # Robust comparison: strip trailing whitespace from both
                if user_output.rstrip() == expected_output.rstrip():
                    submission.status = 'Accepted'
        
        submission.save()

class TestCaseViewSet(viewsets.ModelViewSet):
    """ViewSet for managing test cases (admin only)"""
    serializer_class = TestCaseAdminSerializer
    permission_classes = [IsAdminUser, IsContestCreator]

    def get_queryset(self):
        return TestCase.objects.filter(problem__contest__created_by=self.request.user)

    def get_serializer_class(self):
        if self.request.user.role == 'ADMIN':
            return TestCaseAdminSerializer
        return TestCaseSerializer

class SubmissionAnalyticsViewSet(viewsets.ModelViewSet):
    """ViewSet for getting submission analytics"""
    serializer_class = SubmissionAnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        contest_id = self.request.query_params.get('contest_id')
        if not contest_id:
            return Submission.objects.none()

        return Submission.objects.filter(
            problem__contest_id=contest_id
        ).select_related(
            'user', 'problem'
        ).order_by('-submitted_at')

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        contest_id = request.query_params.get('contest_id')
        if not contest_id:
            return Response({'error': 'contest_id is required'}, status=400)
            
        submissions = self.get_queryset()
        stats = submissions.aggregate(
            total_submissions=Count('id'),
            accepted=Count('id', filter=Q(status='Accepted')),
            wrong_answer=Count('id', filter=Q(status='Wrong Answer')),
            time_limit=Count('id', filter=Q(status='Time Limit Exceeded')),
            memory_limit=Count('id', filter=Q(status='Memory Limit Exceeded')),
            runtime_error=Count('id', filter=Q(status='Runtime Error')),
            compilation_error=Count('id', filter=Q(status='Compilation Error'))
        )
        
        serializer = SubmissionStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def user_summary(self, request):
        contest_id = request.query_params.get('contest_id')
        if not contest_id:
            return Response({'error': 'contest_id is required'}, status=400)
            
        submissions = self.get_queryset()
        user_stats = submissions.values(
            'user__id',
            'user__username'
        ).annotate(
            user_id=F('user__id'),
            username=F('user__username'),
            total_submissions=Count('id'),
            accepted_submissions=Count('id', filter=Q(status='Accepted')),
            problems_attempted=Count('problem', distinct=True),
            problems_solved=Count(
                'problem',
                filter=Q(status='Accepted'),
                distinct=True
            )
        ).order_by('-problems_solved', '-accepted_submissions')
        
        serializer = UserSubmissionSummarySerializer(user_stats, many=True)
        return Response(serializer.data)

class ViewProblemDetailView(generics.RetrieveAPIView):
    queryset = Problem.objects.all()
    serializer_class = ProblemDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_object(self):
        problem = super().get_object()
        if problem.contest.created_by != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to access this problem.")
        return problem

class SubmissionAnalyticsViewSet(viewsets.ModelViewSet):
    """ViewSet for getting submission analytics"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubmissionAnalyticsSerializer

    def get_queryset(self):
        contest_id = self.request.query_params.get('contest_id')
        if not contest_id:
            return Submission.objects.none()

        return Submission.objects.filter(
            problem__contest_id=contest_id
        ).select_related(
            'user', 'problem'
        ).order_by('-submitted_at')

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        contest_id = request.query_params.get('contest_id')
        if not contest_id:
            return Response({'error': 'contest_id is required'}, status=400)
            
        submissions = self.get_queryset()
        stats = submissions.aggregate(
            total_submissions=Count('id'),
            accepted=Count('id', filter=Q(status='Accepted')),
            wrong_answer=Count('id', filter=Q(status='Wrong Answer')),
            time_limit=Count('id', filter=Q(status='Time Limit Exceeded')),
            memory_limit=Count('id', filter=Q(status='Memory Limit Exceeded')),
            runtime_error=Count('id', filter=Q(status='Runtime Error')),
            compilation_error=Count('id', filter=Q(status='Compilation Error'))
        )
        
        serializer = SubmissionStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def user_summary(self, request):
        contest_id = request.query_params.get('contest_id')
        if not contest_id:
            return Response({'error': 'contest_id is required'}, status=400)
            
        submissions = self.get_queryset()
        user_stats = submissions.values(
            'user__username'
        ).annotate(
            username=F('user__username'),
            total_submissions=Count('id'),
            accepted_submissions=Count('id', filter=Q(status='Accepted')),
            problems_attempted=Count('problem', distinct=True),
            problems_solved=Count(
                'problem',
                filter=Q(status='Accepted'),
                distinct=True
            )
        ).order_by('-problems_solved', '-accepted_submissions')
        
        serializer = UserSubmissionSummarySerializer(user_stats, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        contest_id = request.query_params.get('contest_id')
        if not contest_id:
            return Response({'error': 'contest_id is required'}, status=400)
            
        submissions = self.get_queryset()
        stats = submissions.aggregate(
            total_submissions=Count('id'),
            accepted=Count('id', filter=Q(status='Accepted')),
            wrong_answer=Count('id', filter=Q(status='Wrong Answer')),
            time_limit=Count('id', filter=Q(status='Time Limit Exceeded')),
            memory_limit=Count('id', filter=Q(status='Memory Limit Exceeded')),
            runtime_error=Count('id', filter=Q(status='Runtime Error')),
            compilation_error=Count('id', filter=Q(status='Compilation Error'))
        )
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def user_summary(self, request):
        contest_id = request.query_params.get('contest_id')
        if not contest_id:
            return Response({'error': 'contest_id is required'}, status=400)
            
        submissions = self.get_queryset()
        user_stats = submissions.values(
            'user__username'
        ).annotate(
            total_submissions=Count('id'),
            accepted_submissions=Count('id', filter=Q(status='Accepted')),
            problems_attempted=Count('problem', distinct=True),
            problems_solved=Count(
                'problem',
                filter=Q(status='Accepted'),
                distinct=True
            )
        ).order_by('-problems_solved', '-accepted_submissions')


# Analytics and Monitoring Views
class SubmissionAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """Comprehensive submission analytics for admin monitoring"""
    serializer_class = SubmissionAnalyticsSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = Submission.objects.select_related('user', 'problem', 'problem__contest').all()
        
        # Filter by contest if specified
        contest_id = self.request.query_params.get('contest_id')
        if contest_id:
            queryset = queryset.filter(problem__contest_id=contest_id)
            
        # Filter by problem if specified
        problem_id = self.request.query_params.get('problem_id')
        if problem_id:
            queryset = queryset.filter(problem_id=problem_id)
            
        # Filter by user if specified
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        # Filter by status if specified
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(submitted_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(submitted_at__lte=end_date)
            
        return queryset.order_by('-submitted_at')
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get overall submission statistics"""
        queryset = self.get_queryset()
        
        total_submissions = queryset.count()
        if total_submissions == 0:
            return Response({
                'total_submissions': 0,
                'accepted_submissions': 0,
                'wrong_answer_submissions': 0,
                'compilation_error_submissions': 0,
                'runtime_error_submissions': 0,
                'time_limit_exceeded_submissions': 0,
                'memory_limit_exceeded_submissions': 0,
                'acceptance_rate': 0,
                'average_time_spent': 0,
                'suspicious_activity_count': 0,
                'high_similarity_count': 0
            })
        
        # Calculate basic submission statistics
        stats = {
            'accepted': queryset.filter(status='Accepted').count(),
            'wrong_answer': queryset.filter(status='Wrong Answer').count(),
            'compilation_error': queryset.filter(status='Compilation Error').count(),
            'runtime_error': queryset.filter(status='Runtime Error').count(),
            'time_limit_exceeded': queryset.filter(status='Time Limit Exceeded').count(),
            'memory_limit_exceeded': queryset.filter(status='Memory Limit Exceeded').count(),
        }
        
        # Calculate acceptance rate
        acceptance_rate = (stats['accepted'] / total_submissions) * 100 if total_submissions > 0 else 0
        
        return Response({
            'total_submissions': total_submissions,
            'accepted_submissions': stats['accepted'],
            'wrong_answer_submissions': stats['wrong_answer'],
            'compilation_error_submissions': stats['compilation_error'],
            'runtime_error_submissions': stats['runtime_error'],
            'time_limit_exceeded_submissions': stats['time_limit_exceeded'],
            'memory_limit_exceeded_submissions': stats['memory_limit_exceeded'],
            'acceptance_rate': round(acceptance_rate, 2),
            'average_time_spent': 0,  # Not currently tracked in the model
            'suspicious_activity_count': 0,  # Not currently tracked in the model
            'high_similarity_count': 0  # Not currently tracked in the model
        })
    
    @action(detail=False, methods=['get'])
    def user_summary(self, request):
        """Get summary of all users' submission activities"""
        users_data = []
        users = get_user_model().objects.filter(submissions__isnull=False).distinct()
        
        for user in users:
            user_submissions = Submission.objects.filter(user=user)
            
            if user_submissions.exists():
                stats = user_submissions.aggregate(
                    total=Count('id'),
                    accepted=Count('id', filter=Q(status='Accepted')),
                    wrong_answer=Count('id', filter=Q(status='Wrong Answer')),
                    compilation_error=Count('id', filter=Q(status='Compilation Error')),
                    avg_time_spent=Avg('time_spent_coding'),
                    total_copy_paste=Count('copy_paste_events'),
                    total_tab_switches=Count('tab_switches')
                )
                
                # Calculate suspicious activity score
                suspicious_score = 0
                if stats['total_copy_paste'] > 10:
                    suspicious_score += 30
                if stats['total_tab_switches'] > 20:
                    suspicious_score += 20
                
                # Get unique IP addresses
                ip_addresses = list(user_submissions.exclude(ip_address__isnull=True).values_list('ip_address', flat=True).distinct())
                
                users_data.append({
                    'user_id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'total_submissions': stats['total'],
                    'accepted_count': stats['accepted'],
                    'wrong_answer_count': stats['wrong_answer'],
                    'compilation_error_count': stats['compilation_error'],
                    'average_time_spent': round(stats['avg_time_spent'] or 0, 2),
                    'total_copy_paste_events': stats['total_copy_paste'],
                    'total_tab_switches': stats['total_tab_switches'],
                    'suspicious_activity_score': suspicious_score,
                    'last_submission_time': user_submissions.first().submitted_at,
                    'ip_addresses': ip_addresses,
                    'flagged_for_plagiarism': False
                })
        
        # Sort by suspicious activity score (highest first)
        users_data.sort(key=lambda x: x['suspicious_activity_score'], reverse=True)
        
        return Response(users_data)


class UserActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for monitoring user activities during contests"""
    serializer_class = UserActivitySerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = UserActivity.objects.select_related('user', 'submission', 'submission__problem').all()
        
        # Filter by contest if specified
        contest_id = self.request.query_params.get('contest_id')
        if contest_id:
            queryset = queryset.filter(submission__problem__contest_id=contest_id)
            
        # Filter by user if specified
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        return queryset.order_by('-started_at')


class PlagiarismCheckViewSet(viewsets.ModelViewSet):
    """ViewSet for managing plagiarism detection results"""
    serializer_class = PlagiarismCheckSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = PlagiarismCheck.objects.select_related('submission1', 'submission2').all()
        
        # Filter by contest if specified
        contest_id = self.request.query_params.get('contest_id')
        if contest_id:
            queryset = queryset.filter(submission1__problem__contest_id=contest_id)
            
        return queryset.order_by('-flagged_at')
    
    @action(detail=False, methods=['post'])
    def run_detection(self, request):
        """Run plagiarism detection on submissions"""
        contest_id = request.data.get('contest_id')
        problem_id = request.data.get('problem_id')
        
        if not contest_id and not problem_id:
            return Response(
                {'error': 'Either contest_id or problem_id must be provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get submissions to check
        submissions = Submission.objects.filter(status='Accepted')
        if contest_id:
            submissions = submissions.filter(problem__contest_id=contest_id)
        elif problem_id:
            submissions = submissions.filter(problem_id=problem_id)
        
        submissions = list(submissions.select_related('user', 'problem'))
        
        if len(submissions) < 2:
            return Response(
                {'message': 'Not enough submissions to check for plagiarism'}, 
                status=status.HTTP_200_OK
            )
        
        checks_created = 0
        
        # Compare each pair of submissions
        for i in range(len(submissions)):
            for j in range(i + 1, len(submissions)):
                submission1 = submissions[i]
                submission2 = submissions[j]
                
                # Skip if same user (commented out for testing with single user)
                # if submission1.user == submission2.user:
                #     continue
                
                # Skip if already checked
                if PlagiarismCheck.objects.filter(
                    submission1=submission1, 
                    submission2=submission2
                ).exists():
                    continue
                
                # Calculate similarity
                similarity = self._calculate_code_similarity(
                    submission1.code, 
                    submission2.code
                )
                
                # Create plagiarism check record
                PlagiarismCheck.objects.create(
                    submission1=submission1,
                    submission2=submission2,
                    similarity_score=similarity
                )
                checks_created += 1
        
        return Response({
            'message': f'Plagiarism detection completed. {checks_created} comparisons made.',
            'checks_created': checks_created
        })
    
    @action(detail=True, methods=['patch'])
    def mark_reviewed(self, request, pk=None):
        """Mark a plagiarism check as reviewed"""
        try:
            check = self.get_object()
            check.reviewed = True
            check.save()
            
            return Response({
                'message': 'Plagiarism check marked as reviewed',
                'is_reviewed': True
            })
        except PlagiarismCheck.DoesNotExist:
            return Response(
                {'error': 'Plagiarism check not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def _calculate_code_similarity(self, code1, code2):
        """Calculate similarity between two code snippets"""
        import difflib
        
        # Normalize code by removing whitespace and comments
        def normalize_code(code):
            lines = code.strip().split('\n')
            normalized = []
            for line in lines:
                line = line.strip()
                if line and not line.startswith('#') and not line.startswith('//'):
                    normalized.append(line)
            return '\n'.join(normalized)
        
        normalized_code1 = normalize_code(code1)
        normalized_code2 = normalize_code(code2)
        
        # Calculate similarity using difflib
        similarity = difflib.SequenceMatcher(None, normalized_code1, normalized_code2).ratio()
        return round(similarity, 3)