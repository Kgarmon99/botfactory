/* =====================================================================
   BOTFACTORY · game glue: HUD, panels, interactions, Next Up, shift loop
   ===================================================================== */
const UI={panel:null,goal:null,goalKey:'',gT:0,beacon:null,ring:null,lastHud:'',act:null,cine:0};
const SAVE='botfactory-v2';
function save(){if(!S)return;try{localStorage.setItem(SAVE,JSON.stringify(S));}catch(e){}}
function load(){try{const s=JSON.parse(localStorage.getItem(SAVE)||'null');if(s&&s.v===2)return s;}catch(e){}return null;}
const titleOn=()=>!$('#title').hidden;
const blocked=()=>modalOpen()||titleOn()||camS.mode==='cine'||MG.on;
function running(){return S&&S.phase==='day'&&S.speed>0&&!modalOpen()&&!MG.on&&camS.mode!=='cine';}
function setSpeed(n){if(!S)return;S.speed=n;renderHUD();}
function togglePause(){if(!S||S.phase!=='day')return;S.speed=S.speed?0:1;renderHUD();}
function toggleOverview(){camS.over=!camS.over;$('#btnView').classList.toggle('on',camS.over);}
const tagToday=k=>{if(S&&S.today){(S.today.tags=S.today.tags||{})[k]=1;}};

/* ---------- HUD ---------- */
function stars(r){const n=Math.round(r/20);return '★'.repeat(n)+'<i>'+'★'.repeat(5-n)+'</i>';}
function renderHUD(){if(!S)return;const st=STAGES[S.stage],nx=STAGES[S.stage+1],prog=nx?clamp(S.cash/nx.cost,0,1):1;
  $('#hCash').textContent=money(S.cash);$('#hRep').innerHTML=stars(S.rep);$('#hDay').textContent=S.phase==='day'?`Shift ${S.day} · ${timeStr(S.clock/SHIFT_LEN)}`:'Day '+S.day+' · 8:00 AM';
  $('#hStage').textContent=st.name;$('#hNext').textContent=nx?`Next: ${nx.name} · ${short(nx.cost)}`:'MAX SIZE · legend status';$('#hBar').style.width=(prog*100)+'%';$('#hPlant').classList.toggle('ready',!!nx&&S.cash>=nx.cost);
  $$('#speed button').forEach(b=>b.classList.toggle('on',+b.dataset.s===S.speed));$('#speed').style.visibility=S.phase==='day'?'visible':'hidden';
  $('#btnStart').hidden=S.phase!=='board';$('#clockFill').style.width=(S.phase==='day'?S.clock/SHIFT_LEN*100:0)+'%';
  const dkE=$('#dkExpand');if(dkE)dkE.classList.toggle('ping',!!nx&&S.cash>=nx.cost);}
function renderRush(){const r=S&&S.rush,el=$('#rush');if(!r){el.hidden=true;return;}el.hidden=false;el.innerHTML=`<b>🚚 RUSH TRUCK</b> Ship <b>${r.need-r.got}</b> more in <b>${Math.ceil(r.t)}s</b> <span>+${money(r.bonus)} bonus</span>`;}

/* ---------- panels ---------- */
function openPanel(k){if(!S)return;UI.panel=k;const C=openModal(`<button class="x" id="pX" aria-label="Close">×</button>`+({tech:panelTech,contracts:panelContracts,upgrades:panelUpgrades,expand:panelExpand,numbers:panelNumbers,makers:panelMakers})[k](),{cls:'dark panel wide'});
  C.querySelector('#pX').onclick=()=>{UI.panel=null;closeModal();};bindPanel(C,k);}
function refreshPanel(){if(UI.panel&&modalOpen()){const k=UI.panel;closeModal();openPanel(k);}}
function tierPips(t){return `<span class="pips">${[0,1,2].map(i=>`<i class="${i<=t?'on':''}"></i>`).join('')}</span>`;}
function lineHead(l){const P=PRODUCTS[l.job.product],cap=capacity(l),c=contractOf(l);return `<div class="lh"><b>Line ${l.i+1}</b><span>${P.icon} ${P.name}</span><span class="muted">~${cap.n}/shift · slowest: <b class="warn">${STATIONS[cap.by].name}</b></span>${c?`<span class="tag">📄 ${esc(c.client)} ${c.got}/${c.qty}</span>`:''}</div>`;}
function panelUpgrades(){const lines=S.lines.slice(0,lineCount());return `<div class="eyebrow">Upgrades</div><h2>Level up your stations</h2><p class="sub">Each station goes <b>Manual → Power Tools → Robot Cell</b>. Your line only goes as fast as its <b>slowest</b> station, so upgrade that one first.</p>`+
  lines.map(l=>lineHead(l)+`<div class="ups">${ST_KEYS.filter(k=>STAGES[S.stage].wide||!['paint','qa'].includes(k)).map(k=>{const s=l.st[k],D=STATIONS[k],c=upgradeCost(l,k),bn=capacity(l).by===k&&PRODUCTS[l.job.product].needs.includes(k),T=TIERS[s.tier],N=s.built&&s.tier<2?TIERS[s.tier+1]:null;
    return `<div class="up ${bn?'bn':''} ${s.built?'':'unb'}"><div class="up-h"><span class="up-ic" style="--c:${D.color}">${D.icon}</span><div><b>${D.name}</b>${s.built?tierPips(s.tier)+` <small>${T.name}</small>`:'<small>Not built</small>'}</div>${bn?'<em class="bnb">BOTTLENECK</em>':''}</div>
      <p>${D.blurb}</p>${s.built?`<div class="up-st"><span>Speed <b>${T.speed}×</b></span><span>Defects <b>${Math.round(T.defect*100)}%</b></span><span>${T.wage?`Wage <b>${money(T.wage)}</b>`:'No wages'}</span></div>`:''}
      ${c!=null?`<button class="btn ${bn?'pri':''} sm" data-up="${l.i}:${k}" ${S.cash<c?'disabled':''}>${s.built?`⬆ ${N.name}`:'🏗 Build'} · ${money(c)}</button>${N?`<small class="up-n">→ ${N.speed}× speed, ${Math.round(N.defect*100)}% defects${s.tier+1===2?', robot: no wages, $45/shift upkeep':''}</small>`:''}`:'<span class="maxd">MAXED</span>'}
      ${s.built&&s.wear>.45?`<button class="btn ghost sm" data-svc="${l.i}:${k}">🧰 Service · ${money(ECON.serviceCost)} <small>wear ${Math.round(s.wear*100)}%</small></button>`:''}</div>`;}).join('')}</div>`).join('');}
