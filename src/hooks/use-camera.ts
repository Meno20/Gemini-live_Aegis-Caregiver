/**
 * Camera Hook for Aegis Caregiver
 * Handles webcam access, frame capture, and AI vision analysis
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface VisionAnalysis {
  room: string
  isNearExit: boolean
  isSitting: boolean
  agitationLevel: number
  movement: string
  activity: string
  patientVisible: boolean
  timestamp: Date
  confidence: number
}

export interface UseCameraOptions {
  onAnalysis?: (analysis: VisionAnalysis) => void
  onError?: (error: string) => void
  analysisInterval?: number
}

export function useCamera(options: UseCameraOptions = {}) {
  const { onAnalysis, onError, analysisInterval = 5000 } = options
  
  const [isStreaming, setIsStreaming] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastAnalysis, setLastAnalysis] = useState<VisionAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
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
      
      setHasPermission(true)
      setIsStreaming(true)
      setError(null)
      
      // Start periodic analysis
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current)
      }
      
      analysisIntervalRef.current = setInterval(() => {
        captureAndAnalyze()
      }, analysisInterval)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera'
      setError(errorMessage)
      setHasPermission(false)
      onError?.(errorMessage)
    }
  }, [analysisInterval, onError])

  // Stop camera stream
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
  }, [])

  // Capture frame and send for analysis
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx || video.readyState < 2) return
    
    // Capture frame
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    
    // Get base64 image
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
    
    setIsAnalyzing(true)
    
    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      })
      
      if (response.ok) {
        const data = await response.json()
        const analysis: VisionAnalysis = {
          ...data.analysis,
          timestamp: new Date()
        }
        setLastAnalysis(analysis)
        onAnalysis?.(analysis)
      }
    } catch (err) {
      console.error('Vision analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [isAnalyzing, onAnalysis])

  // Request single analysis
  const requestAnalysis = useCallback(async () => {
    await captureAndAnalyze()
  }, [captureAndAnalyze])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    videoRef,
    canvasRef,
    isStreaming,
    hasPermission,
    error,
    lastAnalysis,
    isAnalyzing,
    startCamera,
    stopCamera,
    requestAnalysis
  }
}
