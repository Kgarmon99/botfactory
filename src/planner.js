/* ===================== bottleneck game, rebuilt: PLAN before the shift, CLEAR JAMS during it ===================== */
/* --- plan math: try changes on a copy of the line, then put everything back --- */
function simLine(l,draft){const saved=[];ST_KEYS.forEach(k=>{const d=draft[k];if(!d)return;const s=l.st[k];saved.push([s,s.tier,s.ghost||0,s.built,s.needsCode]);
    let up=d.up||0;if(!s.built&&up>0){s.built=true;s.tier=0;up--;}s.tier=Math.min(2,s.tier+up);if(s.tier===2)s.needsCode=false;if(s.tier<2)s.ghost=(s.ghost||0)+(d.hire||0);});
  const c=capacity(l);saved.forEach(([s,t,g,b,n])=>{s.tier=t;s.ghost=g;s.built=b;s.needsCode=n;});return c;}
function capDraft(l,k,d){const x=l.st[k],t0=x.tier,g0=x.ghost||0,b0=x.built,n0=x.needsCode;let up=d.up||0;if(!x.built&&up>0){x.built=true;x.tier=0;up--;}x.tier=Math.min(2,x.tier+up);if(x.tier===2)x.needsCode=false;if(x.tier<2)x.ghost=g0+(d.hire||0);const v=x.built?stationCap(x,k):0;x.tier=t0;x.ghost=g0;x.built=b0;x.needsCode=n0;return v;}
function upCosts(l,k,n){const s=l.st[k],t0=s.tier,b0=s.built,out=[];for(let i=0;i<n;i++){const c=upgradeCost(l,k);if(c==null)break;out.push(c);if(!s.built){s.built=true;s.tier=0;}else s.tier++;}s.tier=t0;s.built=b0;return out;}
function lineTarget(l){const c=contractOf(l),now=capacity(l).n;if(c){const left=Math.max(1,c.due-S.day+1),need=Math.ceil(Math.max(0,c.qty-c.got)/left);return {n:Math.max(need,1),why:`${c.client.name||c.client}: ${c.qty-c.got} ${PRODUCTS[c.p].name}s, ${left} shift${left>1?'s':''} left`};}
  return {n:Math.max(now+3,Math.round(now*1.25)),why:'Stretch goal: beat your best'};}
const PL={draft:null,lines:null,start:null};
function planCost(){let cost=0,idle=S.workers.filter(w=>!w.at).length,newHires=0;PL.lines.forEach(li=>{const l=S.lines[li],D=PL.draft[li];ST_KEYS.forEach(k=>{const d=D[k];if(!d)return;
    upCosts(l,k,d.up||0).forEach(c=>cost+=c);for(let i=0;i<(d.hire||0);i++){if(idle>0)idle--;else{cost+=ECON.hireFee;newHires++;}}});});return {cost,newHires,wages:newHires*60};}
function wasted(li,k,kind){const l=S.lines[li],D=PL.draft[li],full=simLine(l,D).n,less=JSON.parse(JSON.stringify(D));less[k][kind]--;return simLine(l,less).n>=full;}

/* --- the planner --- */
function openPlanner(onStart){if(!S||S.phase!=='board')return;PL.start=onStart||PL.start;PL.lines=S.lines.slice(0,lineCount()).map(l=>l.i);if(!PL.draft||PL.draft.day!==S.day){PL.draft={day:S.day};PL.lines.forEach(li=>PL.draft[li]={});}
  const C=openModal(`<button class="x" id="plX">×</button><div class="eyebrow">Shift ${S.day} · Plan your line</div><h2>Hit the target. Don't waste a dollar.</h2>
    <p class="sub pl-rule">${ic('bulb')}<span>A line only moves as fast as its <b>shortest bar</b>. Make the shortest bar taller and the whole line speeds up. Spending on any other station changes nothing.</span></p>
    <div id="plBody"></div><div class="pl-foot" id="plFoot"></div>`,{cls:'dark panel wide planner'});
  C.querySelector('#plX').onclick=()=>closeModal();renderPlanner();}
