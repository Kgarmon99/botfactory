/* ---------- crew: named workers with skills, levels and energy ---------- */
const crewOf=s=>(s.ws||[]).map(id=>S.workers.find(w=>w.id===id)).filter(Boolean);
const lvlOf=x=>{let l=1;for(let i=1;i<XP_LV.length;i++)if(x>=XP_LV[i])l=i+1;return l;};
const wLvl=(w,k)=>lvlOf(w.xp[k]||0);
const skillMul=(w,k)=>1+.13*(wLvl(w,k)-1);
const energyMul=w=>w.energy>=40?1:.55+.45*w.energy/40;
function defectMul(s){if(s.tier===2)return 1;const ws=crewOf(s);if(!ws.length)return 1;const best=Math.max(...ws.map(w=>wLvl(w,s.k)));return 1-.12*(best-1);}
function bestRole(w){return ST_KEYS.reduce((a,k)=>(w.xp[k]||0)>(w.xp[a]||0)?k:a,w.main);}
function newWorker(k,lv,opt){const id=++S.wid,xp={};ST_KEYS.forEach(x=>xp[x]=0);xp[k]=XP_LV[lv-1];
  if(opt&&opt.side)ST_KEYS.forEach(x=>{if(x!==k)xp[x]=XP_LV[Math.min(opt.side,lv)-1];});
  const used=new Set(S.workers.map(w=>w.name.split(' ')[0]));const pool=FIRST_NAMES.filter(n=>!used.has(n));
  return {id,name:pick(pool.length?pool:FIRST_NAMES)+' '+LAST_INIT[ri(0,LAST_INIT.length-1)]+'.',c:ri(0,6),main:k,xp,energy:100,wage:[0,60,75,95,120,150][lv],at:null,brk:0,hired:S.day,trained:0,tired:0};}
function assignWorker(id,li,k){const w=S.workers.find(x=>x.id===id),s=S.lines[li]&&S.lines[li].st[k];if(!w||!s)return 'Gone';if(s.tier===2)return 'Robot cells run on their own';
  if(!s.built)return 'Build that station first';if(crewOf(s).length>=2&&!s.ws.includes(id))return 'That station already has 2 workers';unassign(w);s.ws.push(id);s.crew=s.ws.length;w.at=[li,k];return '';}
function unassign(w){if(!w.at)return;const s=S.lines[w.at[0]]&&S.lines[w.at[0]].st[w.at[1]];if(s){s.ws=s.ws.filter(x=>x!==w.id);s.crew=s.ws.length;}w.at=null;}
function staffLine(l,quiet){ST_KEYS.forEach(k=>{const s=l.st[k];if(!s.built||s.tier===2||crewOf(s).length)return;const idle=S.workers.find(w=>!w.at);
  if(idle)assignWorker(idle.id,l.i,k);else{const w=newWorker(k,1);S.workers.push(w);assignWorker(w.id,l.i,k);if(!quiet)emit('newcrew',{w,li:l.i,k});}});}
function migrateCrew(){if(!S.workers)S.workers=[];if(S.wid==null)S.wid=0;if(!S.certs)S.certs={};if(!S.cands)S.cands=[];
  S.lines.forEach(l=>ST_KEYS.forEach(k=>{const s=l.st[k];if(!s.ws){const n=s.built&&s.tier<2?Math.max(1,s.crew||1):0;s.ws=[];s.crew=0;s.ghost=0;
    for(let i=0;i<n;i++){const lv=S.day>12?3:S.day>5?2:1,w=newWorker(k,lv);S.workers.push(w);s.ws.push(w.id);w.at=[l.i,k];}s.crew=s.ws.length;}}));
  if(!S.workers.length)S.lines.forEach(l=>staffLine(l,true));}
function makeCands(){const k=()=>pick(ST_KEYS.filter(x=>x!=='paint'||S.stage>=1).filter(x=>x!=='qa'||S.stage>=1));
  S.cands=[newWorker(k(),1),newWorker(k(),S.stage>=1?3:2),newWorker(k(),S.stage>=2?4:3,{side:2})];S.cands.forEach(c=>{c.id=-c.id;});}
function hireCand(i){const c=S.cands[i];if(!c)return 'Gone';const fee=ECON.hireFee+(wLvl(c,c.main)-1)*60;if(S.cash<fee)return 'Need '+money(fee);S.cash-=fee;
  const w=Object.assign({},c,{id:++S.wid,hired:S.day});S.workers.push(w);S.cands.splice(i,1);emit('hired',{w});return '';}
