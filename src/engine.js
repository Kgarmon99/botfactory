/* =====================================================================
   BOTFACTORY · engine: renderer, post, rigs, player, camera, input,
   particles, sound, and the small UI helpers. Built on the BotBank engine.
   ===================================================================== */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const TOUCH=('ontouchstart' in window)||navigator.maxTouchPoints>0;
const MOBILE=TOUCH&&Math.min(screen.width,screen.height)<820;
const PARAMS=new URLSearchParams(location.search);
const Q={t:PARAMS.has('q')?+PARAMS.get('q'):(/CrOS/.test(navigator.userAgent)||MOBILE?1:2)};
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const lerp=(a,b,t)=>a+(b-a)*t, angDiff=(a,b)=>((a-b+Math.PI*3)%(Math.PI*2))-Math.PI;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let renderer,scene,camera,hemi,sun,composer=null,finalPass=null;
const BOX=new THREE.BoxGeometry(1,1,1),CYL=new THREE.CylinderGeometry(1,1,1,24),SPH=new THREE.SphereGeometry(1,20,14);
const MATS={};
function mat(c,o){const k=c+(o?JSON.stringify(o):'');return MATS[k]||(MATS[k]=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.6,metalness:.04},o||{})));}
function bx(g,w,h,d,x,y,z,m,cast){const e=new THREE.Mesh(BOX,m);e.scale.set(w,h,d);e.position.set(x,y+h/2,z);e.castShadow=cast!==false&&Q.t>0;e.receiveShadow=true;g.add(e);return e;}
function cy(g,r,h,x,y,z,m,cast){const e=new THREE.Mesh(CYL,m);e.scale.set(r,h,r);e.position.set(x,y+h/2,z);e.castShadow=cast!==false&&Q.t>0;e.receiveShadow=true;g.add(e);return e;}
function sp(g,r,x,y,z,m){const e=new THREE.Mesh(SPH,m);e.scale.setScalar(r);e.position.set(x,y,z);g.add(e);return e;}
function canvasTex(w,h,fn,rep){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=Q.t>=2?8:2;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);}t.userData.canvas=c;return t;}
/* text sign texture: lines [{t,size,color,weight}] */
function textTex(lines,o={}){return canvasTex(o.w||512,o.h||128,(g,w,h)=>drawLines(g,w,h,lines,o));}
function drawLines(g,w,h,lines,o){g.clearRect(0,0,w,h);if(o.bg){g.fillStyle=o.bg;g.beginPath();g.roundRect(o.inset||0,o.inset||0,w-2*(o.inset||0),h-2*(o.inset||0),o.r||0);g.fill();}
  if(o.border){g.strokeStyle=o.border;g.lineWidth=o.bw||6;g.beginPath();g.roundRect(o.bw/2||3,o.bw/2||3,w-(o.bw||6),h-(o.bw||6),o.r||0);g.stroke();}
  if(o.img){const im=o.img,s=Math.min(h*.78/im.height,w*.3/im.width);g.drawImage(im,o.imgX||h*.12,(h-im.height*s)/2,im.width*s,im.height*s);}
  const L=Array.isArray(lines)?lines:[lines],cx=o.img?(w+(o.imgX||h*.12)+h*.8)/2:w/2,maxW=(o.img?w-h*.95:w)*.9;
  L.forEach((ln,i)=>{const li=leadIcon(ln.t!=null?ln.t:ln),t=li.t;let sz=ln.size||o.size||64;const ff=ln.font||o.font||"'Barlow Condensed', 'Arial Narrow', system-ui, sans-serif",wt=ln.weight||o.weight||700;
    g.font=`${wt} ${sz}px ${ff}`;const iw=()=>li.n?sz*1.05:0;while(g.measureText(t).width+iw()>maxW&&sz>10){sz-=2;g.font=`${wt} ${sz}px ${ff}`;}
    const col=ln.color||o.color||'#fff',y=h*(L.length===1?.54:(i+.62)/L.length);g.fillStyle=col;g.textBaseline='middle';
    if(li.n){const s=sz*.82,gap=sz*.22,tw=g.measureText(t).width,x0=cx-(s+gap+tw)/2;drawIc(g,li.n,x0,y-s/2,s,col,Math.max(1.6,24/s*sz/22));g.textAlign='left';g.fillText(t,x0+s+gap,y);}
    else{g.textAlign='center';g.fillText(t,cx,y);}});}