function panelContracts(){const lines=S.lines.slice(0,lineCount());
  return `<div class="eyebrow">Contracts</div><h2>What should your lines make?</h2><p class="sub">Contracts pay <b>more</b> than the open market, but you have to deliver on time. Check your line can make enough per shift before you sign.</p>
  <h4>Your lines</h4>${lines.map(l=>{const c=contractOf(l);return `<div class="ln">${lineHead(l)}${c?`<div class="cbar"><i style="width:${c.got/c.qty*100}%"></i></div><small class="muted">Due end of day ${c.due} · ${money(c.price)} each + ${money(c.bonus)} bonus</small>`:`<div class="prods">${Object.keys(PRODUCTS).map(p=>{const P=PRODUCTS[p],why=canMake(l,p);return `<button class="prod ${l.job.product===p?'on':''}" data-prod="${l.i}:${p}" ${why?'disabled':''} title="${esc(why)}"><span>${P.icon}</span><b>${P.name}</b><small>${why?esc(why):`${money(Math.round(P.price*ECON.marketCut))} each · ~${capacity(l,p).n}/shift`}</small></button>`;}).join('')}</div>`}</div>`;}).join('')}
  <h4>Offers on the board</h4><div class="offers">${S.offers.map(o=>{const P=PRODUCTS[o.p];return `<div class="offer"><div class="of-h"><span>${P.icon}</span><div><b>${esc(o.client)}</b><small>${o.qty} × ${P.name}</small></div><em>${money(o.price*o.qty+o.bonus)}</em></div>
    <div class="of-st"><span>${money(o.price)} each <small class="g">(market ${money(Math.round(P.price*ECON.marketCut))})</small></span><span>${o.days} day${o.days>1?'s':''}</span><span>+${money(o.bonus)} bonus</span></div>
    <div class="of-acts">${lines.map(l=>{const why=canMake(l,o.p)||(l.job.cid?'Busy':''),cap=capacity(l,o.p).n*o.days,risky=!why&&cap<o.qty;return `<button class="btn sm ${risky?'':'pri'}" data-acc="${o.id}:${l.i}" ${why?'disabled':''} title="${esc(why)}">Line ${l.i+1}${why?'':risky?` ⚠ makes ~${cap}`:` ✓ ~${cap}`}</button>`;}).join('')}</div></div>`;}).join('')||'<p class="muted">New offers arrive every day.</p>'}</div>`;}
