/* ===================== MOTOR DE RENDER =====================
   Geometría en unidades 0–100. Formatos:
   'e cx cy rx ry [rot]'  elipse      'r cx cy rx ry w [rot]'  anillo
   'p x,y x,y …' contorno suave cerrado   'q x,y …' polígono
   'l w x,y …' tubo suave abierto (ancho w)   'k w x,y …' tubo recto
   'pt x y' punto (rótulo sin dibujo) */
const GEO = {};
function geo(g){if(GEO[g])return GEO[g];
 const t=g.trim().split(/\s+/),k=t[0],n=t.slice(1).map(v=>v.includes(',')?v.split(',').map(Number):Number(v));
 const path=new Path2D();let o={path,w:0,k};
 if(k=='e'||k=='r'){const [cx,cy,rx,ry]=n;const w=k=='r'?n[4]:0,rot=(k=='r'?n[5]:n[4])||0;
  path.ellipse(cx,cy,rx,ry,rot*Math.PI/180,0,Math.PI*2);o.w=w;o.sp=[cx,cy,rx,ry];o.a=[cx,k=='r'?cy-ry:cy];o.c=[cx,cy];o.r=Math.max(rx,ry);}
 else if(k=='pt'){o.a=[n[0],n[1]];path.arc(n[0],n[1],3.5,0,Math.PI*2);o.pt=1;}
 else{let pts=n,w=0;if(k=='l'||k=='k'){w=n[0];pts=n.slice(1);}o.w=w;
  const cl=k=='p'||k=='q';
  if(k=='q'||k=='k'){pts.forEach((p,i)=>i?path.lineTo(p[0],p[1]):path.moveTo(p[0],p[1]));}
  else spline(path,pts,cl);
  if(cl)path.closePath();
  o.a=cl?[pts.reduce((s,p)=>s+p[0],0)/pts.length,pts.reduce((s,p)=>s+p[1],0)/pts.length]:pts[Math.floor((pts.length-1)/2)].slice();
  if(!cl&&pts.length%2==0){const p1=pts[pts.length/2-1],p2=pts[pts.length/2];o.a=[(p1[0]+p2[0])/2,(p1[1]+p2[1])/2];}
  o.pts=pts;}
 return GEO[g]=o;}
function spline(path,p,closed){const n=p.length;if(n<3){path.moveTo(...p[0]);p.slice(1).forEach(q=>path.lineTo(...q));return;}
 const P=i=>closed?p[(i+n)%n]:p[Math.max(0,Math.min(n-1,i))];
 path.moveTo(...P(0));const m=closed?n:n-1;
 for(let i=0;i<m;i++){const p0=P(i-1),p1=P(i),p2=P(i+1),p3=P(i+2);
  path.bezierCurveTo(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6,p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6,p2[0],p2[1]);}}

/* generador pseudoaleatorio reproducible */
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};}

/* Secuencias / ventanas */
const SEQ = {
 'US':{n:'Ecografía'},
 'TC-B':{n:'TC · ventana partes blandas',W:400,L:40},
 'TC-C':{n:'TC con contraste IV (portal)',W:400,L:50,c:1},
 'TC-P':{n:'TC · ventana pulmonar',W:1500,L:-600},
 'TC-H':{n:'TC · ventana ósea',W:2000,L:500},
 'TC-N':{n:'TC · ventana cerebral',W:80,L:38},
 'T1':{n:'RM T1'},'T2':{n:'RM T2'},'FLAIR':{n:'RM FLAIR'},'T1C':{n:'RM T1 + gadolinio'},
 'RX':{n:'Radiografía'},'MG':{n:'Mamografía'}
};
function gris(t,seq){const x=T[t];if(!x)return null;const s=SEQ[seq];
 if(seq=='US')return x.us??.4;
 if(s.W){let hu=s.c&&x.hc!=null?x.hc:x.hu;if(hu==null)hu=40;return Math.max(0,Math.min(1,(hu-(s.L-s.W/2))/s.W));}
 if(seq=='T1')return x.t1??.4;if(seq=='T2')return x.t2??.4;if(seq=='FLAIR')return x.fr??x.t2??.4;
 if(seq=='T1C'){if(x.t1c!=null)return x.t1c;const base=x.t1??.4;return x.hc&&x.hc>x.hu+30&&x.t1>.15?Math.min(1,base+.18):base;}
 return x.rx??.4;}

