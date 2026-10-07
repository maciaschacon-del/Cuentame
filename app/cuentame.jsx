import { useState, useEffect, useRef } from "react";

// ─── AMBIENT MUSIC ───────────────────────────────────────────────────
class MusicPlayer {
  constructor() { this.ctx = null; this.active = false; this.tid = null; }
  note(f, t, dur, vol = 0.03) {
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
  play(night = false) {
    if (!this.active || !this.ctx) return;
    const day  = [261.63,293.66,329.63,392,440,523.25];
    const nite = [130.81,146.83,164.81,196,220,261.63];
    const s = night ? nite : day;
    const m = night
      ? [[4,1.2],[2,1.0],[3,1.4],[1,1.0],[4,1.2],[5,1.6],[3,1.4],[0,2.0],[2,1.0],[1,1.4],[0,2.0]]
      : [[4,0.8],[2,0.6],[3,0.8],[1,0.6],[4,0.8],[5,1.0],[3,0.8],[0,1.2],[2,0.6],[3,0.8],[4,0.6],[2,0.8],[1,0.8],[0,1.4]];
    let t = this.ctx.currentTime + 0.1;
    m.forEach(([n,d]) => {
      this.note(s[n], t, d * 0.8, night ? 0.025 : 0.035);
      if (n > 0) this.note(s[n-1]*0.5, t, d*0.8, 0.01);
      t += d;
    });
    const total = m.reduce((a,[,d])=>a+d,0);
    this.tid = setTimeout(()=>{ if(this.active) this.play(night); },(total+2)*1000);
  }
  start(night=false) {
    if (this.active) { this.stop(); setTimeout(()=>this.start(night),200); return; }
    try { this.ctx = new (window.AudioContext||window.webkitAudioContext)(); this.active=true; this.play(night); } catch(e){}
  }
  stop() {
    this.active=false;
    if (this.tid) clearTimeout(this.tid);
    if (this.ctx) { try{this.ctx.close();}catch(e){} this.ctx=null; }
  }
}
const music = new MusicPlayer();

// ─── DATA ─────────────────────────────────────────────────────────────
const THEMES=[
  {id:'dinosaurios',label:'Dinosaurios',e:'🦕'},{id:'futbol',label:'Fútbol',e:'⚽'},
  {id:'espacio',label:'Espacio',e:'🚀'},{id:'mar',label:'Mar',e:'🌊'},
  {id:'superheroes',label:'Superhéroes',e:'🦸'},{id:'colombia',label:'Colombia',e:'🇨🇴'},
  {id:'arte',label:'Arte',e:'🎨'},{id:'magia',label:'Magia',e:'✨'},
  {id:'animales',label:'Animales',e:'🐾'},{id:'aventura',label:'Aventura',e:'🏔️'},
];
const ANIMALS=[
  {id:'perro',label:'Perro',e:'🐶'},{id:'gato',label:'Gato',e:'🐱'},
  {id:'leon',label:'León',e:'🦁'},{id:'delfin',label:'Delfín',e:'🐬'},
  {id:'mariposa',label:'Mariposa',e:'🦋'},{id:'dinosaurio',label:'Dino',e:'🦕'},
  {id:'zorro',label:'Zorro',e:'🦊'},{id:'loro',label:'Loro',e:'🦜'},
  {id:'oso',label:'Oso',e:'🐨'},{id:'elefante',label:'Elefante',e:'🐘'},
];

// ─── API ──────────────────────────────────────────────────────────────
async function generateStory(profile, isFinal) {
  // The prompt is assembled on the server (lib/story.ts). The browser only
  // sends the child's profile and the chosen length.
  const res=await fetch("/api/story",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      profile:{
        name:profile.name, age:parseInt(profile.age), city:profile.city,
        tema:profile.tema, animal:profile.animal,
        gusto:profile.gusto, mascota:profile.mascota,
      },
      isFinal,
    })
  });
  const d=await res.json().catch(()=>({}));
  if(!res.ok||d.error) throw new Error(d.error||`Error ${res.status}`);
  return d.text;
}

