# Testing Data Persistence Features

## How to Test the New Data Persistence Features

### 1. Test Justification Caching

**Steps:**
1. Start the backend: `python app.py`
2. Open `risk-assessment/index.html` in your browser
3. Fill out the event form and generate a risk assessment
4. Click on any justification icon (? icon) next to a field
5. Wait for the AI to generate the justification
6. Close the justification panel
7. Click the same justification icon again
8. **Expected Result**: The justification should appear instantly (cached)

**What to Look For:**
- First click: Loading message, then AI-generated content
- Second click: Instant display of the same content
- Console messages: `💾 Cached justification for: [field]` and `📋 Retrieved cached justification for: [field]`

### 2. Test Cache Invalidation

**Steps:**
1. Generate a risk assessment with some risks
2. Click a justification icon for a risk field (e.g., Impact = "4")
3. Wait for justification to generate and cache
4. Close the justification panel
5. Edit the risk by clicking the "Edit" button
6. Change the Impact value from "4" to "5"
7. Click "Save"
8. Click the justification icon for Impact again
9. **Expected Result**: New AI content should be generated (cache was invalidated)

### 3. Test State Management

**Steps:**
1. Open browser console (F12)
2. Type `window.debugRiskAssessment()` and press Enter
3. **Expected Result**: See current application state including:
   - Current step (setup, generating, review, complete)
   - Event data
   - Cache statistics
   - Risk data count

### 4. Test Summary Editing Cache Invalidation

**Steps:**
1. Generate a contextual summary
2. Click the justification icon for the summary
3. Wait for justification to generate
4. Close the justification panel
5. Click "Edit" on the summary
6. Make some changes to the text
7. Click "Save"
8. Click the justification icon again
9. **Expected Result**: New justification should be generated (cache was cleared)

## Console Messages to Watch For

- `💾 Cached justification for: [field] = "[value]"` - When content is cached
- `📋 Retrieved cached justification for: [field] = "[value]"` - When cached content is used
- `🔄 Application state updated: [state object]` - When application state changes

## Debug Commands

- `window.debugRiskAssessment()` - Show current application state
- `window.justificationCache` - Inspect the justification cache (if exposed)

## Expected Behavior

✅ **Working Correctly:**
- Justifications load instantly on second click
- Cache is cleared when values are edited
- Console shows caching/retrieval messages
- State tracking works properly

❌ **Issues to Report:**
- Justifications regenerate every time (cache not working)
- Cache not cleared after editing values
- No console messages appearing
- State not updating properly
