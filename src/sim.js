/* ===================== BotFactory · simulation & economy ===================== */
const G={mode:'title', day:1, t:0, clock:0, speed:1, paused:true, opened:false, over:false,
  cash:ECON.startCash, rep:60, price:35, rush:false, autoBuy:false,
  grid:new Array(COLS*ROWS).fill(null), belts:[], machines:[], supplies:[], ships:[],
  stock:ECON.startStock, stockVal:ECON.startStock*6, deliveries:[], steelMult:1, rival:null,
  fg:[], orders:[], oid:1, returnsQ:[], extraInt:0, expanded:false, bounds:GARAGE, mktAcc:0,
  today:null, hist:[], shipTimes:[], flags:{}, ms:{}, news:[], trucks:[],
  tot:{shipped:0, sold:0, rev:0, returns:0, scrap:0, ordersDone:0, ordersLate:0, deluxe:0, wasted:0, capex:0, made:0, bestUnit:null},
  tool:'select', rot:0, sel:null};
const newDay=()=>({rev:0, orderRev:0, mktRev:0, returns:0, retN:0, mat:0, vc:0, made:0, sold:0, scrap:0, wasted:0, buy:0, capex:0});
G.today=newDay();
const idx=(c,r)=>r*COLS+c;
const inB=(c,r,b)=>{ b=b||G.bounds; return c>=b.c0&&c<=b.c1&&r>=b.r0&&r<=b.r1; };
const at=(c,r)=>inB(c,r,BIG)?G.grid[idx(c,r)]:null;
let beltsDirty=true;

/* ---------- building ---------- */
function canPlace(tool,c,r){ if(!inB(c,r)) return 'Outside your floor'; const t=at(c,r);
  if(tool==='belt'){ if(t&&t.k!=='belt') return 'Something is here'; if(!t&&G.cash<ECON.belt) return 'Not enough cash'; return ''; }
  if(MACH[tool]){ if(MACH[tool].big&&!G.expanded) return 'Unlocks in the big factory'; if(t&&t.k!=='belt') return 'Something is here'; if(G.cash<MACH[tool].cost) return 'Not enough cash'; return ''; }
  if(tool==='bulldoze') return t&&(t.k==='belt'||t.k==='mach')?'':'Nothing to remove';
  return ''; }
function placeBelt(c,r,dir,free){ if(!inB(c,r)) return false; const t=at(c,r);
  if(t&&t.k==='belt'){ if(t.dir!==dir){ t.dir=dir; beltsDirty=true; } return true; }
  if(t||(!free&&G.cash<ECON.belt)) return false; if(!free){ G.cash-=ECON.belt; G.today.capex+=ECON.belt; G.tot.capex+=ECON.belt; }
  const b={k:'belt',c,r,dir,items:[]}; G.grid[idx(c,r)]=b; G.belts.push(b); beltsDirty=true; return true; }
function placeMachine(type,c,r,dir){ if(canPlace(type,c,r)) return null; const t=at(c,r); let carry=[];
  if(t&&t.k==='belt'){ dir=t.dir; carry=t.items.map(e=>e.it); G.belts.splice(G.belts.indexOf(t),1); beltsDirty=true; }
  const d=MACH[type]; G.cash-=d.cost; G.today.capex+=d.cost; G.tot.capex+=d.cost;
  const m={k:'mach', type, c, r, dir, crew:1, auto:false, inQ:carry.slice(0,2), cur:null, prog:0, out:null, pass:false, broken:0, util:0, made:0, state:'starved', workers:[]};
  G.grid[idx(c,r)]=m; G.machines.push(m); buildMachineVisual(m); syncCrew(m);
  puff(cellX(c),.6,cellZ(r),'#E2E8F0',10,{spread:1.4,up:.8,life:.6,size:.16}); sfx.build(); return m; }
