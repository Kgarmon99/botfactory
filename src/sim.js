/* =====================================================================
   BOTFACTORY · simulation (no graphics in here: testable on its own)
   ===================================================================== */
const rand=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rand(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)], clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const money=n=>(n<0?'-$':'$')+Math.round(Math.abs(n)).toLocaleString('en-US');
const short=n=>{const a=Math.abs(n),s=n<0?'-':'';return a>=1e6?s+'$'+(a/1e6).toFixed(a>=1e7?0:1)+'M':a>=1e4?s+'$'+Math.round(a/1e3)+'K':s+'$'+Math.round(a).toLocaleString('en-US');};
let S=null;                 /* the saved game */
const EV=[];                /* events for the view layer: {k, ...} */
const emit=(ev,o)=>EV.push(Object.assign({},o||{},{ev}));

function newStation(k,built){return {k,built:!!built,tier:0,crew:1,q:[],cur:null,prog:0,out:null,wear:rand(0,.15),broken:false,crewT:0,boost:0,needsCode:false,util:0,made:0,blocked:false};}
function newLine(i){const st={};ST_KEYS.forEach(k=>st[k]=newStation(k,k==='cut'||k==='weld'||k==='asm'));return {i,st,belt:[],job:{product:i===0?'kart':'toy',cid:null},spawnT:0};}
function newGame(name){
  S={v:2,name:name||'Boss',cash:ECON.startCash,rep:50,day:1,stage:0,phase:'board',clock:0,speed:1,
     lines:[newLine(0)],offers:[],contracts:[],cid:1,flags:{},stats:{shipped:0,rev:0,profit:0,best:0,contracts:0,late:0,fixed:0,games:0,scrap:0,returns:0},
     today:null,hist:[],combo:0,tech:{},rush:null,returnsQ:[],gameCD:{}};
  makeOffers();return S;}
const lineCount=()=>STAGES[S.stage].lines;
const shipX=()=>STAGES[S.stage].wide?16.2:4.6;
const stationsOn=l=>ST_KEYS.filter(k=>l.st[k].built&&(STAGES[S.stage].wide||!['paint','qa'].includes(k)));
function canMake(l,p){const P=PRODUCTS[p];if(P.stage>S.stage)return 'Unlocks at '+STAGES[P.stage].name;
  const miss=P.needs.filter(k=>!l.st[k].built);if(miss.length)return 'Needs '+miss.map(k=>STATIONS[k].name).join(' + ');
  const bots=ST_KEYS.filter(k=>l.st[k].tier===2).length;if((P.robots||0)>bots)return `Needs ${P.robots} robot cell${P.robots>1?'s':''} on this line`;return '';}
/* units per shift if nothing breaks: the slowest required station sets the pace */
function capacity(l,p){const P=PRODUCTS[p||l.job.product];let best=1e9,by='';P.needs.forEach(k=>{const c=stationCap(l.st[k],k);if(c<best){best=c;by=k;}});return {n:Math.floor(best),by};}
/* the speed of one station, and how many units it can do in a shift */
const crewMul=s=>s.tier<2&&(s.crew||1)>=2?1.6:1;
function stationSpeed(s){return TIERS[s.tier].speed*crewMul(s)*techSpeed();}
function stationCap(s,k){return SHIFT_LEN*stationSpeed(s)/STATIONS[k].cycle*.93;}
/* what the line would make if this station changed (for the fix card) */
function previewCap(l,k,ch){const s=l.st[k],old={tier:s.tier,crew:s.crew};Object.assign(s,ch);const c=capacity(l);Object.assign(s,old);return c;}
function hireCrew(li,k){const s=S.lines[li].st[k];if(s.tier===2)return 'Robots don\'t need a crew';if((s.crew||1)>=2)return 'Already has 2 workers';if(S.cash<ECON.hireFee)return 'Need '+money(ECON.hireFee);S.cash-=ECON.hireFee;if(S.today)S.today.capex+=ECON.hireFee;s.crew=2;emit('hired',{li,k});return '';}
function bottleneckOf(l){return capacity(l).by;}

