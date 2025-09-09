# 🚀 Judge0 Integration Testing Guide

## 📋 **Quick Start**

### **Step 1: Start Your Django Server**
```bash
python manage.py runserver
```

### **Step 2: Start Judge0 (if you have it installed)**
```bash
# If you have Judge0 installed via Docker
docker run -d -p 2358:2358 judge0/judge0:latest

# Or if you have it installed locally
judge0-server
```

### **Step 3: Run the Test Script**
```bash
python test_judge0_integration.py
```

## 🎯 **How to Add Problems to a Contest**

### **Method 1: Using Django Management Command (Recommended)**

I've created a management command that automatically sets up test problems:

```bash
# Create a new contest with test problems
python manage.py create_test_problem

# Add problems to an existing contest
python manage.py create_test_problem --contest-id 1
```

This will create:
- ✅ Admin user (username: `admin`, password: `admin123`)
- ✅ Test contest with 3 problems
- ✅ Multiple test cases per problem
- ✅ Proper Judge0 configuration

### **Method 2: Using the API**

#### **Create a Contest:**
```bash
curl -X POST http://localhost:8000/api/contests/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "My Test Contest",
    "description": "Testing Judge0 integration",
    "start_time": "2024-01-01T10:00:00Z",
    "end_time": "2024-12-31T23:59:59Z"
  }'
```

#### **Add Problems to Contest:**
```bash
curl -X POST http://localhost:8000/api/contests/1/problems/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "problems": [
      {
        "title": "Hello World",
        "statement": "Write a program that prints Hello, World!",
        "difficulty": "Easy",
        "points": 10,
        "time_limit": 1000,
        "memory_limit": 512000,
        "cpu_time_limit": 1000,
        "enable_network": false,
        "max_submissions": 5,
        "allow_multiple_languages": true,
        "default_language_id": 54
      }
    ]
  }'
```

### **Method 3: Using Django Admin Interface**

1. **Access Django Admin:**
   ```
   http://localhost:8000/admin/
   Username: admin
   Password: admin123
   ```

2. **Navigate to Contests → Problems → Add Problem**

3. **Fill in the details:**
   - Contest: Select your contest
   - Title: "Test Problem"
   - Statement: Problem description
   - Difficulty: Easy/Medium/Hard
   - Points: 10
   - Judge0 settings (time_limit, memory_limit, etc.)

4. **Add Test Cases:**
   - Click "Add another Test case"
   - Name: "Sample Test"
   - Input data: "5 3"
   - Expected output: "8"
   - Check "Is sample" and "Is public"

## 🧪 **Testing the Judge0 Integration**

### **Test 1: Get Problem Details**
```bash
curl -X GET http://localhost:8000/api/problems/1/detail/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "id": 1,
  "title": "Hello World",
  "statement": "Write a program that prints Hello, World!",
  "difficulty": "Easy",
  "points": 10,
  "time_limit": 1000,
  "memory_limit": 512000,
  "sample_test_cases": [
    {
      "id": 1,
      "name": "Sample Test",
      "input_data": "",
      "is_sample": true,
      "is_public": true,
      "order": 1
    }
  ]
}
```

### **Test 2: Submit a Solution**
```bash
curl -X POST http://localhost:8000/api/problems/1/submit/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "language_id": 54,
    "source_code": "print(\"Hello, World!\")",
    "stdin": ""
  }'
```

**Expected Response:**
```json
{
  "detail": "Submission sent to Judge0",
  "submission_id": 1,
  "judge0_token": "abc123..."
}
```

### **Test 3: Check Submission Status**
```bash
curl -X GET http://localhost:8000/api/submissions/1/status/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "id": 1,
  "problem": 1,
  "user": 1,
  "language_id": 54,
  "source_code": "print(\"Hello, World!\")",
  "status": "Accepted",
  "stdout": "Hello, World!",
  "stderr": "",
  "time": 0.123,
  "memory": 1024,
  "submitted_at": "2024-01-01T10:00:00Z"
}
```

## 🔧 **Judge0 Language IDs**

Common programming languages supported by Judge0:

| Language | ID | Example |
|----------|----|---------|
| Python 3 | 54 | `print("Hello")` |
| C++ | 54 | `#include <iostream>` |
| Java | 62 | `public class Main` |
| JavaScript | 63 | `console.log("Hello")` |
| C | 50 | `#include <stdio.h>` |

## 🛠️ **Troubleshooting**

### **Issue: Judge0 Connection Failed**
```bash
# Check if Judge0 is running
curl http://localhost:2358/status

# If not running, start it:
docker run -d -p 2358:2358 judge0/judge0:latest
```

### **Issue: Authentication Failed**
```bash
# Get a new token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### **Issue: Problem Not Found**
```bash
# List all problems
curl -X GET http://localhost:8000/api/problems/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 **Admin Features**

### **View All Submissions**
```bash
# Get all submissions for a problem
curl -X GET http://localhost:8000/api/problems/1/submissions/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### **View Test Cases (Admin Only)**
```bash
# Get problem with all test case details
curl -X GET http://localhost:8000/api/problems/1/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🎯 **Security Features**

✅ **Expected output is never exposed to users**
✅ **Users can only see sample/public test cases**
✅ **Submission limits are enforced per problem**
✅ **Users can only view their own submissions**
✅ **Admin can see all test case details**

## 🚀 **Next Steps**

1. **Test with different languages** (C++, Java, JavaScript)
2. **Create more complex problems** with multiple test cases
3. **Test edge cases** (time limits, memory limits, compilation errors)
4. **Integrate with your frontend** to create a complete coding platform
5. **Set up Judge0 in production** with proper security

## 📝 **API Endpoints Summary**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/contests/` | POST | Create contest |
| `/api/contests/{id}/problems/` | POST | Add problems to contest |
| `/api/problems/{id}/detail/` | GET | Get problem details (user) |
| `/api/problems/{id}/submit/` | POST | Submit solution |
| `/api/submissions/{id}/status/` | GET | Check submission status |
| `/api/problems/` | GET | List problems (admin) |
| `/api/testcases/` | POST | Create test cases (admin) |

---

**🎉 You're now ready to test the Judge0 integration!** 