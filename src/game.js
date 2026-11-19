/* ===================== BotFactory · UI, input, loop ===================== */
const UI={tab:'orders', sig:'', t:0, tipQ:[], tipAt:0, modal:false, hudT:0, sideT:0, insT:0, insSig:'', pointers:new Map(), drag:null, hover:null, keys:new Set(), muted:false, lastStamp:0};

/* ---------- sound ---------- */
let AC=null;
function audio(){ if(AC) return; try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
function tone(f,d=.12,type='triangle',v=.05,slide,delay=0){ if(!AC||UI.muted) return; const t=AC.currentTime+delay, o=AC.createOscillator(), g=AC.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); if(slide) o.frequency.exponentialRampToValueAtTime(slide,t+d); g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(v,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+d+.02); }
const sfx={tick:()=>tone(900,.05,'sine',.035), good:()=>{ tone(660,.12); tone(990,.18,'triangle',.05,null,.06); }, bad:()=>tone(200,.22,'sawtooth',.03,110),
  cash:()=>{ tone(1320,.08,'square',.025); tone(1760,.14,'square',.02,null,.07); }, coin:()=>tone(1568,.06,'square',.012), thud:()=>tone(90,.2,'sine',.12,40), buzz:()=>tone(140,.16,'square',.025,100),
  build:()=>{ tone(180,.12,'square',.04,90); tone(520,.1,'triangle',.04,null,.08); }, stamp:()=>{ if(UI.t-UI.lastStamp<.35) return; UI.lastStamp=UI.t; tone(70,.09,'square',.025,45); },
  bang:()=>{ tone(60,.35,'sawtooth',.07,30); tone(400,.2,'square',.03,80); }, clang:()=>{ tone(880,.08,'square',.04,600); tone(1200,.06,'triangle',.03); },
  fanfare:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.22,'triangle',.06,null,i*.12)) };

/* ---------- small UI helpers ---------- */
function toast(html,type){ const e=document.createElement('div'); e.className='toast '+(type||''); e.innerHTML=html; $('#toasts').appendChild(e); while($('#toasts').children.length>2) $('#toasts').firstChild.remove(); setTimeout(()=>{ e.style.opacity=0; setTimeout(()=>e.remove(),400); },4200); }
let advT=0; function advise(html,ms){ ms=ms||Math.max(7000,html.length*55); $('#aText').innerHTML=html; $('#advisor').classList.remove('hide'); clearTimeout(advT); advT=setTimeout(()=>$('#advisor').classList.add('hide'),ms); if(G.mb) rigPlay(G.mb,'UpPoint',true); }
function tip(key,html){ if(G.flags['tip_'+key]) return; G.flags['tip_'+key]=1; UI.tipQ.push(html||TIPS[key]); }
function stepTips(){ if(UI.tipQ.length&&UI.t>UI.tipAt&&!UI.modal&&G.mode==='play'){ advise(UI.tipQ.shift()); UI.tipAt=UI.t+12; } }
let rsT=0; function rusty(text,ms=6000){ const e=$('#rusty'); e.querySelector('p').textContent=text; e.classList.remove('hide'); clearTimeout(rsT); rsT=setTimeout(()=>e.classList.add('hide'),ms); if(G.rusty) rigPlay(G.rusty,pick(['UpPoint','RightHand','TwistJump']),true); }
function rustyArrive(){ if(G.rusty){ G.rusty.root.visible=true; } rusty('Heh. ScrapCo bots are now $29. Good luck selling yours for $'+G.price+', garage kid.',8000); }
function rustyLeave(){ if(G.rusty) G.rusty.root.visible=false; toast('ScrapCo\'s price war is over. Rusty ran out of cash.','good'); }
function modal(html,cls){ $('#modalCard').className=cls||''; $('#modalCard').innerHTML=html; $('#modal').hidden=false; UI.modal=true; return $('#modalCard'); }
function closeModal(){ $('#modal').hidden=true; UI.modal=false; }
function milestone(id){ if(G.ms[id]) return; G.ms[id]=G.day; const m=MILESTONES.find(x=>x.id===id); if(m&&G.mode==='play'){ toast('🏆 <b>Milestone:</b> '+m.t,'gold'); sfx.fanfare(); } }
function onOffer(o){ if(UI.tab!=='orders'||$('#side').classList.contains('min')) $('[data-tab=orders]').classList.add('new'); if(!G.flags.firstOffer){ G.flags.firstOffer=1; tip('orders'); } sfx.tick(); }
const dayClock=t=>{ const mins=8*60+Math.floor(t/DAY_LEN*600), h=Math.floor(mins/60), m=mins%60; return ((h-1)%12+1)+':'+String(m).padStart(2,'0')+(h<12?' AM':' PM'); };
const stateTxt={work:'Working', starved:'Waiting for parts', blocked:'Blocked: output is backed up', nocrew:'No worker: hire someone', broken:'Broken: tap the machine to fix'};

/* ---------- HUD ---------- */
function hud(){ $('#hDay').textContent=innerWidth<560?`Day ${G.day} · ${G.opened?dayClock(G.t).replace(/ (AM|PM)/,''):'Setup'}`:`Day ${G.day} of ${DAYS} · ${G.opened?dayClock(G.t):'Setup'}`; $('#hDayBar').style.width=(G.t/DAY_LEN*100)+'%';
  const c=$('#hCash'); c.textContent=fmt(G.cash); c.classList.toggle('neg',G.cash<0);
  $('#hRep').innerHTML=`${Math.round(G.rep)}<small>/100</small>`; $('#hRep').className=G.rep>=70?'up':G.rep<40?'neg':'';
  $('#hShip').textContent=G.today.made;
  $$('#speed button').forEach(b=>{ const s=+b.dataset.s; b.classList.toggle('on', s===0?G.paused:(!G.paused&&G.speed===s)); });
  const ex=$('#btnExpand'); ex.hidden=G.expanded||G.tot.shipped<ECON.expandNeed*.5; ex.classList.toggle('ready',canExpand()); }

