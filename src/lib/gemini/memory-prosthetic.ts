import { runTask, SYSTEM_PROMPTS, parseJsonResponse } from '@/lib/gemini';

// ============================================
// TYPES
// ============================================
export interface PatientContext {
  patientId: string;
  name: string;
  age: number;
  occupation: string;
  dementiaStage: string;
  recentInteractions: string[];
  lifeStories: string[];
  preferences: Record<string, string>;
}

interface MemoryResponse {
  text: string;
  isRepeatedQuestion: boolean;
  repetitionCount: number;
}

// ============================================
// CORE: Memory Prosthetic Response
// Uses 2.5 Flash — fast enough for text chat, has thinking for nuance
// ============================================
export async function createMemoryProstheticResponse(
  patientContext: PatientContext,
  userMessage: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<MemoryResponse> {
  const recentQuestions = patientContext.recentInteractions || [];

  const isRepeatedQuestion = recentQuestions.filter(
    (q) => similarity(q, userMessage) > 0.7
  ).length >= 2;

  const repetitionCount = recentQuestions.filter(
    (q) => similarity(q, userMessage) > 0.7
  ).length;

  const systemPrompt = `${SYSTEM_PROMPTS.memoryProsthetic}

CURRENT CONTEXT:
- Patient: ${patientContext.name}
- Age: ${patientContext.age}
- Former Occupation: ${patientContext.occupation}
- Dementia Stage: ${patientContext.dementiaStage}
- Recent Topics: ${recentQuestions.slice(-3).join(', ')}
- Important Memories: ${patientContext.lifeStories.slice(0, 3).join('; ')}
${isRepeatedQuestion ? `- NOTE: Patient has asked a very similar question ${repetitionCount} times recently. Respond with the SAME patience and warmth as the first time. Vary your wording slightly to feel natural.` : ''}`;

  const contents = [
    ...conversationHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: userMessage }],
    },
  ];

  try {
    const response = await runTask('chat-response', contents, {
      systemInstruction: systemPrompt,
    });

    return {
      text: response.text || "I'm here with you. How can I help you today?",
      isRepeatedQuestion,
      repetitionCount,
    };
  } catch (error) {
    console.error('[Aegis Memory Prosthetic] Error:', error);
    return {
      text: "I'm here for you. Let's take a moment together.",
      isRepeatedQuestion,
      repetitionCount,
    };
  }
}

// ============================================
// Emotion Analysis (2.5 Flash)
// ============================================
export async function analyzeEmotionalState(message: string): Promise<{
  emotion: string;
  intensity: number;
  suggestedIntervention?: string;
}> {
  try {
    const response = await runTask(
      'emotion-analysis',
      [{
        role: 'user',
        parts: [{
          text: `Analyze the emotional state of a dementia patient from their message: "${message}"

Return JSON:
{
  "emotion": "calm|content|confused|agitated|anxious|happy|sad",
  "intensity": 1-10,
  "suggestedIntervention": "optional brief suggestion if intervention needed"
}`,
        }],
      }],
      {
        systemInstruction: SYSTEM_PROMPTS.emotionAnalysis,
        responseMimeType: 'application/json',
      }
    );

    return parseJsonResponse(response.text || '{"emotion":"calm","intensity":5}');
  } catch (error) {
    console.error('[Aegis Emotion] Error:', error);
    return { emotion: 'calm', intensity: 5 };
  }
}

// ============================================
// Reminiscence Therapy Prompt (2.5 Flash)
// ============================================
export async function generateReminiscencePrompt(
  lifeStory: string,
  category: string
): Promise<string> {
  try {
    const response = await runTask(
      'chat-response',
      [{
        role: 'user',
        parts: [{
          text: `Memory about ${category}: "${lifeStory}"\n\nCreate a gentle, engaging prompt that helps a dementia patient recall and share this experience. Keep it short and warm.`,
        }],
      }],
      {
        systemInstruction: 'You are a reminiscence therapy assistant. Given a life story memory, create a gentle, engaging prompt that helps a dementia patient recall and share their experience. Keep it short and warm.',
      }
    );

    return response.text || 'Would you like to tell me about that time?';
  } catch (error) {
    console.error('[Aegis Reminiscence] Error:', error);
    return 'Would you like to share more about that?';
  }
}

// ============================================
// Wandering Risk Detection (2.5 Flash)
// ============================================
export async function detectWanderingRisk(
  recentBehaviors: string[],
  timeOfDay: string
): Promise<{
  riskLevel: 'low' | 'medium' | 'high';
  indicators: string[];
  recommendation: string;
}> {
  try {
    const response = await runTask(
      'wandering-detection',
      [{
        role: 'user',
        parts: [{
          text: `Time: ${timeOfDay}\nBehaviors: ${recentBehaviors.join(', ')}\n\nAssess wandering risk. Return JSON with riskLevel, indicators array, and recommendation.`,
        }],
      }],
      {
        systemInstruction: SYSTEM_PROMPTS.wanderingPrevention,
        responseMimeType: 'application/json',
      }
    );

    return parseJsonResponse(response.text || '{"riskLevel":"low","indicators":[],"recommendation":"Continue monitoring"}');
  } catch (error) {
    console.error('[Aegis Wandering] Error:', error);
    return { riskLevel: 'low', indicators: [], recommendation: 'Continue monitoring' };
  }
}

// ============================================
// Simple string similarity (Jaccard on words)
// ============================================
function similarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}
