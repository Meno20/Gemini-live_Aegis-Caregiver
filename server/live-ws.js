// server/live-ws.js
// Aegis Live WebSocket Sidecar Server — Patient-Aware Sessions
// Run with: node server/live-ws.js
// Requires GEMINI_API_KEY to be set in environment / .env

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { WebSocketServer, WebSocket } = require('ws');
const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('[Aegis Live] ERROR: GEMINI_API_KEY is not set. Exiting.');
  process.exit(1);
}

const ai = new GoogleGenAI({ 
  apiKey: GEMINI_API_KEY,
  httpOptions: { apiVersion: 'v1alpha' }
});
const PORT = Number(process.env.LIVE_WS_PORT) || 8081;

// Patient profiles (in production, fetch from database)
const PATIENT_PROFILES = {
  maggie: {
    name: 'Maggie Thompson',
    age: 78,
    stage: 'moderate',
    spouse: 'Bob Thompson',
    spouseStatus: 'passed away 2014',
    children: ['Sarah', 'David'],
    favoriteMusic: ['Frank Sinatra', 'Ella Fitzgerald', 'Dean Martin'],
    career: 'Elementary school teacher for 35 years',
    keyMemories: [
      'Summer vacations at Lake Michigan',
      'Teaching first grade at Lincoln Elementary',
      'Dancing with Bob at their wedding',
      'Baking cookies with grandchildren',
    ],
    repeatedQuestions: [
      'Where is Bob?',
      'When am I going home?',
      'Did I eat today?',
    ],
    medications: [
      { name: 'Donepezil', time: '8:00 AM', color: 'yellow' },
      { name: 'Memantine', time: '8:00 PM', color: 'blue' },
    ],
  },
  bill: {
    name: 'Bill Martinez',
    age: 82,
    stage: 'early-moderate',
    spouse: 'Rosa Martinez',
    spouseStatus: 'living, primary caregiver',
    children: ['Carlos', 'Maria', 'Elena'],
    favoriteMusic: ['Johnny Cash', 'Patsy Cline', 'Hank Williams'],
    career: 'Carpenter and woodworker for 40 years',
    keyMemories: [
      'Building the family home with his own hands',
      'Fishing trips with Carlos every summer',
      "Rosa's cooking — especially her enchiladas",
      'Woodworking shop in the garage',
    ],
    repeatedQuestions: [
      'Where are my tools?',
      'Is Rosa here?',
      'What day is it?',
    ],
    medications: [
      { name: 'Donepezil', time: '9:00 AM', color: 'white' },
    ],
  },
};

// Active sessions tracking
const activeSessions = new Map();

const wss = new WebSocketServer({ port: PORT });

wss.on('listening', () => {
  console.log(`🛡️  Aegis Live WebSocket server running on ws://localhost:${PORT}`);
  console.log(`   Modes: patient-voice, crisis-deescalation`);
  console.log(`   Patients: ${Object.keys(PATIENT_PROFILES).join(', ')}`);
});

