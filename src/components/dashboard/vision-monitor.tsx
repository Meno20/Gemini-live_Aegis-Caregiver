"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Eye, 
  AlertTriangle,
  Shield,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Video,
  VideoOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VisionMonitorProps {
  patient: {
    id: string;
    name: string;
    age: number;
    dementiaStage: string;
  };
}

interface SafetyAnalysis {
  safetyLevel: "safe" | "caution" | "alert";
  concerns: string[];
  recommendations: string[];
  patientState: string;
  location: string;
  immediateAction: boolean;
}

export function VisionMonitor({ patient }: VisionMonitorProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<SafetyAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.");
      console.error("Camera error:", err);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageBase64);
    
    return imageBase64;
  }, []);

  const analyzeImage = async () => {
    const imageBase64 = await captureFrame();
    if (!imageBase64) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          patientContext: {
            name: patient.name,
            age: patient.age,
            dementiaStage: patient.dementiaStage,
          },
          analysisType: 'safety',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLastAnalysis(data.analysis);
        
        // If safety level is alert, could trigger notification
        if (data.analysis.safetyLevel === 'alert' && data.analysis.immediateAction) {
          // Could integrate with alerts system here
          console.log("Safety alert detected:", data.analysis);
        }
      } else {
        setError(data.error || "Failed to analyze image");
      }
    } catch (err) {
      setError("Failed to connect to vision analysis service");
      console.error("Vision analysis error:", err);
    }

    setIsAnalyzing(false);
  };

  const getSafetyColor = (level: string) => {
    switch (level) {
      case 'safe':
        return 'bg-emerald-500';
      case 'caution':
        return 'bg-amber-500';
      case 'alert':
        return 'bg-red-500 animate-pulse';
      default:
        return 'bg-slate-500';
    }
  };

  const getSafetyIcon = (level: string) => {
    switch (level) {
      case 'safe':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'caution':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'alert':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:border-purple-800 dark:from-purple-950/30 dark:to-indigo-950/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500 text-white">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Vision Monitor</CardTitle>
              <CardDescription>AI-powered safety monitoring</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800">
                <span className="mr-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Live
              </Badge>
            )}
            {lastAnalysis && (
              <Badge 
                variant="outline" 
                className={`
                  ${lastAnalysis.safetyLevel === 'safe' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}
                  ${lastAnalysis.safetyLevel === 'caution' ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}
                  ${lastAnalysis.safetyLevel === 'alert' ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : ''}
                `}
              >
                {lastAnalysis.safetyLevel.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Feed */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isStreaming ? 'block' : 'hidden'}`}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {!isStreaming && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <Video className="h-16 w-16 mb-4 text-slate-400" />
              <p className="text-slate-400">Camera not active</p>
              <p className="text-xs text-slate-500 mt-1">Click Start Camera to begin monitoring</p>
            </div>
          )}

          {/* Overlay for analyzing */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex flex-col items-center text-white">
                <Loader2 className="h-10 w-10 animate-spin mb-2" />
                <p>Analyzing...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isStreaming ? (
            <Button onClick={startCamera} className="flex-1">
              <Video className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          ) : (
            <>
              <Button onClick={stopCamera} variant="outline" className="flex-1">
                <VideoOff className="h-4 w-4 mr-2" />
                Stop
              </Button>
              <Button 
                onClick={analyzeImage} 
                disabled={isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Analyze
              </Button>
            </>
          )}
        </div>

        {/* Analysis Results */}
        <AnimatePresence>
          {lastAnalysis && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {/* Safety Status */}
              <div className={`
                flex items-center gap-3 p-3 rounded-lg
                ${lastAnalysis.safetyLevel === 'safe' ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}
                ${lastAnalysis.safetyLevel === 'caution' ? 'bg-amber-50 dark:bg-amber-900/20' : ''}
                ${lastAnalysis.safetyLevel === 'alert' ? 'bg-red-50 dark:bg-red-900/20' : ''}
              `}>
                {getSafetyIcon(lastAnalysis.safetyLevel)}
                <div className="flex-1">
                  <p className="font-medium capitalize">{lastAnalysis.safetyLevel} Status</p>
                  <p className="text-sm text-muted-foreground">
                    Patient state: {lastAnalysis.patientState}
                  </p>
                </div>
                {lastAnalysis.location && (
                  <Badge variant="outline">{lastAnalysis.location}</Badge>
                )}
              </div>

              {/* Concerns */}
              {lastAnalysis.concerns && lastAnalysis.concerns.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Concerns Detected:</p>
                  <div className="flex flex-wrap gap-2">
                    {lastAnalysis.concerns.map((concern, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">
                        {concern}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {lastAnalysis.recommendations && lastAnalysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recommendations:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {lastAnalysis.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Shield className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Immediate Action Alert */}
              {lastAnalysis.immediateAction && (
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">Immediate Attention Required</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground text-center">
          Vision AI analyzes the environment for safety concerns, patient state, and potential hazards.
        </div>
      </CardContent>
    </Card>
  );
}
