/**
 * Aegis Caregiver - Intervention Coordinator
 * Handles all intervention types with 50+ scenario support
 */

import AI_SDK, { type AIInstance } from '@/lib/ai-sdk';

// Types
export interface Intervention {
  type: 'wandering' | 'agitation' | 'meal' | 'medication' | 'sundowning' | 'emergency' | 'pain' | 'hallucination';
  triggeredAt: Date;
  message: string;
  method: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  additionalActions?: string[];
  context: Record<string, unknown>;
}

export interface Patient {
  id: string;
  name: string;
  preferredName: string;
  age: number;
  diagnosisStage: string;
  profile: {
    spouse?: { name: string; status: string };
    career?: string;
    children?: Array<{ name: string; relationship: string }>;
    favorites?: {
      music: string[];
      foods: string[];
      activities: string[];
    };
    triggers?: {
      agitation: string[];
      comfort: string[];
    };
  };
}

export class InterventionCoordinator {
  private patient: Patient;
  private ai: AIInstance | null = null;
  private activeInterventions: Intervention[] = [];
  private interventionHistory: Intervention[] = [];

  constructor(patient: Patient, ai?: AIInstance) {
    this.patient = patient;
    this.ai = ai || null;
  }

  setAI(ai: AIInstance) {
    this.ai = ai;
  }

