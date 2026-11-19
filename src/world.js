/* ===================== BotFactory · 3D world ===================== */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const MOBILE=matchMedia('(pointer:coarse)').matches || /CrOS/.test(navigator.userAgent);
let renderer, scene, camera, sun, hemi, clock=new THREE.Clock();
const GLTF={}, MB={}, W={anim:[], rigs:[], fx:[], floaters:[]};
const BOX=new THREE.BoxGeometry(1,1,1), SPH=new THREE.SphereGeometry(1,14,10), CYL=new THREE.CylinderGeometry(1,1,1,18);
const mat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c, roughness:.7, metalness:0},o));
function bx(g,w,h,d,x,y,z,m,cast=true){ const e=new THREE.Mesh(BOX,m); e.scale.set(w,h,d); e.position.set(x,y+h/2,z); e.castShadow=cast; e.receiveShadow=true; g.add(e); return e; }
function cy(g,r,h,x,y,z,m,cast=true){ const e=new THREE.Mesh(CYL,m); e.scale.set(r,h,r); e.position.set(x,y+h/2,z); e.castShadow=cast; e.receiveShadow=true; g.add(e); return e; }
const cellX=c=>OX+c*CELL+CELL/2, cellZ=r=>OZ+r*CELL+CELL/2;

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
let blobTex=null;
function blob(s=1){ if(!blobTex){ const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'); const r=g.createRadialGradient(32,32,0,32,32,32); r.addColorStop(0,'rgba(0,0,0,.45)'); r.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=r; g.fillRect(0,0,64,64); blobTex=new THREE.CanvasTexture(c); }
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1), new THREE.MeshBasicMaterial({map:blobTex, transparent:true, depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=.02; m.scale.set(s,s,1); return m; }

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

/* ---------- textures ---------- */
function noiseCanvas(w,h,base,amt,n){ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); g.fillStyle=base; g.fillRect(0,0,w,h);
  for(let i=0;i<n;i++){ g.fillStyle=`rgba(${Math.random()<.5?'255,255,255':'0,0,0'},${Math.random()*amt})`; g.fillRect(Math.random()*w,Math.random()*h,2,2); } return [c,g]; }
function texOf(c,rep){ const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; t.anisotropy=4; if(rep) t.repeat.set(rep[0],rep[1]); return t; }
function floorTex(){ const [c,g]=noiseCanvas(128,128,'#98A4B3',.06,900); g.strokeStyle='rgba(30,41,59,.35)'; g.lineWidth=2; g.strokeRect(1,1,126,126); g.fillStyle='rgba(51,65,85,.18)'; g.fillRect(62,62,4,4); return texOf(c); }
function beltTex(){ const c=document.createElement('canvas'); c.width=128; c.height=64; const g=c.getContext('2d'); g.fillStyle='#1F2937'; g.fillRect(0,0,128,64);
  g.strokeStyle='#4B5563'; g.lineWidth=5; for(let i=0;i<2;i++){ const x=i*64+18; g.beginPath(); g.moveTo(x,10); g.lineTo(x+22,32); g.lineTo(x,54); g.stroke(); }
  g.fillStyle='#FBBF24'; g.fillRect(0,0,128,4); g.fillRect(0,60,128,4); return texOf(c); }
function roadTex(){ const [c,g]=noiseCanvas(256,256,'#2B2F36',.05,900); g.fillStyle='#FBBF24'; for(let x=0;x<256;x+=64) g.fillRect(x,126,36,4); g.fillStyle='#E2E8F0'; g.fillRect(0,8,256,4); g.fillRect(0,244,256,4); return texOf(c); }

/* ---------- environment ---------- */
function buildEnvironment(){
  scene.background=new THREE.Color('#9FD3F2'); scene.fog=new THREE.Fog('#C4E4F6', 85, 200);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(500,500), mat('#5E9E5A',{roughness:1})); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
  const [ac]=noiseCanvas(256,256,'#474C55',.06,2500); const yard=new THREE.Mesh(new THREE.PlaneGeometry(COLS*CELL+30, ROWS*CELL+16), new THREE.MeshStandardMaterial({map:texOf(ac,[6,4]), roughness:.95}));
  yard.rotation.x=-Math.PI/2; yard.position.set(0,.005,1); yard.receiveShadow=true; scene.add(yard);
  /* road along the north */
  const rd=new THREE.Mesh(new THREE.PlaneGeometry(260,8), new THREE.MeshStandardMaterial({map:texOf(roadTex().image,[26,1]), roughness:.92})); rd.rotation.x=-Math.PI/2; rd.position.set(0,.012,OZ-11); rd.receiveShadow=true; scene.add(rd);
  /* truck lanes into the docks */
  const lane=mat('#4B5059',{roughness:.95});
  [[OX-16,cellZ(2)],[OX-16,cellZ(8)]].forEach(([x,z])=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(30,4),lane); p.rotation.x=-Math.PI/2; p.position.set(x,.008,z); p.receiveShadow=true; scene.add(p); });
  /* rival: ScrapCo across the road */
  const sc=new THREE.Group(); sc.position.set(16,0,OZ-24); scene.add(sc); W.scrapco=sc;
  const rust=mat('#9A3412',{roughness:.95, metalness:.2}), rust2=mat('#7C2D12',{roughness:1});
  bx(sc,18,7,9,0,0,0,rust); bx(sc,18.4,.5,9.4,0,7,0,rust2); for(let x=-8;x<=8;x+=2.2) bx(sc,.25,7,.2,x,0,4.55,rust2);
  cy(sc,.9,13,6,0,-2,mat('#57534E',{roughness:1})); bx(sc,5,3.6,.2,-4,0,4.6,mat('#292524'));
  sign(sc,[{t:'SCRAPCO',color:'#FCA5A5'},{t:'cheap bots, cheaper parts',size:30,weight:600,color:'#FDBA74'}],9,2,0,5.2,4.62,{bg:'#1C1917',size:84});
  for(let i=0;i<5;i++){ const s=new THREE.Mesh(SPH,new THREE.MeshStandardMaterial({color:'#78716C',transparent:true,opacity:.55,roughness:1})); sc.add(s); const ph=i/5;
    W.anim.push(t=>{ const k=(t*.18+ph)%1; s.position.set(6+k*3,13.5+k*7,-2); s.scale.setScalar(.9+k*2.2); s.material.opacity=.55*(1-k); }); }
  /* neighbours + trees */
  const fac=['#E2E8F0','#FDE68A','#A7F3D0','#C7D2FE','#FBCFE8'];
  [[-24,OZ-24,14,8,6],[-46,OZ-22,10,9,10],[42,OZ-24,12,8,9],[-50,10,10,14,7],[46,8,10,16,6]].forEach(([x,z,w,d,h],i)=>{ bx(scene,w,h,d,x,0,z,mat(fac[i%fac.length],{roughness:.85})); bx(scene,w+.4,.4,d+.4,x,h,z,mat('#475569')); });
  const leaf=mat('#2F855A',{roughness:.9}), leaf2=mat('#3F9C5D',{roughness:.9}), trunk=mat('#7C4A2D');
  const tree=(x,z,s=1)=>{ const g=new THREE.Group(); g.position.set(x,0,z); g.scale.setScalar(s); cy(g,.18,1.5,0,0,0,trunk); const l=new THREE.Mesh(new THREE.IcosahedronGeometry(1.3,1),Math.random()<.5?leaf:leaf2); l.position.y=2.4; l.castShadow=true; g.add(l); scene.add(g); };
  for(let x=-34;x<=34;x+=6.5) tree(x+rand(-1,1), -OZ+11+rand(0,3), rand(.9,1.25));
  for(let z=-8;z<=14;z+=6) { tree(OX-34+rand(-1,1),z,rand(.9,1.2)); tree(-OX+19+rand(-1,1),z+3,rand(.9,1.2)); }
  /* street lamps along road */
  for(let x=-40;x<=40;x+=16){ const p=new THREE.Group(); p.position.set(x,0,OZ-6.6); scene.add(p); cy(p,.08,4.5,0,0,0,mat('#64748B',{metalness:.6})); bx(p,.9,.15,.3,.35,4.5,0,mat('#334155')); }
}

