/* ---------- factory soundscape + music (all generated live, no audio files) ---------- */
const AUD={on:false,mode:0,bus:null,sfx:null,amb:null,mus:null,v:{},next:0,step:0,bar:0,servoT:0,birdT:0,pssT:0};
try{AUD.mode=+(localStorage.getItem('botfactory-sound')||0);if(localStorage.getItem('botfactory-mute')==='1'&&!localStorage.getItem('botfactory-sound'))AUD.mode=2;}catch(e){}
/* mode 0 = sound + music, 1 = sound only, 2 = muted */
function aOut(){return AUD.sfx||AC.destination;}
function noiseBuf(sec,kind){const n=Math.floor(AC.sampleRate*sec),b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);let l=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;if(kind==='brown'){l=(l+.02*w)/1.02;a[i]=l*3.5;}else a[i]=w;}return b;}
function loopSrc(buf){const s=AC.createBufferSource();s.buffer=buf;s.loop=true;s.start();return s;}
function filt(type,f,q){const x=AC.createBiquadFilter();x.type=type;x.frequency.value=f;if(q!=null)x.Q.value=q;return x;}
function gainN(v){const g=AC.createGain();g.gain.value=v||0;return g;}
function chain(...n){for(let i=0;i<n.length-1;i++)n[i].connect(n[i+1]);return n[n.length-1];}

function startAudio(){if(AUD.on||!AC)return;AUD.on=true;
  const comp=AC.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;AUD.bus=gainN(1);chain(AUD.bus,comp,AC.destination);
  AUD.sfx=gainN(1);AUD.sfx.connect(AUD.bus);AUD.amb=gainN(1);AUD.amb.connect(AUD.bus);AUD.mus=gainN(.55);AUD.mus.connect(AUD.bus);
  const white=noiseBuf(2,'white'),brown=noiseBuf(3,'brown'),V=AUD.v;
  /* room tone: big hall rumble */
  V.room=chain(loopSrc(brown),filt('lowpass',220),gainN(0));V.room.connect(AUD.amb);
  /* conveyor hum: two detuned saws through a lowpass */
  V.hum=gainN(0);const lp=filt('lowpass',180);[55,55.6,110.3].forEach(f=>{const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(lp);o.start();});chain(lp,V.hum,AUD.amb);
  /* rollers: gentle rattle */
  V.roll=chain(loopSrc(white),filt('bandpass',900,2.5),gainN(0));V.roll.connect(AUD.amb);
  /* weld crackle: hissing band of noise, gain jittered every frame */
  V.weld=chain(loopSrc(white),filt('bandpass',3200,.8),gainN(0));V.weld.connect(AUD.amb);
  /* laser cutter whine */
  V.laser=gainN(0);const lo=AC.createOscillator();lo.type='sine';lo.frequency.value=2350;const vib=AC.createOscillator(),vg=gainN(18);vib.frequency.value=6;chain(vib,vg,lo.frequency);vib.start();lo.start();chain(lo,V.laser,AUD.amb);
  /* paint booth: airy spray */
  V.paint=chain(loopSrc(white),filt('highpass',5200),gainN(0));V.paint.connect(AUD.amb);
  /* outside: traffic wash + wind */
  V.road=chain(loopSrc(brown),filt('lowpass',600),gainN(0));V.road.connect(AUD.amb);
  V.wind=chain(loopSrc(white),filt('lowpass',420),gainN(0));V.wind.connect(AUD.amb);
  /* mill: furnace roar */
  V.furn=chain(loopSrc(brown),filt('lowpass',140),gainN(0));V.furn.connect(AUD.amb);
  AUD.next=AC.currentTime+.1;applySoundMode();}

function applySoundMode(){if(!AUD.on)return;const t=AC.currentTime;muted=AUD.mode===2;AUD.bus.gain.setTargetAtTime(AUD.mode===2?0:1,t,.05);AUD.mus.gain.setTargetAtTime(AUD.mode===0?.5:0,t,.2);}
function cycleSound(){AUD.mode=(AUD.mode+1)%3;try{localStorage.setItem('botfactory-sound',AUD.mode);localStorage.setItem('botfactory-mute',AUD.mode===2?'1':'0');}catch(e){}muted=AUD.mode===2;applySoundMode();soundBtn();
  toast(['<b>Sound + music</b> on','<b>Music off</b> · factory sounds on','<b>Muted</b>'][AUD.mode]);}
function soundBtn(){const b=$('#btnMute');if(!b)return;b.innerHTML=ic(AUD.mode===2?'mute':AUD.mode===1?'sound':'music');b.title=['Sound + music','Sound only','Muted'][AUD.mode];}

/* one-shots for machines */
function grain(f,d,vol,type,slide,dest){if(!AUD.on)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type||'sawtooth';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);const bp=filt('bandpass',f*1.5,1.2);chain(o,bp,g,dest||AUD.amb);o.start(t);o.stop(t+d+.05);}
function puff(d,vol,hp){if(!AUD.on)return;const s=AC.createBufferSource();s.buffer=AUD.pbuf||(AUD.pbuf=noiseBuf(.6,'white'));const g=AC.createGain(),t=AC.currentTime;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);chain(s,filt('highpass',hp||1800),g,AUD.amb);s.start();s.stop(t+d+.05);}

