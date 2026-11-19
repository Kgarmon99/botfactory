/* =====================================================================
   BOTFACTORY · Sponsor Showcase: the Kentucky Steel Mill field trip
   Scrap yard → Electric arc furnace → Continuous caster → Hot rolling → Coil
   Sponsor-ready: SPONSORS.showcase (or ?sponsor=Name) brands the whole mill.
   ===================================================================== */
const MX=320;                       /* the mill lives far from the plant */
const MILL={on:false,g:null,step:0,done:[0,0,0,0],coll:[],saved:null,fx:{},t:0};
const MSTOPS=[
  {x:-22,z:1.2,key:'magnet',name:'Scrap Yard',icon:'🧲',career:'craneop',cap:'Stop 1 · Scrap Yard',blurb:'Kentucky mills melt old cars, appliances and beams back into brand-new steel.'},
  {x:-8,z:1.2,key:'furnace',name:'Electric Arc Furnace',icon:'⚡',career:'meltshop',cap:'Stop 2 · Melt Shop',blurb:'Giant graphite electrodes make lightning hot enough to melt scrap in under an hour.'},
  {x:6,z:1.2,key:'caster',name:'Continuous Caster',icon:'🌋',career:'metallurgist',cap:'Stop 3 · Caster',blurb:'Liquid steel pours into a cooled mold and comes out as a glowing solid slab.'},
  {x:20,z:1.2,key:'roll',name:'Hot Rolling Mill',icon:'🔥',career:'mill',cap:'Stop 4 · Rolling Mill',blurb:'Huge rolls squeeze a slab thinner and thinner until it\'s a coil of sheet steel.'}];
function millSponsor(){return slotFill('showcase',SPONSORS.showcase);}
function millName(){const s=millSponsor();return s?(s.placeholder?'YOUR COMPANY HERE':s.name):'Kentucky Steel Mill';}
function millBounds(){return {x0:MX-31,x1:MX+31,z0:-11,z1:7.6};}

