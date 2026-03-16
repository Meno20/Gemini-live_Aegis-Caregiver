import { GoogleGenAI, Modality } from '@google/genai';

// ============================================
// CLIENT
// ============================================
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠ GEMINI_API_KEY not set. AI features will not work.');
}

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'placeholder' });

// ============================================
// MODELS — Three tiers
// ============================================
export const MODELS = {
  // Tier 1: Real-time patient-facing (< 500ms)
  live: 'gemini-2.5-flash-native-audio-latest',

  // Tier 2: Near-real-time analysis (1-3s)
  analyst: 'gemini-2.5-flash',

  // Tier 3: Deep reasoning, async (5-30s)
  brain: 'gemini-2.5-pro',

  // Fallback
  fallback: 'gemini-2.5-flash-lite',
} as const;

// ============================================
// TASK TYPES — Every AI operation in Aegis
// ============================================
export type TaskType =
  // Real-time (Live API — handled by server/live-ws.js)
  | 'patient-voice'
  | 'crisis-deescalation'
  // Near-real-time (2.5 Flash)
  | 'speech-to-text'
  | 'text-to-speech'
  | 'frame-analysis'
  | 'meal-tracking'
  | 'medication-check'
  | 'agitation-scoring'
  | 'chat-response'
  | 'emotion-analysis'
  | 'wandering-detection'
  | 'gait-analysis'
  // Deep reasoning (2.5 Pro)
  | 'pattern-analysis'
  | 'uti-detection'
  | 'report-family'
  | 'report-doctor'
  | 'care-plan'
  | 'caregiver-coaching';

// ============================================
// MODEL CONFIG PER TASK
// ============================================
interface TaskConfig {
  model: string;
  temperature: number;
  thinkingBudget: number;
  maxOutputTokens: number;
  fallbackModels: string[];
}

const TASK_CONFIGS: Record<TaskType, TaskConfig> = {
  // ---- TIER 1: Real-time (Live API handles these separately) ----
  'patient-voice': {
    model: MODELS.live,
    temperature: 0.7,
    thinkingBudget: 0,
    maxOutputTokens: 256,
    fallbackModels: [],
  },
  'crisis-deescalation': {
    model: MODELS.live,
    temperature: 0.3,
    thinkingBudget: 0,
    maxOutputTokens: 128,
    fallbackModels: [],
  },

  // ---- TIER 2: Near-real-time (2.5 Flash) ----
  'speech-to-text': {
    model: MODELS.analyst,
    temperature: 0.0,
    thinkingBudget: 0, // no thinking needed for transcription
    maxOutputTokens: 1024,
    fallbackModels: [MODELS.fallback],
  },
  'text-to-speech': {
    model: MODELS.fallback, // 2.0 Flash — TTS doesn't need thinking
    temperature: 0.0,
    thinkingBudget: 0,
    maxOutputTokens: 512,
    fallbackModels: [],
  },
  'frame-analysis': {
    model: MODELS.analyst,
    temperature: 0.1,
    thinkingBudget: 1024,
    maxOutputTokens: 512,
    fallbackModels: [MODELS.fallback],
  },
  'meal-tracking': {
    model: MODELS.analyst,
    temperature: 0.1,
    thinkingBudget: 512,
    maxOutputTokens: 256,
    fallbackModels: [MODELS.fallback],
  },
  'medication-check': {
    model: MODELS.analyst,
    temperature: 0.0, // ZERO creativity — safety critical
    thinkingBudget: 1024,
    maxOutputTokens: 256,
    fallbackModels: [MODELS.fallback],
  },
  'agitation-scoring': {
    model: MODELS.analyst,
    temperature: 0.1,
    thinkingBudget: 1024,
    maxOutputTokens: 512,
    fallbackModels: [MODELS.fallback],
  },
  'chat-response': {
    model: MODELS.analyst,
    temperature: 0.7,
    thinkingBudget: 512,
    maxOutputTokens: 2048,
    fallbackModels: [MODELS.fallback],
  },
  'emotion-analysis': {
    model: MODELS.analyst,
    temperature: 0.1,
    thinkingBudget: 1024,
    maxOutputTokens: 512,
    fallbackModels: [MODELS.fallback],
  },
  'wandering-detection': {
    model: MODELS.analyst,
    temperature: 0.0,
    thinkingBudget: 1024,
    maxOutputTokens: 256,
    fallbackModels: [MODELS.fallback],
  },
  'gait-analysis': {
    model: MODELS.analyst,
    temperature: 0.1,
    thinkingBudget: 1024,
    maxOutputTokens: 512,
    fallbackModels: [MODELS.fallback],
  },

  // ---- TIER 3: Deep reasoning (2.5 Pro) ----
  'pattern-analysis': {
    model: MODELS.brain,
    temperature: 0.2,
    thinkingBudget: 8192,
    maxOutputTokens: 4096,
    fallbackModels: [MODELS.analyst],
  },
  'uti-detection': {
    model: MODELS.brain,
    temperature: 0.1,
    thinkingBudget: 8192,
    maxOutputTokens: 2048,
    fallbackModels: [MODELS.analyst],
  },
  'report-family': {
    model: MODELS.brain,
    temperature: 0.4,
    thinkingBudget: 4096,
    maxOutputTokens: 8192,
    fallbackModels: [MODELS.analyst],
  },
  'report-doctor': {
    model: MODELS.brain,
    temperature: 0.2,
    thinkingBudget: 4096,
    maxOutputTokens: 8192,
    fallbackModels: [MODELS.analyst],
  },
  'care-plan': {
    model: MODELS.brain,
    temperature: 0.3,
    thinkingBudget: 8192,
    maxOutputTokens: 4096,
    fallbackModels: [MODELS.analyst],
  },
  'caregiver-coaching': {
    model: MODELS.brain,
    temperature: 0.5,
    thinkingBudget: 4096,
    maxOutputTokens: 2048,
    fallbackModels: [MODELS.analyst],
  },
};

