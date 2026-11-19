/* =====================================================================
   BOTFACTORY · the bottleneck game
   Line Flow bar · FIX pins on the floor · fix card with 3 choices and
   instant feedback · shift missions with stars
   ===================================================================== */
const FLOW={t:0,pins:[],lastCap:{}};
const WORKER={cut:'laser operator',weld:'welder',asm:'assembler',paint:'painter',qa:'inspector'};
function routeOf(l){const need=PRODUCTS[l.job.product].needs;return ST_KEYS.filter(k=>need.includes(k));}
function flowHTML(){if(!S)return '';return S.lines.slice(0,lineCount()).map(l=>{const r=routeOf(l),caps=r.map(k=>stationCap(l.st[k],k)),mx=Math.max(...caps),cap=capacity(l);
  return `<div class="fl"><div class="fl-h"><b>Line ${l.i+1}</b><span>${PRODUCTS[l.job.product].icon} makes <b>${cap.n}</b>/shift</span></div>${r.map((k,i)=>{const bn=k===cap.by,s=l.st[k];return `<button class="fc ${bn?'bn':''} ${s.broken?'down':''}" data-fix="${l.i}:${k}"><span>${STATIONS[k].icon}</span><i><s style="width:${Math.max(8,caps[i]/mx*100)}%"></s></i><b>${Math.floor(caps[i])}</b>${bn?'<em>SLOWEST</em>':''}</button>`;}).join('<u>›</u>')}</div>`;}).join('');}
function renderFlow(){const el=$('#flow');if(!S||titleOn()||MILL.on||TWIN.on){el.hidden=true;return;}el.hidden=false;const h=flowHTML();if(el.dataset.h!==h){el.innerHTML=`<div class="fl-t">LINE FLOW <small>units per shift</small></div>`+h;el.dataset.h=h;}}
/* floating FIX button over each line's bottleneck */
function updateFixPins(){const box=$('#fixPins');if(!S||titleOn()||MILL.on||TWIN.on||modalOpen()||camS.mode==='cine'){box.innerHTML='';FLOW.pins=[];return;}
  const want=S.lines.slice(0,lineCount()).map(l=>{const b=capacity(l).by,s=l.st[b];const show=S.phase==='board'?upgradeCost(l,b)!=null||s.tier<2:s.q.length>=3||s.broken;return show?{li:l.i,k:b}:null;}).filter(Boolean);
  const key=want.map(w=>w.li+w.k).join();if(key!==box.dataset.k){box.dataset.k=key;box.innerHTML=want.map(w=>`<button class="fixpin" data-fix="${w.li}:${w.k}">🔧 FIX<small>bottleneck</small></button>`).join('');FLOW.pins=want.map((w,i)=>Object.assign(w,{e:box.children[i]}));}
  FLOW.pins.forEach(p=>{const pr=project(SLOT_X[p.k],5.1,LZ(p.li)-.6);p.e.style.display=pr.on?'':'none';p.e.style.transform=`translate(${pr.x}px,${pr.y}px) translate(-50%,-100%)`;});}
/* the fix card: three ways to beat a bottleneck */
function fixCard(li,k,tut){const l=S.lines[li],s=l.st[k],D=STATIONS[k],cap=capacity(l),r=routeOf(l),cost=upgradeCost(l,k),nt=s.tier<2?TIERS[s.tier+1]:null;
  const upP=nt?previewCap(l,k,{tier:s.tier+1}):null,hrP=s.tier<2&&(s.crew||1)<2?previewCap(l,k,{crew:2}):null,day=S.phase==='day',isBn=cap.by===k;
  const gain=p=>p?`<div class="fx-g"><b>${cap.n} → ${p.n}</b>/shift ${p.n>cap.n?`<em>+${p.n-cap.n}</em>`:''}</div><small>${p.by!==k?`Next slowest: ${STATIONS[p.by].icon} ${STATIONS[p.by].name}`:'Still the slowest, but faster'}</small>`:'';
  const C=openModal(`${tut?'<div class="tut">⏸ Paused · You found your first bottleneck!</div>':''}<button class="x" id="fxX">×</button><div class="eyebrow">${isBn?'Bottleneck':'Station'} · Line ${li+1}</div><h2>${D.icon} ${isBn?`The ${D.name} is slowing your whole line`:D.name}</h2>
    <div class="fx-flow">${r.map(x=>`<div class="${x===cap.by?'bn':''} ${x===k?'me':''}"><span>${STATIONS[x].icon}</span><b>${Math.floor(stationCap(l.st[x],x))}</b><small>${STATIONS[x].short}</small></div>`).join('<i>›</i>')}<div class="out"><span>🚚</span><b>${cap.n}</b><small>shipped</small></div></div>
    <p class="sub">${isBn?`Your line can only ship as many as its <b>slowest</b> station. The other stations end up waiting, and crates pile up in front of this one. <b>Speed this station up and the whole line speeds up.</b>`:`This station isn't your bottleneck right now. Upgrading it won't speed up the line until it is.`}</p>
    <div class="fx-opts">
      <div class="fx-o"><div class="fx-i">⬆</div><b>${nt?'Upgrade to '+nt.name:'Fully upgraded'}</b><p>${nt?`${nt.speed}× speed, fewer defects${s.tier+1===2?', no wages (robot)':''}. <b>One-time cost.</b>`:'This station is a robot cell already.'}</p>${gain(upP)}${nt?`<button class="btn pri" data-opt="up" ${S.cash<cost?'disabled':''}>Upgrade · ${money(cost)}</button>`:''}</div>
      <div class="fx-o"><div class="fx-i">👷</div><b>${hrP?'Hire a 2nd '+WORKER[k]:s.tier===2?'Robots need no crew':'2 workers already'}</b><p>${hrP?`1.6× speed right away. <b>Costs ${money(TIERS[s.tier].wage)} every shift</b> in wages (a fixed cost).`:'Upgrade instead to go faster.'}</p>${gain(hrP)}${hrP?`<button class="btn" data-opt="hire" ${S.cash<ECON.hireFee?'disabled':''}>Hire · ${money(ECON.hireFee)}</button>`:''}</div>
      <div class="fx-o"><div class="fx-i">${D.icon}</div><b>Work it yourself</b><p>Nail the hands-on job for <b>2× speed</b> for about 25 seconds. <b>Free</b>, but it doesn't last.</p>${day&&s.tier<2&&!s.broken?`<button class="btn" data-opt="play">Do it now ▶</button>`:`<small class="muted">${s.tier===2?'Robot cells run themselves.':'Available during a shift.'}</small>`}</div></div>
    <p class="muted small">💡 Pay once (upgrade), pay every shift (workers), or put in the effort yourself. Real plant managers make this call every day.</p>`,{cls:'dark panel wide fixcard'});
  const close=()=>{closeModal();if(tut&&S.phase==='day'&&!S.speed){S.speed=1;renderHUD();}};C.querySelector('#fxX').onclick=close;
  C.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{const o=b.dataset.opt,before=cap.n;
    if(o==='play'){close();startGame(D.game,li,k);return;}
    const e=o==='up'?upgrade(li,k):hireCrew(li,k);if(e){toast(e,'bad');return;}close();if(o==='up')afterUpgrade(li,k);else{syncStations();sfx('good');}
    celebrateFix(li,before);});}
