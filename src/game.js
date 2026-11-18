/* ===================== BotFactory · UI, juice, input, loop ===================== */
const UI={tab:'orders', sig:'', t:0, tipQ:[], tipAt:0, modal:false, hudT:0, sideT:0, insT:0, insSig:'', pointers:new Map(), drag:null, hover:null, hoverM:null, keys:new Set(),
  cashShown:ECON.startCash, saleAcc:0, saleT:0, coinQ:0, coinT:0, bannerQ:[], bannerOn:false, goalId:null, goalT:0, hirePick:false, fps:[], fpsT:0, downgrades:0, lockQ:false};
const urlQ=new URLSearchParams(location.search).get('q'); if(urlQ&&QS[urlQ]){ Q.level=urlQ; UI.lockQ=true; }

/* ---------- small UI helpers ---------- */
function toast(html,type){ const e=document.createElement('div'); e.className='toast '+(type||''); e.innerHTML=html; $('#toasts').appendChild(e); while($('#toasts').children.length>2) $('#toasts').firstChild.remove(); setTimeout(()=>{ e.style.opacity=0; setTimeout(()=>e.remove(),400); },4200); }
let advT=0; function advise(html,ms){ ms=ms||Math.max(7000,html.length*55); $('#aText').innerHTML=html; $('#advisor').classList.remove('hide'); clearTimeout(advT); advT=setTimeout(()=>$('#advisor').classList.add('hide'),ms); if(G.mb) rigPlay(G.mb,'UpPoint',true); }
function tip(key,html){ if(G.flags['tip_'+key]) return; G.flags['tip_'+key]=1; UI.tipQ.push(html||TIPS[key]); }
function stepTips(){ if(UI.tipQ.length&&UI.t>UI.tipAt&&!UI.modal&&G.mode==='play'&&!UI.bannerOn){ advise(UI.tipQ.shift()); UI.tipAt=UI.t+13; } }
let rsT=0; function rusty(text,ms=6000){ const e=$('#rusty'); e.querySelector('p').textContent=text; e.classList.remove('hide'); clearTimeout(rsT); rsT=setTimeout(()=>e.classList.add('hide'),ms); if(G.rusty) rigPlay(G.rusty,pick(['UpPoint','RightHand','TwistJump']),true); }
function modal(html,cls){ $('#modalCard').className=cls||''; $('#modalCard').innerHTML=html; $('#modal').hidden=false; UI.modal=true; $('#modalCard').animate([{transform:'scale(.92) translateY(10px)',opacity:0},{transform:'none',opacity:1}],{duration:260,easing:'cubic-bezier(.2,1.4,.4,1)'}); return $('#modalCard'); }
function closeModal(){ $('#modal').hidden=true; $('#modalCard').innerHTML=''; UI.modal=false; }
const dayClock=t=>{ const mins=8*60+Math.floor(t/DAY_LEN*600), h=Math.floor(mins/60), m=mins%60; return ((h-1)%12+1)+':'+String(m).padStart(2,'0')+(h<12?' AM':' PM'); };
const stateTxt={work:'Working', starved:'Waiting for parts', blocked:'Blocked: output is backed up', nocrew:'No worker: hire someone', broken:'Broken: tap the machine to fix'};
const moodIc=m=>m>=75?'😄':m>=55?'🙂':m>=38?'😐':'😣';
const sxz=(c,r,y)=>screenOf(cellX(c),y||1,cellZ(r));

/* ---------- juice: banners, confetti, coins ---------- */
function banner(title,sub,kind){ UI.bannerQ.push({title,sub,kind}); if(!UI.bannerOn) nextBanner(); }
function nextBanner(){ const b=UI.bannerQ.shift(); if(!b){ UI.bannerOn=false; return; } UI.bannerOn=true; const e=$('#banner'); e.className='show '+(b.kind||''); e.innerHTML=`<em>${b.title}</em><b>${b.sub}</b>`;
  confetti(b.kind==='gold'?36:18); CAM.punch=1; setTimeout(()=>{ e.className=''; setTimeout(nextBanner,350); },2300); }
