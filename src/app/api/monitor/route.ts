/**
 * Monitoring API Route - HTTP-based communication for AI features
 * Provides LLM, TTS, and ASR capabilities with robust fallbacks
 * Emotion-sensitive responses with voice feedback
 */

import { NextRequest, NextResponse } from 'next/server'

// In-memory session state for demo
const sessions = new Map<string, {
  state: any
  alerts: any[]
  conversation: any[]
  lastUpdate: number
  emotionalState: 'calm' | 'anxious' | 'confused' | 'happy' | 'sad'
}>()

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
  memories: string[]
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
    primaryCaregiverName: 'Susan Martinez',
    memories: [
      'the beautiful garden you and Bob planted every spring',
      'your third-grade class at Lincoln Elementary',
      'Thanksgiving dinners with all the grandchildren',
      'Sunday afternoon drives listening to Glenn Miller'
    ]
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
    primaryCaregiverName: 'Jennifer Thompson-White',
    memories: [
      'building that beautiful oak bookshelf for the living room',
      'fishing trips with Michael at Lake Peterson',
      'watching the World Series with your father',
      'teaching Sarah to play chess'
    ]
  }
}

// Helper to get patient profile
function getPatientProfile(patientId: string) {
  return PATIENT_PROFILES[patientId] || PATIENT_PROFILES['patient_001']
}