function renderPlanner(flash){const body=$('#plBody');if(!body)return;const ok=[];
  body.innerHTML=iconize(PL.lines.map(li=>{const l=S.lines[li],D=PL.draft[li],r=routeOf(l),now=capacity(l),after=simLine(l,D),tg=lineTarget(l);
    const caps=r.map(k=>Math.floor(capDraft(l,k,D[k]||{})));
    const mx=Math.max(tg.n*1.25,...caps,1),hit=after.n>=tg.n;ok.push(hit);
    return `<div class="pl-line"><div class="pl-h"><b>Line ${li+1}</b><span>${PRODUCTS[l.job.product].icon} ${PRODUCTS[l.job.product].name}</span><em>${esc(tg.why)}</em></div>
      <div class="pl-pipes"><div class="pl-tgt" style="top:calc(5px + ${130*(1-Math.min(1,tg.n/mx))}px)"><span>NEED ${tg.n}</span></div>
      ${r.map((k,i)=>{const s=l.st[k],d=D[k]||{},bn=k===after.by,T=Math.min(2,(s.built?s.tier:-1)+(d.up||0)),crew=crewOf(s).length+(d.hire||0),canHire=s.built&&T<2&&crew<2||!s.built&&(d.up||0)>0&&T<2&&crew<2,
          upc=upCosts(l,k,(d.up||0)+1)[(d.up||0)],nextName=!s.built&&!(d.up)?'Build':T<2?TIERS[T+1].name:null,wU=(d.up||0)&&wasted(li,k,'up'),wH=(d.hire||0)&&wasted(li,k,'hire');
        return `<div class="pp ${bn?'bn':''} ${caps[i]<tg.n?'short':''}"><div class="pp-bar"><i style="height:${Math.max(3,caps[i]/mx*100)}%"></i>${bn?'<u>SLOWEST</u>':''}</div><b>${caps[i]}</b>
          <span>${STATIONS[k].icon} ${STATIONS[k].short}</span><small>${T<0?'Not built':TIERS[T].name}${T<2&&T>=0?` · ${crew} crew`:''}</small>
          <div class="pp-act">${nextName&&upc!=null?`<button class="btn sm ${bn?'pri':''}" data-a="up" data-l="${li}" data-k="${k}">⬆ ${nextName}<small>${money(upc)}</small></button>`:''}
           ${canHire?`<button class="btn sm" data-a="hire" data-l="${li}" data-k="${k}">👷 + Worker<small>${S.workers.some(w=>!w.at)?'idle crew':money(ECON.hireFee)}</small></button>`:''}
           ${d.up?`<button class="chip ${wU?'w':''}" data-a="-up" data-l="${li}" data-k="${k}">${wU?'WASTED · ':''}⬆×${d.up} ✕</button>`:''}${d.hire?`<button class="chip ${wH?'w':''}" data-a="-hire" data-l="${li}" data-k="${k}">${wH?'WASTED · ':''}👷×${d.hire} ✕</button>`:''}</div></div>`;}).join('')}</div>
      <div class="pl-res ${hit?'ok':''}">Line speed <b>${now.n}${after.n!==now.n?` → ${after.n}`:''}</b>/shift ${hit?'✅ hits the target':`· ${tg.n-after.n} short of ${tg.n}`} <small>limited by ${STATIONS[after.by].icon} ${STATIONS[after.by].name}</small></div></div>`;}).join(''));
  const pc=planCost(),left=S.cash-pc.cost,anyW=PL.lines.some(li=>Object.keys(PL.draft[li]).some(k=>{const d=PL.draft[li][k];return (d.up&&wasted(li,k,'up'))||(d.hire&&wasted(li,k,'hire'));})),
    stars=[ok.every(Boolean),!anyW,left>=Math.max(300,S.workers.reduce((a,w)=>a+w.wage,0))];PL.stars=stars;
  $('#plFoot').innerHTML=iconize(`<div class="pl-stars">${[['Hits every target',stars[0]],['No wasted spending',stars[1]],['Keeps a cash cushion',stars[2]]].map(([t,g])=>`<span class="${g?'on':''}">★ ${t}</span>`).join('')}</div>
    <div class="pl-money"><span>Plan cost <b>${money(pc.cost)}</b></span><span>Cash after <b class="${left<0?'r':''}">${money(left)}</b></span>${pc.wages?`<span>Wages <b>+${money(pc.wages)}</b>/shift</span>`:''}</div>
    <div class="mact"><button class="btn" id="plSkip">Skip, just start</button><button class="btn pri big" id="plGo" ${left<0?'disabled':''}>${left<0?'Not enough cash':`Lock in plan + start ▶`}</button></div>`);
  $('#plBody').querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>planClick(b.dataset.a,+b.dataset.l,b.dataset.k));
  $('#plSkip').onclick=()=>{PL.draft=null;launch(null);};$('#plGo').onclick=commitPlan;
  if(flash){const el=$('#plBody .pl-line:nth-child('+(PL.lines.indexOf(flash.li)+1)+') .pl-res');if(el){el.classList.add(flash.up?'pop':'shake');}}}
