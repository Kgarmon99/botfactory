/* ---------- the outside world: yard gate, street, bus stop, test drives, people ---------- */
const OUT={out:false,g:null,peds:[],bus:null,busGo:0,drive:null,car:null,bb:null,boom:null,stop:{x:-34,z:15.2},seen:false};
const ROAD_FAR=31;

function walkClamp(p){const B=hallBounds();
  if(MILL.on){p.x=clamp(p.x,B.x0+.6,B.x1-.6);p.z=clamp(p.z,B.z0+.6,B.z1-.4);return;}
  const z1=B.z1,inGate=!OUT.drive&&!CX.riding&&Math.abs(p.x-GATE_X)<1.25;
  if(!OUT.out){p.x=clamp(p.x,B.x0+.6,B.x1-.6);p.z=Math.max(p.z,B.z0+.6);
    if(p.z>z1-.4){if(inGate)p.x=clamp(p.x,GATE_X-1.05,GATE_X+1.05);else p.z=z1-.4;}
    if(p.z>z1+.7)setOut(true);}
  else{p.x=clamp(p.x,-62,62);p.z=clamp(p.z,z1-1.5,ROAD_FAR);
    if(p.z<z1+.6){if(inGate)p.x=clamp(p.x,GATE_X-1.05,GATE_X+1.05);else p.z=z1+.6;}
    if(p.z<z1-.7)setOut(false);}}

function setOut(v){if(OUT.out===v)return;OUT.out=v;if(!S)return;
  if(v&&!S.flags.yard){S.flags.yard=1;advise(`You're outside! Your <b>finished goods</b> park in the lot. Walk up to one and road-test it, take the <b>Plant Car</b> for a spin, or catch the <b>bus</b> to the steel mill.`,9000);}}

/* ---------- build ---------- */
function makeBus(){const g=new THREE.Group(),b=mat('#F59E0B',{roughness:.35,metalness:.3}),dk=mat('#111318',{roughness:.85}),gl=mat('#0F172A',{roughness:.05,metalness:.7});
  bx(g,10,2.6,2.5,0,.45,0,b);bx(g,9.6,.9,2.54,0,1.85,0,gl);bx(g,.1,1.6,2.2,5.02,1.2,0,gl);bx(g,10.05,.18,2.56,0,1.62,0,dk,false);
  [[3.4,1.1],[3.4,-1.1],[-3.4,1.1],[-3.4,-1.1]].forEach(([x,z])=>wheel(g,.52,.36,x,.52,z,dk));
  const sg=signMesh([{t:'MILL TOUR',size:96,color:'#FF8A3D'}],2,.42,{w:512,h:108,bg:'#0B0F14',glow:1});sg.position.set(5.08,2.55,0);sg.rotation.y=Math.PI/2;g.add(sg);
  const sd=signMesh([{t:'BOT CITY TRANSIT',size:80,color:'#111318'}],5,.6,{w:1000,h:120,bg:'#F59E0B'});sd.position.set(0,1.05,-1.27);sd.rotation.y=Math.PI;g.add(sd);
  bx(g,.06,.2,.5,5.02,.75,.8,mat('#FFF6DD',{emissive:'#FFE7A8',emissiveIntensity:1.2}),false);bx(g,.06,.2,.5,5.02,.75,-.8,mat('#FFF6DD',{emissive:'#FFE7A8',emissiveIntensity:1.2}),false);
  g.traverse(o=>{if(o.isMesh)o.castShadow=Q.t>0;});return g;}

function billboardFill(){const s=slotFill('billboard',SPONSORS.billboard);
  if(s)return [{t:s.name.toUpperCase(),size:150,color:s.color||'#fff'},{t:s.tagline||'Proud to build in Kentucky',size:64,color:'#fff'}];
  return [{t:'KENTUCKY MAKES IT',size:150,color:'#FACC15'},{t:'robots · welding · steel · careers start here',size:60,color:'#fff'}];}

