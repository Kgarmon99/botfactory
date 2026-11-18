/* ===================== BotFactory · simulation & economy ===================== */
/* Pure game logic. Everything visual or UI goes through the V hooks (see data.js). */
const G={mode:'title', day:1, t:0, clock:0, speed:1, paused:true, opened:false, over:false,
  cash:ECON.startCash, rep:60, morale:70, price:35, rush:false, autoBuy:true,
  grid:new Array(COLS*ROWS).fill(null), belts:[], splits:[], machines:[], supplies:[], ships:[],
  stock:ECON.startStock, stockVal:ECON.startStock*6, cheap:0, deliveries:[], steelMult:1, rival:null,
  fg:[], orders:[], oid:1, returnsQ:[], extraInt:0, loanCut:0, expanded:false, bounds:GARAGE, mktAcc:0,
  today:null, hist:[], shipTimes:[], flags:{}, ms:{}, news:[], upg:{}, streak:0, bestStreak:0, layoutVer:0,
  evq:[], evDone:[], boostDay:0, slowDay:0,
  tot:{shipped:0, sold:0, rev:0, returns:0, scrap:0, ordersDone:0, ordersLate:0, deluxe:0, wasted:0, capex:0, made:0, bestUnit:null, bonus:0},
  tool:'select', rot:0, sel:null};
const newDay=()=>({rev:0, orderRev:0, mktRev:0, bonus:0, returns:0, retN:0, mat:0, vc:0, made:0, sold:0, scrap:0, wasted:0, buy:0, capex:0, other:0, repairs:0, rushT:0, debt:0});
G.today=newDay();
const idx=(c,r)=>r*COLS+c;
const inB=(c,r,b)=>{ b=b||G.bounds; return c>=b.c0&&c<=b.c1&&r>=b.r0&&r<=b.r1; };
const at=(c,r)=>inB(c,r,BIG)?G.grid[idx(c,r)]:null;
let beltsDirty=true;
const dirty=()=>{ beltsDirty=true; G.layoutVer++; };
function spend(n,kind){ G.cash-=n; if(kind) G.today[kind]=(G.today[kind]||0)+n; if(kind==='capex') G.tot.capex+=n; }

/* ---------- building ---------- */
function canPlace(tool,c,r){ if(!inB(c,r)) return 'Outside your floor'; const t=at(c,r);
  if(tool==='belt'){ if(t&&t.k!=='belt') return 'Something is here'; if(!t&&G.cash<ECON.belt) return 'Not enough cash'; return ''; }
  if(tool==='splitter'){ if(t&&t.k!=='belt') return 'Put it on an empty tile or a belt'; if(G.cash<ECON.splitter) return 'Not enough cash'; return ''; }
  if(MACH[tool]){ if(MACH[tool].big&&!G.expanded) return 'Unlocks in the big factory'; if(t&&t.k!=='belt') return 'Something is here'; if(G.cash<MACH[tool].cost) return 'Not enough cash'; return ''; }
  if(tool==='bulldoze') return t&&(t.k==='belt'||t.k==='mach'||t.k==='split')?'':'Nothing to remove';
  return ''; }
function placeBelt(c,r,dir,free){ if(!inB(c,r)) return false; const t=at(c,r);
  if(t&&t.k==='belt'){ if(t.dir!==dir){ t.dir=dir; dirty(); } return true; }
  if(t||(!free&&G.cash<ECON.belt)) return false; if(!free) spend(ECON.belt,'capex');
  const b={k:'belt',c,r,dir,items:[],pop:free?0:1}; G.grid[idx(c,r)]=b; G.belts.push(b); dirty(); return true; }
function takeBelt(t){ G.belts.splice(G.belts.indexOf(t),1); dirty(); return t.items.map(e=>e.it); }
function placeSplitter(c,r,dir){ if(canPlace('splitter',c,r)) return null; const t=at(c,r); let carry=[];
  if(t&&t.k==='belt'){ dir=t.dir; carry=takeBelt(t); }
  spend(ECON.splitter,'capex'); const s={k:'split',c,r,dir,items:carry.slice(0,1).map(it=>({it,p:.5,from:(dir+2)%4})),rr:0}; G.grid[idx(c,r)]=s; G.splits.push(s); dirty(); V.split(s); return s; }
function placeMachine(type,c,r,dir){ if(canPlace(type,c,r)) return null; const t=at(c,r); let carry=[];
  if(t&&t.k==='belt'){ dir=t.dir; carry=takeBelt(t); }
  const d=MACH[type]; spend(d.cost,'capex');
  const m={k:'mach', type, c, r, dir, crew:0, staff:[], auto:false, inQ:carry.slice(0,2), cur:null, prog:0, out:null, pass:false, broken:0, util:0, made:0, state:'starved'};
  G.grid[idx(c,r)]=m; G.machines.push(m); addWorker(m, newWorker('steady')); dirty(); V.machine(m); V.crew(m); return m; }
