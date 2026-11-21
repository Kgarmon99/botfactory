/* ===================== hero machines: industrial robot arms, laser cutter, weld cell effects, cleaner labels ===================== */
const HM={};
function heroMats(){if(HM.o)return;HM.o=mat('#F97316',{roughness:.32,metalness:.3});HM.dk=mat('#1F2937',{roughness:.4,metalness:.6});HM.st=mat('#CBD5E1',{roughness:.25,metalness:.9});
  HM.cu=mat('#B87333',{roughness:.3,metalness:.9});HM.cable=mat('#0B0F14',{roughness:.7});HM.yel=mat('#FACC15',{roughness:.5});HM.white=mat('#F8FAFC',{roughness:.5});
  HM.glow=new THREE.MeshBasicMaterial({color:'#EAF6FF',transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false});
  HM.halo=new THREE.MeshBasicMaterial({color:'#7CC4FF',transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false});
  HM.mist=new THREE.MeshBasicMaterial({color:'#FFFFFF',transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide});
  HM.redGlass=mat('#7F1D1D',{transparent:true,opacity:.35,roughness:.05,metalness:.2,emissive:'#DC2626',emissiveIntensity:.25});
  HM.laser=new THREE.MeshBasicMaterial({color:'#FF2E2E',transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});
  HM.laserHalo=new THREE.MeshBasicMaterial({color:'#FF6B6B',transparent:true,opacity:.25,blending:THREE.AdditiveBlending,depthWrite:false});
  HM.decal=new THREE.MeshBasicMaterial({map:canvasTex(256,64,(c,w,h)=>{c.fillStyle='#111418';c.fillRect(0,0,w,h);c.fillStyle='#F8FAFC';c.font="800 40px 'Barlow Condensed', sans-serif";c.textBaseline='middle';c.fillText('BOT-6',14,h/2+2);c.fillStyle='#FACC15';c.fillRect(150,14,92,36);c.fillStyle='#111418';c.font="700 22px 'Barlow Condensed', sans-serif";c.fillText('6-AXIS',160,h/2+2);})});}
