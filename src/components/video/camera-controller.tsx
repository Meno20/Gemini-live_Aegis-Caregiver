'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Wifi, WifiOff, RefreshCw, Radio, Camera as CameraIcon, AlertTriangle } from 'lucide-react';
import { useFrameCapture } from '@/hooks/use-frame-capture';

interface ViewerInfo {
  id: string;
  cameraEnabled: boolean;
}

interface WebRTCSignal {
  viewerId: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  data: unknown;
  timestamp: number;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function CameraController({ patientId, roomId }: { patientId?: string, roomId: string }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [viewers, setViewers] = useState<ViewerInfo[]>([]);
  const [activeViewerId, setActiveViewerId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isCameraEnabledRef = useRef(false);
  const activeViewerIdRef = useRef<string | null>(null);
  const processedOffersRef = useRef<Set<string>>(new Set());

  const { startCapture, stopCapture, lastAnalysis, isCapturing, error } = useFrameCapture(
    videoRef, 
    activeViewerId || 'unknown',
    roomId,
    patientId
  );

  useEffect(() => {
    isCameraEnabledRef.current = isCameraEnabled;
  }, [isCameraEnabled]);

  useEffect(() => {
    activeViewerIdRef.current = activeViewerId;
    if (activeViewerId && isStreaming) {
       startCapture();
    } else {
       stopCapture();
    }
  }, [activeViewerId, isStreaming, startCapture, stopCapture]);

  const handleOffer = useCallback(async (offer: WebRTCSignal) => {
    const viewerId = offer.viewerId;
    
    if (processedOffersRef.current.has(`${viewerId}-${offer.timestamp}`)) return;
    processedOffersRef.current.add(`${viewerId}-${offer.timestamp}`);
    
    const existingPc = peerConnectionsRef.current.get(viewerId);
    if (existingPc) {
      existingPc.close();
      peerConnectionsRef.current.delete(viewerId);
    }
    
    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerConnectionsRef.current.set(viewerId, pc);

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0] && videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
          setActiveViewerId(viewerId);
          setIsStreaming(true);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          peerConnectionsRef.current.delete(viewerId);
          if (activeViewerIdRef.current === viewerId) {
            setActiveViewerId(null);
            setIsStreaming(false);
            if (videoRef.current) videoRef.current.srcObject = null;
          }
        }
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await fetch('/api/video/signaling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'webrtc-ice-candidate',
              id: viewerId,
              signal: event.candidate.toJSON(),
              isFromController: true,
            }),
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer.data as RTCSessionDescriptionInit));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await fetch('/api/video/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'webrtc-answer',
          id: viewerId,
          signal: answer,
        }),
      });
    } catch (err) {
      console.error('[Controller] Error processing offer:', err);
    }
  }, []);

  const addIceCandidates = useCallback(async (candidates: WebRTCSignal[]) => {
    for (const candidate of candidates) {
      const pc = peerConnectionsRef.current.get(candidate.viewerId);
      if (pc && candidate.data) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate.data as RTCIceCandidateInit));
        } catch (err) {
          console.error('[Controller] Error adding ICE candidate:', err);
        }
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const heartbeat = async () => {
      try {
        const response = await fetch('/api/video/signaling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'heartbeat-controller' }),
        });
        const data = await response.json();
        
        if (mounted && data.success) {
          setIsConnected(true);
          setViewerCount(data.viewerCount);
          setViewers(data.viewers || []);

          if (data.offers?.length > 0) {
            for (const offer of data.offers) await handleOffer(offer);
          }
          if (data.iceCandidates?.length > 0) {
            await addIceCandidates(data.iceCandidates);
          }
        }
      } catch (error) {
        if (mounted) setIsConnected(false);
      }
    };

    const register = async () => {
      try {
        const response = await fetch('/api/video/signaling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'register-controller' }),
        });
        const data = await response.json();
        
        if (mounted && data.success) {
          setIsConnected(true);
          setViewerCount(data.viewerCount);
          setViewers(data.viewers || []);
          if (data.offers?.length > 0) {
            for (const offer of data.offers) await handleOffer(offer);
          }
        }
      } catch (error) {
        if (mounted) setIsConnected(false);
      }
    };

    register();
    pollingRef.current = setInterval(heartbeat, 1000);

    return () => {
      mounted = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, [handleOffer, addIceCandidates]);

  const toggleCamera = async () => {
    const newState = !isCameraEnabledRef.current;
    setIsCameraEnabled(newState);

    try {
      await fetch('/api/video/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-command', enabled: newState }),
      });
    } catch (error) {
      console.error('[Controller] Failed to send command:', error);
      setIsCameraEnabled(!newState);
    }
  };

  const handleManualCapture = () => {
    stopCapture();
    startCapture(); // forces an immediate capture
  };

  return (
    <Card className="w-full shadow-lg border-emerald-100 dark:border-emerald-900 overflow-hidden">
      <CardHeader className="bg-emerald-50 dark:bg-emerald-950/20 pb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900 p-2 rounded-full">
              <CameraIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-lg">{roomId.replace('-', ' ').toUpperCase()}</CardTitle>
              <CardDescription className="text-xs">
                {viewerCount > 0 ? `${viewerCount} device(s) connected` : 'No devices connected'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                <Wifi className="w-3 h-3 mr-1" /> Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200">
                <WifiOff className="w-3 h-3 mr-1" /> Offline
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-emerald-100 dark:divide-emerald-900">
          
          <div className="col-span-2 relative aspect-video bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isStreaming ? 'block' : 'hidden'}`}
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                <VideoOff className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium">Camera Offline</p>
                <p className="text-xs text-center px-4 mt-2 opacity-70">
                  {viewerCount === 0 
                    ? 'Waiting for patient device to connect...' 
                    : isCameraEnabled 
                      ? 'Waiting for video stream...'
                      : 'Click Enable feed to view room'}
                </p>
              </div>
            )}
            {isStreaming && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500/90 backdrop-blur text-white px-2.5 py-1 rounded-md text-xs font-bold tracking-wider shadow-sm">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            )}
          </div>
          
          <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 p-4">
            <div className="flex-1 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">AI Analysis</h3>
              
              {isCapturing && !lastAnalysis && (
                <div className="flex items-center justify-center h-24 border border-dashed rounded-lg bg-emerald-50/50">
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-xs text-emerald-600 font-medium">Analyzing feed...</span>
                  </div>
                </div>
              )}

              {lastAnalysis && (
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border shadow-sm">
                     <p className="text-xs font-semibold text-slate-500 mb-1">State</p>
                     <p className="text-sm text-slate-900 dark:text-slate-100 capitalize">{lastAnalysis.posture} • {lastAnalysis.activity}</p>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border shadow-sm">
                     <p className="text-xs font-semibold text-slate-500 mb-1">Emotion/Agitation</p>
                     <p className="text-sm text-slate-900 dark:text-slate-100">
                        {lastAnalysis.emotional_indicators?.facial_expression} 
                        {lastAnalysis.emotional_indicators?.estimated_agitation > 0 && ` (${lastAnalysis.emotional_indicators.estimated_agitation}/10)`}
                     </p>
                  </div>

                  {lastAnalysis.safety_concerns?.length > 0 && (
                    <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-lg border border-rose-200">
                       <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mb-1">
                         <AlertTriangle className="w-3 h-3" /> Safety Concerns
                       </p>
                       <ul className="text-xs text-rose-700 dark:text-rose-400 space-y-1 list-disc list-inside">
                          {lastAnalysis.safety_concerns.map((sc, i) => <li key={i}>{sc}</li>)}
                       </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2 pt-4 border-t">
              {isStreaming ? (
                <Button onClick={handleManualCapture} className="w-full bg-emerald-600 hover:bg-emerald-700" size="sm">
                  Force AI Analysis Now
                </Button>
              ) : null}
              
              <Button
                onClick={toggleCamera}
                disabled={!isConnected || viewerCount === 0}
                className="w-full transition-colors"
                variant={isCameraEnabled ? 'destructive' : 'outline'}
                size="sm"
              >
                {isCameraEnabled ? <><VideoOff className="w-4 h-4 mr-2" /> Stop Feed</> : <><Video className="w-4 h-4 mr-2" /> Start Feed</>}
              </Button>
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}
