import { NextRequest, NextResponse } from 'next/server';
import { runTask, SYSTEM_PROMPTS } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { patientId, weekData, audience } = await req.json();

    if (!weekData || !audience) {
      return NextResponse.json(
        { error: 'weekData and audience (family|doctor) required' },
        { status: 400 }
      );
    }

    const taskType = audience === 'doctor' ? 'report-doctor' : 'report-family';
    const systemPrompt = audience === 'doctor'
      ? SYSTEM_PROMPTS.reportDoctor
      : SYSTEM_PROMPTS.reportFamily;

    let prompt = '';

    if (audience === 'family') {
      prompt = `Generate a FAMILY-FRIENDLY weekly report.

WEEK: ${weekData.startDate} to ${weekData.endDate}
PATIENT: ${weekData.patientName}

DATA SUMMARY:
${JSON.stringify(weekData, null, 2)}

FORMAT:
- Start with a warm greeting
- "This Week's Highlights" (positive moments first)
- "Daily Snapshot" (brief, non-clinical daily summary)
- "Things to Know" (concerns, framed constructively)
- "Suggestions for Your Visit" (activities they'd enjoy)
- "How You Can Help" (specific, actionable)
- End with encouragement

TONE: Warm, honest, hopeful. Like a caring nurse updating a family.`;
    } else {
      prompt = `Generate a CLINICAL WEEKLY SUMMARY.

WEEK: ${weekData.startDate} to ${weekData.endDate}
PATIENT: ${weekData.patientName}

DATA:
${JSON.stringify(weekData, null, 2)}

FORMAT:
- Patient Demographics & Diagnosis
- Medication Adherence (% compliance, missed doses, double-dose attempts)
- Cognitive Status (MMSE-equivalent observations, trend vs baseline)
- Behavioral Log Summary (agitation frequency, triggers, interventions used)
- ADL Assessment (eating, hygiene, mobility, toileting)
- Sleep Pattern Analysis
- Vital Signs/Health Observations
- Gait & Fall Risk Assessment
- Notable Incidents
- Recommendations for Next Assessment
- Suggested Medication/Care Plan Adjustments

TONE: Objective, precise, clinical. Use standard medical terminology.`;
    }

    const response = await runTask(taskType, [{
      role: 'user',
      parts: [{ text: prompt }],
    }], {
      systemInstruction: systemPrompt,
    });

    return NextResponse.json({
      success: true,
      report: response.text,
      audience,
      model_used: 'gemini-2.5-pro',
      generated_at: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Aegis Reports] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Report generation failed' },
      { status: 500 }
    );
  }
}
