/* ===================== BotFactory · data & tuning ===================== */
const fmt=(n,d=0)=>(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const fmt2=n=>fmt(n,2);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), rand=(a,b)=>a+Math.random()*(b-a), pick=a=>a[Math.floor(Math.random()*a.length)], lerp=(a,b,t)=>a+(b-a)*t;
const randi=(a,b)=>Math.floor(rand(a,b+1));

/* grid: 18 x 12 cells of 2m. The garage is the top-left 10 x 6 corner. */
const CELL=2, COLS=18, ROWS=12, OX=-COLS*CELL/2, OZ=-ROWS*CELL/2;
const GARAGE={c0:0,r0:0,c1:9,r1:5}, BIG={c0:0,r0:0,c1:17,r1:11};
const DX=[1,0,-1,0], DZ=[0,1,0,-1];
const DAY_LEN=75, DAYS=10;

/* stages: 0 steel sheet → 1 parts → 2 bare bot → 3 painted bot */
const MACH={
  stamper:  {name:'Stamper',        short:'Stamp',   key:'2', cost:450, cycle:1.5, from:0, to:1, defect:.03, color:'#3B82F6', icon:'⬇', desc:'Presses steel sheets into robot parts.'},
  assembler:{name:'Assembler',      short:'Assemble',key:'3', cost:600, cycle:2.9, from:1, to:2, defect:.03, color:'#F97316', icon:'⚙', desc:'Bolts parts and a motor kit ($4) into a MiniBot body. The slowest job on the line.', vc:4},
  painter:  {name:'Painter',        short:'Paint',   key:'4', cost:500, cycle:2.0, from:2, to:3, defect:.03, color:'#10B981', icon:'🎨', desc:'Sprays the MoneyBot green finish. Paint costs $2 a bot.', vc:2},
  qa:       {name:'QA Scanner',     short:'QA',      key:'5', cost:400, cycle:1.1, kind:'qa',   color:'#A855F7', icon:'🔍', desc:'Scans painted bots and scraps defects before a customer finds them.'},
  packer:   {name:'Packer',         short:'Pack',    key:'6', cost:450, cycle:1.4, kind:'pack', color:'#EAB308', icon:'📦', desc:'Boxes painted bots. Boxed bots sell for +$6; a box costs $1.50.', vc:1.5},
  chip:     {name:'Chip Installer', short:'Chip',    key:'7', cost:900, cycle:2.4, kind:'chip', color:'#EC4899', icon:'💾', desc:'Adds a smart chip ($9). Deluxe bots sell for +$25.', vc:9, big:true}
};
const CORE=['stamper','assembler','painter'];

const ECON={
  startCash:4000, loan:3000, loanInt:25, rentGarage:160, rentBig:300, wage:85,
  autoCost:900, autoUpkeep:15, upkeepPct:.015, belt:5, splitter:120, startStock:40, maxStock:160,
  release:.85, beltSpeed:1.5, deliveryTime:12, holdSheet:.2, holdBot:.4,
  returnFee:5, boxBonus:6, deluxeBonus:25, expandCost:1500, expandNeed:60,
  crew2:1.7, auto:2.1, rush:1.35, rushDefect:2.5, autoDefect:.35, emergency:1500, emergencyInt:20,
  streakStep:.05, streakMax:6
};
const BULK=[{n:20,each:7},{n:50,each:6},{n:100,each:5.2}];
const CLIENTS=['Toy Mart','Gizmo Hub','Pixel Toys','Bolt Bros','Kidz Galaxy','Byte Store','Robo Rama','Fun Factory','Spark Shop','Nova Kids','Loop & Co'];

/* demand curve: how many bots the open market buys per day at a given price */
function marketDemand(price, rep, expanded, rival, upg){
  upg=upg||{}; const tol=upg.brand?5:0;
  let d=(expanded?120:54)*clamp(1-(price-tol-15)/50,0,1.25)*(.55+rep/100*.9)*(upg.marketing?1.3:1);
  if(rival && price>rival.price+2+tol) d*=.5;
  return Math.max(0,d);
}

