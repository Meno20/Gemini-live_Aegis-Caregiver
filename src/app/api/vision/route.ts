import { NextRequest, NextResponse } from 'next/server';
import { runTask, parseJsonResponse, SYSTEM_PROMPTS } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { image, imageBase64, patientId, context, patientContext, analysisType } = await req.json();

    // Support both field names for backward compatibility
    const rawImage = image || imageBase64;

    if (!rawImage) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const base64Data = rawImage.replace(/^data:image\/\w+;base64,/, '');

    // Detect MIME type from data URL header or default to jpeg
    const mimeType = rawImage.startsWith('data:')
      ? rawImage.split(';')[0].split(':')[1]
      : 'image/jpeg';

    // Merge context sources (support both old and new API shape)
    const ctx = context || patientContext || {};

    // Build context-aware prompt
    let analysisPrompt = 'Analyze this camera frame from the patient\'s home.';

    if (ctx.patientName || ctx.name || analysisType) {
      analysisPrompt = `Analyze this camera frame.

CONTEXT:
- Patient: ${ctx.patientName || ctx.name || 'Unknown'}
- Time: ${new Date().toLocaleTimeString()}
- Last meal: ${ctx.lastMealTime || 'Unknown'}
- Last medication: ${ctx.lastMedTime || 'Unknown'}
- Recent agitation score: ${ctx.agitationScore ?? 'N/A'}/10
- Camera location: ${ctx.cameraLocation || 'living room'}

RETURN JSON:
{
  "activity": "description of what patient is doing",
  "posture": "sitting|standing|lying|walking|pacing",
  "location_in_frame": "description of where in room",
  "safety_concerns": [],
  "eating_drinking": {
    "detected": boolean,
    "food_items": [],
    "consumption_estimate": "none|minimal|partial|full"
  },
  "emotional_indicators": {
    "facial_expression": "calm|confused|distressed|happy|neutral",
    "body_language": "relaxed|tense|agitated|restless",
    "estimated_agitation": 0-10
  },
  "wandering_indicators": {
    "near_exit": boolean,
    "wearing_outdoor_clothes": boolean,
    "carrying_belongings": boolean,
    "pacing": boolean,
    "risk_level": "low|medium|high"
  },
  "gait_observations": {
    "mobility": "normal|shuffling|unsteady|using_support",
    "fall_risk": "low|medium|high"
  },
  "medication_interaction": {
    "near_medication": boolean,
    "appears_to_be_taking_medication": boolean
  },
  "environmental_hazards": [],
  "urgency": "none|low|medium|high|critical",
  "recommended_actions": []
}`;
    }

    // Select the right task type based on context flags or analysisType
    let taskType: 'medication-check' | 'wandering-detection' | 'meal-tracking' | 'frame-analysis' = 'frame-analysis';
    if (ctx.checkMedication || analysisType === 'medication') {
      taskType = 'medication-check';
    } else if (ctx.checkWandering || analysisType === 'safety') {
      taskType = 'wandering-detection';
    } else if (ctx.checkMeal || analysisType === 'meal') {
      taskType = 'meal-tracking';
    }

    // Use 2.5 Flash with thinking for vision analysis
    const response = await runTask(
      taskType,
      [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          { text: analysisPrompt },
        ],
      }],
      {
        systemInstruction: SYSTEM_PROMPTS.visionAnalysis,
        responseMimeType: 'application/json',
      }
    );

    const analysis = parseJsonResponse(response.text!);

    // Auto-escalation logic
    const alerts: string[] = [];

    if (analysis.wandering_indicators?.risk_level === 'high') {
      alerts.push('WANDERING_RISK_HIGH');
    }
    if (analysis.emotional_indicators?.estimated_agitation >= 7) {
      alerts.push('AGITATION_HIGH');
    }
    if (analysis.gait_observations?.fall_risk === 'high') {
      alerts.push('FALL_RISK_HIGH');
    }
    if (analysis.urgency === 'critical') {
      alerts.push('CRITICAL_SITUATION');
    }

    return NextResponse.json({
      success: true,
      analysis,
      alerts,
      model_used: 'gemini-2.5-flash',
      analyzed_at: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Aegis Vision] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Vision analysis failed' },
      { status: 500 }
    );
  }
}
