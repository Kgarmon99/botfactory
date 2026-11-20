/* ---------- game shell: boot screen, main menu, save slots, settings, pause, credits, coach, feel ---------- */
const BOOT_TIPS=['The slowest station sets the speed of the whole line. Fix that one first.',
  'World-class plants run at 85% OEE or better.','A robot cell can work 4x faster than hand tools, and it makes fewer defects.',
  'Every defect that ships comes back as a return. Quality checks pay for themselves.','Kentucky builds cars, trucks, aircraft parts, appliances and steel.',
  'Rent is a fixed cost: you pay it even on a slow day. Materials are a variable cost.','Welders, robot techs and maintenance pros are some of the most in-demand jobs in manufacturing.',
  'Bigger plants spread fixed costs over more products. That is economies of scale.','Steel can be recycled again and again without losing strength.'];
const BOOT_MSG=[[0,'Pouring the concrete…'],[15,'Wiring the control panels…'],[35,'Calibrating robot arms…'],[70,'Clocking in the crew…'],[92,'Firing up the line…']];
let bootTipT=null;
function bootProg(p){const f=$('#loadfill');if(f)f.style.width=p+'%';const b=$('#bootPct');if(b)b.textContent=Math.round(p)+'%';const m=BOOT_MSG.filter(x=>x[0]<=p).pop(),el=$('#bootMsg');if(el)el.textContent=m[1];}
function bootTips(){const el=$('#bootTip');if(!el)return;let i=Math.floor(Math.random()*BOOT_TIPS.length);const f=()=>{el.style.opacity=0;setTimeout(()=>{el.textContent=BOOT_TIPS[i++%BOOT_TIPS.length];el.style.opacity=1;},260);};f();bootTipT=setInterval(f,3800);}
function bootDone(){clearInterval(bootTipT);bootProg(100);const b=$('#boot');if(!b)return;setTimeout(()=>{b.classList.add('out');setTimeout(()=>b.remove(),800);},Math.max(250,(PARAMS.has('test')?0:1600)-performance.now()));}

/* ---------- main menu + save slots ---------- */
const SL={mode:'new',pick:1,armed:false};
function slotInfo(n){const s=load(n);return s?{name:s.name||'Boss',day:s.day,stage:STAGES[s.stage].name,cash:s.cash,saved:s.saved}:null;}
function ago(t){if(!t)return '';const m=Math.round((Date.now()-t)/60000);return m<1?'Saved just now':m<60?`Saved ${m}m ago`:m<1440?`Saved ${Math.round(m/60)}h ago`:`Saved ${Math.round(m/1440)}d ago`;}
function initMenu(){$('#tVer').textContent=`v${VERSION} · A MoneyBot game · No accounts, no ads`;
  const cur=load(SLOT)?SLOT:[1,2,3].find(n=>load(n));if(cur){SLOT=cur;const i=slotInfo(cur);$('#btnCont').hidden=false;$('#contInfo').textContent=`${i.name} · ${i.stage} · Day ${i.day}`;}
  $('#btnLoad').hidden=![1,2,3].some(n=>load(n));
  $('#btnNewM').onclick=()=>openSlots('new');$('#btnLoad').onclick=()=>openSlots('load');$('#tnBack').onclick=closeSlots;
  $('#btnSet').onclick=openSettings;$('#btnHow').onclick=howTo;$('#btnCred').onclick=credits;
  const b=$('#btnNew');b.disabled=false;b.onclick=newClick;$('#pname').onkeydown=e=>{if(e.key==='Enter')newClick();};newBtn();
  $('#btnPause').innerHTML=ic('gear');$('#btnPause').onclick=openPause;
  addEventListener('keydown',e=>{if(e.code==='Escape'&&S&&!UI.demo&&!modalOpen()&&camS.mode!=='cine'&&!MG.on&&!titleOn()){e.preventDefault();openPause();}});
  document.body.classList.toggle('cb',SET.cb);
  /* every button clicks; menu buttons tick on hover */
  addEventListener('pointerdown',e=>{if(e.target.closest('button,.btn,a.btn'))uiClick();},true);
  if(matchMedia('(hover:hover)').matches)document.addEventListener('mouseover',e=>{const t=e.target.closest('.tm,.btn,#dock button,.tab');if(t&&t!==SL.hov){SL.hov=t;uiHover();}});}