/* ---------- side panel ---------- */
function sideSig(){ if(UI.tab==='orders') return G.orders.map(o=>o.id+o.status).join()+'|'+G.day; if(UI.tab==='supply') return G.deliveries.length+'|'+G.steelMult+'|'+G.autoBuy+'|'+G.expanded; return G.expanded+'|'+G.rush+'|'+G.machines.length+'|'+G.machines.map(m=>m.crew+(m.auto?'a':'')).join(''); }
function renderSide(){ UI.sig=sideSig(); const b=$('#sideBody'); $$('#side .tabs [data-tab]').forEach(t=>t.classList.toggle('on',t.dataset.tab===UI.tab));
  if(UI.tab==='orders'){ const offers=G.orders.filter(o=>o.status==='offer'), act=G.orders.filter(o=>o.status==='active'), past=G.orders.filter(o=>['done','late'].includes(o.status)).slice(-3).reverse();
    b.innerHTML=`${offers.length?'<h4>New offers</h4>':''}${offers.map(o=>`<div class="ord offer ${o.rush?'rush':''}"><div class="otop"><b>${o.client}</b>${o.deluxe?'<span class="tag gold">Deluxe</span>':''}${o.rush?'<span class="tag red">Big</span>':''}</div>
      <div class="oline"><b>${o.qty}</b> ${o.deluxe?'Deluxe ':''}MiniBots × <b>${fmt(o.price)}</b> = <b class="g">${fmt(o.qty*o.price)}</b></div><div class="odue">Due end of <b>Day ${o.due}</b>${o.due===G.day+1?' (tomorrow)':''} · offer ends tonight</div>
      <div class="obtn"><button class="btn pri sm" data-act="accept" data-id="${o.id}">Accept</button><button class="btn ghost sm" data-act="pass" data-id="${o.id}">Pass</button></div></div>`).join('')}
      <h4>Active orders</h4>${act.length?act.map(o=>`<div class="ord"><div class="otop"><b>${o.client}</b>${o.deluxe?'<span class="tag gold">Deluxe</span>':''}<span class="due ${o.due===G.day?'red':''}">Day ${o.due}</span></div>
      <div class="pbar"><i data-v="og${o.id}"></i></div><div class="oline small"><span data-v="ot${o.id}"></span> · ${fmt(o.price)} each</div></div>`).join(''):'<p class="muted">No active orders. Bots you make sell on the open market at your price.</p>'}
      ${past.length?'<h4>Recent</h4>'+past.map(o=>`<div class="past ${o.status}">${o.status==='done'?'✓':'✗'} ${o.client}: ${o.got}/${o.qty} ${o.status==='done'?'delivered':'late, reputation hit'}</div>`).join(''):''}
      <div class="foot">Ready to sell: <b data-v="fg">0</b> bots · Orders pay first, the rest go to the open market.</div>`; }
  else if(UI.tab==='supply'){
    b.innerHTML=`<div class="kpi"><em>Steel sheets in stock</em><b data-v="stock">0</b><div class="pbar"><i data-v="stockBar"></i></div><small data-v="stockNote"></small></div>
      <h4>Order steel ${G.steelMult>1?'<span class="tag red">Price spike +60%</span>':''}</h4><div class="buys">${BULK.map(x=>`<button class="btn buy" data-act="buy" data-n="${x.n}"><b>${x.n} sheets</b><span>${fmt2(steelPrice(x.each))} each</span><em>${fmt(Math.round(x.n*steelPrice(x.each)))}</em></button>`).join('')}</div>
      <small class="muted">Bigger orders = cheaper per sheet (bulk discount). Trucks take ${ECON.deliveryTime}s to arrive.</small>
      <label class="tog"><input type="checkbox" data-act="auto" ${G.autoBuy?'checked':''}> Auto-reorder 50 when stock gets low</label>
      <div data-v="deliv"></div>
      <h4>Holding costs</h4><div class="rows"><div><span>Steel in storage</span><b>$${ECON.holdSheet.toFixed(2)}/sheet/day</b></div><div><span>Finished bots waiting</span><b>$${ECON.holdBot.toFixed(2)}/bot/day</b></div><div><span>Tonight's storage bill</span><b data-v="hold"></b></div></div>
      <p class="muted">Running out stops the line. Too much stock ties up cash and costs storage. Aim for just enough.</p>`; }
  else { b.innerHTML=`<div class="kpi big"><em>Cost to make one bot <small>(at today's pace)</small></em><b data-v="unit"></b><small data-v="unitSplit"></small></div>
      <canvas id="ucChart" width="600" height="300"></canvas><div class="legend"><span><i style="background:#60A5FA"></i>Cost per bot</span><span><i style="background:#FBBF24"></i>Your price</span><span><i style="background:#fff;border-radius:50%"></i>You now</span></div>
      <div class="two"><div class="kpi"><em>Break-even</em><b data-v="be"></b><small>bots/day to cover all costs</small></div><div class="kpi"><em>Line capacity</em><b data-v="cap"></b><small data-v="capBy"></small></div></div>
      <div class="kpi"><em>Your price per MiniBot</em><div class="prow"><input type="range" id="priceR" min="20" max="70" step="1" value="${G.price}"><b data-v="price"></b></div><small data-v="demand"></small></div>
      <label class="tog"><input type="checkbox" data-act="rush" ${G.rush?'checked':''}> <span><b>Rush mode</b>: line runs 35% faster, but 2.5× more defects</span></label>
      <h4>Fixed costs per day <small class="muted">(paid even if you make 0)</small></h4><div class="rows" data-v="fixed"></div>
      <h4>Variable cost per bot <small class="muted">(only when you make one)</small></h4><div class="rows" data-v="var"></div>`;
    $('#priceR').oninput=e=>{ G.price=+e.target.value; updateSide(true); }; }
  updateSide(true); }
function updateSide(force){ if(!force&&sideSig()!==UI.sig) return renderSide(); const b=$('#sideBody'), v=k=>b.querySelector(`[data-v="${k}"]`);
  if(UI.tab==='orders'){ G.orders.filter(o=>o.status==='active').forEach(o=>{ const g=v('og'+o.id), t=v('ot'+o.id); if(g) g.style.width=(o.got/o.qty*100)+'%'; if(t) t.textContent=`${o.got} / ${o.qty} shipped`; }); const f=v('fg'); if(f) f.textContent=G.fg.length; }
  else if(UI.tab==='supply'){ const E=econ(); v('stock').textContent=G.stock+' / '+ECON.maxStock; v('stockBar').style.width=(G.stock/ECON.maxStock*100)+'%'; v('stockBar').className=G.stock<15?'low':'';
    const per=E.pace>0?E.pace:E.cap; v('stockNote').textContent=per>0?`Your line uses about ${Math.round(per)} sheets a day. That's ${(G.stock/per).toFixed(1)} days of steel.`:'Build a line to start using steel.';
    v('deliv').innerHTML=G.deliveries.map(d=>`<div class="deliv">🚚 ${d.n} sheets arriving in ${Math.max(0,Math.ceil(d.eta-G.clock))}s</div>`).join(''); v('hold').textContent=fmt2(E.F.storage); }
  else { const E=econ(); v('unit').textContent=isFinite(E.unit)?fmt2(E.unit):'—'; v('unit').className=isFinite(E.unit)&&E.unit<E.peff?'g':'r';
    v('unitSplit').innerHTML=E.pace>0?`${fmt(E.F.total)} fixed ÷ ${Math.round(E.pace)} bots = ${fmt2(E.F.total/E.pace)} + ${fmt2(E.v)} materials`:'Open the factory to see your cost per bot.';
    v('be').textContent=isFinite(E.be)?E.be+'/day':'never'; v('cap').textContent=Math.round(E.cap)+'/day'; v('capBy').textContent=E.cap>0?'limited by '+E.capBy:'line incomplete';
    v('price').textContent=fmt(G.price); v('demand').innerHTML=`Market buys about <b>${Math.round(E.demand)}/day</b> at this price${G.rival?` · <span class="r">ScrapCo sells at $${G.rival.price}</span>`:''}${has('packer')?' · boxed +$6':''}`;
    v('fixed').innerHTML=[['Rent',E.F.rent],['Wages ('+G.machines.reduce((a,m)=>a+(m.auto?0:m.crew),0)+' workers)',E.F.wages],['Loan interest',E.F.loan],['Machine upkeep & wear',E.F.upkeep],['Storage',E.F.storage]].map(([k,x])=>`<div><span>${k}</span><b>${fmt(x)}</b></div>`).join('')+`<div class="tot"><span>Total</span><b>${fmt(E.F.total)}</b></div>`;
    v('var').innerHTML=[['Steel sheet',E.sheet],has('painter')&&['Paint',2],has('packer')&&['Box',1.5],has('chip')&&['Smart chip',9]].filter(Boolean).map(([k,x])=>`<div><span>${k}</span><b>${fmt2(x)}</b></div>`).join('')+`<div class="tot"><span>Total</span><b>${fmt2(E.v)}</b></div>`;
    drawChart(E); } }
