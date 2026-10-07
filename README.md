# Cuéntame

**AI-generated bedtime stories, built around the moment a parent and child choose one together.**

🔗 **[Try it live](https://vercel-ai-gateway-demo-alpha-eosin.vercel.app)** — no signup required

---

## What it is

Cuéntame generates personalized stories for Colombian children aged 4–8. The parent and child pick a theme and an animal together; the app writes an original story around that pair, then hands the parent three questions to ask while reading.

The product thesis is that the shared choosing moment — not the story itself — is what parents are actually buying. Everything else is built to protect that moment.

## Why it's not a generic story generator

**Cognitive segmentation.** Two modes based on Piaget's developmental stages: *Modo Explorador* (ages 4–5, pre-readers) and *Modo Lector* (ages 6–8). Sentence length, vocabulary and narrative complexity differ between them.

**Dialogic reading built in.** Each story ships with a parent guide and a *Semilla de Conversación* — a question designed to sit inside the child's zone of proximal development (Vygotsky), so the parent scaffolds rather than just narrates.

**Rodari's Binomio Fantástico.** Story generation is seeded by forcing two unrelated elements together, which is what produces "an elephant from the Magdalena River who is also an astronaut" instead of another dragon.

**Colombian specificity is mandatory, not decorative.** Native fauna, real geography and regional speech are required elements in every generation — the Magdalena River, manatees, a heartbeat described as a cumbia drum. This is a differentiator, not localization.

**Persistent characters.** Every story ends with a *Para mañana* hook that carries a character forward. Continuity across sessions is the intended switching cost.

**Six narrative structures, chosen by age and theme.** The server picks the story's skeleton from six structures filtered for ages 4–8: Kishōtenketsu and Aesop-style fable for *Modo Explorador* (no antagonist — the hook is surprise, not fear); Dan Harmon's Story Circle, a simplified Hero's Journey and Murdock's inner-transformation arc for *Modo Lector*; and the four age-appropriate Booker plots in both. The theme the family picks narrows the choice. See [`lib/story.ts`](lib/story.ts).

## Stack

- Next.js 15 (App Router) on Vercel
- Anthropic API (`claude-haiku-4-5`) via a server-side route — the key never reaches the browser
- Prompt assembled on the server: the browser sends only the child's profile, inputs are validated against an allowlist, and the token budget is fixed server-side
- Web Audio API for generative ambient pentatonic music
- Day/night theming tied to reading context

## Context

Built as the venture project for MBAE-4505 (Innovación, Emprendimiento y Venture Investment), Executive MBA, Universidad de los Andes — with Leidy Ferro and Juan Carlos Torres. Scored 4.7/5 at first review.

Pedagogical framing is aligned to Colombia's MEN curriculum. Literary anchors: Rafael Pombo, Triunfo Arciniegas, Jairo Aníbal Niño.

---

*This is a working prototype, not a commercial product.*
