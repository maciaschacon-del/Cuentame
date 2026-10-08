# Cuéntame Voz — voice agent on ElevenAgents

**Status: first version, October 2026.** A conversational version of Cuéntame: a narrator talks with the child and the adult, they choose the story together, and she tells it aloud while the text appears on screen.

## Design decisions

- **The agent facilitates the choice; it does not replace it.** Cuéntame's thesis is that the shared moment of choosing is the product. The agent always addresses both people: the child picks the theme, the adult picks the animal, and the story does not start until both have chosen.
- **Claude Haiku 4.5 as the LLM**, the same model the web app uses. In voice, latency matters more than the last bit of prose quality.
- **Expressive Spanish voice.** `eleven_v3_conversational` with a Colombian voice; the deploy script falls back to a faster multilingual model if the API rejects it.
- **One client tool, `mostrar_cuento`.** The agent calls it right before narrating; the page renders the title, the story, the conversation seed and the "para mañana" hook.
- **Private agent.** Conversations only start with a short-lived signed URL minted by a server route (`app/api/agent-token`), so the ElevenLabs key never reaches the browser.
- **Built for children.** The prompt forbids asking for personal data beyond first name and age, keeps the agent on storytelling, and treats what the family says as story data rather than instructions. Audio recording is turned off, conversations are capped at 8 minutes, and the agent has a daily call limit.
- **Measured.** Every conversation is evaluated against three criteria: they chose together, the story had a Colombian element, and it was appropriate for a child.

## Files

- [`create_agent.py`](create_agent.py) — the agent as code: prompt, voice, tool, limits, privacy and evaluation criteria, pushed through the ElevenLabs REST API. Standard library only. Running it again updates the same agent.
- [`../app/api/agent-token/route.ts`](../app/api/agent-token/route.ts) — signed-URL route.
- [`../app/voz/page.tsx`](../app/voz/page.tsx) — the voice page, at `/voz`.

## Deploy

```bash
python3 create_agent.py
```

It asks for the ElevenLabs API key with a hidden prompt (ElevenAgents: Write, Voices: Read) and prints the agent ID. Then set two environment variables in Vercel and redeploy:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`

## Not done yet

- A mode where the adult reads from the screen and the agent stays silent (needs skip-turn handling so the reading is not taken as a new turn).
- Scripted conversation tests through the simulate-conversation API.
