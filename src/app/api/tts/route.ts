/**
 * Text-to-Speech API Route
 * Provides reliable TTS for voice feedback
 */

import { NextRequest, NextResponse } from 'next/server'

// Singleton AI instance
let aiInstance: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>> | null = null

async function getAI() {
  if (!aiInstance) {
    const AISDK = (await import('z-ai-web-dev-sdk')).default
    aiInstance = await AISDK.create()
  }
  return aiInstance
}

// Available voices with their characteristics
const VOICE_PROFILES = {
  warm: 'tongtong',      // Warm and caring
  calm: 'xiaochen',      // Calm and professional
  gentle: 'chuichui',    // Gentle and kind
  clear: 'kazi'          // Clear and standard
}

// Speed profiles based on emotional context
const SPEED_PROFILES = {
  slow: 0.85,     // For calming, reassuring messages
  normal: 1.0,    // Standard conversation
  moderate: 1.1   // For engaging, happy messages
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, emotion = 'neutral', speed = 'normal' } = body

    if (!text) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 })
    }

    // Truncate text if too long (TTS limit is 1024 chars)
    const truncatedText = text.slice(0, 500)

    // Select voice based on emotion
    const voiceProfile = emotion === 'calming' ? VOICE_PROFILES.warm :
                         emotion === 'happy' ? VOICE_PROFILES.gentle :
                         VOICE_PROFILES.warm

    // Select speed based on context
    const speechSpeed = emotion === 'calming' ? SPEED_PROFILES.slow :
                        emotion === 'happy' ? SPEED_PROFILES.moderate :
                        SPEED_PROFILES.normal

    console.log(`🗣️ TTS: "${truncatedText.slice(0, 30)}..." (voice: ${voiceProfile}, speed: ${speechSpeed})`)

    try {
      const ai = await getAI()
      
      const response = await ai.audio.tts.create({
        input: truncatedText,
        voice: voiceProfile,
        speed: speechSpeed,
        response_format: 'wav',
        stream: false
      })

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = Buffer.from(new Uint8Array(arrayBuffer))
      const audioBase64 = audioBuffer.toString('base64')

      console.log(`✅ TTS generated: ${audioBuffer.length} bytes`)

      return NextResponse.json({
        success: true,
        audioBase64,
        duration: Math.ceil(truncatedText.length / 15) // Rough estimate in seconds
      })

    } catch (ttsError) {
      console.error('TTS API error:', ttsError)
      
      // Return success without audio - the frontend will handle gracefully
      return NextResponse.json({
        success: false,
        error: 'TTS temporarily unavailable',
        fallback: true
      })
    }

  } catch (error) {
    console.error('TTS route error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate speech'
    }, { status: 500 })
  }
}
