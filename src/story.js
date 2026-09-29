// The Last Ten Minutes: the story script.
// Everything here is data plus pure functions of t (seconds after 9:50:00 p.m., 0 to 600).
// Rendering, following, overheard lines, clues and answers all read from this file.
'use strict';
const STORY = (function(){

// ---------- places (world units; platform y 4.2 to 11.2, booking hall x 0.4 to 4.6, y 4.9 to 10.6) ----------
const PLACES = {
  hallDoor:   [5.0, 8.0],   // platform door of the booking hall, on its +x face (y 7.6 to 8.4)
  window:     [5.1, 5.9],   // standing spot at the ticket window (window y 5.4 to 6.4)
  clerk:      [3.9, 5.9],   // Dunn behind the window
  wrDoor:     [5.0, 9.85],  // ladies' waiting-room door, +x face of the hall (y 9.5 to 10.2)
  streetDoor: [3.2, 10.95], // street door on the hall's front (+y) face (x 2.8 to 3.6)
  corner:     [0.2, 10.95], // where the street turns out of sight
  rearDoor:   [6.7, 4.95],  // rear carriage door
  frontDoor:  [13.9, 4.95], // front carriage door
  engine:     [17.4, 5.1],
  bench:      [9.2, 9.8],
  clock:      [11.0, 7.4],
  poleRest:   [4.75, 6.75],
  T1:         [5.7, 8.7],   // trolley origin by the booking hall
  T2:         [12.4, 8.3],  // trolley origin up the platform, behind the clock from Mr. Harrow
};

const DOORS = {
  street: {name:'the street door', open:[[26,31],[528,533]]},
  waiting:{name:'the waiting-room door', open:[[88,92],[343,347],[438,442],[508,512]]},
  hall:   {name:'the booking-hall door', open:[[0,600]]},
};

// ---------- looks ----------
const LOOK = {
  red:     {coat:'#b3261e', hat:'cloche', hatCol:'#7a1712', umbrella:false},
  greyUmb: {coat:'#6b6f73', hat:'none', umbrella:true},
  harrow:  {coat:'#3c3f45', hat:'fedora', hatCol:'#15171b'},
  porter:  {coat:'#26303d', hat:'cap'},
  clerk:   {coat:'#2d2a33', hat:'cap', hatCol:'#101318'},
  guard:   {coat:'#1f2a24', hat:'cap', hatCol:'#0f1512'},
  boy:     {coat:'#5a4632', hat:'cap', hatCol:'#3a2c1e'},
};

// ---------- people ----------
// route keyframes: [t, x, y, action]. Position interpolates linearly to the next keyframe; the action is the segment's.
// hidden: [from, to, where] half-open intervals when the person is out of sight.
// looks: [from, lookKey]; h is height in pixels at zoom 1 (Evelyn is visibly taller than Clara).
const PEOPLE = [
 {id:'evelyn', h:86, w:22, skin:'#8a6a55',
  looks:[[0,'red'],[346,'greyUmb']],
  labels:[[0,'The woman in the red coat'],[346,'A woman in a grey raincoat, under a black umbrella']],
  hidden:[[0,40,'hall'],[346,510,'waiting'],[527,531,'hall'],[549,601,'street']],
  route:[
   [0,3.9,8.0,'Inside the booking hall'],
   [40,5.0,8.0,'Steps out of the booking hall with a tan case'],
   [44,5.0,8.0,'Walks over to the porter'],
   [62,7.3,10.45,'Hands her case to the porter'],
   [78,7.3,10.45,'Walks to the clock'],
   [110,10.0,6.9,'Waits under the clock'],
   [150,10.0,6.9,'Checks her watch'],
   [156,10.0,6.9,'Waits under the clock'],
   [210,10.0,6.9,'Checks her watch'],
   [216,10.0,6.9,'Waits under the clock'],
   [240,10.0,6.9,'Talks quietly with the man in the grey hat'],
   [300,10.0,6.9,'Checks her watch'],
   [306,10.0,6.9,'Talks quietly with the man in the grey hat'],
   [325,10.0,6.9,'Walks quickly toward the waiting room'],
   [345,5.0,9.85,'Goes into the ladies\' waiting room'],
   [510,5.0,9.85,'Comes out of the waiting room under an umbrella'],
   [513,5.35,9.3,'Takes a plain case from the trolley'],
   [519,5.35,9.3,'Walks into the booking hall'],
   [526,5.0,8.0,'Goes into the booking hall'],
   [531,3.2,10.95,'Comes out of the street door'],
   [533,3.2,10.95,'Checks her watch and walks away down the street'],
   [538,2.3,10.95,'Walks away down the street'],
   [548,0.2,10.95,'Turns the corner'],
  ],
  watchChecks:[[150,156],[210,216],[300,306],[533,538]]},
 {id:'clara', h:72, w:21, skin:'#9a7a62',
  looks:[[0,'greyUmb'],[91,'red']],
  labels:[[0,'A woman in a grey raincoat, under a black umbrella'],[91,'The woman in the red coat']],
  hidden:[[0,18,'street'],[29,36,'hall'],[91,440,'waiting'],[488,601,'front']],
  route:[
   [18,0.2,10.95,'Walks along the street under a black umbrella'],
   [28,3.2,10.95,'Goes in at the street door'],
   [36,5.0,8.0,'Comes out onto the platform'],
   [38,5.0,8.0,'Walks to the ticket window'],
   [48,5.1,5.9,'Waits at the ticket window'],
   [55,5.1,5.9,'Buys a ticket'],
   [68,5.1,5.9,'Tucks her ticket away'],
   [76,5.1,5.9,'Walks to the ladies\' waiting room'],
   [90,5.0,9.85,'Goes into the ladies\' waiting room'],
   [440,5.0,9.85,'Comes out of the waiting room'],
   [443,5.0,9.85,'Walks up the platform, face turned away'],
   [462,9.6,8.8,'Walks toward the front carriage'],
   [486,13.9,4.95,'Boards the front carriage'],
  ],
  watchChecks:[]},
 {id:'harrow', h:90, w:23, skin:'#6e5646',
  looks:[[0,'harrow']], labels:[[0,'Mr. Harrow, the man in the grey hat']],
  hidden:[[502,601,'rear']],
  route:[
   [0,9.2,10.15,'Reads the evening paper on the bench, watching the booking-hall door'],
   [20,9.2,10.15,'Writes something in a small notebook'],
   [28,9.2,10.15,'Reads the evening paper on the bench, watching the booking-hall door'],
   [108,9.2,10.15,'Folds his paper and picks up his case'],
   [150,9.2,10.15,'Takes his case to the porter'],
   [158,8.2,10.25,'Hands his case to the porter'],
   [166,8.2,10.25,'Watches the porter stow his case'],
   [196,8.2,10.25,'Walks toward the clock'],
   [236,11.0,6.4,'Waits by the clock'],
   [240,11.0,6.4,'Talks quietly with the woman in the red coat'],
   [325,11.0,6.4,'Watches the waiting-room door'],
   [350,11.0,6.4,'Writes something in a small notebook'],
   [358,11.0,6.4,'Watches the waiting-room door'],
   [415,11.0,6.4,'Watches the porter load a case into the front carriage'],
   [425,11.0,6.4,'Watches the waiting-room door'],
   [476,11.0,6.4,'Looks up at the station clock'],
   [482,11.0,6.4,'Hurries to the rear carriage'],
   [500,6.7,4.95,'Boards the rear carriage'],
  ],
  watchChecks:[], notebook:[[20,28],[350,358]]},
 {id:'albert', h:86, w:23, skin:'#7a5c48',
  looks:[[0,'porter']], labels:[[0,'Albert, the porter']],
  hidden:[],
  route:[
   [0,6.5,10.15,'Waits by his trolley'],
   [62,6.5,10.15,'Steps forward to take a case'],
   [66,6.6,10.3,'Takes the tan case and puts it on his trolley'],
   [78,6.5,10.15,'Waits by his trolley'],
   [150,6.5,10.15,'Steps forward to take a case'],
   [156,7.4,10.2,'Takes a dark case and puts it on his trolley'],
   [172,6.5,10.15,'Waits by his trolley'],
   [200,6.5,10.15,'Goes round to the trolley handle'],
   [205,7.9,9.15,'Wheels the trolley up the platform'],
   [262,14.6,8.75,'Waits by his trolley'],
   [364,14.6,8.75,'Steps round to the front of his trolley'],
   [368,13.2,9.6,'Tidies the luggage on his trolley'],
   [382,13.2,9.6,'Waits by his trolley'],
   [402,13.2,9.6,'Carries a case to the front carriage'],
   [418,13.9,5.3,'Puts a case into the front carriage'],
   [420,13.9,5.3,'Steps back from the carriage door'],
   [424,13.9,5.3,'Walks back to his trolley'],
   [445,14.6,8.75,'Waits by his trolley'],
   [455,14.6,8.75,'Wheels the trolley back toward the booking hall'],
   [490,7.9,9.15,'Walks round his trolley'],
   [496,6.6,10.1,'Leans on his trolley, watching the train'],
  ],
  watchChecks:[]},
 {id:'dunn', h:82, w:21, skin:'#7e6250',
  looks:[[0,'clerk']], labels:[[0,'Mr. Dunn, the ticket clerk']],
  hidden:[[0,150,'window'],[232,536,'window']],
  route:[
   [0,3.9,5.9,'Behind the ticket window'],
   [149,3.9,5.9,'Behind the ticket window'],
   [150,5.0,8.0,'Comes out carrying a long hooked pole'],
   [154,5.0,8.0,'Walks up the platform with the pole'],
   [182,11.6,7.9,'Waits by the clock'],
   [190,11.6,7.9,'Reaches up to the clock with the hooked pole'],
   [197,11.6,7.9,'Walks back toward the booking hall'],
   [222,4.95,6.9,'Leans the pole beside the ticket window'],
   [226,4.95,6.9,'Goes back into the booking hall'],
   [232,5.0,8.0,'Behind the ticket window'],
   [233,3.9,5.9,'Behind the ticket window'],
   [534,3.9,5.9,'Behind the ticket window'],
   [536,5.0,8.0,'Comes out with a green lamp'],
   [538,5.0,8.0,'Hurries toward the engine'],
   [578,17.4,5.1,'Waits by the engine'],
   [585,17.4,5.1,'Raises the green lamp for the driver'],
  ],
  watchChecks:[]},
 {id:'guard', h:88, w:23, skin:'#6a5040',
  looks:[[0,'guard']], labels:[[0,'The guard']],
  hidden:[[590,601,'rear']],
  route:[
   [0,5.9,5.2,'Waits by the rear carriage'],
   [520,5.9,5.2,'Strolls up the platform'],
   [536,8.2,6.2,'Waits near the clock'],
   [540,8.2,6.2,'Compares his pocket watch with the station clock and frowns'],
   [560,8.2,6.2,'Waits near the clock'],
   [568,8.2,6.2,'Takes a glove from the boy'],
   [576,8.2,6.2,'Waits near the clock'],
   [580,8.2,6.2,'Blows his whistle'],
   [583,8.2,6.2,'Walks to the rear carriage'],
   [589,6.7,4.95,'Boards the rear carriage'],
  ],
  watchChecks:[[540,560]]},
 {id:'tommy', h:58, w:17, skin:'#9a7a62',
  looks:[[0,'boy']], labels:[[0,'Tommy, a boy waiting for his father']],
  hidden:[],
  route:[
   [0,10.7,10.6,'Waits for his father, kicking at a puddle'],
   [334,10.7,10.6,'Runs to something on the ground'],
   [340,8.4,8.2,'Picks up a glove'],
   [343,8.4,8.2,'Runs off with the glove'],
   [362,16.5,10.3,'Turns the glove over in his hands'],
   [548,16.5,10.3,'Walks over to the guard'],
   [568,8.9,6.6,'Hands the glove to the guard'],
   [576,8.9,6.6,'Waits for his father'],
  ],
  watchChecks:[]},
];
const BYID = {}; PEOPLE.forEach(p => BYID[p.id] = p);

// ---------- pure helpers ----------
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function segIndex(route,t){let i=0;while(i<route.length-1&&t>=route[i+1][0]) i++;return i;}
function interval(list,t){for(const iv of list) if(t>=iv[0]&&t<iv[1]) return iv;return null;}
function stepValue(list,t){let v=list[0][1];for(const [a,val] of list) if(t>=a) v=val;return v;}
function pos(id,t){const r=BYID[id].route;t=clamp(t,0,600);if(t<r[0][0]) return [r[0][1],r[0][2]];const i=segIndex(r,t);
  if(i>=r.length-1) return [r[i][1],r[i][2]];const a=r[i],b=r[i+1],u=clamp((t-a[0])/(b[0]-a[0]),0,1);return [a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u];}
function moving(id,t){const r=BYID[id].route;const i=segIndex(r,t);if(i>=r.length-1||t<r[0][0]) return null;const a=r[i],b=r[i+1];
  return (a[1]!==b[1]||a[2]!==b[2])?[b[1]-a[1],b[2]-a[2]]:null;}
function action(id,t){const r=BYID[id].route;if(t<r[0][0]) return r[0][3];return r[segIndex(r,t)][3];}
function hiddenWhere(id,t){const iv=interval(BYID[id].hidden,t);return iv?iv[2]:null;}
function visible(id,t){return hiddenWhere(id,t)===null;}
// present = can speak or be heard: visible, or behind the ticket window
function present(id,t){const w=hiddenWhere(id,t);return w===null||w==='window';}
function look(id,t){const p=BYID[id];return Object.assign({h:p.h,w:p.w,skin:p.skin,key:stepValue(p.looks,t)},LOOK[stepValue(p.looks,t)]);}
function label(id,t){return stepValue(BYID[id].labels,t);}
function checkingWatch(id,t){return !!interval(BYID[id].watchChecks||[],t);}
function writingNotebook(id,t){return !!interval(BYID[id].notebook||[],t);}

// ---------- station clock ----------
// Mr. Dunn pushes the hands forward two minutes with the hooked pole, starting at 9:53:10 (t = 190).
const CLOCK_SET = {start:190, end:196, minutes:2};
function stationOffset(t){if(t<=CLOCK_SET.start) return 0;if(t>=CLOCK_SET.end) return CLOCK_SET.minutes*60;
  return CLOCK_SET.minutes*60*(t-CLOCK_SET.start)/(CLOCK_SET.end-CLOCK_SET.start);}
function stationSeconds(t){return t+stationOffset(t);} // seconds after 9:50:00 shown by the station clock
function hm(sec){const m=50+Math.floor(sec/60);return m>=60?`10:${String(m-60).padStart(2,'0')}`:`9:${String(m).padStart(2,'0')}`;}
function hms(sec){const s=Math.floor(sec+1e-6);const m=50+Math.floor(s/60),x=s%60;return (m>=60?`10:${String(m-60).padStart(2,'0')}`:`9:${String(m).padStart(2,'0')}`)+':'+String(x).padStart(2,'0');}

// ---------- trolley ----------
function lerp2(a,b,u){return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];}
function trolley(t){const T1=PLACES.T1,T2=PLACES.T2;
  if(t<205) return T1.slice();if(t<262) return lerp2(T1,T2,(t-205)/57);
  if(t<455) return T2.slice();if(t<490) return lerp2(T2,T1,(t-455)/35);return T1.slice();}
function slot(k,tr){return k===1?[tr[0]+0.5,tr[1]+0.45]:k===2?[tr[0]+1.22,tr[1]+0.45]:[tr[0]+1.45,tr[1]+0.2];}

// ---------- the red strap ----------
// Ownership of the red strap changes exactly once, at 9:56:12 (t = 372), from Evelyn's case to Mr. Harrow's.
const STRAP_MOVE = {at:372, done:377};
function strapOwner(t){return t<STRAP_MOVE.at?'evelyn':'harrow';}
// for drawing: where the strap physically is ('case:evelyn', 'hand:albert', 'case:harrow')
function strapWhere(t){return t<STRAP_MOVE.at?'case:evelyn':t<STRAP_MOVE.done?'hand:albert':'case:harrow';}

// ---------- cases ----------
// Evelyn's tan case holds the ledger. Mr. Harrow's dark case has the inquiry agents' tag.
const CASES = {
  evelyn:{col:'#8a6a3e', tag:null, ledger:true},
  harrow:{col:'#3b2a1c', tag:'Crane & Voss, Inquiry Agents', ledger:false},
};
// returns {where:'hidden'|'hand'|'trolley'|'ground'|'carriage', holder, slot, x, y}
function caseState(cid,t){const tr=trolley(t);
  const on=(k)=>{const s=slot(k,tr);return {where:'trolley',slot:k,x:s[0],y:s[1]};};
  const hand=(who)=>{const p=pos(who,t);return {where:'hand',holder:who,x:p[0]+0.35,y:p[1]+0.1};};
  if(cid==='evelyn'){
    if(t<40) return {where:'hidden',holder:'evelyn'};
    if(t<66) return hand('evelyn');
    if(t<70) return hand('albert');
    if(t<516) return on(1);
    if(t<527||(t>=531&&t<549)) return hand('evelyn');
    return {where:'hidden',holder:'evelyn'};
  }
  if(t<108) return {where:'ground',x:9.9,y:10.25};
  if(t<156) return hand('harrow');
  if(t<164) return hand('albert');
  if(t<402) return on(2);
  if(t<420) return hand('albert');
  return {where:'carriage',carriage:'front',x:PLACES.frontDoor[0],y:PLACES.frontDoor[1]};
}
function lunchTin(t){const s=slot(3,trolley(t));return {x:s[0],y:s[1]};}

// ---------- other props ----------
function glove(t){if(t<332) return {where:'hidden'};if(t<340) return {where:'ground',x:8.25,y:7.93};
  if(t<569) return {where:'hand',holder:'tommy'};return {where:'hand',holder:'guard'};}
function pole(t){if(t<150) return {where:'hidden'};if(t<222) return {where:'hand',holder:'dunn'};return {where:'leaning',x:PLACES.poleRest[0],y:PLACES.poleRest[1]};}
function greenLamp(t){return t>=536?{where:'hand',holder:'dunn',raised:t>=585}:{where:'hidden'};}
const BLIND_DOWN = 480; // a sleepy passenger pulls down a blind in the rear carriage (red herring)
function doorOpen(d,t){return DOORS[d].open.some(([a,b])=>t>=a&&t<b);}

// ---------- overheard lines ----------
// A line appears only while you follow its speaker or listener, both are present and within HEAR_RADIUS.
// listener null means a mutter: only following the speaker hears it.
const HEAR_RADIUS = 1.6;
const LINES = [
 {id:'ticket',   speaker:'clara',  listener:'dunn',   from:56,  to:62,  text:'Single to Kingsbridge, please. The ten o\u2019clock.'},
 {id:'pell',     speaker:'dunn',   listener:'clara',  from:62,  to:67,  text:'Right you are, Miss Pell.'},
 {id:'bertie',   speaker:'evelyn', listener:'albert', from:66,  to:74,  text:'Mind it carefully, Bertie.'},
 {id:'crane',    speaker:'harrow', listener:'evelyn', from:258, to:268, text:'Mr. Crane only wants the book, Miss Hart.'},
 {id:'arrive',   speaker:'evelyn', listener:'harrow', from:272, to:280, text:'You\u2019ll have it when we arrive.'},
 {id:'freshen',  speaker:'evelyn', listener:'harrow', from:318, to:325, text:'I\u2019ll just freshen up before the train.'},
 {id:'fine',     speaker:'harrow', listener:null,     from:477, to:484, text:'Cutting it fine.'},
 {id:'safehome', speaker:'albert', listener:'evelyn', from:514, to:520, text:'Safe home, Evie. I\u2019ll tell Mum.'},
 {id:'notright', speaker:'guard',  listener:null,     from:544, to:552, text:'Hm. That\u2019s not right.'},
 {id:'dropped',  speaker:'tommy',  listener:'guard',  from:568, to:574, text:'Please, sir, a lady dropped this.'},
];
function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1]);}
function overheard(followId,t){if(!followId) return [];const out=[];
  for(const L of LINES){if(t<L.from||t>=L.to) continue;
    if(L.listener===null){if(followId===L.speaker&&present(L.speaker,t)) out.push(L);continue;}
    if(followId!==L.speaker&&followId!==L.listener) continue;
    if(!present(L.speaker,t)||!present(L.listener,t)) continue;
    if(dist(pos(L.speaker,t),pos(L.listener,t))<=HEAR_RADIUS) out.push(L);}
  return out;}

