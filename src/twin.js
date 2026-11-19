/* =====================================================================
   BOTFACTORY · OEE gauges + Digital Twin x-ray view
   OEE = Availability × Performance × Quality (85% = world class)
   ===================================================================== */
const TWIN={on:false,mat:null,grid:null,pins:[],hidden:[],t:0,bg:new THREE.Color()};
const pct=v=>Math.round(clamp(v,0,1)*100)+'%';
function oeeColor(v){return v>=.85?'#39E75F':v>=.6?'#FACC15':'#F87171';}
function oeeHTML(o,title,big){if(!o)return `<div class="oee empty"><b>OEE</b><small>Run a shift to measure</small></div>`;const row=(k,n,v,tip)=>`<div class="oe-r" title="${tip}"><span>${k}</span><em>${n}</em><i><s style="width:${pct(v)};background:${oeeColor(v)}"></s></i><b>${pct(v)}</b></div>`;
  return `<div class="oee ${big?'big':''}"><div class="oe-g" style="--v:${clamp(o.v,0,1)*360}deg;--c:${oeeColor(o.v)}"><div><b>${pct(o.v)}</b><small>${title||'OEE'}</small></div></div><div class="oe-rows">
    ${row('A','Availability',o.A,'Time the line was up and running vs planned time')}${row('P','Performance',o.P,'How fast it ran vs its ideal speed')}${row('Q','Quality',o.Q,'Good units vs all units made')}
    <div class="oe-wc">World-class plants: <b>85%</b></div></div></div>`;}
function oeeLesson(o){if(!o)return '';const w=[['A',o.A,'Breakdowns stopped your line. Service machines before they break (or unlock Control Room Screens).'],['P',o.P,'Your line ran slower than it could: upgrade the bottleneck or get hands-on to boost it.'],['Q',o.Q,'Too many defects. Build a QA Scanner, upgrade stations or unlock the Robot Dog Patrol.']].sort((a,b)=>a[1]-b[1])[0];
  return `<b>OEE ${pct(o.v)}</b> = Availability × Performance × Quality. Your weakest: <b>${{A:'Availability',P:'Performance',Q:'Quality'}[w[0]]}</b>. ${w[2]}`;}

/* ---------- digital twin ---------- */
function toggleTwin(force){if(!S||((titleOn()||camS.mode==='cine')&&!UI.pitch))return;const on=force!=null?force:!TWIN.on;if(on===TWIN.on)return;TWIN.on=on;document.body.classList.toggle('twin',on);$('#btnTwin').classList.toggle('on',on);
  if(on){TWIN.mat=TWIN.mat||new THREE.MeshBasicMaterial({color:'#22D3EE',wireframe:true,transparent:true,opacity:.2,depthWrite:false});scene.overrideMaterial=TWIN.mat;if(composer)composer.passes[0].overrideMaterial=TWIN.mat;TWIN.bg.copy(scene.background);scene.background.set('#020812');scene.fog.near=400;
    if(!TWIN.grid){TWIN.grid=new THREE.GridHelper(120,60,0x0EA5E9,0x0B3A57);TWIN.grid.position.y=.03;}scene.add(TWIN.grid);
    TWIN.hidden=[];scene.traverse(o=>{if(o.isSprite&&o.visible){o.visible=false;TWIN.hidden.push(o);}});camS.overPrev=camS.over;camS.over=true;buildPins();sfx('zap');tone(220,.4,'sine',.04,0,880);}
  else{scene.overrideMaterial=null;if(composer)composer.passes[0].overrideMaterial=null;scene.background.copy(TWIN.bg);scene.fog.near=110;if(TWIN.grid)scene.remove(TWIN.grid);TWIN.hidden.forEach(o=>o.visible=true);TWIN.hidden=[];camS.over=!!camS.overPrev;$('#twinPins').innerHTML='';TWIN.pins=[];tone(880,.3,'sine',.03,0,220);}}
function buildPins(){const box=$('#twinPins');box.innerHTML='';TWIN.pins=[];S.lines.slice(0,lineCount()).forEach((l,li)=>ST_KEYS.forEach(k=>{if(!l.st[k].built||(!STAGES[S.stage].wide&&['paint','qa'].includes(k)))return;const e=document.createElement('div');e.className='tpin';box.appendChild(e);TWIN.pins.push({e,li,k});}));}
function stationState(l,k){const s=l.st[k],need=PRODUCTS[l.job.product].needs.includes(k)||(k==='qa'&&l.st.qa.built);if(s.broken)return ['DOWN','#F87171'];if(s.needsCode)return ['NEEDS PROGRAM','#FACC15'];if(!need)return ['IDLE · not used','#64748B'];if(s.blocked)return ['BLOCKED','#FB923C'];if(s.cur)return ['RUNNING','#39E75F'];return ['STARVED','#94A3B8'];}
function updateTwin(dt){if(!TWIN.on||!S)return;TWIN.t-=dt;const refresh=TWIN.t<=0;if(refresh)TWIN.t=.3;
  TWIN.pins.forEach(p=>{const l=S.lines[p.li],s=l.st[p.k],pr=project(SLOT_X[p.k],3.2+(ST_KEYS.indexOf(p.k)%2)*1.9,LZ(p.li)-.4);if(!pr.on){p.e.style.display='none';return;}p.e.style.display='';p.e.style.transform=`translate(${pr.x}px,${pr.y}px) translate(-50%,-100%)`;
    if(!refresh)return;const [st,c]=stationState(l,p.k),bn=capacity(l).by===p.k,cyc=STATIONS[p.k].cycle/stationSpeed(s),health=1-s.wear;
    p.e.style.setProperty('--c',c);p.e.classList.toggle('bn',bn&&PRODUCTS[l.job.product].needs.includes(p.k));
    p.e.innerHTML=iconize(`<b>${STATIONS[p.k].icon} ${STATIONS[p.k].short.toUpperCase()}<i>L${p.li+1}</i></b><span class="st">${st}</span><div class="kv"><span>Util</span><em>${pct(s.util)}</em><span>Cycle</span><em>${cyc.toFixed(1)}s</em><span>Queue</span><em>${s.q.length}</em><span>Health</span><em style="color:${oeeColor(health)}">${pct(health)}</em></div><i class="hb"><s style="width:${pct(health)};background:${oeeColor(health)}"></s></i>${bn?'<u>BOTTLENECK</u>':''}`);});
  if(refresh){const live=S.phase==='day'?plantOEE():S.hist.length?plantOEE(S.hist[S.hist.length-1]):null;
    $('#twinHud').innerHTML=iconize(`<div class="th-h"><span class="dot"></span>DIGITAL TWIN · LIVE</div>${oeeHTML(live,S.phase==='day'?'Plant OEE now':'Last shift')}
    ${S.phase==='day'&&S.today.oee?S.lines.slice(0,lineCount()).map((l,i)=>{const o=oeeOf(S.today.oee[i]);return `<div class="th-l"><span>Line ${i+1} ${PRODUCTS[l.job.product].icon}</span><b style="color:${o?oeeColor(o.v):'#94A3B8'}">${o?pct(o.v):'—'}</b></div>`;}).join(''):''}
    <p class="th-n">A digital twin is a live virtual copy of a real plant. Engineers use it to spot problems before they cost money.</p><button class="btn sm" onclick="toggleTwin(false)">Exit twin view</button>`);}}