/* ---------- factory shell (rebuilt when you expand) ---------- */
const SH={wall:null, trim:null, floorTex:null};
function buildShell(b, docks, expanded){
  if(W.shell){ scene.remove(W.shell); W.shell.traverse(o=>{ if(o.geometry&&o.geometry!==BOX&&o.geometry!==CYL) o.geometry.dispose(); }); }
  const g=new THREE.Group(); W.shell=g; scene.add(g);
  if(!SH.wall){ SH.wall=mat('#D6C7AE',{roughness:.9}); SH.trim=mat('#0B1220',{roughness:.5}); SH.stripe=mat('#FBBF24',{roughness:.6}); SH.floor=floorTex(); SH.green=mat('#00C853',{roughness:.5}); }
  const x0=OX+b.c0*CELL, x1=OX+(b.c1+1)*CELL, z0=OZ+b.r0*CELL, z1=OZ+(b.r1+1)*CELL, cols=b.c1-b.c0+1, rows=b.r1-b.r0+1;
  const ft=SH.floor.clone(); ft.needsUpdate=true; ft.repeat.set(cols,rows);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0), new THREE.MeshStandardMaterial({map:ft, color:'#AFB9C6', roughness:.9, metalness:0, envMapIntensity:.5})); fl.rotation.x=-Math.PI/2; fl.position.set((x0+x1)/2,.02,(z0+z1)/2); fl.receiveShadow=true; g.add(fl);
  bx(g,x1-x0+.6,.18,z1-z0+.6,(x0+x1)/2,-.16,(z0+z1)/2,mat('#94A3B8'),false);
  const H=1.6, T=.35;
  const gapsW=docks.filter(d=>d.c===b.c0).map(d=>d.r), gapsE=docks.filter(d=>d.c===b.c1).map(d=>d.r);
  const run=(alongX, fixed, a0, a1, gaps, cellA0)=>{ let s=a0; const cut=[...gaps].sort((p,q)=>p-q);
    const seg=(u0,u1)=>{ if(u1-u0<.05) return; const L=u1-u0, m=(u0+u1)/2; if(alongX){ bx(g,L,H,T,m,0,fixed,SH.wall); bx(g,L,.14,T+.08,m,H,fixed,SH.trim); } else { bx(g,T,H,L,fixed,0,m,SH.wall); bx(g,T+.08,.14,L,fixed,H,m,SH.trim); } };
    cut.forEach(r=>{ const u0=cellA0+r*CELL, u1=u0+CELL; seg(s,u0+.15); s=u1-.15;
      /* door frame */
      if(alongX) return; bx(g,T+.1,.5,CELL-.3,fixed,2.3,u0+CELL/2,SH.trim); [u0+.15,u1-.15].forEach(u=>bx(g,T+.1,2.8,.18,fixed,0,u,SH.trim));
      const st=new THREE.Mesh(BOX,SH.stripe); st.scale.set(T+.12,.12,CELL-.3); st.position.set(fixed,2.25,u0+CELL/2); g.add(st); });
    seg(s,a1); };
  run(true, z0-T/2, x0-T, x1+T, [], 0); run(true, z1+T/2, x0-T, x1+T, [], 0);
  run(false, x0-T/2, z0, z1, gapsW, OZ); run(false, x1+T/2, z0, z1, gapsE, OZ);
  [[x0,z0],[x1,z0],[x0,z1],[x1,z1]].forEach(([x,z])=>bx(g,.6,H+.5,.6,x,0,z,SH.trim));
  /* big sign on the north wall */
  const sx=(x0+x1)/2, sg=new THREE.Group(); sg.position.set(sx,0,z0-.6); g.add(sg);
  [-3.6,3.6].forEach(x=>cy(sg,.09,4.4,x,0,0,mat('#475569',{metalness:.6})));
  bx(sg,8.4,1.9,.25,0,3.0,-.02,SH.trim); sign(sg,[{t:expanded?'MINIBOT WORKS':'MINIBOT GARAGE',color:'#00E676'},{t:'a MoneyBot company',size:34,weight:600,color:'#FBBF24'}],8,1.7,0,3.95,.12,{bg:'#0B1220',glow:.7,w:1024,h:220,size:96});
  /* wall banners: sponsor inventory (2 in the garage, 4 on the big floor) */
  const FALLBACK=[{name:'SAFETY FIRST',tagline:'Eyes and ears protected on the floor',color:'#FBBF24'},{name:'QUALITY IS EVERYONE\'S JOB',tagline:'Catch it here, not at the customer',color:'#00C853'},{name:'MADE IN BOT CITY',tagline:'MiniBots built with pride',color:'#3B82F6'},{name:'THINK LEAN',tagline:'Less waste, more bots',color:'#A855F7'}];
  const bans=spBanners(), spots=expanded?[-7.4,7.4,-13.2,13.2]:[-7.3,7.3];
  spots.forEach((dx,i)=>{ const s=bans[i]||FALLBACK[i]; if(bans[i]) spTrack('view',bans[i],{slot:'banner'}); const bg=new THREE.Group(); bg.position.set(sx+dx,0,z0-.55); g.add(bg);
    [-1.85,1.85].forEach(x=>cy(bg,.07,3.6,x,0,0,mat('#475569',{metalness:.6})));
    bx(bg,4.2,1.2,.16,0,2.55,-.04,SH.trim);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(4,1),new THREE.MeshStandardMaterial({map:sponsorTex(s,{w:1024,h:256,bg:bans[i]?'#F8FAFC':'#0B1220',ink:bans[i]?'#0B1220':'#fff'}),roughness:.55,emissive:'#fff',emissiveIntensity:.12}));
    m.material.emissiveMap=m.material.map; m.position.set(0,3.15,.06); bg.add(m); });
  /* steel supplier board over the steel door */
  const ssp=spSteel(); if(ssp) docks.filter(d=>d.c===b.c0).forEach(d=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.75),new THREE.MeshStandardMaterial({map:sponsorTex(ssp,{w:1024,h:296,kicker:ssp.placeholder?'':'Steel by',noTag:true}),roughness:.55})); m.position.set(x0-T-.05,3.25,OZ+d.r*CELL+CELL/2); m.rotation.y=Math.PI/2; g.add(m); });
  /* the empty lot you can expand into */
  if(!expanded){ const lot=new THREE.Group(); g.add(lot); const xa=OX+(GARAGE.c1+1)*CELL, xb=OX+COLS*CELL, za=OZ, zb=OZ+ROWS*CELL;
    const line=(x,z,w,d)=>{ const m=new THREE.Mesh(BOX,SH.stripe); m.scale.set(w,.03,d); m.position.set(x,.02,z); lot.add(m); };
    for(let x=xa+.6;x<xb;x+=1.6) line(x+.4,zb,.8,.12); for(let z=za+.6;z<zb;z+=1.6){ line(xb,z+.4,.12,.8); } for(let x=OX+.6;x<xa;x+=1.6) line(x+.4,zb,.8,.12);
    const ps=new THREE.Group(); ps.position.set((xa+xb)/2,0,(za+zb)/2+3); lot.add(ps); cy(ps,.08,2.6,-1.2,0,0,mat('#64748B')); cy(ps,.08,2.6,1.2,0,0,mat('#64748B'));
    sign(ps,[{t:'BIG FLOOR',color:'#0B1220'},{t:'Ship 60 bots to unlock',size:38,weight:700,color:'#475569'}],3.4,1.3,0,2.4,.06,{bg:'#FBBF24',w:640,h:240,size:86,r:20});
    W.lotSign=ps; }
  else W.lotSign=null;
}

