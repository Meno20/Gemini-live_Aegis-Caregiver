/**
 * Behavioral Pattern Analysis Utilities
 * Provides analysis functions for patient behavior patterns
 */

export interface TimePattern {
  hour: number
  alertCount: number
  avgAgitation: number
  wanderingEvents: number
}

export interface DailyPattern {
  day: string
  dayIndex: number
  totalAlerts: number
  avgAgitation: number
  interventions: number
  sleepQuality: number
}

export interface BehavioralInsight {
  type: 'sundowning' | 'wandering_risk' | 'agitation_trigger' | 'sleep_pattern' | 'medication_timing'
  confidence: number
  description: string
  recommendation: string
  supportingData?: Record<string, unknown>
}

export interface HealthTrend {
  date: string
  agitationAvg: number
  mealCompliance: number
  medicationCompliance: number
  hydration: number
  sleepHours: number
  wanderingEvents: number
}

// Analyze hourly patterns
export function analyzeHourlyPatterns(alerts: Array<{ timestamp: Date; type: string; metadata?: Record<string, unknown> }>): TimePattern[] {
  const hourlyData: Record<number, { alerts: number; agitation: number[]; wandering: number }> = {}
  
  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { alerts: 0, agitation: [], wandering: 0 }
  }
  
  // Aggregate data by hour
  alerts.forEach(alert => {
    const hour = new Date(alert.timestamp).getHours()
    hourlyData[hour].alerts++
    
    if (alert.type === 'wandering') {
      hourlyData[hour].wandering++
    }
    
    if (alert.metadata?.agitationLevel) {
      hourlyData[hour].agitation.push(alert.metadata.agitationLevel as number)
    }
  })
  
  // Convert to array format
  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    alertCount: data.alerts,
    avgAgitation: data.agitation.length > 0 
      ? data.agitation.reduce((a, b) => a + b, 0) / data.agitation.length 
      : 0,
    wanderingEvents: data.wandering
  }))
}

// Analyze daily patterns
export function analyzeDailyPatterns(
  alerts: Array<{ timestamp: Date; type: string }>,
  sessions: Array<{ createdAt: Date; avgAgitation?: number; interventions?: number }>
): DailyPattern[] {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dailyData: Record<string, { alerts: number; agitation: number[]; interventions: number }> = {}
  
  days.forEach(day => {
    dailyData[day] = { alerts: 0, agitation: [], interventions: 0 }
  })
  
  // Aggregate alerts by day
  alerts.forEach(alert => {
    const day = days[new Date(alert.timestamp).getDay()]
    dailyData[day].alerts++
  })
  
  // Aggregate session data by day
  sessions.forEach(session => {
    const day = days[new Date(session.createdAt).getDay()]
    if (session.avgAgitation) {
      dailyData[day].agitation.push(session.avgAgitation)
    }
    if (session.interventions) {
      dailyData[day].interventions += session.interventions
    }
  })
  
  return days.map((day, index) => ({
    day,
    dayIndex: index,
    totalAlerts: dailyData[day].alerts,
    avgAgitation: dailyData[day].agitation.length > 0
      ? dailyData[day].agitation.reduce((a, b) => a + b, 0) / dailyData[day].agitation.length
      : 0,
    interventions: dailyData[day].interventions,
    sleepQuality: 0.8 // Placeholder - would be calculated from sleep data
  }))
}

// Detect sundowning pattern
export function detectSundowningPattern(hourlyPatterns: TimePattern[]): BehavioralInsight | null {
  // Sundowning typically occurs 4 PM - 7 PM (hours 16-19)
  const sundowningHours = hourlyPatterns.filter(p => p.hour >= 16 && p.hour <= 19)
  const otherHours = hourlyPatterns.filter(p => p.hour < 16 || p.hour > 19)
  
  const sundownAvgAgitation = sundowningHours.reduce((a, b) => a + b.avgAgitation, 0) / sundowningHours.length
  const otherAvgAgitation = otherHours.reduce((a, b) => a + b.avgAgitation, 0) / otherHours.length
  
  // If agitation during sundowning hours is significantly higher
  if (sundownAvgAgitation > otherAvgAgitation * 1.5 && sundownAvgAgitation > 0.3) {
    return {
      type: 'sundowning',
      confidence: Math.min(0.9, sundownAvgAgitation / otherAvgAgitation),
      description: `Patient shows elevated agitation during late afternoon/early evening hours (4 PM - 7 PM), consistent with sundowning behavior.`,
      recommendation: 'Consider starting calming activities around 3:30 PM, before the typical sundowning window. Reduce stimulation, dim lights, and play familiar music.'
    }
  }
  
  return null
}

// Detect wandering risk pattern
export function detectWanderingPattern(hourlyPatterns: TimePattern[]): BehavioralInsight | null {
  const totalWandering = hourlyPatterns.reduce((a, b) => a + b.wanderingEvents, 0)
  
  if (totalWandering < 3) return null
  
  // Find peak wandering hours
  const peakHours = hourlyPatterns
    .filter(p => p.wanderingEvents > 0)
    .sort((a, b) => b.wanderingEvents - a.wanderingEvents)
    .slice(0, 3)
  
  if (peakHours.length === 0) return null
  
  const peakHourStr = peakHours.map(h => `${h.hour}:00`).join(', ')
  
  return {
    type: 'wandering_risk',
    confidence: 0.85,
    description: `Wandering events detected, with peak activity around ${peakHourStr}. Total ${totalWandering} events recorded.`,
    recommendation: 'Ensure doors are monitored. Consider engaging activities during peak wandering times. Use gentle redirection when approaching exits.',
    supportingData: { peakHours: peakHours.map(h => h.hour), totalEvents: totalWandering }
  }
}