function openSlots(mode){SL.mode=mode;SL.armed=false;$('#tmenu').hidden=true;$('#tnew').hidden=false;$('#tnTitle').textContent=mode==='new'?'New game · pick a save slot':'Load game';
  SL.pick=mode==='new'?([1,2,3].find(n=>!load(n))||SLOT):SLOT;$('#pname').hidden=$('#btnNew').hidden=mode!=='new';renderSlots();if(mode==='new'&&!TOUCH)setTimeout(()=>$('#pname').focus(),60);}
function closeSlots(){$('#tnew').hidden=true;$('#tmenu').hidden=false;}
function renderSlots(){$('#slots').innerHTML=[1,2,3].map(n=>{const i=slotInfo(n);
    return `<button class="slot${n===SL.pick&&SL.mode==='new'?' on':''}${i?'':' empty'}" data-n="${n}"${SL.mode==='load'&&!i?' disabled':''}><em>Slot ${n}</em>${i?`<b>${esc(i.name)}</b><span>${i.stage} · Day ${i.day} · ${money(i.cash)}</span><small>${ago(i.saved)}</small>`:'<b>Empty</b><span>Start fresh here</span>'}</button>`;}).join('');
  $$('#slots .slot').forEach(b=>b.onclick=()=>{const n=+b.dataset.n;if(SL.mode==='load'){if(!load(n))return;SLOT=n;$('#btnCont').onclick();return;}SL.pick=n;SL.armed=false;renderSlots();});newBtn();}
function newBtn(){const b=$('#btnNew');if(!b||b.disabled)return;const occ=!!load(SL.pick);b.textContent=SL.armed?`Yes, erase slot ${SL.pick} and start over`:occ?`Overwrite slot ${SL.pick}…`:'Build my factory';b.classList.toggle('danger',occ);}
function newClick(){if(load(SL.pick)&&!SL.armed&&!PARAMS.has('test')){SL.armed=true;newBtn();sfx('warn');return;}SLOT=SL.pick;startNew();}

/* ---------- settings ---------- */
function openSettings(){const back=UI.pauseOpen;const sl=(k,t,mn,mx)=>`<label class="sr"><span>${t}</span><input type="range" min="${mn||0}" max="${mx||1}" step="0.05" value="${SET[k]}" data-k="${k}"><b data-v="${k}">${Math.round(SET[k]*100)}%</b></label>`;
  const tg=(k,t,d)=>`<button class="tgl${SET[k]?' on':''}" data-t="${k}"><span><b>${t}</b><small>${d}</small></span><i></i></button>`;
  const C=openModal(`<div class="set"><div class="eyebrow">Options</div><h2>Settings</h2>
    <h4>Sound</h4>${sl('master','Master volume')}${sl('sfx','Machines + effects')}${sl('music','Music')}
    <h4>Graphics</h4><div class="seg">${[[-1,'Auto'],[0,'Low'],[1,'Medium'],[2,'High']].map(([v,t])=>`<button data-g="${v}"${SET.gfx===v?' class="on"':''}>${t}</button>`).join('')}</div>
    <p class="set-n" id="gfxNote">Auto picks the best look your device can run smoothly. Low is fastest on older Chromebooks.</p>
    <h4>Controls</h4>${sl('sens','Camera turn speed',.4,2)}
    <h4>Accessibility</h4>${tg('cb','Colorblind-safe colors','Blue and orange instead of green and red')}${tg('motion','Camera shake + cutscenes','Turn off if motion bothers you')}${tg('tips','Coach tips','Hints from MoneyBot while you play')}
    ${S&&!UI.demo?`<h4>Progress</h4><p class="set-n">Playing in <b>slot ${SLOT}</b>. Progress saves on this device automatically.</p><button class="btn danger" id="setReset">Erase slot ${SLOT}…</button>`:''}
    </div><div class="mact"><button class="btn pri big" id="ok" data-focus>Done</button></div>`,{cls:'dark panel'});
  C.querySelectorAll('input[type=range]').forEach(r=>r.oninput=()=>{const k=r.dataset.k;SET[k]=+r.value;C.querySelector(`[data-v="${k}"]`).textContent=Math.round(SET[k]*100)+'%';saveSet();if(AUD.mode===2&&k!=='sens'&&SET[k]>0){AUD.mode=k==='music'?0:1;soundBtn();}applySoundMode();});
  C.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{SET.gfx=+b.dataset.g;saveSet();C.querySelectorAll('[data-g]').forEach(x=>x.classList.toggle('on',x===b));$('#gfxNote').innerHTML=`Saved. <button class="btn" id="gfxReload">Apply now (reloads, your progress is saved)</button>`;$('#gfxReload').onclick=()=>{save();location.reload();};});
  C.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const k=b.dataset.t;SET[k]=!SET[k];saveSet();b.classList.toggle('on',SET[k]);if(k==='cb'){document.body.classList.toggle('cb',SET.cb);rebuildWorld();}});
  const rs=C.querySelector('#setReset');if(rs)rs.onclick=()=>{if(!rs.dataset.arm){rs.dataset.arm=1;rs.textContent=`Tap again to erase slot ${SLOT} forever`;sfx('warn');return;}wipeSlot(SLOT);location.reload();};
  C.querySelector('#ok').onclick=()=>{closeModal();if(back)openPause();};}

