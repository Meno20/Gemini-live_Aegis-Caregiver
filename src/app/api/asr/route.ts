import { NextRequest, NextResponse } from 'next/server';
import { runTask } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const audioBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    const mimeType = audioFile.type || 'audio/webm';

    // 2.5 Flash for accurate transcription with fallback to 2.0 Flash
    const response = await runTask(
      'speech-to-text',
      [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Audio,
            },
          },
          {
            text: `Transcribe this audio exactly. If the speaker sounds confused, 
slurred, or is repeating themselves, transcribe exactly what was said — do not 
correct or interpret. Return ONLY the transcription text, nothing else.`,
          },
        ],
      }]
    );

    const transcription = response.text?.trim() || '';

    return NextResponse.json({
      success: true,
      transcription,
      text: transcription,
      model_used: 'gemini-2.5-flash',
    });

  } catch (error: any) {
    console.error('[Aegis ASR] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Transcription failed' },
      { status: 500 }
    );
  }
}
