// The Last Ten Minutes: the opening card, the 10:00 card, the answer screen with hints, and the ending.
// Answers are checked against salted hashes in story.js. The game only ever says how many in a set are right.
'use strict';
(function(){
const S=STORY;
const $=id=>document.getElementById(id);
const introEl=$('intro'),tenEl=$('endcard'),ansEl=$('answers'),ansBtn=$('ansbtn'),finEl=$('finale');
const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// In-memory only. Choices, revealed hints and solved sets survive scrubbing and closing the panel.
// watched: the questions stay closed until true time has reached 10:00 once, so they cannot spoil the first watch.
const state={choices:{},hints:{},solved:{1:false,2:false},checks:{1:0,2:0},hintsUsed:0,ended:false,watched:false};
for(const q of S.QUESTIONS){state.choices[q.id]=q.blanks.map(()=> '');state.hints[q.id]=0;}
function el(tag,cls,text){const e=document.createElement(tag);if(cls) e.className=cls;if(text!==undefined) e.textContent=text;return e;}
function pause(){if(window.LTM_app) window.LTM_app.setPlaying(false);}

// ---------- opening card ----------
function openIntro(){introEl.innerHTML='';const card=el('div','card');card.appendChild(el('h2','',S.INTRO.title));
  for(const line of S.INTRO.lines) card.appendChild(el('p','',line));
  card.appendChild(el('h3','','Who\u2019s who'));const ul=el('ul','cast');
  for(const [name,desc] of S.CAST){const li=el('li');li.appendChild(el('b','',name+'. '));li.appendChild(document.createTextNode(desc));ul.appendChild(li);}
  card.appendChild(ul);
  const row=el('div','row');const go=el('button','primary','Begin');go.id='begin';go.addEventListener('click',closeIntro);row.appendChild(go);card.appendChild(row);
  introEl.appendChild(card);introEl.style.display='flex';go.focus({focusVisible:false});}
function closeIntro(){introEl.style.display='none';}

// ---------- the 10:00 card ----------
let tenShown=false;
function openTen(){tenShown=true;tenEl.innerHTML='';const card=el('div','card');
  card.appendChild(el('h2','','10:00 p.m. The train has gone.'));
  const solvedN=(state.solved[1]?1:0)+(state.solved[2]?1:0);
  card.appendChild(el('p','',solvedN===0?'Evelyn is nowhere to be seen. Do you know what happened? You can answer now, or go back and keep looking.':'You have solved '+solvedN+' of the two sets. Go back and keep looking, or try the rest.'));
  const row=el('div','row');
  const a=el('button','primary','Answer the questions');a.id='toanswers';a.addEventListener('click',()=>{closeTen();openAnswers();});
  const r=el('button','','Watch again from 9:50');r.id='replay';r.addEventListener('click',()=>{closeTen();window.LTM_app.setT(0);});
  const c=el('button','','Keep looking');c.id='closeend';c.addEventListener('click',closeTen);
  row.appendChild(a);row.appendChild(r);row.appendChild(c);card.appendChild(row);
  tenEl.appendChild(card);tenEl.style.display='flex';a.focus({focusVisible:false});}
function closeTen(){tenEl.style.display='none';}
function setWatched(){if(state.watched) return;state.watched=true;{const t=document.getElementById('toast');if(t&&/10:00 first/.test(t.textContent)) t.style.display='none';}ansBtn.classList.remove('locked');ansBtn.setAttribute('aria-label','Answer the questions');ansBtn.title='';}
ansBtn.classList.add('locked');ansBtn.setAttribute('aria-label','Answer the questions, opens after you reach 10:00');ansBtn.title='Watch through to 10:00 first';
window.LTM_onTime=t=>{if(t>=600) setWatched();if(t>=600&&!tenShown&&!state.ended&&ansEl.style.display!=='flex') openTen();if(t<599) tenShown=false;};

// ---------- answer panel ----------
const SET_TITLES={1:'First three: what you can see',2:'Last three: putting it together'};
function renderAnswers(){ansEl.innerHTML='';const card=el('div','card');
  const head=el('div','ahead');head.appendChild(el('h2','','Your answers'));const close=el('button','','Close');close.id='ansclose';close.addEventListener('click',closeAnswers);head.appendChild(close);card.appendChild(head);
  card.appendChild(el('p','note','Fill in every blank in a set, then check it. You\u2019ll be told how many of the three are right, not which ones.'));
  const body=el('div','abody');
  for(const setNo of [1,2]){const sec=el('section','aset'+(state.solved[setNo]?' solved':''));sec.dataset.set=setNo;
    sec.appendChild(el('h3','',SET_TITLES[setNo]));
    if(setNo===2&&!state.solved[1]){sec.classList.add('locked');sec.appendChild(el('p','lockednote','Solve the first three to open these.'));body.appendChild(sec);continue;}
    for(const q of S.QUESTIONS.filter(q=>q.set===setNo)){const qd=el('div','q');qd.dataset.q=q.id;
      const n=el('span','qn',q.id.slice(1)+'.');const sent=el('div','sent');sent.appendChild(n);
      let carry=null; // a select waiting to be glued to following punctuation so it never wraps alone
      q.parts.forEach((part,i)=>{if(part){const tight=/^[\u2019.,]/.test(part);let rest=part;
          if(tight&&carry){const m=part.match(/^\S+/);carry.appendChild(document.createTextNode(m[0]));rest=part.slice(m[0].length);}
          if(rest) sent.appendChild(document.createTextNode((tight?'':' ')+rest.replace(/^\s+/,tight?' ':'')+(i<q.blanks.length?' ':'')));
          else if(i<q.blanks.length) sent.appendChild(document.createTextNode(' '));}
        carry=null;
        if(i<q.blanks.length){const sel=el('select');sel.dataset.q=q.id;sel.dataset.i=i;sel.setAttribute('aria-label','Question '+q.id.slice(1)+', blank '+(i+1));
          sel.appendChild(new Option('\u2026',''));for(const o of q.blanks[i]) sel.appendChild(new Option(o,o));
          sel.value=state.choices[q.id][i];sel.disabled=state.solved[setNo];
          sel.addEventListener('change',()=>{state.choices[q.id][i]=sel.value;const st=sec.querySelector('.status');if(st&&!state.solved[setNo]) st.textContent='';});
          const nw=el('span','nw');nw.appendChild(sel);sent.appendChild(nw);carry=nw;}});
      qd.appendChild(sent);
      const hrow=el('div','hrow');const shown=state.hints[q.id];
      const hl=el('ol','hints');for(let k=0;k<shown;k++) hl.appendChild(el('li','',q.hints[k]));
      if(!state.solved[setNo]&&shown<q.hints.length){const hb=el('button','hint',shown===0?'Hint':'Another hint ('+(shown+1)+' of '+q.hints.length+')');hb.dataset.q=q.id;
        hb.addEventListener('click',()=>{state.hints[q.id]=Math.min(q.hints.length,state.hints[q.id]+1);state.hintsUsed++;renderAnswers();const b=ansEl.querySelector('.q[data-q="'+q.id+'"] .hint');(b||ansEl.querySelector('.q[data-q="'+q.id+'"] select')).focus({focusVisible:false});});
        hrow.appendChild(hb);}
      if(shown) qd.appendChild(hl);
      qd.appendChild(hrow);sec.appendChild(qd);}
    const foot=el('div','afoot');
    if(!state.solved[setNo]){const cb=el('button','primary','Check these three');cb.className='primary check';cb.dataset.set=setNo;cb.addEventListener('click',()=>check(setNo));foot.appendChild(cb);}
    const st=el('div','status');st.setAttribute('aria-live','polite');st.dataset.set=setNo;if(state.solved[setNo]) st.textContent='All three right. Well spotted.';foot.appendChild(st);
    sec.appendChild(foot);body.appendChild(sec);}
  const again=el('button','linkish','Read the case again');again.addEventListener('click',()=>{closeAnswers();openIntro();});body.appendChild(again);
  card.appendChild(body);ansEl.appendChild(card);}
function check(setNo){const st=ansEl.querySelector('.status[data-set="'+setNo+'"]');
  const qs=S.QUESTIONS.filter(q=>q.set===setNo);
  if(qs.some(q=>state.choices[q.id].some(v=>!v))){st.textContent='Fill in every blank in this set first.';return null;}
  state.checks[setNo]++;const r=S.checkSet(setNo,state.choices);
  if(r.solved){state.solved[setNo]=true;renderAnswers();
    if(state.solved[1]&&state.solved[2]){setTimeout(playEnding,reduced?300:1400);const s2=ansEl.querySelector('.status[data-set="'+setNo+'"]');if(s2) s2.textContent='All three right. You\u2019ve solved it.';}
    const cb=ansEl.querySelector('.aset[data-set="'+setNo+'"]');if(cb) cb.scrollIntoView({block:'nearest'});
    return r;}
  st.textContent=r.right===0?'None of the three are right yet. Keep looking.':(r.right===1?'1 of 3 is right.':'2 of 3 are right.')+' Keep looking.';
  return r;}
function openAnswers(){if(!state.watched){showLocked();return;}{const t=document.getElementById('toast');if(t&&/10:00 first/.test(t.textContent)) t.style.display='none';}pause();closeTen();if(window.LTM_notebook) window.LTM_notebook.close();renderAnswers();ansEl.style.display='flex';const f=ansEl.querySelector('select:not([disabled])')||$('ansclose');f.focus({focusVisible:false});}
function closeAnswers(){ansEl.style.display='none';}
function showLocked(){const t=document.getElementById('toast');if(!t) return;t.textContent='Watch through to 10:00 first. Then the questions open.';t.style.display='block';clearTimeout(showLocked.timer);showLocked.timer=setTimeout(()=>{t.style.display='none';},2600);}
ansBtn.addEventListener('click',()=>{ansEl.style.display==='flex'?closeAnswers():openAnswers();});

// ---------- ending scene ----------
// The camera settles on the street corner, Evelyn's umbrella turns it, and the train's lights fade behind.
let raf=null;
function playEnding(){if(state.ended) return;state.ended=true;closeAnswers();closeTen();closeIntro();pause();
  const app=window.LTM_app,st=app.state;st.follow=null;if(window.LTM_follow) window.LTM_follow(null);
  document.body.classList.add('ended','finale');
  st.cam.x=2.6;st.cam.y=10.0;st.cam.zoom=app.clampZoom(2.2);st.dirty=true;
  finEl.innerHTML='';const shade=el('div','shade');finEl.appendChild(shade);const txt=el('div','ftext');
  S.ENDING.lines.forEach((l,i)=>{const p=el('p','',l);p.style.transitionDelay=(reduced?0:1.2+i*2.2)+'s';txt.appendChild(p);});
  const row=el('div','row');const again=el('button','','Watch again from 9:50');again.id='playagain';again.addEventListener('click',endFinale);row.appendChild(again);
  row.style.transitionDelay=(reduced?0:5.6)+'s';txt.appendChild(row);finEl.appendChild(txt);finEl.style.display='block';
  const T0=531,T1=548.6,DUR=reduced?0:9000;let start=null;
  function tick(ts){if(start===null) start=ts;const u=DUR?Math.min(1,(ts-start)/DUR):1;app.setT(T0+(T1-T0)*u);{const e=S.pos('evelyn',st.t);const nar=st.W<700;st.cam.x=e[0]+(nar?0.4:1.3);st.cam.y=e[1]-(nar?0.5:0.9);}st.dirty=true;
    shade.style.opacity=String(0.15+0.7*u);if(u<1) raf=requestAnimationFrame(tick);else{raf=null;finEl.classList.add('done');}}
  raf=requestAnimationFrame(tick);requestAnimationFrame(()=>finEl.classList.add('show'));}
function endFinale(){if(raf) cancelAnimationFrame(raf);raf=null;finEl.style.display='none';finEl.className='';document.body.classList.remove('ended','finale');state.ended=false;tenShown=false;
  const app=window.LTM_app;app.state.cam.zoom=app.clampZoom(1.6);app.setT(0);}
function escape(){if(state.ended) return true;
  for(const [e,f] of [[ansEl,closeAnswers],[tenEl,closeTen],[introEl,closeIntro]]) if(e.style.display==='flex'){f();return true;}
  return false;}

window.LTM_answers={state,setWatched,openIntro,closeIntro,openTen,closeTen,open:openAnswers,close:closeAnswers,check,playEnding,endFinale,escape};
openIntro();
})();
