import { NextRequest, NextResponse } from 'next/server';
import { runTask, parseJsonResponse, SYSTEM_PROMPTS } from '@/lib/gemini';
import { getPatient, getLifeStory, addBehavioralLog } from '@/lib/db';

// Demo patient data for fallback when DB is unavailable
const demoPatients: Record<string, {
  name: string;
  age: number;
  occupation: string;
  dementiaStage: string;
  lifeStories: string[];
}> = {
  maggie: {
    name: "Maggie Thompson",
    age: 82,
    occupation: "Former Teacher",
    dementiaStage: "moderate",
    lifeStories: [
      "First Day Teaching: I remember walking into my first classroom at Lincoln Elementary in 1965.",
      "Wedding Day: Robert and I got married at St. Mary's Church on June 20, 1968.",
      "Teacher of the Year: Won the District Teacher of the Year award in May 1985.",
    ]
  },
  bill: {
    name: "Bill Henderson",
    age: 76,
    occupation: "Retired Engineer",
    dementiaStage: "mild",
    lifeStories: [
      "Navy Service: Served aboard the USS Enterprise during Vietnam from 1967-1971.",
      "Engineering Career: Worked on the Apollo program after getting engineering degree on GI Bill.",
      "Family: Has three grandchildren - Tommy, Emma, and Jack.",
    ]
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, message, history, mode } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Resolve patient context
    let patientName = "Patient";
    let patientAge = 75;
    let patientOccupation = "Retired";
    let patientStage = "moderate";
    let lifeStories: string[] = [];

    if (patientId) {
      try {
        const [patient, lifeStory] = await Promise.all([
          getPatient(patientId),
          getLifeStory(patientId),
        ]);

        if (patient) {
          patientName = `${patient.firstName} ${patient.lastName}`;
          patientAge = Math.floor(
            (Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000
          );
          patientOccupation = lifeStory?.career || "Retired";
          patientStage = patient.dementiaStage;
          lifeStories = lifeStory?.childhoodMemories?.slice(0, 3) || [];
        } else if (demoPatients[patientId]) {
          const demo = demoPatients[patientId];
          patientName = demo.name;
          patientAge = demo.age;
          patientOccupation = demo.occupation;
          patientStage = demo.dementiaStage;
          lifeStories = demo.lifeStories;
        }
      } catch {
        if (demoPatients[patientId]) {
          const demo = demoPatients[patientId];
          patientName = demo.name;
          patientAge = demo.age;
          patientOccupation = demo.occupation;
          patientStage = demo.dementiaStage;
          lifeStories = demo.lifeStories;
        }
      }
    }

    // 1. Run emotion analysis in parallel with chat response (2.5 Flash)
    const emotionPromise = runTask(
      'emotion-analysis',
      [{
        role: 'user',
        parts: [{
          text: `Analyze this message: "${message}"

Return JSON: {
  "primary_emotion": "string",
  "secondary_emotion": "string or null",
  "intensity": 0-10,
  "concern_level": "low|medium|high",
  "burnout_indicators": false,
  "recommended_response_tone": "string",
  "is_crisis": false
}`,
        }],
      }],
      {
        systemInstruction: SYSTEM_PROMPTS.emotionAnalysis,
        responseMimeType: 'application/json',
      }
    ).catch((err) => {
      console.error('[Aegis] Emotion analysis failed:', err);
      return null;
    });

    // 2. Build conversation contents
    const contextPrefix = patientId
      ? `Patient Context:\n- Name: ${patientName}\n- Age: ${patientAge}\n- Former Occupation: ${patientOccupation}\n- Dementia Stage: ${patientStage}\n- Important Memories: ${lifeStories.slice(0, 2).join('; ')}\n\n`
      : '';

    const contents = [
      ...(history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: contextPrefix + message }],
      },
    ];

    // 3. Select system prompt based on mode
    let systemPrompt = SYSTEM_PROMPTS.chatResponse;
    if (mode === 'caregiver-support') {
      systemPrompt = SYSTEM_PROMPTS.caregiverCoaching;
    } else if (mode === 'memory-prosthetic') {
      systemPrompt = SYSTEM_PROMPTS.memoryProsthetic;
    }

    // 4. Generate chat response (2.5 Flash) + await emotion in parallel
    const [chatResponse, emotionResponse] = await Promise.all([
      runTask('chat-response', contents, {
        systemInstruction: systemPrompt,
      }),
      emotionPromise,
    ]);

    // 5. Parse emotion analysis
    let emotion: any = null;
    if (emotionResponse?.text) {
      try {
        emotion = parseJsonResponse(emotionResponse.text);
      } catch {
        emotion = null;
      }
    }

    const aiResponse = chatResponse.text?.trim() ||
      "I'm here with you, dear. How can I help you today?";

    // 6. Log behavioral observation if we have a real patient
    if (patientId && !demoPatients[patientId]) {
      try {
        await addBehavioralLog(patientId, {
          patientId,
          timestamp: new Date(),
          moodScore: emotion?.intensity ?? undefined,
          agitationScore: emotion?.concern_level === 'high' ? 7 : emotion?.concern_level === 'medium' ? 4 : 2,
          wanderingAttempt: false,
          fallEvent: false,
          agitationEvent: false,
          sundowningEvent: false,
          source: 'ai-interaction',
          notes: `Interaction: "${message.slice(0, 100)}"`,
        });
      } catch {
        // Skip DB storage if not available
      }
    }

    return NextResponse.json({
      success: true,
      response: {
        message: aiResponse,
        emotion: emotion?.primary_emotion || 'neutral',
        intensity: emotion?.intensity || 5,
      },
      reply: aiResponse,
      emotion,
      model_used: 'gemini-2.5-flash',
    });

  } catch (error) {
    console.error('[Aegis Interactions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process interaction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Return empty list - interactions are stored as behavioral_logs
    return NextResponse.json({
      success: true,
      interactions: [],
    });

  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}