/* a horizontal joint housing (axis along z) */
function joint(g,r,len,y){const j=new THREE.Mesh(CYL,HM.dk);j.scale.set(r,len,r);j.rotation.x=Math.PI/2;j.position.y=y||0;g.add(j);[-1,1].forEach(s=>{const c=new THREE.Mesh(CYL,HM.o);c.scale.set(r*.82,.05,r*.82);c.rotation.x=Math.PI/2;c.position.set(0,y||0,s*len/2);g.add(c);});return j;}
function makeArm(tool){heroMats();const g=new THREE.Group();
  /* base plate with bolts + riser */
  cy(g,.56,.1,0,0,0,HM.dk);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;cy(g,.035,.05,Math.cos(a)*.47,.1,Math.sin(a)*.47,HM.st,false);}cy(g,.4,.26,0,.1,0,HM.o);
  const tur=new THREE.Group();tur.position.y=.36;g.add(tur);cy(tur,.36,.32,0,0,0,HM.o);bx(tur,.5,.28,.34,-.28,.12,0,HM.dk);const mot=new THREE.Mesh(CYL,HM.dk);mot.scale.set(.13,.36,.13);mot.position.set(-.3,.42,.22);tur.add(mot);
  /* shoulder */
  const sh=new THREE.Group();sh.position.y=.6;tur.add(sh);joint(sh,.25,.56);const sm=new THREE.Mesh(CYL,HM.st);sm.scale.set(.15,.22,.15);sm.rotation.x=Math.PI/2;sm.position.set(0,0,.38);sh.add(sm);
  bx(sh,.32,1.2,.3,0,.05,0,HM.o);bx(sh,.36,.18,.34,0,.0,0,HM.dk);const dec=new THREE.Mesh(new THREE.PlaneGeometry(.52,.13),HM.decal);dec.rotation.z=Math.PI/2;dec.position.set(.165,.65,0);dec.rotation.y=Math.PI/2;sh.add(dec);
  const c1=new THREE.Mesh(CYL,HM.cable);c1.scale.set(.035,1.05,.035);c1.position.set(-.2,.62,.12);sh.add(c1);
  /* elbow + forearm */
  const el=new THREE.Group();el.position.y=1.25;sh.add(el);joint(el,.2,.46);bx(el,.3,.3,.28,-.05,-.24,0,HM.dk);
  const fa=new THREE.Mesh(CYL,HM.o);fa.scale.set(.14,.9,.14);fa.position.y=.5;el.add(fa);const c2=new THREE.Mesh(CYL,HM.cable);c2.scale.set(.03,.85,.03);c2.position.set(-.15,.5,.1);el.add(c2);
  bx(el,.2,.12,.2,0,.92,0,HM.dk);
  /* wrist + flange */
  const wr=new THREE.Group();wr.position.y=1.0;el.add(wr);joint(wr,.12,.3);cy(wr,.12,.06,0,.12,0,HM.st);
  let tip,glow=null,mist=null,fing=null;
  if(tool==='torch'){const neck=new THREE.Mesh(new THREE.TorusGeometry(.16,.04,8,16,Math.PI*.6),HM.dk);neck.position.set(-.16,.2,0);wr.add(neck);
    const noz=new THREE.Mesh(new THREE.CylinderGeometry(.035,.06,.2,10),HM.cu);noz.position.set(.02,.42,0);noz.rotation.z=-.5;wr.add(noz);tip=new THREE.Object3D();tip.position.set(.07,.52,0);wr.add(tip);
    glow=new THREE.Group();const core=new THREE.Mesh(SPH,HM.glow);core.scale.setScalar(.06);const halo=new THREE.Mesh(SPH,HM.halo);halo.scale.setScalar(.22);glow.add(core,halo);tip.add(glow);glow.visible=false;
    const wire=new THREE.Mesh(CYL,HM.cable);wire.scale.set(.03,.5,.03);wire.position.set(-.18,.3,-.1);wire.rotation.z=.6;wr.add(wire);}
  else if(tool==='spray'){bx(wr,.16,.24,.14,0,.26,0,HM.white);cy(wr,.09,.14,0,.38,-.12,HM.st);const nz=new THREE.Mesh(new THREE.CylinderGeometry(.02,.04,.12,8),HM.st);nz.position.y=.44;wr.add(nz);tip=new THREE.Object3D();tip.position.y=.5;wr.add(tip);
    mist=new THREE.Mesh(new THREE.ConeGeometry(.28,.8,16,1,true),HM.mist);mist.position.y=.42;mist.rotation.x=Math.PI;tip.add(mist);mist.visible=false;}
  else{bx(wr,.38,.1,.16,0,.2,0,HM.dk);fing=[-1,1].map(s=>{const f=new THREE.Group();f.position.set(s*.13,.25,0);bx(f,.05,.24,.12,0,0,0,HM.st);bx(f,.07,.05,.12,-s*.03,.2,0,HM.yel);wr.add(f);return f;});tip=new THREE.Object3D();tip.position.y=.42;wr.add(tip);}
  const led=sp(tur,.06,.18,.28,.3,mat('#39E75F',{emissive:'#39E75F',emissiveIntensity:1.5}));
  g.traverse(o=>{if(o.isMesh&&Q.t>=2)o.castShadow=true;});
  return {g,tur,sh,el,wr,tip,led,glow,mist,fing,ph:Math.random()*6};}