function buildMachineVisual(m){ const {g,P}=machineMesh(m.type); m.g=g; m.P=P; g.position.set(cellX(m.c),0,cellZ(m.r)); g.rotation.y=-m.dir*Math.PI/2; scene.add(g);
  m.label=machineLabel(m.type); m.label.position.set(cellX(m.c),2.95,cellZ(m.r)); scene.add(m.label);
  m.alert=alertSprite(); m.alert.position.set(cellX(m.c),3.55,cellZ(m.r)); scene.add(m.alert); g.userData.mach=m; }
function syncCrew(m){ const want=m.auto?0:m.crew; while(m.workers.length>want) dropRig(m.workers.pop());
  while(m.workers.length<want){ const i=m.workers.length, body=MB.bodies[Object.keys(MB.bodies)[(m.c*3+m.r*5+i)%7]]; const w=makeRig(GLTF.crowd, body, 1.3, 'g');
    w.root.position.set(i?-.5:.5, 0, 1.3); w.root.rotation.y=Math.PI; w.root.add(blob(1.0)); m.g.add(w.root); m.workers.push(w); }
  m.P.robot.visible=m.auto; }
function removeAt(c,r){ const t=at(c,r); if(!t) return false;
  if(t.k==='belt'){ G.belts.splice(G.belts.indexOf(t),1); G.grid[idx(c,r)]=null; beltsDirty=true; return true; }
  if(t.k==='mach'){ const m=t; m.workers.forEach(dropRig); scene.remove(m.g); scene.remove(m.label); scene.remove(m.alert);
    const refund=Math.round(MACH[m.type].cost*.5)+(m.auto?Math.round(ECON.autoCost*.3):0); G.cash+=refund; floatText(cellX(c),1.5,cellZ(r),'+'+fmt(refund)+' resale','good');
    G.machines.splice(G.machines.indexOf(m),1); G.grid[idx(c,r)]=null; if(G.sel===m) G.sel=null; puff(cellX(c),.6,cellZ(r),'#94A3B8',12,{spread:1.5,life:.7,size:.18}); return true; }
  return false; }
function rotateMachine(mm){ mm.dir=(mm.dir+1)%4; mm.g.rotation.y=-mm.dir*Math.PI/2; }
function hire(mm){ if(mm.auto||mm.crew>=2) return; mm.crew++; syncCrew(mm); sfx.good(); }
function fire(mm){ if(mm.auto||mm.crew<=0) return; mm.crew--; syncCrew(mm); sfx.tick(); }
function automate(mm){ if(mm.auto||G.cash<ECON.autoCost) return false; G.cash-=ECON.autoCost; G.today.capex+=ECON.autoCost; G.tot.capex+=ECON.autoCost; mm.auto=true; syncCrew(mm); puff(cellX(mm.c),1.4,cellZ(mm.r),'#FACC15',14,{spread:1.2,life:.8}); sfx.build(); return true; }

/* ---------- docks ---------- */
function addSupply(c,r){ const s={k:'supply',c,r,timer:0,state:'ok'}; s.g=makeSupplyDock(); s.g.position.set(cellX(c),0,cellZ(r)); scene.add(s.g); G.grid[idx(c,r)]=s; G.supplies.push(s); return s; }
function addShip(c,r){ const s={k:'ship',c,r,bump:0}; s.g=makeShipDock(); s.g.position.set(cellX(c),0,cellZ(r)); scene.add(s.g); G.grid[idx(c,r)]=s; G.ships.push(s); return s; }
function docks(){ return [...G.supplies,...G.ships].map(d=>({c:d.c,r:d.r})); }
function setupFactory(){
  addSupply(0,2); addShip(9,2); for(let c=1;c<9;c++) placeBelt(c,2,0,true);
  G.cash=ECON.startCash; G.tot.capex=0; G.today=newDay();
  buildShell(G.bounds, docks(), false); }