function removeAt(c,r){ const t=at(c,r); if(!t) return false;
  if(t.k==='belt'){ takeBelt(t); G.grid[idx(c,r)]=null; return true; }
  if(t.k==='split'){ G.splits.splice(G.splits.indexOf(t),1); G.grid[idx(c,r)]=null; G.cash+=Math.round(ECON.splitter*.5); dirty(); V.unsplit(t); return true; }
  if(t.k==='mach'){ const m=t; const refund=Math.round(MACH[m.type].cost*.5)+(m.auto?Math.round(ECON.autoCost*.3):0); G.cash+=refund;
    V.float(c,r,'+'+fmt(refund)+' resale','good'); G.machines.splice(G.machines.indexOf(m),1); G.grid[idx(c,r)]=null; if(G.sel===m) G.sel=null; dirty(); V.unmachine(m); return true; }
  return false; }
function rotateMachine(mm){ mm.dir=(mm.dir+1)%4; dirty(); V.rotated(mm); }

/* ---------- workers ---------- */
let wseed=0;
function newWorker(trait){ return {name:NAMES[(wseed++*7+3)%NAMES.length], trait, days:0}; }
function candidates(m){ if(m.cands) return m.cands; const keys=Object.keys(TRAITS), out=[], s=(m.c*5+m.r*3+G.day+(m.hires||0))%keys.length; m.cands=out;
  out.push(newWorker('steady')); for(let i=0;out.length<3&&i<keys.length;i++){ const k=keys[(s+i*2)%keys.length]; if(!out.some(w=>w.trait===k)) out.push(newWorker(k)); } return out; }
function addWorker(m,w){ m.cands=null; m.staff.push(w); m.crew=m.staff.length; m.hires=(m.hires||0)+1; }
const wageOf=w=>TRAITS[w.trait].wage;
function hire(mm,w){ if(mm.auto||mm.staff.length>=2) return false; addWorker(mm, w||newWorker('steady')); V.crew(mm); V.sfx('good'); return true; }
function fire(mm){ if(mm.auto||!mm.staff.length) return; mm.staff.pop(); mm.crew=mm.staff.length; G.morale=clamp(G.morale-5,0,100); V.crew(mm); V.sfx('tick'); }
function automate(mm){ if(mm.auto||G.cash<ECON.autoCost) return false; spend(ECON.autoCost,'capex'); mm.auto=true; mm.staff=[]; mm.crew=0; V.crew(mm); V.puff(mm.c,mm.r,'#FACC15',14,{y:1.4,spread:1.2,life:.8}); V.sfx('build'); return true; }

/* ---------- docks ---------- */
function addSupply(c,r){ const s={k:'supply',c,r,timer:0,state:'ok'}; G.grid[idx(c,r)]=s; G.supplies.push(s); V.supply(s); return s; }
function addShip(c,r){ const s={k:'ship',c,r,bump:0}; G.grid[idx(c,r)]=s; G.ships.push(s); V.ship(s); return s; }
function docks(){ return [...G.supplies,...G.ships].map(d=>({c:d.c,r:d.r,k:d.k})); }
function setupFactory(){
  addSupply(0,2); addShip(9,2); for(let c=1;c<9;c++) placeBelt(c,2,0,true);
  G.cash=ECON.startCash; G.tot.capex=0; G.today=newDay();
  G.evq=EVENTS.map(e=>e.id).sort(()=>Math.random()-.5);
  V.shell(); }

/* ---------- item flow ---------- */
function tryPush(c,r,it,dir,hop){ if(!inB(c,r)) return false; const t=G.grid[idx(c,r)]; if(!t) return false;
  if(t.k==='belt'||t.k==='split'){ if(t.k==='belt'&&t.dir===(dir+2)%4) return false; if(t.k==='split'&&dir===(t.dir+2)%4) return false;
    const last=t.items[t.items.length-1]; if(last&&last.p<(t.k==='split'?.6:.36)) return false; if(t.k==='split'&&t.items.length>=2) return false; t.items.push({it,p:0,from:(dir+2)%4,hop}); return true; }
  if(t.k==='mach'){ if(dir===(t.dir+2)%4) return false; if(t.inQ.length>=2) return false; t.inQ.push(it); return true; }
  if(t.k==='ship'){ shipItem(t,it); return true; }
  return false; }
const beltSpeed=()=>ECON.beltSpeed*(G.rush?1.15:1)*(G.upg.belts?1.4:1);
function stepBelt(b,dt){ const sp=beltSpeed()*dt;
  for(let i=0;i<b.items.length;i++){ const e=b.items[i], lim=i===0?1:b.items[i-1].p-.34; e.p=Math.max(0,Math.min(lim,e.p+sp)); }
  const f=b.items[0]; if(f&&f.p>=1&&tryPush(b.c+DX[b.dir],b.r+DZ[b.dir],f.it,b.dir)) b.items.shift(); if(b.pop>0) b.pop=Math.max(0,b.pop-dt*3); }
