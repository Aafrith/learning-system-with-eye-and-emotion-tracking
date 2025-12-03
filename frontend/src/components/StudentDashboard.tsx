'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LogIn, 
  Users, 
  Brain,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  LogOut,
  Maximize,
  Minimize,
  X
} from 'lucide-react'
import VideoFeed from './VideoFeed'
import EngagementIndicator from './EngagementIndicator'
import FocusAlert from './FocusAlert'
import Notepad from './Notepad'

interface StudentDashboardProps {
  studentName: string
  onBack: () => void
}

interface SessionInfo {
  id: string
  sessionCode: string
  teacherName: string
  subject: string
  startTime: Date
  isActive: boolean
}

interface StudentStats {
  currentEmotion: string
  engagement: 'active' | 'passive' | 'distracted'
  focusLevel: number
  engagementData: {
    active: number
    passive: number
    distracted: number
  }
  gazeData: {
    focused: number
    unfocused: number
  }
}

export default function StudentDashboard({ studentName, onBack }: StudentDashboardProps) {
  const [sessionCode, setSessionCode] = useState('')
  const [currentSession, setCurrentSession] = useState<SessionInfo | null>(null)
  const [isInSession, setIsInSession] = useState(false)
  const [useMockData] = useState(true) // Enable mock mode
  const [stats, setStats] = useState<StudentStats>({
    currentEmotion: '',
    engagement: 'active',
    focusLevel: 100,
    engagementData: { active: 0, passive: 0, distracted: 0 },
    gazeData: { focused: 0, unfocused: 0 }
  })
  const [showFocusAlert, setShowFocusAlert] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [notes, setNotes] = useState('')
  const [isTeacherVideoFullscreen, setIsTeacherVideoFullscreen] = useState(false)

  // Timer for session duration
  useEffect(() => {
    if (!isInSession) return

    const interval = setInterval(() => {
      setSessionDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isInSession])

  // Keyboard shortcut for fullscreen (ESC to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTeacherVideoFullscreen) {
        setIsTeacherVideoFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTeacherVideoFullscreen])

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!isInSession || !currentSession) return

    const ws = new WebSocket(`ws://localhost:8000/ws/student/${currentSession.id}/${studentName}`)
    
    ws.onopen = () => {
      console.log('Connected to session WebSocket')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'focus_alert') {
        setShowFocusAlert(true)
        setTimeout(() => setShowFocusAlert(false), 5000)
      } else if (data.type === 'session_ended') {
        handleLeaveSession()
      }
    }

    return () => ws.close()
  }, [isInSession, currentSession])

  const joinSession = async () => {
    if (!sessionCode.trim()) {
      alert('Please enter a session code')
      return
    }

    if (useMockData) {
      // Mock mode - simulate joining
      setCurrentSession({
        id: `mock_session_${Date.now()}`,
        sessionCode: sessionCode.toUpperCase(),
        teacherName: 'Prof. Anderson',
        subject: 'Advanced Mathematics',
        startTime: new Date(),
        isActive: true
      })
      setIsInSession(true)
      setSessionCode('')
      return
    }

    // Real mode - use backend
    try {
      const response = await fetch('http://localhost:8000/student/sessions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_code: sessionCode.toUpperCase(),
          student_name: studentName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to join session')
      }

      const session = await response.json()
      setCurrentSession({
        id: session.session_id,
        sessionCode: sessionCode.toUpperCase(),
        teacherName: session.teacher_name,
        subject: session.subject,
        startTime: new Date(session.start_time),
        isActive: true
      })
      setIsInSession(true)
      setSessionCode('')
    } catch (error) {
      console.error('Error joining session:', error)
      alert('Failed to join session. Please check the code and try again.')
    }
  }

  const handleLeaveSession = async () => {
    if (!currentSession) return

    if (useMockData) {
      // Mock mode
      setIsInSession(false)
      setCurrentSession(null)
      setSessionDuration(0)
      setStats({
        currentEmotion: '',
        engagement: 'active',
        focusLevel: 100,
        engagementData: { active: 0, passive: 0, distracted: 0 },
        gazeData: { focused: 0, unfocused: 0 }
      })
      return
    }

    // Real mode
    try {
      await fetch(`http://localhost:8000/student/sessions/${currentSession.id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_name: studentName })
      })
    } catch (error) {
      console.error('Error leaving session:', error)
    }

    // Auto-save notes if any exist
    if (notes.trim()) {
      const shouldSave = confirm('Would you like to download your notes before leaving?')
      if (shouldSave) {
        downloadNotes()
      }
    }

    setIsInSession(false)
    setCurrentSession(null)
    setSessionDuration(0)
    setStats({
      currentEmotion: '',
      engagement: 'active',
      focusLevel: 100,
      engagementData: { active: 0, passive: 0, distracted: 0 },
      gazeData: { focused: 0, unfocused: 0 }
    })
  }

  const downloadNotes = () => {
    if (!notes.trim()) return
    
    const sessionInfo = currentSession ? `
Session: ${currentSession.subject}
Teacher: ${currentSession.teacherName}
Date: ${new Date().toLocaleDateString()}
Duration: ${formatDuration(sessionDuration)}

---

` : ''
    
    const fullContent = sessionInfo + notes
    const blob = new Blob([fullContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-notes-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleEmotionDetected = (emotion: string) => {
    setStats(prev => {
      const newStats = { ...prev, currentEmotion: emotion }
      
      // Map emotion to engagement
      const emotionMap: Record<string, 'active' | 'passive' | 'distracted'> = {
        'happy': 'active',
        'neutral': 'passive',
        'sad': 'distracted',
        'angry': 'distracted',
        'fearful': 'distracted',
        'surprised': 'passive',
        'disgusted': 'distracted'
      }
      
      const engagement = emotionMap[emotion.toLowerCase()] || 'passive'
      newStats.engagement = engagement
      newStats.engagementData[engagement]++

      // Update focus level
      const focusLevels = { active: 100, passive: 70, distracted: 30 }
      newStats.focusLevel = focusLevels[engagement]

      // Send update to backend
      if (currentSession) {
        sendStatsUpdate(newStats)
      }

      return newStats
    })
  }

  const sendStatsUpdate = async (updatedStats: StudentStats) => {
    if (!currentSession) return

    try {
      await fetch(`http://localhost:8000/student/sessions/${currentSession.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          emotion: updatedStats.currentEmotion,
          engagement: updatedStats.engagement,
          focus_level: updatedStats.focusLevel
        })
      })
    } catch (error) {
      console.error('Error sending stats update:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'active': return 'text-success-600'
      case 'passive': return 'text-warning-600'
      case 'distracted': return 'text-danger-600'
      default: return 'text-gray-600'
    }
  }

  const getEngagementIcon = (engagement: string) => {
    switch (engagement) {
      case 'active': return <CheckCircle className="w-5 h-5" />
      case 'passive': return <Clock className="w-5 h-5" />
      case 'distracted': return <AlertCircle className="w-5 h-5" />
      default: return <Brain className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-gray-600">Welcome, {studentName}</p>
              {/* <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">DEMO MODE</span> */}
            </div>
            <div className="flex items-center space-x-3">
              {/* Back to Home button removed - use Navbar instead */}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isInSession && currentSession ? (
          /* In Session View */
          <div className="max-w-6xl mx-auto">
            {/* Session Header */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-success-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-success-600">Active Session</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentSession.subject}</h2>
                  <p className="text-gray-600">Teacher: {currentSession.teacherName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-2">Session Duration</p>
                  <p className="text-2xl font-bold text-gray-900 font-mono">{formatDuration(sessionDuration)}</p>
                  <button onClick={handleLeaveSession} className="btn btn-danger mt-4">
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Session
                  </button>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Teacher Video Feed */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Teacher: {currentSession.teacherName}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm px-3 py-1 bg-primary-100 text-primary-800 rounded-full font-medium">
                        Live Presentation
                      </span>
                      <button
                        onClick={() => setIsTeacherVideoFullscreen(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Fullscreen"
                      >
                        <Maximize className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                    <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-primary-900 to-primary-700">
                      <div className="text-center text-white">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold">Teacher Camera</p>
                        <p className="text-sm opacity-75 mt-2">Teacher video feed will appear here</p>
                        <div className="mt-4 flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs">Connected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Video Feed */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Eye className="w-5 h-5 mr-2" />
                      Your Camera Feed
                    </h3>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getEngagementColor(stats.engagement)}`}>
                      {getEngagementIcon(stats.engagement)}
                      <span className="capitalize">{stats.engagement}</span>
                    </div>
                  </div>
                  <VideoFeed 
                    isActive={isInSession} 
                    onEmotionDetected={handleEmotionDetected}
                  />
                </div>

                {/* Learning Notes */}
                <Notepad notes={notes} onNotesChange={setNotes} />
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Engagement Analytics */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Engagement Analytics</h3>
                  <EngagementIndicator
                    engagement={stats.engagementData}
                    currentLevel={stats.engagement}
                    currentEmotion={stats.currentEmotion}
                  />
                </div>

                {/* Real-time Status */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Brain className="w-5 h-5 mr-2" />
                    Real-time Status
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current Emotion:</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {stats.currentEmotion || 'Detecting...'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Engagement:</span>
                      <span className={`font-medium capitalize ${getEngagementColor(stats.engagement)}`}>
                        {stats.engagement}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Focus Level:</span>
                      <span className="font-medium text-gray-900">{stats.focusLevel}%</span>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Overall Progress</span>
                          <span className="font-medium">{stats.focusLevel}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              stats.focusLevel >= 70 ? 'bg-success-600' : 
                              stats.focusLevel >= 40 ? 'bg-warning-600' : 'bg-danger-600'
                            }`}
                            style={{ width: `${stats.focusLevel}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Engagement Tips */}
                <div className="bg-gradient-to-br from-primary-50 to-success-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Tips for Better Engagement</h3>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Maintain eye contact with the camera</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Take short breaks when needed</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Stay in a well-lit environment</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Minimize distractions around you</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Join Session View */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-success-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Join a Session</h2>
                <p className="text-gray-600">Enter the code provided by your teacher</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Code
                  </label>
                  <input
                    type="text"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && joinSession()}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full px-4 py-3 text-center text-2xl font-bold tracking-wider border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent uppercase"
                  />
                </div>

                <button
                  onClick={joinSession}
                  disabled={sessionCode.length < 6}
                  className="w-full btn btn-success py-3 text-lg"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Join Session
                </button>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Make sure you have a working camera and are in a well-lit environment for accurate emotion detection.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Teacher Video Modal */}
      <AnimatePresence>
        {isTeacherVideoFullscreen && currentSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
            onClick={() => setIsTeacherVideoFullscreen(false)}
          >
            <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-6">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-3">
                    <Users className="w-6 h-6" />
                    <div>
                      <h3 className="text-xl font-semibold">{currentSession.teacherName}</h3>
                      <p className="text-sm opacity-75">{currentSession.subject}</p>
                    </div>
                    <span className="ml-4 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-sm flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                      Live
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsTeacherVideoFullscreen(false)}
                      className="p-3 hover:bg-white/10 rounded-lg transition-colors"
                      title="Exit Fullscreen"
                    >
                      <Minimize className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setIsTeacherVideoFullscreen(false)}
                      className="p-3 hover:bg-white/10 rounded-lg transition-colors"
                      title="Close"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Video Content */}
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-900 to-primary-700">
                <div className="text-center text-white">
                  <Users className="w-24 h-24 mx-auto mb-6 opacity-50" />
                  <p className="text-2xl font-semibold mb-2">Teacher Camera - Fullscreen</p>
                  <p className="text-lg opacity-75 mb-4">Teacher video feed will appear here</p>
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Connected</span>
                  </div>
                  <p className="mt-8 text-sm opacity-60">Press ESC or click the × button to exit fullscreen</p>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-white text-sm">
                    <span className="opacity-75">Duration:</span>
                    <span className="ml-2 font-mono font-semibold">{formatDuration(sessionDuration)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Alert */}
      {showFocusAlert && (
        <FocusAlert 
          onClose={() => setShowFocusAlert(false)}
        />
      )}
    </div>
  )
}