/* ---------- building the mill ---------- */
function buildMill(){if(MILL.g)scene.remove(MILL.g);const g=new THREE.Group();MILL.g=g;g.position.x=MX;scene.add(g);const F=MILL.fx={};
  const dark=mat('#1B2027',{roughness:.6,metalness:.4}),rust=mat('#7C4A2B',{roughness:.9,metalness:.3}),steelM=mat('#6B7280',{roughness:.45,metalness:.85}),yel=mat('#FACC15',{roughness:.45}),refr=mat('#3B2F2A',{roughness:.95}),hot=mat('#FF7A1A',{emissive:'#FF5A00',emissiveIntensity:2.4,roughness:.5}),hot2=mat('#FFB347',{emissive:'#FF8A00',emissiveIntensity:3.2});
  const ct=concreteTex().clone();ct.needsUpdate=true;ct.repeat.set(8,3);ct.wrapS=ct.wrapT=THREE.RepeatWrapping;const fl=new THREE.Mesh(new THREE.PlaneGeometry(64,20),new THREE.MeshStandardMaterial({map:ct,color:'#6B7076',roughness:.5,metalness:.1}));fl.rotation.x=-Math.PI/2;fl.position.set(0,0,-1.6);fl.receiveShadow=true;g.add(fl);
  const et=epoxyTex().clone();et.needsUpdate=true;et.wrapS=et.wrapT=THREE.RepeatWrapping;et.repeat.set(7,1);const ai=new THREE.Mesh(new THREE.PlaneGeometry(60,3.4),new THREE.MeshStandardMaterial({map:et,roughness:.4}));ai.rotation.x=-Math.PI/2;ai.position.set(0,.012,5);g.add(ai);
  const wm=new THREE.MeshStandardMaterial({map:sidingTex(),roughness:.55,metalness:.35});bx(g,64,13,.5,0,0,-11.6,wm);bx(g,.5,13,20,-32,0,-1.6,wm);bx(g,.5,13,20,32,0,-1.6,wm);bx(g,64,.6,.3,0,0,8,wm);
  for(let x=-30;x<=30;x+=10){bx(g,.7,13.5,.7,x,0,-11.3,mat('#2E7D5B',{metalness:.5,roughness:.45}));}
  bx(g,62,.5,.6,0,11,-10.8,yel,false);
  const sp=millSponsor(),sg=signMesh([{t:millName().toUpperCase(),size:110,color:sp&&sp.placeholder?'#FACC15':'#FF8A3D'},{t:(sp&&sp.tagline)||'Recycled scrap in. Kentucky steel out.',size:46,color:'#fff',font:'Inter, system-ui, sans-serif',weight:700}],18,3,{w:1800,h:300,bg:'#0D1117',glow:1});sg.position.set(0,8.4,-11.3);g.add(sg);
  /* stop 1: scrap pile + magnet crane */
  for(let i=0;i<70;i++){const a=Math.random()*6.28,r=Math.sqrt(Math.random())*4.2,h=Math.max(.2,2.8-r*.6),m=Math.random()<.8?rust:steelM;const b=new THREE.Mesh(Math.random()<.6?BOX:CYL,m);b.scale.set(rand(.3,1.2),rand(.2,.7),rand(.3,1.1));b.position.set(-22+Math.cos(a)*r,rand(0,h),-4.5+Math.sin(a)*r*.7);b.rotation.set(rand(0,3),rand(0,3),rand(0,3));b.castShadow=Q.t>0;g.add(b);}
  bx(g,.5,9,.5,-28,0,-4.5,yel);bx(g,.5,9,.5,-16,0,-4.5,yel);bx(g,12.5,.6,.8,-22,9,-4.5,yel);const mag=new THREE.Group();cy(mag,.03,3.5,0,-3.5,0,dark,false);cy(mag,1,.35,0,-3.9,0,dark);mag.position.set(-22,9,-4.5);g.add(mag);F.mag=mag;
  /* stop 2: electric arc furnace + ladle */
  const fu=new THREE.Group();fu.position.set(-8,0,-5);g.add(fu);cy(fu,3,.6,0,0,0,dark);cy(fu,2.8,3,0,.6,0,refr);cy(fu,3.05,.25,0,3.5,0,mat('#FF6A00',{emissive:'#FF4A00',emissiveIntensity:1.2}));const roof=cy(fu,2.9,.5,0,3.75,0,dark);
  F.elec=[[-.9,0],[.9,0],[0,1]].map(([x,z])=>cy(fu,.28,4.2,x,3.6,z-.4,mat('#4B5563',{roughness:.3,metalness:.6})));F.arcs=new THREE.PointLight(0x9FD4FF,0,16,2);F.arcs.position.set(-8,4,-5);g.add(F.arcs);
  const lad=new THREE.Group();lad.position.set(-2.5,0,-4);g.add(lad);cy(lad,1.5,2.4,0,.4,0,refr);cy(lad,1.38,.08,0,2.82,0,hot);bx(lad,.2,3.2,.2,-1.6,0,0,dark);bx(lad,.2,3.2,.2,1.6,0,0,dark);bx(lad,3.4,.2,.2,0,3.2,0,dark);F.ladleTop=lad.children[1];
  const stream=new THREE.Mesh(CYL,hot2);stream.scale.set(.18,2.4,.18);stream.position.set(-4.3,2.7,-4.5);stream.rotation.z=.9;stream.visible=false;g.add(stream);F.stream=stream;
  /* stop 3: caster: tundish, mold, glowing strand, slabs on rollers */
  bx(g,3,1.1,1.6,6,4.2,-5,refr);[-1.2,1.2].forEach(x=>bx(g,.3,4.2,.3,6+x,0,-5,dark));bx(g,1.2,1.6,1.2,6,2.6,-5,mat('#94A3B8',{metalness:.9,roughness:.3}));
  for(let i=0;i<14;i++){const r=new THREE.Mesh(CYL,steelM);r.scale.set(.18,1.6,.18);r.rotation.x=Math.PI/2;r.position.set(6+i*.75,.75,-5);g.add(r);}
  F.slabs=[];for(let i=0;i<3;i++){const s=new THREE.Mesh(BOX,hot);s.scale.set(2.2,.4,1.2);s.position.set(7+i*3,1.05,-5);g.add(s);F.slabs.push(s);}
  F.casterLight=new THREE.PointLight(0xFF7A1A,0,14,2);F.casterLight.position.set(8,3,-4);g.add(F.casterLight);
  /* stop 4: rolling stands + strip + coiler */
  F.rolls=[];for(let i=0;i<4;i++){const x=15+i*3;[-1.3,1.3].forEach(z=>bx(g,.6,4,.6,x,0,-5+z,mat('#1E3A8A',{metalness:.5,roughness:.4})));bx(g,.8,.6,3.2,x,4,-5,mat('#1E3A8A',{metalness:.5,roughness:.4}));
    [1.0,1.75].forEach(y=>{const r=new THREE.Mesh(CYL,mat('#9CA3AF',{metalness:.95,roughness:.2}));r.scale.set(.45,2.2,.45);r.rotation.x=Math.PI/2;r.position.set(x,y,-5);g.add(r);F.rolls.push(r);});}
  const strip=new THREE.Mesh(BOX,hot);strip.scale.set(16,.08,1.1);strip.position.set(21,1.38,-5);g.add(strip);F.strip=strip;
  const coil=new THREE.Mesh(new THREE.TorusGeometry(.9,.55,14,28),hot);coil.position.set(28,1.5,-5);g.add(coil);F.coil=coil;bx(g,1.6,1,2,28,0,-5,dark);
  F.rollLight=new THREE.PointLight(0xFF8A3D,0,14,2);F.rollLight.position.set(21,3,-3.5);g.add(F.rollLight);
  /* truck out to your factory */
  const tr=makeTruck('#F97316','TO: YOUR FACTORY');tr.position.set(MX+28,0,3.4);tr.rotation.y=0;F.truck=tr;
  /* stop pads: holo signs */
  F.pads=MSTOPS.map((s,i)=>{const p=signMesh([{t:s.icon+'  '+s.cap.toUpperCase(),size:64,color:'#FACC15'},{t:s.name,size:52,color:'#fff'}],5.4,1.4,{w:1100,h:290,bg:'rgba(10,14,20,.92)',border:'#FACC15',bw:8,r:24,glow:.7});p.position.set(s.x,4.8,-.6);g.add(p);
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.1,1.35,40),new THREE.MeshBasicMaterial({color:'#FACC15',transparent:true,opacity:.8,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(s.x,.04,4.6);g.add(ring);return {p,ring};});
  /* glow lights for the hall */
  if(Q.t>=1){[-18,0,18].forEach(x=>{const h=new THREE.PointLight(0xFFC08A,1.1,34,2);h.position.set(x,8,0);g.add(h);});}
  for(let x=-26;x<=26;x+=13){const f=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.5),new THREE.MeshBasicMaterial({color:'#FFE8C2'}));f.position.set(x,10.4,-11.2);g.add(f);}
  MILL.coll=[{x0:MX-31,x1:MX+31,z0:-11,z1:-2.1}];}
