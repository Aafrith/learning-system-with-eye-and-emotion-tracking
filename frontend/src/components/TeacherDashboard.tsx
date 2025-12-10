'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
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
import { agoraConfig, validateAgoraConfig } from '@/lib/agoraConfig'
import { sessionApi, reportsApi } from '@/lib/api'

// Dynamically import Agora component to avoid SSR issues
const InteractiveLiveStreaming = dynamic(
  () => import('./InteractiveLiveStreaming'),
  { ssr: false }
)

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
  const [isLiveStreaming, setIsLiveStreaming] = useState(false)
  const [agoraConfigValid, setAgoraConfigValid] = useState(false)
  const [teacherWebSocket, setTeacherWebSocket] = useState<WebSocket | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newSessionData, setNewSessionData] = useState({
    subject: '',
    maxStudents: 30
  })

  // Helper functions for emotion display
  const getEmotionEmoji = (emotion: string) => {
    const emojiMap: Record<string, string> = {
      'happy': '😊',
      'happiness': '😊',
      'sad': '😢',
      'sadness': '😢',
      'angry': '😠',
      'anger': '😠',
      'fear': '😨',
      'fearful': '😨',
      'disgust': '🤢',
      'disgusted': '🤢',
      'neutral': '😐',
      'neutrality': '😐',
      'surprised': '😲',
      'surprise': '😲'
    }
    return emojiMap[emotion?.toLowerCase()] || '🤔'
  }

  const getEmotionColor = (emotion: string) => {
    const colorMap: Record<string, string> = {
      'happy': 'bg-green-100 text-green-800',
      'happiness': 'bg-green-100 text-green-800',
      'sad': 'bg-blue-100 text-blue-800',
      'sadness': 'bg-blue-100 text-blue-800',
      'angry': 'bg-red-100 text-red-800',
      'anger': 'bg-red-100 text-red-800',
      'fear': 'bg-purple-100 text-purple-800',
      'fearful': 'bg-purple-100 text-purple-800',
      'disgust': 'bg-yellow-100 text-yellow-800',
      'disgusted': 'bg-yellow-100 text-yellow-800',
      'neutral': 'bg-gray-100 text-gray-800',
      'neutrality': 'bg-gray-100 text-gray-800',
      'surprised': 'bg-orange-100 text-orange-800',
      'surprise': 'bg-orange-100 text-orange-800'
    }
    return colorMap[emotion?.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  // Validate Agora config on mount
  useEffect(() => {
    const validation = validateAgoraConfig()
    setAgoraConfigValid(validation.valid)
  }, [])

  // Fetch active session on mount
  useEffect(() => {
    let isMounted = true // Prevent duplicate calls in React Strict Mode
    
    const fetchSessions = async () => {
      if (!isMounted) return
      
      try {
        setIsLoading(true)
        
        // Fetch active session
        const session = await sessionApi.getActiveTeacherSession()
        if (session && isMounted) {
          setCurrentSession({
            id: session._id || session.id,
            sessionCode: session.session_code,
            teacherName: session.teacher_name,
            subject: session.subject,
            startTime: new Date(session.started_at || session.created_at),
            isActive: session.is_active,
            students: (session.students || []).map((s: any) => ({
              id: s.id,
              name: s.name,
              emotion: s.emotion || 'neutral',
              engagement: s.engagement || 'passive',
              focusLevel: s.focus_level || 70,
              joinedAt: new Date(s.joined_at)
            })),
            maxStudents: session.max_students
          })
          console.log('✅ Active session loaded')
        } else if (isMounted) {
          console.log('ℹ️ No active session')
        }
        
        // Fetch all past sessions (including ended ones)
        try {
          const allSessions = await sessionApi.getTeacherSessions()
          if (isMounted) {
            const past = allSessions
              .filter((s: any) => !s.is_active) // Only ended sessions
              .map((s: any) => ({
                id: s._id || s.id,
                sessionCode: s.session_code,
                teacherName: s.teacher_name,
                subject: s.subject,
                startTime: new Date(s.started_at || s.created_at),
                isActive: s.is_active,
                students: (s.students || []).map((st: any) => ({
                  id: st.id,
                  name: st.name,
                  emotion: st.emotion || 'neutral',
                  engagement: st.engagement || 'passive',
                  focusLevel: st.focus_level || 70,
                  joinedAt: new Date(st.joined_at)
                })),
                maxStudents: s.max_students
              }))
            setPastSessions(past)
            console.log(`✅ Loaded ${past.length} past session(s)`)
          }
        } catch (error: any) {
          if (isMounted) {
            console.error('❌ Error fetching past sessions:', error)
          }
          // Don't show error to user for past sessions - not critical
        }
        
      } catch (error: any) {
        if (isMounted) {
          console.error('❌ Unexpected error loading dashboard:', error)
          setError('Failed to load dashboard data. Please refresh the page.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchSessions()
    
    return () => {
      isMounted = false // Cleanup to prevent state updates after unmount
    }
  }, [])

  // WebSocket connection for real-time student updates
  useEffect(() => {
    if (!currentSession) {
      // Disconnect WebSocket if session ends
      if (teacherWebSocket) {
        console.log('🔌 Closing teacher WebSocket (no session)')
        teacherWebSocket.close()
        setTeacherWebSocket(null)
      }
      return
    }

    // Don't reconnect if already connected
    if (teacherWebSocket && teacherWebSocket.readyState === WebSocket.OPEN) {
      console.log('ℹ️ Teacher WebSocket already connected')
      return
    }

    // Get teacher ID from localStorage
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      console.error('❌ No user data found in localStorage')
      return
    }
    
    const user = JSON.parse(userStr)
    const teacherId = user.id
    
    if (!teacherId) {
      console.error('❌ No teacher ID found in user data')
      return
    }

    // Connect to teacher WebSocket
    // Clean WebSocket URL to avoid double slashes
    const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000').replace(/\/+$/, '')
    const wsUrlFull = `${wsUrl}/ws/session/${currentSession.id}/teacher/${teacherId}`
    
    console.log('🔌 Connecting teacher WebSocket to:', wsUrlFull)
    const ws = new WebSocket(wsUrlFull)

    ws.onopen = () => {
      console.log('✅ Teacher WebSocket connected!')
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('📨 Teacher received WebSocket message:', JSON.stringify(message, null, 2))

        if (message.type === 'student_update') {
          // Update student data in real-time
          const studentData = message.data
          console.log('🔄 Processing student update:', {
            studentId: studentData.student_id,
            studentName: studentData.student_name,
            emotion: studentData.emotion,
            engagement: studentData.engagement,
            focusLevel: studentData.focus_level,
            faceDetected: studentData.face_detected
          })
          
          setCurrentSession(prev => {
            if (!prev) {
              console.log('❌ No current session, skipping update')
              return prev
            }
            
            console.log('👥 Current students:', prev.students.map(s => ({ 
              id: s.id, 
              name: s.name, 
              emotion: s.emotion,
              focus: s.focusLevel 
            })))
            
            let wasUpdated = false
            const updatedStudents = prev.students.map(student => {
              if (student.id === studentData.student_id) {
                wasUpdated = true
                const updated = {
                  ...student,
                  emotion: studentData.emotion !== undefined ? studentData.emotion : student.emotion,
                  engagement: studentData.engagement !== undefined ? studentData.engagement : student.engagement,
                  focusLevel: studentData.focus_level !== undefined ? studentData.focus_level : student.focusLevel
                }
                console.log(`✅ Updated student ${student.name}:`, {
                  before: { emotion: student.emotion, engagement: student.engagement, focus: student.focusLevel },
                  after: { emotion: updated.emotion, engagement: updated.engagement, focus: updated.focusLevel },
                  changed: updated.emotion !== student.emotion || updated.engagement !== student.engagement || updated.focusLevel !== student.focusLevel
                })
                return updated
              }
              return student
            })
            
            if (!wasUpdated) {
              console.log(`⚠️ Student ID ${studentData.student_id} not found in list!`)
              console.log('Available student IDs:', prev.students.map(s => s.id))
            }

            // If student doesn't exist, add them (e.g., when they first connect)
            const studentExists = prev.students.some(s => s.id === studentData.student_id)
            if (!studentExists && studentData.student_name) {
              console.log('➕ Adding new student:', studentData.student_name, 'ID:', studentData.student_id)
              updatedStudents.push({
                id: studentData.student_id,
                name: studentData.student_name,
                emotion: studentData.emotion || 'neutral',
                engagement: studentData.engagement || 'passive',
                focusLevel: studentData.focus_level || 70,
                joinedAt: new Date()
              })
            }
            
            console.log('👥 Students after update:', updatedStudents.map(s => ({ 
              id: s.id, 
              name: s.name, 
              emotion: s.emotion, 
              engagement: s.engagement,
              focus: s.focusLevel 
            })))

            return { ...prev, students: updatedStudents }
          })
        } else {
          console.log('ℹ️ Received non-student_update message type:', message.type)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('Teacher WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('🔌 Teacher WebSocket disconnected')
      setTeacherWebSocket(null)
    }

    setTeacherWebSocket(ws)

    return () => {
      console.log('🧹 Cleanup: Closing teacher WebSocket')
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }
  }, [currentSession?.id])

  // Note: Real-time student updates come from WebSocket connection
  // Students are automatically added to the session when they join via the API

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

  const createSession = async () => {
    // Validate inputs
    if (!newSessionData.subject || newSessionData.subject.trim() === '') {
      setError('Please enter a subject/topic for the session')
      return
    }

    if (!newSessionData.maxStudents || newSessionData.maxStudents < 1) {
      setError('Maximum students must be at least 1')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Creating session with data:', newSessionData)
      
      // Create session via API
      const session = await sessionApi.createSession(
        newSessionData.subject,
        newSessionData.maxStudents
      )
      
      console.log('Session created:', session)
      
      // Get session ID (handle both _id and id)
      const sessionId = session._id || session.id
      console.log('Session ID:', sessionId)
      
      if (!sessionId) {
        throw new Error('Session ID not found in response')
      }

      // Session is now active by default, no need to start it
      // But we can still call start for idempotency
      console.log('Verifying session is active...')
      let finalSession = session
      try {
        const startedSession = await sessionApi.startSession(sessionId)
        console.log('✅ Session confirmed active:', startedSession)
        finalSession = startedSession
      } catch (startError: any) {
        console.log('ℹ️ Using created session (already active):', startError.message)
        // Session should already be active from creation
        finalSession = session
      }
      
      // Extract session data with fallbacks
      const finalSessionId = finalSession._id || finalSession.id || sessionId
      const sessionCode = finalSession.session_code
      
      if (!sessionCode) {
        throw new Error('Session code not found in response')
      }
      
      console.log('Final session details:', {
        id: finalSessionId,
        code: sessionCode,
        subject: finalSession.subject,
        isActive: finalSession.is_active
      })
      
      // Set the current session
      const newSession = {
        id: finalSessionId,
        sessionCode: sessionCode,
        teacherName: finalSession.teacher_name,
        subject: finalSession.subject,
        startTime: new Date(finalSession.started_at || finalSession.created_at),
        isActive: finalSession.is_active,
        students: [], // Students will join via WebSocket
        maxStudents: finalSession.max_students
      }
      
      console.log('Setting current session:', newSession)
      setCurrentSession(newSession)
      
      console.log('✅ Session created successfully! Dashboard should now be visible.')
      setShowCreateModal(false)
      setNewSessionData({ subject: '', maxStudents: 30 })
    } catch (error: any) {
      console.error('Error creating session:', error)
      setError(error.message || 'Failed to create session')
    } finally {
      setIsLoading(false)
    }
  }

  const endSession = async () => {
    if (!currentSession) return
    
    try {
      setIsLoading(true)
      
      // Notify students via WebSocket before ending
      if (teacherWebSocket && teacherWebSocket.readyState === WebSocket.OPEN) {
        teacherWebSocket.send(JSON.stringify({
          type: 'session_ended',
          message: 'Teacher has ended the session'
        }))
      }
      
      // End session via API
      await sessionApi.endSession(currentSession.id)
      
      setPastSessions(prev => [{...currentSession, isActive: false}, ...prev])
      setCurrentSession(null)
      setIsLiveStreaming(false)
    } catch (error: any) {
      console.error('Error ending session:', error)
      setError(error.message || 'Failed to end session')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadReport = async (sessionId: string, format: 'csv' | 'pdf' = 'csv') => {
    try {
      setIsLoading(true)
      console.log(`Downloading ${format.toUpperCase()} report for session:`, sessionId)
      
      const blob = await reportsApi.exportSessionReport(sessionId, format)
      if (blob instanceof Blob) {
        const extension = format === 'pdf' ? 'pdf' : 'csv'
        reportsApi.downloadCSV(blob, `session_${sessionId}_report.${extension}`)
        console.log(`✅ ${format.toUpperCase()} report downloaded successfully`)
      }
    } catch (error: any) {
      console.error('❌ Error downloading report:', error)
      setError('Failed to download report: ' + (error.message || 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  const downloadStudentReport = async (sessionId: string, studentId: string) => {
    try {
      setIsLoading(true)
      console.log('Downloading student report for session:', sessionId)
      
      // Get the full session report and filter for specific student
      const report = await reportsApi.getSessionReport(sessionId)
      const student = report.students.find((s: any) => s.id === studentId)
      
      if (!student) {
        throw new Error('Student not found in session')
      }
      
      // Create a CSV with student-specific data
      const csvContent = `Student Report
Session Code,${report.session_code}
Subject,${report.subject}
Teacher,${report.teacher_name}
Date,${report.start_time}

Student Details
Name,${student.name}
Email,${student.email || 'N/A'}
Joined At,${student.joined_at}
Emotion,${student.emotion}
Engagement,${student.engagement}
Focus Level,${student.focus_level}%
`
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      reportsApi.downloadCSV(blob, `student_${student.name}_session_${sessionId}_report.csv`)
      console.log('✅ Student report downloaded successfully')
    } catch (error: any) {
      console.error('❌ Error downloading student report:', error)
      setError('Failed to download student report: ' + (error.message || 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
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

  // Show loading state
  if (isLoading && !currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
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
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => downloadReport(currentSession.id, 'pdf')}
                    className="btn btn-primary"
                    disabled={isLoading}
                    title="Download PDF Report"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </button>
                  <button
                    onClick={() => downloadReport(currentSession.id, 'csv')}
                    className="btn btn-outline"
                    disabled={isLoading}
                    title="Download CSV Report"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </button>
                  <button
                    onClick={() => window.open(`/teacher/reports?session=${currentSession.id}`, '_blank')}
                    className="btn btn-outline"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics
                  </button>
                  <button onClick={endSession} className="btn btn-danger" disabled={isLoading}>
                    <Square className="w-4 h-4 mr-2" />
                    End Session
                  </button>
                </div>
              </div>

              {/* Session Code */}
              <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Session Code for Students</p>
                    <p className="text-3xl font-bold text-primary-600 font-mono tracking-wider">
                      {currentSession.sessionCode}
                    </p>
                    {isLiveStreaming && (
                      <p className="text-xs text-green-600 mt-2 flex items-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mr-2"></div>
                        Students can now join your live stream with this code
                      </p>
                    )}
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

            {/* Agora Live Streaming or Video Preview */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Video Preview */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Video className="w-5 h-5 mr-2" />
                      {isLiveStreaming ? 'Live Video Streaming' : 'Your Camera Preview'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm px-3 py-1 bg-success-100 text-success-800 rounded-full font-medium flex items-center">
                        <div className="w-2 h-2 bg-success-600 rounded-full animate-pulse mr-2"></div>
                        {isLiveStreaming ? 'Broadcasting' : 'Live'}
                      </span>
                      {agoraConfigValid && (
                        <button
                          onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isLiveStreaming
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isLiveStreaming ? 'Stop Streaming' : 'Start Streaming'}
                        </button>
                      )}
                      {!isLiveStreaming && (
                        <button
                          onClick={() => setIsVideoFullscreen(true)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Fullscreen"
                        >
                          <Maximize className="w-5 h-5 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    {isLiveStreaming && agoraConfigValid ? (
                      <InteractiveLiveStreaming
                        sessionId={`session_${currentSession.sessionCode}`}
                        userId={`teacher_${teacherName.replace(/\s/g, '_')}`}
                        userName={teacherName}
                        appId={agoraConfig.appId}
                        isHost={true}
                        onCallEnd={() => setIsLiveStreaming(false)}
                      />
                    ) : (
                      <>
                        <VideoFeed 
                          isActive={currentSession.isActive}
                          onEmotionDetected={(emotion) => console.log('Teacher emotion:', emotion)}
                          height="h-96"
                        />
                        <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                          {agoraConfigValid ? (
                            <p><strong>📹 Ready to stream:</strong> Click "Start Streaming" to broadcast live video to your students.</p>
                          ) : (
                            <p><strong>📹 Camera preview:</strong> Configure Agora in .env.local to enable live streaming.</p>
                          )}
                        </div>
                      </>
                    )}
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
                        <div className="text-center min-w-[100px]">
                          <p className="text-xs text-gray-500 mb-1">Emotion</p>
                          <div className={`flex items-center justify-center space-x-2 px-3 py-1 rounded-lg ${getEmotionColor(student.emotion)}`}>
                            <span className="text-lg">{getEmotionEmoji(student.emotion)}</span>
                            <span className="text-sm font-medium capitalize">{student.emotion}</span>
                          </div>
                        </div>
                        <div className="text-center min-w-[110px]">
                          <p className="text-xs text-gray-500 mb-1">Engagement</p>
                          <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${getEngagementColor(student.engagement)}`}>
                            {student.engagement}
                          </span>
                        </div>
                        <div className="text-center min-w-[80px]">
                          <p className="text-xs text-gray-500 mb-1">Focus</p>
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-semibold">{Math.round(student.focusLevel)}%</span>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className={`h-1.5 rounded-full transition-all ${
                                  student.focusLevel >= 70 ? 'bg-success-600' : 
                                  student.focusLevel >= 40 ? 'bg-warning-600' : 'bg-danger-600'
                                }`}
                                style={{ width: `${student.focusLevel}%` }}
                              ></div>
                            </div>
                          </div>
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
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{session.subject}</p>
                        <p className="text-sm text-gray-500">
                          {session.startTime.toLocaleDateString()} • {session.students.length} students
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => downloadReport(session.id, 'pdf')}
                          className="btn btn-primary text-sm"
                          disabled={isLoading}
                          title="Download PDF Report"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </button>
                        <button
                          onClick={() => downloadReport(session.id, 'csv')}
                          className="btn btn-outline text-sm"
                          disabled={isLoading}
                          title="Download CSV Report"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          CSV
                        </button>
                        <button
                          onClick={() => window.open(`/teacher/reports?session=${session.id}`, '_blank')}
                          className="btn btn-outline text-sm"
                          title="View Full Analytics"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                      </div>
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
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
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
                  onClick={() => {
                    setShowCreateModal(false)
                    setError(null)
                  }}
                  disabled={isLoading}
                  className="flex-1 btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('🔵 Create Session button clicked')
                    console.log('Current form data:', newSessionData)
                    createSession()
                  }}
                  disabled={!newSessionData.subject || isLoading}
                  className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Session'}
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