function planClick(a,li,k){const l=S.lines[li],D=PL.draft[li],before=simLine(l,D).n;D[k]=D[k]||{};
  if(a==='up')D[k].up=(D[k].up||0)+1;else if(a==='hire')D[k].hire=(D[k].hire||0)+1;else{const kk=a.slice(1);D[k][kk]=Math.max(0,(D[k][kk]||0)-1);}
  if(a==='up'&&!l.st[k].built&&D[k].up===1&&!crewOf(l.st[k]).length&&!(D[k].hire))D[k].hire=1;/* a new station needs someone to run it */
  const after=simLine(l,D).n;if(a[0]!=='-'){if(after>before){sfx('good');}else{sfx('bad');toast(`No change. Line ${li+1} is still limited by the <b>${STATIONS[simLine(l,D).by].name}</b>. Grow the shortest bar.`,'warn');}}else sfx('tick');
  renderPlanner({li,up:after>before});}
function commitPlan(){const fails=[];PL.lines.forEach(li=>{const D=PL.draft[li];ST_KEYS.forEach(k=>{const d=D[k];if(!d)return;for(let i=0;i<(d.up||0);i++){const e=upgrade(li,k);if(e){fails.push(e);break;}}for(let i=0;i<(d.hire||0);i++){const e=hireCrew(li,k);if(e){fails.push(e);break;}}});});
  if(fails.length)toast(fails[0],'bad');const st=PL.stars.filter(Boolean).length,goal=PL.lines.reduce((a,li)=>a+lineTarget(S.lines[li]).n,0);
  S.plan={day:S.day,goal,stars:st};if(st===3){S.cash+=150;toast('📋 <b>Perfect plan!</b> +$150 smart-planning bonus','good');}
  rebuildWorld();syncStations();PL.draft=null;launch(goal);}
function launch(goal){if(!goal)S.plan={day:S.day,goal:S.lines.slice(0,lineCount()).reduce((a,l)=>a+lineTarget(l).n,0),stars:0};closeModal();if(PL.start)PL.start();}

/* shift goal = the plan's targets */
const _missionFor=missionFor;missionFor=function(){if(S.plan&&S.plan.day===S.day&&S.plan.goal){const T=S.plan.goal;return [Math.max(2,Math.round(T*.7)),T,Math.round(T*1.15)+1];}return _missionFor();};

