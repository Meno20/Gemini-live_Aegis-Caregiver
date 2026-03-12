/**
 * Aegis Caregiver - Pattern Recognition System
 * Analyzes behavioral patterns over time to predict and prevent issues
 */

import AI_SDK, { type AIInstance } from '@/lib/ai-sdk';

// Types
export interface Observation {
  timestamp: Date;
  location: string;
  activity: string;
  bodyLanguage?: {
    facialExpression: string;
    posture: string;
    movement: string;
  };
  emotionalState?: string;
  wanderingRisk?: string;
  agitationLevel?: number;
}

export interface Pattern {
  type: 'sundowning' | 'wandering_timing' | 'weekly_pattern' | 'trigger_pattern' | 'decline_indicator' | 'medical_concern';
  confidence: number;
  description: string;
  recommendation: string;
  clinicalSignificance: 'low' | 'medium' | 'high';
  urgency: 'routine' | 'soon' | 'urgent';
  detectedAt: Date;
}

export interface TrendAnalysis {
  overallTrajectory: 'stable' | 'improving' | 'declining';
  concernAreas: string[];
  positiveChanges: string[];
}

export class PatternRecognizer {
  private patient: { id: string; name: string; preferredName: string; age: number };
  private ai: AIInstance | null = null;
  private observations: Observation[] = [];
  private detectedPatterns: Pattern[] = [];
  private lastAnalysis: Date | null = null;

  constructor(patient: { id: string; name: string; preferredName: string; age: number }, ai?: AIInstance) {
    this.patient = patient;
    this.ai = ai || null;
  }

  setAI(ai: AIInstance) {
    this.ai = ai;
  }

  // Add a new observation
  addObservation(observation: Observation): void {
    const entry: Observation = {
      ...observation,
      timestamp: observation.timestamp || new Date()
    };

    this.observations.push(entry);

    // Keep last 30 days of observations
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    this.observations = this.observations.filter(o => o.timestamp.getTime() >= thirtyDaysAgo);

    // Run quick pattern check every 10 observations
    if (this.observations.length > 50 && this.observations.length % 10 === 0) {
      this.runQuickPatternCheck();
    }
  }

  // Quick pattern check without AI
  private runQuickPatternCheck(): void {
    const patterns: Pattern[] = [];

    // Check for sundowning (agitation 5-8 PM)
    const sundowning = this.checkSundowning();
    if (sundowning) patterns.push(sundowning);

    // Check for wandering times
    const wanderingPattern = this.checkWanderingTimes();
    if (wanderingPattern) patterns.push(wanderingPattern);

    // Check for weekly patterns
    const weeklyPattern = this.checkWeeklyPatterns();
    if (weeklyPattern) patterns.push(weeklyPattern);

    // Merge with existing patterns
    patterns.forEach(pattern => {
      const existing = this.detectedPatterns.find(p => p.type === pattern.type);
      if (existing) {
        // Update existing pattern
        Object.assign(existing, pattern);
      } else {
        this.detectedPatterns.push(pattern);
      }
    });
  }

  // Check for sundowning pattern
  private checkSundowning(): Pattern | null {
    // Get observations between 5 PM and 8 PM
    const eveningObs = this.observations.filter(o => {
      const hour = o.timestamp.getHours();
      return hour >= 17 && hour <= 20;
    });

    if (eveningObs.length < 10) return null;

    // Count how many show agitation
    const agitated = eveningObs.filter(o => 
      o.bodyLanguage?.movement === 'pacing' || 
      o.emotionalState === 'agitated' ||
      o.emotionalState === 'anxious' ||
      (o.agitationLevel && o.agitationLevel > 5)
    ).length;

    const percentage = (agitated / eveningObs.length) * 100;

    if (percentage > 40) {
      return {
        type: 'sundowning',
        confidence: Math.min(percentage, 95),
        description: `${this.patient.preferredName} shows increased agitation between 5-8 PM on ${percentage.toFixed(0)}% of evenings`,
        recommendation: 'Implement calming routine starting at 4:30 PM: reduce stimulation, play favorite music, offer early dinner',
        clinicalSignificance: 'high',
        urgency: 'soon',
        detectedAt: new Date()
      };
    }

    return null;
  }