const SPLIT_OUT=[0,1,3];
function stepSplit(s,dt){ const sp=beltSpeed()*dt*1.4;
  for(let i=0;i<s.items.length;i++){ const e=s.items[i], lim=i===0?1:s.items[i-1].p-.5; e.p=Math.max(0,Math.min(lim,e.p+sp)); }
  const f=s.items[0]; if(!f||f.p<1) return;
  for(let k=0;k<3;k++){ const o=SPLIT_OUT[(s.rr+k)%3], d=(s.dir+o)%4, nc=s.c+DX[d], nr=s.r+DZ[d], n=at(nc,nr); if(!n||n.k==='supply') continue;
    if(tryPush(nc,nr,f.it,d)){ s.items.shift(); s.rr=(s.rr+k+1)%3; s.last=d; return; } } }
const staffed=mm=>mm.auto||mm.staff.length>0;
const moraleMult=()=>.82+G.morale/100*.36;
const traitSpd=w=>TRAITS[w.trait].spd+(w.trait==='rookie'?Math.min(.3,w.days*.08):0);
function upgMult(type){ const U=G.upg; return ((type==='stamper'||type==='painter')&&U.dies?1.25:1)*((type==='assembler'||type==='chip')&&U.tools?1.3:1); }
function speedOf(mm){ let base;
  if(mm.auto) base=ECON.auto; else if(!mm.staff.length) return 0;
  else { const s=mm.staff; base=(s.length>=2?ECON.crew2:1)*(s.reduce((a,w)=>a+traitSpd(w),0)/s.length)*moraleMult(); }
  return base*(G.rush?ECON.rush:1)*upgMult(mm.type)*(G.slowDay===G.day?.9:1); }
function qualOf(mm){ if(mm.auto) return ECON.autoDefect; if(!mm.staff.length) return 1; return mm.staff.reduce((a,w)=>a+TRAITS[w.trait].q,0)/mm.staff.length; }
const cycleOf=mm=>MACH[mm.type].cycle/Math.max(.01,speedOf(mm));
const capOf=mm=>staffed(mm)?DAY_LEN/cycleOf(mm):0;
function canProcess(mm,it){ const d=MACH[mm.type]; if(d.kind==='qa') return it.s===3&&!it.q; if(d.kind==='pack') return it.s===3&&!it.b; if(d.kind==='chip') return it.s>=2&&!it.x&&!it.b; return it.s===d.from; }
function processItem(mm,it){ const d=MACH[mm.type]; mm.made++; mm.hit=1;
  if(d.kind==='qa'){ it.q=true; if(it.d){ it.dead=true; G.today.scrap++; G.tot.scrap++; V.puff(mm.c,mm.r,'#EF4444',8,{life:.6}); V.float(mm.c,mm.r,'Defect caught','bad'); V.sfx('buzz'); } return; }
  if(d.kind==='pack'){ it.b=true; G.today.vc+=d.vc; return; }
  if(d.kind==='chip'){ it.x=true; G.today.vc+=d.vc; return; }
  it.s=d.to; if(d.vc) G.today.vc+=d.vc;
  const ch=d.defect*qualOf(mm)*(G.rush?ECON.rushDefect:1)*(G.upg.lean?.5:1)*(it.cheap?3:1); if(Math.random()<ch) it.d=true;
  V.work(mm); }
function stepMach(mm,dt){
  if(mm.out&&tryPush(mm.c+DX[mm.dir],mm.r+DZ[mm.dir],mm.out,mm.dir,true)) mm.out=null;
  let busy=0;
  if(mm.broken>0){ mm.state='broken'; if(G.clock-mm.brokeAt>22){ mm.broken=0; spend(120,'repairs'); V.float(mm.c,mm.r,'Repair crew −$120','bad'); V.toast(`The repair crew fixed your ${MACH[mm.type].name} for <b>$120</b>. Tapping it yourself only costs $40!`); } }
  else { if(!mm.cur&&!mm.out&&mm.inQ.length){ mm.cur=mm.inQ.shift(); mm.prog=0; mm.pass=!canProcess(mm,mm.cur); }
    if(mm.cur){ if(!staffed(mm)) mm.state='nocrew';
      else { mm.prog+=dt/(mm.pass?.3:cycleOf(mm)); mm.state='work'; busy=mm.pass?0:1;
        if(mm.prog>=1){ const it=mm.cur; mm.cur=null; mm.prog=0; if(!mm.pass) processItem(mm,it); if(!it.dead) mm.out=it; } } }
    else mm.state=mm.out?'blocked':'starved';
    if(mm.out&&!mm.cur) mm.state='blocked'; }
  mm.util+=(busy-mm.util)*Math.min(1,dt/12); }
