// The Last Ten Minutes: app shell (time, controls, camera).
'use strict';
(function(){
const cv=document.getElementById('scene'),ctx=cv.getContext('2d');
const slider=document.getElementById('time'),clockEl=document.getElementById('clock');
const playBtn=document.getElementById('play'),speedBtn=document.getElementById('speed');
const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={t:0,playing:false,speed:1,cam:{x:11,y:7.4,zoom:1.6},target:null,follow:null,lastFrame:null,dirty:true};
window.LTM_STATE=state;
const SPEEDS=[1,4,16];
function size(){const dpr=Math.min(window.devicePixelRatio||1,2);const W=cv.clientWidth,H=cv.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);state.W=W;state.H=H;state.dpr=dpr;
  state.cam.zoom=clampZoom(state.cam.zoom);
  const bar=document.getElementById('bar');state.cam.oy=bar?Math.round(bar.getBoundingClientRect().height*(H<500?0.75:0.45)):0;state.dirty=true;}
function clampZoom(z){const base=Math.min(state.W||800,(state.H||600)*1.6)/900;return Math.max(0.6*base+0.3,Math.min(3,z));}
function clampCam(){const c=state.cam;c.x=Math.max(1,Math.min(21,c.x));c.y=Math.max(1.5,Math.min(11,c.y));}
function setT(t,fromSlider){state.t=Math.max(0,Math.min(LTM.T_END,Math.round(t*1000)/1000));if(!fromSlider) slider.value=String(state.t);state.dirty=true;
  if(state.t>=LTM.T_END&&state.playing){setPlaying(false);}
  if(window.LTM_onTime) window.LTM_onTime(state.t);}
function setPlaying(p){state.playing=p;playBtn.textContent=p?'Pause':'Play';playBtn.setAttribute('aria-pressed',p?'true':'false');state.lastFrame=null;if(p&&state.t>=LTM.T_END) setT(0);}
function cycleSpeed(){state.speed=SPEEDS[(SPEEDS.indexOf(state.speed)+1)%SPEEDS.length];speedBtn.textContent=state.speed+'×';}
function step(d){setT(state.t+d);}
function draw(){
  LTM.render(ctx,{t:state.t,width:state.W,height:state.H,dpr:state.dpr,camera:state.cam,reduced,actors:window.LTM_actors||null,clerkIn:window.LTM_clerkIn?window.LTM_clerkIn(state.t):true});
  clockEl.textContent=LTM.clockText(state.t)+' p.m.';
  slider.setAttribute('aria-valuetext',LTM.clockText(state.t));
  if(window.LTM_afterDraw) window.LTM_afterDraw(state);
  state.dirty=false;
}
function frame(ts){
  if(state.playing){if(state.lastFrame!==null){const dt=Math.min(0.1,(ts-state.lastFrame)/1000);setT(state.t+dt*state.speed);}state.lastFrame=ts;}
  if(state.follow&&window.LTM_positionOf){const p=window.LTM_positionOf(state.follow,state.t);if(p){const c=state.cam;if(reduced){c.x=p[0];c.y=p[1];}else{c.x+=(p[0]-c.x)*0.15;c.y+=(p[1]-c.y)*0.15;}clampCam();state.dirty=true;}}
  if(state.dirty) draw();
  requestAnimationFrame(frame);
}
// controls
slider.addEventListener('input',()=>setT(parseFloat(slider.value),true));
playBtn.addEventListener('click',()=>setPlaying(!state.playing));
speedBtn.addEventListener('click',cycleSpeed);
document.getElementById('back').addEventListener('click',()=>step(-5));
document.getElementById('fwd').addEventListener('click',()=>step(5));
document.getElementById('zin').addEventListener('click',()=>{state.cam.zoom=clampZoom(state.cam.zoom*1.25);state.dirty=true;});
document.getElementById('zout').addEventListener('click',()=>{state.cam.zoom=clampZoom(state.cam.zoom/1.25);state.dirty=true;});
window.addEventListener('keydown',e=>{
  if(e.target&&e.target.tagName==='BUTTON'&&(e.key===' '||e.key==='Enter')) return;
  const big=e.shiftKey?30:5;
  if(e.key===' '){e.preventDefault();setPlaying(!state.playing);}
  else if(e.key==='ArrowLeft'){e.preventDefault();step(-big);}
  else if(e.key==='ArrowRight'){e.preventDefault();step(big);}
  else if(e.key===','){step(-1);}else if(e.key==='.'){step(1);}
  else if(e.key==='+'||e.key==='='){state.cam.zoom=clampZoom(state.cam.zoom*1.25);state.dirty=true;}
  else if(e.key==='-'){state.cam.zoom=clampZoom(state.cam.zoom/1.25);state.dirty=true;}
  else if(e.key==='s'||e.key==='S'){cycleSpeed();}
  else if(window.LTM_onKey) window.LTM_onKey(e);
});
// pan + pinch with pointer events (mouse and touch)
const ptrs=new Map();let drag=null,pinch=null,moved=0;
function screenToWorldDelta(dx,dy){const z=state.cam.zoom*LTM.API.S;// inverse of iso projection at fixed z
  const a=dx/(z*LTM.API.C30),b=dy/(z*LTM.API.S30);return [(a+b)/2,(b-a)/2];}
cv.addEventListener('pointerdown',e=>{try{cv.setPointerCapture(e.pointerId);}catch(_){}ptrs.set(e.pointerId,[e.clientX,e.clientY]);moved=0;
  if(ptrs.size===1) drag={x:e.clientX,y:e.clientY,cx:state.cam.x,cy:state.cam.y};
  if(ptrs.size===2){const p=[...ptrs.values()];pinch={d:Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]),z:state.cam.zoom};drag=null;}});
cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId)) return;ptrs.set(e.pointerId,[e.clientX,e.clientY]);
  if(pinch&&ptrs.size===2){const p=[...ptrs.values()];const d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);state.cam.zoom=clampZoom(pinch.z*d/pinch.d);state.dirty=true;moved=99;return;}
  if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved=Math.max(moved,Math.hypot(dx,dy));if(moved>6){const [wx,wy]=screenToWorldDelta(dx,dy);state.cam.x=drag.cx-wx;state.cam.y=drag.cy-wy;clampCam();state.follow=null;if(window.LTM_onFollow) window.LTM_onFollow(null);state.dirty=true;}}});
function up(e){const wasTap=ptrs.size===1&&moved<=6&&!pinch;ptrs.delete(e.pointerId);if(ptrs.size<2) pinch=null;if(ptrs.size===0) drag=null;
  if(wasTap&&window.LTM_onTap){const r=cv.getBoundingClientRect();window.LTM_onTap(e.clientX-r.left,e.clientY-r.top);}}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);drag=null;pinch=null;});
cv.addEventListener('wheel',e=>{e.preventDefault();state.cam.zoom=clampZoom(state.cam.zoom*(e.deltaY<0?1.1:1/1.1));state.dirty=true;},{passive:false});
window.addEventListener('resize',size);
// test hooks
window.LTM_app={setT,setPlaying,step,cycleSpeed,state,draw,clampZoom};
size();setT(0);
Promise.resolve(document.fonts&&document.fonts.ready).then(()=>{state.dirty=true;document.body.dataset.ready='1';});
requestAnimationFrame(frame);
})();