function buildOutside(){const g=new THREE.Group();OUT.g=g;scene.add(g);const conc=mat('#A7ADB4',{roughness:.9}),white=mat('#F8FAFC',{roughness:.6}),trim=mat('#1E242B',{roughness:.5,metalness:.3}),yel=mat('#FACC15',{roughness:.45});
  /* walkway from the gate to the street + crosswalk */
  const w=new THREE.Mesh(new THREE.PlaneGeometry(3,8.8),conc);w.rotation.x=-Math.PI/2;w.position.set(GATE_X,.018,11.9);w.receiveShadow=true;g.add(w);
  for(let z=17.3;z<25;z+=1.1)bx(g,3,.02,.55,GATE_X,.02,z,white,false);
  /* guard booth */
  const gb=new THREE.Group();bx(gb,1.8,2.4,1.6,0,0,0,mat('#E5E7EB',{roughness:.6}));bx(gb,1.82,.8,1.62,0,1.1,0,mat('#CFE8F7',{emissive:'#BFE3FF',emissiveIntensity:.4,roughness:.1}),false);bx(gb,2.1,.18,1.9,0,2.4,0,trim,false);gb.position.set(GATE_X-2.9,0,9);g.add(gb);
  /* gate boom: lifts when you walk up */
  const bp=new THREE.Group();bp.position.set(GATE_X+1.6,1.05,7.75);bx(g,.4,1.1,.4,GATE_X+1.6,0,7.75,trim);const arm=new THREE.Group();bp.add(arm);
  for(let i=0;i<6;i++)bx(arm,.5,.12,.12,-.25-i*.5,0,0,i%2?white:mat('#DC2626',{roughness:.5}),false);g.add(bp);OUT.boom=arm;
  /* plant car you can drive any time */
  const car=makeCar('#FACC15');scene.remove(car);g.add(car);OUT.car={g:car,x:-22,z:11.5,ry:0,home:[-22,11.5,0]};car.position.set(-22,0,11.5);
  const cs=signMesh([{t:'PLANT CAR',size:90,color:'#FACC15'},{t:'reserved · test driver',size:44,color:'#fff'}],2.4,.7,{w:700,h:200,bg:'#0D1117',glow:.6});cs.position.set(-22,1.9,9.3);g.add(cs);cy(g,.05,1.6,-22,0,9.3,trim,false);
  bx(g,6.4,.02,3.2,-22,.016,11.5,mat('#3A3F46',{roughness:.9}),false);
  /* bus stop shelter */
  const S0=OUT.stop,sh=new THREE.Group();sh.position.set(S0.x,0,S0.z);g.add(sh);bx(sh,4,.12,1.6,0,2.5,0,trim,false);bx(sh,4,2.4,.08,0,.1,-.75,mat('#BFE3FF',{transparent:true,opacity:.35,roughness:.05}),false);
  [-1.95,1.95].forEach(x=>bx(sh,.1,2.5,.1,x,0,.7,trim,false));bx(sh,2.6,.1,.5,0,.5,-.4,mat('#6B7280'),false);
  const bs=signMesh([{t:'BUS',size:120,color:'#111318'},{t:'to the steel mill',size:46,color:'#111318'}],1,.9,{w:256,h:230,bg:'#F59E0B'});bs.position.set(2.4,2.5,.8);sh.add(bs);cy(sh,.05,2.9,2.4,0,.7,trim,false);
  OUT.bus=makeBus();g.add(OUT.bus);OUT.bus.position.set(S0.x,0,17.6);
  /* billboard on the corner */
  const bb=new THREE.Group();bb.position.set(-44,0,11);bb.rotation.y=.42;g.add(bb);[-4.5,4.5].forEach(x=>{bx(bb,.4,6,.4,x,0,0,trim);});bx(bb,13,.3,.8,0,5.8,.4,trim,false);
  OUT.bb=signMesh(billboardFill(),12.4,4.2,{w:1600,h:540,bg:'#0D1117',glow:.9});OUT.bb.position.set(0,8.2,.25);bb.add(OUT.bb);bx(bb,12.8,4.6,.3,0,5.9,0,trim,false);
  for(let i=-1;i<=1;i++){const l=new THREE.Group();bx(l,.5,.2,.3,0,0,0,trim,false);l.position.set(i*4,10.6,.6);l.rotation.x=.8;bb.add(l);}
  const sp2=slotFill('billboard',SPONSORS.billboard);if(sp2&&!sp2.placeholder)spTrack&&spTrack('view',sp2,{slot:'billboard'});
  /* grass yard, curbs, flower beds, staff parking */
  const grassT=canvasTex(256,256,(c,w,h)=>{c.fillStyle='#4E8A3F';c.fillRect(0,0,w,h);for(let i=0;i<2600;i++){c.fillStyle=pick(['#5B9A49','#457D38','#62A250','#3F7433']);c.fillRect(Math.random()*w,Math.random()*h,2,3+Math.random()*4);}});grassT.wrapS=grassT.wrapT=THREE.RepeatWrapping;grassT.repeat.set(30,2.4);
  const gr=new THREE.Mesh(new THREE.PlaneGeometry(124,8.3),new THREE.MeshStandardMaterial({map:grassT,roughness:1}));gr.rotation.x=-Math.PI/2;gr.position.set(0,.004,11.75);gr.receiveShadow=true;g.add(gr);
  const curb=mat('#C7CCD1',{roughness:.85});bx(g,124,.14,.22,0,0,15.85,curb,false);bx(g,124,.12,.2,0,0,7.62,curb,false);
  const asph=mat('#2F3439',{roughness:.95});const pad=(x0,x1,z0,z1)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),asph);m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2,.012,(z0+z1)/2);m.receiveShadow=true;g.add(m);};
  pad(-8.6,18.6,8.6,16);pad(13.5,18.6,15.6,17.3);pad(22,52,8.4,15.6);pad(36,41,15.6,17.3);pad(-26,-18,9.6,16.6);
  for(let x=22.6;x<=52;x+=3.4){bx(g,.1,.02,2.6,x,.02,9.9,white,false);bx(g,.1,.02,2.6,x,.02,14.1,white,false);}
  const spCols=['#DC2626','#1D4ED8','#F8FAFC','#111827','#059669','#7C3AED','#9CA3AF'];for(let i=0;i<6;i++){if(Math.random()<.25)continue;const c=makeCar(pick(spCols));scene.remove(c);g.add(c);c.position.set(24.3+i*3.4,0,i%2?9.9:14.1);c.rotation.y=Math.PI/2*(i%2?1:-1);}
  const ps=signMesh([{t:'STAFF PARKING',size:80,color:'#fff'}],2.4,.5,{w:600,h:124,bg:'#1D4ED8'});ps.position.set(37,1.9,15.9);g.add(ps);cy(g,.05,1.7,37,0,15.9,trim,false);
  const soil=mat('#4A3426',{roughness:1}),fl=['#F43F5E','#FACC15','#F97316','#E879F9','#F8FAFC'];const bed=(x,z,w)=>{bx(g,w,.16,.9,x,0,z,soil,false);bx(g,w+.1,.2,.1,x,0,z-.47,curb,false);bx(g,w+.1,.2,.1,x,0,z+.47,curb,false);
    const n=Math.round(w*5),im=new THREE.InstancedMesh(new THREE.SphereGeometry(.13,6,4),new THREE.MeshStandardMaterial({roughness:.7}),n),m4=new THREE.Matrix4(),col=new THREE.Color();
    for(let i=0;i<n;i++){m4.makeTranslation(x+rand(-w/2+.1,w/2-.1),.24+rand(0,.08),z+rand(-.32,.32));im.setMatrixAt(i,m4);im.setColorAt(i,col.set(i%3?'#2F6A33':pick(fl)));}g.add(im);};
  [[-3.5,8.3,5],[-30,15.2,3],[-48,15.2,6],[58,15.2,6],[-56,8.3,6]].forEach(([x,z,w])=>bed(x,z,w));
  /* yard lamp posts that switch on at dusk */
  OUT.nightMats=[];for(const x of [-40,-26,-14,24,34,46]){const lm=mat('#FFF1C9',{emissive:'#FFD27A',emissiveIntensity:0});OUT.nightMats.push(lm);cy(g,.06,4.2,x,0,8.1,trim,false);bx(g,.5,.12,.5,x,4.2,8.1,trim,false);bx(g,.4,.06,.4,x,4.14,8.1,lm,false);}
  /* benches */
  [[-6,8.4],[-28,15.2],[24,15.2],[40,15.2]].forEach(([x,z])=>{bx(g,1.8,.42,.5,x,0,z,mat('#6B7280',{roughness:.7}),false);bx(g,1.8,.08,.6,x,.42,z,mat('#8B5E3C',{roughness:.8}),false);});
  /* pedestrians on the sidewalk */
  const n=Q.t>=2?7:4;for(let i=0;i<n;i++){const r=makeRig(GLTF.crowd,MB.crew[i%MB.crew.length],1.3);if(i%3===0)hardHat(r);g.add(r.root);const dir=i%2?1:-1;OUT.peds.push({r,x:rand(-55,55),z:16.4+(i%2?.35:-.35),dir,v:rand(1.3,1.9),wave:0,bob:rand(0,6)});}
  g.traverse(o=>{if(o.isMesh&&o.castShadow===undefined)o.castShadow=false;});}

