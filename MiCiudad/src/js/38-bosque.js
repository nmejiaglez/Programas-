/* ================= BOSQUE DE RETOS: niveles con animales, escaleras, corazones y estrellas ================= */
const BQ={cx:330,cz:-330};
const bq={g:null,lv:null,cols:[],level:1,hearts:3,stars:0,starObjs:[],enemies:[],movers:[],ladders:[],cp:null,t0:0,run:false,inv:0,climb:null,finishZ:0};
const BQ_LEVELS=10;
function bqData(){if(!S.bosque)S.bosque={lv:{}};return S.bosque;}
function bqDiff(l){return l<=3?{n:"Fácil",c:"#19A858"}:l<=7?{n:"Medio",c:"#F28C28"}:{n:"Difícil",c:"#E2465C"};}
function buildBosque(){
 const Z=zone({id:"bosque",name:"Bosque de Retos",icon:"🌳",desc:"Niveles con animalitos, escaleras y estrellas",cx:BQ.cx,cz:BQ.cz,hw:30,hd:118,floor:false,killY:-4,sky:0xA8E6C1,noVehicle:true,
  spawn:{x:BQ.cx,z:BQ.cz+104,y:0.6,face:Math.PI},onEnter(){S.riding=false;buildPlayer();bq.run=false;bqHud();},onLeave(){zoneButton(null);$("banner").hidden=true;bq.run=false;},onFall(){bqHurt(true);}});
 bq.g=Z.g;ROOT=Z.g;
 const w=new T.Mesh(new T.PlaneGeometry(64,300),new T.MeshToonMaterial({color:0x4FC3E8,gradientMap:TOON}));w.rotation.x=-Math.PI/2;w.position.set(BQ.cx,-0.9,BQ.cz);w.receiveShadow=true;Z.g.add(w);
 for(const s of [-1,1]){const gr=new T.Mesh(new T.PlaneGeometry(170,300),texMat(GRASS_TEX,26,46));gr.rotation.x=-Math.PI/2;gr.position.set(BQ.cx+s*(32+85),-0.5,BQ.cz);gr.receiveShadow=true;Z.g.add(gr);}
 const tg=grp(0,-0.5,0,Z.g);for(let i=0;i<46;i++){const s=i%2?1:-1;tree(BQ.cx+s*(35+Math.random()*12),BQ.cz-115+i*5+Math.random()*3,1.3+Math.random()*0.5,false,tg);}
 for(let i=0;i<30;i++){const s=i%2?1:-1;sph(0.35,["#FF4FA3","#F5C518","#FFFFFF","#7B4BD1"][i%4],BQ.cx+s*(33+Math.random()*4),-0.3,BQ.cz-110+i*7.5,Z.g,8,6);}
 addPlat(BQ.cx,0.3,BQ.cz+104,16,1.5,14,"#7FCB60");
 signMesh("🌳 Bosque de Retos","#19A858",9,BQ.cx-8.4,4.5,BQ.cz+104,Math.PI/2);
 const bs=grp(BQ.cx+6,0.3,BQ.cz+108);box(3.4,0.2,1.4,"#2E7BEF",0,2.6,0,bs);box(0.15,2.6,0.15,"#3E4B59",-1.5,1.3,0,bs);box(0.15,2.6,0.15,"#3E4B59",1.5,1.3,0,bs);
 spot({zone:"bosque",x:BQ.cx+6,z:BQ.cz+106.5,r:2.6,label:"🚌 Viajar en bus",fn:openPlaces});
 spot({zone:"bosque",x:BQ.cx,z:BQ.cz+99,r:3,label:"🌳 Elegir nivel",when:()=>!bq.run,fn:openBosque});
 bq.lv=new T.Group();Z.g.add(bq.lv);ROOT=scene;}
