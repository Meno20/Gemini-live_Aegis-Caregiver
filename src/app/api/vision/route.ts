import { NextRequest, NextResponse } from 'next/server';
import { runTask, parseJsonResponse, SYSTEM_PROMPTS } from '@/lib/gemini';
import { addBehavioralLog, addMealLog, createAlert } from '@/lib/db/index';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, imageBase64, patientId, context, patientContext, analysisType, cameraId, roomId } = body;

    const rawImage = image || imageBase64;
    if (!rawImage) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const base64Data = rawImage.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = rawImage.startsWith('data:') ? rawImage.split(';')[0].split(':')[1] : 'image/jpeg';
    const ctx = context || patientContext || {};

    let analysisPrompt = 'Analyze this camera frame from the patient\'s home.';
    if (ctx.patientName || ctx.name || analysisType) {
      analysisPrompt = `Analyze this camera frame.

CONTEXT:
- Patient: ${ctx.patientName || ctx.name || 'Unknown'}
- Time: ${new Date().toLocaleTimeString()}
- Last meal: ${ctx.lastMealTime || 'Unknown'}
- Last medication: ${ctx.lastMedTime || 'Unknown'}
- Recent agitation score: ${ctx.agitationScore ?? 'N/A'}/10
- Camera location: ${roomId || ctx.cameraLocation || 'living room'}
${cameraId ? `- Camera ID: ${cameraId}` : ''}

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

    let taskType: 'medication-check' | 'wandering-detection' | 'meal-tracking' | 'frame-analysis' | 'gait-analysis' | 'agitation-scoring' = 'frame-analysis';
    if (ctx.checkMedication || analysisType === 'medication') taskType = 'medication-check';
    else if (ctx.checkWandering || analysisType === 'safety') taskType = 'wandering-detection';
    else if (ctx.checkMeal || analysisType === 'meal') taskType = 'meal-tracking';
    else if (analysisType === 'gait') taskType = 'gait-analysis';
    else if (analysisType === 'agitation') taskType = 'agitation-scoring';

    const response = await runTask(
      taskType,
      [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: analysisPrompt }] }],
      { systemInstruction: SYSTEM_PROMPTS.visionAnalysis, responseMimeType: 'application/json' }
    );

    const analysis = parseJsonResponse(response.text!);
    const alerts: string[] = [];

    // Evaluate Escaltions and log to DB if patientId is provided
    if (patientId) {
      if (analysis.wandering_indicators?.risk_level === 'high') {
        alerts.push('WANDERING_RISK_HIGH');
        await createAlert(patientId, {
          patientId,
          severity: 'URGENT', category: 'WANDERING', title: 'High Wandering Risk Detected',
          message: `The camera in ${roomId || 'the room'} detected signs of high wandering risk.`,
          data: analysis.wandering_indicators
        });
      }
      if (analysis.emotional_indicators?.estimated_agitation >= 7) {
        alerts.push('AGITATION_HIGH');
        await createAlert(patientId, {
          patientId,
          severity: 'WARNING', category: 'AGITATION', title: 'High Agitation Detected',
          message: `Agitation level estimated at ${analysis.emotional_indicators.estimated_agitation}/10 in ${roomId || 'the room'}.`,
          data: analysis.emotional_indicators
        });
      }
      if (analysis.gait_observations?.fall_risk === 'high') {
        alerts.push('FALL_RISK_HIGH');
        await createAlert(patientId, {
          patientId,
          severity: 'URGENT', category: 'FALL_RISK', title: 'High Fall Risk Detected',
          message: `Unsteady or hazardous gait detected in ${roomId || 'the room'}.`,
          data: analysis.gait_observations
        });
      }
      if (analysis.urgency === 'critical') {
        alerts.push('CRITICAL_SITUATION');
        await createAlert(patientId, {
          patientId,
          severity: 'CRITICAL', category: 'VISION_CRITICAL', title: 'Critical Situation Detected',
          message: `Critical urgency flagged by vision analysis in ${roomId || 'the room'}. Needs immediate attention.`,
          data: { issues: analysis.safety_concerns, recommendations: analysis.recommended_actions }
        });
      }

      // Log behavior if any relevant event occurred
      if (analysis.activity || alerts.length > 0) {
         await addBehavioralLog(patientId, {
             patientId,
             timestamp: new Date(),
             agitationScore: analysis.emotional_indicators?.estimated_agitation,
             activity: analysis.activity,
             location: roomId || ctx.cameraLocation || 'Unknown',
             wanderingAttempt: analysis.wandering_indicators?.risk_level === 'high' || analysis.wandering_indicators?.near_exit,
             fallEvent: false, // Detection is fall risk, not necessarily a fall event, but we record the log
             agitationEvent: analysis.emotional_indicators?.estimated_agitation >= 7,
             sundowningEvent: analysis.wandering_indicators?.pacing && new Date().getHours() > 16,
             source: `camera_${cameraId || 'unknown'}`,
             notes: `AI Vision Analysis: ${analysis.posture}. ${alerts.length > 0 ? 'Alerts: ' + alerts.join(', ') : ''}`
         });
      }

      // Log meal if eating detected
      if (analysis.eating_drinking?.detected) {
         await addMealLog(patientId, {
             patientId,
             timestamp: new Date(),
             mealType: new Date().getHours() < 11 ? 'Breakfast' : new Date().getHours() < 16 ? 'Lunch' : 'Dinner',
             foodItems: analysis.eating_drinking.food_items || [],
             drinkItems: [],
             portionEaten: analysis.eating_drinking.consumption_estimate || 'none',
             source: `camera_${cameraId || 'unknown'}`
         });
      }
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
    return NextResponse.json({ error: error.message || 'Vision analysis failed' }, { status: 500 });
  }
}