/* ---------- contracts ---------- */
function makeOffers(){S.offers=S.offers.filter(o=>o.ttl>S.day);
  const avail=Object.keys(PRODUCTS).filter(p=>PRODUCTS[p].stage<=S.stage);
  while(S.offers.length<3){const p=pick(avail),P=PRODUCTS[p],L=S.lines[0],cap=Math.max(8,capacity(L,p).n||12),
      days=ri(1,3),qty=Math.max(6,Math.round(cap*days*rand(.55,.95)/2)*2),repK=.9+S.rep/500;
    S.offers.push({id:S.cid++,client:pick(CLIENTS),p,qty,price:Math.round(P.price*ECON.contractBonus*repK),days,bonus:Math.round(P.price*qty*.08/10)*10,ttl:S.day+2});}}
function acceptOffer(id,li){const o=S.offers.find(x=>x.id===id),l=S.lines[li];if(!o||!l)return 'Gone';const why=canMake(l,o.p);if(why)return why;
  if(l.job.cid)return 'That line already has a contract';
  S.offers=S.offers.filter(x=>x!==o);const c=Object.assign({},o,{line:li,got:0,due:S.day+o.days-1});S.contracts.push(c);l.job={product:o.p,cid:c.id};emit('contract',{c});return '';}
function setProduct(li,p){const l=S.lines[li];if(l.job.cid)return 'Finish or drop the contract first';const why=canMake(l,p);if(why)return why;l.job={product:p,cid:null};l.belt=[];ST_KEYS.forEach(k=>{const s=l.st[k];s.q=[];s.cur=null;s.out=null;s.prog=0;});return '';}
function contractOf(l){return l.job.cid?S.contracts.find(c=>c.id===l.job.cid):null;}

/* ---------- money moves ---------- */
function upgradeCost(l,k){const s=l.st[k];if(!s.built)return STATIONS[k].buildCost;return s.tier<2?UP_COST[k][s.tier+1]:null;}
function upgrade(li,k){const l=S.lines[li],s=l.st[k],c=upgradeCost(l,k);if(c==null)return 'Already maxed';if(S.cash<c)return 'Need '+money(c);
  if(!s.built&&!STAGES[S.stage].wide)return 'Expand to the Workshop first';
  S.cash-=c;S.today&&(S.today.capex+=c);if(!s.built){s.built=true;s.tier=0;}else{s.tier++;if(s.tier===2){if(S.flags['prog_'+k])emit('autoprog',{li,k});else s.needsCode=true;}}
  s.wear=0;emit('upgrade',{li,k,tier:s.tier});return '';}
function service(li,k){const s=S.lines[li].st[k];if(S.cash<ECON.serviceCost)return 'Not enough cash';S.cash-=ECON.serviceCost;if(S.today)S.today.repairs+=ECON.serviceCost;s.wear=0;emit('serviced',{li,k});return '';}
function expandCost(){const n=STAGES[S.stage+1];return n?n.cost:null;}
function expand(){const c=expandCost();if(c==null)return 'Maxed out';if(S.cash<c)return 'Need '+money(c);S.cash-=c;S.stage++;
  while(S.lines.length<lineCount()){const l=newLine(S.lines.length);l.st.paint.built=l.st.qa.built=S.stage>=2;S.lines.push(l);}
  if(S.today)S.today.capex+=c;makeOffers();emit('expand',{stage:S.stage});return '';}
function fixStation(li,k,byPlayer){const s=S.lines[li].st[k];if(!s.broken)return;s.broken=false;s.wear=0;const c=byPlayer?ECON.repairParts:Math.round(ECON.repairCrew*(S.tech.drones?.5:1));S.cash-=c;if(S.today)S.today.repairs+=c;if(byPlayer)S.stats.fixed++;emit('fixed',{li,k,byPlayer,c});}
function boostStation(li,k,secs){const s=S.lines[li].st[k];s.boost=Math.max(s.boost,secs);}