function confetti(n){ const box=$('#confetti'), cols=['#00E676','#FBBF24','#60A5FA','#F472B6','#A78BFA','#fff']; for(let i=0;i<n;i++){ const p=document.createElement('i'); p.style.background=pick(cols); p.style.left=rand(30,70)+'vw'; p.style.top='18vh'; box.appendChild(p);
  const dx=rand(-38,38), dy=rand(25,70), r=rand(-720,720); p.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${dx}vw,${dy}vh) rotate(${r}deg)`,opacity:0}],{duration:rand(1100,1900),easing:'cubic-bezier(.15,.6,.4,1)'}).onfinish=()=>p.remove(); } }
function flyCoin(){ const s=pick(G.ships); if(!s) return; const a=sxz(s.c,s.r,1.2); if(!a.ok) return; const tgt=$('#hCash').getBoundingClientRect(); const c=document.createElement('i'); c.className='coin'; $('#coins').appendChild(c);
  const mx=(a.x+tgt.left)/2+rand(-60,60), my=Math.min(a.y,tgt.top)-rand(40,120);
  c.animate([{transform:`translate(${a.x}px,${a.y}px) scale(.6)`},{transform:`translate(${mx}px,${my}px) scale(1.15)`,offset:.45},{transform:`translate(${tgt.left+tgt.width/2}px,${tgt.top+tgt.height/2}px) scale(.5)`}],{duration:rand(650,850),easing:'cubic-bezier(.45,0,.55,1)'}).onfinish=()=>{ c.remove(); const h=$('#hCashBox'); h.classList.remove('bump'); void h.offsetWidth; h.classList.add('bump'); sfx.coin(); }; }

/* ---------- V hooks: the sim talks to the world through these ---------- */
const WCOL={steady:'#BFDBFE', speedy:'#FDE68A', careful:'#DDD6FE', pro:'#A5F3FC', rookie:'#BBF7D0', cheerful:'#FBCFE8'};
Object.assign(V,{
  machine(m){ const {g,P}=machineMesh(m.type); m.g=g; m.P=P; m.rigs=[]; g.position.set(cellX(m.c),0,cellZ(m.r)); g.rotation.y=-m.dir*Math.PI/2; scene.add(g);
    m.label=machineLabel(m.type); m.label.position.set(cellX(m.c),3.0,cellZ(m.r)); scene.add(m.label);
    m.alert=alertSprite(); m.alert.position.set(cellX(m.c),3.55,cellZ(m.r)); scene.add(m.alert); g.userData.mach=m; if(G.mode==='play') m.drop=1; },
  unmachine(m){ m.rigs.forEach(dropRig); scene.remove(m.g); scene.remove(m.label); scene.remove(m.alert); puffAt(cellX(m.c),.6,cellZ(m.r),'#94A3B8',14,{spread:1.6,life:.7,size:.2,grow:true,g:-.5}); sfx.whoosh(); },
  crew(m){ const want=m.auto?[]:m.staff; while(m.rigs.length>want.length) dropRig(m.rigs.pop());
    want.forEach((w,i)=>{ if(m.rigs[i]&&m.rigs[i].trait===w.trait) return; if(m.rigs[i]) dropRig(m.rigs[i]); const r=makeRig(GLTF.crowd, MB.bodies[WCOL[w.trait]]||MB.bodies['#BFDBFE'], 1.3, 'g'); r.trait=w.trait;
      r.root.position.set(i?-.5:.5,0,1.3); r.root.rotation.y=Math.PI; r.root.add(blob(1.0)); m.g.add(r.root); m.rigs[i]=r; if(G.mode==='play'){ rigPlay(r,'TwistJump',true); puffAt(cellX(m.c),1.2,cellZ(m.r),'#FDE68A',8,{spread:1,life:.5,size:.07}); } });
    m.P.robot.visible=m.auto; },
  rotated(m){ m.g.rotation.y=-m.dir*Math.PI/2; m.drop=.5; },
  supply(s){ s.g=makeSupplyDock(); s.g.position.set(cellX(s.c),0,cellZ(s.r)); scene.add(s.g); },
  ship(s){ s.g=makeShipDock(); s.g.position.set(cellX(s.c),0,cellZ(s.r)); scene.add(s.g); },
  unship(s){ scene.remove(s.g); },
  split(s){ s.g=splitMesh(); s.g.position.set(cellX(s.c),0,cellZ(s.r)); s.g.rotation.y=-s.dir*Math.PI/2; scene.add(s.g); s.pop=1; sfx.place(); },
  unsplit(s){ scene.remove(s.g); },
  shell(){ buildShell(); },
  puff(c,r,color,n,o={}){ puffAt(cellX(c),o.y||.8,cellZ(r),color,n,o); },
  float(c,r,html,cls){ floatText(cellX(c),3.3,cellZ(r),html,cls); },
  sale(v){ UI.saleAcc+=v; UI.coinQ=Math.min(UI.coinQ+1,8); },
  sfx(n){ sfx[n]&&sfx[n](); },
  tip(k,h){ tip(k,h); }, toast(h,t){ toast(h,t); },
  milestone(m){ if(m&&G.mode==='play'){ banner('🏆 Milestone',m.t,'gold'); sfx.fanfare(); } },
  offer(o){ if(UI.tab!=='orders'||$('#side').classList.contains('min')) $('[data-tab=orders]').classList.add('new'); if(!G.flags.firstOffer){ G.flags.firstOffer=1; tip('orders'); } sfx.pop(); },
  orderDone(o,bonus){ toast(`✅ <b>${o.client}</b> order delivered! +${fmt(o.paid)}${bonus?` · 🔥 streak bonus <b>+${fmt(bonus)}</b>`:''}`,'good'); sfx.cash(); if(G.streak>=2) streakPop(); const s=G.ships[0]; if(s) puffAt(cellX(s.c),1.6,cellZ(s.r),'#FBBF24',16,{spread:1.6,life:.9,size:.09,up:1.4}); },
  dayEnd(r){ showDayEnd(r); },
  decision(ev){ showDecision(ev); },
  truckIn(d){ sendSupplyTruck(d); }, truckOut(){ sendShipTruck(); },
  rustyArrive(){ if(G.rusty) G.rusty.root.visible=true; rusty('Heh. ScrapCo bots are now $29. Good luck selling yours for $'+G.price+', garage kid.',8000); },
  rustyTaunt(){ rusty(pick(['ScrapCo bots: half the quality, all the sales. Heh.','Still charging $'+G.price+'? My bots are $'+G.rival.price+'. Do the math, kid.','You can\'t beat cheap. Nobody beats cheap!'])); },
  rustyLeave(){ if(G.rusty) G.rusty.root.visible=false; toast('ScrapCo\'s price war is over. Rusty ran out of cash.','good'); },
  upgraded(id){ banner('🔬 Upgrade installed',UPG[id].name,''); sfx.levelup(); G.machines.forEach(m=>puffAt(cellX(m.c),2.2,cellZ(m.r),'#67E8F9',6,{spread:.8,life:.7,size:.07,up:.6})); },
  grant(amt,why){ floatText(CAM.tx,2.5,CAM.tz,'+'+fmt(amt)+' '+why,'cash'); },
  expanded(){ CAM.goal={tx:0,tz:0,dist:40}; sfx.levelup(); },
  broke(m){ CAM.shake=1; },
  work(m){ m.hit=1; if(m.type==='stamper'){ sfx.stamp(); const fx=cellX(m.c), fz=cellZ(m.r); puffAt(fx,.55,fz,'#FDBA74',qs().fx>100?7:3,{spread:1.6,up:.9,life:.45,size:.045,g:9}); } if(m.type==='packer') sfx.pop(); }
});
function streakPop(){ const e=$('#hStreak'); e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }

/* ---------- trucks ---------- */
const TRUCKS=[];
function sendSupplyTruck(d){ const s=G.supplies[0]; if(!s||!W.bounds) return; const tr=makeTruck('#2563EB','STEEL CO.',d.cheap?'no questions asked':'sheet metal · fast'); const z=cellZ(s.r), stop=W.bounds.X0-3.2; tr.position.set(stop-60,0,z); scene.add(tr); TRUCKS.push({g:tr, x0:stop-60, stop, dir:1, until:d.eta, phase:'in', wait:0, t0:G.clock}); }
function sendShipTruck(){ const s=pick(G.ships); if(!s||!W.bounds) return; const tr=makeTruck('#059669','MINIBOT EXPRESS','delivering fun'); tr.rotation.y=Math.PI; const stop=W.bounds.X1+3.2, z=cellZ(s.r); tr.position.set(stop+50,0,z); scene.add(tr);
  TRUCKS.push({g:tr, x0:stop+50, stop, dir:-1, until:G.clock+9, phase:'in', wait:0, t0:G.clock}); }
function stepTrucks(dt){ for(let i=TRUCKS.length-1;i>=0;i--){ const T=TRUCKS[i], g=T.g;
  if(T.phase==='in'){ const u=clamp((G.clock-T.t0)/Math.max(.001,T.until-T.t0),0,1), e=1-Math.pow(1-u,2.4); g.position.x=lerp(T.x0,T.stop,e); g.children[0].rotation.z=u<1?-T.dir*.015*(1-u):0; if(u>=1){ T.phase='wait'; T.wait=2.2; g.children[0].rotation.z=T.dir*.02; } }
  else if(T.phase==='wait'){ T.wait-=dt; g.children[0].rotation.z*=.9; if(T.wait<=0){ T.phase='out'; T.v=0; } }
  else { T.v=Math.min(14,T.v+dt*6); g.position.x-=T.dir*T.v*dt; if(Math.abs(g.position.x-T.stop)>70){ scene.remove(g); TRUCKS.splice(i,1); } } } }

/* ---------- goals & tutorial ---------- */
const GOALS=[
  {id:'t_stamp', t:'Pick the <b>Stamper</b> below, then tap the glowing belt tile', done:()=>has('stamper'), tool:'stamper', cell:[2,2]},
  {id:'t_asm',   t:'Now an <b>Assembler</b> further down the belt', done:()=>has('assembler'), tool:'assembler', cell:[4,2]},
  {id:'t_paint', t:'Finish the line with a <b>Painter</b>', done:()=>has('painter'), tool:'painter', cell:[6,2]},
  {id:'t_open',  t:'Press <b>Open the factory</b> to start Day 1', done:()=>G.opened, btn:'#btnOpen'},
  {id:'t_ship',  t:'Watch your first MiniBot roll off the line', done:()=>G.tot.shipped>0},
  {id:'t_hire',  t:'Tap the <b>Assembler</b> and hire a 2nd worker to speed it up', done:()=>G.machines.some(m=>m.staff.length>=2||m.auto), mach:'assembler', reward:75},
  {id:'t_order', t:'Accept a customer order in the <b>Orders</b> tab', done:()=>G.orders.some(o=>['active','done','late'].includes(o.status)), reward:50, tab:'orders'},
  {id:'profit',  t:()=>`Finish a day in profit · break-even ≈ <b>${isFinite(econ().be)?econ().be:'?'} bots</b>`, prog:()=>{ const b=econ().be; return isFinite(b)?G.today.made/b:0; }, done:()=>!!G.ms.profit, reward:100},
  {id:'qa',      t:'Add a <b>QA Scanner</b> after the Painter to stop refunds', done:()=>has('qa'), reward:50, when:()=>G.day>=2},
  {id:'rnd',     t:'Invest in an upgrade in the <b>R&amp;D</b> tab', done:()=>Object.keys(G.upg).length>0, reward:75, when:()=>G.day>=2, tab:'rnd'},
  {id:'ship60',  t:()=>`Ship <b>60 MiniBots</b> to unlock the Big Floor`, prog:()=>G.tot.shipped/60, done:()=>G.tot.shipped>=60, reward:125},
  {id:'expand',  t:'Move into the <b>Big Floor</b> (gold button by the toolbar)', done:()=>G.expanded, btn:'#btnExpand'},
  {id:'line2',   t:'Build a second line on the bottom belt', done:()=>G.machines.filter(m=>m.r>=6).length>=3, reward:150},
  {id:'deluxe',  t:'Add a <b>Chip Installer</b> and ship a Deluxe bot', done:()=>G.tot.deluxe>0, reward:125, tool:'chip'},
  {id:'split',   t:'Use a <b>Splitter</b> to run two Assemblers side by side', done:()=>G.splits.length>0&&G.machines.filter(m=>m.type==='assembler').length>=3, reward:150, tool:'splitter'},
  {id:'ship300', t:'Ship <b>300 MiniBots</b>', prog:()=>G.tot.shipped/300, done:()=>G.tot.shipped>=300, reward:200},
  {id:'streak',  t:()=>`Keep your 🔥 on-time streak going (best: ${G.bestStreak})`, done:()=>false}
];
G.goals={};
function currentGoal(){ for(const g of GOALS){ if(G.goals[g.id]) continue; if(g.when&&!g.when()) continue; return g; } return null; }
function stepGoals(){ if(G.mode!=='play') return;
  for(const g of GOALS){ if(!G.goals[g.id]&&g.done()){ G.goals[g.id]=G.day; if(g.reward&&!G.over){ grant(g.reward,'grant'); } if(g.id.startsWith('t_')||g.reward){ sfx.goal(); goalFlash(g); } } }
  const g=currentGoal(), el=$('#goal'); if(!g){ el.hidden=true; return; } el.hidden=false;
  const txt=typeof g.t==='function'?g.t():g.t, pr=g.prog?clamp(g.prog(),0,1):null, step=GOALS.indexOf(g), tut=g.id.startsWith('t_');
  const sig=g.id+txt+(pr==null?'':Math.round(pr*40));
  if(sig!==UI.goalSig){ UI.goalSig=sig; el.innerHTML=`<span class="gi">${tut?'<em>Step '+(step+1)+'/7</em>':'🎯'}</span><span class="gt">${txt}${g.reward?` <i class="rw">+${fmt(g.reward)}</i>`:''}</span>${pr!=null?`<span class="gp"><i style="width:${pr*100}%"></i></span>`:''}`; }
  /* nudges: glowing tile, pulsing tool button */
  $$('.nudge').forEach(e=>e.classList.remove('nudge'));
  if(g.tool&&G.tool!==g.tool&&!G.flags.noNudge){ const b=$(`[data-tool=${g.tool}]`); if(b) b.classList.add('nudge'); }
  if(g.btn){ const b=$(g.btn); if(b&&!b.hidden) b.classList.add('nudge'); }
  if(g.tab&&UI.tab!==g.tab){ const b=$(`[data-tab=${g.tab}]`); if(b) b.classList.add('nudge'); }
  let cell=null; if(g.cell) cell=g.cell; if(g.mach){ const m=G.machines.find(x=>x.type===g.mach); if(m&&G.sel!==m) cell=[m.c,m.r]; }
  W.marker.visible=!!cell; if(cell) W.marker.position.set(cellX(cell[0]),0,cellZ(cell[1])); }
function goalFlash(g){ const el=$('#goal'); el.classList.remove('done'); void el.offsetWidth; el.classList.add('done'); if(g.reward) toast(`🎯 Goal complete! <b>+${fmt(g.reward)}</b> small-business grant`,'gold'); }
function makeMarker(){ const g=new THREE.Group(); const ring=new THREE.Mesh(new THREE.RingGeometry(.8,1.0,40), new THREE.MeshBasicMaterial({color:'#00E676', transparent:true, opacity:.9, depthWrite:false})); ring.rotation.x=-Math.PI/2; ring.position.y=.47; g.add(ring);
  const fill=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.9), new THREE.MeshBasicMaterial({color:'#00E676', transparent:true, opacity:.18, depthWrite:false})); fill.rotation.x=-Math.PI/2; fill.position.y=.46; g.add(fill);
  const ar=new THREE.Mesh(new THREE.ConeGeometry(.3,.6,4), new THREE.MeshBasicMaterial({color:'#00E676'})); ar.rotation.x=Math.PI; ar.position.y=2.4; g.add(ar); g.userData={ring,fill,ar}; g.visible=false; scene.add(g); W.marker=g; }

/* ---------- HUD ---------- */
function hud(){ $('#hDay').textContent=innerWidth<560?`Day ${G.day} · ${G.opened?dayClock(G.t).replace(/ (AM|PM)/,''):'Setup'}`:`Day ${G.day} of ${DAYS} · ${G.opened?dayClock(G.t):'Setup'}`; $('#hDayBar').style.width=(G.t/DAY_LEN*100)+'%';
  $('#hRep').innerHTML=`${Math.round(G.rep)}<small>/100</small>`; $('#hRep').className=G.rep>=70?'up':G.rep<40?'neg':'';
  $('#hMood').textContent=moodIc(G.morale)+' '+Math.round(G.morale); $('#hMood').className=G.morale<40?'neg':G.morale>=75?'up':'';
  const st=$('#hStreak'); st.hidden=G.streak<1; st.innerHTML=`🔥<b>×${G.streak}</b>`; st.title=`On-time streak: +${Math.round(Math.min(G.streak,ECON.streakMax)*ECON.streakStep*100)}% bonus on every order`;
  $$('#speed button').forEach(b=>{ const s=+b.dataset.s; b.classList.toggle('on', s===0?G.paused:(!G.paused&&G.speed===s)); });
  const ex=$('#btnExpand'); ex.hidden=G.expanded||G.tot.shipped<ECON.expandNeed*.5; ex.classList.toggle('ready',canExpand()); }
function hudCash(dt){ const d=G.cash-UI.cashShown; UI.cashShown=Math.abs(d)<1?G.cash:UI.cashShown+d*Math.min(1,dt*6); const c=$('#hCash'); c.textContent=fmt(Math.round(UI.cashShown)); c.classList.toggle('neg',G.cash<0); }

/* ---------- side panel ---------- */
function sideSig(){ if(UI.tab==='orders') return G.orders.map(o=>o.id+o.status).join()+'|'+G.day+'|'+G.streak; if(UI.tab==='supply') return G.deliveries.length+'|'+G.steelMult+'|'+G.autoBuy+'|'+G.expanded+'|'+!!G.upg.supplier;
  if(UI.tab==='rnd') return Object.keys(G.upg).join()+'|'+Object.keys(UPG).map(k=>!canUpg(k)).join()+'|'+Math.round(G.rep>=70);
  return G.expanded+'|'+G.rush+'|'+G.machines.length+'|'+G.machines.map(m=>m.crew+(m.auto?'a':'')).join(''); }
function upgValue(id){ const base=econ(), was=G.upg[id]; let extra=0;
  G.upg[id]=1; const after=econ(); delete G.upg[id]; if(was) G.upg[id]=was;
  const sell=E=>Math.min(E.cap,E.demand+20); let v=(sell(after)-sell(base))*base.margin;
  if(id==='lean') extra=Math.max(G.today.made,base.cap*.5)*.03*.5*(G.price+5);
  if(id==='supplier') extra=Math.min(base.cap,base.demand+20)*6*.15;
  if(id==='sensors') extra=40; if(id==='breakroom') extra+=Math.min(base.cap,base.demand)*base.margin*.04;
  if(id==='brand') extra=Math.min(base.cap,base.demand)*3;
  return Math.max(0,v)+extra; }
function renderSide(){ UI.sig=sideSig(); const b=$('#sideBody'); $$('#side .tabs [data-tab]').forEach(t=>t.classList.toggle('on',t.dataset.tab===UI.tab));
  if(UI.tab==='orders'){ const offers=G.orders.filter(o=>o.status==='offer'), act=G.orders.filter(o=>o.status==='active'), past=G.orders.filter(o=>['done','late'].includes(o.status)).slice(-3).reverse();
    const tags=o=>`${o.deluxe?'<span class="tag gold">Deluxe</span>':''}${o.boxed?'<span class="tag blue">Boxed</span>':''}${o.sameDay?'<span class="tag red">Today!</span>':o.rush?'<span class="tag red">Big</span>':''}`;
    b.innerHTML=`<div class="streak ${G.streak?'on':''}">🔥 On-time streak <b>×${G.streak}</b><span>${G.streak?'+'+Math.round(Math.min(G.streak,ECON.streakMax)*ECON.streakStep*100)+'% bonus on orders':'Deliver orders on time to build a bonus'}</span></div>
    ${offers.length?'<h4>New offers</h4>':''}${offers.map(o=>`<div class="ord offer ${o.rush?'rush':''}"><div class="otop"><b>${o.client}</b>${tags(o)}</div>
      <div class="oline"><b>${o.qty}</b> ${o.deluxe?'Deluxe ':''}${o.boxed?'boxed ':''}MiniBots × <b>${fmt(o.price)}</b> = <b class="g">${fmt(o.qty*o.price)}</b></div><div class="odue">Due ${o.due===G.day?'<b class="r">by tonight</b>':`end of <b>Day ${o.due}</b>`}${o.due===G.day+1?' (tomorrow)':''} · offer ends tonight${o.boxed&&!has('packer')?' · <b class="r">needs a Packer</b>':''}${o.deluxe&&!has('chip')?' · <b class="r">needs a Chip Installer</b>':''}</div>
      <div class="obtn"><button class="btn pri sm" data-act="accept" data-id="${o.id}">Accept</button><button class="btn ghost sm" data-act="pass" data-id="${o.id}">Pass</button></div></div>`).join('')}
      <h4>Active orders</h4>${act.length?act.map(o=>`<div class="ord"><div class="otop"><b>${o.client}</b>${tags(o)}<span class="due ${o.due===G.day?'red':''}">${o.due===G.day?'Tonight':'Day '+o.due}</span></div>
      <div class="pbar"><i data-v="og${o.id}"></i></div><div class="oline small"><span data-v="ot${o.id}"></span> · ${fmt(o.price)} each</div></div>`).join(''):'<p class="muted">No active orders. Bots you make sell on the open market at your price.</p>'}
      ${past.length?'<h4>Recent</h4>'+past.map(o=>`<div class="past ${o.status}">${o.status==='done'?'✓':'✗'} ${o.client}: ${o.got}/${o.qty} ${o.status==='done'?'delivered':'late, reputation hit'}</div>`).join(''):''}
      <div class="foot">Ready to sell: <b data-v="fg">0</b> bots · Orders get first pick, the rest go to the open market.</div>`; }
  else if(UI.tab==='supply'){
    b.innerHTML=`<div class="kpi"><em>Steel sheets in stock</em><b data-v="stock">0</b><div class="pbar"><i data-v="stockBar"></i></div><small data-v="stockNote"></small></div>
      <h4>Order steel ${G.steelMult>1?'<span class="tag red">Price spike +60%</span>':''}${G.upg.supplier?'<span class="tag gold">Contract −15%</span>':''}</h4><div class="buys">${BULK.map(x=>`<button class="btn buy" data-act="buy" data-n="${x.n}"><b>${x.n} sheets</b><span>${fmt2(steelPrice(x.each))} each</span><em>${fmt(Math.round(x.n*steelPrice(x.each)))}</em></button>`).join('')}</div>
      <small class="muted">Bigger orders = cheaper per sheet (bulk discount). Trucks take ${ECON.deliveryTime}s to arrive.</small>
      <label class="tog"><input type="checkbox" data-act="auto" ${G.autoBuy?'checked':''}> Auto-reorder when stock gets low</label>
      <div data-v="deliv"></div>
      <h4>Holding costs</h4><div class="rows"><div><span>Steel in storage</span><b>$${ECON.holdSheet.toFixed(2)}/sheet/day</b></div><div><span>Finished bots waiting</span><b>$${ECON.holdBot.toFixed(2)}/bot/day</b></div><div><span>Tonight's storage bill</span><b data-v="hold"></b></div></div>
      <p class="muted">Running out stops the line. Too much stock ties up cash and costs storage. Aim for just enough.</p>`; }
  else if(UI.tab==='rnd'){ b.innerHTML=`<p class="muted small">Upgrades cost money once and pay off every day after. The <b>payback</b> is how many days of extra profit it takes to earn the cost back.</p>`+Object.keys(UPG).map(k=>{ const u=UPG[k], own=G.upg[k], why=canUpg(k), val=own?0:upgValue(k), pb=val>5?Math.ceil(u.cost/val):null;
      return `<div class="upg ${own?'own':''}"><span class="uic">${u.ic}</span><div><b>${u.name}</b><small>${u.d}</small>${own?`<em class="g">✓ Installed on Day ${own}</em>`:`<em>${pb?`Pays back in about <b>${pb} day${pb>1?'s':''}</b>`:'Won\'t help much yet with your current line'}</em>`}</div>${own?'':`<button class="btn ${why?'ghost':'gold'} sm" data-act="upg" data-id="${k}" ${why&&why!=='Owned'&&!why.startsWith('Need $')?'disabled':''}>${why&&!why.startsWith('Need $')?why:fmt(u.cost)}</button>`}</div>`; }).join(''); }
  else { b.innerHTML=`<div class="kpi big"><em>Cost to make one bot <small>(at today's pace)</small></em><b data-v="unit"></b><small data-v="unitSplit"></small></div>
      <canvas id="ucChart" width="600" height="300"></canvas><div class="legend"><span><i style="background:#60A5FA"></i>Cost per bot</span><span><i style="background:#FBBF24"></i>Your price</span><span><i style="background:#fff;border-radius:50%"></i>You now</span></div>
      <div class="two"><div class="kpi"><em>Break-even</em><b data-v="be"></b><small>bots/day to cover all costs</small></div><div class="kpi"><em>Line capacity</em><b data-v="cap"></b><small data-v="capBy"></small></div></div>
      <div class="kpi"><em>Your price per MiniBot</em><div class="prow"><input type="range" id="priceR" min="20" max="70" step="1" value="${G.price}"><b data-v="price"></b></div><small data-v="demand"></small></div>
      <label class="tog"><input type="checkbox" data-act="rush" ${G.rush?'checked':''}> <span><b>Rush mode</b>: line runs 35% faster, but 2.5× more defects and a tired crew</span></label>
      <h4>Fixed costs per day <small class="muted">(paid even if you make 0)</small></h4><div class="rows" data-v="fixed"></div>
      <h4>Variable cost per bot <small class="muted">(only when you make one)</small></h4><div class="rows" data-v="var"></div>`;
    $('#priceR').oninput=e=>{ G.price=+e.target.value; updateSide(true); if(sfx) sfx.hover(); }; }
  updateSide(true); }
function updateSide(force){ if(!force&&sideSig()!==UI.sig) return renderSide(); const b=$('#sideBody'), v=k=>b.querySelector(`[data-v="${k}"]`);
  if(UI.tab==='orders'){ G.orders.filter(o=>o.status==='active').forEach(o=>{ const g=v('og'+o.id), t=v('ot'+o.id); if(g) g.style.width=(o.got/o.qty*100)+'%'; if(t) t.textContent=`${o.got} / ${o.qty} shipped`; }); const f=v('fg'); if(f) f.textContent=G.fg.length; }
  else if(UI.tab==='supply'){ const E=econ(); v('stock').textContent=G.stock+' / '+ECON.maxStock; v('stockBar').style.width=(G.stock/ECON.maxStock*100)+'%'; v('stockBar').className=G.stock<15?'low':'';
    const per=E.pace>0?E.pace:E.cap; v('stockNote').textContent=per>0?`Your line uses about ${Math.round(per)} sheets a day. That's ${(G.stock/per).toFixed(1)} days of steel.${G.cheap>0?' ('+G.cheap+' are the cheap ones.)':''}`:'Build a line to start using steel.';
    v('deliv').innerHTML=G.deliveries.map(d=>`<div class="deliv">🚚 ${d.n} sheets arriving in ${Math.max(0,Math.ceil(d.eta-G.clock))}s</div>`).join(''); v('hold').textContent=fmt2(E.F.storage); }
  else if(UI.tab==='rnd'){ }
  else { const E=econ(); v('unit').textContent=isFinite(E.unit)?fmt2(E.unit):'—'; v('unit').className=isFinite(E.unit)&&E.unit<E.peff?'g':'r';
    v('unitSplit').innerHTML=E.pace>0?`${fmt(E.F.total)} fixed ÷ ${Math.round(E.pace)} bots = ${fmt2(E.F.total/E.pace)} + ${fmt2(E.v)} materials`:'Open the factory to see your cost per bot.';
    v('be').textContent=isFinite(E.be)?E.be+'/day':'never'; v('cap').textContent=Math.round(E.cap)+'/day'; v('capBy').textContent=E.cap>0?'limited by '+E.capBy:'line incomplete';
    v('price').textContent=fmt(G.price); v('demand').innerHTML=`Market buys about <b>${Math.round(E.demand)}/day</b> at this price${E.cap>0?(E.demand<E.cap*.8?' · <span class="r">less than you can make</span>':E.demand>E.cap*1.3?' · <span class="g">more than you can make: room to raise prices</span>':''):''}${G.rival?` · <span class="r">ScrapCo sells at $${G.rival.price}</span>`:''}`;
    v('fixed').innerHTML=[['Rent',E.F.rent],['Wages ('+G.machines.reduce((a,m)=>a+m.staff.length,0)+' workers)',E.F.wages],['Loan interest',E.F.loan],['Machine upkeep & wear',E.F.upkeep],['Storage',E.F.storage]].map(([k,x])=>`<div><span>${k}</span><b>${fmt(x)}</b></div>`).join('')+`<div class="tot"><span>Total</span><b>${fmt(E.F.total)}</b></div>`;
    v('var').innerHTML=[['Steel sheet',E.sheet],has('assembler')&&['Motor kit',4],has('painter')&&['Paint',2],has('packer')&&['Box',1.5],has('chip')&&['Smart chip',9]].filter(Boolean).map(([k,x])=>`<div><span>${k}</span><b>${fmt2(x)}</b></div>`).join('')+`<div class="tot"><span>Total</span><b>${fmt2(E.v)}</b></div>`;
    drawChart(E); } }
