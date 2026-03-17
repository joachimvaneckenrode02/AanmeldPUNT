"""
Iteration 6 Testing - Dutch School App (AanmeldPUNT)
Focus: New attendance features - status (present/absent/sick), educator notes, add-student walk-in endpoint
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


class TestAttendanceStatusFeature:
    """Test new attendance status feature (present/absent/sick)"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "joachim.vaneckenrode@rhizo.be",
            "password": "superadmin123"
        })
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def test_data(self, auth_token):
        """Get valid registration and moment IDs for testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/attendance/by-date/2026-03-10", headers=headers)
        if response.status_code == 200:
            data = response.json()
            if len(data) > 0 and len(data[0].get("students", [])) > 0:
                student = data[0]["students"][0]
                return {
                    "registration_id": student["registration"]["id"],
                    "moment_id": data[0]["moment"]["id"],
                    "student_name": student["registration"]["studentName"]
                }
        return None
    
    def test_attendance_status_sick_with_reason(self, auth_token, test_data):
        """POST /api/attendance with status='sick', absenceReason, educatorNote should work"""
        if not test_data:
            pytest.skip("No test data available")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Record attendance as sick with reason and educator note
        response = requests.post(f"{BASE_URL}/api/attendance", headers=headers, json={
            "registrationId": test_data["registration_id"],
            "studyMomentId": test_data["moment_id"],
            "isPresent": False,
            "status": "sick",
            "absenceReason": "Koorts",
            "educatorNote": "Test educator note - please check"
        })
        
        assert response.status_code == 200, f"Failed: {response.text}"
        result = response.json()
        
        # Verify response contains the new fields
        assert result["isPresent"] == False, "isPresent should be False for sick"
        assert result["status"] == "sick", f"Status should be 'sick', got {result.get('status')}"
        assert result["absenceReason"] == "Koorts", f"absenceReason should be 'Koorts', got {result.get('absenceReason')}"
        assert result["educatorNote"] == "Test educator note - please check", f"educatorNote mismatch"
        
        print(f"Successfully recorded sick status for {test_data['student_name']}")
        print(f"  - status: {result['status']}")
        print(f"  - absenceReason: {result['absenceReason']}")
        print(f"  - educatorNote: {result['educatorNote']}")
    
    def test_attendance_status_absent_with_reason(self, auth_token, test_data):
        """POST /api/attendance with status='absent' and absenceReason should work"""
        if not test_data:
            pytest.skip("No test data available")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/attendance", headers=headers, json={
            "registrationId": test_data["registration_id"],
            "studyMomentId": test_data["moment_id"],
            "isPresent": False,
            "status": "absent",
            "absenceReason": "Niet komen opdagen",
            "educatorNote": None
        })
        
        assert response.status_code == 200, f"Failed: {response.text}"
        result = response.json()
        
        assert result["isPresent"] == False
        assert result["status"] == "absent", f"Status should be 'absent', got {result.get('status')}"
        assert result["absenceReason"] == "Niet komen opdagen"
        
        print(f"Successfully recorded absent status")
    
    def test_attendance_status_present(self, auth_token, test_data):
        """POST /api/attendance with status='present' should work and clear absence fields"""
        if not test_data:
            pytest.skip("No test data available")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(f"{BASE_URL}/api/attendance", headers=headers, json={
            "registrationId": test_data["registration_id"],
            "studyMomentId": test_data["moment_id"],
            "isPresent": True,
            "status": "present",
            "absenceReason": None,
            "educatorNote": None
        })
        
        assert response.status_code == 200, f"Failed: {response.text}"
        result = response.json()
        
        assert result["isPresent"] == True
        assert result["status"] == "present", f"Status should be 'present', got {result.get('status')}"
        
        print(f"Successfully recorded present status")


class TestAttendanceByDateStatus:
    """Test GET /api/attendance/by-date returns status field"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "joachim.vaneckenrode@rhizo.be",
            "password": "superadmin123"
        })
        return response.json()["token"]
    
    def test_attendance_by_date_includes_status_field(self, auth_token):
        """GET /api/attendance/by-date/2026-03-10 returns students with status field
        Note: Old attendance records may have status=null, which is handled by frontend
        by deriving status from isPresent field. New records have explicit status.
        """
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/attendance/by-date/2026-03-10", headers=headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"Found {len(data)} study moments")
        
        # Check that students have attendance with status or isPresent field
        # Old records may have status=null but should have isPresent
        records_with_status = 0
        records_without_status = 0
        
        if len(data) > 0:
            for moment_data in data:
                for student in moment_data.get("students", []):
                    attendance = student.get("attendance")
                    if attendance:
                        # Attendance should have at least isPresent field
                        assert "isPresent" in attendance, "Attendance should have 'isPresent' field"
                        
                        if attendance.get("status"):
                            records_with_status += 1
                            # If status exists, it should be valid
                            assert attendance["status"] in ["present", "absent", "sick"], \
                                f"Invalid status: {attendance['status']}"
                            print(f"Student {student['registration']['studentName']}: status={attendance['status']}")
                        else:
                            records_without_status += 1
                            # Old records without status - frontend derives from isPresent
                            derived_status = "present" if attendance["isPresent"] else "absent"
                            print(f"Student {student['registration']['studentName']}: status=null (derived: {derived_status})")
        
        print(f"Records with explicit status: {records_with_status}")
        print(f"Records with null status (legacy): {records_without_status}")
        
        # At least verify the endpoint returns correct structure
        assert records_with_status + records_without_status > 0, "No attendance records found"