/* ---------- item flow ---------- */
function tryPush(c,r,it,dir){ if(!inB(c,r)) return false; const t=G.grid[idx(c,r)]; if(!t) return false;
  if(t.k==='belt'){ if(t.dir===(dir+2)%4) return false; const last=t.items[t.items.length-1]; if(last&&last.p<.36) return false; t.items.push({it,p:0,from:(dir+2)%4}); return true; }
  if(t.k==='mach'){ if(dir===(t.dir+2)%4) return false; if(t.inQ.length>=2) return false; t.inQ.push(it); return true; }
  if(t.k==='ship'){ shipItem(t,it); return true; }
  return false; }
function stepBelt(b,dt){ const sp=ECON.beltSpeed*dt*(G.rush?1.15:1);
  for(let i=0;i<b.items.length;i++){ const e=b.items[i], lim=i===0?1:b.items[i-1].p-.34; e.p=Math.max(0,Math.min(lim,e.p+sp)); }
  const f=b.items[0]; if(f&&f.p>=1&&tryPush(b.c+DX[b.dir],b.r+DZ[b.dir],f.it,b.dir)) b.items.shift(); }
const staffed=mm=>mm.auto||mm.crew>0;
function speedOf(mm){ return (mm.auto?ECON.auto:mm.crew>=2?ECON.crew2:1)*(G.rush?ECON.rush:1); }
const cycleOf=mm=>MACH[mm.type].cycle/speedOf(mm);
const capOf=mm=>staffed(mm)?DAY_LEN/cycleOf(mm):0;
function canProcess(mm,it){ const d=MACH[mm.type]; if(d.kind==='qa') return it.s===3&&!it.q; if(d.kind==='pack') return it.s===3&&!it.b; if(d.kind==='chip') return it.s>=2&&!it.x&&!it.b; return it.s===d.from; }
function processItem(mm,it){ const d=MACH[mm.type]; mm.made++;
  if(d.kind==='qa'){ it.q=true; if(it.d){ it.dead=true; G.today.scrap++; G.tot.scrap++; puff(cellX(mm.c),1,cellZ(mm.r),'#EF4444',8,{life:.6}); floatText(cellX(mm.c),1.6,cellZ(mm.r),'Defect caught','bad'); sfx.buzz(); } return; }
  if(d.kind==='pack'){ it.b=true; G.today.vc+=d.vc; return; }
  if(d.kind==='chip'){ it.x=true; G.today.vc+=d.vc; return; }
  it.s=d.to; if(d.vc) G.today.vc+=d.vc;
  const ch=d.defect*(mm.auto?ECON.autoDefect:1)*(G.rush?ECON.rushDefect:1); if(Math.random()<ch) it.d=true;
  if(mm.type==='stamper') sfx.stamp(); }
function stepMach(mm,dt){
  if(mm.out&&tryPush(mm.c+DX[mm.dir],mm.r+DZ[mm.dir],mm.out,mm.dir)) mm.out=null;
  let busy=0;
  if(mm.broken>0){ mm.state='broken'; if(G.clock-mm.brokeAt>22){ mm.broken=0; G.cash-=120; G.today.repairs=(G.today.repairs||0)+120; floatText(cellX(mm.c),2,cellZ(mm.r),'Repair crew −$120','bad'); toast(`The repair crew fixed your ${MACH[mm.type].name} for <b>$120</b>. Tapping it yourself only costs $40 in parts!`); } }
  else { if(!mm.cur&&!mm.out&&mm.inQ.length){ mm.cur=mm.inQ.shift(); mm.prog=0; mm.pass=!canProcess(mm,mm.cur); }
    if(mm.cur){ if(!staffed(mm)) mm.state='nocrew';
      else { mm.prog+=dt/(mm.pass?.3:cycleOf(mm)); mm.state='work'; busy=mm.pass?0:1;
        if(mm.prog>=1){ const it=mm.cur; mm.cur=null; mm.prog=0; if(!mm.pass) processItem(mm,it); if(!it.dead) mm.out=it; } } }
    else mm.state=mm.out?'blocked':'starved';
    if(mm.out&&!mm.cur) mm.state='blocked'; }
  mm.util+=(busy-mm.util)*Math.min(1,dt/12); }
