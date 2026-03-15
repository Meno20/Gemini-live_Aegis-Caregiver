import { NextRequest, NextResponse } from 'next/server';
import { getRecentBehavioralLogs, getRecentMealLogs, getActiveAlerts } from '@/lib/db';
import { detectWanderingRisk } from '@/lib/gemini/memory-prosthetic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const timeframe = searchParams.get('timeframe') || 'week';

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const daysAgo = timeframe === 'month' ? 30 : timeframe === 'week' ? 7 : 1;

    // Fetch data from Firestore
    const [behavioralLogs, mealLogs, activeAlerts] = await Promise.all([
      getRecentBehavioralLogs(patientId, daysAgo, 200),
      getRecentMealLogs(patientId, daysAgo),
      getActiveAlerts(patientId),
    ]);

    // Process insights
    const moodAnalysis = analyzeMoodTrends(behavioralLogs);
    const behavioralPatterns = analyzeBehavioralPatterns(behavioralLogs);
    const nutritionSummary = analyzeNutrition(mealLogs);
    const alertSummary = summarizeAlerts(activeAlerts);

    // Check wandering risk if it's afternoon (sundowning period)
    const currentHour = new Date().getHours();
    let wanderingRisk: {
      riskLevel: 'low' | 'medium' | 'high';
      indicators: string[];
      recommendation: string;
    } | null = null;

    if (currentHour >= 14 && currentHour <= 19) {
      const recentBehaviors = behavioralLogs
        .filter((e) => e.wanderingAttempt || e.agitationEvent)
        .slice(0, 5)
        .map((e) => (e.wanderingAttempt ? 'wandering' : 'agitation'));

      wanderingRisk = await detectWanderingRisk(
        recentBehaviors,
        `${currentHour}:00`
      );
    }

    return NextResponse.json({
      success: true,
      insights: {
        timeframe,
        moodAnalysis,
        behavioralPatterns,
        nutritionSummary,
        alertSummary,
        wanderingRisk,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

function analyzeMoodTrends(logs: { moodScore?: number; agitationScore?: number; confusionScore?: number }[]) {
  const moodScores = logs.map((l) => l.moodScore).filter(Boolean) as number[];
  const agitationScores = logs.map((l) => l.agitationScore).filter(Boolean) as number[];

  const avgMood = moodScores.length > 0
    ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
    : 5;

  const avgAgitation = agitationScores.length > 0
    ? agitationScores.reduce((a, b) => a + b, 0) / agitationScores.length
    : 3;

  const avgMoodScore = Math.round((avgMood / 10) * 100);

  return {
    averageMoodScore: avgMoodScore,
    averageAgitation: Math.round(avgAgitation * 10) / 10,
    dominantMood: avgMoodScore > 70 ? 'positive' : avgMoodScore < 50 ? 'distressed' : 'neutral',
    trend: avgMoodScore > 70 ? 'improving' : avgMoodScore < 50 ? 'declining' : 'stable',
  };
}

function analyzeBehavioralPatterns(events: {
  wanderingAttempt: boolean;
  fallEvent: boolean;
  agitationEvent: boolean;
  sundowningEvent: boolean;
  timestamp: Date;
}[]) {
  const hourlyDistribution: Record<number, number> = {};

  events.forEach((e) => {
    const hour = new Date(e.timestamp).getHours();
    hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
  });

  const peakHours = Object.entries(hourlyDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  const sundowningEvents = Object.entries(hourlyDistribution)
    .filter(([hour]) => {
      const h = parseInt(hour);
      return h >= 14 && h <= 19;
    })
    .reduce((sum, [, count]) => sum + count, 0);

  return {
    totalEvents: events.length,
    wanderingAttempts: events.filter((e) => e.wanderingAttempt).length,
    fallEvents: events.filter((e) => e.fallEvent).length,
    agitationEvents: events.filter((e) => e.agitationEvent).length,
    sundowningEvents: events.filter((e) => e.sundowningEvent).length,
    peakHours,
    hasSundowningPattern: sundowningEvents > events.length * 0.4,
  };
}

function analyzeNutrition(meals: { portionEaten: string; fluidMl?: number }[]) {
  const totalFluid = meals.reduce((sum, m) => sum + (m.fluidMl || 0), 0);
  const portions = meals.map((m) => m.portionEaten);
  const goodPortions = portions.filter((p) =>
    p === '100%' || p === '75%' || p === 'all' || p === 'most'
  ).length;

  return {
    mealsLogged: meals.length,
    totalFluidMl: totalFluid,
    avgFluidPerMeal: meals.length > 0 ? Math.round(totalFluid / meals.length) : 0,
    goodPortionPercentage:
      meals.length > 0 ? Math.round((goodPortions / meals.length) * 100) : 0,
  };
}

function summarizeAlerts(alerts: { severity: string; status: string; category: string }[]) {
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  alerts.forEach((a) => {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
  });

  return {
    total: alerts.length,
    active: alerts.filter((a) => a.status === 'ACTIVE').length,
    byCategory,
    bySeverity,
  };
}