function parseStory(text) {
  const get=(a,b)=>{
    const i=text.indexOf(a); if(i===-1) return '';
    const rest=text.slice(i+a.length);
    const j=b?rest.indexOf(b):rest.length;
    return (j===-1?rest:rest.slice(0,j)).trim();
  };
  const tm=text.match(/TÍTULO:\s*(.+)/);
  return {
    title:tm?tm[1].trim():'El cuento de hoy',
    content:get('===CUENTO===','===GUÍA==='),
    guide:get('===GUÍA===','===SEMILLA==='),
    semilla:get('===SEMILLA===','===MAÑANA==='),
    tomorrow:get('===MAÑANA==='),
  };
}

// ─── THEME SYSTEM ─────────────────────────────────────────────────────
const DAY = {
  bg:'#FFF8ED', card:'#FFFFFF', border:'#FDE68A',
  primary:'#D97706', primaryDk:'#B45309', primaryLt:'#FDE68A',
  teal:'#0D9488', tealLt:'#CCFBF1',
  dark:'#1C0A00', mid:'#78350F', muted:'#A16207',
  green:'#15803D', greenLt:'#F0FDF4',
  text:'#1C0A00', textMid:'#78350F',
  btnText:'#FFFFFF', inputBg:'#FFF8ED',
  chipSel:'#FDE68A', chipSelBorder:'#D97706',
  modelA:'#FDE68A', modelABorder:'#D97706',
  modelB:'#CCFBF1', modelBBorder:'#0D9488',
  badge1bg:'#FDE68A', badge1c:'#B45309',
  badge2bg:'#CCFBF1', badge2c:'#0D9488',
  starColor:'#F5C518', starOpacity:0.25,
  rodari:'#FDE68A', rodariText:'#78350F',
  modeInfo1bg:'#FDE68A', modeInfo1c:'#78350F',
  modeInfo2bg:'#CCFBF1', modeInfo2c:'#0D9488',
  tomorrow:'#F0FDF4', tomorrowBorder:'#86EFAC', tomorrowText:'#15803D',
  errorBg:'#FEE2E2', errorText:'#991B1B',
};

const NIGHT = {
  bg:'#080D1F', card:'#0F1635', border:'#2D3A8C',
  primary:'#818CF8', primaryDk:'#4F46E5', primaryLt:'#1E1B4B',
  teal:'#34D399', tealLt:'#064E3B',
  dark:'#E2E8F0', mid:'#94A3B8', muted:'#64748B',
  green:'#34D399', greenLt:'#064E3B',
  text:'#E2E8F0', textMid:'#94A3B8',
  btnText:'#FFFFFF', inputBg:'#0F1635',
  chipSel:'#1E1B4B', chipSelBorder:'#818CF8',
  modelA:'#1E1B4B', modelABorder:'#818CF8',
  modelB:'#064E3B', modelBBorder:'#34D399',
  badge1bg:'#1E1B4B', badge1c:'#A5B4FC',
  badge2bg:'#064E3B', badge2c:'#34D399',
  starColor:'#F8FAFC', starOpacity:0.9,
  rodari:'#1E1B4B', rodariText:'#A5B4FC',
  modeInfo1bg:'#1E1B4B', modeInfo1c:'#A5B4FC',
  modeInfo2bg:'#064E3B', modeInfo2c:'#34D399',
  tomorrow:'#064E3B', tomorrowBorder:'#34D399', tomorrowText:'#6EE7B7',
  errorBg:'#450A0A', errorText:'#FCA5A5',
};

