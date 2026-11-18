/* ===================== BotFactory · 3D world ===================== */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const MOBILE=matchMedia('(pointer:coarse)').matches, CROS=/CrOS/.test(navigator.userAgent);
let renderer, scene, camera, sun, hemi, clock=new THREE.Clock();
const GLTF={}, MB={}, W={anim:[], rigs:[], floaters:[], walls:[], lampMats:[], glassMats:[], pools:null, rays:[], cars:[]};
const BOX=new THREE.BoxGeometry(1,1,1), SPH=new THREE.SphereGeometry(1,14,10), CYL=new THREE.CylinderGeometry(1,1,1,18), CYL8=new THREE.CylinderGeometry(1,1,1,8);
const mat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c, roughness:.7, metalness:0},o));
function bx(g,w,h,d,x,y,z,m,cast=true){ const e=new THREE.Mesh(BOX,m); e.scale.set(w,h,d); e.position.set(x,y+h/2,z); e.castShadow=cast; e.receiveShadow=true; g.add(e); return e; }
function cy(g,r,h,x,y,z,m,cast=true){ const e=new THREE.Mesh(CYL,m); e.scale.set(r,h,r); e.position.set(x,y+h/2,z); e.castShadow=cast; e.receiveShadow=true; g.add(e); return e; }
const _m=new THREE.Matrix4(), _q=new THREE.Quaternion(), _e=new THREE.Euler(), _v=new THREE.Vector3(), _s=new THREE.Vector3(), _c=new THREE.Color(), _c2=new THREE.Color();

/* ---------- quality ---------- */
const Q={level:(()=>{ try{ const s=localStorage.getItem('bf_q'); if(s) return s; }catch(e){} return (MOBILE||CROS)?'med':'high'; })()};
const QS={high:{pr:1.5, shadow:2048, soft:true, fx:260, rays:true, trees:1}, med:{pr:1, shadow:1024, soft:false, fx:160, rays:true, trees:.7}, low:{pr:.75, shadow:0, soft:false, fx:90, rays:false, trees:.45}};
const qs=()=>QS[Q.level];

/* ---------- merged static geometry: one draw call per material ---------- */
function mergeGeos(list){ let n=0; const parts=list.map(g=>{ g=g.index?g.toNonIndexed():g; n+=g.attributes.position.count; return g; });
  const pos=new Float32Array(n*3), nor=new Float32Array(n*3), uv=new Float32Array(n*2); let o=0;
  parts.forEach(g=>{ const c=g.attributes.position.count; pos.set(g.attributes.position.array,o*3); nor.set(g.attributes.normal.array,o*3); if(g.attributes.uv) uv.set(g.attributes.uv.array,o*2); o+=c; });
  const m=new THREE.BufferGeometry(); m.setAttribute('position',new THREE.BufferAttribute(pos,3)); m.setAttribute('normal',new THREE.BufferAttribute(nor,3)); m.setAttribute('uv',new THREE.BufferAttribute(uv,2)); m.computeBoundingSphere(); return m; }
class Static{ constructor(){ this.m=new Map(); }
  add(geo,mtx,mat){ const g=geo.clone(); g.applyMatrix4(mtx); if(!this.m.has(mat)) this.m.set(mat,[]); this.m.get(mat).push(g); return this; }
  box(w,h,d,x,y,z,mat,ry=0,rx=0,rz=0){ _m.compose(_v.set(x,y+h/2,z),_q.setFromEuler(_e.set(rx,ry,rz)),_s.set(w,h,d)); return this.add(BOX,_m,mat); }
  cyl(r,h,x,y,z,mat,geo,rx=0,rz=0){ _m.compose(_v.set(x,y+h/2,z),_q.setFromEuler(_e.set(rx,0,rz)),_s.set(r,h,r)); return this.add(geo||CYL,_m,mat); }
  geo(geo,x,y,z,mat,sx=1,sy=1,sz=1,ry=0){ _m.compose(_v.set(x,y,z),_q.setFromEuler(_e.set(0,ry,0)),_s.set(sx,sy,sz)); return this.add(geo,_m,mat); }
  build(parent,cast=true,recv=true){ const out=[]; for(const [mat,gs] of this.m){ const mesh=new THREE.Mesh(mergeGeos(gs),mat); mesh.castShadow=cast&&!mat.transparent; mesh.receiveShadow=recv; parent.add(mesh); out.push(mesh); } this.m.clear(); return out; } }

/* ---------- MoneyBot rigs (shared MoneyVerse assets) ---------- */
function parseGLB(b64){ const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)).buffer; return new Promise((res,rej)=>new THREE.GLTFLoader().parse(bin,'',res,rej)); }
function setupMaterials(){
  MB.face=mat('#05070D',{roughness:.18, metalness:.1}); MB.coin=mat('#FBBF24',{roughness:.35, metalness:.45, emissive:'#F59E0B', emissiveIntensity:.25});
  MB.hero=mat('#F8FAFC',{roughness:.24, metalness:.05}); MB.rust=mat('#B45309',{roughness:.85, metalness:.3});
  MB.eye={g:mat('#16A34A',{emissive:'#22C55E', emissiveIntensity:1, roughness:.6}), y:mat('#D97706',{emissive:'#F59E0B', emissiveIntensity:1, roughness:.6}), r:mat('#B91C1C',{emissive:'#EF4444', emissiveIntensity:1.1, roughness:.6})};
  MB.bodies={}; ['#BBF7D0','#BFDBFE','#FDE68A','#FBCFE8','#DDD6FE','#FED7AA','#A5F3FC'].forEach(c=>MB.bodies[c]=mat(c,{roughness:.32}));
}
function makeRig(gltf, body, height, eye){
  const model=THREE.SkeletonUtils.clone(gltf.scene), eyes=[];
  model.traverse(o=>{ if(!o.isMesh) return; o.frustumCulled=false; o.castShadow=true; const n=(o.material&&o.material.name)||'';
    if(n==='Silver') o.material=body; else if(n==='eyes'){ o.material=MB.eye[eye||'g']; eyes.push(o); } else if(n==='Face'||n==='Hat') o.material=MB.face; else if(n==='Coin') o.material=MB.coin; });
  const holder=new THREE.Group(); holder.add(model); const mixer=new THREE.AnimationMixer(model), acts={};
  gltf.animations.forEach(c=>acts[c.name]=mixer.clipAction(c)); acts.Idle.play(); mixer.update(Math.random()*1.5);
  const box=new THREE.Box3().setFromObject(model), s=height/(box.max.y-box.min.y); model.position.y=-box.min.y; holder.scale.setScalar(s);
  const rig={root:holder, model, mixer, acts, eyes, cur:'Idle'}; mixer.addEventListener('finished',()=>rigPlay(rig,'Idle')); W.rigs.push(rig); return rig;
}
function rigPlay(rig,name,once){ const a=rig.acts[name]; if(!a||rig.cur===name&&!once) return; const p=rig.acts[rig.cur]; a.reset(); a.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat, once?1:Infinity); a.clampWhenFinished=false; a.play(); if(p&&p!==a) p.crossFadeTo(a,.25,false); rig.cur=name; }
function dropRig(rig){ if(!rig) return; rig.root.parent&&rig.root.parent.remove(rig.root); const i=W.rigs.indexOf(rig); if(i>=0) W.rigs.splice(i,1); }
let blobTex=null, blobMat=null; const PLANE=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
function radialTex(stops,size=64){ const c=document.createElement('canvas'); c.width=c.height=size; const g=c.getContext('2d'); const r=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2); stops.forEach(([o,col])=>r.addColorStop(o,col)); g.fillStyle=r; g.fillRect(0,0,size,size); return new THREE.CanvasTexture(c); }
function blob(s=1,op=1){ if(!blobTex){ blobTex=radialTex([[0,'rgba(0,0,0,.55)'],[.55,'rgba(0,0,0,.25)'],[1,'rgba(0,0,0,0)']]); blobMat=new THREE.MeshBasicMaterial({map:blobTex, transparent:true, depthWrite:false}); }
  const m=new THREE.Mesh(PLANE, op===1?blobMat:new THREE.MeshBasicMaterial({map:blobTex, transparent:true, depthWrite:false, opacity:op})); m.position.y=.025; m.scale.set(s,1,s); m.renderOrder=1; return m; }

/* ---------- text textures, signs, sprites ---------- */
function drawText(c, lines, o){ const g=c.getContext('2d'), w=c.width, h=c.height; g.clearRect(0,0,w,h);
  if(o.bg){ g.fillStyle=o.bg; g.beginPath(); g.roundRect(0,0,w,h,o.r||0); g.fill(); }
  if(o.border){ g.strokeStyle=o.border; g.lineWidth=o.bw||8; g.beginPath(); g.roundRect((o.bw||8)/2,(o.bw||8)/2,w-(o.bw||8),h-(o.bw||8),o.r||0); g.stroke(); }
  (Array.isArray(lines)?lines:[lines]).forEach((L,i,arr)=>{ const t=L.t||L; let sz=L.size||o.size||64; const wt=L.weight||o.weight||800, ff=o.font||'Inter, system-ui, sans-serif';
    g.font=`${wt} ${sz}px ${ff}`; while(g.measureText(t).width>w*.9 && sz>12){ sz-=2; g.font=`${wt} ${sz}px ${ff}`; }
    g.fillStyle=L.color||o.color||'#fff'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(t, w/2, h*(arr.length===1?.54:(i+.6)/arr.length)); }); }
