/* ---------- sponsor demo kit ----------
   ?pitch                         -> link builder for a sales meeting
   ?sponsor=Name&color=..&demo    -> 60-second cinematic tour with their brand everywhere, then "This could be you" */
const PITCH={};
function pitchURL(name,tag,color,demo){const u=new URL(location.href);u.search='';const q=new URLSearchParams();q.set('sponsor',name);if(tag)q.set('tagline',tag);if(color)q.set('color',color);if(demo)q.set('demo','');return u.origin+u.pathname+'?'+q.toString().replace(/demo=$/,'demo');}
function initPitch(){if(PARAMS.has('pitch')&&SPONSOR_MODE.kind!=='preview')return pitchBuilder();if(PARAMS.has('demo')&&SPONSOR_MODE.kind==='preview')return pitchSplash();}

function pitchBuilder(){const sw=['#0EA5E9','#DC2626','#16A34A','#F59E0B','#7C3AED','#0F766E','#1D4ED8','#E11D48'];
  const el=document.createElement('section');el.id='pitch';el.innerHTML=`<div class="pk">
    <div class="pk-h"><em>BotFactory · Sponsor Demo Kit</em><h2>Build a demo for a company</h2><p>Type their name and brand color. You get a link that plays a 60-second tour of the game with <b>their name on the billboard, trucks, banners, robot cells, career cards and the showcase mill</b>, then ends on a "This could be you" card.</p></div>
    <label>Company name<input id="pkName" maxlength="40" placeholder="e.g. Bluegrass Metals" autocomplete="off"></label>
    <label>Tagline <small>(optional)</small><input id="pkTag" maxlength="50" placeholder="e.g. Making steel in Kentucky since 1962" autocomplete="off"></label>
    <label>Brand color</label><div class="pk-sw">${sw.map((c,i)=>`<button style="--c:${c}" data-c="${c}"${i?'':' class="on"'}></button>`).join('')}<input type="color" id="pkCol" value="${sw[0]}"></div>
    <div class="pk-prev"><span>Preview</span><b id="pkPrev">YOUR COMPANY</b><small id="pkPrevT">Proud to build in Kentucky</small></div>
    <div class="pk-btns"><button class="btn pri big" id="pkPlay">${ic('play')} Play the demo</button><button class="btn big" id="pkCopy">Copy demo link</button></div>
    <input id="pkLink" readonly>
    <p class="pk-note">Other links: <a id="pkSlots" href="?slots">see every sponsor slot</a> · <a id="pkGame" href="#">their name in the full game</a>. Names only show up through these links. The live game stays clean until a deal is signed.</p></div>`;
  document.body.appendChild(el);let col=sw[0];
  const upd=()=>{const n=$('#pkName').value.trim(),t=$('#pkTag').value.trim();$('#pkPrev').textContent=(n||'YOUR COMPANY').toUpperCase();$('#pkPrev').style.color=col;$('#pkPrevT').textContent=t||'Proud to build in Kentucky';
    $('#pkLink').value=n?pitchURL(n,t,col,true):'';$('#pkGame').href=n?pitchURL(n,t,col,false):'#';['#pkPlay','#pkCopy'].forEach(s=>$(s).disabled=!n);};
  $$('.pk-sw button').forEach(b=>b.onclick=()=>{$$('.pk-sw button').forEach(x=>x.classList.remove('on'));b.classList.add('on');col=b.dataset.c;$('#pkCol').value=col;upd();});
  $('#pkCol').oninput=e=>{col=e.target.value;$$('.pk-sw button').forEach(x=>x.classList.remove('on'));upd();};['#pkName','#pkTag'].forEach(s=>$(s).oninput=upd);
  $('#pkPlay').onclick=()=>{location.href=$('#pkLink').value;};
  $('#pkCopy').onclick=async()=>{const v=$('#pkLink').value;let ok=false;try{await navigator.clipboard.writeText(v);ok=true;}catch(e){}if(!ok){const i=$('#pkLink');i.focus();i.select();try{ok=document.execCommand('copy');}catch(e){}}$('#pkCopy').textContent=ok?'Copied!':'Select the link below';setTimeout(()=>$('#pkCopy').textContent='Copy demo link',1800);};
  upd();setTimeout(()=>$('#pkName').focus(),300);}

