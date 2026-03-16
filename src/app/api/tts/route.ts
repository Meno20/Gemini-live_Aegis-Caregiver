import { NextRequest, NextResponse } from 'next/server';
import { ai, MODELS, Modality } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'Aoede', speed = 0.9 } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Limit text length for TTS
    const truncatedText = text.slice(0, 1000);

    // 2.5 Flash supports audio output modalities
    const response = await ai.models.generateContent({
      model: MODELS.analyst,
      contents: [{
        role: 'user',
        parts: [{
          text: `Speak the following text in a warm, calm, reassuring tone 

suitable for speaking to an elderly person or their caregiver:

"${truncatedText}"`,
        }],
      }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      },
    });

    // Extract audio data
    const audioData = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData
    );

    if (!audioData?.inlineData) {
      console.warn('[Aegis TTS] No audio data returned from Gemini');
      return NextResponse.json(
        { error: 'No audio data returned from Gemini TTS. Ensure your API key has TTS access.' },
        { status: 502 }
      );
    }

    // Return audio as binary
    const audioBuffer = Buffer.from(audioData.inlineData.data!, 'base64');
    const contentType = audioData.inlineData.mimeType || 'audio/wav';

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('[Aegis TTS] Error:', error);
    return NextResponse.json(
      { error: error.message || 'TTS failed' },
      { status: 500 }
    );
  }
}