// ---------- clickable clues ----------
// target: what you click. Each clue has a window [from, to) when it can be found.
// text may be a function of t (the notebook stores the text as it read when found).
const CLUES = [
 {id:'tag',        target:'case:harrow', from:0,   to:372, title:'Luggage tag', text:'A dark leather case, the one the man in the grey hat carried. Its tag reads \u201cCrane & Voss, Inquiry Agents.\u201d'},
 {id:'tag_strap',  target:'case:harrow', from:377, to:420, title:'The red-strapped case', text:'The dark case now has a red strap around it. Under the strap, its tag still reads \u201cCrane & Voss, Inquiry Agents.\u201d'},
 {id:'ledger',     target:'case:evelyn', from:40,  to:372, title:'The tan case', text:'A tan case with a red strap. Through a gap in the lid you can see a thick bound ledger.'},
 {id:'plain_case', target:'case:evelyn', from:377, to:549, title:'The plain case', text:'The tan case with the ledger inside. It has no strap now.'},
 {id:'tin',        target:'tin',         from:0,   to:601, title:'Lunch tin', text:'The porter\u2019s lunch tin, on the end of his trolley. Painted on the lid: A. HART.'},
 {id:'pole',       target:'pole',        from:150, to:601, title:'Hooked pole', text:'A long pole with a hook on the end, the kind used to move the hands of a tall clock. It belongs by the ticket window.'},
 {id:'clock_early',target:'clock',       from:0,   to:190, title:'The station clock', text:t=>`At ${hms(t)} by the true time, the station clock showed ${hms(stationSeconds(t))}.`},
 {id:'clock_late', target:'clock',       from:196, to:601, title:'The station clock, later', text:t=>`At ${hms(t)} by the true time, the station clock showed ${hms(stationSeconds(t))}.`},
 {id:'guard_watch',target:'person:guard',from:540, to:560, title:'The guard\u2019s watch', text:t=>`The guard\u2019s pocket watch says ${hm(t)}. He frowns up at the station clock, which says ${hm(stationSeconds(t))}.`},
 {id:'notebook',   target:'person:harrow',from:20, to:28,  title:'Mr. Harrow\u2019s notebook', text:'Over his shoulder, a column of times in a small notebook: 9.41, 9.46, 9.50. Nothing else.', alsoFrom:350, alsoTo:358},
 {id:'wr_sign',    target:'wrdoor',      from:0,   to:601, title:'Ladies\u2019 waiting room', text:'LADIES\u2019 WAITING ROOM. A small room with one door, onto the platform. There is no other way out.'},
 {id:'street_in',  target:'streetdoor',  from:22,  to:34,  title:'The street door', text:'Someone under a black umbrella comes in from the street.'},
 {id:'street_out', target:'streetdoor',  from:526, to:549, title:'The street door, later', text:'The street door swings shut behind someone under a black umbrella, going out to the road.'},
 {id:'front_rack', target:'frontdoor',   from:420, to:590, title:'Front carriage luggage', text:'Through the open door of the front carriage: a dark case with a red strap, up in the luggage rack.'},
 {id:'glove',      target:'glove',       from:332, to:340, title:'A dropped glove', text:'A lady\u2019s grey kid glove, dropped on the wet stones.'},
 {id:'tommy_glove',target:'person:tommy',from:343, to:569, title:'Tommy\u2019s glove', text:'The boy is turning a lady\u2019s grey glove over in his hands, as if it were treasure.'},
 {id:'blind',      target:'blind',       from:480, to:590, title:'A blind comes down', text:'In the rear carriage, a passenger has pulled down the blind. Behind it, someone settles in for a nap.'},
];
function clueActive(c,t){return (t>=c.from&&t<c.to)||(c.alsoFrom!==undefined&&t>=c.alsoFrom&&t<c.alsoTo);}
function clueFor(target,t){for(const c of CLUES) if(c.target===target&&clueActive(c,t)) return c;return null;}
function clueText(c,t){return typeof c.text==='function'?c.text(t):c.text;}

