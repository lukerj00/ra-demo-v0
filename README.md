# aiRekon Risk Assessment Tool

A secure AI-powered risk assessment tool with Flask backend and frontend interface.

## Security Architecture

This application now uses a secure architecture where:
- ✅ **API keys are stored securely on the backend** (in `.env` file)
- ✅ **Frontend never sees or handles API keys**
- ✅ **All AI requests go through the backend API**
- ✅ **CORS is properly configured**
- ✅ **No more browser CORS issues**

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Key

Make sure your `.env` file contains your OpenAI API key:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Start the Backend

```bash
python start_backend.py
```

This will start the Flask backend on `http://localhost:5000`

### 4. Open the Frontend

Open `risk-assessment/index.html` in your web browser. The frontend will automatically connect to the backend.

## API Endpoints

The Flask backend provides these endpoints:

- `GET /health` - Health check
- `POST /api/ai/generate-overview` - Generate overview paragraph
- `POST /api/ai/generate-operational` - Generate operational paragraph  
- `POST /api/ai/generate-risks` - Generate risk assessment table
- `POST /api/ai/generate-justification` - Generate field justifications

## Architecture

```
Frontend (HTML/JS) → Flask Backend → OpenAI API
     ↑                    ↑              ↑
  No API key         API key secure   Actual AI calls
```

## Files Changed

- `app.py` - New Flask backend server
- `requirements.txt` - Python dependencies
- `risk-assessment/js/ai-service.js` - Updated to use backend API
- `risk-assessment/js/api-config.js` - Simplified initialization
- `risk-assessment/index.html` - Removed env-loader script

## Development

- Backend runs on `http://localhost:5000`
- Frontend can be opened directly in browser
- CORS is configured to allow frontend-backend communication
- All API keys and sensitive data stay on the backend

## New Features

### Data Persistence & State Management

- **Justification Caching**: Once a justification is generated for a field, it's cached and reused when the same field is clicked again
- **Smart Cache Invalidation**: When you edit risk values, related cached justifications are automatically cleared
- **State Tracking**: Application tracks current step, event data, and generation status
- **Debug Tools**: Use `window.debugRiskAssessment()` in browser console to inspect current state

### How It Works

1. **First Time**: Click a justification icon → AI generates content → Content is stored in data structure
2. **Subsequent Times**: Click the same field → Stored content is instantly displayed
3. **After Editing**: Edit a risk value → Related stored justifications are cleared → Fresh AI content generated on next click

### UI Improvements

- **Consistent Loading States**: Loading messages now use the same spinning circle icon as the risk table
- **Contextual Placement**: Loading indicators appear directly in the content area where the final text will be displayed
- **Progressive Generation**: Shows spinning loader with "AI is generating overview paragraph..." then "AI is generating operational considerations..." in the actual summary area
- **Visual Consistency**: All loading states use the same design pattern throughout the application

### AI Risk Generation Improvements

- **Importance-Based Ordering**: Risks are now generated in order of importance (most critical first)
- **Event-Specific Analysis**: Each risk is highly specific to the actual event type, venue, and circumstances
- **Conversation Context**: AI maintains conversation context to ensure diverse, non-repetitive risks
- **Realistic Assessment**: Impact and likelihood scores reflect realistic assessment for the specific event
- **Progressive Labels**: Loading shows "most critical", "second most critical", etc. to indicate importance ranking

### New Features

#### Generate More Risks
- **Importance-Based Continuation**: Click "Generate More Risks" to add 3 more risks ranked as 7th, 8th, and 9th most critical
- **Maintains Priority Order**: Additional risks continue the importance hierarchy from the initial 6 most critical risks
- **Contextual Continuation**: Uses the same conversation context to ensure new risks are different from existing ones
- **Comprehensive Coverage**: Additional risks cover secondary concerns while maintaining realistic importance ranking

#### Add Custom Risk
- **Manual Risk Entry**: Click "Add Custom Risk" to open a form for manually adding risks
- **Complete Control**: Specify risk description, category, impact, likelihood, and mitigation strategy
- **Professional Integration**: Custom risks integrate seamlessly with AI-generated ones

#### Pre-Generated Justifications
- **Instant Access**: Justifications are generated in the background as soon as risks are created
- **No Waiting**: Click any justification icon (?) and see content immediately - no loading time
- **Background Processing**: AI generates justifications for key fields while you review other content
- **Smart Caching**: All justifications are stored and persist throughout your session

## Security Benefits

1. **No API key exposure** - Keys never leave the server
2. **No CORS issues** - Proper backend handles external API calls
3. **Centralized security** - All authentication in one place
4. **Production ready** - Easy to deploy with proper security