/* per frame: mix the soundscape from what is near you and what is running */
const _lvl={weld:0,laser:0,paint:0,asm:0,qa:0,robot:0};
function updateAudio(dt){if(!AUD.on||!S)return;const V=AUD.v,t=AC.currentTime,set=(n,v,tc)=>V[n].gain.setTargetAtTime(v,t,tc||.15);
  for(const k in _lvl)_lvl[k]=0;let lines=0;const run=S.phase==='day'&&!UI.demo?(running()?1:0):(UI.demo?1:0);
  const inMill=MILL.on,outside=OUT.out&&!inMill,px=P.pos.x,pz=P.pos.z,lp=camS.mode==='cine'||camS.mode==='title'?camS.look:null,lx=lp?lp.x:px,lz=lp?lp.z:pz;
  if(!inMill)S.lines.slice(0,lineCount()).forEach((l,li)=>{const z=LZ(li)-1.5;let busyAny=false;ST_KEYS.forEach(k=>{const s=l.st[k];if(!s.built)return;const busy=run&&s.cur&&!s.broken&&!s.needsCode;if(!busy)return;busyAny=true;
      const d=Math.hypot(lx-SLOT_X[k],lz-z),near=clamp(1-d/(outside?40:20),0,1);const key=k==='cut'?'laser':k;if(_lvl[key]!=null)_lvl[key]=Math.max(_lvl[key],near);if(s.tier===2)_lvl.robot=Math.max(_lvl.robot,near);});if(busyAny)lines++;});
  const indoorK=outside?.35:1;
  set('room',inMill?0:(.05+.05*Math.min(lines,3))*indoorK,.4);set('hum',inMill?0:(lines?.035+.012*Math.min(lines,3):.01)*indoorK,.4);set('roll',inMill?0:(lines?.025:0)*indoorK,.3);
  set('weld',_lvl.weld*(.05+Math.random()*.11)*(Math.random()<.18?.15:1)*indoorK,.01);
  set('laser',_lvl.laser*.012*(.7+.3*Math.sin(t*3.1))*indoorK,.05);set('paint',_lvl.paint*.045*indoorK,.2);
  /* robot servos + pneumatics + QA beeps */
  AUD.servoT-=dt;if(_lvl.robot>.15&&AUD.servoT<=0){AUD.servoT=rand(.35,1.1);const f=rand(380,620);grain(f,rand(.18,.4),.04*_lvl.robot*indoorK,'sawtooth',f*rand(1.3,1.8));}
  AUD.pssT-=dt;if(_lvl.asm>.2&&AUD.pssT<=0){AUD.pssT=rand(1.2,3);puff(.22,.06*_lvl.asm*indoorK,2400);grain(1800,.05,.02*_lvl.asm,'square');}
  if(_lvl.qa>.3&&Math.random()<dt*.6)grain(1560,.07,.025*_lvl.qa*indoorK,'sine');
  /* outside */
  let car=99;CX.cars.forEach(c=>{car=Math.min(car,Math.hypot(lx-c.g.position.x,lz-c.g.position.z));});
  set('road',outside?clamp(.02+(1-car/30)*.09,0,.12):.004,.25);set('wind',outside?.035:0,.6);
  AUD.birdT-=dt;if(outside&&AUD.birdT<=0&&(S.phase!=='day'||S.clock<SHIFT_LEN*.75)){AUD.birdT=rand(1.5,5);const f=rand(2600,3800);for(let i=0;i<rand(2,5);i++)setTimeout(()=>grain(f*rand(.9,1.1),.08,.02,'sine',f*1.25,AUD.sfx),i*110);}
  if(OUT.drive){const v=P.vel.length();set('hum',.05+v*.004,.1);}
  set('furn',inMill?.18:0,.6);
  music();}

/* ---------- music: a chill industrial groove, busier during a shift ---------- */
const CH=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]],BASS=[45,41,36,43],mtof=n=>440*Math.pow(2,(n-69)/12);
function kick(t){const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+.18);g.gain.setValueAtTime(.5,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);chain(o,g,AUD.mus);o.start(t);o.stop(t+.32);}
function hat(t,v){const s=AC.createBufferSource();s.buffer=AUD.pbuf||(AUD.pbuf=noiseBuf(.6,'white'));const g=AC.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);chain(s,filt('highpass',7500),g,AUD.mus);s.start(t);s.stop(t+.06);}
function snare(t){const s=AC.createBufferSource();s.buffer=AUD.pbuf||(AUD.pbuf=noiseBuf(.6,'white'));const g=AC.createGain();g.gain.setValueAtTime(.16,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);chain(s,filt('bandpass',1900,.8),g,AUD.mus);s.start(t);s.stop(t+.18);
  const o=AC.createOscillator(),g2=AC.createGain();o.type='triangle';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(140,t+.08);g2.gain.setValueAtTime(.12,t);g2.gain.exponentialRampToValueAtTime(.001,t+.1);chain(o,g2,AUD.mus);o.start(t);o.stop(t+.12);}
function note(t,n,d,v,type,cut){const o=AC.createOscillator(),g=AC.createGain(),f=filt('lowpass',cut||1800);o.type=type||'triangle';o.frequency.value=mtof(n);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);chain(o,f,g,AUD.mus);o.start(t);o.stop(t+d+.05);}
function music(){if(AUD.mode!==0)return;const bpm=94,st=60/bpm/4,ahead=AC.currentTime+.25;const hype=(S.phase==='day'&&running())||UI.pitch||MILL.on;
  while(AUD.next<ahead){const t=AUD.next,s=AUD.step%16,b=Math.floor(AUD.step/16)%4;
    if(s===0||s===8||(hype&&s===10))kick(t);if(s===4||s===12)snare(t);if(hype?s%2===0:s%4===2)hat(t,s%4===2?.05:.025);
    if(s===0)CH[b].forEach(n=>note(t,n+12,st*15,.035,'triangle',1400));
    if(s%4===0||(hype&&s%4===3))note(t,BASS[b]-12+(s===12&&hype?7:0),st*2.6,.11,'sawtooth',420);
    if(hype&&(s===6||s===14))note(t,CH[b][(AUD.step>>3)%3]+24,st*1.5,.025,'square',2600);
    AUD.next+=st;AUD.step++;}}
