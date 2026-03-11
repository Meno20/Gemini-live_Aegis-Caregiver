/**
 * Aegis Caregiver - Video Stream Hook
 * Handles camera capture and frame processing
 */

import { useState, useRef, useCallback, useEffect } from 'react'

export interface UseVideoStreamReturn {
  videoStream: MediaStream | null
  isStreaming: boolean
  startVideo: (onFrame: (base64: string) => void, intervalMs?: number) => Promise<void>
  stopVideo: () => void
  error: string | null
  videoRef: React.RefObject<HTMLVideoElement>
}

export function useVideoStream(): UseVideoStreamReturn {
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onFrameRef = useRef<((base64: string) => void) | null>(null)

  useEffect(() => {
    // Create canvas for frame capture
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
      canvasRef.current.width = 640
      canvasRef.current.height = 480
    }
  }, [])

  const startVideo = useCallback(async (onFrame: (base64: string) => void, intervalMs: number = 2000) => {
    try {
      setError(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      })

      setVideoStream(stream)
      onFrameRef.current = onFrame
      setIsStreaming(true)

      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Start frame capture
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')

      if (canvas && ctx) {
        intervalRef.current = setInterval(() => {
          if (videoRef.current && canvas && ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
            const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
            if (onFrameRef.current) {
              onFrameRef.current(frameData)
            }
          }
        }, intervalMs)
      }

      console.log('[Video] Started capturing')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Camera access denied'
      setError(errorMessage)
      console.error('[Video] Failed to start:', errorMessage)
    }
  }, [])

  const stopVideo = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop())
      setVideoStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
    console.log('[Video] Stopped capturing')
  }, [videoStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [videoStream])

  return {
    videoStream,
    isStreaming,
    startVideo,
    stopVideo,
    error,
    videoRef: videoRef as React.RefObject<HTMLVideoElement>
  }
}
