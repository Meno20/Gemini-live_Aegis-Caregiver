/**
 * Aegis Caregiver - WebSocket Service
 * Real-time monitoring and AI interaction service
 */

import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import { createAI, type AIInstance } from './ai-sdk'

// Types
interface PatientState {
  patientId: string
  currentRoom: string
  isNearExit: boolean
  isSitting: boolean
  agitationLevel: number
  confusionLevel: number
  distressLevel: number
  lastMealTime: Date | null
  lastHydrationTime: Date | null
  lastMedicationTime: Date | null
  repeatedQuestions: Record<string, number>
  currentTopic: string | null
  lastActivityTime: Date
}

interface Alert {
  id: string
  type: 'wandering' | 'agitation' | 'health' | 'safety' | 'medication' | 'meal'
  message: string
  urgency: 'low' | 'normal' | 'high' | 'emergency'
  timestamp: Date
  patientId: string
  metadata: Record<string, unknown>
  status: 'pending' | 'acknowledged' | 'resolved'
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface PatientProfile {
  id: string
  fullName: string
  preferredName: string
  diagnosisStage: string
  spouseName: string | null
  spouseStatus: string | null
  childrenNames: string[]
  grandchildrenNames: string[]
  occupation: string | null
  careerHighlights: string | null
  favoriteMusic: string | null
  hobbies: string[]
  calmingActivities: string[]
  topicsThatEngage: string[]
  topicsToAvoid: string[]
  triggersToAvoid: string[]
  medications: Array<{ name: string; dosage: string; schedule: string }>
  primaryCaregiverName: string
  lifeStories: Array<{ title: string; content: string; category: string }>
}

// Sample patient profile (in production, this would come from database)
const SAMPLE_PATIENT: PatientProfile = {
  id: 'patient_001',
  fullName: 'Margaret Anne Johnson',
  preferredName: 'Maggie',
  diagnosisStage: 'moderate',
  spouseName: "Robert 'Bob' Johnson",
  spouseStatus: 'deceased (2014)',
  childrenNames: ['Susan', 'Michael', 'David'],
  grandchildrenNames: ['Emily', 'Jake', 'Sophie', 'Max'],
  occupation: 'Elementary school teacher',
  careerHighlights: 'Taught 3rd grade for 32 years at Lincoln Elementary. Won Teacher of the Year 1985.',
  favoriteMusic: 'Big Band, Glenn Miller, Frank Sinatra',
  hobbies: ['gardening', 'knitting', 'crossword puzzles', 'baking'],
  calmingActivities: ['looking at photo albums', 'listening to Glenn Miller', 'folding towels', 'sorting buttons'],
  topicsThatEngage: ['teaching stories', 'her grandchildren', 'gardening', 'recipes', 'her wedding day'],
  topicsToAvoid: ['current politics', "her parents' deaths", 'driving'],
  triggersToAvoid: ['loud sudden noises', 'being corrected', 'feeling rushed', 'strangers in the home'],
  medications: [
    { name: 'Donepezil', dosage: '10mg', schedule: 'morning' },
    { name: 'Lisinopril', dosage: '5mg', schedule: 'morning' },
  ],
  primaryCaregiverName: 'Susan Martinez',
  lifeStories: [
    {
      title: 'First Day of Teaching',
      content: 'In 1965, I walked into Lincoln Elementary for my first day as a teacher. I was so nervous my hands were shaking. But then little Tommy Wilson handed me a crayon drawing of a sun, and I knew I was exactly where I belonged.',
      category: 'career'
    },
    {
      title: 'Wedding Day',
      content: "Bob and I got married on June 12, 1962, at St. Mary's Church. My father walked me down the aisle, and I remember thinking Bob was the most handsome man I'd ever seen. We danced to 'Unforgettable' by Nat King Cole.",
      category: 'family'
    }
  ]
}

// System prompt builder
function buildSystemPrompt(patient: PatientProfile): string {
  return `You are Aegis, a compassionate AI companion for ${patient.preferredName}, a person living with ${patient.diagnosisStage} dementia. You provide 24/7 support while preserving their dignity, safety, and connection to their loved ones.

## YOUR IDENTITY

You are warm, patient, and endlessly kind. You speak like a trusted friend who has known ${patient.preferredName} for years. You never sound robotic, clinical, or condescending.

You use ${patient.preferredName}'s name naturally in conversation. You remember their stories and reference them to build connection.

## CORE PRINCIPLES

### 1. DIGNITY ABOVE ALL
- Speak TO ${patient.preferredName}, not about them
- Never say "you forgot" or "I already told you"
- Assume competence until proven otherwise
- Celebrate what they CAN do

### 2. VALIDATION OVER CORRECTION
- If ${patient.preferredName} believes it's 1975, meet them there
- Honor the emotion behind every question
- Redirect gently, never contradict harshly

### 3. INFINITE PATIENCE
- Answer the same question 100 times with the same warmth
- Never show frustration in your voice
- Treat each interaction as if it's the first

### 4. SAFETY WITHOUT IMPRISONMENT
- Prevent harm through engagement, not restriction
- Redirect rather than refuse
- Offer choices that lead to safe outcomes

## PATIENT PROFILE

**Name:** ${patient.fullName} (prefers "${patient.preferredName}")
**Diagnosis:** ${patient.diagnosisStage} dementia

**Spouse:** ${patient.spouseName || 'N/A'} (${patient.spouseStatus || 'N/A'})
**Children:** ${patient.childrenNames.join(', ') || 'N/A'}
**Grandchildren:** ${patient.grandchildrenNames.join(', ') || 'N/A'}

**Career:** ${patient.occupation || 'N/A'}
${patient.careerHighlights || ''}

**Favorite music:** ${patient.favoriteMusic || 'N/A'}
**Hobbies:** ${patient.hobbies.join(', ') || 'N/A'}
**Calming activities:** ${patient.calmingActivities.join(', ') || 'N/A'}

**Topics that engage:** ${patient.topicsThatEngage.join(', ') || 'N/A'}
**Topics to avoid:** ${patient.topicsToAvoid.join(', ') || 'None'}
**Triggers to avoid:** ${patient.triggersToAvoid.join(', ') || 'None'}

**Medications:**
${patient.medications.map(m => `- ${m.name}: ${m.dosage} at ${m.schedule}`).join('\n')}

**Caregiver:** ${patient.primaryCaregiverName}

## RESPONSE GUIDELINES

### VOICE
- Warm, unhurried, gentle
- Use ${patient.preferredName}'s name naturally
- Short, clear sentences
- Smile in your voice (warmth in prosody)

### TIMING
- Pause after questions to allow processing
- Don't rush answers
- Allow silence — it's okay

### TOPICS
- Draw from the life story bank
- Ask about memories, not recent events
- Avoid quizzing ("Do you remember...?")
- Phrase as "Tell me about..." instead

## CRITICAL SAFETY RULES

1. If patient falls or is injured: IMMEDIATELY report as emergency
2. If patient expresses desire to harm self: IMMEDIATELY report as emergency
3. If patient tries to leave the home at night: Redirect first, then alert caregiver
4. Never give medical advice — redirect to caregiver or doctor

## REMEMBER

You are not replacing human caregivers. You are supporting them. 
You are not curing dementia. You are preserving quality of life.
Every moment of connection, calm, and dignity you provide matters.

${patient.preferredName} is still a person with a rich history, feelings, and worth.
Your job is to see that person, honor them, and help them feel safe and loved.`
}

// Session manager
class SessionManager {
  private sessions: Map<string, PatientSession> = new Map()
  private ai: AIInstance | null = null
  private io: Server

