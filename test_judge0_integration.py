#!/usr/bin/env python3
"""
Test script for Judge0 integration
This script helps you test the backend Judge0 integration
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8000/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def get_auth_token(username, password):
    """Get JWT token for authentication"""
    response = requests.post(f"{BASE_URL}/auth/token/", {
        "username": username,
        "password": password
    })
    
    if response.status_code == 200:
        return response.json()["access"]
    else:
        print(f"Login failed: {response.text}")
        return None

def test_problem_creation():
    """Test creating problems via API"""
    print("🔧 Testing Problem Creation...")
    
    # Get admin token
    token = get_auth_token(ADMIN_USERNAME, ADMIN_PASSWORD)
    if not token:
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Create a contest
    contest_data = {
        "title": "API Test Contest",
        "description": "Testing problem creation via API",
        "start_time": "2024-01-01T10:00:00Z",
        "end_time": "2024-12-31T23:59:59Z"
    }
    
    response = requests.post(f"{BASE_URL}/contests/", 
                           json=contest_data, headers=headers)
    
    if response.status_code == 201:
        contest = response.json()
        contest_id = contest["id"]
        print(f"✅ Created contest: {contest['title']} (ID: {contest_id})")
        
        # Add problems to the contest
        problems_data = {
            "problems": [
                {
                    "title": "API Test Problem",
                    "statement": "Write a program that prints 'API Test Success!'",
                    "difficulty": "Easy",
                    "points": 10,
                    "time_limit": 1000,
                    "memory_limit": 512000,
                    "cpu_time_limit": 1000,
                    "enable_network": False,
                    "max_submissions": 5,
                    "allow_multiple_languages": True,
                    "default_language_id": 54
                }
            ]
        }
        
        response = requests.post(f"{BASE_URL}/contests/{contest_id}/problems/",
                               json=problems_data, headers=headers)
        
        if response.status_code == 201:
            print("✅ Successfully added problems to contest")
            return contest_id
        else:
            print(f"❌ Failed to add problems: {response.text}")
    else:
        print(f"❌ Failed to create contest: {response.text}")
    
    return None

def test_problem_retrieval(contest_id=None):
    """Test retrieving problem details"""
    print("\n📖 Testing Problem Retrieval...")
    
    # Get admin token
    token = get_auth_token(ADMIN_USERNAME, ADMIN_PASSWORD)
    if not token:
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get contest details
    if contest_id:
        response = requests.get(f"{BASE_URL}/contests/{contest_id}/", headers=headers)
        if response.status_code == 200:
            contest = response.json()
            print(f"✅ Retrieved contest: {contest['title']}")
            print(f"   Problems: {len(contest['problems'])}")
            
            for problem in contest['problems']:
                print(f"   - {problem['title']} (ID: {problem['id']})")
                return problem['id']
    
    # Fallback: get first available problem
    response = requests.get(f"{BASE_URL}/problems/", headers=headers)
    if response.status_code == 200:
        problems = response.json()
        if problems:
            problem_id = problems[0]['id']
            print(f"✅ Found problem: {problems[0]['title']} (ID: {problem_id})")
            return problem_id
    
    print("❌ No problems found")
    return None

def test_problem_submission(problem_id):
    """Test submitting a solution to a problem"""
    print(f"\n🚀 Testing Problem Submission (Problem ID: {problem_id})...")
    
    # Get admin token
    token = get_auth_token(ADMIN_USERNAME, ADMIN_PASSWORD)
    if not token:
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Submit a Python solution
    submission_data = {
        "language_id": 54,  # Python3
        "source_code": "print('Hello, World!')",
        "stdin": ""
    }
    
    response = requests.post(f"{BASE_URL}/problems/{problem_id}/submit/",
                           json=submission_data, headers=headers)
    
    if response.status_code == 201:
        result = response.json()
        submission_id = result.get("submission_id")
        judge0_token = result.get("judge0_token")
        
        print(f"✅ Submission created successfully!")
        print(f"   Submission ID: {submission_id}")
        print(f"   Judge0 Token: {judge0_token}")
        
        return submission_id
    else:
        print(f"❌ Submission failed: {response.text}")
        return None

def test_submission_status(submission_id):
    """Test checking submission status"""
    print(f"\n📊 Testing Submission Status (Submission ID: {submission_id})...")
    
    # Get admin token
    token = get_auth_token(ADMIN_USERNAME, ADMIN_PASSWORD)
    if not token:
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Check status multiple times
    for i in range(5):
        response = requests.get(f"{BASE_URL}/submissions/{submission_id}/status/",
                              headers=headers)
        
        if response.status_code == 200:
            submission = response.json()
            status = submission.get("status", "Unknown")
            print(f"   Attempt {i+1}: Status = {status}")
            
            if status in ["Accepted", "Wrong Answer", "Compilation Error", "Runtime Error"]:
                print(f"✅ Final status: {status}")
                if submission.get("stdout"):
                    print(f"   Output: {submission['stdout']}")
                if submission.get("stderr"):
                    print(f"   Error: {submission['stderr']}")
                if submission.get("time"):
                    print(f"   Time: {submission['time']}s")
                if submission.get("memory"):
                    print(f"   Memory: {submission['memory']} bytes")
                return
            elif status in ["In Queue", "Processing"]:
                print("   ⏳ Still processing...")
                time.sleep(2)  # Wait 2 seconds before next check
            else:
                print(f"   ❌ Unexpected status: {status}")
                return
        else:
            print(f"❌ Failed to get status: {response.text}")
            return

def main():
    """Main test function"""
    print("🧪 Judge0 Integration Test Suite")
    print("=" * 50)
    
    # Test 1: Problem Creation
    contest_id = test_problem_creation()
    
    # Test 2: Problem Retrieval
    problem_id = test_problem_retrieval(contest_id)
    
    if problem_id:
        # Test 3: Problem Submission
        submission_id = test_problem_submission(problem_id)
        
        if submission_id:
            # Test 4: Submission Status
            test_submission_status(submission_id)
    
    print("\n" + "=" * 50)
    print("🎉 Test suite completed!")
    print("\n📝 Next Steps:")
    print("1. Make sure Judge0 is running on http://localhost:2358")
    print("2. Test with different programming languages")
    print("3. Test with different problem types")
    print("4. Check the Django admin interface for detailed results")

if __name__ == "__main__":
    main() 