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
  stamper:  {name:'Stamper',        short:'Stamp',   key:'2', cost:500, cycle:1.6, from:0, to:1, defect:.03, color:'#3B82F6', icon:'⬇', desc:'Presses steel sheets into robot parts.'},
  assembler:{name:'Assembler',      short:'Assemble',key:'3', cost:700, cycle:3.2, from:1, to:2, defect:.03, color:'#F97316', icon:'⚙', desc:'Bolts parts into a MiniBot body. Slowest job on the line.'},
  painter:  {name:'Painter',        short:'Paint',   key:'4', cost:600, cycle:2.2, from:2, to:3, defect:.03, color:'#10B981', icon:'🎨', desc:'Sprays the MoneyBot green finish. Paint costs $2 a bot.', vc:2},
  qa:       {name:'QA Scanner',     short:'QA',      key:'5', cost:400, cycle:1.2, kind:'qa',   color:'#A855F7', icon:'🔍', desc:'Scans painted bots and scraps defects before a customer finds them.'},
  packer:   {name:'Packer',         short:'Pack',    key:'6', cost:450, cycle:1.5, kind:'pack', color:'#EAB308', icon:'📦', desc:'Boxes painted bots. Boxed bots sell for +$6; a box costs $1.50.', vc:1.5},
  chip:     {name:'Chip Installer', short:'Chip',    key:'7', cost:900, cycle:2.6, kind:'chip', color:'#EC4899', icon:'💾', desc:'Adds a smart chip ($9). Deluxe bots sell for +$25.', vc:9, big:true}
};
const CORE=['stamper','assembler','painter'];

const ECON={
  startCash:4000, loan:3000, loanInt:25, rentGarage:120, rentBig:260, wage:75,
  autoCost:900, autoUpkeep:20, upkeepPct:.02, belt:5, startStock:30, maxStock:150,
  release:1.0, beltSpeed:1.5, deliveryTime:12, holdSheet:.25, holdBot:.5,
  returnFee:5, boxBonus:6, deluxeBonus:25, expandCost:2000, expandNeed:60,
  crew2:1.7, auto:2.1, rush:1.35, rushDefect:2.5, autoDefect:.35, emergency:1500, emergencyInt:20
};
const BULK=[{n:20,each:7},{n:50,each:6},{n:100,each:5.2}];
const CLIENTS=['Toy Mart','Gizmo Hub','Pixel Toys','Bolt Bros','Kidz Galaxy','Byte Store','Robo Rama','Fun Factory','Spark Shop'];

/* demand curve: how many bots the open market buys per day at a given price */
function marketDemand(price, rep, expanded, rival){
  let d=(expanded?105:62)*clamp(1-(price-15)/52,0,1.25)*(.55+rep/100*.9);
  if(rival && price>rival.price+2) d*=.5;
  return Math.max(0,d);
}

const MILESTONES=[
  {id:'first',  t:'Ship your first MiniBot'},
  {id:'order',  t:'Finish a customer order on time'},
  {id:'profit', t:'Have a profitable day'},
  {id:'ship60', t:'Ship 60 MiniBots (unlocks the big floor)'},
  {id:'expand', t:'Move into the big factory'},
  {id:'deluxe', t:'Ship a Deluxe MiniBot'},
  {id:'ship300',t:'Ship 300 MiniBots'}
];

const TIPS={
  intro:'Welcome to your garage! Steel comes in on the left, finished MiniBots leave on the right. Pick the <b>Stamper</b> below and tap the belt to drop it on the line.',
  needAsm:'Nice. Stamped parts still need an <b>Assembler</b>, then a <b>Painter</b>. Put them further down the belt, in that order.',
  ready:'Your line is ready. Hit <b>Open the factory</b> and watch the bots roll.',
  firstShip:'First MiniBot shipped! Check <b>Numbers</b>: every extra bot spreads your fixed costs thinner, so each one gets cheaper to make.',
  bottleneck:'See the red ring? That station is your <b>bottleneck</b>: parts pile up in front of it. Tap it and add a second worker, and the whole line speeds up.',
  orders:'An order came in. Orders pay more than the open market, but miss the deadline and your reputation drops.',
  lowStock:'Steel is running low. Bigger orders cost less per sheet, but stock sitting around costs storage fees.',
  breakdown:'A machine broke down! <b>Tap it a few times</b> to fix it. Everything behind it backs up while it\'s down.',
  rush:'Huge rush order on the board. Can your line make that many in time? Check your capacity in <b>Numbers</b> before you say yes.',
  spike:'Steel costs 60% more today and tomorrow. That pushes up your <b>variable cost</b> on every bot. Hope you stocked up!',
  rival:'Rusty\'s ScrapCo is undercutting you. You can match his price, or sell value: boxed and Deluxe bots, and orders, aren\'t hurt.',
  expand:'You\'ve shipped 60 bots! You can move into the <b>big factory</b>: more space, a second line and Deluxe bots. Rent goes up, so you\'ll need the volume.',
  returns:'Some bots came back broken. A <b>QA Scanner</b> catches defects in the factory, which is way cheaper than refunds and a bad reputation.',
  rushMode:'Rush mode makes everything faster but sloppier. Quality vs speed: it\'s always a trade-off.',
  autoIdea:'Wages are a fixed cost: you pay them even when the line is idle. A robot costs more up front but less every day.'
};