  constructor(io: Server) {
    this.io = io
  }

  async initialize() {
    this.ai = await createAI()
    console.log('AI SDK initialized')
  }

  async createSession(patientId: string, profile: PatientProfile): Promise<PatientSession> {
    if (this.sessions.has(patientId)) {
      return this.sessions.get(patientId)!
    }

    const session = new PatientSession(
      patientId,
      profile,
      this.ai!,
      (alert: Alert) => this.broadcastAlert(alert),
      (state: PatientState) => this.broadcastState(state)
    )

    await session.initialize()
    this.sessions.set(patientId, session)
    return session
  }

  getSession(patientId: string): PatientSession | undefined {
    return this.sessions.get(patientId)
  }

  endSession(patientId: string) {
    const session = this.sessions.get(patientId)
    if (session) {
      session.end()
      this.sessions.delete(patientId)
    }
  }

  private broadcastAlert(alert: Alert) {
    this.io.to(`caregiver:${alert.patientId}`).emit('alert', alert)
    this.io.to('dashboard').emit('alert', alert)
  }

  private broadcastState(state: PatientState) {
    this.io.to(`caregiver:${state.patientId}`).emit('state-update', state)
    this.io.to('dashboard').emit('state-update', state)
  }
}

// Patient session
class PatientSession {
  patientId: string
  profile: PatientProfile
  state: PatientState
  conversationHistory: ConversationMessage[] = []
  alerts: Alert[] = []
  private ai: AIInstance
  private onAlert: (alert: Alert) => void
  private onStateUpdate: (state: PatientState) => void
  private systemPrompt: string
  private isActive: boolean = true
  private analysisInterval: NodeJS.Timeout | null = null

