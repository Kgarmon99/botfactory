/* =====================================================================
   BotFactory · SPONSORS
   ---------------------------------------------------------------------
   Plug real partners in HERE. Every slot is optional: leave it null and
   the game shows its own factory branding instead.

   A sponsor looks like:
     { name:'Company Name', tagline:'Short line', color:'#0EA5E9',
       logo:'sponsors/company.png',      // optional, wide PNG works best
       jobsUrl:'https://company.com/careers' }   // optional "See real jobs" button

   SLOTS
     presenting  "Presented by" on the title, every end-of-day screen and the report card
     steel       Steel supplier: truck wraps + the steel dock
     shipping    Shipping partner: outbound truck wraps
     banners     Up to 4 wall banners inside the factory
     machines    "Powered by" plate over a station type
                 (cut, weld, asm, paint, qa)
     careers     Which partner hosts each Meet the Makers job card
                 (operator, welder, assembler, coatings, quality, maintenance, engineer,
                  robotics, supply, logistics, accountant, mill, metallurgist,
                  recycling, plant)

   SALES DEMO LINKS (no code change needed)
     ?slots                       every empty slot reads "YOUR BRAND HERE"
     ?sponsor=Acme%20Steel        puts one prospect's name in every slot
     &color=%23C8102E             their brand color (URL-encoded #hex)
   ===================================================================== */
const SPONSORS={
  presenting:null,
  steel:null,
  shipping:null,
  banners:[],
  machines:{},
  careers:{},
  showcase:null      /* the Mill Tour field trip: the whole mill wears this partner's name */
};
/* Optional: send anonymous placement events (views, career clicks) to your
   own endpoint so you can report numbers to sponsors. Off when empty. */
const SPONSOR_BEACON='';

