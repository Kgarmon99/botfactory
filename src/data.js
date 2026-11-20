/* ---------- player settings (loaded first so the renderer can use them) ---------- */
const SETTINGS_KEY='botfactory-settings',SET_DEF={master:.9,sfx:.9,music:.55,gfx:-1,sens:1,cb:false,motion:true,tips:true};
const SET=(()=>{try{return Object.assign({},SET_DEF,JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'));}catch(e){return Object.assign({},SET_DEF);}})();
function saveSet(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(SET));}catch(e){}}
const VERSION='1.0.0';
/* =====================================================================
   BOTFACTORY · data: stations, upgrades, products, plant stages, tuning
   ===================================================================== */
const SHIFT_LEN=150;                 /* seconds of sim time in one shift */
const ST_KEYS=['cut','weld','asm','paint','qa'];
const SLOT_X={cut:-11,weld:-5.5,asm:0,paint:5.5,qa:11};
const DOCK_IN_X=-16.2, LINE_GAP=11;
const LZ=l=>-l*LINE_GAP;             /* belt z for line l */

const STATIONS={
  cut:  {name:'Laser Cutter', short:'Cut',   icon:'🔦', color:'#EF4444', cycle:4.5,
         blurb:'A laser hot enough to slice steel cuts sheets into parts.', game:'laser'},
  weld: {name:'Welding Cell', short:'Weld',  icon:'🔥', color:'#3B82F6', cycle:9,
         blurb:'Melts metal parts together into one strong frame.', game:'weld'},
  asm:  {name:'Assembly',     short:'Build', icon:'🔩', color:'#F59E0B', cycle:6.5,
         blurb:'Motors, batteries and wiring go in. A frame becomes a machine.', game:'assemble'},
  paint:{name:'Paint Booth',  short:'Paint', icon:'🎨', color:'#10B981', cycle:5, buildCost:1200,
         blurb:'Sprays the finish that keeps metal from rusting and makes it pop.', game:'paint'},
  qa:   {name:'QA Scanner',   short:'QA',    icon:'🔍', color:'#A855F7', cycle:3, buildCost:900,
         blurb:'Scans every unit and pulls defects before a customer ever sees them.', game:'qa'}
};
/* each station climbs: Manual → Power Tools → Robot Cell */
const TIERS=[
  {name:'Manual',      speed:1,   defect:.10, wage:60, upkeep:0,  tag:'1 worker'},
  {name:'Power Tools', speed:2,   defect:.05, wage:70, upkeep:10, tag:'1 worker + machine'},
  {name:'Robot Cell',  speed:4.2, defect:.015,wage:0,  upkeep:45, tag:'robot, no wages'}
];
const UP_COST={cut:[0,700,2600], weld:[0,900,3200], asm:[0,800,3000], paint:[0,900,2800], qa:[0,700,2400]};

const PRODUCTS={
  toy:    {name:'MiniBot Toy',   icon:'🤖', needs:['cut','asm'],                      price:34,  mat:11,  stage:0},
  kart:   {name:'Go-Kart Frame', icon:'🏎️', needs:['cut','weld','asm'],               price:62,  mat:18,  stage:0},
  drone:  {name:'Drone',         icon:'🛸', needs:['cut','weld','asm','paint'],       price:118, mat:34,  stage:1},
  scooter:{name:'E-Scooter',     icon:'🛴', needs:['cut','weld','asm','paint','qa'],  price:175, mat:52,  stage:1},
  dog:    {name:'Robot Dog',     icon:'🐕', needs:['cut','weld','asm','paint','qa'],  price:290, mat:88,  stage:2, robots:1},
  ev:     {name:'MoneyBot Mini EV', icon:'🚗', needs:['cut','weld','asm','paint','qa'], price:640, mat:210, stage:3, robots:3}
};

/* the factory grows. Each stage physically builds out. */
const STAGES=[
  {name:'Garage Shop',  lines:1, wide:false, rent:120,  cost:0,      pitch:'A dusty garage, three stations and a dream.'},
  {name:'Workshop',     lines:1, wide:true,  rent:220,  cost:4500,   pitch:'Knock out the east wall: Paint Booth, QA Scanner, bigger products.'},
  {name:'Factory',      lines:2, wide:true,  rent:480,  cost:16000,  pitch:'A whole second production line. Double the output.'},
  {name:'Big Factory',  lines:3, wide:true,  rent:900,  cost:60000,  pitch:'Line three. Now you are a real manufacturer.'},
  {name:'Mega Plant',   lines:4, wide:true,  rent:1600, cost:180000, pitch:'Four lines, a robot fleet and your name on the skyline.'}
];

const ECON={startCash:1500, beltSpeed:2.6, queueMax:9, contractBonus:1.25, marketCut:.85, returnFee:12,hireFee:120,
  repairCrew:220, repairParts:40, serviceCost:60, crewTime:24, combo:20};

const CLIENTS=['Bot City Toys','Gizmo Hub','Spark Mobility','Volt Ride Co.','Pixel Drones','Bluegrass Outdoor','Robo Rama','Fun Factory','Byte Store','Riverside Rentals','SkyLift Logistics','Kentucky Kart Club'];

/* advisor lines, keyed */
const TIPS={
  start:'Welcome to your garage! Steel comes in on the left, finished products roll out on the right. Press <b>Start Shift</b> and watch your line work.',
  bottleneck:'See the crates piling up? That station is your <b>bottleneck</b>. Your whole line can only go as fast as its slowest station. Upgrade <i>that</i> one first.',
  breakdown:'A machine broke down! Run over and press <b>E</b> to fix it yourself for $40 in parts. Or wait, and the repair crew charges $220.',
  weld:'Want to go faster? Walk up to any manual station and press <b>E</b> to work it yourself. Nail it and that station runs at double speed for a while.',
  returns:'Some products came back broken. A <b>QA Scanner</b> catches defects before they ship. Way cheaper than refunds.',
  contract:'Contracts pay more than the open market. Check <b>Contracts</b> to pick your line\'s next job.',
  expand:'You can afford to <b>expand</b>! Walk to the glowing EXPAND sign, or open <b>Expand</b> below.',
  robot:'Your first robot cell! Robots need to be <b>programmed</b> before they can work. Walk over and press <b>E</b>.',
  scale:'Bigger plant, bigger rent. But every product now carries a smaller slice of that rent. That\'s called <b>economies of scale</b>.'
};

/* plant tech: unlockable robots + systems, each with a real effect */
const TECH=[
  {id:'screens',name:'Control Room Screens',icon:'🖥️',cost:600,stage:0,does:'Live dashboards light up the back wall. Your crew spots trouble early: <b>30% fewer breakdowns</b>.',lesson:'Watching machine data to fix things <i>before</i> they break is called <b>predictive maintenance</b>.'},
  {id:'agv',name:'AGV Delivery Robots',icon:'🛻',cost:2500,stage:1,does:'Self-driving robots zip parts down every aisle. <b>Every station runs 10% faster</b>.',lesson:'AGVs (automated guided vehicles) handle <b>material handling</b>, so machines never sit waiting on parts.'},
  {id:'drones',name:'Parts Drones',icon:'🚁',cost:6000,stage:2,does:'Drones fly spare parts in overhead. The repair crew shows up in <b>8 seconds</b> instead of 24, at <b>half the cost</b>.',lesson:'Less <b>downtime</b> means more output. Real plants track every minute a machine is down.'},
  {id:'dog',name:'Robot Dog Patrol',icon:'🐕',cost:9000,stage:2,does:'A camera-loaded robot dog patrols the floor and <b>catches half of all defects</b> before they ship.',lesson:'Real factories use legged robots to inspect equipment and spot problems people might miss.'}
];

const GATE_X=-11.5;