function drawChart(E){ const c=$('#ucChart'); if(!c) return; const g=c.getContext('2d'), w=c.width, h=c.height, L=46, R=14, T=14, B=34; g.clearRect(0,0,w,h);
  const qMax=Math.max(40,Math.ceil(Math.max(E.cap,E.be===Infinity?0:E.be,E.pace)*1.35/10)*10), yMax=Math.max(E.peff*1.9,E.v+20);
  const X=q=>L+(q/qMax)*(w-L-R), Y=y=>T+(1-Math.min(y,yMax)/yMax)*(h-T-B);
  g.strokeStyle='rgba(148,163,184,.25)'; g.lineWidth=1; g.font='600 18px Inter, system-ui, sans-serif'; g.fillStyle='#94A3B8';
  for(let i=0;i<=4;i++){ const y=yMax*i/4; g.beginPath(); g.moveTo(L,Y(y)); g.lineTo(w-R,Y(y)); g.stroke(); g.textAlign='right'; g.fillText('$'+Math.round(y),L-6,Y(y)+6); }
  g.textAlign='center'; for(let i=0;i<=4;i++){ const q=qMax*i/4; g.fillText(Math.round(q),X(q),h-10); } g.fillText('bots / day',w/2+40,h-10);
  /* profit zone */
  g.fillStyle='rgba(0,230,118,.12)'; g.beginPath(); let started=false; for(let q=1;q<=qMax;q+=.5){ const u=E.F.total/q+E.v; if(u<E.peff){ if(!started){ g.moveTo(X(q),Y(E.peff)); started=true; } g.lineTo(X(q),Y(u)); } } if(started){ g.lineTo(X(qMax),Y(E.peff)); g.closePath(); g.fill(); }
  g.strokeStyle='#FBBF24'; g.lineWidth=3; g.setLineDash([10,6]); g.beginPath(); g.moveTo(L,Y(E.peff)); g.lineTo(w-R,Y(E.peff)); g.stroke(); g.setLineDash([]);
  g.strokeStyle='#60A5FA'; g.lineWidth=4; g.beginPath(); for(let q=1;q<=qMax;q+=.5){ const u=E.F.total/q+E.v; q===1?g.moveTo(X(q),Y(u)):g.lineTo(X(q),Y(u)); } g.stroke();
  if(isFinite(E.be)&&E.be<=qMax){ g.strokeStyle='rgba(255,255,255,.5)'; g.lineWidth=2; g.setLineDash([4,4]); g.beginPath(); g.moveTo(X(E.be),Y(E.peff)); g.lineTo(X(E.be),h-B); g.stroke(); g.setLineDash([]); g.fillStyle='#E2E8F0'; g.textAlign='left'; g.fillText('break-even',X(E.be)+6,T+18); }
  if(E.pace>0){ const u=E.F.total/E.pace+E.v; g.fillStyle='#fff'; g.beginPath(); g.arc(X(E.pace),Y(u),9,0,7); g.fill(); g.fillStyle=u<E.peff?'#00E676':'#F87171'; g.beginPath(); g.arc(X(E.pace),Y(u),5,0,7); g.fill(); }
  g.fillStyle='#FDE68A'; g.textAlign='right'; g.fillText('price '+fmt(E.peff),w-R-4,Y(E.peff)-8); }
$('#sideBody').addEventListener('click',e=>{ const a=e.target.closest('[data-act]'); if(!a) return; audio(); const act=a.dataset.act, o=G.orders.find(x=>x.id==a.dataset.id);
  if(act==='accept'&&o){ acceptOrder(o); renderSide(); } if(act==='pass'&&o){ passOrder(o); renderSide(); }
  if(act==='buy'){ if(buySteel(+a.dataset.n)) updateSide(true); }
  if(act==='auto'){ G.autoBuy=a.checked; } if(act==='rush'){ G.rush=a.checked; if(G.rush) tip('rushMode'); } });
$$('#side .tabs [data-tab]').forEach(t=>t.onclick=()=>{ audio(); const same=UI.tab===t.dataset.tab; UI.tab=t.dataset.tab; t.classList.remove('new'); if($('#side').classList.contains('min')) $('#side').classList.remove('min'); else if(same&&innerWidth<760) $('#side').classList.add('min'); renderSide(); });
$('#sideMin').onclick=()=>$('#side').classList.toggle('min');

/* ---------- machine inspector ---------- */
function inspSig(m){ return m?[m.c,m.r,m.crew,m.auto,!!m.broken,G.cash>=ECON.autoCost].join():''; }
function renderInspect(){ const m=G.sel, el=$('#inspect'); UI.insSig=inspSig(m); if(!m){ el.hidden=true; selRing.visible=false; return; } el.hidden=false; const d=MACH[m.type];
  selRing.visible=true; selRing.position.set(cellX(m.c),.06,cellZ(m.r));
  const crewTxt=m.auto?'🦾 Robot arm · no wages':m.crew===0?'Nobody working here':`${'🤖'.repeat(m.crew)} ${m.crew} worker${m.crew>1?'s':''} · ${fmt(m.crew*ECON.wage)}/day`;
  el.innerHTML=`<button class="x" data-i="close">×</button><div class="ihead"><span class="sw" style="background:${d.color}"></span><div><b>${d.name}</b><small>${d.desc}</small></div></div>${spMachine(m.type)?spBadge(spMachine(m.type),'Station sponsor'):''}
    <div class="status" data-iv="state"></div>
    <div class="istats"><div><em>Time per bot</em><b data-iv="cyc"></b></div><div><em>Can make</em><b data-iv="cap"></b></div><div><em>Busy</em><b data-iv="util"></b></div></div>
    <div class="ubar"><i data-iv="ubar"></i></div>
    <div class="crew">${crewTxt}</div>
    <div class="iacts">${m.auto?'':`${m.crew<2?`<button class="btn pri sm" data-i="hire">+ Hire worker <small>+${fmt(ECON.wage)}/day${m.crew===1?', 1.7× speed':''}</small></button>`:''}${m.crew>0?`<button class="btn ghost sm" data-i="fire">− Let one go <small>saves ${fmt(ECON.wage)}/day</small></button>`:''}
      <button class="btn gold sm" data-i="auto" ${G.cash<ECON.autoCost?'disabled':''}>🦾 Automate ${fmt(ECON.autoCost)} <small>2.1× speed, no wages, +${fmt(ECON.autoUpkeep)}/day upkeep, fewer defects</small></button>`}
      <div class="irow"><button class="btn ghost sm" data-i="rot">⟳ Rotate</button><button class="btn danger sm" data-i="sell">Sell +${fmt(Math.round(d.cost*.5)+(m.auto?Math.round(ECON.autoCost*.3):0))}</button></div></div>
    <div class="lesson" data-iv="lesson"></div>`;
  updateInspect(); }
function updateInspect(){ const m=G.sel; if(!m) return; if(!G.machines.includes(m)){ G.sel=null; return renderInspect(); } if(inspSig(m)!==UI.insSig) return renderInspect(); const el=$('#inspect'), v=k=>el.querySelector(`[data-iv="${k}"]`);
  const st=v('state'); st.textContent=stateTxt[m.state]||m.state; st.className='status st-'+m.state;
  v('cyc').textContent=staffed(m)?cycleOf(m).toFixed(1)+'s':'—'; v('cap').textContent=Math.round(capOf(m))+'/day'; v('util').textContent=Math.round(m.util*100)+'%'; v('ubar').style.width=(m.util*100)+'%';
  const bn=bottleneck(), E=econ(); let L='';
  if(m.broken) L='While this is broken, everything before it piles up and everything after it starves.';
  else if(bn===m) L='<b>Bottleneck!</b> This station is the slowest, so the whole line can only go this fast. Speeding up any other machine won\'t help.';
  else if(m.state==='starved'&&G.opened) L='This machine is waiting on the one before it. Making it faster would just mean more waiting.';
  else if(m.state==='blocked') L='Its output is backed up. The problem is <b>after</b> this machine.';
  else if(m.auto) L=`The robot cost ${fmt(ECON.autoCost)} up front but saves wages every day. That's trading a <b>variable</b>-feeling cost for a big one-time investment.`;
  else L=`Line capacity is <b>${Math.round(E.cap)}/day</b>, limited by the ${E.capBy}.`;
  v('lesson').innerHTML=L; }
