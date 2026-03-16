/**
 * Aegis Caregiver Demo Simulation
 * Generates realistic demo data and scenarios for hackathon presentation
 */

// Demo scenario configurations
export const DEMO_SCENARIOS = {
  WANDERING: {
    name: 'Wandering Prevention',
    description: 'Patient approaches exit, receives gentle redirection',
    duration: 45000, // 45 seconds
    events: [
      { delay: 0, type: 'location_change', data: { room: 'hallway' } },
      { delay: 5000, type: 'location_change', data: { room: 'exit', isNearExit: true } },
      { delay: 10000, type: 'alert', data: { type: 'wandering', message: 'Patient near exit for 10+ seconds', urgency: 'high' } },
      { delay: 12000, type: 'intervention', data: { message: 'Redirecting patient with conversation' } },
      { delay: 20000, type: 'location_change', data: { room: 'living_room', isNearExit: false } },
      { delay: 25000, type: 'alert_acknowledged', data: { message: 'Redirection successful' } },
    ]
  },
  
  MEMORY_LOOP: {
    name: 'Memory Loop Handling',
    description: 'Patient asks repeated questions, Aegis responds with infinite patience',
    duration: 60000,
    events: [
      { delay: 0, type: 'transcript', data: { speaker: 'patient', text: "Where's my husband?" } },
      { delay: 3000, type: 'transcript', data: { speaker: 'aegis', text: "Bob isn't here right now. Tell me about him—what was your favorite thing about Bob?" } },
      { delay: 15000, type: 'transcript', data: { speaker: 'patient', text: "Where's my husband?" } },
      { delay: 18000, type: 'pattern_detected', data: { type: 'repeated_question', count: 2 } },
      { delay: 20000, type: 'transcript', data: { speaker: 'aegis', text: "Let me show you a photo of you and Bob at the beach in 1978." } },
      { delay: 35000, type: 'transcript', data: { speaker: 'patient', text: "Where is Bob?" } },
      { delay: 38000, type: 'pattern_detected', data: { type: 'repeated_question', count: 3 } },
      { delay: 40000, type: 'transcript', data: { speaker: 'aegis', text: "Bob is always with you in your memories. What music did you two love to dance to?" } },
    ]
  },
  
  AGITATION: {
    name: 'Agitation De-escalation',
    description: 'Patient shows increasing agitation, receives calming intervention',
    duration: 90000,
    events: [
      { delay: 0, type: 'state_update', data: { agitationLevel: 0.2 } },
      { delay: 15000, type: 'state_update', data: { agitationLevel: 0.35 } },
      { delay: 25000, type: 'state_update', data: { agitationLevel: 0.5 } },
      { delay: 35000, type: 'alert', data: { type: 'agitation', message: 'Agitation level elevated (50%)', urgency: 'normal' } },
      { delay: 40000, type: 'transcript', data: { speaker: 'aegis', text: "Maggie, I can see you're feeling frustrated. Would you like to look at your photo albums? Or we could listen to Glenn Miller..." } },
      { delay: 50000, type: 'state_update', data: { agitationLevel: 0.4 } },
      { delay: 60000, type: 'transcript', data: { speaker: 'patient', text: "I... I'd like to see the photos." } },
      { delay: 65000, type: 'state_update', data: { agitationLevel: 0.25 } },
      { delay: 80000, type: 'alert_acknowledged', data: { message: 'De-escalation successful' } },
    ]
  },
  
  MEAL_REMINDER: {
    name: 'Health Monitoring',
    description: 'Patient misses meal, receives gentle reminder',
    duration: 30000,
    events: [
      { delay: 0, type: 'state_update', data: { lastMealTime: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString() } },
      { delay: 5000, type: 'alert', data: { type: 'health', message: 'No meal in 7 hours', urgency: 'normal' } },
      { delay: 8000, type: 'transcript', data: { speaker: 'aegis', text: "Maggie, it's dinner time! I see there's pot roast in the fridge—your favorite. Would you like help warming it up?" } },
      { delay: 15000, type: 'transcript', data: { speaker: 'patient', text: "Oh, I suppose I am hungry." } },
      { delay: 20000, type: 'event_logged', data: { type: 'meal', description: 'Dinner initiated' } },
    ]
  },
  
  SUNDOWNING: {
    name: 'Sundowning Detection',
    description: 'System detects early evening agitation pattern',
    duration: 20000,
    events: [
      { delay: 0, type: 'time_update', data: { hour: 16 } }, // 4 PM
      { delay: 5000, type: 'state_update', data: { agitationLevel: 0.4 } },
      { delay: 10000, type: 'pattern_detected', data: { type: 'sundowning', confidence: 0.85, recommendation: 'Start calming activities now' } },
      { delay: 15000, type: 'alert', data: { type: 'info', message: 'Sundowning window approaching - Proactive intervention recommended', urgency: 'low' } },
    ]
  },
  
  FULL_DEMO: {
    name: 'Complete Demo Flow',
    description: 'Full 4-minute demonstration sequence',
    duration: 240000,
    events: [
      // Intro
      { delay: 0, type: 'session_start', data: {} },
      { delay: 2000, type: 'state_update', data: { currentRoom: 'living_room', agitationLevel: 0.15 } },
      
      // Memory loop section (30-60s)
      { delay: 30000, type: 'transcript', data: { speaker: 'patient', text: "Where's my husband?" } },
      { delay: 33000, type: 'transcript', data: { speaker: 'aegis', text: "Bob isn't here right now. What do you remember about your wedding day?" } },
      { delay: 45000, type: 'transcript', data: { speaker: 'patient', text: "Where's my husband?" } },
      { delay: 48000, type: 'pattern_detected', data: { type: 'repeated_question', count: 2 } },
      { delay: 50000, type: 'transcript', data: { speaker: 'aegis', text: "Let me show you a photo of your wedding day." } },
      
      // Wandering section (60-105s)
      { delay: 60000, type: 'location_change', data: { room: 'hallway' } },
      { delay: 65000, type: 'location_change', data: { room: 'exit', isNearExit: true } },
      { delay: 75000, type: 'alert', data: { type: 'wandering', message: 'Patient near exit', urgency: 'high' } },
      { delay: 77000, type: 'transcript', data: { speaker: 'aegis', text: "Maggie, where are you headed?" } },
      { delay: 80000, type: 'transcript', data: { speaker: 'patient', text: "I need to go to work." } },
      { delay: 83000, type: 'transcript', data: { speaker: 'aegis', text: "Work is closed now. How about some Glenn Miller music?" } },
      { delay: 90000, type: 'location_change', data: { room: 'living_room', isNearExit: false } },
      { delay: 100000, type: 'alert_acknowledged', data: { message: 'Redirection successful' } },
      
      // Health section (105-135s)
      { delay: 105000, type: 'state_update', data: { lastMealTime: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString() } },
      { delay: 110000, type: 'alert', data: { type: 'health', message: 'Meal reminder: 7 hours since last meal', urgency: 'normal' } },
      { delay: 112000, type: 'transcript', data: { speaker: 'aegis', text: "Maggie, it's time for dinner. Pot roast sounds good, doesn't it?" } },
      
      // Insights section (135-180s)
      { delay: 135000, type: 'pattern_detected', data: { type: 'sundowning', confidence: 0.82 } },
      { delay: 140000, type: 'pattern_detected', data: { type: 'wandering_pattern', peakTime: '3 PM' } },
      { delay: 150000, type: 'insight', data: { 
        title: 'UTI Risk Detected',
        description: 'Increased bathroom visits + sudden confusion spike detected 3 days early',
        preventedCost: '$15,000 ER visit'
      } },
      
      // Closing (180-240s)
      { delay: 180000, type: 'stats', data: {
        alertsToday: 4,
        interventionsSuccessful: 3,
        caregiverNotifications: 1,
        dignityPreserved: '100%'
      } },
      { delay: 200000, type: 'testimonial', data: {
        quote: "Aegis didn't give me my mother back. But it gave me back the ability to love her through this.",
        author: 'Susan, Margaret\'s daughter'
      } },
    ]
  }
}