function drawChart(E){ const c=$('#ucChart'); if(!c) return; const g=c.getContext('2d'), w=c.width, h=c.height, L=46, R=14, T=14, B=34; g.clearRect(0,0,w,h);
  const qMax=Math.max(40,Math.ceil(Math.max(E.cap,E.be===Infinity?0:E.be,E.pace)*1.35/10)*10), yMax=Math.max(E.peff*1.9,E.v+20);
  const X=q=>L+(q/qMax)*(w-L-R), Y=y=>T+(1-Math.min(y,yMax)/yMax)*(h-T-B);
  g.strokeStyle='rgba(148,163,184,.25)'; g.lineWidth=1; g.font='600 18px Inter, system-ui, sans-serif'; g.fillStyle='#94A3B8';
  for(let i=0;i<=4;i++){ const y=yMax*i/4; g.beginPath(); g.moveTo(L,Y(y)); g.lineTo(w-R,Y(y)); g.stroke(); g.textAlign='right'; g.fillText('$'+Math.round(y),L-6,Y(y)+6); }
  g.textAlign='center'; for(let i=0;i<=4;i++){ const q=qMax*i/4; g.fillText(Math.round(q),X(q),h-10); } g.fillText('bots / day',w/2+40,h-10);
  g.fillStyle='rgba(0,230,118,.12)'; g.beginPath(); let started=false; for(let q=1;q<=qMax;q+=.5){ const u=E.F.total/q+E.v; if(u<E.peff){ if(!started){ g.moveTo(X(q),Y(E.peff)); started=true; } g.lineTo(X(q),Y(u)); } } if(started){ g.lineTo(X(qMax),Y(E.peff)); g.closePath(); g.fill(); }
  g.strokeStyle='#FBBF24'; g.lineWidth=3; g.setLineDash([10,6]); g.beginPath(); g.moveTo(L,Y(E.peff)); g.lineTo(w-R,Y(E.peff)); g.stroke(); g.setLineDash([]);
  g.strokeStyle='#60A5FA'; g.lineWidth=4; g.beginPath(); for(let q=1;q<=qMax;q+=.5){ const u=E.F.total/q+E.v; q===1?g.moveTo(X(q),Y(u)):g.lineTo(X(q),Y(u)); } g.stroke();
  if(isFinite(E.be)&&E.be<=qMax){ g.strokeStyle='rgba(255,255,255,.5)'; g.lineWidth=2; g.setLineDash([4,4]); g.beginPath(); g.moveTo(X(E.be),Y(E.peff)); g.lineTo(X(E.be),h-B); g.stroke(); g.setLineDash([]); g.fillStyle='#E2E8F0'; g.textAlign='left'; g.fillText('break-even',X(E.be)+6,T+18); }
  if(E.pace>0){ const u=E.F.total/E.pace+E.v; g.fillStyle='#fff'; g.beginPath(); g.arc(X(E.pace),Y(u),9,0,7); g.fill(); g.fillStyle=u<E.peff?'#00E676':'#F87171'; g.beginPath(); g.arc(X(E.pace),Y(u),5,0,7); g.fill(); }
  g.fillStyle='#FDE68A'; g.textAlign='right'; g.fillText('price '+fmt(E.peff),w-R-4,Y(E.peff)-8); }