let feedCache={v:-1,ok:{}};
function feedsStamper(s){ if(feedCache.v!==G.layoutVer){ feedCache={v:G.layoutVer,ok:{}}; } const key=s.c+','+s.r; if(key in feedCache.ok) return feedCache.ok[key];
  const seen=new Set(), q=[[s.c+1,s.r,0]]; let ok=false;
  while(q.length&&seen.size<400){ const [c,r,dir]=q.shift(); if(!inB(c,r)) continue; const k=idx(c,r)*4+dir; if(seen.has(k)) continue; seen.add(k); const t=G.grid[idx(c,r)]; if(!t) continue;
    if(t.k==='mach'){ if(dir===(t.dir+2)%4) continue; if(t.type==='stamper'){ ok=true; break; } q.push([c+DX[t.dir],r+DZ[t.dir],t.dir]); }
    else if(t.k==='belt'){ if(t.dir===(dir+2)%4) continue; q.push([c+DX[t.dir],r+DZ[t.dir],t.dir]); }
    else if(t.k==='split'){ if(dir===(t.dir+2)%4) continue; SPLIT_OUT.forEach(o=>{ const d=(t.dir+o)%4; q.push([c+DX[d],r+DZ[d],d]); }); } }
  return feedCache.ok[key]=ok; }
const releaseT=()=>ECON.release/(G.rush?ECON.rush:1)/(G.upg.belts?1.3:1);
function stepSupply(s,dt){ s.timer-=dt; if(s.timer>0) return; if(!feedsStamper(s)){ s.state='idle'; s.timer=.5; return; } if(G.stock<1){ s.state='empty'; s.timer=.25; return; }
  const it={s:0}; if(G.cheap>0) it.cheap=true;
  if(tryPush(s.c+1,s.r,it,0)){ const avg=G.stockVal/G.stock; G.stock--; if(it.cheap) G.cheap--; G.stockVal=Math.max(0,G.stockVal-avg); G.today.mat+=avg; s.timer=releaseT(); s.state='ok'; }
  else { s.timer=.12; s.state='blocked'; } }
function itemValue(it){ return G.price+(it.b?ECON.boxBonus:0)+(it.x?ECON.deluxeBonus:0); }
function shipItem(s,it){ s.bump=1;
  if(it.s<3){ G.today.wasted++; G.tot.wasted++; V.float(s.c,s.r,'Unfinished part!','bad'); V.sfx('buzz'); V.tip('unfinished','That piece reached shipping <b>unfinished</b>, so it\'s wasted material. Every bot needs a Stamper, then an Assembler, then a Painter, in that order.'); return; }
  G.today.made++; G.tot.shipped++; G.shipTimes.push(G.clock); if(it.x){ G.tot.deluxe++; milestone('deluxe'); }
  milestone('first'); if(G.tot.shipped>=60) milestone('ship60'); if(G.tot.shipped>=300) milestone('ship300');
  if(G.tot.shipped===1) V.tip('firstShip'); G.fg.push(it); allocate(); }
const fits=(o,it)=>(o.deluxe?it.x:!it.x)&&(!o.boxed||it.b);
function allocate(){ const act=G.orders.filter(o=>o.status==='active').sort((a,b)=>a.due-b.due||a.id-b.id);
  for(const o of act){ while(o.got<o.qty){ const i=G.fg.findIndex(it=>fits(o,it)); if(i<0) break; const it=G.fg.splice(i,1)[0];
      const v=(o.deposit?(o.qty*o.price-o.deposit)/o.qty:o.price)+(it.b&&!o.boxed?ECON.boxBonus:0); o.got++; o.paid+=v; earn(v,'order',it); }
    if(o.got>=o.qty){ o.status='done'; G.tot.ordersDone++; G.rep=clamp(G.rep+3,0,100); G.streak++; G.bestStreak=Math.max(G.bestStreak,G.streak);
      const k=Math.min(G.streak,ECON.streakMax)*ECON.streakStep, bonus=Math.round((o.paid+(o.deposit||0))*k);
      if(bonus>0){ G.cash+=bonus; G.today.bonus+=bonus; G.tot.bonus+=bonus; }
      milestone('order'); if(G.streak>=3) milestone('streak3'); V.orderDone(o,bonus); } } }
function earn(v,kind,it){ G.cash+=v; G.today.rev+=v; G.tot.rev+=v; G.today.sold++; G.tot.sold++; if(kind==='order') G.today.orderRev+=v; else G.today.mktRev+=v;
  if(it.d) G.returnsQ.push({at:G.clock+rand(12,45), v}); V.sale(v,kind); }