function panelExpand(){const nx=STAGES[S.stage+1],cost=nx?nx.cost:0;
  return `<div class="eyebrow">Expand the plant</div><h2>${nx?'Go bigger: '+nx.name:'You built a Mega Plant'}</h2>
  ${nx?`<div class="xp-card"><p>${nx.pitch}</p><div class="xp-row"><span>Cost <b>${money(cost)}</b></span><span>Rent <b>${money(STAGES[S.stage].rent)} → ${money(nx.rent)}</b>/shift</span><span>Lines <b>${STAGES[S.stage].lines} → ${nx.lines}</b></span></div>
    <div class="xbar"><i style="width:${clamp(S.cash/cost,0,1)*100}%"></i><span>${money(S.cash)} / ${money(cost)}</span></div>
    <button class="btn pri big" id="doExpand" ${S.cash<cost?'disabled':''}>🏗 Build the ${nx.name}</button>
    <p class="muted small">💡 Rent goes up, but more products share it. Bigger plants make each product <b>cheaper</b>. That's <b>economies of scale</b>.</p></div>`:'<p class="sub">Four lines, a robot fleet and your name on the roof. Keep stacking profit to push your plant value higher.</p>'}
  <h4>The road to Mega Plant</h4><div class="ladder">${STAGES.map((s,i)=>`<div class="rung ${i<S.stage?'done':i===S.stage?'cur':''}"><b>${i<S.stage?'✓':i===S.stage?'▶':'🔒'} ${s.name}</b><small>${s.lines} line${s.lines>1?'s':''}${s.wide?' · full width':''} · ${i?money(s.cost):'start'}</small></div>`).join('')}</div>
  <p class="muted">Plant value: <b>${money(plantValue())}</b></p>`;}
function panelNumbers(){const H=S.hist.slice(-12),mx=Math.max(100,...H.map(h=>Math.abs(h.net))),last=H[H.length-1];
  return `<div class="eyebrow">The numbers</div><h2>How's the business?</h2>
  <div class="kpis"><div><em>Cash</em><b>${money(S.cash)}</b></div><div><em>Plant value</em><b>${short(plantValue())}</b></div><div><em>Products shipped</em><b>${S.stats.shipped.toLocaleString()}</b></div><div><em>Best shift</em><b>${money(S.stats.best)}</b></div></div>
  <h4>OEE (last shift)</h4>${oeeHTML(S.hist.length?plantOEE(S.hist[S.hist.length-1]):null,'Plant OEE')}<p class="muted small">Tip: press <b>T</b> or the 🧿 button for the live Digital Twin view.</p>
  <h4>Profit per shift</h4>${H.length?`<div class="bars">${H.map(h=>`<div class="bar"><i class="${h.net>=0?'p':'n'}" style="height:${Math.max(3,Math.abs(h.net)/mx*100)}%"></i><span>${h.day}</span></div>`).join('')}</div>`:'<p class="muted">Run a shift to see your numbers.</p>'}
  ${H.length>1?`<h4>Cost to make one product</h4><div class="bars thin">${H.map(h=>`<div class="bar"><i class="u" style="height:${h.unit?Math.min(100,h.unit/Math.max(...H.map(x=>x.unit||0))*100):0}%"></i><span>${h.unit?'$'+Math.round(h.unit):'-'}</span></div>`).join('')}</div><p class="muted small">When this drops, you're making each product for less. More volume spreads your fixed costs (rent, wages) thinner.</p>`:''}
  ${last?`<p class="muted small">Last shift: fixed costs ${money(last.fixed)} · materials ${money(last.mat)} · ${last.shipped} shipped</p>`:''}`;}
function panelTech(){S.tech=S.tech||{};return `<div class="eyebrow">Plant Tech</div><h2>Robots & tech for your plant</h2>
  <div class="millcard"><div class="mc-i">🔥</div><div><div class="eyebrow">Field trip · Sponsor showcase</div><b>${esc(millName())} Tour</b><p>Run a real steel mill: magnet crane, electric arc furnace, caster and hot rolling mill. Finish it and your factory gets <b>15% cheaper steel</b>.</p>${S.flags.millDone?'<span class="maxd">✓ TOUR COMPLETE · PARTNER BONUS ACTIVE</span> ':''}<button class="btn pri sm" id="goMill" ${S.phase!=='board'?'disabled title="Between shifts only"':''}>${S.flags.millDone?'Visit again':'Start the tour'} ▶</button></div></div>
  <p class="sub">Each unlock shows up in your plant <b>and</b> makes it run better.</p><div class="techs">${TECH.map(T=>{const own=S.tech[T.id],lock=T.stage>S.stage;return `<div class="tc ${own?'own':''} ${lock?'lock':''}"><div class="tc-i">${lock?'🔒':T.icon}</div><b>${T.name}</b><p>${T.does}</p><p class="tc-l">💡 ${T.lesson}</p>${own?'<span class="maxd">✓ ONLINE</span>':lock?`<small class="muted">Unlocks at the ${STAGES[T.stage].name}</small>`:`<button class="btn pri sm" data-tech="${T.id}" ${S.cash<T.cost?'disabled':''}>Unlock · ${money(T.cost)}</button>`}</div>`;}).join('')}</div>`;}
function panelMakers(){const seen=(S.flags.careersShown)||{};return `<div class="eyebrow">Meet the Makers</div><h2>Real jobs you've met</h2><p class="sub">Every shift, you'll meet a real manufacturing career connected to what you just did on the floor.</p>
  <div class="mk-grid">${Object.keys(CAREERS).map(k=>{const c=CAREERS[k];return seen[k]?`<div class="mkc"><span>${c.icon}</span><b>${c.role}</b><small>${c.path.split('.')[0]}.</small></div>`:`<div class="mkc lock"><span>🔒</span><b>???</b><small>Keep playing to meet this one</small></div>`;}).join('')}</div>`;}
function bindPanel(C,k){
  C.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const [li,key]=b.dataset.up.split(':');const e=upgrade(+li,key);if(e){toast(e,'bad');return;}afterUpgrade(+li,key);refreshPanel();});
  C.querySelectorAll('[data-svc]').forEach(b=>b.onclick=()=>{const [li,key]=b.dataset.svc.split(':');const e=service(+li,key);if(e)toast(e,'bad');else{toast('🧰 Serviced. Fresh machines break down less.','good');sfx('good');}refreshPanel();});
  C.querySelectorAll('[data-prod]').forEach(b=>b.onclick=()=>{const [li,p]=b.dataset.prod.split(':');const e=setProduct(+li,p);if(e)toast(e,'bad');else sfx('tick');refreshPanel();});
  C.querySelectorAll('[data-acc]').forEach(b=>b.onclick=()=>{const [id,li]=b.dataset.acc.split(':');const e=acceptOffer(+id,+li);if(e)toast(e,'bad');else{sfx('good');tagToday('contract');}refreshPanel();});
  const gm=C.querySelector('#goMill');if(gm)gm.onclick=()=>{UI.panel=null;closeModal();enterMill();};
  C.querySelectorAll('[data-tech]').forEach(b=>b.onclick=()=>{const e=buyTech(b.dataset.tech);if(e){toast(e,'bad');return;}UI.panel=null;closeModal();});
  const x=C.querySelector('#doExpand');if(x)x.onclick=()=>{UI.panel=null;closeModal();doExpand();};
  renderHUD();save();}
function afterUpgrade(li,k){const s=S.lines[li].st[k];syncStations();const x=SLOT_X[k],z=LZ(li);for(let i=0;i<5;i++)setTimeout(()=>burst(x+rand(-1.5,1.5),.4,z+rand(-1.5,.5),{n:6,color:'#D1D5DB',spread:1.4,up:1.6,g:2,life:.9,size:.18,grow:2}),i*80);
  sfx('build');floatAt(x,3,z,s.tier===0?'BUILT!':TIERS[s.tier].name.toUpperCase()+'!','#FACC15',true);camS.shake=.3;
  if(s.tier===2){sfx('big');confetti(80);if(!S.flags.robotTold){S.flags.robotTold=1;advise(TIPS.robot,12000);}}
  renderHUD();save();}

/* ---------- expansion: the big moment ---------- */
function doExpand(){toggleTwin(false);const e=expand();if(e){toast(e,'bad');return;}const st=STAGES[S.stage],B=hallBounds();tagToday('expand');
  $('#fade').classList.add('on');sfx('build');letterbox(true);setTimeout(()=>{rebuildWorld();UI.beacon=null;initBeacon();
    const c=hallCenter();camS.mode='cine';camS.cinePos=V(c.x+(B.x1-B.x0)*.25,Math.max(26,(B.z1-B.z0)*1.2),c.z+(B.z1-B.z0)*.75+16);camS.cineLook=V(c.x,0,c.z);camera.position.set(c.x+30,40,c.z+60);
    $('#fade').classList.remove('on');sfx('big');confetti(200);
    const b=document.createElement('div');b.className='bigban';b.innerHTML=`<small>Plant expanded</small><b>${st.name.toUpperCase()}</b><span>${st.pitch}</span>`;document.body.appendChild(b);
    setTimeout(()=>{b.remove();camS.mode='play';letterbox(false);advise(S.stage===1?'Welcome to the <b>Workshop</b>! Walk to the glowing pads to <b>build a Paint Booth and QA Scanner</b>. They unlock Drones and E-Scooters.':S.stage===2?'A <b>second line</b>! Set what it makes in <b>Contracts</b>. '+TIPS.scale:TIPS.scale,14000);renderHUD();save();},4200);},700);}

/* ---------- interacting with the floor ---------- */
function nearestAct(){if(!S||blocked())return null;if(MILL.on)return millAct();const px=P.pos.x,pz=P.pos.z;let best=null,bd=3.1;
  if(nearFork())return {t:'Hop on the forklift',ic:'🚜',f:toggleRide};
  if(W.kiosk&&Math.hypot(px-W.kiosk.x,pz-W.kiosk.z-.9)<2.2)return {t:'Open the Expansion Office',ic:'🏗',f:()=>openPanel('expand')};
  S.lines.slice(0,lineCount()).forEach((l,li)=>stationsOnAll(li).forEach(k=>{const x=SLOT_X[k],z=LZ(li)+2.3,d=Math.hypot(px-x,pz-z);if(d<bd){bd=d;best={li,k};}}));
  if(!best)return CX.riding?{t:'Hop off the forklift',ic:'🚜',f:toggleRide}:null;const {li,k}=best,l=S.lines[li],s=l.st[k],D=STATIONS[k];
  if(!s.built)return {t:`Build ${D.name} · ${money(D.buildCost)}`,ic:'🏗',f:()=>{const e=upgrade(li,k);if(e)toast(e,'bad');else afterUpgrade(li,k);}};
  if(s.broken)return {t:`Fix the ${D.name}`,ic:'🛠️',hot:1,f:()=>startGame('repair',li,k)};
  if(s.needsCode)return {t:`Program the robot`,ic:'💻',hot:1,f:()=>startGame('program',li,k)};
  if(S.phase!=='day'){const c=upgradeCost(l,k);return c!=null?{t:`Upgrade ${D.name} · ${money(c)}`,ic:'⬆',f:()=>openPanel('upgrades')}:{t:`${D.name} is maxed`,ic:'✓',f:()=>openPanel('upgrades')};}
  if(s.tier===2)return {t:`Robot cell running`,ic:'🤖',f:()=>openPanel('upgrades')};
  const cd=(S.gameCD[li+k]||0)-S.clock;if(cd>0)return {t:`Hands-on ready in ${Math.ceil(cd)}s`,ic:'⏳',f:null};
  return {t:`Work the ${D.name}`,ic:D.icon,hot:l.st[k].q.length>=4,f:()=>startGame(D.game,li,k)};}
function stationsOnAll(li){return ST_KEYS.filter(k=>STAGES[S.stage].wide||!['paint','qa'].includes(k));}
function doAction(){const a=nearestAct();if(a&&a.f)a.f();}
function updateAct(){const a=nearestAct(),el=$('#act');UI.act=a;if(!a){el.hidden=true;return;}el.hidden=false;el.classList.toggle('hot',!!a.hot);el.disabled=!a.f;const h=`<kbd>${TOUCH?'TAP':'E'}</kbd><span>${a.ic}</span>${esc(a.t)}`;if(el.dataset.h!==h){el.innerHTML=h;el.dataset.h=h;}}
function startGame(kind,li,k){const l=S.lines[li];playGame(kind,{li,k,p:l.job.product},score=>{S.stats.games++;if(S.today){S.today.games++;}const x=SLOT_X[k],z=LZ(li);
  ({laser:'laser',weld:'weld',assemble:'assemble',paint:'paint',qa:'qa',repair:'repair',program:'program'})[kind]&&tagToday(kind);
  if(kind==='repair'){if(score>=.45){fixStation(li,k,true);floatAt(x,2.6,z,'FIXED! −$40','#39E75F',true);}else{toast('The repair crew is on the way.','warn');}}
  else if(kind==='program'){l.st[k].needsCode=false;S.flags['prog_'+k]=1;floatAt(x,2.6,z,'ROBOT ONLINE','#FACC15',true);}
  else if(kind==='qa'){if(score>=.45){l.belt.forEach(it=>it.d=false);S.rep=clamp(S.rep+1.5,0,100);floatAt(x,2.6,z,'DEFECTS PULLED','#A855F7',true);}S.gameCD[li+k]=S.clock+18;}
  else{if(score>=.45){boostStation(li,k,12+score*18);floatAt(x,2.6,z,'2× SPEED!','#22D3EE',true);}S.gameCD[li+k]=S.clock+18;}
  renderHUD();save();});}

/* ---------- Next Up guide + 3D arrow ---------- */
function initBeacon(){if(UI.beacon){scene.remove(UI.beacon);scene.remove(UI.ring);}const g=new THREE.Group(),m=new THREE.MeshBasicMaterial({color:'#39E75F',transparent:true,opacity:.95,depthTest:false});const cone=new THREE.Mesh(new THREE.ConeGeometry(.45,.9,4),m);cone.rotation.x=Math.PI;cone.renderOrder=11;g.add(cone);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.8,1.02,40),new THREE.MeshBasicMaterial({color:'#39E75F',transparent:true,opacity:.75,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;g.visible=ring.visible=false;scene.add(g);scene.add(ring);UI.beacon=g;UI.ring=ring;UI.coneMat=m;}
function goal(){if(!S||titleOn())return null;if(MILL.on)return millGoal();const nx=STAGES[S.stage+1],lines=S.lines.slice(0,lineCount()),fr=(li,k)=>({x:SLOT_X[k],z:LZ(li)+2.3});
  if(S.phase==='board'){if(S.day===1&&!S.hist.length)return {t:'Press Start Shift to fire up your line',k:'▶'};
    if(nx&&S.cash>=nx.cost)return {t:`You can afford the ${nx.name}! Head to the Expansion Office`,k:'🏗',hot:1,x:W.kiosk.x,z:W.kiosk.z+1};
    if(S.stage>=1){for(const l of lines)for(const k of ['paint','qa'])if(!l.st[k].built&&S.cash>=STATIONS[k].buildCost)return {t:`Build a ${STATIONS[k].name} on Line ${l.i+1}`,k:STATIONS[k].icon,...fr(l.i,k)};}
    for(const l of lines){const b=capacity(l).by,c=upgradeCost(l,b);if(c!=null&&S.cash>=c)return {t:`Upgrade your bottleneck: ${STATIONS[b].name}`,k:'⬆',...fr(l.i,b)};}
    for(const T of TECH)if(!S.tech[T.id]&&T.stage<=S.stage&&S.cash>=T.cost+300)return {t:`Unlock new tech: ${T.icon} ${T.name}`,k:'🤖'};
    if(S.day>=2&&!S.flags.millDone)return {t:'New field trip! Open Tech and take the Steel Mill Tour',k:'🔥'};
    return {t:nx?`Save up ${short(nx.cost)} to build the ${nx.name}`:'Start the next shift',k:'💰'};}
  if(S.phase!=='day')return null;
  for(const l of lines)for(const k of ST_KEYS)if(l.st[k].built&&l.st[k].broken)return {t:`${STATIONS[k].name} broke down! Go fix it`,k:'⚠️',hot:1,...fr(l.i,k)};
  for(const l of lines)for(const k of ST_KEYS)if(l.st[k].needsCode)return {t:`Program your new robot cell`,k:'💻',hot:1,...fr(l.i,k)};
  if(S.rush)return {t:`Rush truck! Ship ${S.rush.need-S.rush.got} more fast. Boost a station!`,k:'🚚',hot:1,...(()=>{const l=lines[0],b=capacity(l).by;return l.st[b].tier<2?fr(0,b):{};})()};
  for(const l of lines){let w=null,wq=4;ST_KEYS.forEach(k=>{if(l.st[k].q.length>=wq){wq=l.st[k].q.length;w=k;}});if(w)tagToday('bottleneck');if(w&&l.st[w].tier<2&&(S.gameCD[l.i+w]||0)<=S.clock)return {t:`Crates piling up at ${STATIONS[w].name}! Work it yourself`,k:'📦',hot:1,...fr(l.i,w)};}
  let best=null,bd=1e9;for(const l of lines)for(const k of PRODUCTS[l.job.product].needs){const s=l.st[k];if(s.tier<2&&s.built&&(S.gameCD[l.i+k]||0)<=S.clock){const f=fr(l.i,k),d=Math.hypot(P.pos.x-f.x,P.pos.z-f.z);if(d<bd){bd=d;best={k2:k,li:l.i,...f};}}}
  if(best)return {t:`Get hands-on: work the ${STATIONS[best.k2].name} for a speed boost`,k:STATIONS[best.k2].icon,x:best.x,z:best.z};
  return {t:'Line is humming. Watch for jams and breakdowns',k:'👀'};}
function updateGoal(){const g=goal(),el=$('#nextUp');UI.goal=g;const show=!!g&&!modalOpen()&&camS.mode!=='cine';el.hidden=!show;if(!show)return;const key=g.k+g.t+(g.hot?1:0);
  if(key!==UI.goalKey){UI.goalKey=key;el.querySelector('i').textContent=g.k;el.querySelector('b').textContent=g.t;el.classList.toggle('hot',!!g.hot);el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');}}
function updateBeacon(dt,t){const B=UI.beacon,R=UI.ring;if(!B)return;const g=UI.goal,show=g&&g.x!=null&&!modalOpen()&&camS.mode==='play'&&Math.hypot(P.pos.x-g.x,P.pos.z-g.z)>2.4;B.visible=R.visible=!!show;if(!show)return;
  const col=g.hot?'#FFB020':'#39E75F';UI.coneMat.color.set(col);R.material.color.set(col);B.position.set(g.x,3.9+Math.sin(t*5)*.25,g.z-.6);B.rotation.y=t*2;const p=(t*1.4)%1;R.position.set(g.x,.06,g.z);R.scale.setScalar(.8+p*.6);R.material.opacity=.8*(1-p);}

/* ---------- events from the sim ---------- */
function drainEvents(){while(EV.length){const e=EV.shift();const L=W.lines[e.li];
  if(e.ev==='ship'&&L){L.ship++;if(L.ship%4===1)parkProduct(S.lines[e.li].job.product);if(L.ship%10===0)sendTruck(e.li,'ship');if(Math.random()<.4)floatAt(L.sx+1.2,1.8,L.z,'+'+money(e.v),'#39E75F');if(Math.random()<.3)sfx('coin');}
  if(e.ev==='break'){sfx('alarm');camS.shake=.25;tagToday('break');toast(`⚠️ <b>Breakdown on Line ${e.li+1}:</b> ${STATIONS[e.k].name}`,'bad');if(!S.flags.breakTold){S.flags.breakTold=1;advise(TIPS.breakdown,12000);}}
  if(e.ev==='autoprog')toast(`🤖 New ${STATIONS[e.k].name} robot loaded the program you already wrote. Online!`,'good');
  if(e.ev==='tech'){const T=TECH.find(x=>x.id===e.id);buildLife();slam('UNLOCKED',T.icon+' '+T.name,'#38BDF8',2400);sfx('big');confetti(120);renderHUD();save();}
  if(e.ev==='dogCatch'&&Math.random()<.5){const d=CX.dog;if(d)floatAt(d.g.position.x,2.2,d.g.position.z,'🐕 Defect caught!','#FACC15');}
  if(e.ev==='crew')toast(`The repair crew fixed Line ${e.li+1} for <b>${money(ECON.repairCrew)}</b>. Fixing it yourself costs $40.`,'warn');
  if(e.ev==='scrap'&&L){floatAt(SLOT_X.qa,2,L.z,'Defect caught','#A855F7');}
  if(e.ev==='return'){const sx=W.lines[e.li]?W.lines[e.li].sx:0;floatAt(sx,2.2,LZ(e.li),'Returned −'+money(e.c),'#F87171');sfx('bad');if(!S.flags.retTold){S.flags.retTold=1;advise(TIPS.returns,12000);}}
  if(e.ev==='contractDone'){toast(`📄 <b>${esc(e.c.client)}</b> contract done! +${money(e.c.bonus)} bonus`,'good');sfx('win');confetti(60);}
  if(e.ev==='rush'){sfx('horn');toast(`🚚 <b>Rush truck!</b> Ship ${e.r.need} in ${e.r.t}s for a ${money(e.r.bonus)} bonus`,'gold');sendTruck(0,'ship');}
  if(e.ev==='rushDone'){toast(`🚚 Rush delivered! <b>+${money(e.b)}</b>`,'good');sfx('win');confetti(80);}
  if(e.ev==='rushFail')toast('The rush truck left without a full load.','warn');
  if(e.ev==='report'){slam('SHIFT COMPLETE',(e.T.net>=0?'+':'')+money(e.T.net),e.T.net>=0?'#39E75F':'#F87171',2000);sfx('win');setTimeout(()=>shiftReport(e.T),1900);}}}

/* ---------- shift report ---------- */
function lessonOf(T){const nx=STAGES[S.stage+1];
  if(T.retN)return `${T.retN} product${T.retN>1?'s':''} came back broken and cost you ${money(T.returns)}. A <b>QA Scanner</b> (or hands-on inspections) catches defects before they ship.`;
  if(T.repairs>=ECON.repairCrew)return `Breakdowns cost ${money(T.repairs)} today. <b>Service</b> worn machines between shifts: cheap maintenance beats expensive repairs.`;
  if(T.net<0)return `Loss today. Your fixed costs (rent ${money(T.rent)} + wages ${money(T.wages)}) are paid even if the line sits still. Ship more per shift by upgrading your <b>bottleneck</b>.`;
  if(S.hist.length>1&&T.unit&&S.hist[S.hist.length-2].unit&&T.unit<S.hist[S.hist.length-2].unit)return `Each product cost <b>${money(T.unit)}</b> to make, down from ${money(S.hist[S.hist.length-2].unit)}. More output spreads the same fixed costs thinner.`;
  if(nx)return `Profit goes into savings for the <b>${nx.name}</b>. ${money(Math.max(0,nx.cost-S.cash))} to go.`;
  return 'Every product past break-even is pure profit. Margin × volume is the whole game.';}
function shiftReport(T){const gr=grade(T),gc={S:'#FACC15',A:'#39E75F',B:'#38BDF8',C:'#F59E0B',D:'#F87171'}[gr],row=(a,b,c)=>`<div class="pr ${c||''}"><span>${a}</span><b>${b<0?'−':''}${money(Math.abs(b))}</b></div>`;
  if(gr==='S'||gr==='A'){confetti(120);sfx('win');}else sfx('good');
  const C=openModal(`<div class="rep"><div class="rep-top"><div class="gl" style="--gc:${gc}">${gr}</div><div><div class="eyebrow">Shift ${T.day} report · ${STAGES[T.stage].name}</div><h2 class="${T.net>=0?'g':'r'}">${T.net>=0?'Profit':'Loss'} ${money(T.net)}</h2><p class="sub">${T.shipped} shipped${T.games?` · ${T.games} hands-on job${T.games>1?'s':''}`:''}${T.bonus?` · ${money(T.bonus)} in bonuses`:''}</p></div></div>
    <div class="pl">${row('Sales',T.rev)}${T.bonus?row('Contract & rush bonuses',T.bonus):''}
      <div class="ph">Variable costs <small>go up with every product</small></div>${row('Steel & parts',-T.mat)}
      <div class="ph">Fixed costs <small>same if you make 0 or 1,000</small></div>${row('Rent',-T.rent)}${T.wages?row('Wages',-T.wages):''}${T.upkeep?row('Machine upkeep',-T.upkeep):''}${T.repairs?row('Repairs & service',-T.repairs,'bad'):''}${T.returns?row(`Refunds (${T.retN} returned)`,-T.returns,'bad'):''}
      ${row('Net profit',T.net,'tot '+(T.net>=0?'g':'r'))}</div>
    <div class="kpis"><div><em>Cost per product</em><b>${T.unit?money(T.unit):'—'}</b></div><div><em>Cash</em><b>${money(S.cash)}</b></div><div><em>Reputation</em><b class="st">${stars(S.rep)}</b></div></div>
    ${T.late.length?`<div class="note bad">⏰ Missed deadline: ${T.late.map(c=>esc(c.client)).join(', ')}. Reputation dropped.</div>`:''}${T.bailout?'<div class="note bad">You ran out of cash, so the bank gave you $2,000. Reputation took a hit.</div>':''}
    <h4>OEE · the score real plants live by</h4>${oeeHTML(plantOEE(T),'Shift OEE',true)}<div class="lesson">📈 ${oeeLesson(plantOEE(T))}</div>
    <div class="lesson">💡 ${lessonOf(T)}</div>${careerCard(T)}
    <div class="mact">${spBadge(spPresenting(),'Shift presented by')}<button class="btn pri big" id="rpGo" data-focus>Plan the next shift ▶</button></div></div>`,{cls:'dark panel wide'});
  C.querySelector('#rpGo').onclick=()=>{closeModal();nextDay();renderHUD();save();const nx=STAGES[S.stage+1];if(nx&&S.cash>=nx.cost&&!S.flags['xp'+S.stage]){S.flags['xp'+S.stage]=1;advise(TIPS.expand,12000);}};}

/* ---------- title + how to play ---------- */
function startNew(){const nm=($('#pname').value||'').trim().slice(0,18)||'Boss';newGame(nm);enterGame(true);}
function enterGame(fresh){initAudio();$('#title').hidden=true;document.body.classList.remove('titling');rebuildWorld();initBeacon();P.rig.root.visible=true;P.pos.set(-8,0,4.4);camS.mode='play';camS.yaw=.15;renderHUD();
  CX.parked=[];CX.lotDirty=true;if(PARAMS.has('mill')){setTimeout(()=>{if(modalOpen())closeModal();enterMill();},700);return;}if(fresh){if(PARAMS.has('test'))setTimeout(()=>howTo(),400);else introShots(()=>howTo());}else advise(`Welcome back, <b>${esc(S.name)}</b>. Your ${STAGES[S.stage].name} is ready.`,7000);}
function howTo(){const C=openModal(`<div class="howto-w"><img src="${MB_ASSETS.logo}" class="ht-logo" alt=""><div class="eyebrow">Welcome, ${esc(S.name)}</div><h2>Build a garage into a Mega Plant</h2>
  <div class="howto"><div><i>🏭</i><b>Run the line</b><p>Steel goes in, products come out, money comes in. Pick what your line makes in <b>Contracts</b>.</p></div>
  <div><i>🔥</i><b>Get hands-on</b><p>Walk up to a station and press ${TOUCH?'the button':'<b>E</b>'}: laser-cut, weld, assemble, paint. Nail it for a speed boost.</p></div>
  <div><i>🏗</i><b>Grow it huge</b><p>Upgrade to <b>robot cells</b>, then expand: Workshop, Factory, Big Factory, <b>Mega Plant</b>.</p></div></div>
  <p class="ht-arrow">Stuck? Follow the <b>green arrow</b> and the <b>Next up</b> tip.</p></div><div class="mact"><button class="btn pri big" id="ok" data-focus>Let's build!</button></div>`,{cls:'dark panel wide'});
  C.querySelector('#ok').onclick=()=>{closeModal();advise(TIPS.start,12000);};}