/* Render de la imagen (N×N) */
function renderImagen(pl,seq,N){
 const cv=document.createElement('canvas');cv.width=cv.height=N;const c=cv.getContext('2d');
 c.fillStyle='#000';c.fillRect(0,0,N,N);c.setTransform(N/100,0,0,N/100,0,0);
 const us=seq=='US',proj=seq=='RX'||seq=='MG';
 c.filter=us?`blur(${N/420}px)`:proj?'none':`blur(${N/900}px)`;
 const fondo=pl.fondo||(us?'fondo_us':null);
 if(fondo){const v=gris(fondo,seq);if(us)c.fillStyle=`rgb(${Math.round(v*255)},0,0)`;else{const q=Math.round(v*255);c.fillStyle=`rgb(${q},${q},${q})`;}c.fillRect(0,0,100,100);}
 for(const s of pl.s){const t=s[1];if(t=='-'||t=='dash')continue;const g=geo(s[2]);if(g.pt)continue;
  let v=gris(t,seq);if(v==null)continue;const x=T[t];
  if(proj&&x.op=='add'){c.globalCompositeOperation='lighter';}else c.globalCompositeOperation='source-over';
  let col;
  if(us){const echo=Math.round(v*255),at=Math.round((x.at||0)*255),fl=Math.round((x.fl||0)*255);col=`rgb(${echo},${at},${fl})`;}
  else{const q=Math.round(v*255);col=`rgb(${q},${q},${q})`;}
  if(g.w){c.strokeStyle=col;c.lineWidth=g.w;c.lineCap='round';c.lineJoin='round';
   if(g.k=='r'){c.stroke(g.path);}else c.stroke(g.path);}
  else{const o0=s[4]||{};if(o0.blur)c.filter=`blur(${o0.blur*N/100}px)`;c.fillStyle=col;c.fill(g.path);if(o0.blur)c.filter=us?`blur(${N/420}px)`:proj?'none':`blur(${N/900}px)`;}
  const o=s[4]||{};
  if(us&&o.b){c.globalCompositeOperation='source-over';c.strokeStyle=`rgb(${Math.round(o.b*255)},0,0)`;c.lineWidth=.35;c.stroke(g.path);}
  if(proj&&o.tex)textura(c,g,o.tex,pl.id);
  if(o.vas)vasosPulm(c,g,seq,us,pl.id+s[0]);
  if(o.surcos)surcos(c,g,seq,us,o.surcos,pl.id+s[0]);
 }
 c.setTransform(1,0,0,1,0,0);c.filter='none';c.globalCompositeOperation='source-over';
 const img=c.getImageData(0,0,N,N),d=img.data,R=rng(pl.id.length*7919+seq.length);
 if(us){ultrasonido(pl,d,N,R);}
 else{
  const sd=proj?.035:seq.startsWith('TC')?.025:.03;
  let tmp=null;
  if(proj){tmp=new Float32Array(N*N);for(let i=0;i<N*N;i++)tmp[i]=d[i*4]/255;tmp=blurF(tmp,N,Math.round(N/320));}
  for(let i=0;i<N*N;i++){let v=proj?tmp[i]:d[i*4]/255;
   const n=(R()+R()+R()-1.5)*sd*1.4;
   if(!proj&&v>.04&&v<.97){const px=i%N,py=(i/N)|0;v*=1+(lfv(px,py,N)-1)*.07;}
   if(proj){v=1-Math.exp(-v*2.2);v=Math.pow(v,1.15);}
   else if(!seq.startsWith('TC')){v=Math.sqrt((v+n)*(v+n)+n*n*.5);}
   v+=proj||seq.startsWith('TC')?n:0;
   const q=Math.max(0,Math.min(255,v*255));d[i*4]=d[i*4+1]=d[i*4+2]=q;d[i*4+3]=255;}
 }
 c.putImageData(img,0,0);
 return cv;}