/* ---------- docks ---------- */
function stackTex(){ return null; }
function makeSupplyDock(){ const g=new THREE.Group(); const plat=mat('#475569',{roughness:.6});
  bx(g,1.9,.32,1.9,0,0,0,plat); for(let i=0;i<5;i++) bx(g,.36,.04,1.9,-.76+i*.38,.32,0,SH.stripe||mat('#FBBF24'));
  bx(g,1.2,.12,1.2,-.2,.36,0,mat('#A16207'));
  const st=new THREE.Mesh(BOX,mat('#CBD5E1',{metalness:.75,roughness:.3})); st.castShadow=true; st.scale.set(1.05,.1,1.05); st.position.set(-.2,.5,0); g.add(st);
  const lab=sprite([{t:'STEEL IN',size:44,color:'#93C5FD'},{t:'30 sheets',size:40}],{w:512,h:176,sw:2.6}); lab.position.set(0,2.6,0); g.add(lab);
  g.userData={stack:st, label:lab}; return g; }
function makeShipDock(){ const g=new THREE.Group(); bx(g,1.9,.32,1.9,0,0,0,mat('#475569',{roughness:.6})); for(let i=0;i<5;i++) bx(g,.36,.04,1.9,-.76+i*.38,.32,0,mat('#00C853'));
  bx(g,1.3,.12,1.3,.15,.36,0,mat('#A16207'));
  const st=new THREE.Mesh(BOX,mat('#C08A4E',{roughness:.8})); st.castShadow=true; st.scale.set(1.15,.01,1.15); st.position.set(.15,.48,0); g.add(st);
  const lab=sprite([{t:'SHIPPING',size:44,color:'#86EFAC'},{t:'0 ready',size:40}],{w:512,h:176,sw:2.6}); lab.position.set(0,2.6,0); g.add(lab);
  g.userData={stack:st, label:lab}; return g; }

