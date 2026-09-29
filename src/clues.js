// The Last Ten Minutes: overheard lines, clickable clues and the notebook.
// What is findable when comes from story.js. The notebook survives scrubbing, not reloads.
'use strict';
(function(){
const S=STORY,A=LTM.API,PZ=LTM.PZ;
// Kept in memory for this visit only, so the next player on the same device starts fresh.
const notebook=[];
function save(){}
function has(id){return notebook.some(e=>e.id===id);}

// ---------- where each clue target is drawn, in world units [x, y, z] ----------
function targetPoint(target,t){
  if(target.startsWith('case:')){const st=S.caseState(target.slice(5),t);if(st.where==='hidden'||st.where==='carriage') return null;
    return [st.x,st.y,st.where==='ground'?PZ+0.2:PZ+0.55];}
  if(target.startsWith('person:')){const id=target.slice(7);if(!S.visible(id,t)) return null;const p=S.pos(id,t);return [p[0],p[1],PZ+S.look(id,t).h*0.55/A.S];}
  switch(target){
    case 'tin':{const q=S.lunchTin(t);return [q.x,q.y,PZ+0.45];}
    case 'pole':{const pl=S.pole(t);if(pl.where==='leaning') return [pl.x-0.07,pl.y-0.05,PZ+1.6];if(pl.where==='hand'){const p=S.pos('dunn',t);return [p[0]+0.3,p[1]-0.3,PZ+2.6];}return null;}
    case 'clock':return [LTM.CLOCK[0],LTM.CLOCK[1],PZ+3.9+24/A.S];
    case 'wrdoor':return [LTM.HALL.x1,9.85,PZ+0.9];
    case 'streetdoor':return [3.2,LTM.HALL.y1,PZ+0.9];
    case 'frontdoor':return t<590?[13.92,3.56,1.55]:null;
    case 'blind':return t<590?[5.3,3.56,1.85]:null;
    case 'glove':{const gv=S.glove(t);return gv.where==='ground'?[gv.x,gv.y,PZ+0.05]:null;}
  }
  return null;
}
function screenOf(w){const st=window.LTM_STATE;return LTM.worldToScreen(w[0],w[1],w[2],st.cam,st.W,st.H);}

// ---------- collecting ----------
const toastEl=document.getElementById('toast');let toastTimer=null;
function toast(msg){toastEl.textContent=msg;toastEl.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toastEl.style.display='none';},2600);}
function add(entry,quiet){if(has(entry.id)){if(!quiet) toast('Already in your notebook: '+entry.title+'.');return false;}
  notebook.push(entry);save();renderNotebook();if(!quiet) toast('Added to your notebook: '+entry.title+'.');else toast('Noted: '+entry.title+'.');return true;}
function collect(c,t){return add({id:c.id,kind:'clue',title:c.title,text:S.clueText(c,t),t:Math.floor(t)});}
// Returns true when the tap found a thing (so it is not also a follow tap).
window.LTM_onTapClue=(sx,sy)=>{const st=window.LTM_STATE,t=st.t;
  let best=null,bd=1e9;const r=Math.max(22,15*st.cam.zoom);
  for(const c of S.CLUES){if(c.target.startsWith('person:')||!S.clueActive(c,t)) continue;const w=targetPoint(c.target,t);if(!w) continue;
    const [a,b]=screenOf(w);const d=Math.hypot(sx-a,sy-b);if(d<r&&d<bd){bd=d;best=c;}}
  if(best){collect(best,t);st.dirty=true;return true;}
  const pid=window.LTM_pickPerson?window.LTM_pickPerson(sx,sy):null;
  if(pid){const c=S.clueFor('person:'+pid,t);if(c) collect(c,t);}
  return false;};