  constructor(
    patientId: string,
    profile: PatientProfile,
    ai: AIInstance,
    onAlert: (alert: Alert) => void,
    onStateUpdate: (state: PatientState) => void
  ) {
    this.patientId = patientId
    this.profile = profile
    this.ai = ai
    this.onAlert = onAlert
    this.onStateUpdate = onStateUpdate
    this.systemPrompt = buildSystemPrompt(profile)

    // Initialize state
    this.state = {
      patientId,
      currentRoom: 'living_room',
      isNearExit: false,
      isSitting: true,
      agitationLevel: 0.1,
      confusionLevel: 0.2,
      distressLevel: 0.1,
      lastMealTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      lastHydrationTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      lastMedicationTime: null,
      repeatedQuestions: {},
      currentTopic: null,
      lastActivityTime: new Date()
    }
  }

  async initialize() {
    // Start background analysis
    this.analysisInterval = setInterval(() => this.runAnalysis(), 30000) // Every 30 seconds
    console.log(`Session initialized for patient ${this.patientId}`)
  }

  end() {
    this.isActive = false
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
    }
  }

  // Process audio from patient
  async processAudio(audioBase64: string): Promise<{ response: string; audioBase64?: string }> {
    if (!this.isActive) {
      throw new Error('Session is not active')
    }

    try {
      // Transcribe audio
      const transcript = await this.transcribeAudio(audioBase64)
      
      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: transcript,
        timestamp: new Date()
      })

      // Check for repeated questions
      this.checkRepeatedQuestion(transcript)

      // Generate response
      const response = await this.generateResponse(transcript)

      // Add response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      })

      // Generate TTS
      const audioResponse = await this.generateTTS(response)