$('#sideBody').addEventListener('click',e=>{ const a=e.target.closest('[data-act]'); if(!a) return; audio(); const act=a.dataset.act, o=G.orders.find(x=>x.id==a.dataset.id);
  if(act==='accept'&&o){ acceptOrder(o); renderSide(); } if(act==='pass'&&o){ passOrder(o); renderSide(); }
  if(act==='buy'){ if(buySteel(+a.dataset.n)) updateSide(true); }
  if(act==='upg'){ const why=canUpg(a.dataset.id); if(why){ toast(why,'bad'); sfx.bad(); } else { buyUpg(a.dataset.id); renderSide(); } }
  if(act==='auto'){ G.autoBuy=a.checked; } if(act==='rush'){ G.rush=a.checked; if(G.rush) tip('rushMode'); } });
$$('#side .tabs [data-tab]').forEach(t=>t.onclick=()=>{ audio(); sfx.tick(); const same=UI.tab===t.dataset.tab; UI.tab=t.dataset.tab; t.classList.remove('new'); if($('#side').classList.contains('min')) $('#side').classList.remove('min'); else if(same&&innerWidth<760) $('#side').classList.add('min'); renderSide(); });
$('#sideMin').onclick=()=>$('#side').classList.toggle('min');

/* ---------- machine inspector ---------- */
function inspSig(m){ return m?[m.c,m.r,m.crew,m.auto,!!m.broken,G.cash>=ECON.autoCost,UI.hirePick,m.staff.map(w=>w.trait).join()].join():''; }
function renderInspect(){ const m=G.sel, el=$('#inspect'); UI.insSig=inspSig(m); if(!m){ el.hidden=true; selRing.visible=false; UI.hirePick=false; return; } el.hidden=false; const d=MACH[m.type];
  selRing.visible=true; selRing.position.set(cellX(m.c),.06,cellZ(m.r));
  const crew=m.auto?'<div class="crew">🦾 Robot arm · no wages</div>':m.staff.length?m.staff.map(w=>{ const T=TRAITS[w.trait]; return `<div class="wkr"><span class="wic" style="background:${WCOL[w.trait]}">${T.ic}</span><div><b>${w.name}</b> · ${T.t}<small>${T.d}</small></div><em>${fmt(T.wage)}/day</em></div>`; }).join(''):'<div class="crew r">Nobody working here</div>';
  const cands=UI.hirePick?`<div class="cands"><h5>Pick someone to hire</h5>${candidates(m).map((w,i)=>{ const T=TRAITS[w.trait]; return `<button class="cand" data-i="pick" data-k="${i}"><span class="wic" style="background:${WCOL[w.trait]}">${T.ic}</span><div><b>${w.name}</b> · ${T.t}<small>${T.d}</small></div><em>${fmt(T.wage)}/day</em></button>`; }).join('')}</div>`:'';
  el.innerHTML=`<button class="x" data-i="close">×</button><div class="ihead"><span class="sw" style="background:${d.color}">${d.icon}</span><div><b>${d.name}</b><small>${d.desc}</small></div></div>
    <div class="status" data-iv="state"></div>
    <div class="istats"><div><em>Time per bot</em><b data-iv="cyc"></b></div><div><em>Can make</em><b data-iv="cap"></b></div><div><em>Busy</em><b data-iv="util"></b></div></div>
    <div class="ubar"><i data-iv="ubar"></i></div>
    ${crew}${cands}
    <div class="iacts">${m.auto?'':`${m.staff.length<2&&!UI.hirePick?`<button class="btn pri sm" data-i="hire">+ Hire worker <small>${m.staff.length===1?'2 workers = 1.7× speed':'Machines need a worker'}</small></button>`:''}${m.staff.length>0&&!UI.hirePick?`<button class="btn ghost sm" data-i="fire">− Let one go <small>saves wages · crew mood −5</small></button>`:''}
      ${UI.hirePick?'<button class="btn ghost sm" data-i="cancel">Cancel</button>':`<button class="btn gold sm" data-i="auto" ${G.cash<ECON.autoCost?'disabled':''}>🦾 Automate ${fmt(ECON.autoCost)} <small>2.1× speed, no wages, +${fmt(ECON.autoUpkeep)}/day upkeep, fewer defects</small></button>`}`}
      <div class="irow"><button class="btn ghost sm" data-i="rot">⟳ Rotate</button><button class="btn danger sm" data-i="sell">Sell +${fmt(Math.round(d.cost*.5)+(m.auto?Math.round(ECON.autoCost*.3):0))}</button></div></div>
    <div class="lesson" data-iv="lesson"></div>`;
  updateInspect(); }
function updateInspect(){ const m=G.sel; if(!m) return; if(!G.machines.includes(m)){ G.sel=null; return renderInspect(); } if(inspSig(m)!==UI.insSig) return renderInspect(); const el=$('#inspect'), v=k=>el.querySelector(`[data-iv="${k}"]`);
  const st=v('state'); st.textContent=stateTxt[m.state]||m.state; st.className='status st-'+m.state;
  v('cyc').textContent=staffed(m)?cycleOf(m).toFixed(1)+'s':'—'; v('cap').textContent=Math.round(capOf(m))+'/day'; v('util').textContent=Math.round(m.util*100)+'%'; v('ubar').style.width=(m.util*100)+'%';
  const bn=bottleneck(), E=econ(); let L='';
  if(m.broken) L='While this is broken, everything before it piles up and everything after it starves.';
  else if(bn===m) L=m.staff.length>=2?'<b>Still the bottleneck</b> with two workers. Buy <b>Power Tools</b> in R&amp;D, automate it, or put a <b>Splitter</b> in front and run two of these side by side.':'<b>Bottleneck!</b> This station is the slowest, so the whole line can only go this fast. Speeding up any other machine won\'t help.';
  else if(m.state==='starved'&&G.opened) L='This machine is waiting on the one before it. Making it faster would just mean more waiting.';
  else if(m.state==='blocked') L='Its output is backed up. The problem is <b>after</b> this machine.';
  else if(m.auto) L=`The robot cost ${fmt(ECON.autoCost)} up front but saves wages every day. A big one-time investment to cut a <b>fixed cost</b>.`;
  else L=`Line capacity is <b>${Math.round(E.cap)}/day</b>, limited by the ${E.capBy}. Crew mood ${moodIc(G.morale)} ${Math.round(G.morale)} changes worker speed by ${Math.round((moraleMult()-1)*100)}%.`;
  v('lesson').innerHTML=L; }
$('#inspect').addEventListener('click',e=>{ const b=e.target.closest('[data-i]'); if(!b||!G.sel) return; audio(); const m=G.sel, a=b.dataset.i;
  if(a==='close'){ G.sel=null; } if(a==='hire'){ UI.hirePick=true; sfx.tick(); } if(a==='cancel') UI.hirePick=false;
  if(a==='pick'){ const w=candidates(m)[+b.dataset.k]; hire(m,w); UI.hirePick=false; }
  if(a==='fire') fire(m); if(a==='auto'&&automate(m)) toast(`${MACH[m.type].name} automated! No more wages there.`,'good');
  if(a==='rot') rotateMachine(m); if(a==='sell'){ removeAt(m.c,m.r); G.sel=null; }
  renderInspect(); });