// ---------- overheard lines ----------
const speechEl=document.getElementById('speech');let lastSpeech='';
function speakerName(L){return S.label(L.speaker,L.from);}
function showSpeech(st){const lines=S.overheard(st.follow,st.t);const key=lines.map(l=>l.id).join('|');
  for(const L of lines) add({id:'heard:'+L.id,kind:'heard',title:'Overheard',text:speakerName(L)+': \u201c'+L.text+'\u201d',t:L.from},true);
  if(key===lastSpeech) return;lastSpeech=key;speechEl.innerHTML='';
  if(!lines.length){speechEl.style.display='none';return;}
  for(const L of lines){const d=document.createElement('div');const b=document.createElement('b');b.textContent=speakerName(L)+': ';d.appendChild(b);d.appendChild(document.createTextNode('\u201c'+L.text+'\u201d'));speechEl.appendChild(d);}
  speechEl.style.display='block';}
const prevAfter=window.LTM_afterDraw;
window.LTM_afterDraw=st=>{if(prevAfter) prevAfter(st);showSpeech(st);};

// ---------- drawing: a faint glint on things worth a closer look, and the rear-carriage blind ----------
const prevActors=window.LTM_actors;
window.LTM_actors=(t,api)=>{const items=prevActors?prevActors(t,api):[];
  if(t>=S.BLIND_DOWN-4&&t<590){const u=Math.min(1,(t-(S.BLIND_DOWN-4))/4);items.push({depth:8.8,draw:()=>{const z0=0.55;A.yq(4.95,5.65,3.552,z0+1.75-0.95*u,z0+1.75,'#6a4a32');}});}
  items.push({depth:1e6,draw:()=>{const g=A.g;if(document.body.classList.contains('finale')) return;
    for(const c of S.CLUES){if(has(c.id)||!S.clueActive(c,t)||c.target.startsWith('person:')) continue;const w=targetPoint(c.target,t);if(!w) continue;
      const [x,y]=A.P(w[0],w[1],w[2]);const pulse=0.5+0.5*Math.sin(t*2.2+x*0.01);
      A.glow(x,y,10+4*pulse,'255,236,190',0.28);g.strokeStyle=`rgba(255,240,205,${0.25+0.2*pulse})`;g.lineWidth=1;g.beginPath();g.arc(x,y,4.5,0,7);g.stroke();}}});
  return items;};

// ---------- the notebook panel ----------
const nbEl=document.getElementById('notebook'),nbBtn=document.getElementById('nbbtn'),nbList=document.getElementById('nblist');
function renderNotebook(){nbBtn.textContent='Notebook ('+notebook.length+')';nbList.innerHTML='';
  const cnt=document.getElementById('nbcount');if(cnt) cnt.textContent=notebook.length>3?notebook.length+' notes \u00b7 scroll for more':notebook.length+(notebook.length===1?' note':' notes');
  if(!notebook.length){const p=document.createElement('p');p.className='empty';p.textContent='Nothing yet. Tap things that catch your eye, and follow people to overhear them.';nbList.appendChild(p);return;}
  const sorted=notebook.slice().sort((a,b)=>a.t-b.t);
  for(const e of sorted){const d=document.createElement('div');d.className='entry';const h=document.createElement('div');h.className='eh';h.textContent=S.hms(e.t)+' \u00b7 '+e.title;
    const p=document.createElement('div');p.textContent=e.text;const go=document.createElement('button');go.className='goto';go.textContent='Go to '+S.hms(e.t);go.addEventListener('click',()=>{window.LTM_app.setT(e.t);closeNotebook();});
    d.appendChild(h);d.appendChild(p);d.appendChild(go);nbList.appendChild(d);}}
function openNotebook(){renderNotebook();nbEl.style.display='flex';nbEl.querySelector('#nbclose').focus({focusVisible:false});}
function closeNotebook(){nbEl.style.display='none';}
nbBtn.addEventListener('click',()=>{nbEl.style.display==='flex'?closeNotebook():openNotebook();});
document.getElementById('nbclose').addEventListener('click',closeNotebook);
renderNotebook();
window.LTM_notebook={entries:notebook,open:openNotebook,close:closeNotebook,targetPoint,screenOf,clear:()=>{notebook.length=0;save();renderNotebook();}};
})();