function textTex(lines, o={}){ const c=document.createElement('canvas'); c.width=o.w||512; c.height=o.h||128; drawText(c,lines,o);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; t.userData={canvas:c}; return t; }
function sign(g, lines, w, h, x, y, z, o={}){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshStandardMaterial({map:textTex(lines,Object.assign({w:Math.round(512*Math.max(1,w/h/4)),h:128},o)), emissive:'#fff', emissiveIntensity:o.glow||0, roughness:.6, transparent:!!o.transparent}));
  if(o.glow) m.material.emissiveMap=m.material.map; m.position.set(x,y,z); if(o.ry) m.rotation.y=o.ry; g.add(m); return m; }
function sprite(lines, o={}){ const tex=textTex(lines,Object.assign({w:512,h:128,bg:'rgba(11,18,32,.88)',r:40,size:58},o)); const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, depthWrite:false}));
  const sw=o.sw||2.2; s.scale.set(sw, sw*(o.h||128)/(o.w||512), 1); s.renderOrder=5; return s; }
function retext(spr, lines, o){ const t=spr.material.map; drawText(t.userData.canvas, lines, Object.assign({bg:'rgba(11,18,32,.88)',r:40,size:58},o)); t.needsUpdate=true; }
function imgTex(src,cb){ const i=new Image(); const t=new THREE.Texture(i); t.encoding=THREE.sRGBEncoding; i.onload=()=>{ t.needsUpdate=true; cb&&cb(); }; i.src=src; return t; }

/* ---------- procedural textures ---------- */
function cnv(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return [c,c.getContext('2d')]; }
function speckle(g,w,h,n,amt,sz=2){ for(let i=0;i<n;i++){ g.fillStyle=`rgba(${Math.random()<.5?'255,255,255':'0,0,0'},${Math.random()*amt})`; g.fillRect(Math.random()*w,Math.random()*h,sz,sz); } }
function texOf(c,rep){ const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; t.anisotropy=8; if(rep) t.repeat.set(rep[0],rep[1]); return t; }
function concreteTex(){ const [c,g]=cnv(256,256); g.fillStyle='#A69E91'; g.fillRect(0,0,256,256);
  for(let i=0;i<14;i++){ const r=g.createRadialGradient(Math.random()*256,Math.random()*256,0,Math.random()*256,Math.random()*256,90); r.addColorStop(0,`rgba(${Math.random()<.5?'255,250,240':'90,80,70'},.08)`); r.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=r; g.fillRect(0,0,256,256); }
  speckle(g,256,256,3500,.07); g.strokeStyle='rgba(60,52,44,.28)'; g.lineWidth=2; g.strokeRect(1,1,254,254); g.strokeStyle='rgba(255,255,255,.12)'; g.strokeRect(3,3,250,250); return texOf(c); }
function beltTex(){ const [c,g]=cnv(128,64); g.fillStyle='#232A35'; g.fillRect(0,0,128,64); g.fillStyle='rgba(255,255,255,.04)'; for(let x=0;x<128;x+=8) g.fillRect(x,6,3,52);
  g.strokeStyle='#5B6779'; g.lineWidth=5; g.lineCap='round'; for(let i=0;i<2;i++){ const x=i*64+20; g.beginPath(); g.moveTo(x,16); g.lineTo(x+16,32); g.lineTo(x,48); g.stroke(); }
  g.fillStyle='#F5B70A'; g.fillRect(0,0,128,5); g.fillRect(0,59,128,5); g.fillStyle='#111'; for(let x=0;x<128;x+=16){ g.fillRect(x,0,7,5); g.fillRect(x+8,59,7,5); } return texOf(c); }
function hazardTex(){ const [c,g]=cnv(64,16); g.fillStyle='#F5B70A'; g.fillRect(0,0,64,16); g.fillStyle='#1A1A1A'; for(let x=-16;x<80;x+=16){ g.beginPath(); g.moveTo(x,16); g.lineTo(x+8,16); g.lineTo(x+16,0); g.lineTo(x+8,0); g.fill(); } return texOf(c); }
function roadTex(){ const [c,g]=cnv(256,256); g.fillStyle='#34373D'; g.fillRect(0,0,256,256); speckle(g,256,256,2500,.06); g.fillStyle='#F5C542'; for(let x=0;x<256;x+=64) g.fillRect(x,124,36,6); g.fillStyle='#E2E8F0'; g.fillRect(0,10,256,5); g.fillRect(0,241,256,5); return texOf(c); }
function asphaltTex(){ const [c,g]=cnv(256,256); g.fillStyle='#55575C'; g.fillRect(0,0,256,256); speckle(g,256,256,4000,.08); for(let i=0;i<6;i++){ g.strokeStyle='rgba(20,20,20,.25)'; g.lineWidth=1; g.beginPath(); let x=Math.random()*256,y=Math.random()*256; g.moveTo(x,y); for(let k=0;k<6;k++){ x+=rand(-20,20); y+=rand(-20,20); g.lineTo(x,y); } g.stroke(); } return texOf(c); }
function grassTex(){ const [c,g]=cnv(256,256); g.fillStyle='#6DAA55'; g.fillRect(0,0,256,256); for(let i=0;i<5000;i++){ g.fillStyle=`rgba(${Math.random()<.5?'40,90,30':'160,210,110'},${Math.random()*.25})`; g.fillRect(Math.random()*256,Math.random()*256,2,3); } return texOf(c); }
function wallTex(){ const [c,g]=cnv(256,256); g.fillStyle='#EDE6D8'; g.fillRect(0,0,256,256); for(let x=0;x<256;x+=16){ const gr=g.createLinearGradient(x,0,x+16,0); gr.addColorStop(0,'rgba(0,0,0,.10)'); gr.addColorStop(.5,'rgba(255,255,255,.12)'); gr.addColorStop(1,'rgba(0,0,0,.10)'); g.fillStyle=gr; g.fillRect(x,0,16,256); } speckle(g,256,256,900,.05); return texOf(c); }
function crateTex(){ const [c,g]=cnv(64,64); g.fillStyle='#C9965E'; g.fillRect(0,0,64,64); speckle(g,64,64,300,.08); g.fillStyle='rgba(120,80,40,.35)'; g.fillRect(28,0,8,64); g.fillStyle='#00C853'; g.beginPath(); g.arc(18,46,7,0,7); g.fill(); g.fillStyle='rgba(90,60,30,.5)'; g.fillRect(0,0,64,2); g.fillRect(0,62,64,2); return texOf(c); }
function skyTex(){ const [c,g]=cnv(16,256); const gr=g.createLinearGradient(0,0,0,256); gr.addColorStop(0,'#3E86D8'); gr.addColorStop(.45,'#8EC5F0'); gr.addColorStop(.62,'#DCEFFB'); gr.addColorStop(1,'#F3EBDD'); g.fillStyle=gr; g.fillRect(0,0,16,256); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t; }
function rayTex(){ const [c,g]=cnv(64,256); const gr=g.createLinearGradient(0,0,0,256); gr.addColorStop(0,'rgba(255,240,210,.9)'); gr.addColorStop(1,'rgba(255,240,210,0)'); g.fillStyle=gr; g.fillRect(0,0,64,256);
  const h=g.createLinearGradient(0,0,64,0); h.addColorStop(0,'rgba(0,0,0,1)'); h.addColorStop(.3,'rgba(0,0,0,0)'); h.addColorStop(.7,'rgba(0,0,0,0)'); h.addColorStop(1,'rgba(0,0,0,1)'); g.globalCompositeOperation='destination-out'; g.fillStyle=h; g.fillRect(0,0,64,256); return new THREE.CanvasTexture(c); }
function posterTex(lines,bg,fg){ return textTex(lines,{w:256,h:340,bg,color:fg,size:40,r:8}); }

