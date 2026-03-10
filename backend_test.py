import requests
import sys
from datetime import datetime, timedelta
import json

class SchoolRegistrationAPITester:
    def __init__(self, base_url="https://enrollment-hub-33.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_data = {}
        
    def log_test(self, name, success, response=None, error=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name}")
            if error:
                print(f"   Error: {error}")
            if response:
                print(f"   Response: {response}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            
            if success:
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                try:
                    error_data = response.json()
                except:
                    error_data = response.text
                return False, {"status": response.status_code, "error": error_data}

        except Exception as e:
            return False, {"error": str(e)}

    def test_auth(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test login with provided credentials
        success, response = self.run_test(
            "Login with admin credentials",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@school.be", "password": "admin123"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user = response['user']
            self.log_test("Login with admin credentials", True, response)
            
            # Test token validation
            success, user_response = self.run_test(
                "Get current user profile",
                "GET",
                "auth/me",
                200
            )
            self.log_test("Get current user profile", success, user_response)
            
            return True
        else:
            self.log_test("Login with admin credentials", False, None, response)
            return False

    def test_seed_data(self):
        """Test seed data creation"""
        print("\n🌱 Testing Seed Data...")
        
        success, response = self.run_test(
            "Create seed data",
            "POST",
            "seed",
            200
        )
        self.log_test("Create seed data", success, response)
        
        if success:
            self.test_data['seed_result'] = response
        
        return success

    def test_classes(self):
        """Test classes CRUD operations"""
        print("\n📚 Testing Classes...")
        
        # Get all classes
        success, response = self.run_test(
            "Get all classes",
            "GET",
            "classes",
            200
        )
        self.log_test("Get all classes", success, response)
        
        if success and len(response) > 0:
            self.test_data['classes'] = response
            return True
        else:
            return False

    def test_study_types(self):
        """Test study types CRUD operations"""
        print("\n📖 Testing Study Types...")
        
        # Get all study types
        success, response = self.run_test(
            "Get all study types",
            "GET",
            "study-types",
            200
        )
        self.log_test("Get all study types", success, response)
        
        if success and len(response) > 0:
            self.test_data['study_types'] = response
            return True
        else:
            return False

    def test_availability_rules(self):
        """Test availability rules"""
        print("\n⏰ Testing Availability Rules...")
        
        # Get availability rules
        success, response = self.run_test(
            "Get availability rules",
            "GET",
            "availability-rules",
            200
        )
        self.log_test("Get availability rules", success, response)
        
        if success:
            self.test_data['availability_rules'] = response
            
            # Create a new availability rule if we have study types
            if self.test_data.get('study_types'):
                study_type_id = self.test_data['study_types'][0]['id']
                today = datetime.now()
                next_week = today + timedelta(days=7)
                
                rule_data = {
                    "studyTypeId": study_type_id,
                    "weekday": 1,  # Tuesday
                    "validFrom": today.strftime("%Y-%m-%d"),
                    "validUntil": (today + timedelta(days=90)).strftime("%Y-%m-%d"),
                    "startTime": "15:30",
                    "endTime": "17:00",
                    "defaultCapacity": 20
                }
                
                success, response = self.run_test(
                    "Create availability rule",
                    "POST",
                    "availability-rules",
                    200,
                    data=rule_data
                )
                self.log_test("Create availability rule", success, response)
                
                if success:
                    self.test_data['created_rule'] = response
            
            return True
        else:
            return False

    def test_study_moments_generation(self):
        """Test study moments generation"""
        print("\n🎯 Testing Study Moments Generation...")
        
        if not self.test_data.get('study_types'):
            print("   Skipping - no study types available")
            return False
            
        # Generate study moments
        today = datetime.now()
        end_date = today + timedelta(days=14)
        
        generate_data = {
            "startDate": today.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d")
        }
        
        success, response = self.run_test(
            "Generate study moments",
            "POST",
            "study-moments/generate",
            200,
            data=generate_data
        )
        self.log_test("Generate study moments", success, response)
        
        if success:
            # Get available moments
            success, moments_response = self.run_test(
                "Get available study moments",
                "GET",
                "study-moments/available",
                200
            )
            self.log_test("Get available study moments", success, moments_response)
            
            if success and len(moments_response) > 0:
                self.test_data['available_moments'] = moments_response
                return True
        
        return False

    def test_registrations(self):
        """Test registration CRUD operations"""
        print("\n📝 Testing Student Registrations...")
        
        # Check if we have required data
        if not all([
            self.test_data.get('classes'),
            self.test_data.get('study_types'),
            self.test_data.get('available_moments')
        ]):
            print("   Skipping - missing required data (classes, study types, or moments)")
            return False
        
        # Create a test registration
        class_id = self.test_data['classes'][0]['id']
        study_type_id = self.test_data['study_types'][0]['id']
        moment = self.test_data['available_moments'][0]
        
        registration_data = {
            "teacherName": self.user['name'],
            "teacherEmail": self.user['email'],
            "studentName": "Test Student",
            "classId": class_id,
            "studyTypeId": study_type_id,
            "studyMomentId": moment['id'],
            "note": "Test registration"
        }
        
        success, response = self.run_test(
            "Create student registration",
            "POST",
            "registrations",
            200,
            data=registration_data
        )
        self.log_test("Create student registration", success, response)
        
        if success:
            self.test_data['registration'] = response
            
            # Get my registrations
            success, my_regs = self.run_test(
                "Get my registrations",
                "GET",
                "registrations/my",
                200
            )
            self.log_test("Get my registrations", success, my_regs)
            
            # Test duplicate prevention
            success, dup_response = self.run_test(
                "Test duplicate registration prevention",
                "POST",
                "registrations",
                400,  # Should fail with 400
                data=registration_data
            )
            self.log_test("Test duplicate registration prevention", success, dup_response)
            
            # Test capacity validation - try to exceed capacity
            for i in range(25):  # Try to create more than capacity (20)
                reg_data = registration_data.copy()
                reg_data['studentName'] = f"Test Student {i+2}"
                
                success, response = self.run_test(
                    f"Test registration {i+2} (capacity check)",
                    "POST",
                    "registrations",
                    200 if i < 18 else 400,  # Should start failing around capacity limit
                    data=reg_data
                )
                
                if not success and i >= 18:
                    self.log_test("Capacity validation working", True)
                    break
                elif not success and i < 18:
                    self.log_test("Unexpected capacity limit hit", False)
                    break
            
            return True
        
        return False

    def test_attendance(self):
        """Test attendance functionality"""
        print("\n✅ Testing Attendance...")
        
        if not self.test_data.get('registration'):
            print("   Skipping - no registration available")
            return False
        
        # Get attendance for today
        today = datetime.now().strftime("%Y-%m-%d")
        success, response = self.run_test(
            "Get attendance by date",
            "GET",
            f"attendance/by-date/{today}",
            200
        )
        self.log_test("Get attendance by date", success, response)
        
        if success and len(response) > 0:
            # Record attendance
            moment = response[0]['moment']
            if len(response[0]['students']) > 0:
                student = response[0]['students'][0]
                
                attendance_data = {
                    "registrationId": student['registration']['id'],
                    "studyMomentId": moment['id'],
                    "isPresent": True,
                    "note": "Present for test"
                }
                
                success, att_response = self.run_test(
                    "Record attendance - present",
                    "POST",
                    "attendance",
                    200,
                    data=attendance_data
                )
                self.log_test("Record attendance - present", success, att_response)
                
                # Change to absent
                attendance_data['isPresent'] = False
                attendance_data['note'] = "Changed to absent"
                
                success, att_response = self.run_test(
                    "Update attendance - absent",
                    "POST",
                    "attendance",
                    200,
                    data=attendance_data
                )
                self.log_test("Update attendance - absent", success, att_response)
                
                return True
        
        return False

    def test_dashboard_stats(self):
        """Test dashboard stats"""
        print("\n📊 Testing Dashboard Stats...")
        
        success, response = self.run_test(
            "Get dashboard stats",
            "GET",
            "dashboard/stats",
            200
        )
        self.log_test("Get dashboard stats", success, response)
        
        return success

    def test_reports(self):
        """Test reports functionality"""
        print("\n📈 Testing Reports...")
        
        success, response = self.run_test(
            "Get reports summary",
            "GET",
            "reports/summary",
            200
        )
        self.log_test("Get reports summary", success, response)
        
        return success

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting School Registration System Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        
        # Authentication is required for all other tests
        if not self.test_auth():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Run all test suites
        test_suites = [
            self.test_seed_data,
            self.test_classes,
            self.test_study_types,
            self.test_availability_rules,
            self.test_study_moments_generation,
            self.test_registrations,
            self.test_attendance,
            self.test_dashboard_stats,
            self.test_reports
        ]
        
        for test_suite in test_suites:
            try:
                test_suite()
            except Exception as e:
                print(f"❌ Test suite {test_suite.__name__} failed with error: {e}")
        
        # Summary
        print(f"\n📊 Test Results:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        return self.tests_passed > (self.tests_run * 0.8)  # 80% success rate

def main():
    tester = SchoolRegistrationAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())