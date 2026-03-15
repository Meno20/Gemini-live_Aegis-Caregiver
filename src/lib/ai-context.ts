import {
  getPatient, getLifeStory, getPreferences,
  getMedications, getLatestHealthRecord, getCareTeam,
  getRecentBehavioralLogs, getRecentMealLogs,
  getMedicationAdherence, getActiveAlerts,
} from '@/lib/db';

/**
 * READ-ONLY patient context for Gemini AI
 * This function has ZERO write operations
 */
export async function getPatientContextForAI(patientId: string) {
  const [
    patient,
    lifeStory,
    preferences,
    medications,
    healthRecord,
    careTeam,
    recentBehavior,
    recentMeals,
    medAdherence,
    activeAlerts,
  ] = await Promise.all([
    getPatient(patientId),
    getLifeStory(patientId),
    getPreferences(patientId),
    getMedications(patientId),
    getLatestHealthRecord(patientId),
    getCareTeam(patientId),
    getRecentBehavioralLogs(patientId, 14, 50),
    getRecentMealLogs(patientId, 7),
    getMedicationAdherence(patientId, 7),
    getActiveAlerts(patientId),
  ]);

  if (!patient) return null;

  const lastMeal = recentMeals[0] || null;
  const lastBehavior = recentBehavior[0] || null;

  return {
    patient: {
      id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
      firstName: patient.firstName,
      age: Math.floor(
        (Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000
      ),
      dementiaStage: patient.dementiaStage,
    },
    lifeStory,
    preferences,
    medications: medications.map((m) => ({
      name: m.name,
      dosage: m.dosage,
      scheduledTimes: m.scheduledTimes,
      pillDescription: m.pillDescription,
      purpose: m.purpose,
      instructions: m.instructions,
    })),
    healthRecord,
    careTeam,
    currentStatus: {
      lastMeal: lastMeal ? {
        time: lastMeal.timestamp,
        items: lastMeal.foodItems,
        portionEaten: lastMeal.portionEaten,
      } : null,
      hoursSinceLastMeal: lastMeal
        ? (Date.now() - new Date(lastMeal.timestamp).getTime()) / 3600000
        : null,
      medicationAdherence7Day: medAdherence.percentage,
      lastAgitationScore: lastBehavior?.agitationScore,
      lastConfusionScore: lastBehavior?.confusionScore,
      lastMoodScore: lastBehavior?.moodScore,
      activeAlerts: activeAlerts.length,
    },
    recentBehavior: recentBehavior.slice(0, 20),
    recentMeals: recentMeals.slice(0, 14),
  };
}

/**
 * Compact string for system prompts
 */
export async function getPatientPromptContext(patientId: string): Promise<string> {
  const ctx = await getPatientContextForAI(patientId);
  if (!ctx) return 'No patient data available.';

  const ls = ctx.lifeStory;
  const prefs = ctx.preferences;

  return `
PATIENT: ${ctx.patient.name}, age ${ctx.patient.age}
DEMENTIA STAGE: ${ctx.patient.dementiaStage}
${ls?.spouseName ? `SPOUSE: ${ls.spouseName} (${ls.spouseStatus})` : ''}
${ls?.children ? `CHILDREN: ${JSON.stringify(ls.children)}` : ''}
${ls?.career ? `CAREER: ${ls.career}` : ''}
${ls?.favoriteMusic?.length ? `FAVORITE MUSIC: ${ls.favoriteMusic.join(', ')}` : ''}
${ls?.comfortingPhrases?.length ? `COMFORTING PHRASES: ${ls.comfortingPhrases.join('; ')}` : ''}
${ls?.triggerPhrases?.length ? `AVOID: ${ls.triggerPhrases.join('; ')}` : ''}
${ls?.repeatedQuestions ? `REPEATED QUESTIONS: ${JSON.stringify(ls.repeatedQuestions)}` : ''}
${prefs?.preferredName ? `CALL THEM: ${prefs.preferredName}` : ''}

MEDICATIONS:
${ctx.medications.map((m) => `- ${m.name} ${m.dosage} at ${m.scheduledTimes.join(', ')} (${m.pillDescription})`).join('\n')}

STATUS NOW:
- Hours since last meal: ${ctx.currentStatus.hoursSinceLastMeal?.toFixed(1) || 'unknown'}
- 7-day med adherence: ${ctx.currentStatus.medicationAdherence7Day}%
- Last agitation: ${ctx.currentStatus.lastAgitationScore ?? '?'}/10
- Active alerts: ${ctx.currentStatus.activeAlerts}

${prefs?.dietaryRestrictions?.length ? `DIET: ${prefs.dietaryRestrictions.join(', ')}` : ''}
${prefs?.allergies?.length ? `ALLERGIES: ${prefs.allergies.join(', ')}` : ''}
`.trim();
}