/* ---------- environment (outside world) ---------- */
function buildEnvironment(){
  const sky=new THREE.Mesh(new THREE.SphereGeometry(320,24,16), new THREE.MeshBasicMaterial({map:skyTex(), side:THREE.BackSide, fog:false, depthWrite:false})); sky.renderOrder=-1; scene.add(sky); W.sky=sky;
  scene.fog=new THREE.Fog('#DCEBF5', 110, 260);
  const S=new Static();
  const gt=grassTex(); gt.repeat.set(60,60); const ground=new THREE.Mesh(new THREE.PlaneGeometry(600,600), new THREE.MeshStandardMaterial({map:gt, roughness:1})); ground.rotation.x=-Math.PI/2; ground.position.y=-.02; ground.receiveShadow=true; scene.add(ground);
  const at=asphaltTex(); at.repeat.set(10,7); const yard=new THREE.Mesh(new THREE.PlaneGeometry(COLS*CELL+44, ROWS*CELL+30), new THREE.MeshStandardMaterial({map:at, roughness:.95})); yard.rotation.x=-Math.PI/2; yard.position.set(0,.004,2); yard.receiveShadow=true; scene.add(yard);
  /* road along the north + sidewalk */
  const rt=roadTex(); rt.repeat.set(30,1); const rd=new THREE.Mesh(new THREE.PlaneGeometry(400,9), new THREE.MeshStandardMaterial({map:rt, roughness:.9})); rd.rotation.x=-Math.PI/2; rd.position.set(0,.012,OZ-15.5); rd.receiveShadow=true; scene.add(rd);
  const walk=mat('#C9C3B8',{roughness:.95}); S.box(400,.12,2.2,0,0,OZ-10.2,walk); S.box(400,.12,2.2,0,0,OZ-20.9,walk);
  /* painted parking bays south of the factory */
  const paint=mat('#F1F5F9',{roughness:.8}); for(let x=-14;x<=14;x+=3.2) S.box(.14,.02,5,x,0,-OZ+9.5,paint);
  const carCols=['#EF4444','#3B82F6','#F8FAFC','#10B981','#F59E0B','#64748B','#A855F7'];
  const carMats=carCols.map(c=>mat(c,{roughness:.35,metalness:.35})), glass=mat('#1E293B',{roughness:.1,metalness:.6}), tire=mat('#141519',{roughness:.9});
  const car=(S,x,z,ry,m)=>{ const c=Math.cos(ry), s=Math.sin(ry), P=(lx,lz)=>[x+lx*c+lz*s, z-lx*s+lz*c];
    let [a,b]=P(0,0); S.box(3.6,.7,1.7,a,.3,b,m,ry); S.box(2,.6,1.5,a-.2*c,1,b+.2*s,glass,ry); S.box(1.96,.12,1.56,a-.2*c,1.6,b+.2*s,m,ry);
    [[1.1,.8],[1.1,-.8],[-1.1,.8],[-1.1,-.8]].forEach(([lx,lz])=>{ const [px,pz]=P(lx,lz); Math.abs(s)>.5?S.cyl(.34,.26,px,.34-.13,pz,tire,CYL8,0,Math.PI/2):S.cyl(.34,.26,px,.34-.13,pz,tire,CYL8,Math.PI/2); }); };
  [-12.8,-9.6,-3.2,3.2,6.4,12.8].forEach((x,i)=>car(S,x,-OZ+9.5,Math.PI/2,carMats[i%carMats.length]));
  /* neighbours */
  const fac=['#E2E8F0','#FDE68A','#A7F3D0','#C7D2FE','#FBCFE8','#FED7AA'], roofM=mat('#475569'), winM=mat('#BFDBFE',{roughness:.15,metalness:.4,emissive:'#93C5FD',emissiveIntensity:.15});
  [[-30,OZ-30,16,9,7],[-52,OZ-29,12,10,11],[46,OZ-30,14,9,9],[66,OZ-28,10,8,14],[-58,12,10,14,7],[56,10,10,16,6],[-36,30,14,10,8],[38,32,16,10,6]].forEach(([x,z,w,d,h],i)=>{
    S.box(w,h,d,x,0,z,mat(fac[i%fac.length],{roughness:.85})); S.box(w+.4,.4,d+.4,x,h,z,roofM);
    for(let k=0;k<Math.floor(w/3);k++) for(let f=0;f<Math.floor(h/3);f++) S.box(1.4,1.1,.06,x-w/2+1.6+k*3,1.4+f*3,z+d/2+.02,winM); });
  /* rival: ScrapCo across the road */
  const sc=new THREE.Group(); sc.position.set(18,0,OZ-30); scene.add(sc); W.scrapco=sc; const S2=new Static();
  const rust=mat('#9A3412',{roughness:.95, metalness:.2}), rust2=mat('#7C2D12',{roughness:1});
  S2.box(20,7,9,0,0,0,rust); S2.box(20.4,.5,9.4,0,7,0,rust2); for(let x=-9;x<=9;x+=2.2) S2.box(.25,7,.2,x,0,4.55,rust2);
  S2.cyl(.9,13,6,0,-2,mat('#57534E',{roughness:1})); S2.box(5,3.6,.2,-4,0,4.6,mat('#292524')); S2.build(sc);
  sign(sc,[{t:'SCRAPCO',color:'#FCA5A5'},{t:'cheap bots, cheaper parts',size:30,weight:600,color:'#FDBA74'}],9,2,0,5.2,4.62,{bg:'#1C1917',size:84});
  const smokeM=new THREE.MeshStandardMaterial({color:'#78716C',transparent:true,opacity:.5,roughness:1,depthWrite:false});
  for(let i=0;i<5;i++){ const s=new THREE.Mesh(SPH,smokeM.clone()); sc.add(s); const ph=i/5;
    W.anim.push(t=>{ const k=(t*.18+ph)%1; s.position.set(6+k*3,13.5+k*7,-2); s.scale.setScalar(.9+k*2.2); s.material.opacity=.5*(1-k); }); }
  /* trees (merged) */
  const leaf=mat('#3E8E4A',{roughness:.9}), leaf2=mat('#5BA552',{roughness:.9}), trunk=mat('#7C4A2D'), ico=new THREE.IcosahedronGeometry(1.3,1), cone=new THREE.ConeGeometry(1.2,2.8,8);
  const tree=(x,z,s=1)=>{ if(Math.random()>qs().trees) return; S.cyl(.18*s,1.5*s,x,0,z,trunk); if(Math.random()<.35) S.geo(cone,x,1.5*s+1.3*s,z,leaf,s,s,s); else { S.geo(ico,x,2.4*s,z,Math.random()<.5?leaf:leaf2,s,s*.95,s); S.geo(ico,x+.5*s,2.0*s,z+.3*s,leaf2,s*.6,s*.6,s*.6); } };
  for(let x=-44;x<=44;x+=5.5) tree(x+rand(-1,1), -OZ+16+rand(0,4), rand(.9,1.3));
  for(let z=-12;z<=18;z+=5) { tree(OX-30+rand(-2,2),z,rand(.9,1.3)); tree(-OX+24+rand(-2,2),z+2,rand(.9,1.3)); }
  for(let x=-60;x<=60;x+=7) if(Math.abs(x)>12) tree(x+rand(-1,1), OZ-24+rand(-1,1), rand(.8,1.1));
  /* fence along the yard */
  const fenceM=mat('#94A3B8',{metalness:.6,roughness:.4}); const fx0=-(COLS*CELL+44)/2, fx1=-fx0, fz1=-OZ+17;
  for(let x=fx0;x<=fx1;x+=2.5) S.box(.08,1.4,.08,x,0,fz1,fenceM); S.box(fx1-fx0,.06,.06,0,1.35,fz1,fenceM); S.box(fx1-fx0,.06,.06,0,.7,fz1,fenceM);
  /* street lamps */
  const pole=mat('#64748B',{metalness:.6}), head=mat('#334155'); for(let x=-48;x<=48;x+=16){ S.cyl(.09,5,x,0,OZ-10.6,pole); S.box(1,.15,.3,x+.4,5,OZ-10.6,head); }
  S.build(scene);
  /* traffic */
  for(let i=0;i<4;i++){ const g=new THREE.Group(), S3=new Static(); car(S3,0,0,0,carMats[(i*2+1)%carMats.length]); S3.build(g); g.add(blob(4.2,.8)); scene.add(g); W.cars.push({g, x:rand(-120,120), lane:i%2, v:rand(7,11)}); }
}
function stepCars(dt){ for(const c of W.cars){ c.x+=(c.lane?-1:1)*c.v*dt; if(c.x>130) c.x=-130; if(c.x<-130) c.x=130; c.g.position.set(c.x,0,OZ-15.5+(c.lane?-2.1:2.1)); c.g.rotation.y=c.lane?Math.PI:0; } }