/* ---------- the shift ---------- */
function startShift(){S.phase='day';S.clock=0;S.today={rev:0,mat:0,capex:0,repairs:0,returns:0,retN:0,scrap:0,shipped:0,byLine:S.lines.map(()=>0),bonus:0,games:0,best:0};
  S.today.goal=missionFor();S.today.oee=S.lines.map(()=>({plan:0,down:0,made:0,bad:0,ideal:0}));S.rush=null;S.rushAt=S.day>=2?rand(.25,.7):9;emit('open');}
function itemsNear(l,x,y0){return l.belt.some(it=>Math.abs(it.x-x)<.86);}
function stepLine(l,dt){const P=PRODUCTS[l.job.product],need=P.needs,route=ST_KEYS.filter(k=>need.includes(k)||(k==='qa'&&l.st.qa.built&&STAGES[S.stage].wide)),sx=shipX();
  /* OEE bookkeeping: planned time, downtime, ideal rate */
  const O=S.today.oee&&S.today.oee[l.i];if(O){O.plan+=dt;if(route.some(k=>l.st[k].broken||l.st[k].needsCode))O.down+=dt;O.ideal=Math.min(...route.map(k=>stationSpeed(l.st[k])/STATIONS[k].cycle));}
  /* release raw steel when the first stop has room */
  const first=l.st[route[0]];l.spawnT-=dt;
  if(l.spawnT<=0&&first.q.length+l.belt.filter(it=>it.next===route[0]).length<3&&!itemsNear(l,DOCK_IN_X+.4)){
    l.belt.push({x:DOCK_IN_X+.4,next:route[0],d:false,p:l.job.product,lvl:0});S.today.mat+=P.mat*(S.flags.millPartner?.85:1);l.spawnT=.35;}
  /* belt: move toward the next stop, keep spacing, stop at a full queue */
  l.belt.sort((a,b)=>b.x-a.x);let ahead=1e9;
  for(let i=0;i<l.belt.length;i++){const it=l.belt[i],stopX=it.next==='ship'?sx:SLOT_X[it.next]-.55;
    let nx=Math.min(it.x+ECON.beltSpeed*dt,stopX,ahead-.86);if(nx<it.x)nx=it.x;it.x=nx;ahead=it.x;
    if(it.x>=stopX-.01){if(it.next==='ship'){l.belt.splice(i,1);i--;ship(l,it);ahead=1e9;continue;}
      const s=l.st[it.next];if(s.q.length<ECON.queueMax){s.q.push(it);l.belt.splice(i,1);i--;ahead=1e9;}}}
  /* stations */
  for(const k of ST_KEYS){const s=l.st[k];if(!s.built)continue;
    if(s.boost>0)s.boost-=dt;
    if(s.out){const ox=SLOT_X[k]+.7;if(!itemsNear(l,ox)){s.out.x=ox;l.belt.push(s.out);s.out=null;s.blocked=false;}else s.blocked=true;}
    let busy=0;
    if(s.broken){s.crewT-=dt;if(s.crewT<=0){fixStation(l.i,k,false);emit('crew',{li:l.i,k});}}
    else if(!s.needsCode){
      if(!s.cur&&!s.out&&s.q.length){s.cur=s.q.shift();s.prog=0;}
      if(s.cur){busy=1;const T=TIERS[s.tier];s.prog+=dt*stationSpeed(s)*(s.boost>0?2:1)/STATIONS[k].cycle;
        s.wear+=dt*(s.tier===2?.0016:.0028);
        if(s.prog>=1){const it=s.cur;s.cur=null;s.prog=0;s.made++;
          if(k==='qa'){if(it.d){S.today.scrap++;S.stats.scrap++;const O2=S.today.oee&&S.today.oee[l.i];if(O2){O2.made++;O2.bad++;}emit('scrap',{li:l.i});it.dead=true;}}
          else if(Math.random()<T.defect*(s.boost>0?.2:1))it.d=true;
          it.lvl=ST_KEYS.indexOf(k)+1;
          if(!it.dead){const ri2=route.indexOf(k);it.next=route[ri2+1]||'ship';s.out=it;}}
        if(s.wear>.6&&Math.random()<(s.wear-.6)*dt*.05*(S.tech.screens?.7:1)){s.broken=true;s.crewT=S.tech.drones?8:ECON.crewTime;s.cur&&s.q.unshift(s.cur);s.cur=null;emit('break',{li:l.i,k});}}}
    s.util+=(busy-s.util)*Math.min(1,dt/6);}
}
function ship(l,it){const P=PRODUCTS[it.p],c=contractOf(l);let v;
  if(c&&c.got<c.qty){v=c.price;c.got++;if(c.got>=c.qty){S.cash+=c.bonus;S.today.bonus+=c.bonus;S.stats.contracts++;S.rep=clamp(S.rep+5,0,100);
      S.contracts=S.contracts.filter(x=>x!==c);l.job.cid=null;emit('contractDone',{c,li:l.i});}}
  else v=Math.round(P.price*ECON.marketCut);
  {const O=S.today.oee&&S.today.oee[l.i];if(O){O.made++;if(it.d)O.bad++;}}
  S.cash+=v;S.today.rev+=v;S.today.shipped++;S.today.byLine[l.i]++;S.stats.shipped++;S.stats.rev+=v;
  if(it.d&&S.tech.dog&&Math.random()<.5){it.d=false;emit('dogCatch',{li:l.i});}
  if(it.d)S.returnsQ.push({at:S.clock+rand(8,40),v,li:l.i});
  if(S.rush&&S.rush.t>0){S.rush.got++;if(S.rush.got>=S.rush.need){S.cash+=S.rush.bonus;S.today.bonus+=S.rush.bonus;emit('rushDone',{b:S.rush.bonus});S.rush=null;}}
  emit('ship',{li:l.i,v});}