/* ---------- toolbar ---------- */
const TOOLS=[{id:'select',ic:'👆',t:'Select',k:'1'},{id:'belt',ic:'➡',t:'Belt',cost:ECON.belt,k:'B'},...Object.keys(MACH).map(k=>({id:k,ic:MACH[k].icon,t:MACH[k].short,cost:MACH[k].cost,k:MACH[k].key,color:MACH[k].color})),{id:'splitter',ic:'⑂',t:'Splitter',cost:ECON.splitter,k:'8',color:'#06B6D4'},{id:'bulldoze',ic:'🧹',t:'Remove',k:'X'}];
function renderTools(){ $('#toolList').innerHTML=TOOLS.map(t=>{ const locked=MACH[t.id]&&MACH[t.id].big&&!G.expanded; return `<button class="tool ${G.tool===t.id?'on':''} ${locked?'locked':''}" data-tool="${t.id}" title="${t.t} (${t.k})" ${t.color?`style="--c:${t.color}"`:''}><span class="ic">${locked?'🔒':t.ic}</span><b>${t.t}</b>${t.cost?`<small>${fmt(t.cost)}</small>`:'<small>&nbsp;</small>'}</button>`; }).join(''); }
function setTool(id){ if(MACH[id]&&MACH[id].big&&!G.expanded){ toast('The Chip Installer unlocks in the big factory.'); return; } G.tool=id; if(id!=='select'){ G.sel=null; renderInspect(); } renderTools(); ghost.visible=false;
  const h={select:'Tap a machine to manage it · drag to move the camera', belt:'Tap or drag to lay belts · drag into a machine to feed it · R rotates', bulldoze:'Tap a belt or machine to remove it', splitter:'Drop on a belt: it deals items out front, left and right in turn. Belts merge on their own.'}[id]||'Tap an empty tile or a belt to place it · R rotates';
  $('#hint').textContent=h; }
$('#toolList').addEventListener('click',e=>{ const b=e.target.closest('[data-tool]'); if(b){ audio(); setTool(b.dataset.tool); sfx.tick(); } });
$('#btnRot').onclick=()=>{ if(G.sel){ rotateMachine(G.sel); } else G.rot=(G.rot+1)%4; sfx.tick(); };
$('#btnExpand').onclick=()=>{ audio(); const ok=G.tot.shipped>=ECON.expandNeed;
  modal(`<div class="eyebrow">Grow the business</div><h2>Move into the big factory?</h2><p>Triple the floor space, a second steel dock and shipping bay with a ready-made second belt, and the <b>Chip Installer</b> for Deluxe MiniBots (+$25 each). Bigger stores will want your bots too.</p>
    <div class="rows big"><div><span>One-time cost</span><b>${fmt(ECON.expandCost)}</b></div><div><span>Rent</span><b>${fmt(ECON.rentGarage)} → ${fmt(ECON.rentBig)}/day</b></div><div><span>Bots shipped</span><b>${G.tot.shipped} / ${ECON.expandNeed}</b></div></div>
    <div class="lesson">Bigger factory = higher fixed costs. It only pays off if you make (and sell) more bots. That's economies of scale.</div>
    <div class="mact"><button class="btn ghost" onclick="closeModal()">Not yet</button><button class="btn gold" id="doExpand" ${canExpand()?'':'disabled'}>${ok?(G.cash>=ECON.expandCost?'Expand for '+fmt(ECON.expandCost):'Need '+fmt(ECON.expandCost)+' cash'):'Ship '+(ECON.expandNeed-G.tot.shipped)+' more bots'}</button></div>`);
  const d=$('#doExpand'); if(d) d.onclick=()=>{ closeModal(); fadeDo(()=>{ if(expand()){ renderTools(); banner('🏭 Welcome to the','Big Floor!','gold'); advise('There\'s a <b>second line</b> ready along the bottom belt: add machines to it. Try the <b>Chip Installer</b> for Deluxe bots, and <b>Splitters</b> to run machines side by side.'); } }); }; };
function fadeDo(fn){ $('#fade').style.opacity=1; setTimeout(()=>{ fn(); setTimeout(()=>$('#fade').style.opacity=0,120); },460); }

/* ---------- decisions ---------- */
function showDecision(ev){ sfx.pop(); const c=modal(`<div class="dec"><div class="dtop"><span class="dic">${ev.ic}</span><div><div class="eyebrow">${ev.who}</div><h2>${ev.title}</h2></div></div><p>${ev.text}</p>
  <div class="choices"><button class="choice a" data-y="1"><b>${ev.a.t}</b><small>${ev.a.d}</small></button><button class="choice b" data-y="0"><b>${ev.b.t}</b><small>${ev.b.d}</small></button></div>
  <div class="lesson">💡 ${ev.lesson}</div></div>`,'');
  if(ev.id==='refi'&&G.cash<1500) c.querySelector('[data-y="1"]').disabled=true;
  c.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{ audio(); closeModal(); resolveDecision(b.dataset.y==='1'); sfx.good(); renderSide(); }); }

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
function showDayEnd(r){ const last=r.day>=DAYS, rev=r.rev-r.returns, stars=r.net<=0?0:r.net<300?1:r.net<900?2:3;
  modal(`<div class="eyebrow">End of Day ${r.day} · Daily P&amp;L</div><div class="dhead"><h2 class="${r.net>=0?'g':'r'}">${r.net>=0?'Profit':'Loss'} <span id="netCount">${r.net<0?'−':''}$0</span></h2><div class="stars">${[0,1,2].map(i=>`<i class="${i<stars?'on':''}" style="animation-delay:${.35+i*.18}s">★</i>`).join('')}</div></div>
    <div class="pl">${plRow('Sales to customers (orders)',r.orderRev)}${plRow('Sales on the open market',r.mktRev)}${r.bonus?plRow('Streak bonuses & grants',r.bonus):''}${r.returns?plRow('Refunds',-r.returns,'bad'):''}${plRow('Revenue',rev+r.bonus,'sub')}
      <div class="hd">Variable costs <small>(grow with every bot)</small></div>${plRow('Steel used',-r.mat)}${r.vc?plRow('Motors, paint, boxes, chips',-r.vc):''}
      <div class="hd">Fixed costs <small>(same if you make 0 or 100)</small></div>${plRow('Rent',-r.rent)}${plRow('Wages',-r.wages)}${plRow('Loan interest',-r.loan)}${plRow('Machine upkeep & wear',-r.upkeep)}${r.storage?plRow('Storage',-r.storage):''}${r.repairs?plRow('Repairs',-r.repairs):''}${r.other?plRow('Other (events)',-r.other):''}
      ${plRow('Net profit',r.net,'tot '+(r.net>=0?'good':'bad'))}</div>
    <div class="kpis"><div><em>Bots shipped</em><b>${r.made}</b></div><div><em>Cost per bot</em><b>${r.unit?fmt2(r.unit):'—'}</b></div><div><em>Break-even</em><b>${isFinite(r.be)?r.be+'/day':'—'}</b></div><div><em>Crew mood</em><b>${moodIc(r.morale)} ${Math.round(r.morale)} <small class="${r.dm>=0?'g':'r'}">${r.dm>=0?'+':''}${r.dm}</small></b></div><div><em>Cash</em><b class="${r.cash<0?'r':''}">${fmt(r.cash)}</b></div></div>
    <div class="lesson">💡 ${dayLesson(r)}</div>
    ${r.emergency?'<div class="note bad">You ran out of cash, so the bank gave you an emergency loan of '+fmt(ECON.emergency)+' (+'+fmt(ECON.emergencyInt)+'/day interest). Ouch.</div>':''}
    ${G.news.map(n=>`<div class="note">${n}</div>`).join('')}
    <small class="muted">Not in profit: ${fmt(r.buy)} spent on new steel (it's inventory until you use it)${r.capex?' and '+fmt(r.capex)+' on equipment and upgrades (investments)':''}${r.debt?' and '+fmt(r.debt)+' paid off your loan':''}.</small>
    <div class="mact"><button class="btn pri big" id="btnNext">${last?'See your report card':'Start Day '+(r.day+1)+' ▶'}</button></div>`,'wide');
  const target=Math.abs(Math.round(r.net)), t0=performance.now(), nc=$('#netCount'); (function up(){ const k=Math.min(1,(performance.now()-t0)/700), e=1-Math.pow(1-k,3); if(nc) nc.textContent=(r.net<0?'−':'')+fmt(Math.round(target*e)); if(k<1) requestAnimationFrame(up); })();
  if(r.net>=0){ sfx.cash(); setTimeout(()=>sfx.fanfare(),300); if(stars>=2) confetti(24); } else sfx.bad();
  $('#btnNext').onclick=()=>{ closeModal(); if(last) report(); else { nextDay(); renderSide(); UI.tipAt=UI.t+4; banner('☀️ Day '+G.day+' of '+DAYS, DAY_HEAD[G.day]||pick(['Beat yesterday\'s numbers!','Keep the line humming.','Customers are waiting.']), G.day===DAYS?'gold':''); } }; }
