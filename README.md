# aiRekon Risk Assessment Tool

A sophisticated AI-powered risk assessment platform designed for comprehensive event risk analysis. Built with Flask backend and modern web frontend, this tool leverages OpenAI's GPT-4 to generate professional risk assessments for events ranging from small community gatherings to large-scale festivals and state ceremonies.

## 🎯 Overview

The aiRekon Risk Assessment Tool provides:
- **AI-Powered Risk Analysis**: Contextual risk identification using OpenAI GPT-4
- **Professional Documentation**: Exportable PDF reports for stakeholders and authorities
- **API-First Design**: Seamless integration with existing event management systems
- **Compliance Support**: Aligned with regulatory frameworks including Martyn's Law and ProtectUK guidance

## 🔒 Security Architecture

This application implements enterprise-grade security:
- ✅ **API keys are stored securely on the backend** (in `.env` file)
- ✅ **Frontend never sees or handles API keys**
- ✅ **All AI requests go through the backend API**
- ✅ **CORS is properly configured**
- ✅ **No browser CORS issues**

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- OpenAI API key

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. Start the Application

```bash
python start_backend.py
```

This will:
- Verify all dependencies are installed
- Check your API key configuration
- Start the Flask backend on `http://localhost:5000`
- Display available API endpoints

### 4. Access the Tool

**For API Integration (Recommended):**
- Use the API endpoints to integrate with your existing event management system
- See [API Integration Guide](API_INTEGRATION_README.md) for detailed documentation

**For Direct Access:**
- Open `http://localhost:5000` in your web browser
- The tool is designed for API integration but can be accessed directly for testing

## 🔌 API Endpoints

### Core AI Generation
- `GET /health` - Health check and system status
- `POST /api/ai/generate-overview` - Generate contextual overview paragraph
- `POST /api/ai/generate-operational` - Generate operational considerations
- `POST /api/ai/generate-risks` - Generate comprehensive risk assessment table
- `POST /api/ai/generate-justification` - Generate field-specific justifications

### Session Management (API Integration)
- `POST /api/start-assessment` - Start new assessment with event data
- `GET /api/session/{session_id}` - Retrieve session data
- `POST /api/session/{session_id}/complete` - Complete assessment
- `GET /api/session/{session_id}/results` - Export results
- `DELETE /api/session/{session_id}` - Cleanup session

## 🏗️ Architecture

```
Main App → API Integration → aiRekon Backend → OpenAI GPT-4
    ↓           ↓                 ↓              ↓
Event Data → Session Mgmt → AI Processing → Risk Analysis
    ↓           ↓                 ↓              ↓
Database ← Results Export ← Frontend UI ← Generated Content
```

**Security Flow:**
```
Frontend (HTML/JS) → Flask Backend → OpenAI API
     ↑                    ↑              ↑
  No API key         API key secure   Actual AI calls
```

## 📁 Project Structure

```
ra-demo-v0/
├── app.py                          # Main Flask backend server
├── start_backend.py                # Startup script with validation
├── requirements.txt                # Python dependencies
├── risk-assessment/                # Frontend application
│   ├── index.html                  # Main web interface
│   ├── css/style.css              # Styling
│   └── js/                        # JavaScript modules
├── API_INTEGRATION_README.md       # API integration guide
├── TESTING.md                      # Testing procedures
└── risk_assessment_tool.md         # Detailed documentation
```

## ✨ Key Features

### 🧠 AI-Powered Risk Analysis
- **GPT-4 Integration**: Leverages OpenAI's most advanced model for contextual risk assessment
- **Event-Specific Analysis**: Risks tailored to event type, venue, attendance, and circumstances
- **Importance-Based Ordering**: Risks generated in order of criticality (most critical first)
- **Conversation Context**: AI maintains context to ensure diverse, non-repetitive risk identification
- **Realistic Scoring**: Impact and likelihood scores reflect realistic assessment for specific events

### 📊 Comprehensive Risk Categories
- **Crowd Safety**: Capacity management, crowd dynamics, emergency evacuation
- **Environmental**: Weather conditions, venue hazards, accessibility
- **Security**: Threat assessment, access control, surveillance
- **Medical**: Emergency response, first aid, health considerations
- **Operational**: Logistics, staffing, equipment management
- **Logistics**: Supply chain, transportation, vendor coordination

### 💾 Smart Data Management
- **Justification Caching**: Generated justifications are cached for instant access
- **Smart Cache Invalidation**: Automatic cache clearing when risk values are edited
- **State Tracking**: Real-time tracking of assessment progress and data
- **Session Persistence**: Maintains data integrity throughout the assessment process

### 🎨 Enhanced User Experience
- **Progressive Loading**: Visual feedback during AI content generation
- **Contextual Indicators**: Loading states appear where final content will be displayed
- **Consistent Design**: Unified visual language across all interface elements
- **Responsive Layout**: Optimized for desktop and mobile devices