function stepShift(dt){if(S.phase!=='day')return;S.clock+=dt;
  for(const l of S.lines.slice(0,lineCount()))stepLine(l,dt);
  for(let i=S.returnsQ.length-1;i>=0;i--){const r=S.returnsQ[i];if(S.clock<r.at)continue;S.returnsQ.splice(i,1);const c=r.v+ECON.returnFee;S.cash-=c;S.today.returns+=c;S.today.retN++;S.stats.returns++;S.rep=clamp(S.rep-.6,0,100);emit('return',{li:r.li,c});}
  if(!S.rush&&S.clock>S.rushAt*SHIFT_LEN&&S.rushAt<2){S.rushAt=9;const cap=S.lines.reduce((a,l,i)=>a+(i<lineCount()?capacity(l).n:0),0);S.rush={need:Math.max(4,Math.round(cap*.22)),got:0,t:42,bonus:Math.round(cap*12/10)*10+150};emit('rush',{r:S.rush});}
  if(S.rush){S.rush.t-=dt;if(S.rush.t<=0){emit('rushFail');S.rush=null;}}
  if(S.clock>=SHIFT_LEN)endShift();}
function endShift(){S.phase='report';const T=S.today,st=S.lines.slice(0,lineCount()).flatMap(l=>stationsOn(l).map(k=>l.st[k]));
  T.wages=st.reduce((a,s)=>a+TIERS[s.tier].wage*(s.tier<2?(s.crew||1):0),0);T.upkeep=st.reduce((a,s)=>a+TIERS[s.tier].upkeep,0);T.rent=STAGES[S.stage].rent;
  /* anything still out there comes back at the end of the day */
  S.returnsQ.forEach(r=>{const c=r.v+ECON.returnFee;T.returns+=c;T.retN++;S.stats.returns++;S.rep=clamp(S.rep-.6,0,100);});S.returnsQ=[];
  if(!T.retN&&T.shipped)S.rep=clamp(S.rep+2,0,100);
  const G2=T.goal;T.stars=G2?(T.shipped>=G2[2]?3:T.shipped>=G2[1]?2:T.shipped>=G2[0]?1:0):0;T.starBonus=T.stars*(60+S.stage*90);T.bonus+=T.starBonus;S.cash+=T.starBonus;S.stats.stars=(S.stats.stars||0)+T.stars;
  T.fixed=T.wages+T.rent+T.upkeep;T.variable=T.mat;T.net=T.rev+T.bonus-T.mat-T.fixed-T.repairs-T.returns;
  S.cash-=T.fixed+T.returns;
  T.unit=T.shipped?(T.mat+T.fixed+T.repairs)/T.shipped:null;
  /* missed deadlines */
  T.late=[];S.contracts.forEach(c=>{if(c.due<=S.day&&c.got<c.qty){T.late.push(c);S.stats.late++;S.rep=clamp(S.rep-9,0,100);const l=S.lines[c.line];if(l)l.job.cid=null;}});S.contracts=S.contracts.filter(c=>!T.late.includes(c));
  T.day=S.day;T.cash=S.cash;T.stage=S.stage;S.stats.profit+=T.net;S.stats.best=Math.max(S.stats.best,T.net);S.hist.push(T);if(S.hist.length>40)S.hist.shift();
  S.lines.forEach(l=>{l.belt=[];ST_KEYS.forEach(k=>{const s=l.st[k];s.q=[];s.cur=null;s.out=null;s.prog=0;s.boost=0;if(s.broken){s.broken=false;s.wear=0;T.repairs+=ECON.repairCrew;S.cash-=ECON.repairCrew;}});});
  if(S.cash<0){S.cash+=2000;T.bailout=true;S.rep=clamp(S.rep-5,0,100);}
  emit('report',{T});}
