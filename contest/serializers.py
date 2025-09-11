from rest_framework import serializers
from .models import Contest, Problem, TestCase, Submission, UserActivity, PlagiarismCheck
from users.models import User

class TestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = ('id', 'name', 'input_data', 'is_sample', 'is_public', 'order')
        read_only_fields = ('id',)

class TestCaseAdminSerializer(serializers.ModelSerializer):
    """Admin serializer that includes expected_output for problem creators"""
    class Meta:
        model = TestCase
        fields = ('id', 'name', 'input_data', 'expected_output', 'is_sample', 'is_public', 'order')

class ProblemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating problems with test cases"""
    test_cases = TestCaseAdminSerializer(many=True, required=False)
    
    class Meta:
        model = Problem
        fields = (
            'id', 'title', 'statement', 'difficulty', 'points', 'contest',
            'time_limit', 'memory_limit', 'cpu_time_limit', 'enable_network',
            'max_submissions', 'allow_multiple_languages', 'default_language_id',
            'test_cases'
        )
        read_only_fields = ('contest',)

class ProblemSerializer(serializers.ModelSerializer):
    test_cases = TestCaseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Problem
        fields = (
            'id', 'title', 'statement', 'difficulty', 'points', 'contest',
            'time_limit', 'memory_limit', 'cpu_time_limit', 'enable_network',
            'max_submissions', 'allow_multiple_languages', 'default_language_id',
            'test_cases'
        )
        read_only_fields = ('contest',)

class ProblemDetailSerializer(serializers.ModelSerializer):
    """Detailed problem serializer for users attempting problems"""
    test_cases = TestCaseSerializer(many=True, read_only=True)
    sample_test_cases = serializers.SerializerMethodField()
    
    class Meta:
        model = Problem
        fields = (
            'id', 'title', 'statement', 'difficulty', 'points',
            'time_limit', 'memory_limit', 'cpu_time_limit', 'enable_network',
            'max_submissions', 'allow_multiple_languages', 'default_language_id',
            'test_cases', 'sample_test_cases'
        )
    
    def get_sample_test_cases(self, obj):
        """Return only sample test cases for users"""
        sample_cases = obj.test_cases.filter(is_sample=True)
        return TestCaseSerializer(sample_cases, many=True).data

class ProblemAdminSerializer(serializers.ModelSerializer):
    """Admin serializer that includes all test case details"""
    test_cases = TestCaseAdminSerializer(many=True, read_only=True)
    
    class Meta:
        model = Problem
        fields = (
            'id', 'title', 'statement', 'difficulty', 'points', 'contest',
            'time_limit', 'memory_limit', 'cpu_time_limit', 'enable_network',
            'max_submissions', 'allow_multiple_languages', 'default_language_id',
            'test_cases'
        )

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']
        read_only_fields = ['id', 'username', 'email', 'role']

class ContestSerializer(serializers.ModelSerializer):
    problems = ProblemSerializer(many=True, read_only=True)

    class Meta:
        model = Contest
        fields = ('id', 'title', 'description', 'start_time', 'end_time', 'created_by', 'problems',
                 'departments', 'share_enabled', 'share_link', 'is_active')
        read_only_fields = ('created_by', 'share_link')
    
    def create(self, validated_data):
        if validated_data.get('share_enabled'):
            import uuid
            validated_data['share_link'] = f"contest-{str(uuid.uuid4().hex[:8])}"
        return super().create(validated_data)
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Ensure created_by is always included in the response
        if 'created_by' not in representation or not representation['created_by']:
            representation['created_by'] = UserBasicSerializer(instance.created_by).data if instance.created_by else None
        return representation

class SubmissionSerializer(serializers.ModelSerializer):
    ip_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Submission
        fields = "__all__"


class SubmissionDetailSerializer(serializers.ModelSerializer):
    """Detailed submission serializer with Judge0 response data"""
    class Meta:
        model = Submission
        fields = (
            'id', 'problem', 'user', 'language_id', 'source_code', 'stdin',
            'judge0_token', 'status', 'stdout', 'stderr', 'compile_output',
            'time', 'memory', 'submitted_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'judge0_token', 'status', 'stdout', 
                           'stderr', 'compile_output', 'time', 'memory', 
                           'submitted_at', 'updated_at')

class Judge0SubmissionSerializer(serializers.Serializer):
    """Serializer for sending data to Judge0 API"""
    source_code = serializers.CharField()
    language_id = serializers.IntegerField()
    stdin = serializers.CharField(required=False, allow_blank=True)
    expected_output = serializers.CharField(required=False, allow_blank=True)
    cpu_time_limit = serializers.IntegerField(required=False)
    memory_limit = serializers.IntegerField(required=False)
    enable_network = serializers.BooleanField(required=False, default=False)

class SubmissionStatsSerializer(serializers.Serializer):
    total_submissions = serializers.IntegerField()
    accepted = serializers.IntegerField()
    wrong_answer = serializers.IntegerField()
    time_limit = serializers.IntegerField()
    memory_limit = serializers.IntegerField()
    runtime_error = serializers.IntegerField()
    compilation_error = serializers.IntegerField()

class UserSubmissionSummarySerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    total_submissions = serializers.IntegerField()
    accepted_submissions = serializers.IntegerField()
    problems_attempted = serializers.IntegerField()
    problems_solved = serializers.IntegerField()

# class SubmissionAnalyticsSerializer(serializers.ModelSerializer):
#     username = serializers.CharField(source="user.username", read_only=True)
#     problem_title = serializers.CharField(source="problem.title", read_only=True)
#     # completely drop ip_address (not used in frontend)

#     class Meta:
#         model = Submission
#         fields = [
#             "id",
#             "username",
#             "problem_title",
#             "status",
#             "time",
#             "memory",
#             "language_id",
#             "submitted_at",
#             "source_code",
#         ]


class BulkProblemSerializer(serializers.Serializer):
    problems = ProblemCreateSerializer(many=True)

    def create(self, validated_data):
        problems_data = validated_data.get('problems', [])
        contest = self.context['contest']
        
        created_problems = []
        
        for problem_data in problems_data:
            # Extract test cases from problem data
            test_cases_data = problem_data.pop('test_cases', [])
            
            # Create the problem
            problem = Problem.objects.create(contest=contest, **problem_data)
            
            # Create test cases for this problem
            for test_case_data in test_cases_data:
                TestCase.objects.create(problem=problem, **test_case_data)
            
            created_problems.append(problem)
        
        return {'problems': created_problems}


# Enhanced Analytics Serializers
class UserActivitySerializer(serializers.ModelSerializer):
    """Serializer for user activity tracking"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    problem_title = serializers.CharField(source='problem.title', read_only=True)
    
    class Meta:
        model = UserActivity
        fields = (
            'id', 'user', 'user_username', 'user_email', 'problem', 'problem_title',
            'session_id', 'started_at', 'last_activity', 'total_time_spent',
            'code_changes', 'keystroke_patterns', 'mouse_movements', 'idle_time',
            'suspicious_activities', 'browser_focus_lost', 'copy_paste_attempts',
            'external_resource_access'
        )


