'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface AudioAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  played: boolean;
}

export function useAudioAlerts() {
  const [alerts, setAlerts] = useState<AudioAlert[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const playAlertSound = useCallback((type: AudioAlert['type']) => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'critical':
        // Double beep high pitch
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
        
        // Second beep
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.3);
        osc2.frequency.exponentialRampToValueAtTime(440, now + 0.4);
        gain2.gain.setValueAtTime(0, now + 0.3);
        gain2.gain.linearRampToValueAtTime(0.2, now + 0.35);
        gain2.gain.linearRampToValueAtTime(0, now + 0.5);
        osc2.start(now + 0.3);
        osc2.stop(now + 0.5);
        break;

      case 'warning':
        // Single medium beep
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'info':
        // Soft low notification
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.linearRampToValueAtTime(392, now + 0.2);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
    }
  }, [isMuted]);

  const addAlert = useCallback((type: AudioAlert['type'], message: string) => {
    const newAlert: AudioAlert = {
      id: Math.random().toString(36).substring(7),
      type,
      message,
      timestamp: new Date(),
      played: false
    };

    setAlerts(prev => [newAlert, ...prev].slice(0, 50));
    playAlertSound(type);
    
    // Also use system notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Aegis Caregiver: ${type.toUpperCase()}`, {
        body: message,
        icon: '/favicon.ico'
      });
    }
  }, [playAlertSound]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Check for notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    alerts,
    addAlert,
    clearAlerts,
    isMuted,
    toggleMute,
    initAudio
  };
}