const demandNow=()=>marketDemand(G.price,G.rep,G.expanded,G.rival,G.upg)*(G.boostDay===G.day?1.4:1);
function stepMarket(dt){ const rate=demandNow()/DAY_LEN; G.mktAcc+=rate*dt;
  while(G.mktAcc>=1&&G.fg.length){ let i=G.fg.findIndex(it=>!reservedFor(it)); if(i<0) break; const it=G.fg.splice(i,1)[0]; earn(itemValue(it),'market',it); G.mktAcc-=1; }
  if(!G.fg.length) G.mktAcc=Math.min(G.mktAcc,1); }
/* keep bots that an active order is waiting for */
function reservedFor(it){ return G.orders.some(o=>o.status==='active'&&o.got<o.qty&&fits(o,it)&&(o.deluxe||o.boxed||o.due<=G.day+1)); }
function stepReturns(){ for(let i=G.returnsQ.length-1;i>=0;i--){ const r=G.returnsQ[i]; if(G.clock<r.at) continue; G.returnsQ.splice(i,1);
  const cost=r.v+ECON.returnFee; G.cash-=cost; G.today.returns+=cost; G.today.retN++; G.tot.returns++; G.rep=clamp(G.rep-1.5,0,100);
  const s=G.ships[0]; if(s) V.float(s.c,s.r,'Returned broken −'+fmt(cost),'bad'); V.sfx('bad');
  if(!has('qa')) V.tip('returns'); } }

/* ---------- supply ---------- */
const steelPrice=each=>Math.round(each*G.steelMult*(G.upg.supplier?.85:1)*100)/100;
function buySteel(n){ const b=BULK.find(x=>x.n===n)||BULK[1], each=steelPrice(b.each), cost=Math.round(n*each);
  const pend=G.deliveries.reduce((a,d)=>a+d.n,0); if(G.stock+pend+n>ECON.maxStock) { V.toast('Your storage only holds '+ECON.maxStock+' sheets.','bad'); return false; }
  if(G.cash<cost){ V.toast('Not enough cash for that order.','bad'); return false; }
  spend(cost,'buy'); const d={n,cost,eta:G.clock+ECON.deliveryTime}; G.deliveries.push(d); V.truckIn(d); V.sfx('tick'); return true; }
function stepDeliveries(){ for(let i=G.deliveries.length-1;i>=0;i--){ const d=G.deliveries[i]; if(G.clock<d.eta) continue; G.deliveries.splice(i,1); G.stock+=d.n; G.stockVal+=d.cost; if(d.cheap) G.cheap+=d.n;
  const s=G.supplies[0]; if(s){ V.float(s.c,s.r,'+'+d.n+' steel','good'); V.puff(s.c,s.r,'#CBD5E1',8,{life:.5}); } V.sfx('thud'); } }

/* ---------- orders ---------- */
function newOffer(o){ o=Object.assign({id:G.oid++, client:pick(CLIENTS), got:0, paid:0, status:'offer', deluxe:false, boxed:false, expires:G.day},o); G.orders.push(o); V.offer(o); return o; }
function maybeOffer(force){ const offers=G.orders.filter(o=>o.status==='offer').length, act=G.orders.filter(o=>o.status==='active').length;
  if(offers>=2||act>=3) return; if(!force&&Math.random()>.45+G.rep/180) return;
  const deluxe=G.expanded&&has('chip')&&Math.random()<.4, boxed=!deluxe&&has('packer')&&Math.random()<.45, big=G.expanded;
  if(!deluxe&&G.t<30&&G.day>1&&Math.random()<.25){ const qty=randi(5,9); return newOffer({qty, price:randi(50,56), due:G.day, rush:true, sameDay:true}); }
  const qty=deluxe?randi(8,16):randi(big?18:8,big?36:18);
  return newOffer({qty, price:deluxe?randi(66,76):randi(40,46)+(boxed?8:0), due:G.day+(qty>24?2:1), deluxe, boxed}); }
function acceptOrder(o){ if(o.status!=='offer') return; o.status='active'; allocate(); V.sfx('good'); }
function passOrder(o){ if(o.status!=='offer') return; o.status='passed'; V.sfx('tick'); }

/* ---------- R&D ---------- */
function canUpg(id){ const u=UPG[id]; if(G.upg[id]) return 'Owned'; if(u.need==='rep70'&&G.rep<70) return 'Needs reputation 70'; if(G.cash<u.cost) return 'Need '+fmt(u.cost); return ''; }
function buyUpg(id){ if(canUpg(id)) return false; const u=UPG[id]; spend(u.cost,'capex'); G.upg[id]=G.day;
  if(id==='breakroom') G.morale=clamp(G.morale+15,0,100); milestone('upgrade'); V.upgraded(id); return true; }

/* ---------- economics readouts ---------- */
function fixedCosts(){ const rent=G.expanded?ECON.rentBig:ECON.rentGarage; let wages=0, upkeep=0;
  G.machines.forEach(mm=>{ wages+=mm.staff.reduce((a,w)=>a+wageOf(w),0); upkeep+=MACH[mm.type].cost*ECON.upkeepPct+(mm.auto?ECON.autoUpkeep:0); });
  upkeep+=G.splits.length*2;
  const loan=Math.max(0,ECON.loanInt-G.loanCut)+G.extraInt, storage=G.stock*ECON.holdSheet+G.fg.length*ECON.holdBot;
  return {rent, wages, upkeep, loan, storage, total:rent+wages+upkeep+loan+storage}; }
