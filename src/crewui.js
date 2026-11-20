/* ---------- Crew + Rankings panels ---------- */
TABS.splice(2,0,['crew','👷','Crew','Hire, train and assign your people']);
TABS.splice(TABS.findIndex(t=>t[0]==='makers'),0,['ranks','🏆','Rankings',"Kentucky's top plants"]);
const AVC=['#F59E0B','#38BDF8','#A78BFA','#34D399','#F472B6','#FB923C','#60A5FA'];
const initials=n=>n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
function lvPips(n){return `<i class="lvp">${[1,2,3,4,5].map(i=>`<u class="${i<=n?'on':''}"></u>`).join('')}</i>`;}
function stationLabel(li,k){return `${lineCount()>1?'L'+(li+1)+' · ':''}${STATIONS[k].name}`;}
function avatar(w){return `<div class="av" style="--c:${AVC[w.c%AVC.length]}">${initials(w.name)}</div>`;}
function skillGrid(w,hi){return `<div class="wk-sk">${ST_KEYS.map(k=>`<div class="${hi===k?'on':''}" title="${SKILL_NAME[k]} · Level ${wLvl(w,k)}"><span>${STATIONS[k].icon}</span>${lvPips(wLvl(w,k))}</div>`).join('')}</div>`;}

MENU.crew=()=>{const ws=S.workers,pay=ws.reduce((a,w)=>a+w.wage,0),empty=emptyStations(),idle=ws.filter(w=>!w.at),day=S.phase==='day';
  const slots=[];S.lines.slice(0,lineCount()).forEach(l=>stationsOn(l).forEach(k=>{const s=l.st[k];if(s.tier<2)slots.push([l.i,k,crewOf(s).length]);}));
  const card=w=>{const k=w.at?w.at[1]:bestRole(w),lv=wLvl(w,k),tc=trainCost(w,k),en=Math.round(w.energy),ec=en>60?'#39E75F':en>30?'#FACC15':'#F87171';
    return `<div class="wk ${w.at?'':'idle'} ${w.brk>0?'brk':''}">
      <div class="wk-h">${avatar(w)}<div class="wk-n"><b>${esc(w.name)}</b><small>${ROLE_NAME[bestRole(w)]} · Lv ${wLvl(w,bestRole(w))}</small></div><div class="wk-w"><b>${money(w.wage)}</b><small>per shift</small></div></div>
      <div class="wk-en"><span>${w.brk>0?'On break':'Energy'}</span><div class="bar"><i style="width:${en}%;background:${ec}"></i></div><b>${en}%</b></div>
      ${skillGrid(w,w.at&&w.at[1])}
      <label class="wk-as"><span>Works at</span><select data-as="${w.id}"><option value="">Unassigned (still paid!)</option>${slots.map(([li,k2,n])=>{const mine=w.at&&w.at[0]===li&&w.at[1]===k2;return `<option value="${li}:${k2}" ${mine?'selected':''} ${!mine&&n>=2?'disabled':''}>${stationLabel(li,k2)} · Lv${wLvl(w,k2)}${n?` (${n}/2)`:' · EMPTY'}</option>`;}).join('')}</select></label>
      <div class="wk-a">${tc!=null?`<button class="btn sm" data-tr="${w.id}:${k}" ${S.cash<tc||w.trained===S.day?'disabled':''}>${ic('upgrade')} Train ${SKILL_NAME[k]} → Lv${lv+1} · ${money(tc)}</button>`:`<span class="mst">${ic('star')} Master ${SKILL_NAME[k]}</span>`}
        ${day&&w.at&&!(w.brk>0)?`<button class="btn sm ${en<40?'pri':''}" data-brk="${w.id}">☕ Break</button>`:''}<button class="btn sm ghost" data-go="${w.id}">Let go</button></div></div>`;};
  const cand=(c,i)=>{const lv=wLvl(c,c.main),fee=hireFee(c);return `<div class="wk cand"><div class="wk-h">${avatar(c)}<div class="wk-n"><b>${esc(c.name)}</b><small>${ROLE_NAME[c.main]} · <span class="tag t${Math.min(lv,4)}">${['','ROOKIE','SKILLED','SKILLED','EXPERT','MASTER'][lv]}</span></small></div><div class="wk-w"><b>${money(c.wage)}</b><small>per shift</small></div></div>
      ${skillGrid(c,c.main)}<p class="wk-p">${lv>=3?`Works ${Math.round((skillMul(c,c.main)-1)*100)}% faster and makes ${Math.round(12*(lv-1))}% fewer defects at ${STATIONS[c.main].name}.`:'Cheaper, but slower. Will get better with practice.'}</p>
      <button class="btn ${empty.length?'pri':''}" data-hc="${i}" ${S.cash<fee?'disabled':''}>${ic('worker')} Hire · ${money(fee)} signing</button></div>`;};
  return `<div class="kpis cr-k"><div><em>Crew</em><b>${ws.length}</b></div><div><em>Payroll</em><b>${money(pay)}<small>/shift</small></b></div><div><em>Idle</em><b class="${idle.length?'r':''}">${idle.length}</b></div><div><em>Empty stations</em><b class="${empty.length?'r':''}">${empty.length}</b></div></div>
    ${empty.length?`<div class="cr-alert">${ic('warn')}<div><b>${empty.length} station${empty.length>1?'s have':' has'} nobody running ${empty.length>1?'them':'it'}.</b> ${empty.map(([li,k])=>stationLabel(li,k)).join(', ')}. Nothing gets made there until someone is assigned.</div><button class="btn pri" data-staff="1">${idle.length?'Fill with idle crew + hire':'Hire rookies'} · ${money(Math.max(0,empty.length-idle.length)*ECON.hireFee)}</button></div>`:''}
    <p class="sub lesson">${ic('bulb')}<span>Skilled workers cost more each shift but work faster and make fewer defects. Everyone gets better with practice, or you can pay to <b>train</b> them. Tired workers slow down, so a short <b>break</b> gets them back to full speed. Idle workers still get paid.</span></p>
    <section class="m-sec"><h4>Your crew</h4><div class="wks">${ws.map(card).join('')||'<p class="muted">No one yet. Hire from the board below.</p>'}</div></section>
    <section class="m-sec"><h4>Hiring board <small>new faces every day</small></h4><div class="wks">${S.cands.map(cand).join('')||'<p class="muted">Check back tomorrow.</p>'}</div></section>`;};