// ─── STARS ────────────────────────────────────────────────────────────
const STARS_DAY  = [{ch:'✦',l:12,t:8,sz:14},{ch:'✧',l:82,t:12,sz:10},{ch:'★',l:45,t:65,sz:18},{ch:'✦',l:90,t:48,sz:12},{ch:'✧',l:25,t:88,sz:16},{ch:'✦',l:60,t:30,sz:11}];
const STARS_NIGHT= [
  {l:5,t:5,sz:2},{l:15,t:20,sz:1.5},{l:25,t:8,sz:3},{l:35,t:35,sz:1.5},{l:45,t:12,sz:2.5},
  {l:55,t:45,sz:1.5},{l:65,t:18,sz:3},{l:75,t:30,sz:2},{l:85,t:8,sz:1.5},{l:92,t:55,sz:2.5},
  {l:10,t:60,sz:1.5},{l:20,t:75,sz:2},{l:30,t:90,sz:1.5},{l:40,t:80,sz:3},{l:50,t:70,sz:1.5},
  {l:60,t:85,sz:2.5},{l:70,t:65,sz:2},{l:80,t:78,sz:1.5},{l:90,t:88,sz:3},{l:8,t:40,sz:2},
  {l:18,t:50,sz:1.5},{l:48,t:55,sz:2},{l:72,t:50,sz:1.5},{l:88,t:35,sz:2.5},{l:38,t:15,sz:1.5},
];

function Stars({ night }) {
  if (!night) return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>
      {STARS_DAY.map((s,i)=>(
        <span key={i} style={{position:'absolute',fontSize:`${s.sz}px`,color:'#F5C518',opacity:0.25,left:`${s.l}%`,top:`${s.t}%`}}>{s.ch}</span>
      ))}
    </div>
  );
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>
      {STARS_NIGHT.map((s,i)=>(
        <div key={i} style={{
          position:'absolute',borderRadius:'50%',
          width:`${s.sz}px`,height:`${s.sz}px`,
          background:'#F8FAFC',
          left:`${s.l}%`,top:`${s.t}%`,
          animation:`twinkle ${1.5+Math.random()*2}s ease-in-out infinite`,
          animationDelay:`${Math.random()*3}s`,
          boxShadow:`0 0 ${s.sz*2}px ${s.sz}px rgba(248,250,252,0.4)`,
        }}/>
      ))}
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────
function getStyles(T) {
  return {
    screen: {maxWidth:460,margin:'0 auto',padding:'20px 18px',minHeight:'100vh',display:'flex',flexDirection:'column'},
    card: {background:T.card,borderRadius:16,border:`1.5px solid ${T.border}`,padding:'18px',transition:'background 0.4s,border 0.4s'},
    btn: (bg=T.primary) => ({background:bg,color:T.btnText,border:'none',borderRadius:99,padding:'14px 28px',fontSize:16,fontWeight:'bold',cursor:'pointer',fontFamily:'"Georgia",serif',width:'100%',transition:'background 0.3s'}),
    btnOut: {background:'transparent',color:T.primary,border:`2px solid ${T.primary}`,borderRadius:99,padding:'11px 24px',fontSize:14,fontWeight:'bold',cursor:'pointer',fontFamily:'"Georgia",serif',width:'100%'},
    input: {width:'100%',padding:'11px 14px',borderRadius:11,border:`1.5px solid ${T.border}`,fontSize:15,fontFamily:'"Georgia",serif',color:T.text,background:T.inputBg,boxSizing:'border-box',outline:'none'},
    lbl: {fontSize:12,fontWeight:'bold',color:T.muted,marginBottom:5,display:'block',fontFamily:'system-ui,sans-serif',letterSpacing:'0.06em',textTransform:'uppercase'},
    back: {background:'none',border:'none',cursor:'pointer',fontSize:13,color:T.muted,padding:'0 0 14px',fontFamily:'system-ui',textAlign:'left'},
    chip: (sel) => ({padding:'9px 10px',borderRadius:11,border:`2px solid ${sel?T.chipSelBorder:T.border}`,background:sel?T.chipSel:T.card,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,transition:'all 0.15s'}),
    age: (sel) => ({flex:1,padding:'10px 2px',borderRadius:11,border:`2px solid ${sel?T.primary:T.border}`,background:sel?T.chipSel:T.card,cursor:'pointer',fontFamily:'system-ui',fontWeight:'bold',fontSize:13,color:sel?T.primaryDk:T.mid}),
  };
}