let LFG=null;function lfv(px,py,N){if(!LFG){const R=rng(99);LFG=new Float32Array(33*33);for(let i=0;i<LFG.length;i++)LFG[i]=.6+.8*R();}
 const gx=px/N*32,gy=py/N*32,ix=Math.min(31,gx|0),iy=Math.min(31,gy|0),fx=gx-ix,fy=gy-iy;
 return LFG[iy*33+ix]*(1-fx)*(1-fy)+LFG[iy*33+ix+1]*fx*(1-fy)+LFG[(iy+1)*33+ix]*(1-fx)*fy+LFG[(iy+1)*33+ix+1]*fx*fy;}
function blurF(a,N,r){if(r<1)return a;const b=new Float32Array(a.length),o=new Float32Array(a.length);
 for(let y=0;y<N;y++){let s=0;for(let x=-r;x<=r;x++)s+=a[y*N+Math.max(0,Math.min(N-1,x))];
  for(let x=0;x<N;x++){b[y*N+x]=s/(2*r+1);s+=a[y*N+Math.min(N-1,x+r+1)]-a[y*N+Math.max(0,x-r)];}}
 for(let x=0;x<N;x++){let s=0;for(let y=-r;y<=r;y++)s+=b[Math.max(0,Math.min(N-1,y))*N+x];
  for(let y=0;y<N;y++){o[y*N+x]=s/(2*r+1);s+=b[Math.min(N-1,y+r+1)*N+x]-b[Math.max(0,y-r)*N+x];}}
 return o;}

function colorDe(t,seq,us){const v=gris(t,seq),x=T[t];if(us)return `rgb(${Math.round(v*255)},${Math.round((x.at||0)*255)},${Math.round((x.fl||0)*255)})`;const q=Math.round(v*255);return `rgb(${q},${q},${q})`;}
function hash(s){let h=7;for(const ch of s)h=(h*31+ch.charCodeAt(0))>>>0;return h;}
/* vasos pulmonares: ramificación desde los hilios con calibre decreciente */
function vasosPulm(c,g,seq,us,id){const R=rng(hash(id));c.save();c.clip(g.path);c.fillStyle=colorDe('sangre',seq,us);
 const bb=g.pts.reduce((b,p)=>[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[999,999,-999,-999]);
 const hx=bb[0]<50&&bb[2]<55?bb[2]:bb[0],hy=(bb[1]+bb[3])/2;
 for(let i=0;i<170;i++){const x=bb[0]+R()*(bb[2]-bb[0]),y=bb[1]+R()*(bb[3]-bb[1]);const dist=Math.hypot(x-hx,y-hy)/30;
  const r=Math.max(.18,(1.1-dist)*.9*R()+.15);c.beginPath();c.ellipse(x,y,r,r*(.6+R()*.6),R()*3,0,7);c.fill();}
 c.restore();}
/* surcos corticales: hendiduras de LCR desde la superficie hacia el interior */
function surcos(c,g,seq,us,n,id){const R=rng(hash(id));c.save();c.clip(g.path);c.strokeStyle=colorDe('liquido',seq,us);c.lineCap='round';
 const [cx,cy]=g.c,rx=g.r;const t0=GEO.__tmp;
 const m=g.k=='e'?g:null;const ry=m?parseFloat(arguments[1]?0:0):0;
 const sp=g.sp||[cx,cy,rx,rx];
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2+R()*.12;const ex=cx+Math.cos(a)*sp[2],ey=cy+Math.sin(a)*sp[3];
  const L=(3+R()*4.5)*Math.min(1,Math.max(.35,Math.min(sp[2],sp[3])/30)),ix=cx+Math.cos(a)*(sp[2]-L),iy=cy+Math.sin(a)*(sp[3]-L);
  c.lineWidth=.45+R()*.35;c.beginPath();c.moveTo(ex,ey);
  c.quadraticCurveTo((ex+ix)/2+(R()-.5)*2,(ey+iy)/2+(R()-.5)*2,ix,iy);c.stroke();
  if(R()<.5){c.lineWidth=.35;c.beginPath();const bx=(ex+ix)/2,by=(ey+iy)/2;c.moveTo(bx,by);c.lineTo(bx+Math.cos(a+1.2)*-1.8,by+Math.sin(a+1.2)*-1.8);c.stroke();}}
 c.restore();}