function signMesh(lines,w,h,o={}){const tex=textTex(lines,Object.assign({w:Math.round(256*Math.max(1,w/h)),h:256},o));const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,transparent:!!o.transparent,roughness:.5,emissive:'#fff',emissiveMap:o.glow?tex:null,emissiveIntensity:o.glow||0}));return m;}
function spriteLabel(lines,o={}){const tex=textTex(lines,Object.assign({w:512,h:128,bg:'rgba(13,17,23,.88)',r:36,size:56},o));const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));const sw=o.sw||2.4;s.scale.set(sw,sw*(o.h||128)/(o.w||512),1);s.renderOrder=6;s.userData.o=Object.assign({w:512,h:128,bg:'rgba(13,17,23,.88)',r:36,size:56},o);return s;}
function relabel(s,lines,o){const t=s.material.map,c=t.userData.canvas;drawLines(c.getContext('2d'),c.width,c.height,lines,Object.assign({},s.userData.o,o||{}));t.needsUpdate=true;}

/* ----- renderer, lights, post ----- */
const FINAL={uniforms:{tDiffuse:{value:null},exposure:{value:.74},vig:{value:.85},time:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform float exposure,vig,time;varying vec2 vUv;
  vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
  void main(){vec3 c=aces(texture2D(tDiffuse,vUv).rgb*exposure);
    float l=dot(c,vec3(.2126,.7152,.0722));c=max(mix(vec3(l),c,1.16),0.);
    c*=mix(vec3(.96,1.,1.05),vec3(1.05,1.,.93),smoothstep(.15,.8,l));
    vec2 p=vUv-.5;c*=1.-vig*dot(p,p)*.85;
    c=mix(c*12.92,1.055*pow(max(c,vec3(.0031308)),vec3(.41667))-.055,step(.0031308,c));
    c+=(fract(sin(dot(gl_FragCoord.xy+time,vec2(12.9898,78.233)))*43758.5453)-.5)/190.;
    gl_FragColor=vec4(c,1.);}`};
function initThree(){const cv=$('#gl');
  renderer=new THREE.WebGLRenderer({canvas:cv,antialias:Q.t>=1,powerPreference:'high-performance',preserveDrawingBuffer:PARAMS.has('test')});
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.72;
  renderer.shadowMap.enabled=Q.t>=1;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();scene.background=new THREE.Color('#6F9CC4');scene.fog=new THREE.Fog('#86AECF',110,360);
  camera=new THREE.PerspectiveCamera(42,1,.3,700);
  hemi=new THREE.HemisphereLight(0xE8F0FF,0x2E333B,.5);scene.add(hemi);
  sun=new THREE.DirectionalLight(0xFFEBCF,1.6);sun.position.set(-24,40,30);sun.castShadow=Q.t>=1;const sz=Q.t>=2?2048:1024;sun.shadow.mapSize.set(sz,sz);
  const sc=sun.shadow.camera;sc.left=-34;sc.right=34;sc.top=34;sc.bottom=-34;sc.near=1;sc.far=140;sun.shadow.radius=4;sun.shadow.bias=-.0012;sun.shadow.normalBias=.05;scene.add(sun);scene.add(sun.target);
  if(Q.t>=1){const e=new THREE.Scene();e.background=new THREE.Color('#C9D3DC');const pan=(c,x,y,z,w,h,ry,rx)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.set(rx||0,ry||0,0);e.add(m);};
    pan('#FFFFFF',0,9,0,14,14,0,Math.PI/2);pan('#2B3138',0,-8,0,30,30,0,Math.PI/2);pan('#FFE6B0',-10,2,0,6,12,Math.PI/2);pan('#B9E6FF',10,2,0,6,12,Math.PI/2);pan('#3A4652',0,2,-10,14,6);
    const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(e,.04).texture;pm.dispose();}
  if(Q.t>=2&&!PARAMS.has('nopost')){const sz2=new THREE.Vector2(innerWidth*Math.min(devicePixelRatio,1.5),innerHeight*Math.min(devicePixelRatio,1.5));
    const rt=new THREE.WebGLRenderTarget(sz2.x,sz2.y,{type:THREE.HalfFloatType,samples:renderer.capabilities.isWebGL2?4:0});
    composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));
    composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(sz2.x/2,sz2.y/2),.26,.45,1.4));
    finalPass=new THREE.ShaderPass(FINAL);composer.addPass(finalPass);renderer.toneMapping=THREE.NoToneMapping;}
  resize();addEventListener('resize',resize);}
function resize(){const pr=Math.min(devicePixelRatio,Q.t>=2?1.5:1);renderer.setPixelRatio(pr);renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<innerHeight?58:42;camera.updateProjectionMatrix();
  if(composer){const sz=renderer.getDrawingBufferSize(new THREE.Vector2());composer.setSize(sz.x,sz.y);}const c=$('#confetti');if(c){c.width=innerWidth*pr;c.height=innerHeight*pr;}}
function renderFrame(t){if(composer){finalPass.uniforms.time.value=t%10;composer.render();}else renderer.render(scene,camera);}

/* ----- MoneyBot rigs (same models + emotes as BotBank) ----- */
const GLTF={},MB={};
function setupMaterials(){
  MB.face=new THREE.MeshStandardMaterial({color:'#05070D',roughness:.18,metalness:.1});
  MB.coin=new THREE.MeshStandardMaterial({color:'#FBBF24',roughness:.35,metalness:.45,emissive:'#F59E0B',emissiveIntensity:.3});
  MB.hero=new THREE.MeshStandardMaterial({color:'#F8FAFC',roughness:.24,metalness:.05});
  MB.eye={g:new THREE.MeshStandardMaterial({color:'#16A34A',emissive:'#22C55E',emissiveIntensity:1,roughness:.6}),y:new THREE.MeshStandardMaterial({color:'#D97706',emissive:'#F59E0B',emissiveIntensity:1,roughness:.6}),r:new THREE.MeshStandardMaterial({color:'#B91C1C',emissive:'#EF4444',emissiveIntensity:1.1,roughness:.6}),b:new THREE.MeshStandardMaterial({color:'#1D4ED8',emissive:'#38BDF8',emissiveIntensity:1.1,roughness:.6})};
  MB.crew=['#F8FAFC','#BFDBFE','#FDE68A','#BBF7D0','#FED7AA','#DDD6FE','#A5F3FC'].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.3,metalness:.08}));
  MB.hat=mat('#FACC15',{roughness:.35,metalness:.1});MB.hatW=mat('#F8FAFC',{roughness:.3});MB.vest=mat('#F97316',{roughness:.5,emissive:'#7C2D12',emissiveIntensity:.15});}
function parseGLB(b64){const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)).buffer;return new Promise((res,rej)=>new THREE.GLTFLoader().parse(bin,'',res,rej));}
function emoteClips(){const out=[],J=MB_ASSETS.joints.map(n=>THREE.PropertyBinding.sanitizeNodeName(n));for(const name in MB_ASSETS.clips){const c=MB_ASSETS.clips[name],tr=[];c.tracks.forEach(t=>{const nm=J[t.j];if(t.p==='r')tr.push(new THREE.QuaternionKeyframeTrack(nm+'.quaternion',t.k,t.v));else if(t.p==='t')tr.push(new THREE.VectorKeyframeTrack(nm+'.position',t.k,t.v));else tr.push(new THREE.VectorKeyframeTrack(nm+'.scale',t.k,t.v));});out.push(new THREE.AnimationClip(name,c.dur,tr));}return out;}
let blobT=null;function blob(sz){if(!blobT)blobT=canvasTex(64,64,(g)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(0,0,0,.42)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,64,64);});const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:blobT,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.scale.set(sz,sz,1);m.renderOrder=1;return m;}
function makeRig(gltf,body,height,eye){
  const model=THREE.SkeletonUtils.clone(gltf.scene),eyes=[];
  model.traverse(o=>{if(!o.isMesh)return;o.frustumCulled=false;o.castShadow=Q.t>0;const n=(o.material&&o.material.name)||'';if(n==='Silver')o.material=body;else if(n==='eyes'){o.material=MB.eye[eye||'g'];eyes.push(o);}else if(n==='Face'||n==='Hat')o.material=MB.face;else if(n==='Coin')o.material=MB.coin;else if(!n)o.material=body;});
  const root=new THREE.Group();root.add(model);const mixer=new THREE.AnimationMixer(model),acts={};gltf.animations.forEach(c=>acts[c.name]=mixer.clipAction(c));acts.Idle.play();mixer.update(Math.random()*1.5);
  const box=new THREE.Box3().setFromObject(model),h=box.max.y-box.min.y,s=height/h;model.position.y=-box.min.y;root.scale.setScalar(s);
  const rig={root,model,mixer,acts,eyes,cur:'Idle',bones:{},body};model.traverse(o=>{if(o.isBone)rig.bones[o.name]=o;});
  mixer.addEventListener('finished',()=>rigPlay(rig,'Idle'));root.add(blob(4.6));return rig;}
function rigPlay(rig,name,once){const a=rig.acts[name];if(!a||(rig.cur===name&&!once))return;const prev=rig.acts[rig.cur];a.reset();a.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);a.clampWhenFinished=false;a.play();if(prev&&prev!==a)prev.crossFadeTo(a,.2,false);rig.cur=name;}
function rigEye(rig,e){rig.eyes.forEach(m=>m.material=MB.eye[e]);}
/* hard hat (+ optional safety vest) so every bot on the floor looks the part */
function hardHat(rig,m){const hd=rig.bones.Head;if(!hd)return;const h=new THREE.Group(),dome=new THREE.Mesh(new THREE.SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI/2),m||MB.hat);dome.scale.set(.86,.62,.86);h.add(dome);
  const brim=new THREE.Mesh(CYL,m||MB.hat);brim.scale.set(1.02,.05,1.08);brim.position.set(0,.02,.12);h.add(brim);const ridge=new THREE.Mesh(BOX,m||MB.hat);ridge.scale.set(.16,.12,1.3);ridge.position.y=.5;h.add(ridge);h.position.set(0,1.18,0);hd.add(h);return h;}
function vest(rig){const b=rig.bones.Spine2||rig.bones.Spine1;if(!b)return;const v=new THREE.Mesh(new THREE.CylinderGeometry(1,1.08,1,20,1,true),MB.vest);v.material.side=THREE.DoubleSide;v.scale.set(.98,.82,.86);v.position.set(0,.18,.05);b.add(v);
  const st=new THREE.Mesh(new THREE.CylinderGeometry(1.005,1.005,.1,20,1,true),mat('#E5E7EB',{emissive:'#ffffff',emissiveIntensity:.35,side:THREE.DoubleSide}));st.scale.set(.99,1,.87);st.position.set(0,.1,.05);b.add(st);}
const ICONS={};function iconTex(ch,bg){const k=ch+(bg||'');if(ICONS[k])return ICONS[k];const n=emoName(ch)||'warn';return ICONS[k]=canvasTex(96,96,(g)=>{g.fillStyle=bg||'rgba(17,22,29,.94)';g.beginPath();g.moveTo(48,4);g.lineTo(90,48);g.lineTo(48,92);g.lineTo(6,48);g.closePath();g.fill();g.strokeStyle='#FACC15';g.lineWidth=4;g.stroke();drawIc(g,n,26,26,44,'#fff',2.4);});}
function bubble(){const s=new THREE.Sprite(new THREE.SpriteMaterial({depthTest:false,transparent:true}));s.scale.set(.75,.75,1);s.renderOrder=9;s.visible=false;scene.add(s);return s;}
function setBubble(s,ch,bg){if(!ch){s.visible=false;s.userData.c=null;return;}s.visible=true;if(s.userData.c!==ch+(bg||'')){s.userData.c=ch+(bg||'');s.material.map=iconTex(ch,bg);s.material.needsUpdate=true;}}

/* ----- player + camera ----- */
const P={pos:V(-8,0,4.2),ry:Math.PI,vel:V(),rig:null,bob:0,target:null};
const camS={yaw:0,dist:19,pitch:.78,look:V(0,1,0),mode:'title',over:false,shake:0};
const keys={},joy={x:0,y:0},COLL=[];
const ray=new THREE.Raycaster(),groundP=new THREE.Plane(V(0,1,0),0);
let ringM=null;
function tapWalk(cx,cy){if(blocked())return;const n=new THREE.Vector2(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);ray.setFromCamera(n,camera);const h=V();if(ray.ray.intersectPlane(groundP,h)){P.target=h;if(!ringM){ringM=new THREE.Mesh(new THREE.RingGeometry(.28,.38,32),new THREE.MeshBasicMaterial({color:'#39E75F',transparent:true}));ringM.rotation.x=-Math.PI/2;scene.add(ringM);}ringM.position.set(h.x,.05,h.z);ringM.material.opacity=1;}}
function collide(p,r){for(const c of COLL){if(c.off)continue;const nx=clamp(p.x,c.x0,c.x1),nz=clamp(p.z,c.z0,c.z1),dx=p.x-nx,dz=p.z-nz,d=dx*dx+dz*dz;if(d<r*r){if(d>1e-6){const L=Math.sqrt(d);p.x=nx+dx/L*r;p.z=nz+dz/L*r;}else{const a=[p.x-c.x0,c.x1-p.x,p.z-c.z0,c.z1-p.z],m=Math.min(...a);if(m===a[0])p.x=c.x0-r;else if(m===a[1])p.x=c.x1+r;else if(m===a[2])p.z=c.z0-r;else p.z=c.z1+r;}}}}
function updatePlayer(dt){
  let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x,iz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+joy.y;
  const c=Math.cos(camS.yaw),s=Math.sin(camS.yaw);let dx=ix*c+iz*s,dz=-ix*s+iz*c;if(Math.hypot(ix,iz)>.05)P.target=null;
  if(P.target){const tx=P.target.x-P.pos.x,tz=P.target.z-P.pos.z,L=Math.hypot(tx,tz);if(L<.25)P.target=null;else{dx=tx/L;dz=tz/L;}}
  const L=Math.hypot(dx,dz),moving=L>.05,spd0=(keys.ShiftLeft||keys.ShiftRight?11:7.5)*(P.speedMul||1);
  const tv=V(moving?dx/Math.max(1,L)*spd0:0,0,moving?dz/Math.max(1,L)*spd0:0);P.vel.lerp(tv,1-Math.exp(-12*dt));if(blocked())P.vel.set(0,0,0);
  P.pos.addScaledVector(P.vel,dt);walkClamp(P.pos);collide(P.pos,.46);
  const spd=P.vel.length();if(spd>.3)P.ry+=angDiff(Math.atan2(P.vel.x,P.vel.z),P.ry)*Math.min(1,dt*12);
  P.bob+=dt*spd*2.1;const r=P.rig.root;r.position.set(P.pos.x,Math.abs(Math.sin(P.bob))*.09*Math.min(1,spd/3),P.pos.z);r.rotation.set(Math.min(.2,spd*.022),P.ry,0,'YXZ');P.rig.mixer.update(dt);
  if(ringM&&ringM.material.opacity>0)ringM.material.opacity-=dt*1.5;}
function updateCamera(dt,t){
  if(camS.mode==='title'){const a=Math.sin(t*.07)*.35,c=hallCenter();const p=V(c.x+Math.sin(a)*34+6,15+Math.sin(t*.11)*1.5,c.z+22+Math.cos(a)*12);camera.position.lerp(p,1-Math.exp(-1.2*dt));camS.look.lerp(V(c.x,1.5,c.z-2),1-Math.exp(-2*dt));camera.lookAt(camS.look);return;}
  if(camS.mode==='cine'&&camS.cineHard){camera.position.copy(camS.cinePos);camS.look.copy(camS.cineLook);camera.lookAt(camS.look);return;}
  if(camS.mode==='cine'){camera.position.lerp(camS.cinePos,1-Math.exp(-1.6*dt));camS.look.lerp(camS.cineLook,1-Math.exp(-2.2*dt));camera.lookAt(camS.look);return;}
  let d=camS.dist,lx=P.pos.x,lz=P.pos.z-1.5;if(camS.over){const c=hallCenter(),B=hallBounds();d=Math.max(40,(B.x1-B.x0)*1.25,(B.z1-B.z0)*1.5);lx=c.x;lz=c.z;}
  const cp=Math.cos(camS.pitch),sp2=Math.sin(camS.pitch),want=V(lx+Math.sin(camS.yaw)*cp*d,sp2*d+1,lz+Math.cos(camS.yaw)*cp*d);
  camera.position.lerp(want,1-Math.exp(-5*dt));camS.look.lerp(V(lx,.8,lz),1-Math.exp(-7*dt));
  if(camS.shake>0){camS.shake-=dt;camera.position.x+=rand(-.08,.08)*camS.shake*4;camera.position.y+=rand(-.06,.06)*camS.shake*4;}
  camera.lookAt(camS.look);}
function initInput(){
  addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;keys[e.code]=true;if(blocked())return;
    if(e.code==='KeyE'||e.code==='Enter')doAction();if(e.code==='Space'){e.preventDefault();togglePause();}
    if(e.code==='Digit1')setSpeed(1);if(e.code==='Digit2')setSpeed(2);if(e.code==='Digit3')setSpeed(3);if(e.code==='KeyQ')camS.yaw-=.35;if(e.code==='KeyR')camS.yaw+=.35;if(e.code==='KeyV')toggleOverview();if(e.code==='KeyT')toggleTwin();if(e.code==='KeyF'&&(CX.riding||nearFork()))toggleRide();if(e.code==='KeyH'&&CX.riding)sfx('horn');});
  addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
  const cv=$('#gl');let down=null;
  cv.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,yaw:camS.yaw,t:performance.now()};});
  cv.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x;if(Math.abs(dx)>(TOUCH?14:10))camS.yaw=clamp(down.yaw-dx*.006,-1.15,1.15);});
  cv.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<9&&performance.now()-down.t<400)tapWalk(e.clientX,e.clientY);down=null;});
  addEventListener('wheel',e=>{if(blocked())return;camS.dist=clamp(camS.dist+e.deltaY*.012,10,36);},{passive:true});
  const st=$('#stick'),nub=$('#stick i');let id=null;const mv=e=>{const r=st.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,L=Math.min(46,Math.hypot(x,y)),a=Math.atan2(y,x);joy.x=Math.cos(a)*L/46;joy.y=Math.sin(a)*L/46;nub.style.transform=`translate(${joy.x*40}px,${joy.y*40}px)`;};
  st.addEventListener('pointerdown',e=>{id=e.pointerId;st.setPointerCapture(id);mv(e);});st.addEventListener('pointermove',e=>{if(e.pointerId===id)mv(e);});const end=()=>{id=null;joy.x=joy.y=0;nub.style.transform='';};st.addEventListener('pointerup',end);st.addEventListener('pointercancel',end);}
const v3=V();function project(x,y,z){v3.set(x,y,z).project(camera);return {x:(v3.x+1)/2*innerWidth,y:(1-v3.y)/2*innerHeight,on:v3.z<1&&v3.z>-1};}

/* ----- particles: sparks, smoke, paint mist (one pool, additive or normal) ----- */
const FX={pool:[],add:null,norm:null};
function initFX(){const mk=(blend)=>{const N=Q.t>=2?420:220,m=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,4),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,blending:blend,vertexColors:false}),N);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.setColorAt(0,new THREE.Color());m.count=0;m.frustumCulled=false;m.renderOrder=4;scene.add(m);return {m,N,p:[]};};FX.add=mk(THREE.AdditiveBlending);FX.norm=mk(THREE.NormalBlending);}
function burst(x,y,z,o){const L=o.add?FX.add:FX.norm,n=o.n||8;for(let i=0;i<n;i++){if(L.p.length>=L.N)L.p.shift();const a=Math.random()*6.283,s=rand(.3,1)*(o.spread||2);
  L.p.push({x:x+rand(-.05,.05),y,z:z+rand(-.05,.05),vx:Math.cos(a)*s,vy:rand(.4,1.2)*(o.up||2.5),vz:Math.sin(a)*s,g:o.g==null?9:o.g,life:o.life||.5,max:o.life||.5,size:o.size||.04,grow:o.grow||0,col:new THREE.Color(o.color||'#FFD27A')});}}
const _m4=new THREE.Matrix4(),_c=new THREE.Color();
function stepFX(dt){[FX.add,FX.norm].forEach(L=>{let n=0;L.p=L.p.filter(p=>(p.life-=dt)>0);for(const p of L.p){p.vy-=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.y<.02){p.y=.02;p.vy*=-.3;p.vx*=.6;p.vz*=.6;}
  const k=p.life/p.max,s=p.size*(1+p.grow*(1-k));_m4.makeScale(s,s,s).setPosition(p.x,p.y,p.z);L.m.setMatrixAt(n,_m4);_c.copy(p.col).multiplyScalar(L===FX.add?k*1.4:1);L.m.setColorAt(n,_c);n++;}
  L.m.count=n;L.m.instanceMatrix.needsUpdate=true;if(L.m.instanceColor)L.m.instanceColor.needsUpdate=true;L.m.material.opacity=L===FX.add?1:.55;});}

/* ----- sound ----- */
let AC=null,muted=false;try{muted=localStorage.getItem('botfactory-mute')==='1';}catch(e){}
function initAudio(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}
function tone(f,d,type,vol,when,slide){if(!AC||muted)return;const t=AC.currentTime+(when||0),o=AC.createOscillator(),g=AC.createGain();o.type=type||'triangle';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);g.gain.setValueAtTime(vol||.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+.02);}
function noise(d,vol,hp){if(!AC||muted)return;const len=Math.floor(AC.sampleRate*d),b=AC.createBuffer(1,len,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<len;i++)a[i]=(Math.random()*2-1)*(1-i/len);const s=AC.createBufferSource();s.buffer=b;const f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=hp||1200;const g=AC.createGain();g.gain.value=vol||.03;s.connect(f);f.connect(g);g.connect(AC.destination);s.start();}
function sfx(k){if(!AC)return;
  if(k==='tick')tone(900,.05,'square',.02);if(k==='open')tone(520,.08,'sine',.03);
  if(k==='good'){tone(660,.1,'triangle',.05);tone(990,.14,'triangle',.05,.09);}
  if(k==='bad')tone(200,.24,'sawtooth',.035,0,120);
  if(k==='coin'){tone(1320,.06,'square',.016);tone(1760,.1,'square',.016,.06);}
  if(k==='win')[523,659,784,1047].forEach((f,i)=>tone(f,.2,'triangle',.05,i*.1));
  if(k==='big')[392,523,659,784,1047,1319].forEach((f,i)=>tone(f,.26,'triangle',.05,i*.09));
  if(k==='alarm')[0,.3,.6].forEach(w=>tone(740,.2,'square',.03,w,520));
  if(k==='zap'){noise(.08,.04,2500);tone(1800,.06,'sawtooth',.012,0,600);}
  if(k==='clang'){tone(320,.18,'square',.04,0,180);noise(.06,.05,800);}
  if(k==='build'){noise(.25,.05,300);tone(140,.3,'sawtooth',.03,0,80);}
  if(k==='horn'){tone(220,.35,'sawtooth',.03);tone(277,.35,'sawtooth',.025);}}

/* ----- small UI helpers ----- */
let advT=0,confParts=[];
function toast(html,type){const el=document.createElement('div');el.className='toast '+(type||'');el.innerHTML=iconize(html);const T=$('#toasts');T.appendChild(el);while(T.children.length>3)T.firstChild.remove();setTimeout(()=>{el.style.opacity=0;setTimeout(()=>el.remove(),400);},3800);}
function advise(html,dur){$('#advText').innerHTML=iconize(html);$('#advisor').classList.remove('hide');clearTimeout(advT);advT=setTimeout(()=>$('#advisor').classList.add('hide'),dur||9000);}
function floatAt(x,y,z,t,c,big){const p=project(x,y,z);if(!p.on)return;const e=document.createElement('div');e.className='floaty'+(big?' big':'');e.innerHTML=iconize(esc(t));e.style.left=p.x+'px';e.style.top=p.y+'px';e.style.color=c||'#39E75F';$('#pins').appendChild(e);setTimeout(()=>e.remove(),1200);}
function confetti(n){const cols=['#39E75F','#FACC15','#F8FAFC','#F97316','#38BDF8'];for(let i=0;i<(n||150);i++)confParts.push({x:innerWidth/2+rand(-80,80),y:innerHeight*.3,vx:rand(-7,7),vy:rand(-12,-3),r:rand(0,6),vr:rand(-.3,.3),c:pick(cols),l:1});}
function drawConfetti(){const c=$('#confetti');if(!confParts.length){if(c.dataset.on){c.getContext('2d').clearRect(0,0,c.width,c.height);delete c.dataset.on;}return;}c.dataset.on=1;const g=c.getContext('2d'),d=c.width/innerWidth;g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,innerWidth,innerHeight);confParts.forEach(p=>{p.vy+=.25;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.l-=.008;g.save();g.translate(p.x,p.y);g.rotate(p.r);g.globalAlpha=Math.max(0,p.l);g.fillStyle=p.c;g.fillRect(-4,-2.5,8,5);g.restore();});confParts=confParts.filter(p=>p.l>0&&p.y<innerHeight+20);}
const MODALQ=[];
function modalOpen(){return !$('#modal').hidden;}
function openModal(html,o={}){const M=$('#modal'),C=$('#card');C.className=o.cls||'';C.innerHTML=iconize(html);M.hidden=false;sfx('open');const f=C.querySelector('[data-focus]');f&&setTimeout(()=>f.focus(),50);return C;}
function closeModal(){$('#modal').hidden=true;$('#card').innerHTML='';if(MODALQ.length){const f=MODALQ.shift();setTimeout(f,120);}}
function queueModal(f){if(modalOpen())MODALQ.push(f);else f();}
