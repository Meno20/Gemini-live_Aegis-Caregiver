/**
 * Aegis Caregiver - Intervention Coordinator (Version 2)
 * Handles smart interventions using Gemini AI and persists alerts to Firebase.
 */

import { runTask, SYSTEM_PROMPTS, parseJsonResponse } from '@/lib/gemini';
import { createAlert } from '@/lib/db/index';

export interface Intervention {
  type: string;
  triggeredAt: Date;
  message: string;
  method: string;
  severity: 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';
  additionalActions?: string[];
  context: Record<string, unknown>;
}

export class InterventionCoordinator {
  private patient: { id: string; preferredName: string; age: number; stage: string };

  constructor(patient: { id: string; preferredName: string; age: number; stage: string }) {
    this.patient = patient;
  }

  /**
   * Handle wandering detection with AI redirection
   */
  async handleWandering(visionContext: any): Promise<Intervention> {
    const contents = [
      {
        role: 'user',
        parts: [{
          text: `Generate a gentle redirection for ${this.patient.preferredName} who is wandering.
            Context: ${JSON.stringify(visionContext)}
            Stage: ${this.patient.stage}
            Return JSON with: message (max 25 words), method, additionalActions (array).`
        }]
      }
    ];

    try {
      const response = await runTask('wandering-detection', contents, {
        systemInstruction: SYSTEM_PROMPTS.wanderingPrevention
      });

      const data = parseJsonResponse(response.text());
      const severity = visionContext.safetyAssessment?.wanderingRisk === 'HIGH' ? 'URGENT' : 'WARNING';

      const intervention: Intervention = {
        type: 'wandering',
        triggeredAt: new Date(),
        message: data.message,
        method: data.method || 'gentle_redirection',
        severity,
        additionalActions: data.additionalActions || [],
        context: visionContext
      };

      // Persist to DB
      await createAlert(this.patient.id, {
        severity,
        category: 'SAFETY',
        title: 'Wandering Detected',
        message: intervention.message,
        data: visionContext
      });

      return intervention;
    } catch (error) {
      console.error('[InterventionCoordinator] AI Error:', error);
      return this.getFallbackIntervention('wandering', visionContext);
    }
  }

  /**
   * Handle agitation with AI-driven de-escalation
   */
  async handleAgitation(audioContext: any): Promise<Intervention> {
    const contents = [
      {
        role: 'user',
        parts: [{
          text: `Patient ${this.patient.preferredName} is agitated (Level: ${audioContext.agitationLevel}/10).
            Provide a de-escalation response. Stage: ${this.patient.stage}.
            Return JSON: message, method, severity (WARNING|URGENT|CRITICAL).`
        }]
      }
    ];

    try {
      const response = await runTask('crisis-deescalation', contents, {
        systemInstruction: SYSTEM_PROMPTS.crisisDeescalation
      });

      const data = parseJsonResponse(response.text());
      const severity = data.severity || 'WARNING';

      const intervention: Intervention = {
        type: 'agitation',
        triggeredAt: new Date(),
        message: data.message,
        method: data.method || 'validation',
        severity,
        context: audioContext
      };

      // Persist alert
      await createAlert(this.patient.id, {
        severity,
        category: 'BEHAVIOR',
        title: 'Agitation Alert',
        message: intervention.message,
        data: audioContext
      });

      return intervention;
    } catch (error) {
      console.error('[InterventionCoordinator] AI Error:', error);
      return this.getFallbackIntervention('agitation', audioContext);
    }
  }

  private getFallbackIntervention(type: string, context: any): Intervention {
    return {
      type,
      triggeredAt: new Date(),
      message: `${this.patient.preferredName}, I'm here. Let's take a moment to relax.`,
      method: 'safety_fallback',
      severity: 'WARNING',
      context
    };
  }
}
