import { NextResponse } from 'next/server';
import { buildStoryRequest, StoryInputError } from '@/lib/story';

const MODEL = 'claude-haiku-4-5-20251001';

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return NextResponse.json({ error: 'Servicio no configurado.' }, { status: 500 });
  }

  // The browser sends only the child's profile. The prompt, the narrative
  // structure and the token cap are decided here, on the server.
  let story;
  try {
    story = buildStoryRequest(await req.json());
  } catch (err) {
    const message = err instanceof StoryInputError ? err.message : 'Solicitud inválida.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: story.maxTokens,
        system: story.system,
        messages: [{ role: 'user', content: story.user }],
      }),
    });
    if (!response.ok) {
      console.error('Anthropic API error', response.status, await response.text());
      return NextResponse.json(
        { error: 'No pudimos escribir el cuento. Intenta de nuevo.' },
        { status: 502 }
      );
    }
    const data = await response.json();
    return NextResponse.json({
      text: data.content[0].text,
      mode: story.mode,
      structure: story.structure,
    });
  } catch (err) {
    console.error('Story route failed', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'No pudimos escribir el cuento. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}
