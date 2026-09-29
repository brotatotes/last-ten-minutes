// The Last Ten Minutes: characters, following and the planted clue.
// Everything is a pure function of t.
'use strict';
(function(){
const A=LTM.API,PZ=LTM.PZ;
const S=STORY;
// Every person, case and prop comes from the story script (story.js). Nothing here decides who is where.
const CHARS=S.PEOPLE;
const BYID=S.BYID;
function posOf(c,t){const p=S.pos(c.id,t),m=S.moving(c.id,t);return [p[0],p[1],!!m,S.action(c.id,t),m?m[0]:0,m?m[1]:0];}
function visible(c,t){return S.visible(c.id,t);}
function trolleyPos(t){return S.trolley(t);}
const CASE_COL={evelyn:'#8a6a3e',harrow:'#3b2a1c'};
// returns list of {id, c:{col,strap,tag}, p:[x,y,z]}
function cases(t){const out=[];const sw=S.strapWhere(t);
  for(const id of ['evelyn','harrow']){const st=S.caseState(id,t);if(st.where==='hidden'||st.where==='carriage') continue;
    let z=PZ;if(st.where==='trolley'||st.where==='hand') z=PZ+0.35;
    out.push({id,c:{col:CASE_COL[id],strap:sw==='case:'+id?'#b3261e':null,tag:id==='harrow'},p:[st.x,st.y,z],where:st.where});}
  return out;}
function drawCase(k){const [x,y,z]=k.p,c=k.c;A.box(x-0.28,x+0.28,y-0.2,y+0.2,z,z+0.34,shade(c.col,1.15),c.col,shade(c.col,0.75));
  if(c.strap) A.box(x-0.05,x+0.05,y-0.21,y+0.21,z,z+0.345,c.strap,c.strap,'#7a1712');
  if(c.tag){const [a,b]=A.P(x+0.28,y+0.1,z+0.2);A.g.fillStyle='#d8cfb4';A.g.fillRect(a-2,b-3,5,7);}
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
  for(const s of [-1,1]){const held=o.umbrella&&s===1;const sw=moving&&!held?-s*ph*w*0.35*face:0;const hx=held?a+w*0.62:a+s*w*0.52+sw,hy=held?by-h*0.6:by-h*0.44;g.beginPath();g.moveTo(a+s*w*0.44,by-h*0.77);g.lineTo(hx,hy);g.stroke();
    g.fillStyle=o.skin||'#6e5646';g.beginPath();g.arc(hx,held?hy:by-h*0.42,w*0.1,0,7);g.fill();}
  g.lineCap='butt';
  g.fillStyle=o.skin||'#6e5646';g.fillRect(a-w*0.1,by-h*0.9,w*0.2,h*0.05);
  g.beginPath();g.arc(a+face*1,by-h*0.96,w*0.33,0,7);g.fill();
  g.fillStyle='rgba(255,190,120,0.25)';g.beginPath();g.arc(a+face*3,by-h*0.965,w*0.2,0,7);g.fill();
  if(o.hat==='fedora'){g.fillStyle=o.hatCol;g.beginPath();g.ellipse(a,by-h*1.03,w*0.68,w*0.18,0,0,7);g.fill();g.beginPath();g.moveTo(a-w*0.34,by-h*1.04);g.lineTo(a-w*0.3,by-h*1.16);g.quadraticCurveTo(a,by-h*1.12,a+w*0.3,by-h*1.16);g.lineTo(a+w*0.34,by-h*1.04);g.fill();g.fillStyle='#2e3238';g.fillRect(a-w*0.34,by-h*1.065,w*0.68,h*0.025);}
  if(o.hat==='cap'){g.fillStyle=o.hatCol||'#1b2230';g.beginPath();g.ellipse(a,by-h*1.07,w*0.4,w*0.2,0,0,7);g.fill();g.fillRect(a-w*0.36,by-h*1.07,w*0.72,h*0.055);g.fillRect(a+(face>0?0:-w*0.55),by-h*1.025,w*0.55,h*0.025);g.fillStyle='#8a6a34';g.fillRect(a-w*0.12,by-h*1.06,w*0.24,h*0.02);}
  if(o.hat==='cloche'){g.fillStyle=o.hatCol;g.beginPath();g.ellipse(a,by-h*1.0,w*0.44,w*0.4,0,Math.PI,0);g.fill();g.beginPath();g.ellipse(a,by-h*1.0,w*0.54,w*0.1,0,0,7);g.fill();}
  return by;
}
function extras(c,x,y,t,by,o){const g=A.g,[a]=A.P(x,y,PZ),h=o.h,w=o.w;
  if(c.id==='harrow'&&t<108){g.fillStyle='#b9ae94';g.fillRect(a-w*0.75,by-h*0.78,w*1.5,h*0.3);g.strokeStyle='rgba(60,50,40,0.6)';g.beginPath();g.moveTo(a,by-h*0.78);g.lineTo(a,by-h*0.48);g.stroke();}
  if(S.writingNotebook(c.id,t)){g.fillStyle='#e8e0c8';g.fillRect(a-w*0.3,by-h*0.62,w*0.5,h*0.12);}
  if(S.checkingWatch(c.id,t)){g.fillStyle='#e0b85a';g.beginPath();g.arc(a+w*0.35,by-h*0.6,2.6,0,7);g.fill();A.glow(a+w*0.35,by-h*0.6,10,'255,220,140',0.5);}
  if(c.id==='dunn'){const pl=S.pole(t);if(pl.where==='hand'){const up=/Reaches up/.test(S.action('dunn',t));g.strokeStyle='#6a5030';g.lineWidth=2;g.beginPath();g.moveTo(a+w*0.5,by-h*0.5);g.lineTo(a+w*(up?0.9:1.4),by-h*(up?2.3:1.25));g.stroke();}
    const gl=S.greenLamp(t);if(gl.where==='hand'){const [lx,ly]=gl.raised?[a+w*0.8,by-h*1.15]:[a+w*0.6,by-h*0.45];g.strokeStyle='#15161a';g.lineWidth=2;if(gl.raised){g.beginPath();g.moveTo(a+w*0.5,by-h*0.8);g.lineTo(lx,ly);g.stroke();}g.fillStyle='#6fe08a';g.beginPath();g.arc(lx,ly,4,0,7);g.fill();A.glow(lx,ly,gl.raised?50:20,'120,255,150',0.55);}}
  if(c.id==='tommy'||c.id==='guard'){const gv=S.glove(t);if(gv.where==='hand'&&gv.holder===c.id){g.fillStyle='#8a8f96';g.beginPath();g.ellipse(a+w*0.55,by-h*0.42,3.5,2.2,0,0,7);g.fill();}}
  if(o.umbrella){// held in the right hand, so the shaft runs beside the head, not across it
    const ux=a+w*0.62,uy=by-h*1.1,rw=w*1.3,rh=w*0.6;
    g.strokeStyle='#4a4e56';g.lineWidth=1.6;g.beginPath();g.moveTo(ux,uy);g.lineTo(ux,by-h*0.52);g.stroke();
    g.fillStyle=o.skin||'#6e5646';g.beginPath();g.arc(ux,by-h*0.6,w*0.1,0,7);g.fill();
    g.fillStyle='#16181d';g.beginPath();g.ellipse(ux,uy,rw,rh,0,Math.PI,0);g.fill();
    g.fillStyle='rgba(170,180,200,.14)';g.beginPath();g.ellipse(ux-rw*0.3,uy-rh*0.45,rw*0.45,rh*0.3,0,0,7);g.fill();
    g.strokeStyle='rgba(165,175,190,.7)';g.lineWidth=1.2;g.beginPath();g.ellipse(ux,uy,rw,rh,0,Math.PI,0);g.stroke();
    g.beginPath();g.moveTo(ux-rw,uy);g.lineTo(ux+rw,uy);g.stroke();}
}
// props on the ground or leaning
function props(t){const out=[],g=()=>A.g;
  const gv=S.glove(t);if(gv.where==='ground') out.push({depth:gv.x+gv.y,draw:()=>{const [a,b]=A.P(gv.x,gv.y,PZ);A.g.fillStyle='#8a8f96';A.g.beginPath();A.g.ellipse(a,b-1,4,2.4,0.3,0,7);A.g.fill();}});
  const pl=S.pole(t);if(pl.where==='leaning') out.push({depth:pl.x+pl.y,draw:()=>{const [a,b]=A.P(pl.x,pl.y,PZ),[c1,d1]=A.P(pl.x-0.15,pl.y-0.1,PZ+3.0);A.g.strokeStyle='#6a5030';A.g.lineWidth=2;A.g.beginPath();A.g.moveTo(a,b);A.g.lineTo(c1,d1);A.g.stroke();A.g.beginPath();A.g.arc(c1+3,d1,3,Math.PI,0);A.g.stroke();}});
  const tin=S.lunchTin(t);out.push({depth:tin.x+tin.y+0.95,draw:()=>{A.box(tin.x-0.14,tin.x+0.14,tin.y-0.1,tin.y+0.1,PZ+0.38,PZ+0.52,'#8a8f7a','#5f6454','#4c5044');}});
  return out;}
function actors(t){
  const items=[];const tr=trolleyPos(t);
  items.push({depth:tr[0]+tr[1]+1.2,draw:()=>trolley(tr[0],tr[1])});
  for(const k of cases(t)) items.push({depth:k.p[0]+k.p[1]+0.05+(k.p[2]>PZ+0.2?0.9:0),draw:()=>drawCase(k)});
  for(const it of props(t)) items.push(it);
  for(const c of CHARS){if(!visible(c,t)) continue;const [x,y,mv,,dx,dy]=posOf(c,t);const o=S.look(c.id,t);
    const seated=c.id==='harrow'&&t<108;
    items.push({depth:x+y+0.3,draw:()=>{const oo=seated?{...o,h:o.h*0.82}:o;const by=person(x,y+(seated?-0.2:0),oo,t,mv,dx,dy);extras(c,x,y,t,by,oo);
      if(window.LTM_STATE&&window.LTM_STATE.follow===c.id){const g=A.g,[a,b]=A.P(x,y,PZ);g.strokeStyle='rgba(233,220,192,0.7)';g.lineWidth=1.5;g.beginPath();g.ellipse(a,b,o.w*1.3,o.w*0.5,0,0,7);g.stroke();}}});}
  return items;
}
window.LTM_actors=actors;
window.LTM_clerkIn=t=>S.hiddenWhere('dunn',t)==='window';
window.LTM_positionOf=(id,t)=>BYID[id]?S.pos(id,t):null;
// What the status line says. It only ever describes what can be seen, so it never gives a secret away.
const WHERE_TXT={hall:'Out of sight in the booking hall',waiting:'Out of sight in the ladies\u2019 waiting room',window:'Behind the ticket window',street:'Gone out of sight down the street',front:'Aboard the front carriage',rear:'Aboard the rear carriage'};
function lastSeenLabel(id,t){const iv=S.BYID[id].hidden.find(h=>t>=h[0]&&t<h[1]);return S.label(id,iv&&iv[0]>0?iv[0]-0.01:t);}
function statusOf(id,t){const w=S.hiddenWhere(id,t);const lab=w&&w!=='window'?lastSeenLabel(id,t):S.label(id,t);
  if(w&&w!=='window'){const iv=S.BYID[id].hidden.find(h=>t>=h[0]&&t<h[1]);if(iv[0]===0&&t<S.BYID[id].route[0][0]) return {name:lab,text:'Not here yet.'};return {name:lab,text:WHERE_TXT[w]+'.'};}
  return {name:lab,text:S.action(id,t)+'.'};}
window.LTM_characters={CHARS,posOf,visible,cases,trolleyPos,statusOf,actionOf:(id,t)=>statusOf(id,t).text};

// ---- following
// You follow what you can see. If the person goes out of sight, you lose them at the door.
const followEl=document.getElementById('follow');
function showFollow(){const st=window.LTM_STATE;if(!st||!st.follow){followEl.style.display='none';return;}const s=statusOf(st.follow,st.t);
  followEl.style.display='block';followEl.innerHTML='';const b=document.createElement('b');b.textContent=s.name;followEl.appendChild(b);followEl.appendChild(document.createTextNode('. '+s.text));
  if(window.LTM_onFollowShown) window.LTM_onFollowShown(followEl,st);}
let lastFollowText='',lost=null;
// When the person you follow goes through a door or aboard, you lose sight of them, as a watcher would.
function checkLost(st){if(!st.follow) return;const w=S.hiddenWhere(st.follow,st.t);if(w&&w!=='window'){const s=statusOf(st.follow,st.t);lost={t:st.t,name:s.name,text:s.text+' You lose sight of them.'};st.follow=null;st.dirty=true;}}
function showLost(st){if(lost&&!st.follow&&Math.abs(st.t-lost.t)<6){followEl.style.display='block';followEl.innerHTML='';const b=document.createElement('b');b.textContent=lost.name;followEl.appendChild(b);followEl.appendChild(document.createTextNode('. '+lost.text));return true;}lost=null;return false;}
window.LTM_afterDraw=st=>{checkLost(st);if(!st.follow){const k='lost|'+(lost?lost.t+lost.text:'')+'|'+(lost&&Math.abs(st.t-lost.t)<6);if(k!==lastFollowText){lastFollowText=k;if(!showLost(st)) followEl.style.display='none';}return;}const s=st.follow?statusOf(st.follow,st.t):null;const txt=s?st.follow+'|'+s.name+'|'+s.text+'|'+(window.LTM_followExtra?window.LTM_followExtra(st):''):'';if(txt!==lastFollowText){lastFollowText=txt;showFollow();}};
function follow(id){const st=window.LTM_STATE;lost=null;st.follow=id;st.dirty=true;lastFollowText='';showFollow();}
window.LTM_onFollow=follow;
window.LTM_follow=follow;
function pickPerson(sx,sy){const st=window.LTM_STATE;let best=null,bd=1e9;
  for(const c of CHARS){if(!visible(c,st.t)) continue;const p=S.pos(c.id,st.t);const o=S.look(c.id,st.t);const [a,b]=LTM.worldToScreen(p[0],p[1],PZ,st.cam,st.W,st.H);
    const hh=o.h*st.cam.zoom;const cy=b-hh*0.55;const d=Math.hypot((sx-a)/Math.max(18,o.w*st.cam.zoom),(sy-cy)/(hh*0.7));if(d<bd){bd=d;best=c;}}
  return best&&bd<1.6?best.id:null;}
window.LTM_pickPerson=pickPerson;
window.LTM_onTap=(sx,sy)=>{if(window.LTM_onTapClue&&window.LTM_onTapClue(sx,sy)) return;follow(pickPerson(sx,sy));};
window.LTM_onKey=e=>{const st=window.LTM_STATE;if(e.key==='f'||e.key==='F'){const vis=CHARS.filter(c=>visible(c,st.t));if(!vis.length) return;const i=vis.findIndex(c=>c.id===st.follow);follow(vis[(i+1)%vis.length].id);}
  else if(e.key==='Escape'){if(window.LTM_answers&&window.LTM_answers.escape()) return;follow(null);}};

// The 10:00 card, answer screen, hints and ending live in answers.js.
})();