function poseArm(a,t,busy,kind,off){const s=busy?1:0;
  if(kind==='weld'){a.tur.rotation.y=off+Math.sin(t*1.6)*.35*s;a.sh.rotation.z=.55+Math.sin(t*2.2)*.12*s;a.el.rotation.z=1.15+Math.sin(t*3.1)*.15*s;a.wr.rotation.z=.4+Math.sin(t*5)*.08*s;
    if(a.glow){const on=busy&&Math.sin(t*23+a.ph*7)>-.55;a.glow.visible=on;if(on){const f=.8+Math.random()*.6;a.glow.scale.setScalar(f);}}}
  else if(kind==='spray'){a.tur.rotation.y=off+Math.sin(t*2.4)*.6*s;a.sh.rotation.z=.4+Math.sin(t*1.2)*.2*s;a.el.rotation.z=1.0;a.wr.rotation.z=.6+Math.sin(t*4)*.3*s;if(a.mist){a.mist.visible=busy;if(busy)a.mist.material.opacity=.12+Math.random()*.1;}}
  else{const c=(t*.9+a.ph)%1,k=busy?(c<.5?c*2:2-c*2):.3;a.tur.rotation.y=off+(busy?lerp(-.9,.9,k):0);a.sh.rotation.z=lerp(.25,.75,busy?Math.abs(Math.sin(c*Math.PI*2)):.2);a.el.rotation.z=lerp(.9,1.5,busy?Math.abs(Math.cos(c*Math.PI*2)):.6);a.wr.rotation.z=.6;
    if(a.fing){const open=busy?(c<.45||c>.95?.06:0):.04;a.fing[0].position.x=-.1-open;a.fing[1].position.x=.1+open;}}}

/* ---------- laser cutter + weld cell dressing, added after each station builds ---------- */
const _buildStation=buildStation;buildStation=function(L,l,k,force){const out=_buildStation(L,l,k,force),s=l.st[k];if(!s.built||!out.g||out.holo)return out;heroMats();const x=SLOT_X[k],z=L.z,g=out.g,T=s.tier;
  if(k==='cut'&&T>=1){/* slatted cutting bed, tinted guard glass, laser head with nozzle, beam halo, glowing cut line */
    const bed=new THREE.Group();for(let i=0;i<11;i++)bx(bed,.03,.12,1.4,-.85+i*.17,0,0,HM.st,false);bed.position.set(x,.58,z);g.add(bed);
    [-1,1].forEach(a=>{const gl=new THREE.Mesh(BOX,HM.redGlass);gl.scale.set(1.7,1.1,.03);gl.position.set(x,1.2,z+a*.92);g.add(gl);});
    const head=new THREE.Group();bx(head,.26,.3,.26,0,0,0,HM.dk);const nz=new THREE.Mesh(new THREE.CylinderGeometry(.04,.09,.22,10),HM.cu);nz.position.y=-.24;head.add(nz);head.position.set(x,1.5,z);g.add(head);out.lhead=head;
    if(out.beam){const h=new THREE.Mesh(BOX,HM.laserHalo);h.scale.set(.18,.85,.18);out.beam.parent.add(h);out.halo=h;}
    const cut=new THREE.Mesh(new THREE.PlaneGeometry(1,.035),HM.laser);cut.rotation.x=-Math.PI/2;cut.position.set(x,.8,z);g.add(cut);out.cutline=cut;
    for(let i=0;i<6;i++)bx(g,.18,.04,.04,x-.45+i*.18,2.05,z+.96,mat(i%2?'#FACC15':'#111418'),false);}
  if(k==='weld'&&T===2){/* turntable fixture between the arms + ceiling cable carrier */
    const tt=new THREE.Group();cy(tt,.5,.1,0,0,0,HM.dk);cy(tt,.45,.04,0,.1,0,HM.st);tt.position.set(x+.25,.6,z-1.4);g.add(tt);out.tt=tt;
    bx(g,2.6,.08,.3,x+.25,2.6,z-1.4,HM.dk,false);for(let i=0;i<8;i++)bx(g,.12,.12,.25,x-.9+i*.32,2.48,z-1.4,HM.cable,false);}
  if(T===2){/* robot cell sign plate */const pl=signMesh([{t:'ROBOT CELL',size:62,color:'#111418'},{t:'Authorized personnel only',size:30,color:'#111418'}],1.1,.36,{w:420,h:140,bg:'#FACC15'});pl.position.set(x-1.2,1.15,z-2.06);g.add(pl);}
  return out;};