/* ---------- in and out ---------- */
function enterMill(){if(!S||MILL.on)return;if(S.phase!=='board'){toast('Field trips happen between shifts. Finish this shift first!','warn');return;}
  if(modalOpen())closeModal();if(TWIN.on)toggleTwin(false);if(CX.riding)toggleRide();
  MILL.on=true;MILL.step=MILL.done.findIndex(d=>!d);if(MILL.step<0)MILL.step=0;if(!MILL.g)buildMill();MILL.g.visible=true;MILL.fx.truck.visible=true;
  MILL.saved={pos:P.pos.clone(),coll:COLL.splice(0,COLL.length),fogN:scene.fog.near,fogF:scene.fog.far,bg:scene.background.clone()};MILL.coll.forEach(c=>COLL.push(c));
  P.pos.set(MX-27,0,5);P.ry=Math.PI/2;scene.fog.near=55;scene.fog.far=150;scene.background.set('#120E0C');scene.fog.color.set('#120E0C');sun.position.set(MX-20,40,30);sun.target.position.set(MX,0,0);sun.intensity=.9;hemi.intensity=.5;camera.position.set(...playerCam());camS.look.set(P.pos.x,.8,P.pos.z-1.5);
  document.body.classList.add('inmill');$('#millBar').hidden=false;$('#millName').textContent=millName();const sp=millSponsor();if(sp)spTrack('view',sp,{slot:'showcase'});
  if(!PARAMS.has('test')){const pl=()=>[P.pos.x,.8,P.pos.z-1.5];playShots([{p:[MX+30,3,8],p2:[MX+10,6,10],l:[MX+22,1.5,-5],l2:[MX-8,3,-5],d:3.6,cap:'<small>FIELD TRIP</small>'+esc(millName())},{p:[MX-6,9,6],p2:[MX-18,5,9],l:[MX-8,3,-5],l2:[MX-22,1.5,-4],d:3.2,cap:'Every MiniBot you build starts as recycled scrap, right here.'},{p:[MX-18,5,9],p2:playerCam,l:[MX-22,1.5,-4],l2:pl,d:2,cap:'',slam:['MILL TOUR','4 stops · real Kentucky jobs','#FF8A3D']}],()=>advise(`Welcome to <b>${esc(millName())}</b>! Walk to <b>Stop 1</b> and press <b>${TOUCH?'the button':'E'}</b> to work the magnet crane.`,10000));}
  else advise('Welcome to the mill tour!',4000);sfx('big');}