/* ---------- driving ---------- */
const PRODNAME={toy:'Toy Bot',kart:'Go-Kart',drone:'Drone',scooter:'E-Scooter',dog:'Robot Dog',ev:'Mini EV',washer:'Smart Washer',bracket:'Jet Bracket',etruck:'E-Truck'};
function startDrive(kind,i){if(OUT.drive)return;let m,p=null,mul=2.4;
  if(kind==='car'){m=OUT.car.g;}else{p=CX.parked[i];const src=CX.lotG[i];if(!src)return;m=src;const s=CX.lotSlots[i];P.pos.set(s.x,0,s.z);P.ry=s.ry+Math.PI/2;mul={toy:1.4,kart:2.3,drone:2,scooter:1.9,dog:1.5,ev:2.6,etruck:2.2,washer:1.2,bracket:1.3}[p]||2;}
  if(kind==='car'){P.pos.set(OUT.car.x,0,OUT.car.z);P.ry=OUT.car.ry+Math.PI/2;}
  OUT.drive={kind,i,p,m,t:0,top:0};P.rig.root.visible=false;P.speedMul=mul;P.target=null;sfx('horn');$('#driveHud').hidden=false;
  toast(kind==='car'?'<b>Plant car</b> — hit the road. Press <b>E</b> to park.':`<b>Road test: ${PRODNAME[p]}</b>. Real plants road-test finished units off the line before they ship. Press <b>E</b> to park.`,'good');}
