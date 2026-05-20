import { useState, useEffect, useRef } from "react";

// ─── AMBIENT MUSIC ───────────────────────────────────────────────────
class MusicPlayer {
  constructor() { this.ctx = null; this.active = false; this.tid = null; }
  note(f, t, dur, vol = 0.035) {
    if (!this.ctx || !this.active) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 700;
    o.connect(filt); filt.connect(g); g.connect(this.ctx.destination);
    o.type = 'sine'; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.15);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.start(t); o.stop(t + dur + 0.1);
  }
  play() {
    if (!this.active || !this.ctx) return;
    const s = [261.63, 293.66, 329.63, 392, 440, 523.25];
    const m = [[4,0.8],[2,0.6],[3,0.8],[1,0.6],[4,0.8],[5,1.0],[3,0.8],[0,1.2],[2,0.6],[3,0.8],[4,0.6],[2,0.8],[1,0.8],[0,1.4]];
    let t = this.ctx.currentTime + 0.1;
    m.forEach(([n, d]) => {
      this.note(s[n], t, d * 0.8);
      if (n > 0) this.note(s[n-1] * 0.5, t, d * 0.8, 0.012);
      t += d;
    });
    const total = m.reduce((a,[,d])=>a+d,0);
    this.tid = setTimeout(() => { if (this.active) this.play(); }, (total + 1.8) * 1000);
  }
  start() {
    if (this.active) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.active = true; this.play(); } catch(e){}
  }
  stop() {
    this.active = false;
    if (this.tid) clearTimeout(this.tid);
    if (this.ctx) { try { this.ctx.close(); } catch(e){} this.ctx = null; }
  }
}
const music = new MusicPlayer();

// ─── DATA ─────────────────────────────────────────────────────────────
const THEMES = [
  {id:'dinosaurios',label:'Dinosaurios',e:'🦕'},{id:'futbol',label:'Fútbol',e:'⚽'},
  {id:'espacio',label:'Espacio',e:'🚀'},{id:'mar',label:'Mar',e:'🌊'},
  {id:'superheroes',label:'Superhéroes',e:'🦸'},{id:'colombia',label:'Colombia',e:'🇨🇴'},
  {id:'arte',label:'Arte',e:'🎨'},{id:'magia',label:'Magia',e:'✨'},
  {id:'animales',label:'Animales',e:'🐾'},{id:'aventura',label:'Aventura',e:'🏔️'},
];
const ANIMALS = [
  {id:'perro',label:'Perro',e:'🐶'},{id:'gato',label:'Gato',e:'🐱'},
  {id:'leon',label:'León',e:'🦁'},{id:'delfin',label:'Delfín',e:'🐬'},
  {id:'mariposa',label:'Mariposa',e:'🦋'},{id:'dinosaurio',label:'Dino',e:'🦕'},
  {id:'zorro',label:'Zorro',e:'🦊'},{id:'loro',label:'Loro',e:'🦜'},
  {id:'oso',label:'Oso',e:'🐨'},{id:'elefante',label:'Elefante',e:'🐘'},
];

