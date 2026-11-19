/* =====================================================================
   BOTFACTORY · the 3D plant: hall that grows, lines, stations by tier,
   robot arms, items, crates, docks, trucks, expansion lots
   ===================================================================== */
const W={shell:null,lines:[],lot:null,kiosk:null,beltMats:[],trucks:[],lights:[],t:0};
const PCOL={toy:'#38BDF8',kart:'#EF4444',drone:'#A855F7',scooter:'#10B981',dog:'#F59E0B',ev:'#22C55E'};
function stageNow(){return S?S.stage:0;}
function linesNow(){return STAGES[stageNow()].lines;}
function hallBounds(st){if(st==null&&typeof MILL!=='undefined'&&MILL.on)return millBounds();st=st==null?stageNow():st;const wide=STAGES[st].wide,n=STAGES[st].lines;return {x0:-19.5,x1:wide?19.5:7.6,z0:LZ(n-1)-5.6,z1:7.2};}
function hallCenter(){const B=hallBounds();return {x:(B.x0+B.x1)/2,z:(B.z0+B.z1)/2};}

/* ---------- textures ---------- */
const TX={};
function concreteTex(){return TX.conc||(TX.conc=canvasTex(1024,1024,(g,w,h)=>{g.fillStyle='#8C939B';g.fillRect(0,0,w,h);
  for(let i=0;i<1400;i++){g.fillStyle=`rgba(${Math.random()<.5?'255,255,255':'40,44,50'},${Math.random()*.035})`;const r=rand(10,80);g.beginPath();g.arc(Math.random()*w,Math.random()*h,r,0,7);g.fill();}
  for(let i=0;i<9000;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.08})`;g.fillRect(Math.random()*w,Math.random()*h,1.5,1.5);}
  g.strokeStyle='rgba(40,44,50,.35)';g.lineWidth=3;g.strokeRect(0,0,w,h);g.beginPath();g.moveTo(w/2,0);g.lineTo(w/2,h);g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke();},[1,1]));}
function sidingTex(){return TX.sid||(TX.sid=canvasTex(512,512,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#3A4654');gr.addColorStop(1,'#2A333D');g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(let x=0;x<w;x+=32){g.fillStyle='rgba(255,255,255,.07)';g.fillRect(x,0,6,h);g.fillStyle='rgba(0,0,0,.22)';g.fillRect(x+22,0,4,h);}},[6,1]));}
function crateTex(){return TX.crate||(TX.crate=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#B07A43';g.fillRect(0,0,w,h);for(let i=0;i<40;i++){g.fillStyle=`rgba(80,40,10,${Math.random()*.25})`;g.fillRect(0,Math.random()*h,w,2);}
  g.strokeStyle='#6B4220';g.lineWidth=10;g.strokeRect(5,5,w-10,h-10);g.beginPath();g.moveTo(8,8);g.lineTo(w-8,h-8);g.stroke();}));}
function hazardTex(){return TX.haz||(TX.haz=canvasTex(128,32,(g,w,h)=>{g.fillStyle='#FACC15';g.fillRect(0,0,w,h);g.fillStyle='#111827';for(let x=-h;x<w+h;x+=32){g.beginPath();g.moveTo(x,h);g.lineTo(x+16,h);g.lineTo(x+16+h,0);g.lineTo(x+h,0);g.fill();}},[4,1]));}
function beltTex(){const t=canvasTex(64,256,(g,w,h)=>{g.fillStyle='#1F2328';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=32){g.fillStyle='#2B3036';g.fillRect(0,y,w,14);g.fillStyle='rgba(255,255,255,.06)';g.fillRect(0,y,w,2);}},[1,10]);return t;}
function epoxyTex(){return TX.epo||(TX.epo=canvasTex(512,128,(g,w,h)=>{g.fillStyle='#2F6B57';g.fillRect(0,0,w,h);for(let i=0;i<1600;i++){g.fillStyle=`rgba(255,255,255,${Math.random()*.05})`;g.fillRect(Math.random()*w,Math.random()*h,2,2);}
  g.fillStyle='#FACC15';g.fillRect(0,0,w,7);g.fillRect(0,h-7,w,7);g.fillStyle='rgba(255,255,255,.55)';for(let x=20;x<w;x+=64){g.beginPath();g.moveTo(x,h/2-12);g.lineTo(x+22,h/2);g.lineTo(x,h/2+12);g.fill();}},[8,1]));}

/* ---------- outside + the hall ---------- */
function buildOutdoors(){const g=new THREE.Group();scene.add(g);
  const grass=new THREE.Mesh(new THREE.PlaneGeometry(600,600),mat('#4F8A45',{roughness:1}));grass.rotation.x=-Math.PI/2;grass.position.y=-.06;grass.receiveShadow=true;g.add(grass);
  const lot=new THREE.Mesh(new THREE.PlaneGeometry(110,96),mat('#3A4047',{roughness:.95}));lot.rotation.x=-Math.PI/2;lot.position.set(0,-.04,-22);lot.receiveShadow=true;g.add(lot);
  for(let i=0;i<14;i++){const x=-44+i*4;bx(g,.14,.02,4,x,-.03,18,mat('#E5E7EB'),false);}
  /* distant city + trees for depth */
  const cols=['#5B6B7A','#6B7B8C','#4E5D6C','#7A8A99'];for(let i=0;i<26;i++){const x=-140+i*11+rand(-3,3),h=rand(14,46);bx(g,rand(7,11),h,rand(7,11),x,0,-120+rand(-10,10),mat(pick(cols),{roughness:.8}),false);}
  for(let i=0;i<34;i++){const a=i/34*6.283,r=rand(62,80),x=Math.cos(a)*r,z=Math.sin(a)*r*.8-18;if(z>40)continue;const t=new THREE.Group();cy(t,.25,2.4,0,0,0,mat('#6B4A2E'));sp(t,rand(1.6,2.4),0,3.4,0,mat(pick(['#3F7A3A','#4C8B45','#2F6A33']),{roughness:.9}));t.position.set(x,0,z);g.add(t);}}
function buildShell(){if(W.shell){scene.remove(W.shell);}COLL.length=0;const g=new THREE.Group();W.shell=g;scene.add(g);
  const B=hallBounds(),st=stageNow(),wide=STAGES[st].wide,n=linesNow(),Wd=B.x1-B.x0,D=B.z1-B.z0,cx=(B.x0+B.x1)/2,cz=(B.z0+B.z1)/2,H=7.2;
  const ct=concreteTex().clone();ct.needsUpdate=true;ct.repeat.set(Wd/8,D/8);ct.wrapS=ct.wrapT=THREE.RepeatWrapping;
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(Wd,D),new THREE.MeshStandardMaterial({map:ct,roughness:.42,metalness:.05,envMapIntensity:.8}));fl.rotation.x=-Math.PI/2;fl.position.set(cx,0,cz);fl.receiveShadow=true;g.add(fl);
  bx(g,Wd+.8,.3,D+.8,cx,-.3,cz,mat('#7B8189'),false);
  /* aisles in front of every line */
  for(let l=0;l<n;l++){const et=epoxyTex().clone();et.needsUpdate=true;et.wrapS=et.wrapT=THREE.RepeatWrapping;et.repeat.set(Wd/10,1);const a=new THREE.Mesh(new THREE.PlaneGeometry(Wd-1.4,3.1),new THREE.MeshStandardMaterial({map:et,roughness:.35,metalness:.05}));a.rotation.x=-Math.PI/2;a.position.set(cx,.012,LZ(l)+4.1);a.receiveShadow=true;g.add(a);}
  /* walls: tall back + sides with dock doors, low knee wall in front so the camera can see in */
  const sid=sidingTex(),wallM=new THREE.MeshStandardMaterial({map:sid,roughness:.55,metalness:.35}),trim=mat('#1E242B',{roughness:.5,metalness:.3}),yel=mat('#FACC15',{roughness:.45});
  const back=new THREE.Mesh(BOX,wallM);back.scale.set(Wd+.6,H,.4);back.position.set(cx,H/2,B.z0-.2);back.castShadow=back.receiveShadow=true;g.add(back);
  /* window band on the back wall */
  const wm=mat('#CFE8F7',{emissive:'#BFE3FF',emissiveIntensity:.55,roughness:.1,metalness:.3});W.winMat=wm;for(let x=B.x0+2.5;x<B.x1-2;x+=4.2){bx(g,3.4,1.6,.08,x,4.6,B.z0+.02,wm,false);bx(g,3.6,.12,.14,x,4.5,B.z0+.04,trim,false);bx(g,3.6,.12,.14,x,6.25,B.z0+.04,trim,false);}
  const side=(x,face)=>{const doors=[];for(let l=0;l<n;l++)doors.push(LZ(l));let z=B.z0;const segs=[];doors.sort((a,b)=>a-b).forEach(dz=>{segs.push([z,dz-1.7]);z=dz+1.7;});segs.push([z,B.z1]);
    segs.forEach(([a,b])=>{if(b-a<.1)return;const m=new THREE.Mesh(BOX,wallM);m.scale.set(.4,H,b-a);m.position.set(x,H/2,(a+b)/2);m.castShadow=m.receiveShadow=true;g.add(m);});
    doors.forEach(dz=>{bx(g,.42,H-3.6,3.4,x,3.6,dz,wallM);bx(g,.5,.25,3.6,x,3.45,dz,yel,false);[dz-1.75,dz+1.75].forEach(zz=>bx(g,.5,3.5,.18,x,0,zz,yel,false));
      const hz=new THREE.Mesh(new THREE.PlaneGeometry(3.4,.6),new THREE.MeshStandardMaterial({map:hazardTex(),roughness:.6}));hz.rotation.x=-Math.PI/2;hz.position.set(x+face*.5,.02,dz);g.add(hz);});};
  side(B.x0-.2,1);side(B.x1+.2,-1);
  bx(g,Wd+.6,.55,.3,cx,0,B.z1+.15,wallM);bx(g,Wd+.7,.08,.36,cx,.55,B.z1+.15,trim,false);
  /* steel columns */
  const colM=mat('#2E7D5B',{roughness:.45,metalness:.5});for(let x=B.x0;x<=B.x1+.1;x+=Wd/Math.round(Wd/8)){[B.z0].forEach(z=>{bx(g,.5,H+.4,.5,x,0,z,colM);bx(g,.62,.5,.62,x,0,z,yel);});}
  for(let z=B.z0;z<=B.z1+.1;z+=D/Math.max(1,Math.round(D/9))){[B.x0,B.x1].forEach(x=>{bx(g,.5,H+.4,.5,x,0,z,colM);bx(g,.62,.5,.62,x,0,z,yel);});}
  bx(g,Wd+.8,.35,.6,cx,H,B.z0-.2,trim,false);bx(g,.6,.35,D+.8,B.x0-.2,H,cz,trim,false);bx(g,.6,.35,D+.8,B.x1+.2,H,cz,trim,false);
  /* overhead crane rail along the back */
  bx(g,Wd-1,.25,.3,cx,H-.4,B.z0+.5,yel,false);const crane=new THREE.Group();bx(crane,.3,.3,Math.min(D-2,7),0,0,0,yel,false);const hook=new THREE.Group();cy(hook,.03,2.2,0,-2.2,0,trim,false);bx(hook,.4,.3,.3,0,-2.5,0,trim,false);crane.add(hook);crane.position.set(cx,H-.7,B.z0+.5+Math.min(D-2,7)/2);g.add(crane);W.crane=crane;
  /* big sign */
  const sg=new THREE.Group();sg.position.set(cx,0,B.z0+.25);g.add(sg);bx(sg,12.4,2.6,.3,0,4.05+0,-.05,trim,false);
  const logo=W.logoImg;const sm=signMesh([{t:'BOTFACTORY',size:120,color:'#39E75F'},{t:STAGES[st].name.toUpperCase()+'  ·  A MONEYBOT COMPANY',size:44,color:'#FACC15',font:'Inter, system-ui, sans-serif',weight:800}],12,2.4,{w:1536,h:308,bg:'#0D1117',glow:.9,img:logo,imgX:40});sm.position.set(0,5.35,.12);sg.add(sm);
  /* wall flood lights */
  for(let x=B.x0+4;x<B.x1-2;x+=8){const f=new THREE.Group();bx(f,.9,.35,.4,0,0,0,trim,false);const lens=new THREE.Mesh(new THREE.PlaneGeometry(.8,.25),new THREE.MeshBasicMaterial({color:'#FFF6DD'}));lens.position.set(0,.17,.21);f.add(lens);f.position.set(x,6.6,B.z0+.4);f.rotation.x=.5;g.add(f);}
  /* Mega Plant gets a rooftop crown */
  if(st>=4){const rs=new THREE.Group();rs.position.set(cx,H+.3,B.z0-.2);g.add(rs);[-7,7].forEach(x=>bx(rs,.3,3.6,.3,x,0,0,trim,false));const big=signMesh([{t:(S&&S.name?S.name.toUpperCase()+' ':'')+'MEGA PLANT',size:120,color:'#FACC15'}],16,3,{w:1600,h:300,bg:'#0D1117',glow:1.1});big.position.set(0,2.6,.2);rs.add(big);}
  /* expansion kiosk */
  const kx=B.x1-2.2,kz=B.z1-2;const k=new THREE.Group();k.position.set(kx,0,kz);g.add(k);bx(k,1.1,1.1,.6,0,0,0,trim);const scr=signMesh([{t:'EXPAND',size:80,color:'#39E75F'},{t:'the plant',size:44,color:'#fff'}],1,.62,{w:256,h:160,bg:'#0B2A1E',glow:1});scr.position.set(0,1.45,.05);scr.rotation.x=-.3;k.add(scr);bx(k,1.15,.06,.65,0,1.08,0,mat('#39E75F',{emissive:'#39E75F',emissiveIntensity:.6}),false);
  W.kiosk={x:kx,z:kz};COLL.push({x0:kx-.6,x1:kx+.6,z0:kz-.35,z1:kz+.35});
  buildLot();}
/* the next expansion, always visible */
function buildLot(){if(W.lot){scene.remove(W.lot);W.lot=null;}const st=stageNow(),nx=STAGES[st+1];if(!nx)return;const g=new THREE.Group();W.lot=g;scene.add(g);
  const A=hallBounds(st),Bn=hallBounds(st+1);let x0,x1,z0,z1;if(!STAGES[st].wide&&nx.wide){x0=A.x1+.6;x1=Bn.x1;z0=Bn.z0;z1=Bn.z1;}else{x0=Bn.x0;x1=Bn.x1;z0=Bn.z0;z1=A.z0-.6;}
  const cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0,gm=mat('#39E75F',{emissive:'#39E75F',emissiveIntensity:.8,transparent:true,opacity:.55});
  const dirt=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat('#8A7A62',{roughness:1}));dirt.rotation.x=-Math.PI/2;dirt.position.set(cx,-.02,cz);dirt.receiveShadow=true;g.add(dirt);
  [[cx,z0,w,.12],[cx,z1,w,.12],[x0,cz,.12,d],[x1,cz,.12,d]].forEach(([x,z,a,b])=>bx(g,a,.06,b,x,0,z,gm,false));
  for(let i=0;i<6;i++){const s=new THREE.Group();cy(s,.04,1,0,0,0,mat('#E5E7EB'),false);const fl=new THREE.Mesh(new THREE.ConeGeometry(.18,.4,4),mat('#F97316'));fl.position.y=1.05;s.add(fl);s.position.set(x0+(i+.5)*w/6,0,i%2?z0+.4:z1-.4);g.add(s);}
  const holo=new THREE.Group();holo.position.set(cx,0,cz);g.add(holo);const tall=!STAGES[st].wide?3.2:8.8;
  cy(holo,.08,tall-.6,-2.6,0,0,mat('#6B7280'),false);cy(holo,.08,tall-.6,2.6,0,0,mat('#6B7280'),false);
  const sign=signMesh([{t:'EXPAND HERE',size:84,color:'#39E75F'},{t:nx.name.toUpperCase(),size:72,color:'#fff'},{t:money(nx.cost),size:66,color:'#FACC15'}],6,3,{w:900,h:450,bg:'rgba(6,30,20,.92)',border:'#39E75F',bw:10,r:30,glow:.9});sign.position.y=tall+.9;holo.add(sign);
  W.lotSign={g:holo,base:tall+.9,sign};}

/* ---------- robot arm (procedural, orange, 4 joints) ---------- */
function makeArm(tool){const o=mat('#F97316',{roughness:.35,metalness:.25}),dk=mat('#1F2937',{roughness:.4,metalness:.5}),g=new THREE.Group();
  cy(g,.42,.35,0,0,0,dk);const tur=new THREE.Group();tur.position.y=.35;g.add(tur);cy(tur,.34,.45,0,0,0,o);
  const sh=new THREE.Group();sh.position.y=.6;tur.add(sh);sp(sh,.24,0,0,0,dk);const up=bx(sh,.26,1.25,.26,0,0,0,o);
  const el=new THREE.Group();el.position.y=1.25;sh.add(el);sp(el,.19,0,0,0,dk);bx(el,.2,1.0,.2,0,0,0,o);
  const wr=new THREE.Group();wr.position.y=1.0;el.add(wr);sp(wr,.14,0,0,0,dk);
  let tip;if(tool==='torch'){const tc=new THREE.Mesh(new THREE.ConeGeometry(.08,.42,10),dk);tc.position.y=.25;tc.rotation.x=0;wr.add(tc);tip=new THREE.Object3D();tip.position.y=.48;wr.add(tip);}
  else if(tool==='spray'){cy(wr,.1,.3,0,0,0,mat('#10B981'));tip=new THREE.Object3D();tip.position.y=.35;wr.add(tip);}
  else{bx(wr,.32,.08,.12,0,.05,0,dk);bx(wr,.06,.22,.1,-.13,.12,0,dk);bx(wr,.06,.22,.1,.13,.12,0,dk);tip=new THREE.Object3D();tip.position.y=.3;wr.add(tip);}
  const led=sp(tur,.06,.0,.35,.33,mat('#39E75F',{emissive:'#39E75F',emissiveIntensity:1.5}));
  return {g,tur,sh,el,wr,tip,led,ph:Math.random()*6};}
function poseArm(a,t,busy,kind,off){const s=busy?1:0;a.ph+=0;
  if(kind==='weld'){a.tur.rotation.y=off+Math.sin(t*1.6)*.35*s;a.sh.rotation.z=.55+Math.sin(t*2.2)*.12*s;a.el.rotation.z=1.15+Math.sin(t*3.1)*.15*s;a.wr.rotation.z=.4;}
  else if(kind==='spray'){a.tur.rotation.y=off+Math.sin(t*2.4)*.6*s;a.sh.rotation.z=.4+Math.sin(t*1.2)*.2*s;a.el.rotation.z=1.0;a.wr.rotation.z=.6+Math.sin(t*4)*.3*s;}
  else{const c=(t*.9+a.ph)%1,k=busy?(c<.5?c*2:2-c*2):.3;a.tur.rotation.y=off+(busy?lerp(-.9,.9,k):0);a.sh.rotation.z=lerp(.25,.75,busy?Math.abs(Math.sin(c*Math.PI*2)):.2);a.el.rotation.z=lerp(.9,1.5,busy?Math.abs(Math.cos(c*Math.PI*2)):.6);a.wr.rotation.z=.6;}}

/* ---------- a production line ---------- */
function buildLines(){W.lines.forEach(L=>scene.remove(L.g));W.lines=[];const n=linesNow();for(let i=0;i<n;i++)W.lines.push(buildLine(i));}
function buildLine(i){const g=new THREE.Group(),z=LZ(i),sx=S?shipX():4.6,x0=DOCK_IN_X,len=sx-x0+.6,cxb=(x0+sx)/2;scene.add(g);
  const frame=mat('#374151',{roughness:.4,metalness:.6}),yel=mat('#FACC15',{roughness:.45});
  bx(g,len,.16,1.3,cxb,.58,z,frame);for(let x=x0+.4;x<sx;x+=2.2){bx(g,.12,.58,.12,x,0,z-.55,frame);bx(g,.12,.58,.12,x,0,z+.55,frame);}
  bx(g,len,.14,.08,cxb,.74,z-.66,yel,false);bx(g,len,.14,.08,cxb,.74,z+.66,yel,false);
  const bt=beltTex();bt.repeat.set(1,len/1.3);const belt=new THREE.Mesh(new THREE.PlaneGeometry(1.15,len),new THREE.MeshStandardMaterial({map:bt,roughness:.75,metalness:.1}));belt.rotation.x=-Math.PI/2;belt.rotation.z=Math.PI/2;belt.position.set(cxb,.75,z);belt.receiveShadow=true;g.add(belt);W.beltMats.push(bt);
  COLL.push({x0:x0-.4,x1:sx+.6,z0:z-.8,z1:z+.8});
  /* steel in: coil rack */
  const ri=new THREE.Group();ri.position.set(x0-1.6,0,z);g.add(ri);bx(ri,1.6,.25,2.4,0,0,0,mat('#4B5563'));
  for(let k=0;k<3;k++){const c=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.55,24,1,false),mat('#CBD5E1',{metalness:.95,roughness:.22}));c.rotation.x=Math.PI/2;c.position.set(0,.68,-.75+k*.75);c.castShadow=true;ri.add(c);const h=new THREE.Mesh(CYL,mat('#374151'));h.scale.set(.16,.56,.16);h.rotation.x=Math.PI/2;h.position.copy(c.position);ri.add(h);}
  const inL=spriteLabel([{t:'🔩 STEEL IN',size:56,color:'#93C5FD'}],{sw:2.4});inL.position.set(x0-1.6,2.3,z);g.add(inL);
  /* shipping: pallet with growing box stack */
  const sh=new THREE.Group();sh.position.set(sx+1.2,0,z);g.add(sh);bx(sh,1.6,.18,1.6,0,0,0,mat('#A16207'));const boxes=new THREE.InstancedMesh(BOX,mat('#C08A4E',{roughness:.85}),12);boxes.count=0;boxes.castShadow=true;sh.add(boxes);
  const outL=spriteLabel([{t:'🚚 SHIPPING',size:56,color:'#86EFAC'}],{sw:2.4});outL.position.set(sx+1.2,2.5,z);g.add(outL);
  const L={i,g,z,belt,boxes,st:{},labels:{},ship:0,bn:null,sx};
  const bn=spriteLabel([{t:'⚠ BOTTLENECK',size:60,color:'#fff'}],{bg:'rgba(220,38,38,.94)',sw:2.2});bn.visible=false;g.add(bn);L.bn=bn;
  ST_KEYS.forEach(k=>L.st[k]={sig:'',g:null});return L;}
/* per station look; rebuilt when tier or built changes */
function stationSig(l,k){const s=l.st[k];return (s.built?1:0)+':'+s.tier+':'+stageNow();}
function syncStations(){if(!S)return;W.lines.forEach((L,i)=>{const l=S.lines[i];if(!l)return;ST_KEYS.forEach(k=>{const sig=stationSig(l,k);if(L.st[k].sig===sig)return;if(L.st[k].g){L.g.remove(L.st[k].g);L.st[k].coll&&(L.st[k].coll.off=true);if(L.st[k].worker){L.st[k].worker=null;}}
  L.st[k]=buildStation(L,l,k);L.st[k].sig=sig;});});}
function buildStation(L,l,k){const s=l.st[k],D=STATIONS[k],x=SLOT_X[k],z=L.z,g=new THREE.Group();L.g.add(g);const out={g,k,sig:''};
  if((k==='paint'||k==='qa')&&!STAGES[stageNow()].wide){g.visible=false;return out;}
  const dk=mat('#1F2937',{roughness:.4,metalness:.5}),stl=mat('#9CA3AF',{roughness:.3,metalness:.85}),col=mat(D.color,{roughness:.4,metalness:.2}),glow=mat(D.color,{emissive:D.color,emissiveIntensity:1.2});
  /* floor pad + color stripe */
  const pad=new THREE.Mesh(new THREE.PlaneGeometry(4.6,3.9),mat(s.built?'#2A313B':'#161B22',{roughness:.45,metalness:.15,transparent:true,opacity:s.built?.95:.6}));pad.rotation.x=-Math.PI/2;pad.position.set(x,.015,z-.35);pad.receiveShadow=true;g.add(pad);
  bx(g,4.6,.03,.12,x,0,z+1.6,glow,false);
  if(!s.built){/* hologram pad: build me */
    const h=signMesh([{t:'+ BUILD',size:70,color:'#39E75F'},{t:D.name.toUpperCase(),size:56,color:'#fff'},{t:money(D.buildCost),size:56,color:'#FACC15'}],3,1.5,{w:600,h:300,bg:'rgba(6,30,20,.9)',border:'#39E75F',bw:8,r:24,glow:.9});h.position.set(x,2.2,z-.4);g.add(h);out.holo=h;
    const lab=spriteLabel([{t:D.icon+' '+D.name,size:50}],{sw:2.4});lab.visible=false;out.label=lab;return out;}
  const T=s.tier;out.tier=T;
  /* station body by tier */
  if(T===0){/* manual bench behind the belt */
    bx(g,2.2,.08,.9,x,.82,z-1.45,mat('#8B5A2B',{roughness:.7}));[[-1,-1.8],[1,-1.8],[-1,-1.1],[1,-1.1]].forEach(([a,b])=>bx(g,.08,.82,.08,x+a,0,z+b,dk));
    if(k==='cut'){bx(g,.5,.25,.3,x-.6,.9,z-1.45,mat('#DC2626'));cy(g,.04,.4,x+.4,.9,z-1.4,dk);}
    if(k==='weld'){bx(g,.6,.55,.45,x-.75,.9,z-1.5,mat('#2563EB'));cy(g,.06,.5,x+.6,.9,z-1.4,mat('#4B5563'));}
    if(k==='asm'){for(let i=0;i<4;i++)bx(g,.22,.12,.22,x-.7+i*.4,.9,z-1.5,mat(pick(['#EF4444','#3B82F6','#FACC15','#10B981'])));}
    if(k==='paint'){cy(g,.2,.5,x-.6,.9,z-1.45,mat('#10B981'));cy(g,.2,.5,x-.1,.9,z-1.45,mat('#38BDF8'));}
    if(k==='qa'){bx(g,.5,.35,.08,x,.95,z-1.75,mat('#111827',{emissive:'#A855F7',emissiveIntensity:.5}));}
  }else{/* machine enclosure over the belt */
    if(k==='cut'){[-1,1].forEach(a=>{bx(g,.18,1.9,.18,x+a*.95,0,z-.85,col);bx(g,.18,1.9,.18,x+a*.95,0,z+.85,col);});bx(g,2.1,.24,1.9,x,1.9,z,dk);const gant=bx(g,.3,.22,1.8,x,1.66,z,col);out.gant=gant;
      const beam=new THREE.Mesh(BOX,new THREE.MeshBasicMaterial({color:'#FF3B3B',transparent:true,opacity:.85,blending:THREE.AdditiveBlending}));beam.scale.set(.05,.85,.05);beam.position.set(x,1.2,z);g.add(beam);out.beam=beam;
      bx(g,1.9,.04,1.7,x,1.98+.12,z,mat('#93C5FD',{transparent:true,opacity:.35,metalness:.3,roughness:.05}),false);}
    if(k==='weld'){[-1,1].forEach(a=>{const c=new THREE.Mesh(BOX,mat('#1D4ED8',{transparent:true,opacity:.55,roughness:.6,side:THREE.DoubleSide}));c.scale.set(.05,1.6,1.7);c.position.set(x+a*1.15,.95,z-.3);g.add(c);bx(g,.08,2,.08,x+a*1.15,0,z-1.15,dk);bx(g,.08,2,.08,x+a*1.15,0,z+.55,dk);});bx(g,2.4,.08,.08,x,2,z-1.15,dk);
      if(T===1){bx(g,.7,.9,.6,x+.2,0,z-1.65,mat('#2563EB'));cy(g,.05,.7,x+.2,.9,z-1.4,mat('#4B5563'));}}
    if(k==='asm'){bx(g,.12,2.5,.12,x-1,0,z-1.3,dk);bx(g,2.2,.12,.12,x,2.45,z-1.3,dk);bx(g,.12,.12,1.3,x,2.45,z-.65,dk);const drv=new THREE.Group();cy(drv,.02,.8,0,-.8,0,dk,false);bx(drv,.18,.3,.18,0,-1.1,0,mat('#F59E0B'));drv.position.set(x,2.45,z);g.add(drv);out.drv=drv;}
    if(k==='paint'){const bm=mat('#E5E7EB',{roughness:.45,metalness:.2});bx(g,2.6,2.3,.12,x,0,z-1.25,bm);[-1,1].forEach(a=>bx(g,.12,2.3,2.3,x+a*1.3,0,z-.1,bm));bx(g,2.72,.14,2.4,x,2.3,z-.1,col);
      for(let a=-1;a<=1;a+=2){const fan=new THREE.Group();cy(fan,.3,.06,0,0,0,dk,false);for(let b=0;b<3;b++){const bl=bx(fan,.5,.02,.1,0,.03,0,stl,false);bl.rotation.y=b*2.09;}fan.position.set(x+a*.7,2.45,z-.1);g.add(fan);(out.fans=out.fans||[]).push(fan);}}
    if(k==='qa'){[-1,1].forEach(a=>bx(g,.22,1.9,.3,x+a*.85,0,z,mat('#4C1D95',{roughness:.3,metalness:.4})));bx(g,1.92,.3,.36,x,1.9,z,mat('#4C1D95',{roughness:.3,metalness:.4}));
      const scan=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.06),new THREE.MeshBasicMaterial({color:'#A855F7',transparent:true,opacity:.9,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));scan.rotation.y=Math.PI/2;scan.position.set(x,1.4,z);g.add(scan);out.scan=scan;
      const sc=new THREE.Mesh(new THREE.PlaneGeometry(.7,.45),new THREE.MeshBasicMaterial({color:'#22C55E'}));sc.position.set(x+1.2,1.6,z+.1);g.add(sc);bx(g,.08,1.4,.08,x+1.2,0,z+.05,dk);out.screen=sc;}
  }
  if(T===2){/* robot cell: arms + safety fence */
    const tool=k==='weld'?'torch':k==='paint'?'spray':'grip',a1=makeArm(tool);a1.g.position.set(x-.4,0,z-1.35);g.add(a1.g);out.arms=[a1];
    if(k!=='qa'){const a2=makeArm(tool);a2.g.position.set(x+.9,0,z-1.35);g.add(a2.g);out.arms.push(a2);}
    const fm=mat('#FACC15',{roughness:.45}),mesh=mat('#9CA3AF',{transparent:true,opacity:.28,metalness:.6,side:THREE.DoubleSide});
    [[-2.2,-2.1],[2.2,-2.1],[-2.2,-.9],[2.2,-.9]].forEach(([a,b])=>bx(g,.1,1.5,.1,x+a,0,z+b,fm));const bp=new THREE.Mesh(BOX,mesh);bp.scale.set(4.4,1.3,.04);bp.position.set(x,.75,z-2.1);g.add(bp);
    [-1,1].forEach(a=>{const sp2=new THREE.Mesh(BOX,mesh);sp2.scale.set(.04,1.3,1.2);sp2.position.set(x+a*2.2,.75,z-1.5);g.add(sp2);});
    const hz=new THREE.Mesh(new THREE.PlaneGeometry(4.4,.3),new THREE.MeshStandardMaterial({map:hazardTex(),roughness:.6}));hz.rotation.x=-Math.PI/2;hz.position.set(x,.02,z-.8);g.add(hz);
    const lite=new THREE.Group();cy(lite,.08,.5,0,0,0,dk,false);const lb=sp(lite,.11,0,.6,0,mat('#39E75F',{emissive:'#39E75F',emissiveIntensity:2}));lite.position.set(x+2.2,1.5,z-2.1);g.add(lite);out.lamp=lb;}
  /* worker bot for manual + power tools */
  if(T<2&&GLTF.crowd){const r=makeRig(GLTF.crowd,MB.crew[(L.i*5+ST_KEYS.indexOf(k))%MB.crew.length],1.35);hardHat(r);r.root.position.set(x+.15,0,z-2.15);r.root.rotation.y=0;g.add(r.root);out.worker=r;}
  /* label */
  const lab=spriteLabel([{t:D.icon+' '+D.name,size:50},{t:TIERS[T].name.toUpperCase(),size:30,color:T===2?'#FDBA74':T===1?'#93C5FD':'#D1D5DB',font:'Inter, system-ui, sans-serif',weight:800}],{h:176,sw:3.1});lab.position.set(x,3.6,z-.6);g.add(lab);out.label=lab;
  const bub=bubble();g.add(bub);bub.position.set(x,2.75,z-.4);out.bub=bub;
  /* the queue crates for this station */
  out.crates=new THREE.InstancedMesh(BOX,new THREE.MeshStandardMaterial({map:crateTex(),roughness:.8}),ECON.queueMax);out.crates.count=0;out.crates.castShadow=true;g.add(out.crates);
  out.ring=new THREE.Mesh(new THREE.RingGeometry(2.1,2.35,48),new THREE.MeshBasicMaterial({color:'#22D3EE',transparent:true,opacity:0,depthWrite:false}));out.ring.rotation.x=-Math.PI/2;out.ring.position.set(x,.04,z-.35);g.add(out.ring);
  if(Q.t>=2&&(k==='weld'||k==='cut')){const pl=new THREE.PointLight(k==='weld'?0x9FD4FF:0xFF5A4A,0,7,2);pl.position.set(x,1.4,z);g.add(pl);out.light=pl;}
  COLL.push(out.coll={x0:x-1.25,x1:x+1.25,z0:z-2.4,z1:z-.7});
  return out;}

/* ---------- items on the belt (instanced) ---------- */
let IT=null;
function initItems(){const N=Q.t>=1?900:500;IT={base:new THREE.InstancedMesh(BOX,new THREE.MeshStandardMaterial({roughness:.35,metalness:.55}),N),top:new THREE.InstancedMesh(SPH,new THREE.MeshStandardMaterial({roughness:.3,metalness:.3}),N),N};
  [IT.base,IT.top].forEach(m=>{m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.setColorAt(0,new THREE.Color());m.castShadow=Q.t>=2;m.frustumCulled=false;scene.add(m);});}
const _col=new THREE.Color(),_q=new THREE.Quaternion(),_s=V(),_p=V();
function itemLook(it,b,t){const c=PCOL[it.p]||'#fff';switch(it.lvl){case 0:_s.set(.78,.06,.62);_col.set('#CBD5E1');break;case 1:_s.set(.62,.14,.5);_col.set('#E2E8F0');break;case 2:_s.set(.6,.36,.48);_col.set('#64748B');break;case 3:_s.set(.56,.46,.48);_col.set(c).multiplyScalar(.55);break;default:_s.set(.58,.48,.5);_col.set(c);}}
function drawItems(t){if(!IT||!S)return;let n=0,m=0;prodFrame();const put=(it,x,y,z)=>{if(it.lvl>=3){const P2=PRODUCTS[it.p];prodAt(it.p,it.lvl>=4||!P2.needs.includes('paint'),x,y,z,t);return;}if(n>=IT.N)return;itemLook(it);_p.set(x,y+_s.y/2,z);_q.identity();const M=_m4.compose(_p,_q,_s);IT.base.setMatrixAt(n,M);IT.base.setColorAt(n,_col);n++;
    if(it.lvl>=3&&m<IT.N){_p.set(x,y+_s.y+.12,z);const k=.2;_m4.compose(_p,_q,V(k,k*.8,k));IT.top.setMatrixAt(m,_m4);_col.set(it.lvl>=4?'#F8FAFC':'#94A3B8');IT.top.setColorAt(m,_col);m++;}};
  S.lines.slice(0,linesNow()).forEach((l,i)=>{const z=LZ(i);l.belt.forEach(it=>put(it,it.x,.76,z));ST_KEYS.forEach(k=>{const s=l.st[k];if(s.cur)put(s.cur,SLOT_X[k],.76,z);if(s.out)put(s.out,SLOT_X[k]+.7,.76,z);});});
  prodHide();IT.base.count=n;IT.top.count=m;[IT.base,IT.top].forEach(x=>{x.instanceMatrix.needsUpdate=true;x.instanceColor&&(x.instanceColor.needsUpdate=true);});}

/* ---------- trucks ---------- */
function makeTruck(color,label){const g=new THREE.Group(),b=new THREE.Group();g.add(b);bx(b,5.2,.35,1.9,0,.5,0,mat('#1F2937'));bx(b,1.5,1.5,1.9,2.0,.85,0,mat(color,{roughness:.35,metalness:.3}));bx(b,.06,.6,1.6,2.76,1.5,0,mat('#0B1220',{metalness:.6,roughness:.1}));bx(b,3.5,2.0,2.0,-.65,.85,0,mat('#F8FAFC',{roughness:.6}));
  [1.01,-1.01].forEach(sd=>{const s=signMesh([{t:label,size:80,color:'#0B1220'},{t:'a MoneyBot partner',size:40,color:'#475569',font:'Inter, system-ui, sans-serif',weight:700}],3.2,1.1,{w:768,h:256,bg:'#F8FAFC'});s.position.set(-.65,1.95,sd);if(sd<0)s.rotation.y=Math.PI;b.add(s);});
  const tire=mat('#111318',{roughness:.85});[[1.9,1],[1.9,-1],[-1.4,1],[-1.4,-1],[-.5,1],[-.5,-1]].forEach(([x,sd])=>{const w=new THREE.Mesh(CYL,tire);w.scale.set(.42,.3,.42);w.rotation.x=Math.PI/2;w.position.set(x,.42,sd*.88);b.add(w);});g.traverse(o=>{if(o.isMesh)o.castShadow=Q.t>0;});scene.add(g);return g;}
function sendTruck(li,kind){const z=LZ(li),B=hallBounds(),sp2=kind==='ship'?spShip&&spShip():spSteel&&spSteel();const tr=makeTruck(sp2?sp2.color:kind==='ship'?'#059669':'#2563EB',sp2?sp2.name:kind==='ship'?'MINIBOT EXPRESS':'BOT CITY STEEL');
  const out=kind==='ship',stop=out?B.x1+4:B.x0-4;tr.rotation.y=out?Math.PI:0;tr.position.set(out?stop+40:stop-40,0,z);W.trucks.push({g:tr,stop,dir:out?-1:1,ph:'in',t:0,out});}
function stepTrucks(dt){for(let i=W.trucks.length-1;i>=0;i--){const T=W.trucks[i],g=T.g;T.t+=dt;
  if(T.ph==='in'){g.position.x+=(T.stop-g.position.x)*Math.min(1,dt*1.6);if(Math.abs(g.position.x-T.stop)<.1){T.ph='wait';T.t=0;}}
  else if(T.ph==='wait'){if(T.t>2.5){T.ph='go';T.v=0;}}
  else{T.v=Math.min(16,(T.v||0)+dt*7);g.position.x+=(T.out?1:-1)*T.v*dt;if(Math.abs(g.position.x-T.stop)>60){scene.remove(g);W.trucks.splice(i,1);}}}}

/* ---------- per-frame ---------- */
function updateWorld(dt,t,running){W.t=t;if(!S)return;
  const mul=running?S.speed:0;W.beltMats.forEach(b=>{b.offset.y-=dt*mul*ECON.beltSpeed/1.3*.5;});
  if(W.crane){W.crane.position.x=Math.sin(t*.08)*6;}
  if(W.lotSign){W.lotSign.g.rotation.y=Math.sin(t*.6)*.18;W.lotSign.sign.position.y=W.lotSign.base+Math.sin(t*1.6)*.12;}
  W.lines.forEach((L,i)=>{const l=S.lines[i];if(!l)return;let worst=null,wq=4;
    ST_KEYS.forEach(k=>{const V2=L.st[k],s=l.st[k];if(!V2||!V2.g||!s.built||!V2.label)return;const busy=running&&!!s.cur&&!s.broken&&!s.needsCode,x=SLOT_X[k],z=L.z;
      /* crates in queue */
      if(V2.crates){const q=s.q.length;V2.crates.count=q;for(let j=0;j<q;j++){const col=j%3,row=Math.floor(j/3)%2,lay=Math.floor(j/6);_p.set(x-2.15+col*.5,.22+lay*.44,z+1.05+row*.5);_q.setFromAxisAngle(V(0,1,0),(j*1.7)%0.3);_m4.compose(_p,_q,V(.42,.42,.42));V2.crates.setMatrixAt(j,_m4);}V2.crates.instanceMatrix.needsUpdate=true;}
      if(s.q.length>=wq&&running){wq=s.q.length;worst=k;}
      /* workers */
      if(V2.worker){V2.worker.mixer.update(dt);rigPlay(V2.worker,s.broken?'Think':busy?'RightHand':'Idle');}
      /* tier effects */
      if(V2.arms)V2.arms.forEach((a,j)=>{poseArm(a,t*(s.boost>0?2:1)+j,busy,k==='weld'?'weld':k==='paint'?'spray':'grip',j?Math.PI*.15:-Math.PI*.15);a.led.material=busy?MB.eye.g:s.needsCode?MB.eye.y:MB.eye.r;
        if(busy&&k==='weld'&&Math.random()<dt*18){a.tip.getWorldPosition(_p);burst(_p.x,_p.y,_p.z,{add:true,n:3,color:pick(['#FFFFFF','#BFE3FF','#FFD27A']),spread:2.2,up:2,life:.35,size:.035});}
        if(busy&&k==='paint'&&Math.random()<dt*10){a.tip.getWorldPosition(_p);burst(_p.x,_p.y,_p.z,{n:2,color:PCOL[l.job.product],spread:.6,up:.3,g:-.3,life:.9,size:.12,grow:2});}});
      if(V2.beam){V2.beam.visible=busy;if(busy){V2.beam.position.x=x+Math.sin(t*7)*.5;V2.gant.position.x=V2.beam.position.x;V2.beam.material.opacity=.6+Math.random()*.4;if(Math.random()<dt*14)burst(V2.beam.position.x,.82,z+rand(-.2,.2),{add:true,n:2,color:'#FF7A5A',spread:1.4,up:1.5,life:.3,size:.03});}}
      if(k==='weld'&&busy&&!V2.arms&&Math.random()<dt*(s.tier?16:9))burst(x+rand(-.3,.3),.95,z,{add:true,n:3,color:pick(['#FFFFFF','#BFE3FF','#FFD27A']),spread:2.2,up:2,life:.35,size:.035});
      if(k==='cut'&&busy&&!s.tier&&Math.random()<dt*8)burst(x,.95,z,{add:true,n:2,color:'#FFB46B',spread:1.6,up:1.4,life:.3,size:.03});
      if(k==='asm'&&V2.drv){V2.drv.position.y=2.45-(busy?Math.abs(Math.sin(t*5))*.35:0);if(busy&&Math.random()<dt*4)burst(x,.95,z,{add:true,n:1,color:'#FACC15',spread:.8,up:.8,life:.2,size:.03});}
      if(V2.fans)V2.fans.forEach(f=>f.rotation.y+=dt*(busy?14:2));
      if(k==='paint'&&busy&&!V2.arms&&Math.random()<dt*6)burst(x+rand(-.4,.4),1.2,z,{n:2,color:PCOL[l.job.product],spread:.5,up:.2,g:-.2,life:.9,size:.12,grow:2});
      if(V2.scan){V2.scan.visible=busy||s.tier>0;V2.scan.position.y=.95+Math.abs(Math.sin(t*(busy?3:1)))*.9;V2.screen.material.color.set(s.broken?'#EF4444':busy?'#22C55E':'#334155');}
      if(V2.light){V2.light.intensity=busy?(k==='weld'?rand(1.5,4.5):rand(.6,1.4)):0;}
      if(V2.lamp)V2.lamp.material=s.broken?MB.eye.r:s.needsCode?MB.eye.y:MB.eye.g;
      /* broken: smoke + bubble */
      if(s.broken&&Math.random()<dt*7)burst(x+rand(-.3,.3),1.6,z-.4,{n:1,color:'#4B5563',spread:.3,up:.8,g:-1,life:1.4,size:.22,grow:2.5});
      if(V2.bub)setBubble(V2.bub,s.broken?'⚠️':s.needsCode?'💻':s.boost>0?'⚡':null,s.broken?'rgba(185,28,28,.95)':null);
      if(V2.ring){V2.ring.material.opacity=s.boost>0?.45+Math.sin(t*8)*.25:0;}
    });
    /* bottleneck label: show only when crates are really piling up */
    if(worst&&wq>=5){L.bn.visible=true;L.bn.position.set(SLOT_X[worst],4.45+Math.sin(t*4)*.08,L.z-.6);}else L.bn.visible=false;
    /* ship pallet */
    const shown=Math.min(12,L.ship%13);L.boxes.count=shown;for(let j=0;j<shown;j++){_p.set(-.4+(j%3)*.4,.4+Math.floor(j/9)*.36,-.4+Math.floor(j/3)%3*.4);_q.identity();_m4.compose(_p,_q,V(.36,.34,.36));L.boxes.setMatrixAt(j,_m4);}L.boxes.instanceMatrix.needsUpdate=true;
  });
  drawItems(t);stepTrucks(dt);}
function rebuildWorld(){buildShell();buildLines();syncStations();buildProps();}