/* ---------- live: jams at the bottleneck ---------- */
const QTE={on:false,n:0,need:8,el:null};
const _stationSpeed=stationSpeed;stationSpeed=function(s){return s.jam?0:_stationSpeed(s);};
function clearJams(){if(!S)return;S.jam=null;S.lines.forEach(l=>ST_KEYS.forEach(k=>{l.st[k].jam=false;}));}
function tickJams(dt){if(S&&S.phase!=='day'&&S.jam)clearJams();if(!S||S.phase!=='day'||UI.demo||!S.speed||modalOpen()||camS.mode==='cine'||MILL.on)return;const g=dt*S.speed;
  if(S.jam){const j=S.jam,s=S.lines[j.li]&&S.lines[j.li].st[j.k];if(!s){S.jam=null;return;}j.t-=g;if(Math.random()<dt*6)burst(SLOT_X[j.k]+rand(-.6,.6),1.2,LZ(j.li)+1,{n:1,color:'#EF4444',spread:.4,up:1,life:.6,size:.08});
    if(j.t<=0){s.jam=false;S.jam=null;toast('The jam cleared itself, but your line sat still. Get there faster next time!','warn');}return;}
  if(S.clock<35||(S.jamCD||0)>S.clock)return;
  for(const l of S.lines.slice(0,lineCount())){const b=capacity(l).by,s=l.st[b];if(s.tier<2&&s.q.length>=ECON.queueMax-1&&!s.broken){
    s.jam=true;S.jam={li:l.i,k:b,t:14};S.jamCD=S.clock+40;sfx('alarm');const x=SLOT_X[b],z=LZ(l.i);for(let i=0;i<4;i++)burst(x+rand(-1,1),.9,z+1.2,{n:6,color:'#B45309',spread:2.2,up:2.4,g:9,life:1,size:.16});camS.shake=.3;
    toast(`🚨 <b>JAM at the ${STATIONS[b].name}!</b> Crates piled up and the line stopped. Run over and clear it!`,'bad');
    if(!S.flags.jamTold){S.flags.jamTold=1;advise(`Too many crates at your <b>slowest station</b> jammed the line. Clear it fast, then plan a fix before the next shift.`,10000);}return;}}}
function startClear(){if(!S.jam||QTE.on)return;QTE.on=true;QTE.n=0;let el=$('#qte');if(!el){el=document.createElement('div');el.id='qte';document.body.appendChild(el);el.addEventListener('pointerdown',e=>{e.preventDefault();qteHit();});}
  el.hidden=false;el.innerHTML=iconize(`<div class="q-r"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="bg"/><circle cx="50" cy="50" r="44" class="fg" id="qteArc"/></svg><b>TAP!</b></div><div class="q-t">CLEAR THE JAM</div><small>Mash <kbd>E</kbd> / <kbd>Space</kbd> or tap</small>`);qteDraw();}
function qteHit(){if(!QTE.on)return;QTE.n++;sfx('tick');const j=S.jam;if(j)burst(SLOT_X[j.k]+rand(-.5,.5),1.1,LZ(j.li)+1,{n:3,color:'#FACC15',spread:1.6,up:1.6,life:.4,size:.05,add:true});qteDraw();if(QTE.n>=QTE.need)qteDone();}
function qteDraw(){const a=$('#qteArc');if(a)a.style.strokeDashoffset=276.5*(1-QTE.n/QTE.need);}
function qteDone(){QTE.on=false;$('#qte').hidden=true;const j=S.jam;if(!j)return;const s=S.lines[j.li].st[j.k];s.jam=false;s.boost=12;S.jam=null;
  S.cash+=40;S.today&&(S.today.jams=(S.today.jams||0)+1);sfx('win');floatAt(SLOT_X[j.k],3,LZ(j.li),'JAM CLEARED · RUSH 2×','#39E75F',true);toast('✅ <b>Jam cleared!</b> +$40 and a 2× speed rush on that station.','good');renderHUD();}