/* ---------- machines ---------- */
const MM={};
function machineMats(){ MM.dark=mat('#1E293B',{roughness:.55, metalness:.3}); MM.steel=mat('#CBD5E1',{metalness:.8, roughness:.28}); MM.bed=mat('#111827',{roughness:.6});
  MM.glass=new THREE.MeshStandardMaterial({color:'#A7F3D0', transparent:true, opacity:.35, roughness:.1, metalness:.3}); MM.yellow=mat('#FACC15',{roughness:.45, metalness:.3});
  MM.ring=new THREE.MeshBasicMaterial({color:'#EF4444', transparent:true, opacity:.75, depthWrite:false});
  MM.alerts={bottleneck:textTex([{t:'BOTTLENECK',size:62}],{bg:'#DC2626',r:40}), broken:textTex([{t:'TAP TO FIX!',size:62}],{bg:'#EA580C',r:40}), nocrew:textTex([{t:'NO WORKER',size:58}],{bg:'#475569',r:40})}; }
function machineMesh(type){
  const d=MACH[type], g=new THREE.Group(), acc=mat(d.color,{roughness:.42, metalness:.25}), P={};
  bx(g,1.84,.3,1.74,0,0,0,MM.dark); bx(g,1.96,.1,1.05,0,.3,0,MM.bed);
  if(type==='stamper'){ [-.72,.72].forEach(z=>bx(g,.3,2.1,.3,0,.3,z,acc)); bx(g,.7,.4,1.84,0,2.3,0,acc); bx(g,.8,.06,.9,0,.4,0,MM.steel);
    const head=new THREE.Group(); head.position.y=1.5; g.add(head); bx(head,.62,.5,.95,0,0,0,MM.steel); cy(head,.12,.8,0,.5,0,MM.dark); P.head=head; }
  if(type==='assembler'){ bx(g,1.5,.9,.45,0,.3,-.66,acc); bx(g,1.5,.1,.5,0,1.2,-.66,MM.dark);
    const arm=new THREE.Group(); arm.position.set(0,1.3,-.62); g.add(arm); cy(arm,.2,.3,0,0,0,MM.dark); const up=new THREE.Group(); up.position.y=.3; arm.add(up); bx(up,.18,.8,.18,0,0,0,acc); const fw=new THREE.Group(); fw.position.y=.8; up.add(fw); bx(fw,.16,.16,.75,0,-.08,.35,MM.steel); bx(fw,.24,.22,.12,0,-.2,.74,MM.dark); P.arm=arm; P.up=up;
    const arm2=arm.clone(); arm2.position.z=-.62; arm2.position.x=.55; arm2.scale.setScalar(.7); g.add(arm2); P.arm2=arm2; }
  if(type==='painter'){ [[-.8,-.75],[.8,-.75],[-.8,.75],[.8,.75]].forEach(([x,z])=>bx(g,.14,1.7,.14,x,.3,z,MM.dark)); bx(g,1.8,.22,1.7,0,2.0,0,acc);
    [-.78,.78].forEach(z=>{ const p=new THREE.Mesh(BOX,MM.glass); p.scale.set(1.5,1.4,.05); p.position.set(0,1.05,z); g.add(p); });
    const nz=new THREE.Group(); nz.position.set(0,1.75,0); g.add(nz); cy(nz,.08,.35,0,-.35,0,MM.steel); P.nozzle=nz;
    const mist=new THREE.Mesh(new THREE.ConeGeometry(.45,.9,14,1,true), new THREE.MeshBasicMaterial({color:'#4ADE80', transparent:true, opacity:.0, depthWrite:false})); mist.position.set(0,.98,0); g.add(mist); P.mist=mist; }
  if(type==='qa'){ [-.7,.7].forEach(z=>bx(g,.26,1.65,.26,0,.3,z,acc)); bx(g,.4,.3,1.7,0,1.9,0,acc);
    const scan=new THREE.Mesh(BOX,new THREE.MeshBasicMaterial({color:'#E9D5FF'})); scan.scale.set(.06,.04,1.15); scan.position.set(0,1.85,0); g.add(scan); P.scan=scan;
    const beam=new THREE.Mesh(new THREE.PlaneGeometry(1.15,1.35), new THREE.MeshBasicMaterial({color:'#C084FC', transparent:true, opacity:.22, side:THREE.DoubleSide, depthWrite:false})); beam.rotation.y=Math.PI/2; beam.position.set(0,1.17,0); g.add(beam); P.beam=beam;
    const bin=new THREE.Group(); bin.position.set(.3,0,-1.05); g.add(bin); bx(bin,.6,.45,.35,0,0,0,mat('#7F1D1D')); }
  if(type==='packer'){ bx(g,1.2,1.1,.5,0,.3,-.64,acc); bx(g,.9,.7,.7,-.45,.3,.0,mat('#334155'),true).position.y=1.45;
    for(let i=0;i<3;i++) bx(g,.42,.36,.42,.1+i*.0,1.4+i*.37,-.64,mat('#C08A4E')); const fl=new THREE.Group(); fl.position.set(.5,1.15,0); g.add(fl); bx(fl,.5,.05,.9,.25,0,0,MM.yellow); P.flap=fl; }
  if(type==='chip'){ bx(g,1.4,1.2,.5,0,.3,-.64,acc); bx(g,1.0,.6,.04,0,.85,-.38,new THREE.MeshStandardMaterial({color:'#0B1220', emissive:'#EC4899', emissiveIntensity:.5}));
    const leds=new THREE.MeshStandardMaterial({color:'#FDF2F8', emissive:'#F472B6', emissiveIntensity:1}); P.leds=leds; for(let i=0;i<4;i++) bx(g,.12,.12,.05,-.36+i*.24,1.3,-.37,leds);
    const hd=new THREE.Group(); hd.position.set(0,1.7,0); g.add(hd); bx(hd,.5,.3,.5,0,0,0,MM.steel); cy(hd,.05,.4,0,-.35,0,MM.dark); P.head=hd; }
  /* status light */
  cy(g,.04,.9,.8,.3,.72,MM.dark); P.lightMat=mat('#22C55E',{emissive:'#22C55E', emissiveIntensity:1.2}); const lt=new THREE.Mesh(SPH,P.lightMat); lt.scale.setScalar(.14); lt.position.set(.8,1.26,.72); g.add(lt);
  /* robot arm (automation), hidden until you automate */
  const rb=new THREE.Group(); rb.position.set(-.55,.3,.62); rb.visible=false; g.add(rb); cy(rb,.22,.25,0,0,0,MM.yellow); const r1=new THREE.Group(); r1.position.y=.25; rb.add(r1); bx(r1,.16,.9,.16,0,0,0,MM.yellow); const r2=new THREE.Group(); r2.position.y=.9; r1.add(r2); bx(r2,.14,.14,.7,0,-.07,-.32,MM.yellow); bx(r2,.22,.2,.1,0,-.17,-.66,MM.dark); P.robot=rb; P.r1=r1; P.r2=r2;
  /* bottleneck ring + alerts */
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.15,1.42,40), MM.ring); ring.rotation.x=-Math.PI/2; ring.position.y=.05; ring.visible=false; g.add(ring); P.ring=ring;
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  return {g, P};
}
/* labels live outside the rotated machine group so they stay upright and centered */
function machineLabel(type){ const d=MACH[type], sp=spMachine(type); if(sp){ spTrack('view',sp,{slot:'machine',type}); return sprite([{t:d.name,size:50},{t:(sp.placeholder?'sponsor slot':'powered by '+sp.name),size:32,weight:700,color:sp.placeholder?'#FBBF24':'#93C5FD'}],{sw:2.3,h:176,bg:'rgba(11,18,32,.86)'}); } return sprite([{t:d.name,size:52}],{sw:2.0,bg:'rgba(11,18,32,.82)'}); }
function alertSprite(){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:MM.alerts.bottleneck, transparent:true, depthWrite:false, depthTest:false})); s.scale.set(2.1,.52,1); s.renderOrder=9; s.visible=false; return s; }