function certProg(c){const best=Math.max(0,...S.hist.map(T=>{const o=plantOEE(T);return o?o.v:0;}));const last=S.hist[S.hist.length-1];
  switch(c.id){case 'oee':return [best/.85,`Best shift: ${Math.round(best*100)}%`];
    case 'zero':return [last?Math.min(1,last.shipped/15)*(last.badShip?0.5:1):0,last?`Last shift: ${last.shipped} shipped, ${last.badShip||0} bad`:'Run a shift first'];
    case 'crew':{const n=S.workers.filter(w=>wLvl(w,bestRole(w))>=4).length;return [n/3,`${n} of 3 at Level 4+`];}
    case 'aero':return [(S.certs.zero?.5:0)+(hasRobotQA()?.5:0),`${S.certs.zero?'✓':'✗'} Zero-Defect · ${hasRobotQA()?'✓':'✗'} Robot QA Scanner`];
    case 'lean':return [S.stats.shipped/1500,`${S.stats.shipped.toLocaleString()} / 1,500 shipped`];
    case 'top':{const r=myRank();return [(RIVALS.length+1-r)/RIVALS.length,`Currently #${r}`];}}return [0,''];}
MENU.ranks=()=>{const rows=rankings(),me=rows.find(r=>r.me),above=rows[me.r-2],certs=Object.keys(S.certs).length,skill=S.workers.reduce((a,w)=>a+wLvl(w,bestRole(w)),0);
  const parts=[['Plant value',Math.round(plantValue()/90)],['Reputation',Math.round(S.rep*2)],['Certifications',certs*160],['Units shipped',Math.round(S.stats.shipped*.45)],['Crew skill',skill*6]];
  return `<div class="rk-hero"><div class="rk-n"><small>Kentucky rank</small><b>#${me.r}</b><span>of ${rows.length}</span></div><div class="rk-m"><b>${me.r===1?"You're Kentucky's Top Plant!":`Next: pass ${esc(above.n)}`}</b><small>${me.r===1?'Every rival is chasing you now.':`${above.c} · ${(above.s-me.s+1).toLocaleString()} more points`}</small>
      <div class="rk-parts">${parts.map(([a,b])=>`<div><em>${a}</em><b>${b.toLocaleString()}</b></div>`).join('')}<div class="tot"><em>Plant score</em><b>${me.s.toLocaleString()}</b></div></div></div></div>
    <section class="m-sec"><h4>Certifications <small>real plants earn these to win bigger customers</small></h4><div class="certs">${CERTS.map(c=>{const got=S.certs[c.id],[p,t]=certProg(c);
      return `<div class="cert ${got?'got':''}"><div class="ce-i">${c.icon}</div><div class="ce-b"><b>${c.name}</b><p>${c.desc}</p>${got?`<span class="ce-ok">${ic('check')} CERTIFIED · Day ${got}</span>`:`<div class="cbar"><i style="width:${Math.round(clamp(p,0,1)*100)}%"></i></div><small>${t}</small>`}<small class="ce-l">${c.learn}</small></div><div class="ce-r">+${money(c.reward)}</div></div>`;}).join('')}</div></section>
    <section class="m-sec"><h4>Kentucky plant rankings <small>updated after every shift · rival plants are made up</small></h4><ol class="rk">${rows.map(r=>`<li class="${r.me?'me':''}"><span class="rk-p">${r.r}</span><b>${esc(r.n)}</b><small>${esc(r.c)}</small><em>${r.s.toLocaleString()}</em></li>`).join('')}</ol></section>`;};