addEventListener('keydown',e=>{if(QTE.on&&(e.code==='KeyE'||e.code==='Space')){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)qteHit();}},true);
const _nearestAct=nearestAct;nearestAct=function(){if(QTE.on)return null;
  if(S&&S.jam&&!MILL.on){const j=S.jam,d=Math.hypot(P.pos.x-SLOT_X[j.k],P.pos.z-(LZ(j.li)+2.3));if(d<3.4)return {t:`CLEAR THE JAM · ${STATIONS[j.k].name}`,ic:'🚨',hot:1,f:startClear};}
  const a=_nearestAct();if(!a||!S)return a;
  if(S.phase==='board'&&/^(Fix the bottleneck|Upgrade the)/.test(a.t))return {t:'Plan the next shift',ic:'📋',hot:a.hot,f:()=>openPlanner()};
  if(S.phase==='day'&&/^Fix the bottleneck/.test(a.t)){let best=null,bd=9;S.lines.slice(0,lineCount()).forEach(l=>{const k=capacity(l).by,d=Math.hypot(P.pos.x-SLOT_X[k],P.pos.z-(LZ(l.i)+2.3));if(d<bd){bd=d;best=[l.i,k];}});if(best)return {t:`Boost the bottleneck: work it yourself`,ic:'⚡',hot:1,f:()=>startGame(STATIONS[best[1]].game,best[0],best[1])};}
  return a;};

/* pins: jams + pile-ups during a shift only (planning happens in the planner) */
function bottleneckTutor(){}
function updateFixPins(){const box=$('#fixPins');if(!S||titleOn()||MILL.on||TWIN.on||modalOpen()||camS.mode==='cine'||S.phase!=='day'){box.innerHTML='';box.dataset.k='';FLOW.pins=[];return;}
  const want=[];if(S.jam)want.push({li:S.jam.li,k:S.jam.k,jam:1});S.lines.slice(0,lineCount()).forEach(l=>{const b=capacity(l).by,s=l.st[b];if(!s.jam&&s.q.length>=4&&s.tier<2)want.push({li:l.i,k:b});});
  const key=want.map(w=>w.li+w.k+(w.jam||'')).join();if(key!==box.dataset.k){box.dataset.k=key;box.innerHTML=iconize(want.map(w=>`<button class="fixpin ${w.jam?'jam':''}" data-fix="${w.li}:${w.k}">${w.jam?'🚨 JAM':'⚡ BOOST'}<small>${w.jam?'clear it!':'bottleneck'}</small></button>`).join(''));FLOW.pins=want.map((w,i)=>Object.assign(w,{e:box.children[i]}));}
  FLOW.pins.forEach(p=>{const pr=project(SLOT_X[p.k],5.1,LZ(p.li)-.6);p.e.style.display=pr.on?'':'none';p.e.style.transform=`translate(${pr.x}px,${Math.max(130,pr.y)}px) translate(-50%,-100%)`;});}
function pinGo(li,k){const near=Math.hypot(P.pos.x-SLOT_X[k],P.pos.z-(LZ(li)+2.3))<3.4;if(S.jam&&S.jam.li===li&&S.jam.k===k){if(near)startClear();else{P.target=V(SLOT_X[k],0,LZ(li)+2.3);toast('Running to the jam…');}}
  else if(S.phase==='board')openPlanner();else startGame(STATIONS[k].game,li,k);}
function initPlanner(){const re=sel=>{const el=$(sel),n=el.cloneNode(true);el.replaceWith(n);return n;};
  re('#fixPins').addEventListener('click',e=>{const b=e.target.closest('[data-fix]');if(b&&!blocked()){const [li,k]=b.dataset.fix.split(':');pinGo(+li,k);}});
  re('#flow').addEventListener('click',e=>{const b=e.target.closest('[data-fix]');if(b&&!blocked()){const [li,k]=b.dataset.fix.split(':');if(S.phase==='board')openPlanner();else fixCard(+li,k);}});
  const bs=$('#btnStart'),orig=bs.onclick;bs.innerHTML=iconize('📋 Plan Shift');bs.onclick=()=>{if(!S||S.phase!=='board'||MILL.on)return;if(PARAMS.has('test'))return orig();initAudio();openPlanner(orig);};}
const _tickFlow=tickFlow;tickFlow=function(dt){_tickFlow(dt);try{tickJams(dt);}catch(e){}};