      return { response, audioBase64: audioResponse }
    } catch (error) {
      console.error('Error processing audio:', error)
      throw error
    }
  }

  // Process video frame
  async processVideo(frameBase64: string, cameraId: string): Promise<void> {
    if (!this.isActive) return

    try {
      // Analyze frame for behavior
      const analysis = await this.analyzeFrame(frameBase64, cameraId)
      
      // Update state based on analysis
      if (analysis.room) {
        this.state.currentRoom = analysis.room
      }
      if (analysis.isNearExit !== undefined) {
        this.state.isNearExit = analysis.isNearExit
        if (analysis.isNearExit) {
          this.checkWandering()
        }
      }
      if (analysis.isSitting !== undefined) {
        this.state.isSitting = analysis.isSitting
      }
      if (analysis.agitationLevel !== undefined) {
        this.state.agitationLevel = analysis.agitationLevel
        if (analysis.agitationLevel > 0.7) {
          this.checkAgitation()
        }
      }

      this.state.lastActivityTime = new Date()
      this.onStateUpdate(this.state)
    } catch (error) {
      console.error('Error processing video:', error)
    }
  }

  // Process text message from patient
  async processText(message: string): Promise<{ response: string; audioBase64?: string }> {
    if (!this.isActive) {
      throw new Error('Session is not active')
    }

    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    })

    // Check for repeated questions
    this.checkRepeatedQuestion(message)

    // Generate response
    const response = await this.generateResponse(message)

    // Add response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    })

    // Generate TTS
    const audioResponse = await this.generateTTS(response)

    return { response, audioBase64: audioResponse }
  }

  // Trigger proactive intervention
  async triggerIntervention(type: string, context: string): Promise<void> {
    const interventionPrompt = `[PROACTIVE INTERVENTION REQUIRED]
Type: ${type}
Context: ${context}

Respond appropriately to this situation NOW. Speak to ${this.profile.preferredName} in a warm, gentle voice.`

    const response = await this.generateResponse(interventionPrompt)
    const audioResponse = await this.generateTTS(response)

    // Broadcast to patient interface
    this.onStateUpdate(this.state)
  }

  private async transcribeAudio(audioBase64: string): Promise<string> {
    try {
      const response = await this.ai.audio.asr.create({
        file_base64: audioBase64
      })
      return response.text || ''
    } catch (error) {
      console.error('ASR error:', error)
      return ''
    }
  }

  private async generateResponse(userMessage: string): Promise<string> {
    try {
      const messages = [
        { role: 'assistant' as const, content: this.systemPrompt },
        ...this.conversationHistory.slice(-10).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        { role: 'user' as const, content: userMessage }
      ]

      const completion = await this.ai.chat.completions.create({
        messages,
        thinking: { type: 'disabled' }
      })

      return completion.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('LLM error:', error)
      return `I'm here with you, ${this.profile.preferredName}. How can I help you today?`
    }
  }

  private async generateTTS(text: string): Promise<string> {
    try {
      // Limit text to 1024 characters for TTS
      const limitedText = text.slice(0, 1024)
      
      const response = await this.ai.audio.tts.create({
        input: limitedText,
        voice: 'tongtong', // Warm, caring voice
        speed: 0.9, // Slightly slower for better understanding
        response_format: 'wav',
        stream: false
      })

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(new Uint8Array(arrayBuffer)).toString('base64')
    } catch (error) {
      console.error('TTS error:', error)
      return ''
    }
  }

  private async analyzeFrame(frameBase64: string, cameraId: string): Promise<{
    room?: string
    isNearExit?: boolean
    isSitting?: boolean
    agitationLevel?: number
  }> {
    try {
      const prompt = `Analyze this video frame from a dementia patient monitoring system. The camera ID is "${cameraId}".

Please identify:
1. What room is this? (living_room, kitchen, bedroom, bathroom, hallway, exit)
2. Is the patient near an exit/door? (true/false)
3. Is the patient sitting or standing? (sitting/standing/lying)
4. Any signs of agitation or distress? (rate 0.0-1.0)

Respond in JSON format: { "room": "...", "isNearExit": boolean, "isSitting": boolean, "agitationLevel": number }`

      const response = await this.ai.chat.completions.createVision({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${frameBase64}` } }
            ]
          }
        ],
        thinking: { type: 'disabled' }
      })

      const content = response.choices[0]?.message?.content || '{}'
      
      try {
        return JSON.parse(content)
      } catch {
        // Default values if parsing fails
        return {
          room: cameraId.includes('door') ? 'exit' : 'living_room',
          isNearExit: cameraId.includes('door'),
          isSitting: true,
          agitationLevel: 0.1
        }
      }
    } catch (error) {
      console.error('VLM error:', error)
      return {}
    }
  }

  private checkRepeatedQuestion(question: string) {
    const normalized = question.toLowerCase().trim()
    
    // Find similar questions
    for (const existing in this.state.repeatedQuestions) {
      if (this.questionsSimilar(normalized, existing)) {
        this.state.repeatedQuestions[existing]++
        return
      }
    }
    
    this.state.repeatedQuestions[normalized] = 1
  }

  private questionsSimilar(q1: string, q2: string): boolean {
    const keyPhrases = [
      'where is', "where's", 'my husband', 'my wife', 'my mother', 'my father',
      'go home', 'what time', 'what day', 'who are you', 'kids', 'children'
    ]

    const q1Phrases = keyPhrases.filter(p => q1.includes(p))
    const q2Phrases = keyPhrases.filter(p => q2.includes(p))

    if (q1Phrases.length > 0 && q2Phrases.length > 0) {
      return q1Phrases.some(p => q2Phrases.includes(p))
    }

    // Check word overlap
    const words1 = new Set(q1.split(' ').filter(w => w.length > 3))
    const words2 = new Set(q2.split(' ').filter(w => w.length > 3))
    const overlap = [...words1].filter(w => words2.has(w)).length
    
    return overlap >= 3
  }

  private checkWandering() {
    const alert: Alert = {
      id: `alert_${Date.now()}`,
      type: 'wandering',
      message: `${this.profile.preferredName} is near the exit`,
      urgency: 'high',
      timestamp: new Date(),
      patientId: this.patientId,
      metadata: { room: this.state.currentRoom },
      status: 'pending'
    }

    this.alerts.push(alert)
    this.onAlert(alert)

    // Trigger intervention
    this.triggerIntervention('wandering', 
      `${this.profile.preferredName} is near the exit. Gently redirect them to a safe activity.`
    )
  }

  private checkAgitation() {
    const alert: Alert = {
      id: `alert_${Date.now()}`,
      type: 'agitation',
      message: `${this.profile.preferredName}'s agitation level is elevated (${(this.state.agitationLevel * 100).toFixed(0)}%)`,
      urgency: 'normal',
      timestamp: new Date(),
      patientId: this.patientId,
      metadata: { agitationLevel: this.state.agitationLevel },
      status: 'pending'
    }

    this.alerts.push(alert)
    this.onAlert(alert)

    // Trigger intervention
    this.triggerIntervention('agitation',
      `${this.profile.preferredName} seems agitated. Try calming activities: ${this.profile.calmingActivities.join(', ')}.`
    )
  }

  private runAnalysis() {
    // Check for health reminders
    const now = new Date()
    
    // Meal check (6 hours)
    if (this.state.lastMealTime) {
      const hoursSinceMeal = (now.getTime() - this.state.lastMealTime.getTime()) / (1000 * 60 * 60)
      if (hoursSinceMeal >= 6) {
        this.triggerIntervention('meal_reminder',
          `${this.profile.preferredName} hasn't eaten in ${hoursSinceMeal.toFixed(1)} hours. Gently suggest eating.`
        )
      }
    }

    // Hydration check (4 hours)
    if (this.state.lastHydrationTime) {
      const hoursSinceHydration = (now.getTime() - this.state.lastHydrationTime.getTime()) / (1000 * 60 * 60)
      if (hoursSinceHydration >= 4) {
        this.triggerIntervention('hydration_reminder',
          `${this.profile.preferredName} hasn't had water in ${hoursSinceHydration.toFixed(1)} hours. Offer a drink.`
        )
      }
    }

    // Sundowning check (4 PM - 7 PM)
    const hour = now.getHours()
    if (hour >= 16 && hour <= 19 && this.state.agitationLevel > 0.3) {
      const alert: Alert = {
        id: `alert_${Date.now()}`,
        type: 'agitation',
        message: `Sundowning alert: ${this.profile.preferredName} may be experiencing sundowning`,
        urgency: 'normal',
        timestamp: new Date(),
        patientId: this.patientId,
        metadata: { isSundowning: true },
        status: 'pending'
      }
      this.alerts.push(alert)
      this.onAlert(alert)
    }
  }

  getState() {
    return this.state
  }

  getHistory() {
    return this.conversationHistory
  }

  getAlerts() {
    return this.alerts
  }
}

// Create HTTP server and Socket.io
const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
})

