/* =====================================================================
   BOTFACTORY · cinematic layer
   real product models (karts, drones, scooters, robot dogs, EVs) · Bot City
   streets + traffic · finished-goods lot full of cars · AGV robots · drones
   · robot dog patrol · rideable forklift · racks, screens, light shafts,
   dust · time of day across a shift · movie intro, shift slams, letterbox
   ===================================================================== */
const CX={cars:[],agvs:[],drones:[],dog:null,fork:null,riding:false,screens:[],dust:null,shafts:[],props:null,lot:null,parked:[],lamps:[],shot:null,slamT:0};

/* ---------- product models ---------- */
const PM={};
function pmat(p,painted){const k=p+(painted?'P':'R');if(PM[k])return PM[k];const c=painted?PCOL[p]:'#9CA3AF';
  return PM[k]={body:mat(c,{roughness:painted?.28:.4,metalness:painted?.35:.85}),dark:mat('#1F2937',{roughness:.5,metalness:.4}),tire:mat('#111318',{roughness:.85}),glass:mat('#0F172A',{roughness:.05,metalness:.6}),light:mat('#FFFBEB',{emissive:'#FFF7D6',emissiveIntensity:1.6}),led:mat('#39E75F',{emissive:'#39E75F',emissiveIntensity:2})};}
function wheel(g,r,w,x,y,z,m){const e=new THREE.Mesh(CYL,m);e.scale.set(r,w,r);e.rotation.x=Math.PI/2;e.position.set(x,y,z);g.add(e);return e;}
function makeProduct(p,painted){const g=new THREE.Group(),M=pmat(p,painted);
  if(p==='toy'){bx(g,.34,.34,.3,0,0,0,M.body);bx(g,.28,.22,.26,0,.36,0,M.body);bx(g,.2,.06,.02,0,.44,.135,M.glass);bx(g,.05,.05,.02,-.05,.45,.14,M.led);bx(g,.05,.05,.02,.05,.45,.14,M.led);cy(g,.015,.14,0,.58,0,M.dark);sp(g,.03,0,.74,0,M.led);}
  else if(p==='kart'){bx(g,.82,.08,.46,0,.09,0,M.body);bx(g,.22,.22,.3,-.1,.17,0,M.dark);bx(g,.06,.2,.32,-.24,.17,0,M.body);cy(g,.012,.22,.2,.17,0,M.dark);const sw=new THREE.Mesh(new THREE.TorusGeometry(.07,.015,6,16),M.dark);sw.position.set(.18,.38,0);sw.rotation.y=Math.PI/2;g.add(sw);
    [[.3,.25],[.3,-.25],[-.3,.27],[-.3,-.27]].forEach(([x,z],i)=>wheel(g,i<2?.09:.11,.08,x,i<2?.09:.11,z,M.tire));bx(g,.08,.06,.5,.4,.08,0,M.dark);}
  else if(p==='drone'){bx(g,.22,.1,.22,0,.12,0,M.body);bx(g,.12,.04,.08,0,.08,.1,M.glass);[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a,b])=>{const arm=bx(g,.36,.03,.04,a*.13,.16,b*.13,M.dark);arm.rotation.y=a*b*Math.PI/4;cy(g,.03,.06,a*.25,.15,b*.25,M.dark);const r=new THREE.Mesh(CYL,mat('#E5E7EB',{transparent:true,opacity:.55}));r.scale.set(.13,.008,.13);r.position.set(a*.25,.22,b*.25);g.add(r);(g.userData.rot=g.userData.rot||[]).push(r);});
    [[.08,0],[-.08,0]].forEach(([x])=>bx(g,.02,.08,.2,x,0,0,M.dark));}
  else if(p==='scooter'){bx(g,.66,.05,.18,0,.08,0,M.body);cy(g,.02,.62,.28,.1,0,M.dark);bx(g,.03,.03,.34,.28,.72,0,M.dark);wheel(g,.08,.05,.3,.08,0,M.tire);wheel(g,.08,.05,-.3,.08,0,M.tire);bx(g,.03,.05,.08,.33,.6,0,M.light);}
  else if(p==='dog'){bx(g,.46,.2,.22,0,.26,0,M.body);bx(g,.18,.16,.17,.28,.36,0,M.body);bx(g,.06,.05,.12,.37,.38,0,M.glass);bx(g,.04,.03,.03,.38,.41,.05,M.led);bx(g,.04,.03,.03,.38,.41,-.05,M.led);
    g.userData.legs=[[.16,.08],[.16,-.08],[-.16,.08],[-.16,-.08]].map(([x,z])=>{const L=new THREE.Group();L.position.set(x,.26,z);bx(L,.05,.26,.05,0,-.26,0,M.dark);g.add(L);return L;});const t=bx(g,.03,.03,.16,-.26,.32,0,M.dark);t.rotation.z=.6;}
  else if(p==='ev'){bx(g,.92,.2,.44,0,.08,0,M.body);const cab=bx(g,.5,.17,.4,-.04,.27,0,M.glass);bx(g,.46,.03,.38,-.04,.44,0,M.body);
    [[.3,.23],[.3,-.23],[-.3,.23],[-.3,-.23]].forEach(([x,z])=>wheel(g,.1,.07,x,.1,z,M.tire));bx(g,.02,.04,.1,.46,.17,.15,M.light);bx(g,.02,.04,.1,.46,.17,-.15,M.light);bx(g,.02,.04,.34,-.46,.17,0,mat('#EF4444',{emissive:'#EF4444',emissiveIntensity:1.2}));}
  g.traverse(o=>{if(o.isMesh)o.castShadow=Q.t>=2;});return g;}
