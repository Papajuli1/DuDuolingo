# DuDuolingo - Interactive Language Learning Platform

## Project Overview

DuDuolingo is an innovative language learning application that combines visual recognition technology with gamified learning experiences. Built as a final project for the "Idea to Reality" course, this platform offers an engaging way to learn Spanish and German through interactive image-based exercises.

## Key Features

### 🎯 Interactive Learning Modes
- **Step Mode**: Daily progressive lessons with video rewards
- **Brick Mode**: Skill-based challenges organized by difficulty levels
- **Image Recognition**: AI-powered object detection for vocabulary learning

### 🌍 Multi-Language Support
- **Spanish**: Complete learning path with cultural context
- **German**: Comprehensive vocabulary and grammar exercises
- **Visual Learning**: Learn through real-world images and scenarios

### 🎮 Gamification Elements
- **Scoring System**: Performance-based scoring with hint penalties
- **Progress Tracking**: Visual progress indicators and completion status
- **Hint System**: Up to 2 hints per exercise with score deduction
- **Achievement Levels**: Unlock advanced content through progression

### 🔧 Technical Features
- **Real-time Object Detection**: AI-powered image analysis for vocabulary validation
- **Responsive Design**: Optimized for desktop and mobile devices
- **User Authentication**: Secure login and progress persistence
- **Sound Integration**: Audio feedback for correct/incorrect answers
- **Video Rewards**: Engaging video content upon lesson completion

## Technology Stack

### Frontend
- **React.js**: Modern component-based UI framework
- **CSS3**: Custom styling with responsive design
- **JavaScript ES6+**: Modern JavaScript features and async operations

### Backend
- **Python Flask**: Lightweight web application framework
- **SQLite**: Local database for user progress and content storage
- **Computer Vision**: Object detection API for image recognition
- **RESTful APIs**: Clean API design for frontend-backend communication

## Project Structure

```
DuDuolingo/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Step.js          # Daily lesson component
│   │   │   ├── Brick.js         # Skill-based exercise component
│   │   │   └── *.css           # Component styling
│   │   ├── pages/
│   │   │   ├── HomePage.js      # Main dashboard
│   │   │   ├── StepsPage.js     # Lesson selection
│   │   │   └── BrickModePage.js # Skill challenges
│   │   └── App.js              # Main application component
├── backend/
│   ├── app.py                  # Flask application server
│   ├── database/               # SQLite database files
│   └── static/                # Static assets (images, sounds, videos)
└── README.md
```

## Learning Experience

### Step Mode Features
- **Progressive Learning**: Sequential daily lessons building vocabulary
- **Visual Recognition**: Click on words you recognize in real-world images
- **Video Rewards**: Unlock engaging video content upon completion
- **Cultural Context**: Learn through authentic scenarios and situations

### Brick Mode Features
- **Skill-Based Learning**: Organized by difficulty levels (Level 1, 2, 3...)
- **Unlockable Content**: Progress through levels by completing previous challenges
- **Focused Practice**: Target specific vocabulary and grammar concepts
- **Immediate Feedback**: Real-time scoring and performance tracking

### AI-Powered Features
- **Object Detection**: Advanced computer vision identifies objects in images
- **Smart Hints**: AI-guided hints highlight relevant objects when requested
- **Accuracy Validation**: Automatic verification of vocabulary recognition
- **Adaptive Learning**: Content difficulty adjusts based on performance

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- Modern web browser

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
pip install flask flask-cors
python app.py
```

### Access Application
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

## Future Enhancements

- **Mobile App**: Native iOS and Android applications
- **More Languages**: French, Italian, Portuguese, and other languages
- **Speech Recognition**: Speaking practice with pronunciation feedback
- **Social Features**: Leaderboards, friends, and community challenges
- **Offline Mode**: Download lessons for offline learning
- **Advanced AI**: More sophisticated object detection and learning analytics

## Course Learning Outcomes

This project demonstrates mastery of:
- **Full-stack Development**: Complete web application from concept to deployment
- **User Experience Design**: Intuitive, engaging interface design
- **API Integration**: Third-party services and custom backend development
- **Project Management**: Planning, development, and iteration cycles
- **Problem-solving**: Creative solutions to complex technical challenges
- **Modern Development Practices**: Component architecture, responsive design, and clean code

---

**DuDuolingo** - Making language learning visual, interactive, and fun! 🌟