/* ---------- animalitos ---------- */
function eyes2(g,y,z,s){for(const k of [-1,1]){sph(0.09*s,"#FFFFFF",k*0.12*s,y,z,g,8,6);sph(0.05*s,"#14212E",k*0.12*s,y,z+0.06*s,g,6,4);}}
function makeBee(){const g=new T.Group();const b=sph(0.42,"#F5C518",0,0,0,g,14,10);b.scale.z=1.25;for(const z of [-0.18,0.12]){const r=mesh(new T.TorusGeometry(0.4,0.07,6,18),"#1E2329",0,0,z,g);r.scale.set(1,1,1);}
 eyes2(g,0.1,0.45,1.2);const st=cone(0.08,0.25,"#1E2329",0,0,-0.6,g,6);st.rotation.x=-Math.PI/2;
 const wg=[];for(const k of [-1,1]){const w=new T.Mesh(new T.SphereGeometry(0.3,10,6),new T.MeshBasicMaterial({color:0xE9F7FF,transparent:true,opacity:0.7}));w.scale.set(1,0.15,0.6);w.position.set(k*0.3,0.45,0);g.add(w);wg.push(w);}g.userData.wings=wg;return g;}
function makeCrab(){const g=new T.Group();const b=sph(0.55,"#E2465C",0,0.45,0,g,14,10);b.scale.set(1.3,0.6,1);for(const k of [-1,1]){const c=sph(0.22,"#E2465C",k*0.85,0.55,0.35,g,10,8);c.scale.set(1,0.8,1.2);box(0.06,0.35,0.06,"#C23B4E",k*0.18,0.85,0.25,g);sph(0.1,"#FFFFFF",k*0.18,1.05,0.25,g,8,6);sph(0.05,"#14212E",k*0.18,1.07,0.33,g,6,4);
  for(let j=0;j<3;j++){const l=box(0.06,0.06,0.45,"#C23B4E",k*(0.5+j*0.12),0.2,-0.2+j*0.2,g);l.rotation.y=k*1.1;}}return g;}
function makeHedge(){const g=new T.Group();const b=new T.Mesh(new T.SphereGeometry(0.6,14,10,0,Math.PI*2,0,Math.PI/2),M("#8A5A2B"));g.add(b);shadowize(b);
 for(let i=0;i<22;i++){const a=i/22*Math.PI*2,t=0.25+(i%3)*0.35;const c=cone(0.08,0.35,"#5A3A1F",Math.cos(a)*0.55*Math.cos(t),0.15+Math.sin(t)*0.5,Math.sin(a)*0.55*Math.cos(t),g,5);c.lookAt(new T.Vector3(Math.cos(a)*3,2,Math.sin(a)*3).add(c.position));c.rotateX(Math.PI/2);}
 const f=sph(0.28,"#E8C9A0",0,0.22,0.5,g,10,8);sph(0.07,"#14212E",0,0.25,0.78,g,6,4);eyes2(g,0.36,0.6,0.9);return g;}
function makeFrog(){const g=new T.Group();const b=sph(0.5,"#3FBF5F",0,0.45,0,g,14,10);b.scale.set(1.1,0.8,1);for(const k of [-1,1]){sph(0.17,"#3FBF5F",k*0.25,0.85,0.2,g,10,8);sph(0.12,"#FFFFFF",k*0.25,0.92,0.3,g,8,6);sph(0.06,"#14212E",k*0.25,0.93,0.4,g,6,4);const l=sph(0.2,"#2FA34D",k*0.42,0.18,-0.1,g,8,6);l.scale.set(1,0.5,1.5);}
 const m=mesh(new T.TorusGeometry(0.18,0.03,6,12,Math.PI),"#1E6B33",0,0.45,0.48,g);m.rotation.z=Math.PI;return g;}
