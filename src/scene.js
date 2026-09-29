// The Last Ten Minutes: scene renderer. Pure function of (t, camera, viewport).
// Derived from the approved mood study (mood/mood.html).
'use strict';
const LTM = (function(){
const S=44,C30=0.8660254,S30=0.5,PZ=0.7,T_END=600;
let g=null;
function P(x,y,z=0){return [(x-y)*C30*S,(x+y)*S30*S - z*S];}
function poly(pts,fill,stroke){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke();}}
function box(x0,x1,y0,y1,z0,z1,top,left,right,edge){
  poly([P(x0,y1,z0),P(x1,y1,z0),P(x1,y1,z1),P(x0,y1,z1)],left,edge);
  poly([P(x1,y0,z0),P(x1,y1,z0),P(x1,y1,z1),P(x1,y0,z1)],right,edge);
  poly([P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1)],top,edge);
}
function yq(x0,x1,yy,z0,z1,fill){poly([P(x0,yy,z0),P(x1,yy,z0),P(x1,yy,z1),P(x0,yy,z1)],fill);}
function xq(xx,y0,y1,z0,z1,fill){poly([P(xx,y0,z0),P(xx,y1,z0),P(xx,y1,z1),P(xx,y0,z1)],fill);}
function glow(x,y,r,col,a){g.save();g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(${col},${a})`);gr.addColorStop(0.35,`rgba(${col},${a*0.35})`);gr.addColorStop(1,`rgba(${col},0)`);g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r);g.restore();}
function pool(wx,wy,wz,r,col,a){const [x,y]=P(wx,wy,wz);g.save();g.globalCompositeOperation='lighter';g.translate(x,y);g.scale(1,0.55);const gr=g.createRadialGradient(0,0,0,0,0,r);gr.addColorStop(0,`rgba(${col},${a})`);gr.addColorStop(0.5,`rgba(${col},${a*0.35})`);gr.addColorStop(1,`rgba(${col},0)`);g.fillStyle=gr;g.beginPath();g.arc(0,0,r,0,7);g.fill();g.restore();}
// Deterministic hash noise: h(i,k) in [0,1)
function h(i,k){let x=(i*374761393+k*668265263)|0;x=(x^(x>>>13))*1274126177|0;x=x^(x>>>16);return (x>>>0)/4294967296;}
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function smooth(e0,e1,v){const u=clamp((v-e0)/(e1-e0),0,1);return u*u*(3-2*u);}

// ---------- world layout ----------
const WORLD={x0:0,x1:22,y0:0,y1:11.5};
const LAMPS=[[6.4,10.4],[12.3,10.4],[18.0,10.4],[8.2,5.1],[15.4,5.1]];
const CLOCK=[11.0,7.4];
const BENCH=[9.2,9.8];
const HALL={x0:0.4,x1:4.6,y0:4.9,y1:10.6};

// ---------- static pieces ----------
function drawSlab(){
  box(0,22,0,11.5,-1.3,0,'#1a1d22','#2a2019','#1f1813');
  for(const [z,col] of [[-0.25,'#3a2c20'],[-0.55,'#241a13'],[-0.9,'#30241a']]){g.strokeStyle=col;g.lineWidth=2;g.beginPath();let a=P(0,11.5,z),b=P(22,11.5,z),d=P(22,0,z);g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(d[0],d[1]);g.stroke();}
  const [px,py]=P(8.2,11.5,-0.25);g.save();g.transform(C30,S30,0,1,px,py);
  let pg=g.createLinearGradient(0,0,0,34);pg.addColorStop(0,'#8a6a34');pg.addColorStop(1,'#5a4220');g.fillStyle=pg;g.fillRect(0,0,330,36);g.strokeStyle='#b8924c';g.lineWidth=1.5;g.strokeRect(3,3,324,30);
  g.fillStyle='#2a1c0c';g.font='italic 22px "EB Garamond", Garamond, Georgia, serif';g.textAlign='center';g.fillText('Ashcombe Halt',165,25);g.restore();
}
function drawTrack(){
  box(0,22,0.6,4.1,0,0.18,'#23252a','#1c1d21','#18191c');
  for(let x=0.3;x<22;x+=0.75) box(x,x+0.28,0.9,3.8,0.18,0.26,'#2e2620','#221c17','#1d1813');
  for(const y of [1.55,3.0]) box(0,22,y,y+0.12,0.26,0.36,'#7d8590','#4b5058','#3a3e44');
}
function drawPlatform(t){
  box(0,22,4.2,11.2,0,PZ,'#2b323d','#2f343b','#262a30','#1b1e23');
  g.strokeStyle='rgba(15,18,24,0.55)';g.lineWidth=1;
  for(let x=1;x<22;x+=1){const a=P(x,4.6,PZ),b=P(x,11.2,PZ);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}
  for(let y=5.6;y<11.2;y+=1){const a=P(0,y,PZ),b=P(22,y,PZ);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}
  box(0,22,4.2,4.6,PZ,PZ+0.02,'#4a4f57','#3b3f45','#33363b');
  poly([P(0,4.62,PZ),P(22,4.62,PZ),P(22,4.78,PZ),P(0,4.78,PZ)],'#8a7a3a');
  for(let z=0.18;z<PZ;z+=0.2){g.strokeStyle='rgba(10,12,16,0.5)';const a=P(0,11.2,z),b=P(22,11.2,z),d=P(22,4.2,z);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(d[0],d[1]);g.stroke();}
  // puddles (static positions)
  for(let i=0;i<16;i++){const x=5+h(i,1)*16,y=5.2+h(i,2)*5.6;const [a,b]=P(x,y,PZ);g.fillStyle='rgba(120,150,190,0.09)';g.beginPath();g.ellipse(a,b,22+h(i,3)*34,6+h(i,4)*6,0,0,7);g.fill();}
  // light pools
  for(const [x,y] of LAMPS) pool(x,y,PZ,230,'255,176,86',0.22);
  pool(4.9,8.6,PZ,220,'255,170,80',0.22);
  pool(CLOCK[0],CLOCK[1],PZ,150,'255,236,200',0.06);
  // soft wet reflections: blurred vertical smear under each lamp head, broken by ripples
  for(const [x,y] of LAMPS) reflection(x,y,t);
}
function platformClip(){const q=[P(0,4.62,PZ),P(22,4.62,PZ),P(22,11.2,PZ),P(0,11.2,PZ)];g.beginPath();q.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.clip();}
function softBlob(cx,cy,rx,ry,col,a){ // elliptical radial gradient: cheap soft blur without canvas filters
  g.save();g.translate(cx,cy);g.scale(rx/ry,1);const gr=g.createRadialGradient(0,0,0,0,0,ry);gr.addColorStop(0,`rgba(${col},${a})`);gr.addColorStop(0.45,`rgba(${col},${a*0.55})`);gr.addColorStop(1,`rgba(${col},0)`);
  g.fillStyle=gr;g.fillRect(-ry,-ry,2*ry,2*ry);g.restore();}
function reflection(x,y,t){
  // Soft wet reflection: a warm smear below the lamp base, mirrored head brightest, broken by drifting ripples. Clipped to the platform.
  const [a,b]=P(x,y,PZ),[,d1]=P(x,y,PZ+3.1);
  const len=(b-d1)*0.75,head=b+len*0.82;
  g.save();platformClip();g.globalCompositeOperation='lighter';
  softBlob(a,b+len*0.5,16,len*0.55,'255,186,104',0.10);
  softBlob(a,head,14,22,'255,210,140',0.22);
  for(let k=0;k<5;k++){const ph=((t*0.35+k*0.2+h(Math.round(x*10),k))%1);const yy=b+len*(0.2+0.75*ph);const w=10+8*h(Math.round(x*10)+k,Math.floor(t*0.35+k*0.2));
    const gr=g.createLinearGradient(a-w/2,0,a+w/2,0);const al=0.12*Math.sin(ph*Math.PI);gr.addColorStop(0,'rgba(255,205,140,0)');gr.addColorStop(0.5,`rgba(255,205,140,${al})`);gr.addColorStop(1,'rgba(255,205,140,0)');
    g.fillStyle=gr;g.fillRect(a-w/2,yy,w,1.6);}
  g.restore();
}
function lamp(x,y){const [a,b]=P(x,y,PZ),[c1,d1]=P(x,y,PZ+3.1);g.strokeStyle='#0e1013';g.lineWidth=4;g.beginPath();g.moveTo(a,b);g.lineTo(c1,d1);g.stroke();
  g.fillStyle='#0e1013';g.fillRect(a-6,b-8,12,8);g.fillRect(c1-9,d1-4,18,5);g.fillStyle='#ffcf82';g.fillRect(c1-6,d1-20,12,16);g.fillStyle='#0e1013';g.beginPath();g.moveTo(c1-10,d1-20);g.lineTo(c1+10,d1-20);g.lineTo(c1,d1-28);g.fill();
  glow(c1,d1-12,120,'255,178,90',0.55);glow(c1,d1-12,30,'255,230,180',0.6);}
function bench(x,y){const x0=x-1,x1=x+1;box(x0,x1,y,y+0.45,PZ+0.35,PZ+0.42,'#3a2a1e','#2a1e15','#22180f');box(x0,x1,y-0.05,y+0.02,PZ+0.42,PZ+0.95,'#35271c','#2c2017','#241a12');
  for(const lx of [x0+0.1,x1-0.2]) box(lx,lx+0.1,y+0.05,y+0.4,PZ,PZ+0.35,'#111','#0c0c0c','#0a0a0a');}
function clockAt(x,y,t){const [a,b]=P(x,y,PZ),[c1,d1]=P(x,y,PZ+3.9);g.strokeStyle='#101216';g.lineWidth=6;g.beginPath();g.moveTo(a,b);g.lineTo(c1,d1);g.stroke();
  g.fillStyle='#101216';g.fillRect(a-9,b-12,18,12);
  const r=24;glow(c1,d1-r,120,'255,235,190',0.35);
  g.fillStyle='#16181c';g.beginPath();g.arc(c1,d1-r,r+4,0,7);g.fill();
  const fg=g.createRadialGradient(c1-5,d1-r-5,2,c1,d1-r,r);fg.addColorStop(0,'#fff6dc');fg.addColorStop(1,'#e2cfa0');g.fillStyle=fg;g.beginPath();g.arc(c1,d1-r,r,0,7);g.fill();
  g.strokeStyle='#2a2218';for(let i=0;i<12;i++){const an=i/12*Math.PI*2;g.lineWidth=i%3?1:2;g.beginPath();g.moveTo(c1+Math.sin(an)*r*0.78,d1-r-Math.cos(an)*r*0.78);g.lineTo(c1+Math.sin(an)*r*0.92,d1-r-Math.cos(an)*r*0.92);g.stroke();}
  const st=(typeof STORY!=='undefined')?STORY.stationSeconds(t):t; // the station clock keeps its own time
  const mins=50+st/60, mA=mins/60*Math.PI*2, hA=(9+mins/60)/12*Math.PI*2, sA=(st%60)/60*Math.PI*2;g.lineCap='round';
  g.lineWidth=2.6;g.beginPath();g.moveTo(c1,d1-r);g.lineTo(c1+Math.sin(hA)*r*0.5,d1-r-Math.cos(hA)*r*0.5);g.stroke();
  g.lineWidth=1.6;g.beginPath();g.moveTo(c1,d1-r);g.lineTo(c1+Math.sin(mA)*r*0.8,d1-r-Math.cos(mA)*r*0.8);g.stroke();
  g.strokeStyle='#9a2a1e';g.lineWidth=0.8;g.beginPath();g.moveTo(c1,d1-r);g.lineTo(c1+Math.sin(sA)*r*0.85,d1-r-Math.cos(sA)*r*0.85);g.stroke();
  g.fillStyle='#9a2a1e';g.beginPath();g.arc(c1,d1-r,2,0,7);g.fill();g.lineCap='butt';}

// ---------- train ----------
function roundedRoof(x0,x1,y0,y1,z){ // barrel roof: half-ellipse profile swept along x, drawn back to front
  const yc=(y0+y1)/2,ry=(y1-y0)/2+0.04,rz=0.55,n=14;
  for(let i=n-1;i>=0;i--){const a0=Math.PI*i/n,a1=Math.PI*(i+1)/n; // a=0 front edge (y1), a=PI back edge (y0)
    const ya=yc+Math.cos(a0)*ry,za=z+Math.sin(a0)*rz,yb=yc+Math.cos(a1)*ry,zb=z+Math.sin(a1)*rz;
    const lit=0.72+0.5*Math.sin((a0+a1)/2)*0.6+0.25*Math.cos((a0+a1)/2);
    poly([P(x0,ya,za),P(x1,ya,za),P(x1,yb,zb),P(x0,yb,zb)],shade('#3a2e30',lit));}
  g.beginPath();for(let i=0;i<=n;i++){const a=Math.PI*i/n;const p=P(x1,yc+Math.cos(a)*ry,z+Math.sin(a)*rz);i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);}g.closePath();g.fillStyle='#1f1617';g.fill();
  // wet highlight along the crown
  const q=P(x0,yc+0.3,z+rz*0.98),r=P(x1,yc+0.3,z+rz*0.98);g.strokeStyle='rgba(170,190,215,0.22)';g.lineWidth=2;g.beginPath();g.moveTo(q[0],q[1]);g.lineTo(r[0],r[1]);g.stroke();
}
function carriage(x0,x1,idx,t,doorOpen){
  const y0=1.2,y1=3.55,z0=0.55,z1=2.75;
  box(x0+0.4,x1-0.4,y0+0.4,y1-0.4,0.3,z0,'#111','#0c0c0e','#0a0a0c');
  box(x0,x1,y0,y1,z0,z1,'#2a2224','#3b1d20','#2c1618','#1a0e10');
  // lower body tumblehome shading
  yq(x0,x1,y1+0.001,z0,z0+0.35,'rgba(0,0,0,0.28)');yq(x0,x1,y1+0.001,z0+0.35,z0+0.6,'rgba(0,0,0,0.12)');yq(x0,x1,y1+0.001,z1-0.35,z1,'rgba(255,200,150,0.06)');
  // rounded end corners
  xq(x1,y0+0.2,y1-0.2,z0,z1,'#321a1c');xq(x1+0.001,y1-0.2,y1,z0,z1,'#3a1f22');
  roundedRoof(x0,x1,y0,y1,z1);
  yq(x0,x1,y1,z0+0.42,z0+0.47,'#7a5a2a');yq(x0,x1,y1,z1-0.2,z1-0.16,'#6a4c24');
  let k=0;
  for(let x=x0+0.45;x<x1-0.8;x+=1.05,k++){
    const lit=h(idx*20+k,5)<0.8;yq(x,x+0.7,y1+0.001,z0+0.8,z0+1.75,lit?'#e8a64e':'#3a2a22');
    if(lit){const [wx,wy]=P(x+0.35,y1,z0+1.3);glow(wx,wy,46,'255,180,90',0.28);
      if(h(idx*20+k,6)<0.45){const [sx,sy]=P(x+0.35,y1,z0+0.8);g.fillStyle='rgba(40,20,14,0.85)';g.beginPath();g.ellipse(sx,sy-18,6,7,0,0,7);g.fill();g.fillRect(sx-9,sy-11,18,11);}}
  }
  const dx=x1-0.7;
  if(doorOpen){yq(dx,dx+0.45,y1+0.002,z0+0.1,z1-0.3,'#d99040');const [a,b]=P(dx+0.22,y1,z0+1);glow(a,b,60,'255,170,80',0.35);}
  else yq(dx,dx+0.45,y1+0.002,z0+0.1,z1-0.3,'#2a1214');
  for(const wx of [x0+0.9,x0+1.8,x1-1.8,x1-0.9]){const [a,b]=P(wx,y1-0.1,0.55);g.fillStyle='#08080a';g.beginPath();g.ellipse(a,b,13,15,0,0,7);g.fill();g.strokeStyle='#3a3d44';g.lineWidth=1.5;g.stroke();}
}
function cylinderX(x0,x1,yc,zc,r,col,dark){ // horizontal cylinder along x, drawn as shaded bands
  const n=8;
  for(let i=n;i>=0;i--){const a=Math.PI*(0.5+i/n); // from bottom-front to top
    const dy=Math.cos(a)*r*-1, dz=Math.sin(a)*r;
  }
  // body: series of thin slabs following the circle profile
  const bands=10;
  for(let i=0;i<bands;i++){
    const a0=-Math.PI/2+i/bands*Math.PI, a1=-Math.PI/2+(i+1)/bands*Math.PI;
    const ya=yc+Math.cos(a0)*r, za=zc+Math.sin(a0)*r, yb=yc+Math.cos(a1)*r, zb=zc+Math.sin(a1)*r;
    const light=0.55+0.45*Math.sin((a0+a1)/2+0.3);
    poly([P(x0,ya,za),P(x1,ya,za),P(x1,yb,zb),P(x0,yb,zb)],shade(col,light));
  }
  // front disc (+x face)
  g.beginPath();for(let i=0;i<=24;i++){const a=i/24*Math.PI*2;const p=P(x1,yc+Math.cos(a)*r,zc+Math.sin(a)*r);i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);}g.closePath();g.fillStyle=dark;g.fill();
}
function shade(hex,k){const n=parseInt(hex.slice(1),16);const r=Math.round(((n>>16)&255)*k),gg=Math.round(((n>>8)&255)*k),b=Math.round((n&255)*k);return `rgb(${r},${gg},${b})`;}
function locomotive(t){
  const x0=14.8,x1=21.2,y0=1.3,y1=3.45;
  box(x0+0.3,x1-0.2,y0+0.3,y1-0.3,0.3,0.7,'#111','#0b0b0d','#0a0a0b');
  box(x0,x0+2.2,y0,y1,0.7,3.0,'#1d2622','#16201c','#111916','#0a0f0d');
  yq(x0+0.5,x0+1.6,y1+0.002,1.8,2.55,'#f0b058');{const [a,b]=P(x0+1.05,y1,2.2);glow(a,b,70,'255,175,80',0.35);}
  box(x0-0.05,x0+2.35,y0-0.1,y1+0.1,3.0,3.08,'#131a17','#0f1512','#0c110f');
  box(x0+0.1,x0+2.25,y0+0.2,y1-0.2,3.08,3.2,'#18201c','#121915','#0e1411');
  box(x0+2.2,x1,y0+0.35,y1-0.35,0.7,1.1,'#1a2420','#142019','#101915');
  cylinderX(x0+2.2,x1-0.1,2.38,1.85,0.82,'#2f4238','#16201b');
  for(const bx of [x0+3.2,x0+4.6]){g.strokeStyle='#8a6a34';g.lineWidth=2;g.beginPath();for(let i=0;i<=12;i++){const a=-Math.PI/2+i/12*Math.PI;const p=P(bx,2.38+Math.cos(a)*0.83,1.85+Math.sin(a)*0.83);i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);}g.stroke();}
  box(x1-1.3,x1-0.8,2.1,2.65,2.5,3.5,'#141a17','#101512','#0c100e');
  box(x1-1.4,x1-0.7,2.0,2.75,3.5,3.62,'#1a201d','#141916','#101311');
  box(x0+3.8,x0+4.4,2.1,2.65,2.55,2.95,'#6a4c24','#5a3e1c','#4a3216');
  {const [a,b]=P(x1-0.05,2.4,1.5);glow(a,b,110,'255,230,170',0.5);g.fillStyle='#fff3d0';g.beginPath();g.arc(a,b,6,0,7);g.fill();}
  const spin=t*0.8;
  for(const wx of [x0+2.8,x0+4.1,x0+5.4]){const [a,b]=P(wx,y1-0.1,0.72);g.fillStyle='#08080a';g.beginPath();g.ellipse(a,b,20,23,0,0,7);g.fill();g.strokeStyle='#6a1c1c';g.lineWidth=2;g.stroke();
    g.strokeStyle='#3a1414';g.lineWidth=1.5;for(let s=0;s<3;s++){const an=spin+s*Math.PI/3;g.beginPath();g.moveTo(a-Math.cos(an)*17,b-Math.sin(an)*20);g.lineTo(a+Math.cos(an)*17,b+Math.sin(an)*20);g.stroke();}}
}
function drawTrain(t){
  const doorsOpen=t<590;
  carriage(0.3,7.2,0,t,doorsOpen);carriage(7.5,14.4,1,t,doorsOpen);locomotive(t);
}

// ---------- booking hall (left end, keeps engine visible) ----------
function drawHall(t,clerkIn){
  const {x0,x1,y0,y1}=HALL,z0=PZ,z1=PZ+3.1;
  box(x0,x1,y0,y1,z0,z1,'#2e2926','#3d3431','#302926','#1e1a18');
  g.strokeStyle='rgba(20,15,12,0.35)';for(let z=z0+0.25;z<z1;z+=0.25){const a=P(x0,y1,z),b=P(x1,y1,z),d=P(x1,y0,z);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(d[0],d[1]);g.stroke();}
  const S_=(typeof STORY!=='undefined')?STORY:null;
  // booking-hall door onto the platform, on the +x face (always open)
  xq(x1+0.002,7.6,8.4,z0,z0+1.9,'#f0a850');xq(x1+0.003,7.5,7.6,z0,z0+2.0,'#1a1412');xq(x1+0.003,8.4,8.5,z0,z0+2.0,'#1a1412');
  {const [a,b]=P(x1,8.0,z0+1.0);glow(a,b,110,'255,170,80',0.4);}
  // ladies' waiting-room door, +x face: dark panelled door, lit gap when open
  {const open=S_?S_.doorOpen('waiting',t):false;
   xq(x1+0.002,9.5,10.2,z0,z0+1.85,open?'#e8a04a':'#2a1c14');
   if(open){xq(x1+0.003,9.5,9.62,z0,z0+1.85,'#1d130d');const [a,b]=P(x1,9.85,z0+0.9);glow(a,b,70,'255,170,80',0.35);}
   else{xq(x1+0.003,9.6,10.1,z0+1.0,z0+1.7,'#35251a');xq(x1+0.003,9.6,10.1,z0+0.2,z0+0.9,'#35251a');}
   xq(x1+0.003,9.42,9.5,z0,z0+1.95,'#120d0a');xq(x1+0.003,10.2,10.28,z0,z0+1.95,'#120d0a');
   xq(x1+0.004,9.45,10.25,z0+2.0,z0+2.28,'#1d2a24');
   const [px,py]=P(x1+0.004,9.45,z0+2.28);g.save();g.transform(C30,-S30,0,1,px,py);g.fillStyle='#d8c690';g.font='600 9px "EB Garamond", Garamond, Georgia, serif';g.textAlign='center';g.fillText('LADIES',(0.8*S)/2,10);g.restore();}
  // ticket window on +x face
  xq(x1+0.002,5.4,6.4,z0+1.0,z0+2.1,'#e8a04a');
  if(clerkIn){const [a,b]=P(x1,5.9,z0+1.0);g.fillStyle='rgba(30,16,10,0.9)';g.beginPath();g.ellipse(a,b-30,8,9,0,0,7);g.fill();g.fillRect(a-12,b-21,24,21);g.fillRect(a-13,b-44,26,4);}
  {const [a,b]=P(x1,5.9,z0+1.5);glow(a,b,70,'255,170,80',0.3);}
  // front window and street door on the +y face
  yq(0.9,2.4,y1+0.002,z0+1.0,z0+2.1,'#d8923e');{const [a,b]=P(1.65,y1,z0+1.5);glow(a,b,70,'255,170,80',0.28);}
  {const open=S_?S_.doorOpen('street',t):false;
   yq(2.8,3.6,y1+0.002,z0,z0+1.9,open?'#e8a04a':'#2a1c14');
   if(open){const [a,b]=P(3.2,y1,z0+0.9);glow(a,b,80,'255,170,80',0.35);}else{yq(2.9,3.5,y1+0.003,z0+1.0,z0+1.75,'#35251a');yq(2.9,3.5,y1+0.003,z0+0.2,z0+0.9,'#35251a');}
   yq(2.72,2.8,y1+0.003,z0,z0+2.0,'#120d0a');yq(3.6,3.68,y1+0.003,z0,z0+2.0,'#120d0a');
   const [a,b]=P(3.2,y1+0.3,z0+2.25);g.fillStyle='#ffcf82';g.fillRect(a-4,b-6,8,8);glow(a,b-2,60,'255,178,90',0.4);}
  // sign on +x face
  xq(x1+0.004,5.4,9.8,z0+2.35,z0+2.85,'#1d2a24');
  {const [px,py]=P(x1+0.004,5.4,z0+2.85);g.save();g.transform(C30,-S30,0,1,px,py);g.fillStyle='#d8c690';g.font='600 15px "EB Garamond", Garamond, Georgia, serif';g.textAlign='center';g.fillText('ASHCOMBE',(4.4*S)/2,17);g.restore();}
  // roof pitched along y
  const zr=z1+1.4,xm=(x0+x1)/2;
  poly([P(x0-0.3,y0-0.2,z1),P(xm,y0-0.2,zr),P(xm,y1+0.2,zr),P(x0-0.3,y1+0.2,z1)],'#1a1d22');
  poly([P(x0-0.3,y1+0.2,z1),P(x1+0.3,y1+0.2,z1),P(xm,y1+0.2,zr)],'#262220');
  poly([P(xm,y0-0.2,zr),P(x1+0.3,y0-0.2,z1),P(x1+0.3,y1+0.2,z1),P(xm,y1+0.2,zr)],'#2a2f37');
  g.strokeStyle='rgba(10,12,15,0.5)';for(let u=0.1;u<1;u+=0.1){const a=P(xm+(x1+0.3-xm)*u,y0-0.2,zr-(zr-z1)*u),b=P(xm+(x1+0.3-xm)*u,y1+0.2,zr-(zr-z1)*u);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}
  box(1.2,1.7,6.0,6.5,zr-0.8,zr+0.5,'#2b2522','#3a302b','#2c2421');
  {const [a,b]=P(x1+0.2,8.0,z0+2.2);g.fillStyle='#ffcf82';g.fillRect(a-5,b-8,10,10);glow(a,b-3,90,'255,178,90',0.5);}
}

// ---------- steam ----------
function drawSteam(t){
  // continuous plume: puffs are born every 0.5 s and age deterministically
  const rate=2, life=14, depart=smooth(575,600,t);
  const nNow=Math.floor(t*rate);
  for(let n=nNow-life*rate;n<=nNow;n++){
    if(n<-life*rate) continue;
    const age=t-n/rate; if(age<0||age>life) continue;
    const u=age/life, jx=h(n,11)-0.5, jz=h(n,12);
    const [a,b]=P(20.2-u*9-jx*0.8,2.2+jx*1.2,3.7+u*1.8+jz*0.8);
    const r=20+u*80+h(n,13)*20;const al=(0.11+0.08*depart)*(1-u)*(u<0.05?u/0.05:1);
    const gr=g.createRadialGradient(a,b,0,a,b,r);gr.addColorStop(0,`rgba(205,210,220,${al})`);gr.addColorStop(1,'rgba(205,210,220,0)');g.fillStyle=gr;g.fillRect(a-r,b-r,2*r,2*r);
  }
  // low drifting steam along the train, heavier near departure
  for(let i=0;i<30;i++){const drift=((h(i,21)*17+t*0.05*(0.5+h(i,22)))%17);const [a,b]=P(3+drift,4.1,0.4+h(i,23)*0.5);const r=30+h(i,24)*40;const al=0.06+0.08*depart;const gr=g.createRadialGradient(a,b,0,a,b,r);gr.addColorStop(0,`rgba(200,205,215,${al})`);gr.addColorStop(1,'rgba(200,205,215,0)');g.fillStyle=gr;g.fillRect(a-r,b-r,2*r,2*r);}
}

// ---------- rain (screen space, deterministic in t) ----------
function drawRain(t,W,H,zoom,reduced){
  g.save();g.lineCap='round';
  const n=Math.round(clamp(W*H/1100,300,1600));
  for(let i=0;i<n;i++){
    const sp=620+h(i,31)*420; // px per second
    const len=(10+h(i,32)*22)*Math.min(zoom,1.6);
    const span=H+len+40;
    const y=((h(i,33)*span+t*sp)%span)-len-20;
    const x=(h(i,34)*(W+200)-100)-(y+len)*0.22;
    const al=0.05+h(i,35)*0.16;
    g.strokeStyle=`rgba(175,195,225,${al})`;g.lineWidth=h(i,36)<0.1?1.4:0.8;
    g.beginPath();g.moveTo(x,y);g.lineTo(x-len*0.22,y+len);g.stroke();
  }
  g.restore();
}
function drawSplashes(t){
  g.save();
  for(let i=0;i<140;i++){
    const period=0.7+h(i,41)*0.9;const cyc=Math.floor((t+h(i,42)*period)/period);const ph=((t+h(i,42)*period)/period)-cyc;
    const x=5+h(i*97+cyc,43)*16.5,y=4.8+h(i*97+cyc,44)*6.2;const [a,b]=P(x,y,PZ);
    g.strokeStyle=`rgba(200,215,235,${0.25*(1-ph)})`;g.lineWidth=0.8;g.beginPath();g.ellipse(a,b,2+ph*6,0.8+ph*2,0,0,7);g.stroke();
  }
  g.restore();
}

// ---------- scene ----------
// actors: optional function(g, helpers, t) returning [{depth, draw}] for depth sorting with props
function render(ctx,opts){
  g=ctx;
  const t=clamp(opts.t,0,T_END), W=opts.width, H=opts.height, dpr=opts.dpr||1;
  const cam=opts.camera, zoom=cam.zoom;
  g.setTransform(dpr,0,0,dpr,0,0);
  let bg=g.createRadialGradient(W*0.48,H*0.42,80,W*0.5,H*0.5,Math.max(W,H)*0.9);bg.addColorStop(0,'#1c2536');bg.addColorStop(0.55,'#0e131d');bg.addColorStop(1,'#040507');g.fillStyle=bg;g.fillRect(0,0,W,H);
  // world transform: camera centre (world x,y at platform height) to screen centre
  const [cx,cy]=P(cam.x,cam.y,PZ);
  const oy=cam.oy||0;g.setTransform(dpr*zoom,0,0,dpr*zoom,dpr*(W/2-cx*zoom),dpr*(H/2-oy-cy*zoom));
  // distant town lights (parallax-free, in world space behind slab)
  for(let i=0;i<46;i++){const [x,y]=P(-6+h(i,51)*34,-10+h(i,52)*6,6+h(i,53)*6);glow(x,y,(4+h(i,54)*16)*2.2,h(i,55)<0.7?'255,190,110':'170,200,255',0.05+h(i,56)*0.08);}
  drawSlab();drawTrack();drawTrain(t);drawPlatform(t);drawSplashes(t);
  const items=[];
  const clerkIn=opts.clerkIn!==undefined?opts.clerkIn:true;
  items.push({depth:HALL.x1+HALL.y1-4,draw:()=>drawHall(t,clerkIn)});
  for(const [x,y] of LAMPS) items.push({depth:x+y,draw:()=>lamp(x,y)});
  items.push({depth:BENCH[0]+BENCH[1]-0.3,draw:()=>bench(BENCH[0],BENCH[1])});
  items.push({depth:CLOCK[0]+CLOCK[1],draw:()=>clockAt(CLOCK[0],CLOCK[1],t)});
  if(opts.actors) for(const it of opts.actors(t,API)) items.push(it);
  items.sort((a,b)=>a.depth-b.depth);
  for(const it of items) it.draw();
  drawSteam(t);
  g.setTransform(dpr,0,0,dpr,0,0);
  drawRain(t,W,H,zoom,opts.reduced);
  const vg=g.createRadialGradient(W*0.5,H*0.47,Math.min(W,H)*0.35,W*0.5,H*0.5,Math.max(W,H)*0.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.6)');g.fillStyle=vg;g.fillRect(0,0,W,H);
}
function worldToScreen(x,y,z,cam,W,H){const [px,py]=P(x,y,z);const [cx,cy]=P(cam.x,cam.y,PZ);return [W/2+(px-cx)*cam.zoom,H/2-(cam.oy||0)+(py-cy)*cam.zoom];}
function clockText(t){t=clamp(t,0,T_END);const s=Math.floor(t+1e-6);const m=50+Math.floor(s/60),sec=s%60;return m>=60?'10:00:00':`9:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;}
const API={softBlob,P,poly,box,yq,xq,glow,pool,h,clamp,smooth,get g(){return g;},PZ,S,C30,S30};
return {render,worldToScreen,clockText,T_END,WORLD,PZ,API,CLOCK,BENCH,HALL,LAMPS};
})();
if(typeof module!=='undefined') module.exports=LTM;
