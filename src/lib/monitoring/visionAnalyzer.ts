/**
 * Aegis Caregiver - Vision Analyzer
 * Analyzes video frames for patient safety and behavior
 */

import AI_SDK, { type AIInstance } from '@/lib/ai-sdk';

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
  private ai: AIInstance | null = null;
  private lastAnalysis: VisionAnalysis | null = null;
  private analysisHistory: VisionAnalysis[] = [];

  constructor(patient: { name: string; preferredName: string; age: number; diagnosisStage: string }, ai?: AIInstance) {
    this.patient = patient;
    this.ai = ai || null;
  }

  setAI(ai: AIInstance): void {
    this.ai = ai;
  }

  async analyzeFrame(imageBase64: string): Promise<VisionAnalysis> {
    const currentTime = new Date();
    const timeOfDay = currentTime.getHours();
    const timeContext = this.getTimeContext(timeOfDay);

    const prompt = `# VISION ANALYSIS FOR DEMENTIA PATIENT MONITORING

**Patient:** ${this.patient.preferredName} (${this.patient.age}, ${this.patient.diagnosisStage} Alzheimer's)
**Current Time:** ${currentTime.toLocaleString()}
**Context:** ${timeContext}

## ANALYZE THIS IMAGE FOR:

### 1. PATIENT LOCATION & ACTIVITY
- Where is ${this.patient.preferredName}? (living room, kitchen, bedroom, hallway, near door, etc.)
- What are they doing? (sitting, standing, pacing, lying down, eating, etc.)
- Are they near any exits (front door, back door)?

### 2. BODY LANGUAGE & EMOTIONAL STATE
- Facial expression (calm, confused, worried, agitated, distressed)
- Posture (relaxed, tense, hunched, rigid)
- Movement quality (smooth, jerky, slow, fast, pacing)

### 3. SAFETY CONCERNS
- Wearing outdoor clothing indoors? (coat, shoes when inappropriate)
- Near stairs or tripping hazards?
- Gait abnormalities? (shuffling, unsteady, favoring one side)
- Holding onto furniture for support?

### 4. WANDERING RISK ASSESSMENT
High risk if:
- Near exit doors
- Wearing outdoor clothes at unusual time (nighttime, early morning)
- Pacing near door
- Holding purse/keys

### 5. HEALTH INDICATORS
- Eating/drinking visible?
- Appropriate dress for weather/time?
- Signs of pain (grimacing, guarding body parts)?

## RESPOND IN JSON FORMAT:
\`\`\`json
{
  "patientVisible": true/false,
  "location": "specific location",
  "activity": "what they're doing",
  "bodyLanguage": {
    "facialExpression": "calm | confused | worried | agitated | distressed | neutral",
    "posture": "relaxed | tense | hunched | rigid",
    "movement": "still | pacing | sitting | walking"
  },
  "safetyAssessment": {
    "wanderingRisk": "NONE | LOW | MEDIUM | HIGH",
    "nearExit": true/false,
    "wearingOutdoorClothes": true/false,
    "gaitAbnormality": true/false,
    "fallRisk": "low | medium | high"
  },
  "healthObservations": {
    "eatingDrinking": true/false,
    "signsOfPain": true/false,
    "appropriatelyDressed": true/false
  },
  "recommendedAction": "none | monitor | gentle_intervention | immediate_caregiver_alert",
  "reasoning": "Brief explanation of your assessment"
}
\`\`\`

Be specific and observant. This analysis keeps ${this.patient.preferredName} safe.`;

    try {
      if (this.ai) {
        const response = await this.ai.chat.completions.createVision({
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
              ]
            }
          ],
          thinking: { type: 'disabled' }
        });

        const responseText = response.choices[0]?.message?.content || '';
        
        // Extract JSON from response
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        const jsonText = jsonMatch ? jsonMatch[1] : responseText;
        
        try {
          const analysis = JSON.parse(jsonText);
          
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
        } catch {
          return this.getDefaultAnalysis();
        }
      }
      
      return this.getDefaultAnalysis();
    } catch (error) {
      console.error('[VisionAnalyzer] Error:', error);
      return this.getDefaultAnalysis();
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
      reasoning: 'Analysis failed - defaulting to safe state',
      timestamp: new Date()
    };
  }

  // Get current risk level
  getCurrentRiskLevel(): 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' {
    return this.lastAnalysis?.safetyAssessment.wanderingRisk || 'NONE';
  }

  // Get last analysis
  getLastAnalysis(): VisionAnalysis | null {
    return this.lastAnalysis;
  }

  // Get analysis history
  getAnalysisHistory(count: number = 10): VisionAnalysis[] {
    return this.analysisHistory.slice(-count);
  }

  // Check if patient is near exit
  isNearExit(): boolean {
    return this.lastAnalysis?.safetyAssessment.nearExit || false;
  }

  // Get movement pattern summary
  getMovementSummary(): {
    pacing: number;
    sitting: number;
    walking: number;
    still: number;
  } {
    const summary = { pacing: 0, sitting: 0, walking: 0, still: 0 };
    
    this.analysisHistory.forEach(analysis => {
      const movement = analysis.bodyLanguage.movement;
      if (movement === 'pacing') summary.pacing++;
      else if (movement === 'sitting') summary.sitting++;
      else if (movement === 'walking') summary.walking++;
      else summary.still++;
    });
    
    return summary;
  }
}