const hireFee=c=>ECON.hireFee+(wLvl(c,c.main)-1)*60;
const trainCost=(w,k)=>wLvl(w,k)>=5?null:90+wLvl(w,k)*110;
function trainWorker(id,k){const w=S.workers.find(x=>x.id===id);if(!w)return 'Gone';const c=trainCost(w,k);if(c==null)return 'Already a master';if(w.trained===S.day)return `${w.name.split(' ')[0]} already trained today`;
  if(S.cash<c)return 'Need '+money(c);S.cash-=c;if(S.today)S.today.train=(S.today.train||0)+c;w.xp[k]=XP_LV[wLvl(w,k)];w.trained=S.day;emit('lvl',{w,k,lv:wLvl(w,k),trained:true});return '';}
function sendBreak(id){const w=S.workers.find(x=>x.id===id);if(!w)return 'Gone';if(S.phase!=='day')return 'Breaks happen during a shift';if(w.brk>0)return 'Already on break';w.brk=8;emit('break10',{w});return '';}
function letGo(id){const w=S.workers.find(x=>x.id===id);if(!w)return 'Gone';unassign(w);S.workers=S.workers.filter(x=>x!==w);emit('letgo',{w});return '';}
function tire(w,amt){w.energy=Math.max(0,w.energy-amt*(S.tech&&S.tech.screens?.9:1));if(w.energy<30&&!w.tired){w.tired=1;emit('tired',{w});}}
function gainXP(w,k,n){const before=wLvl(w,k);w.xp[k]=(w.xp[k]||0)+n;const after=wLvl(w,k);if(after>before){w.wage+=5;emit('lvl',{w,k,lv:after});}}
function stepCrew(dt){S.workers.forEach(w=>{if(w.brk>0){w.brk-=dt;w.energy=Math.min(100,w.energy+dt*8);if(w.brk<=0){w.brk=0;emit('backToWork',{w});}}});}
function crewEndShift(T){S.workers.forEach(w=>{w.energy=100;w.brk=0;w.tired=0;});T.crewN=S.workers.length;}
function emptyStations(){const out=[];S.lines.slice(0,lineCount()).forEach(l=>stationsOn(l).forEach(k=>{const s=l.st[k];if(s.tier<2&&!crewOf(s).length)out.push([l.i,k]);}));return out;}

/* ---------- endgame: certifications + Kentucky plant rankings ---------- */
function playerScore(){const certs=Object.keys(S.certs||{}).length,skill=S.workers.reduce((a,w)=>a+wLvl(w,bestRole(w)),0);
  return Math.round(plantValue()/90+S.rep*2+certs*160+S.stats.shipped*.45+skill*6);}
function rivalScore(i){const base=70*Math.pow(4300/70,i/(RIVALS.length-1));return Math.round(base*(1+.003*S.day));}
function rankings(){const rows=RIVALS.map(([n,c],i)=>({n,c,s:rivalScore(i)}));rows.push({n:S.name+"'s BotFactory",c:'You',s:playerScore(),me:true});rows.sort((a,b)=>b.s-a.s);rows.forEach((r,i)=>r.r=i+1);return rows;}
const myRank=()=>rankings().find(r=>r.me).r;
function hasRobotQA(){return S.lines.some(l=>l.st.qa.built&&l.st.qa.tier===2);}
function certCheck(id,T){const o=T&&plantOEE(T);switch(id){
  case 'oee':return !!(o&&o.v>=.85&&T.shipped>=8);
  case 'zero':return !!(T&&T.shipped>=15&&!(T.badShip||0));
  case 'crew':return S.workers.filter(w=>wLvl(w,bestRole(w))>=4).length>=3;
  case 'aero':return !!(S.certs.zero&&hasRobotQA());
  case 'lean':return S.stats.shipped>=1500;
  case 'top':return myRank()===1;}return false;}
function endgameEndShift(T){T.certs=[];CERTS.forEach(c=>{if(!S.certs[c.id]&&certCheck(c.id,T)){S.certs[c.id]=S.day;S.cash+=c.reward;T.bonus+=c.reward;T.certs.push(c);emit('cert',{c});}});
  const r=myRank();T.rank=r;T.rankFrom=S.rankPrev||null;S.rankPrev=r;}