$('#inspect').addEventListener('click',e=>{ const b=e.target.closest('[data-i]'); if(!b||!G.sel) return; audio(); const m=G.sel, a=b.dataset.i;
  if(a==='close'){ G.sel=null; } if(a==='hire') hire(m); if(a==='fire') fire(m); if(a==='auto'&&automate(m)) toast(`${MACH[m.type].name} automated! No more wages there.`,'good');
  if(a==='rot') rotateMachine(m); if(a==='sell'){ removeAt(m.c,m.r); G.sel=null; }
  renderInspect(); });

/* ---------- toolbar ---------- */
const TOOLS=[{id:'select',ic:'👆',t:'Select',k:'1'},{id:'belt',ic:'➡',t:'Belt',cost:ECON.belt,k:'B'},...Object.keys(MACH).map(k=>({id:k,ic:MACH[k].icon,t:MACH[k].short,cost:MACH[k].cost,k:MACH[k].key,color:MACH[k].color})),{id:'bulldoze',ic:'🧹',t:'Remove',k:'X'}];
function renderTools(){ $('#toolList').innerHTML=TOOLS.map(t=>{ const locked=MACH[t.id]&&MACH[t.id].big&&!G.expanded; return `<button class="tool ${G.tool===t.id?'on':''} ${locked?'locked':''}" data-tool="${t.id}" title="${t.t} (${t.k})" ${t.color?`style="--c:${t.color}"`:''}><span class="ic">${locked?'🔒':t.ic}</span><b>${t.t}</b>${t.cost?`<small>${fmt(t.cost)}</small>`:'<small>&nbsp;</small>'}</button>`; }).join(''); }
function setTool(id){ if(MACH[id]&&MACH[id].big&&!G.expanded){ toast('The Chip Installer unlocks in the big factory.'); return; } G.tool=id; if(id!=='select'){ G.sel=null; renderInspect(); } renderTools(); ghost.visible=false;
  const h={select:'Tap a machine to manage it · drag to move the camera', belt:'Tap or drag to lay belts · drag into a machine to feed it · R rotates', bulldoze:'Tap a belt or machine to remove it'}[id]||'Tap an empty tile or a belt to place it · R rotates';
  $('#hint').textContent=h; }
$('#toolList').addEventListener('click',e=>{ const b=e.target.closest('[data-tool]'); if(b){ audio(); setTool(b.dataset.tool); sfx.tick(); } });
$('#btnRot').onclick=()=>{ if(G.sel){ rotateMachine(G.sel); } else G.rot=(G.rot+1)%4; sfx.tick(); };
$('#btnExpand').onclick=()=>{ audio(); const ok=G.tot.shipped>=ECON.expandNeed;
  modal(`<div class="eyebrow">Grow the business</div><h2>Move into the big factory?</h2><p>Triple the floor space, a second steel dock and shipping bay with a ready-made second belt, and the <b>Chip Installer</b> for Deluxe MiniBots (+$25 each). More stores will want your bots too.</p>
    <div class="rows big"><div><span>One-time cost</span><b>${fmt(ECON.expandCost)}</b></div><div><span>Rent</span><b>${fmt(ECON.rentGarage)} → ${fmt(ECON.rentBig)}/day</b></div><div><span>Bots shipped</span><b>${G.tot.shipped} / ${ECON.expandNeed}</b></div></div>
    <div class="lesson">Bigger factory = higher fixed costs. It only pays off if you make (and sell) more bots. That's economies of scale.</div>
    <div class="mact"><button class="btn ghost" onclick="closeModal()">Not yet</button><button class="btn gold" id="doExpand" ${canExpand()?'':'disabled'}>${ok?(G.cash>=ECON.expandCost?'Expand for '+fmt(ECON.expandCost):'Need '+fmt(ECON.expandCost)+' cash'):'Ship '+(ECON.expandNeed-G.tot.shipped)+' more bots'}</button></div>`);
  const d=$('#doExpand'); if(d) d.onclick=()=>{ closeModal(); fadeDo(()=>{ if(expand()){ renderTools(); advise('Welcome to the big floor! There\'s a <b>second line</b> ready along the bottom: add machines to it. Try the new <b>Chip Installer</b> for Deluxe bots.'); } }); }; };
function fadeDo(fn){ $('#fade').style.opacity=1; setTimeout(()=>{ fn(); setTimeout(()=>$('#fade').style.opacity=0,120); },460); }

/* ---------- day end + report ---------- */
function plRow(k,v,cls){ return `<div class="${cls||''}"><span>${k}</span><b>${v<0?'−'+fmt(-v):fmt(v)}</b></div>`; }
function dayLesson(r){ const prev=G.hist[G.hist.length-2], E=econ(), margin=E.margin;
  if(r.made===0) return 'No bots, no sales, but rent and wages still got paid. That\'s what <b>fixed costs</b> means: you pay them no matter what.';
  if(prev&&prev.unit&&r.unit&&r.unit<prev.unit*.93&&r.made>prev.made) return `Your cost per bot fell from <b>${fmt2(prev.unit)}</b> to <b>${fmt2(r.unit)}</b> because you made more bots (${prev.made} → ${r.made}). Same fixed costs, spread thinner. That's <b>economies of scale</b>.`;
  if(r.retN>0&&!has('qa')) return `${r.retN} broken bot${r.retN>1?'s':''} came back. Each return cost the full price plus a fee and some reputation. A <b>QA Scanner</b> catches defects before they ship.`;
  if(G.steelMult>1&&r.day>=4&&r.day<=5) return 'Steel cost 60% more today, so every bot cost more to make. That\'s a <b>variable cost</b> shock. Buying stock early, or in bulk, protects you.';
  if(G.rival) return `ScrapCo is selling at $${G.rival.price}. You can cut your price (lower margin) or win on <b>value</b>: boxed bots, Deluxe bots and contracts.`;
  if(r.net<0&&isFinite(r.be)&&r.made<r.be) return `You made <b>${r.made}</b> bots but needed about <b>${r.be}</b> to break even. Find your bottleneck and speed it up, or raise your price.`;
  if(r.net<0) return 'Loss today. Check what grew: fixed costs (wages, rent, upkeep) or variable costs (steel, paint)? Every dollar of cost needs a bot\'s margin to cover it.';
  if(r.scrap>0) return `QA scrapped ${r.scrap} defective bot${r.scrap>1?'s':''}. Scrap wastes material, but it's way cheaper than a refund and an angry customer.`;
  return `Profit! Every bot past break-even adds about <b>${fmt2(margin)}</b> (price minus variable cost) straight to profit. Margin × volume is the whole game.`; }