// ─── TOGGLE BUTTON ────────────────────────────────────────────────────
function NightToggle({ night, onToggle, T }) {
  return (
    <button onClick={onToggle} title={night?'Cambiar a modo día':'Cambiar a modo noche'} style={{
      position:'fixed',top:16,right:16,zIndex:200,
      background:T.card,color:T.text,
      border:`1.5px solid ${T.border}`,
      borderRadius:'50%',width:44,height:44,
      fontSize:20,cursor:'pointer',
      boxShadow:night?'0 0 20px rgba(129,140,248,0.4)':'0 4px 12px rgba(217,119,6,0.2)',
      transition:'all 0.3s',
    }}>{night?'☀️':'🌙'}</button>
  );
}

function MusicBtn({ musicOn, onToggle, screen, T }) {
  if (screen==='welcome') return null;
  return (
    <button onClick={onToggle} title={musicOn?'Silenciar':'Activar música'} style={{
      position:'fixed',bottom:22,right:18,zIndex:200,
      background:musicOn?T.primary:T.card,
      color:musicOn?T.btnText:T.primary,
      border:`2px solid ${T.primary}`,borderRadius:'50%',
      width:46,height:46,fontSize:18,cursor:'pointer',
      boxShadow:T===NIGHT?'0 0 16px rgba(129,140,248,0.4)':'0 4px 14px rgba(217,119,6,0.3)',
      transition:'all 0.3s',
    }}>{musicOn?'🔇':'🎵'}</button>
  );
}

// ─── SCREENS ──────────────────────────────────────────────────────────
function Welcome({ onStart, musicOn, toggleMusic, night, T, S }) {
  return (
    <div style={{...S.screen,justifyContent:'center',alignItems:'center',textAlign:'center',position:'relative'}}>
      <Stars night={night}/>
      <div style={{position:'relative',zIndex:1,width:'100%',display:'flex',flexDirection:'column',alignItems:'center'}}>
        <span style={{fontSize:72,display:'block',marginBottom:12,filter:night?'drop-shadow(0 0 20px rgba(129,140,248,0.8))':'none'}}>{night?'🌙':'📖'}</span>
        <h1 style={{fontSize:46,fontWeight:'bold',color:T.text,margin:'0 0 8px',textShadow:night?'0 0 30px rgba(129,140,248,0.6)':'none'}}>Cuéntame</h1>
        <p style={{fontSize:17,color:T.textMid,fontStyle:'italic',margin:'0 0 8px',lineHeight:1.5}}>
          {night?'La hora del cuento de buenas noches':'Cuentos personalizados que unen'}<br/>
          {night?'con papá y mamá 🌟':'a padres e hijos'}
        </p>
        <div style={{background:T.primaryLt,borderRadius:11,padding:'10px 18px',margin:'16px 0',fontSize:13,color:T.textMid,fontFamily:'system-ui',border:`1px solid ${T.border}`}}>
          🇨🇴 Hecho con amor para familias colombianas<br/>
          Para niños de 4 a 8 años · 10 minutos al día
        </div>
        <button style={S.btn()} onClick={onStart}>{night?'🌙 Empezar el cuento de hoy':'✨ Empezar nuestra historia'}</button>
        <button style={{...S.btnOut,marginTop:10}} onClick={toggleMusic}>
          {musicOn?(night?'🔇 Silenciar':'🔇 Silenciar música'):(night?'🎵 Activar música nocturna':'🎵 Activar música de fondo')}
        </button>
      </div>
    </div>
  );
}