function feedsStamper(s){ let c=s.c+1, r=s.r, dir=0; for(let i=0;i<60;i++){ if(!inB(c,r)) return false; const t=G.grid[idx(c,r)]; if(!t) return false;
    if(t.k==='mach') return t.type==='stamper'; if(t.k!=='belt'||t.dir===(dir+2)%4) return false; dir=t.dir; c+=DX[dir]; r+=DZ[dir]; } return false; }
function stepSupply(s,dt){ s.timer-=dt; if(s.timer>0) return; if(!feedsStamper(s)){ s.state='idle'; s.timer=.5; return; } if(G.stock<1){ s.state='empty'; s.timer=.25; return; }
  if(tryPush(s.c+1,s.r,{s:0},0)){ const avg=G.stockVal/G.stock; G.stock--; G.stockVal=Math.max(0,G.stockVal-avg); G.today.mat+=avg; s.timer=ECON.release/(G.rush?ECON.rush:1); s.state='ok'; }
  else { s.timer=.12; s.state='blocked'; } }
function itemValue(it){ return G.price+(it.b?ECON.boxBonus:0)+(it.x?ECON.deluxeBonus:0); }
function shipItem(s,it){ s.bump=1;
  if(it.s<3){ G.today.wasted++; G.tot.wasted++; floatText(cellX(s.c),1.4,cellZ(s.r),'Unfinished part!','bad'); sfx.buzz(); tip('unfinished','That piece reached shipping <b>unfinished</b>, so it\'s wasted material. Every bot needs a Stamper, then an Assembler, then a Painter, in that order.'); return; }
  G.today.made++; G.tot.shipped++; G.shipTimes.push(G.clock); if(it.x){ G.tot.deluxe++; milestone('deluxe'); }
  milestone('first'); if(G.tot.shipped>=60) milestone('ship60'); if(G.tot.shipped>=300) milestone('ship300');
  if(G.tot.shipped===1) tip('firstShip'); G.fg.push(it); allocate(); }
function allocate(){ const act=G.orders.filter(o=>o.status==='active').sort((a,b)=>a.due-b.due||a.id-b.id);
  for(const o of act){ while(o.got<o.qty){ const i=G.fg.findIndex(it=>o.deluxe?it.x:!it.x); if(i<0) break; const it=G.fg.splice(i,1)[0];
      const v=o.price+(it.b?ECON.boxBonus:0); o.got++; o.paid+=v; earn(v,'order',it); }
    if(o.got>=o.qty){ o.status='done'; G.tot.ordersDone++; G.rep=clamp(G.rep+3,0,100); milestone('order'); toast(`<b>${o.client}</b> order complete! +${fmt(o.paid)} · Reputation up`,'good'); sfx.cash(); } } }
function earn(v,kind,it){ G.cash+=v; G.today.rev+=v; G.tot.rev+=v; G.today.sold++; G.tot.sold++; if(kind==='order') G.today.orderRev+=v; else G.today.mktRev+=v;
  if(it.d) G.returnsQ.push({at:G.clock+rand(12,45), v});
  const s=G.ships[0]; if(s&&Math.random()<.6) floatText(cellX(s.c)+rand(-.4,.4),1.5,cellZ(s.r),'+'+fmt(v),'cash'); }
function stepMarket(dt){ const rate=marketDemand(G.price,G.rep,G.expanded,G.rival)/DAY_LEN; G.mktAcc+=rate*dt;
  while(G.mktAcc>=1&&G.fg.length){ let i=G.fg.findIndex(it=>!reservedFor(it)); if(i<0) break; const it=G.fg.splice(i,1)[0]; earn(itemValue(it),'market',it); G.mktAcc-=1; if(Math.random()<.35) sfx.coin(); }
  if(!G.fg.length) G.mktAcc=Math.min(G.mktAcc,1); }
