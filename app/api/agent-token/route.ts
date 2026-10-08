import { NextResponse } from 'next/server';

// The voice agent is private: a conversation can only start with a short-lived
// signed URL. It is minted here so the ElevenLabs key never reaches the browser.
export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    return NextResponse.json(
      { error: 'La versión de voz todavía no está configurada.' },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { 'xi-api-key': apiKey }, cache: 'no-store' }
    );
    if (!response.ok) {
      console.error('ElevenLabs signed URL error', response.status, await response.text());
      return NextResponse.json(
        { error: 'No pudimos iniciar la conversación. Intenta de nuevo.' },
        { status: 502 }
      );
    }
    const data = await response.json();
    return NextResponse.json(
      { signedUrl: data.signed_url },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('Agent token route failed', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'No pudimos iniciar la conversación. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}