function endDrive(){const D=OUT.drive;if(!D)return;OUT.drive=null;P.rig.root.visible=true;P.speedMul=1;$('#driveHud').hidden=true;
  const a=P.ry+Math.PI/2;P.pos.x+=Math.sin(a)*1.6;P.pos.z+=Math.cos(a)*1.6;P.pos.z=Math.max(P.pos.z,hallBounds().z1+.8);
  if(D.kind==='car'){OUT.car.x=D.m.position.x;OUT.car.z=D.m.position.z;OUT.car.ry=D.m.rotation.y;}
  else{CX.lotDirty=true;const k='rt_'+D.p;if(!S.flags[k]&&D.top>6){S.flags[k]=1;S.cash+=100;floatAt(V(P.pos.x,2,P.pos.z),'+$100 road test','#39E75F');toast(`<b>Road test passed!</b> End-of-line testing catches problems before customers do. +$100`,'good');renderHUD();save();}}
  sfx('tick');}
function nearestLotCar(){if(!CX.lotSlots)return -1;let b=-1,bd=2.3;CX.parked.forEach((p,i)=>{const s=CX.lotSlots[i],d=Math.hypot(P.pos.x-s.x,P.pos.z-s.z);if(d<bd){bd=d;b=i;}});return b;}

/* ---------- bus to the mill ---------- */
function rideBus(){if(S.phase!=='board'){toast('The mill bus runs <b>between shifts</b>. Finish this shift first!','warn');return;}
  if(CX.riding)toggleRide();P.pos.set(OUT.stop.x+1,0,OUT.stop.z+.3);P.rig.root.visible=false;OUT.busGo=.001;sfx('horn');const bx0=OUT.stop.x;
  playShots([{p:[bx0-14,2.4,24],p2:[bx0-8,2.8,24.5],l:[bx0,1.5,17.6],l2:[bx0+6,1.6,17.6],d:2.6,cap:'<small>BOT CITY TRANSIT</small>Next stop: the steel mill'},
    {p:[bx0+12,6,28],p2:[bx0+40,8,30],l:[bx0+14,1.5,19],l2:[bx0+46,1.5,19],d:2.4,cap:'Where your steel comes from…'}],()=>{P.rig.root.visible=true;OUT.busGo=0;OUT.bus.position.x=OUT.stop.x;enterMill();});}

/* ---------- actions + per frame ---------- */
function outAct(){if(!S||!OUT.g)return null;if(OUT.drive)return {t:OUT.drive.kind==='car'?'Park the plant car':'Park it back in the lot',ic:'🚗',f:endDrive};
  if(!OUT.out||CX.riding)return null;const px=P.pos.x,pz=P.pos.z;
  if(Math.hypot(px-OUT.stop.x,pz-OUT.stop.z)<3)return S.phase==='board'?{t:'Ride the bus to the steel mill',ic:'🔥',hot:1,f:rideBus}:{t:'Mill bus runs between shifts',ic:'⏳',f:null};
  if(Math.hypot(px-OUT.car.x,pz-OUT.car.z)<3)return {t:'Drive the plant car',ic:'🚗',f:()=>startDrive('car')};
  const i=nearestLotCar();if(i>=0)return {t:`Road-test this ${PRODNAME[CX.parked[i]]}`,ic:'🚗',hot:!S.flags['rt_'+CX.parked[i]],f:()=>startDrive('lot',i)};return null;}

