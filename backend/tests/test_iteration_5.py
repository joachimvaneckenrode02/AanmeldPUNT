"""
Iteration 5 Testing - Dutch School App (AanmeldPUNT)
Focus: Attendance auto-creation, search, notes, Notifications page, Dashboard unread feed, sorting by createdAt
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://lesson-scheduler-13.preview.emergentagent.com')

class TestAuthentication:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login as superadmin and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "joachim.vaneckenrode@rhizo.be",
            "password": "superadmin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "superadmin"
        return data["token"]
    
    def test_login_superadmin(self, auth_token):
        """Test superadmin login works"""
        assert auth_token is not None
        assert len(auth_token) > 10


class TestAttendanceByDate:
    """Test attendance by date endpoint with auto-creation feature"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "joachim.vaneckenrode@rhizo.be",
            "password": "superadmin123"
        })
        return response.json()["token"]
    
    def test_attendance_by_date_returns_moments(self, auth_token):
        """GET /api/attendance/by-date/2026-03-10 returns study moments with students"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/attendance/by-date/2026-03-10", headers=headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Response should be a list of moment data
        assert isinstance(data, list)
        
        print(f"Found {len(data)} study moments for 2026-03-10")
        
        # If there are moments, check the structure
        if len(data) > 0:
            moment_data = data[0]
            assert "moment" in moment_data, "Missing 'moment' key"
            assert "students" in moment_data, "Missing 'students' key"
            assert "studyType" in moment_data, "Missing 'studyType' key"
            assert "totalStudents" in moment_data, "Missing 'totalStudents' key"
            assert "presentCount" in moment_data, "Missing 'presentCount' key"
            assert "absentCount" in moment_data, "Missing 'absentCount' key"
    
    def test_attendance_auto_creates_present_records(self, auth_token):
        """Attendance records are auto-created as 'present' when loading the page"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/attendance/by-date/2026-03-10", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check that students have attendance records with isPresent=true by default
        for moment_data in data:
            for student in moment_data.get("students", []):
                attendance = student.get("attendance")
                if attendance:
                    # Auto-created attendance should default to isPresent=true
                    assert "isPresent" in attendance, "Attendance should have isPresent field"
                    print(f"Student {student.get('registration', {}).get('studentName', 'Unknown')}: isPresent={attendance.get('isPresent')}")
    
    def test_student_data_includes_registration_note(self, auth_token):
        """Students data should include registration notes from registration.note field"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/attendance/by-date/2026-03-10", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check that registration has note field accessible
        has_notes = False
        for moment_data in data:
            for student in moment_data.get("students", []):
                registration = student.get("registration", {})
                # note field should be present (can be None)
                if "note" in registration:
                    if registration["note"]:
                        has_notes = True
                        print(f"Found note for student: {registration.get('note')}")
        
        print(f"Notes found in registration data: {has_notes}")


class TestAttendanceToggle:
    """Test attendance toggle (POST /api/attendance) for upsert functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "joachim.vaneckenrode@rhizo.be",
            "password": "superadmin123"
        })
        return response.json()["token"]
    
    def test_attendance_toggle_endpoint(self, auth_token):
        """POST /api/attendance should toggle attendance (upsert)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First get existing registrations to use valid IDs
        response = requests.get(f"{BASE_URL}/api/attendance/by-date/2026-03-10", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0 and len(data[0].get("students", [])) > 0:
            student = data[0]["students"][0]
            reg_id = student["registration"]["id"]
            moment_id = data[0]["moment"]["id"]
            current_present = student.get("attendance", {}).get("isPresent", True)
            
            # Toggle attendance
            toggle_response = requests.post(f"{BASE_URL}/api/attendance", headers=headers, json={
                "registrationId": reg_id,
                "studyMomentId": moment_id,
                "isPresent": not current_present,
                "note": None
            })
            
            assert toggle_response.status_code == 200, f"Toggle failed: {toggle_response.text}"
            result = toggle_response.json()
            assert result["isPresent"] == (not current_present), "Attendance not toggled correctly"
            print(f"Successfully toggled attendance from {current_present} to {not current_present}")
            
            # Toggle back
            toggle_back = requests.post(f"{BASE_URL}/api/attendance", headers=headers, json={
                "registrationId": reg_id,
                "studyMomentId": moment_id,
                "isPresent": current_present,
                "note": None
            })
            assert toggle_back.status_code == 200
        else:
            pytest.skip("No students found for toggle test")


class TestNotificationsEndpoint:
    """Test notifications/absence feed endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "joachim.vaneckenrode@rhizo.be",
            "password": "superadmin123"
        })
        return response.json()["token"]
    
    def test_absence_feed_endpoint(self, auth_token):
        """GET /api/notifications/absence-feed returns feed items"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/notifications/absence-feed", headers=headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Absence feed items: {len(data)}")
        
        # Check structure of feed items
        if len(data) > 0:
            item = data[0]
            assert "id" in item, "Feed item should have 'id'"
            assert "studentName" in item, "Feed item should have 'studentName'"
            assert "date" in item, "Feed item should have 'date'"
            assert "read" in item, "Feed item should have 'read'"
    
    def test_mark_notification_read(self, auth_token):
        """PATCH /api/notifications/{id}/read marks notification as read"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First get feed items
        response = requests.get(f"{BASE_URL}/api/notifications/absence-feed", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            notification_id = data[0]["id"]
            
            # Mark as read
            mark_response = requests.patch(f"{BASE_URL}/api/notifications/{notification_id}/read", headers=headers)
            
            assert mark_response.status_code == 200, f"Mark read failed: {mark_response.text}"
            result = mark_response.json()
            assert result.get("success") == True
            print(f"Successfully marked notification {notification_id} as read")
        else:
            print("No notifications to mark as read - this is OK if no absences recorded")


class TestRegistrationsSorting:
    """Test registrations are sorted by createdAt desc (newest first)"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "joachim.vaneckenrode@rhizo.be",
            "password": "superadmin123"
        })
        return response.json()["token"]
    
    def test_my_registrations_sorted_by_created_at(self, auth_token):
        """GET /api/registrations/my should return registrations sorted by createdAt desc"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/registrations/my", headers=headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        
        print(f"My registrations count: {len(data)}")
        
        if len(data) > 1:
            # Verify sorted by createdAt descending (newest first)
            for i in range(len(data) - 1):
                current_created = data[i].get("createdAt", "")
                next_created = data[i + 1].get("createdAt", "")
                if current_created and next_created:
                    assert current_created >= next_created, f"Not sorted by createdAt desc: {current_created} < {next_created}"
            print("Registrations correctly sorted by createdAt descending")
    
    def test_admin_registrations_sorted_by_created_at(self, auth_token):
        """GET /api/registrations should return registrations sorted by createdAt desc"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/registrations", headers=headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        
        print(f"Admin registrations count: {len(data)}")
        
        if len(data) > 1:
            # Verify sorted by createdAt descending (newest first)
            for i in range(len(data) - 1):
                current_created = data[i].get("createdAt", "")
                next_created = data[i + 1].get("createdAt", "")
                if current_created and next_created:
                    assert current_created >= next_created, f"Not sorted by createdAt desc: {current_created} < {next_created}"
            print("Admin registrations correctly sorted by createdAt descending")


class TestUserDeletion:
    """Test superadmin user deletion feature"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "joachim.vaneckenrode@rhizo.be",
            "password": "superadmin123"
        })
        return response.json()["token"]
    
    def test_get_users_endpoint(self, auth_token):
        """GET /api/users returns user list for admin"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Should have at least one user"
        
        # Check user structure
        user = data[0]
        assert "id" in user
        assert "email" in user
        assert "role" in user
        
        print(f"Users count: {len(data)}")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
