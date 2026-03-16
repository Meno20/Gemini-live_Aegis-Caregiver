import { NextRequest, NextResponse } from 'next/server';

interface Viewer {
  id: string;
  lastSeen: number;
  cameraEnabled: boolean;
}

interface WebRTCSignal {
  viewerId: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  data: unknown;
  timestamp: number;
}

interface SignalingState {
  viewers: Map<string, Viewer>;
  command: {
    enabled: boolean;
    timestamp: number;
  } | null;
  controllerLastSeen: number;
  pendingOffers: Map<string, WebRTCSignal>;
  pendingAnswers: Map<string, WebRTCSignal>;
  iceCandidatesForViewer: Map<string, WebRTCSignal[]>;
  iceCandidatesForController: WebRTCSignal[];
}

const state: SignalingState = {
  viewers: new Map(),
  command: null,
  controllerLastSeen: 0,
  pendingOffers: new Map(),
  pendingAnswers: new Map(),
  iceCandidatesForViewer: new Map(),
  iceCandidatesForController: [],
};

const CLEANUP_INTERVAL = 10000;
const STALE_THRESHOLD = 15000;

if (typeof globalThis !== 'undefined') {
  const globalWithCleanup = globalThis as { signalingCleanup?: NodeJS.Timeout };
  if (!globalWithCleanup.signalingCleanup) {
    globalWithCleanup.signalingCleanup = setInterval(() => {
      const now = Date.now();
      for (const [id, viewer] of state.viewers) {
        if (now - viewer.lastSeen > STALE_THRESHOLD) {
          state.viewers.delete(id);
          state.pendingOffers.delete(id);
          state.pendingAnswers.delete(id);
          state.iceCandidatesForViewer.delete(id);
        }
      }
      for (const [id, offer] of state.pendingOffers) {
        if (now - offer.timestamp > STALE_THRESHOLD) {
          state.pendingOffers.delete(id);
        }
      }
      for (const [id, answer] of state.pendingAnswers) {
        if (now - answer.timestamp > STALE_THRESHOLD) {
          state.pendingAnswers.delete(id);
        }
      }
      state.iceCandidatesForController = state.iceCandidatesForController.filter(
        c => now - c.timestamp < STALE_THRESHOLD
      );
      if (now - state.controllerLastSeen > STALE_THRESHOLD) {
        state.command = null;
      }
    }, CLEANUP_INTERVAL);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, enabled, signal, isFromController } = body;
    const now = Date.now();

    const getActiveViewers = () => {
      return Array.from(state.viewers.values()).filter(
        v => now - v.lastSeen < STALE_THRESHOLD
      );
    };

    switch (action) {
      case 'register-controller':
      case 'heartbeat-controller': {
        state.controllerLastSeen = now;
        const activeViewers = getActiveViewers();
        const offers = Array.from(state.pendingOffers.values()).filter(
          o => now - o.timestamp < STALE_THRESHOLD
        );
        const iceCandidates = state.iceCandidatesForController.filter(
          c => now - c.timestamp < STALE_THRESHOLD
        );
        
        if (action === 'heartbeat-controller') {
          state.iceCandidatesForController = [];
        }
        
        return NextResponse.json({
          success: true,
          viewerCount: activeViewers.length,
          viewers: activeViewers.map(v => ({ id: v.id, cameraEnabled: v.cameraEnabled })),
          offers,
          iceCandidates,
        });
      }

      case 'register-viewer': {
        if (!id) return NextResponse.json({ error: 'Viewer ID required' }, { status: 400 });
        state.viewers.set(id, { id, lastSeen: now, cameraEnabled: false });
        return NextResponse.json({
          success: true,
          command: state.command && now - state.command.timestamp < STALE_THRESHOLD ? state.command : null,
        });
      }

      case 'heartbeat-viewer': {
        if (!id) return NextResponse.json({ error: 'Viewer ID required' }, { status: 400 });
        const viewer = state.viewers.get(id);
        if (viewer) {
          viewer.lastSeen = now;
        } else {
          state.viewers.set(id, { id, lastSeen: now, cameraEnabled: false });
        }
        
        const answer = state.pendingAnswers.get(id);
        const candidates = state.iceCandidatesForViewer.get(id) || [];
        const iceCandidates = candidates.filter(c => now - c.timestamp < STALE_THRESHOLD);
        
        state.iceCandidatesForViewer.set(id, []);
        
        return NextResponse.json({
          success: true,
          command: state.command && now - state.command.timestamp < STALE_THRESHOLD ? state.command : null,
          answer: answer && now - answer.timestamp < STALE_THRESHOLD ? answer : null,
          iceCandidates,
        });
      }

      case 'send-command': {
        state.controllerLastSeen = now;
        state.command = { enabled: enabled === true, timestamp: now };
        return NextResponse.json({ success: true });
      }

      case 'update-status': {
        if (!id) return NextResponse.json({ error: 'Viewer ID required' }, { status: 400 });
        const viewerToUpdate = state.viewers.get(id);
        if (viewerToUpdate) {
          viewerToUpdate.cameraEnabled = enabled === true;
          viewerToUpdate.lastSeen = now;
        }
        return NextResponse.json({ success: true });
      }

      case 'disconnect-viewer': {
        if (id) {
          state.viewers.delete(id);
          state.pendingOffers.delete(id);
          state.pendingAnswers.delete(id);
          state.iceCandidatesForViewer.delete(id);
        }
        return NextResponse.json({ success: true });
      }

      case 'webrtc-offer': {
        if (!id || !signal) return NextResponse.json({ error: 'Viewer ID & signal required' }, { status: 400 });
        state.pendingOffers.set(id, { viewerId: id, type: 'offer', data: signal, timestamp: now });
        return NextResponse.json({ success: true });
      }

      case 'webrtc-answer': {
        if (!id || !signal) return NextResponse.json({ error: 'Viewer ID & signal required' }, { status: 400 });
        state.pendingAnswers.set(id, { viewerId: id, type: 'answer', data: signal, timestamp: now });
        return NextResponse.json({ success: true });
      }

      case 'webrtc-ice-candidate': {
        if (!id || !signal) return NextResponse.json({ error: 'Viewer ID & signal required' }, { status: 400 });
        const candidate: WebRTCSignal = { viewerId: id, type: 'ice-candidate', data: signal, timestamp: now };
        
        if (isFromController) {
          if (!state.iceCandidatesForViewer.has(id)) state.iceCandidatesForViewer.set(id, []);
          state.iceCandidatesForViewer.get(id)!.push(candidate);
        } else {
          state.iceCandidatesForController.push(candidate);
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Signaling API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const now = Date.now();
  const activeViewers = Array.from(state.viewers.values()).filter(v => now - v.lastSeen < STALE_THRESHOLD);
  return NextResponse.json({
    status: 'ok',
    controllerActive: now - state.controllerLastSeen < STALE_THRESHOLD,
    viewerCount: activeViewers.length,
  });
}
