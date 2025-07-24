#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Email Platform
Tests all core email platform functionality including authentication, email sending, queue processing, and analytics.
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, Any, List

# Configuration
BASE_URL = "https://93dd0e80-66d7-4ded-b5bf-929feac9654a.preview.emergentagent.com/api"
API_KEY = "ep_yl3J8t1W-xhke-pHR6rAa2qkV9QuwiGgQzPPsuDq_jc"

# Headers for authenticated requests
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

class EmailPlatformTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS
        self.test_results = []
        self.sent_email_id = None
        
    def log_test(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test the health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Health Check", 
                    True, 
                    f"Service healthy - Database: {data.get('database')}, Queue size: {data.get('queue_size')}"
                )
                return True
            else:
                self.log_test(
                    "Health Check", 
                    False, 
                    f"Health check failed with status {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Health check error: {str(e)}")
            return False
    
    def test_api_authentication_valid(self):
        """Test API authentication with valid key"""
        try:
            response = requests.get(f"{self.base_url}/v1/api-keys", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "API Authentication (Valid)", 
                    True, 
                    f"Authentication successful, found {len(data)} API keys"
                )
                return True
            else:
                self.log_test(
                    "API Authentication (Valid)", 
                    False, 
                    f"Authentication failed with status {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("API Authentication (Valid)", False, f"Authentication error: {str(e)}")
            return False
    
    def test_api_authentication_invalid(self):
        """Test API authentication with invalid key"""
        try:
            invalid_headers = {
                "Authorization": "Bearer invalid_key_12345",
                "Content-Type": "application/json"
            }
            response = requests.get(f"{self.base_url}/v1/api-keys", headers=invalid_headers, timeout=10)
            
            if response.status_code == 401:
                self.log_test(
                    "API Authentication (Invalid)", 
                    True, 
                    "Invalid API key correctly rejected"
                )
                return True
            else:
                self.log_test(
                    "API Authentication (Invalid)", 
                    False, 
                    f"Expected 401, got {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("API Authentication (Invalid)", False, f"Authentication test error: {str(e)}")
            return False
    
    def test_send_email(self):
        """Test email sending endpoint"""
        try:
            email_data = {
                "from_email": "noreply@emailplatform.com",
                "from_name": "Email Platform",
                "to": [
                    {
                        "email": "john.doe@example.com",
                        "name": "John Doe",
                        "type": "to"
                    }
                ],
                "subject": "Test Email from Email Platform",
                "html_content": "<h1>Hello John!</h1><p>This is a test email from our email platform. The system is working correctly!</p><p>Best regards,<br>Email Platform Team</p>",
                "text_content": "Hello John!\n\nThis is a test email from our email platform. The system is working correctly!\n\nBest regards,\nEmail Platform Team",
                "tags": ["test", "api"],
                "metadata": {
                    "campaign": "api_test",
                    "source": "backend_test"
                },
                "send_immediately": True
            }
            
            response = requests.post(
                f"{self.base_url}/v1/emails", 
                headers=self.headers, 
                json=email_data,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                self.sent_email_id = data.get("id")
                self.log_test(
                    "Email Sending", 
                    True, 
                    f"Email queued successfully - ID: {self.sent_email_id}, Status: {data.get('status')}"
                )
                return True
            else:
                self.log_test(
                    "Email Sending", 
                    False, 
                    f"Email sending failed with status {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("Email Sending", False, f"Email sending error: {str(e)}")
            return False
    
    def test_get_emails_list(self):
        """Test getting list of emails"""
        try:
            response = requests.get(f"{self.base_url}/v1/emails", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Email List Retrieval", 
                    True, 
                    f"Retrieved {len(data)} emails successfully"
                )
                return True
            else:
                self.log_test(
                    "Email List Retrieval", 
                    False, 
                    f"Email list retrieval failed with status {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("Email List Retrieval", False, f"Email list error: {str(e)}")
            return False
    
    def test_get_email_by_id(self):
        """Test getting specific email by ID"""
        if not self.sent_email_id:
            self.log_test("Email Details Retrieval", False, "No email ID available for testing")
            return False
            
        try:
            response = requests.get(
                f"{self.base_url}/v1/emails/{self.sent_email_id}", 
                headers=self.headers, 
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Email Details Retrieval", 
                    True, 
                    f"Email details retrieved - Status: {data.get('status')}, Subject: {data.get('subject')}"
                )
                return True
            else:
                self.log_test(
                    "Email Details Retrieval", 
                    False, 
                    f"Email details retrieval failed with status {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("Email Details Retrieval", False, f"Email details error: {str(e)}")
            return False
    
    def test_queue_processing(self):
        """Test queue system by checking email status changes"""
        if not self.sent_email_id:
            self.log_test("Queue Processing", False, "No email ID available for testing")
            return False
            
        try:
            # Wait a bit for queue processing
            print("   Waiting for queue processing...")
            time.sleep(3)
            
            response = requests.get(
                f"{self.base_url}/v1/emails/{self.sent_email_id}", 
                headers=self.headers, 
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('status')
                
                # Check if status has progressed from queued
                if status in ['processing', 'sent', 'delivered']:
                    self.log_test(
                        "Queue Processing", 
                        True, 
                        f"Queue processing working - Email status: {status}"
                    )
                    return True
                elif status == 'queued':
                    # Wait a bit more and check again
                    time.sleep(2)
                    response2 = requests.get(
                        f"{self.base_url}/v1/emails/{self.sent_email_id}", 
                        headers=self.headers, 
                        timeout=10
                    )
                    if response2.status_code == 200:
                        data2 = response2.json()
                        status2 = data2.get('status')
                        if status2 in ['processing', 'sent', 'delivered']:
                            self.log_test(
                                "Queue Processing", 
                                True, 
                                f"Queue processing working - Email status: {status2}"
                            )
                            return True
                    
                    self.log_test(
                        "Queue Processing", 
                        False, 
                        f"Email still queued after waiting - Status: {status}",
                        {"email_data": data}
                    )
                    return False
                else:
                    self.log_test(
                        "Queue Processing", 
                        False, 
                        f"Unexpected email status: {status}",
                        {"email_data": data}
                    )
                    return False
            else:
                self.log_test(
                    "Queue Processing", 
                    False, 
                    f"Failed to check email status: {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("Queue Processing", False, f"Queue processing test error: {str(e)}")
            return False
    
    def test_templates_endpoint(self):
        """Test email templates endpoint"""
        try:
            response = requests.get(f"{self.base_url}/v1/templates", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Templates Retrieval", 
                    True, 
                    f"Retrieved {len(data)} templates successfully"
                )
                return True
            else:
                self.log_test(
                    "Templates Retrieval", 
                    False, 
                    f"Templates retrieval failed with status {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("Templates Retrieval", False, f"Templates error: {str(e)}")
            return False
    
    def test_analytics_overview(self):
        """Test analytics overview endpoint"""
        try:
            response = requests.get(f"{self.base_url}/v1/analytics/overview", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Analytics Overview", 
                    True, 
                    f"Analytics retrieved - Total emails: {data.get('total_emails')}, Quota used: {data.get('quota_used')}/{data.get('quota_limit')}"
                )
                return True
            else:
                self.log_test(
                    "Analytics Overview", 
                    False, 
                    f"Analytics retrieval failed with status {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("Analytics Overview", False, f"Analytics error: {str(e)}")
            return False
    
    def test_api_keys_management(self):
        """Test API keys management endpoints"""
        try:
            # Test getting API keys
            response = requests.get(f"{self.base_url}/v1/api-keys", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "API Keys Management", 
                    True, 
                    f"API keys management working - Found {len(data)} keys"
                )
                return True
            else:
                self.log_test(
                    "API Keys Management", 
                    False, 
                    f"API keys retrieval failed with status {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("API Keys Management", False, f"API keys error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Email Platform Backend Tests")
        print("=" * 60)
        
        # Core functionality tests
        tests = [
            self.test_health_check,
            self.test_api_authentication_valid,
            self.test_api_authentication_invalid,
            self.test_send_email,
            self.test_get_emails_list,
            self.test_get_email_by_id,
            self.test_queue_processing,
            self.test_templates_endpoint,
            self.test_analytics_overview,
            self.test_api_keys_management
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test.__name__}: Unexpected error: {str(e)}")
                failed += 1
            
            print()  # Add spacing between tests
        
        # Summary
        print("=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"Total Tests: {passed + failed}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed / (passed + failed) * 100):.1f}%")
        
        if failed == 0:
            print("\n🎉 All tests passed! Email platform backend is working correctly.")
        else:
            print(f"\n⚠️  {failed} test(s) failed. Check the details above.")
        
        return passed, failed, self.test_results

def main():
    """Main test execution"""
    tester = EmailPlatformTester()
    passed, failed, results = tester.run_all_tests()
    
    # Return appropriate exit code
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()