/* keep deluxe bots for active deluxe orders */
function reservedFor(it){ return it.x&&G.orders.some(o=>o.status==='active'&&o.deluxe&&o.got<o.qty); }
function stepReturns(){ for(let i=G.returnsQ.length-1;i>=0;i--){ const r=G.returnsQ[i]; if(G.clock<r.at) continue; G.returnsQ.splice(i,1);
  const cost=r.v+ECON.returnFee; G.cash-=cost; G.today.returns+=cost; G.today.retN++; G.tot.returns++; G.rep=clamp(G.rep-1.5,0,100);
  const s=G.ships[0]; if(s) floatText(cellX(s.c),1.8,cellZ(s.r),'Returned broken −'+fmt(cost),'bad'); sfx.bad();
  if(!G.machines.some(mm=>mm.type==='qa')) tip('returns'); } }

/* ---------- supply ---------- */
const steelPrice=each=>Math.round(each*G.steelMult*100)/100;
function buySteel(n){ const b=BULK.find(x=>x.n===n)||BULK[1], each=steelPrice(b.each), cost=Math.round(n*each);
  const pend=G.deliveries.reduce((a,d)=>a+d.n,0); if(G.stock+pend+n>ECON.maxStock) { toast('Your storage only holds '+ECON.maxStock+' sheets.','bad'); return false; }
  if(G.cash<cost){ toast('Not enough cash for that order.','bad'); return false; }
  G.cash-=cost; G.today.buy+=cost; const d={n,cost,eta:G.clock+ECON.deliveryTime}; G.deliveries.push(d); sendSupplyTruck(d); sfx.tick(); return true; }
function stepDeliveries(){ for(let i=G.deliveries.length-1;i>=0;i--){ const d=G.deliveries[i]; if(G.clock<d.eta) continue; G.deliveries.splice(i,1); G.stock+=d.n; G.stockVal+=d.cost;
  const s=G.supplies[0]; if(s){ floatText(cellX(s.c),1.6,cellZ(s.r),'+'+d.n+' steel','good'); puff(cellX(s.c),.8,cellZ(s.r),'#CBD5E1',8,{life:.5}); } sfx.thud(); } }
function sendSupplyTruck(d){ const s=G.supplies[0]; if(!s) return; const sp=spSteel(); if(sp) spTrack('view',sp,{slot:'steel'}); const tr=makeTruck(sp?sp.color:'#2563EB','STEEL CO.','sheet metal · fast',sp); const z=cellZ(s.r), stop=OX-3.4; tr.position.set(stop-ECON.deliveryTime*4.6,0,z); scene.add(tr); G.trucks.push({g:tr, x0:stop-ECON.deliveryTime*4.6, stop, dir:1, until:d.eta, phase:'in', wait:0, t0:G.clock}); }
function sendShipTruck(){ const s=G.ships[0]; if(!s) return; const sp=spShip(); if(sp) spTrack('view',sp,{slot:'shipping'}); const tr=makeTruck(sp?sp.color:'#059669','MINIBOT EXPRESS','delivering fun',sp); tr.rotation.y=Math.PI; const wallX=OX+(G.bounds.c1+1)*CELL, stop=wallX+3.4, z=cellZ(s.r); tr.position.set(stop+50,0,z); scene.add(tr);
  G.trucks.push({g:tr, x0:stop+50, stop, dir:-1, until:G.clock+10, phase:'in', wait:0, t0:G.clock}); }
