/**
 * Aegis Caregiver - Audio Stream Hook
 * Handles microphone capture and audio processing
 */

import { useState, useRef, useCallback } from 'react'

export interface UseAudioStreamReturn {
  audioStream: MediaStream | null
  isRecording: boolean
  startAudio: (onAudioChunk: (base64: string) => void) => Promise<void>
  stopAudio: () => void
  error: string | null
}

export function useAudioStream(): UseAudioStreamReturn {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const onAudioChunkRef = useRef<((base64: string) => void) | null>(null)

  const startAudio = useCallback(async (onAudioChunk: (base64: string) => void) => {
    try {
      setError(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      })

      setAudioStream(stream)
      onAudioChunkRef.current = onAudioChunk

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          
          // Convert to base64
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1]
            if (onAudioChunkRef.current) {
              onAudioChunkRef.current(base64)
            }
          }
          reader.readAsDataURL(event.data)
        }
      }

      mediaRecorder.start(1000) // Send chunks every second
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)

      console.log('[Audio] Started capturing')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Microphone access denied'
      setError(errorMessage)
      console.error('[Audio] Failed to start:', errorMessage)
    }
  }, [])

  const stopAudio = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }

    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop())
      setAudioStream(null)
    }

    setIsRecording(false)
    audioChunksRef.current = []
    console.log('[Audio] Stopped capturing')
  }, [audioStream])

  return {
    audioStream,
    isRecording,
    startAudio,
    stopAudio,
    error
  }
}