function showDayEnd(r){ const last=r.day>=DAYS, rev=r.rev-r.returns, vcost=r.mat+r.vc;
  modal(`<div class="eyebrow">End of Day ${r.day} · Daily P&amp;L</div><h2 class="${r.net>=0?'g':'r'}">${r.net>=0?'Profit':'Loss'} ${r.net<0?'−':''}${fmt(Math.abs(Math.round(r.net)))}</h2>
    <div class="pl">${plRow('Sales to customers (orders)',r.orderRev)}${plRow('Sales on the open market',r.mktRev)}${r.returns?plRow('Refunds for broken bots',-r.returns,'bad'):''}${plRow('Revenue',rev,'sub')}
      <div class="hd">Variable costs <small>(grow with every bot)</small></div>${plRow('Steel used',-r.mat)}${r.vc?plRow('Paint, boxes, chips',-r.vc):''}
      <div class="hd">Fixed costs <small>(same if you make 0 or 100)</small></div>${plRow('Rent',-r.rent)}${plRow('Wages',-r.wages)}${plRow('Loan interest',-r.loan)}${plRow('Machine upkeep & wear',-r.upkeep)}${r.storage?plRow('Storage',-r.storage):''}${r.repairs?plRow('Repairs',-r.repairs):''}
      ${plRow('Net profit',r.net,'tot '+(r.net>=0?'good':'bad'))}</div>
    <div class="kpis"><div><em>Bots shipped</em><b>${r.made}</b></div><div><em>Cost per bot</em><b>${r.unit?fmt2(r.unit):'—'}</b></div><div><em>Break-even</em><b>${isFinite(r.be)?r.be+'/day':'—'}</b></div><div><em>Cash</em><b class="${r.cash<0?'r':''}">${fmt(r.cash)}</b></div></div>
    <div class="lesson">💡 ${dayLesson(r)}</div>
    ${careerCard(r)}
    ${r.emergency?'<div class="note bad">You ran out of cash, so the bank gave you an emergency loan of '+fmt(ECON.emergency)+' (+'+fmt(ECON.emergencyInt)+'/day interest). Ouch.</div>':''}
    ${G.news.map(n=>`<div class="note">${n}</div>`).join('')}
    <small class="muted">Not in profit: ${fmt(r.buy)} spent on new steel (it's inventory until you use it) and ${fmt(r.capex)} on equipment (an investment).</small>
    <div class="mact">${spBadge(spPresenting(),'Today\'s shift presented by')}<button class="btn pri big" id="btnNext">${last?'See your report card':'Start Day '+(r.day+1)+' ▶'}</button></div>`,'wide'); spTrack('view',spPresenting(),{slot:'presenting',where:'dayend'});
  sfx[r.net>=0?'cash':'bad'](); $('#btnNext').onclick=()=>{ closeModal(); if(last) report(); else { nextDay(); renderSide(); } }; }
function grade(){ const profit=G.hist.reduce((a,h)=>a+h.net,0), done=G.tot.ordersDone, late=G.tot.ordersLate;
  const p=clamp((profit+1500)/7500,0,1)*40, rp=G.rep/100*20, op=(done+late?done/(done+late):.4)*15, q=(1-G.tot.returns/Math.max(1,G.tot.sold))*10, ms=Object.keys(G.ms).length/MILESTONES.length*15;
  const s=p+rp+op+q+ms; const L=s>=90?'A+':s>=80?'A':s>=70?'B':s>=58?'C':s>=45?'D':'F'; return {s:Math.round(s), L, profit, parts:{p,rp,op,q,ms}}; }
function partnerStrip(){ const all=[spPresenting(),spSteel(),spShip(),...spBanners(),...Object.keys(MACH).map(spMachine),...Object.keys(CAREERS).map(k=>(SPONSORS.careers||{})[k]?spCareer(k):null)].filter(Boolean), seen={}, u=all.filter(s=>!seen[s.name]&&(seen[s.name]=1));
  if(!u.length) return ''; return `<h4>Thanks to our partners</h4><div class="partners">${u.map(s=>spBadge(s,'')).join('')}</div><p class="muted">These companies build real things in real factories, and they're hiring people who understand what you just learned.</p>`; }
function report(){ G.over=true; G.paused=true; const g=grade(), H=G.hist, first=H.find(h=>h.unit), maxAbs=Math.max(100,...H.map(h=>Math.abs(h.net)));
  const learned=[];
  if(first&&G.tot.bestUnit&&G.tot.bestUnit<first.unit) learned.push(`Your cost per bot went from <b>${fmt2(first.unit)}</b> on Day ${first.day} to as low as <b>${fmt2(G.tot.bestUnit)}</b>. More volume spread the same fixed costs thinner: <b>economies of scale</b>.`);
  learned.push(`Fixed costs (rent, wages, upkeep, interest) came to about <b>${fmt(Math.round(H.reduce((a,h)=>a+h.fixed,0)/H.length))}/day</b>. You owed that whether the line ran or not.`);
  if(G.tot.scrap||G.tot.returns) learned.push(`QA caught <b>${G.tot.scrap}</b> defects; <b>${G.tot.returns}</b> broken bots reached customers. Quality costs less in the factory than after the sale.`);
  if(G.machines.some(m=>m.auto)) learned.push('You automated a station: a big one-time cost that cut daily wages. That trade only works if you keep the machine busy.');
  if(G.expanded) learned.push('You scaled up into the big factory. Higher rent, but more capacity and Deluxe margins.');
  learned.push(`You set a final price of <b>${fmt(G.price)}</b>. Lower prices sell more bots but each one earns less. Finding the sweet spot is called <b>pricing</b>.`);
  modal(`<div class="rep"><div class="rtop"><img src="${MB_ASSETS.logo}" alt=""><div><div class="eyebrow">BotFactory · Report card</div><h2>${g.L.startsWith('A')?'Factory legend!':g.L==='B'?'Solid factory boss':g.L==='C'?'Making it work':'Tough run, but you learned a lot'}</h2></div><div class="grade ${g.L[0]==='A'||g.L==='B'?'':g.L==='C'?'c':'f'}">${g.L}</div></div>
    <div class="kpis"><div><em>Total profit</em><b class="${g.profit>=0?'g':'r'}">${fmt(Math.round(g.profit))}</b></div><div><em>Bots shipped</em><b>${G.tot.shipped}</b></div><div><em>Best cost/bot</em><b>${G.tot.bestUnit?fmt2(G.tot.bestUnit):'—'}</b></div><div><em>Orders on time</em><b>${G.tot.ordersDone}/${G.tot.ordersDone+G.tot.ordersLate}</b></div><div><em>Reputation</em><b>${Math.round(G.rep)}</b></div><div><em>Cash</em><b>${fmt(G.cash)}</b></div></div>
    <h4>Profit by day</h4><div class="bars">${H.map(h=>`<div class="bar"><i class="${h.net>=0?'p':'n'}" style="height:${Math.abs(h.net)/maxAbs*100}%"></i><span>${h.day}</span></div>`).join('')}</div>
    <h4>Milestones</h4><div class="badges">${MILESTONES.map(m=>`<span class="${G.ms[m.id]?'':'no'}">${G.ms[m.id]?'✓':'○'} ${m.t}</span>`).join('')}</div>
    <h4>What you learned</h4><ul class="learn">${learned.map(l=>'<li>'+l+'</li>').join('')}</ul>
    ${partnerStrip()}
    <div class="mact"><button class="btn ghost" id="btnKeep">Keep looking around</button><button class="btn pri big" onclick="location.reload()">Play again</button></div></div>`,'wide');
  $('#btnKeep').onclick=closeModal; sfx.fanfare(); }
$('#btnGoals').onclick=()=>{ audio(); modal(`<button class="x" onclick="closeModal()">×</button><div class="eyebrow">Your goals</div><h2>Garage to factory in ${DAYS} days</h2><p>Make MiniBots, fill orders, and keep costs under control. Your grade comes from <b>total profit</b>, <b>reputation</b>, <b>on-time orders</b>, <b>quality</b> and <b>milestones</b>.</p>
  <div class="badges col">${MILESTONES.map(m=>`<span class="${G.ms[m.id]?'':'no'}">${G.ms[m.id]?'✓':'○'} ${m.t}</span>`).join('')}</div>
  <h4>Controls</h4><p class="muted">Drag to move the camera · right-drag or Q/E to rotate · wheel or pinch to zoom · WASD to pan · R rotates · Space pauses · 1–7 pick tools, B belt, X remove</p>`); };