function stepTrucks(dt){ for(let i=G.trucks.length-1;i>=0;i--){ const T=G.trucks[i], g=T.g;
  if(T.t0==null) T.t0=G.clock;
  if(T.phase==='in'){ const u=clamp((G.clock-T.t0)/Math.max(.001,T.until-T.t0),0,1), e=1-Math.pow(1-u,2); g.position.x=lerp(T.x0,T.stop,e); if(u>=1){ T.phase='wait'; T.wait=2.2; } }
  else if(T.phase==='wait'){ T.wait-=dt; if(T.wait<=0){ T.phase='out'; T.v=0; } }
  else { T.v=Math.min(14,T.v+dt*6); g.position.x-=T.dir*T.v*dt; if(Math.abs(g.position.x-T.stop)>60){ scene.remove(g); G.trucks.splice(i,1); } } } }

/* ---------- orders ---------- */
function newOffer(o){ o=Object.assign({id:G.oid++, client:pick(CLIENTS), got:0, paid:0, status:'offer', deluxe:false, expires:G.day},o); G.orders.push(o); onOffer(o); return o; }
function maybeOffer(force){ const offers=G.orders.filter(o=>o.status==='offer').length, act=G.orders.filter(o=>o.status==='active').length;
  if(offers>=2||act>=3) return; if(!force&&Math.random()>.45+G.rep/180) return;
  const deluxe=G.expanded&&G.machines.some(mm=>mm.type==='chip')&&Math.random()<.45, big=G.expanded;
  const qty=deluxe?randi(8,16):randi(big?18:8,big?36:22);
  newOffer({qty, price:deluxe?randi(64,74):randi(40,47), due:G.day+(qty>24?2:1), deluxe}); }
function acceptOrder(o){ if(o.status!=='offer') return; o.status='active'; allocate(); sfx.good(); }
function passOrder(o){ if(o.status!=='offer') return; o.status='passed'; sfx.tick(); }

/* ---------- economics readouts ---------- */
function fixedCosts(){ const rent=G.expanded?ECON.rentBig:ECON.rentGarage; let wages=0, upkeep=0;
  G.machines.forEach(mm=>{ wages+=(mm.auto?0:mm.crew)*ECON.wage; upkeep+=MACH[mm.type].cost*ECON.upkeepPct+(mm.auto?ECON.autoUpkeep:0); });
  const loan=ECON.loanInt+G.extraInt, storage=G.stock*ECON.holdSheet+G.fg.length*ECON.holdBot;
  return {rent, wages, upkeep, loan, storage, total:rent+wages+upkeep+loan+storage}; }
function has(type){ return G.machines.some(mm=>mm.type===type); }
function econ(){ const F=fixedCosts(); const sheet=G.stock>0?G.stockVal/G.stock:steelPrice(6);
  const v=sheet+(has('painter')?2:0)+(has('packer')?1.5:0)+(has('chip')?9:0), peff=G.price+(has('packer')?ECON.boxBonus:0)+(has('chip')?ECON.deluxeBonus:0);
  /* capacity: sum per station type, line = slowest type */
  const caps={}; G.machines.forEach(mm=>{ caps[mm.type]=(caps[mm.type]||0)+(mm.broken?0:capOf(mm)); });
  let cap=G.supplies.length*DAY_LEN/(ECON.release/(G.rush?ECON.rush:1)), capBy='Steel docks';
  CORE.forEach(t=>{ const c=caps[t]||0; if(c<cap){ cap=c; capBy=MACH[t].name; } });
  ['qa','packer','chip'].forEach(t=>{ if(caps[t]!=null&&caps[t]<cap){ cap=caps[t]; capBy=MACH[t].name; } });
  const win=Math.min(30,Math.max(1,G.t+ (G.day>1?30:0))); const recent=G.shipTimes.filter(x=>x>G.clock-30).length; let pace=G.opened?recent/win*DAY_LEN:0;
  if(G.opened&&recent<4) pace=Math.max(pace,cap*.8); pace=Math.min(pace,cap||pace);
  const margin=peff-v, be=margin>0?Math.ceil(F.total/margin):Infinity, unit=pace>0?F.total/pace+v:Infinity;
  return {F, v, sheet, peff, margin, be, cap, capBy, pace, unit, demand:marketDemand(G.price,G.rep,G.expanded,G.rival)}; }
