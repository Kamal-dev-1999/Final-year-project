from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from contest.models import Contest, Problem, TestCase
from datetime import datetime, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a test contest with problems and test cases for Judge0 testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--contest-id',
            type=int,
            help='Contest ID to add problems to (optional)',
        )

    def handle(self, *args, **options):
        # Get or create admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Created admin user: {admin_user.username}')
            )

        # Create contest if contest_id not provided
        contest_id = options.get('contest_id')
        if contest_id:
            try:
                contest = Contest.objects.get(id=contest_id)
                self.stdout.write(f'Using existing contest: {contest.title}')
            except Contest.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Contest with ID {contest_id} not found')
                )
                return
        else:
            # Create a new test contest
            contest = Contest.objects.create(
                title='Judge0 Test Contest',
                description='A test contest for testing Judge0 integration',
                start_time=datetime.now(),
                end_time=datetime.now() + timedelta(days=30),
                created_by=admin_user
            )
            self.stdout.write(
                self.style.SUCCESS(f'Created contest: {contest.title} (ID: {contest.id})')
            )

        # Create test problems
        problems_data = [
            {
                'title': 'Hello World',
                'statement': '''Write a program that prints "Hello, World!" to the console.

Input: None
Output: Print "Hello, World!" (without quotes)

Example:
Input: 
Output: Hello, World!''',
                'difficulty': 'Easy',
                'points': 10,
                'test_cases': [
                    {
                        'name': 'Basic Test',
                        'input_data': '',
                        'expected_output': 'Hello, World!',
                        'is_sample': True,
                        'is_public': True,
                        'order': 1
                    }
                ]
            },
            {
                'title': 'Sum of Two Numbers',
                'statement': '''Given two integers a and b, calculate their sum.

Input: Two integers separated by space
Output: The sum of the two numbers

Example:
Input: 5 3
Output: 8

Input: -10 20
Output: 10''',
                'difficulty': 'Easy',
                'points': 20,
                'test_cases': [
                    {
                        'name': 'Positive Numbers',
                        'input_data': '5 3',
                        'expected_output': '8',
                        'is_sample': True,
                        'is_public': True,
                        'order': 1
                    },
                    {
                        'name': 'Negative Numbers',
                        'input_data': '-10 20',
                        'expected_output': '10',
                        'is_sample': True,
                        'is_public': True,
                        'order': 2
                    },
                    {
                        'name': 'Zero Test',
                        'input_data': '0 0',
                        'expected_output': '0',
                        'is_sample': False,
                        'is_public': True,
                        'order': 3
                    }
                ]
            },
            {
                'title': 'Factorial',
                'statement': '''Calculate the factorial of a given number n.

Input: An integer n (0 ≤ n ≤ 10)
Output: The factorial of n

Example:
Input: 5
Output: 120

Input: 0
Output: 1''',
                'difficulty': 'Medium',
                'points': 30,
                'test_cases': [
                    {
                        'name': 'Small Number',
                        'input_data': '5',
                        'expected_output': '120',
                        'is_sample': True,
                        'is_public': True,
                        'order': 1
                    },
                    {
                        'name': 'Zero',
                        'input_data': '0',
                        'expected_output': '1',
                        'is_sample': True,
                        'is_public': True,
                        'order': 2
                    },
                    {
                        'name': 'Large Number',
                        'input_data': '10',
                        'expected_output': '3628800',
                        'is_sample': False,
                        'is_public': True,
                        'order': 3
                    }
                ]
            }
        ]

        for problem_data in problems_data:
            test_cases = problem_data.pop('test_cases')
            
            # Create problem
            problem = Problem.objects.create(
                contest=contest,
                **problem_data
            )
            
            # Create test cases
            for test_case_data in test_cases:
                TestCase.objects.create(
                    problem=problem,
                    **test_case_data
                )
            
            self.stdout.write(
                self.style.SUCCESS(f'Created problem: {problem.title} with {len(test_cases)} test cases')
            )

        self.stdout.write(
            self.style.SUCCESS(f'\nTest contest setup complete!')
        )
        self.stdout.write(f'Contest ID: {contest.id}')
        self.stdout.write(f'Admin username: {admin_user.username}')
        self.stdout.write(f'Admin password: admin123')
        self.stdout.write(f'\nYou can now test the Judge0 integration!') 