/* ---------- factory shell (rebuilt when you expand) ---------- */
const SH={}; const M=1.6, WH=4.8;
function shellMats(){ if(SH.wall) return;
  SH.wallTex=wallTex(); SH.wall=new THREE.MeshStandardMaterial({map:SH.wallTex, roughness:.85});
  SH.trim=mat('#0B1220',{roughness:.5}); SH.green=mat('#00C853',{roughness:.45}); SH.hazard=new THREE.MeshStandardMaterial({map:hazardTex(), roughness:.6});
  SH.floorTex=concreteTex(); SH.steel=mat('#475569',{metalness:.55,roughness:.45}); SH.beam=mat('#334155',{metalness:.5,roughness:.5});
  SH.glass=new THREE.MeshStandardMaterial({color:'#A9D4F5', roughness:.08, metalness:.5, emissive:'#FFE4B5', emissiveIntensity:.05}); W.glassMats.push(SH.glass);
  SH.lampShade=mat('#14532D',{roughness:.5,metalness:.3}); SH.bulb=new THREE.MeshStandardMaterial({color:'#FFF7E0', emissive:'#FFD58A', emissiveIntensity:1.2}); W.lampMats.push(SH.bulb);
  SH.pool=new THREE.MeshBasicMaterial({map:radialTex([[0,'rgba(255,214,150,.55)'],[.5,'rgba(255,200,120,.18)'],[1,'rgba(255,200,120,0)']],128), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:.5});
  SH.ray=new THREE.MeshBasicMaterial({map:rayTex(), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:.07, side:THREE.DoubleSide, fog:false});
  SH.wood=mat('#B7834C',{roughness:.85}); SH.crate=new THREE.MeshStandardMaterial({map:crateTex(), roughness:.85}); SH.shelf=mat('#2563EB',{roughness:.5,metalness:.3}); SH.sheet=mat('#CBD5E1',{metalness:.8,roughness:.3});
  SH.red=mat('#DC2626',{roughness:.4}); SH.barrel=mat('#0EA5E9',{roughness:.45,metalness:.2}); SH.white=mat('#F8FAFC',{roughness:.5}); SH.lineMat=mat('#F5C542',{roughness:.6}); SH.door=mat('#94A3B8',{metalness:.5,roughness:.4});
}
function buildShell(){ shellMats(); const b=G.bounds, expanded=G.expanded, dk=docks();
  if(W.shell){ scene.remove(W.shell); W.shell.traverse(o=>{ if(o.isMesh&&o.geometry!==BOX&&o.geometry!==CYL&&o.geometry!==PLANE) o.geometry.dispose(); }); }
  if(W.fork) dropRig(W.fork.drv);
  const g=new THREE.Group(); W.shell=g; scene.add(g); W.walls=[]; W.rays=[];
  const x0=OX+b.c0*CELL, x1=OX+(b.c1+1)*CELL, z0=OZ+b.r0*CELL, z1=OZ+(b.r1+1)*CELL;
  const X0=x0-M, X1=x1+M, Z0=z0-M, Z1=z1+M, cxm=(X0+X1)/2, czm=(Z0+Z1)/2, S=new Static();
  /* floor: buildable grid + walkway margin */
  const ft=SH.floorTex.clone(); ft.needsUpdate=true; ft.repeat.set((X1-X0)/CELL,(Z1-Z0)/CELL); ft.offset.set(-M/CELL,-M/CELL);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(X1-X0,Z1-Z0), new THREE.MeshStandardMaterial({map:ft, roughness:.55, metalness:.05, envMapIntensity:.8})); fl.rotation.x=-Math.PI/2; fl.position.set(cxm,.02,czm); fl.receiveShadow=true; g.add(fl);
  S.box(X1-X0+.8,.2,Z1-Z0+.8,cxm,-.18,czm,SH.steel);
  /* painted walkway lines around the build area */
  const ln=(x,z,w,d)=>S.box(w,.012,d,x,.022,z,SH.lineMat);
  ln((x0+x1)/2,z0-.12,x1-x0+.24,.1); ln((x0+x1)/2,z1+.12,x1-x0+.24,.1); ln(x0-.12,(z0+z1)/2,.1,z1-z0+.24); ln(x1+.12,(z0+z1)/2,.1,z1-z0+.24);
  for(let x=x0+1;x<x1;x+=2.2) S.box(.9,.012,.1,x,.022,Z1-.55,SH.white);
  /* walls: four groups so the ones facing the camera can drop away (cutaway view) */
  const gapsW=dk.filter(d=>d.c===b.c0).map(d=>cellZ(d.r)), gapsE=dk.filter(d=>d.c===b.c1).map(d=>cellZ(d.r));
  const side=(name,alongX,fixed,a0,a1,gaps,out)=>{ const wg=new THREE.Group(); g.add(wg); const T=.3, Sw=new Static(); const cut=[...gaps].sort((p,q)=>p-q).map(u=>[u-1.25,u+1.25]);
    const segs=[]; let s=a0; cut.forEach(([u0,u1])=>{ segs.push([s,u0]); s=u1; }); segs.push([s,a1]);
    const put=(L,m,y,h,th,mat,off=0)=>alongX?Sw.box(L,h,th,m,y,fixed+off,mat):Sw.box(th,h,L,fixed+off,y,m,mat);
    segs.forEach(([u0,u1])=>{ const L=u1-u0; if(L<.05) return; const m=(u0+u1)/2;
      put(L,m,0,2.3,T,SH.wall); put(L,m,2.3,.22,T+.06,SH.green); put(L,m,3.9,WH-3.9,T,SH.wall); put(L,m,WH,.18,T+.1,SH.trim); put(L,m,0,.35,T+.04,SH.trim);
      const nWin=Math.max(1,Math.round(L/2.6)); for(let k=0;k<nWin;k++){ const wm=u0+(k+.5)*L/nWin, ww=L/nWin-.35; put(ww,wm,2.52,1.38,T*.5,SH.glass); put(.14,wm-ww/2-.07,2.52,1.38,T+.04,SH.trim); }
      put(.14,u1-.07,2.52,1.38,T+.04,SH.trim); });
    /* dock doors */
    cut.forEach(([u0,u1])=>{ const m=(u0+u1)/2; put(2.5,m,3.0,WH-3.0,T,SH.wall); put(2.5,m,2.8,.3,T+.1,SH.hazard); put(.2,u0+.1,0,3.1,T+.12,SH.hazard); put(.2,u1-.1,0,3.1,T+.12,SH.hazard); put(2.3,m,2.55,.28,T*.6,SH.door); });
    for(let u=a0+4;u<a1-1;u+=4){ if(cut.some(([u0,u1])=>u>u0-.3&&u<u1+.3)) continue; put(.32,u,0,WH,T+.16,SH.beam); }
    Sw.build(wg); wg.userData={name, out, alongX, fixed, k:1}; W.walls.push(wg); return wg; };
  side('N',true,Z0,X0,X1,[],[0,-1]); side('S',true,Z1,X0,X1,[],[0,1]); side('W',false,X0,Z0,Z1,gapsW,[-1,0]); side('E',false,X1,Z0,Z1,gapsE,[1,0]);
  [[X0,Z0],[X1,Z0],[X0,Z1],[X1,Z1]].forEach(([x,z])=>S.box(.6,WH+.3,.6,x,0,z,SH.trim));
  /* signage on the inside of the north wall */
  const sg=new THREE.Group(); sg.position.set(cxm,0,Z0+.2); g.add(sg); W.walls[0].add(sg);
  sign(sg,[{t:expanded?'MINIBOT WORKS':'MINIBOT GARAGE',color:'#00E676'},{t:'a MoneyBot company',size:34,weight:700,color:'#FBBF24'}],7,1.5,0,4.3,.02,{bg:'#0B1220',glow:.6,w:1024,h:220,size:100,r:24});
  const logo=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.3), new THREE.MeshBasicMaterial({map:imgTex(MB_ASSETS.logo), transparent:true})); logo.position.set(-4.3,4.3,.03); sg.add(logo);
  const posters=[[['QUALITY','is everyone\'s','JOB'],'#00C853','#052E16'],[['CUT COSTS','not','CORNERS'],'#FBBF24','#3A2400'],[['DAYS','without an','ACCIDENT: 12'],'#F8FAFC','#0B1220']];
  posters.forEach(([L,bg,fg],i)=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(.9,1.2), new THREE.MeshStandardMaterial({map:posterTex(L.map((t,j)=>({t,size:j===1?30:46})),bg,fg),roughness:.7})); p.position.set(5.6+i*1.2,1.45,.03); sg.add(p); });
  /* wall lamps (no roof clutter in the way of the camera) + warm light pools on the floor */
  const TY=WH+.15, poolG=[];
  for(let x=X0+3;x<X1-2;x+=6){ S.box(.5,.16,.5,x,3.95,Z0+.4,SH.lampShade); S.box(.36,.06,.36,x,3.9,Z0+.4,SH.bulb); }
  for(let z=Z0+3;z<Z1-2;z+=6){ S.box(.5,.16,.5,X0+.4,3.95,z,SH.lampShade); S.box(.36,.06,.36,X0+.4,3.9,z,SH.bulb); }
  for(let x=X0+4;x<X1-2;x+=7) for(let z=Z0+3.5;z<Z1-2;z+=7) poolG.push([x,z]);
  const pg=new Static(); poolG.forEach(([x,z])=>pg.geo(PLANE,x,.03,z,SH.pool,7,1,7)); const pm=pg.build(g,false,false); pm.forEach(m=>m.renderOrder=2); W.pools=pm[0];
  /* skylight god-rays */
  if(qs().rays){ const rg=new THREE.PlaneGeometry(2.2,8); for(let x=X0+6;x<X1-3;x+=10){ const r=new THREE.Mesh(rg,SH.ray); r.position.set(x+1.2,3.4,Z0+2.5); r.rotation.set(0,.5,.32); r.renderOrder=3; g.add(r); W.rays.push(r); const r2=r.clone(); r2.position.x+=1.4; r2.position.z+=2; r2.scale.x=.6; g.add(r2); W.rays.push(r2); } }
  /* props in the walkway margin */
  const noProp=(z)=>dk.some(d=>Math.abs(cellZ(d.r)-z)<2.2);
  const shelf=(x,z,alongX)=>{ const w=alongX?2.2:.7, d=alongX?.7:2.2; [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,c])=>S.box(.07,2.4,.07,x+a*(w/2-.04),0,z+c*(d/2-.04),SH.shelf)); for(let y of [.15,1,1.85]){ S.box(w,.05,d,x,y,z,SH.steel); if(Math.random()<.85) S.box(w*.4,.4,d*.8,x-w*.22,y+.05,z,SH.crate); if(Math.random()<.7) S.box(w*.35,.32,d*.7,x+w*.25,y+.05,z,SH.crate); } };
  for(let x=x0+1.6;x<x1-1;x+=3.2) shelf(x,Z0+.62,true);
  const pallet=(x,z,steel)=>{ S.box(1.1,.14,1.1,x,0,z,SH.wood); if(steel) for(let i=0;i<6;i++) S.box(1,.05,.85,x,.14+i*.055,z,SH.sheet); else { S.box(.5,.45,.5,x-.25,.14,z-.25,SH.crate); S.box(.5,.45,.5,x+.27,.14,z-.22,SH.crate); S.box(.5,.45,.5,x,.14,z+.27,SH.crate); S.box(.5,.45,.5,x,.6,z,SH.crate); } };
  for(let z=z0+1;z<z1;z+=2.4){ if(!noProp(z)) pallet(X0+.8,z,Math.random()<.5); if(!noProp(z)&&Math.random()<.6) pallet(X1-.8,z,false); }
  for(let x=x0+2;x<x1-2;x+=5.5){ S.cyl(.32,.95,x,0,Z1-.7,SH.barrel); S.cyl(.32,.95,x+.7,0,Z1-.75,SH.barrel); S.cyl(.12,.55,x+1.6,0,Z1-.5,SH.red); }
  S.build(g);
  /* forklift on the walkway */
  W.fork=makeForklift(); g.add(W.fork.g); W.fork.path=[[X0+.8,Z1-.8],[X1-.8,Z1-.8]]; W.fork.u=Math.random();
  /* the empty lot you can expand into */
  if(!expanded){ const lot=new THREE.Group(); g.add(lot); const xa=X1+.4, xb=OX+COLS*CELL+M, za=OZ-M, zb=OZ+ROWS*CELL+M, L=new Static();
    for(let x=xa;x<xb;x+=1.6) L.box(.8,.03,.14,x+.4,.02,zb,SH.lineMat); for(let z=za;z<zb;z+=1.6) L.box(.14,.03,.8,xb,.02,z+.4,SH.lineMat); for(let x=X0;x<xa;x+=1.6) L.box(.8,.03,.14,x+.4,.02,zb,SH.lineMat);
    L.cyl(.08,2.6,(xa+xb)/2-1.4,0,(za+zb)/2+3,SH.door); L.cyl(.08,2.6,(xa+xb)/2+1.4,0,(za+zb)/2+3,SH.door); L.build(lot);
    const ps=new THREE.Group(); ps.position.set((xa+xb)/2,0,(za+zb)/2+3); lot.add(ps);
    sign(ps,[{t:'BIG FLOOR',color:'#0B1220'},{t:'Ship 60 bots to unlock',size:38,weight:700,color:'#475569'}],3.4,1.3,0,2.4,.06,{bg:'#FBBF24',w:640,h:240,size:86,r:20}); W.lotSign=ps; }
  else W.lotSign=null;
  W.bounds={X0,X1,Z0,Z1};
  applyQuality(true);
}
function updateWalls(dt){ const cx=camera.position.x, cz=camera.position.z, B=W.bounds; if(!B) return;
  for(const w of W.walls){ const u=w.userData; const outside=u.name==='N'?cz<B.Z0+2:u.name==='S'?cz>B.Z1-2:u.name==='W'?cx<B.X0+2:cx>B.X1-2;
    const goal=G.mode==='title'?(u.name==='S'||u.name==='E'?.42:1):outside?.08:1; u.k+=(goal-u.k)*Math.min(1,dt*6); w.scale.y=Math.max(.02,u.k); w.position.y=0; } }