function bindUI(){$('#btnNew').onclick=startNew;$('#pname').addEventListener('keydown',e=>{if(e.key==='Enter')startNew();});$('#btnCont').onclick=()=>{S=load();if(S){S.tech=S.tech||{};S.phase=S.phase==='day'?'board':S.phase==='report'?'board':S.phase;enterGame(false);}};
  $('#btnStart').onclick=()=>{if(!S||S.phase!=='board'||MILL.on)return;toggleTwin(false);initAudio();startShift();sfx('horn');S.lines.slice(0,lineCount()).forEach((l,i)=>setTimeout(()=>sendTruck(i,'in'),i*400));renderHUD();if(!PARAMS.has('test'))shiftShots(()=>{});if(S.day===2&&!S.flags.wTold){S.flags.wTold=1;setTimeout(()=>advise(TIPS.weld,12000),4000);}};
  $$('#speed button').forEach(b=>b.onclick=()=>setSpeed(+b.dataset.s));$('#btnMute').onclick=()=>{muted=!muted;try{localStorage.setItem('botfactory-mute',muted?'1':'0');}catch(e){}$('#btnMute').textContent=muted?'🔇':'🔊';};$('#btnMute').textContent=muted?'🔇':'🔊';
  $('#btnView').onclick=toggleOverview;$('#skip').onclick=endShots;$('#btnTwin').onclick=()=>toggleTwin();$('#millExit').onclick=exitMill;$('#act').onclick=doAction;$('#advisor').onclick=()=>$('#advisor').classList.add('hide');
  $$('#dock [data-p]').forEach(b=>b.onclick=()=>{if(!blocked())openPanel(b.dataset.p);});$('#hPlant').onclick=()=>{if(!blocked())openPanel('expand');};
  $('#modal').addEventListener('click',e=>{if(e.target.id==='modal'&&UI.panel){UI.panel=null;closeModal();}});
  addEventListener('keydown',e=>{if(e.code==='Escape'&&UI.panel&&modalOpen()){UI.panel=null;closeModal();}});}