/* ---------- piezas del nivel ---------- */
function bqPlat(x,top,z,w,d,c,o){const p=addPlat(x,top,z,w,0.6,d,c||"#8A5A2B",o||{});bq.cols.push(p);return p;}
function bqStar(x,y,z){const s=emojiSprite("⭐",1.1);s.position.set(x,y+1.1,z);bq.lv.add(s);bq.starObjs.push({s,x,y:y+1.1,z,got:false});}
function bqEnemy(kind,x,y,z,o){const m=kind==="abeja"?makeBee():kind==="cangrejo"?makeCrab():kind==="erizo"?makeHedge():makeFrog();m.position.set(x,y,z);bq.lv.add(m);shadowAll(m);bq.enemies.push(Object.assign({kind,m,x,y,z,bx:x,by:y,bz:z,t:Math.random()*6,r:kind==="abeja"?0.8:0.9},o||{}));}
function bqLadder(x,z,y0,y1){const g=grp(x,y0,z+0.36,bq.lv);for(const k of [-0.45,0.45])box(0.12,y1-y0+0.6,0.12,"#C68A4A",k,(y1-y0)/2+0.1,0,g);for(let y=0.4;y<y1-y0+0.4;y+=0.45)box(0.9,0.08,0.1,"#E8C38E",0,y,0,g);bq.ladders.push({x,z:z+0.6,y0,y1});}
function buildLevel(L){
 // limpiar
 bq.cols.forEach(removeCol);bq.cols=[];bq.lv.clear();bq.starObjs=[];bq.enemies=[];bq.movers=[];bq.ladders=[];
 ROOT=bq.lv;const x0=BQ.cx;let z=BQ.cz+90,y=0.3;const gap=1.6+L*0.16,sp=1+L*0.11;
 bqPlat(x0,y,z,8,6,"#7FCB60");const startZ=z;z-=3;
 const types=["piedras","abejas","escalera","cangrejos","moviles","erizos","trampolin","ranas","puente"];
 const n=4+Math.min(5,Math.floor(L/2));let h=(L*7919)%types.length;const segs=["piedras"];
 while(segs.length<n){const t=types[h%types.length];h=(h*31+7)%997;if(L<3&&(t==="moviles"||t==="puente"))continue;if(segs[segs.length-1]!==t)segs.push(t);}
 if(L>=2&&!segs.includes("escalera"))segs.splice(2,0,"escalera");
 const ET=["abejas","cangrejos","erizos","ranas"];if(!segs.some(t=>ET.includes(t)))segs.splice(1,0,ET[L%4]);if(L>=5&&segs.filter(t=>ET.includes(t)).length<2)segs.splice(3,0,ET[(L+1)%4]);
 let starsLeft=3;const starEvery=Math.max(1,Math.floor(segs.length/3));
 segs.forEach((t,i)=>{const col=["#8A5A2B","#B5762E","#6F9E4F","#C68A4A"][i%4];
  if(i===Math.floor(segs.length/2)){bqPlat(x0,y,z-2,6,4,"#3BC46F");const f=emojiSprite("🚩",1.4);f.position.set(x0+2,y+1.5,z-2);bq.lv.add(f);bq.cp_z=z-2;bq.cpY=y;const cpZ=z-2,cpY=y;bq.cols[bq.cols.length-1].onLand=()=>{if(!bq.cp||bq.cp.z!==cpZ){bq.cp={x:x0,z:cpZ,y:cpY+0.4};toast("🚩 ¡Punto de control!");sfx("pop");}};z-=5;}
  if(t==="piedras"){for(let k=0;k<5;k++){const dx=(k%2?1:-1)*(L>4?1.6:0.8);const dy=(k===2&&L>2)?0.9:0;bqPlat(x0+dx,y+dy,z-gap-1,1.9,1.9,col);z-=gap+1.9;}}
  if(t==="abejas"){const len=12+L;bqPlat(x0,y,z-len/2,4.5,len,"#6F9E4F");for(let k=0;k<1+Math.floor(L/3);k++)bqEnemy("abeja",x0,y+1.3,z-3-k*(len-4)/Math.max(1,Math.floor(L/3)),{amp:2.6,sp:1.2*sp,ax:"x"});z-=len;}
  if(t==="escalera"){const hh=3+Math.min(3,L*0.4);bqPlat(x0,y,z-1.5,4,3,col);const wz=z-3.6;const wall=bqPlat(x0,y+hh,wz,4.5,1.2,"#9A7B5B");const wm=box(4.5,hh,1.2,"#9A7B5B",x0,y+hh/2,wz);bqLadder(x0,wz+0.6,y,y+hh);
   const c=addCol(x0,wz,4.5,1.2,hh-0.6,y);bq.cols.push(c);y+=hh;bqPlat(x0,y,wz-2.4,4,3.6,col);z=wz-4.2;}
  if(t==="cangrejos"){const len=11+L;bqPlat(x0,y,z-len/2,7,len,"#E8D3A0");for(let k=0;k<1+Math.floor(L/2.5);k++)bqEnemy("cangrejo",x0,y,z-3-k*3.2,{amp:2.6,sp:0.9*sp,ax:"x",ph:k});z-=len;}
  if(t==="moviles"){for(let k=0;k<3;k++){const p=bqPlat(x0,y,z-2.6-k*3.6,2.6,2.6,"#7B4BD1");bq.movers.push({p,bx:x0,y,z:z-2.6-k*3.6,amp:2.2+L*0.15,sp:0.8*sp,ph:k*2});}z-=2.6+3*3.6;bqPlat(x0,y,z,4,3,col);z-=2;}
  if(t==="erizos"){const len=12+L;bqPlat(x0,y,z-len/2,3.2,len,"#B5762E");for(let k=0;k<1+Math.floor(L/3);k++)bqEnemy("erizo",x0,y,z-2-k*4,{amp:len/2-2,sp:0.7*sp,ax:"z",cz:z-len/2,ph:k*2.5});z-=len;}
  if(t==="trampolin"){bqPlat(x0,y,z-1.5,3,3,col);const tp=bqPlat(x0,y,z-4.5,2.6,2.6,"#FF4FA3",{bounce:13,onLand(){sfx("boing");}});y+=2.2+Math.min(2,L*0.2);bqPlat(x0,y,z-9,4,4,col);z-=11;}
  if(t==="ranas"){const len=12+L;bqPlat(x0,y,z-len/2,5,len,"#6F9E4F");for(let k=0;k<1+Math.floor(L/2.5);k++)bqEnemy("rana",x0+(k%2?1.2:-1.2),y,z-3-k*3.5,{hop:true,sp:1.1*sp,ph:k*1.3});z-=len;}
  if(t==="puente"){const len=10+L;bqPlat(x0,y,z-len/2,L>6?0.9:1.3,len,"#C68A4A");z-=len;bqPlat(x0,y,z-1.5,4,3,col);z-=3;}
  if(starsLeft>0&&(i+1)%starEvery===0){bqStar(x0+(i%2?2.2:-2.2),y+(L>5?1.3:0.4),z+2);starsLeft--;}
  if(y>0.3&&i<segs.length-1&&Math.random()<0.4){}
 });
 while(starsLeft>0){bqStar(x0,y+0.6,z+1+starsLeft*1.2);starsLeft--;}
 const fin=bqPlat(x0,y,z-4,8,7,"#F5C518");fin.mesh.material=M("#F5C518","#5A4000");const tr=emojiSprite("🏆",2.4);tr.position.set(x0,y+2.2,z-4);bq.lv.add(tr);
 const arch=grp(x0,y,z-1.2,bq.lv);for(const k of [-3.5,3.5])cyl(0.2,0.2,4,"#E2465C",k,2,0,arch,10);box(7.4,0.9,0.3,"#E2465C",0,4.2,0,arch);
 fin.onLand=()=>bqFinish();
 bq.finishZ=z-4;ROOT=scene;shadowAll(bq.lv);}