/* textura fibroglandular / trabecular en proyección */
function textura(c,g,tipo,id){const R=rng(id.length*131+g.pts?.length||7);c.save();c.clip(g.path);
 c.globalCompositeOperation='lighter';
 const bb=g.pts?g.pts.reduce((b,p)=>[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[999,999,-999,-999]):[g.c[0]-g.r,g.c[1]-g.r,g.c[0]+g.r,g.c[1]+g.r];
 const n=tipo=='glan'?260:140;
 for(let i=0;i<n;i++){const x=bb[0]+R()*(bb[2]-bb[0]),y=bb[1]+R()*(bb[3]-bb[1]);const a=(tipo=='glan'?.05:.035)*R();
  c.fillStyle=`rgba(255,255,255,${a})`;c.beginPath();c.ellipse(x,y,.6+R()*2.2,.4+R()*1.2,R()*3,0,7);c.fill();}
 c.restore();}

/* Simulación ecográfica: barrido en abanico o lineal, atenuación, sombra/refuerzo y speckle */
function ultrasonido(pl,d,N,R){
 const sonda=pl.sonda||'cx';
 const geom=sonda=='li'?{lin:1}:sonda=='tv'?{ax:50,ay:-3,ang:58,r0:4,r1:103}:sonda=='ph'?{ax:50,ay:-2,ang:40,r0:2,r1:102}:{ax:50,ay:-14,ang:33,r0:14,r1:116};
 const G=24,lf=new Float32Array((G+1)*(G+1));for(let i=0;i<lf.length;i++)lf[i]=.78+.44*R();
 const LF=(x,y)=>{const gx=Math.max(0,Math.min(G-.001,x/100*G)),gy=Math.max(0,Math.min(G-.001,y/100*G)),ix=gx|0,iy=gy|0,fx=gx-ix,fy=gy-iy,a=lf[iy*(G+1)+ix],b=lf[iy*(G+1)+ix+1],c2=lf[(iy+1)*(G+1)+ix],d2=lf[(iy+1)*(G+1)+ix+1];return a*(1-fx)*(1-fy)+b*fx*(1-fy)+c2*(1-fx)*fy+d2*fx*fy;};
 const A=420,J=520,pol=new Float32Array(A*J),nz=new Float32Array(A*J);
 const src=(x,y)=>{const px=Math.round(x*N/100),py=Math.round(y*N/100);if(px<0||py<0||px>=N||py>=N)return null;return(py*N+px)*4;};
 for(let a=0;a<A;a++){let m=1;
  for(let j=0;j<J;j++){let x,y;
   if(geom.lin){x=a/(A-1)*100;y=j/(J-1)*100;}
   else{const th=(a/(A-1)*2-1)*geom.ang*Math.PI/180,r=geom.r0+j/(J-1)*(geom.r1-geom.r0);x=geom.ax+r*Math.sin(th);y=geom.ay+r*Math.cos(th);}
   const k=src(x,y);let e=0,at=0,fl=0;if(k!=null){e=d[k]/255;at=d[k+1]/255;fl=d[k+2]/255;if(e>.05&&e<.9)e*=LF(x,y);}
   const depth=j/J;
   pol[a*J+j]=e*m*(1-.3*depth)*(depth<.06?.8+depth*3:1);
   if(at>.3)m*=1-at*.11;else if(fl>.5)m=Math.min(1.7,m*1.0035);else m=m+(1-m)*.004;
   nz[a*J+j]=-Math.log(R()+1e-4);}}
 // speckle correlacionado (lateral > axial)
 const sp=new Float32Array(A*J);
 for(let a=0;a<A;a++)for(let j=0;j<J;j++){let s=0,c=0;for(let da=-3;da<=3;da++){const aa=a+da;if(aa<0||aa>=A)continue;for(let dj=-2;dj<=2;dj++){const jj=j+dj;if(jj<0||jj>=J)continue;s+=nz[aa*J+jj];c++;}}sp[a*J+j]=s/c;}
 for(let i=0;i<N*N;i++){const px=i%N,py=(i/N)|0;const x=px*100/N,y=py*100/N;let a,j;
  if(geom.lin){a=x/100*(A-1);j=y/100*(J-1);}
  else{const dx=x-geom.ax,dy=y-geom.ay,r=Math.hypot(dx,dy),th=Math.atan2(dx,dy)*180/Math.PI;
   a=(th/geom.ang+1)/2*(A-1);j=(r-geom.r0)/(geom.r1-geom.r0)*(J-1);}
  let v=0;
  if(a>=0&&a<=A-1&&j>=0&&j<=J-1){const ai=Math.round(a),ji=Math.round(j),p=ai*J+ji;
   v=pol[p]*(.3+.7*sp[p])+.012*nz[p];v=Math.pow(Math.max(0,v),.9);}
  else v=-1;
  const q=v<0?0:Math.max(0,Math.min(255,v*215));
  d[i*4]=q;d[i*4+1]=q;d[i*4+2]=Math.min(255,q*1.02);d[i*4+3]=255;}
 pl._geom=geom;}

/* ===== Lienzo con rótulos ===== */
function dibujarCorte(cv,pl,seq,modo,sel,opts={}){
 const N=640,M=modo=='nombres'?300:0,W=N+2*M,H=N;
 cv.width=W;cv.height=H;const c=cv.getContext('2d');
 c.fillStyle=getComputedStyle(document.body).getPropertyValue('--lienzo')||'#05070a';c.fillRect(0,0,W,H);
 const key=pl.id+'|'+seq;if(!dibujarCorte.cache[key])dibujarCorte.cache[key]=renderImagen(pl,seq,N);
 c.drawImage(dibujarCorte.cache[key],M,0);
 // rótulos de la modalidad en la imagen
 c.save();c.shadowColor='#000';c.shadowBlur=4;c.font='bold 13px Arial';c.fillStyle='#e9eef5';c.textAlign='left';
 c.fillText(SEQ[seq].n,M+10,20);c.font='12px Arial';c.fillStyle='#b8c4d6';
 if(pl.cab)c.fillText(pl.cab,M+10,37);
 if(pl.ori){c.textAlign='right';c.fillText(pl.ori[0],M+N-10,20);if(pl.ori[1])c.fillText(pl.ori[1],M+N-10,37);c.textAlign='left';}
 if(pl.prof&&seq=='US'){c.textAlign='right';c.fillText('Prof. '+pl.prof,M+N-10,N-10);c.textAlign='left';
  c.strokeStyle='#b8c4d6';c.lineWidth=1;for(let i=0;i<=10;i++){const y=N*(i/10)*.97+4;c.beginPath();c.moveTo(M+N-6,y);c.lineTo(M+N-(i%5?10:16),y);c.stroke();}}
 c.restore();
 const S=N/100,X=u=>M+u[0]*S,Y=u=>u[1]*S;
 // líneas de límites (segmentos, planos)
 if(modo!='ocultos'||opts.dash)for(const s of pl.s){if(s[1]!='dash')continue;const g=geo(s[2]);
  c.save();c.setTransform(S,0,0,S,M,0);c.setLineDash([1.6,1.2]);c.strokeStyle='rgba(255,214,90,.9)';c.lineWidth=.45;c.stroke(g.path);c.restore();}
 // resaltado
 if(sel!=null){const s=pl.s[sel],g=geo(s[2]);c.save();c.setTransform(S,0,0,S,M,0);
  c.strokeStyle='#ffd65a';c.shadowColor='#ffd65a';c.shadowBlur=8;
  if(g.pt){c.lineWidth=.7;c.beginPath();c.arc(g.a[0],g.a[1],3,0,7);c.stroke();}
  else if(g.w&&g.k!='r'){c.globalAlpha=.55;c.lineWidth=g.w+1.2;c.lineCap='round';c.stroke(g.path);}
  else{c.lineWidth=.8;c.stroke(g.path);if(!g.w){c.globalAlpha=.18;c.fillStyle='#ffd65a';c.fill(g.path);}}
  c.restore();}
 const L=rotulables(pl);
 if(modo=='ocultos')return {M,N,S};
 if(modo=='numeros'){c.font='bold 17px Arial';c.textAlign='center';c.textBaseline='middle';
  L.forEach((i,k)=>{const g=geo(pl.s[i][2]),a=anc(pl.s[i],g);const x=X(a),y=Y(a);
   c.fillStyle=i==sel?'#ffd65a':'rgba(201,162,39,.95)';c.beginPath();c.arc(x,y,13,0,7);c.fill();c.strokeStyle='#000';c.lineWidth=1;c.stroke();
   c.fillStyle='#000';c.fillText(k+1,x,y+.5);});c.textBaseline='alphabetic';return {M,N,S};}
 // nombres a los lados con líneas guía
 const lados=[[],[]];L.forEach((i,k)=>{const g=geo(pl.s[i][2]),a=anc(pl.s[i],g);lados[a[0]<50?0:1].push({i,k,a});});
 c.font='15px Arial';
 lados.forEach((arr,ld)=>{arr.sort((p,q)=>p.a[1]-q.a[1]);const gap=Math.min(21,(H-20)/Math.max(1,arr.length));
  arr.forEach(o=>o.y=Math.max(12,Math.min(H-8,Y(o.a))));
  for(let j=1;j<arr.length;j++)if(arr[j].y<arr[j-1].y+gap)arr[j].y=arr[j-1].y+gap;
  for(let j=arr.length-1;j>=0;j--){const lim=j==arr.length-1?H-8:arr[j+1].y-gap;if(arr[j].y>lim)arr[j].y=lim;}
  arr.forEach(o=>{const s=pl.s[o.i],on=o.i==sel,txt=(o.k+1)+'. '+s[0];
   const lx=ld?M+N+8:M-8,ax=X(o.a),ay=Y(o.a);
   c.strokeStyle=on?'#ffd65a':'rgba(201,162,39,.85)';c.lineWidth=on?1.6:1;
   c.beginPath();c.moveTo(lx,o.y);c.lineTo(ld?M+N:M,o.y);c.lineTo(ax,ay);c.stroke();
   c.fillStyle=on?'#ffd65a':'#C9A227';c.beginPath();c.arc(ax,ay,2.6,0,7);c.fill();
   c.fillStyle=on?'#ffd65a':getComputedStyle(document.body).getPropertyValue('--rotulo')||'#e6ebf2';
   c.font=(on?'bold ':'')+'15px Arial';c.textAlign=ld?'left':'right';
   let t=txt;while(c.measureText(t).width>M-14&&t.length>8)t=t.slice(0,-2);if(t!=txt)t=t.slice(0,-1)+'…';
   c.fillText(t,lx,o.y+5);o.box=[ld?lx:lx-c.measureText(t).width,o.y-11,c.measureText(t).width,18];});});
 dibujarCorte.boxes=lados.flat();
 return {M,N,S};}
dibujarCorte.cache={};
function rotulables(pl){return pl.s.map((s,i)=>i).filter(i=>pl.s[i][1]!='dash'&&!(pl.s[i][4]||{}).nl);}
function anc(s,g){return (s[4]||{}).a||g.a;}
function hit(pl,u){ // u en unidades 0–100
 const c=hit.c||(hit.c=document.createElement('canvas').getContext('2d'));
 const L=rotulables(pl);
 for(const i of L){const g=geo(pl.s[i][2]);if(g.pt&&Math.hypot(u[0]-g.a[0],u[1]-g.a[1])<4)return i;}
 for(let j=L.length-1;j>=0;j--){const i=L[j],g=geo(pl.s[i][2]);if(g.pt)continue;
  if(g.w){c.lineWidth=Math.max(g.w,1.5);if(c.isPointInStroke(g.path,u[0],u[1]))return i;if(g.k!='r')continue;}
  else if(c.isPointInPath(g.path,u[0],u[1]))return i;}
 return null;}