function bottleneck(){ if(!G.opened) return null; let best=null; G.machines.forEach(mm=>{ if(mm.broken||!staffed(mm)) return; if(mm.util>.8&&mm.inQ.length>=1&&(!best||mm.util>best.util)) best=mm; }); return best; }

/* ---------- events ---------- */
function once(key,cond,fn){ if(!G.flags[key]&&cond){ G.flags[key]=1; fn(); } }
function breakdown(mm){ if(!mm){ const c=G.machines.filter(x=>!x.broken&&staffed(x)&&CORE.includes(x.type)).sort((a,b)=>b.util-a.util); mm=c[0]; } if(!mm) return;
  mm.broken=mm.auto?3:5; mm.brokeAt=G.clock; puff(cellX(mm.c),1.5,cellZ(mm.r),'#F97316',14,{spread:1.2,life:.7}); sfx.bang(); tip('breakdown'); G.flags.lastBreak=mm; }
function whack(mm){ if(!mm.broken) return; mm.broken--; sfx.clang(); mm.shake=1; puff(cellX(mm.c),1.3,cellZ(mm.r),'#FDE68A',5,{spread:1.6,life:.4,size:.08});
  if(mm.broken<=0){ G.cash-=40; G.today.vc+=0; G.today.repairs=(G.today.repairs||0)+40; floatText(cellX(mm.c),2,cellZ(mm.r),'Fixed! −$40 parts','good'); sfx.good(); } }
function dayEvents(){ const d=G.day, t=G.t;
  once('o1'+d, t>(d===1?18:4), ()=>maybeOffer(d<=2));
  once('o2'+d, t>40, ()=>maybeOffer(false));
  once('o3'+d, G.expanded&&t>58, ()=>maybeOffer(false));
  once('bd2', d===2&&t>26, ()=>breakdown());
  once('rush', d===3&&t>8, ()=>{ newOffer({client:'BotMart', qty:60, price:46, due:4, rush:true, expires:3}); tip('rush'); });
  once('spike'+d, (d===4||d===5)&&t>0, ()=>{ G.steelMult=1.6; if(d===4) tip('spike'); });
  once('unspike', d>=6, ()=>{ G.steelMult=1; });
  once('rival', d===5&&t>6, ()=>{ G.rival={price:29, until:7}; rustyArrive(); tip('rival'); });
  once('rt'+d, G.rival&&d>5&&t>10, ()=>rusty(pick(['ScrapCo bots: half the quality, all the sales. Heh.','Still charging $'+G.price+'? My bots are $'+G.rival.price+'. Do the math, kid.','You can\'t beat cheap. Nobody beats cheap!'])));
  once('rivalEnd', G.rival&&d>G.rival.until, ()=>{ G.rival=null; rustyLeave(); });
  once('bdr'+d, d>=6&&d!==8&&t>(G.flags.bdt||(G.flags.bdt=rand(20,55))), ()=>{ G.flags.bdt=0; if(Math.random()<.55) breakdown(); });
  once('big', d===8&&t>6, ()=>{ if(G.expanded&&has('chip')) newOffer({client:'MegaMart', qty:30, price:72, due:9, deluxe:true, rush:true, expires:8}); else newOffer({client:'MegaMart', qty:80, price:44, due:9, rush:true, expires:8}); toast('<b>MegaMart</b> wants a giant order. Check Orders.','gold'); });
  once('exptip', G.tot.shipped>=ECON.expandNeed&&!G.expanded, ()=>tip('expand'));
  once('autotip', d===4&&t>30, ()=>tip('autoIdea'));
  if(G.autoBuy){ const pend=G.deliveries.reduce((a,x)=>a+x.n,0); if(G.stock+pend<18&&G.cash>400) buySteel(50); }
  if(G.stock<12&&G.opened) once('lowtip', true, ()=>tip('lowStock'));
  if(!G.flags.shipT||G.clock>G.flags.shipT){ G.flags.shipT=G.clock+28; if(G.today.made>0) sendShipTruck(); }
}