/* ---------- pause ---------- */
function openPause(){if(!S||UI.demo||modalOpen())return;UI.pauseOpen=true;const C=openModal(`<div class="pause"><div class="eyebrow">${esc(S.name)} · ${STAGES[S.stage].name} · Day ${S.day}</div><h2>Paused</h2>
    <div class="pm"><button class="tm pri" id="pmRes"><b>Resume</b></button><button class="tm" id="pmSet"><b>Settings</b></button><button class="tm" id="pmHow"><b>How to Play</b></button><button class="tm" id="pmQuit"><b>Save + exit to menu</b><small>Slot ${SLOT}</small></button></div></div>`,{cls:'dark panel'});
  const done=()=>{UI.pauseOpen=false;};C.querySelector('#pmRes').onclick=()=>{done();closeModal();};
  C.querySelector('#pmSet').onclick=()=>{closeModal();openSettings();};C.querySelector('#pmHow').onclick=()=>{done();closeModal();howTo();};
  C.querySelector('#pmQuit').onclick=()=>{save();location.reload();};}

/* ---------- credits ---------- */
function credits(){const C=openModal(`<div class="cred"><img src="${MB_ASSETS.logo}" alt=""><div class="eyebrow">Credits</div><h2>BotFactory</h2><p class="cr-v">Version ${VERSION}</p>
  <div class="cr-g"><div><em>Made by</em><b>MoneyBot</b><span>getmoneybot.com</span></div><div><em>Made for</em><b>Kentucky students</b><span>Middle + high school</span></div>
  <div><em>3D engine</em><b>three.js</b><span>MIT license</span></div><div><em>Typefaces</em><b>Barlow + Barlow Condensed</b><span>SIL Open Font License</span></div>
  <div><em>Sound + music</em><b>Made live in your browser</b><span>No audio files</span></div><div><em>Thanks to</em><b>Kentucky makers</b><span>who keep the lines running</span></div></div>
  <div class="cr-priv">${ic('lock')}<p><b>Privacy:</b> no accounts, no ads and no personal info. Your progress saves only on this device.</p></div></div>
  <div class="mact"><button class="btn pri big" id="ok" data-focus>Close</button></div>`,{cls:'dark panel'});C.querySelector('#ok').onclick=closeModal;}

/* ---------- guided first shift ---------- */
const COACH_FIRST=[
  {el:'#flow',txt:'<b>This is your line.</b> Each bar is one station. The flagged <b>SLOWEST</b> bar is your weakest station, and it sets the speed of the whole line.',btn:'Next'},
  {el:'#btnStart',txt:'Press <b>Start Shift</b> to fire up the line.',until:()=>S.phase==='day',dim:1},
  {el:'#flow',txt:'Watch crates pile up in front of the slowest station. That pile-up is your <b>bottleneck</b>. When the <b>FIX</b> pin shows up, tap it.',time:10}];