const DAY_HEAD={3:'Big buyers are shopping today',4:'Steel prices are spiking!',5:'Watch out for Rusty…',8:'MegaMart is in town',10:'Final day: finish strong!'};
function report(){ G.over=true; G.paused=true; const g=grade(), H=G.hist, first=H.find(h=>h.unit), maxAbs=Math.max(100,...H.map(h=>Math.abs(h.net)));
  const learned=[];
  if(first&&G.tot.bestUnit&&G.tot.bestUnit<first.unit) learned.push(`Your cost per bot went from <b>${fmt2(first.unit)}</b> on Day ${first.day} to as low as <b>${fmt2(G.tot.bestUnit)}</b>. More volume spread the same fixed costs thinner: <b>economies of scale</b>.`);
  learned.push(`Fixed costs (rent, wages, upkeep, interest) came to about <b>${fmt(Math.round(H.reduce((a,h)=>a+h.fixed,0)/H.length))}/day</b>. You owed that whether the line ran or not.`);
  if(G.tot.scrap||G.tot.returns) learned.push(`QA caught <b>${G.tot.scrap}</b> defects; <b>${G.tot.returns}</b> broken bots reached customers. Quality costs less in the factory than after the sale.`);
  if(Object.keys(G.upg).length) learned.push(`You invested in <b>${Object.keys(G.upg).length}</b> R&amp;D upgrade${Object.keys(G.upg).length>1?'s':''}. Spending money once to earn more every day is what investing means.`);
  if(G.expanded) learned.push('You scaled up into the big factory. Higher rent, but more capacity and Deluxe margins.');
  learned.push(`You set a final price of <b>${fmt(G.price)}</b>. Lower prices sell more bots but each one earns less. Finding the sweet spot is called <b>pricing</b>.`);
  const P=g.parts, part=(k,v,max)=>`<div class="gpart"><span>${k}</span><i><b style="width:${Math.max(0,v)/max*100}%"></b></i><em>${Math.round(Math.max(0,v))}/${max}</em></div>`;
  modal(`<div class="rep"><div class="rtop"><img src="${MB_ASSETS.logo}" alt=""><div><div class="eyebrow">BotFactory · Report card</div><h2>${g.L.startsWith('A')?'Factory legend!':g.L==='B'?'Solid factory boss':g.L==='C'?'Making it work':'Tough run, but you learned a lot'}</h2></div><div class="grade ${g.L[0]==='A'||g.L==='B'?'':g.L==='C'?'c':'f'}">${g.L}</div></div>
    <div class="kpis"><div><em>Total profit</em><b class="${g.profit>=0?'g':'r'}">${fmt(Math.round(g.profit))}</b></div><div><em>Bots shipped</em><b>${G.tot.shipped}</b></div><div><em>Best cost/bot</em><b>${G.tot.bestUnit?fmt2(G.tot.bestUnit):'—'}</b></div><div><em>Orders on time</em><b>${G.tot.ordersDone}/${G.tot.ordersDone+G.tot.ordersLate}</b></div><div><em>Best streak</em><b>🔥${G.bestStreak}</b></div><div><em>Reputation</em><b>${Math.round(G.rep)}</b></div></div>
    <div class="gparts">${part('Profit',P.p,40)}${part('Reputation',P.rp,20)}${part('On-time orders',P.op,15)}${part('Quality',P.q,10)}${part('Milestones',P.ms,15)}</div>
    <h4>Profit by day</h4><div class="bars">${H.map(h=>`<div class="bar"><i class="${h.net>=0?'p':'n'}" style="height:${Math.abs(h.net)/maxAbs*100}%"></i><span>${h.day}</span></div>`).join('')}</div>
    <h4>Milestones</h4><div class="badges">${MILESTONES.map(m=>`<span class="${G.ms[m.id]?'':'no'}">${G.ms[m.id]?'✓':'○'} ${m.t}</span>`).join('')}</div>
    <h4>What you learned</h4><ul class="learn">${learned.map(l=>'<li>'+l+'</li>').join('')}</ul>
    <div class="mact"><button class="btn ghost" id="btnKeep">Keep looking around</button><button class="btn pri big" onclick="location.reload()">Play again</button></div></div>`,'wide');
  $('#btnKeep').onclick=closeModal; sfx.levelup(); confetti(g.L<'C'?50:16); }
$('#btnGoals').onclick=()=>{ audio(); modal(`<button class="x" onclick="closeModal()">×</button><div class="eyebrow">Your goals</div><h2>Garage to factory in ${DAYS} days</h2><p>Make MiniBots, fill orders, and keep costs under control. Your grade comes from <b>total profit</b>, <b>reputation</b>, <b>on-time orders</b>, <b>quality</b> and <b>milestones</b>.</p>
  <div class="badges col">${MILESTONES.map(m=>`<span class="${G.ms[m.id]?'':'no'}">${G.ms[m.id]?'✓':'○'} ${m.t}</span>`).join('')}</div>
  <h4>Controls</h4><p class="muted">Drag to move the camera · right-drag or Q/E to rotate · wheel or pinch to zoom · WASD to pan · R rotates · Space pauses · 1–8 pick tools, B belt, X remove</p>`); };
$('#btnSet').onclick=()=>{ audio(); const c=modal(`<button class="x" onclick="closeModal()">×</button><div class="eyebrow">Settings</div><h2>Game settings</h2>
  <h4>Graphics</h4><div class="seg" data-g="q">${['high','med','low'].map(l=>`<button data-v="${l}" class="${Q.level===l?'on':''}">${{high:'Fancy',med:'Balanced',low:'Fast'}[l]}</button>`).join('')}</div><p class="muted small">Use <b>Fast</b> on older Chromebooks. The game also switches down by itself if it gets choppy.</p>
  <h4>Sound</h4><div class="seg" data-g="mu"><button data-v="1" class="${AU.music?'on':''}">🎵 Music on</button><button data-v="0" class="${!AU.music?'on':''}">Music off</button></div>
  <div class="seg" data-g="sf"><button data-v="1" class="${!AU.muted?'on':''}">🔊 Sound on</button><button data-v="0" class="${AU.muted?'on':''}">🔇 All sound off</button></div>`);
  c.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{ const grp=b.parentElement.dataset.g, v=b.dataset.v; b.parentElement.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
    if(grp==='q'){ setQuality(v); UI.lockQ=true; } if(grp==='mu') setMusic(v==='1'); if(grp==='sf') setMuted(v==='0'); sfx.tick(); }); };

/* ---------- input ---------- */
const ray=new THREE.Raycaster(), ndc=new THREE.Vector2(), gplane=new THREE.Plane(new THREE.Vector3(0,1,0),0), _hit=new THREE.Vector3();
function cellAt(x,y){ ndc.set(x/innerWidth*2-1,-(y/innerHeight)*2+1); ray.setFromCamera(ndc,camera); if(!ray.ray.intersectPlane(gplane,_hit)) return null; return {c:Math.floor((_hit.x-OX)/CELL), r:Math.floor((_hit.z-OZ)/CELL)}; }
let ghost, selRing, hoverRing;
function makeGhost(){ ghost=new THREE.Group(); const gm=new THREE.MeshBasicMaterial({color:'#22C55E', transparent:true, opacity:.32, depthWrite:false}); const b=new THREE.Mesh(BOX,gm); b.scale.set(1.92,.7,1.92); b.position.y=.35; ghost.add(b);
  const ar=new THREE.Mesh(new THREE.ConeGeometry(.32,.6,4), new THREE.MeshBasicMaterial({color:'#fff', transparent:true, opacity:.85, depthWrite:false})); ar.rotation.z=-Math.PI/2; ar.position.set(.45,.85,0); ghost.add(ar); ghost.userData={gm}; ghost.visible=false; scene.add(ghost);
  selRing=new THREE.Mesh(new THREE.RingGeometry(1.2,1.38,40), new THREE.MeshBasicMaterial({color:'#00E676', transparent:true, opacity:.9, depthWrite:false})); selRing.rotation.x=-Math.PI/2; selRing.visible=false; scene.add(selRing);
  hoverRing=new THREE.Mesh(new THREE.RingGeometry(1.22,1.3,40), new THREE.MeshBasicMaterial({color:'#fff', transparent:true, opacity:.55, depthWrite:false})); hoverRing.rotation.x=-Math.PI/2; hoverRing.position.y=.07; hoverRing.visible=false; scene.add(hoverRing); }
function updateGhost(cell){ if(!cell||G.tool==='select'||G.mode!=='play'){ ghost.visible=false; return; } const t=at(cell.c,cell.r), err=canPlace(G.tool,cell.c,cell.r);
  if(!inB(cell.c,cell.r)){ ghost.visible=false; return; }
  ghost.visible=true; ghost.position.set(cellX(cell.c),0,cellZ(cell.r)); const onBelt=t&&t.k==='belt'; const dir=onBelt&&(MACH[G.tool]||G.tool==='splitter')?t.dir:onBelt&&G.tool==='belt'?(t.dir+1)%4:G.rot; ghost.rotation.y=-dir*Math.PI/2;
  ghost.children[1].visible=G.tool!=='bulldoze'; ghost.userData.gm.color.set(G.tool==='bulldoze'?(err?'#64748B':'#EF4444'):err?'#EF4444':'#22C55E'); }
function beltDragTo(cell){ const D=UI.drag; let last=D.last; if(!cell||(cell.c===last.c&&cell.r===last.r)) return;
  let guard=0; while((last.c!==cell.c||last.r!==cell.r)&&guard++<40){ const dc=cell.c-last.c, dr=cell.r-last.r; let dir; if(dc!==0&&(Math.abs(dc)>=Math.abs(dr)||dr===0)) dir=dc>0?0:2; else dir=dr>0?1:3;
    const nxt={c:last.c+DX[dir], r:last.r+DZ[dir]}; const pt=at(last.c,last.r); if(pt&&pt.k==='belt'){ if(pt.dir!==dir){ pt.dir=dir; dirty(); } }
    const nt=at(nxt.c,nxt.r); if(!nt&&inB(nxt.c,nxt.r)){ if(placeBelt(nxt.c,nxt.r,dir)) sfx.place(); } last=nxt; }
  D.last=last; }
function handleTap(cell){ if(!cell) return; const t=at(cell.c,cell.r);
  if(t&&t.k==='mach'&&t.broken){ whack(t); return; }
  if(G.tool==='select'){ if(t&&t.k==='mach'){ G.sel=t; UI.hirePick=false; renderInspect(); sfx.tick(); } else if(t&&t.k==='supply'){ UI.tab='supply'; $('#side').classList.remove('min'); renderSide(); } else if(t&&t.k==='ship'){ UI.tab='orders'; $('#side').classList.remove('min'); renderSide(); } else { G.sel=null; renderInspect(); } return; }
  if(G.tool==='belt'){ if(t&&t.k==='belt'){ t.dir=(t.dir+1)%4; t.pop=1; dirty(); sfx.place(); } else { const e=canPlace('belt',cell.c,cell.r); if(e) toast(e); else { placeBelt(cell.c,cell.r,G.rot); sfx.place(); } } return; }
  if(G.tool==='bulldoze'){ if(t&&(t.k==='belt'||t.k==='mach'||t.k==='split')){ removeAt(cell.c,cell.r); sfx.thud(); renderInspect(); } return; }
  if(G.tool==='splitter'){ const e=canPlace('splitter',cell.c,cell.r); if(e){ toast(e,'bad'); sfx.bad(); return; } placeSplitter(cell.c,cell.r,G.rot); floatText(cellX(cell.c),2,cellZ(cell.r),'−'+fmt(ECON.splitter),'bad'); return; }
  if(MACH[G.tool]){ const e=canPlace(G.tool,cell.c,cell.r); if(e){ toast(e,'bad'); sfx.bad(); return; } const m=placeMachine(G.tool,cell.c,cell.r,G.rot); if(m) afterPlace(m); } }
function afterPlace(m){ floatText(cellX(m.c),2.2,cellZ(m.r),'−'+fmt(MACH[m.type].cost),'bad'); const core=CORE.filter(has).length;
  if(core===3&&!G.opened) $('#btnOpen').classList.add('pulse');
  setTool('select'); if(innerWidth>=560&&G.opened){ G.sel=m; renderInspect(); } }
const cv=$('#gl');
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{ audio(); cv.setPointerCapture(e.pointerId); UI.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,b:e.button}); CAM.vx=CAM.vz=0;
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
    CAM.dist=clamp(CAM.dist*D.d/Math.max(20,d),CAM.min,CAM.max); CAM.distGoal=null; CAM.yaw-=an-D.a; panCam(mx-D.mx,my-D.my); D.d=d; D.a=an; D.mx=mx; D.my=my; return; }
  if(D.mode==='rotate'){ CAM.yaw-=dx*.006; CAM.pitch=clamp(CAM.pitch+dy*.004,.5,1.35); return; }
  D.moved+=Math.abs(dx)+Math.abs(dy);
  if(D.mode==='belt'){ const cell=cellAt(e.clientX,e.clientY); if(cell&&(cell.c!==D.last.c||cell.r!==D.last.r)){ if(!D.started){ D.started=true; const t=at(D.start.c,D.start.r); if(!t&&placeBelt(D.start.c,D.start.r,G.rot)) sfx.place(); } beltDragTo(cell); } updateGhost(cell); return; }
  if(D.mode==='pan'&&D.moved>6) panCam(dx,dy,true); });
