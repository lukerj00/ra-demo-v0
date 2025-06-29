# AIREKON Risk Assessment API Integration

This document describes the API integration mode for the AIREKON Risk Assessment tool, allowing external applications to start risk assessments programmatically.

## Overview

The API integration allows a main application to:
1. Send event data to the RA tool via API
2. Skip the initial data entry form
3. Let users interact with the full RA generation interface
4. Receive results back for database integration

## API Endpoints

### Start Assessment
```
POST /api/start-assessment
Content-Type: application/json

{
  "eventTitle": "Summer Music Festival 2024",
  "eventDate": "2024-07-15",
  "location": "Hyde Park, London",
  "attendance": 15000,
  "eventType": "Music",
  "venueType": "Outdoor Festival",
  "riskLevel": "3",
  "description": "Large outdoor music festival..."
}
```

**Response:**
```json
{
  "session_id": "uuid-string",
  "redirect_url": "/?session=uuid-string",
  "status": "success"
}
```

### Get Session Data
```
GET /api/session/{session_id}
```

**Response:**
```json
{
  "session_id": "uuid-string",
  "event_data": { ... },
  "status": "started",
  "created_at": "2024-01-15T10:30:00"
}
```

### Complete Assessment
```
POST /api/session/{session_id}/complete
Content-Type: application/json

{
  "rekon_risk": { "score": "4", "level": "Medium", "description": "..." },
  "rekon_context": { "score": "6", "level": "High", "description": "..." },
  "summary": { "paragraph1": "...", "paragraph2": "..." },
  "risks": [ ... ],
  "metadata": { "total_risks": 8, "completed_at": "2024-01-15T10:30:00Z" }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Assessment completed successfully",
  "session_id": "uuid-string"
}
```

### Export Results
```
GET /api/session/{session_id}/results
```

**Response:**
```json
{
  "session_id": "uuid-string",
  "status": "completed",
  "event_data": { ... },
  "assessment_results": { ... },
  "metadata": {
    "created_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T10:45:00Z",
    "session_duration_minutes": 15.0
  }
}
```

### Cleanup Session
```
DELETE /api/session/{session_id}
```

**Response:**
```json
{
  "status": "success",
  "message": "Session cleaned up successfully"
}
```

## Required Fields

- `eventTitle`: String - Name of the event
- `eventDate`: String - Date in YYYY-MM-DD format
- `location`: String - Event location
- `attendance`: Number - Expected attendance
- `eventType`: String - One of: Music, Sport, Community, State, Other

## Optional Fields

- `venueType`: String - Venue type (depends on eventType)
- `riskLevel`: String - Initial risk level (1-5)
- `description`: String - Event description

## Testing

### 1. Start the RA Tool Server
```bash
python app.py
```

### 2. Run API Tests
```bash
python test_api_integration.py
```

### 3. Test Main App Integration
```bash
python example_main_app_integration.py
```

## Integration Flow

1. **Main App** creates event data
2. **Main App** calls `/api/start-assessment` with event data
3. **RA Tool** returns session ID and frontend URL
4. **Main App** redirects user to RA Tool frontend
5. **User** completes risk assessment in RA Tool
6. **RA Tool** returns results to Main App (future implementation)
7. **Main App** stores results in database

## Frontend Behavior in API Mode

When accessed with `?session=uuid` parameter:
- Skips initial event card form
- Loads event data from session
- Shows "← Return to Main App" instead of "← Go Back"
- Functions normally for risk generation
- Will eventually return results to main app

## Current Status

✅ **Stage 1 - Complete:**
- API endpoints for starting assessment
- Session management
- Frontend API mode detection
- Event data loading from session
- Form skipping in API mode

✅ **Stage 2 - Complete:**
- Results export API endpoint (`GET /api/session/{id}/results`)
- Assessment completion API (`POST /api/session/{id}/complete`)
- Session cleanup API (`DELETE /api/session/{id}`)
- "Complete & Return to Main App" button in frontend
- Standardized results format
- Complete integration workflow

🚧 **TODO (Future Enhancements):**
- Return URL redirect functionality
- Session persistence (Redis/database)
- Webhook notifications
- Enhanced error handling
- Session timeouts and auto-cleanup

## Example Integration Code

See `example_main_app_integration.py` for a complete example of how a main application would integrate with this API.

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (missing/invalid data)
- `404`: Session not found
- `500`: Server error

All error responses include a JSON object with an `error` field describing the issue.
