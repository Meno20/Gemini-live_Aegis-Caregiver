# Aegis Caregiver Worklog

---
Task ID: 1
Agent: Main
Task: Build comprehensive healthcare AI application with voice I/O, patient-specific conversations, and vision capability

Work Log:
- Explored existing codebase to understand structure
- Identified issues: navigation buttons not working, conversation isolation needed, voice I/O requirements, vision aspect
- Read skill documentation for ASR, TTS, VLM, and LLM
- Completely rewrote src/app/page.tsx with comprehensive solution

Stage Summary:
- Fixed navigation: All sidebar buttons now properly switch between Dashboard, Insights, Conversations, Health Records, Care Team, and Settings views
- Implemented patient-specific conversations: Each patient (Maggie/Bill) has their own isolated conversation history stored in `conversations` state object keyed by patient ID
- Voice Input (ASR): Microphone button records audio, sends to /api/asr for transcription, displays user's speech as text
- Voice Output (TTS): AI responses are spoken aloud using /api/tts (can be toggled with mute button)
- Vision Capability: Camera monitor with AI safety analysis using /api/vision endpoint
- All API routes already existed and are working: /api/asr, /api/tts, /api/vision, /api/interactions
- Created comprehensive panel components: VoiceInteractionPanel, VisionMonitorPanel, InsightsPanel, HealthPanel, CareTeamPanel, SettingsPanel

---
Task ID: 2
Agent: Main
Date: 2026-03-13
Task: Migrate from z-ai-web-dev-sdk to @google/genai, add Gemini Live WebSocket support

Work Log:
- Scanned all source files for z-ai-web-dev-sdk imports — found 5 files
- Updated package.json: removed z-ai-web-dev-sdk, added @google/genai ^1.0.1, ws ^8.18.2, dotenv
- Fixed dev script for Windows (removed tee dependency)
- Created .env with all required environment variables (user must fill in API keys)
- Created src/lib/gemini.ts — shared GoogleGenAI client and MODELS constants
- Rewrote src/lib/gemini/memory-prosthetic.ts — all ZAI chat completions migrated to ai.models.generateContent()
- Rewrote src/app/api/asr/route.ts — audio transcription now uses Gemini multimodal inlineData
- Rewrote src/app/api/tts/route.ts — TTS now uses Gemini responseModalities AUDIO + speechConfig; default voice changed from 'tongtong' to 'Aoede' (Gemini built-in)
- Rewrote src/app/api/vision/route.ts — vision analysis now uses Gemini multimodal inlineData image; properly strips data URL prefix
- Rewrote src/app/api/interactions/route.ts — chat completions and emotion analysis both migrated to Gemini; JSON extraction hardened with regex to handle markdown-wrapped responses
- Created server/live-ws.js — Node.js WebSocket sidecar server on port 8081 using Gemini Live API (gemini-2.0-flash-live-001)
- Created src/hooks/use-gemini-live.ts — React hook for frontend WebSocket management; supports sendText, sendAudio, connect, disconnect; tracks user/assistant message roles
- Added dev:live script to package.json

Files Changed:
  MODIFIED  package.json
  MODIFIED  .env
  NEW       src/lib/gemini.ts
  MODIFIED  src/lib/gemini/memory-prosthetic.ts
  MODIFIED  src/app/api/asr/route.ts
  MODIFIED  src/app/api/tts/route.ts
  MODIFIED  src/app/api/vision/route.ts
  MODIFIED  src/app/api/interactions/route.ts
  NEW       server/live-ws.js
  NEW       src/hooks/use-gemini-live.ts

---
Task ID: 3
Agent: Main
Date: 2026-03-14
Task: Migrate Backend from Prisma/Supabase to Firebase (Firestore & Auth)

Work Log:
- Removed Prisma and Supabase dependencies; moved to `firebase` and `firebase-admin`.
- Created Firebase Client (`src/lib/firebase/client.ts`) and Admin (`src/lib/firebase/admin.ts`) initializers.
- Replaced NextAuth with Firebase Session Cookie authentication:
    - Implemented `/api/auth/login` to verify ID tokens and set cookies.
    - Implemented `/api/auth/logout` to clear cookies.
    - Updated `src/app/login/page.tsx` to handle Firebase client-side login.
- Migrated Database Layer:
    - Created `src/lib/db/types.ts` with TypeScript interfaces for all collections.
    - Created `src/lib/db/index.ts` with Firestore-backed CRUD functions (replacing Prisma).
    - Rewrote API routes: `/api/patients`, `/api/alerts`, `/api/interactions`, `/api/insights` to use Firestore.
