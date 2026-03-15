/**
 * Aegis Caregiver - Conversation Manager
 * Manages chat context and tracks conversation patterns
 */

// Types
export interface ConversationEntry {
  role: 'patient' | 'aegis' | 'caregiver';
  message: string;
  timestamp: Date;
  context?: {
    emotionalState?: string;
    repetitionCount?: number;
    interventionType?: string;
  };
}

export interface ConversationSummary {
  totalInteractions: number;
  patientMessages: number;
  aegisResponses: number;
  mostAskedQuestions: Array<{ question: string; count: number }>;
  emotionalTrend: 'stable' | 'escalating' | 'improving';
}

export class ConversationManager {
  private patient: { name: string; preferredName: string };
  private history: ConversationEntry[] = [];
  private questionCounts: Map<string, number> = new Map();
  private emotionalTimeline: Array<{
    timestamp: Date;
    state: string;
    trigger: string;
  }> = [];

  constructor(patient: { name: string; preferredName: string }) {
    this.patient = patient;
  }

  // Add patient input
  addPatientInput(message: string, context: {
    emotionalState?: string;
    repetitionCount?: number;
  } = {}): ConversationEntry {
    const entry: ConversationEntry = {
      role: 'patient',
      message,
      timestamp: new Date(),
      context
    };

    this.history.push(entry);

    // Track question repetition
    if (this.isQuestion(message)) {
      const normalized = this.normalizeQuestion(message);
      const count = (this.questionCounts.get(normalized) || 0) + 1;
      this.questionCounts.set(normalized, count);
      entry.context = { ...entry.context, repetitionCount: count };
    }

    // Track emotional state
    if (context.emotionalState) {
      this.emotionalTimeline.push({
        timestamp: new Date(),
        state: context.emotionalState,
        trigger: message
      });
    }

    // Limit history size
    if (this.history.length > 100) {
      this.history.shift();
    }

    return entry;
  }

  // Add Aegis response
  addAegisResponse(message: string, metadata: {
    interventionType?: string;
  } = {}): ConversationEntry {
    const entry: ConversationEntry = {
      role: 'aegis',
      message,
      timestamp: new Date(),
      context: metadata
    };

    this.history.push(entry);
    return entry;
  }

  // Get conversation history
  getHistory(): ConversationEntry[] {
    return this.history;
  }

  // Get recent history
  getRecentHistory(count: number = 10): ConversationEntry[] {
    return this.history.slice(-count);
  }

  // Get question repetition count
  getQuestionRepetitionCount(question: string): number {
    const normalized = this.normalizeQuestion(question);
    return this.questionCounts.get(normalized) || 0;
  }

  // Get emotional trend
  getEmotionalTrend(): 'stable' | 'escalating' | 'improving' {
    if (this.emotionalTimeline.length < 3) return 'stable';

    const recentStates = this.emotionalTimeline.slice(-10);
    
    const agitationLevels: Record<string, number> = {
      'calm': 1,
      'content': 2,
      'confused': 3,
      'worried': 4,
      'anxious': 5,
      'agitated': 6,
      'distressed': 7
    };

    const scores = recentStates.map(s => agitationLevels[s.state] || 3);
    
    if (scores.length < 2) return 'stable';
    
    const trend = scores[scores.length - 1] - scores[0];

    if (trend > 2) return 'escalating';
    if (trend < -2) return 'improving';
    return 'stable';
  }

  // Get conversation summary
  getSummary(): ConversationSummary {
    return {
      totalInteractions: this.history.length,
      patientMessages: this.history.filter(h => h.role === 'patient').length,
      aegisResponses: this.history.filter(h => h.role === 'aegis').length,
      mostAskedQuestions: this.getMostAskedQuestions(5),
      emotionalTrend: this.getEmotionalTrend()
    };
  }

  // Get most asked questions
  private getMostAskedQuestions(limit: number = 5): Array<{ question: string; count: number }> {
    return Array.from(this.questionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([question, count]) => ({ question, count }));
  }

  // Check if text is a question
  private isQuestion(text: string): boolean {
    const lowerText = text.toLowerCase();
    return text.includes('?') || 
           lowerText.startsWith('where') ||
           lowerText.startsWith('when') ||
           lowerText.startsWith('who') ||
           lowerText.startsWith('what') ||
           lowerText.startsWith('how') ||
           lowerText.startsWith('why');
  }

  // Normalize question for comparison
  private normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .replace(/[?.!]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Build context prompt for AI
  buildContextPrompt(context: {
    emotionalState?: string;
    repetitionCount?: number;
    agitationLevel?: number;
  }): string {
    const parts: string[] = ['CURRENT CONTEXT:'];

    if (context.emotionalState) {
      parts.push(`- Emotional state: ${context.emotionalState}`);
    }

    if (context.repetitionCount && context.repetitionCount > 1) {
      parts.push(`- This question has been asked ${context.repetitionCount} times today`);
    }

    if (context.agitationLevel !== undefined) {
      parts.push(`- Agitation level: ${context.agitationLevel}/10`);
    }

    const timeOfDay = new Date().getHours();
    if (timeOfDay >= 17 && timeOfDay <= 21) {
      parts.push('- SUNDOWNING PERIOD: Patient may be more confused/agitated');
    }

    parts.push(`- Time: ${new Date().toLocaleString()}`);

    return parts.join('\n');
  }
}