const techSpeed=()=>S&&S.tech&&S.tech.agv?1.1:1;
function buyTech(id){const T=TECH.find(x=>x.id===id);if(!T)return 'Unknown';S.tech=S.tech||{};if(S.tech[id])return 'Already yours';if(T.stage>S.stage)return 'Unlocks at '+STAGES[T.stage].name;if(S.cash<T.cost)return 'Need '+money(T.cost);S.cash-=T.cost;if(S.today)S.today.capex+=T.cost;S.tech[id]=1;emit('tech',{id});return '';}
/* OEE = Availability x Performance x Quality */
function oeeOf(o){if(!o||o.plan<1)return null;const run=Math.max(.001,o.plan-o.down),A=run/o.plan,Pf=Math.min(1,o.made/Math.max(.001,o.ideal*run)),Qu=o.made?(o.made-o.bad)/o.made:1;return {A,P:Pf,Q:Qu,v:A*Pf*Qu};}
function plantOEE(T){T=T||S.today;if(!T||!T.oee)return null;const tot=T.oee.slice(0,lineCount()).reduce((a,o)=>({plan:a.plan+o.plan,down:a.down+o.down,made:a.made+o.made,bad:a.bad+o.bad,ideal:a.ideal+o.ideal*o.plan}),{plan:0,down:0,made:0,bad:0,ideal:0});if(tot.plan<1)return null;tot.ideal/=tot.plan;return oeeOf(tot);}
/* each shift's mission: ship targets for 1, 2 and 3 stars */
function missionFor(){const cap=S.lines.slice(0,lineCount()).reduce((a,l)=>a+capacity(l).n,0);return [Math.max(3,Math.round(cap*.72)),Math.max(4,Math.round(cap*.9)),Math.max(5,Math.round(cap*1.06))];}
function nextDay(){S.day++;S.phase='board';makeOffers();}
function grade(T){const pts=T.net+T.shipped*6-T.retN*30-T.late.length*200+T.games*40;const base=120+S.stage*260+S.lines.length*80;
  return pts>=base*3?'S':pts>=base*2?'A':pts>=base?'B':pts>=0?'C':'D';}
function plantValue(){let v=S.cash;S.lines.forEach(l=>ST_KEYS.forEach(k=>{const s=l.st[k];if(!s.built)return;v+=(STATIONS[k].buildCost||300)*.5;for(let t=1;t<=s.tier;t++)v+=UP_COST[k][t]*.6;}));for(let i=1;i<=S.stage;i++)v+=STAGES[i].cost*.7;return v;}
if(typeof module!=='undefined')module.exports={};