function exitMill(){if(!MILL.on)return;MILL.on=false;MILL.g.visible=false;MILL.fx.truck.visible=false;COLL.length=0;MILL.saved.coll.forEach(c=>COLL.push(c));P.pos.copy(MILL.saved.pos);scene.fog.near=MILL.saved.fogN;scene.fog.far=MILL.saved.fogF;scene.background.copy(MILL.saved.bg);sun.target.position.set(0,0,0);camera.position.set(...playerCam());camS.look.set(P.pos.x,.8,P.pos.z-1.5);
  document.body.classList.remove('inmill');$('#millBar').hidden=true;camS.mode='play';renderHUD();save();}
/* ---------- acts + guide ---------- */
function millAct(){const i=MILL.step,s=MSTOPS[i];if(i<0||!s)return {t:'Tour complete! Head home',ic:'🏠',f:exitMill};
  for(let j=0;j<MSTOPS.length;j++){const st=MSTOPS[j];if(Math.hypot(P.pos.x-(MX+st.x),P.pos.z-4.6)<2.6){if(MILL.done[j]&&j!==i)return {t:`${st.name} ✓ done`,ic:'✓',f:null};if(j!==i)return {t:`Finish ${MSTOPS[i].cap} first`,ic:'🔒',f:null};return {t:`${st.icon} Work the ${st.name}`,ic:'▶',hot:1,f:()=>millGame(j)};}}return null;}
function millGoal(){const i=MILL.step,s=MSTOPS[i];if(!s)return {t:'Tour complete! Tap Exit tour to head back to your factory',k:'🏠'};return {t:`${s.cap}: ${s.name}`,k:s.icon,hot:1,x:MX+s.x,z:4.6};}
function millGame(j){const s=MSTOPS[j];playGame(s.key,{p:'kart'},score=>{MILL.done[j]=1;S.stats.games++;MILL.step=MILL.done.findIndex(d=>!d);sfx('good');
  const c=CAREERS[s.career];floatAt(MX+s.x,3.2,2,s.name.toUpperCase()+' ONLINE','#FF8A3D',true);setTimeout(()=>advise(`${c.icon} <b>Real job: ${c.role}.</b> ${c.what}`,11000),600);(S.flags.careersShown=S.flags.careersShown||{})[s.career]=1;
  if(MILL.step<0)setTimeout(millFinale,1400);});}