function pitchSplash(){const s=SPONSOR_MODE.s;const el=document.createElement('section');el.id='pitchGo';
  el.innerHTML=`<div class="pgo"><em>A MoneyBot game · private demo</em><h1>Bot<span>Factory</span></h1><div class="pgo-x">×</div><b style="color:${escS(s.color)}">${escS(s.name)}</b><p>The factory tycoon game that teaches Kentucky kids how manufacturing really works.</p><button class="btn pri big" id="pgPlay">${ic('play')} Play the 60-second tour</button><small>Turn your sound on</small></div>`;
  document.body.appendChild(el);S.flags.bnTut=1;$('#title').hidden=true;$('#pgPlay').onclick=()=>{el.remove();initAudio();startTour();};}

function tourShots(){const s=SPONSOR_MODE.s,N=escS(s.name),B=hallBounds(),c=hallCenter(),z1=LZ(1);
  const wantRobot=()=>{const L=S.lines[1]||S.lines[0];L.st.weld.tier=2;L.st.weld.built=true;L.st.weld.needsCode=false;syncStations&&syncStations();};
  return [
    {p:[-14,3,31],p2:[-30,6.5,28],l:[-40,6,10],l2:[-44,7.8,11],d:6.5,cap:`<small>BOTFACTORY × ${N}</small>Your brand, inside the game Kentucky kids play to learn manufacturing.`,on:()=>{slam('BOTFACTORY',`presented by ${s.name}`,s.color,2600);}},
    {p:[GATE_X+1,2.4,24],p2:[GATE_X,2.2,8.6],l:[GATE_X,1.6,2],l2:[GATE_X+4,1.4,-6],d:6,cap:'Players run a real plant, from a garage shop to a Mega Plant.'},
    {p:[-10,2.6,z1+4.5],p2:[-2.5,2,z1+3.6],l:[-5.5,1.3,z1-1.6],l2:[-5.5,1.1,z1-1.8],d:7,cap:'Robot cells, laser cutters and welding. Every station can carry your name.'},
    {p:[B.x0-24,2.4,LZ(0)+9.5],p2:[B.x0-12,2.6,LZ(0)+8.5],l:[B.x0-22,1.6,LZ(0)],l2:[B.x0-6,1.6,LZ(0)],d:6.5,cap:`Steel comes in on <b style="color:${escS(s.color)}">${N}</b> trucks. Finished goods ship out the same way.`,on:()=>{sendTruck(0,'in');const T=W.trucks[W.trucks.length-1];if(T)T.g.position.x=T.stop-26;}},
    {p:[c.x+10,46,c.z+40],p2:[c.x-6,40,c.z+34],l:[c.x,0,c.z],l2:[c.x,0,c.z-2],d:7,cap:'Kids learn OEE, bottlenecks, quality and cost. The language of your plant floor.',on:()=>{toggleTwin(true);}},
    {p:[3,2.3,LZ(0)+5],p2:[6,2,LZ(0)+4.2],l:[0,1.2,LZ(0)-1.5],l2:[2,1.2,LZ(0)-1.5],d:7,cap:'Career cards turn every station into a real job, and point to who is hiring.',on:()=>{toggleTwin(false);showCareer();}},
    {p:[MX-24,10,30],p2:[MX+4,8,26],l:[MX-12,6,-8],l2:[MX+6,4.5,-7],d:7.5,cap:`Or own the field trip: a full showcase floor built around <b style="color:${escS(s.color)}">${N}</b>.`,on:()=>{hideCareer();millShot(true);}},
    {p:[2,9,34],p2:[-6,26,52],l:[4,1,12],l2:[-4,0,-6],d:7,cap:'Built in Kentucky. Runs on school Chromebooks. Nothing to install.',on:()=>{millShot(false);}}];}

