# Real-Time Learner Feedback System

An AI-powered learning analytics system that combines facial emotion recognition and gaze tracking to monitor student engagement during online learning sessions.

## 🚀 Features

### Core Functionality
- **Real-time Facial Emotion Recognition**: Analyzes facial expressions to categorize learner engagement
- **Gaze Tracking**: Monitors attention focus with smart 8-minute intervals
- **Session Management**: Complete learning session lifecycle management
- **PDF Report Generation**: Automated comprehensive session reports
- **Note-taking Integration**: Built-in notepad for session notes

### Engagement Categories
- **Active Learner**: Fully engaged and attentive
- **Passive Learner**: Present but not fully focused
- **Non-learner**: Distracted or not paying attention

### Smart Alerts
- Focus alerts when learner is unfocused for 8+ minutes
- Real-time engagement level indicators
- Session analytics and insights

## 🏗️ Architecture

### Frontend (Next.js + TypeScript)
- Modern React components with Framer Motion animations
- Real-time WebSocket communication
- Responsive design with Tailwind CSS
- Interactive charts and analytics dashboard

### Backend (FastAPI + Python)
- RESTful API with WebSocket support
- MediaPipe for facial landmark detection
- Machine learning model integration
- PDF report generation with ReportLab

## 📋 Prerequisites

### System Requirements
- Python 3.8+
- Node.js 16+
- Webcam access
- Modern web browser

### Python Dependencies
- FastAPI
- OpenCV
- MediaPipe
- scikit-learn
- ReportLab

### Node.js Dependencies
- Next.js 14
- React 18
- Tailwind CSS
- Framer Motion
- Recharts

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd leaning-system
```

### 2. Start the Backend
```bash
# Option 1: Using the startup script
python start_backend.py

# Option 2: Manual setup
cd backend
pip install -r requirements.txt
python main.py
```

### 3. Start the Frontend
```bash
# Option 1: Using the startup script
python start_frontend.py

# Option 2: Manual setup
npm install
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📖 Usage Guide

### Starting a Learning Session
1. Enter your name on the welcome screen
2. Click "Start Learning Session"
3. Allow camera access when prompted
4. The system will begin monitoring your engagement

### During the Session
- **Real-time Monitoring**: Your facial expressions are analyzed continuously
- **Gaze Tracking**: Attention is checked every 8 minutes
- **Focus Alerts**: You'll be notified if unfocused for 8+ minutes
- **Note-taking**: Use the integrated notepad for session notes

### Session Analytics
- **Engagement Levels**: See your active, passive, and distracted time
- **Focus Score**: Track your attention percentage
- **Real-time Charts**: Visual representation of your engagement
- **Session History**: View past sessions and trends

### Generating Reports
- Sessions automatically generate PDF reports
- Reports include engagement analytics and gaze tracking results
- Download reports from the session history

## 🔧 Configuration

### Backend Configuration
Edit `backend/main.py` to modify:
- Camera index (default: 0)
- Gaze check interval (default: 8 minutes)
- Focus alert threshold (default: 8 minutes)
- Model paths and parameters

### Frontend Configuration
Edit `next.config.js` to modify:
- API endpoints
- Image domains
- Build settings

## 📊 API Endpoints

### Session Management
- `POST /sessions/start` - Start a new session
- `POST /sessions/end` - End a session
- `GET /sessions/{session_id}` - Get session data
- `GET /sessions/{session_id}/report` - Generate PDF report

### Real-time Data
- `GET /video_feed` - MJPEG video stream
- `WebSocket /ws` - Real-time emotion data
- `WebSocket /ws/{session_id}` - Session-specific updates

### Data Updates
- `POST /sessions/{session_id}/gaze` - Update gaze tracking
- `POST /sessions/{session_id}/emotion` - Update emotion data

## 🎨 UI Components

### Core Components
- **WelcomeScreen**: Session initialization
- **LearningSession**: Main learning interface
- **VideoFeed**: Live camera feed with overlays
- **EngagementIndicator**: Real-time engagement analytics
- **GazeTracker**: Focus monitoring and alerts
- **Notepad**: Integrated note-taking
- **SessionHistory**: Analytics dashboard

### Design Features
- Modern, responsive design
- Real-time animations and indicators
- Interactive charts and graphs
- Accessibility-friendly interface

## 🔒 Privacy & Security

### Data Protection
- All facial data is processed locally
- No data is stored permanently
- Anonymous session reports
- Secure WebSocket connections

### Camera Access
- Requires explicit user permission
- Local processing only
- No cloud data transmission

## 🐛 Troubleshooting

### Common Issues

#### Camera Not Working
- Check camera permissions in browser
- Verify camera is not used by other applications
- Try different camera index in backend config

#### WebSocket Connection Failed
- Ensure backend is running on port 8000
- Check CORS settings
- Verify firewall settings

#### Model Loading Errors
- Ensure model files are in the correct directory
- Check file permissions
- Verify Python dependencies are installed

### Debug Mode
Enable debug logging by setting environment variable:
```bash
export DEBUG=1
```

## 📈 Performance Optimization

### Backend Optimization
- Adjust frame processing rate
- Optimize model inference
- Configure WebSocket intervals

### Frontend Optimization
- Enable Next.js optimizations
- Optimize image loading
- Configure caching strategies

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Follow PEP 8 for Python
- Use TypeScript for frontend
- Write comprehensive tests
- Document new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- MediaPipe for facial landmark detection
- FastAPI for the backend framework
- Next.js for the frontend framework
- OpenCV for computer vision processing

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

---

**Note**: This system is designed for educational and research purposes. Ensure compliance with privacy regulations in your jurisdiction.