- Seeding & Deployment:
    - Wrote `scripts/seed.ts` to populate Firestore with Maggie and Bill's data from the dashboard.
    - Created `firestore.rules` for production-ready security.
    - Created `firestore.indexes.json` for optimized query performance.
- Troubleshooting:
    - Resolved `PERMISSION_DENIED` by guiding user to enable Firestore API and create the database instance.
    - Resolved `INVALID_CREDENTIAL` in scripts by adding `dotenv` initialization to `admin.ts`.
    - Identified Project ID/Service Account mismatches (Project Number deletion errors).

Files Changed/Created:
  MODIFIED  package.json
  NEW       firestore.rules
  NEW       firestore.indexes.json
  NEW       src/lib/firebase/client.ts
  NEW       src/lib/firebase/admin.ts
  NEW       src/lib/db/types.ts
  NEW       src/lib/db/index.ts
  NEW       src/lib/ai-context.ts
  MODIFIED  src/lib/auth.ts
  NEW       src/app/api/auth/login/route.ts
  NEW       src/app/api/auth/logout/route.ts
  MODIFIED  src/app/login/page.tsx
  NEW       scripts/seed.ts
  MODIFIED  src/app/api/patients/route.ts
  MODIFIED  src/app/api/alerts/route.ts
  MODIFIED  src/app/api/interactions/route.ts
  MODIFIED  src/app/api/insights/route.ts
  DELETE    src/lib/db.ts
  DELETE    prisma/

## Gemini Live WebSocket Integration Autopsy (2026)

1. **Model Deprecation / Rejection**: The `@google/genai` sdk was failing to connect because `gemini-2.0-flash-exp` was silently removed from the Live API (`bidiGenerateContent`) support list. The connection promise would resolve 'OK' on the Node side, but Google's server would instantly kill the WebSocket connection in the background with a 1008 Policy Violation, locking the UI from accepting texts.
2. **Migration to 2.5 Native Audio**: The ONLY model currently supporting Bidi on the `v1alpha` endpoint is `gemini-2.5-flash-native-audio-latest`. I explicitly configured `server/live-ws.js` to use `httpOptions: { apiVersion: 'v1alpha' }` and this specific preview model.
3. **Audio Modality Strictness**: The `gemini-2.5-flash-native-audio-latest` model strictly enforces `responseModalities: ['AUDIO']`. If it receives `speechConfig` or `TEXT` as an expected modality, it crashes with `Cannot extract voices from a non-audio request` or `Invalid Argument`. By stripping these legacy 2.0 parameters out, Gemini 2.5 natively streams the voice AND text correctly at the same time.
4. **React AudioContext Crash**: The Next.js `InvalidStateError` was caused by Fast Refresh / component re-renders attempting to `close()` an `AudioContext` that was already destroyed. We added strict `if (audioCtxRef.current && audioCtxRef.current.state !== 'closed')` checks in `src/hooks/use-gemini-live.ts` to fully patch the frontend crash.

---
Task ID: 4
Agent: Main
Date: 2026-03-15
Task: Integrate Voice Input and Prepare for Cloud Run Deployment

Work Log:
- Analyzed Gemini Live requirements for raw 16kHz PCM audio input.
- Created `public/worklets/pcm-recorder-processor.js` for thread-isolated audio capture.
- Updated `use-gemini-live.ts` with:
    - Real-time `Float32` to `PCM16` conversion logic.
    - Automated WebSocket streaming for audio chunks.
    - Dynamic WebSocket URL detection (`ws` vs `wss`) based on context.
- Re-wired `VoiceInteractionPanel` UI to use the new high-fidelity recording system.
- Designed and implemented "Unified Container" architecture for Cloud Run:
    - `Dockerfile`: Multi-stage build for Next.js standalone + WebSocket server.
    - `Caddyfile`: Configured as a reverse proxy to handle production WebSockets and Routing.
    - `entrypoint.sh`: Orchestrated process manager for container services.
    - `deploy.sh`: Automated GCR build and Cloud Run deployment script.
- Verified pricing estimates for 2 months of hosting (confirmed ~$0-15 depending on usage/credits).

Files Changed/Created:
  NEW       public/worklets/pcm-recorder-processor.js
  MODIFIED  src/hooks/use-gemini-live.ts
  MODIFIED  src/app/page.tsx
  NEW       Dockerfile
  NEW       Caddyfile
  NEW       entrypoint.sh
  NEW       deploy.sh
  MODIFIED  USER_CHECKLIST.md
  MODIFIED  worklog.md
