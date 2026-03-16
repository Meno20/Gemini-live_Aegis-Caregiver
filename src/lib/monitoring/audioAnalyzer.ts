/**
 * Aegis Caregiver - Audio Analyzer
 * Analyzes voice patterns for emotional state and agitation
 */

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
  
  // Keywords for emotional state detection
  private emotionalKeywords = {
    calm: ['peaceful', 'fine', 'okay', 'good', 'nice', 'comfortable'],
    content: ['happy', 'wonderful', 'love', 'beautiful', 'enjoy', 'glad'],
    confused: ['where', 'when', 'who', 'what', 'why', 'how', 'understand', 'remember'],
    worried: ['concerned', 'worried', 'afraid', 'scared', 'nervous', 'unsure'],
    anxious: ['anxious', 'restless', 'unsettled', 'nervous', 'tense'],
    agitated: ['angry', 'upset', 'frustrated', 'mad', 'hate', 'terrible', 'awful']
  };

  constructor(patient: { name: string; preferredName: string }) {
    this.patient = patient;
  }

  // Analyze voice (simulated for hackathon - would use actual audio analysis in production)
  async analyzeVoice(transcription: string): Promise<AudioAnalysis> {
    const analysis: AudioAnalysis = {
      transcription,
      emotionalState: this.detectEmotionalState(transcription),
      agitationLevel: 0,
      vocalStress: {
        detected: false,
        level: 'low',
        recommendation: null
      },
      isQuestion: this.isQuestion(transcription),
      timestamp: new Date()
    };

    // Calculate agitation level based on emotional state
    analysis.agitationLevel = this.calculateAgitationLevel(analysis.emotionalState);

    // Check for vocal stress (caregiver detection)
    analysis.vocalStress = this.detectVocalStress(transcription);

    // Store analysis
    this.recentAnalyses.push(analysis);
    if (this.recentAnalyses.length > 50) {
      this.recentAnalyses.shift();
    }

    return analysis;
  }

  private detectEmotionalState(text: string): AudioAnalysis['emotionalState'] {
    const lowerText = text.toLowerCase();
    
    // Count keyword matches for each emotion
    const scores: Record<string, number> = {};
    
    for (const [emotion, keywords] of Object.entries(this.emotionalKeywords)) {
      scores[emotion] = keywords.reduce((count, keyword) => {
        return count + (lowerText.includes(keyword) ? 1 : 0);
      }, 0);
    }

    // Check for agitation indicators (exclamation marks, all caps, repeated words)
    if (text.includes('!') || text.includes('?')) {
      scores.agitated += 0.5;
    }
    if (text === text.toUpperCase() && text.length > 5) {
      scores.agitated += 1;
    }

    // Find highest scoring emotion
    let maxEmotion: AudioAnalysis['emotionalState'] = 'calm';
    let maxScore = 0;

    for (const [emotion, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxEmotion = emotion as AudioAnalysis['emotionalState'];
      }
    }

    // Default to confused if asking questions
    if (maxScore === 0 && this.isQuestion(text)) {
      return 'confused';
    }

    return maxScore > 0 ? maxEmotion : 'calm';
  }

  private calculateAgitationLevel(emotionalState: string): number {
    const agitationMap: Record<string, number> = {
      'calm': 1,
      'content': 2,
      'confused': 4,
      'worried': 5,
      'anxious': 7,
      'agitated': 9
    };

    return agitationMap[emotionalState] || 3;
  }

  private detectVocalStress(text: string): AudioAnalysis['vocalStress'] {
    // Check for caregiver stress indicators
    const stressIndicators = [
      'exhausted', 'tired', 'overwhelmed', 'can\'t do this', 
      'too much', 'give up', 'need help', 'break'
    ];

    const lowerText = text.toLowerCase();
    const stressCount = stressIndicators.filter(indicator => 
      lowerText.includes(indicator)
    ).length;

    if (stressCount >= 2) {
      return {
        detected: true,
        level: 'high',
        recommendation: 'Caregiver appears stressed. Consider suggesting a break.'
      };
    } else if (stressCount === 1) {
      return {
        detected: true,
        level: 'medium',
        recommendation: 'Monitor caregiver wellbeing'
      };
    }

    return {
      detected: false,
      level: 'low',
      recommendation: null
    };
  }

  private isQuestion(text: string): boolean {
    const lowerText = text.toLowerCase();
    return text.includes('?') || 
           lowerText.startsWith('where') ||
           lowerText.startsWith('when') ||
           lowerText.startsWith('who') ||
           lowerText.startsWith('what') ||
           lowerText.startsWith('how') ||
           lowerText.startsWith('why') ||
           lowerText.startsWith('is') ||
           lowerText.startsWith('are') ||
           lowerText.startsWith('do') ||
           lowerText.startsWith('can');
  }

  // Get emotional trend
  getEmotionalTrend(): 'stable' | 'escalating' | 'improving' {
    if (this.recentAnalyses.length < 5) return 'stable';

    const recent = this.recentAnalyses.slice(-5);
    const older = this.recentAnalyses.slice(-10, -5);

    const recentAvg = recent.reduce((sum, a) => sum + a.agitationLevel, 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((sum, a) => sum + a.agitationLevel, 0) / older.length 
      : recentAvg;

    if (recentAvg > olderAvg + 2) return 'escalating';
    if (recentAvg < olderAvg - 2) return 'improving';
    return 'stable';
  }

  // Get recent analyses
  getRecentAnalyses(count: number = 10): AudioAnalysis[] {
    return this.recentAnalyses.slice(-count);
  }

  // Get emotional state summary
  getEmotionalSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    
    this.recentAnalyses.forEach(analysis => {
      summary[analysis.emotionalState] = (summary[analysis.emotionalState] || 0) + 1;
    });
    
    return summary;
  }

  // Check for repeated questions
  checkRepeatedQuestion(currentText: string): {
    isRepeated: boolean;
    count: number;
    lastAsked: Date | null;
  } {
    const normalized = currentText.toLowerCase().trim();
    let count = 0;
    let lastAsked: Date | null = null;

    this.recentAnalyses.forEach(analysis => {
      if (this.areQuestionsSimilar(normalized, analysis.transcription.toLowerCase())) {
        count++;
        lastAsked = analysis.timestamp;
      }
    });

    return {
      isRepeated: count >= 2,
      count,
      lastAsked
    };
  }

  private areQuestionsSimilar(q1: string, q2: string): boolean {
    const words1 = new Set(q1.split(' ').filter(w => w.length > 3));
    const words2 = new Set(q2.split(' ').filter(w => w.length > 3));
    
    const overlap = [...words1].filter(w => words2.has(w)).length;
    const minWords = Math.min(words1.size, words2.size);
    
    return minWords > 0 && overlap / minWords > 0.5;
  }
}