/* ---------- forklift ---------- */
function makeForklift(){ const g=new THREE.Group(), S=new Static(); const y=mat('#F5B70A',{roughness:.4,metalness:.2}), dk=mat('#1F2937',{roughness:.6}), tire=mat('#111318',{roughness:.9});
  S.box(1.5,.6,.95,0,.2,0,y); S.box(.7,.5,.85,-.35,.8,0,y); S.box(.06,1.1,.06,.15,.8,.42,dk); S.box(.06,1.1,.06,.15,.8,-.42,dk); S.box(.9,.06,.9,-.1,1.9,0,dk);
  S.box(.08,1.9,.1,.85,0,.3,dk); S.box(.08,1.9,.1,.85,0,-.3,dk); S.box(.9,.05,.12,1.3,.12,.25,dk); S.box(.9,.05,.12,1.3,.12,-.25,dk);
  [[.45,.48],[.45,-.48],[-.5,.48],[-.5,-.48]].forEach(([x,z])=>S.cyl(.26,.2,x,.26-.1,z,tire,CYL8,Math.PI/2));
  S.box(.9,.12,.9,1.3,.17,0,SH.wood||mat('#B7834C')); S.box(.75,.5,.75,1.3,.29,0,SH.crate||mat('#C9965E')); S.build(g); g.add(blob(2.4,.9));
  const drv=makeRig(GLTF.crowd, MB.bodies['#FDE68A'], .8, 'g'); drv.root.position.set(-.35,.75,0); drv.root.rotation.y=Math.PI/2; g.add(drv.root);
  return {g, drv}; }
function stepForklift(dt){ const F=W.fork; if(!F) return; const [a,b]=F.path, L=Math.abs(b[0]-a[0]); F.u=(F.u+dt*2.2/(L*2))%1; const k=F.u<.5?F.u*2:2-F.u*2, ease=k*k*(3-2*k);
  F.g.position.set(lerp(a[0],b[0],ease),0,a[1]); F.g.rotation.y=F.u<.5?0:Math.PI; }

/* ---------- docks ---------- */
function makeSupplyDock(){ const g=new THREE.Group(), S=new Static(); S.box(1.9,.32,1.9,0,0,0,SH.steel); for(let i=0;i<5;i++) S.box(.36,.035,1.9,-.76+i*.38,.32,0,SH.hazard);
  S.box(1.25,.12,1.25,-.2,.36,0,SH.wood); S.build(g); g.add(blob(2.6,.8));
  const st=new THREE.Mesh(BOX,SH.sheet); st.castShadow=true; st.scale.set(1.05,.1,1.05); st.position.set(-.2,.5,0); g.add(st);
  const lab=sprite([{t:'STEEL IN',size:44,color:'#93C5FD'},{t:'30 sheets',size:40}],{w:512,h:176,sw:2.4}); lab.position.set(0,2.5,0); g.add(lab);
  g.userData={stack:st, label:lab}; return g; }
function makeShipDock(){ const g=new THREE.Group(), S=new Static(); S.box(1.9,.32,1.9,0,0,0,SH.steel); for(let i=0;i<5;i++) S.box(.36,.035,1.9,-.76+i*.38,.32,0,SH.green);
  S.box(1.3,.12,1.3,.15,.36,0,SH.wood); S.build(g); g.add(blob(2.6,.8));
  const st=new THREE.Mesh(BOX,SH.crate); st.castShadow=true; st.scale.set(1.15,.01,1.15); st.position.set(.15,.48,0); g.add(st);
  const lab=sprite([{t:'SHIPPING',size:44,color:'#86EFAC'},{t:'0 ready',size:40}],{w:512,h:176,sw:2.4}); lab.position.set(0,2.5,0); g.add(lab);
  g.userData={stack:st, label:lab}; return g; }

/* ---------- machines ---------- */
const MM={};
function machineMats(){ shellMats(); MM.dark=mat('#1E293B',{roughness:.55, metalness:.3}); MM.steel=mat('#CBD5E1',{metalness:.85, roughness:.25}); MM.bed=mat('#111827',{roughness:.6});
  MM.glass=new THREE.MeshStandardMaterial({color:'#A7F3D0', transparent:true, opacity:.3, roughness:.05, metalness:.4, depthWrite:false}); MM.yellow=mat('#FACC15',{roughness:.45, metalness:.3});
  MM.ring=new THREE.MeshBasicMaterial({color:'#EF4444', transparent:true, opacity:.75, depthWrite:false}); MM.hazard=new THREE.MeshStandardMaterial({map:hazardTex(), roughness:.6});
  MM.screen=new THREE.MeshStandardMaterial({color:'#0B1220', emissive:'#22D3EE', emissiveIntensity:.7, roughness:.3}); MM.pipe=mat('#64748B',{metalness:.7,roughness:.35});
  MM.paint=mat('#16A34A',{roughness:.35}); MM.card=mat('#C9965E',{roughness:.85}); MM.redbin=mat('#7F1D1D',{roughness:.7});
  MM.alerts={bottleneck:textTex([{t:'BOTTLENECK',size:62}],{bg:'#DC2626',r:40}), broken:textTex([{t:'TAP TO FIX!',size:62}],{bg:'#EA580C',r:40}), nocrew:textTex([{t:'NO WORKER',size:58}],{bg:'#475569',r:40})};
  MM.acc={}; Object.keys(MACH).forEach(k=>MM.acc[k]=mat(MACH[k].color,{roughness:.38, metalness:.25})); }