/* ---------- instanced belts + items ---------- */
const BELT={}, ITEM={};
function initInstancing(){
  const N=330; BELT.frame=new THREE.InstancedMesh(BOX, mat('#475569',{metalness:.55, roughness:.45}), N); BELT.frame.castShadow=true; BELT.frame.receiveShadow=true; BELT.frame.count=0; scene.add(BELT.frame);
  BELT.tex=beltTex(); const tg=new THREE.PlaneGeometry(2,1.04); tg.rotateX(-Math.PI/2);
  BELT.top=new THREE.InstancedMesh(tg, new THREE.MeshStandardMaterial({map:BELT.tex, roughness:.7}), N); BELT.top.receiveShadow=true; BELT.top.count=0; scene.add(BELT.top);
  const NI=520, mk=(geo,m,col)=>{ const im=new THREE.InstancedMesh(geo,m,NI); im.castShadow=true; im.count=0; im.frustumCulled=false; if(col){ im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(NI*3),3); } scene.add(im); return im; };
  ITEM.sheet=mk(BOX, mat('#B6C2D1',{metalness:.75, roughness:.3}));
  ITEM.part=mk(new THREE.CylinderGeometry(.22,.22,.16,8), mat('#64748B',{metalness:.65, roughness:.35}));
  const bm=mat('#ffffff',{roughness:.35, metalness:.2}); ITEM.body=mk(BOX,bm,true); ITEM.head=mk(BOX,bm,true);
  ITEM.eye=mk(BOX, mat('#0B1220',{emissive:'#22C55E', emissiveIntensity:1.4}));
  ITEM.crate=mk(BOX, mat('#ffffff',{roughness:.85}),true);
}
const _m=new THREE.Matrix4(), _q=new THREE.Quaternion(), _e=new THREE.Euler(), _v=new THREE.Vector3(), _s=new THREE.Vector3(), _c=new THREE.Color();
function setInst(im,i,x,y,z,ry,sx,sy,sz,rz){ _e.set(0,ry||0,rz||0); _q.setFromEuler(_e); _v.set(x,y,z); _s.set(sx,sy,sz); _m.compose(_v,_q,_s); im.setMatrixAt(i,_m); }
function rebuildBelts(belts){ let i=0; belts.forEach(b=>{ const x=cellX(b.c), z=cellZ(b.r), ry=-b.dir*Math.PI/2;
  setInst(BELT.frame,i,x,.2,z,ry,2,.4,1.25); setInst(BELT.top,i,x,.405,z,ry,1,1,1); i++; });
  BELT.frame.count=BELT.top.count=i; BELT.frame.instanceMatrix.needsUpdate=BELT.top.instanceMatrix.needsUpdate=true; }