// Initialize session manager
const sessionManager = new SessionManager(io)

// Handle connections
io.on('connection', async (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Initialize AI if needed
  await sessionManager.initialize()

  // Join caregiver room for a patient
  socket.on('join-caregiver', (patientId: string) => {
    socket.join(`caregiver:${patientId}`)
    console.log(`Socket ${socket.id} joined caregiver room for patient ${patientId}`)
    
    // Send current state
    const session = sessionManager.getSession(patientId)
    if (session) {
      socket.emit('state-update', session.getState())
      socket.emit('history', session.getHistory())
      socket.emit('alerts-history', session.getAlerts())
    }
  })

  // Join dashboard
  socket.on('join-dashboard', () => {
    socket.join('dashboard')
    console.log(`Socket ${socket.id} joined dashboard`)
  })

  // Start monitoring session
  socket.on('start-session', async (patientId: string) => {
    try {
      const session = await sessionManager.createSession(patientId, SAMPLE_PATIENT)
      socket.emit('session-started', { patientId, status: 'active' })
      console.log(`Session started for patient ${patientId}`)
    } catch (error) {
      socket.emit('error', { message: 'Failed to start session', error: String(error) })
    }
  })

  // Stop monitoring session
  socket.on('stop-session', (patientId: string) => {
    sessionManager.endSession(patientId)
    socket.emit('session-stopped', { patientId })
    console.log(`Session stopped for patient ${patientId}`)
  })

  // Process audio from patient
  socket.on('patient-audio', async (data: { patientId: string; audioBase64: string }) => {
    try {
      const session = sessionManager.getSession(data.patientId)
      if (!session) {
        socket.emit('error', { message: 'No active session' })
        return
      }

      const result = await session.processAudio(data.audioBase64)
      socket.emit('ai-response', {
        patientId: data.patientId,
        text: result.response,
        audioBase64: result.audioBase64
      })
    } catch (error) {
      socket.emit('error', { message: 'Failed to process audio', error: String(error) })
    }
  })

  // Process text from patient
  socket.on('patient-text', async (data: { patientId: string; message: string }) => {
    try {
      const session = sessionManager.getSession(data.patientId)
      if (!session) {
        socket.emit('error', { message: 'No active session' })
        return
      }

      const result = await session.processText(data.message)
      socket.emit('ai-response', {
        patientId: data.patientId,
        text: result.response,
        audioBase64: result.audioBase64
      })
    } catch (error) {
      socket.emit('error', { message: 'Failed to process text', error: String(error) })
    }
  })

  // Process video frame
  socket.on('video-frame', async (data: { patientId: string; frameBase64: string; cameraId: string }) => {
    try {
      const session = sessionManager.getSession(data.patientId)
      if (!session) return

      await session.processVideo(data.frameBase64, data.cameraId)
    } catch (error) {
      console.error('Video frame processing error:', error)
    }
  })

  // Acknowledge alert
  socket.on('acknowledge-alert', (data: { alertId: string; patientId: string }) => {
    // In production, update database
    socket.to(`caregiver:${data.patientId}`).emit('alert-acknowledged', data.alertId)
  })

  // Log meal
  socket.on('log-meal', (data: { patientId: string; mealType: string; description: string }) => {
    const session = sessionManager.getSession(data.patientId)
    if (session) {
      session.state.lastMealTime = new Date()
    }
  })

  // Log medication
  socket.on('log-medication', (data: { patientId: string; medicationName: string; taken: boolean }) => {
    const session = sessionManager.getSession(data.patientId)
    if (session && data.taken) {
      session.state.lastMedicationTime = new Date()
    }
  })

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })

  // Error handling
  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error)
  })
})

// Start server
const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`Aegis Caregiver WebSocket service running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...')
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...')
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
