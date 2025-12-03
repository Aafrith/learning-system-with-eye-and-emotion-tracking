# API Test Examples

## Test with Python requests library

```python
import requests

BASE_URL = "http://localhost:8000"

# 1. Login as Teacher
login_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"email": "teacher@example.com", "password": "teacher123"}
)
login_data = login_response.json()
teacher_token = login_data["access_token"]
teacher_id = login_data["user"]["id"]

print("Teacher Token:", teacher_token)
print("Teacher ID:", teacher_id)

# 2. Create a Session
headers = {"Authorization": f"Bearer {teacher_token}"}
session_response = requests.post(
    f"{BASE_URL}/api/sessions/create",
    headers=headers,
    json={"subject": "Mathematics 101", "max_students": 30}
)
session_data = session_response.json()
session_id = session_data["id"]
session_code = session_data["session_code"]

print("\nSession Created:")
print(f"  ID: {session_id}")
print(f"  Code: {session_code}")

# 3. Start the Session
start_response = requests.post(
    f"{BASE_URL}/api/sessions/{session_id}/start",
    headers=headers
)
print("\nSession Started:", start_response.json())

# 4. Login as Student
student_login = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"email": "student@example.com", "password": "student123"}
)
student_data = student_login.json()
student_token = student_data["access_token"]
student_id = student_data["user"]["id"]

print("\nStudent Token:", student_token)
print("Student ID:", student_id)

# 5. Student Joins Session
student_headers = {"Authorization": f"Bearer {student_token}"}
join_response = requests.post(
    f"{BASE_URL}/api/sessions/join",
    headers=student_headers,
    json={"session_code": session_code}
)
print("\nStudent Joined Session:", join_response.json())

# 6. Get Session Details
session_details = requests.get(
    f"{BASE_URL}/api/sessions/{session_id}",
    headers=headers
)
print("\nSession Details:", session_details.json())

# 7. Update Engagement Data
engagement_response = requests.post(
    f"{BASE_URL}/api/sessions/{session_id}/engagement",
    headers=student_headers,
    json={
        "student_id": student_id,
        "session_id": session_id,
        "emotion": "happy",
        "engagement": "active",
        "focus_level": 85,
        "timestamp": "2024-01-01T00:00:00"
    }
)
print("\nEngagement Updated:", engagement_response.json())

# 8. Get Teacher's Sessions
teacher_sessions = requests.get(
    f"{BASE_URL}/api/sessions/teacher",
    headers=headers
)
print("\nTeacher Sessions:", teacher_sessions.json())

# 9. Get Student's Sessions
student_sessions = requests.get(
    f"{BASE_URL}/api/sessions/student",
    headers=student_headers
)
print("\nStudent Sessions:", student_sessions.json())

# 10. Admin Stats (Login as Admin first)
admin_login = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"email": "admin@example.com", "password": "admin123"}
)
admin_token = admin_login.json()["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}

stats = requests.get(
    f"{BASE_URL}/api/admin/stats",
    headers=admin_headers
)
print("\nSystem Stats:", stats.json())
```

## Test with curl

### 1. Login
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"teacher123"}'
```

### 2. Create Session (replace TOKEN)
```bash
curl -X POST "http://localhost:8000/api/sessions/create" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Mathematics","max_students":30}'
```

### 3. Start Session (replace TOKEN and SESSION_ID)
```bash
curl -X POST "http://localhost:8000/api/sessions/SESSION_ID/start" \
  -H "Authorization: Bearer TOKEN"
```

### 4. Join Session (replace STUDENT_TOKEN and SESSION_CODE)
```bash
curl -X POST "http://localhost:8000/api/sessions/join" \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_code":"SESSION_CODE"}'
```

### 5. Get Session Details
```bash
curl -X GET "http://localhost:8000/api/sessions/SESSION_ID" \
  -H "Authorization: Bearer TOKEN"
```

## Test with JavaScript/Fetch

```javascript
const BASE_URL = 'http://localhost:8000';

// 1. Login
async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
}

// 2. Create Session
async function createSession(token, subject, maxStudents) {
  const response = await fetch(`${BASE_URL}/api/sessions/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ subject, max_students: maxStudents })
  });
  return response.json();
}

// 3. Join Session
async function joinSession(token, sessionCode) {
  const response = await fetch(`${BASE_URL}/api/sessions/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ session_code: sessionCode })
  });
  return response.json();
}

// Usage
(async () => {
  // Teacher login
  const teacherData = await login('teacher@example.com', 'teacher123');
  console.log('Teacher:', teacherData);
  
  // Create session
  const session = await createSession(
    teacherData.access_token,
    'Math Class',
    30
  );
  console.log('Session:', session);
  
  // Student login
  const studentData = await login('student@example.com', 'student123');
  console.log('Student:', studentData);
  
  // Join session
  const joined = await joinSession(
    studentData.access_token,
    session.session_code
  );
  console.log('Joined:', joined);
})();
```

## WebSocket Test

```javascript
// Test WebSocket Connection (in browser console or Node.js)
const sessionId = 'YOUR_SESSION_ID';
const teacherId = 'YOUR_TEACHER_ID';

const ws = new WebSocket(`ws://localhost:8000/ws/session/${sessionId}/teacher/${teacherId}`);

ws.onopen = () => {
  console.log('WebSocket Connected');
  
  // Send a ping
  ws.send(JSON.stringify({ type: 'ping' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket Error:', error);
};

ws.onclose = () => {
  console.log('WebSocket Disconnected');
};
```

## Quick Test Script

Save this as `test_api.py` and run it:

```python
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    response = requests.get(f"{BASE_URL}/health")
    print("✓ Health Check:", response.json())

def test_login():
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "teacher@example.com", "password": "teacher123"}
    )
    if response.status_code == 200:
        print("✓ Login Success")
        return response.json()
    else:
        print("✗ Login Failed:", response.json())
        return None

def test_signup():
    response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={
            "email": "newuser@example.com",
            "name": "New User",
            "role": "student",
            "password": "password123"
        }
    )
    if response.status_code == 201:
        print("✓ Signup Success")
    else:
        print("Note: User might already exist")

if __name__ == "__main__":
    print("Testing Learning System API\n")
    test_health()
    test_signup()
    login_data = test_login()
    
    if login_data:
        print(f"\nAccess Token: {login_data['access_token'][:50]}...")
        print(f"User: {login_data['user']['name']} ({login_data['user']['role']})")
```

Run with:
```bash
python test_api.py
```