const PPOOL={};let ppUsed={};
function prodAt(p,painted,x,y,z,t){const k=p+(painted?'P':'R'),pool=PPOOL[k]||(PPOOL[k]=[]);const i=ppUsed[k]=(ppUsed[k]||0);ppUsed[k]++;
  let g=pool[i];if(!g){g=makeProduct(p,painted);scene.add(g);pool.push(g);}g.visible=true;g.position.set(x,y,z);g.rotation.y=0;
  if(g.userData.rot)g.userData.rot.forEach(r=>r.rotation.y=t*30);return g;}
function prodFrame(){ppUsed={};}
function prodHide(){for(const k in PPOOL){const u=ppUsed[k]||0;PPOOL[k].forEach((g,i)=>{if(i>=u)g.visible=false;});}}

/* ---------- Bot City: road, traffic, streetlights, neighbors ---------- */
function makeCar(color){const g=new THREE.Group(),b=mat(color,{roughness:.25,metalness:.55}),gl=mat('#0F172A',{roughness:.05,metalness:.7}),tr=mat('#111318',{roughness:.85});
  bx(g,4.2,.8,1.9,0,.35,0,b);bx(g,2.2,.7,1.7,-.3,1.15,0,gl);bx(g,2.1,.08,1.72,-.3,1.85,0,b);[[1.35,.85],[1.35,-.85],[-1.35,.85],[-1.35,-.85]].forEach(([x,z])=>wheel(g,.42,.3,x,.42,z,tr));
  bx(g,.05,.18,.4,2.1,.75,.6,pmat('ev',1).light);bx(g,.05,.18,.4,2.1,.75,-.6,pmat('ev',1).light);bx(g,.05,.14,1.5,-2.1,.75,0,mat('#EF4444',{emissive:'#EF4444',emissiveIntensity:1}));g.traverse(o=>{if(o.isMesh)o.castShadow=Q.t>0;});scene.add(g);return g;}