/* ---------- juego ---------- */
function openBosque(){const D=bqData();sheet("🌳 Bosque de Retos",b=>{
 b.appendChild(el("p","muted","Llegue a la 🏆 sin perder los 3 corazones. ¡Cuidado con las abejas, cangrejos, erizos y ranas! Use las escaleras: camine hacia ellas para subir. Junte las 3 ⭐ de cada nivel."));
 const g=el("div","dgrid");for(let l=1;l<=BQ_LEVELS;l++){const d=D.lv[l];const open=l===1||D.lv[l-1];const df=bqDiff(l);
  const c=el("button","dcard"+(open?"":" off"),'<span class="de">'+(open?(d?"⭐".repeat(d.stars||0)+"☆".repeat(3-(d.stars||0)):"🌳"):"🔒")+'</span><b>Nivel '+l+'</b><small style="color:'+df.c+'">'+df.n+'</small>'+(d&&d.best?'<small>⏱ '+d.best.toFixed(1)+' s</small>':''));
  c.style.borderColor=open?df.c:"";c.onclick=()=>{if(!open){toast("🔒 Primero pase el nivel "+(l-1));return;}closeSheet();bqStart(l);};g.appendChild(c);}
 b.appendChild(g);});}
function bqStart(L){bq.level=L;bq.hearts=3;bq.stars=0;bq.cp=null;bq.inv=0;buildLevel(L);bq.run=false;
 const go=()=>{bq.run=true;bq.t0=performance.now();bqHud();toast("🌳 Nivel "+L+" · "+bqDiff(L).n+" · ¡A la 🏆!");};
 if(teleporting){setTimeout(()=>bqStart(L),500);return;}teleport(BQ.cx,BQ.cz+90,0.9,Math.PI,go);}
