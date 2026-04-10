import requests
import sys
from datetime import datetime

class FinanceTrackerAPITester:
    def __init__(self, base_url="https://hebrew-month-view.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        response_data = response.json()
                        print(f"Response: {response_data}")
                        return True, response_data
                    except:
                        print(f"Response: {response.text[:200]}")
                        return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}")

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "api/",
            200
        )

    def test_cron_recurring_endpoint(self):
        """Test cron recurring transactions endpoint"""
        return self.run_test(
            "Cron Recurring Transactions",
            "POST",
            "api/cron/recurring",
            200
        )

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Test GET status
        success1, _ = self.run_test(
            "Get Status Checks",
            "GET",
            "api/status",
            200
        )
        
        # Test POST status
        success2, _ = self.run_test(
            "Create Status Check",
            "POST",
            "api/status",
            200,
            data={"client_name": "test_client"}
        )
        
        return success1 and success2

def main():
    # Setup
    tester = FinanceTrackerAPITester()
    
    print("🚀 Starting Finance Tracker API Tests")
    print("=" * 50)

    # Run tests
    print("\n📡 Testing API Endpoints...")
    
    # Test root endpoint
    tester.test_root_endpoint()
    
    # Test status endpoints
    tester.test_status_endpoints()
    
    # Test cron endpoint (main requirement)
    tester.test_cron_recurring_endpoint()

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print("⚠️  Some backend tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())