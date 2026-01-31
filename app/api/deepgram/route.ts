import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const apiKeyRaw = process.env.DEEPGRAM_API_KEY || process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
  const apiKey = apiKeyRaw?.trim();

  if (!apiKey || apiKey === 'your_deepgram_api_key_here') {
    return NextResponse.json(
      {
        error:
          'Deepgram API key not configured. Set DEEPGRAM_API_KEY (recommended) or NEXT_PUBLIC_DEEPGRAM_API_KEY.',
      },
      { status: 400 }
    );
  }

  // Returning the main key is the most reliable "working and simple" approach.
  // The client-side SpeechToTextButton will use this for the WebSocket connection.
  return NextResponse.json({ key: apiKey });
}
