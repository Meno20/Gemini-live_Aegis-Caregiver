'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Wifi, WifiOff, AlertCircle, Copy, Check, Radio } from 'lucide-react';

export default function CameraViewer() {
  const viewerIdRef = useRef(`viewer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [isConnected, setIsConnected] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastCommandRef = useRef<number>(0);
  const isCameraEnabledRef = useRef(false);
  const hasCreatedOfferRef = useRef(false);

  const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  useEffect(() => {
    isCameraEnabledRef.current = isCameraEnabled;
  }, [isCameraEnabled]);

  const createOffer = useCallback(async () => {
    if (!streamRef.current || hasCreatedOfferRef.current) return;

    try {
      hasCreatedOfferRef.current = true;
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerConnectionRef.current = pc;

      streamRef.current.getTracks().forEach(track => {
        if (streamRef.current) {
          pc.addTrack(track, streamRef.current);
        }
      });

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await fetch('/api/video/signaling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'webrtc-ice-candidate',
              id: viewerIdRef.current,
              signal: event.candidate.toJSON(),
              isFromController: false,
            }),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        setIsStreaming(pc.connectionState === 'connected');
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setIsStreaming(false);
          hasCreatedOfferRef.current = false;
        }
      };

      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);

      await fetch('/api/video/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'webrtc-offer',
          id: viewerIdRef.current,
          signal: offer,
        }),
      });

    } catch (err) {
      console.error('[Viewer] Error creating WebRTC offer:', err);
      setError('Failed to start video streaming');
      hasCreatedOfferRef.current = false;
    }
  }, []);

  const processAnswer = useCallback(async (answer: { data: RTCSessionDescriptionInit }) => {
    if (!peerConnectionRef.current) return;
    try {
      if (peerConnectionRef.current.currentRemoteDescription) return;
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer.data));
    } catch (err) {
      console.error('[Viewer] Error processing answer:', err);
    }
  }, []);

  const processIceCandidates = useCallback(async (candidates: { data: RTCIceCandidateInit }[]) => {
    if (!peerConnectionRef.current) return;
    for (const candidate of candidates) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate.data));
      } catch (err) {
        console.error('[Viewer] Error adding ICE candidate:', err);
      }
    }
  }, []);

  const enableCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraEnabled(true);
      await fetch('/api/video/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-status', id: viewerIdRef.current, enabled: true }),
      });

      setTimeout(() => createOffer(), 500);
    } catch (err) {
      console.error('[Viewer] Error accessing camera:', err);
      setError(err instanceof Error ? err.message : 'Failed to access camera.');
      setIsCameraEnabled(false);
    }
  }, [createOffer]);

  const disableCamera = useCallback(async () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    setIsCameraEnabled(false);
    setIsStreaming(false);
    hasCreatedOfferRef.current = false;
    
    await fetch('/api/video/signaling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-status', id: viewerIdRef.current, enabled: false }),
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      try {
        const response = await fetch('/api/video/signaling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'heartbeat-viewer', id: viewerIdRef.current }),
        });
        const data = await response.json();
        
        if (mounted && data.success) {
          setIsConnected(true);
          
          if (data.command && data.command.timestamp > lastCommandRef.current) {
            lastCommandRef.current = data.command.timestamp;
            if (data.command.enabled && !isCameraEnabledRef.current) await enableCamera();
            else if (!data.command.enabled && isCameraEnabledRef.current) await disableCamera();
          }

          if (data.answer) await processAnswer(data.answer);
          if (data.iceCandidates?.length > 0) await processIceCandidates(data.iceCandidates);
        }
      } catch (error) {
        console.error('[Viewer] Poll error:', error);
        if (mounted) setIsConnected(false);
      }
    };

    const register = async () => {
      try {
        const response = await fetch('/api/video/signaling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'register-viewer', id: viewerIdRef.current }),
        });
        const data = await response.json();
        
        if (mounted && data.success) {
          setIsConnected(true);
          if (data.command && data.command.timestamp > lastCommandRef.current) {
            lastCommandRef.current = data.command.timestamp;
            if (data.command.enabled) await enableCamera();
          }
        }
      } catch (error) {
        if (mounted) setIsConnected(false);
      }
    };

    register();
    pollingRef.current = setInterval(poll, 1000);

    return () => {
      mounted = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
      fetch('/api/video/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect-viewer', id: viewerIdRef.current }),
      }).catch(e => console.error(e));
      
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, [enableCamera, disableCamera, processAnswer, processIceCandidates]);

  const copyControllerUrl = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}` : '/';
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          {isStreaming ? (
            <Radio className="w-8 h-8 text-green-500 animate-pulse" />
          ) : isCameraEnabled ? (
            <Video className="w-8 h-8 text-primary" />
          ) : (
            <VideoOff className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <CardTitle className="text-2xl">Camera Viewer (Patient Side)</CardTitle>
        <CardDescription>
          This tablet is streaming video to the caregiver interface
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
            <span className="text-sm font-medium">Server</span>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Connected' : 'Connecting...'}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            {isStreaming ? <Radio className="w-4 h-4 text-green-500 animate-pulse" /> : isCameraEnabled ? <Video className="w-4 h-4 text-yellow-500" /> : <VideoOff className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm font-medium">Stream</span>
          </div>
          <Badge variant={isStreaming ? 'default' : isCameraEnabled ? 'secondary' : 'secondary'}>
            {isStreaming ? 'Live' : isCameraEnabled ? 'Ready' : 'Inactive'}
          </Badge>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">Camera Error</p>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isCameraEnabled ? 'block' : 'hidden'}`}
          />
          {!isCameraEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
              <VideoOff className="w-16 h-16 mb-2" />
              <p className="text-sm">Camera is off</p>
              <p className="text-xs mt-1">Waiting for controller command...</p>
            </div>
          )}
          {isStreaming && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              STREAMING TO CAREGIVER
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={enableCamera} disabled={isCameraEnabled} className="flex-1" variant="default">
            <Video className="w-4 h-4 mr-2" />
            Enable Camera
          </Button>
          <Button onClick={disableCamera} disabled={!isCameraEnabled} className="flex-1" variant="destructive">
            <VideoOff className="w-4 h-4 mr-2" />
            Disable Camera
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