const COACH_UP=[{el:'#dock [data-p="upgrades"]',txt:'Payday! Spend it in <b>Upgrades</b>. Speed up your slowest station first. Robot cells are the endgame.',until:()=>UI.panel==='upgrades',dim:1}];
function coachStart(list){UI.coach={list,i:0,t:0};coachShow();}
function coachShow(){const C=UI.coach,c=C.list[C.i];let el=$('#coach');if(!el){el=document.createElement('div');el.id='coach';el.innerHTML='<div class="co-ring"></div><div class="co-bub"><div class="co-t"></div><div class="co-b"><button class="co-skip">Skip tips</button><button class="btn pri co-n"></button></div></div>';document.body.appendChild(el);
    el.querySelector('.co-skip').onclick=coachEnd;el.querySelector('.co-n').onclick=coachNext;}
  el.querySelector('.co-t').innerHTML=iconize(c.txt);const n=el.querySelector('.co-n');n.hidden=!c.btn;n.textContent=c.btn||'';el.classList.toggle('dim',!!c.dim);el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');sfx('tick');}
function coachNext(){const C=UI.coach;if(!C)return;C.i++;C.t=0;if(C.i>=C.list.length)return coachEnd();coachShow();}
function coachEnd(){UI.coach=null;const el=$('#coach');if(el)el.remove();}
function tickCoach(dt){if(!S||UI.demo)return;
  if(!UI.coach&&S.day===2&&S.phase==='board'&&!S.flags.coachUp&&!modalOpen()&&camS.mode!=='cine'){S.flags.coachUp=1;coachStart(COACH_UP);}
  const C=UI.coach;if(!C)return;const c=C.list[C.i],el=$('#coach');if(!el)return;
  const hide=modalOpen()||camS.mode==='cine'||MG.on;el.style.visibility=hide?'hidden':'visible';if(hide)return;
  const t=c.el&&$(c.el),r=t&&!t.hidden&&t.getClientRects().length?t.getBoundingClientRect():null,ring=el.querySelector('.co-ring'),bub=el.querySelector('.co-bub');
  if(r){ring.style.display='block';ring.style.left=(r.left-8)+'px';ring.style.top=(r.top-8)+'px';ring.style.width=(r.width+16)+'px';ring.style.height=(r.height+16)+'px';
    const bw=Math.min(340,innerWidth-24),below=r.bottom+180<innerHeight;bub.style.left=clamp(r.left+r.width/2-bw/2,12,innerWidth-bw-12)+'px';bub.style.top=(below?r.bottom+18:Math.max(12,r.top-18-bub.offsetHeight))+'px';bub.style.width=bw+'px';}
  else{ring.style.display='none';bub.style.left=(innerWidth/2-170)+'px';bub.style.top=(innerHeight*.18)+'px';}
  if(c.until&&c.until())coachNext();else if(c.time){C.t+=dt;if(C.t>c.time)coachNext();}}

/* ---------- feel: rolling cash, auto quality ---------- */
const PERF={t:0,n:0};
function rollCash(dt){if(!S||UI.demo||UI.cashT==null)return;if(UI.cashV==null)UI.cashV=UI.cashT;const d=UI.cashT-UI.cashV;if(Math.abs(d)<.5){if(UI.cashV!==UI.cashT){UI.cashV=UI.cashT;$('#hCash').textContent=money(UI.cashT);}return;}
  UI.cashV+=d*Math.min(1,dt*7)+Math.sign(d)*Math.min(Math.abs(d),dt*20);$('#hCash').textContent=money(Math.round(UI.cashV));const h=$('#hCash').parentElement;h.classList.remove('up','down');void h.offsetWidth;h.classList.add(d>0?'up':'down');}
function tickPerf(dt){if(SET.gfx!==-1||PARAMS.has('test')||camS.mode!=='play'||document.hidden)return;PERF.t+=dt;PERF.n++;if(PERF.t<4)return;const fps=PERF.n/PERF.t;PERF.t=PERF.n=0;
  if(fps<26&&Q.pr>.55){Q.pr=+(Q.pr-.15).toFixed(2);resize();}}
function tickShell(dt){rollCash(dt);tickCoach(dt);tickPerf(dt);}

/* outdoor ground reads too bright under the sky light: give matte outdoor surfaces their own, duller copy */
function dimOutdoor(root){const v=new THREE.Vector3(),cache={};root.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh||o.isInstancedMesh)return;const m=o.material;if(!m||Array.isArray(m)||!m.isMeshStandardMaterial||m.roughness<.8)return;
  o.getWorldPosition(v);if(!(v.z>7.6||v.y<0||Math.abs(v.x)>45))return;o.material=cache[m.uuid]||(cache[m.uuid]=Object.assign(m.clone(),{envMapIntensity:.3}));});}