function has(type){ return G.machines.some(mm=>mm.type===type); }
function econ(){ const F=fixedCosts(); const sheet=G.stock>0?G.stockVal/G.stock:steelPrice(6);
  const v=sheet+(has('assembler')?4:0)+(has('painter')?2:0)+(has('packer')?1.5:0)+(has('chip')?9:0), peff=G.price+(has('packer')?ECON.boxBonus:0)+(has('chip')?ECON.deluxeBonus:0);
  const caps={}; G.machines.forEach(mm=>{ caps[mm.type]=(caps[mm.type]||0)+(mm.broken?0:capOf(mm)); });
  let cap=G.supplies.filter(s=>feedsStamper(s)).length*DAY_LEN/releaseT(), capBy='Steel docks';
  CORE.forEach(t=>{ const c=caps[t]||0; if(c<cap){ cap=c; capBy=MACH[t].name; } });
  ['qa','packer','chip'].forEach(t=>{ if(caps[t]!=null&&caps[t]<cap){ cap=caps[t]; capBy=MACH[t].name; } });
  const win=Math.min(30,Math.max(1,G.t+(G.day>1?30:0))); const recent=G.shipTimes.filter(x=>x>G.clock-30).length; let pace=G.opened?recent/win*DAY_LEN:0;
  if(G.opened&&recent<4) pace=Math.max(pace,cap*.8); pace=Math.min(pace,cap||pace);
  const margin=peff-v, be=margin>0?Math.ceil(F.total/margin):Infinity, unit=pace>0?F.total/pace+v:Infinity;
  return {F, v, sheet, peff, margin, be, cap, capBy, pace, unit, demand:demandNow()}; }
function bottleneck(){ if(!G.opened) return null; let best=null; G.machines.forEach(mm=>{ if(mm.broken||!staffed(mm)) return; if(mm.util>.8&&mm.inQ.length>=1&&(!best||mm.util>best.util)) best=mm; }); return best; }

/* ---------- events ---------- */
function once(key,cond,fn){ if(!G.flags[key]&&cond){ G.flags[key]=1; fn(); } }
function breakdown(mm){ if(!mm){ const c=G.machines.filter(x=>!x.broken&&staffed(x)&&CORE.includes(x.type)).sort((a,b)=>b.util-a.util); mm=c[0]; } if(!mm) return;
  mm.broken=mm.auto?3:5; mm.brokeAt=G.clock; V.puff(mm.c,mm.r,'#F97316',14,{y:1.5,spread:1.2,life:.7}); V.sfx('bang'); V.tip('breakdown'); V.broke(mm); }
function whack(mm){ if(!mm.broken) return; mm.broken--; V.sfx('clang'); mm.shake=1; V.puff(mm.c,mm.r,'#FDE68A',5,{y:1.3,spread:1.6,life:.4,size:.08});
  if(mm.broken<=0){ spend(40,'repairs'); V.float(mm.c,mm.r,'Fixed! −$40 parts','good'); V.sfx('good'); } }
function startDecision(){ const id=G.evq.find(x=>!G.evDone.includes(x)); if(!id) return; const ev=EVENTS.find(e=>e.id===id); if(ev.id==='refi'&&G.cash<1700) return; G.evDone.push(id); G.evCur=ev; V.decision(ev); }
function resolveDecision(yes){ const ev=G.evCur; if(!ev) return; G.evCur=null; const T=G.today; let msg='';
  switch(ev.id){
    case 'influencer': if(yes){ let n=0; for(let i=G.fg.length-1;i>=0&&n<6;i--){ if(!G.fg[i].x){ G.fg.splice(i,1); n++; } } const miss=6-n; T.other+=n*8+miss*12; G.cash-=miss*12; G.rep=clamp(G.rep+8,0,100); G.boostDay=G.day+1; msg='The video is up! Reputation +8, and tomorrow brings 40% more shoppers.'; } break;
    case 'cheapsteel': if(yes){ spend(180,'buy'); const d={n:60,cost:180,eta:G.clock+ECON.deliveryTime,cheap:true}; G.deliveries.push(d); V.truckIn(d); msg='60 cheap sheets are on the way. Watch your defect rate…'; } break;
    case 'pizza': if(yes){ spend(90,'other'); G.morale=clamp(G.morale+14,0,100); msg='Pizza party! Crew mood +14.'; } else G.morale=clamp(G.morale-6,0,100); break;
    case 'noise': if(yes){ spend(90,'repairs'); msg='Serviced. Purring like a kitten.'; } else G.flags.noiseAt=G.t+rand(8,22); break;
    case 'refi': if(yes&&G.cash>=1500){ G.cash-=1500; T.debt+=1500; G.loanCut+=15; msg='Loan interest is now $15/day lower.'; } break;
    case 'inspector': if(yes){ spend(140,'other'); G.rep=clamp(G.rep+4,0,100); G.morale=clamp(G.morale+6,0,100); msg='Inspector approved! Reputation +4.'; } else if(Math.random()<.5){ spend(250,'other'); msg='Fined $250 for missing guards. Ouch.'; } else msg='The inspector didn\'t notice. Lucky this time.'; break;
    case 'tour': if(yes){ G.slowDay=G.day; G.rep=clamp(G.rep+6,0,100); G.morale=clamp(G.morale+5,0,100); msg='The kids loved it. Reputation +6.'; } break;
    case 'bulkbuyer': if(yes){ G.cash+=300; T.orderRev+=300; T.rev+=300; G.tot.rev+=300; const o=newOffer({client:'Robo Rama', qty:15, price:30, due:G.day+1, deposit:300, expires:G.day}); o.status='active'; allocate(); msg='$300 deposit received. Now deliver 15 bots by tomorrow!'; } break; }
  if(msg) V.toast(msg, yes?'good':''); }
