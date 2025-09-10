# Coding Contest Platform - Admin Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Database Models](#database-models)
5. [API Endpoints](#api-endpoints)
6. [Contest Creation Flow](#contest-creation-flow)
7. [Problem Structure](#problem-structure)
8. [Authentication & Authorization](#authentication--authorization)
9. [Security Features](#security-features)
10. [Analytics & Monitoring](#analytics--monitoring)
11. [Plagiarism Detection](#plagiarism-detection)
12. [Production Deployment](#production-deployment)

---

## Project Overview

This is a comprehensive coding contest platform built with Django REST Framework backend and React frontend. The platform enables administrators to create contests, add programming problems with test cases, and monitor user submissions in real-time using Judge0 API for code execution.

### Key Features
- **Role-based Access Control**: Admin and Student roles with appropriate permissions
- **Multi-language Support**: 40+ programming languages via Judge0 API
- **Real-time Code Execution**: Automatic judging with time/memory limits
- **Security Monitoring**: IP tracking, session management, plagiarism detection
- **Analytics Dashboard**: Comprehensive submission and user activity monitoring
- **Test Case Management**: Hidden test cases with sample cases for users

---

## Architecture

### Backend Architecture (Django)
- **Framework**: Django 5.2.4 with Django REST Framework
- **Database**: SQLite (development), PostgreSQL (production recommended)
- **Authentication**: JWT tokens with single-device session management
- **External Integration**: Judge0 API for code execution
- **Security**: Role-based permissions, IP tracking, session management

### Frontend Architecture (React)
- **Framework**: React 19.1.0 with Vite
- **UI Library**: Material-UI (MUI) v7.2.0
- **Routing**: React Router DOM v7.7.1
- **HTTP Client**: Axios with JWT interceptors
- **Form Handling**: Formik with Yup validation

### System Architecture Flow
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Django Backend │    │   Judge0 API    │
│                 │    │                 │    │                 │
│  - Admin Panel  │◄──►│  - REST API     │◄──►│  - Code Execution│
│  - User Portal  │    │  - Business Logic│    │  - Judging      │
│  - Monitoring   │    │  - Security     │    │  - Results      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                │
                    ┌─────────────────┐
                    │   Database      │
                    │                 │
                    │  - Users        │
                    │  - Contests     │
                    │  - Problems     │
                    │  - Submissions  │
                    │  - Analytics    │
                    └─────────────────┘
```

---

## Project Structure

```
final-year/
├── core/                   # Django project configuration
│   ├── settings.py        # Django settings
│   ├── urls.py           # Main URL configuration
│   ├── asgi.py           # ASGI configuration
│   └── wsgi.py           # WSGI configuration
├── users/                 # User management app
│   ├── models.py         # User and UserSession models
│   ├── serializers.py    # User serializers
│   ├── views.py          # Authentication views
│   ├── permissions.py    # Custom permissions
│   └── admin.py          # Django admin configuration
├── contest/               # Contest management app
│   ├── models.py         # Contest, Problem, TestCase, Submission models
│   ├── serializers.py    # API serializers
│   ├── views.py          # API views and business logic
│   ├── urls.py           # App URL configuration
│   ├── permissions.py    # Custom permissions
│   ├── utils.py          # Utility functions
│   └── admin.py          # Django admin configuration
├── frontend/              # React frontend
│   ├── public/           # Static files
│   ├── src/
│   │   ├── api/          # API service modules
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── assets/       # Images and assets
│   │   └── App.jsx       # Main App component
│   ├── package.json      # Node.js dependencies
│   └── vite.config.js    # Vite configuration
├── manage.py             # Django management script
├── requirements.txt      # Python dependencies
├── .gitignore           # Git ignore rules
└── README.md            # Project documentation
```

---

## Database Models

### User Models

#### User
Extends Django's AbstractUser with role-based access control.

**Fields:**
- `id` (AutoField): Primary key
- `username` (CharField): Unique username
- `email` (EmailField): User email address
- `password` (CharField): Hashed password
- `role` (CharField): User role (ADMIN/STUDENT)
- `first_name` (CharField): User's first name
- `last_name` (CharField): User's last name
- `is_active` (BooleanField): Account status
- `is_staff` (BooleanField): Staff access
- `is_superuser` (BooleanField): Superuser status
- `date_joined` (DateTimeField): Account creation date
- `last_login` (DateTimeField): Last login timestamp

**Relationships:**
- One-to-many with Contest (created_by)
- One-to-many with Submission (user)
- One-to-one with UserSession

#### UserSession
Tracks user sessions for single-device login enforcement.

**Fields:**
- `id` (AutoField): Primary key
- `user` (ForeignKey): Reference to User
- `session_key` (CharField): JWT token identifier
- `created_at` (DateTimeField): Session creation timestamp

### Contest Models

#### Contest
Represents a coding competition with time constraints.

**Fields:**
- `id` (AutoField): Primary key
- `title` (CharField): Contest title (max 200 chars)
- `description` (TextField): Contest description
- `start_time` (DateTimeField): Contest start time
- `end_time` (DateTimeField): Contest end time
- `created_by` (ForeignKey): Admin who created the contest

**Relationships:**
- One-to-many with Problem (problems)
- Foreign key to User (created_by)

#### Problem
Represents a programming problem within a contest.

**Fields:**
- `id` (AutoField): Primary key
- `contest` (ForeignKey): Parent contest
- `title` (CharField): Problem title (max 200 chars)
- `statement` (TextField): Problem description
- `difficulty` (CharField): Problem difficulty (Easy/Medium/Hard)
- `points` (IntegerField): Problem points (default: 100)
- `time_limit` (IntegerField): Time limit in milliseconds (default: 2000)
- `memory_limit` (IntegerField): Memory limit in bytes (default: 128000)
- `cpu_time_limit` (IntegerField): CPU time limit in milliseconds (default: 2000)
- `enable_network` (BooleanField): Enable network access (default: False)
- `max_submissions` (IntegerField): Max submissions per user (default: 10)
- `allow_multiple_languages` (BooleanField): Allow multiple languages (default: True)
- `default_language_id` (IntegerField): Default Judge0 language ID (default: 54)

**Relationships:**
- Foreign key to Contest (contest)
- One-to-many with TestCase (test_cases)
- One-to-many with Submission (submissions)

#### TestCase
Represents test cases for problem validation.

**Fields:**
- `id` (AutoField): Primary key
- `problem` (ForeignKey): Parent problem
- `name` (CharField): Test case name (max 100 chars)
- `input_data` (TextField): Input data for testing
- `expected_output` (TextField): Expected output (hidden from users)
- `is_sample` (BooleanField): Is sample test case (default: False)
- `is_public` (BooleanField): Is visible to users (default: False)
- `order` (IntegerField): Display order (default: 0)

**Relationships:**
- Foreign key to Problem (problem)

#### Submission
Represents user code submissions for problems.

**Fields:**
- `id` (AutoField): Primary key
- `problem` (ForeignKey): Submitted problem
- `user` (ForeignKey): Submitting user
- `language_id` (IntegerField): Judge0 language ID
- `source_code` (TextField): User's source code
- `stdin` (TextField): Input data for testing
- `expected_output` (TextField): Expected output for comparison
- `judge0_token` (CharField): Judge0 submission token
- `status` (CharField): Submission status (In Queue/Processing/Accepted/Wrong Answer/etc.)
- `stdout` (TextField): Program output
- `stderr` (TextField): Error output
- `compile_output` (TextField): Compilation output
- `time` (FloatField): Execution time in seconds
- `memory` (IntegerField): Memory used in bytes
- `submitted_at` (DateTimeField): Submission timestamp
- `updated_at` (DateTimeField): Last update timestamp
- `ip_address` (GenericIPAddressField): User's IP address
- `user_agent` (TextField): Browser/client information
- `session_id` (CharField): Session identifier
- `time_spent_coding` (IntegerField): Time spent coding in seconds
- `keystrokes_count` (IntegerField): Number of keystrokes
- `copy_paste_events` (IntegerField): Copy-paste events count
- `tab_switches` (IntegerField): Tab switches count
- `code_similarity_score` (FloatField): Similarity score with other submissions

**Relationships:**
- Foreign key to Problem (problem)
- Foreign key to User (user)
- One-to-many with PlagiarismCheck (plagiarism_checks_as_first, plagiarism_checks_as_second)

### Analytics Models

#### UserActivity
Tracks detailed user activity during problem solving.

**Fields:**
- `id` (AutoField): Primary key
- `user` (ForeignKey): Associated user
- `problem` (ForeignKey): Associated problem
- `session_id` (CharField): Unique session identifier
- `started_at` (DateTimeField): Activity start time
- `last_activity` (DateTimeField): Last activity timestamp
- `total_time_spent` (IntegerField): Total time in seconds
- `code_changes` (JSONField): History of code changes
- `keystroke_patterns` (JSONField): Keystroke timing patterns
- `mouse_movements` (IntegerField): Mouse movement count
- `idle_time` (IntegerField): Total idle time in seconds
- `suspicious_activities` (JSONField): List of suspicious activities
- `browser_focus_lost` (IntegerField): Times browser lost focus
- `copy_paste_attempts` (IntegerField): Copy-paste attempts
- `external_resource_access` (JSONField): External resources accessed

**Relationships:**
- Foreign key to User (user)
- Foreign key to Problem (problem)

#### PlagiarismCheck
Stores plagiarism detection results.

**Fields:**
- `id` (AutoField): Primary key
- `submission1` (ForeignKey): First submission for comparison
- `submission2` (ForeignKey): Second submission for comparison
- `similarity_score` (FloatField): Similarity percentage (0-100)
- `algorithm_used` (CharField): Algorithm used for comparison
- `details` (JSONField): Detailed comparison results
- `flagged_at` (DateTimeField): Detection timestamp
- `reviewed` (BooleanField): Review status (default: False)

**Relationships:**
- Foreign key to Submission (submission1, submission2)

---

## API Endpoints

### Authentication Endpoints

#### POST /auth/token/
**Description**: User login endpoint
**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```
**Response**:
```json
{
  "access": "jwt_token",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "role": "ADMIN"
  }
}
```

#### POST /auth/signup/
**Description**: Admin registration endpoint
**Request Body**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

### Contest Management Endpoints

#### GET /api/contests/
**Description**: List all contests
**Permissions**: Authenticated users
**Response**: Array of contest objects

#### POST /api/contests/
**Description**: Create a new contest
**Permissions**: Admin users only
**Request Body**:
```json
{
  "title": "Contest Title",
  "description": "Contest description",
  "start_time": "2024-01-01T10:00:00Z",
  "end_time": "2024-01-01T18:00:00Z"
}
```

#### GET /api/contests/{id}/
**Description**: Get contest details
**Permissions**: Contest creator or admin

#### PUT /api/contests/{id}/
**Description**: Update contest details
**Permissions**: Contest creator or admin

#### DELETE /api/contests/{id}/
**Description**: Delete a contest
**Permissions**: Contest creator or admin

#### POST /api/contests/{contest_id}/problems/
**Description**: Add multiple problems to a contest
**Permissions**: Contest creator or admin
**Request Body**:
```json
{
  "problems": [
    {
      "title": "Problem Title",
      "statement": "Problem description",
      "difficulty": "Medium",
      "points": 100,
      "time_limit": 2000,
      "memory_limit": 128000,
      "test_cases": [
        {
          "name": "Sample Test",
          "input_data": "input",
          "expected_output": "output",
          "is_sample": true,
          "is_public": true
        }
      ]
    }
  ]
}
```

### Problem Management Endpoints

#### GET /api/problems/
**Description**: List all problems
**Permissions**: Admin users only

#### POST /api/problems/
**Description**: Create a new problem
**Permissions**: Contest creator or admin
**Request Body**:
```json
{
  "contest": 1,
  "title": "Problem Title",
  "statement": "Problem description",
  "difficulty": "Medium",
  "points": 100,
  "time_limit": 2000,
  "memory_limit": 128000,
  "max_submissions": 10,
  "allow_multiple_languages": true,
  "default_language_id": 54
}
```

#### GET /api/problems/{id}/
**Description**: Get problem details
**Permissions**: Public access

#### PUT /api/problems/{id}/
**Description**: Update problem details
**Permissions**: Contest creator or admin

#### DELETE /api/problems/{id}/
**Description**: Delete a problem
**Permissions**: Contest creator or admin

#### GET /api/problems/{id}/detail/
**Description**: Get problem details with test cases (public)
**Permissions**: Public access

### Test Case Management Endpoints

#### GET /api/testcases/
**Description**: List all test cases
**Permissions**: Contest creator or admin

#### POST /api/testcases/
**Description**: Create a new test case
**Permissions**: Contest creator or admin
**Request Body**:
```json
{
  "problem": 1,
  "name": "Test Case 1",
  "input_data": "input data",
  "expected_output": "expected output",
  "is_sample": false,
  "is_public": false,
  "order": 1
}
```

#### PUT /api/testcases/{id}/
**Description**: Update test case
**Permissions**: Contest creator or admin

#### DELETE /api/testcases/{id}/
**Description**: Delete test case
**Permissions**: Contest creator or admin

### Submission Endpoints

#### GET /api/problems/{problem_id}/submit/
**Description**: Get submission status and remaining attempts
**Permissions**: Authenticated users

#### POST /api/problems/{problem_id}/submit/
**Description**: Submit solution to a problem
**Permissions**: Authenticated users
**Request Body**:
```json
{
  "language_id": 54,
  "source_code": "print('Hello World')",
  "stdin": "",
  "expected_output": "Hello World"
}
```

#### GET /api/submissions/{id}/status/
**Description**: Check submission status from Judge0
**Permissions**: Public access

### Analytics Endpoints

#### GET /api/analytics/submissions/
**Description**: Get submission analytics
**Permissions**: Admin users only
**Query Parameters**:
- `contest_id`: Filter by contest
- `status`: Filter by submission status
- `user_id`: Filter by user

#### GET /api/analytics/submissions/statistics/
**Description**: Get overall submission statistics
**Permissions**: Admin users only

#### GET /api/analytics/submissions/user_summary/
**Description**: Get summary of all users' submission activities
**Permissions**: Admin users only

### User Activity Monitoring Endpoints

#### GET /api/user-activities/
**Description**: Get user activities
**Permissions**: Admin users only

### Plagiarism Detection Endpoints

#### GET /api/plagiarism-checks/
**Description**: Get plagiarism checks
**Permissions**: Admin users only

#### POST /api/plagiarism-checks/run_detection/
**Description**: Run plagiarism detection on submissions
**Permissions**: Admin users only
**Request Body**:
```json
{
  "contest_id": 1,
  "threshold": 70
}
```

#### POST /api/plagiarism-checks/{id}/mark_reviewed/
**Description**: Mark plagiarism check as reviewed
**Permissions**: Admin users only

---

## Contest Creation Flow

### 1. Admin Authentication
```
Admin Login → JWT Token Generation → User Data Storage
```

### 2. Contest Creation
```
Create Contest → Set Title/Description → Configure Time Window → Save Contest
```

### 3. Problem Addition
```
Select Contest → Add Problems → Configure Problem Settings → Add Test Cases → Save Problems
```

### 4. Contest Publication
```
Review Contest → Set Contest Status → Publish Contest → User Access Enabled
```

### Detailed Contest Creation Process

#### Step 1: Admin Login
- Admin provides username and password
- Backend validates credentials and role
- JWT token is generated and returned
- User data is stored in localStorage for frontend access

#### Step 2: Create Contest
- Admin fills contest creation form:
  - Title (required)
  - Description (required)
  - Start time (required)
  - End time (required)
- Backend validates:
  - End time must be after start time
  - Admin must have proper permissions
- Contest is saved with created_by reference

#### Step 3: Add Problems to Contest
- Admin can add multiple problems at once:
  - Problem title and statement
  - Difficulty level (Easy/Medium/Hard)
  - Points allocation
  - Time and memory limits
  - Maximum submissions allowed
  - Language restrictions
- For each problem, admin can add:
  - Sample test cases (visible to users)
  - Hidden test cases (for judging)
  - Input/output data

#### Step 4: Configure Test Cases
- Each problem must have at least one test case
- Test cases can be:
  - Sample: Visible to users for testing
  - Hidden: Used only for judging
- Test case structure:
  - Name/Description
  - Input data
  - Expected output
  - Order (for display)

#### Step 5: Contest Management
- Admin can:
  - Edit contest details
  - Add/remove problems
  - Update test cases
  - Monitor submissions
  - View analytics

---

## Problem Structure

### Problem Components

#### 1. Basic Information
- **Title**: Clear, descriptive problem name
- **Statement**: Detailed problem description
- **Difficulty**: Easy/Medium/Hard classification
- **Points**: Score value for successful submission

#### 2. Technical Configuration
- **Time Limit**: Maximum execution time (milliseconds)
- **Memory Limit**: Maximum memory usage (bytes)
- **CPU Time Limit**: Maximum CPU time (milliseconds)
- **Network Access**: Enable/disable network access
- **Language Support**: Allow/restrict programming languages

#### 3. Submission Constraints
- **Maximum Submissions**: Limit attempts per user
- **Language Restrictions**: Specify allowed languages
- **Default Language**: Preferred language for the problem

#### 4. Test Cases Structure
```
Problem
├── Sample Test Cases (visible to users)
│   ├── Test Case 1
│   │   ├── Input: "sample input"
│   │   └── Expected Output: "sample output"
│   └── Test Case 2
│       ├── Input: "another input"
│       └── Expected Output: "another output"
└── Hidden Test Cases (for judging only)
    ├── Test Case 3
    │   ├── Input: "hidden input"
    │   └── Expected Output: "hidden output"
    └── Test Case 4
        ├── Input: "more hidden input"
        └── Expected Output: "more hidden output"
```

### Problem Creation API Structure

#### Single Problem Creation
```json
POST /api/problems/
{
  "contest": 1,
  "title": "Two Sum Problem",
  "statement": "Given an array of integers, return indices of the two numbers that add up to a specific target.",
  "difficulty": "Easy",
  "points": 100,
  "time_limit": 2000,
  "memory_limit": 128000,
  "max_submissions": 10,
  "allow_multiple_languages": true,
  "default_language_id": 54
}
```

#### Bulk Problem Creation
```json
POST /api/contests/{contest_id}/problems/
{
  "problems": [
    {
      "title": "Two Sum",
      "statement": "Find two numbers that add up to target",
      "difficulty": "Easy",
      "points": 100,
      "time_limit": 2000,
      "memory_limit": 128000,
      "test_cases": [
        {
          "name": "Sample Test",
          "input_data": "2 7 11 15\n9",
          "expected_output": "0 1",
          "is_sample": true,
          "is_public": true
        },
        {
          "name": "Hidden Test 1",
          "input_data": "3 2 4\n6",
          "expected_output": "1 2",
          "is_sample": false,
          "is_public": false
        }
      ]
    }
  ]
}
```

### Test Case Structure

#### Sample Test Case (User Visible)
```json
{
  "name": "Sample Test Case",
  "input_data": "2 7 11 15\n9",
  "expected_output": "0 1",
  "is_sample": true,
  "is_public": true,
  "order": 1
}
```

#### Hidden Test Case (Judging Only)
```json
{
  "name": "Hidden Test Case 1",
  "input_data": "3 2 4\n6",
  "expected_output": "1 2",
  "is_sample": false,
  "is_public": false,
  "order": 2
}
```

### Problem Submission Structure

#### User Submission
```json
POST /api/problems/{problem_id}/submit/
{
  "language_id": 54,  // Python 3
  "source_code": "def twoSum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []",
  "stdin": "2 7 11 15\n9",
  "expected_output": "0 1"
}
```

#### Judge0 Processing
1. **Submission Creation**: Store submission in database
2. **Language Mapping**: Map to Judge0 language ID
3. **Code Execution**: Send to Judge0 API
4. **Status Updates**: Monitor submission status
5. **Result Processing**: Update submission with results
6. **Test Case Validation**: Run against all test cases
7. **Final Status**: Determine Accepted/Rejected status

---

## Authentication & Authorization

### JWT Authentication Flow

#### 1. Login Process
```
User Credentials → Django Authentication → JWT Generation → Token Storage
```

#### 2. Token Structure
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

#### 3. Token Usage
- Include JWT token in Authorization header
- Format: `Authorization: Bearer <token>`
- Token contains user role and permissions

### Role-Based Access Control

#### Admin Permissions
- Create, read, update, delete contests
- Create, read, update, delete problems
- Manage test cases
- View all submissions and analytics
- Monitor user activities
- Run plagiarism detection
- Access admin dashboard

#### Student Permissions
- View published contests
- Read problem statements
- Submit solutions
- View own submissions
- View sample test cases
- Limited analytics access

### Permission Classes

#### IsAdminUser
```python
class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'
```

#### IsContestCreator
```python
class IsContestCreator(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Contest):
            return obj.created_by == request.user
        elif isinstance(obj, Problem):
            return obj.contest.created_by == request.user
        return False
```

### Session Management

#### Single-Device Session
- Each admin can have only one active session
- Session key stored in UserSession model
- New login invalidates previous sessions
- JWT tokens include session identifier

#### Session Validation
```python
# Check if user session is valid
def validate_session(user, token):
    try:
        session = UserSession.objects.get(user=user)
        return session.session_key == extract_session_key(token)
    except UserSession.DoesNotExist:
        return False
```

---

## Security Features

### IP Address Tracking

#### Submission IP Logging
- Store user's IP address with each submission
- Track multiple IP addresses per user
- Detect suspicious IP changes

#### IP Address Analysis
```python
# Track IP addresses for security monitoring
def track_user_ip(user, ip_address):
    submission = Submission.objects.filter(user=user)
    ip_addresses = submission.values_list('ip_address', flat=True).distinct()
    
    if len(ip_addresses) > 1:
        # Flag for suspicious activity
        log_security_event(user, 'multiple_ip_addresses', ip_addresses)
```

### User Activity Monitoring

#### Keystroke Tracking
- Count keystrokes during coding sessions
- Track typing patterns
- Detect unusual typing behavior

#### Browser Behavior
- Monitor tab switches
- Track browser focus loss
- Detect copy-paste events

#### Activity Logging
```python
# Log user activities for security analysis
def log_user_activity(user, problem, activity_type, details):
    UserActivity.objects.create(
        user=user,
        problem=problem,
        session_id=request.session.session_key,
        activity_type=activity_type,
        details=details
    )
```

### Plagiarism Detection

#### Code Similarity Analysis
- Compare submissions using multiple algorithms
- Calculate similarity scores
- Flag suspicious submissions

#### Detection Methods
1. **Levenshtein Distance**: String similarity
2. **Token-based Comparison**: Code token matching
3. **AST Comparison**: Abstract syntax tree analysis

#### Plagiarism Workflow
```
Submissions → Code Normalization → Similarity Calculation → Threshold Check → Flagging
```

### Data Protection

#### Sensitive Data Handling
- Hidden test case outputs are never exposed
- User passwords are properly hashed
- JWT tokens have expiration times
- API responses are sanitized

#### Input Validation
```python
# Validate user inputs to prevent injection attacks
def validate_submission_data(data):
    allowed_languages = [54, 62, 71]  # Python, Java, C++
    
    if data.get('language_id') not in allowed_languages:
        raise ValidationError("Unsupported programming language")
    
    if len(data.get('source_code', '')) > 100000:
        raise ValidationError("Source code too long")
```

---

## Analytics & Monitoring

### Submission Analytics

#### Key Metrics
- **Total Submissions**: Number of code submissions
- **Success Rate**: Percentage of accepted submissions
- **Average Time**: Average execution time
- **Language Distribution**: Usage by programming language
- **User Participation**: Active users per contest

#### Analytics Dashboard Components
```javascript
// Frontend analytics components
const analyticsComponents = {
  submissionChart: 'Submission trends over time',
  successRateChart: 'Success rate by problem difficulty',
  languageChart: 'Programming language distribution',
  userActivityChart: 'User participation metrics',
  performanceChart: 'System performance metrics'
};
```

#### User Activity Monitoring

#### Activity Tracking
- **Session Duration**: Time spent on problems
- **Code Changes**: Number of code modifications
- **Keystroke Patterns**: Typing behavior analysis
- **Browser Events**: Tab switches, focus changes

#### Security Metrics
- **Suspicious Activities**: Flagged behaviors
- **IP Address Changes**: Multiple IP usage
- **Copy-Paste Events**: Code copying detection
- **Unusual Patterns**: Anomalous behavior

#### Real-time Monitoring
```python
# Real-time activity monitoring
def monitor_user_activity(user, problem):
    activities = UserActivity.objects.filter(
        user=user,
        problem=problem
    ).order_by('-last_activity')
    
    # Calculate risk score
    risk_score = calculate_risk_score(activities)
    
    if risk_score > THRESHOLD:
        send_security_alert(user, risk_score)
```

### Performance Monitoring

#### System Metrics
- **API Response Times**: Backend performance
- **Database Queries**: Query optimization
- **Judge0 API Calls**: External service performance
- **Frontend Load Times**: User experience metrics

#### Error Tracking
- **Submission Failures**: Failed code executions
- **API Errors**: Backend error rates
- **Frontend Errors**: Client-side issues
- **System Errors**: Infrastructure problems

---

## Plagiarism Detection

### Detection Algorithms

#### 1. Levenshtein Distance
```python
def levenshtein_similarity(code1, code2):
    distance = levenshtein_distance(code1, code2)
    max_length = max(len(code1), len(code2))
    return (1 - distance / max_length) * 100
```

#### 2. Token-based Comparison
```python
def tokenize_code(code):
    # Remove comments and whitespace
    code = re.sub(r'#.*', '', code)
    code = re.sub(r'\s+', ' ', code)
    
    # Tokenize by operators and identifiers
    tokens = re.findall(r'[a-zA-Z_]\w*|[+\-*/%=<>!&|^~]+|\d+|\S', code)
    return tokens
```

#### 3. AST Comparison
```python
def ast_similarity(code1, code2):
    try:
        tree1 = ast.parse(code1)
        tree2 = ast.parse(code2)
        
        # Compare AST structures
        similarity = compare_ast_structures(tree1, tree2)
        return similarity
    except:
        return 0
```

### Detection Workflow

#### 1. Code Normalization
```python
def normalize_code(code):
    # Remove comments
    code = re.sub(r'#.*', '', code)
    
    # Normalize whitespace
    code = re.sub(r'\s+', ' ', code)
    
    # Normalize variable names
    code = normalize_variable_names(code)
    
    return code.strip()
```

#### 2. Similarity Calculation
```python
def calculate_similarity(submission1, submission2):
    code1 = normalize_code(submission1.source_code)
    code2 = normalize_code(submission2.source_code)
    
    # Calculate multiple similarity metrics
    levenshtein_score = levenshtein_similarity(code1, code2)
    token_score = token_similarity(code1, code2)
    ast_score = ast_similarity(code1, code2)
    
    # Weighted average
    final_score = (
        levenshtein_score * 0.3 +
        token_score * 0.5 +
        ast_score * 0.2
    )
    
    return final_score
```

#### 3. Threshold-based Flagging
```python
def flag_plagiarism(similarity_score, threshold=70):
    if similarity_score >= threshold:
        return {
            'flagged': True,
            'severity': 'high' if similarity_score >= 90 else 'medium',
            'confidence': similarity_score
        }
    return {'flagged': False}
```

### Plagiarism Management

#### Review Process
```
Detection → Flagging → Admin Review → Decision → Action
```

#### Admin Actions
- **Mark as Reviewed**: Confirm review completion
- **Dismiss**: Clear false positives
- **Warn**: Issue warning to user
- **Disqualify**: Remove user from contest

#### Reporting
```python
def generate_plagiarism_report(contest):
    flagged_submissions = PlagiarismCheck.objects.filter(
        submission1__problem__contest=contest,
        similarity_score__gte=70
    )
    
    report = {
        'total_flagged': flagged_submissions.count(),
        'high_similarity': flagged_submissions.filter(similarity_score__gte=90).count(),
        'reviewed_count': flagged_submissions.filter(reviewed=True).count(),
        'pending_review': flagged_submissions.filter(reviewed=False).count()
    }
    
    return report
```

---

## Production Deployment

### Environment Configuration

#### Environment Variables
```bash
# Django Settings
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@localhost/dbname

# Judge0 API
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your-judge0-api-key

# CORS Settings
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
```

### Database Setup

#### PostgreSQL Configuration
```sql
-- Create database and user
CREATE DATABASE contest_platform;
CREATE USER contest_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE contest_platform TO contest_user;

-- Enable necessary extensions
CREATE EXTENSION pg_trgm;
CREATE EXTENSION pg_stat_statements;
```

#### Database Optimization
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'contest_platform',
        'USER': 'contest_user',
        'PASSWORD': 'secure_password',
        'HOST': 'localhost',
        'PORT': '5432',
        'OPTIONS': {
            'sslmode': 'require',
        },
        'CONN_MAX_AGE': 60,
    }
}
```

### Web Server Configuration

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Gunicorn Configuration
```bash
# gunicorn.service
[Unit]
Description=Contest Platform Gunicorn Daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/contest-platform
ExecStart=/path/to/venv/bin/gunicorn --workers 3 --bind unix:/run/gunicorn.sock core.wsgi:application

[Install]
WantedBy=multi-user.target
```

### Security Configuration

#### SSL/TLS Setup
```bash
# Generate SSL certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

#### Firewall Configuration
```bash
# UFW configuration
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Monitoring and Logging

#### Application Monitoring
```python
# logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/contest-platform/app.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

#### Performance Monitoring
```bash
# Install monitoring tools
sudo apt-get install htop iotop nethogs

# Database monitoring
sudo apt-get install pgtop
```

### Backup Strategy

#### Database Backups
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump contest_platform > $BACKUP_DIR/backup_$DATE.sql

# Keep last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

#### Media Backups
```bash
# Backup media files
rsync -av /path/to/media/ /backups/media/
```

### Deployment Checklist

#### Pre-deployment
- [ ] Update environment variables
- [ ] Configure database settings
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Create database backups
- [ ] Test all API endpoints
- [ ] Verify frontend build

#### Post-deployment
- [ ] Monitor application logs
- [ ] Test user authentication
- [ ] Verify Judge0 API integration
- [ ] Check email notifications
- [ ] Monitor system resources
- [ ] Test backup restoration
- [ ] Verify SSL configuration

### Scaling Considerations

#### Horizontal Scaling
- Load balancer for multiple app servers
- Database read replicas
- Content delivery network (CDN)
- Redis for session storage

#### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching strategies
- Use connection pooling

---

## Class Diagram

```mermaid
classDiagram
    class User {
        +id: AutoField
        +username: CharField
        +email: EmailField
        +password: CharField
        +role: CharField
        +first_name: CharField
        +last_name: CharField
        +is_active: BooleanField
        +is_staff: BooleanField
        +is_superuser: BooleanField
        +date_joined: DateTimeField
        +last_login: DateTimeField
        +create_contest()
        +submit_solution()
        +view_analytics()
    }

    class UserSession {
        +id: AutoField
        +user: ForeignKey
        +session_key: CharField
        +created_at: DateTimeField
        +validate_session()
    }

    class Contest {
        +id: AutoField
        +title: CharField
        +description: TextField
        +start_time: DateTimeField
        +end_time: DateTimeField
        +created_by: ForeignKey
        +add_problem()
        +remove_problem()
        +get_statistics()
    }

    class Problem {
        +id: AutoField
        +contest: ForeignKey
        +title: CharField
        +statement: TextField
        +difficulty: CharField
        +points: IntegerField
        +time_limit: IntegerField
        +memory_limit: IntegerField
        +max_submissions: IntegerField
        +add_test_case()
        +validate_submission()
    }

    class TestCase {
        +id: AutoField
        +problem: ForeignKey
        +name: CharField
        +input_data: TextField
        +expected_output: TextField
        +is_sample: BooleanField
        +is_public: BooleanField
        +order: IntegerField
        +validate_output()
    }

    class Submission {
        +id: AutoField
        +problem: ForeignKey
        +user: ForeignKey
        +language_id: IntegerField
        +source_code: TextField
        +status: CharField
        +stdout: TextField
        +stderr: TextField
        +time: FloatField
        +memory: IntegerField
        +submitted_at: DateTimeField
        +ip_address: GenericIPAddressField
        +execute_code()
        +check_plagiarism()
    }

    class UserActivity {
        +id: AutoField
        +user: ForeignKey
        +problem: ForeignKey
        +session_id: CharField
        +started_at: DateTimeField
        +total_time_spent: IntegerField
        +code_changes: JSONField
        +keystroke_patterns: JSONField
        +track_activity()
        +calculate_risk_score()
    }

    class PlagiarismCheck {
        +id: AutoField
        +submission1: ForeignKey
        +submission2: ForeignKey
        +similarity_score: FloatField
        +algorithm_used: CharField
        +details: JSONField
        +reviewed: BooleanField
        +calculate_similarity()
        +flag_suspicious()
    }

    User "1" -- "1" UserSession
    User "1" -- "N" Contest
    User "1" -- "N" Submission
    User "1" -- "N" UserActivity
    
    Contest "1" -- "N" Problem
    Problem "1" -- "N" TestCase
    Problem "1" -- "N" Submission
    
    Submission "1" -- "N" PlagiarismCheck
    Submission "1" -- "1" UserActivity
    
    UserActivity "1" -- "1" Problem
```

## Flow Diagrams

### Contest Creation Flow
```mermaid
flowchart TD
    A[Admin Login] --> B[JWT Authentication]
    B --> C[Create Contest Form]
    C --> D[Validate Contest Data]
    D --> E[Save Contest to DB]
    E --> F[Add Problems to Contest]
    F --> G[Configure Test Cases]
    G --> H[Review Contest]
    H --> I[Publish Contest]
    I --> J[User Access Enabled]
```

### Problem Submission Flow
```mermaid
flowchart TD
    A[User Selects Problem] --> B[View Problem Details]
    B --> C[Write Solution Code]
    C --> D[Select Programming Language]
    D --> E[Submit Solution]
    E --> F[Validate Submission]
    F --> G[Send to Judge0 API]
    G --> H[Execute Code]
    H --> I[Run Test Cases]
    I --> J[Generate Results]
    J --> K[Update Submission Status]
    K --> L[Display Results to User]
```

### Plagiarism Detection Flow
```mermaid
flowchart TD
    A[New Submission] --> B[Store in Database]
    B --> C[Normalize Code]
    C --> D[Compare with Existing Submissions]
    D --> E[Calculate Similarity Scores]
    E --> F[Check Threshold]
    F --> G{Score >= 70%?}
    G -->|Yes| H[Flag for Review]
    G -->|No| I[Mark as Clean]
    H --> J[Admin Review]
    J --> K{Confirmed Plagiarism?}
    K -->|Yes| L[Take Action]
    K -->|No| M[Dismiss Flag]
```

### User Authentication Flow
```mermaid
flowchart TD
    A[User Enters Credentials] --> B[Send Login Request]
    B --> C[Validate Credentials]
    C --> D{Valid?}
    D -->|No| E[Return Error]
    D -->|Yes| F[Check User Role]
    F --> G[Generate JWT Token]
    G --> H[Create User Session]
    H --> I[Return Token + User Data]
    I --> J[Store in Frontend]
    J --> K[Redirect to Dashboard]
```

### Analytics Monitoring Flow
```mermaid
flowchart TD
    A[User Activity] --> B[Track Events]
    B --> C[Store Activity Data]
    C --> D[Process Analytics]
    D --> E[Calculate Metrics]
    E --> F[Generate Reports]
    F --> G[Display on Dashboard]
    G --> H[Admin Reviews]
    H --> I[Take Actions if Needed]
```

---

## Conclusion

This comprehensive documentation covers all aspects of the Coding Contest Platform admin functionality. The system is designed with security, scalability, and maintainability in mind, providing a robust foundation for conducting online coding competitions.

Key features include:
- Role-based access control
- Real-time code execution with Judge0
- Comprehensive analytics and monitoring
- Advanced plagiarism detection
- Production-ready deployment configuration

The platform is ready for deployment and can handle multiple concurrent users while maintaining security and performance standards.