function bqHud(){const bn=$("banner");if(!bq.run||!curZone||curZone.id!=="bosque"){bn.hidden=true;zoneButton(curZone&&curZone.id==="bosque"?"🌳 Camine al letrero para elegir nivel":null,null);return;}
 zoneButton("🏳️ Salir del nivel",()=>{bq.run=false;bqHud();teleport(BQ.cx,BQ.cz+102,0.9,Math.PI);});
 bn.hidden=false;bn.style.background="#19A858";bn.textContent="❤️".repeat(bq.hearts)+"🤍".repeat(3-bq.hearts)+"  ⭐ "+bq.stars+"/3  ⏱ "+((performance.now()-bq.t0)/1000).toFixed(0)+" s";}
function bqRespawn(){const c=bq.cp||{x:BQ.cx,z:BQ.cz+90,y:0.9};P.x=c.x;P.z=c.z;P.y=c.y;P.vy=0;P.push=null;bq.climb=null;}
function bqHurt(fell){if(!bq.run){if(fell){P.x=BQ.cx;P.z=BQ.cz+102;P.y=1;P.vy=0;}return;}
 if(!fell&&bq.inv>0)return;bq.hearts--;bq.inv=1.6;sfx("caida");
 const fl=$("hurt");fl.hidden=false;fl.style.opacity=0.5;setTimeout(()=>{fl.style.opacity=0;setTimeout(()=>fl.hidden=true,250);},150);
 if(bq.hearts<=0){bq.run=false;bqHud();sheet("💔 ¡Ups! Se acabaron los corazones",b=>{b.appendChild(el("div","res","🐝🦀🦔🐸"));b.appendChild(el("p","","No pasa nada, ¡inténtelo otra vez! Cada vez lo hará mejor."));
   const r=el("div","row");const o=el("button","btn ghost","Elegir nivel");o.onclick=openBosque;const a=el("button","btn go","🔁 Intentar otra vez");a.onclick=()=>{closeSheet();bqStart(bq.level);};r.append(o,a);b.appendChild(r);},{half:true});
  P.x=BQ.cx;P.z=BQ.cz+102;P.y=1;P.vy=0;return;}
 if(fell){bqRespawn();toast("💦 ¡Al agua! Pierde un corazón");}
 else{toast("💥 ¡Auch! Pierde un corazón");P.push={x:Math.sin(P.face)*-7,z:Math.cos(P.face)*-7};P.vy=6;setTimeout(()=>P.push=null,300);if(player)player.fall=0.9;}
 bqHud();}
function bqFinish(){if(!bq.run)return;bq.run=false;const t=(performance.now()-bq.t0)/1000;const D=bqData();const L=bq.level;const prev=D.lv[L];
 const first=!prev;const st=Math.max(bq.stars,prev?prev.stars:0);const best=prev&&prev.best?Math.min(prev.best,t):t;D.lv[L]={stars:st,best};
 let money=Math.round((first?250:80)*L*0.8+100);let mc=first?Math.max(1,bq.stars)+Math.floor(L/2):(bq.stars===3&&(!prev||prev.stars<3)?5:0);
 const v=earn(money,"aventura");S.mc+=mc;hud();save();sfx("reto");retoAdd("bosque",1);if(typeof objCheck==="function")objCheck();
 confetti();
 sheet("🏆 ¡Nivel "+L+" superado!",b=>{b.appendChild(el("div","res",'<div style="font-size:46px">'+"⭐".repeat(bq.stars)+"☆".repeat(3-bq.stars)+'</div>⏱ '+t.toFixed(1)+' segundos'+(best===t&&!first?"<br>🎉 ¡Nuevo récord!":"")));
  b.appendChild(el("p","","Ganó $ "+v+(mc?" y "+mc+" MediCoins":"")+". "+(bq.stars<3?"Busque las ⭐ que faltan para ganar más.":"¡Juntó todas las estrellas!")));
  const r=el("div","row");const a=el("button","btn ghost","🔁 Repetir");a.onclick=()=>{closeSheet();bqStart(L);};r.appendChild(a);
  if(L<BQ_LEVELS){const n=el("button","btn go","➡️ Nivel "+(L+1));n.onclick=()=>{closeSheet();bqStart(L+1);};r.appendChild(n);}b.appendChild(r);},{half:true});
 bqHud();}