/* ---------- boot + loop ---------- */
async function boot(){const bar=$('#loadfill');bar.style.width='15%';initThree();setupMaterials();initFX();initItems();buildOutdoors();initCity();
  await loadSponsorLogos();$('#tSpons').innerHTML=spBadge(spPresenting());
  W.logoImg=await new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src=MB_ASSETS.logo;});bar.style.width='35%';
  const [h,c]=await Promise.all([parseGLB(MB_ASSETS.hero),parseGLB(MB_ASSETS.crowd)]);const clips=emoteClips();h.animations.push(...clips);c.animations.push(...clips.map(x=>x.clone()));GLTF.hero=h;GLTF.crowd=c;bar.style.width='70%';
  P.rig=makeRig(GLTF.hero,MB.hero,1.72);hardHat(P.rig,MB.hatW);vest(P.rig);scene.add(P.rig.root);P.rig.root.visible=false;
  /* a demo factory behind the title */
  newGame('');S.stage=2;S.tech={screens:1,agv:1,drones:1,dog:1};S.lines.push(newLine(1));S.lines.forEach(l=>{l.st.paint.built=l.st.qa.built=true;ST_KEYS.forEach((k,i)=>l.st[k].tier=(i+l.i)%3);l.job.product=l.i?'drone':'scooter';});startShift();for(let i=0;i<300;i++)stepShift(.1);rebuildWorld();UI.demo=true;
  initInput();bindUI();renderer.compile(scene,camera);bar.style.width='100%';
  $('#btnNew').disabled=false;$('#btnNew').textContent='Build my factory';if(load())$('#btnCont').hidden=false;$('#loadbar').style.visibility='hidden';
  camera.position.set(30,30,60);requestAnimationFrame(frame);}
