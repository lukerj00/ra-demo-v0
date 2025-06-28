# AI Risk Assessment Tool - Setup Instructions

## Quick Setup for Testing

### 1. Set Your OpenAI API Key

The application now uses a `.env` file to securely store your API key.

**Setup Steps:**
1. Open the `.env` file in the root directory
2. Replace `YOUR_API_KEY_HERE` with your actual OpenAI API key:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Security Note:** The `.env` file is included in `.gitignore` to prevent accidental commits of your API key.

### 2. Open the Application

Open `index.html` in your web browser. The AI service will automatically initialize with your API key.

### 3. Test the AI Features

1. **Fill out the Event Card form** with sample data:
   - Event Title: "Summer Music Festival"
   - Event Date: Any future date
   - Location: "Central Park, New York"
   - Attendance: 5000
   - Event Type: Music
   - Venue Type: (will appear after selecting Event Type)
   - Description: Optional details about the event

2. **Click "Generate Risk Assessment"** to start AI processing

3. **Review AI-generated content**:
   - Contextual summary (AI-generated)
   - Risk assessment table (AI-generated risks)
   - Click info icons for AI justifications

### 4. Expected AI Processing Steps

The tool will show progress through these stages:
1. "AI is generating contextual summary..." (10-30 seconds)
2. "AI is analyzing risks..." (20-60 seconds)
3. "Processing generated risks..." (5-10 seconds)
4. "AI risk analysis complete..."

### 5. Testing AI Justifications

Click the "ℹ️" icons next to:
- Contextual Summary
- Any risk field (description, impact, likelihood, mitigation)

These will generate AI explanations for the assessments.

## Troubleshooting

### Common Issues

**"AI service not configured" error:**
- Check that your API key is correctly set in `js/api-config.js`
- Ensure the API key starts with `sk-`
- Refresh the page after updating the API key

**"Failed to generate AI summary" error:**
- Verify your OpenAI API key has GPT-4 access
- Check your OpenAI account has sufficient credits
- Ensure you have internet connectivity

**Long processing times:**
- GPT-4 can take 30-60 seconds for complex requests
- This is normal for the initial implementation
- Future optimizations will improve speed

### API Usage Notes

- Each risk assessment uses approximately 3000-5000 tokens
- Justifications use an additional 500-800 tokens each
- Monitor your OpenAI usage dashboard for cost tracking

## What's Working

✅ **AI-Powered Components:**
- Contextual summary generation
- Risk identification and assessment
- Impact/likelihood scoring with reasoning
- Mitigation strategy creation
- Detailed justifications for all assessments

✅ **User Experience:**
- Real-time progress tracking
- Error handling with fallbacks
- Interactive justification system
- Professional PDF export (with AI content)

## Next Steps

After testing, we can implement:
- Enhanced scoring algorithms (RekonRisk/RekonContext indices)
- Compliance assessment automation
- Performance optimizations
- Intelligent caching system