function initCity(){const g=new THREE.Group();scene.add(g);CX.city=g;const asphalt=mat('#2B2F35',{roughness:.9}),side=mat('#9CA3AF',{roughness:.9}),white=mat('#F8FAFC',{emissive:'#ffffff',emissiveIntensity:.15}),yel=mat('#FACC15');
  const road=new THREE.Mesh(new THREE.PlaneGeometry(340,8.4),asphalt);road.rotation.x=-Math.PI/2;road.position.set(0,.01,21);road.receiveShadow=true;g.add(road);
  for(let x=-168;x<170;x+=6)bx(g,3,.02,.16,x,.012,21,yel,false);[16.6,25.4].forEach(z=>bx(g,340,.16,1.4,0,0,z,side,false));
  /* streetlights */
  for(let x=-90;x<=90;x+=15){const s=new THREE.Group();cy(s,.08,6,0,0,0,mat('#374151',{metalness:.6}),false);bx(s,1.6,.08,.08,.75,6,0,mat('#374151'),false);const lamp=new THREE.Mesh(BOX,mat('#FFF1C9',{emissive:'#FFD27A',emissiveIntensity:0}));lamp.scale.set(.6,.12,.3);lamp.position.set(1.45,5.94,0);s.add(lamp);CX.lamps.push(lamp);s.position.set(x,0,16.2);g.add(s);}
  /* neighbors across the road */
  const nb=[['BOT CITY STEEL','#64748B'],['VOLT MOTORS','#1E3A8A'],['ROBO PARTS CO.','#7C2D12'],['CHIP WORKS','#134E4A'],['KY LOGISTICS','#4C1D95']];
  nb.forEach(([n,c],i)=>{const b=new THREE.Group(),w=rand(16,24),h=rand(7,12),x=-70+i*34;bx(b,w,h,12,0,0,0,mat(c,{roughness:.6,metalness:.2}));for(let k=0;k<4;k++)bx(b,w*.18,1.2,.1,-w*.33+k*w*.22,h*.6,-6.05,mat('#CFE8F7',{emissive:'#BFE3FF',emissiveIntensity:.4}),false);
    const s=signMesh([{t:n,size:90,color:'#fff'}],w*.7,1.4,{w:1024,h:200,bg:'#0D1117',glow:.6});s.position.set(0,h+.9,-6.06);s.rotation.y=Math.PI;b.add(s);bx(b,.3,1.6,.3,-w*.3,h,-6,mat('#374151'),false);bx(b,.3,1.6,.3,w*.3,h,-6,mat('#374151'),false);
    for(let k=0;k<3;k++)cy(b,.6,4,w*.3-k*1.6,h,2,mat('#6B7280',{metalness:.6}),false);b.position.set(x,0,38);g.add(b);});
  /* traffic */
  const cols=['#EF4444','#3B82F6','#F8FAFC','#111827','#22C55E','#F59E0B','#A855F7','#06B6D4'];const n=Q.t>=2?12:6;
  for(let i=0;i<n;i++){const dir=i%2?1:-1,c=makeCar(pick(cols));c.position.set(rand(-160,160),0,dir>0?19.2:22.8);c.rotation.y=dir>0?0:Math.PI;CX.cars.push({g:c,dir,v:rand(9,15)});}
  buildGoodsLot();}
/* finished goods lot: every product you ship parks out front */
function buildGoodsLot(){if(CX.lot)scene.remove(CX.lot);const g=new THREE.Group();CX.lot=g;scene.add(g);const x0=-8,x1=18,z0=9.2,z1=15.6;
  const a=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),mat('#3A3F46',{roughness:.9}));a.rotation.x=-Math.PI/2;a.position.set((x0+x1)/2,.015,(z0+z1)/2);a.receiveShadow=true;g.add(a);
  for(let x=x0+.5;x<=x1;x+=3.2){bx(g,.1,.02,2.4,x,.02,z0+1.5,mat('#F8FAFC'),false);bx(g,.1,.02,2.4,x,.02,z1-1.5,mat('#F8FAFC'),false);}
  const s=signMesh([{t:'FINISHED GOODS',size:84,color:'#39E75F'},{t:'ready to ship',size:44,color:'#FACC15'}],5,1.3,{w:1000,h:260,bg:'#0D1117',glow:.8});s.position.set(x0+3,2.6,z1+.4);g.add(s);cy(g,.06,2.2,x0+1,0,z1+.35,mat('#374151'),false);cy(g,.06,2.2,x0+5,0,z1+.35,mat('#374151'),false);
  CX.lotSlots=[];for(let r=0;r<2;r++)for(let i=0;i<8;i++)CX.lotSlots.push({x:x0+2.1+i*3.2,z:r?z1-1.5:z0+1.5,ry:r?Math.PI/2:-Math.PI/2});CX.lotG=[];}
function parkProduct(p){CX.parked.push(p);if(CX.parked.length>16)CX.parked.shift();CX.lotDirty=true;}
function syncLot(){if(!CX.lotDirty||!CX.lotSlots)return;CX.lotDirty=false;CX.lotG.forEach(o=>scene.remove(o));CX.lotG=[];
  CX.parked.forEach((p,i)=>{const s=CX.lotSlots[i],m=makeProduct(p,true);const k={toy:2.4,kart:2.6,drone:2.6,scooter:2.6,dog:2.6,ev:2.6}[p]||2.4;m.scale.setScalar(k);m.position.set(s.x,0,s.z);m.rotation.y=s.ry;scene.add(m);CX.lotG.push(m);});}

