"use client";

import { Camera, CameraOff, Brain, Image as ImageIcon, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Patient } from "@/types/dashboard";

interface VisionMonitorPanelProps {
  patient: Patient;
  isStreaming: boolean;
  isAnalyzing: boolean;
  analysis: { safetyLevel: string; concerns: string[]; patientState?: string } | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onAnalyze: () => void;
}

export function VisionMonitorPanel({ 
  patient, 
  isStreaming, 
  isAnalyzing, 
  analysis, 
  videoRef, 
  canvasRef,
  onStartCamera,
  onStopCamera,
  onAnalyze 
}: VisionMonitorPanelProps) {
  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:border-purple-800 dark:from-purple-950/50 dark:to-indigo-950/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500 text-white">
            <Camera className="h-4 w-4" />
          </div>
          Vision Monitor - {patient.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${isStreaming ? 'block' : 'hidden'}`} 
          />
          <canvas ref={canvasRef} className="hidden" />
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <CameraOff className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                <p>Camera not active</p>
                <p className="text-sm text-slate-400">Click "Start Camera" to begin monitoring</p>
              </div>
            </div>
          )}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
              <div className="text-center">
                <Brain className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <p>Analyzing...</p>
              </div>
            </div>
          )}
          {isStreaming && !isAnalyzing && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-red-500 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-white mr-2" />
                LIVE
              </Badge>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isStreaming ? (
            <Button onClick={onStartCamera} className="flex-1 bg-purple-500 hover:bg-purple-600">
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          ) : (
            <>
              <Button onClick={onStopCamera} variant="outline" className="flex-1">
                <CameraOff className="h-4 w-4 mr-2" />
                Stop
              </Button>
              <Button onClick={onAnalyze} disabled={isAnalyzing} className="flex-1 bg-purple-500 hover:bg-purple-600">
                <ImageIcon className="h-4 w-4 mr-2" />
                Analyze Frame
              </Button>
            </>
          )}
        </div>

        {analysis && (
          <Card className="bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {analysis.safetyLevel === 'safe' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                Safety Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={analysis.safetyLevel === 'safe' ? 'default' : analysis.safetyLevel === 'caution' ? 'secondary' : 'destructive'}>
                  {analysis.safetyLevel?.toUpperCase()}
                </Badge>
                {analysis.patientState && (
                  <Badge variant="outline">
                    Patient: {analysis.patientState}
                  </Badge>
                )}
              </div>
              {analysis.concerns && analysis.concerns.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Concerns:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {analysis.concerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 mt-1 shrink-0 text-amber-500" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
