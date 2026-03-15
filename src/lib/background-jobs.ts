import { runTask, SYSTEM_PROMPTS } from '@/lib/gemini';

/**
 * Run nightly at midnight via cron or Cloud Scheduler
 * Analyzes the day's data with 2.5 Pro
 */
export async function nightlyAnalysis(patientId: string) {
  console.log(`[Aegis Nightly] Starting analysis for ${patientId}`);

  // In production, fetch from Prisma:
  // const logs = await prisma.behavioralLog.findMany({
  //   where: { patientId, createdAt: { gte: startOfDay } },
  // });

  // 1. Pattern analysis
  const patterns = await runTask('pattern-analysis', [{
    role: 'user',
    parts: [{
      text: `Nightly analysis for patient ${patientId}. 
      Review today's behavioral data and compare with the last 14 days.
      [DATA WOULD BE INSERTED HERE FROM DATABASE]`,
    }],
  }], {
    systemInstruction: SYSTEM_PROMPTS.patternAnalysis,
  });

  // 2. UTI screening (run daily — early detection saves lives)
  const utiScreen = await runTask('uti-detection', [{
    role: 'user',
    parts: [{
      text: `Daily UTI screening for patient ${patientId}.
      Compare today's confusion scores and bathroom frequency 
      against 14-day baseline.
      [DATA WOULD BE INSERTED HERE FROM DATABASE]`,
    }],
  }], {
    systemInstruction: SYSTEM_PROMPTS.healthGuardian,
  });

  // 3. Caregiver burnout check
  const caregiverCheck = await runTask('caregiver-coaching', [{
    role: 'user',
    parts: [{
      text: `Review today's caregiver interaction data for patient ${patientId}.
      Assess caregiver stress indicators:
      - Days since last break
      - Correction frequency
      - Vocal stress events
      - Interaction quality trends
      [DATA WOULD BE INSERTED HERE FROM DATABASE]`,
    }],
  }], {
    systemInstruction: SYSTEM_PROMPTS.caregiverCoaching,
  });

  console.log(`[Aegis Nightly] Analysis complete for ${patientId}`);

  return {
    patterns: patterns.text,
    utiScreening: utiScreen.text,
    caregiverAssessment: caregiverCheck.text,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Run weekly on Sunday night via cron or Cloud Scheduler
 */
export async function weeklyReports(patientId: string) {
  console.log(`[Aegis Weekly] Generating reports for ${patientId}`);

  // Generate both reports in parallel
  const [familyReport, doctorReport] = await Promise.all([
    runTask('report-family', [{
      role: 'user',
      parts: [{
        text: `Generate weekly family report for patient ${patientId}.
        [WEEK DATA FROM DATABASE]`,
      }],
    }], {
      systemInstruction: SYSTEM_PROMPTS.reportFamily,
    }),
    runTask('report-doctor', [{
      role: 'user',
      parts: [{
        text: `Generate weekly clinical summary for patient ${patientId}.
        [WEEK DATA FROM DATABASE]`,
      }],
    }], {
      systemInstruction: SYSTEM_PROMPTS.reportDoctor,
    }),
  ]);

  return {
    familyReport: familyReport.text,
    doctorReport: doctorReport.text,
    generatedAt: new Date().toISOString(),
  };
}