/* ---------- inside life: AGVs, drones, robot dog, forklift ---------- */
function makeAGV(){const g=new THREE.Group(),y=mat('#FACC15',{roughness:.4}),dk=mat('#111827',{roughness:.5,metalness:.4});bx(g,1.0,.22,.66,0,.06,0,y);bx(g,1.02,.06,.68,0,.06,0,dk);
  const bar=bx(g,.5,.05,.08,0,.28,.3,mat('#38BDF8',{emissive:'#38BDF8',emissiveIntensity:2}),false);const lid=cy(g,.09,.08,.36,.28,0,dk,false);const cr=bx(g,.5,.4,.45,-.12,.28,0,new THREE.MeshStandardMaterial({map:crateTex(),roughness:.8}));
  const tag=signMesh([{t:'AGV',size:120,color:'#0D1117'}],.36,.14,{w:256,h:100,bg:'#FACC15'});tag.position.set(.32,.18,.335);g.add(tag);g.userData={bar,lid};scene.add(g);return g;}
function makeDrone(){const g=makeProduct('drone',true);g.scale.setScalar(2.2);const box=new THREE.Mesh(BOX,new THREE.MeshStandardMaterial({map:crateTex(),roughness:.8}));box.scale.set(.16,.14,.16);box.position.y=-.02;g.add(box);g.userData.box=box;scene.add(g);return g;}
function makeForklift(){const g=new THREE.Group(),o=mat('#F97316',{roughness:.35,metalness:.3}),dk=mat('#1F2937',{roughness:.45,metalness:.5}),tr=mat('#111318',{roughness:.85});
  bx(g,1.5,.6,1.1,0,.25,0,o);bx(g,.5,.5,1.0,-.6,.85,0,dk);[[.5,.5],[.5,-.5],[-.5,.5],[-.5,-.5]].forEach(([x,z])=>wheel(g,.3,.22,x,.3,z,tr));
  [-.45,.45].forEach(z=>bx(g,.06,1.9,.06,-.1,.85,z,dk));bx(g,1.2,.05,1.0,-.1,2.75,0,dk);[-.3,.3].forEach(z=>bx(g,.08,.08,.06,.85,.2,z,dk));[-.3,.3].forEach(z=>bx(g,.9,.04,.12,1.25,.2,z,mat('#9CA3AF',{metalness:.8,roughness:.3})));[-.45,.45].forEach(z=>bx(g,.08,1.6,.08,.9,.2,z,dk));
  const sb=new THREE.Mesh(CYL,mat('#F59E0B',{emissive:'#F59E0B',emissiveIntensity:1.5}));sb.scale.set(.08,.1,.08);sb.position.set(-.5,2.85,0);g.add(sb);g.userData.beacon=sb;g.traverse(x=>{if(x.isMesh)x.castShadow=Q.t>0;});scene.add(g);return g;}
function buildLife(){[...CX.agvs.map(a=>a.g),...CX.drones.map(d=>d.g),CX.dog&&CX.dog.g].forEach(o=>o&&scene.remove(o));CX.agvs=[];CX.drones=[];CX.dog=null;
  const n=linesNow(),sx=S?shipX():4.6,st=stageNow();
  const T=(S&&S.tech)||{};if(T.agv)for(let l=0;l<n;l++){const g=makeAGV(),z=LZ(l)+5.6;g.position.set(-14,0,z);CX.agvs.push({g,z,x:-14,dir:1,wait:0,x0:-15,x1:sx-1.2});}
  const nd=T.drones?Math.min(6,1+st):0;for(let i=0;i<nd;i++){const g=makeDrone();g.position.set(DOCK_IN_X,5.5,LZ(i%n));CX.drones.push({g,ph:'go',t:0,from:V(DOCK_IN_X-1.6,5.4,LZ(i%n)),to:V(SLOT_X[pick(['cut','weld','asm'])],4.8,LZ(i%n)),k:rand(0,1)});}
  if(T.dog){const g=makeProduct('dog',true);g.scale.setScalar(2.2);scene.add(g);CX.dog={g,x:-10,dir:1,z:LZ(0)+3};}
  if(!CX.fork){CX.fork={g:makeForklift(),x:0,z:0,ry:0};}const B=hallBounds();if(!CX.riding){CX.fork.x=B.x0+2.6;CX.fork.z=B.z1-1.6;CX.fork.ry=0;}
  CX.forkColl={x0:0,x1:0,z0:0,z1:0};}