// ─── API ──────────────────────────────────────────────────────────────
async function generateStory(profile, isFinal) {
  const age = parseInt(profile.age);
  const mode = age <= 5 ? 'EXPLORADOR' : 'LECTOR';
  const wordCount = isFinal ? (mode==='EXPLORADOR' ? '150-200' : '350-450') : (mode==='EXPLORADOR' ? '100-140' : '200-280');
  const tema = THEMES.find(t=>t.id===profile.tema)?.label || profile.tema;
  const animal = ANIMALS.find(a=>a.id===profile.animal)?.label || profile.animal;

  const sys = `Eres el generador de cuentos de Cuéntame, plataforma educativa colombiana para padres e hijos de 4-8 años.

MODO: ${mode}
${mode==='EXPLORADOR'
  ? '- Oraciones simples: Sujeto+Verbo+Predicado, máximo 8 palabras\n- El PADRE leerá EN VOZ ALTA\n- Extensión: '+wordCount+' palabras'
  : '- Oraciones compuestas con 1-2 metáforas simples\n- El NIÑO leerá con papá o mamá presente\n- Extensión: '+wordCount+' palabras'}

PASOS OBLIGATORIOS EN ORDEN:
1. BINOMIO DE RODARI: Combina "${tema}" + "${animal}" → genera el giro sorpresivo central
2. ELEMENTO COLOMBIANO: Incluir OBLIGATORIAMENTE uno de: fauna nativa (oso de anteojos, guacamayo, tingua), geografía (sabana de Bogotá, río Magdalena, Chocó, páramo), modismo ('bacano', 'chimba', 'parce', 'qué nota')
3. GANCHO: El primer párrafo genera intriga inmediata
4. GIRO: El Binomio de Rodari se revela sorpresivamente a mitad del cuento
5. ESTRUCTURA: ${mode==='EXPLORADOR' ? 'Kishōtenketsu - 4 partes sin villano, enganche por sorpresa' : 'Círculo de Dan Harmon - 8 pasos: Tu/Necesidad/Ir/Buscar/Encontrar/Tomar/Regresar/Cambiar'}
6. CIERRE: Final positivo + Semilla de Conversación que conecta fantasía con realidad

FORMATO EXACTO (usar estos marcadores):
TÍTULO: [título creativo con el nombre del niño]
===CUENTO===
[texto]
===GUÍA===
${mode==='EXPLORADOR'
  ? 'P1 (antes de leer): [pregunta]\nP2 (a mitad): [pregunta]\nP3 (al final): [pregunta]'
  : 'RETO A MITAD: [instrucción exacta para el padre - qué preguntar]'}
===SEMILLA===
[UNA pregunta que conecta la fantasía con la realidad del niño]
===MAÑANA===
[Una frase sobre cómo continuar el personaje mañana]`;

  const usr = `Perfil del niño:
- Nombre: ${profile.name}
- Edad: ${age} años → Modo ${mode}
- Contexto geografico (NO mencionar en el cuento, solo calibrar referencias culturales y fauna regional): ${profile.city||'Colombia'}
- Tema elegido hoy: ${tema}
- Animal favorito: ${animal}
- Gusto especial: ${profile.gusto||'aventuras'}
- Mascota o amigo especial: ${profile.mascota||'(ninguno mencionado)'}

REGLAS CRÍTICAS:
✓ El protagonista SIEMPRE se llama ${profile.name}
✓ El ${animal} es el aliado principal
✓ Elemento colombiano OBLIGATORIO
✓ Aplicar Binomio de Rodari: ${tema} + ${animal}
✗ Sin violencia, sin villanos aterradores, sin tristeza profunda`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-20250514",
      max_tokens: isFinal ? 1200 : 700,
      system: sys,
      messages:[{role:"user",content:usr}]
    })
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const d = await res.json();
  return d.content[0].text;
}

function parseStory(text) {
  const get = (a, b) => {
    const i = text.indexOf(a);
    if (i===-1) return '';
    const rest = text.slice(i+a.length);
    const j = b ? rest.indexOf(b) : rest.length;
    return (j===-1?rest:rest.slice(0,j)).trim();
  };
  const tm = text.match(/TÍTULO:\s*(.+)/);
  return {
    title: tm ? tm[1].trim() : 'El cuento de hoy',
    content: get('===CUENTO===','===GUÍA==='),
    guide: get('===GUÍA===','===SEMILLA==='),
    semilla: get('===SEMILLA===','===MAÑANA==='),
    tomorrow: get('===MAÑANA==='),
  };
}