/* ---------- molten weld beads that glow white, cool to orange, then dull red ---------- */
const BEADS=[];
function bead(x,y,z){if(BEADS.length>=48){const b=BEADS.shift();scene.remove(b.m);}const m=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({color:'#FFFFFF'}));m.scale.set(.05,.03,.05);m.position.set(x,y,z);scene.add(m);BEADS.push({m,t:0});}
const _bc=new THREE.Color(),BC=[new THREE.Color('#FFFFFF'),new THREE.Color('#FFD27A'),new THREE.Color('#FF6A1A'),new THREE.Color('#5B1A0A')];
function heroTick(dt,t,running){if(!S||!W.lines)return;
  for(let i=BEADS.length-1;i>=0;i--){const b=BEADS[i];b.t+=dt;const k=Math.min(2.999,b.t/.7);const a=Math.floor(k);_bc.copy(BC[a]).lerp(BC[a+1],k-a);b.m.material.color.copy(_bc);if(b.t>2.6){scene.remove(b.m);BEADS.splice(i,1);}}
  const showAll=camS.over||TWIN.on,px=P.pos.x,pz=P.pos.z;
  W.lines.forEach((L,i)=>{const l=S.lines[i];if(!l)return;ST_KEYS.forEach(k=>{const V2=L.st[k],s=l.st[k];if(!V2||!V2.g)return;const busy=running&&!!s.cur&&!s.broken&&!s.needsCode,x=SLOT_X[k],z=L.z;
    /* labels only when you're close, in overview, or in the digital twin */
    if(V2.label&&s.built){const d=Math.hypot(px-x,pz-(z-.6)),near=d<6.5;V2.label.visible=showAll||near||camS.mode==='title';}
    if(V2.lhead&&V2.beam){V2.lhead.position.x=V2.beam.position.x;if(V2.halo){V2.halo.visible=busy;V2.halo.position.copy(V2.beam.position);}if(V2.cutline){V2.cutline.visible=busy;const w=Math.abs(V2.beam.position.x-x)*2+.05;V2.cutline.scale.x=w;V2.cutline.position.x=x;}}
    if(V2.tt)V2.tt.rotation.y+=dt*(busy?1.2:.15);
    if(busy&&k==='weld'&&V2.arms&&Math.random()<dt*6){const a=pick(V2.arms);a.tip.getWorldPosition(_p);bead(_p.x,Math.max(.8,_p.y-.08),_p.z);}});});}
const _updateWorld=updateWorld;updateWorld=function(dt,t,running){_updateWorld(dt,t,running);try{heroTick(dt,t,running);}catch(e){}};

/* ---------- products show up as the real thing once they've been welded ---------- */
const _drawItems=drawItems;drawItems=function(t){if(!IT||!S)return;let n=0,m=0;prodFrame();
  const put=(it,x,y,z)=>{if(it.lvl>=2){const P2=PRODUCTS[it.p];prodAt(it.p,it.lvl>=4||(it.lvl>=3&&!P2.needs.includes('paint')),x,y,z,t);return;}if(n>=IT.N)return;itemLook(it);_p.set(x,y+_s.y/2,z);_q.identity();IT.base.setMatrixAt(n,_m4.compose(_p,_q,_s));IT.base.setColorAt(n,_col);n++;};
  S.lines.slice(0,linesNow()).forEach((l,i)=>{const z=LZ(i);l.belt.forEach(it=>put(it,it.x,.76,z));ST_KEYS.forEach(k=>{const s=l.st[k];if(s.cur)put(s.cur,SLOT_X[k],.76,z);if(s.out)put(s.out,SLOT_X[k]+.7,.76,z);});});
  IT.base.count=n;IT.top.count=m;IT.base.instanceMatrix.needsUpdate=true;if(IT.base.instanceColor)IT.base.instanceColor.needsUpdate=true;IT.top.instanceMatrix.needsUpdate=true;prodHide();};