function toggleRide(){if(!CX.fork)return;CX.riding=!CX.riding;if(CX.riding){sfx('horn');P.pos.set(CX.fork.x,0,CX.fork.z);P.ry=CX.fork.ry+Math.PI/2;toast('🚜 <b>Forklift!</b> Drive anywhere. Press <b>F</b> (or the button) to hop off.','good');}else{const a=CX.fork.ry;P.pos.x+=Math.cos(a)*1.3;P.pos.z-=Math.sin(a)*1.3;sfx('tick');}P.speedMul=CX.riding?1.7:1;}
function nearFork(){return CX.fork&&!CX.riding&&Math.hypot(P.pos.x-CX.fork.x,P.pos.z-CX.fork.z)<2.2;}

/* ---------- props: racks, signs, wall screens, light shafts, dust ---------- */
function buildProps(){if(CX.props)scene.remove(CX.props);const g=new THREE.Group();CX.props=g;scene.add(g);CX.screens=[];CX.shafts=[];const B=hallBounds(),Wd=B.x1-B.x0;
  const or=mat('#EA580C',{roughness:.45,metalness:.3}),bl=mat('#1D4ED8',{roughness:.45,metalness:.3}),boxM=[mat('#C08A4E',{roughness:.85}),mat('#A16207',{roughness:.85}),mat('#D6B48A',{roughness:.85})];
  let k=0;for(let x=B.x0+3.4;x<B.x1-3;x+=7.2,k++){const z=B.z0+.75;
    if(k%2===0){/* pallet rack */for(const dx of [-1.5,1.5])for(const dz of [-.4,.4])bx(g,.1,3.4,.1,x+dx,0,z+dz,or);for(const y of [.15,1.25,2.35])bx(g,3.1,.08,.9,x,y,z,bl);
      for(const y of [.23,1.33,2.43])for(let i=0;i<3;i++)if(Math.random()<.8)bx(g,.8,rand(.5,.8),.7,x-1+i,y,z,pick(boxM));}
    else{/* live screen */const c=document.createElement('canvas');c.width=512;c.height=288;const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;const m=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.8),new THREE.MeshBasicMaterial({map:t}));m.position.set(x,2.6,B.z0+.03);g.add(m);bx(g,3.4,2,.1,x,1.6,B.z0+.02,mat('#0B0F14'),false);CX.screens.push({c,t,i:CX.screens.length});}}
  /* safety signs on the side walls */
  const signs=[['⚠ HARD HAT AREA','#FACC15','#0D1117'],['SAFETY FIRST','#16A34A','#fff'],['ROBOT ZONE · STAY BEHIND FENCE','#EA580C','#fff'],['QUALITY IS EVERYONE\'S JOB','#1D4ED8','#fff']];
  for(let i=0;i<Math.min(4,Math.floor((B.z1-B.z0)/6));i++){const s=signs[i%4],m=signMesh([{t:s[0],size:70,color:s[2]}],3,.7,{w:900,h:210,bg:s[1],r:14});m.position.set(B.x0+.05,3.1,B.z1-3-i*6);m.rotation.y=Math.PI/2;g.add(m);}
  /* barrels + extinguishers near the steel dock */
  for(let i=0;i<4;i++)cy(g,.32,.95,B.x0+.8+(i%2)*.7,0,B.z1-.9-Math.floor(i/2)*.7,mat(i%2?'#1D4ED8':'#DC2626',{roughness:.5,metalness:.3}));
  /* light shafts from the windows */
  if(Q.t>=2){const gt=canvasTex(64,256,(c,w,h)=>{const gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,240,210,.55)');gr.addColorStop(1,'rgba(255,240,210,0)');c.fillStyle=gr;c.fillRect(0,0,w,h);const gx=c.createLinearGradient(0,0,w,0);gx.addColorStop(0,'rgba(0,0,0,1)');gx.addColorStop(.5,'rgba(0,0,0,0)');gx.addColorStop(1,'rgba(0,0,0,1)');c.globalCompositeOperation='destination-out';c.fillStyle=gx;c.fillRect(0,0,w,h);});
    for(let x=B.x0+2.5;x<B.x1-2;x+=8.4){const m=new THREE.Mesh(new THREE.PlaneGeometry(3,10),new THREE.MeshBasicMaterial({map:gt,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.5,side:THREE.DoubleSide}));m.position.set(x,2.6,B.z0+3.2);m.rotation.x=-.62;m.renderOrder=3;g.add(m);CX.shafts.push(m);}
    const N=260,pos=new Float32Array(N*3);for(let i=0;i<N;i++){pos[i*3]=rand(B.x0,B.x1);pos[i*3+1]=rand(.5,6);pos[i*3+2]=rand(B.z0,B.z1);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    CX.dust=new THREE.Points(geo,new THREE.PointsMaterial({color:'#FFF1D6',size:.05,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));g.add(CX.dust);}
  buildLife();}
function drawScreens(){if(!S)return;CX.screens.forEach(sc=>{const g=sc.c.getContext('2d'),w=512,h=288;g.fillStyle='#05090F';g.fillRect(0,0,w,h);
  if(!(S.tech&&S.tech.screens)){g.fillStyle='#334155';g.font='700 30px Fredoka, system-ui';g.textAlign='center';g.fillText('SCREEN OFFLINE',w/2,h/2);g.font='600 18px Inter, system-ui';g.fillText('Unlock in Tech',w/2,h/2+30);g.textAlign='left';sc.t.needsUpdate=true;return;}g.strokeStyle='rgba(57,231,95,.25)';for(let y=0;y<h;y+=4){g.fillStyle='rgba(255,255,255,.015)';g.fillRect(0,y,w,1);}
  g.fillStyle='#39E75F';g.font='700 26px Fredoka, system-ui';g.fillText(sc.i%2?'PLANT OUTPUT':'LINE STATUS',22,40);g.fillStyle='#FACC15';g.font='700 22px ui-monospace, monospace';g.fillText(new Date(0,0,0,8+Math.floor((S.phase==='day'?S.clock/SHIFT_LEN:0)*12)).toLocaleTimeString('en-US',{hour:'numeric'}),w-110,40);
  if(sc.i%2){const T=S.today||{shipped:0,rev:0};g.fillStyle='#fff';g.font='800 64px ui-monospace, monospace';g.fillText(String(T.shipped||0),22,130);g.font='600 22px Inter, system-ui';g.fillStyle='#9CA9B8';g.fillText('UNITS SHIPPED TODAY',22,160);g.fillStyle='#39E75F';g.font='800 40px ui-monospace, monospace';g.fillText(money(T.rev||0),22,220);
    const H=S.hist.slice(-10);if(H.length){const mx=Math.max(1,...H.map(x=>Math.abs(x.net)));H.forEach((x,i)=>{const bh=Math.abs(x.net)/mx*90;g.fillStyle=x.net>=0?'#39E75F':'#F87171';g.fillRect(300+i*20,250-bh,14,bh);});}}
  else S.lines.slice(0,lineCount()).forEach((l,i)=>{const y=80+i*50,P=PRODUCTS[l.job.product],cap=capacity(l);g.fillStyle='#fff';g.font='700 22px Inter, system-ui';g.fillText(`LINE ${i+1}  ${P.icon} ${P.name}`,22,y);g.fillStyle='#9CA9B8';g.font='600 18px Inter, system-ui';g.fillText(`~${cap.n}/shift · slowest: ${STATIONS[cap.by].name}`,22,y+24);
    ST_KEYS.forEach((k,j)=>{const s=l.st[k];g.fillStyle=!s.built?'#1F2937':s.broken?'#EF4444':s.needsCode?'#F59E0B':s.cur?'#39E75F':'#334155';g.beginPath();g.arc(360+j*28,y-8,9,0,7);g.fill();});});
  sc.t.needsUpdate=true;});}

/* ---------- time of day across a shift ---------- */
const SKY={day:new THREE.Color('#6F9CC4'),morn:new THREE.Color('#9CC2DE'),eve:new THREE.Color('#E8935F'),dusk:new THREE.Color('#2A3050')};const _sc=new THREE.Color(),_sc2=new THREE.Color();
function applyTime(f){/* f: 0 = 8am, 1 = 8pm */const a=lerp(-.9,.9,f);sun.position.set(Math.sin(a)*40,Math.cos(a)*38+6,26);
  if(f<.2)_sc.copy(SKY.morn).lerp(SKY.day,f/.2);else if(f<.72)_sc.copy(SKY.day);else if(f<.88)_sc.copy(SKY.day).lerp(SKY.eve,(f-.72)/.16);else _sc.copy(SKY.eve).lerp(SKY.dusk,(f-.88)/.12);
  scene.background.copy(_sc);scene.fog.color.copy(_sc);const late=clamp((f-.7)/.3,0,1);sun.color.setHSL(.1,.6+late*.3,.9-late*.25);sun.intensity=1.6-late*.9;hemi.intensity=.5-late*.18;
  CX.lamps.forEach(l=>l.material.emissiveIntensity=late*2.5);if(W.winMat){W.winMat.emissive.set(late>.5?'#F59E0B':'#BFE3FF');W.winMat.emissiveIntensity=.55+late*.4;}CX.shafts.forEach(s=>s.material.opacity=.5*(1-late));}
function timeStr(f){const m=Math.floor(8*60+f*12*60),h=Math.floor(m/60),mm=m%60;return `${(h+11)%12+1}:${String(mm).padStart(2,'0')} ${h<12?'AM':'PM'}`;}

/* ---------- cinematics ---------- */
function letterbox(on,cap){document.body.classList.toggle('cine',!!on);$('#cineCap').innerHTML=cap||'';$('#cineCap').classList.toggle('on',!!cap);}
function slam(title,sub,color,ms){const e=document.createElement('div');e.className='slam';e.innerHTML=`<b style="--sc:${color||'#FACC15'}">${title}</b>${sub?`<span>${sub}</span>`:''}`;document.body.appendChild(e);noise(.35,.05,200);tone(70,.5,'sine',.12);setTimeout(()=>e.remove(),ms||2200);}
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function playShots(shots,done){CX.shot={shots,i:0,t:0,done};camS.mode='cine';camS.cineHard=true;$('#skip').hidden=false;letterbox(true,shots[0].cap);}
function stepShots(dt){const C=CX.shot;if(!C)return;const s=C.shots[C.i];C.t+=dt;const k=ease(Math.min(1,C.t/s.d));
  const pp=typeof s.p2==='function'?s.p2():s.p2,lp=typeof s.l2==='function'?s.l2():s.l2;camS.cinePos=V(lerp(s.p[0],pp[0],k),lerp(s.p[1],pp[1],k),lerp(s.p[2],pp[2],k));camS.cineLook=V(lerp(s.l[0],lp[0],k),lerp(s.l[1],lp[1],k),lerp(s.l[2],lp[2],k));
  if(C.t>=s.d){C.i++;C.t=0;if(C.i>=C.shots.length){endShots();return;}const n=C.shots[C.i];letterbox(true,n.cap);if(n.slam)slam(n.slam[0],n.slam[1],n.slam[2]);}}
function endShots(){const C=CX.shot;if(!C)return;CX.shot=null;camS.mode='play';camS.cineHard=false;$('#skip').hidden=true;letterbox(false);C.done&&C.done();}
function playerCam(){const d=camS.dist,cp=Math.cos(camS.pitch),s=Math.sin(camS.pitch);return [P.pos.x+Math.sin(camS.yaw)*cp*d,s*d+1,P.pos.z-1.5+Math.cos(camS.yaw)*cp*d];}
function introShots(done){const pl=()=>[P.pos.x,.8,P.pos.z-1.5];
  playShots([{p:[38,2.2,24],p2:[16,2.8,23],l:[6,2.6,6],l2:[-2,3,4],d:4.2,cap:'<small>BOT CITY, KENTUCKY</small>7:58 AM'},
    {p:[14,7,17],p2:[1,4.2,10],l:[-4,1.5,0],l2:[-7,1,-.5],d:3.8,cap:'Your uncle left you a dusty garage on the edge of town…'},
    {p:[-17,2.1,3.4],p2:[-1,2.5,3.1],l:[-12,1,-.2],l2:[1,1,-.6],d:4.4,cap:'…three old machines, a $1,500 loan and one big idea.'},
    {p:[-1,2.5,3.1],p2:playerCam,l:[1,1,-.6],l2:pl,d:2.6,cap:'',slam:['BOTFACTORY','From garage to Mega Plant','#39E75F']}],done);}
function shiftShots(done){const c=hallCenter(),B=hallBounds(),pl=()=>[P.pos.x,.8,P.pos.z-1.5];const st=STAGES[S.stage];
  slam('SHIFT '+S.day,`${st.name} · ${S.lines.slice(0,lineCount()).map(l=>PRODUCTS[l.job.product].icon).join(' ')}`,'#FACC15',2000);
  playShots([{p:[c.x+12,(B.z1-B.z0)*.9+16,c.z+24],p2:playerCam,l:[c.x,0,c.z],l2:pl,d:2.2,cap:''}],done);}

/* ---------- per frame ---------- */
let scrT=0;
function updateCine(dt,t,run){if(!S)return;stepShots(dt);const f=S.phase==='day'?S.clock/SHIFT_LEN:S.phase==='report'?1:0;if(!MILL.on&&!TWIN.on)applyTime(f);
  trafficStep(dt);updateOutside(dt,t);
  const m=run?S.speed:0,B=hallBounds();
  CX.agvs.forEach(a=>{const near=Math.hypot(P.pos.x-a.x,P.pos.z-a.z)<1.5&&Math.sign(P.pos.x-a.x)===a.dir;if(a.wait>0)a.wait-=dt;else if(!near){a.x+=a.dir*2.6*dt*Math.max(.6,m||.6);if(a.x>a.x1||a.x<a.x0){a.dir*=-1;a.wait=1.4;a.x=clamp(a.x,a.x0,a.x1);}}else if(Math.random()<dt*1.5)tone(1200,.06,'square',.015);
    a.g.position.set(a.x,0,a.z);a.g.rotation.y=a.dir>0?0:Math.PI;a.g.userData.lid.rotation.y+=dt*6;a.g.userData.bar.material.emissiveIntensity=near?.5+Math.sin(t*20):2;});
  CX.drones.forEach(d=>{d.t+=dt*.22;let k=d.t%2;const go=k<1;k=go?k:2-k;const e=ease(k),p=d.from.clone().lerp(d.to,e);p.y+=Math.sin(t*2+d.k*6)*.2+Math.sin(e*Math.PI)*1.2;d.g.position.copy(p);d.g.rotation.z=(go?-1:1)*Math.sin(e*Math.PI)*.25;d.g.userData.rot.forEach(r=>r.rotation.y=t*40);
    d.g.userData.box.visible=go;if(d.t%2<.01&&Math.random()<.5){const l=pick(S.lines.slice(0,lineCount()));d.from.z=d.to.z=LZ(l.i);d.to.x=SLOT_X[pick(PRODUCTS[l.job.product].needs)];}});
  if(CX.dog){const D=CX.dog;D.x+=D.dir*1.4*dt;if(D.x>12||D.x<-14)D.dir*=-1;D.g.position.set(D.x,0,D.z);D.g.rotation.y=D.dir>0?0:Math.PI;D.g.userData.legs.forEach((L,i)=>L.rotation.z=Math.sin(t*9+(i%2?Math.PI:0)+(i>1?Math.PI/2:0))*.45);}
  if(CX.fork){const F=CX.fork;if(CX.riding){F.x=P.pos.x;F.z=P.pos.z;F.ry=P.ry-Math.PI/2;P.rig.root.position.y=.55;P.rig.root.position.x=F.x-Math.cos(F.ry)*.45;P.rig.root.position.z=F.z+Math.sin(F.ry)*.45;}
    F.g.position.set(F.x,0,F.z);F.g.rotation.y=F.ry;F.g.userData.beacon.material.emissiveIntensity=CX.riding?(Math.sin(t*10)>0?2.5:.2):.4;}
  if(CX.dust){const a=CX.dust.geometry.attributes.position;for(let i=0;i<a.count;i++){let y=a.getY(i)+dt*.05;if(y>6)y=.4;a.setY(i,y);a.setX(i,a.getX(i)+Math.sin(t*.3+i)*dt*.04);}a.needsUpdate=true;}
  scrT-=dt;if(scrT<=0){scrT=1;drawScreens();}syncLot();}
