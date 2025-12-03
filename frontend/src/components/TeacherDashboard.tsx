'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Users, 
  Play, 
  Square, 
  Download, 
  Eye, 
  Clock,
  TrendingUp,
  AlertCircle,
  Copy,
  Check,
  Video,
  Maximize,
  Minimize,
  X
} from 'lucide-react'
import VideoFeed from './VideoFeed'

interface LiveSession {
  id: string
  sessionCode: string
  teacherName: string
  subject: string
  startTime: Date
  isActive: boolean
  students: StudentInSession[]
  maxStudents: number
}

interface StudentInSession {
  id: string
  name: string
  emotion: string
  engagement: 'active' | 'passive' | 'distracted'
  focusLevel: number
  joinedAt: Date
}

interface TeacherDashboardProps {
  teacherName: string
  onBack: () => void
}

export default function TeacherDashboard({ teacherName, onBack }: TeacherDashboardProps) {
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null)
  const [pastSessions, setPastSessions] = useState<LiveSession[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false)
  const [newSessionData, setNewSessionData] = useState({
    subject: '',
    maxStudents: 30
  })

  // Mock student data generator
  const generateMockStudents = (): StudentInSession[] => {
    const names = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Lee', 'Emma Wilson']
    const emotions = ['happy', 'neutral', 'focused', 'surprised', 'calm']
    const engagements: ('active' | 'passive' | 'distracted')[] = ['active', 'passive', 'distracted']
    
    return names.slice(0, Math.floor(Math.random() * 5) + 1).map((name, index) => ({
      id: `student_${index}`,
      name,
      emotion: emotions[Math.floor(Math.random() * emotions.length)],
      engagement: engagements[Math.floor(Math.random() * engagements.length)],
      focusLevel: Math.floor(Math.random() * 40) + 60,
      joinedAt: new Date(Date.now() - Math.random() * 600000)
    }))
  }

  // Simulate real-time student updates
  useEffect(() => {
    if (!currentSession) return

    const interval = setInterval(() => {
      setCurrentSession(prev => {
        if (!prev) return prev
        
        const updatedStudents = prev.students.map(student => ({
          ...student,
          emotion: ['happy', 'neutral', 'focused', 'surprised', 'calm'][Math.floor(Math.random() * 5)],
          engagement: (['active', 'passive', 'distracted'] as const)[Math.floor(Math.random() * 3)],
          focusLevel: Math.max(30, Math.min(100, student.focusLevel + (Math.random() * 20 - 10)))
        }))
        
        return { ...prev, students: updatedStudents }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [currentSession])

  // Keyboard shortcut for fullscreen (ESC to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVideoFullscreen) {
        setIsVideoFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVideoFullscreen])

  const createSession = () => {
    const sessionId = `mock_${Date.now()}`
    const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const newSession: LiveSession = {
      id: sessionId,
      sessionCode: sessionCode,
      teacherName: teacherName,
      subject: newSessionData.subject,
      startTime: new Date(),
      isActive: true,
      students: generateMockStudents(),
      maxStudents: newSessionData.maxStudents
    }

    setCurrentSession(newSession)
    setShowCreateModal(false)
    setNewSessionData({ subject: '', maxStudents: 30 })
  }

  const endSession = () => {
    if (!currentSession) return
    setPastSessions(prev => [{...currentSession, isActive: false}, ...prev])
    setCurrentSession(null)
  }

  const downloadReport = (sessionId: string) => {
    alert('📊 Mock Mode: Report download simulated!\n\nIn production, this would download a PDF with:\n- Session analytics\n- Student performance\n- Engagement metrics')
  }

  const downloadStudentReport = (sessionId: string, studentId: string) => {
    alert('📊 Mock Mode: Student report download simulated!')
  }

  const copySessionCode = () => {
    if (currentSession) {
      navigator.clipboard.writeText(currentSession.sessionCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'active': return 'text-success-600 bg-success-100'
      case 'passive': return 'text-warning-600 bg-warning-100'
      case 'distracted': return 'text-danger-600 bg-danger-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getAverageEngagement = () => {
    if (!currentSession || currentSession.students.length === 0) return 0
    const total = currentSession.students.reduce((sum, s) => sum + s.focusLevel, 0)
    return Math.round(total / currentSession.students.length)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600">Welcome, {teacherName}</p>
              {/* <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">DEMO MODE</span> */}
            </div>
            <div className="flex items-center space-x-3">
              {/* Back to Home button removed - use Navbar instead */}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Active Session */}
        {currentSession ? (
          <div className="space-y-6">
            {/* Session Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-success-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-success-600">Live Session</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentSession.subject}</h2>
                  <p className="text-gray-600">Started {currentSession.startTime.toLocaleTimeString()}</p>
                </div>
                <button onClick={endSession} className="btn btn-danger">
                  <Square className="w-4 h-4 mr-2" />
                  End Session
                </button>
              </div>

              {/* Session Code */}
              <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Session Code for Students</p>
                    <p className="text-3xl font-bold text-primary-600 font-mono tracking-wider">
                      {currentSession.sessionCode}
                    </p>
                  </div>
                  <button onClick={copySessionCode} className="btn btn-primary">
                    {codeCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Session Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Students</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {currentSession.students.length}/{currentSession.maxStudents}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-primary-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Avg. Engagement</p>
                    <p className="text-3xl font-bold text-success-600">{getAverageEngagement()}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Highly Engaged</p>
                    <p className="text-3xl font-bold text-success-600">
                      {currentSession.students.filter(s => s.engagement === 'active').length}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-success-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Needs Attention</p>
                    <p className="text-3xl font-bold text-danger-600">
                      {currentSession.students.filter(s => s.engagement === 'distracted').length}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-danger-600" />
                </div>
              </div>
            </div>

            {/* Teacher Video Feed */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Video Preview */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Video className="w-5 h-5 mr-2" />
                      Your Camera Preview
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm px-3 py-1 bg-success-100 text-success-800 rounded-full font-medium flex items-center">
                        <div className="w-2 h-2 bg-success-600 rounded-full animate-pulse mr-2"></div>
                        Live
                      </span>
                      <button
                        onClick={() => setIsVideoFullscreen(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Fullscreen"
                      >
                        <Maximize className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <VideoFeed 
                      isActive={currentSession.isActive}
                      onEmotionDetected={(emotion) => console.log('Teacher emotion:', emotion)}
                      height="h-96"
                    />
                    <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <p><strong>📹 What students see:</strong> Your live video feed is being broadcast to all connected students.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-primary-50 to-success-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🎥 Presentation Tips</h3>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Look at the camera when speaking</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Ensure good lighting on your face</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Check your background is professional</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Monitor student engagement below</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Use fullscreen for better view</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Overview</h3>
              <div className="space-y-3">
                {currentSession.students.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No students have joined yet</p>
                    <p className="text-sm text-gray-500 mt-2">Share the session code with your students</p>
                  </div>
                ) : (
                  currentSession.students.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">Joined {student.joinedAt.toLocaleTimeString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Emotion</p>
                          <span className="text-sm font-medium capitalize">{student.emotion}</span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Engagement</p>
                          <span className={`text-sm font-medium px-3 py-1 rounded-full ${getEngagementColor(student.engagement)}`}>
                            {student.engagement}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Focus</p>
                          <span className="text-sm font-medium">{Math.round(student.focusLevel)}%</span>
                        </div>
                        <button
                          onClick={() => downloadStudentReport(currentSession.id, student.id)}
                          className="btn btn-sm btn-outline"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* No Active Session */
          <div className="max-w-4xl mx-auto">
            {/* Create Session Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create a Live Session</h2>
                <p className="text-gray-600">Start monitoring student engagement in real-time</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full btn btn-primary py-4 text-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Session
              </button>
            </div>

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Past Sessions</h3>
                <div className="space-y-3">
                  {pastSessions.map(session => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{session.subject}</p>
                        <p className="text-sm text-gray-500">
                          {session.startTime.toLocaleDateString()} • {session.students.length} students
                        </p>
                      </div>
                      <button
                        onClick={() => downloadReport(session.id)}
                        className="btn btn-outline"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New Session</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject / Topic
                  </label>
                  <input
                    type="text"
                    value={newSessionData.subject}
                    onChange={(e) => setNewSessionData({ ...newSessionData, subject: e.target.value })}
                    placeholder="e.g., Mathematics, Physics, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Students
                  </label>
                  <input
                    type="number"
                    value={newSessionData.maxStudents}
                    onChange={(e) => setNewSessionData({ ...newSessionData, maxStudents: parseInt(e.target.value) })}
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={createSession}
                  disabled={!newSessionData.subject}
                  className="flex-1 btn btn-primary"
                >
                  Create Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Video Modal */}
      <AnimatePresence>
        {isVideoFullscreen && currentSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
            onClick={() => setIsVideoFullscreen(false)}
          >
            <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-6">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-3">
                    <Video className="w-6 h-6" />
                    <div>
                      <h3 className="text-xl font-semibold">Your Camera Preview - Fullscreen</h3>
                      <p className="text-sm opacity-75">Teaching: {currentSession.subject}</p>
                    </div>
                    <span className="ml-4 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-sm flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                      Broadcasting
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsVideoFullscreen(false)}
                      className="p-3 hover:bg-white/10 rounded-lg transition-colors"
                      title="Exit Fullscreen"
                    >
                      <Minimize className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setIsVideoFullscreen(false)}
                      className="p-3 hover:bg-white/10 rounded-lg transition-colors"
                      title="Close"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Video Content */}
              <div className="w-full h-full flex items-center justify-center p-12">
                <div className="w-full h-full max-w-6xl flex items-center justify-center">
                  <VideoFeed 
                    isActive={currentSession.isActive}
                    onEmotionDetected={(emotion) => console.log('Teacher emotion:', emotion)}
                    height="h-full"
                  />
                </div>
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-center justify-center space-x-8 text-white text-sm">
                  <div>
                    <span className="opacity-75">Students Watching:</span>
                    <span className="ml-2 font-semibold">{currentSession.students.length}</span>
                  </div>
                  <div>
                    <span className="opacity-75">Session:</span>
                    <span className="ml-2 font-semibold">{currentSession.subject}</span>
                  </div>
                  <div className="opacity-75">
                    Press ESC or click × to exit fullscreen
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
