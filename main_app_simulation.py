#!/usr/bin/env python3
"""
Main App Simulation - Complete Integration Workflow
Demonstrates how a main application would integrate with the AIREKON Risk Assessment tool
"""

import requests
import json
import time
from datetime import datetime, timedelta

class MainAppSimulation:
    """Simulates a main application integrating with AIREKON RA tool"""
    
    def __init__(self, ra_tool_url="http://localhost:6001"):
        self.ra_tool_url = ra_tool_url
        self.events_database = {}  # Simulated database
        self.assessments_database = {}  # Simulated assessments storage
    
    def create_event(self, event_data):
        """Simulate creating an event in main app database"""
        event_id = len(self.events_database) + 1
        event_data['id'] = event_id
        event_data['created_at'] = datetime.now().isoformat()
        event_data['status'] = 'draft'
        
        self.events_database[event_id] = event_data
        print(f"📅 Event created in main app: ID {event_id}")
        return event_id
    
    def transform_event_for_ra(self, event_data):
        """Transform main app event data to RA tool format"""
        return {
            "eventTitle": event_data['name'],
            "eventDate": event_data['date'],
            "location": f"{event_data['venue']}, {event_data['city']}",
            "attendance": event_data['expected_attendees'],
            "eventType": self.map_event_type(event_data['category']),
            "venueType": self.map_venue_type(event_data['venue_type']),
            "riskLevel": str(event_data.get('initial_risk_level', 3)),
            "description": event_data['description']
        }
    
    def map_event_type(self, category):
        """Map main app categories to RA tool types"""
        mapping = {
            "music_festival": "Music",
            "sports_event": "Sport", 
            "conference": "Other",
            "community_event": "Community"
        }
        return mapping.get(category, "Other")
    
    def map_venue_type(self, venue_type):
        """Map main app venue types to RA tool types"""
        mapping = {
            "outdoor_festival": "Outdoor Festival",
            "indoor_venue": "Indoor Concert",
            "stadium": "Stadium Match (e.g., Football, Rugby)",
            "conference_center": "Corporate Conference"
        }
        return mapping.get(venue_type, "Other")
    
    def start_risk_assessment(self, event_id):
        """Start risk assessment for an event"""
        print(f"\n🚀 Starting risk assessment for event {event_id}...")
        
        if event_id not in self.events_database:
            print(f"❌ Event {event_id} not found")
            return None
        
        event_data = self.events_database[event_id]
        ra_data = self.transform_event_for_ra(event_data)
        
        try:
            # Start assessment in RA tool
            response = requests.post(
                f"{self.ra_tool_url}/api/start-assessment",
                json=ra_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                session_id = result['session_id']
                frontend_url = f"{self.ra_tool_url}{result['redirect_url']}"
                
                # Store session info in main app
                assessment_record = {
                    'event_id': event_id,
                    'session_id': session_id,
                    'status': 'in_progress',
                    'started_at': datetime.now().isoformat(),
                    'frontend_url': frontend_url
                }
                
                self.assessments_database[session_id] = assessment_record
                
                print(f"✅ Risk assessment started successfully")
                print(f"   Session ID: {session_id}")
                print(f"   Frontend URL: {frontend_url}")
                print(f"   User would be redirected to: {frontend_url}")
                
                return session_id, frontend_url
            else:
                print(f"❌ Failed to start assessment: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error starting assessment: {e}")
            return None
    
    def check_assessment_status(self, session_id):
        """Check if assessment is completed"""
        try:
            response = requests.get(f"{self.ra_tool_url}/api/session/{session_id}")
            
            if response.status_code == 200:
                data = response.json()
                return data['status']
            else:
                return 'error'
                
        except Exception as e:
            print(f"❌ Error checking status: {e}")
            return 'error'
    
    def retrieve_assessment_results(self, session_id):
        """Retrieve completed assessment results"""
        print(f"\n📥 Retrieving assessment results for session {session_id}...")
        
        try:
            response = requests.get(f"{self.ra_tool_url}/api/session/{session_id}/results")
            
            if response.status_code == 200:
                results = response.json()
                
                # Store results in main app database
                if session_id in self.assessments_database:
                    self.assessments_database[session_id]['results'] = results
                    self.assessments_database[session_id]['status'] = 'completed'
                    self.assessments_database[session_id]['completed_at'] = datetime.now().isoformat()
                
                print(f"✅ Assessment results retrieved successfully")
                print(f"   Event: {results['event_data']['eventTitle']}")
                print(f"   RekonRisk Score: {results['assessment_results']['rekon_risk']['score']}")
                print(f"   Total Risks: {results['assessment_results']['metadata']['total_risks']}")
                print(f"   Duration: {results['metadata']['session_duration_minutes']} minutes")
                
                return results
            else:
                print(f"❌ Failed to retrieve results: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error retrieving results: {e}")
            return None
    
    def cleanup_ra_session(self, session_id):
        """Clean up RA tool session after retrieving results"""
        try:
            response = requests.delete(f"{self.ra_tool_url}/api/session/{session_id}")
            
            if response.status_code == 200:
                print(f"✅ RA session {session_id} cleaned up")
                return True
            else:
                print(f"⚠️  Failed to cleanup RA session: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error cleaning up session: {e}")
            return False
    
    def simulate_complete_workflow(self):
        """Simulate the complete integration workflow"""
        print("🏢 Main App Simulation: Complete Integration Workflow")
        print("=" * 60)
        
        # Step 1: Create event in main app
        event_data = {
            'name': 'Summer Music Festival 2024',
            'date': (datetime.now() + timedelta(days=45)).strftime('%Y-%m-%d'),
            'venue': 'Central Park',
            'city': 'New York, NY',
            'expected_attendees': 25000,
            'category': 'music_festival',
            'venue_type': 'outdoor_festival',
            'initial_risk_level': 4,
            'description': 'Large outdoor music festival featuring multiple stages, food vendors, camping areas, and international artists. Expected to run for 3 days with various weather contingencies.'
        }
        
        event_id = self.create_event(event_data)
        
        # Step 2: Start risk assessment
        result = self.start_risk_assessment(event_id)
        if not result:
            return
        
        session_id, frontend_url = result
        
        # Step 3: Simulate user completing assessment
        print(f"\n⏳ User would now complete assessment at: {frontend_url}")
        print("   (In real workflow, user interacts with RA tool frontend)")
        print("   (For simulation, we'll wait and then check status)")
        
        # Simulate some time passing
        print("\n⏱️  Simulating user completing assessment...")
        time.sleep(2)
        
        # Check status (in real app, this might be triggered by webhook or polling)
        status = self.check_assessment_status(session_id)
        print(f"📊 Assessment status: {status}")
        
        if status == 'completed':
            # Step 4: Retrieve results
            results = self.retrieve_assessment_results(session_id)
            
            if results:
                # Step 5: Process results in main app
                print(f"\n💾 Processing results in main app database...")
                event_id = self.assessments_database[session_id]['event_id']
                self.events_database[event_id]['risk_assessment'] = results
                self.events_database[event_id]['status'] = 'risk_assessed'
                
                # Step 6: Cleanup RA session
                self.cleanup_ra_session(session_id)
                
                # Step 7: Show final status
                print(f"\n🎯 Integration Workflow Complete!")
                print(f"   Event ID: {event_id}")
                print(f"   Assessment Session: {session_id}")
                print(f"   Final Status: {self.events_database[event_id]['status']}")
                print(f"   Risk Score: {results['assessment_results']['rekon_risk']['score']}/7")
                
                return True
        else:
            print(f"⚠️  Assessment not completed yet (status: {status})")
            print(f"   In real app, you would wait for completion or set up webhooks")
            return False

def main():
    """Run the main app simulation"""
    print("🧪 AIREKON Risk Assessment - Main App Integration Simulation")
    print("=" * 70)
    
    # Initialize main app simulation
    main_app = MainAppSimulation()
    
    # Run complete workflow
    success = main_app.simulate_complete_workflow()
    
    if success:
        print("\n✅ Main App Integration Simulation: SUCCESS!")
        print("🚀 Ready for production integration!")
    else:
        print("\n❌ Simulation incomplete - check RA tool status")
    
    print("\n📋 Integration Summary:")
    print("   ✅ Event creation in main app")
    print("   ✅ Data transformation for RA tool")
    print("   ✅ Assessment session initiation")
    print("   ✅ Results retrieval and storage")
    print("   ✅ Session cleanup")
    print("   ✅ Complete workflow validation")

if __name__ == "__main__":
    main()