// ============================================
// CORE EXECUTION FUNCTION
// ============================================
export async function runTask(
  task: TaskType,
  contents: any[],
  options?: {
    systemInstruction?: string;
    responseMimeType?: string;
  }
) {
  const config = TASK_CONFIGS[task];
  const modelsToTry = [config.model, ...config.fallbackModels];

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          temperature: config.temperature,
          maxOutputTokens: config.maxOutputTokens,
          ...(options?.systemInstruction && {
            systemInstruction: options.systemInstruction,
          }),
          ...(options?.responseMimeType && {
            responseMimeType: options.responseMimeType,
          }),
          ...(config.thinkingBudget > 0 && {
            thinkingConfig: { thinkingBudget: config.thinkingBudget },
          }),
        },
      });

      if (i > 0) {
        console.warn(
          `[Aegis] Task "${task}" fell back from ${config.model} to ${model}`
        );
      }

      return response;
    } catch (error: any) {
      console.error(
        `[Aegis] ${model} failed for "${task}": ${error.message}`
      );
      if (i === modelsToTry.length - 1) throw error;
    }
  }

  throw new Error(`[Aegis] All models failed for task "${task}"`);
}

// ============================================
// HELPER: Parse JSON from potentially markdown-wrapped response
// ============================================
export function parseJsonResponse(text: string): any {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Extract from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      return JSON.parse(match[1].trim());
    }
    throw new Error(
      `Failed to parse JSON from response: ${text.slice(0, 200)}`
    );
  }
}

// ============================================
// SYSTEM PROMPTS
// ============================================
export const SYSTEM_PROMPTS = {
  memoryProsthetic: `You are Aegis, a warm and infinitely patient companion for a person 
with dementia. You NEVER show frustration. You answer the same question every single time 
as if it's the first. When they ask about deceased loved ones, acknowledge briefly, then 
redirect to a fond memory. Never say "you already asked that." Use simple, short sentences. 
Use their name often.`,

  crisisDeescalation: `You are Aegis in crisis mode. Follow this hierarchy:
1. VALIDATE: "I can see you're upset. That's okay."
2. COMFORT: "I'm here with you. You're safe."
3. REDIRECT: Suggest a calming activity from their history.
4. SENSORY: Recommend their favorite music.
5. ALERT: If agitation continues 5+ minutes, flag for caregiver alert.
Voice: Slow, low pitch, steady rhythm.`,

  wanderingPrevention: `You are Aegis monitoring for wandering. Never command or block.
1. Acknowledge intent ("You look ready to head out")
2. Provide reason to stay ("It's nighttime, everything is closed")
3. Offer alternative ("Let's go to the backyard instead")
Never argue with their reality.`,

  healthGuardian: `You are Aegis analyzing health data. Be precise and clinical.
Flag: missed meals (>6hrs), dehydration signs, medication non-adherence,
double-dosing attempts, gait changes, fall risk, UTI indicators.
Always recommend — never diagnose. Output structured JSON.`,

  visionAnalysis: `You are Aegis's vision system analyzing a camera frame from a 
dementia patient's home. Analyze for:
- Patient activity and posture
- Safety concerns (fall risk, wandering indicators)
- Eating/drinking status
- Emotional state (facial expression, body language)
- Environmental hazards
Output structured JSON.`,

  emotionAnalysis: `Analyze the emotional content of this message from a dementia patient 
or their caregiver. Return JSON with: primary_emotion, intensity (0-10), 
concern_level (low/medium/high), recommended_response_tone.`,

  chatResponse: `You are Aegis, a compassionate AI caregiver assistant. You help 
caregivers with patient care, answer questions about dementia, provide emotional 
support, and offer practical advice. Be warm, clear, and evidence-based.`,

  patternAnalysis: `You are Aegis's analytical engine. Analyze multi-day behavioral 
data for patterns, correlations, medical red flags, and intervention opportunities.
Be thorough — this analysis prevents hospitalizations and preserves quality of life.`,

  reportFamily: `You are Aegis generating a family report. Be warm, non-clinical. 
Highlight positive moments. Note concerns gently. Suggest visit activities.
Make family feel informed and hopeful.`,

  reportDoctor: `You are Aegis generating a clinical summary. Use medical terminology.
Include: medication adherence rates, behavioral baselines with deviations,
cognitive assessment indicators, recommended evaluations. Be objective and precise.`,

  caregiverCoaching: `You are Aegis supporting the caregiver. Detect burnout signs.
Never guilt them. Offer specific, actionable techniques.
"You're doing an incredible job. Here's one thing that might help..."`,
};

export { Modality };
