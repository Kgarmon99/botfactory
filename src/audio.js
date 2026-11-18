/* ===================== BotFactory · sound ===================== */
/* Everything runs through soft low-pass filters. No raw square/saw waves: warm, low and easy on the ears. */
const AU={ctx:null, master:null, sfxBus:null, musBus:null, noise:null, muted:false, music:true, nextBar:0, bar:0, timer:0, lastAt:{}};
try{ const s=localStorage.getItem('bf_audio'); if(s){ const o=JSON.parse(s); AU.muted=!!o.m; AU.music=o.mu!==false; } }catch(e){}
function audio(){ if(AU.ctx){ if(AU.ctx.state==='suspended') AU.ctx.resume(); return; } try{ AU.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  const A=AU.ctx; AU.master=A.createGain(); AU.master.gain.value=AU.muted?0:.9; const comp=A.createDynamicsCompressor(); comp.threshold.value=-18; comp.ratio.value=3; AU.master.connect(comp); comp.connect(A.destination);
  AU.sfxBus=A.createBiquadFilter(); AU.sfxBus.type='lowpass'; AU.sfxBus.frequency.value=4200; AU.sfxBus.Q.value=.3; const sg=A.createGain(); sg.gain.value=.9; AU.sfxBus.connect(sg); sg.connect(AU.master);
  AU.musBus=A.createGain(); AU.musBus.gain.value=AU.music?.5:0; const mf=A.createBiquadFilter(); mf.type='lowpass'; mf.frequency.value=2200; AU.musBus.connect(mf); mf.connect(AU.master);
  const len=A.sampleRate*.5, buf=A.createBuffer(1,len,A.sampleRate), d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1; AU.noise=buf;
  AU.nextBar=A.currentTime+.2; AU.timer=setInterval(musicTick,250); }
function saveAudio(){ try{ localStorage.setItem('bf_audio',JSON.stringify({m:AU.muted,mu:AU.music})); }catch(e){} }
function setMuted(m){ AU.muted=m; if(AU.master) AU.master.gain.setTargetAtTime(m?0:.9,AU.ctx.currentTime,.05); saveAudio(); }
function setMusic(on){ AU.music=on; if(AU.musBus) AU.musBus.gain.setTargetAtTime(on?.5:0,AU.ctx.currentTime,.3); saveAudio(); }
function env(g,t,a,peak,dec){ g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(.0001,t+a+dec); }
function tone(f,d=.12,type='sine',v=.05,slide,delay=0,bus){ if(!AU.ctx||AU.muted) return; const A=AU.ctx, t=A.currentTime+delay, o=A.createOscillator(), g=A.createGain(); o.type=type==='square'||type==='sawtooth'?'triangle':type; o.frequency.setValueAtTime(f,t); if(slide) o.frequency.exponentialRampToValueAtTime(slide,t+d); env(g,t,.008,v,d); o.connect(g); g.connect(bus||AU.sfxBus); o.start(t); o.stop(t+d+.05); }
function noise(d=.15,v=.08,f=800,q=1,delay=0,type='lowpass'){ if(!AU.ctx||AU.muted) return; const A=AU.ctx, t=A.currentTime+delay, s=A.createBufferSource(), fl=A.createBiquadFilter(), g=A.createGain(); s.buffer=AU.noise; fl.type=type; fl.frequency.value=f; fl.Q.value=q; env(g,t,.004,v,d); s.connect(fl); fl.connect(g); g.connect(AU.sfxBus); s.start(t,Math.random()*.3); s.stop(t+d+.05); }
function rl(k,gap){ const n=performance.now(); if(AU.lastAt[k]&&n-AU.lastAt[k]<gap) return false; AU.lastAt[k]=n; return true; }
const sfx={
  tick:()=>tone(1200,.04,'sine',.025),
  hover:()=>rl('hv',60)&&tone(1500,.025,'sine',.012),
  good:()=>{ tone(660,.14,'sine',.05); tone(990,.2,'sine',.04,null,.07); },
  bad:()=>{ tone(220,.25,'triangle',.05,140); },
  cash:()=>rl('cash',90)&&(tone(1318,.09,'sine',.035), tone(1760,.16,'sine',.03,null,.06)),
  coin:()=>rl('coin',70)&&tone(rand(1700,2100),.07,'sine',.018),
  thud:()=>{ tone(90,.22,'sine',.13,45); noise(.12,.05,300); },
  buzz:()=>rl('bz',150)&&tone(160,.18,'triangle',.05,120),
  build:()=>{ tone(110,.25,'sine',.16,50); noise(.18,.09,420,.7); tone(520,.1,'triangle',.03,null,.1); },
  place:()=>{ tone(700,.05,'sine',.03); noise(.05,.03,2400,.8); },
  stamp:()=>rl('st',280)&&(tone(80,.12,'sine',.07,45), noise(.07,.035,1600,1.2)),
  weld:()=>rl('wd',400)&&noise(.09,.012,5200,2,0,'bandpass'),
  spray:()=>rl('sp',700)&&noise(.35,.012,3000,.6,0,'highpass'),
  bang:()=>{ tone(70,.4,'sine',.18,35); noise(.35,.12,700,.8); },
  clang:()=>{ tone(880,.1,'triangle',.04,700); noise(.06,.05,3000,3,0,'bandpass'); },
  whoosh:()=>noise(.35,.05,900,.5,0,'bandpass'),
  fanfare:()=>[523,659,784,1047].forEach((f,i)=>{ tone(f,.3,'triangle',.045,null,i*.11); tone(f*2,.2,'sine',.015,null,i*.11); }),
  levelup:()=>[392,523,659,784,1047,1319].forEach((f,i)=>tone(f,.25,'triangle',.04,null,i*.07)),
  goal:()=>{ tone(784,.12,'sine',.045); tone(1175,.28,'sine',.04,null,.09); },
  pop:()=>tone(rand(500,700),.06,'sine',.03,900)
};
/* ---------- music: warm lo-fi chords, soft bass and a gentle pluck ---------- */
const CHORDS=[[48,55,64,71],[45,52,60,67],[41,48,57,64],[43,50,59,65]]; const PENTA=[72,74,76,79,81,84];
const mtof=n=>440*Math.pow(2,(n-69)/12);
function pad(f,t,d,v){ const A=AU.ctx, o=A.createOscillator(), o2=A.createOscillator(), g=A.createGain(), fl=A.createBiquadFilter(); o.type='triangle'; o2.type='sine'; o.frequency.value=f; o2.frequency.value=f*1.003; fl.type='lowpass'; fl.frequency.value=900; fl.Q.value=.2;
  g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(v,t+.6); g.gain.setValueAtTime(v,t+d-.6); g.gain.linearRampToValueAtTime(.0001,t+d); o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(AU.musBus); o.start(t); o2.start(t); o.stop(t+d+.1); o2.stop(t+d+.1); }
function pluck(f,t,v,d=.5){ const A=AU.ctx, o=A.createOscillator(), g=A.createGain(), fl=A.createBiquadFilter(); o.type='triangle'; o.frequency.value=f; fl.type='lowpass'; fl.frequency.setValueAtTime(2400,t); fl.frequency.exponentialRampToValueAtTime(500,t+d); env(g,t,.006,v,d); o.connect(fl); fl.connect(g); g.connect(AU.musBus); o.start(t); o.stop(t+d+.1); }
function musicTick(){ if(!AU.ctx||!AU.music||AU.muted) { if(AU.ctx) AU.nextBar=Math.max(AU.nextBar,AU.ctx.currentTime+.1); return; } const A=AU.ctx, beat=60/84, barLen=beat*4;
  while(AU.nextBar<A.currentTime+.6){ const t=AU.nextBar, ch=CHORDS[AU.bar%4], fast=typeof G!=='undefined'&&G.mode==='play'&&!G.paused&&G.opened;
    ch.forEach((n,i)=>pad(mtof(n),t,barLen+.3,i===0?.016:.011));
    pluck(mtof(ch[0]-12),t,.05,beat*1.6); pluck(mtof(ch[0]-12),t+beat*2,.04,beat*1.2); if(fast) pluck(mtof(ch[1]-12),t+beat*3.5,.03,beat*.6);
    for(let s=0;s<8;s++){ if(Math.random()<(fast?.42:.22)){ const n=PENTA[(AU.bar*3+s*5+Math.floor(Math.random()*3))%PENTA.length]; pluck(mtof(n),t+s*beat/2,.018,.45); } }
    AU.nextBar+=barLen; AU.bar++; } }