from rest_framework import serializers
from .models import Submission

class SubmissionAnalyticsSerializer(serializers.ModelSerializer):
    """Enhanced submission serializer with analytics and security data"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    problem_title = serializers.CharField(source='problem.title', read_only=True)
    contest_title = serializers.CharField(source='problem.contest.title', read_only=True)
    language_name = serializers.SerializerMethodField()
    
    # Direct model fields, no need for 'source'
    ip_address = serializers.CharField(read_only=True)
    user_agent = serializers.CharField(read_only=True)
    session_id = serializers.CharField(read_only=True)

    class Meta:
        model = Submission
        fields = (
            'id', 'user', 'user_username', 'user_email', 'problem', 'problem_title',
            'contest_title', 'language_id', 'language_name', 'source_code', 'stdin',
            'judge0_token', 'status', 'stdout', 'stderr', 'compile_output',
            'time', 'memory', 'submitted_at', 'updated_at',
            'ip_address', 'user_agent', 'session_id', 'time_spent_coding',
            'keystrokes_count', 'copy_paste_events', 'tab_switches', 'code_similarity_score'
        )

    def get_language_name(self, obj):
        """Map language ID to readable name"""
        language_mapping = {
            71: 'Python (3.8.1)', 50: 'C (GCC 9.2.0)', 54: 'C++ (GCC 9.2.0)',
            62: 'Java (OpenJDK 13.0.1)', 63: 'JavaScript (Node.js 12.14.0)',
            74: 'TypeScript (3.7.4)', 51: 'C# (Mono 6.6.0.161)', 60: 'Go (1.13.5)',
            72: 'Ruby (2.7.0)', 73: 'Rust (1.40.0)', 78: 'Kotlin (1.3.70)'
        }
        return language_mapping.get(obj.language_id, f'Language ID {obj.language_id}')

class PlagiarismCheckSerializer(serializers.ModelSerializer):
    """Serializer for plagiarism detection results"""
    submission1_user = serializers.CharField(source='submission1.user.username', read_only=True)
    submission2_user = serializers.CharField(source='submission2.user.username', read_only=True)
    submission1_time = serializers.DateTimeField(source='submission1.submitted_at', read_only=True)
    submission2_time = serializers.DateTimeField(source='submission2.submitted_at', read_only=True)
    problem_title = serializers.CharField(source='submission1.problem.title', read_only=True)
    
    class Meta:
        model = PlagiarismCheck
        fields = (
            'id', 'submission1', 'submission2', 'submission1_user', 'submission2_user',
            'submission1_time', 'submission2_time', 'problem_title',
            'similarity_score', 'algorithm_used', 'details', 'flagged_at', 'reviewed'
        )


class SubmissionStatsSerializer(serializers.Serializer):
    """Serializer for submission statistics"""
    total_submissions = serializers.IntegerField()
    accepted_submissions = serializers.IntegerField()
    wrong_answer_submissions = serializers.IntegerField()
    compilation_error_submissions = serializers.IntegerField()
    runtime_error_submissions = serializers.IntegerField()
    time_limit_exceeded_submissions = serializers.IntegerField()
    memory_limit_exceeded_submissions = serializers.IntegerField()
    acceptance_rate = serializers.FloatField()
    average_time_spent = serializers.FloatField()
    suspicious_activity_count = serializers.IntegerField()
    high_similarity_count = serializers.IntegerField()


class UserSubmissionSummarySerializer(serializers.Serializer):
    """Summary of user's submission activity"""
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.CharField()
    total_submissions = serializers.IntegerField()
    accepted_count = serializers.IntegerField()
    wrong_answer_count = serializers.IntegerField()
    compilation_error_count = serializers.IntegerField()
    average_time_spent = serializers.FloatField()
    total_copy_paste_events = serializers.IntegerField()
    total_tab_switches = serializers.IntegerField()
    suspicious_activity_score = serializers.FloatField()
    last_submission_time = serializers.DateTimeField()
    flagged_for_plagiarism = serializers.BooleanField()