function millFinale(){S.flags.millPartner=1;S.flags.millDone=1;const sp=millSponsor();sfx('big');confetti(200);slam('TOUR COMPLETE','You made Kentucky steel','#FF8A3D',2200);
  setTimeout(()=>{const C=openModal(`<div class="rep"><div class="eyebrow">Field trip · ${esc(millName())}</div><h2>From scrap to steel coil</h2><p class="sub">You just ran the four big steps every steel mill uses. That coil is on a truck to <b>your</b> factory.</p>
    <div class="mill-steps">${MSTOPS.map(s=>`<div><span>${s.icon}</span><b>${s.name}</b><small>${s.blurb}</small></div>`).join('')}</div>
    <div class="mk-ky">📍 <b>Kentucky is a metals state:</b> 1,000+ metals facilities, 36,000+ people working directly in metals, and primary metals jobs that average about $90K a year. <small>Source: MI2 / UK Gatton metals impact study</small></div>
    <div class="note">🤝 <b>Partner bonus unlocked:</b> your factory now buys steel <b>15% cheaper</b>. Strong supplier relationships lower your variable costs.</div>
    <h4>Jobs you just did</h4><div class="mk-grid">${MSTOPS.map(s=>{const c=CAREERS[s.career];return `<div class="mkc"><span>${c.icon}</span><b>${c.role}</b><small>${c.path.split('.')[0]}.</small></div>`;}).join('')}</div>
    <div class="mact">${spBadge(sp,'Mill tour presented by')}<button class="btn pri big" id="mlOk" data-focus>Back to my factory</button></div></div>`,{cls:'dark panel wide'});C.querySelector('#mlOk').onclick=()=>{closeModal();exitMill();toast('🤝 Steel partnership active: materials cost 15% less','good');};},2300);}
/* ---------- per frame ---------- */
function updateMill(dt,t){if(!MILL.on)return;const F=MILL.fx,D=MILL.done;
  if(F.mag)F.mag.position.y=9+Math.sin(t*.8)*.6;F.pads.forEach((p,i)=>{p.ring.material.color.set(D[i]?'#39E75F':i===MILL.step?'#FACC15':'#475569');p.ring.scale.setScalar(1+Math.sin(t*3+i)*.06);});
  /* furnace comes alive after stop 2 (or while you are at it) */
  const fOn=D[1]||MILL.step===1;F.arcs.intensity=D[1]?rand(2,6):fOn?rand(0,1.2):0;if(D[1]&&Math.random()<dt*24)burst(MX-8+rand(-1,1),4,-5+rand(-1,1),{add:true,n:3,color:pick(['#FFFFFF','#BFE3FF','#FFD27A']),spread:3,up:3,life:.5,size:.06});
  F.stream.visible=!!D[1];F.stream.scale.y=2.4+Math.sin(t*20)*.08;F.ladleTop.material.emissiveIntensity=D[1]?2.6+Math.sin(t*6)*.4:.3;if(D[1]&&Math.random()<dt*10)burst(MX-2.5+rand(-1,1),3,-4,{add:true,n:2,color:'#FF9A3D',spread:2,up:2.5,life:.5,size:.05});
  F.casterLight.intensity=D[2]?2.2:0;F.slabs.forEach((s,i)=>{s.visible=!!D[2];if(D[2]){s.position.x+=dt*1.2;if(s.position.x>14)s.position.x=7;}});
  F.rollLight.intensity=D[3]?2.4:0;F.strip.visible=!!D[3];F.coil.visible=!!D[3];F.rolls.forEach(r=>r.rotation.y+=dt*(D[3]?6:0));if(F.coil.visible)F.coil.rotation.z-=dt*2;
  if(D[3]&&Math.random()<dt*5)burst(MX+15+Math.floor(rand(0,4))*3,2.2,-5,{n:2,color:'#E5E7EB',spread:.5,up:1.2,g:-1.5,life:1.4,size:.3,grow:3});}

/* ---------- the four mill mini-games ---------- */
Object.assign(MG_INFO,{
  magnet:{icon:'🧲',name:'Scrap Yard · Crane Operator',title:'Grab the steel',how:'Scrap rolls past. Tap the <b>steel</b> pieces (dark and rusty) to grab them with the magnet. Leave the <b>aluminum</b> (shiny silver).',fact:'Steel has iron in it, so a magnet grabs it. Aluminum isn\'t magnetic, which is how mills sort scrap. Kentucky mills recycle millions of tons of scrap into new metal.',secs:10,reward:'Scrap sorted and loaded into the furnace bucket.'},
  furnace:{icon:'⚡',name:'Melt Shop · Furnace Operator',title:'Melt the scrap',how:'Hold <b>POWER</b> to heat the furnace. Keep it in the green zone (2,900–3,100°F) until the bar fills. Too hot wastes electricity!',fact:'An electric arc furnace runs on as much power as a small city. Furnace operators balance speed, temperature and energy cost every single heat.',secs:10,reward:'Molten steel tapped into the ladle. 🔥'},
  caster:{icon:'🌋',name:'Caster · Operator',title:'Hold the casting speed',how:'Keep the speed needle in the green band with ◀ and ▶. Too fast and the slab breaks; too slow and the whole mill backs up.',fact:'A continuous caster turns liquid steel into solid slabs nonstop, for days at a time. Metallurgists check the chemistry of every batch.',secs:9,reward:'Perfect glowing slabs rolling out of the caster.'},
  roll:{icon:'🔥',name:'Hot Rolling · Mill Operator',title:'Roll it to gauge',how:'Tap <b>ROLL</b> when the glowing slab lines up under the rolls. Five good passes take it from thick slab to thin sheet.',fact:'A hot strip mill can squeeze a slab thicker than a mattress into sheet steel thinner than a coin, in under a minute.',secs:11,reward:'Coil finished and loaded on the truck to your factory!'}});
