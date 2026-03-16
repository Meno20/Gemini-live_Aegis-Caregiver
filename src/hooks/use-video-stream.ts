'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface VideoStreamOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  fps?: number;
}

export function useVideoStream(options: VideoStreamOptions = {}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const start = useCallback(async () => {
    try {
      setError(null);
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: options.width || 1280 },
          height: { ideal: options.height || 720 },
          facingMode: options.facingMode || 'environment',
          frameRate: { ideal: options.fps || 15 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to access camera';
      setError(msg);
      setIsActive(false);
      console.error('[VideoStream] Error starting stream:', err);
    }
  }, [options]);

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const captureFrame = useCallback((quality = 0.8): string | null => {
    if (!videoRef.current || !isActive) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to video dimensions if not set
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return {
    stream,
    isActive,
    error,
    start,
    stop,
    captureFrame,
    videoRef
  };
}
