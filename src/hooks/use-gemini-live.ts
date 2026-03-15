'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type LiveMessageType = 'text' | 'audio' | 'connected' | 'closed' | 'error' | 'turn_complete' | 'pong';

export interface LiveMessage {
  type: LiveMessageType;
  content?: string;
  data?: string;
  error?: string;
  role?: 'user' | 'assistant';
}

export function useGeminiLive() {
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [isTurnComplete, setIsTurnComplete] = useState(true);

  // Recording-specific refs
  const recorderNodeRef = useRef<AudioWorkletNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const WS_URL =
    (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_LIVE_WS_URL) ||
    (typeof window !== 'undefined' 
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
      : 'ws://localhost:8081');

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;
    }
  };

  const convertFloat32ToPCM16 = (buffer: Float32Array) => {
    const pcm = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      // Clamp values between -1 and 1 and scale to 16-bit PCM range
      const s = Math.max(-1, Math.min(1, buffer[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm.buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      await audioCtx.audioWorklet.addModule('/worklets/pcm-recorder-processor.js');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
      const source = audioCtx.createMediaStreamSource(stream);
      const recorderNode = new AudioWorkletNode(audioCtx, 'pcm-recorder-processor');

      recorderNode.port.onmessage = (event) => {
        const float32Data = event.data;
        const pcmBuffer = convertFloat32ToPCM16(float32Data);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const base64 = arrayBufferToBase64(pcmBuffer);
          wsRef.current.send(JSON.stringify({ 
            type: 'audio', 
            data: base64, 
            mimeType: 'audio/pcm;rate=16000' 
          }));
        }
      };

      source.connect(recorderNode);
      // We don't necessarily need to connect to destination unless we want to monitor
      
      recorderNodeRef.current = recorderNode;
      micStreamRef.current = stream;
      setIsRecording(true);
    } catch (err) {
      console.error('[Gemini Live] Failed to start recording:', err);
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    
    recorderNodeRef.current?.disconnect();
    recorderNodeRef.current = null;
    
    micStreamRef.current?.getTracks().forEach(track => track.stop());
    micStreamRef.current = null;
    
    setIsRecording(false);
  }, [isRecording]);

  const playPcmChunk = (base64Data: string) => {
    if (!audioCtxRef.current) return;
    try {
      const binaryStr = atob(base64Data);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      
      const buffer = new Int16Array(bytes.buffer);
      const audioBuffer = audioCtxRef.current.createBuffer(1, buffer.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = buffer[i] / 32768.0;
      }
      
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtxRef.current.destination);
      
      const currentTime = audioCtxRef.current.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
    } catch (e) {
      console.error('[Gemini Live] Audio playback error:', e);
    }
  };

  const connect = useCallback((patientId: string = 'maggie', mode: string = 'patient-voice') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    setIsConnecting(true);
    initAudio();

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send init config immediately
      ws.send(JSON.stringify({ type: 'init', patientId, mode }));
    };

    ws.onmessage = (event) => {
      try {
        const msg: LiveMessage = JSON.parse(event.data);

        switch (msg.type) {
          case 'connected':
            setIsConnected(true);
            setIsConnecting(false);
            break;

          case 'text':
            setMessages((prev) => [...prev, { ...msg, role: 'assistant' }]);
            break;
            
          case 'audio':
            if (msg.data) {
              playPcmChunk(msg.data);
            }
            break;

          case 'turn_complete':
            setIsTurnComplete(true);
            break;

          case 'error':
            console.error('[Gemini Live] Error:', msg.error);
            setIsConnecting(false);
            break;

          case 'closed':
            setIsConnected(false);
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('[Gemini Live] Failed to parse message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, [WS_URL]);

  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('[Gemini Live] Not connected. Call connect() first.');
      return;
    }

    setMessages((prev) => [
      ...prev,
      { type: 'text', content: text, role: 'user' },
    ]);
    setIsTurnComplete(false);
    
    // Stop any currently playing audio if the user interrupts
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().then(() => {
        audioCtxRef.current = null;
        initAudio();
      }).catch(err => {
        console.error('[Gemini Live] Error closing audio context:', err);
        audioCtxRef.current = null;
        initAudio();
      });
    } else {
      audioCtxRef.current = null;
      initAudio();
    }

    wsRef.current.send(JSON.stringify({ type: 'text', content: text }));
  }, []);

  const sendAudio = useCallback((base64Data: string, mimeType?: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'audio', data: base64Data, mimeType }));
    setIsTurnComplete(false);
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    stopRecording();
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(console.error);
    }
    audioCtxRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(console.error);
      }
    };
  }, []);

  return {
    connect,
    disconnect,
    sendText,
    sendAudio,
    startRecording,
    stopRecording,
    isConnected,
    isConnecting,
    isRecording,
    isTurnComplete,
    messages,
    clearMessages,
  };
}