// Generate realistic historical data for charts
export function generateHistoricalData(days: number = 7) {
  const data = []
  const now = new Date()
  
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(now)
    date.setDate(date.getDate() - d)
    
    // Generate hourly data for this day
    for (let h = 0; h < 24; h++) {
      const baseAgitation = 0.15 + Math.random() * 0.1
      
      // Sundowning effect (4 PM - 7 PM)
      const sundowningModifier = (h >= 16 && h <= 19) ? 0.2 + Math.random() * 0.3 : 0
      
      // Random wandering events (more likely during sundowning)
      const wanderingEvent = Math.random() < 0.05 + (sundowningModifier > 0 ? 0.1 : 0)
      
      data.push({
        date: date.toISOString().split('T')[0],
        hour: h,
        timestamp: new Date(date.setHours(h)).toISOString(),
        agitation: Math.min(1, baseAgitation + sundowningModifier),
        wandering: wanderingEvent ? 1 : 0,
        mealCompliance: 0.7 + Math.random() * 0.3,
        medicationCompliance: 0.85 + Math.random() * 0.15,
      })
    }
  }
  
  return data
}

// Generate weekly summary stats
export function generateWeeklyStats() {
  return {
    totalAlerts: 23,
    wanderingEvents: 5,
    agitationEvents: 8,
    healthAlerts: 4,
    interventionsSuccessful: 21,
    interventionsFailed: 2,
    avgResponseTime: '2.3 seconds',
    caregiverSatisfaction: '4.8/5.0',
    preventedERVisits: 1,
    costSaved: '$15,000',
  }
}

