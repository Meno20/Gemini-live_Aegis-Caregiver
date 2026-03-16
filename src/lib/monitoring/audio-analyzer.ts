/**
 * Aegis Caregiver - Audio Analyzer (Version 2)
 * Analyzes voice patterns for emotional state and agitation using Gemini AI.
 */

import { runTask, SYSTEM_PROMPTS, parseJsonResponse } from '@/lib/gemini';

// Types
export interface AudioAnalysis {
  transcription: string;
  emotionalState: 'calm' | 'content' | 'confused' | 'worried' | 'anxious' | 'agitated';
  agitationLevel: number; // 0-10
  vocalStress: {
    detected: boolean;
    level: 'low' | 'medium' | 'high';
    recommendation: string | null;
  };
  isQuestion: boolean;
  timestamp: Date;
}

export class AudioAnalyzer {
  private patient: { name: string; preferredName: string };
  private recentAnalyses: AudioAnalysis[] = [];
  
  constructor(patient: { name: string; preferredName: string }) {
    this.patient = patient;
  }

  /**
   * Analyze voice transcription using Gemini AI for deep emotional understanding
   */
  async analyzeVoice(transcription: string): Promise<AudioAnalysis> {
    const currentTime = new Date();

    // Prepare contents for Gemini
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Analyze the following transcription from a dementia patient: "${transcription}".
              Patient: ${this.patient.preferredName}.
              Provide emotional state, agitation level, and detect any caregiver vocal stress if the speaker is a caregiver.`
          }
        ]
      }
    ];

    try {
      const response = await runTask('emotion-analysis', contents, {
        systemInstruction: SYSTEM_PROMPTS.emotionAnalysis + "\n\nREQUIREMENTS:\nReturn JSON matching this template:\n" + 
          JSON.stringify({
            emotionalState: 'calm | content | confused | worried | anxious | agitated',
            agitationLevel: 1, // 0-10
            vocalStress: {
              detected: false,
              level: 'low | medium | high',
              recommendation: 'string or null'
            },
            isQuestion: false
          }, null, 2)
      });

      const responseText = response.text();
      const analysis = parseJsonResponse(responseText);

      const result: AudioAnalysis = {
        transcription,
        ...analysis,
        timestamp: currentTime
      };

      // Store analysis
      this.recentAnalyses.push(result);
      if (this.recentAnalyses.length > 50) {
        this.recentAnalyses.shift();
      }

      return result;
    } catch (error) {
      console.error('[AudioAnalyzer] AI Task Error:', error);
      // Fallback to simple heuristic
      return this.heuristicAnalysis(transcription);
    }
  }

  /**
   * Fallback heuristic analysis if AI fails
   */
  private heuristicAnalysis(text: string): AudioAnalysis {
    const lowerText = text.toLowerCase();
    const isQuestion = text.includes('?') || ['where', 'when', 'who', 'what', 'how', 'why'].some(w => lowerText.startsWith(w));
    
    let emotionalState: AudioAnalysis['emotionalState'] = 'calm';
    let agitationLevel = 1;

    if (['angry', 'upset', 'stop', 'go away', 'hate'].some(w => lowerText.includes(w))) {
      emotionalState = 'agitated';
      agitationLevel = 8;
    } else if (['scared', 'afraid', 'help', 'worry'].some(w => lowerText.includes(w))) {
      emotionalState = 'worried';
      agitationLevel = 5;
    } else if (isQuestion) {
      emotionalState = 'confused';
      agitationLevel = 3;
    }

    return {
      transcription: text,
      emotionalState,
      agitationLevel,
      vocalStress: { detected: false, level: 'low', recommendation: null },
      isQuestion,
      timestamp: new Date()
    };
  }

  // Analytics Helpers
  getEmotionalTrend(): 'stable' | 'escalating' | 'improving' {
    if (this.recentAnalyses.length < 5) return 'stable';
    const recent = this.recentAnalyses.slice(-5);
    const older = this.recentAnalyses.slice(-10, -5);
    const recentAvg = recent.reduce((sum, a) => sum + a.agitationLevel, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, a) => sum + a.agitationLevel, 0) / older.length : recentAvg;

    if (recentAvg > olderAvg + 1.5) return 'escalating';
    if (recentAvg < olderAvg - 1.5) return 'improving';
    return 'stable';
  }

  getRecentAnalyses(count: number = 10): AudioAnalysis[] {
    return this.recentAnalyses.slice(-count);
  }

  getEmotionalSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    this.recentAnalyses.forEach(analysis => {
      summary[analysis.emotionalState] = (summary[analysis.emotionalState] || 0) + 1;
    });
    return summary;
  }
}