/* ---------- input ---------- */
const ray=new THREE.Raycaster(), ndc=new THREE.Vector2(), gplane=new THREE.Plane(new THREE.Vector3(0,1,0),0), _hit=new THREE.Vector3();
function cellAt(x,y){ ndc.set(x/innerWidth*2-1,-(y/innerHeight)*2+1); ray.setFromCamera(ndc,camera); if(!ray.ray.intersectPlane(gplane,_hit)) return null; return {c:Math.floor((_hit.x-OX)/CELL), r:Math.floor((_hit.z-OZ)/CELL)}; }
let ghost, selRing;
function makeGhost(){ ghost=new THREE.Group(); const gm=new THREE.MeshBasicMaterial({color:'#22C55E', transparent:true, opacity:.32, depthWrite:false}); const b=new THREE.Mesh(BOX,gm); b.scale.set(1.92,.7,1.92); b.position.y=.35; ghost.add(b);
  const ar=new THREE.Mesh(new THREE.ConeGeometry(.32,.6,4), new THREE.MeshBasicMaterial({color:'#fff', transparent:true, opacity:.85, depthWrite:false})); ar.rotation.z=-Math.PI/2; ar.position.set(.45,.85,0); ghost.add(ar); ghost.userData={gm}; ghost.visible=false; scene.add(ghost);
  selRing=new THREE.Mesh(new THREE.RingGeometry(1.2,1.38,40), new THREE.MeshBasicMaterial({color:'#00E676', transparent:true, opacity:.9, depthWrite:false})); selRing.rotation.x=-Math.PI/2; selRing.visible=false; scene.add(selRing); }
function updateGhost(cell){ if(!cell||G.tool==='select'||G.mode!=='play'){ ghost.visible=false; return; } const t=at(cell.c,cell.r), err=canPlace(G.tool,cell.c,cell.r);
  ghost.visible=true; ghost.position.set(cellX(cell.c),0,cellZ(cell.r)); const dir=t&&t.k==='belt'&&MACH[G.tool]?t.dir:t&&t.k==='belt'&&G.tool==='belt'?(t.dir+1)%4:G.rot; ghost.rotation.y=-dir*Math.PI/2;
  ghost.children[1].visible=G.tool!=='bulldoze'; ghost.userData.gm.color.set(G.tool==='bulldoze'?(err?'#64748B':'#EF4444'):err?'#EF4444':'#22C55E'); }
function beltDragTo(cell){ const D=UI.drag; let last=D.last; if(!cell||(cell.c===last.c&&cell.r===last.r)) return;
  let guard=0; while((last.c!==cell.c||last.r!==cell.r)&&guard++<40){ const dc=cell.c-last.c, dr=cell.r-last.r; let dir; if(dc!==0&&(Math.abs(dc)>=Math.abs(dr)||dr===0)) dir=dc>0?0:2; else dir=dr>0?1:3;
    const nxt={c:last.c+DX[dir], r:last.r+DZ[dir]}; const pt=at(last.c,last.r); if(pt&&pt.k==='belt'){ if(pt.dir!==dir){ pt.dir=dir; beltsDirty=true; } }
    const nt=at(nxt.c,nxt.r); if(!nt&&inB(nxt.c,nxt.r)){ if(placeBelt(nxt.c,nxt.r,dir)) sfx.tick(); } last=nxt; }
  D.last=last; }
function handleTap(cell){ if(!cell) return; const t=at(cell.c,cell.r);
  if(t&&t.k==='mach'&&t.broken){ whack(t); return; }
  if(G.tool==='select'){ if(t&&t.k==='mach'){ G.sel=t; renderInspect(); sfx.tick(); } else if(t&&t.k==='supply'){ UI.tab='supply'; $('#side').classList.remove('min'); renderSide(); } else if(t&&t.k==='ship'){ UI.tab='orders'; $('#side').classList.remove('min'); renderSide(); } else { G.sel=null; renderInspect(); } return; }
  if(G.tool==='belt'){ if(t&&t.k==='belt'){ t.dir=(t.dir+1)%4; beltsDirty=true; sfx.tick(); } else { const e=canPlace('belt',cell.c,cell.r); if(e) toast(e); else { placeBelt(cell.c,cell.r,G.rot); sfx.tick(); } } return; }
  if(G.tool==='bulldoze'){ if(t&&(t.k==='belt'||t.k==='mach')){ removeAt(cell.c,cell.r); sfx.thud(); renderInspect(); } return; }
  if(MACH[G.tool]){ const e=canPlace(G.tool,cell.c,cell.r); if(e){ toast(e,'bad'); sfx.bad(); return; } const m=placeMachine(G.tool,cell.c,cell.r,G.rot); if(m) afterPlace(m); } }
function afterPlace(m){ floatText(cellX(m.c),1.6,cellZ(m.r),'−'+fmt(MACH[m.type].cost),'bad'); const core=CORE.filter(has).length;
  if(m.type==='stamper') tip('needAsm'); if(core===3&&!G.opened){ tip('ready'); $('#btnOpen').classList.add('pulse'); }
  setTool('select'); if(innerWidth>=560){ G.sel=m; renderInspect(); } }
const cv=$('#gl');
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{ audio(); cv.setPointerCapture(e.pointerId); UI.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,b:e.button});
  if(UI.pointers.size===2){ UI.drag={mode:'pinch'}; const [a,b]=[...UI.pointers.values()]; UI.drag.d=Math.hypot(a.x-b.x,a.y-b.y); UI.drag.a=Math.atan2(b.y-a.y,b.x-a.x); UI.drag.mx=(a.x+b.x)/2; UI.drag.my=(a.y+b.y)/2; return; }
  if(e.button===2||e.button===1){ UI.drag={mode:'rotate'}; return; }
  if(G.mode!=='play'||UI.modal) { UI.drag={mode:'pan',moved:0,noTap:true}; return; }
  const cell=cellAt(e.clientX,e.clientY);
  if(G.tool==='belt'&&cell&&inB(cell.c,cell.r)&&!(at(cell.c,cell.r)&&at(cell.c,cell.r).k==='mach'&&at(cell.c,cell.r).broken)){ UI.drag={mode:'belt', start:cell, last:cell, moved:0}; return; }
  UI.drag={mode:'pan', moved:0}; });
cv.addEventListener('pointermove',e=>{ const p=UI.pointers.get(e.pointerId);
  if(!p){ if(e.pointerType==='mouse'&&G.mode==='play'){ UI.hover=cellAt(e.clientX,e.clientY); updateGhost(UI.hover); } return; }
  const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY; const D=UI.drag; if(!D) return;
  if(D.mode==='pinch'&&UI.pointers.size>=2){ const [a,b]=[...UI.pointers.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y), an=Math.atan2(b.y-a.y,b.x-a.x), mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
    CAM.dist=clamp(CAM.dist*D.d/Math.max(20,d),CAM.min,CAM.max); CAM.yaw-=an-D.a; panCam(mx-D.mx,my-D.my); D.d=d; D.a=an; D.mx=mx; D.my=my; return; }
  if(D.mode==='rotate'){ CAM.yaw-=dx*.006; CAM.pitch=clamp(CAM.pitch+dy*.004,.5,1.35); return; }
  D.moved+=Math.abs(dx)+Math.abs(dy);
  if(D.mode==='belt'){ const cell=cellAt(e.clientX,e.clientY); if(cell&&(cell.c!==D.last.c||cell.r!==D.last.r)){ if(!D.started){ D.started=true; const t=at(D.start.c,D.start.r); if(!t&&placeBelt(D.start.c,D.start.r,G.rot)) sfx.tick(); } beltDragTo(cell); } updateGhost(cell); return; }
  if(D.mode==='pan'&&D.moved>6) panCam(dx,dy); });
