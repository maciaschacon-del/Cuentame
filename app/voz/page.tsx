'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { ConversationProvider, useConversation } from '@elevenlabs/react';

type Story = { titulo: string; cuento: string; semilla: string; para_manana: string };
type Line = { who: 'agente' | 'familia'; text: string };

const C = {
  bg: '#FFF8ED', orange: '#D97706', orangeDk: '#B45309', orangeLt: '#FDE68A',
  teal: '#0D9488', dark: '#1C0A00', mid: '#78350F', muted: '#A16207',
  card: '#FFFFFF', green: '#15803D', greenLt: '#F0FDF4',
};

const text = (value: unknown) => (typeof value === 'string' ? value : '');

function VoiceStory() {
  const [story, setStory] = useState<Story | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // The agent calls this tool right before narrating, so the family can read along.
  const clientTools = useMemo(
    () => ({
      mostrar_cuento: (params: Record<string, unknown>) => {
        setStory({
          titulo: text(params.titulo) || 'El cuento de hoy',
          cuento: text(params.cuento),
          semilla: text(params.semilla),
          para_manana: text(params.para_manana),
        });
        return 'El cuento ya está en la pantalla.';
      },
    }),
    []
  );

  const conversation = useConversation({
    clientTools,
    onMessage: (m: { message?: string; source?: string; role?: string }) => {
      const msg = text(m.message).trim();
      if (!msg) return;
      const fromUser = (m.source ?? m.role) === 'user';
      setLines((prev) => [...prev.slice(-5), { who: fromUser ? 'familia' : 'agente', text: msg }]);
    },
    onError: (message: string) => setError(message || 'Se interrumpió la conversación.'),
  });

  const connected = conversation.status === 'connected';

  const start = useCallback(async () => {
    setError(null);
    setStory(null);
    setLines([]);
    setStarting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Necesitamos permiso para usar el micrófono. Actívalo en el navegador e intenta de nuevo.');
      setStarting(false);
      return;
    }
    try {
      const res = await fetch('/api/agent-token', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.signedUrl) throw new Error(data.error || `Error ${res.status}`);
      conversation.startSession({ signedUrl: data.signedUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos iniciar la conversación.');
    } finally {
      setStarting(false);
    }
  }, [conversation]);

  const card: React.CSSProperties = {
    background: C.card, borderRadius: 16, border: `1.5px solid ${C.orangeLt}`,
    padding: 18, boxShadow: '0 4px 20px rgba(217,119,6,0.1)',
  };
  const btn = (bg: string): React.CSSProperties => ({
    background: bg, color: 'white', border: 'none', borderRadius: 99, padding: '14px 28px',
    fontSize: 16, fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Georgia, serif', width: '100%',
  });
  const label: React.CSSProperties = {
    fontWeight: 'bold', marginBottom: 7, fontFamily: 'system-ui, sans-serif', fontSize: 12,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia, serif', color: C.dark }}>
      <div style={{ maxWidth: 460, margin: '0 auto', padding: '24px 18px 40px' }}>
        <Link href="/" style={{ fontSize: 13, color: C.muted, fontFamily: 'system-ui, sans-serif', textDecoration: 'none' }}>
          ← Volver a Cuéntame
        </Link>
        <div style={{ textAlign: 'center', margin: '18px 0 20px' }}>
          <span style={{ fontSize: 56, display: 'block' }}>🎙️</span>
          <h1 style={{ fontSize: 34, margin: '6px 0 6px' }}>Cuéntame, en voz</h1>
          <p style={{ fontSize: 15, color: C.mid, fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
            Una narradora conversa con los dos, eligen juntos el tema y el animal, y les cuenta el cuento.
          </p>
        </div>

        {error && (
          <div role="alert" style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: 12, fontSize: 13, fontFamily: 'system-ui, sans-serif', marginBottom: 14 }}>
            {error}
          </div>
        )}

        {!connected ? (
          <button style={{ ...btn(C.orange), opacity: starting ? 0.7 : 1 }} onClick={start} disabled={starting || conversation.status === 'connecting'}>
            {starting || conversation.status === 'connecting' ? 'Conectando…' : '✨ Empezar a conversar'}
          </button>
        ) : (
          <div style={{ ...card, textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, color: conversation.isSpeaking ? C.orangeDk : C.teal, fontFamily: 'system-ui, sans-serif', fontWeight: 'bold', marginBottom: 12 }}>
              {conversation.isSpeaking ? '🗣️ Cuéntame está hablando' : '👂 Los escucho'}
            </div>
            <button style={btn(C.mid)} onClick={() => conversation.endSession()}>Terminar</button>
          </div>
        )}

        {story && (
          <>
            <div style={{ ...card, textAlign: 'center', margin: '14px 0' }}>
              <h2 style={{ fontSize: 20, margin: 0 }}>{story.titulo}</h2>
            </div>
            <div style={{ ...card, marginBottom: 14 }}>
              <p style={{ fontSize: 16, lineHeight: 1.95, margin: 0, whiteSpace: 'pre-wrap' }}>{story.cuento}</p>
            </div>
            {story.semilla && (
              <div style={{ background: C.orangeLt, borderRadius: 14, padding: 14, border: `1.5px solid ${C.orange}`, marginBottom: 14 }}>
                <div style={{ ...label, color: C.orangeDk }}>🌱 Semilla de Conversación</div>
                <p style={{ color: C.mid, margin: 0, fontSize: 15, fontStyle: 'italic', lineHeight: 1.6 }}>{story.semilla}</p>
              </div>
            )}
            {story.para_manana && (
              <div style={{ background: C.greenLt, borderRadius: 14, padding: 13, border: '1.5px solid #86EFAC', marginBottom: 14 }}>
                <div style={{ ...label, color: C.green }}>🌙 Para mañana</div>
                <p style={{ color: C.green, margin: 0, fontSize: 14, fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>{story.para_manana}</p>
              </div>
            )}
          </>
        )}

        {connected && !story && lines.length > 0 && (
          <div style={{ ...card, marginTop: 14 }}>
            {lines.map((l, i) => (
              <p key={i} style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.5, fontFamily: 'system-ui, sans-serif', color: l.who === 'agente' ? C.mid : C.teal }}>
                <strong>{l.who === 'agente' ? 'Cuéntame: ' : 'Ustedes: '}</strong>{l.text}
              </p>
            ))}
          </div>
        )}

        <p style={{ fontSize: 12, color: C.muted, fontFamily: 'system-ui, sans-serif', textAlign: 'center', marginTop: 22, lineHeight: 1.6 }}>
          Versión beta. Usa el micrófono de este dispositivo y la conversación se procesa con ElevenLabs.
          Pensada para que un adulto acompañe al niño.
        </p>
      </div>
    </main>
  );
}

export default function VozPage() {
  return (
    <ConversationProvider>
      <VoiceStory />
    </ConversationProvider>
  );
}