// ─── DESIGN ───────────────────────────────────────────────────────────
const C = {
  bg:'#FFF8ED', orange:'#D97706', orangeDk:'#B45309', orangeLt:'#FDE68A',
  teal:'#0D9488', tealLt:'#CCFBF1', dark:'#1C0A00', mid:'#78350F',
  muted:'#A16207', card:'#FFFFFF', green:'#15803D', greenLt:'#F0FDF4',
};
const s = {
  page: { minHeight:'100vh', background:C.bg, fontFamily:'"Georgia",serif', position:'relative' },
  screen: { maxWidth:460, margin:'0 auto', padding:'20px 18px', minHeight:'100vh', display:'flex', flexDirection:'column' },
  card: { background:C.card, borderRadius:16, border:`1.5px solid ${C.orangeLt}`, padding:'18px', boxShadow:'0 4px 20px rgba(217,119,6,0.1)' },
  btn: (bg=C.orange) => ({ background:bg, color:'white', border:'none', borderRadius:99, padding:'14px 28px', fontSize:16, fontWeight:'bold', cursor:'pointer', fontFamily:'"Georgia",serif', width:'100%' }),
  btnOut: { background:'transparent', color:C.orange, border:`2px solid ${C.orange}`, borderRadius:99, padding:'11px 24px', fontSize:14, fontWeight:'bold', cursor:'pointer', fontFamily:'"Georgia",serif', width:'100%' },
  input: { width:'100%', padding:'11px 14px', borderRadius:11, border:`1.5px solid ${C.orangeLt}`, fontSize:15, fontFamily:'"Georgia",serif', color:C.dark, background:C.bg, boxSizing:'border-box', outline:'none' },
  lbl: { fontSize:12, fontWeight:'bold', color:C.muted, marginBottom:5, display:'block', fontFamily:'system-ui,sans-serif', letterSpacing:'0.06em', textTransform:'uppercase' },
  chip: (sel, accent=C.orange, lt=C.orangeLt) => ({ padding:'9px 10px', borderRadius:11, border:`2px solid ${sel?accent:C.orangeLt}`, background:sel?lt:C.card, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }),
  back: { background:'none', border:'none', cursor:'pointer', fontSize:13, color:C.muted, padding:'0 0 14px', fontFamily:'system-ui', textAlign:'left' },
  badge: (bg, color) => ({ background:bg, color, borderRadius:99, padding:'4px 12px', fontSize:11, fontFamily:'system-ui', fontWeight:'bold' }),
};

// ─── SCREENS ──────────────────────────────────────────────────────────
function Welcome({ onStart, musicOn, toggleMusic }) {
  return (
    <div style={{...s.screen, justifyContent:'center', alignItems:'center', textAlign:'center'}}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>
        {['✦','✧','★','✦','✧','✦'].map((ch,i)=>(
          <span key={i} style={{position:'absolute',fontSize:`${[14,10,18,12,16,11][i]}px`,color:'#F5C518',opacity:0.3,
            left:`${[12,82,45,90,25,60][i]}%`,top:`${[8,12,65,48,88,30][i]}%`}}>{ch}</span>
        ))}
      </div>
      <span style={{fontSize:72,display:'block',marginBottom:12}}>📖</span>
      <h1 style={{fontSize:46,fontWeight:'bold',color:C.dark,margin:'0 0 8px'}}>Cuéntame</h1>
      <p style={{fontSize:17,color:C.mid,fontStyle:'italic',margin:'0 0 8px',lineHeight:1.5}}>
        Cuentos personalizados que unen<br/>a padres e hijos
      </p>
      <div style={{background:C.orangeLt,borderRadius:11,padding:'10px 18px',margin:'16px 0',fontSize:13,color:C.mid,fontFamily:'system-ui'}}>
        🇨🇴 Hecho con amor para familias colombianas<br/>
        Para niños de 4 a 8 años · 10 minutos al día
      </div>
      <button style={s.btn()} onClick={onStart}>✨ Empezar nuestra historia</button>
      <button style={{...s.btnOut, marginTop:10}} onClick={toggleMusic}>
        {musicOn ? '🔇 Silenciar música' : '🎵 Activar música de fondo'}
      </button>
    </div>
  );
}

function Profile({ profile, setProfile, onNext, onBack }) {
  const u = (k,v) => setProfile(p=>({...p,[k]:v}));
  const age = parseInt(profile.age);
  return (
    <div style={s.screen}>
      <button style={s.back} onClick={onBack}>← Volver</button>
      <h2 style={{fontSize:26,fontWeight:'bold',color:C.dark,margin:'0 0 4px'}}>¿Quién va a leer hoy?</h2>
      <p style={{fontSize:15,color:C.mid,fontStyle:'italic',margin:'0 0 20px'}}>Cuéntanos sobre el niño o la niña</p>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div>
          <label style={s.lbl}>Nombre del niño o niña</label>
          <input style={s.input} placeholder="ej. Valentina" value={profile.name} onChange={e=>u('name',e.target.value)}/>
        </div>
        <div>
          <label style={s.lbl}>Edad</label>
          <div style={{display:'flex',gap:6}}>
            {[4,5,6,7,8].map(a=>(
              <button key={a} onClick={()=>u('age',String(a))} style={{flex:1,padding:'10px 2px',borderRadius:11,
                border:`2px solid ${profile.age===String(a)?C.orange:C.orangeLt}`,
                background:profile.age===String(a)?C.orangeLt:C.card,
                cursor:'pointer',fontFamily:'system-ui',fontWeight:'bold',fontSize:13,
                color:profile.age===String(a)?C.orangeDk:C.mid}}>
                {a} años
              </button>
            ))}
          </div>
        </div>
        {profile.age && (
          <div style={{background:age<=5?C.orangeLt:C.tealLt,borderRadius:11,padding:'11px 14px',fontSize:13,color:C.mid,fontFamily:'system-ui'}}>
            {age<=5
              ? '📖 Modo Explorador: papá o mamá leerá el cuento en voz alta'
              : '📚 Modo Lector: el niño lee con papá o mamá acompañando'}
          </div>
        )}
        <div>
          <label style={s.lbl}>Ciudad o municipio <span style={{fontWeight:'normal',textTransform:'none'}}>(opcional)</span></label>
          <input style={s.input} placeholder="ej. Barranquilla" value={profile.city} onChange={e=>u('city',e.target.value)}/>
        </div>
        <div>
          <label style={s.lbl}>Mascota o mejor amigo <span style={{fontWeight:'normal',textTransform:'none'}}>(opcional)</span></label>
          <input style={s.input} placeholder="ej. Max, el perro de la familia" value={profile.mascota} onChange={e=>u('mascota',e.target.value)}/>
        </div>
      </div>
      <div style={{flex:1}}/>
      <button style={{...s.btn(),marginTop:20,opacity:profile.name&&profile.age?1:0.5}} onClick={onNext} disabled={!profile.name||!profile.age}>
        Continuar →
      </button>
    </div>
  );
}