function endPointer(e){ const p=UI.pointers.get(e.pointerId); if(!p) return; UI.pointers.delete(e.pointerId); const D=UI.drag;
  if(D&&D.mode==='pinch'){ if(UI.pointers.size===0) UI.drag=null; else UI.drag={mode:'pan',moved:99}; return; }
  if(D&&(D.mode==='pan'||D.mode==='belt')&&!D.noTap&&D.moved<8&&!D.started&&G.mode==='play'&&!UI.modal){ CAM.vx=CAM.vz=0; handleTap(cellAt(e.clientX,e.clientY)); }
  if(UI.pointers.size===0) UI.drag=null; }
cv.addEventListener('pointerup',endPointer); cv.addEventListener('pointercancel',endPointer);
cv.addEventListener('pointerleave',()=>{ if(!UI.pointers.size){ ghost.visible=false; UI.hover=null; } });
cv.addEventListener('wheel',e=>{ e.preventDefault(); CAM.distGoal=clamp((CAM.distGoal??CAM.dist)*(1+Math.sign(e.deltaY)*.12),CAM.min,CAM.max); },{passive:false});
addEventListener('keydown',e=>{ if(e.target.tagName==='INPUT') return; const k=e.key.toLowerCase(); UI.keys.add(k);
  if(k==='escape'){ if(UI.modal&&!$('#btnNext')&&!G.over&&!$('.dec')) closeModal(); else { setTool('select'); G.sel=null; renderInspect(); } }
  if(G.mode!=='play'||UI.modal) return;
  if(k===' '){ e.preventDefault(); if(G.opened){ G.paused=!G.paused; } }
  if(k==='r'){ if(G.sel) rotateMachine(G.sel); else { G.rot=(G.rot+1)%4; updateGhost(UI.hover); } }
  const tl=TOOLS.find(t=>t.k.toLowerCase()===k); if(tl) setTool(tl.id);
  if(k==='+'||k==='=') CAM.distGoal=clamp(CAM.dist*.88,CAM.min,CAM.max); if(k==='-') CAM.distGoal=clamp(CAM.dist*1.14,CAM.min,CAM.max);
  if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault(); });
addEventListener('keyup',e=>UI.keys.delete(e.key.toLowerCase())); addEventListener('blur',()=>UI.keys.clear());
$$('#camctl button').forEach(b=>b.onclick=()=>{ const c=b.dataset.c; if(c==='rl') CAM.yawGoal=(CAM.yawGoal??CAM.yaw)+Math.PI/4; if(c==='rr') CAM.yawGoal=(CAM.yawGoal??CAM.yaw)-Math.PI/4; if(c==='zi') CAM.distGoal=clamp(CAM.dist*.82,CAM.min,CAM.max); if(c==='zo') CAM.distGoal=clamp(CAM.dist*1.2,CAM.min,CAM.max); });
$$('#speed button').forEach(b=>b.onclick=()=>{ audio(); if(!G.opened||UI.modal) return; const s=+b.dataset.s; if(s===0) G.paused=!G.paused; else { G.speed=s; G.paused=false; } sfx.tick(); hud(); });
$('#advisor .x').onclick=()=>$('#advisor').classList.add('hide');
$('#btnOpen').onclick=()=>{ audio(); const core=CORE.filter(has).length;
  if(core<3){ advise('Your line still needs '+CORE.filter(t=>!has(t)).map(t=>'a <b>'+MACH[t].name+'</b>').join(' and ')+'. Without all three, the parts reach shipping unfinished. Tap again to open anyway, or add them first.'); if(!G.flags.openWarn){ G.flags.openWarn=1; return; } }
  G.opened=true; G.paused=false; G.speed=1; $('#btnOpen').hidden=true; sfx.fanfare(); banner('☀️ Day 1','The factory is open!',''); };

/* ---------- visuals per frame ---------- */
const LIST=[];
function collectItems(t){ LIST.length=0;
  for(const b of G.belts){ const cx=cellX(b.c), cz=cellZ(b.r), D=b.dir, D1=(D+1)%4;
    for(const e of b.items){ const f=e.from, p=e.p; let x,z,ry;
      if(b.corner>=0&&f===b.corner){ const sg=(b.corner-D+4)%4===1?1:-1, a=Math.PI+sg*p*Math.PI/2, lx=1+Math.cos(a), lz=sg+Math.sin(a), tx=-Math.sin(a)*sg, tz=Math.cos(a)*sg;
        x=cx+lx*DX[D]+lz*DX[D1]; z=cz+lx*DZ[D]+lz*DZ[D1]; ry=-Math.atan2(tx*DZ[D]+tz*DZ[D1], tx*DX[D]+tz*DX[D1]); }
      else if(p<.5){ const k=p*2; x=lerp(cx+DX[f],cx,k); z=lerp(cz+DZ[f],cz,k); ry=-((f+2)%4)*Math.PI/2; } else { const k=(p-.5)*2; x=lerp(cx,cx+DX[D],k); z=lerp(cz,cz+DZ[D],k); ry=-D*Math.PI/2; }
      const hop=e.hop&&p<.5?Math.sin(p/.5*Math.PI)*.34:0; LIST.push({it:e.it,x,y:.41+hop,z,ry,spin:e.it.s===1?t*2:0}); } }
  for(const s of G.splits){ const cx=cellX(s.c), cz=cellZ(s.r); for(const e of s.items){ const k=Math.min(1,e.p*2), f=e.from; LIST.push({it:e.it,x:lerp(cx+DX[f],cx,k),y:.46,z:lerp(cz+DZ[f],cz,k),ry:-s.dir*Math.PI/2}); } }
  for(const m of G.machines){ const cx=cellX(m.c), cz=cellZ(m.r), fx=DX[m.dir], fz=DZ[m.dir], ry=-m.dir*Math.PI/2;
    m.inQ.forEach((it,i)=>LIST.push({it,x:cx-fx*(.62+i*.32),y:.41,z:cz-fz*(.62+i*.32),ry}));
    if(m.cur){ const k=lerp(-.3,.3,m.prog); LIST.push({it:m.cur,x:cx+fx*k,y:.41,z:cz+fz*k,ry}); }
    if(m.out) LIST.push({it:m.out,x:cx+fx*.7,y:.41,z:cz+fz*.7,ry}); } }
const LIGHT={work:'#22C55E', starved:'#FBBF24', blocked:'#EF4444', nocrew:'#64748B', broken:'#EF4444'};
const _tip=new THREE.Vector3();
function animMachines(t,rdt,running){ const bn=bottleneck(); if(bn&&running&&UI.t>4&&G.goals.t_hire) tip('bottleneck'); const showAll=CAM.dist<15, fxOn=qs().fx>100;
  for(const m of G.machines){ const P=m.P, work=running&&m.state==='work'&&!m.pass;
    const lc=LIGHT[m.state]||'#22C55E'; if(m.lc!==lc){ m.lc=lc; P.lightMat.color.set(lc); P.lightMat.emissive.set(lc); } P.lightMat.emissiveIntensity=m.state==='broken'?(Math.sin(t*10)>0?2:.1):1.5;
    if(P.head&&m.type==='stamper') P.head.position.y=work?1.55-Math.pow(Math.max(0,Math.sin(m.prog*Math.PI)),3)*.95:1.55;
    if(m.type==='chip'&&P.head) P.head.position.y=work?1.7-Math.max(0,Math.sin(m.prog*Math.PI*2))*.5:1.7;
    if(P.arm){ if(work){ P.arm.rotation.y=Math.sin(t*5)*.9; P.up.rotation.x=Math.sin(t*7)*.3; P.arm2.rotation.y=-Math.sin(t*6+1)*1.1;
        if(fxOn&&Math.random()<rdt*9){ P.fw.localToWorld(_tip.copy(P.tip)); puffAt(_tip.x,_tip.y,_tip.z,Math.random()<.5?'#E0F2FE':'#7DD3FC',3,{spread:1.2,up:.5,life:.3,size:.035,g:8,jx:.1}); sfx.weld(); } } }
    if(P.mist){ P.mist.material.opacity=work?.26+Math.sin(t*30)*.08:0; P.nozzle.position.x=work?Math.sin(t*6)*.35:0; if(work&&fxOn&&Math.random()<rdt*6){ puffAt(cellX(m.c)+rand(-.4,.4),.9,cellZ(m.r)+rand(-.4,.4),'#86EFAC',1,{spread:.25,up:.25,life:.8,size:.16,g:-.3,grow:true}); sfx.spray(); } }
    if(P.scan){ P.scan.position.y=work?1.0+Math.abs(Math.sin(t*4))*.85:1.85; P.beam.material.opacity=work?.24:.05; }
    if(P.flap) P.flap.rotation.z=work?Math.sin(t*9)*.6:0;
    if(P.leds) P.leds.emissiveIntensity=work?(Math.sin(t*14)>0?1.6:.3):.5;
    if(m.auto&&P.r1){ P.robot.rotation.y=work?Math.sin(t*4)*1.2:0; P.r1.rotation.x=work?Math.sin(t*6)*.35:0; }
    m.rigs.forEach((w,i)=>{ if(w.cur==='TwistJump') return; rigPlay(w, m.broken?'UpPoint':work?(i?'LeftHand':'RightHand'):'Idle'); });
    const isB=bn===m; P.ring.visible=isB||!!m.broken; if(P.ring.visible){ const s=1+Math.sin(t*5)*.06; P.ring.scale.set(s,s,1); }
    const al=m.broken?'broken':isB?'bottleneck':m.state==='nocrew'?'nocrew':null; m.alert.visible=!!al; if(al&&m.alert.material.map!==MM.alerts[al]){ m.alert.material.map=MM.alerts[al]; m.alert.material.needsUpdate=true; } if(al) m.alert.position.y=3.55+Math.sin(t*4)*.08;
    const hov=UI.hoverM===m; m.label.visible=!al&&(hov||G.sel===m||showAll); m.label.position.y=3.0+(hov?.1:0);
    /* placement drop: fall, squash, dust */
    let sy=1, sxz=1, y=0; if(m.drop>0){ m.drop=Math.max(0,m.drop-rdt*2.2); const k=1-m.drop;
      if(k<.5){ const f=k/.5; y=3*(1-f*f); sy=1.12; sxz=.92; } else { if(!m.landed){ m.landed=1; puffAt(cellX(m.c),.15,cellZ(m.r),'#E7E2D6',16,{spread:2.2,up:.25,life:.7,size:.16,g:.5,grow:true}); sfx.build(); CAM.shake=Math.max(CAM.shake,.45); }
        const f=(k-.5)/.5, sq=Math.sin(f*Math.PI)*(1-f); sy=1-.3*sq; sxz=1+.2*sq; } } else m.landed=0;
    if(m.hit>0){ m.hit=Math.max(0,m.hit-rdt*6); sy*=1-.05*m.hit; sxz*=1+.03*m.hit; }
    if(hov&&!m.drop){ sxz*=1.03; sy*=1.03; }
    m.g.position.y=y; m.g.scale.set(sxz,sy,sxz);
    if(m.shake>0){ m.shake=Math.max(0,m.shake-rdt*5); m.g.position.x=cellX(m.c)+Math.sin(t*80)*.08*m.shake; } else m.g.position.x=cellX(m.c); }
  for(const s of G.splits){ if(s.pop>0){ s.pop=Math.max(0,s.pop-rdt*3); const k=1+Math.sin(s.pop*Math.PI)*.25; s.g.scale.set(k,1/k,k); } s.g.userData.top.rotation.y+=rdt*(running?2:.3); }
  hoverRing.visible=!!UI.hoverM&&UI.hoverM!==G.sel; if(hoverRing.visible) hoverRing.position.set(cellX(UI.hoverM.c),.07,cellZ(UI.hoverM.r)); }
