#!/usr/bin/env python3
"""
Example of how a main application would integrate with the AIREKON Risk Assessment tool
This simulates the main app sending event data to the RA tool
"""

import requests
import json
from datetime import datetime, timedelta

class MainAppRiskAssessmentIntegration:
    """Example integration class for main application"""
    
    def __init__(self, ra_tool_base_url="http://localhost:7001"):
        self.ra_tool_base_url = ra_tool_base_url
    
    def transform_event_data(self, main_app_event):
        """Transform main app event data to RA tool format"""
        return {
            "eventTitle": main_app_event.get("name", ""),
            "eventDate": main_app_event.get("date", ""),
            "location": f"{main_app_event.get('venue', '')}, {main_app_event.get('city', '')}",
            "attendance": main_app_event.get("expected_attendees", 0),
            "eventType": self.map_event_type(main_app_event.get("category", "")),
            "venueType": self.map_venue_type(main_app_event.get("venue_type", "")),
            "riskLevel": main_app_event.get("initial_risk_level", ""),
            "description": main_app_event.get("description", "")
        }
    
    def map_event_type(self, main_app_category):
        """Map main app event categories to RA tool event types"""
        mapping = {
            "concert": "Music",
            "festival": "Music",
            "conference": "Other",
            "sports": "Sport",
            "community": "Community",
            "government": "State"
        }
        return mapping.get(main_app_category.lower(), "Other")
    
    def map_venue_type(self, main_app_venue_type):
        """Map main app venue types to RA tool venue types"""
        mapping = {
            "outdoor_festival": "Outdoor Festival",
            "indoor_venue": "Indoor Concert",
            "stadium": "Stadium Match (e.g., Football, Rugby)",
            "conference_center": "Corporate Conference",
            "community_center": "Local Market"
        }
        return mapping.get(main_app_venue_type.lower(), "Other")
    
    def start_risk_assessment(self, event_data, return_url=None):
        """Start risk assessment for an event"""
        try:
            # Transform data to RA tool format
            ra_event_data = self.transform_event_data(event_data)
            
            # Add return URL if provided
            if return_url:
                ra_event_data["return_url"] = return_url
            
            # Send to RA tool
            response = requests.post(
                f"{self.ra_tool_base_url}/api/start-assessment",
                json=ra_event_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "session_id": result["session_id"],
                    "frontend_url": f"{self.ra_tool_base_url}{result['redirect_url']}",
                    "message": "Risk assessment started successfully"
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to start assessment: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Integration error: {str(e)}"
            }
    
    def get_assessment_status(self, session_id):
        """Check the status of an ongoing assessment"""
        try:
            response = requests.get(f"{self.ra_tool_base_url}/api/session/{session_id}")
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json()
                }
            else:
                return {
                    "success": False,
                    "error": f"Session not found: {response.status_code}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Status check error: {str(e)}"
            }

def example_usage():
    """Example of how the main app would use the integration"""
    
    # Initialize the integration
    ra_integration = MainAppRiskAssessmentIntegration()
    
    # Example event data from main app database
    main_app_event = {
        "id": 12345,
        "name": "Tech Conference 2024",
        "date": (datetime.now() + timedelta(days=45)).strftime('%Y-%m-%d'),
        "venue": "Convention Center",
        "city": "San Francisco, CA",
        "expected_attendees": 2500,
        "category": "conference",
        "venue_type": "conference_center",
        "initial_risk_level": "2",
        "description": "Annual technology conference featuring keynote speakers, workshops, and networking sessions. Includes exhibition hall with vendor booths and catered meals."
    }
    
    print("🏢 Main App: Starting Risk Assessment Integration")
    print("=" * 60)
    
    # Step 1: Start risk assessment
    print(f"📊 Event: {main_app_event['name']}")
    print(f"📅 Date: {main_app_event['date']}")
    print(f"📍 Location: {main_app_event['venue']}, {main_app_event['city']}")
    print(f"👥 Attendees: {main_app_event['expected_attendees']}")
    
    print("\n🚀 Starting risk assessment...")
    result = ra_integration.start_risk_assessment(
        main_app_event,
        return_url="http://localhost:8000/events/12345/risk-assessment/complete"
    )
    
    if result["success"]:
        print("✅ Risk assessment started successfully!")
        print(f"   Session ID: {result['session_id']}")
        print(f"   Frontend URL: {result['frontend_url']}")
        
        # Step 2: Check status
        print("\n🔍 Checking assessment status...")
        status = ra_integration.get_assessment_status(result["session_id"])
        
        if status["success"]:
            print("✅ Status retrieved successfully!")
            print(f"   Status: {status['data']['status']}")
            print(f"   Created: {status['data']['created_at']}")
        else:
            print(f"❌ Status check failed: {status['error']}")
        
        # Step 3: Instructions for user
        print("\n" + "=" * 60)
        print("🎯 Next Steps:")
        print("1. User would be redirected to the RA tool frontend")
        print("2. User completes the risk assessment")
        print("3. RA tool sends results back to main app")
        print("4. Main app stores results in database")
        
        print(f"\n🔗 Frontend URL to test: {result['frontend_url']}")
        
    else:
        print(f"❌ Failed to start risk assessment: {result['error']}")
        if "details" in result:
            print(f"   Details: {result['details']}")

if __name__ == "__main__":
    example_usage()