function endPointer(e){ const p=UI.pointers.get(e.pointerId); if(!p) return; UI.pointers.delete(e.pointerId); const D=UI.drag;
  if(D&&D.mode==='pinch'){ if(UI.pointers.size===0) UI.drag=null; else UI.drag={mode:'pan',moved:99}; return; }
  if(D&&(D.mode==='pan'||D.mode==='belt')&&!D.noTap&&D.moved<8&&!D.started&&G.mode==='play'&&!UI.modal) handleTap(cellAt(e.clientX,e.clientY));
  if(UI.pointers.size===0) UI.drag=null; }
cv.addEventListener('pointerup',endPointer); cv.addEventListener('pointercancel',endPointer);
cv.addEventListener('pointerleave',()=>{ if(!UI.pointers.size) ghost.visible=false; });
cv.addEventListener('wheel',e=>{ e.preventDefault(); CAM.dist=clamp(CAM.dist*(1+Math.sign(e.deltaY)*.1),CAM.min,CAM.max); },{passive:false});
addEventListener('keydown',e=>{ if(e.target.tagName==='INPUT') return; const k=e.key.toLowerCase(); UI.keys.add(k);
  if(k==='escape'){ if(UI.modal&&!$('#btnNext')&&!G.over) closeModal(); else { setTool('select'); G.sel=null; renderInspect(); } }
  if(G.mode!=='play'||UI.modal) return;
  if(k===' '){ e.preventDefault(); if(G.opened){ G.paused=!G.paused; } }
  if(k==='r'){ if(G.sel) rotateMachine(G.sel); else { G.rot=(G.rot+1)%4; updateGhost(UI.hover); } }
  const tl=TOOLS.find(t=>t.k.toLowerCase()===k); if(tl) setTool(tl.id);
  if(k==='+'||k==='=') CAM.dist=clamp(CAM.dist*.9,CAM.min,CAM.max); if(k==='-') CAM.dist=clamp(CAM.dist*1.1,CAM.min,CAM.max);
  if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault(); });
addEventListener('keyup',e=>UI.keys.delete(e.key.toLowerCase())); addEventListener('blur',()=>UI.keys.clear());
$$('#camctl button').forEach(b=>b.onclick=()=>{ const c=b.dataset.c; if(c==='rl') CAM.yawGoal=(CAM.yawGoal??CAM.yaw)+Math.PI/4; if(c==='rr') CAM.yawGoal=(CAM.yawGoal??CAM.yaw)-Math.PI/4; if(c==='zi') CAM.dist=clamp(CAM.dist*.85,CAM.min,CAM.max); if(c==='zo') CAM.dist=clamp(CAM.dist*1.18,CAM.min,CAM.max); });
$$('#speed button').forEach(b=>b.onclick=()=>{ audio(); if(!G.opened||UI.modal) return; const s=+b.dataset.s; if(s===0) G.paused=!G.paused; else { G.speed=s; G.paused=false; } sfx.tick(); hud(); });
$('#btnMute').onclick=()=>{ UI.muted=!UI.muted; $('#btnMute').textContent=UI.muted?'🔇':'🔊'; };
$('#advisor .x').onclick=()=>$('#advisor').classList.add('hide');
$('#btnOpen').onclick=()=>{ audio(); const core=CORE.filter(has).length;
  if(core<3){ advise('Your line still needs '+CORE.filter(t=>!has(t)).map(t=>'a <b>'+MACH[t].name+'</b>').join(' and ')+'. Without all three, the parts reach shipping unfinished. Open anyway to see what happens, or add them first.'); if(!G.flags.openWarn){ G.flags.openWarn=1; return; } }
  G.opened=true; G.paused=false; G.speed=1; $('#btnOpen').hidden=true; sfx.fanfare(); toast('Day 1 has started. The clock is ticking!','good'); };

/* ---------- visuals per frame ---------- */
const LIST=[];
function collectItems(){ LIST.length=0;
  for(const b of G.belts){ const cx=cellX(b.c), cz=cellZ(b.r);
    for(const e of b.items){ const f=e.from, p=e.p; let x,z,dir; if(p<.5){ const k=p*2; x=lerp(cx+DX[f],cx,k); z=lerp(cz+DZ[f],cz,k); dir=(f+2)%4; } else { const k=(p-.5)*2; x=lerp(cx,cx+DX[b.dir],k); z=lerp(cz,cz+DZ[b.dir],k); dir=b.dir; }
      LIST.push({it:e.it,x,y:.41,z,ry:-dir*Math.PI/2}); } }
  for(const m of G.machines){ const cx=cellX(m.c), cz=cellZ(m.r), fx=DX[m.dir], fz=DZ[m.dir], ry=-m.dir*Math.PI/2;
    m.inQ.forEach((it,i)=>LIST.push({it,x:cx-fx*(.62+i*.32),y:.41,z:cz-fz*(.62+i*.32),ry}));
    if(m.cur){ const k=lerp(-.3,.3,m.prog); LIST.push({it:m.cur,x:cx+fx*k,y:.41,z:cz+fz*k,ry}); }
    if(m.out) LIST.push({it:m.out,x:cx+fx*.7,y:.41,z:cz+fz*.7,ry}); } }
const LIGHT={work:'#22C55E', starved:'#FBBF24', blocked:'#EF4444', nocrew:'#64748B', broken:'#EF4444'};
function animMachines(t,rdt,running){ const bn=bottleneck(); if(bn&&running&&G.day>=1&&UI.t>4){ tip('bottleneck'); G.flags.bnSeen=1; }
  for(const m of G.machines){ const P=m.P, work=running&&m.state==='work'&&!m.pass;
    const lc=LIGHT[m.state]||'#22C55E'; if(m.lc!==lc){ m.lc=lc; P.lightMat.color.set(lc); P.lightMat.emissive.set(lc); } P.lightMat.emissiveIntensity=m.state==='broken'?(Math.sin(t*10)>0?1.6:.1):1.2;
    if(P.head&&m.type==='stamper') P.head.position.y=work?1.55-Math.pow(Math.max(0,Math.sin(m.prog*Math.PI)),3)*.95:1.55;
    if(m.type==='chip'&&P.head) P.head.position.y=work?1.7-Math.max(0,Math.sin(m.prog*Math.PI*2))*.5:1.7;
    if(P.arm){ if(work){ P.arm.rotation.y=Math.sin(t*5)*.9; P.up.rotation.x=Math.sin(t*7)*.3; P.arm2.rotation.y=-Math.sin(t*6+1)*1.1; } }
    if(P.mist){ P.mist.material.opacity=work?.28+Math.sin(t*30)*.1:0; P.nozzle.position.x=work?Math.sin(t*6)*.35:0; }
    if(P.scan){ P.scan.position.y=work?1.0+Math.abs(Math.sin(t*4))*.85:1.85; P.beam.material.opacity=work?.22:.05; }
    if(P.flap) P.flap.rotation.z=work?Math.sin(t*9)*.6:0;
    if(P.leds) P.leds.emissiveIntensity=work?(Math.sin(t*14)>0?1.6:.3):.5;
    if(m.auto&&P.r1){ P.robot.rotation.y=work?Math.sin(t*4)*1.2:0; P.r1.rotation.x=work?Math.sin(t*6)*.35:0; }
    m.workers.forEach((w,i)=>rigPlay(w, m.broken?'UpPoint':work?(i?'LeftHand':'RightHand'):'Idle'));
    const isB=bn===m; P.ring.visible=isB||!!m.broken; if(P.ring.visible){ const s=1+Math.sin(t*5)*.06; P.ring.scale.set(s,s,1); }
    const al=m.broken?'broken':isB?'bottleneck':m.state==='nocrew'?'nocrew':null; m.alert.visible=!!al; if(al&&m.alert.material.map!==MM.alerts[al]){ m.alert.material.map=MM.alerts[al]; m.alert.material.needsUpdate=true; } if(al) m.alert.position.y=3.55+Math.sin(t*4)*.08;
    if(m.shake>0){ m.shake=Math.max(0,m.shake-rdt*5); m.g.position.x=cellX(m.c)+Math.sin(t*80)*.08*m.shake; } } }