const MILL_GAMES={
  magnet(kind,ctx){openModal(mgShell(kind),{cls:'dark mgcard'});const {c,g,w,h}=mgCanvas(),items=[],P2=[];let grabbed=0,wrong=0,steelSeen=0,started=false,sp=0;
    const spawn=()=>{const st=Math.random()<.6;if(st)steelSeen++;items.push({x:w+40,y:h*.62+rand(-10,10),st,r:rand(16,24),a:rand(0,6),lift:0,gone:false});};
    const draw=dt=>{g.fillStyle='#1A1410';g.fillRect(0,0,w,h);g.fillStyle='#2B2F35';g.fillRect(0,h*.62+26,w,22);for(let x=(-sp*60)%40;x<w;x+=40){g.fillStyle='#3B4048';g.fillRect(x,h*.62+30,20,14);}
      g.fillStyle='#374151';g.fillRect(w*.42,0,8,h*.2);g.fillStyle='#111827';g.beginPath();g.ellipse(w*.42+4,h*.22,46,12,0,0,7);g.fill();
      items.forEach(it=>{if(it.gone)return;g.save();g.translate(it.x,it.y-it.lift);g.rotate(it.a);if(it.st){g.fillStyle='#6B4A35';g.fillRect(-it.r,-it.r*.6,it.r*2,it.r*1.2);g.fillStyle='rgba(160,82,45,.8)';g.fillRect(-it.r*.6,-it.r*.4,it.r*.7,it.r*.5);}else{const gr=g.createLinearGradient(-it.r,0,it.r,0);gr.addColorStop(0,'#E5E7EB');gr.addColorStop(.5,'#FFFFFF');gr.addColorStop(1,'#9CA3AF');g.fillStyle=gr;g.beginPath();g.ellipse(0,0,it.r,it.r*.55,0,0,7);g.fill();}g.restore();});mgDrawSparks(g,P2,dt);};
    mgPointer(c,(ev,p)=>{if(ev!=='down')return;if(!started){started=true;$('#mgGo').style.display='none';initAudio();
        mgTimer(MG_INFO[kind].secs,dt=>{sp+=dt;if(Math.random()<dt*2.4)spawn();items.forEach(it=>{if(it.lift>0){it.lift+=dt*260;if(it.lift>h)it.gone=true;}else it.x-=dt*110;});$('#mgP').style.width=Math.min(100,grabbed/8*100)+'%';draw(dt);},()=>mgFinish(kind,(grabbed-wrong)/Math.max(6,Math.min(steelSeen,10)),ctx));return;}
      const it=items.find(i=>!i.gone&&!i.lift&&Math.hypot(i.x-p.x,i.y-p.y)<i.r+12);if(!it)return;if(it.st){it.lift=1;grabbed++;sfx('clang');mgSpark(P2,it.x,it.y,10,['#FACC15','#fff']);}else{wrong++;sfx('bad');it.a+=1;}});draw(0);},
  furnace(kind,ctx){openModal(mgShell(kind,`<div class="mg-stage"><canvas id="mgC"></canvas></div><div class="rp-row"><button class="btn pri big" id="fuBtn">⚡ HOLD FOR POWER</button></div><div class="mg-bar"><i id="mgP"></i></div>`),{cls:'dark mgcard'});
    const {c,g,w,h}=mgCanvas();let temp=1800,hold=false,inZ=0,waste=0,started=false;const P2=[];
    const draw=dt=>{g.fillStyle='#120C0A';g.fillRect(0,0,w,h);const k=clamp((temp-1800)/1600,0,1);const r=g.createRadialGradient(w*.38,h*.62,10,w*.38,h*.62,h*.6);r.addColorStop(0,`rgba(255,${120+k*120|0},40,${.2+k*.8})`);r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,w,h);
      g.fillStyle='#3B2F2A';g.beginPath();g.ellipse(w*.38,h*.7,w*.22,h*.18,0,0,7);g.fill();g.fillStyle=`rgba(255,${90+k*140|0},20,${.3+k*.7})`;g.beginPath();g.ellipse(w*.38,h*.66,w*.18,h*.1,0,0,7);g.fill();
      [-.08,0,.08].forEach(o=>{g.fillStyle='#4B5563';g.fillRect(w*(.38+o)-6,0,12,h*.52);if(hold){g.strokeStyle='rgba(200,230,255,.9)';g.lineWidth=2;g.beginPath();let y=h*.52;g.moveTo(w*(.38+o),y);for(let i=0;i<5;i++){y+=h*.025;g.lineTo(w*(.38+o)+rand(-8,8),y);}g.stroke();}});
      const gx=w*.8,gy=h*.1,gh=h*.8;g.fillStyle='#1F2937';g.fillRect(gx,gy,30,gh);const yOf=T=>gy+gh-(T-1800)/1600*gh;g.fillStyle='rgba(57,231,95,.35)';g.fillRect(gx,yOf(3100),30,yOf(2900)-yOf(3100));g.fillStyle=temp>3100?'#F87171':temp>=2900?'#39E75F':'#FB923C';g.fillRect(gx+6,yOf(temp),18,gy+gh-yOf(temp));
      g.fillStyle='#fff';g.font='700 18px ui-monospace, monospace';g.textAlign='right';g.fillText(Math.round(temp).toLocaleString()+'°F',gx-10,yOf(temp)+6);g.textAlign='left';mgDrawSparks(g,P2,dt);};
    const btn=$('#fuBtn'),on=()=>{hold=true;initAudio();if(!started){started=true;mgTimer(MG_INFO[kind].secs,dt=>{temp+=(hold?620:-380)*dt;temp=clamp(temp,1800,3400);if(temp>=2900&&temp<=3100)inZ+=dt;if(temp>3150)waste+=dt;if(hold&&Math.random()<.4){mgSpark(P2,w*.38+rand(-40,40),h*.55,4,['#BFE3FF','#fff','#FFD27A']);if(Math.random()<.3)sfx('zap');}$('#mgP').style.width=Math.min(100,inZ/3*100)+'%';if(inZ>=3)MG.stop=true;draw(dt);},()=>mgFinish(kind,inZ/3-waste*.15,ctx));}},off=()=>{hold=false;};
    btn.addEventListener('pointerdown',on);btn.addEventListener('pointerup',off);btn.addEventListener('pointerleave',off);addEventListener('keydown',e=>{if(e.code==='Space'&&MG.on){e.preventDefault();on();}});addEventListener('keyup',e=>{if(e.code==='Space')off();});draw(0);},
  caster(kind,ctx){openModal(mgShell(kind,`<div class="mg-stage"><canvas id="mgC"></canvas></div><div class="rp-row"><button class="btn big" id="caL">◀ Slower</button><button class="btn big" id="caR">Faster ▶</button></div><div class="mg-bar"><i id="mgP"></i></div>`),{cls:'dark mgcard'});
    const {c,g,w,h}=mgCanvas();let v=.5,drift=0,band=.5,good=0,started=false,push=0,sx=0;
    const draw=()=>{g.fillStyle='#120C0A';g.fillRect(0,0,w,h);sx=(sx+v*6)%60;for(let x=-60+sx;x<w;x+=60){const gr=g.createLinearGradient(0,h*.55,0,h*.75);gr.addColorStop(0,'#FFB347');gr.addColorStop(1,'#FF5A00');g.fillStyle=gr;g.fillRect(x,h*.58,52,h*.14);}
      for(let x=0;x<w;x+=30){g.fillStyle='#4B5563';g.beginPath();g.arc(x+15,h*.76,8,0,7);g.fill();}
      const bx2=w*.1,bw=w*.8,y=h*.22;g.fillStyle='#1F2937';g.fillRect(bx2,y,bw,22);g.fillStyle='rgba(57,231,95,.45)';g.fillRect(bx2+(band-.12)*bw,y,bw*.24,22);g.fillStyle='#fff';g.fillRect(bx2+v*bw-3,y-8,6,38);g.font='700 14px Inter, system-ui';g.fillStyle='#9CA3AF';g.fillText('SLOW',bx2,y-12);g.textAlign='right';g.fillText('FAST',bx2+bw,y-12);g.textAlign='left';};
    const go=d=>{initAudio();push=d;if(!started){started=true;mgTimer(MG_INFO[kind].secs,dt=>{drift+=rand(-1,1)*dt*2;drift=clamp(drift,-.5,.5);v=clamp(v+drift*dt*.5+push*dt*.9,0,1);band=clamp(.5+Math.sin(performance.now()/1400)*.25,.15,.85);if(Math.abs(v-band)<.12)good+=dt;$('#mgP').style.width=Math.min(100,good/6*100)+'%';draw();},()=>mgFinish(kind,good/6,ctx));}};
    [['#caL',-1],['#caR',1]].forEach(([id,d])=>{const b=$(id);b.addEventListener('pointerdown',()=>go(d));b.addEventListener('pointerup',()=>push=0);b.addEventListener('pointerleave',()=>push=0);});draw();},
  roll(kind,ctx){openModal(mgShell(kind,`<div class="mg-stage"><canvas id="mgC"></canvas></div><div class="rp-row"><button class="btn pri big" id="roBtn">▶ START</button></div><div class="mg-bar"><i id="mgP"></i></div>`),{cls:'dark mgcard'});
    const {c,g,w,h}=mgCanvas(),gauges=[250,120,60,25,8,3];let pass=0,x=0,dir=1,miss=0,started=false,flash=0;const P2=[];
    const draw=dt=>{g.fillStyle='#120C0A';g.fillRect(0,0,w,h);const th=Math.max(4,gauges[pass]/250*70),sw=w*.34;const gr=g.createLinearGradient(0,h*.6-th/2,0,h*.6+th/2);gr.addColorStop(0,'#FFD27A');gr.addColorStop(1,'#FF5A00');g.fillStyle=gr;g.fillRect(x-sw/2,h*.6-th/2,sw,th);
      g.fillStyle=flash>0?'#FACC15':'#9CA3AF';g.beginPath();g.arc(w/2,h*.6-th/2-26,24,0,7);g.arc(w/2,h*.6+th/2+26,24,0,7);g.fill();g.strokeStyle='rgba(57,231,95,.6)';g.setLineDash([6,6]);g.strokeRect(w/2-sw*.12,h*.18,sw*.24,h*.75);g.setLineDash([]);
      g.fillStyle='#fff';g.font='700 22px ui-monospace, monospace';g.fillText(`GAUGE ${gauges[pass]} mm`,16,32);g.fillStyle='#FACC15';g.font='700 15px Inter, system-ui';g.fillText('target: 3 mm',18,54);flash-=dt;mgDrawSparks(g,P2,dt);};
    $('#roBtn').onclick=()=>{initAudio();if(!started){started=true;$('#roBtn').textContent='🔥 ROLL!';x=-w*.2;mgTimer(MG_INFO[kind].secs,dt=>{x+=dir*dt*w*(.55+pass*.12);if(x>w*1.1){dir=-1;}if(x<-w*.1){dir=1;}draw(dt);if(pass>=5)MG.stop=true;$('#mgP').style.width=(pass/5*100)+'%';},()=>mgFinish(kind,pass/5-miss*.06,ctx));return;}
      if(Math.abs(x-w/2)<w*.08){pass=Math.min(5,pass+1);flash=.2;sfx('clang');mgSpark(P2,w/2,h*.6,18,['#FFD27A','#FF5A00','#fff']);}else{miss++;sfx('bad');}};draw(0);}};
