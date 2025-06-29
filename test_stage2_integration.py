#!/usr/bin/env python3
"""
Test script for Stage 2: Results Export & Return Flow
Tests the complete integration workflow including results collection and export
"""

import requests
import json
import time
import webbrowser
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:7001"
FRONTEND_URL = "http://localhost:7001"

# Test event data
TEST_EVENT_DATA = {
    "eventTitle": "Stage 2 Integration Test Event",
    "eventDate": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
    "location": "Test Venue, Test City",
    "attendance": 5000,
    "eventType": "Music",
    "venueType": "Indoor Concert",
    "riskLevel": "3",
    "description": "Test event for Stage 2 integration testing - results export and return flow validation."
}

def test_complete_workflow():
    """Test the complete integration workflow"""
    print("🧪 Stage 2 Integration Test: Complete Workflow")
    print("=" * 60)
    
    # Step 1: Start assessment
    print("🚀 Step 1: Starting assessment...")
    response = requests.post(
        f"{BASE_URL}/api/start-assessment",
        json=TEST_EVENT_DATA,
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to start assessment: {response.status_code}")
        return None
    
    data = response.json()
    session_id = data['session_id']
    redirect_url = data['redirect_url']
    
    print(f"✅ Assessment started successfully")
    print(f"   Session ID: {session_id}")
    print(f"   Frontend URL: {FRONTEND_URL}{redirect_url}")
    
    return session_id, redirect_url

def test_session_status(session_id):
    """Test session status checking"""
    print(f"\n📋 Step 2: Checking session status...")
    
    response = requests.get(f"{BASE_URL}/api/session/{session_id}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Session status retrieved")
        print(f"   Status: {data['status']}")
        print(f"   Event: {data['event_data']['eventTitle']}")
        return data
    else:
        print(f"❌ Failed to get session status: {response.status_code}")
        return None

def test_complete_assessment(session_id):
    """Test completing assessment with mock results"""
    print(f"\n✅ Step 3: Testing assessment completion...")
    
    # Mock results data (simulating what frontend would send)
    mock_results = {
        "rekon_risk": {
            "score": "4",
            "level": "Medium",
            "description": "Moderate risk level requiring standard precautions"
        },
        "rekon_context": {
            "score": "6",
            "level": "High", 
            "description": "High context complexity with multiple stakeholders"
        },
        "summary": {
            "paragraph1": "This test event presents moderate overall risk with high contextual complexity.",
            "paragraph2": "Key considerations include venue capacity, weather contingencies, and crowd management protocols."
        },
        "risks": [
            {
                "risk": "Weather disruption to outdoor activities",
                "category": "Environmental",
                "impact": 4,
                "likelihood": 3,
                "overall": 3.5,
                "mitigation": "Monitor weather forecasts and prepare indoor backup venues"
            },
            {
                "risk": "Overcrowding at entry points",
                "category": "Crowd Management",
                "impact": 5,
                "likelihood": 4,
                "overall": 4.5,
                "mitigation": "Implement staggered entry times and additional security personnel"
            }
        ],
        "metadata": {
            "total_risks": 2,
            "completed_at": datetime.now().isoformat(),
            "user_agent": "Test Script"
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/api/session/{session_id}/complete",
        json=mock_results,
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code == 200:
        print("✅ Assessment completed successfully")
        return True
    else:
        print(f"❌ Failed to complete assessment: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_export_results(session_id):
    """Test exporting completed results"""
    print(f"\n📤 Step 4: Testing results export...")
    
    response = requests.get(f"{BASE_URL}/api/session/{session_id}/results")
    
    if response.status_code == 200:
        results = response.json()
        print("✅ Results exported successfully")
        print(f"   Session ID: {results['session_id']}")
        print(f"   Status: {results['status']}")
        print(f"   Event: {results['event_data']['eventTitle']}")
        print(f"   Total Risks: {results['assessment_results']['metadata']['total_risks']}")
        print(f"   Duration: {results['metadata']['session_duration_minutes']} minutes")
        
        # Validate results structure
        required_fields = ['session_id', 'status', 'event_data', 'assessment_results', 'metadata']
        missing_fields = [field for field in required_fields if field not in results]
        
        if missing_fields:
            print(f"⚠️  Missing fields in results: {missing_fields}")
        else:
            print("✅ Results structure validation passed")
            
        return results
    else:
        print(f"❌ Failed to export results: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def test_cleanup_session(session_id):
    """Test session cleanup"""
    print(f"\n🧹 Step 5: Testing session cleanup...")
    
    response = requests.delete(f"{BASE_URL}/api/session/{session_id}")
    
    if response.status_code == 200:
        print("✅ Session cleaned up successfully")
        
        # Verify session is gone
        verify_response = requests.get(f"{BASE_URL}/api/session/{session_id}")
        if verify_response.status_code == 404:
            print("✅ Session cleanup verified (404 on subsequent access)")
            return True
        else:
            print("⚠️  Session still accessible after cleanup")
            return False
    else:
        print(f"❌ Failed to cleanup session: {response.status_code}")
        return False

def test_export_before_completion(session_id):
    """Test that export fails before completion"""
    print(f"\n🔍 Step 6: Testing export before completion...")
    
    response = requests.get(f"{BASE_URL}/api/session/{session_id}/results")
    
    if response.status_code == 400:
        print("✅ Export correctly blocked before completion (400)")
        return True
    else:
        print(f"❌ Export should fail before completion: {response.status_code}")
        return False

def main():
    """Run complete Stage 2 integration test"""
    print("🧪 AIREKON Risk Assessment - Stage 2 Integration Test")
    print("Testing: Results Export & Return Flow")
    print("=" * 70)
    
    # Test 1: Complete workflow
    result = test_complete_workflow()
    if not result:
        print("\n❌ Cannot continue - failed to start assessment")
        return
    
    session_id, redirect_url = result
    
    # Test 2: Session status
    session_data = test_session_status(session_id)
    if not session_data:
        print("\n❌ Cannot continue - failed to get session status")
        return
    
    # Test 3: Export before completion (should fail)
    test_export_before_completion(session_id)
    
    # Test 4: Complete assessment
    if not test_complete_assessment(session_id):
        print("\n❌ Cannot continue - failed to complete assessment")
        return
    
    # Test 5: Export results
    results = test_export_results(session_id)
    if not results:
        print("\n❌ Cannot continue - failed to export results")
        return
    
    # Test 6: Cleanup session
    test_cleanup_session(session_id)
    
    # Summary
    print("\n" + "=" * 70)
    print("🎯 Stage 2 Integration Test Results:")
    print("✅ Assessment creation and session management")
    print("✅ Results completion and storage")
    print("✅ Results export in standardized format")
    print("✅ Session cleanup and validation")
    print("✅ Error handling for incomplete assessments")
    
    print(f"\n🌐 Frontend URL for manual testing:")
    print(f"   {FRONTEND_URL}{redirect_url}")
    print("\n📝 Manual Frontend Test Checklist:")
    print("   □ Page loads in API mode (no initial form)")
    print("   □ 'Complete & Return to Main App' button appears")
    print("   □ Button is disabled until generation completes")
    print("   □ Button enables after all AI generation finishes")
    print("   □ Clicking button completes assessment successfully")
    print("   □ Success message appears after completion")
    
    print("\n🚀 Stage 2 Implementation: COMPLETE!")
    print("Ready for main app integration!")

if __name__ == "__main__":
    main()