function millShot(on){if(on){if(!MILL.g)buildMill();MILL.g.visible=true;CX.holdSky=true;PITCH.bg=scene.background.clone();scene.background.set('#120E0C');scene.fog.color.set('#120E0C');PITCH.fog=[scene.fog.near,scene.fog.far];scene.fog.near=60;scene.fog.far=160;sun.position.set(MX-20,40,30);sun.target.position.set(MX,0,0);}
  else if(CX.holdSky){MILL.g.visible=false;CX.holdSky=false;scene.fog.near=PITCH.fog[0];scene.fog.far=PITCH.fog[1];sun.target.position.set(0,0,0);}}
function showCareer(){const d=document.createElement('div');d.id='pitchCard';d.innerHTML=iconize(careerCard({tags:{weld:1}}));document.body.appendChild(d);requestAnimationFrame(()=>d.classList.add('on'));}
function hideCareer(){const d=$('#pitchCard');if(d)d.remove();}

function startTour(){UI.pitch=true;S.flags.bnTut=1;S.speed=1;if(modalOpen())closeModal();UI.demo=true;$('#title').hidden=true;document.body.classList.add('titling','pitching');hideCareer();$('#pitchEnd')&&$('#pitchEnd').remove();
  if(S.phase!=='day')startShift();S.clock=SHIFT_LEN*.12;P.rig.root.visible=false;const sh=tourShots();const runOn=x=>x.on&&x.on();runOn(sh[0]);
  sh.forEach((x,i)=>{if(i>0&&x.on){const f=x.on;x.on=null;x.cb=f;}});PITCH.shots=sh;playShots(sh,endTour);}
function endTour(){toggleTwin(false);hideCareer();millShot(false);const s=SPONSOR_MODE.s,N=escS(s.name);camS.mode='title';
  const slots=[['flame','Street billboard','The first thing players see outside the plant'],['factory','Presenting partner','Your name on the title screen and loading screen'],['truck','Steel + shipping trucks','Every delivery and every shipment'],['contract','Factory banners','On the walls of every player\'s plant'],['robot','Station sponsor','Plaques on the robot cells and machines'],['worker','Career cards','Real jobs at your company, inside the game'],['molten','Showcase mill','A full field-trip floor built around your plant']];
  const el=document.createElement('section');el.id='pitchEnd';el.style.setProperty('--sc',s.color||'#FACC15');
  el.innerHTML=`<div class="pe"><em>BotFactory · sponsor placements</em><h1>This could be <span>${N}</span></h1>
    <div class="pe-g">${slots.map(([i,t,d])=>`<div class="pe-t">${ic(i)}<div><b>${t}</b><small>${d}</small></div></div>`).join('')}</div>
    <div class="pe-learn"><b>What players learn</b><span>Bottlenecks</span><span>OEE</span><span>Quality + defects</span><span>Costs + profit</span><span>Robotics + automation</span><span>Metals + steelmaking</span><span>Real Kentucky careers</span></div>
    <div class="pe-btns"><button class="btn pri big" id="peAgain">${ic('play')} Replay tour</button><a class="btn big" id="pePlay" href="${escS(pitchURL(s.name,s.tagline,s.color,false))}">Play the game with ${N}</a><a class="btn big" href="?slots">Every slot</a></div>
    <small class="pe-f">A MoneyBot game · getmoneybot.com</small></div>`;
  document.body.appendChild(el);sfx('big');$('#peAgain').onclick=()=>{el.remove();startTour();};}
/* shots with a cb fire it when they begin */
function pitchStep(){const C=CX.shot;if(!C||!UI.pitch)return;const s=C.shots[C.i];if(s&&s.cb&&!s.fired){s.fired=true;s.cb();}}