function Profile({ profile, setProfile, onNext, onBack, night, T, S }) {
  const u=(k,v)=>setProfile(p=>({...p,[k]:v}));
  const age=parseInt(profile.age);
  return (
    <div style={{...S.screen,position:'relative'}}>
      <Stars night={night}/>
      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',flex:1}}>
        <button style={S.back} onClick={onBack}>← Volver</button>
        <h2 style={{fontSize:26,fontWeight:'bold',color:T.text,margin:'0 0 4px'}}>¿Quién va a leer hoy?</h2>
        <p style={{fontSize:15,color:T.textMid,fontStyle:'italic',margin:'0 0 20px'}}>Cuéntanos sobre el niño o la niña</p>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label style={S.lbl}>Nombre del niño o niña</label>
            <input style={S.input} placeholder="ej. Valentina" value={profile.name} onChange={e=>u('name',e.target.value)}/>
          </div>
          <div>
            <label style={S.lbl}>Edad</label>
            <div style={{display:'flex',gap:6}}>
              {[4,5,6,7,8].map(a=>(
                <button key={a} onClick={()=>u('age',String(a))} style={S.age(profile.age===String(a))}>{a} años</button>
              ))}
            </div>
          </div>
          {profile.age && (
            <div style={{background:age<=5?T.modeInfo1bg:T.modeInfo2bg,borderRadius:11,padding:'11px 14px',fontSize:13,color:age<=5?T.modeInfo1c:T.modeInfo2c,fontFamily:'system-ui'}}>
              {age<=5?'📖 Modo Explorador: papá o mamá leerá en voz alta':'📚 Modo Lector: el niño lee con papá o mamá acompañando'}
            </div>
          )}
          <div>
            <label style={S.lbl}>Ciudad o municipio <span style={{fontWeight:'normal',textTransform:'none'}}>(opcional)</span></label>
            <input style={S.input} placeholder="ej. Barranquilla" value={profile.city} onChange={e=>u('city',e.target.value)}/>
          </div>
          <div>
            <label style={S.lbl}>Mascota o mejor amigo <span style={{fontWeight:'normal',textTransform:'none'}}>(opcional)</span></label>
            <input style={S.input} placeholder="ej. Max, el perro de la familia" value={profile.mascota} onChange={e=>u('mascota',e.target.value)}/>
          </div>
        </div>
        <div style={{flex:1}}/>
        <button style={{...S.btn(),marginTop:20,opacity:profile.name&&profile.age?1:0.5}} onClick={onNext} disabled={!profile.name||!profile.age}>
          Continuar →
        </button>
      </div>
    </div>
  );
}

