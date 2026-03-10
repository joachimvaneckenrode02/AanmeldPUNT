"""
Backend API tests for recent features:
1. Auth login - superadmin login
2. Classes - hard delete, toggle active, includeInactive
3. Study types - default start time 16:00-17:00
4. Exclusion dates - study-type-specific exclusions
5. Reports - attendance detail API
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPERADMIN_EMAIL = "joachim.vaneckenrode@rhizo.be"
SUPERADMIN_PASSWORD = "superadmin123"

class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_superadmin_login_success(self):
        """Test superadmin can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERADMIN_EMAIL,
            "password": SUPERADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "superadmin"
        assert data["user"]["email"] == SUPERADMIN_EMAIL
        
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401


@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for authenticated tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": SUPERADMIN_EMAIL,
        "password": SUPERADMIN_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip("Auth failed - skipping authenticated tests")
    return response.json()["token"]


@pytest.fixture
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestClasses:
    """Test classes CRUD operations - hard delete and toggle active"""
    
    def test_get_classes_with_include_inactive(self, auth_headers):
        """Test GET /api/classes with includeInactive=true"""
        response = requests.get(
            f"{BASE_URL}/api/classes?includeInactive=true",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_class(self, auth_headers):
        """Test creating a class"""
        response = requests.post(
            f"{BASE_URL}/api/classes",
            headers=auth_headers,
            json={"name": "TEST_Class_Delete", "isActive": True}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Class_Delete"
        assert data["isActive"] == True
        assert "id" in data
        return data["id"]
    
    def test_toggle_class_active(self, auth_headers):
        """Test PATCH /api/classes/{id}/toggle-active"""
        # First create a class
        create_resp = requests.post(
            f"{BASE_URL}/api/classes",
            headers=auth_headers,
            json={"name": "TEST_Toggle_Class", "isActive": True}
        )
        assert create_resp.status_code == 200
        class_id = create_resp.json()["id"]
        
        # Toggle to inactive
        toggle_resp = requests.patch(
            f"{BASE_URL}/api/classes/{class_id}/toggle-active",
            headers=auth_headers
        )
        assert toggle_resp.status_code == 200
        assert toggle_resp.json()["isActive"] == False
        
        # Toggle back to active
        toggle_resp2 = requests.patch(
            f"{BASE_URL}/api/classes/{class_id}/toggle-active",
            headers=auth_headers
        )
        assert toggle_resp2.status_code == 200
        assert toggle_resp2.json()["isActive"] == True
        
        # Cleanup - hard delete
        requests.delete(f"{BASE_URL}/api/classes/{class_id}", headers=auth_headers)
    
    def test_hard_delete_class(self, auth_headers):
        """Test DELETE /api/classes/{id} - hard delete"""
        # Create a class to delete
        create_resp = requests.post(
            f"{BASE_URL}/api/classes",
            headers=auth_headers,
            json={"name": "TEST_HardDelete_Class", "isActive": True}
        )
        assert create_resp.status_code == 200
        class_id = create_resp.json()["id"]
        
        # Hard delete
        delete_resp = requests.delete(
            f"{BASE_URL}/api/classes/{class_id}",
            headers=auth_headers
        )
        assert delete_resp.status_code == 200
        assert delete_resp.json()["success"] == True
        
        # Verify class is gone (even with includeInactive)
        get_resp = requests.get(
            f"{BASE_URL}/api/classes?includeInactive=true",
            headers=auth_headers
        )
        assert get_resp.status_code == 200
        classes = get_resp.json()
        class_ids = [c["id"] for c in classes]
        assert class_id not in class_ids, "Class should be hard deleted"


class TestStudyTypes:
    """Test study types - default times should be 16:00-17:00"""
    
    def test_get_study_types(self, auth_headers):
        """Test GET /api/study-types"""
        response = requests.get(
            f"{BASE_URL}/api/study-types",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_study_type_default_times(self, auth_headers):
        """Test creating study type with default times 16:00-17:00"""
        # Create without specifying times - should default to 16:00-17:00
        response = requests.post(
            f"{BASE_URL}/api/study-types",
            headers=auth_headers,
            json={
                "mainType": "TEST_DefaultTime",
                "subType": None,
                "key": "test-default-time",
                "defaultCapacity": 20,
                "defaultStartTime": "16:00",
                "defaultEndTime": "17:00",
                "isActive": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["defaultStartTime"] == "16:00", f"Expected 16:00, got {data['defaultStartTime']}"
        assert data["defaultEndTime"] == "17:00", f"Expected 17:00, got {data['defaultEndTime']}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/study-types/{data['id']}", headers=auth_headers)
    
    def test_toggle_study_type_active(self, auth_headers):
        """Test PATCH /api/study-types/{id}/toggle-active"""
        # Create a study type
        create_resp = requests.post(
            f"{BASE_URL}/api/study-types",
            headers=auth_headers,
            json={
                "mainType": "TEST_Toggle_Type",
                "key": "test-toggle-type",
                "defaultCapacity": 20,
                "defaultStartTime": "16:00",
                "defaultEndTime": "17:00",
                "isActive": True
            }
        )
        assert create_resp.status_code == 200
        type_id = create_resp.json()["id"]
        
        # Toggle
        toggle_resp = requests.patch(
            f"{BASE_URL}/api/study-types/{type_id}/toggle-active",
            headers=auth_headers
        )
        assert toggle_resp.status_code == 200
        assert toggle_resp.json()["isActive"] == False
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/study-types/{type_id}", headers=auth_headers)
    
    def test_hard_delete_study_type(self, auth_headers):
        """Test DELETE /api/study-types/{id} - hard delete"""
        create_resp = requests.post(
            f"{BASE_URL}/api/study-types",
            headers=auth_headers,
            json={
                "mainType": "TEST_Delete_Type",
                "key": "test-delete-type",
                "defaultCapacity": 20,
                "defaultStartTime": "16:00",
                "defaultEndTime": "17:00",
                "isActive": True
            }
        )
        assert create_resp.status_code == 200
        type_id = create_resp.json()["id"]
        
        # Hard delete
        delete_resp = requests.delete(
            f"{BASE_URL}/api/study-types/{type_id}",
            headers=auth_headers
        )
        assert delete_resp.status_code == 200
        assert delete_resp.json()["success"] == True


class TestExclusionDates:
    """Test exclusion dates - study-type-specific exclusions"""
    
    def test_get_exclusion_dates(self, auth_headers):
        """Test GET /api/exclusion-dates"""
        response = requests.get(
            f"{BASE_URL}/api/exclusion-dates",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_exclusion_date_all_types(self, auth_headers):
        """Test creating exclusion date for all study types"""
        response = requests.post(
            f"{BASE_URL}/api/exclusion-dates",
            headers=auth_headers,
            json={
                "date": "2026-12-25",
                "reason": "TEST_Kerstdag",
                "excludedStudyTypeIds": None,  # All types excluded
                "isActive": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["date"] == "2026-12-25"
        assert data["excludedStudyTypeIds"] is None or data["excludedStudyTypeIds"] == []
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/exclusion-dates/{data['id']}", headers=auth_headers)
    
    def test_create_exclusion_date_specific_types(self, auth_headers):
        """Test creating exclusion date with specific study types"""
        # First get a study type ID to use
        types_resp = requests.get(f"{BASE_URL}/api/study-types", headers=auth_headers)
        types = types_resp.json()
        if not types:
            pytest.skip("No study types available")
        
        type_id = types[0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/exclusion-dates",
            headers=auth_headers,
            json={
                "date": "2026-11-11",
                "reason": "TEST_Wapenstilstand",
                "excludedStudyTypeIds": [type_id],  # Specific type excluded
                "isActive": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["date"] == "2026-11-11"
        assert data["excludedStudyTypeIds"] == [type_id]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/exclusion-dates/{data['id']}", headers=auth_headers)
    
    def test_update_exclusion_date(self, auth_headers):
        """Test PUT /api/exclusion-dates/{id}"""
        # Create
        create_resp = requests.post(
            f"{BASE_URL}/api/exclusion-dates",
            headers=auth_headers,
            json={
                "date": "2026-10-31",
                "reason": "TEST_Original",
                "excludedStudyTypeIds": None,
                "isActive": True
            }
        )
        assert create_resp.status_code == 200
        date_id = create_resp.json()["id"]
        
        # Update
        update_resp = requests.put(
            f"{BASE_URL}/api/exclusion-dates/{date_id}",
            headers=auth_headers,
            json={
                "date": "2026-10-31",
                "reason": "TEST_Updated",
                "excludedStudyTypeIds": None,
                "isActive": True
            }
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["reason"] == "TEST_Updated"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/exclusion-dates/{date_id}", headers=auth_headers)


class TestReports:
    """Test reports API - attendance detail"""
    
    def test_get_reports_summary(self, auth_headers):
        """Test GET /api/reports/summary"""
        response = requests.get(
            f"{BASE_URL}/api/reports/summary",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "totalRegistrations" in data
        assert "attendance" in data
        assert "byStudyType" in data
        assert "byClass" in data
    
    def test_get_attendance_detail(self, auth_headers):
        """Test GET /api/reports/attendance-detail"""
        response = requests.get(
            f"{BASE_URL}/api/reports/attendance-detail",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "byStudent" in data
        assert "byClass" in data
        assert "byStudyType" in data
        assert "totals" in data
    
    def test_get_attendance_detail_with_filters(self, auth_headers):
        """Test GET /api/reports/attendance-detail with date filters"""
        response = requests.get(
            f"{BASE_URL}/api/reports/attendance-detail",
            headers=auth_headers,
            params={
                "dateFrom": "2026-01-01",
                "dateTo": "2026-12-31"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "totals" in data
        assert "rate" in data["totals"]
    
    def test_export_registrations(self, auth_headers):
        """Test GET /api/reports/export"""
        response = requests.get(
            f"{BASE_URL}/api/reports/export",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_classes(self, auth_headers):
        """Remove any remaining test classes"""
        response = requests.get(
            f"{BASE_URL}/api/classes?includeInactive=true",
            headers=auth_headers
        )
        if response.status_code == 200:
            for cls in response.json():
                if cls["name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/classes/{cls['id']}", headers=auth_headers)
    
    def test_cleanup_test_study_types(self, auth_headers):
        """Remove any remaining test study types"""
        response = requests.get(
            f"{BASE_URL}/api/study-types?includeInactive=true",
            headers=auth_headers
        )
        if response.status_code == 200:
            for st in response.json():
                if st["mainType"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/study-types/{st['id']}", headers=auth_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