function updateOutside(dt,t){if(!OUT.g)return;const px=P.pos.x,pz=P.pos.z,D=OUT.drive;
  /* gate boom lifts when someone is near */
  const near=Math.hypot(px-GATE_X,pz-7.5)<4.5&&!MILL.on;OUT.boom.rotation.z=lerp(OUT.boom.rotation.z,near?-1.35:0,1-Math.exp(-6*dt));
  if(D){D.t+=dt;const m=D.m;m.position.set(px,0,pz);m.rotation.y=P.ry-Math.PI/2;const v=P.vel.length();D.top=Math.max(D.top,v);
    const mph=Math.round(v*2.3);$('#driveSpd').textContent=mph;$('#driveName').textContent=D.kind==='car'?'PLANT CAR':'ROAD TEST · '+PRODNAME[D.p].toUpperCase();
    CX.cars.forEach(c=>{if(Math.abs(c.g.position.x-px)<2.6&&Math.abs(c.g.position.z-pz)<1.8&&v>2){P.vel.multiplyScalar(-.4);camS.shake=.35;tone(90,.2,'sawtooth',.05);}});}
  if(D&&D.kind==='lot'){/* keep the lot from rebuilding the car we're driving */CX.lotDirty=false;}
  /* bus */
  if(OUT.busGo>0){OUT.busGo+=dt;OUT.bus.position.x=OUT.stop.x+Math.pow(OUT.busGo,2)*3.2;}
  /* pedestrians */
  OUT.peds.forEach(p=>{const d=Math.hypot(px-p.x,pz-p.z),block=(D&&d<5)||(d<1.3);
    if(p.wave>0){p.wave-=dt;}else if(!block){p.x+=p.dir*p.v*dt;p.bob+=dt*p.v*4;if(p.x>60||p.x<-60)p.dir*=-1;}
    if(!p.waved&&d<3.2&&OUT.out&&!D){p.waved=1;p.wave=2.2;rigPlay(p.r,pick(['Wave','Nod','Salute']),true);}if(d>8)p.waved=0;
    const r=p.r.root;r.position.set(p.x,p.wave>0||block?0:Math.abs(Math.sin(p.bob))*.07,p.z);const face=p.wave>0?Math.atan2(px-p.x,pz-p.z):(p.dir>0?Math.PI/2:-Math.PI/2);r.rotation.y+=angDiff(face,r.rotation.y)*Math.min(1,dt*8);p.r.mixer.update(dt);});
  /* finished goods sign + car body bob when idle */
  if(!D&&OUT.car)OUT.car.g.position.set(OUT.car.x,0,OUT.car.z),OUT.car.g.rotation.y=OUT.car.ry;}

/* traffic yields to you, the bus and each other */
function trafficStep(dt){const px=P.pos.x,pz=P.pos.z;
  CX.cars.forEach(c=>{if(c.cv==null)c.cv=c.v;let want=c.v;const cx=c.g.position.x,cz=c.g.position.z;
    const ahead=(x,z,w)=>{const a=(x-cx)*c.dir;return Math.abs(z-cz)<w&&a>0?a:1e9;};
    let gap=ahead(px,pz,1.7);
    if(OUT.bus)gap=Math.min(gap,ahead(OUT.bus.position.x-c.dir*5,OUT.bus.position.z,1.9));
    CX.cars.forEach(o=>{if(o!==c)gap=Math.min(gap,ahead(o.g.position.x-c.dir*2.2,o.g.position.z,.6));});
    if(gap<12)want=Math.min(want,Math.max(0,(gap-3)*1.6));
    c.cv+=clamp(want-c.cv,-22*dt,8*dt);
    if(c.cv<.3&&ahead(px,pz,1.7)<8){c.hold=(c.hold||0)+dt;if(c.hold>1.6&&!c.honked){c.honked=1;sfx('horn');}}else{c.hold=0;c.honked=0;}
    c.g.position.x+=c.dir*c.cv*dt;if(c.g.position.x>170)c.g.position.x=-170;if(c.g.position.x<-170)c.g.position.x=170;});}
