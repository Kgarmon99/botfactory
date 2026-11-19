/* =====================================================================
   BOTFACTORY · hands-on mini-games (touch + mouse)
   laser · weld · assemble · paint · qa · repair · program a robot
   ===================================================================== */
const MG={on:false,raf:0};
const MG_INFO={
  laser:{icon:'⚡',name:'Laser Cutting',title:'Cut the part',how:'Press and drag the laser head around the dotted outline. Stay on the line!',fact:'Real fiber lasers cut steel with a beam thinner than a hair, guided by a CNC program. CNC programmers write those cut paths.',secs:10},
  weld:{icon:'🔥',name:'Welding',title:'Weld the seam',how:'Press and drag the torch along the seam, start to finish. Smooth and steady makes the strongest weld.',fact:'A welding arc runs at over 6,000°F. Certified welders are some of the most in-demand people in manufacturing.',secs:9},
  assemble:{icon:'🔩',name:'Assembly',title:'Build it in order',how:'Tap the parts in the order on the build sheet. Wrong part = lost time.',fact:'Assembly lines follow a "work instruction" for every step. Doing it in the same order every time is how you get the same quality every time.',secs:9},
  paint:{icon:'🎨',name:'Paint & Coatings',title:'Coat the part',how:'Press and drag to spray. Cover the whole part, but every drop that misses is wasted paint (wasted money).',fact:'Paint is a variable cost: every product uses some. Robots spray more evenly and waste less, which is one reason plants automate painting.',secs:8},
  qa:{icon:'🔍',name:'Quality Inspection',title:'Find the defects',how:'Tap every unit with a defect: cracks, missing bolts, paint drips. Don\'t tap the good ones!',fact:'Catching a defect in the factory costs a little scrap. Missing it costs a refund, shipping and a customer\'s trust.',secs:8},
  repair:{icon:'🛠️',name:'Maintenance',title:'Fix the machine',how:'Tap when the needle is in the green zone. Hit it 3 times to get the machine running again.',fact:'Maintenance technicians keep a plant alive. Every minute a machine is down, the whole line behind it waits.',secs:10},
  program:{icon:'💻',name:'Robotics',title:'Program the robot',how:'Tap the instructions in the right order to write the robot\'s program, then hit RUN.',fact:'Robot technicians write programs exactly like this: a list of moves the robot repeats thousands of times a day, perfectly.',secs:0}
};
const PROGRAMS={cut:['Load steel sheet','Move to start point','Laser ON','Trace the cut path','Laser OFF','Unload the part'],
  weld:['Pick up the parts','Clamp them together','Move torch to the seam','Weld the seam','Unclamp','Place on the belt'],
  asm:['Pick up the frame','Insert the motor','Drive the screws','Connect the battery','Test power','Place on the belt'],
  paint:['Mask the parts that stay bare','Spray primer','Spray color coat','Move to curing oven','Check the finish','Place on the belt'],
  qa:['Scan the barcode','Take 3D measurements','Compare to the spec','Pass or reject','Log the result','Send to shipping']};
function mgShell(kind,extra){const I=MG_INFO[kind];return `<div class="mg"><div class="mg-top"><span class="mg-ic">${I.icon}</span><div><div class="eyebrow">Hands-on · ${I.name}</div><h2>${I.title}</h2></div>${I.secs?`<div class="mg-time"><b id="mgT">${I.secs.toFixed(1)}</b><small>sec</small></div>`:''}</div>
  <p class="mg-how">${I.how}</p>${extra||'<div class="mg-stage"><canvas id="mgC"></canvas><div class="mg-go" id="mgGo">Tap to start</div></div><div class="mg-bar"><i id="mgP"></i></div>'}</div>`;}