wss.on('connection', async (clientWs) => {
  console.log('[Aegis Live] Client connected');

  let geminiSession = null;
  let currentMode = 'patient-voice';
  let currentPatient = null;

  clientWs.on('message', async (data) => {
    try {
      const parsed = JSON.parse(data.toString());

      // ---- SETUP: Initialize session with patient + mode ----
      if (parsed.type === 'init') {
        const patientId = parsed.patientId || 'maggie';
        const mode = parsed.mode || 'patient-voice';
        currentPatient = PATIENT_PROFILES[patientId];
        currentMode = mode;

        if (!currentPatient) {
          safeSend(clientWs, {
            type: 'error',
            error: `Unknown patient: ${patientId}`,
          });
          return;
        }

        // Build system instruction based on mode
        let systemText = '';
        const firstName = currentPatient.name.split(' ')[0];

        if (mode === 'patient-voice') {
          systemText = `You are Aegis, a warm and infinitely patient companion.

PATIENT: ${currentPatient.name}, age ${currentPatient.age}
DEMENTIA STAGE: ${currentPatient.stage}
SPOUSE: ${currentPatient.spouse} (${currentPatient.spouseStatus})
CHILDREN: ${currentPatient.children.join(', ')}
CAREER: ${currentPatient.career}

KEY MEMORIES (use these to redirect and comfort):
${currentPatient.keyMemories.map((m, i) => `${i + 1}. ${m}`).join('\n')}

COMMON QUESTIONS THEY REPEAT:
${currentPatient.repeatedQuestions.map((q) => `- "${q}"`).join('\n')}

FAVORITE MUSIC (suggest during agitation):
${currentPatient.favoriteMusic.join(', ')}

RULES:
- NEVER show frustration, even if asked the same thing 1000 times
- Answer every repetition as if it's the first time
- Use ${firstName}'s first name often
- Keep sentences short and simple
- When they ask about deceased spouse: acknowledge briefly, then redirect to a fond memory
- When confused about location: reassure them they're safe at home
- Speak with warmth, like a caring family member`;
        } else if (mode === 'crisis-deescalation') {
          systemText = `You are Aegis in CRISIS MODE for ${currentPatient.name}.

PATIENT PROFILE:
Name: ${firstName} (use first name)
Calming music: ${currentPatient.favoriteMusic.join(', ')}
Comforting memories: ${currentPatient.keyMemories.join('; ')}

FOLLOW THIS EXACT HIERARCHY:
1. VALIDATE: "I can see you're upset, ${firstName}. That's okay."
2. COMFORT: "I'm right here with you. You're safe."
3. REDIRECT: Use one of their comforting memories
4. SENSORY: Suggest their favorite music
5. ESCALATE: "I'm going to get [caregiver] to come sit with you."

VOICE STYLE: Slow. Low pitch. Steady rhythm. Like a calm anchor.
NEVER: argue, correct, raise voice, use logic/reasoning, say "calm down"`;
        }

        // Close existing session if any
        if (geminiSession) {
          try { geminiSession.close(); } catch { /* already closed */ }
        }

        // Start new Gemini Live session
        console.log(`[Aegis Live] Connecting to Gemini Live for ${currentPatient.name}...`);
        
        geminiSession = await ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-latest',
          config: {
            responseModalities: ['AUDIO'],
            systemInstruction: {
              parts: [{ text: systemText }],
            },
          },
          callbacks: {
            onopen: () => {
              console.log(`[Aegis Live] Gemini Session OPEN: ${mode} for ${currentPatient.name}`);
              safeSend(clientWs, {
                type: 'connected',
                patient: patientId,
                mode,
              });
            },
            onmessage: (msg) => {
              // msg might have text, data (audio), or serverContent
              if (msg.text) {
                console.log(`[Aegis Live] Received text: "${msg.text.substring(0, 30)}..."`);
                safeSend(clientWs, {
                  type: 'text',
                  role: 'assistant',
                  content: msg.text,
                });
              }
              if (msg.data) {
                // Audio data
                safeSend(clientWs, {
                  type: 'audio',
                  data: msg.data,
                  mimeType: 'audio/pcm;rate=24000',
                });
              }
              if (msg.serverContent?.modelTurn?.parts) {
                 const text = msg.serverContent.modelTurn.parts.map(p => p.text).join('');
                 if (text) {
                    console.log(`[Aegis Live] Received part content: "${text.substring(0, 30)}..."`);
                    safeSend(clientWs, {
                        type: 'text',
                        role: 'assistant',
                        content: text,
                    });
                 }
              }
              if (msg.serverContent?.turnComplete) {
                console.log('[Aegis Live] Turn complete');
                safeSend(clientWs, { type: 'turn_complete' });
              }
              
              // Fallback log for unknown message types if debugging
              // console.log('[Aegis Live] Raw message keys:', Object.keys(msg));
            },
            onerror: (err) => {
              console.error('[Aegis Live] Gemini Session Error:', err);
              safeSend(clientWs, {
                type: 'error',
                error: String(err),
              });
            },
            onclose: (event) => {
              console.log('[Aegis Live] Gemini Session CLOSED:', event?.reason || 'No reason');
              safeSend(clientWs, { type: 'closed', reason: event?.reason });
              // If we still have an active ws connection, we might want to tell them
            },
          },
        });

        activeSessions.set(clientWs, {
          session: geminiSession,
          patient: patientId,
          mode,
          startTime: Date.now(),
        });

        return;
      }

      // ---- TEXT INPUT ----
      if (parsed.type === 'text' && geminiSession) {
        console.log(`[Aegis Live] Sending text to AI: "${parsed.content}"`);
        geminiSession.sendClientContent({
          turns: [
            { role: 'user', parts: [{ text: parsed.content }] },
          ],
          turnComplete: true,
        });
      }

      // ---- AUDIO INPUT ----
      if (parsed.type === 'audio' && geminiSession) {
        // No log for audio chunks to avoid flooding
        geminiSession.sendRealtimeInput({
          media: {
            mimeType: parsed.mimeType || 'audio/pcm;rate=16000',
            data: parsed.data,
          },
        });
      }

      // ---- MODE SWITCH (reconnect with new mode) ----
      if (parsed.type === 'switch-mode') {
        process.stdout.write(`[Aegis Live] Switching to mode: ${parsed.mode}\n`);
        if (geminiSession) {
          try { geminiSession.close(); } catch { /* already closed */ }
          geminiSession = null;
        }
        // Re-trigger init with new mode
        const initMsg = JSON.stringify({
          type: 'init',
          patientId: parsed.patientId || activeSessions.get(clientWs)?.patient,
          mode: parsed.mode,
        });
        clientWs.emit('message', Buffer.from(initMsg));
      }

      // ---- PING ----
      if (parsed.type === 'ping') {
        safeSend(clientWs, { type: 'pong' });
      }

    } catch (err) {
      console.error('[Aegis Live] Message processing error:', err);
    }
  });

  clientWs.on('close', () => {
    console.log('[Aegis Live] Client WebSocket disconnected');
    const sessionInfo = activeSessions.get(clientWs);
    if (sessionInfo?.session) {
      try { 
        console.log('[Aegis Live] Cleaning up Gemini session...');
        sessionInfo.session.close(); 
      } catch { /* already closed */ }
    }
    activeSessions.delete(clientWs);
  });

  clientWs.on('error', (err) => {
    console.error('[Aegis Live] Client WebSocket error:', err);
  });
});

function safeSend(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

process.on('SIGINT', () => {
  console.log('\n[Aegis Live] Shutting down...');
  wss.close(() => process.exit(0));
});