function dayEvents(){ const d=G.day, t=G.t;
  once('o1'+d, t>(d===1?16:4), ()=>maybeOffer(d<=2));
  once('o2'+d, t>35, ()=>maybeOffer(false));
  once('o3'+d, G.expanded&&t>55, ()=>maybeOffer(false));
  once('bd2', d===2&&t>30, ()=>breakdown());
  once('ev'+d, d>=2&&d<=9&&t>(d===3||d===8?40:20), ()=>startDecision());
  once('rush', d===3&&t>8, ()=>{ newOffer({client:'BotMart', qty:55, price:46, due:4, rush:true, expires:3}); V.tip('rush'); });
  once('spike'+d, (d===4||d===5)&&t>0, ()=>{ G.steelMult=1.6; if(d===4) V.tip('spike'); });
  once('unspike', d>=6, ()=>{ G.steelMult=1; });
  once('rival', d===5&&t>6, ()=>{ G.rival={price:29, until:7}; V.rustyArrive(); V.tip('rival'); });
  once('rt'+d, G.rival&&d>5&&t>10, ()=>V.rustyTaunt());
  once('rivalEnd', G.rival&&d>G.rival.until, ()=>{ G.rival=null; V.rustyLeave(); });
  once('bdr'+d, d>=6&&d!==8&&t>(G.flags.bdt||(G.flags.bdt=rand(20,55))), ()=>{ G.flags.bdt=0; if(Math.random()<(G.upg.sensors?.2:.5)) breakdown(); });
  if(G.flags.noiseAt&&t>G.flags.noiseAt){ G.flags.noiseAt=0; breakdown(); }
  once('big', d===8&&t>6, ()=>{ if(G.expanded&&has('chip')) newOffer({client:'MegaMart', qty:30, price:74, due:9, deluxe:true, rush:true, expires:8}); else newOffer({client:'MegaMart', qty:70, price:44, due:9, rush:true, expires:8}); V.toast('<b>MegaMart</b> wants a giant order. Check Orders.','gold'); });
  once('exptip', G.tot.shipped>=ECON.expandNeed&&!G.expanded, ()=>V.tip('expand'));
  once('autotip', d===4&&t>30, ()=>V.tip('autoIdea'));
  once('rndtip', G.cash>1200&&G.opened&&!Object.keys(G.upg).length&&d>=2, ()=>V.tip('rnd'));
  once('spltip', G.expanded&&t>20&&!G.splits.length, ()=>V.tip('splitter'));
  if(G.morale<40) once('moodtip', true, ()=>V.tip('mood'));
  if(G.autoBuy){ const pend=G.deliveries.reduce((a,x)=>a+x.n,0); if(G.stock+pend<(G.expanded?40:20)&&G.cash>400) buySteel(G.expanded&&G.cash>900?100:50); }
  if(G.stock<12&&G.opened) once('lowtip', true, ()=>V.tip('lowStock'));
  if(!G.flags.shipT||G.clock>G.flags.shipT){ G.flags.shipT=G.clock+26; if(G.today.made>0) V.truckOut(); }
}

/* ---------- expansion ---------- */
function canExpand(){ return !G.expanded&&G.tot.shipped>=ECON.expandNeed&&G.cash>=ECON.expandCost; }
function expand(){ if(!canExpand()) return false; spend(ECON.expandCost,'capex'); G.expanded=true; G.bounds=BIG;
  const old=G.ships[0]; V.unship(old); G.grid[idx(old.c,old.r)]=null; G.ships=[];
  for(let c=GARAGE.c1;c<COLS-1;c++) if(!at(c,2)) placeBelt(c,2,0,true);
  addShip(COLS-1,2); addSupply(0,8); addShip(COLS-1,8); for(let c=1;c<COLS-1;c++) if(!at(c,8)) placeBelt(c,8,0,true);
  V.shell(); milestone('expand'); V.expanded(); return true; }