  // Check for wandering time patterns
  private checkWanderingTimes(): Pattern | null {
    const wanderingObs = this.observations.filter(o => 
      o.wanderingRisk === 'MEDIUM' || o.wanderingRisk === 'HIGH'
    );

    if (wanderingObs.length < 5) return null;

    // Group by hour
    const hourCounts: Record<number, number> = {};
    wanderingObs.forEach(o => {
      const hour = o.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Find peak hour
    const entries = Object.entries(hourCounts);
    if (entries.length === 0) return null;
    
    const peakHour = entries.sort((a, b) => b[1] - a[1])[0];

    if (peakHour && parseInt(peakHour[1] as unknown as string) >= 3) {
      return {
        type: 'wandering_timing',
        confidence: 70,
        description: `${this.patient.preferredName} most frequently attempts to wander around ${peakHour[0]}:00`,
        recommendation: `Proactive intervention at ${parseInt(peakHour[0]) - 1}:00 - engage in purposeful activity before wandering urge begins`,
        clinicalSignificance: 'medium',
        urgency: 'routine',
        detectedAt: new Date()
      };
    }

    return null;
  }

  // Check for weekly patterns
  private checkWeeklyPatterns(): Pattern | null {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const dayAgitation: Record<number, { total: number; agitated: number }> = {};
    
    this.observations.forEach(o => {
      const day = o.timestamp.getDay();
      if (!dayAgitation[day]) {
        dayAgitation[day] = { total: 0, agitated: 0 };
      }
      dayAgitation[day].total++;
      if (o.emotionalState === 'agitated' || o.emotionalState === 'anxious' || (o.agitationLevel && o.agitationLevel > 5)) {
        dayAgitation[day].agitated++;
      }
    });

    // Find day with highest agitation rate
    let maxDay: number | null = null;
    let maxRate = 0;

    Object.entries(dayAgitation).forEach(([day, data]) => {
      if (data.total >= 5) {
        const rate = data.agitated / data.total;
        if (rate > maxRate && rate > 0.4) {
          maxRate = rate;
          maxDay = parseInt(day);
        }
      }
    });

    if (maxDay !== null) {
      return {
        type: 'weekly_pattern',
        confidence: 65,
        description: `${this.patient.preferredName} shows increased agitation on ${dayNames[maxDay]}s (${(maxRate * 100).toFixed(0)}% of observations)`,
        recommendation: `Investigate what's different on ${dayNames[maxDay]}s. Possible causes: caregiver schedule changes, visitors, routine disruption`,
        clinicalSignificance: 'medium',
        urgency: 'routine',
        detectedAt: new Date()
      };
    }

    return null;
  }

  // Deep AI-powered pattern analysis
  async analyzePatterns(): Promise<{
    patterns: Pattern[];
    trends: TrendAnalysis;
  }> {
    if (this.observations.length < 30) {
      return {
        patterns: [],
        trends: {
          overallTrajectory: 'stable',
          concernAreas: [],
          positiveChanges: []
        }
      };
    }

    // Quick analysis first
    this.runQuickPatternCheck();

    // Calculate trends
    const trends = this.calculateTrends();

    this.lastAnalysis = new Date();

    return {
      patterns: this.detectedPatterns,
      trends
    };
  }

  private calculateTrends(): TrendAnalysis {
    const midpoint = Date.now() - 15 * 24 * 60 * 60 * 1000; // 15 days ago
    
    const recent = this.observations.filter(o => o.timestamp.getTime() >= midpoint);
    const older = this.observations.filter(o => o.timestamp.getTime() < midpoint);

    const recentAgitation = recent.filter(o => (o.agitationLevel || 0) > 5).length / recent.length;
    const olderAgitation = older.filter(o => (o.agitationLevel || 0) > 5).length / (older.length || 1);

    const concernAreas: string[] = [];
    const positiveChanges: string[] = [];

    if (recentAgitation > olderAgitation + 0.1) {
      concernAreas.push('Increasing agitation frequency');
    } else if (recentAgitation < olderAgitation - 0.1) {
      positiveChanges.push('Reduced agitation episodes');
    }

    const recentWandering = recent.filter(o => o.wanderingRisk === 'HIGH').length;
    const olderWandering = older.filter(o => o.wanderingRisk === 'HIGH').length;

    if (recentWandering > olderWandering * 1.5) {
      concernAreas.push('Increased wandering attempts');
    }

    return {
      overallTrajectory: concernAreas.length > positiveChanges.length ? 'declining' : 
                         positiveChanges.length > concernAreas.length ? 'improving' : 'stable',
      concernAreas,
      positiveChanges
    };
  }

  // Get detected patterns
  getDetectedPatterns(): Pattern[] {
    return this.detectedPatterns;
  }

  // Get summary statistics
  getSummaryStats(): {
    totalObservations: number;
    dateRange: { start: Date | null; end: Date | null };
    patternsDetected: number;
    lastAnalysis: Date | null;
  } {
    return {
      totalObservations: this.observations.length,
      dateRange: {
        start: this.observations.length > 0 ? this.observations[0].timestamp : null,
        end: this.observations.length > 0 ? this.observations[this.observations.length - 1].timestamp : null
      },
      patternsDetected: this.detectedPatterns.length,
      lastAnalysis: this.lastAnalysis
    };
  }
}