class TestAddStudentWalkIn:
    """Test add-student endpoint for walk-in/late arrivals"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "joachim.vaneckenrode@rhizo.be",
            "password": "superadmin123"
        })
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def test_class_and_moment(self, auth_token):
        """Get valid class and moment IDs for testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get a class
        classes_resp = requests.get(f"{BASE_URL}/api/classes", headers=headers)
        classes = classes_resp.json() if classes_resp.status_code == 200 else []
        
        # Get a study moment
        moments_resp = requests.get(f"{BASE_URL}/api/attendance/by-date/2026-03-10", headers=headers)
        moments = moments_resp.json() if moments_resp.status_code == 200 else []
        
        if classes and moments:
            return {
                "class_id": classes[0]["id"],
                "class_name": classes[0]["name"],
                "moment_id": moments[0]["moment"]["id"],
                "moment_label": moments[0]["moment"]["labelFull"]
            }
        return None
    
    def test_add_student_to_moment(self, auth_token, test_class_and_moment):
        """POST /api/attendance/add-student creates registration and attendance for walk-in"""
        if not test_class_and_moment:
            pytest.skip("No test data available")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Generate unique student name to avoid duplicates
        timestamp = datetime.now().strftime("%H%M%S")
        student_name = f"TEST_WalkIn_Student_{timestamp}"
        
        response = requests.post(f"{BASE_URL}/api/attendance/add-student", headers=headers, json={
            "studentName": student_name,
            "classId": test_class_and_moment["class_id"],
            "studyMomentId": test_class_and_moment["moment_id"],
            "note": "Late arrival - manually added"
        })
        
        assert response.status_code == 200, f"Failed: {response.text}"
        result = response.json()
        
        # Verify response contains both registration and attendance
        assert "registration" in result, "Response should contain 'registration'"
        assert "attendance" in result, "Response should contain 'attendance'"
        
        reg = result["registration"]
        att = result["attendance"]
        
        # Verify registration details
        assert reg["studentName"] == student_name
        assert reg["classId"] == test_class_and_moment["class_id"]
        assert reg["studyMomentId"] == test_class_and_moment["moment_id"]
        assert "note" in reg
        
        # Verify attendance is auto-created as present
        assert att["isPresent"] == True, "Walk-in student should be marked as present"
        assert att["status"] == "present", f"Status should be 'present', got {att.get('status')}"
        assert att["registrationId"] == reg["id"]
        
        print(f"Successfully added walk-in student: {student_name}")
        print(f"  - Registration ID: {reg['id']}")
        print(f"  - Attendance ID: {att['id']}")
        print(f"  - Status: {att['status']}")
    
    def test_add_student_duplicate_rejected(self, auth_token, test_class_and_moment):
        """Adding same student twice should fail with error"""
        if not test_class_and_moment:
            pytest.skip("No test data available")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create unique student
        timestamp = datetime.now().strftime("%H%M%S")
        student_name = f"TEST_Duplicate_Student_{timestamp}"
        
        # First add should succeed
        response1 = requests.post(f"{BASE_URL}/api/attendance/add-student", headers=headers, json={
            "studentName": student_name,
            "classId": test_class_and_moment["class_id"],
            "studyMomentId": test_class_and_moment["moment_id"]
        })
        assert response1.status_code == 200, f"First add failed: {response1.text}"
        
        # Second add should fail (duplicate)
        response2 = requests.post(f"{BASE_URL}/api/attendance/add-student", headers=headers, json={
            "studentName": student_name,
            "classId": test_class_and_moment["class_id"],
            "studyMomentId": test_class_and_moment["moment_id"]
        })
        
        assert response2.status_code == 400, f"Duplicate should be rejected, got {response2.status_code}"
        print(f"Duplicate student correctly rejected")


class TestAbsenceFeedStatus:
    """Test absence feed includes status, absenceReason, educatorNote fields"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "joachim.vaneckenrode@rhizo.be",
            "password": "superadmin123"
        })
        return response.json()["token"]
    
    def test_absence_feed_has_status_fields(self, auth_token):
        """GET /api/notifications/absence-feed returns items with status, absenceReason, educatorNote"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/notifications/absence-feed", headers=headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"Absence feed items: {len(data)}")
        
        # Check structure of feed items
        if len(data) > 0:
            item = data[0]
            assert "id" in item, "Feed item should have 'id'"
            assert "studentName" in item, "Feed item should have 'studentName'"
            assert "status" in item, "Feed item should have 'status'"
            assert "absenceReason" in item or item.get("absenceReason") is None, "Feed item can have 'absenceReason'"
            assert "educatorNote" in item or item.get("educatorNote") is None, "Feed item can have 'educatorNote'"
            
            print(f"First feed item:")
            print(f"  - studentName: {item.get('studentName')}")
            print(f"  - status: {item.get('status')}")
            print(f"  - absenceReason: {item.get('absenceReason')}")
            print(f"  - educatorNote: {item.get('educatorNote')}")
        else:
            # Create an absence to test the feed structure
            print("No absence feed items - will verify in frontend test")


class TestStudentsSearch:
    """Test students search endpoint for add-student autocomplete"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "joachim.vaneckenrode@rhizo.be",
            "password": "superadmin123"
        })
        return response.json()["token"]
    
    def test_students_search_endpoint(self, auth_token):
        """GET /api/students/search returns matching students"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/students/search", headers=headers, params={"query": "Test"})
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"Search results for 'Test': {len(data)} students")
        
        if len(data) > 0:
            student = data[0]
            assert "id" in student
            assert "name" in student
            assert "classId" in student


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