function animDocks(t){ for(const s of G.supplies){ const u=s.g.userData, h=Math.max(.02,Math.min(1.5,G.stock/ECON.maxStock*1.6/G.supplies.length*(G.supplies.length>1?1.5:1))); u.stack.scale.y=h; u.stack.position.y=.48+h/2;
    const key=G.stock+s.state; if(u.n!==key){ u.n=key; retext(u.label,[{t:s.state==='idle'?'STEEL · NEEDS A STAMPER':'STEEL IN',size:s.state==='idle'?34:44,color:s.state==='idle'?'#FDE68A':G.stock<12?'#FCA5A5':'#93C5FD'},{t:G.stock+' sheets',size:40}],{}); } }
  for(const s of G.ships){ const u=s.g.userData, h=Math.max(.01,Math.min(1.4,G.fg.length*.05)); u.stack.scale.y=h; u.stack.position.y=.48+h/2;
    if(s.bump>0){ s.bump=Math.max(0,s.bump-.08); u.stack.scale.x=u.stack.scale.z=1.15+s.bump*.12; }
    if(u.n!==G.fg.length){ u.n=G.fg.length; retext(u.label,[{t:'SHIPPING',size:44,color:'#86EFAC'},{t:G.fg.length+' ready',size:40}],{}); } } }
function animMarker(t){ const k=W.marker; if(!k.visible) return; const u=k.userData; u.ar.position.y=2.2+Math.abs(Math.sin(t*3.2))*.5; u.ar.rotation.y=t*2; u.ring.scale.setScalar(1+Math.sin(t*4)*.08); u.fill.material.opacity=.14+Math.sin(t*4)*.08; }
function animWalkers(t,dt){ const B=W.bounds; if(!B) return; W.walkers.forEach((w,i)=>{ w.rig.root.visible=Q.level!=='low'; w.u=(w.u+dt*w.v/(B.X1-B.X0-3))%2; const k=w.u<1?w.u:2-w.u; const x=lerp(B.X0+1.5,B.X1-1.5,k);
  w.rig.root.position.set(x,.15+Math.sin(t*3+i)*.06,B.Z0+1.3); w.rig.root.rotation.y=w.u<1?Math.PI/2:-Math.PI/2; }); }

/* ---------- loop ---------- */
let titleSpin=0;
function loop(){ requestAnimationFrame(loop); const raw=clock.getDelta(), rdt=Math.min(.05,raw); UI.lag=Math.min(.05,Math.max(0,raw-.05)); UI.t+=rdt; const t=UI.t;
  const running=G.mode==='play'&&G.opened&&!G.paused&&!UI.modal;
  if(G.mode==='title'){ titleSpin+=rdt*.07; CAM.yaw=.62+Math.sin(titleSpin)*.5; }
  else { const K=UI.keys, ps=CAM.dist*.9*rdt*60; if(K.has('w')||K.has('arrowup')) panCam(0,ps*.35); if(K.has('s')||K.has('arrowdown')) panCam(0,-ps*.35); if(K.has('a')||K.has('arrowleft')) panCam(ps*.35,0); if(K.has('d')||K.has('arrowright')) panCam(-ps*.35,0);
    if(K.has('q')) CAM.yaw+=rdt*1.6; if(K.has('e')) CAM.yaw-=rdt*1.6; }
  if(CAM.yawGoal!=null){ CAM.yaw=lerp(CAM.yaw,CAM.yawGoal,Math.min(1,rdt*8)); if(Math.abs(CAM.yaw-CAM.yawGoal)<.002){ CAM.yaw=CAM.yawGoal; CAM.yawGoal=null; } }
  if(CAM.goal){ const g=CAM.goal, k=Math.min(1,rdt*3); CAM.tx=lerp(CAM.tx,g.tx,k); CAM.tz=lerp(CAM.tz,g.tz,k); CAM.dist=lerp(CAM.dist,g.dist,k); if(Math.abs(CAM.dist-g.dist)<.05) CAM.goal=null; }
  if(running){ const sdt=Math.min(.1,rdt+(UI.lag||0))*G.speed, n=Math.ceil(sdt/.034); for(let i=0;i<n;i++){ simStep(sdt/n); stepTrucks(sdt/n); if(G.paused) break; } BELT.tex.offset.x-=sdt*beltSpeed()*.5; }
  if(beltsDirty||G.belts.some(b=>b.pop>0)){ rebuildBelts(); beltsDirty=false; }
  collectItems(t); drawItems(LIST); animMachines(t,rdt,running); animDocks(t); animMarker(t); animWalkers(t,rdt);
  for(const r of W.rigs) r.mixer.update(rdt);
  if(G.mb){ G.mb.root.position.y=3.0+Math.sin(t*1.6)*.15; G.mb.root.rotation.y=Math.atan2(camera.position.x-G.mb.root.position.x,camera.position.z-G.mb.root.position.z); }
  if(G.rusty&&G.rusty.root.visible){ G.rusty.root.rotation.y=Math.sin(t*.7)*.4; }
  W.anim.forEach(f=>f(t)); stepFx(rdt); stepFloaters(rdt); stepCars(rdt); stepForklift(rdt); updateCam(rdt); updateWalls(rdt);
  setDayLight(G.mode==='title'?.82:G.opened?G.t/DAY_LEN:.12);
  if(G.mode==='play'){ hudCash(rdt);
    if(t>UI.saleT){ UI.saleT=t+1.1; if(UI.saleAcc>0){ const s=pick(G.ships); if(s) floatText(cellX(s.c),3.4,cellZ(s.r),'+'+fmt(Math.round(UI.saleAcc)),'cash'); sfx.cash(); UI.saleAcc=0; } }
    if(t>UI.coinT&&UI.coinQ>0){ UI.coinT=t+.13; UI.coinQ--; flyCoin(); }
    if(t>UI.hudT){ UI.hudT=t+.2; hud(); stepTips(); stepGoals(); } if(t>UI.sideT&&!$('#side').classList.contains('min')){ UI.sideT=t+.5; updateSide(); } if(t>UI.insT){ UI.insT=t+.3; updateInspect(); }
    if(UI.hover){ const hm=at(UI.hover.c,UI.hover.r); const m=hm&&hm.k==='mach'?hm:null; if(m!==UI.hoverM){ UI.hoverM=m; if(m&&G.tool==='select') sfx.hover(); cv.style.cursor=m||hm&&(hm.k==='supply'||hm.k==='ship')?'pointer':''; } } else UI.hoverM=null;
    autoQuality(raw); }
  renderer.render(scene,camera); }
function autoQuality(raw){ if(UI.lockQ||document.hidden||UI.modal) return; UI.fps.push(raw); if(UI.fps.length<240) return; const avg=UI.fps.reduce((a,b)=>a+b,0)/UI.fps.length; UI.fps.length=0;
  if(1/avg<26&&Q.level!=='low'&&UI.downgrades<2){ UI.downgrades++; setQuality(Q.level==='high'?'med':'low'); toast('Switched to faster graphics to keep things smooth. Change it in ⚙ Settings.'); } }

/* ---------- boot ---------- */
async function boot(){
  initThree(); setupMaterials(); machineMats(); ['tLogo','hLogo','aLogo'].forEach(id=>$('#'+id).src=MB_ASSETS.logo);
  GLTF.crowd=await parseGLB(MB_ASSETS.crowd); GLTF.hero=await parseGLB(MB_ASSETS.hero);
  buildEnvironment(); initInstancing(); makeGhost(); makeMarker();
  setupFactory();
  G.mb=makeRig(GLTF.hero, MB.hero, 1.5, 'g'); G.mb.root.position.set(OX-.9,3,OZ-.9); G.mb.root.add(blob(1.4)); scene.add(G.mb.root);
  G.rusty=makeRig(GLTF.crowd, MB.rust, 1.3, 'r'); G.rusty.root.position.set(cellX(8),0,OZ-10.5); G.rusty.root.add(blob(1.3)); G.rusty.root.visible=false; scene.add(G.rusty.root);
  W.walkers=[['#A5F3FC',1.3],['#FBCFE8',1.0]].map(([c,v],i)=>{ const r=makeRig(GLTF.crowd, MB.bodies[c], 1.1,'g'); r.root.add(blob(.9)); scene.add(r.root); return {rig:r,u:i*.7,v}; });
  renderTools(); updateCam(0); renderer.compile(scene,camera);
  $('#btnStart').disabled=false; $('#btnStart').textContent='Start your factory';
  requestAnimationFrame(loop); }
$('#btnStart').onclick=()=>{ audio(); sfx.whoosh(); fadeDo(()=>{ $('#title').hidden=true; G.mode='play'; ['#hud','#side','#tools','#camctl','#btnOpen','#hint','#goal'].forEach(s=>$(s).hidden=false); if(innerWidth<760) $('#side').classList.add('min');
  CAM.tx=cellX(4.5); CAM.tz=cellZ(2.8); CAM.yaw=innerHeight>innerWidth?1.2:.5; CAM.dist=innerHeight>innerWidth?30:23; setTool('select'); renderSide(); hud();
  setTimeout(()=>advise('Welcome to your garage! Steel comes in on the left, finished MiniBots leave on the right. Follow the 🎯 goal at the top to build your first line.',9000),600); }); };
window.BF={MACH, ff(sec){ for(let i=0;i<sec/.034;i++){ if(G.paused||!G.opened||UI.modal) break; simStep(.034); stepTrucks(.034); } }, G, UI, V, placeMachine, placeBelt, placeSplitter, removeAt, buySteel, acceptOrder, hire, candidates, automate, buyUpg, breakdown, whack, expand, canExpand, econ, setTool, handleTap, closeModal, nextDay, endDay, report, cellAt, CAM, renderSide, resolveDecision, setQuality, grade};
boot().catch(e=>{ console.error(e); $('#btnStart').textContent='Could not load: '+e.message; });
