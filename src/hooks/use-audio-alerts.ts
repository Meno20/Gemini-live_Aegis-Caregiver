"use client"

import { useCallback, useRef, useEffect } from "react"

// Audio alert types and their configurations
const ALERT_SOUNDS = {
  emergency: {
    frequency: 880,
    duration: 500,
    pattern: [200, 100, 200, 100, 200],
    repeat: 3
  },
  high: {
    frequency: 660,
    duration: 300,
    pattern: [300, 150, 300],
    repeat: 2
  },
  normal: {
    frequency: 440,
    duration: 200,
    pattern: [200, 100, 200],
    repeat: 1
  },
  low: {
    frequency: 330,
    duration: 150,
    pattern: [150],
    repeat: 1
  }
}

export function useAudioAlerts() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const isMutedRef = useRef(false)

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
    }

    // Initialize on any user interaction
    const events = ['click', 'touchstart', 'keydown']
    events.forEach(event => {
      document.addEventListener(event, initAudio, { once: true, passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, initAudio)
      })
    }
  }, [])

  const playTone = useCallback((frequency: number, duration: number, startTime: number) => {
    if (!audioContextRef.current || isMutedRef.current) return

    const oscillator = audioContextRef.current.createOscillator()
    const gainNode = audioContextRef.current.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    // Envelope for smoother sound
    const attackTime = 0.01
    const releaseTime = 0.05
    const endTime = startTime + duration / 1000

    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + attackTime)
    gainNode.gain.setValueAtTime(0.3, endTime - releaseTime)
    gainNode.gain.linearRampToValueAtTime(0, endTime)

    oscillator.start(startTime)
    oscillator.stop(endTime)
  }, [])

  const playAlert = useCallback((urgency: 'emergency' | 'high' | 'normal' | 'low') => {
    if (!audioContextRef.current || isMutedRef.current) {
      // Resume audio context if suspended
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume()
      }
      return
    }

    const config = ALERT_SOUNDS[urgency]
    const now = audioContextRef.current.currentTime

    let totalOffset = 0
    for (let repeat = 0; repeat < config.repeat; repeat++) {
      config.pattern.forEach((duration, index) => {
        const startTime = now + totalOffset / 1000
        // Alternate between two frequencies for more attention-grabbing sound
        const freq = index % 2 === 0 ? config.frequency : config.frequency * 1.25
        playTone(freq, duration, startTime)
        totalOffset += duration + 50 // Small gap between tones
      })
      totalOffset += 200 // Gap between repeats
    }
  }, [playTone])

  const playNotification = useCallback(() => {
    if (!audioContextRef.current || isMutedRef.current) return

    const now = audioContextRef.current.currentTime
    // Simple pleasant notification sound
    playTone(523.25, 100, now) // C5
    playTone(659.25, 100, now + 0.12) // E5
    playTone(783.99, 150, now + 0.24) // G5
  }, [playTone])

  const setMuted = useCallback((muted: boolean) => {
    isMutedRef.current = muted
  }, [])

  const isMuted = useCallback(() => isMutedRef.current, [])

  return {
    playAlert,
    playNotification,
    setMuted,
    isMuted
  }
}

// Alert sound component that can be placed in the app
export function AlertSound({ urgency }: { urgency: 'emergency' | 'high' | 'normal' | 'low' }) {
  const { playAlert } = useAudioAlerts()
  
  useEffect(() => {
    playAlert(urgency)
  }, [urgency, playAlert])

  return null
}
