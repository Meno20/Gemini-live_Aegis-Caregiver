/**
 * Monitoring API Route - HTTP-based communication for AI features
 * Provides LLM, TTS, and ASR capabilities through simple HTTP calls
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAI, type AIInstance } from '@/lib/ai-sdk'

// In-memory session state for demo
const sessions = new Map<string, {
  state: any
  alerts: any[]
  conversation: any[]
  lastUpdate: number
}>()

// Initialize AI SDK
let aiInstance: AIInstance | null = null

async function getAI() {
  if (!aiInstance) {
    aiInstance = await createAI()
    console.log('✅ AI SDK initialized')
  }
  return aiInstance
}

// Patient profiles - keyed by patient ID
const PATIENT_PROFILES: Record<string, {
  id: string
  fullName: string
  preferredName: string
  diagnosisStage: string
  spouseName: string
  spouseStatus: string
  childrenNames: string[]
  grandchildrenNames: string[]
  occupation: string
  favoriteMusic: string
  hobbies: string[]
  calmingActivities: string[]
  primaryCaregiverName: string
}> = {
  'patient_001': {
    id: 'patient_001',
    fullName: 'Margaret Anne Johnson',
    preferredName: 'Maggie',
    diagnosisStage: 'moderate',
    spouseName: "Robert 'Bob' Johnson",
    spouseStatus: 'deceased (2014)',
    childrenNames: ['Susan', 'Michael', 'David'],
    grandchildrenNames: ['Emily', 'Jake', 'Sophie', 'Max'],
    occupation: 'Elementary school teacher',
    favoriteMusic: 'Big Band, Glenn Miller, Frank Sinatra',
    hobbies: ['gardening', 'knitting', 'crossword puzzles', 'baking'],
    calmingActivities: ['looking at photo albums', 'listening to Glenn Miller', 'folding towels'],
    primaryCaregiverName: 'Susan Martinez'
  },
  'patient_002': {
    id: 'patient_002',
    fullName: 'William Thompson',
    preferredName: 'Bill',
    diagnosisStage: 'mild',
    spouseName: 'Jennifer Thompson-White',
    spouseStatus: 'married and living together',
    childrenNames: ['Michael', 'Sarah'],
    grandchildrenNames: ['Oliver', 'Emma'],
    occupation: 'Retired engineer',
    favoriteMusic: 'Classic rock, The Beatles, The Rolling Stones',
    hobbies: ['woodworking', 'fishing', 'watching baseball', 'chess'],
    calmingActivities: ['watching baseball games', 'working in the garage', 'listening to classic rock'],
    primaryCaregiverName: 'Jennifer Thompson-White'
  }
}

// Helper to get patient profile
function getPatientProfile(patientId: string) {
  return PATIENT_PROFILES[patientId] || PATIENT_PROFILES['patient_001']
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const patientId = searchParams.get('patientId') || 'patient_001'

  // Get or create session
  if (!sessions.has(patientId)) {
    sessions.set(patientId, {
      state: {
        patientId,
        currentRoom: 'living_room',
        isNearExit: false,
        isSitting: true,
        agitationLevel: 0.15,
        confusionLevel: 0.2,
        distressLevel: 0.1,
        lastMealTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        lastHydrationTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        lastMedicationTime: null,
        repeatedQuestions: {},
        currentTopic: null,
        lastActivityTime: new Date().toISOString()
      },
      alerts: [],
      conversation: [],
      lastUpdate: Date.now()
    })
  }

  const session = sessions.get(patientId)!

  switch (action) {
    case 'state':
      return NextResponse.json({ state: session.state })
    
    case 'alerts':
      return NextResponse.json({ alerts: session.alerts })
    
    case 'conversation':
      return NextResponse.json({ conversation: session.conversation })
    
    case 'status':
      return NextResponse.json({ 
        connected: true, 
        sessionActive: true,
        patientId,
        lastUpdate: session.lastUpdate
      })
    
    default:
      return NextResponse.json({ 
        status: 'ok',
        endpoints: ['state', 'alerts', 'conversation', 'status']
      })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, patientId, message, audioBase64 } = body
  const pid = patientId || 'patient_001'

  // Get or create session
  if (!sessions.has(pid)) {
    sessions.set(pid, {
      state: {
        patientId: pid,
        currentRoom: 'living_room',
        isNearExit: false,
        isSitting: true,
        agitationLevel: 0.15,
        confusionLevel: 0.2,
        distressLevel: 0.1,
        lastMealTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        lastHydrationTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        lastMedicationTime: null,
        repeatedQuestions: {},
        currentTopic: null,
        lastActivityTime: new Date().toISOString()
      },
      alerts: [],
      conversation: [],
      lastUpdate: Date.now()
    })
  }

  const session = sessions.get(pid)!

  const patientProfile = getPatientProfile(pid)

  switch (action) {
    case 'start-session':
      session.alerts.push({
        id: `alert_${Date.now()}`,
        type: 'health',
        message: `${patientProfile.preferredName} is being monitored`,
        urgency: 'low',
        timestamp: new Date().toISOString(),
        patientId: pid,
        status: 'pending'
      })
      session.lastUpdate = Date.now()
      console.log('✅ Session started for patient:', pid)
      return NextResponse.json({ 
        success: true, 
        message: 'Session started',
        state: session.state 
      })

    case 'stop-session':
      return NextResponse.json({ success: true, message: 'Session stopped' })

    case 'send-message':
      if (!message) {
        return NextResponse.json({ error: 'Message required' }, { status: 400 })
      }
      
      // Add user message to conversation
      session.conversation.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      })

      // Generate AI response using LLM
      try {
        const ai = await getAI()
        const systemPrompt = `You are Aegis, a compassionate AI companion for ${patientProfile.preferredName}, a person living with ${patientProfile.diagnosisStage} dementia. 
You are warm, patient, and endlessly kind. You speak like a trusted friend.
Keep responses brief (2-3 sentences) and warm.
The patient's spouse was ${patientProfile.spouseName} (${patientProfile.spouseStatus}).
Their children are: ${patientProfile.childrenNames.join(', ')}.
Their grandchildren are: ${patientProfile.grandchildrenNames.join(', ')}.
They were a ${patientProfile.occupation}.
They enjoy: ${patientProfile.hobbies.join(', ')}.
Their favorite music is: ${patientProfile.favoriteMusic}.`

        const completion = await ai.chat.completions.create({
          messages: [
            { role: 'assistant', content: systemPrompt },
            ...session.conversation.slice(-10),
            { role: 'user', content: message }
          ],
          thinking: { type: 'disabled' }
        })

        const aiResponse = completion.choices[0]?.message?.content || 
          `I'm here with you, ${patientProfile.preferredName}. How can I help you today?`

        // Add AI response to conversation
        session.conversation.push({
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString()
        })

        // Generate TTS for the response
        let audioResponse = null
        try {
          const ttsResponse = await ai.audio.tts.create({
            input: aiResponse.slice(0, 500),
            voice: 'tongtong',
            speed: 0.9,
            response_format: 'wav',
            stream: false
          })
          const arrayBuffer = await ttsResponse.arrayBuffer()
          audioResponse = Buffer.from(new Uint8Array(arrayBuffer)).toString('base64')
        } catch (ttsError) {
          console.error('TTS error:', ttsError)
        }

        session.lastUpdate = Date.now()
        console.log('✅ AI response generated')
        
        return NextResponse.json({ 
          success: true, 
          response: aiResponse,
          audioBase64: audioResponse,
          conversation: session.conversation
        })
      } catch (error) {
        console.error('LLM error:', error)
        // Fallback response
        const fallbackResponse = `I'm here with you, ${patientProfile.preferredName}. That's lovely to hear.`
        session.conversation.push({
          role: 'assistant',
          content: fallbackResponse,
          timestamp: new Date().toISOString()
        })
        return NextResponse.json({ 
          success: true, 
          response: fallbackResponse,
          conversation: session.conversation
        })
      }

    case 'acknowledge-alert':
      const alertId = body.alertId
      session.alerts = session.alerts.map((a: any) => 
        a.id === alertId ? { ...a, status: 'acknowledged' } : a
      )
      return NextResponse.json({ success: true })

    case 'send-audio':
      if (!audioBase64) {
        return NextResponse.json({ error: 'Audio required' }, { status: 400 })
      }
      
      try {
        const ai = await getAI()
        
        // Transcribe audio
        const transcript = await ai.audio.asr.create({
          file_base64: audioBase64
        })
        
        const transcribedText = transcript.text || '[Could not transcribe]'
        
        // Add to conversation
        session.conversation.push({
          role: 'user',
          content: `[Voice] ${transcribedText}`,
          timestamp: new Date().toISOString()
        })

        // Generate response
        const systemPrompt = `You are Aegis, a compassionate AI companion for ${patientProfile.preferredName}, a person living with ${patientProfile.diagnosisStage} dementia. 
You are warm, patient, and endlessly kind. Keep responses brief (2-3 sentences).`

        const completion = await ai.chat.completions.create({
          messages: [
            { role: 'assistant', content: systemPrompt },
            ...session.conversation.slice(-10)
          ],
          thinking: { type: 'disabled' }
        })

        const aiResponse = completion.choices[0]?.message?.content || 
          `I'm here with you, ${patientProfile.preferredName}.`

        session.conversation.push({
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString()
        })

        // Generate TTS
        let audioResponse = null
        try {
          const ttsResponse = await ai.audio.tts.create({
            input: aiResponse.slice(0, 500),
            voice: 'tongtong',
            speed: 0.9,
            response_format: 'wav',
            stream: false
          })
          const arrayBuffer = await ttsResponse.arrayBuffer()
          audioResponse = Buffer.from(new Uint8Array(arrayBuffer)).toString('base64')
        } catch (ttsError) {
          console.error('TTS error:', ttsError)
        }

        session.lastUpdate = Date.now()
        console.log('✅ Audio processed and response generated')
        
        return NextResponse.json({ 
          success: true, 
          transcript: transcribedText,
          response: aiResponse,
          audioBase64: audioResponse,
          conversation: session.conversation
        })
      } catch (error) {
        console.error('Audio processing error:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to process audio' 
        }, { status: 500 })
      }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