let last=performance.now();
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;const t=now/1000;
  if(UI.demo&&titleOn()){stepShift(dt);EV.length=0;if(S.phase!=='day')startShift();}
  else if(UI.demo&&!titleOn()){UI.demo=false;}
  if(S&&!UI.demo){if(running()){const sub=S.speed;for(let i=0;i<sub;i++)stepShift(dt);}drainEvents();syncStations();
    UI.gT-=dt;if(UI.gT<=0){UI.gT=.15;updateGoal();renderHUD();renderRush();updateAct();}
    $('#clockFill').style.width=(S.phase==='day'?S.clock/SHIFT_LEN*100:0)+'%';
    if(!blocked()||camS.mode==='cine')updatePlayer(dt);else P.rig.mixer.update(dt);}
  if(S)updateCine(dt,t,UI.demo||running());updateMill(dt,t);updateTwin(dt);
  updateWorld(dt,t,UI.demo||running());stepFX(dt);updateBeacon(dt,t);updateCamera(dt,t);drawConfetti();renderFrame(t);}
window.BF={get S(){return S;},startShift,stepShift,endShift,upgrade,expand:doExpand,startGame,openPanel,P,camS,W,playGame,setSpeed};
boot().catch(e=>{console.error(e);$('#btnNew').textContent='Could not load: '+e.message;});