function reportExtra(T){const bits=[];
  if(T.rank){const d=T.rankFrom?T.rankFrom-T.rank:0;bits.push(`<div class="rx rank"><span>🏆</span><div><b>Kentucky rank #${T.rank}</b><small>${d>0?`▲ up ${d} spot${d>1?'s':''}!`:d<0?`▼ down ${-d}`:'Holding steady'}${T.rank>1?' · keep climbing':''}</small></div></div>`);}
  (T.certs||[]).forEach(c=>bits.push(`<div class="rx cert"><span>${c.icon}</span><div><b>Certified: ${c.name}</b><small>+${money(c.reward)} · ${c.learn}</small></div></div>`));
  if(T.idleW)bits.push(`<div class="rx warn"><span>👷</span><div><b>${T.idleW} idle worker${T.idleW>1?'s':''} on payroll</b><small>They still got paid. Assign them in Crew.</small></div></div>`);
  return bits.length?`<div class="rxs">${iconize(bits.join(''))}</div>`:'';}

function bindCrew(C){const after=()=>{syncStations();refreshPanel();};
  C.querySelectorAll('[data-as]').forEach(sel=>sel.onchange=()=>{const id=+sel.dataset.as,w=S.workers.find(x=>x.id===id);if(!sel.value){unassign(w);sfx('tick');after();return;}
    const [li,k]=sel.value.split(':'),before=capacity(S.lines[+li]).n,e=assignWorker(id,+li,k);if(e){toast(e,'bad');after();return;}sfx('good');after();const n=capacity(S.lines[+li]).n;if(n>before)toast(`👷 <b>${esc(w.name.split(' ')[0])}</b> is on ${STATIONS[k].name}. Line ${+li+1}: <b>${before} → ${n}</b>/shift`,'good');});
  C.querySelectorAll('[data-tr]').forEach(b=>b.onclick=()=>{const [id,k]=b.dataset.tr.split(':'),e=trainWorker(+id,k);if(e)toast(e,'bad');else sfx('win');after();});
  C.querySelectorAll('[data-brk]').forEach(b=>b.onclick=()=>{const e=sendBreak(+b.dataset.brk);if(e)toast(e,'bad');else{sfx('tick');toast('☕ Break time. Back on the line in about 8 seconds.','good');}after();});
  C.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{if(!b.dataset.arm){b.dataset.arm=1;b.textContent='Tap again to let go';b.classList.add('danger');return;}const w=S.workers.find(x=>x.id===+b.dataset.go);letGo(+b.dataset.go);toast(`${esc(w.name)} has left the plant. Payroll −${money(w.wage)}/shift.`);after();});
  C.querySelectorAll('[data-hc]').forEach(b=>b.onclick=()=>{const i=+b.dataset.hc,c=S.cands[i],e=hireCand(i);if(e){toast(e,'bad');return;}const w=S.workers[S.workers.length-1],em=emptyStations().find(([li,k])=>k===w.main)||emptyStations()[0];if(em)assignWorker(w.id,em[0],em[1]);after();});
  const st=C.querySelector('[data-staff]');if(st)st.onclick=()=>{let n=0;for(const [li,k] of emptyStations()){const e=hireCrew(li,k);if(e){toast(e,'bad');break;}n++;}if(n)sfx('good');after();};}