function machineMesh(type){
  const d=MACH[type], g=new THREE.Group(), acc=MM.acc[type], P={}, S=new Static();
  g.add(blob(3.2,.9));
  S.box(1.86,.26,1.76,0,0,0,MM.dark); S.box(1.9,.06,1.8,0,.2,0,MM.hazard); S.box(1.98,.1,1.05,0,.3,0,MM.bed);
  if(type==='stamper'){ [-.72,.72].forEach(z=>{ S.box(.34,2.1,.34,0,.3,z,acc); S.box(.4,.1,.4,0,.3,z,MM.dark); }); S.box(.8,.45,1.9,0,2.3,0,acc); S.box(.86,.08,.9,0,.4,0,MM.steel);
    S.cyl(.16,.5,0,2.75,0,MM.pipe); S.box(.3,.5,.4,.75,.3,-.82,MM.dark); S.box(.04,.26,.3,.92,.5,-.82,MM.screen);
    const head=new THREE.Group(); head.position.y=1.55; g.add(head); const hs=new Static(); hs.box(.66,.5,1.0,0,0,0,MM.steel); hs.cyl(.12,.8,0,.5,0,MM.dark); hs.box(.7,.06,1.04,0,0,0,MM.dark); hs.build(head); P.head=head; }
  if(type==='assembler'){ S.box(1.6,1.0,.42,0,.3,-.7,acc); S.box(1.6,.1,.5,0,1.3,-.7,MM.dark); S.box(.5,.32,.3,.55,1.4,-.7,MM.redbin); S.box(.36,.06,.2,-.4,1.02,-.48,MM.screen);
    S.cyl(.06,1.1,-.85,.3,.75,MM.pipe); S.box(.04,.04,1.4,-.85,1.4,.05,MM.pipe);
    const mkArm=(x,s)=>{ const arm=new THREE.Group(); arm.position.set(x,1.4,-.62); arm.scale.setScalar(s); g.add(arm); const as=new Static(); as.cyl(.2,.25,0,0,0,MM.dark); as.build(arm);
      const up=new THREE.Group(); up.position.y=.25; arm.add(up); const us=new Static(); us.box(.17,.75,.17,0,0,0,acc); us.cyl(.1,.2,0,.72,0,MM.dark,CYL8,0,Math.PI/2); us.build(up);
      const fw=new THREE.Group(); fw.position.y=.78; up.add(fw); const fs=new Static(); fs.box(.15,.15,.72,0,-.08,.34,MM.steel); fs.box(.22,.22,.12,0,-.2,.72,MM.dark); fs.box(.05,.14,.05,0,-.36,.76,MM.yellow); fs.build(fw); return {arm,up,fw}; };
    const a1=mkArm(-.15,1), a2=mkArm(.55,.72); P.arm=a1.arm; P.up=a1.up; P.arm2=a2.arm; P.tip=new THREE.Vector3(0,-.36,.76); P.fw=a1.fw; }
  if(type==='painter'){ [[-.82,-.77],[.82,-.77],[-.82,.77],[.82,.77]].forEach(([x,z])=>S.box(.14,1.75,.14,x,.3,z,MM.dark)); S.box(1.84,.24,1.74,0,2.0,0,acc); S.box(1.4,.18,1.3,0,2.24,0,MM.dark);
    S.cyl(.18,.7,-.6,2.42,-.4,MM.paint); S.cyl(.2,.34,.6,2.42,.3,MM.pipe); S.cyl(.24,.55,.95,0,-.72,MM.paint); S.cyl(.24,.55,.95,0,-.15,MM.paint);
    [-.79,.79].forEach(z=>S.box(1.5,1.42,.04,0,.36,z,MM.glass));
    const nz=new THREE.Group(); nz.position.set(0,1.75,0); g.add(nz); cy(nz,.08,.35,0,-.35,0,MM.steel); P.nozzle=nz;
    const mist=new THREE.Mesh(new THREE.ConeGeometry(.45,.9,14,1,true), new THREE.MeshBasicMaterial({color:'#4ADE80', transparent:true, opacity:0, depthWrite:false})); mist.position.set(0,.98,0); g.add(mist); P.mist=mist; }
  if(type==='qa'){ [-.72,.72].forEach(z=>S.box(.26,1.7,.26,0,.3,z,acc)); S.box(.42,.32,1.72,0,1.95,0,acc); S.box(.6,.45,.35,.3,0,-1.05,MM.redbin); S.box(.3,.4,.06,-.6,1.2,-.76,MM.dark); S.box(.26,.24,.02,-.6,1.32,-.72,MM.screen);
    const scan=new THREE.Mesh(BOX,new THREE.MeshBasicMaterial({color:'#E9D5FF'})); scan.scale.set(.06,.04,1.2); scan.position.set(0,1.85,0); g.add(scan); P.scan=scan;
    const beam=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.4), new THREE.MeshBasicMaterial({color:'#C084FC', transparent:true, opacity:.2, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending})); beam.rotation.y=Math.PI/2; beam.position.set(0,1.17,0); g.add(beam); P.beam=beam; }
  if(type==='packer'){ S.box(1.25,1.15,.5,0,.3,-.66,acc); S.box(.9,.7,.7,-.45,1.45,0,MM.dark); for(let i=0;i<3;i++) S.box(.44,.36,.44,.1,1.45+i*.37,-.66,MM.card);
    S.cyl(.14,.12,-.75,1.25,.6,MM.yellow,CYL8,Math.PI/2); const fl=new THREE.Group(); fl.position.set(.5,1.15,0); g.add(fl); bx(fl,.5,.05,.9,.25,0,0,MM.yellow); P.flap=fl; }
  if(type==='chip'){ S.box(1.4,1.25,.5,0,.3,-.66,acc); S.box(1.0,.62,.04,0,.85,-.39,MM.screen); S.cyl(.05,.5,.75,.3,.75,MM.pipe);
    const leds=new THREE.MeshStandardMaterial({color:'#FDF2F8', emissive:'#F472B6', emissiveIntensity:1}); P.leds=leds; for(let i=0;i<4;i++) S.box(.12,.12,.05,-.36+i*.24,1.35,-.38,leds);
    const hd=new THREE.Group(); hd.position.set(0,1.7,0); g.add(hd); bx(hd,.5,.3,.5,0,0,0,MM.steel); cy(hd,.05,.4,0,-.35,0,MM.dark); P.head=hd; }
  /* stack light */
  S.cyl(.04,1.2,.82,.3,.74,MM.dark); S.cyl(.1,.06,.82,1.5,.74,MM.dark);
  P.lightMat=new THREE.MeshStandardMaterial({color:'#22C55E',emissive:'#22C55E',emissiveIntensity:1.4,roughness:.3}); const lt=new THREE.Mesh(CYL,P.lightMat); lt.scale.set(.1,.22,.1); lt.position.set(.82,1.67,.74); g.add(lt);
  S.cyl(.1,.05,.82,1.78,.74,MM.dark);
  S.build(g);
  /* robot arm (automation), hidden until you automate */
  const rb=new THREE.Group(); rb.position.set(-.55,.3,.62); rb.visible=false; g.add(rb); cy(rb,.22,.25,0,0,0,MM.yellow); const r1=new THREE.Group(); r1.position.y=.25; rb.add(r1); bx(r1,.16,.9,.16,0,0,0,MM.yellow); const r2=new THREE.Group(); r2.position.y=.9; r1.add(r2); bx(r2,.14,.14,.7,0,-.07,-.32,MM.yellow); bx(r2,.22,.2,.1,0,-.17,-.66,MM.dark); P.robot=rb; P.r1=r1; P.r2=r2;
  /* bottleneck ring */
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.15,1.42,40), MM.ring); ring.rotation.x=-Math.PI/2; ring.position.y=.05; ring.visible=false; g.add(ring); P.ring=ring;
  g.traverse(o=>{ if(o.isMesh&&!o.material.transparent) o.castShadow=true; });
  return {g, P};
}
function machineLabel(type){ const d=MACH[type]; const s=sprite([{t:d.name,size:52}],{sw:1.9,bg:'rgba(11,18,32,.82)'}); s.visible=false; return s; }
function alertSprite(){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:MM.alerts.bottleneck, transparent:true, depthWrite:false, depthTest:false})); s.scale.set(2.1,.52,1); s.renderOrder=9; s.visible=false; return s; }

/* ---------- splitter ---------- */
function splitMesh(){ const g=new THREE.Group(), S=new Static(); const acc=mat('#06B6D4',{roughness:.4,metalness:.3});
  S.box(1.9,.36,1.9,0,0,0,MM.dark); S.box(1.94,.06,1.94,0,.36,0,MM.hazard); S.box(1.4,.04,1.4,0,.42,0,acc); S.cyl(.5,.12,0,.42,0,MM.bed);
  [[0,0],[1,-Math.PI/2],[3,Math.PI/2]].forEach(([o,ry])=>{ const c=Math.cos(ry), s=Math.sin(ry); S.box(.34,.05,.3,.7*c,.44,-.7*s,MM.yellow,ry); });
  S.build(g); g.add(blob(2.8,.8)); const top=new THREE.Group(); top.position.y=.5; g.add(top); bx(top,.5,.06,.12,0,0,0,MM.yellow); bx(top,.12,.06,.5,0,0,0,MM.yellow); g.userData.top=top; return g; }

/* ---------- belts: straight + curved corners, instanced ---------- */
const BELT={}, ITEM={};
function cornerGeo(sgn,solid){ const seg=10, ri=.48, ro=1.52, cz=sgn, P=[], U=[], N=[], I=[];
  const ang=k=>Math.PI+sgn*k*Math.PI/2, pt=(r,a,y)=>[1+r*Math.cos(a), y, cz+r*Math.sin(a)];
  if(!solid){ for(let i=0;i<=seg;i++){ const k=i/seg, a=ang(k); [ri,ro].forEach((r,j)=>{ P.push(...pt(r,a,0)); U.push(k*.785, j); N.push(0,1,0); }); }
    for(let i=0;i<seg;i++){ const a=i*2; sgn>0?I.push(a,a+2,a+1,a+1,a+2,a+3):I.push(a,a+1,a+2,a+1,a+3,a+2); } }
  else { const quad=(p0,p1,p2,p3)=>{ const b=P.length/3; P.push(...p0,...p1,...p2,...p3); U.push(0,0,1,0,0,1,1,1); I.push(b,b+1,b+2,b+1,b+3,b+2,b,b+2,b+1,b+1,b+2,b+3); };
    for(let i=0;i<seg;i++){ const a0=ang(i/seg), a1=ang((i+1)/seg);
      quad(pt(ri,a0,.38),pt(ro,a0,.38),pt(ri,a1,.38),pt(ro,a1,.38)); quad(pt(ro,a0,0),pt(ro,a0,.38),pt(ro,a1,0),pt(ro,a1,.38)); quad(pt(ri,a0,0),pt(ri,a0,.38),pt(ri,a1,0),pt(ri,a1,.38)); } }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.setIndex(I);
  if(N.length) g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3)); else g.computeVertexNormals(); return g; }
