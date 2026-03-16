/**
 * Aegis Caregiver - Vision Analyzer (Version 2)
 * Analyzes video frames for patient safety and behavior using Gemini Multi-model AI.
 */

import { runTask, SYSTEM_PROMPTS, parseJsonResponse } from '@/lib/gemini';

// Types
export interface VisionAnalysis {
  patientVisible: boolean;
  location: string;
  activity: string;
  bodyLanguage: {
    facialExpression: string;
    posture: string;
    movement: string;
  };
  safetyAssessment: {
    wanderingRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    nearExit: boolean;
    wearingOutdoorClothes: boolean;
    gaitAbnormality: boolean;
    fallRisk: 'low' | 'medium' | 'high';
  };
  healthObservations: {
    eatingDrinking: boolean;
    signsOfPain: boolean;
    appropriatelyDressed: boolean;
  };
  recommendedAction: 'none' | 'monitor' | 'gentle_intervention' | 'immediate_caregiver_alert';
  reasoning: string;
  timestamp: Date;
}

export class VisionAnalyzer {
  private patient: { name: string; preferredName: string; age: number; diagnosisStage: string };
  private lastAnalysis: VisionAnalysis | null = null;
  private analysisHistory: VisionAnalysis[] = [];

  constructor(patient: { name: string; preferredName: string; age: number; diagnosisStage: string }) {
    this.patient = patient;
  }

  async analyzeFrame(imageBase64: string): Promise<VisionAnalysis> {
    const currentTime = new Date();
    const timeOfDay = currentTime.getHours();
    const timeContext = this.getTimeContext(timeOfDay);

    // Prepare content for Gemini (Text + Image)
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Analyze this image for patient safety. 
              Patient: ${this.patient.preferredName} (${this.patient.age}, ${this.patient.diagnosisStage} Alzheimer's)
              Time context: ${timeContext}.
              Return structured JSON as per requirements.`
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64.split(',')[1] || imageBase64 // Handle potential data:image/jpeg;base64, prefix
            }
          }
        ]
      }
    ];

    try {
      const response = await runTask('frame-analysis', contents, {
        systemInstruction: SYSTEM_PROMPTS.visionAnalysis + "\n\nREQUIREMENTS:\nMust return ONLY valid JSON in this format: \n" + 
          JSON.stringify(this.getDefaultAnalysis(), null, 2)
      });

      const responseText = response.text();
      const analysis = parseJsonResponse(responseText);

      this.lastAnalysis = {
        ...analysis,
        timestamp: currentTime
      };
      
      this.analysisHistory.push(this.lastAnalysis);
      
      // Keep last 100 analyses
      if (this.analysisHistory.length > 100) {
        this.analysisHistory.shift();
      }
      
      return this.lastAnalysis;
    } catch (error) {
      console.error('[VisionAnalyzer] AI Task Error:', error);
      return {
        ...this.getDefaultAnalysis(),
        reasoning: 'Vision analysis failed due to system error. Defaulting to safe state.',
        timestamp: currentTime
      };
    }
  }

  private getTimeContext(hour: number): string {
    if (hour >= 5 && hour < 8) return 'Early morning (unusual time to be active)';
    if (hour >= 8 && hour < 12) return 'Morning (normal waking hours)';
    if (hour >= 12 && hour < 17) return 'Afternoon (normal activity time)';
    if (hour >= 17 && hour < 21) return 'SUNDOWNING PERIOD (increased confusion/agitation common)';
    return 'Nighttime (unusual to be awake - high wandering risk)';
  }

  private getDefaultAnalysis(): VisionAnalysis {
    return {
      patientVisible: false,
      location: 'unknown',
      activity: 'unknown',
      bodyLanguage: {
        facialExpression: 'neutral',
        posture: 'unknown',
        movement: 'unknown'
      },
      safetyAssessment: {
        wanderingRisk: 'NONE',
        nearExit: false,
        wearingOutdoorClothes: false,
        gaitAbnormality: false,
        fallRisk: 'low'
      },
      healthObservations: {
        eatingDrinking: false,
        signsOfPain: false,
        appropriatelyDressed: true
      },
      recommendedAction: 'none',
      reasoning: 'Waiting for analysis...',
      timestamp: new Date()
    };
  }

  // Getters for integration
  getCurrentRiskLevel(): string {
    return this.lastAnalysis?.safetyAssessment.wanderingRisk || 'NONE';
  }

  getLastAnalysis(): VisionAnalysis | null {
    return this.lastAnalysis;
  }

  getAnalysisHistory(count: number = 10): VisionAnalysis[] {
    return this.analysisHistory.slice(-count);
  }

  isNearExit(): boolean {
    return this.lastAnalysis?.safetyAssessment.nearExit || false;
  }

  getMovementSummary(): { pacing: number; sitting: number; walking: number; still: number } {
    const summary = { pacing: 0, sitting: 0, walking: 0, still: 0 };
    this.analysisHistory.forEach(analysis => {
      const movement = (analysis.bodyLanguage.movement || '').toLowerCase();
      if (movement.includes('pacing')) summary.pacing++;
      else if (movement.includes('sitting')) summary.sitting++;
      else if (movement.includes('walking')) summary.walking++;
      else summary.still++;
    });
    return summary;
  }
}
