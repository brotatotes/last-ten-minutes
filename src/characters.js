// The Last Ten Minutes: characters, following and the planted clue.
// Everything is a pure function of t.
'use strict';
(function(){
const A=LTM.API,PZ=LTM.PZ;
// route keyframes: [t, x, y, action]. Position interpolates linearly; action shown is the segment's.
const CHARS=[
 {id:'evelyn',name:'Evelyn Hart',desc:'the woman in the red coat',look:{coat:'#b3261e',hat:'cloche',hatCol:'#7a1712',skin:'#8a6a55',h:84,w:22},
  hiddenBefore:40,hiddenAfter:525,
  route:[[0,3.9,8.6,'Inside the booking hall'],[40,5.0,8.6,'Steps out of the booking hall'],[62,5.2,9.7,'Hands her case to the porter'],
   [92,5.2,9.7,'Walks to the clock'],[130,10.4,8.0,'Waits under the clock, checking her watch'],[240,10.4,8.0,'Crosses to the man in the grey hat'],
   [252,11.6,6.6,'Talks quietly with the man in the grey hat'],[330,11.6,6.6,'Walks to the platform edge'],[348,12.8,5.4,'Watches the line for the train crew'],
   [470,12.8,5.4,'Walks to the front carriage'],[515,13.9,5.0,'Boards the front carriage'],[525,13.9,5.0,'Aboard the front carriage']]},
 {id:'harrow',name:'Mr. Harrow',desc:'the man in the grey hat',look:{coat:'#3c3f45',hat:'fedora',hatCol:'#15171b',h:90,w:23},
  hiddenAfter:548,
  route:[[0,8.2,9.0,'Reads the evening paper on the bench'],[110,8.2,9.0,'Folds his paper and picks up his case'],[118,8.2,9.0,'Takes his case to the porter'],
   [150,7.2,10.6,'Hands his case to the porter'],[165,7.2,10.6,'Walks toward the clock'],[235,12.7,6.9,'Waits near the clock'],
   [252,12.7,6.9,'Talks quietly with the woman in the red coat'],[330,12.7,6.9,'Walks to the platform edge'],[348,15.4,6.3,'Stands at the edge, hands in pockets'],
   [505,15.4,6.3,'Checks his watch and walks to the rear carriage'],[542,6.7,5.0,'Boards the rear carriage'],[548,6.7,5.0,'Aboard the rear carriage']]},
 {id:'porter',name:'Albert',desc:'the porter',look:{coat:'#26303d',hat:'cap',h:86,w:23},
  route:[[0,7.5,9.75,'Waits by his trolley'],[62,7.5,9.75,'Takes the woman\'s case'],[92,7.5,9.75,'Waits by his trolley'],[150,7.5,9.75,'Takes the man\'s case'],
   [165,7.5,9.75,'Waits by his trolley'],[200,7.5,9.75,'Wheels the trolley up the platform'],[260,12.2,8.7,'Waits by his trolley'],
   [372,12.2,8.7,'Tidies the luggage on his trolley'],[392,12.2,8.7,'Waits by his trolley'],
   [430,12.2,8.7,'Carries a case to the front carriage'],[460,13.6,5.1,'Loads a case into the front carriage'],[466,13.6,5.1,'Walks back to his trolley'],
   [482,12.2,8.7,'Carries a case to the rear carriage'],[515,7.0,5.1,'Loads a case into the rear carriage'],[521,7.0,5.1,'Walks back to his trolley'],
   [560,12.2,8.7,'Leans on his trolley, watching the train']]},
 {id:'dunn',name:'Mr. Dunn',desc:'the ticket clerk',look:{coat:'#2d2a33',hat:'cap',hatCol:'#101318',h:82,w:21},
  hiddenBefore:480,
  route:[[0,3.9,6.5,'Behind the ticket window'],[480,5.0,8.6,'Steps out of the booking hall'],[486,5.0,8.6,'Walks to the clock'],
   [512,10.4,8.3,'Compares his watch with the clock'],[555,10.4,8.3,'Walks to the engine'],[585,17.4,5.1,'Raises the green lamp for the driver'],[600,17.4,5.1,'Raises the green lamp for the driver']]},
];
const BYID={};CHARS.forEach(c=>BYID[c.id]=c);
function seg(c,t){const r=c.route;let i=0;while(i<r.length-1&&t>=r[i+1][0]) i++;return i;}
function posOf(c,t){const r=c.route,i=seg(c,t);if(i>=r.length-1) return [r[i][1],r[i][2],false,r[i][3]];
  const a=r[i],b=r[i+1],u=A.clamp((t-a[0])/(b[0]-a[0]),0,1);const x=a[1]+(b[1]-a[1])*u,y=a[2]+(b[2]-a[2])*u;
  const moving=(a[1]!==b[1]||a[2]!==b[2]);return [x,y,moving,a[3],b[1]-a[1],b[2]-a[2]];}
function visible(c,t){return !(c.hiddenBefore!==undefined&&t<c.hiddenBefore)&&!(c.hiddenAfter!==undefined&&t>=c.hiddenAfter);}

// trolley: origin (x,y) of its box
function trolleyPos(t){const u=A.smooth(200,260,t);return [5.6+(12.6-5.6)*u,9.3+(8.2-9.3)*u];}
const CASE_RED={col:'#8a6a3e',strap:'#b3261e',owner:'evelyn'},CASE_DARK={col:'#3b2a1c',strap:null,owner:'harrow'};
function slotPos(s,tr){return s===1?[tr[0]+0.5,tr[1]+0.45]:[tr[0]+1.22,tr[1]+0.45];}
// returns list of {c:case, x,y,z}
function cases(t){
  const tr=trolleyPos(t),out=[],por=posOf(BYID.porter,t),ev=posOf(BYID.evelyn,t),ha=posOf(BYID.harrow,t);
  const hand=(p)=>[p[0]+0.35,p[1]+0.1,PZ+0.35];
  // red-strap case
  if(t<62){ if(t>=40) out.push({c:CASE_RED,p:hand(ev)}); else {} }
  else if(t<68){out.push({c:CASE_RED,p:hand(ev)});}
  else if(t<372){const s=slotPos(1,tr);out.push({c:CASE_RED,p:[s[0],s[1],PZ+0.35]});}
  // dark case
  if(t<150){out.push({c:CASE_DARK,p:t<118?[8.9,9.4,PZ]:hand(ha)});}
  else if(t<156){out.push({c:CASE_DARK,p:hand(ha)});}
  else if(t<372){const s=slotPos(2,tr);out.push({c:CASE_DARK,p:[s[0],s[1],PZ+0.35]});}
  // the swap, 372 to 392
  if(t>=372&&t<392){
    const s1=slotPos(1,tr),s2=slotPos(2,tr),side=[tr[0]+0.9,tr[1]+1.25];
    const lerp=(a,b,u)=>[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];
    let red,dark;
    if(t<379){const u=A.smooth(372,379,t);red=[...lerp(s1,side,u),PZ+0.35-0.35*u+0.3*Math.sin(u*Math.PI)];dark=[s2[0],s2[1],PZ+0.35];}
    else if(t<385){const u=A.smooth(379,385,t);red=[side[0],side[1],PZ];dark=[...lerp(s2,s1,u),PZ+0.35+0.3*Math.sin(u*Math.PI)];}
    else{const u=A.smooth(385,392,t);red=[...lerp(side,s2,u),PZ+0.35*u+0.3*Math.sin(u*Math.PI)];dark=[s1[0],s1[1],PZ+0.35];}
    out.push({c:CASE_RED,p:red},{c:CASE_DARK,p:dark});
  }
  if(t>=392){
    // slot 1 now holds the dark case, slot 2 the red-strapped one
    if(t<430){const s=slotPos(1,tr);out.push({c:CASE_DARK,p:[s[0],s[1],PZ+0.35]});}
    else if(t<462){out.push({c:CASE_DARK,p:hand(por)});}
    if(t<482){const s=slotPos(2,tr);out.push({c:CASE_RED,p:[s[0],s[1],PZ+0.35]});}
    else if(t<517){out.push({c:CASE_RED,p:hand(por)});}
  }
  return out;
}
function drawCase(k){const [x,y,z]=k.p,c=k.c;A.box(x-0.28,x+0.28,y-0.2,y+0.2,z,z+0.34,shade(c.col,1.15),c.col,shade(c.col,0.75));
  if(c.strap) A.box(x-0.05,x+0.05,y-0.21,y+0.21,z,z+0.345,c.strap,c.strap,'#7a1712');
  A.box(x-0.08,x+0.08,y-0.02,y+0.02,z+0.34,z+0.4,'#6a5a3a','#5a4a2a','#4a3a20');}
function shade(hex,k){const n=parseInt(hex.slice(1),16);const f=v=>Math.min(255,Math.round(v*k));return `rgb(${f((n>>16)&255)},${f((n>>8)&255)},${f(n&255)})`;}

function trolley(x,y){const b=A.box,P=A.P,g=A.g;
  // platform luggage barrow: slatted deck, two big spoked wheels, low castors, raised end rail and a long handle
  const wheel=(wx,wy,r)=>{const [a,bb]=P(wx,wy,PZ+r/40);g.fillStyle='#0b0b0c';g.beginPath();g.ellipse(a,bb,r*0.62,r,0,0,7);g.fill();g.strokeStyle='#4a4038';g.lineWidth=1.5;g.stroke();
    g.strokeStyle='#2c2621';g.lineWidth=1;for(let k=0;k<4;k++){const an=k*Math.PI/4;g.beginPath();g.moveTo(a-Math.cos(an)*r*0.55,bb-Math.sin(an)*r*0.9);g.lineTo(a+Math.cos(an)*r*0.55,bb+Math.sin(an)*r*0.9);g.stroke();}};
  wheel(x+0.35,y-0.02,6);wheel(x+1.25,y-0.02,6);
  b(x,x+1.6,y,y+0.9,PZ+0.3,PZ+0.38,'#4a3a28','#33271b','#2a2016');
  for(let k=1;k<5;k++){const q=P(x+k*0.32,y,PZ+0.38),r=P(x+k*0.32,y+0.9,PZ+0.38);g.strokeStyle='rgba(20,14,8,0.7)';g.lineWidth=1;g.beginPath();g.moveTo(q[0],q[1]);g.lineTo(r[0],r[1]);g.stroke();}
  b(x-0.06,x,y,y+0.9,PZ+0.38,PZ+0.95,'#2a2420','#1e1a17','#191512');
  wheel(x+0.8,y+0.95,11);
  const [a,bb]=P(x+1.6,y+0.2,PZ+0.38),[c1,d1]=P(x+2.3,y+0.2,PZ+1.25),[a2,b2]=P(x+1.6,y+0.7,PZ+0.38),[c2,d2]=P(x+2.3,y+0.7,PZ+1.25);
  g.strokeStyle='#1a1b1f';g.lineWidth=3;g.beginPath();g.moveTo(a,bb);g.lineTo(c1,d1);g.moveTo(a2,b2);g.lineTo(c2,d2);g.moveTo(c1,d1);g.lineTo(c2,d2);g.stroke();}

function person(x,y,o,t,moving,dx,dy){
  const g=A.g,[a,b]=A.P(x,y,PZ),h=o.h,w=o.w;
  const face=(dx||0)-(dy||0)>=0?1:-1; // screen direction
  const ph=moving?Math.sin(t*7.5):0,bob=moving?Math.abs(Math.sin(t*7.5))*2.2:0;
  // soft, blurred reflection of the figure on the wet stone
  {const c=o.coat.length===7?parseInt(o.coat.slice(1),16):0x333333;A.softBlob(a,b+h*0.34,w*0.55,h*0.36,`${(c>>16)&255},${(c>>8)&255},${c&255}`,0.32);}
  g.fillStyle='rgba(0,0,0,0.45)';g.beginPath();g.ellipse(a+4,b+2,w*0.95,w*0.38,0,0,7);g.fill();
  const by=b-bob,hip=by-h*0.36;
  // legs: two segments that swing from the hip, shoes on the ground
  g.strokeStyle='#0d0f13';g.lineCap='round';g.lineWidth=w*0.24;
  for(const s of [-1,1]){const sw=s*ph*w*0.42;const fx=a+s*w*0.16+sw*face,fy=b-1-(moving&&s*ph>0?Math.abs(ph)*2.5:0);
    g.beginPath();g.moveTo(a+s*w*0.16,hip);g.lineTo((a+s*w*0.16+fx)/2+face*Math.abs(sw)*0.15,(hip+fy)/2);g.lineTo(fx,fy);g.stroke();
    g.fillStyle='#07080a';g.beginPath();g.ellipse(fx+face*2,fy,w*0.2,w*0.1,0,0,7);g.fill();}
  // coat: flared skirt, narrow shoulders
  g.beginPath();g.moveTo(a-w*0.62,by-h*0.26);g.lineTo(a-w*0.46,by-h*0.8);g.quadraticCurveTo(a,by-h*0.9,a+w*0.46,by-h*0.8);g.lineTo(a+w*0.62,by-h*0.26);g.quadraticCurveTo(a,by-h*0.22,a-w*0.62,by-h*0.26);g.closePath();
  g.fillStyle=o.coat;g.fill();
  g.save();g.clip();g.fillStyle='rgba(255,180,90,0.24)';g.fillRect(face>0?a:a-w*0.8,by-h,w*0.8,h);g.fillStyle='rgba(0,0,0,0.18)';g.fillRect(a-w,by-h*0.5,w*2,2);
  g.fillStyle='rgba(0,0,0,0.25)';g.fillRect(a-0.8,by-h*0.8,1.6,h*0.55);g.restore();
  // arms swing opposite the legs
  g.strokeStyle=shade(o.coat.length===7?o.coat:'#333333',0.72);g.lineWidth=w*0.22;
  for(const s of [-1,1]){const sw=moving?-s*ph*w*0.35*face:0;g.beginPath();g.moveTo(a+s*w*0.44,by-h*0.77);g.lineTo(a+s*w*0.52+sw,by-h*0.44);g.stroke();
    g.fillStyle=o.skin||'#6e5646';g.beginPath();g.arc(a+s*w*0.52+sw,by-h*0.42,w*0.1,0,7);g.fill();}
  g.lineCap='butt';
  g.fillStyle=o.skin||'#6e5646';g.fillRect(a-w*0.1,by-h*0.9,w*0.2,h*0.05);
  g.beginPath();g.arc(a+face*1,by-h*0.96,w*0.33,0,7);g.fill();
  g.fillStyle='rgba(255,190,120,0.25)';g.beginPath();g.arc(a+face*3,by-h*0.965,w*0.2,0,7);g.fill();
  if(o.hat==='fedora'){g.fillStyle=o.hatCol;g.beginPath();g.ellipse(a,by-h*1.03,w*0.68,w*0.18,0,0,7);g.fill();g.beginPath();g.moveTo(a-w*0.34,by-h*1.04);g.lineTo(a-w*0.3,by-h*1.16);g.quadraticCurveTo(a,by-h*1.12,a+w*0.3,by-h*1.16);g.lineTo(a+w*0.34,by-h*1.04);g.fill();g.fillStyle='#2e3238';g.fillRect(a-w*0.34,by-h*1.065,w*0.68,h*0.025);}
  if(o.hat==='cap'){g.fillStyle=o.hatCol||'#1b2230';g.beginPath();g.ellipse(a,by-h*1.07,w*0.4,w*0.2,0,0,7);g.fill();g.fillRect(a-w*0.36,by-h*1.07,w*0.72,h*0.055);g.fillRect(a+(face>0?0:-w*0.55),by-h*1.025,w*0.55,h*0.025);g.fillStyle='#8a6a34';g.fillRect(a-w*0.12,by-h*1.06,w*0.24,h*0.02);}
  if(o.hat==='cloche'){g.fillStyle=o.hatCol;g.beginPath();g.ellipse(a,by-h*1.0,w*0.44,w*0.4,0,Math.PI,0);g.fill();g.beginPath();g.ellipse(a,by-h*1.0,w*0.54,w*0.1,0,0,7);g.fill();}
  return by;
}
function extras(c,x,y,t,by){const g=A.g,[a]=A.P(x,y,PZ),o=c.look,h=o.h,w=o.w;
  if(c.id==='harrow'&&t<110){g.fillStyle='#b9ae94';g.fillRect(a-w*0.75,by-h*0.78,w*1.5,h*0.3);g.strokeStyle='rgba(60,50,40,0.6)';g.beginPath();g.moveTo(a,by-h*0.78);g.lineTo(a,by-h*0.48);g.stroke();}
  if(c.id==='dunn'&&t>=585){const [lx,ly]=[a+w*0.8,by-h*1.15];g.strokeStyle='#15161a';g.lineWidth=2;g.beginPath();g.moveTo(a+w*0.5,by-h*0.8);g.lineTo(lx,ly);g.stroke();g.fillStyle='#6fe08a';g.beginPath();g.arc(lx,ly,4,0,7);g.fill();A.glow(lx,ly,50,'120,255,150',0.55);}
}
// seated harrow sits lower on the bench
function actors(t){
  const items=[];const tr=trolleyPos(t);
  items.push({depth:tr[0]+tr[1]+1.2,draw:()=>trolley(tr[0],tr[1])});
  for(const k of cases(t)) items.push({depth:k.p[0]+k.p[1]+0.05+(k.p[2]>PZ+0.2?0.9:0),draw:()=>drawCase(k)});
  for(const c of CHARS){if(!visible(c,t)) continue;const [x,y,mv,,dx,dy]=posOf(c,t);
    const seated=c.id==='harrow'&&t<118;
    items.push({depth:x+y+0.3,draw:()=>{const by=person(x,y+(seated?-0.2:0),seated?{...c.look,h:c.look.h*0.82}:c.look,t,mv,dx,dy);extras(c,x,y,t,by);
      if(window.LTM_STATE&&window.LTM_STATE.follow===c.id){const g=A.g,[a,b]=A.P(x,y,PZ);g.strokeStyle='rgba(233,220,192,0.7)';g.lineWidth=1.5;g.beginPath();g.ellipse(a,b,c.look.w*1.3,c.look.w*0.5,0,0,7);g.stroke();}}});}
  return items;
}
window.LTM_actors=actors;
window.LTM_clerkIn=t=>t<480;
window.LTM_positionOf=(id,t)=>{const c=BYID[id];if(!c) return null;const p=posOf(c,t);return [p[0],p[1]];};
window.LTM_characters={CHARS,posOf,visible,cases,trolleyPos,actionOf:(id,t)=>{const c=BYID[id];if(!visible(c,t)){return t<(c.hiddenBefore||0)?c.route[0][3]:c.route[c.route.length-1][3];}return posOf(c,t)[3];}};

// ---- following
const followEl=document.getElementById('follow');
function showFollow(){const st=window.LTM_STATE;if(!st||!st.follow){followEl.style.display='none';return;}const c=BYID[st.follow];
  followEl.style.display='block';followEl.innerHTML='';const b=document.createElement('b');b.textContent=c.name;followEl.appendChild(b);followEl.appendChild(document.createTextNode(', '+c.desc+'. '+window.LTM_characters.actionOf(c.id,st.t)+'.'));}
let lastFollowText='';
window.LTM_afterDraw=st=>{const txt=st.follow?st.follow+'|'+window.LTM_characters.actionOf(st.follow,st.t):'';if(txt!==lastFollowText){lastFollowText=txt;showFollow();}};
function follow(id){const st=window.LTM_STATE;st.follow=id;st.dirty=true;lastFollowText='';showFollow();}
window.LTM_onFollow=follow;
window.LTM_onTap=(sx,sy)=>{const st=window.LTM_STATE;let best=null,bd=1e9;
  for(const c of CHARS){if(!visible(c,st.t)) continue;const p=posOf(c,st.t);const [a,b]=LTM.worldToScreen(p[0],p[1],PZ,st.cam,st.W,st.H);
    const hh=c.look.h*st.cam.zoom;const cy=b-hh*0.55;const d=Math.hypot((sx-a)/Math.max(18,c.look.w*st.cam.zoom),(sy-cy)/(hh*0.7));if(d<bd){bd=d;best=c;}}
  follow(best&&bd<1.6?best.id:null);};
window.LTM_onKey=e=>{const st=window.LTM_STATE;if(e.key==='f'||e.key==='F'){const vis=CHARS.filter(c=>visible(c,st.t));if(!vis.length) return;const i=vis.findIndex(c=>c.id===st.follow);follow(vis[(i+1)%vis.length].id);}
  else if(e.key==='Escape'){if(document.getElementById('endcard').style.display==='flex') closeEnd();else follow(null);}};

// ---- end question
const endEl=document.getElementById('endcard');let endShown=false;
const OPTIONS=[['nothing','Nothing out of the ordinary'],['swap','Swapped the two cases, so her case went into the other carriage'],['lost','Left one of the cases behind on the platform'],['harrow','Gave both cases to the man in the grey hat']];
function openEnd(){endShown=true;endEl.innerHTML='';const card=document.createElement('div');card.className='card';
  const h2=document.createElement('h2');h2.textContent='10:00 p.m. The train has gone.';card.appendChild(h2);
  const q=document.createElement('div');q.textContent='What did the porter do with the luggage?';card.appendChild(q);
  const opts=document.createElement('div');opts.className='opts';for(const [k,label] of OPTIONS){const bt=document.createElement('button');bt.textContent=label;bt.dataset.answer=k;bt.addEventListener('click',()=>answer(k));opts.appendChild(bt);}card.appendChild(opts);
  const fb=document.createElement('div');fb.id='feedback';fb.setAttribute('aria-live','polite');card.appendChild(fb);
  const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;justify-content:center';
  const rb=document.createElement('button');rb.textContent='Watch again from 9:50';rb.id='replay';rb.addEventListener('click',()=>{closeEnd();window.LTM_app.setT(0);});
  const cb=document.createElement('button');cb.textContent='Keep looking';cb.id='closeend';cb.addEventListener('click',closeEnd);row.appendChild(rb);row.appendChild(cb);card.appendChild(row);
  endEl.appendChild(card);endEl.style.display='flex';document.body.classList.add('ended');opts.querySelector('button').focus({focusVisible:false});}
function closeEnd(){endEl.style.display='none';document.body.classList.remove('ended');}
function answer(k){const fb=document.getElementById('feedback');
  fb.textContent=k==='swap'?'Yes. Her red-strapped case went into the rear carriage with Mr. Harrow, and his went with her. Now, was it an accident?'
   :'Not quite. Try watching the porter and his trolley between 9:56 and 9:57.';}
window.LTM_onTime=t=>{if(t>=600&&!endShown) openEnd();if(t<599) endShown=false;};
window.LTM_end={openEnd,closeEnd,answer};
})();