function initInstancing(){
  const N=330, frameM=mat('#3D4859',{metalness:.55, roughness:.45}), mk=(geo,m,n,cast=true)=>{ const im=new THREE.InstancedMesh(geo,m,n); im.castShadow=cast; im.receiveShadow=true; im.count=0; im.frustumCulled=false; scene.add(im); return im; };
  BELT.frame=mk(BOX,frameM,N); BELT.tex=beltTex(); const topM=new THREE.MeshStandardMaterial({map:BELT.tex, roughness:.65, side:THREE.DoubleSide});
  const tg=new THREE.PlaneGeometry(2,1.04); tg.rotateX(-Math.PI/2); BELT.top=mk(tg,topM,N,false);
  BELT.legs=mk(BOX,MM.pipe||frameM,N*2);
  BELT.cTop=[mk(cornerGeo(1,false),topM,80,false), mk(cornerGeo(-1,false),topM,80,false)];
  BELT.cFrame=[mk(cornerGeo(1,true),frameM,80), mk(cornerGeo(-1,true),frameM,80)];
  BELT.ao=mk(PLANE,new THREE.MeshBasicMaterial({map:radialTex([[0,'rgba(0,0,0,.42)'],[.6,'rgba(0,0,0,.22)'],[1,'rgba(0,0,0,0)']]), transparent:true, depthWrite:false}),N,false); BELT.ao.renderOrder=1;
  const NI=520, mi=(geo,m,col)=>{ const im=new THREE.InstancedMesh(geo,m,NI); im.castShadow=true; im.count=0; im.frustumCulled=false; if(col){ im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(NI*3),3); } scene.add(im); return im; };
  ITEM.sheet=mi(BOX, mat('#C3CDD9',{metalness:.85, roughness:.22}));
  const gear=new THREE.CylinderGeometry(.22,.22,.16,8); ITEM.part=mi(gear, mat('#64748B',{metalness:.7, roughness:.3}));
  const bm=mat('#ffffff',{roughness:.3, metalness:.15}); ITEM.body=mi(new THREE.SphereGeometry(.5,12,8),bm,true); ITEM.head=mi(BOX,bm,true);
  ITEM.eye=mi(BOX, mat('#0B1220',{emissive:'#22C55E', emissiveIntensity:1.6}));
  ITEM.crate=mi(BOX, new THREE.MeshStandardMaterial({map:crateTex(), roughness:.85}),true);
  /* particles: one instanced mesh for every spark, puff and confetti bit */
  FX.im=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0), new THREE.MeshBasicMaterial({transparent:true, opacity:.9, depthWrite:false}), 300);
  FX.im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(300*3),3); FX.im.count=0; FX.im.frustumCulled=false; FX.im.renderOrder=4; scene.add(FX.im);
}
function setInst(im,i,x,y,z,ry,sx,sy,sz,rz){ _e.set(0,ry||0,rz||0); _q.setFromEuler(_e); _v.set(x,y,z); _s.set(sx,sy,sz); _m.compose(_v,_q,_s); im.setMatrixAt(i,_m); }
function feedsInto(c,r,s){ const n=at(c+DX[s],r+DZ[s]); if(!n) return false; const back=(s+2)%4;
  if(n.k==='belt'||n.k==='mach') return n.dir===back; if(n.k==='supply') return s===2; if(n.k==='split') return n.dir!==s; return false; }
function beltShape(b){ const back=(b.dir+2)%4; if(feedsInto(b.c,b.r,back)) return -1; const l=(b.dir+1)%4, r=(b.dir+3)%4, fl=feedsInto(b.c,b.r,l), fr=feedsInto(b.c,b.r,r); if(fl&&!fr) return l; if(fr&&!fl) return r; return -1; }
function rebuildBelts(){ let i=0, li=0; const ci=[0,0];
  G.belts.forEach(b=>{ const x=cellX(b.c), z=cellZ(b.r), ry=-b.dir*Math.PI/2, pop=b.pop>0?1+Math.sin(b.pop*Math.PI)*.25:1; b.corner=beltShape(b);
    setInst(BELT.ao,i,x,.026,z,ry,2.6,1,1.9);
    if(b.corner<0){ setInst(BELT.frame,i,x,.2*pop,z,ry,2,.38*pop,1.25); setInst(BELT.top,i,x,.405*pop,z,ry,1,1,1); i++;
      [-1,1].forEach(s=>{ const lx=x+(b.dir%2?s*.5:0), lz=z+(b.dir%2?0:s*.5); setInst(BELT.legs,li++,lx,.0,lz,0,.08,.06,.08); }); }
    else { const k=(b.corner-b.dir+4)%4===1?0:1;
      setInst(BELT.cFrame[k],ci[k],x,.02,z,ry,1,pop,1); setInst(BELT.cTop[k],ci[k],x,.405*pop,z,ry,1,1,1); ci[k]++; } });
  const n=G.belts.length; BELT.ao.count=n; BELT.frame.count=BELT.top.count=i; BELT.legs.count=li; [0,1].forEach(k=>{ BELT.cTop[k].count=BELT.cFrame[k].count=ci[k]; BELT.cTop[k].instanceMatrix.needsUpdate=BELT.cFrame[k].instanceMatrix.needsUpdate=true; });
  [BELT.frame,BELT.top,BELT.legs,BELT.ao].forEach(m=>m.instanceMatrix.needsUpdate=true); }
const COL={bare:'#A3ACB9', paint:'#22C55E', gold:'#FBBF24', bad:'#7F8F3A', crate:'#ffffff', crateGold:'#F7D27A'};
function drawItems(list){ const n={sheet:0,part:0,body:0,head:0,eye:0,crate:0};
  for(const e of list){ const it=e.it, x=e.x, y=e.y, z=e.z, ry=e.ry||0;
    if(it.s===0){ if(n.sheet<520) setInst(ITEM.sheet,n.sheet++,x,y+.05,z,ry,.78,.07,.62); }
    else if(it.s===1){ if(n.part<520){ setInst(ITEM.part,n.part++,x,y+.1,z,ry+e.spin||0,1.3,1.3,1.3); } }
    else if(it.b){ if(n.crate<520){ setInst(ITEM.crate,n.crate,x,y+.3,z,ry,.62,.58,.62); ITEM.crate.setColorAt(n.crate++,_c.set(it.x?COL.crateGold:COL.crate)); } }
    else { const tilt=it.d&&it.s>=3?.42:0, c=_c.set(it.s===2?COL.bare:it.d?COL.bad:it.x?COL.gold:COL.paint);
      if(n.body<520){ setInst(ITEM.body,n.body,x,y+.23,z,ry,.46,.44,.42); ITEM.body.setColorAt(n.body++,c);
        setInst(ITEM.head,n.head,x,y+.58,z,ry,.36,.28,.34,tilt); ITEM.head.setColorAt(n.head++,c);
        if(it.s>=3) setInst(ITEM.eye,n.eye++,x+Math.cos(ry)*.18,y+.6,z-Math.sin(ry)*.18,ry,.04,.09,.26,tilt); } } }
  for(const k in n){ const im=ITEM[k]; im.count=n[k]; im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true; } }

/* ---------- trucks ---------- */
function makeTruck(color,label,sub){ const g=new THREE.Group(), body=new THREE.Group(), S=new Static(); g.add(body);
  S.box(5.2,.35,1.9,0,.5,0,MM.dark); S.box(1.5,1.5,1.9,2.0,.85,0,mat(color,{roughness:.35, metalness:.3})); S.box(.06,.6,1.6,2.76,1.5,0,new THREE.MeshStandardMaterial({color:'#0B1220', metalness:.6, roughness:.1}));
  S.box(3.5,2.0,2.0,-.65,.85,0,mat('#F8FAFC',{roughness:.6})); S.box(3.52,.14,2.02,-.65,1.4,0,mat(color));
  const tire=mat('#111318',{roughness:.85}); [[1.9,1],[1.9,-1],[-1.4,1],[-1.4,-1],[-.5,1],[-.5,-1]].forEach(([x,s])=>S.cyl(.42,.3,x,.42-.15,s*.88,tire,CYL8,Math.PI/2));
  S.build(body);
  [1.01,-1.01].forEach(s=>sign(body,[{t:label,color:'#0B1220'},{t:sub,size:34,weight:700,color:'#475569'}],3.2,1.0,-.65,2.2,s,{bg:'#F8FAFC',size:64,w:768,h:240,ry:s>0?0:Math.PI}));
  const sh=blob(1); sh.scale.set(6.4,1,2.8); g.add(sh); return g; }

