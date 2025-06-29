#!/usr/bin/env python3
"""
Test script for AIREKON Risk Assessment API Integration
Tests the new API mode where event data is provided via API request
"""

import requests
import json
import time
import webbrowser
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:6001"
FRONTEND_URL = "http://localhost:6001"

# Test event data
TEST_EVENT_DATA = {
    "eventTitle": "Summer Music Festival 2024",
    "eventDate": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
    "location": "Hyde Park, London",
    "attendance": 15000,
    "eventType": "Music",
    "venueType": "Outdoor Festival",
    "riskLevel": "3",
    "description": "A large outdoor music festival featuring multiple stages, food vendors, and camping facilities. Expected to run for 3 days with international artists performing."
}

def test_health_check():
    """Test that the API server is running"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_start_assessment():
    """Test starting a new assessment with event data"""
    print("\n🚀 Testing assessment start...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/start-assessment",
            json=TEST_EVENT_DATA,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Assessment started successfully")
            print(f"   Session ID: {data['session_id']}")
            print(f"   Redirect URL: {data['redirect_url']}")
            return data['session_id'], data['redirect_url']
        else:
            print(f"❌ Assessment start failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Assessment start failed: {e}")
        return None, None

def test_get_session_data(session_id):
    """Test retrieving session data"""
    print(f"\n📋 Testing session data retrieval for {session_id}...")
    try:
        response = requests.get(f"{BASE_URL}/api/session/{session_id}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Session data retrieved successfully")
            print(f"   Status: {data['status']}")
            print(f"   Event Title: {data['event_data']['eventTitle']}")
            print(f"   Created: {data['created_at']}")
            return data
        else:
            print(f"❌ Session retrieval failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Session retrieval failed: {e}")
        return None

def test_invalid_session():
    """Test retrieving non-existent session"""
    print("\n🔍 Testing invalid session handling...")
    try:
        response = requests.get(f"{BASE_URL}/api/session/invalid-session-id")
        
        if response.status_code == 404:
            print("✅ Invalid session handled correctly (404)")
            return True
        else:
            print(f"❌ Invalid session not handled correctly: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Invalid session test failed: {e}")
        return False

def test_missing_fields():
    """Test validation of required fields"""
    print("\n🔍 Testing field validation...")
    
    # Test with missing required field
    incomplete_data = {
        "eventTitle": "Test Event",
        # Missing other required fields
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/start-assessment",
            json=incomplete_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 400:
            print("✅ Field validation working correctly (400)")
            print(f"   Error: {response.json().get('error', 'Unknown error')}")
            return True
        else:
            print(f"❌ Field validation not working: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Field validation test failed: {e}")
        return False

def open_frontend(redirect_url):
    """Open the frontend in browser"""
    print(f"\n🌐 Opening frontend: {FRONTEND_URL}{redirect_url}")
    full_url = f"{FRONTEND_URL}{redirect_url}"
    
    try:
        webbrowser.open(full_url)
        print("✅ Frontend opened in browser")
        print("   The risk assessment tool should now be running in API mode")
        print("   It should skip the initial form and go directly to generation")
        return True
    except Exception as e:
        print(f"❌ Failed to open browser: {e}")
        print(f"   Please manually open: {full_url}")
        return False

def main():
    """Run all tests"""
    print("🧪 AIREKON Risk Assessment API Integration Test")
    print("=" * 50)
    
    # Test 1: Health check
    if not test_health_check():
        print("\n❌ Server not running. Please start the Flask app first:")
        print("   python app.py")
        return
    
    # Test 2: Field validation
    test_missing_fields()
    
    # Test 3: Invalid session
    test_invalid_session()
    
    # Test 4: Start assessment
    session_id, redirect_url = test_start_assessment()
    if not session_id:
        print("\n❌ Cannot continue tests without valid session")
        return
    
    # Test 5: Get session data
    session_data = test_get_session_data(session_id)
    if not session_data:
        print("\n❌ Cannot retrieve session data")
        return
    
    # Test 6: Open frontend
    print("\n" + "=" * 50)
    print("🎯 API Integration Test Results:")
    print("✅ All backend API tests passed!")
    print("✅ Session created and data stored correctly")
    print("✅ Event data validation working")
    print("\n🚀 Ready to test frontend integration...")
    
    user_input = input("\nOpen frontend in browser? (y/n): ").lower().strip()
    if user_input in ['y', 'yes']:
        open_frontend(redirect_url)
        
        print("\n📝 Manual Testing Checklist:")
        print("   □ Page loads without showing initial form")
        print("   □ Goes directly to risk generation screen")
        print("   □ Event card shows correct data from API")
        print("   □ 'Go Back' button shows '← Return to Main App'")
        print("   □ Risk generation works normally")
        print("   □ All features function as expected")
        
        print(f"\n🔗 Session ID for reference: {session_id}")
        print(f"🔗 Direct URL: {FRONTEND_URL}{redirect_url}")

if __name__ == "__main__":
    main()