function bqUpdate(dt){
 if(!curZone||curZone.id!=="bosque")return;
 const t=performance.now()/1000;
 for(const m of bq.movers){const x=m.bx+Math.sin(t*m.sp+m.ph)*m.amp;movePlat(m.p,x,m.y,m.z);}
 for(const e of bq.enemies){e.t+=dt;
  if(e.ax==="x"){const x=e.bx+Math.sin(e.t*e.sp+(e.ph||0))*e.amp;e.m.rotation.y=Math.cos(e.t*e.sp+(e.ph||0))>0?Math.PI/2:-Math.PI/2;e.x=x;}
  if(e.ax==="z"){e.z=e.cz+Math.sin(e.t*e.sp+(e.ph||0))*e.amp;e.m.rotation.y=Math.cos(e.t*e.sp+(e.ph||0))>0?Math.PI:0;}
  let y=e.by;if(e.kind==="abeja"){y=e.by+Math.sin(e.t*4)*0.25;if(e.m.userData.wings)e.m.userData.wings.forEach((w,i)=>w.rotation.z=(i?-1:1)*Math.sin(e.t*40)*0.6);}
  if(e.hop){const h=Math.max(0,Math.sin(e.t*e.sp*2+(e.ph||0)));y=e.by+h*2.2;e.m.scale.y=1-h*0.1;}
  if(e.kind==="cangrejo")e.m.rotation.z=Math.sin(e.t*10)*0.08;
  e.m.position.set(e.x,y,e.z);
  if(bq.run&&Math.hypot(e.x-P.x,e.z-P.z)<e.r+0.35&&Math.abs((y+0.4)-(P.y+0.8))<1.2)bqHurt(false);}
 for(const s of bq.starObjs){if(s.got)continue;s.s.position.y=s.y+Math.sin(t*3)*0.2;if(Math.hypot(s.x-P.x,s.z-P.z)<1.1&&Math.abs(s.y-(P.y+1))<1.4){s.got=true;s.s.visible=false;bq.stars++;sfx("moneda");toast("⭐ ¡Estrella "+bq.stars+" de 3!");bqHud();}}
 if(bq.inv>0)bq.inv-=dt;
 // escaleras
 let lad=null;for(const l of bq.ladders){if(Math.abs(P.x-l.x)<0.9&&Math.abs(P.z-l.z)<0.75&&P.y>=l.y0-0.2&&P.y<l.y1+0.2)lad=l;}
 if(lad&&P.speed>0.3&&P.y<lad.y1){if(!bq.climb){bq.climb=lad;P.climbY=P.y;}P.climbY=Math.min(lad.y1+0.05,P.climbY+3*dt);P.y=P.climbY;P.vy=0;P.x=lad.x;
  if(player){const a=Math.sin(t*10);player.arms[0].rotation.x=-2.6+a*0.4;player.arms[1].rotation.x=-2.6-a*0.4;player.legs[0].rotation.x=-0.5+a*0.4;player.legs[1].rotation.x=-0.5-a*0.4;player.g.position.y=P.y;player.g.rotation.y=Math.PI;}
  if(P.climbY>=lad.y1){P.z-=1.2;P.y=lad.y1+0.05;bq.climb=null;}}
 else if(bq.climb&&lad&&P.y<lad.y1){P.y=P.climbY;P.vy=0;}else bq.climb=null;
 if(bq.run){bq.hudT=(bq.hudT||0)+dt;if(bq.hudT>0.5){bq.hudT=0;bqHud();}}
}
/* ---------- confeti ---------- */
function confetti(){const box=document.createElement("div");box.className="confetti";const cols=["#FF4FA3","#F5C518","#2E7BEF","#19A858","#7B4BD1","#F28C28"];
 for(let i=0;i<60;i++){const c=document.createElement("i");c.style.left=Math.random()*100+"%";c.style.background=cols[i%cols.length];c.style.animationDelay=(Math.random()*0.5)+"s";c.style.animationDuration=(1.6+Math.random())+"s";c.style.transform="rotate("+Math.random()*360+"deg)";box.appendChild(c);}
 document.body.appendChild(box);setTimeout(()=>box.remove(),3200);}
mode({id:"bosque",init(){buildBosque();},update(dt){bqUpdate(dt);}});
