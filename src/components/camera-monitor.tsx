/**
 * Camera Monitor Component
 * Real webcam feed with AI-powered vision analysis
 * Features: Room detection, exit detection, agitation tracking, water intake
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Video, VideoOff, Camera, CameraOff, AlertTriangle, 
  MapPin, Activity, User, RefreshCw, Droplets, DoorOpen
} from 'lucide-react'

interface CameraMonitorProps {
  isSessionActive: boolean
  selectedPatientName: string
  onAnalysis?: (analysis: {
    room: string
    isNearExit: boolean
    isSitting: boolean
    agitationLevel: number
    movement: string
    activity: string
    patientVisible: boolean
    confidence: number
    doorDetected?: boolean
  }) => void
}

const ROOM_NAMES: Record<string, string> = {
  living_room: 'Living Room',
  kitchen: 'Kitchen',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  hallway: 'Hallway',
  exit: 'Near Exit',
  unknown: 'Unknown'
}

export function CameraMonitor({ 
  isSessionActive, 
  selectedPatientName,
  onAnalysis
}: CameraMonitorProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAnalysis, setLastAnalysis] = useState<{
    room: string
    isNearExit: boolean
    isSitting: boolean
    agitationLevel: number
    movement: string
    activity: string
    patientVisible: boolean
    confidence: number
    doorDetected: boolean
  } | null>(null)
  const [analysisCount, setAnalysisCount] = useState(0)
  const [hydrationCount, setHydrationCount] = useState(0)
  const [lastHydrationTime, setLastHydrationTime] = useState<Date | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      setIsStreaming(true)
      console.log('📷 Camera started')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Camera access denied'
      setError(errorMessage)
      console.error('Camera error:', errorMessage)
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }
    
    setIsStreaming(false)
    setLastAnalysis(null)
    setAnalysisCount(0)
    console.log('📷 Camera stopped')
  }, [])

  // Capture and analyze frame
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing || !isStreaming) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx || video.readyState < 2) {
      console.log('Video not ready, readyState:', video.readyState)
      return
    }
    
    // Capture frame
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    ctx.drawImage(video, 0, 0)
    
    // Get base64 image
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
    
    setIsAnalyzing(true)
    console.log('🔍 Analyzing frame...')
    
    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.analysis) {
          const analysis = data.analysis
          
          setLastAnalysis(analysis)
          setAnalysisCount(prev => prev + 1)
          onAnalysis?.(analysis)
          
          console.log('✅ Analysis complete:', analysis.room, 'agitation:', analysis.agitationLevel, 'nearExit:', analysis.isNearExit)
        }
      } else {
        console.error('Vision API error:', response.status)
      }
    } catch (err) {
      console.error('Vision analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [isAnalyzing, isStreaming, onAnalysis])

  // Record hydration
  const recordHydration = useCallback(async () => {
    const now = new Date()
    setHydrationCount(prev => prev + 1)
    setLastHydrationTime(now)
    
    try {
      await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-hydration', patientId: 'patient_001' })
      })
      console.log('💧 Hydration recorded')
    } catch (err) {
      console.error('Failed to record hydration:', err)
    }
  }, [])

  // Start/stop analysis based on session and streaming
  useEffect(() => {
    if (isSessionActive && isStreaming) {
      // Run analysis every 4 seconds for more responsive detection
      analysisIntervalRef.current = setInterval(captureAndAnalyze, 4000)
      // Run initial analysis after 1 second
      const timeout = setTimeout(captureAndAnalyze, 1000)
      
      return () => {
        if (analysisIntervalRef.current) {
          clearInterval(analysisIntervalRef.current)
          analysisIntervalRef.current = null
        }
        clearTimeout(timeout)
      }
    } else {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current)
        analysisIntervalRef.current = null
      }
    }
  }, [isSessionActive, isStreaming, captureAndAnalyze])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current)
      }
    }
  }, [])

  // Get agitation color
  const getAgitationColor = (level: number) => {
    if (level < 0.3) return 'text-green-500'
    if (level < 0.5) return 'text-yellow-500'
    if (level < 0.7) return 'text-orange-500'
    return 'text-red-500'
  }

  // Get agitation progress color
  const getAgitationProgressClass = (level: number) => {
    if (level < 0.3) return 'bg-green-500'
    if (level < 0.5) return 'bg-yellow-500'
    if (level < 0.7) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {/* Video Container */}
          <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 relative overflow-hidden rounded-lg">
            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Video element */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${!isStreaming ? 'hidden' : ''}`}
              playsInline
              muted
              autoPlay
            />
            
            {/* Placeholder when camera is off */}
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  {isSessionActive ? (
                    <>
                      <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-white/70">Click Start Camera to begin live monitoring</p>
                    </>
                  ) : (
                    <>
                      <VideoOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-white/70">Start monitoring session first</p>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Live indicator */}
            {isStreaming && isSessionActive && (
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-white bg-black/60 px-2 py-1 rounded font-mono">LIVE</span>
              </div>
            )}
            
            {/* Analysis indicator */}
            {isAnalyzing && (
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-blue-500/90 px-2 py-1 rounded">
                <RefreshCw className="h-3 w-3 text-white animate-spin" />
                <span className="text-xs text-white font-medium">AI Analyzing...</span>
              </div>
            )}
            
            {/* Camera controls */}
            <div className="absolute bottom-3 right-3 flex gap-2">
              {/* Hydration button */}
              {isSessionActive && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={recordHydration}
                  className="bg-blue-500/90 hover:bg-blue-600/90 text-white"
                >
                  <Droplets className="h-4 w-4 mr-1" />
                  Water
                </Button>
              )}
              
              <Button
                size="sm"
                variant={isStreaming ? "destructive" : "default"}
                onClick={isStreaming ? stopCamera : startCamera}
                disabled={!isSessionActive}
                className={isStreaming ? "bg-red-500/80 hover:bg-red-600/80 text-white" : "bg-white/90 hover:bg-white text-black"}
              >
                {isStreaming ? (
                  <><CameraOff className="h-4 w-4 mr-1" /> Stop</>
                ) : (
                  <><Camera className="h-4 w-4 mr-1" /> Start Camera</>
                )}
              </Button>
            </div>
            
            {/* Room and status overlay */}
            {isStreaming && lastAnalysis && (
              <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
                {/* Room location */}
                <Badge 
                  variant={lastAnalysis.isNearExit ? "destructive" : "secondary"}
                  className="bg-black/70 text-white border-0"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {ROOM_NAMES[lastAnalysis.room] || lastAnalysis.room}
                </Badge>
                
                {/* Door/Exit detection */}
                {(lastAnalysis.doorDetected || lastAnalysis.isNearExit) && (
                  <Badge 
                    variant="destructive"
                    className="bg-red-500/90 text-white border-0 animate-pulse"
                  >
                    <DoorOpen className="h-3 w-3 mr-1" />
                    {lastAnalysis.isNearExit ? 'NEAR EXIT!' : 'Door Detected'}
                  </Badge>
                )}
                
                {/* Agitation level with progress */}
                {lastAnalysis.patientVisible && (
                  <div className="bg-black/70 rounded px-2 py-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Agitation
                      </span>
                      <span className={`text-xs font-bold ${getAgitationColor(lastAnalysis.agitationLevel)}`}>
                        {Math.round(lastAnalysis.agitationLevel * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={lastAnalysis.agitationLevel * 100} 
                      className="h-1.5 bg-white/20"
                    />
                  </div>
                )}
                
                {/* Patient visibility */}
                <Badge 
                  variant="outline"
                  className="bg-black/70 text-white border-0 text-xs"
                >
                  <User className="h-3 w-3 mr-1" />
                  {lastAnalysis.patientVisible ? 'Patient visible' : 'No patient detected'}
                </Badge>
              </div>
            )}
            
            {/* Near exit warning - prominent alert */}
            {lastAnalysis?.isNearExit && lastAnalysis.patientVisible && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="bg-red-500/95 text-white px-6 py-3 rounded-lg flex items-center gap-2 animate-pulse shadow-lg">
                  <DoorOpen className="h-6 w-6" />
                  <span className="font-bold text-lg">NEAR EXIT ALERT</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Analysis info bar */}
          {lastAnalysis && (
            <div className="px-4 py-2.5 bg-muted/50 border-t flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3 w-3" />
                  Movement: <span className="font-medium text-foreground capitalize">{lastAnalysis.movement}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  {lastAnalysis.patientVisible ? 'Visible' : 'Not visible'}
                </span>
                <span className="flex items-center gap-1.5">
                  AI Confidence: <span className="font-medium text-foreground">{Math.round(lastAnalysis.confidence * 100)}%</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                {hydrationCount > 0 && (
                  <span className="flex items-center gap-1 text-blue-500">
                    <Droplets className="h-3 w-3" />
                    {hydrationCount} drinks today
                  </span>
                )}
                <span className="text-muted-foreground">#{analysisCount}</span>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              {error}
              <Button size="sm" variant="ghost" onClick={startCamera} className="ml-auto h-6 text-xs px-2">
                Retry
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
