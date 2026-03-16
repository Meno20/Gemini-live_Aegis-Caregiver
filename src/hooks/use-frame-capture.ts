"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

export interface VisionAnalysisResult {
  activity: string;
  posture: string;
  location_in_frame: string;
  safety_concerns: string[];
  eating_drinking: {
    detected: boolean;
    food_items: string[];
    consumption_estimate: string;
  };
  emotional_indicators: {
    facial_expression: string;
    body_language: string;
    estimated_agitation: number;
  };
  wandering_indicators: {
    near_exit: boolean;
    wearing_outdoor_clothes: boolean;
    carrying_belongings: boolean;
    pacing: boolean;
    risk_level: string;
  };
  gait_observations: {
    mobility: string;
    fall_risk: string;
  };
  urgency: string;
  recommended_actions: string[];
}

export function useFrameCapture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  cameraId: string,
  roomId: string,
  patientId?: string
) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<VisionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentIntervalMs = useRef<number>(10000); // 10 seconds default

  const isCapturingRef = useRef(false);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Create canvas to capture frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');

    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          cameraId,
          roomId,
          patientId,
          analysisType: 'frame-analysis',
        }),
      });

      if (!res.ok) throw new Error('Vision API error');
      const data = await res.json();
      
      if (data.analysis) {
        setLastAnalysis(data.analysis);
        
        // Auto-adjust interval based on agitation
        const agitation = data.analysis.emotional_indicators?.estimated_agitation || 0;
        let newInterval = 10000;
        if (agitation >= 5) newInterval = 5000;
        else if (data.analysis.posture === 'lying' && data.analysis.activity.toLowerCase().includes('sleep')) newInterval = 60000;

        if (newInterval !== currentIntervalMs.current) {
          currentIntervalMs.current = newInterval;
          if (isCapturingRef.current) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(captureAndAnalyze, currentIntervalMs.current);
          }
        }
      }
    } catch (err: any) {
      console.error('Frame capture error:', err);
      setError(err.message);
    }
  }, [videoRef, cameraId, roomId, patientId]);

  const startCapture = useCallback(() => {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;
    setIsCapturing(true);
    setError(null);
    captureAndAnalyze(); // immediate first capture
    intervalRef.current = setInterval(captureAndAnalyze, currentIntervalMs.current);
  }, [captureAndAnalyze]);

  const stopCapture = useCallback(() => {
    isCapturingRef.current = false;
    setIsCapturing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCapture();
  }, [stopCapture]);

  return { startCapture, stopCapture, lastAnalysis, isCapturing, error };
}