// ---------- intro, cast list, questions, hints ----------
const INTRO = {
  title:'The Last Ten Minutes',
  lines:['Ashcombe Halt, 9:50 p.m. Rain. The ten o\u2019clock to Kingsbridge leaves on time.',
   'Evelyn Hart, the woman in the red coat, was on the platform. When the train pulled out she was gone, and the man who was watching her is sure she got on.',
   'Scrub back and forth through the last ten minutes. Follow people to overhear them, and tap anything worth noting to save it in your notebook. When you think you know what happened, answer the six questions.'],
};
const CAST = [
 ['Evelyn Hart','The woman in the red coat and cloche hat.'],
 ['Mr. Harrow','The man in the grey hat, with a dark case.'],
 ['Clara Pell','Came in from the street in a grey raincoat, under a black umbrella.'],
 ['Albert','The porter, with his luggage trolley.'],
 ['Mr. Dunn','The ticket clerk.'],
 ['The guard','In charge of the train.'],
 ['Tommy','A boy waiting for his father.'],
];
const PEOPLE_OPTS = ['Evelyn Hart','Mr. Harrow','Clara Pell','Albert','Mr. Dunn','The guard','Tommy'];
const TIME_OPTS = ['9:50','9:51','9:52','9:53','9:54','9:55','9:56','9:57','9:58','9:59','10:00'];
const QUESTIONS = [
 {id:'q1', set:1, parts:['','moved the red strap onto','\u2019s case, at about','.'], blanks:[PEOPLE_OPTS,PEOPLE_OPTS,TIME_OPTS],
  hints:['Watch the porter\u2019s trolley and the two cases on it.','Look between 9:56 and 9:57, when the trolley is up the platform.','Compare the case colours and the tag before and after the strap moves.']},
 {id:'q2', set:1, parts:['The person in the red coat who boarded the train was','.'], blanks:[PEOPLE_OPTS],
  hints:['Watch the ladies\u2019 waiting-room door.','See who goes in and who comes out between 9:51 and 9:58:30.','Compare heights, and who checks a watch.']},
 {id:'q3', set:1, parts:['Evelyn left the station through','wearing','\u2019s coat.'], blanks:[['the front carriage','the rear carriage','the street door','the far end of the platform','the ticket window'],PEOPLE_OPTS],
  hints:['Watch the waiting-room door after the train is boarded.','Look from 9:58:30 to 9:59.','Who went in wearing grey, and does the grey coat come out the same height?']},
 {id:'q4', set:2, parts:['The station clock was wrong because','set it','minutes fast.'], blanks:[PEOPLE_OPTS,['1','2','3','4','5','10']],
  hints:['Watch the station clock and whoever goes near it.','Look around 9:53.','Tap the clock before and after, and compare it with the time slider and the guard\u2019s watch.']},
 {id:'q5', set:2, parts:['Mr. Harrow worked for','and wanted','.'], blanks:[['Mr. Crane','the railway company','the police','Clara Pell','Mr. Dunn','nobody'],['the book','the red coat','a train ticket','the glove','money','Clara Pell']],
  hints:['Follow Mr. Harrow, and look closely at his case.','Listen to him under the clock between 9:54 and 9:55:30.','Put his luggage tag together with what he says he wants.']},
 {id:'q6', set:2, parts:['Albert is Evelyn\u2019s','.'], blanks:[['brother','husband','cousin','fianc\u00e9','old friend','a stranger']],
  hints:['Follow the porter when Evelyn hands him her case.','Listen at about 9:51:10, and later when he leaves the trolley by the booking hall.','What does she call him, what does he call her, and what name is on his lunch tin?']},
];
// Answers are stored only as salted hashes. Plain answers live outside the public build.
function answerHash(qid,i,value){let h=0x811c9dc5;const s='ashcombe|'+qid+'|'+i+'|'+value;for(let k=0;k<s.length;k++){h^=s.charCodeAt(k);h=Math.imul(h,0x01000193)>>>0;}return h.toString(16).padStart(8,'0');}
const ANSWER_HASHES = {"q1":["6c167f69","4f4c3bde","2add4f49"],"q2":["83cdc4ce"],"q3":["02d9747d","820b52d6"],"q4":["283c886c","132f0d0b"],"q5":["0763662b","e1a85ae6"],"q6":["581562a6"]};
function questionCorrect(qid,values){const hs=ANSWER_HASHES[qid];return values.length===hs.length&&values.every((v,i)=>answerHash(qid,i,v)===hs[i]);}
function checkSet(setNo,answers){const qs=QUESTIONS.filter(q=>q.set===setNo);let right=0;for(const q of qs) if(questionCorrect(q.id,answers[q.id]||[])) right++;return {right,total:qs.length,solved:right===qs.length};}

const ENDING = {
  lines:['10:00 p.m. The ten o\u2019clock pulls out on time, with Mr. Harrow aboard, sure he has her.',
   'On the road outside, a black umbrella turns the corner. The ledger is safe, and so is Evelyn.'],
};

return {PLACES,DOORS,LOOK,PEOPLE,BYID,pos,moving,action,hiddenWhere,visible,present,look,label,checkingWatch,writingNotebook,
  CLOCK_SET,stationOffset,stationSeconds,hm,hms,trolley,slot,STRAP_MOVE,strapOwner,strapWhere,CASES,caseState,lunchTin,glove,pole,greenLamp,BLIND_DOWN,doorOpen,
  HEAR_RADIUS,LINES,overheard,dist,CLUES,clueActive,clueFor,clueText,INTRO,CAST,QUESTIONS,PEOPLE_OPTS,TIME_OPTS,answerHash,ANSWER_HASHES,questionCorrect,checkSet,ENDING};
})();
if(typeof module!=='undefined') module.exports=STORY;