function mgCanvas(){const c=$('#mgC'),w=Math.min(560,innerWidth-48),h=Math.round(w*.56),pr=Math.min(2,devicePixelRatio);c.width=w*pr;c.height=h*pr;c.style.width=w+'px';c.style.height=h+'px';const g=c.getContext('2d');g.setTransform(pr,0,0,pr,0,0);return {c,g,w,h};}
function mgPointer(c,cb){const pos=e=>{const r=c.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};let down=false;
  c.onpointerdown=e=>{down=true;c.setPointerCapture(e.pointerId);cb('down',pos(e));};c.onpointermove=e=>cb(down?'drag':'move',pos(e));c.onpointerup=c.onpointercancel=e=>{down=false;cb('up',pos(e));};}
function mgTimer(secs,onTick,onEnd){let t=secs,last=performance.now();const loop=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;t-=dt;const el=$('#mgT');if(el)el.textContent=Math.max(0,t).toFixed(1);onTick(dt,t);if(t<=0||MG.stop){onEnd();return;}MG.raf=requestAnimationFrame(loop);};MG.stop=false;MG.raf=requestAnimationFrame(loop);}
function mgSpark(P,x,y,n,cols){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=rand(40,220);P.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-80,l:rand(.2,.5),c:pick(cols)});}}
function mgDrawSparks(g,P,dt){g.save();g.globalCompositeOperation='lighter';for(let i=P.length-1;i>=0;i--){const p=P[i];p.l-=dt;if(p.l<=0){P.splice(i,1);continue;}p.vy+=420*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;g.strokeStyle=p.c;g.globalAlpha=Math.min(1,p.l*3);g.lineWidth=1.6;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-p.vx*.02,p.y-p.vy*.02);g.stroke();}g.restore();}

/* ---------- entry ---------- */
function playGame(kind,ctx,done){MG.on=true;MG.ctx=ctx;MG.done=done;
  (({laser:gameTrace,weld:gameTrace,assemble:gameAssemble,paint:gamePaint,qa:gameQA,repair:gameRepair,program:gameProgram})[kind]||MILL_GAMES[kind])(kind,ctx);}
function mgFinish(kind,score,ctx){cancelAnimationFrame(MG.raf);MG.on=false;score=clamp(score,0,1);
  const g=score>=.9?['PERFECT','#FACC15']:score>=.7?['GREAT','#39E75F']:score>=.45?['GOOD','#38BDF8']:['MISSED IT','#F87171'];const I=MG_INFO[kind];
  const reward=I.reward&&score>=.45?I.reward:I.reward?'You got through it. The mill crew finished the job!':kind==='repair'?(score>=.45?'Machine back online. Parts cost $40 instead of $220 for the crew.':'The crew had to finish the job.'):kind==='program'?'Robot online. It runs this program on every unit now.':kind==='qa'?(score>=.45?'Defects pulled before shipping. Reputation up.':'Some defects slipped through.'):score>=.45?`Station boosted: <b>2× speed</b> and fewer defects for ${Math.round(12+score*18)} seconds.`:'No boost this time. Try again in a bit!';
  if(score>=.45&&kind!=='program'){sfx('win');if(score>=.9)confetti(90);}else if(kind!=='program')sfx('bad');else{sfx('big');confetti(120);}
  const C=openModal(`<div class="mg mg-res"><div class="mg-grade" style="--gc:${g[1]}">${g[0]}</div><div class="eyebrow">${I.icon} ${I.name}</div><p class="mg-rw">${reward}</p><p class="mg-fact">💡 ${I.fact}</p><div class="mact"><button class="btn pri" id="mgOk" data-focus>Back to the floor</button></div></div>`,{cls:'dark mgcard'});
  C.querySelector('#mgOk').onclick=()=>{closeModal();MG.done&&MG.done(score);};}