const COL={bare:'#9CA3AF', paint:'#22C55E', gold:'#FBBF24', bad:'#7F8F3A', crate:'#C8935A', crateGold:'#E3B341'};
function drawItems(list){ const n={sheet:0,part:0,body:0,head:0,eye:0,crate:0};
  for(const e of list){ const it=e.it, x=e.x, y=e.y, z=e.z, ry=e.ry||0;
    if(it.s===0){ if(n.sheet<520) setInst(ITEM.sheet,n.sheet++,x,y+.05,z,ry,.78,.08,.62); }
    else if(it.s===1){ if(n.part<520){ setInst(ITEM.part,n.part++,x,y+.1,z,ry,1.3,1.3,1.3); } }
    else if(it.b){ if(n.crate<520){ setInst(ITEM.crate,n.crate,x,y+.3,z,ry,.62,.58,.62); ITEM.crate.setColorAt(n.crate++,_c.set(it.x?COL.crateGold:COL.crate)); } }
    else { const tilt=it.d&&it.s>=3?.42:0, c=_c.set(it.s===2?COL.bare:it.d?COL.bad:it.x?COL.gold:COL.paint);
      if(n.body<520){ setInst(ITEM.body,n.body,x,y+.22,z,ry,.46,.44,.4); ITEM.body.setColorAt(n.body++,c);
        setInst(ITEM.head,n.head,x,y+.58,z,ry,.36,.28,.34,tilt); ITEM.head.setColorAt(n.head++,c);
        if(it.s>=3) setInst(ITEM.eye,n.eye++,x+Math.cos(ry)*.18,y+.6,z-Math.sin(ry)*.18,ry,.04,.09,.26,tilt); } } }
  for(const k in n){ const im=ITEM[k]; im.count=n[k]; im.instanceMatrix.needsUpdate=true; if(im.instanceColor) im.instanceColor.needsUpdate=true; } }

