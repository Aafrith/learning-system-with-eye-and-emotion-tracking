'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff } from 'lucide-react'

interface VideoFeedProps {
  isActive: boolean
  onEmotionDetected?: (emotion: string) => void
  height?: string // Tailwind height class (e.g., 'h-40', 'h-96')
}

export default function VideoFeed({ isActive, onEmotionDetected, height = 'h-40' }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [currentEmotion, setCurrentEmotion] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (isActive) {
      startVideoStream()
      startEmotionDetection()
    } else {
      stopVideoStream()
      stopEmotionDetection()
    }

    return () => {
      stopVideoStream()
      stopEmotionDetection()
    }
  }, [isActive])

  // WebSocket connection for real-time emotion data
  useEffect(() => {
    if (!isActive) return

    const ws = new WebSocket('ws://localhost:8000/ws')
    
    ws.onopen = () => {
      console.log('Connected to emotion recognition WebSocket')
      setIsProcessing(true)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'emotion' && data.emotion) {
          setCurrentEmotion(data.emotion)
          onEmotionDetected?.(data.emotion)
        }
      } catch (error) {
        console.error('Error parsing emotion data:', error)
      }
    }

    ws.onclose = () => {
      console.log('Emotion recognition WebSocket disconnected')
      setIsProcessing(false)
    }

    ws.onerror = (error) => {
      console.error('Emotion recognition WebSocket error:', error)
      setIsProcessing(false)
    }

    return () => {
      ws.close()
    }
  }, [isActive, onEmotionDetected])

  const startVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        },
        audio: false
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  const stopVideoStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const startEmotionDetection = () => {
    // The emotion detection is now handled by the backend WebSocket
    // which processes video from the backend's camera feed
  }

  const stopEmotionDetection = () => {
    setCurrentEmotion('')
    setIsProcessing(false)
  }

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      {isActive ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full ${height} object-cover`}
          />
          <canvas
            ref={canvasRef}
            className="hidden"
            width={640}
            height={480}
          />
        </>
      ) : (
        <div className={`w-full ${height} flex items-center justify-center bg-gray-100`}>
          <div className="text-center">
            <CameraOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Camera inactive</p>
            <p className="text-sm text-gray-400">Start session to begin monitoring</p>
          </div>
        </div>
      )}
      
      {/* Overlay indicators */}
      <div className="absolute top-4 left-4 flex space-x-2">
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
          isActive 
            ? 'bg-success-100 text-success-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          <Camera className="w-3 h-3" />
          <span>{isActive ? 'Live' : 'Off'}</span>
        </div>
        
        {/* Emotion indicator */}
        {isActive && currentEmotion && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            <span className="capitalize">{currentEmotion}</span>
          </div>
        )}
        
        {/* Processing indicator */}
        {isActive && isProcessing && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span>AI Processing</span>
          </div>
        )}
      </div>
      
      {/* Recording indicator */}
      {isActive && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center space-x-1 px-2 py-1 bg-danger-100 text-danger-800 rounded-full text-xs font-medium">
            <div className="w-2 h-2 bg-danger-600 rounded-full animate-pulse"></div>
            <span>Recording</span>
          </div>
        </div>
      )}
    </div>
  )
}