/* ---------- laser + weld: trace a path ---------- */
function tracePath(kind,w,h){const pts=[];if(kind==='laser'){/* a robot head outline: rounded rect with ears */const x0=w*.28,x1=w*.72,y0=h*.22,y1=h*.8,r=24;
    const seg=(ax,ay,bx2,by,n)=>{for(let i=0;i<n;i++)pts.push({x:lerp(ax,bx2,i/n),y:lerp(ay,by,i/n)});};
    seg(x0+r,y0,x1-r,y0,30);for(let i=0;i<8;i++){const a=-Math.PI/2+i/8*Math.PI/2;pts.push({x:x1-r+Math.cos(a)*r,y:y0+r+Math.sin(a)*r});}
    seg(x1,y0+r,x1,h*.42,10);seg(x1,h*.42,x1+26,h*.42,6);seg(x1+26,h*.42,x1+26,h*.6,8);seg(x1+26,h*.6,x1,h*.6,6);seg(x1,h*.6,x1,y1-r,10);
    for(let i=0;i<8;i++){const a=i/8*Math.PI/2;pts.push({x:x1-r+Math.cos(a)*r,y:y1-r+Math.sin(a)*r});}seg(x1-r,y1,x0+r,y1,30);
    for(let i=0;i<8;i++){const a=Math.PI/2+i/8*Math.PI/2;pts.push({x:x0+r+Math.cos(a)*r,y:y1-r+Math.sin(a)*r});}
    seg(x0,y1-r,x0,h*.6,10);seg(x0,h*.6,x0-26,h*.6,6);seg(x0-26,h*.6,x0-26,h*.42,8);seg(x0-26,h*.42,x0,h*.42,6);seg(x0,h*.42,x0,y0+r,10);
    for(let i=0;i<=8;i++){const a=Math.PI+i/8*Math.PI/2;pts.push({x:x0+r+Math.cos(a)*r,y:y0+r+Math.sin(a)*r});}}
  else{const a=rand(-.12,.12);for(let i=0;i<=80;i++){const t=i/80,x=lerp(w*.1,w*.9,t);pts.push({x,y:h*.5+Math.sin(t*Math.PI*rand(1.4,1.6))*h*.16+(t-.5)*h*a*2});}}
  return pts;}