function celebrateFix(li,before){const l=S.lines[li],now=capacity(l),z=LZ(li);renderFlow();
  if(now.n>before){floatAt(SLOT_X[l.st[now.by]?now.by:'asm'],4,z,`LINE ${li+1}: ${before} → ${now.n}/shift`,'#39E75F',true);sfx('win');confetti(70);
    toast(`📈 <b>Line ${li+1} now ships ${now.n}/shift</b> (+${now.n-before})<br>New slowest station: ${STATIONS[now.by].icon} <b>${STATIONS[now.by].name}</b>`,'good');
    if(!S.flags.bnNext){S.flags.bnNext=1;setTimeout(()=>advise(`See that? Once you fixed it, the <b>${STATIONS[now.by].name}</b> became the new bottleneck. There's <b>always</b> a slowest station. Great managers keep hunting it.`,12000),1200);}}
  else toast('Faster station, but the line is still limited by another station. Look for the red SLOWEST tag.','warn');}
/* first bottleneck: pause and teach */
function bottleneckTutor(){if(!S||S.phase!=='day'||S.flags.bnTut||modalOpen()||camS.mode==='cine'||MG.on||MILL.on)return;
  for(const l of S.lines.slice(0,lineCount())){const b=capacity(l).by;if(l.st[b].q.length>=4){S.flags.bnTut=1;S.speed=0;renderHUD();sfx('alarm');fixCard(l.i,b,true);return;}}}
/* mission bar */
function renderMission(){const el=$('#mission');if(!S||titleOn()||MILL.on){el.hidden=true;return;}const g=S.phase==='day'&&S.today&&S.today.goal?S.today.goal:missionFor(),got=S.phase==='day'&&S.today?S.today.shipped:0,mx=g[2]*1.08;el.hidden=false;
  const st=got>=g[2]?3:got>=g[1]?2:got>=g[0]?1:0;const h=`<div class="ms-h"><span>🎯 ${S.phase==='day'?'SHIFT GOAL':'NEXT SHIFT GOAL'}</span><b>${got} shipped</b></div><div class="ms-b"><i style="width:${Math.min(100,got/mx*100)}%"></i>${g.map((v,i)=>`<em class="${got>=v?'on':''}" style="left:${v/mx*100}%"><s>${'★'.repeat(i+1)}</s><small>${v}</small></em>`).join('')}</div>`;
  if(el.dataset.h!==h){if(el.dataset.st&&+el.dataset.st<st){sfx('win');floatAt(P.pos.x,2.6,P.pos.z,'★'.repeat(st)+' GOAL HIT!','#FACC15',true);}el.dataset.st=st;el.innerHTML=h;el.dataset.h=h;}}
function initFlow(){$('#flow').addEventListener('click',e=>{const b=e.target.closest('[data-fix]');if(b&&!blocked()){const [li,k]=b.dataset.fix.split(':');fixCard(+li,k);}});
  $('#fixPins').addEventListener('click',e=>{const b=e.target.closest('[data-fix]');if(b&&!blocked()){const [li,k]=b.dataset.fix.split(':');fixCard(+li,k);}});}
function tickFlow(dt){FLOW.t-=dt;if(FLOW.t<=0){FLOW.t=.4;renderFlow();renderMission();bottleneckTutor();}updateFixPins();}