/* ---------- the slot inventory (used by ?slots and ?sponsor previews) ---------- */
const SLOT_INFO={showcase:'Showcase mill',presenting:'Presenting partner', steel:'Steel supplier', shipping:'Shipping partner', banner:'Factory banner', machine:'Station sponsor', career:'Career partner', billboard:'Street billboard'};
const SPONSOR_MODE=(()=>{ const q=new URLSearchParams(location.search), nm=(q.get('sponsor')||'').trim().slice(0,40);
  if(nm) return {kind:'preview', s:{name:nm, tagline:(q.get('tagline')||'').slice(0,50), color:/^#[0-9a-f]{3,8}$/i.test(q.get('color')||'')?q.get('color'):'#0EA5E9'}};
  if(q.has('slots')) return {kind:'slots'}; return {kind:'live'}; })();
function slotFill(slot, real){ if(SPONSOR_MODE.kind==='preview') return Object.assign({},SPONSOR_MODE.s,{tagline:SPONSOR_MODE.s.tagline||SLOT_INFO[slot]});
  if(real) return real; if(SPONSOR_MODE.kind==='slots') return {name:'YOUR BRAND HERE', tagline:SLOT_INFO[slot]+' slot', color:'#F59E0B', placeholder:true}; return null; }
const spPresenting=()=>slotFill('presenting',SPONSORS.presenting);
const spSteel=()=>slotFill('steel',SPONSORS.steel);
const spShip=()=>slotFill('shipping',SPONSORS.shipping);
const spMachine=t=>slotFill('machine',(SPONSORS.machines||{})[t]);
const spCareer=k=>slotFill('career',(SPONSORS.careers||{})[k]||SPONSORS.presenting);
function spBanners(){ const real=(SPONSORS.banners||[]).filter(Boolean); const out=[]; for(let i=0;i<4;i++){ const s=slotFill('banner',real[i]); out.push(s); } return out; }
const escS=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function spBadge(s,label){ if(!s) return ''; return `<div class="spons${s.placeholder?' ph':''}"><em>${escS(label||'Presented by')}</em>${s.logoImg?`<img src="${escS(s.logo)}" alt="${escS(s.name)}">`:`<b style="--sc:${escS(s.color||'#fff')}">${escS(s.name)}</b>`}</div>`; }

/* logos: load once at boot so 3D signs can draw them */
function loadSponsorLogos(){ const all=[SPONSORS.presenting,SPONSORS.steel,SPONSORS.shipping,...(SPONSORS.banners||[]),...Object.values(SPONSORS.machines||{}),...Object.values(SPONSORS.careers||{})].filter(s=>s&&s.logo&&!s.logoImg);
  return Promise.all(all.map(s=>new Promise(res=>{ const im=new Image(); im.onload=()=>{ s.logoImg=im; res(); }; im.onerror=()=>res(); im.src=s.logo; setTimeout(res,4000); }))); }

/* a canvas texture with the sponsor's logo (or name) for walls, trucks and plates */
function sponsorTex(s, o={}){ const c=document.createElement('canvas'); c.width=o.w||1024; c.height=o.h||256; const g=c.getContext('2d'), w=c.width, h=c.height;
  g.fillStyle=o.bg||'#F8FAFC'; g.beginPath(); g.roundRect(0,0,w,h,o.r||18); g.fill();
  g.fillStyle=s.color||'#0EA5E9'; g.fillRect(0,h-h*.09,w,h*.09);
  if(o.kicker){ g.font=`800 ${Math.round(h*.13)}px Inter, system-ui, sans-serif`; g.fillStyle='#64748B'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(o.kicker.toUpperCase(),w/2,h*.16); }
  const top=o.kicker?h*.3:h*.1, bot=h*.86;
  if(s.logoImg){ const im=s.logoImg, ar=im.width/im.height, bh=(s.tagline&&!o.noTag?(bot-top)*.68:bot-top), bw=Math.min(w*.88,bh*ar), hh=bw/ar; g.drawImage(im,(w-bw)/2,top+(bh-hh)/2,bw,hh);
    if(s.tagline&&!o.noTag){ g.font=`600 ${Math.round(h*.12)}px Inter, system-ui, sans-serif`; g.fillStyle='#475569'; g.textAlign='center'; g.fillText(s.tagline,w/2,top+bh+(bot-top-bh)/2,w*.9); } }
  else { let sz=Math.round(h*(s.tagline&&!o.noTag?.32:.42)); g.font=`900 ${sz}px Inter, system-ui, sans-serif`; while(g.measureText(s.name).width>w*.9&&sz>14){ sz-=2; g.font=`900 ${sz}px Inter, system-ui, sans-serif`; }
    g.fillStyle=s.placeholder?'#B45309':(o.ink||'#0B1220'); g.textAlign='center'; g.textBaseline='middle'; const ny=s.tagline&&!o.noTag?top+(bot-top)*.38:(top+bot)/2; g.fillText(s.name,w/2,ny);
    if(s.tagline&&!o.noTag){ let ts=Math.round(h*.13); g.font=`700 ${ts}px Inter, system-ui, sans-serif`; while(g.measureText(s.tagline).width>w*.9&&ts>10){ ts-=1; g.font=`700 ${ts}px Inter, system-ui, sans-serif`; } g.fillStyle='#475569'; g.fillText(s.tagline,w/2,top+(bot-top)*.8); } }
  if(s.placeholder){ g.setLineDash([22,14]); g.lineWidth=8; g.strokeStyle='#F59E0B'; g.strokeRect(8,8,w-16,h-16); }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; return t; }

/* placement events → localStorage tally + optional beacon */
const SP_SEEN={};
function spTrack(ev, s, extra){ if(!s||s.placeholder) return; const k=ev+'|'+s.name; if(ev!=='click'&&SP_SEEN[k]) return; SP_SEEN[k]=1;
  try{ const st=JSON.parse(localStorage.getItem('bf_sponsor_stats')||'{}'); st[k]=(st[k]||0)+1; localStorage.setItem('bf_sponsor_stats',JSON.stringify(st)); }catch(e){}
  if(SPONSOR_BEACON&&navigator.sendBeacon){ try{ navigator.sendBeacon(SPONSOR_BEACON,JSON.stringify(Object.assign({game:'botfactory',ev,sponsor:s.name,t:Date.now()},extra||{}))); }catch(e){} } }

/* ---------- Meet the Makers: real manufacturing careers ---------- */
const CAREERS={
  operator:   {icon:'⚡', role:'CNC & Laser Operator', link:'You ran the laser cutter today.', what:'Sets up and runs the machines that cut, press and shape metal into parts. Checks the first parts off the line to make sure the machine is dialed in.', path:'High school diploma. Most companies train you on the job, and a machining certificate from a community or technical college can move you up fast.', skills:['Following specs','Measuring','Safety']},
  welder:     {icon:'🔥', role:'Welder', link:'You just laid a weld bead. That\'s this job.', what:'Joins metal parts with an electric arc hotter than 6,000°F. Welders build everything from car frames to bridges to the robots on your line.', path:'Welding program at a community or technical college (often under a year), plus certifications. Some high schools offer welding classes and dual credit.', skills:['Steady hands','Reading blueprints','Safety gear'], ky:1},
  assembler:  {icon:'🔩', role:'Production Assembler', link:'Your assembly station put every product together.', what:'Builds products on the line by hand and with power tools, one step of the process at a time. The line is a team: if one station slows down, everybody feels it.', path:'High school diploma. Paid training on day one. Great starting job that leads to team lead and supervisor roles.', skills:['Teamwork','Attention to detail','Speed with accuracy']},
  coatings:   {icon:'🎨', role:'Paint & Coatings Technician', link:'Your Painter gave every bot its finish.', what:'Runs the paint booths and robots that coat products so they look good and don\'t rust. Mixes paint, checks thickness and keeps the booth clean.', path:'High school diploma plus on-the-job training. Some learn in auto body or industrial finishing programs.', skills:['Precision','Chemistry basics','Safety gear']},
  quality:    {icon:'🔍', role:'Quality Inspector', link:'Today you hunted defects before customers found them.', what:'Measures parts and finished products against the specs and stops bad ones before they ship. Finds out <i>why</i> defects happen so they stop happening.', path:'High school diploma and training. Many earn quality certifications later. Can lead to Quality Engineer with a degree.', skills:['Measuring tools','Problem solving','Saying "this isn\'t right"']},
  maintenance:{icon:'🛠️', role:'Maintenance Technician', link:'A machine broke today and someone had to fix it.', what:'Keeps the whole plant running: fixes electrical, mechanical and hydraulic problems, and does maintenance so machines don\'t break in the first place.', path:'Two-year degree in industrial maintenance or mechatronics, or an apprenticeship. One of the most in-demand jobs in manufacturing.', skills:['Troubleshooting','Electrical','Mechanical']},
  engineer:   {icon:'📐', role:'Industrial Engineer', link:'You found a bottleneck and fixed it. That\'s this job.', what:'Designs how the factory flows: where machines go, how many people each step needs, and how to make more with less waste. Bottleneck hunting is the job.', path:'Four-year degree in industrial engineering. Many companies help pay for school.', skills:['Math','Data','Process design']},
  robotics:   {icon:'🤖', role:'Robotics Technician', link:'You programmed a robot today. Real robot techs do exactly that.', what:'Installs, programs and repairs the robots and automated machines on the line. As factories automate, these jobs keep growing.', path:'Two-year degree in robotics, automation or mechatronics. Some start as operators and train up.', skills:['Programming','Electronics','Troubleshooting']},
  supply:     {icon:'📦', role:'Supply Chain Planner', link:'Every product you made today started as steel someone had to order.', what:'Decides what materials to buy, how much and when, so the line never runs out but cash isn\'t stuck sitting on shelves. Watches prices and suppliers.', path:'Two- or four-year degree in supply chain, logistics or business.', skills:['Planning','Negotiation','Spreadsheets']},
  logistics:  {icon:'🚚', role:'Shipping & Logistics Coordinator', link:'Your contracts had deadlines today.', what:'Gets finished products to customers on time: schedules trucks, loads shipments and tracks every order until it lands.', path:'High school diploma to start; forklift certification is quick. Degrees in logistics lead to manager roles.', skills:['Organization','Communication','Deadlines']},
  accountant: {icon:'📊', role:'Cost Accountant', link:'Your shift report split fixed and variable costs. Cost accountants live in that report.', what:'Figures out what every product really costs to make, so the company can price it right and know which changes actually save money.', path:'Four-year degree in accounting or finance.', skills:['Math','Excel','Asking "why did this cost go up?"']},
  mill:       {icon:'🔥', role:'Mill Operator (Steel & Aluminum)', link:'Every MiniBot started as a steel sheet. Someone made that sheet.', what:'Runs the furnaces, casters and rolling mills that melt metal and roll it into the sheets and coils factories like yours buy. Big machines, big teams, very precise work.', path:'High school diploma. Mills train you, and many partner with community and technical colleges on apprenticeships.', skills:['Safety','Teamwork','Reading gauges'], ky:1},
  metallurgist:{icon:'🧪', role:'Metallurgist', link:'Some of your products came back broken. Was it the metal?', what:'The scientist of the mill: tests the chemistry and strength of the metal so every coil meets the customer\'s spec, and figures out what went wrong when it doesn\'t.', path:'Four-year degree in metallurgical, materials or chemical engineering.', skills:['Chemistry','Lab testing','Problem solving'], ky:1},
  recycling:  {icon:'♻️', role:'Metals Recycling Specialist', link:'Your QA scrapped defects today. That scrap metal doesn\'t go to waste.', what:'Sorts, tests and processes scrap metal so it can be melted down into new steel and aluminum. A lot of new metal is made from recycled scrap.', path:'High school diploma and on-the-job training. Equipment certifications and supervisor roles come with experience.', skills:['Sorting & testing','Heavy equipment','Safety'], ky:1},
  craneop:    {icon:'🧲', role:'Overhead Crane Operator', link:'You ran the scrap magnet.', what:'Runs the giant cranes that move scrap, ladles of molten metal and finished coils around a mill. Steady hands and sharp focus, every lift.', path:'High school diploma and on-the-job training, plus a crane certification. Many mills train you from day one.', skills:['Focus','Safety','Spatial thinking'], ky:1},
  meltshop:   {icon:'⚡', role:'Melt Shop Operator', link:'You melted scrap in an electric arc furnace.', what:'Runs the furnace that turns scrap into liquid metal: loading charges, watching temperature and chemistry, and tapping the heat into the ladle.', path:'High school diploma. Mills train you, often with apprenticeships through community and technical colleges.', skills:['Teamwork','Reading gauges','Heat safety'], ky:1},
  plant:      {icon:'🏆', role:'Plant Manager', link:'You just expanded your plant. Someone has to run all of it.', what:'Runs the entire plant: safety, quality, cost, on-time delivery and the people. Most plant managers started on the floor.', path:'Usually years of experience plus a degree in engineering or business. Many work their way up from operator.', skills:['Leadership','Every lesson in this game','Decisions under pressure']}
};
/* pick the career that matches what actually happened today (tags are set by the game) */
function careerFor(T){const used=S.flags.careersShown||(S.flags.careersShown={}),tags=T.tags||{},wants=[];
  if(tags.expand)wants.push('plant');if(tags.program)wants.push('robotics');if(tags.repair||tags.break)wants.push('maintenance');if(tags.weld)wants.push('welder');if(tags.laser)wants.push('operator');
  if(tags.qa||T.scrap)wants.push('quality','recycling');if(T.retN)wants.push('metallurgist','quality');if(tags.paint)wants.push('coatings');if(tags.assemble)wants.push('assembler');if(tags.bottleneck)wants.push('engineer');if(tags.contract)wants.push('logistics');
  wants.push('welder','operator','mill','assembler','engineer','accountant','quality','maintenance','robotics','supply','coatings','metallurgist','logistics','recycling','plant');
  const k=wants.find(x=>!used[x])||wants[0];used[k]=1;return k;}
function careerCard(r){ const k=careerFor(r), c=CAREERS[k], s=spCareer(k); if(s) spTrack('career_view',s,{role:k});
  return `<div class="maker"><div class="mk-h"><span class="mk-i">${c.icon}</span><div><em>Meet the Makers · a real job</em><b>${c.role}</b></div>${s?`<div class="mk-s${s.placeholder?' ph':''}">${s.logoImg?`<img src="${escS(s.logo)}" alt="${escS(s.name)}">`:`<b style="--sc:${escS(s.color||'#fff')}">${escS(s.name)}</b>`}<small>${s.placeholder?'Career partner slot':'is hiring for this'}</small></div>`:''}</div>
    <p class="mk-link">${c.link}</p><p>${c.what}</p><p class="mk-path"><b>How to get there:</b> ${c.path}</p>
    ${c.ky?'<p class="mk-ky">📍 <b>Kentucky is a metals state:</b> 1,000+ metals facilities and 36,000+ people working directly in metals. Jobs in primary metals average about $90K a year. <small>Source: MI2 / UK Gatton metals impact study</small></p>':''}
    <div class="mk-sk">${c.skills.map(x=>`<span>${x}</span>`).join('')}</div>
    ${s&&s.jobsUrl&&!s.placeholder?`<a class="btn sm mk-go" href="${escS(s.jobsUrl)}" target="_blank" rel="noopener" data-sp="${escS(s.name)}" data-role="${k}">See real jobs at ${escS(s.name)} ↗</a>`:''}</div>`; }
document.addEventListener('click',e=>{ const a=e.target.closest&&e.target.closest('.mk-go'); if(a) spTrack('click',{name:a.dataset.sp},{role:a.dataset.role}); });