/* ---------- expansion ---------- */
function canExpand(){ return !G.expanded&&G.tot.shipped>=ECON.expandNeed&&G.cash>=ECON.expandCost; }
function expand(){ if(!canExpand()) return false; G.cash-=ECON.expandCost; G.today.capex+=ECON.expandCost; G.tot.capex+=ECON.expandCost; G.expanded=true; G.bounds=BIG;
  const old=G.ships[0]; scene.remove(old.g); G.grid[idx(old.c,old.r)]=null; G.ships=[];
  for(let c=GARAGE.c1;c<COLS-1;c++) if(!at(c,2)) placeBelt(c,2,0,true);
  addShip(COLS-1,2); addSupply(0,8); addShip(COLS-1,8); for(let c=1;c<COLS-1;c++) if(!at(c,8)) placeBelt(c,8,0,true);
  buildShell(G.bounds, docks(), true); milestone('expand');
  CAM.goal={tx:0,tz:0,dist:40}; sfx.fanfare(); return true; }

/* ---------- main sim step ---------- */
function simStep(dt){ G.t+=dt; G.clock+=dt;
  G.supplies.forEach(s=>stepSupply(s,dt)); for(const b of G.belts) stepBelt(b,dt); for(const mm of G.machines) stepMach(mm,dt);
  stepMarket(dt); stepReturns(); stepDeliveries(); dayEvents();
  G.shipTimes=G.shipTimes.filter(x=>x>G.clock-40);
  if(G.t>=DAY_LEN) endDay(); }
function endDay(){ G.t=DAY_LEN; G.paused=true; const F=fixedCosts(); G.cash-=F.total; const T=G.today;
  G.orders.forEach(o=>{ if(o.status==='active'&&o.due<=G.day&&o.got<o.qty){ o.status='late'; G.tot.ordersLate++; G.rep=clamp(G.rep-8,0,100); } if(o.status==='offer'&&o.expires<=G.day) o.status='expired'; });
  const repairs=T.repairs||0, varCost=T.mat+T.vc, fixed=F.total+repairs, net=T.rev-T.returns-varCost-fixed;
  const unit=T.made>0?(varCost+fixed)/T.made:null; if(unit&&(G.tot.bestUnit==null||unit<G.tot.bestUnit)) G.tot.bestUnit=unit;
  const E=econ();
  const rec={day:G.day, rev:T.rev, orderRev:T.orderRev, mktRev:T.mktRev, returns:T.returns, retN:T.retN, mat:T.mat, vc:T.vc, rent:F.rent, wages:F.wages, loan:F.loan, upkeep:F.upkeep, storage:F.storage, repairs, fixed, net, made:T.made, sold:T.sold, scrap:T.scrap, wasted:T.wasted, buy:T.buy, capex:T.capex, unit, be:E.be, cash:G.cash, rep:G.rep, emergency:false};
  if(net>0) { milestone('profit'); G.rep=clamp(G.rep+1,0,100); }
  if(G.cash<0){ G.cash+=ECON.emergency; G.extraInt+=ECON.emergencyInt; rec.emergency=true; }
  G.hist.push(rec); G.news=[];
  if(G.day===3) G.news.push('📈 <b>Steel news:</b> prices jump 60% for the next two days. Stock up today if you can afford it.');
  if(G.day===4) G.news.push('🦾 <b>Rumor:</b> ScrapCo is planning a price war.');
  if(G.day===7) G.news.push('🛒 <b>MegaMart</b> is shopping for a big supplier tomorrow.');
  showDayEnd(rec); }
function nextDay(){ G.day++; G.t=0; G.today=newDay(); G.flags.shipT=0; G.paused=false; G.mktAcc=0; }