// Detect emotional context from message
function detectEmotion(message: string): 'calm' | 'anxious' | 'confused' | 'happy' | 'sad' {
  const lowerMessage = message.toLowerCase()
  
  // Anxious/distressed indicators
  if (/\b(panic|scared|afraid|terrified|worried|anxious|nervous|help|emergency)\b/.test(lowerMessage)) {
    return 'anxious'
  }
  
  // Confused indicators
  if (/\b(where am i|who are you|what's happening|confused|don't understand|lost|forget)\b/.test(lowerMessage)) {
    return 'confused'
  }
  
  // Sad indicators
  if (/\b(sad|lonely|miss|cry|tears|hurt|pain|gone|passed away|died)\b/.test(lowerMessage)) {
    return 'sad'
  }
  
  // Happy indicators
  if (/\b(happy|glad|wonderful|great|love|beautiful|thank you|good day|enjoy)\b/.test(lowerMessage)) {
    return 'happy'
  }
  
  // Agitated/angry indicators
  if (/\b(angry|mad|frustrated|hate|stop|leave me alone|no|don't)\b/.test(lowerMessage)) {
    return 'anxious'
  }
  
  return 'calm'
}

// Generate intelligent, emotion-sensitive fallback responses
function generateEmotionalResponse(
  patientProfile: typeof PATIENT_PROFILES['patient_001'], 
  userMessage: string,
  emotion: 'calm' | 'anxious' | 'confused' | 'happy' | 'sad',
  sessionHistory: { emotionalState: string }
): { response: string; emotion: string } {
  const lowerMessage = userMessage.toLowerCase()
  const name = patientProfile.preferredName
  
  // Track emotional state
  sessionHistory.emotionalState = emotion
  
  // ANXIOUS - Calming, grounding responses
  if (emotion === 'anxious') {
    const calmingResponses = [
      `${name}, I'm right here with you. Take a deep breath with me. You're safe. We're in your home, and ${patientProfile.primaryCaregiverName} is nearby.`,
      `It's okay, ${name}. I can hear that you're upset. Let's take a moment together. Would you like to try ${patientProfile.calmingActivities[0]}? That always helps you feel better.`,
      `I'm here, ${name}. You're not alone. Remember, ${patientProfile.spouseStatus.includes('deceased') ? `${patientProfile.spouseName} may be gone, but their love is still with you` : `${patientProfile.spouseName} is here with you`}. Everything is going to be alright.`
    ]
    return { response: calmingResponses[Math.floor(Math.random() * calmingResponses.length)], emotion: 'calming' }
  }
  
  // CONFUSED - Gentle, orienting responses
  if (emotion === 'confused') {
    const orientingResponses = [
      `You're at home, ${name}. This is your safe place. ${patientProfile.primaryCaregiverName} is taking care of you. I'm Aegis, your companion, and I'm here to help.`,
      `It's alright to feel unsure sometimes, ${name}. You're in your own home. The time is ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} on ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}. Would you like a glass of water?`,
      `${name}, you're safe here. Sometimes our minds need a moment to catch up. Let's sit together for a bit. Would you like to look at some photos?`
    ]
    return { response: orientingResponses[Math.floor(Math.random() * orientingResponses.length)], emotion: 'calming' }
  }
  
  // SAD - Warm, empathetic responses
  if (emotion === 'sad') {
    const comfortingResponses = [
      `I can hear the sadness in your voice, ${name}. It's okay to feel this way. Your feelings matter. Would you like to talk about what's on your mind?`,
      `${name}, sometimes we all need a moment to feel our feelings. I'm here with you. ${patientProfile.spouseStatus.includes('deceased') ? `I know you miss ${patientProfile.spouseName}. Their memory lives on in the love you shared.` : `${patientProfile.spouseName} loves you very much.`}`,
      `It's hard sometimes, isn't it, ${name}? But you're not alone. Your family - ${patientProfile.childrenNames.slice(0, 2).join(' and ')} - they all love you so much. Should we look at some happy memories together?`
    ]
    return { response: comfortingResponses[Math.floor(Math.random() * comfortingResponses.length)], emotion: 'calming' }
  }
  
  // HAPPY - Engaging, positive responses
  if (emotion === 'happy') {
    const engagingResponses = [
      `It's so wonderful to hear you happy, ${name}! That joy in your voice is beautiful. What's making today special for you?`,
      `Oh, ${name}, your happiness is contagious! You know what might make this moment even better? ${patientProfile.favoriteMusic.split(',')[0]}. Should we listen to some together?`,
      `That's lovely, ${name}! You know, moments like these are what life is all about. I'm so glad you're having a good day. Tell me more about what's making you smile.`
    ]
    return { response: engagingResponses[Math.floor(Math.random() * engagingResponses.length)], emotion: 'happy' }
  }
  
  // Check for family-related queries
  if (/\b(husband|wife|spouse|married)\b/.test(lowerMessage)) {
    const responses = [
      `${patientProfile.spouseName}... what a beautiful love story you two shared. ${patientProfile.spouseStatus.includes('deceased') ? 'I know how much you miss them. The love you had doesn\'t fade.' : 'They\'re right here with you, still loving you every day.'}`,
      `You and ${patientProfile.spouseName} had such a special bond, ${name}. ${patientProfile.spouseStatus.includes('deceased') ? 'They may be gone, but they live in your heart always.' : 'It\'s wonderful that you have each other.'}`
    ]
    return { response: responses[Math.floor(Math.random() * responses.length)], emotion: 'calm' }
  }
  
  // Children queries
  if (/\b(children|kids|son|daughter)\b/.test(lowerMessage)) {
    const responses = [
      `Your children bring you so much joy, ${name}. ${patientProfile.childrenNames.join(', ')} - they all carry a piece of your heart. They visit whenever they can.`,
      `${name}, your children ${patientProfile.childrenNames.slice(0, 2).join(' and ')} love you more than words can say. You raised them with such love and care.`,
      `${patientProfile.childrenNames[0]} was just asking about you yesterday. Your children are so devoted to you, ${name}.`
    ]
    return { response: responses[Math.floor(Math.random() * responses.length)], emotion: 'happy' }
  }
  
  // Grandchildren queries
  if (/\b(grandchild|grandson|granddaughter|grandkids)\b/.test(lowerMessage)) {
    const responses = [
      `Your grandchildren are such a blessing, ${name}! ${patientProfile.grandchildrenNames.slice(0, 2).join(' and ')} - they light up when they see you.`,
      `Oh, the grandchildren! ${patientProfile.grandchildrenNames[0]} was asking when they could visit you again. You're their favorite grandparent, you know.`,
      `${name}, your grandchildren carry your legacy. ${patientProfile.grandchildrenNames.join(', ')} - each one is special, just like you.`
    ]
    return { response: responses[Math.floor(Math.random() * responses.length)], emotion: 'happy' }
  }
  
  // Music queries
  if (/\b(music|song|sing|listen)\b/.test(lowerMessage)) {
    const responses = [
      `Oh, ${patientProfile.favoriteMusic}! That's the soundtrack of your life, ${name}. Should I play some for you?`,
      `Music is so powerful, isn't it? I know how much you love ${patientProfile.favoriteMusic}. Those melodies bring back such beautiful memories.`,
      `${name}, would you like to listen to some ${patientProfile.favoriteMusic.split(',')[0]}? I remember how it makes you feel calm and happy.`
    ]
    return { response: responses[Math.floor(Math.random() * responses.length)], emotion: 'happy' }
  }
  
  // Work/career queries
  if (/\b(work|job|career|occupation|taught|teacher)\b/.test(lowerMessage)) {
    const responses = [
      `You were a ${patientProfile.occupation}, ${name}. You touched so many lives. The children you taught still remember your kindness.`,
      `What a meaningful career you had! As a ${patientProfile.occupation}, you shaped young minds and hearts. That's a beautiful legacy.`,
      `${name}, your years as a ${patientProfile.occupation} made a real difference in the world. You should be proud.`
    ]
    return { response: responses[Math.floor(Math.random() * responses.length)], emotion: 'happy' }
  }
  
  // Home/location queries
  if (/\b(home|house|leave|go|want to go)\b/.test(lowerMessage)) {
    const responses = [
      `You are home, ${name}. This is your house, your safe place. Everything here is familiar and comfortable.`,
      `${name}, you're right where you belong. This is your home. ${patientProfile.primaryCaregiverName} is here taking care of you.`,
      `There's no need to go anywhere, ${name}. You're safe here in your own home. Would you like me to help you get comfortable?`
    ]
    return { response: responses[Math.floor(Math.random() * responses.length)], emotion: 'calming' }
  }
  
  // Time queries
  if (/\b(time|day|date|today|what day)\b/.test(lowerMessage)) {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const dayStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const responses = [
      `It's ${timeStr} on ${dayStr}, ${name}. A beautiful ${now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'} for you.`,
      `${name}, the time is ${timeStr}. Today is ${dayStr}. It's a lovely day, isn't it?`,
      `Right now it's ${timeStr}, ${name}. ${now.getHours() >= 6 && now.getHours() < 12 ? 'Good morning!' : now.getHours() >= 12 && now.getHours() < 17 ? 'Good afternoon!' : 'Good evening!'} How are you feeling?`
    ]
    return { response: responses[Math.floor(Math.random() * responses.length)], emotion: 'calm' }
  }
  
  // Hungry/thirsty
  if (/\b(hungry|eat|food|thirsty|drink|water)\b/.test(lowerMessage)) {
    const responses = [
      `Let me check if it's time for a meal or snack, ${name}. Would you like something to eat or drink?`,
      `${name}, staying nourished is important. Let me remind ${patientProfile.primaryCaregiverName} that you might be hungry.`,
      `I'll make sure you get something to ${lowerMessage.includes('water') || lowerMessage.includes('thirsty') ? 'drink' : 'eat'}, ${name}. Would you like a glass of water?`
    ]
    return { response: responses[Math.floor(Math.random() * responses.length)], emotion: 'calm' }
  }
  
  // Tired/sleep
  if (/\b(tired|sleep|rest|bed|exhausted)\b/.test(lowerMessage)) {
    const responses = [
      `You sound tired, ${name}. Would you like to rest for a while? I can play some soft music to help you relax.`,
      `${name}, rest is important. Would you like to sit in your favorite chair or lie down for a bit?`,
      `Let's get you comfortable, ${name}. Some quiet time might be just what you need. Should I dim the lights?`
    ]
    return { response: responses[Math.floor(Math.random() * responses.length)], emotion: 'calming' }
  }
  
  // Greetings
  if (/\b(hello|hi|hey|good morning|good afternoon|good evening)\b/.test(lowerMessage)) {
    const now = new Date()
    const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
    const responses = [
      `${greeting}, ${name}! It's so good to hear your voice today. How are you feeling?`,
      `Hello, ${name}! What a pleasure to talk with you. I hope you're having a nice day so far.`,
      `${greeting}! ${name}, it's always wonderful to hear from you. What's on your mind today?`
    ]
    return { response: responses[Math.floor(Math.random() * responses.length)], emotion: 'happy' }
  }
  
  // Thanks
  if (/\b(thank|thanks|appreciate)\b/.test(lowerMessage)) {
    const responses = [
      `You're so welcome, ${name}. I'm always here for you, anytime you need me.`,
      `It's my pleasure, ${name}. Your comfort and happiness mean everything to me.`,
      `Oh, ${name}, being here with you is what I'm here for. You take care.`
    ]
    return { response: responses[Math.floor(Math.random() * responses.length)], emotion: 'happy' }
  }
  
  // Memory prompts - random positive memory
  if (/\b(remember|memory|old times|past)\b/.test(lowerMessage)) {
    const memory = patientProfile.memories[Math.floor(Math.random() * patientProfile.memories.length)]
    return { 
      response: `Oh yes, ${name}, I remember ${memory}. Those were such special times. Would you like to tell me more about that?`, 
      emotion: 'happy' 
    }
  }
  
  // Default warm, engaging responses with variation
  const defaultResponses = [
    `That's lovely, ${name}. Tell me more about that. I love hearing your thoughts.`,
    `I understand, ${name}. Is there anything I can do for you right now?`,
    `That's interesting, ${name}. What made you think of that?`,
    `I'm listening, ${name}. Your thoughts matter to me. Go on.`,
    `Thank you for sharing that with me, ${name}. How does that make you feel?`,
    `${name}, you always have such thoughtful things to say. I appreciate you sharing with me.`,
    `I hear you, ${name}. You know, ${patientProfile.memories[Math.floor(Math.random() * patientProfile.memories.length)]}. Would you like to talk about that?`
  ]
  
  return { 
    response: defaultResponses[Math.floor(Math.random() * defaultResponses.length)], 
    emotion: 'calm' 
  }
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
      lastUpdate: Date.now(),
      emotionalState: 'calm'
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
        lastUpdate: session.lastUpdate,
        emotionalState: session.emotionalState
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
      lastUpdate: Date.now(),
      emotionalState: 'calm'
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

      // Detect emotion from message
      const detectedEmotion = detectEmotion(message)
      
      // Generate response
      let aiResponse: string
      let responseEmotion: string = 'calm'
      
      try {
        // Dynamic import to avoid issues if SDK not available
        const AISDK = (await import('z-ai-web-dev-sdk')).default
        const ai = await AISDK.create()
        
        const systemPrompt = `You are Aegis, a compassionate AI companion for ${patientProfile.preferredName}, a person living with ${patientProfile.diagnosisStage} dementia. 
You are warm, patient, and endlessly kind. You speak like a trusted friend who has known them for years.
Keep responses brief (2-3 sentences) and emotionally appropriate.
The patient's spouse was ${patientProfile.spouseName} (${patientProfile.spouseStatus}).
Their children are: ${patientProfile.childrenNames.join(', ')}.
Their grandchildren are: ${patientProfile.grandchildrenNames.join(', ')}.
They were a ${patientProfile.occupation}.
They enjoy: ${patientProfile.hobbies.join(', ')}.
Their favorite music is: ${patientProfile.favoriteMusic}.
Current emotional state: ${detectedEmotion}. Respond with appropriate warmth and care.`

        const completion = await ai.chat.completions.create({
          messages: [
            { role: 'assistant', content: systemPrompt },
            ...session.conversation.slice(-10),
            { role: 'user', content: message }
          ],
          thinking: { type: 'disabled' }
        })

        aiResponse = completion.choices[0]?.message?.content || 
          generateEmotionalResponse(patientProfile, message, detectedEmotion, session).response

      } catch (error) {
        console.log('AI SDK not available, using emotional fallback response')
        const fallback = generateEmotionalResponse(patientProfile, message, detectedEmotion, session)
        aiResponse = fallback.response
        responseEmotion = fallback.emotion
      }

      // Add AI response to conversation
      session.conversation.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      })

      // Generate TTS for the response - always try to provide voice feedback
      let audioResponse: string | null = null
      
      try {
        const AISDK = (await import('z-ai-web-dev-sdk')).default
        const ai = await AISDK.create()
        
        // Select voice and speed based on emotion
        const voice = responseEmotion === 'calming' ? 'tongtong' : 
                      responseEmotion === 'happy' ? 'chuichui' : 'tongtong'
        const speed = responseEmotion === 'calming' ? 0.85 : 1.0
        
        const ttsResponse = await ai.audio.tts.create({
          input: aiResponse.slice(0, 500),
          voice: voice,
          speed: speed,
          response_format: 'wav',
          stream: false
        })
        
        const arrayBuffer = await ttsResponse.arrayBuffer()
        audioResponse = Buffer.from(new Uint8Array(arrayBuffer)).toString('base64')
        console.log('✅ TTS audio generated for response')
      } catch (ttsError) {
        console.log('TTS generation failed, response will be text-only:', ttsError)
      }

      session.lastUpdate = Date.now()
      console.log('✅ Response generated:', aiResponse.slice(0, 50) + '...')
      
      return NextResponse.json({ 
        success: true, 
        response: aiResponse,
        audioBase64: audioResponse,
        conversation: session.conversation,
        emotion: responseEmotion
      })

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
      
      let transcribedText = ''
      
      try {
        // Dynamic import
        const AISDK = (await import('z-ai-web-dev-sdk')).default
        const ai = await AISDK.create()
        
        // Try ASR
        try {
          const transcript = await ai.audio.asr.create({
            file_base64: audioBase64
          })
          transcribedText = transcript.text || ''
        } catch (asrError) {
          console.log('ASR not available')
          transcribedText = '[Voice message]'
        }
      } catch (error) {
        transcribedText = '[Voice message]'
      }
      
      // Add to conversation
      session.conversation.push({
        role: 'user',
        content: transcribedText ? `[Voice] ${transcribedText}` : '[Voice message]',
        timestamp: new Date().toISOString()
      })

      // Detect emotion and generate response
      const voiceEmotion = transcribedText ? detectEmotion(transcribedText) : 'calm'
      const response = generateEmotionalResponse(patientProfile, transcribedText || 'hello', voiceEmotion, session)
      
      session.conversation.push({
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      })

      // Generate TTS - always provide voice feedback
      let voiceAudioResponse: string | null = null
      
      try {
        const AISDK = (await import('z-ai-web-dev-sdk')).default
        const ai = await AISDK.create()
        
        // Select voice and speed based on emotion
        const voice = response.emotion === 'calming' ? 'tongtong' : 
                      response.emotion === 'happy' ? 'chuichui' : 'tongtong'
        const speed = response.emotion === 'calming' ? 0.85 : 1.0
        
        const ttsResponse = await ai.audio.tts.create({
          input: response.response.slice(0, 500),
          voice: voice,
          speed: speed,
          response_format: 'wav',
          stream: false
        })
        
        const arrayBuffer = await ttsResponse.arrayBuffer()
        voiceAudioResponse = Buffer.from(new Uint8Array(arrayBuffer)).toString('base64')
        console.log('✅ TTS audio generated for voice response')
      } catch (ttsError) {
        console.log('TTS generation failed, response will be text-only:', ttsError)
      }

      session.lastUpdate = Date.now()
      console.log('✅ Audio processed:', transcribedText)
      
      return NextResponse.json({ 
        success: true, 
        transcript: transcribedText,
        response: response.response,
        audioBase64: voiceAudioResponse,
        conversation: session.conversation,
        emotion: response.emotion
      })

    case 'update-state':
      const updates = body.updates || {}
      session.state = { ...session.state, ...updates }
      session.lastUpdate = Date.now()
      return NextResponse.json({ success: true, state: session.state })

    case 'update-hydration':
      session.state.lastHydrationTime = new Date().toISOString()
      session.lastUpdate = Date.now()
      console.log('💧 Hydration updated for patient:', pid)
      return NextResponse.json({ 
        success: true, 
        state: session.state,
        message: 'Hydration time updated'
      })

    case 'update-meal':
      session.state.lastMealTime = new Date().toISOString()
      session.lastUpdate = Date.now()
      console.log('🍽️ Meal time updated for patient:', pid)
      return NextResponse.json({ 
        success: true, 
        state: session.state,
        message: 'Meal time updated'
      })

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