function Theme({ profile, setProfile, onNext, onBack }) {
  const u = (k,v) => setProfile(p=>({...p,[k]:v}));
  const tema = THEMES.find(t=>t.id===profile.tema);
  const animal = ANIMALS.find(a=>a.id===profile.animal);
  return (
    <div style={s.screen}>
      <button style={s.back} onClick={onBack}>← Volver</button>
      <h2 style={{fontSize:24,fontWeight:'bold',color:C.dark,margin:'0 0 4px'}}>
        ¿De qué será el cuento<br/>de hoy, {profile.name}?
      </h2>
      <p style={{fontSize:14,color:C.mid,fontStyle:'italic',margin:'0 0 16px'}}>Elige juntos — papá, mamá y {profile.name}</p>
      <div>
        <label style={s.lbl}>Tema del cuento</label>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:7}}>
          {THEMES.map(t=>(
            <button key={t.id} onClick={()=>u('tema',t.id)} style={s.chip(profile.tema===t.id)}>
              <span style={{fontSize:22}}>{t.e}</span>
              <span style={{fontSize:10,color:C.mid,fontFamily:'system-ui',textAlign:'center',lineHeight:1.2}}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{marginTop:16}}>
        <label style={s.lbl}>Animal favorito del cuento</label>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:7}}>
          {ANIMALS.map(a=>(
            <button key={a.id} onClick={()=>u('animal',a.id)} style={s.chip(profile.animal===a.id)}>
              <span style={{fontSize:22}}>{a.e}</span>
              <span style={{fontSize:10,color:C.mid,fontFamily:'system-ui',textAlign:'center',lineHeight:1.2}}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
      {tema && animal && (
        <div style={{background:C.orangeLt,borderRadius:11,padding:'11px 14px',marginTop:14,fontSize:13,color:C.mid,fontFamily:'system-ui'}}>
          ✨ <strong>Binomio de Rodari:</strong> {tema.label} + {animal.label} = ¡historia única para {profile.name}!
        </div>
      )}
      <div style={{flex:1}}/>
      <button style={{...s.btn(),marginTop:20,opacity:profile.tema&&profile.animal?1:0.5}} onClick={onNext} disabled={!profile.tema||!profile.animal}>
        ¡Crear nuestro cuento! ✨
      </button>
    </div>
  );
}

function ModelChoice({ isFinal, setIsFinal, onGenerate, onBack, loading }) {
  return (
    <div style={s.screen}>
      <button style={s.back} onClick={onBack}>← Volver</button>
      <h2 style={{fontSize:24,fontWeight:'bold',color:C.dark,margin:'0 0 4px'}}>¿Cómo quieres el cuento?</h2>
      <p style={{fontSize:14,color:C.mid,fontStyle:'italic',margin:'0 0 20px'}}>Elige la versión que más les guste</p>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {[
          {val:false,icon:'⚡',title:'Cuento rápido',desc:'Listo en ~10 segundos. Perfecto para la primera vez o cuando el niño ya está impaciente.'},
          {val:true,icon:'✨',title:'Cuento completo',desc:'Más detallado y literario. Incluye guía del padre y Semilla de Conversación. ~25 segundos.',teal:true},
        ].map(opt=>(
          <button key={String(opt.val)} onClick={()=>setIsFinal(opt.val)} style={{
            ...s.card, border:`2px solid ${isFinal===opt.val?(opt.teal?C.teal:C.orange):C.orangeLt}`,
            background:isFinal===opt.val?(opt.teal?C.tealLt:C.orangeLt):C.card,
            cursor:'pointer', textAlign:'left', width:'100%',
          }}>
            <div style={{fontSize:22,marginBottom:6}}>{opt.icon}</div>
            <div style={{fontWeight:'bold',color:C.dark,fontSize:15,marginBottom:4}}>{opt.title}</div>
            <div style={{fontSize:13,color:C.muted,fontFamily:'system-ui',lineHeight:1.5}}>{opt.desc}</div>
          </button>
        ))}
      </div>
      <div style={{flex:1}}/>
      <button style={{...s.btn(loading?C.muted:C.orange),marginTop:20,opacity:loading?0.7:1}} onClick={onGenerate} disabled={loading}>
        {loading ? '✨ Escribiendo el cuento...' : '📖 ¡Crear el cuento!'}
      </button>
    </div>
  );
}

function Generating({ profile }) {
  const [dots, setDots] = useState('');
  const [phase, setPhase] = useState(0);
  const tema = THEMES.find(t=>t.id===profile.tema)?.label||profile.tema;
  const animal = ANIMALS.find(a=>a.id===profile.animal)?.label||profile.animal;
  const phases = [
    `Preparando la historia de ${profile.name}...`,
    `Mezclando ${tema} con ${animal}...`,
    'Añadiendo magia colombiana...',
    'Dando los últimos toques...',
  ];
  useEffect(()=>{
    const d = setInterval(()=>setDots(v=>v.length>=3?'':v+'.'),400);
    const p = setInterval(()=>setPhase(v=>(v+1)%phases.length),2500);
    return ()=>{clearInterval(d);clearInterval(p);};
  },[]);
  return (
    <div style={{...s.screen,justifyContent:'center',alignItems:'center',textAlign:'center'}}>
      <span style={{fontSize:72,display:'block',marginBottom:20}}>✍️</span>
      <h2 style={{fontSize:22,fontWeight:'bold',color:C.dark,marginBottom:10}}>Escribiendo tu cuento{dots}</h2>
      <p style={{fontSize:14,color:C.mid,fontStyle:'italic',fontFamily:'system-ui',maxWidth:260,lineHeight:1.6}}>{phases[phase]}</p>
      <div style={{marginTop:28,display:'flex',gap:8,justifyContent:'center'}}>
        {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:C.orange,opacity:phase%3===i?1:0.3,transition:'opacity 0.3s'}}/>)}
      </div>
    </div>
  );
}