// Generate health trend data
export function generateHealthTrend(days: number = 7): HealthTrend[] {
  const trends: HealthTrend[] = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Generate realistic mock data with some variation
    const baseAgitation = 0.25 + Math.random() * 0.15
    const dayOfWeek = date.getDay()
    
    // Higher agitation on some days
    const agitationModifier = (dayOfWeek === 2 || dayOfWeek === 4) ? 1.3 : 1.0
    
    trends.push({
      date: date.toISOString().split('T')[0],
      agitationAvg: baseAgitation * agitationModifier + (Math.random() * 0.1 - 0.05),
      mealCompliance: 0.7 + Math.random() * 0.25,
      medicationCompliance: 0.85 + Math.random() * 0.15,
      hydration: 0.6 + Math.random() * 0.35,
      sleepHours: 6 + Math.random() * 3,
      wanderingEvents: Math.floor(Math.random() * 3)
    })
  }
  
  return trends
}

// Calculate overall risk score
export function calculateRiskScore(
  agitationLevel: number,
  wanderingEvents: number,
  medicationCompliance: number,
  recentAlerts: number
): { score: number; level: 'low' | 'medium' | 'high' | 'critical'; factors: string[] } {
  let score = 0
  const factors: string[] = []
  
  // Agitation contribution (0-30 points)
  if (agitationLevel > 0.7) {
    score += 30
    factors.push('High agitation level')
  } else if (agitationLevel > 0.5) {
    score += 20
    factors.push('Elevated agitation')
  } else if (agitationLevel > 0.3) {
    score += 10
    factors.push('Moderate agitation')
  }
  
  // Wandering contribution (0-25 points)
  if (wanderingEvents >= 3) {
    score += 25
    factors.push('Multiple wandering events')
  } else if (wanderingEvents >= 1) {
    score += 10
    factors.push('Recent wandering detected')
  }
  
  // Medication compliance (0-20 points)
  if (medicationCompliance < 0.7) {
    score += 20
    factors.push('Low medication compliance')
  } else if (medicationCompliance < 0.9) {
    score += 10
    factors.push('Moderate medication compliance')
  }
  
  // Recent alerts (0-25 points)
  if (recentAlerts >= 5) {
    score += 25
    factors.push('High alert frequency')
  } else if (recentAlerts >= 3) {
    score += 15
    factors.push('Elevated alert activity')
  }
  
  // Determine risk level
  let level: 'low' | 'medium' | 'high' | 'critical'
  if (score >= 70) {
    level = 'critical'
  } else if (score >= 50) {
    level = 'high'
  } else if (score >= 25) {
    level = 'medium'
  } else {
    level = 'low'
  }
  
  return { score: Math.min(score, 100), level, factors }
}

// Format duration in human-readable form
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours} hr`
  }
  return `${hours} hr ${mins} min`
}

// Get time-based greeting
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// Check if within sundowning window
export function isSundowningWindow(): boolean {
  const hour = new Date().getHours()
  return hour >= 16 && hour <= 19
}

// Generate timeline events from session data
export interface TimelineEvent {
  id: string
  timestamp: Date
  type: 'meal' | 'medication' | 'activity' | 'alert' | 'conversation' | 'location_change'
  title: string
  description?: string
  metadata?: Record<string, unknown>
}

export function generateTimelineFromSession(
  state: { lastMealTime?: string; lastMedicationTime?: string },
  alerts: Array<{ id: string; timestamp: string; type: string; message: string }>,
  conversation: Array<{ timestamp: string; content: string; role: string }>
): TimelineEvent[] {
  const events: TimelineEvent[] = []
  
  // Add meal events
  if (state.lastMealTime) {
    events.push({
      id: `meal-${Date.now()}`,
      timestamp: new Date(state.lastMealTime),
      type: 'meal',
      title: 'Meal Logged',
      description: 'Patient had a meal',
    })
  }
  
  // Add medication events
  if (state.lastMedicationTime) {
    events.push({
      id: `med-${Date.now()}`,
      timestamp: new Date(state.lastMedicationTime),
      type: 'medication',
      title: 'Medication Taken',
      description: 'Medication was administered',
    })
  }
  
  // Add alerts
  alerts.forEach(alert => {
    events.push({
      id: alert.id,
      timestamp: new Date(alert.timestamp),
      type: 'alert',
      title: alert.type.charAt(0).toUpperCase() + alert.type.slice(1) + ' Alert',
      description: alert.message,
    })
  })
  
  // Add conversation summaries
  conversation.slice(-5).forEach((msg, i) => {
    events.push({
      id: `conv-${i}`,
      timestamp: new Date(msg.timestamp),
      type: 'conversation',
      title: msg.role === 'assistant' ? 'Aegis Response' : 'Patient Message',
      description: msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : ''),
    })
  })
  
  // Sort by timestamp descending
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}
