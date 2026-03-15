import { NextRequest, NextResponse } from 'next/server';
import { runTask, SYSTEM_PROMPTS } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { patientId, behavioralLogs, analysisType } = await req.json();

    if (!behavioralLogs || !Array.isArray(behavioralLogs)) {
      return NextResponse.json(
        { error: 'behavioralLogs array required' },
        { status: 400 }
      );
    }

    let taskType: 'pattern-analysis' | 'uti-detection' | 'care-plan' = 'pattern-analysis';
    let prompt = '';

    switch (analysisType) {
      case 'uti-screening':
        taskType = 'uti-detection';
        prompt = `URGENT MEDICAL SCREENING

Analyze ${behavioralLogs.length} data points for UTI indicators:
- Sudden confusion increase (baseline vs current)
- Increased bathroom frequency
- Agitation without clear behavioral trigger
- Sleep disruption pattern change
- Temperature/fever mentions

DATA:
${JSON.stringify(behavioralLogs, null, 2)}

Return JSON:
{
  "uti_probability": "low|moderate|high|critical",
  "confidence": 0-100,
  "supporting_evidence": [],
  "contradicting_evidence": [],
  "confusion_trend": { "baseline": 0, "current": 0, "change_percent": 0 },
  "bathroom_frequency_trend": { "baseline": 0, "current": 0 },
  "recommendation": "string",
  "urgency": "routine|soon|within_24hrs|immediate",
  "alert_caregiver": false,
  "alert_physician": false
}`;
        break;

      case 'care-plan':
        taskType = 'care-plan';
        prompt = `Generate a personalized care plan based on ${behavioralLogs.length} days of data.

DATA:
${JSON.stringify(behavioralLogs, null, 2)}

Include:
- Daily routine optimization (based on observed patterns)
- Activity scheduling (matched to patient's interests/history)
- Intervention strategies for identified triggers
- Medication management adjustments
- Caregiver respite recommendations
- Goals for the next 30 days`;
        break;

      default:
        taskType = 'pattern-analysis';
        prompt = `Analyze ${behavioralLogs.length} data points for behavioral patterns.

DATA:
${JSON.stringify(behavioralLogs, null, 2)}

Identify:
1. Time-of-day patterns (when is patient most/least agitated?)
2. Day-of-week correlations (recurring triggers?)
3. Trigger-behavior chains (what causes what?)
4. Deterioration vs baseline trends
5. Sleep pattern changes
6. Social interaction effects
7. Environmental factors
8. Caregiver behavior correlations

Return JSON:
{
  "patterns": [
    {
      "pattern": "description",
      "frequency": "daily|weekly|irregular",
      "trigger": "identified trigger or null",
      "severity": "low|medium|high",
      "intervention": "recommended action"
    }
  ],
  "trends": {
    "cognitive": "stable|declining|improving",
    "behavioral": "stable|declining|improving",
    "physical": "stable|declining|improving"
  },
  "medical_flags": [],
  "positive_observations": [],
  "recommended_interventions": [],
  "caregiver_notes": "string"
}`;
    }

    // Use 2.5 Pro with maximum thinking
    const response = await runTask(taskType, [{
      role: 'user',
      parts: [{ text: prompt }],
    }], {
      systemInstruction: SYSTEM_PROMPTS.patternAnalysis,
    });

    return NextResponse.json({
      success: true,
      analysis: response.text,
      model_used: 'gemini-2.5-pro',
      analyzed_at: new Date().toISOString(),
      data_points: behavioralLogs.length,
    });

  } catch (error: any) {
    console.error('[Aegis Analysis] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