/* ---------- trucks ---------- */
function makeTruck(color,label,sub,sp){ const g=new THREE.Group(), body=new THREE.Group(); g.add(body);
  bx(body,5.2,.35,1.9,0,.5,0,MM.dark); bx(body,1.5,1.5,1.9,2.0,.85,0,mat(color,{roughness:.35, metalness:.3})); bx(body,.06,.6,1.6,2.76,1.5,0,new THREE.MeshStandardMaterial({color:'#0B1220', metalness:.6, roughness:.1}));
  bx(body,3.5,2.0,2.0,-.65,.85,0,mat('#F8FAFC',{roughness:.6}));
  if(sp){ const tex=sponsorTex(sp,{w:1024,h:340,kicker:sp.placeholder?'':(label==='STEEL CO.'?'Steel supplied by':'Shipping by')}); [1.01,-1.01].forEach(s=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(3.3,1.1),new THREE.MeshStandardMaterial({map:tex,roughness:.5})); m.position.set(-.65,1.95,s); if(s<0) m.rotation.y=Math.PI; body.add(m); }); }
  else [1.01,-1.01].forEach(s=>sign(body,[{t:label,color:'#0B1220'},{t:sub,size:34,weight:700,color:'#475569'}],3.2,1.1,-.65,1.95,s,{bg:'#F8FAFC',size:64,w:768,h:256,ry:s>0?0:Math.PI}));
  const tire=mat('#111318',{roughness:.85}); [[1.9,1],[1.9,-1],[-1.4,1],[-1.4,-1],[-.5,1],[-.5,-1]].forEach(([x,s])=>{ const w=new THREE.Mesh(CYL,tire); w.scale.set(.42,.3,.42); w.rotation.x=Math.PI/2; w.position.set(x,.42,s*.88); w.castShadow=true; body.add(w); });
  const sh=blob(1); sh.scale.set(6,2.6,1); g.add(sh); g.traverse(o=>{ if(o.isMesh&&o!==sh) o.castShadow=true; }); return g; }