function Theme({ profile, setProfile, onNext, onBack, night, T, S }) {
  const u=(k,v)=>setProfile(p=>({...p,[k]:v}));
  const tema=THEMES.find(t=>t.id===profile.tema);
  const animal=ANIMALS.find(a=>a.id===profile.animal);
  return (
    <div style={{...S.screen,position:'relative'}}>
      <Stars night={night}/>
      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',flex:1}}>
        <button style={S.back} onClick={onBack}>← Volver</button>
        <h2 style={{fontSize:24,fontWeight:'bold',color:T.text,margin:'0 0 4px'}}>
          ¿De qué será el cuento<br/>de hoy, {profile.name}?
        </h2>
        <p style={{fontSize:14,color:T.textMid,fontStyle:'italic',margin:'0 0 16px'}}>Elige juntos — papá, mamá y {profile.name}</p>
        <div>
          <label style={S.lbl}>Tema del cuento</label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:7}}>
            {THEMES.map(t=>(
              <button key={t.id} onClick={()=>u('tema',t.id)} style={S.chip(profile.tema===t.id)}>
                <span style={{fontSize:22}}>{t.e}</span>
                <span style={{fontSize:10,color:T.textMid,fontFamily:'system-ui',textAlign:'center',lineHeight:1.2}}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{marginTop:16}}>
          <label style={S.lbl}>Animal favorito del cuento</label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:7}}>
            {ANIMALS.map(a=>(
              <button key={a.id} onClick={()=>u('animal',a.id)} style={S.chip(profile.animal===a.id)}>
                <span style={{fontSize:22}}>{a.e}</span>
                <span style={{fontSize:10,color:T.textMid,fontFamily:'system-ui',textAlign:'center',lineHeight:1.2}}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
        {tema&&animal&&(
          <div style={{background:T.rodari,borderRadius:11,padding:'11px 14px',marginTop:14,fontSize:13,color:T.rodariText,fontFamily:'system-ui',border:`1px solid ${T.border}`}}>
            ✨ <strong>Binomio de Rodari:</strong> {tema.label} + {animal.label} = ¡historia única para {profile.name}!
          </div>
        )}
        <div style={{flex:1}}/>
        <button style={{...S.btn(),marginTop:20,opacity:profile.tema&&profile.animal?1:0.5}} onClick={onNext} disabled={!profile.tema||!profile.animal}>
          ¡Crear nuestro cuento! ✨
        </button>
      </div>
    </div>
  );
}

function ModelChoice({ isFinal, setIsFinal, onGenerate, onBack, loading, night, T, S }) {
  return (
    <div style={{...S.screen,position:'relative'}}>
      <Stars night={night}/>
      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',flex:1}}>
        <button style={S.back} onClick={onBack}>← Volver</button>
        <h2 style={{fontSize:24,fontWeight:'bold',color:T.text,margin:'0 0 4px'}}>¿Cómo quieres el cuento?</h2>
        <p style={{fontSize:14,color:T.textMid,fontStyle:'italic',margin:'0 0 20px'}}>Elige la versión que más les guste</p>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {[
            {val:false,icon:'⚡',title:'Cuento rápido',desc:'Listo en ~10 segundos. Perfecto para la primera vez o cuando el niño ya está impaciente.',bg:T.modelA,border:T.modelABorder},
            {val:true,icon:night?'🌙':'✨',title:'Cuento completo',desc:'Más detallado y literario. Incluye guía del padre y Semilla de Conversación. ~25 segundos.',bg:T.modelB,border:T.modelBBorder},
          ].map(opt=>(
            <button key={String(opt.val)} onClick={()=>setIsFinal(opt.val)} style={{
              ...S.card,
              border:`2px solid ${isFinal===opt.val?opt.border:T.border}`,
              background:isFinal===opt.val?opt.bg:T.card,
              cursor:'pointer',textAlign:'left',width:'100%',
            }}>
              <div style={{fontSize:22,marginBottom:6}}>{opt.icon}</div>
              <div style={{fontWeight:'bold',color:T.text,fontSize:15,marginBottom:4}}>{opt.title}</div>
              <div style={{fontSize:13,color:T.muted,fontFamily:'system-ui',lineHeight:1.5}}>{opt.desc}</div>
            </button>
          ))}
        </div>
        <div style={{flex:1}}/>
        <button style={{...S.btn(loading?T.muted:T.primary),marginTop:20,opacity:loading?0.7:1}} onClick={onGenerate} disabled={loading}>
          {loading?'✨ Escribiendo el cuento...':'📖 ¡Crear el cuento!'}
        </button>
      </div>
    </div>
  );
}

function Generating({ profile, night, T, S }) {
  const [dots,setDots]=useState('');
  const [phase,setPhase]=useState(0);
  const tema=THEMES.find(t=>t.id===profile.tema)?.label||profile.tema;
  const animal=ANIMALS.find(a=>a.id===profile.animal)?.label||profile.animal;
  const phases=[
    `Preparando la historia de ${profile.name}...`,
    `Mezclando ${tema} con ${animal}...`,
    'Añadiendo magia colombiana...',
    'Dando los últimos toques...',
  ];
  useEffect(()=>{
    const d=setInterval(()=>setDots(v=>v.length>=3?'':v+'.'),400);
    const p=setInterval(()=>setPhase(v=>(v+1)%phases.length),2500);
    return()=>{clearInterval(d);clearInterval(p);};
  },[]);
  return (
    <div style={{...S.screen,justifyContent:'center',alignItems:'center',textAlign:'center',position:'relative'}}>
      <Stars night={night}/>
      <div style={{position:'relative',zIndex:1}}>
        <span style={{fontSize:72,display:'block',marginBottom:20,filter:night?'drop-shadow(0 0 20px rgba(129,140,248,0.8))':'none'}}>{night?'🌙':'✍️'}</span>
        <h2 style={{fontSize:22,fontWeight:'bold',color:T.text,marginBottom:10}}>Escribiendo tu cuento{dots}</h2>
        <p style={{fontSize:14,color:T.textMid,fontStyle:'italic',fontFamily:'system-ui',maxWidth:260,lineHeight:1.6}}>{phases[phase]}</p>
        <div style={{marginTop:28,display:'flex',gap:8,justifyContent:'center'}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{width:8,height:8,borderRadius:'50%',background:T.primary,opacity:phase%3===i?1:0.3,transition:'opacity 0.3s',boxShadow:night&&phase%3===i?`0 0 8px ${T.primary}`:'none'}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function Reading({ story, profile, onNew, night, T, S }) {
  const [showGuide,setShowGuide]=useState(false);
  const age=parseInt(profile.age);
  const mode=age<=5?'EXPLORADOR':'LECTOR';
  return (
    <div style={{...S.screen,position:'relative'}}>
      <Stars night={night}/>
      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',flex:1}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <span style={{background:mode==='EXPLORADOR'?T.badge1bg:T.badge2bg,color:mode==='EXPLORADOR'?T.badge1c:T.badge2c,borderRadius:99,padding:'4px 12px',fontSize:11,fontFamily:'system-ui',fontWeight:'bold'}}>
            {mode==='EXPLORADOR'?'📖 Papá lee en voz alta':'📚 Modo Lector'}
          </span>
          <button onClick={onNew} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:T.muted,fontFamily:'system-ui'}}>
            + Nuevo cuento
          </button>
        </div>

        <div style={{...S.card,marginBottom:14,textAlign:'center'}}>
          <h2 style={{fontSize:20,fontWeight:'bold',color:T.text,margin:0,textShadow:night?`0 0 20px ${T.primary}`:'none'}}>{story.title}</h2>
        </div>

        <div style={{...S.card,marginBottom:14}}>
          <p style={{fontSize:16,lineHeight:1.95,color:T.text,margin:0,whiteSpace:'pre-wrap'}}>{story.content}</p>
        </div>

        {story.semilla&&(
          <div style={{background:T.primaryLt,borderRadius:14,padding:'14px',border:`1.5px solid ${T.primary}`,marginBottom:14}}>
            <div style={{fontWeight:'bold',color:T.primary,marginBottom:7,fontFamily:'system-ui',fontSize:12,textTransform:'uppercase',letterSpacing:'0.06em'}}>
              🌱 Semilla de Conversación
            </div>
            <p style={{color:T.textMid,margin:0,fontSize:15,fontStyle:'italic',lineHeight:1.6}}>{story.semilla}</p>
          </div>
        )}

        {story.guide&&(
          <div style={{marginBottom:14}}>
            <button style={S.btnOut} onClick={()=>setShowGuide(!showGuide)}>
              {showGuide?'▲ Ocultar':'▼ Ver'} guía del padre / madre
            </button>
            {showGuide&&(
              <div style={{...S.card,marginTop:8}}>
                <div style={{fontWeight:'bold',color:T.teal,marginBottom:8,fontFamily:'system-ui',fontSize:12,textTransform:'uppercase',letterSpacing:'0.06em'}}>
                  📋 Guía de acompañamiento
                </div>
                <div style={{fontSize:14,color:T.textMid,whiteSpace:'pre-wrap',lineHeight:1.7,fontFamily:'system-ui'}}>{story.guide}</div>
              </div>
            )}
          </div>
        )}

        {story.tomorrow&&(
          <div style={{background:T.tomorrow,borderRadius:14,padding:'13px',border:`1.5px solid ${T.tomorrowBorder}`,marginBottom:14}}>
            <div style={{fontWeight:'bold',color:T.tomorrowText,marginBottom:6,fontFamily:'system-ui',fontSize:12,textTransform:'uppercase',letterSpacing:'0.06em'}}>
              🌙 Para mañana
            </div>
            <p style={{color:T.tomorrowText,margin:0,fontSize:14,fontFamily:'system-ui',lineHeight:1.5}}>{story.tomorrow}</p>
          </div>
        )}

        <button style={S.btn()} onClick={onNew}>✨ Crear otro cuento</button>
        <div style={{height:20}}/>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]=useState('welcome');
  const [profile,setProfile]=useState({name:'',age:'',city:'',tema:'',animal:'',gusto:'',mascota:''});
  const [story,setStory]=useState(null);
  const [isFinal,setIsFinal]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [musicOn,setMusicOn]=useState(false);
  const [night,setNight]=useState(false);

  const T = night ? NIGHT : DAY;
  const S = getStyles(T);

  const toggleMusic=()=>{
    if(musicOn){music.stop();setMusicOn(false);}
    else{music.start(night);setMusicOn(true);}
  };
  const toggleNight=()=>{
    const n=!night; setNight(n);
    if(musicOn){music.stop();setTimeout(()=>music.start(n),300);}
  };

  const handleGenerate=async()=>{
    setLoading(true);setError(null);setScreen('generating');
    try{
      const raw=await generateStory(profile,isFinal);
      setStory(parseStory(raw));
      setScreen('reading');
    }catch(e){
      setError('No se pudo generar el cuento: '+e.message);
      setScreen('model');
    }finally{setLoading(false);}
  };

  const resetForNew=()=>{
    setProfile(p=>({...p,tema:'',animal:''}));
    setStory(null);setScreen('theme');
  };

  const props={night,T,S};

  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:'"Georgia",serif',transition:'background 0.4s',position:'relative'}}>
      <style>{`
        @keyframes twinkle{0%,100%{opacity:0.9;transform:scale(1)}50%{opacity:0.2;transform:scale(0.6)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
        *{box-sizing:border-box;}
        input{color-scheme:${night?'dark':'light'};}
      `}</style>

      <NightToggle night={night} onToggle={toggleNight} T={T}/>

      {error&&(
        <div style={{background:T.errorBg,color:T.errorText,padding:'12px 20px',fontSize:13,fontFamily:'system-ui',textAlign:'center'}}>
          ⚠️ {error}
        </div>
      )}

      {screen==='welcome'    && <Welcome    onStart={()=>setScreen('profile')} musicOn={musicOn} toggleMusic={toggleMusic} {...props}/>}
      {screen==='profile'    && <Profile    profile={profile} setProfile={setProfile} onNext={()=>setScreen('theme')}  onBack={()=>setScreen('welcome')} {...props}/>}
      {screen==='theme'      && <Theme      profile={profile} setProfile={setProfile} onNext={()=>setScreen('model')}  onBack={()=>setScreen('profile')} {...props}/>}
      {screen==='model'      && <ModelChoice isFinal={isFinal} setIsFinal={setIsFinal} onGenerate={handleGenerate} onBack={()=>setScreen('theme')} loading={loading} {...props}/>}
      {screen==='generating' && <Generating profile={profile} {...props}/>}
      {screen==='reading'    && story && <Reading story={story} profile={profile} isFinal={isFinal} onNew={resetForNew} {...props}/>}

      <MusicBtn musicOn={musicOn} onToggle={toggleMusic} screen={screen} T={T}/>
    </div>
  );
}