/* ---------- goals & milestones ---------- */
function milestone(id){ if(G.ms[id]) return; G.ms[id]=G.day; V.milestone(MILESTONES.find(x=>x.id===id)); }
function grant(amt,why){ G.cash+=amt; G.today.bonus+=amt; G.tot.bonus+=amt; V.grant(amt,why); }

/* ---------- main sim step ---------- */
function simStep(dt){ G.t+=dt; G.clock+=dt; if(G.rush) G.today.rushT+=dt;
  G.supplies.forEach(s=>stepSupply(s,dt)); for(const b of G.belts) stepBelt(b,dt); for(const s of G.splits) stepSplit(s,dt); for(const mm of G.machines) stepMach(mm,dt);
  stepMarket(dt); stepReturns(); stepDeliveries(); dayEvents();
  if(G.shipTimes.length>400||(G.shipTimes[0]<G.clock-40)) G.shipTimes=G.shipTimes.filter(x=>x>G.clock-40);
  if(G.t>=DAY_LEN) endDay(); }
function endDay(){ G.t=DAY_LEN; G.paused=true; const F=fixedCosts(); G.cash-=F.total; const T=G.today;
  G.orders.forEach(o=>{ if(o.status==='active'&&o.due<=G.day&&o.got<o.qty){ o.status='late'; G.tot.ordersLate++; G.rep=clamp(G.rep-8,0,100); G.streak=0; if(o.deposit){ G.cash-=o.deposit; T.returns+=o.deposit; } } if(o.status==='offer'&&o.expires<=G.day) o.status='expired'; });
  const varCost=T.mat+T.vc, fixed=F.total+T.repairs, net=T.rev+T.bonus-T.returns-varCost-fixed-T.other;
  const unit=T.made>0?(varCost+fixed)/T.made:null; if(unit&&(G.tot.bestUnit==null||unit<G.tot.bestUnit)) G.tot.bestUnit=unit;
  const E=econ();
  /* crew mood drifts with how the day went */
  const cheer=G.machines.reduce((a,m)=>a+m.staff.filter(w=>w.trait==='cheerful').length,0);
  let dm=Math.round((G.upg.breakroom?3:0)+cheer*2+(net>0?2:-3)-(T.rushT>15?9:0)+(62-G.morale)*.15); G.morale=clamp(G.morale+dm,0,100);
  G.machines.forEach(m=>m.staff.forEach(w=>w.days++));
  const rec={day:G.day, rev:T.rev, orderRev:T.orderRev, mktRev:T.mktRev, bonus:T.bonus, returns:T.returns, retN:T.retN, mat:T.mat, vc:T.vc, rent:F.rent, wages:F.wages, loan:F.loan, upkeep:F.upkeep, storage:F.storage, repairs:T.repairs, other:T.other, fixed, net, made:T.made, sold:T.sold, scrap:T.scrap, wasted:T.wasted, buy:T.buy, capex:T.capex, debt:T.debt, unit, be:E.be, cash:G.cash, rep:G.rep, morale:G.morale, dm, emergency:false};
  if(net>0) { milestone('profit'); G.rep=clamp(G.rep+1,0,100); }
  if(G.cash<0){ G.cash+=ECON.emergency; G.extraInt+=ECON.emergencyInt; rec.emergency=true; }
  G.hist.push(rec); G.news=[];
  if(G.day===3) G.news.push('📈 <b>Steel news:</b> prices jump 60% for the next two days. Stock up today if you can afford it.');
  if(G.day===4) G.news.push('🦾 <b>Rumor:</b> ScrapCo is planning a price war.');
  if(G.day===7) G.news.push('🛒 <b>MegaMart</b> is shopping for a big supplier tomorrow.');
  V.dayEnd(rec); }
function nextDay(){ G.day++; G.t=0; G.today=newDay(); G.flags.shipT=0; G.paused=false; G.mktAcc=0; }
function grade(){ const profit=G.hist.reduce((a,h)=>a+h.net,0), done=G.tot.ordersDone, late=G.tot.ordersLate;
  const p=clamp((profit+1000)/10000,0,1)*40, rp=G.rep/100*20, op=(done+late?done/(done+late):.4)*15, q=(1-G.tot.returns/Math.max(1,G.tot.sold)*3)*10, ms=Object.keys(G.ms).length/MILESTONES.length*15;
  const s=p+rp+op+Math.max(0,q)+ms; const L=s>=90?'A+':s>=80?'A':s>=68?'B':s>=55?'C':s>=42?'D':'F'; return {s:Math.round(s), L, profit, parts:{p,rp,op,q,ms}}; }