/* workers: everyone has a personality */
const TRAITS={
  steady:  {t:'Steady',   ic:'🙂', spd:1,    q:1,   wage:85,  d:'Reliable. Nothing fancy.'},
  speedy:  {t:'Speedy',   ic:'⚡', spd:1.2,  q:1.7, wage:90,  d:'+20% speed, but sloppier.'},
  careful: {t:'Careful',  ic:'🧐', spd:.9,   q:.35, wage:90,  d:'−65% defects, a bit slower.'},
  pro:     {t:'Pro',      ic:'⭐', spd:1.25, q:.6,  wage:125, d:'Fast and careful. Costs more.'},
  rookie:  {t:'Rookie',   ic:'🌱', spd:.85,  q:1.3, wage:60,  d:'Cheap and learning. Gets faster every day.'},
  cheerful:{t:'Cheerful', ic:'😄', spd:1,    q:1,   wage:85,  d:'Lifts the whole crew\'s mood every day.'}
};
const NAMES=['Ava','Leo','Maya','Jay','Zoe','Kai','Nia','Omar','Ivy','Theo','Rosa','Eli','Luz','Max','Priya','Sam','Tess','Ben','Ada','Rio','Mina','Cole','June','Ravi'];

/* R&D: one-time investments with ongoing payoff */
const UPG={
  belts:     {name:'Turbo Belts',        ic:'⏩', cost:350,  d:'Belts move 40% faster and the steel dock feeds 30% faster.'},
  dies:      {name:'Quick-Change Dies',  ic:'🔩', cost:500,  d:'Stamper and Painter work 25% faster.'},
  tools:     {name:'Power Tools',        ic:'🪛', cost:700,  d:'Assembler and Chip Installer work 30% faster.'},
  breakroom: {name:'Break Room',         ic:'☕', cost:400,  d:'Crew mood +15 now and +3 every day. Happy crews work faster.'},
  lean:      {name:'Lean Training',      ic:'🎯', cost:550,  d:'Half as many defects on every station.'},
  supplier:  {name:'Steel Contract',     ic:'🤝', cost:650,  d:'Steel costs 15% less per sheet, forever.'},
  marketing: {name:'Ad Campaign',        ic:'📣', cost:700,  d:'30% more shoppers want your bots at any price.'},
  sensors:   {name:'Smart Sensors',      ic:'📡', cost:800,  d:'Machines break down 60% less often.'},
  brand:     {name:'Premium Brand',      ic:'💎', cost:1100, d:'Shoppers will pay $5 more before they walk away. Needs reputation 70.', need:'rep70'}
};

/* surprise decisions: one a day from Day 2 */
const EVENTS=[
  {id:'influencer', who:'StreamerKai', ic:'📹', title:'An influencer wants free bots',
    text:'StreamerKai (2M followers) wants <b>6 free MiniBots</b> for an unboxing video.',
    a:{t:'Send 6 bots', d:'Costs about $60 in materials. Reputation +8, more shoppers tomorrow.'}, b:{t:'No thanks', d:'Keep your bots.'},
    lesson:'Marketing costs money now and (maybe) pays off later. That\'s an investment in your brand.'},
  {id:'cheapsteel', who:'Mystery Supplier', ic:'🕶️', title:'Super-cheap steel?',
    text:'A shady supplier offers <b>60 sheets at $3 each</b> (you normally pay about $6). "Quality? Probably fine."',
    a:{t:'Buy for $180', d:'Cheap, but bots made from it are 3× as likely to be defective.'}, b:{t:'Pass', d:'Stick with your normal supplier.'},
    lesson:'Cheaper inputs can cost more in the end: defects mean scrap, refunds and lost reputation.'},
  {id:'pizza', who:'Your crew', ic:'🍕', title:'Pizza Friday?',
    text:'Your crew asks if you\'ll buy pizza for lunch. It\'s been a long week.',
    a:{t:'Buy pizza ($90)', d:'Crew mood +14. Happy crews work faster.'}, b:{t:'Not today', d:'Crew mood −6.'},
    lesson:'Spending on your team is a cost, but morale affects how fast and how carefully people work.'},
  {id:'noise', who:'Your maintenance lead', ic:'🔧', title:'A grinding noise',
    text:'Your busiest machine is making a horrible grinding noise.',
    a:{t:'Service it ($90)', d:'Fixes it now. No surprises.'}, b:{t:'Ignore it', d:'Free… unless it breaks down later today.'},
    lesson:'Preventive maintenance is a small cost you can plan. A breakdown is a big cost you can\'t.'},
  {id:'refi', who:'First Bank', ic:'🏦', title:'Pay down your loan?',
    text:'The bank says you can pay <b>$1,500</b> now to cut your daily loan interest by <b>$15</b>.',
    a:{t:'Pay $1,500', d:'Less cash today, lower fixed costs every day after.'}, b:{t:'Keep the cash', d:'Cash on hand stays flexible.'},
    lesson:'Interest is a fixed cost. Paying down debt lowers it, but spends cash you might need.'},
  {id:'inspector', who:'Safety inspector', ic:'🦺', title:'Safety inspection',
    text:'An inspector is coming. New machine guards would cost <b>$140</b>.',
    a:{t:'Install guards ($140)', d:'Reputation +4, crew mood +6.'}, b:{t:'Risk it', d:'Half the time you get fined $250.'},
    lesson:'Some costs protect you from bigger risks. That\'s why businesses pay for safety and insurance.'},
  {id:'tour', who:'Lincoln Middle School', ic:'🎒', title:'Field trip!',
    text:'A class wants to tour your factory today. They\'d slow the line down a little.',
    a:{t:'Host the tour', d:'Line 10% slower today. Reputation +6, crew mood +5.'}, b:{t:'Too busy', d:'No change.'},
    lesson:'Community goodwill builds reputation, and reputation brings customers.'},
  {id:'bulkbuyer', who:'Robo Rama', ic:'🛍️', title:'Cash up front?',
    text:'Robo Rama will pay <b>$300 today</b> if you sell them 15 bots at $30 (below your usual price) by tomorrow.',
    a:{t:'Take the deal', d:'$300 now, 15 bots at a lower price.'}, b:{t:'Decline', d:'Keep your normal prices.'},
    lesson:'A lower price can still be worth it when it brings cash in early and keeps the line busy.'}
];