// Generate pattern insights
export function generatePatternInsights() {
  return [
    {
      id: '1',
      type: 'sundowning',
      confidence: 0.85,
      title: 'Sundowning Pattern Detected',
      description: 'Agitation increases significantly between 4 PM - 7 PM, consistent with sundowning behavior.',
      recommendation: 'Begin calming activities at 3:30 PM. Reduce stimulation and play familiar music.',
      severity: 'medium',
      occurrences: 12,
    },
    {
      id: '2',
      type: 'wandering_trigger',
      confidence: 0.78,
      title: 'Wandering Trigger Identified',
      description: 'Wandering events most common after periods of silence (>30 minutes without interaction).',
      recommendation: 'Increase proactive engagement frequency during quiet periods.',
      severity: 'medium',
      occurrences: 8,
    },
    {
      id: '3',
      type: 'medication_timing',
      confidence: 0.92,
      title: 'Optimal Medication Window',
      description: 'Patient most responsive to medication reminders between 8:00-8:30 AM.',
      recommendation: 'Schedule medication prompts at 8:00 AM for best compliance.',
      severity: 'low',
      occurrences: 14,
    },
    {
      id: '4',
      type: 'conversation_topic',
      confidence: 0.88,
      title: 'Engagement Topic Success',
      description: 'Topics about grandchildren and gardening reduce agitation by 40%.',
      recommendation: 'Use these topics when de-escalation is needed.',
      severity: 'low',
      occurrences: 25,
    },
  ]
}

// Generate demo conversation history
export function generateDemoConversation() {
  return [
    {
      role: 'patient',
      content: "Where's my husband?",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      role: 'assistant',
      content: "Bob isn't here right now, but I'd love to hear about him. What was your favorite thing about Bob?",
      timestamp: new Date(Date.now() - 5 * 60 * 1000 + 3000).toISOString(),
    },
    {
      role: 'patient',
      content: "We used to dance to Glenn Miller. He was so handsome.",
      timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    },
    {
      role: 'assistant',
      content: "That sounds lovely, Maggie. Would you like to listen to some Glenn Miller right now?",
      timestamp: new Date(Date.now() - 4 * 60 * 1000 + 3000).toISOString(),
    },
    {
      role: 'patient',
      content: "Yes, I'd like that.",
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    },
    {
      role: 'assistant',
      content: "Playing 'Moonlight Serenade' by Glenn Miller. This was popular in the 1940s.",
      timestamp: new Date(Date.now() - 3 * 60 * 1000 + 2000).toISOString(),
    },
  ]
}

// Demo script for presenters
export const DEMO_SCRIPT = {
  hook: {
    timing: '0:00-0:30',
    lines: [
      "Margaret has Alzheimer's.",
      "Every day, she asks about her deceased husband 40 times.",
      "Every night, she tries to leave the house looking for work she retired from 20 years ago.",
      "Her daughter is exhausted, burned out, and feels like a failure.",
      "This is dementia care in America. Until now.",
      "Aegis Caregiver. The AI that remembers when they can't."
    ]
  },
  
  techOverview: {
    timing: '0:30-1:00',
    lines: [
      "Powered by Google's Gemini Live API, Aegis provides 24/7 multimodal monitoring.",
      "Continuous video and audio streams feed into real-time behavioral analysis.",
      "But here's what makes Aegis different: It doesn't wait for you to ask.",
      "It interrupts BEFORE the crisis happens."
    ]
  },
  
  liveDemo: {
    timing: '1:00-2:30',
    sections: [
      {
        name: 'Memory Loop',
        lines: [
          "Same question. Different response.",
          "Aegis adapts to prevent emotional distress from repeated correction."
        ]
      },
      {
        name: 'Wandering Prevention',
        lines: [
          "Crisis averted. No locks. No alarms. Just gentle redirection."
        ]
      },
      {
        name: 'Health Monitoring',
        lines: [
          "One intervention just prevented a hospitalization.",
          "Dehydration and malnutrition are the leading causes of ER visits for dementia patients."
        ]
      }
    ]
  },
  
  patternRecognition: {
    timing: '2:30-3:30',
    lines: [
      "But Aegis doesn't just react. It learns.",
      "Aegis detected that Margaret becomes anxious every Tuesday at 2 PM.",
      "Why? That's when her daughter goes grocery shopping.",
      "Simple insight. Massive impact.",
      "Aegis also caught early UTI symptoms—three days before a hospitalization would have occurred.",
      "Cost of ER visit: $15,000. Cost of Aegis: $50/month. ROI: 300x in one intervention."
    ]
  },
  
  close: {
    timing: '3:30-4:00',
    lines: [
      "Aegis Caregiver. Powered by Gemini Live API.",
      "It remembers when they can't.",
      "It's patient when you can't be.",
      "It's always watching. Always caring.",
      "Because dementia steals memory. But it doesn't have to steal dignity."
    ]
  }
}