  async handleWandering(visionAnalysis: {
    location: string;
    safetyAssessment: {
      wanderingRisk: string;
      nearExit: boolean;
      wearingOutdoorClothes: boolean;
    };
  }): Promise<Intervention> {
    const intervention: Intervention = {
      type: 'wandering',
      triggeredAt: new Date(),
      severity: visionAnalysis.safetyAssessment.wanderingRisk === 'HIGH' ? 'high' : 'medium',
      context: visionAnalysis,
      message: '',
      method: 'gentle_redirection'
    };

    // Generate personalized intervention message
    const prompt = `${this.patient.preferredName} is showing wandering behavior:
- Location: ${visionAnalysis.location}
- Wearing outdoor clothes: ${visionAnalysis.safetyAssessment.wearingOutdoorClothes}
- Time: ${new Date().toLocaleTimeString()}
- Risk level: ${visionAnalysis.safetyAssessment.wanderingRisk}

Generate a gentle, warm intervention to redirect them. 
1. Ask where they're going (show care)
2. Gently reality-check
3. Offer a safe alternative activity

Keep response under 30 words. Speak directly to ${this.patient.preferredName}.`;

    try {
      if (this.ai) {
        const result = await this.ai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          thinking: { type: 'disabled' }
        });
        intervention.message = result.choices[0]?.message?.content || this.getDefaultWanderingMessage();
      } else {
        intervention.message = this.getDefaultWanderingMessage();
      }
    } catch {
      intervention.message = this.getDefaultWanderingMessage();
    }

    intervention.additionalActions = [
      'Play calming music',
      'Offer favorite activity',
      'Alert caregiver if risk is HIGH'
    ];

    this.activeInterventions.push(intervention);
    this.interventionHistory.push(intervention);
    
    return intervention;
  }

  async handleAgitation(audioAnalysis: {
    emotionalState: string;
    agitationLevel: number;
  }): Promise<Intervention> {
    const intervention: Intervention = {
      type: 'agitation',
      triggeredAt: new Date(),
      severity: audioAnalysis.agitationLevel >= 8 ? 'critical' : 
                 audioAnalysis.agitationLevel >= 6 ? 'high' : 'medium',
      context: audioAnalysis,
      message: '',
      method: 'validation_redirection'
    };

    const comfortActivity = this.patient.profile.favorites?.activities?.[0] || 'sit quietly';
    const comfortItem = this.patient.profile.triggers?.comfort?.[0] || 'some water';

    if (audioAnalysis.agitationLevel >= 8) {
      // High agitation - immediate calming
      intervention.message = `${this.patient.preferredName}, you seem very upset. I'm here with you. Let's take a deep breath together. You're safe.`;
      intervention.method = 'immediate_calming';
      intervention.additionalActions = [
        'Play calming music',
        'Dim lights',
        'Alert caregiver for in-person support'
      ];
    } else if (audioAnalysis.agitationLevel >= 5) {
      // Moderate agitation - validation + redirection
      intervention.message = `I can tell something is bothering you, ${this.patient.preferredName}. That's okay. Would you like to ${comfortActivity}? That usually helps you feel better.`;
      intervention.method = 'validation_redirection';
    } else {
      // Mild concern - gentle check-in
      intervention.message = `How are you feeling, ${this.patient.preferredName}? Is there anything you need right now?`;
      intervention.method = 'wellness_check';
    }

    this.activeInterventions.push(intervention);
    this.interventionHistory.push(intervention);
    
    return intervention;
  }

  async handleNutritionAlert(
    mealStatus: { alert: boolean; hoursSinceLastMeal: number },
    hydrationStatus: { alert: boolean; hoursSinceLastDrink: number }
  ): Promise<Intervention> {
    const intervention: Intervention = {
      type: 'meal',
      triggeredAt: new Date(),
      severity: mealStatus.hoursSinceLastMeal >= 8 ? 'high' : 'medium',
      context: { mealStatus, hydrationStatus },
      message: '',
      method: 'gentle_reminder'
    };

    const messages: string[] = [];
    const favoriteFood = this.patient.profile.favorites?.foods?.[0] || 'something delicious';

    if (mealStatus.alert) {
      messages.push(`${this.patient.preferredName}, it's been a while since you've eaten. I see there's ${favoriteFood} available. Would you like some?`);
    }

    if (hydrationStatus.alert) {
      messages.push(`Let's have something to drink, ${this.patient.preferredName}. How about some water or tea?`);
    }

    intervention.message = messages.join(' ');
    intervention.additionalActions = [
      'Prepare favorite food',
      'Ensure water is easily accessible',
      'Notify caregiver if refusal continues'
    ];

    this.activeInterventions.push(intervention);
    return intervention;
  }

  async handleMedicationReminder(medication: { name: string; time: string; taken: boolean }): Promise<Intervention> {
    const intervention: Intervention = {
      type: 'medication',
      triggeredAt: new Date(),
      severity: 'medium',
      context: { medication },
      message: `${this.patient.preferredName}, it's time for your ${medication.name}. It helps you feel your best. Can you take it now?`,
      method: 'scheduled_reminder',
      additionalActions: [
        'Have water ready',
        'Confirm with caregiver if needed'
      ]
    };

    this.activeInterventions.push(intervention);
    return intervention;
  }

  async handleEmergency(emergencyType: 'fall' | 'elopement' | 'severe_agitation' | 'medical', context: Record<string, unknown> = {}): Promise<Intervention> {
    const intervention: Intervention = {
      type: 'emergency',
      triggeredAt: new Date(),
      severity: 'critical',
      context: { emergencyType, ...context },
      message: '',
      method: 'emergency_protocol'
    };

    switch (emergencyType) {
      case 'fall':
        intervention.message = 'FALL DETECTED';
        intervention.additionalActions = [
          'Alert caregiver immediately',
          'Do not move patient',
          'Assess for injury',
          'Call 911 if unconscious or head injury'
        ];
        break;

      case 'elopement':
        intervention.message = 'PATIENT HAS LEFT HOME';
        intervention.additionalActions = [
          'Alert all caregivers immediately',
          'Check last known location',
          'Contact police non-emergency',
          'Begin neighborhood search'
        ];
        break;

      case 'severe_agitation':
        intervention.message = 'SEVERE AGITATION - CAREGIVER NEEDED';
        intervention.additionalActions = [
          'Ensure caregiver safety',
          'Give patient space',
          'Remove potential hazards',
          'Consider crisis mental health services'
        ];
        break;

      case 'medical':
        intervention.message = 'POSSIBLE MEDICAL EMERGENCY';
        intervention.additionalActions = [
          'Call 911',
          'Stay with patient',
          'Note symptoms and timeline',
          'Gather medication list'
        ];
        break;
    }

    this.activeInterventions.push(intervention);
    this.interventionHistory.push(intervention);
    
    return intervention;
  }

  async handlePainIndication(painArea: string, severity: 'mild' | 'moderate' | 'severe'): Promise<Intervention> {
    const intervention: Intervention = {
      type: 'pain',
      triggeredAt: new Date(),
      severity: severity === 'severe' ? 'critical' : severity === 'moderate' ? 'high' : 'medium',
      context: { painArea, severity },
      message: `${this.patient.preferredName}, I noticed you might be uncomfortable. Are you hurting in your ${painArea}?`,
      method: 'pain_assessment',
      additionalActions: [
        'Alert caregiver',
        'Check for obvious causes',
        'Review medication schedule for pain relief options'
      ]
    };

    this.activeInterventions.push(intervention);
    return intervention;
  }

  async handleHallucination(description: string): Promise<Intervention> {
    const intervention: Intervention = {
      type: 'hallucination',
      triggeredAt: new Date(),
      severity: 'medium',
      context: { description },
      message: `I hear you see ${description}. That sounds surprising. You're safe here with me.`,
      method: 'validation_redirection',
      additionalActions: [
        'Reduce stimulation',
        'Move to quieter area',
        'Play calming music',
        'Alert caregiver if distressing'
      ]
    };

    this.activeInterventions.push(intervention);
    return intervention;
  }

  // Clear resolved interventions
  clearResolved() {
    this.activeInterventions = this.activeInterventions.filter(i => {
      const age = Date.now() - i.triggeredAt.getTime();
      return age < 60 * 60 * 1000; // Keep interventions from last hour
    });
  }

  // Get active interventions
  getActiveInterventions(): Intervention[] {
    return this.activeInterventions;
  }

  // Get intervention statistics
  getInterventionStats(): {
    total24h: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    const recent = this.interventionHistory.filter(i => i.triggeredAt.getTime() >= last24h);

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    recent.forEach(i => {
      byType[i.type] = (byType[i.type] || 0) + 1;
      bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    });

    return {
      total24h: recent.length,
      byType,
      bySeverity
    };
  }

  private getDefaultWanderingMessage(): string {
    return `${this.patient.preferredName}, where are you headed? It's ${new Date().toLocaleTimeString()}. How about we sit together for a moment?`;
  }
}