/* ---------- particles + floating text ---------- */
const FX={im:null, p:[]};
function puffAt(x,y,z,color,n=6,o={}){ const cap=qs().fx; for(let i=0;i<n;i++){ if(FX.p.length>=cap) FX.p.shift();
  FX.p.push({x:x+rand(-.2,.2)*(o.jx||1),y,z:z+rand(-.2,.2)*(o.jx||1),vx:rand(-1,1)*(o.spread||1),vy:rand(1,2.5)*(o.up||1),vz:rand(-1,1)*(o.spread||1),life:o.life||.8,max:o.life||.8,s:o.size||.12,g:o.g==null?4:o.g,col:new THREE.Color(color),grow:!!o.grow,spin:rand(0,6)}); } }
function stepFx(dt){ const im=FX.im; let n=0; for(let i=FX.p.length-1;i>=0;i--){ const p=FX.p[i]; p.life-=dt; if(p.life<=0){ FX.p.splice(i,1); continue; }
    p.vy-=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt; if(p.y<.05&&p.g>0){ p.y=.05; p.vy*=-.3; p.vx*=.6; p.vz*=.6; } const k=p.life/p.max, s=p.s*(p.grow?(1.6-k):Math.min(1,k*2.2)); p.spin+=dt*4;
    setInst(im,n,p.x,p.y,p.z,p.spin,s,s,s,p.spin*.7); im.setColorAt(n,p.col); n++; }
  im.count=n; im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true; }
const floatSlot={};
function floatText(x,y,z,html,cls){ const key=Math.round(x)+','+Math.round(z), now=performance.now(); const sl=floatSlot[key]&&now-floatSlot[key].t<900?floatSlot[key].n+1:0; floatSlot[key]={t:now,n:sl};
  const e=document.createElement('div'); e.className='floater '+(cls||''); e.innerHTML=html; $('#floaters').appendChild(e); W.floaters.push({e, p:new THREE.Vector3(x,y+.55*sl,z), t:0}); if(W.floaters.length>10){ const f=W.floaters.shift(); f.e.remove(); } }
function stepFloaters(dt){ for(let i=W.floaters.length-1;i>=0;i--){ const f=W.floaters[i]; f.t+=dt; if(f.t>1.7){ f.e.remove(); W.floaters.splice(i,1); continue; }
  _v.copy(f.p); _v.y+=f.t*1.0; _v.project(camera); if(_v.z>1){ f.e.style.opacity=0; continue; } const pop=f.t<.15?.6+f.t/.15*.5:f.t<.3?1.1-(f.t-.15)/.15*.1:1;
  f.e.style.transform=`translate(${(_v.x*.5+.5)*innerWidth}px,${(-_v.y*.5+.5)*innerHeight}px) translate(-50%,-50%) scale(${pop})`; f.e.style.opacity=f.t<1.2?1:(1.7-f.t)*2; } }
function screenOf(x,y,z){ _v.set(x,y,z).project(camera); return {x:(_v.x*.5+.5)*innerWidth, y:(-_v.y*.5+.5)*innerHeight, ok:_v.z<1}; }

/* ---------- camera ---------- */
const CAM={tx:-8, tz:-6, yaw:.62, pitch:.92, dist:27, min:9, max:62, goal:null, distGoal:null, vx:0, vz:0, shake:0, punch:0};
function updateCam(dt){ if(CAM.distGoal!=null){ CAM.dist=lerp(CAM.dist,CAM.distGoal,Math.min(1,dt*10)); if(Math.abs(CAM.dist-CAM.distGoal)<.02) CAM.distGoal=null; }
  if(!UI.drag&&(Math.abs(CAM.vx)>.001||Math.abs(CAM.vz)>.001)){ CAM.tx+=CAM.vx*dt; CAM.tz+=CAM.vz*dt; const k=Math.pow(.02,dt); CAM.vx*=k; CAM.vz*=k; clampCam(); }
  CAM.shake=Math.max(0,CAM.shake-dt*2.5); CAM.punch=Math.max(0,CAM.punch-dt*3);
  const d=CAM.dist*(1-CAM.punch*.05), cp=Math.cos(CAM.pitch), sx=(Math.random()-.5)*CAM.shake*.3, sz=(Math.random()-.5)*CAM.shake*.3;
  camera.position.set(CAM.tx+d*cp*Math.sin(CAM.yaw)+sx, d*Math.sin(CAM.pitch), CAM.tz+d*cp*Math.cos(CAM.yaw)+sz); camera.lookAt(CAM.tx+sx*.5,0,CAM.tz+sz*.5);
  const sd=W.sunDir||_s.set(22,42,18); sun.position.set(CAM.tx+sd.x,sd.y,CAM.tz+sd.z); sun.target.position.set(CAM.tx,0,CAM.tz); }
function clampCam(){ CAM.tx=clamp(CAM.tx,OX-6,-OX+6); CAM.tz=clamp(CAM.tz,OZ-6,-OZ+6); }
function panCam(dx,dy,inertia){ const k=CAM.dist*.0016*(innerHeight>0?900/innerHeight:1); const s=Math.sin(CAM.yaw), c=Math.cos(CAM.yaw);
  const mx=-(dx*c+dy*s)*k, mz=-(-dx*s+dy*c)*k; CAM.tx+=mx; CAM.tz+=mz; clampCam(); if(inertia){ CAM.vx=lerp(CAM.vx,mx*60,.5); CAM.vz=lerp(CAM.vz,mz*60,.5); } }

/* ---------- time of day: morning → evening ---------- */
const DAYKEYS=[[0,'#FFC891',1.05,'#A9CFF0',.5,'#FFE9C9'],[.35,'#FFF3DF',1.45,'#CFE6FA',.62,'#FFFFFF'],[.7,'#FFE2B8',1.3,'#D6E3F2',.58,'#FFF1DC'],[1,'#FF9550',.9,'#FFB989',.42,'#FFB27A']];
function setDayLight(f){ let a=DAYKEYS[0], b=DAYKEYS[DAYKEYS.length-1]; for(let i=0;i<DAYKEYS.length-1;i++) if(f>=DAYKEYS[i][0]&&f<=DAYKEYS[i+1][0]){ a=DAYKEYS[i]; b=DAYKEYS[i+1]; break; }
  const k=(f-a[0])/Math.max(.001,b[0]-a[0]);
  sun.color.copy(_c.set(a[1])).lerp(_c2.set(b[1]),k); sun.intensity=lerp(a[2],b[2],k); hemi.color.copy(_c.set(a[3])).lerp(_c2.set(b[3]),k); hemi.intensity=lerp(a[4],b[4],k);
  if(W.sky){ W.sky.material.color.copy(_c.set(a[5])).lerp(_c2.set(b[5]),k); scene.fog.color.copy(W.sky.material.color).multiplyScalar(.92).lerp(_c2.set('#DCEBF5'),.4); }
  const az=lerp(-1.05,1.15,f), el=lerp(.55,1.05,Math.sin(f*Math.PI)); W.sunDir=_s.set(Math.sin(az)*-34*Math.cos(el)+6, 46*Math.sin(el)+6, Math.cos(az)*30*Math.cos(el)+10).clone();
  const eve=clamp((f-.6)/.4,0,1); W.lampMats.forEach(m=>m.emissiveIntensity=1+eve*1.4); W.glassMats.forEach(m=>{ m.emissiveIntensity=.04+eve*.55; });
  if(W.pools) W.pools.material.opacity=.32+eve*.5; W.rays.forEach(r=>r.material.opacity=.07*(1-eve*.85)); }

/* ---------- renderer + quality ---------- */
function initThree(){
  renderer=new THREE.WebGLRenderer({canvas:$('#gl'), antialias:!MOBILE&&!CROS, powerPreference:'high-performance'});
  renderer.setSize(innerWidth,innerHeight); renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
  scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(45, innerWidth/innerHeight, .1, 700);
  hemi=new THREE.HemisphereLight('#DBEAFE','#5B4E42',.55); scene.add(hemi);
  sun=new THREE.DirectionalLight('#FFF1D6',1.35); Object.assign(sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:1,far:140}); sun.shadow.bias=-.0005; sun.shadow.normalBias=.03; scene.add(sun); scene.add(sun.target);
  const pm=new THREE.PMREMGenerator(renderer); const env=new THREE.Scene(); env.background=new THREE.Color('#8C9BAE'); const l1=new THREE.Mesh(new THREE.PlaneGeometry(40,10),new THREE.MeshBasicMaterial({color:'#FFF5E6'})); l1.position.set(0,12,-10); l1.lookAt(0,0,0); env.add(l1);
  const l2=new THREE.Mesh(new THREE.PlaneGeometry(30,6),new THREE.MeshBasicMaterial({color:'#BFDBFE'})); l2.position.set(10,8,12); l2.lookAt(0,0,0); env.add(l2); scene.environment=pm.fromScene(env,.04).texture;
  addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
  applyQuality(); }
function applyQuality(rebuildOnly){ const q=qs(); renderer.setPixelRatio(Math.min(devicePixelRatio,q.pr));
  const want=q.shadow>0; if(renderer.shadowMap.enabled!==want||sun.castShadow!==want){ renderer.shadowMap.enabled=want; sun.castShadow=want; scene&&scene.traverse(o=>{ if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true); } }); }
  renderer.shadowMap.type=q.soft?THREE.PCFSoftShadowMap:THREE.PCFShadowMap;
  if(want&&sun.shadow.mapSize.x!==q.shadow){ sun.shadow.mapSize.set(q.shadow,q.shadow); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; } }
  W.rays.forEach(r=>r.visible=q.rays); }
function setQuality(l){ Q.level=l; try{ localStorage.setItem('bf_q',l); }catch(e){} applyQuality(); }