function gameTrace(kind){openModal(mgShell(kind),{cls:'dark mgcard'});const {c,g,w,h}=mgCanvas(),pts=tracePath(kind,w,h),done=new Array(pts.length).fill(false),P=[];let idx=0,on=0,total=0,ptr=null,started=false,glow=[];
  const tol=kind==='laser'?16:18,col=kind==='laser'?['#FF3B3B','#FF9A6B','#FFF']:['#FFFFFF','#BFE3FF','#FFD27A'];
  const draw=dt=>{g.clearRect(0,0,w,h);
    if(kind==='weld'){const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#8C96A1');gr.addColorStop(1,'#5D6873');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.moveTo(0,0);pts.forEach(p=>g.lineTo(p.x,p.y-3));g.lineTo(w,0);g.fill();
      for(let i=0;i<50;i++){g.fillStyle=`rgba(255,255,255,${.03})`;g.fillRect((i*97)%w,(i*53)%h,40,2);}}
    else{g.fillStyle='#232A33';g.fillRect(0,0,w,h);g.strokeStyle='rgba(255,255,255,.05)';for(let x=0;x<w;x+=24){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#B8C2CC');gr.addColorStop(1,'#8892A0');g.fillStyle=gr;g.fillRect(w*.12,h*.1,w*.76,h*.8);}
    g.setLineDash([7,8]);g.lineWidth=2.5;g.strokeStyle=kind==='weld'?'rgba(15,23,42,.75)':'rgba(15,23,42,.8)';g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke();g.setLineDash([]);
    /* finished bead / cut */
    g.lineCap='round';for(let i=1;i<pts.length;i++){if(!done[i]||!done[i-1])continue;const age=glow[i]||0;g.strokeStyle=kind==='weld'?(age<.6?`rgba(255,${180+age*100|0},120,1)`:'#C7CDD3'):(age<.5?'#FF6B4A':'#151A20');g.lineWidth=kind==='weld'?7:4;g.beginPath();g.moveTo(pts[i-1].x,pts[i-1].y);g.lineTo(pts[i].x,pts[i].y);g.stroke();if(kind==='weld'&&age>=.6){g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=2;g.stroke();}}
    for(let i=0;i<glow.length;i++)if(done[i])glow[i]=(glow[i]||0)+dt;
    /* start marker */
    const s=pts[idx]||pts[pts.length-1];g.strokeStyle='#39E75F';g.lineWidth=3;g.beginPath();g.arc(s.x,s.y,12+Math.sin(performance.now()/120)*2,0,7);g.stroke();
    if(ptr&&started){if(kind==='weld'){const r=g.createRadialGradient(ptr.x,ptr.y,0,ptr.x,ptr.y,40);r.addColorStop(0,'rgba(255,255,255,.95)');r.addColorStop(.25,'rgba(160,210,255,.6)');r.addColorStop(1,'rgba(160,210,255,0)');g.fillStyle=r;g.beginPath();g.arc(ptr.x,ptr.y,40,0,7);g.fill();}
      else{g.fillStyle='#111827';g.fillRect(ptr.x-12,ptr.y-34,24,22);g.strokeStyle='#FF3B3B';g.lineWidth=2;g.beginPath();g.moveTo(ptr.x,ptr.y-12);g.lineTo(ptr.x,ptr.y);g.stroke();g.fillStyle='rgba(255,60,60,.9)';g.beginPath();g.arc(ptr.x,ptr.y,4,0,7);g.fill();}}
    mgDrawSparks(g,P,dt);};
  let active=false;
  mgPointer(c,(ev,p)=>{ptr=p;if(ev==='down'){active=true;if(!started){started=true;$('#mgGo').style.display='none';initAudio();
      mgTimer(MG_INFO[kind].secs,(dt)=>{if(active&&ptr){total+=dt;/* advance along the path while near it */let best=-1;for(let j=idx;j<Math.min(pts.length,idx+14);j++){if(Math.hypot(pts[j].x-ptr.x,pts[j].y-ptr.y)<tol)best=j;}
          if(best>=idx){for(let j=idx;j<=best;j++)done[j]=true;idx=best+1;on+=dt;mgSpark(P,ptr.x,ptr.y,kind==='weld'?4:2,col);if(Math.random()<.3)sfx('zap');}}
        $('#mgP').style.width=(idx/pts.length*100)+'%';draw(dt);if(idx>=pts.length)MG.stop=true;},()=>{const prog=idx/pts.length,acc=total?on/total:0;mgFinish(kind,prog*(.55+.45*acc),MG.ctx);});}}
    if(ev==='up')active=false;});
  draw(0);(function idle(){if(started||!MG.on)return;draw(.016);requestAnimationFrame(idle);})();}
/* ---------- assemble: tap parts in order ---------- */
function gameAssemble(kind,ctx){const P=PRODUCTS[(ctx&&ctx.p)||'kart'],seqs={toy:['🤖 Body shell','⚙️ Servo motor','🔋 Battery','🧠 Chip','👀 Eyes'],kart:['🏎️ Frame','⚙️ Motor','🔋 Battery','🛞 Wheels','🪑 Seat'],drone:['🛸 Frame','⚙️ Motors','🔋 Battery','🧠 Flight chip','🌀 Propellers'],scooter:['🛴 Deck','⚙️ Hub motor','🔋 Battery','🔌 Wiring','🛞 Wheels'],dog:['🐕 Chassis','⚙️ Leg servos','🔋 Battery','🧠 AI chip','📷 Camera'],ev:['🚗 Body frame','⚙️ Drive motor','🔋 Battery pack','🔌 Wiring harness','🛞 Wheels']};
  const seq=seqs[(ctx&&ctx.p)||'kart']||seqs.kart,sh=seq.slice().sort(()=>Math.random()-.5);let at=0,miss=0,started=false;
  openModal(mgShell(kind,`<div class="asm"><div class="asm-sheet"><b>Build sheet · ${P.icon} ${P.name}</b><ol>${seq.map((s,i)=>`<li data-i="${i}">${s}</li>`).join('')}</ol></div><div class="asm-parts">${sh.map(s=>`<button class="part" data-s="${esc(s)}">${s}</button>`).join('')}</div></div><div class="mg-bar"><i id="mgP"></i></div>`),{cls:'dark mgcard'});
  $$('.part').forEach(b=>b.onclick=()=>{initAudio();if(!started){started=true;mgTimer(MG_INFO[kind].secs,()=>{},()=>mgFinish(kind,at/seq.length*(1-Math.min(.6,miss*.15)),ctx));}
    if(b.dataset.s===seq[at]){b.classList.add('ok');b.disabled=true;$(`.asm-sheet li[data-i="${at}"]`).classList.add('done');at++;sfx('clang');$('#mgP').style.width=(at/seq.length*100)+'%';if(at>=seq.length)MG.stop=true;}
    else{miss++;b.classList.remove('no');void b.offsetWidth;b.classList.add('no');sfx('bad');}});}
/* ---------- paint: coverage vs overspray ---------- */
function gamePaint(kind,ctx){openModal(mgShell(kind),{cls:'dark mgcard'});const {c,g,w,h}=mgCanvas(),color=PCOL[(ctx&&ctx.p)||'kart']||'#10B981';
  const mask=document.createElement('canvas');mask.width=w;mask.height=h;const mg=mask.getContext('2d');mg.fillStyle='#000';mg.beginPath();mg.roundRect(w*.3,h*.2,w*.4,h*.45,24);mg.fill();mg.beginPath();mg.arc(w*.38,h*.75,h*.11,0,7);mg.arc(w*.62,h*.75,h*.11,0,7);mg.fill();mg.fillRect(w*.47,h*.08,w*.06,h*.14);
  const md=mg.getImageData(0,0,w,h).data,inside=(x,y)=>md[((y|0)*w+(x|0))*4+3]>0;let cells=0;const grid=[];for(let y=4;y<h;y+=8)for(let x=4;x<w;x+=8){const i=inside(x,y);grid.push({x,y,i,p:0});if(i)cells++;}
  const paint=document.createElement('canvas');paint.width=w;paint.height=h;const pg=paint.getContext('2d');let ptr=null,active=false,started=false,waste=0;
  const draw=()=>{g.fillStyle='#1B2129';g.fillRect(0,0,w,h);g.globalAlpha=.9;g.drawImage(mask,0,0);g.globalAlpha=1;g.fillStyle='#4B5563';g.globalCompositeOperation='source-over';
    const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;const tg=tmp.getContext('2d');tg.drawImage(mask,0,0);tg.globalCompositeOperation='source-in';tg.fillStyle='#6B7280';tg.fillRect(0,0,w,h);g.drawImage(tmp,0,0);g.drawImage(paint,0,0);
    if(ptr&&started){g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=2;g.beginPath();g.arc(ptr.x,ptr.y,22,0,7);g.stroke();}};
  mgPointer(c,(ev,p)=>{ptr=p;if(ev==='down'){active=true;if(!started){started=true;$('#mgGo').style.display='none';initAudio();
    mgTimer(MG_INFO[kind].secs,()=>{if(active&&ptr){for(let i=0;i<6;i++){const a=Math.random()*6.28,r=Math.random()*22;pg.fillStyle=color;pg.globalAlpha=.25;pg.beginPath();pg.arc(ptr.x+Math.cos(a)*r,ptr.y+Math.sin(a)*r,rand(3,7),0,7);pg.fill();}pg.globalAlpha=1;
        grid.forEach(q=>{if(Math.hypot(q.x-ptr.x,q.y-ptr.y)<22){if(q.i)q.p=Math.min(1,q.p+.12);else waste+=.004;}});if(Math.random()<.2)noise(.05,.015,3000);}
      const cov=grid.reduce((a,q)=>a+(q.i?q.p:0),0)/cells;$('#mgP').style.width=(cov*100)+'%';draw();if(cov>.97)MG.stop=true;},()=>{const cov=grid.reduce((a,q)=>a+(q.i?q.p:0),0)/cells;mgFinish(kind,cov*1.05-Math.min(.45,waste/cells*6),ctx);});}}if(ev==='up')active=false;});
  draw();}
/* ---------- qa: spot the defects ---------- */
function gameQA(kind,ctx){const n=8,bad=new Set();while(bad.size<3)bad.add(ri(0,n-1));const color=PCOL[(ctx&&ctx.p)||'kart']||'#38BDF8',kinds=['crack','bolt','drip','dent'];let found=0,wrong=0,started=false;
  openModal(mgShell(kind,`<div class="qa-grid">${Array.from({length:n},(_,i)=>`<button class="qa-u" data-i="${i}"><canvas width="120" height="96"></canvas></button>`).join('')}</div><div class="mg-bar"><i id="mgP"></i></div>`),{cls:'dark mgcard'});
  $$('.qa-u canvas').forEach((cv,i)=>{const g=cv.getContext('2d'),d=bad.has(i)?pick(kinds):null;cv.parentElement.dataset.d=d||'';g.fillStyle='#1F2937';g.fillRect(0,0,120,96);g.fillStyle=color;g.beginPath();g.roundRect(28,18,64,52,10);g.fill();g.fillStyle='#0F172A';g.beginPath();g.arc(46,40,6,0,7);g.arc(74,40,6,0,7);g.fill();
    g.fillStyle='#E5E7EB';[[34,24],[86,24],[34,64],[86,64]].forEach(([x,y],k)=>{if(d==='bolt'&&k===3)return;g.beginPath();g.arc(x,y,2.5,0,7);g.fill();});if(d==='bolt'){g.strokeStyle='#F87171';g.lineWidth=1.5;g.beginPath();g.arc(86,64,4,0,7);g.stroke();}
    if(d==='crack'){g.strokeStyle='#0B0F14';g.lineWidth=2;g.beginPath();g.moveTo(60,18);g.lineTo(55,32);g.lineTo(64,40);g.lineTo(58,56);g.stroke();}
    if(d==='drip'){g.fillStyle=color;g.beginPath();g.ellipse(70,76,4,9,0,0,7);g.fill();g.beginPath();g.arc(70,86,4,0,7);g.fill();}
    if(d==='dent'){g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(50,58,12,6,-.3,0,7);g.fill();}
    g.fillStyle='#111827';g.fillRect(20,72,80,8);});
  $$('.qa-u').forEach(b=>b.onclick=()=>{initAudio();if(!started){started=true;mgTimer(MG_INFO[kind].secs,()=>{},()=>mgFinish(kind,(found-wrong*.5)/bad.size,ctx));}
    if(b.classList.contains('hit')||b.classList.contains('miss'))return;if(b.dataset.d){b.classList.add('hit');found++;sfx('good');$('#mgP').style.width=(found/bad.size*100)+'%';if(found>=bad.size)MG.stop=true;}else{b.classList.add('miss');wrong++;sfx('bad');}});}
/* ---------- repair: timing gauge ---------- */
function gameRepair(kind,ctx){openModal(mgShell(kind,`<div class="mg-stage"><canvas id="mgC"></canvas></div><div class="rp-row"><button class="btn pri big" id="rpHit">🔧 HIT IT</button></div><div class="mg-bar"><i id="mgP"></i></div>`),{cls:'dark mgcard'});
  const {c,g,w,h}=mgCanvas();let a=0,dir=1,hits=0,tries=0,zone=rand(.25,.75),zw=.16,started=false,shake=0;const P=[];
  const draw=dt=>{g.clearRect(0,0,w,h);g.fillStyle='#1B2129';g.fillRect(0,0,w,h);const cx=w/2,cy2=h*.86,R=h*.7;g.save();if(shake>0){g.translate(rand(-4,4),rand(-3,3));shake-=dt;}
    g.lineWidth=26;g.strokeStyle='#374151';g.beginPath();g.arc(cx,cy2,R,Math.PI,0);g.stroke();g.strokeStyle='#22C55E';g.beginPath();g.arc(cx,cy2,R,Math.PI+(zone-zw/2)*Math.PI,Math.PI+(zone+zw/2)*Math.PI);g.stroke();
    const ang=Math.PI+a*Math.PI;g.strokeStyle='#F8FAFC';g.lineWidth=5;g.beginPath();g.moveTo(cx,cy2);g.lineTo(cx+Math.cos(ang)*(R+8),cy2+Math.sin(ang)*(R+8));g.stroke();g.fillStyle='#F97316';g.beginPath();g.arc(cx,cy2,14,0,7);g.fill();
    g.fillStyle='#fff';g.font='700 18px Fredoka, system-ui';g.textAlign='center';g.fillText(`${hits} / 3`,cx,cy2-R*.35);g.restore();mgDrawSparks(g,P,dt);};
  const hit=()=>{initAudio();if(!started){started=true;mgTimer(MG_INFO[kind].secs,dt=>{a+=dir*dt*(1.1+hits*.35);if(a>1){a=1;dir=-1;}if(a<0){a=0;dir=1;}draw(dt);},()=>mgFinish(kind,hits/3-Math.max(0,tries-hits-1)*.1,ctx));return;}
    tries++;if(Math.abs(a-zone)<zw/2){hits++;sfx('clang');shake=.25;mgSpark(P,w/2,h*.5,24,['#FACC15','#FFF','#F97316']);zone=rand(.2,.8);zw=Math.max(.09,zw-.03);$('#mgP').style.width=(hits/3*100)+'%';if(hits>=3)MG.stop=true;}else{sfx('bad');}};
  $('#rpHit').onclick=hit;$('#rpHit').textContent='▶ START';$('#rpHit').addEventListener('click',()=>{$('#rpHit').textContent='🔧 HIT IT';},{once:true});draw(0);}
/* ---------- program a robot: put the instructions in order ---------- */
function gameProgram(kind,ctx){const k=(ctx&&ctx.k)||'weld',seq=PROGRAMS[k]||PROGRAMS.weld,sh=seq.slice().sort(()=>Math.random()-.5);let prog=[],miss=0;
  openModal(mgShell(kind,`<div class="pg"><div class="pg-code"><div class="pg-h">ROBOT_${STATIONS[k].short.toUpperCase()}.prg</div><ol id="pgList"></ol><div class="pg-cur">▌</div></div><div class="pg-blocks">${sh.map(s=>`<button class="pblk" data-s="${esc(s)}">${s}</button>`).join('')}</div></div><p class="pg-err" id="pgErr"></p>`),{cls:'dark mgcard'});
  $$('.pblk').forEach(b=>b.onclick=()=>{initAudio();const want=seq[prog.length];if(b.dataset.s===want){prog.push(want);b.disabled=true;b.classList.add('ok');$('#pgList').insertAdjacentHTML('beforeend',`<li><span>${String(prog.length*10).padStart(3,'0')}</span> ${want.toUpperCase().replace(/ /g,'_')}</li>`);sfx('tick');$('#pgErr').textContent='';
      if(prog.length===seq.length){$('#pgErr').innerHTML='<b class="ok">✓ Program compiled. Running…</b>';setTimeout(()=>mgFinish(kind,1-Math.min(.5,miss*.08),ctx),900);}}
    else{miss++;sfx('bad');b.classList.remove('no');void b.offsetWidth;b.classList.add('no');$('#pgErr').innerHTML=`⚠ The robot can't <b>${esc(b.dataset.s.toLowerCase())}</b> yet. What has to happen first?`;}});}