function Reading({ story, profile, onNew }) {
  const [showGuide, setShowGuide] = useState(false);
  const age = parseInt(profile.age);
  const mode = age<=5?'EXPLORADOR':'LECTOR';
  return (
    <div style={s.screen}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <span style={s.badge(mode==='EXPLORADOR'?C.orangeLt:C.tealLt, mode==='EXPLORADOR'?C.orangeDk:C.teal)}>
          {mode==='EXPLORADOR'?'📖 Papá lee en voz alta':'📚 Modo Lector'}
        </span>
        <button onClick={onNew} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:C.muted,fontFamily:'system-ui'}}>
          + Nuevo cuento
        </button>
      </div>

      <div style={{...s.card,marginBottom:14,textAlign:'center'}}>
        <h2 style={{fontSize:20,fontWeight:'bold',color:C.dark,margin:0}}>{story.title}</h2>
      </div>

      <div style={{...s.card,marginBottom:14}}>
        <p style={{fontSize:16,lineHeight:1.95,color:C.dark,margin:0,whiteSpace:'pre-wrap'}}>{story.content}</p>
      </div>

      {story.semilla && (
        <div style={{background:C.orangeLt,borderRadius:14,padding:'14px',border:`1.5px solid ${C.orange}`,marginBottom:14}}>
          <div style={{fontWeight:'bold',color:C.orangeDk,marginBottom:7,fontFamily:'system-ui',fontSize:12,textTransform:'uppercase',letterSpacing:'0.06em'}}>
            🌱 Semilla de Conversación
          </div>
          <p style={{color:C.mid,margin:0,fontSize:15,fontStyle:'italic',lineHeight:1.6}}>{story.semilla}</p>
        </div>
      )}

      {story.guide && (
        <div style={{marginBottom:14}}>
          <button style={s.btnOut} onClick={()=>setShowGuide(!showGuide)}>
            {showGuide?'▲ Ocultar':'▼ Ver'} guía del padre / madre
          </button>
          {showGuide && (
            <div style={{...s.card,marginTop:8}}>
              <div style={{fontWeight:'bold',color:C.teal,marginBottom:8,fontFamily:'system-ui',fontSize:12,textTransform:'uppercase',letterSpacing:'0.06em'}}>
                📋 Guía de acompañamiento
              </div>
              <div style={{fontSize:14,color:C.mid,whiteSpace:'pre-wrap',lineHeight:1.7,fontFamily:'system-ui'}}>{story.guide}</div>
            </div>
          )}
        </div>
      )}

      {story.tomorrow && (
        <div style={{background:C.greenLt,borderRadius:14,padding:'13px',border:'1.5px solid #86EFAC',marginBottom:14}}>
          <div style={{fontWeight:'bold',color:C.green,marginBottom:6,fontFamily:'system-ui',fontSize:12,textTransform:'uppercase',letterSpacing:'0.06em'}}>
            🌙 Para mañana
          </div>
          <p style={{color:C.green,margin:0,fontSize:14,fontFamily:'system-ui',lineHeight:1.5}}>{story.tomorrow}</p>
        </div>
      )}

      <button style={s.btn()} onClick={onNew}>✨ Crear otro cuento</button>
      <div style={{height:20}}/>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [profile, setProfile] = useState({name:'',age:'',city:'',tema:'',animal:'',gusto:'',mascota:''});
  const [story, setStory] = useState(null);
  const [isFinal, setIsFinal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [musicOn, setMusicOn] = useState(false);

  const toggleMusic = () => {
    if (musicOn) { music.stop(); setMusicOn(false); }
    else { music.start(); setMusicOn(true); }
  };

  const handleGenerate = async () => {
    setLoading(true); setError(null); setScreen('generating');
    try {
      const raw = await generateStory(profile, isFinal);
      setStory(parseStory(raw));
      setScreen('reading');
    } catch(e) {
      setError('No se pudo generar el cuento: ' + e.message);
      setScreen('model');
    } finally { setLoading(false); }
  };

  const resetForNew = () => {
    setProfile(p=>({...p,tema:'',animal:''}));
    setStory(null); setScreen('theme');
  };

  return (
    <div style={s.page}>
      {error && (
        <div style={{background:'#FEE2E2',color:'#991B1B',padding:'12px 20px',fontSize:13,fontFamily:'system-ui',textAlign:'center'}}>
          ⚠️ {error}
        </div>
      )}
      {screen==='welcome'    && <Welcome onStart={()=>setScreen('profile')} musicOn={musicOn} toggleMusic={toggleMusic}/>}
      {screen==='profile'    && <Profile profile={profile} setProfile={setProfile} onNext={()=>setScreen('theme')} onBack={()=>setScreen('welcome')}/>}
      {screen==='theme'      && <Theme profile={profile} setProfile={setProfile} onNext={()=>setScreen('model')} onBack={()=>setScreen('profile')}/>}
      {screen==='model'      && <ModelChoice isFinal={isFinal} setIsFinal={setIsFinal} onGenerate={handleGenerate} onBack={()=>setScreen('theme')} loading={loading}/>}
      {screen==='generating' && <Generating profile={profile}/>}
      {screen==='reading'    && story && <Reading story={story} profile={profile} isFinal={isFinal} onNew={resetForNew}/>}

      {screen!=='welcome' && (
        <button onClick={toggleMusic} title={musicOn?'Silenciar':'Música'} style={{
          position:'fixed',bottom:22,right:18,zIndex:99,
          background:musicOn?C.orange:C.card, color:musicOn?'white':C.orange,
          border:`2px solid ${C.orange}`,borderRadius:'50%',width:46,height:46,
          fontSize:18,cursor:'pointer',boxShadow:'0 4px 14px rgba(217,119,6,0.3)',
        }}>
          {musicOn?'🔇':'🎵'}
        </button>
      )}
    </div>
  );
}