const MILESTONES=[
  {id:'first',  t:'Ship your first MiniBot'},
  {id:'order',  t:'Finish a customer order on time'},
  {id:'profit', t:'Have a profitable day'},
  {id:'upgrade',t:'Invest in your first R&D upgrade'},
  {id:'streak3',t:'Hit a 3-order on-time streak'},
  {id:'ship60', t:'Ship 60 MiniBots (unlocks the big floor)'},
  {id:'expand', t:'Move into the big factory'},
  {id:'deluxe', t:'Ship a Deluxe MiniBot'},
  {id:'ship300',t:'Ship 300 MiniBots'}
];

const TIPS={
  firstShip:'First MiniBot shipped! Every extra bot spreads your <b>fixed costs</b> thinner, so each one gets cheaper to make. Check <b>Numbers</b>.',
  bottleneck:'See the red ring? That\'s your <b>bottleneck</b>: parts pile up in front of it. Tap it and hire a second worker and the whole line speeds up.',
  orders:'An order came in! Orders pay more than the open market, and every on-time order grows your 🔥 <b>streak bonus</b>.',
  lowStock:'Steel is running low. Bigger orders cost less per sheet, but stock sitting around costs storage fees.',
  breakdown:'A machine broke down! <b>Tap it a few times</b> to fix it. Everything behind it backs up while it\'s down.',
  rush:'Huge rush order on the board. Can your line make that many in time? Check your capacity in <b>Numbers</b> before you say yes.',
  spike:'Steel costs 60% more today and tomorrow. That pushes up your <b>variable cost</b> on every bot. Hope you stocked up!',
  rival:'Rusty\'s ScrapCo is undercutting you. Match his price, or win on value: boxed and Deluxe bots, and orders, aren\'t hurt.',
  expand:'You\'ve shipped 60 bots! You can move into the <b>big factory</b>: more space, a second line and Deluxe bots. Rent goes up, so you\'ll need the volume.',
  returns:'Some bots came back broken. A <b>QA Scanner</b> catches defects in the factory, which is way cheaper than refunds and a bad reputation.',
  rushMode:'Rush mode makes everything faster but sloppier, and it wears out your crew. Quality vs speed: it\'s always a trade-off.',
  autoIdea:'Wages are a <b>fixed cost</b>: you pay them even when the line is idle. A robot arm costs more up front but nothing per day.',
  rnd:'You\'ve got some cash saved up. Check <b>R&amp;D</b>: upgrades cost money once and pay you back every day after.',
  splitter:'Even two workers can only go so fast. Put a <b>Splitter</b> on the belt to send bots to two machines side by side, then merge the belts back together.',
  mood:'Your crew is grumpy, so they\'re working slower. Skip rush mode, buy a Break Room, or say yes to pizza.'
};
const cellX=c=>OX+c*CELL+CELL/2, cellZ=r=>OZ+r*CELL+CELL/2;
/* visual / UI hooks. world.js + game.js fill these in; the sim only talks to V */
const V=new Proxy({}, {get:(o,k)=>k in o?o[k]:(()=>{}), set:(o,k,v)=>{ o[k]=v; return true; }});