/* ---------- particles + floating text ---------- */
const FXPOOL=[];
function puff(x,y,z,color,n=6,o={}){ for(let i=0;i<n;i++){ let p=FXPOOL.find(f=>!f.on); if(!p){ if(FXPOOL.length>60) return; const m=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({transparent:true,depthWrite:false})); scene.add(m); p={m,on:false}; FXPOOL.push(p); }
  p.on=true; p.m.visible=true; p.m.material.color.set(color); p.m.material.opacity=o.op||.8; p.m.position.set(x+rand(-.2,.2),y,z+rand(-.2,.2)); p.v=new THREE.Vector3(rand(-1,1)*(o.spread||1),rand(1,2.5)*(o.up||1),rand(-1,1)*(o.spread||1)); p.life=p.max=o.life||.8; p.s=o.size||.12; p.g=o.g==null?4:o.g; } }
function stepFx(dt){ for(const p of FXPOOL){ if(!p.on) continue; p.life-=dt; if(p.life<=0){ p.on=false; p.m.visible=false; continue; } p.v.y-=p.g*dt; p.m.position.addScaledVector(p.v,dt); const k=p.life/p.max; p.m.scale.setScalar(p.s*(p.g<0?(2-k):1)); p.m.material.opacity=k*.85; } }
function floatText(x,y,z,html,cls){ const e=document.createElement('div'); e.className='floater '+(cls||''); e.innerHTML=html; $('#floaters').appendChild(e); W.floaters.push({e, p:new THREE.Vector3(x,y,z), t:0}); if(W.floaters.length>14){ const f=W.floaters.shift(); f.e.remove(); } }
function stepFloaters(dt){ for(let i=W.floaters.length-1;i>=0;i--){ const f=W.floaters[i]; f.t+=dt; if(f.t>1.6){ f.e.remove(); W.floaters.splice(i,1); continue; }
  _v.copy(f.p); _v.y+=f.t*1.2; _v.project(camera); if(_v.z>1){ f.e.style.opacity=0; continue; } f.e.style.transform=`translate(${(_v.x*.5+.5)*innerWidth}px,${(-_v.y*.5+.5)*innerHeight}px) translate(-50%,-50%)`; f.e.style.opacity=f.t<1.1?1:(1.6-f.t)*2; } }

/* ---------- camera ---------- */
const CAM={tx:-8, tz:-6, yaw:.62, pitch:.92, dist:27, min:9, max:62, goal:null};
function updateCam(){ const cp=Math.cos(CAM.pitch); camera.position.set(CAM.tx+CAM.dist*cp*Math.sin(CAM.yaw), CAM.dist*Math.sin(CAM.pitch), CAM.tz+CAM.dist*cp*Math.cos(CAM.yaw)); camera.lookAt(CAM.tx,0,CAM.tz);
  sun.position.set(CAM.tx+22,42,CAM.tz+18); sun.target.position.set(CAM.tx,0,CAM.tz); }
function panCam(dx,dy){ const k=CAM.dist*.0016*(innerHeight>0?900/innerHeight:1); const s=Math.sin(CAM.yaw), c=Math.cos(CAM.yaw);
  CAM.tx-= (dx*c + dy*s)*k; CAM.tz-= (-dx*s + dy*c)*k; CAM.tx=clamp(CAM.tx,OX-6,-OX+6); CAM.tz=clamp(CAM.tz,OZ-6,-OZ+6); }

function initThree(){
  renderer=new THREE.WebGLRenderer({canvas:$('#gl'), antialias:!MOBILE, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE?1.0:1.5)); renderer.setSize(innerWidth,innerHeight); renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=.9;
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(45, innerWidth/innerHeight, .1, 400);
  hemi=new THREE.HemisphereLight('#DBEAFE','#3F3A36',.55); scene.add(hemi);
  sun=new THREE.DirectionalLight('#FFF1D6',1.35); sun.castShadow=true; const sz=MOBILE?1024:2048; sun.shadow.mapSize.set(sz,sz); Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:120}); sun.shadow.bias=-.0005; sun.shadow.normalBias=.02; scene.add(sun); scene.add(sun.target);
  const pm=new THREE.PMREMGenerator(renderer); const env=new THREE.Scene(); env.background=new THREE.Color('#6B7F95'); const l1=new THREE.Mesh(new THREE.PlaneGeometry(40,10),new THREE.MeshBasicMaterial({color:'#FFFFFF'})); l1.position.set(0,12,-10); l1.lookAt(0,0,0); env.add(l1); scene.environment=pm.fromScene(env,.04).texture;
  addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
}