function animDocks(t){ for(const s of G.supplies){ const u=s.g.userData, h=Math.max(.02,G.stock/ECON.maxStock*1.6/G.supplies.length*(G.supplies.length>1?1.5:1)); u.stack.scale.y=h; u.stack.position.y=.48+h/2;
    const key=G.stock+s.state; if(u.n!==key){ u.n=key; retext(u.label,[{t:s.state==='idle'?'STEEL · NEEDS A STAMPER':'STEEL IN',size:s.state==='idle'?34:44,color:s.state==='idle'?'#FDE68A':G.stock<12?'#FCA5A5':'#93C5FD'},{t:G.stock+' sheets',size:40}],{}); } }
  for(const s of G.ships){ const u=s.g.userData, h=Math.max(.01,Math.min(1.4,G.fg.length*.05)); u.stack.scale.y=h; u.stack.position.y=.48+h/2;
    if(s.bump>0){ s.bump=Math.max(0,s.bump-.08); u.stack.scale.x=u.stack.scale.z=1.15+s.bump*.12; }
    if(u.n!==G.fg.length){ u.n=G.fg.length; retext(u.label,[{t:'SHIPPING',size:44,color:'#86EFAC'},{t:G.fg.length+' ready',size:40}],{}); } } }

/* ---------- loop ---------- */
let titleSpin=0;
function loop(){ requestAnimationFrame(loop); const raw=clock.getDelta(), rdt=Math.min(.05,raw); UI.lag=Math.min(.05,Math.max(0,raw-.05)); UI.t+=rdt; const t=UI.t;
  const running=G.mode==='play'&&G.opened&&!G.paused&&!UI.modal;
  if(G.mode==='title'){ titleSpin+=rdt*.08; CAM.yaw=.62+Math.sin(titleSpin)*.5; }
  else { const K=UI.keys, ps=CAM.dist*.9*rdt*60; if(K.has('w')||K.has('arrowup')) panCam(0,ps*.35); if(K.has('s')||K.has('arrowdown')) panCam(0,-ps*.35); if(K.has('a')||K.has('arrowleft')) panCam(ps*.35,0); if(K.has('d')||K.has('arrowright')) panCam(-ps*.35,0);
    if(K.has('q')) CAM.yaw+=rdt*1.6; if(K.has('e')) CAM.yaw-=rdt*1.6; }
  if(CAM.yawGoal!=null){ CAM.yaw=lerp(CAM.yaw,CAM.yawGoal,Math.min(1,rdt*8)); if(Math.abs(CAM.yaw-CAM.yawGoal)<.002){ CAM.yaw=CAM.yawGoal; CAM.yawGoal=null; } }
  if(CAM.goal){ const g=CAM.goal, k=Math.min(1,rdt*3); CAM.tx=lerp(CAM.tx,g.tx,k); CAM.tz=lerp(CAM.tz,g.tz,k); CAM.dist=lerp(CAM.dist,g.dist,k); if(Math.abs(CAM.dist-g.dist)<.05) CAM.goal=null; }
  if(running){ const sdt=Math.min(.1,rdt+(UI.lag||0))*G.speed, n=Math.ceil(sdt/.034); for(let i=0;i<n;i++){ simStep(sdt/n); stepTrucks(sdt/n); if(G.paused) break; } BELT.tex.offset.x-=sdt*ECON.beltSpeed*(G.rush?1.15:1); }
  else if(G.mode==='play'&&!UI.modal) stepTrucks(0);
  if(beltsDirty){ rebuildBelts(G.belts); beltsDirty=false; }
  collectItems(); drawItems(LIST); animMachines(t,rdt,running); animDocks(t);
  for(const r of W.rigs) r.mixer.update(rdt);
  if(G.mb){ G.mb.root.position.y=2.2+Math.sin(t*1.6)*.15; G.mb.root.rotation.y=Math.atan2(camera.position.x-G.mb.root.position.x,camera.position.z-G.mb.root.position.z); }
  if(G.rusty&&G.rusty.root.visible){ G.rusty.root.rotation.y=Math.sin(t*.7)*.4; }
  W.anim.forEach(f=>f(t)); stepFx(rdt); stepFloaters(rdt); updateCam();
  if(G.mode==='play'){ if(t>UI.hudT){ UI.hudT=t+.2; hud(); stepTips(); } if(t>UI.sideT&&!$('#side').classList.contains('min')){ UI.sideT=t+.5; updateSide(); } if(t>UI.insT){ UI.insT=t+.3; updateInspect(); } }
  renderer.render(scene,camera); }

/* ---------- boot ---------- */
async function boot(){
  await loadSponsorLogos(); $('#tSpons').innerHTML=spBadge(spPresenting()); spTrack('view',spPresenting(),{slot:'presenting',where:'title'});
  initThree(); setupMaterials(); machineMats(); ['tLogo','hLogo','aLogo'].forEach(id=>$('#'+id).src=MB_ASSETS.logo);
  buildEnvironment(); initInstancing(); makeGhost();
  GLTF.crowd=await parseGLB(MB_ASSETS.crowd); GLTF.hero=await parseGLB(MB_ASSETS.hero);
  setupFactory();
  G.mb=makeRig(GLTF.hero, MB.hero, 1.5, 'g'); G.mb.root.position.set(OX-1.6,2.2,OZ+1.2); G.mb.root.add(blob(1.4)); scene.add(G.mb.root);
  G.rusty=makeRig(GLTF.crowd, MB.rust, 1.3, 'r'); G.rusty.root.position.set(cellX(8),0,OZ-3.2); G.rusty.root.add(blob(1.3)); G.rusty.root.visible=false; scene.add(G.rusty.root);
  /* a couple of idle bots out front for life */
  const loiter=makeRig(GLTF.crowd, MB.bodies['#A5F3FC'], .95,'g'); loiter.root.position.set(OX-3,0,-OZ+3); scene.add(loiter.root); rigPlay(loiter,'Idle');
  renderTools(); updateCam(); renderer.compile(scene,camera);
  $('#btnStart').disabled=false; $('#btnStart').textContent='Start your factory';
  requestAnimationFrame(loop); }
$('#btnStart').onclick=()=>{ audio(); fadeDo(()=>{ $('#title').hidden=true; G.mode='play'; ['#hud','#side','#tools','#camctl','#btnOpen','#hint'].forEach(s=>$(s).hidden=false); if(innerWidth<760) $('#side').classList.add('min');
  CAM.tx=cellX(4.5); CAM.tz=cellZ(2.5); CAM.yaw=innerHeight>innerWidth?1.2:.5; CAM.dist=innerHeight>innerWidth?30:24; setTool('select'); renderSide(); hud(); setTimeout(()=>tip('intro'),500); }); };
window.BF={MACH, ff(sec){ for(let i=0;i<sec/.034;i++){ if(G.paused||!G.opened) break; simStep(.034); stepTrucks(.034); } }, G, UI, placeMachine, placeBelt, removeAt, buySteel, acceptOrder, hire, automate, breakdown, whack, expand, canExpand, econ, setTool, handleTap, closeModal, nextDay, endDay, report, cellAt, CAM, renderSide};
boot().catch(e=>{ console.error(e); $('#btnStart').textContent='Could not load: '+e.message; });