### 🔄 Dynamic Risk Management
- **Generate More Risks**: Add additional risks ranked by importance (7th, 8th, 9th most critical)
- **Custom Risk Entry**: Manual addition of organization-specific risks
- **Real-time Editing**: Inline editing of risk descriptions, scores, and mitigation strategies
- **Pre-generated Justifications**: Background generation for instant access

## 🔗 API Integration

The aiRekon Risk Assessment Tool is designed for seamless integration with existing event management systems:

### Integration Workflow
1. **Main Application** creates event data
2. **API Call** to `/api/start-assessment` with event parameters
3. **Session Creation** returns session ID and frontend URL
4. **User Redirect** to aiRekon assessment interface
5. **Risk Assessment** completed by user in aiRekon tool
6. **Results Export** via `/api/session/{id}/results`
7. **Data Integration** back to main application database

### Supported Event Types
- **Music Events**: Festivals, concerts, nightclub events, arena tours
- **Community Events**: Street fairs, charity fundraisers, cultural festivals
- **State Events**: Official ceremonies, VIP visits, political conferences
- **Sport Events**: Stadium matches, marathons, motorsport races
- **Corporate Events**: Conferences, product launches, exhibitions

### API-First Design
- **No Manual Forms**: All event data provided via API
- **Session-Based**: Secure session management for multi-step assessments
- **Standardized Output**: Consistent JSON format for easy integration
- **Real-time Status**: Track assessment progress via API calls

## 🧪 Testing & Development

### Running Tests
```bash
# Test API integration
python test_api_integration.py

# Test main app integration workflow
python example_main_app_integration.py

# Test stage 2 integration features
python test_stage2_integration.py
```

### Development Mode
```bash
# Start with debug mode
python app.py --debug

# Start on custom port
python app.py --port=7001

# View detailed logs
python app.py --verbose
```

### Testing Features
See [TESTING.md](TESTING.md) for comprehensive testing procedures including:
- Justification caching validation
- Cache invalidation testing
- State management verification
- Debug console commands

## 🔒 Security Benefits

1. **🔐 No API key exposure** - Keys never leave the server environment
2. **🌐 No CORS issues** - Proper backend handles all external API calls
3. **🎯 Centralized security** - All authentication and authorization in one place
4. **🚀 Production ready** - Designed for secure deployment with proper security controls
5. **📝 Audit trail** - Comprehensive logging for security monitoring
6. **🔄 Session management** - Secure session handling with automatic cleanup

## 📋 Dependencies

### Backend Requirements
- **Flask 3.0.0** - Web framework
- **Flask-CORS 4.0.0** - Cross-origin resource sharing
- **python-dotenv 1.0.0** - Environment variable management
- **openai >=1.0.0** - OpenAI API client
- **gunicorn 21.2.0** - WSGI HTTP server for production
- **httpx >=0.24.0** - HTTP client library

### Frontend Technologies
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Data visualization
- **jsPDF** - PDF generation
- **Vanilla JavaScript** - No framework dependencies

## 🚀 Deployment

### Production Deployment
```bash
# Install production dependencies
pip install -r requirements.txt

# Set production environment variables
export FLASK_ENV=production
export OPENAI_API_KEY=your-production-key

# Start with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker Deployment
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### Environment Configuration
```bash
# Required environment variables
OPENAI_API_KEY=sk-your-openai-api-key
FLASK_ENV=production
FLASK_SECRET_KEY=your-secret-key

# Optional configuration
CORS_ORIGINS=https://yourdomain.com
LOG_LEVEL=INFO
SESSION_TIMEOUT=3600
```

## 📚 Documentation

- **[API Integration Guide](API_INTEGRATION_README.md)** - Complete API integration documentation
- **[Testing Procedures](TESTING.md)** - Comprehensive testing guide
- **[Tool Documentation](risk_assessment_tool.md)** - Detailed feature documentation
- **[Setup Guide](risk-assessment/SETUP.md)** - Frontend setup instructions

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `pip install -r requirements.txt`
4. Set up environment: Copy `.env.example` to `.env` and configure
5. Run tests: `python -m pytest`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Standards
- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add docstrings for all functions and classes
- Include unit tests for new features
- Update documentation for API changes

## 📄 License

This project is proprietary software developed by aiRekon. All rights reserved.

## 🆘 Support

For technical support or questions:
- **Documentation**: Check the comprehensive guides in this repository
- **Issues**: Report bugs via GitHub Issues
- **API Questions**: Refer to [API_INTEGRATION_README.md](API_INTEGRATION_README.md)
- **Testing**: Follow procedures in [TESTING.md](TESTING.md)

## 🔄 Version History

### Current Version: v2.0
- ✅ API-first design with session management
- ✅ Enhanced AI risk generation with GPT-4
- ✅ Smart caching and state management
- ✅ Comprehensive testing suite
- ✅ Production-ready security architecture

### Previous Versions
- **v1.0**: Initial release with basic risk assessment
- **v1.5**: Added frontend improvements and caching

---

**Built with ❤️ by aiRekon** - Transforming risk assessment through AI innovation
