/* ================= PARQUE DE DIVERSIONES (TYCOON) ================= */
const PK={cx:330,cz:330};
const RIDES=[
 {id:"carrusel",name:"Carrusel",icon:"🎠",cost:500,inc:0.5},
 {id:"tazas",name:"Tazas locas",icon:"☕",cost:2000,inc:1.5},
 {id:"rueda",name:"Rueda de Chicago",icon:"🎡",cost:6000,inc:4},
 {id:"barco",name:"Barco pirata",icon:"🏴‍☠️",cost:15000,inc:9},
 {id:"chocones",name:"Carros chocones",icon:"🚗",cost:40000,inc:20},
 {id:"montana",name:"Montaña rusa",icon:"🎢",cost:100000,inc:45},
 {id:"terror",name:"Casa del terror",icon:"👻",cost:250000,inc:100},
 {id:"caida",name:"Torre de caída",icon:"🗼",cost:600000,inc:220}
];
const RIDE_POS=[[-22,18],[22,18],[-22,0],[22,0],[-22,-18],[22,-18],[-8,-30],[10,-30]];
const pk={vis:{},anim:{},visitors:[]};
function rideLvl(id){return S.park.rides[id]||0;}
function rideInc(r){const l=rideLvl(r.id);return l?r.inc*l*Math.pow(1.15,l-1):0;}
function parkIncome(){let t=0;RIDES.forEach(r=>t+=rideInc(r));return t*(S.park.boostUntil>Date.now()?2:1);}
function upCost(r){return Math.round(r.cost*0.6*Math.pow(1.6,rideLvl(r.id)-1));}
function bankCap(){return parkIncome()*3600*(S.park.manager?24:8);}
function buildPark(){
 const Z=zone({id:"parque",name:"Mi Parque de Diversiones",icon:"🎡",desc:"Construya atracciones que ganan dinero solas",cx:PK.cx,cz:PK.cz,hw:46,hd:48,spawn:{x:PK.cx,z:PK.cz+42,face:Math.PI},sky:0xFFD9EC,noVehicle:false,onLeave(){zoneButton(null);}});
 ROOT=Z.g;
 plane(110,110,"#8FD36C",PK.cx,0.01,PK.cz);plane(8,90,"#F2D79B",PK.cx,0.03,PK.cz);plane(56,6,"#F2D79B",PK.cx,0.035,PK.cz+18);plane(56,6,"#F2D79B",PK.cx,0.035,PK.cz);plane(56,6,"#F2D79B",PK.cx,0.035,PK.cz-18);
 // entrada y taquilla
 for(const s of [-1,1]){cyl(0.5,0.5,8,"#E2465C",PK.cx+s*6,4,PK.cz+38,null,10);sph(0.9,"#F5C518",PK.cx+s*6,8.4,PK.cz+38,null);}
 box(13,1.6,0.4,"#E2465C",PK.cx,7.3,PK.cz+38,null);signMesh("🎡 Mi Parque","#E2465C",9,PK.cx,7.3,PK.cz+38.3,0);
 const tb=grp(PK.cx+9,0.3,PK.cz+34);box(4,3.2,3,"#FFF4C2",0,1.6,0,tb);box(4.4,0.4,3.4,"#E2465C",0,3.4,0,tb);box(2,1,0.1,"#BFE6FF",0,2,1.55,tb);addCol(PK.cx+9,PK.cz+34,4,3,3);
 spot({zone:"parque",x:PK.cx+9,z:PK.cz+36.6,r:2.6,label:()=>"🎟️ Taquilla · $ "+fmt(S.park.bank),fn:openTicket});
 spot({zone:"parque",x:PK.cx-8,z:PK.cz+42,r:2.2,label:"🚌 Viajar en bus",fn:openPlaces});
 // lotes
 RIDES.forEach((r,i)=>{const [dx,dz]=RIDE_POS[i];const x=PK.cx+dx,z=PK.cz+dz;const g=grp(x,0.3,z);pk.vis[r.id]={g,x,z,built:-1};
  const sx=dx<0?x+7.5:x-7.5;spot({zone:"parque",x:dz<=-30?x:sx,z:dz<=-30?z+7:z,r:3,label:()=>rideLbl(r,i),fn:()=>rideAction(r,i)});});
 // visitantes
 for(let i=0;i<10;i++){const look={skin:i%4,hair:(i*2)%HAIRS.length,hstyle:STYLES_H[i%3].id,shirt:SHIRTS[(i*5)%SHIRTS.length].id,pants:PANTS[(i*3)%PANTS.length].id,hat:i%3?"none":"gorra"};
  const ch=makeChar(look);Z.g.add(ch.g);pk.visitors.push({ch,x:PK.cx+rnd(-3,3),z:PK.cz+rnd(-20,30),tx:PK.cx,tz:PK.cz,wait:0});}
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;if(Math.sin(a)>0.7)continue;tree(PK.cx+Math.cos(a)*44,PK.cz+Math.sin(a)*44,1.2,false);}
 ROOT=scene;
 refreshRides();
}
function rideLbl(r,i){const l=rideLvl(r.id);if(l)return r.icon+" "+r.name+" · nv "+l+(l<10?" · ⬆️ Mejorar":"");
 const prevOk=i===0||rideLvl(RIDES[i-1].id)>0;return prevOk?"🔨 Construir "+r.name+" · $ "+fmt(r.cost):"🔒 Primero construya "+RIDES[i-1].name;}
function rideAction(r,i){const l=rideLvl(r.id);
 if(!l){if(i>0&&!rideLvl(RIDES[i-1].id)){toast("Primero construya "+RIDES[i-1].name);return;}
  sheet(r.icon+" "+r.name,b=>{b.appendChild(el("p","","Gana $ "+fmt(r.inc*60)+" por minuto, aunque usted no esté jugando."));const k=el("button","btn go big","Construir · $ "+fmt(r.cost));k.onclick=()=>{if(!pay({p:r.cost,cur:"$"}))return;S.park.rides[r.id]=1;save();closeSheet();refreshRides();toast("🎉 ¡"+r.name+" abierta al público!");};b.appendChild(k);},{half:true});return;}
 sheet(r.icon+" "+r.name+" · nivel "+l,b=>{b.appendChild(el("p","","Ahora gana $ "+fmt(rideInc(r)*60)+" por minuto."));
  if(l>=10){b.appendChild(el("p","muted","¡Nivel máximo!"));return;}
  const next=r.inc*(l+1)*Math.pow(1.15,l);b.appendChild(el("p","muted","En nivel "+(l+1)+": $ "+fmt(next*60)+" por minuto."));
  const k=el("button","btn go big","Mejorar · $ "+fmt(upCost(r)));k.onclick=()=>{if(!pay({p:upCost(r),cur:"$"}))return;S.park.rides[r.id]=l+1;save();refreshRides();rideAction(r,i);toast("⬆️ "+r.name+" nivel "+(l+1));};b.appendChild(k);},{half:true});}
function openTicket(){sheet("🎟️ Taquilla",b=>{
 const inc=parkIncome();b.appendChild(el("div","res","$ "+fmt(S.park.bank)));
 b.appendChild(el("p","muted","Su parque gana $ "+fmt(inc*60)+" por minuto. La caja guarda hasta "+(S.park.manager?24:8)+" horas de ganancias, aunque cierre el juego."));
 const k=el("button","btn go big","Cobrar");k.disabled=S.park.bank<1;k.onclick=()=>{const v=earn(S.park.bank,"parque");S.park.bank=0;save();toast("💵 +$"+fmt(v));openTicket();};b.appendChild(k);
 const fiesta=S.park.boostUntil>Date.now();
 const f=el("button","btn coinb",fiesta?"🎉 Día de fiesta activo: "+Math.ceil((S.park.boostUntil-Date.now())/60000)+" min":'🎉 Día de fiesta: ganancias x2 por 30 min · <span class="coin sm"></span> 25');
 f.onclick=()=>{if(!pay({p:25,cur:"mc"}))return;S.park.boostUntil=Math.max(Date.now(),S.park.boostUntil)+30*60000;openTicket();};b.appendChild(f);
 const m=el("button","btn coinb",S.park.manager?"🧑‍💼 Gerente contratado (24 h)":'🧑‍💼 Contratar gerente: la caja guarda 24 h · <span class="coin sm"></span> 150');m.disabled=!!S.park.manager;m.onclick=()=>{if(!pay({p:150,cur:"mc"}))return;S.park.manager=true;openTicket();};b.appendChild(m);
},{half:true});}
function refreshRides(){RIDES.forEach((r,i)=>{const v=pk.vis[r.id];const l=rideLvl(r.id);const built=l>0?1:0;if(v.built===built)return;v.built=built;v.g.clear();ROOT=v.g;
 if(!built){box(10,0.2,10,"#D8C39A",0,0.1,0,v.g);const sp=emojiSprite(i===0||rideLvl(RIDES[i-1].id)?"🔨":"🔒",2);sp.position.y=2;v.g.add(sp);ROOT=scene;return;}
 pk.anim[r.id]=buildRide(r.id,v.g);ROOT=scene;if(!v.col)v.col=addCol(v.x,v.z,r.id==="montana"?10:9,r.id==="montana"?10:9,r.id==="caida"||r.id==="rueda"?14:6);});}
function buildRide(id,g){
 const A={};
 if(id==="carrusel"){cyl(4.5,4.5,0.4,"#F5C518",0,0.2,0,g,20);const top=grp(0,0,0,g);cone(5,2,"#E2465C",0,5.2,0,top,20);cyl(0.4,0.4,5,"#FFFFFF",0,2.5,0,g,10);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;cyl(0.08,0.08,4,"#C9D3DC",Math.cos(a)*3.4,2.4,Math.sin(a)*3.4,top,6);const h=box(0.5,0.8,1.4,["#FFFFFF","#F48FB8","#7FD8F5"][i%3],Math.cos(a)*3.4,1.6,Math.sin(a)*3.4,top);h.rotation.y=-a;}A.spin=top;}
 if(id==="tazas"){const pl=grp(0,0,0,g);cyl(4.8,4.8,0.3,"#7B4BD1",0,0.15,0,pl,20);A.spin=pl;A.cups=[];for(let i=0;i<4;i++){const a=i/4*Math.PI*2;const c=grp(Math.cos(a)*2.8,0.3,Math.sin(a)*2.8,pl);cyl(1.1,0.8,1.1,["#FF4FA3","#14B8A6","#F5C518","#2E7BEF"][i],0,0.55,0,c,14);box(0.3,0.5,0.15,"#FFFFFF",1.1,0.7,0,c);A.cups.push(c);}}
 if(id==="rueda"){for(const s of [-1,1]){const l=box(0.4,9,0.4,"#C9D3DC",s*2,4.5,-1.2,g);l.rotation.z=s*0.25;const l2=box(0.4,9,0.4,"#C9D3DC",s*2,4.5,1.2,g);l2.rotation.z=s*0.25;}
  const w=grp(0,8.5,0,g);const ring=mesh(new T.TorusGeometry(5,0.2,8,32),"#E2465C",0,0,0,w);A.cabins=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const sp=box(0.15,5,0.15,"#C9D3DC",Math.cos(a)*2.5,Math.sin(a)*2.5,0,w);sp.rotation.z=a+Math.PI/2;const c=box(1,1,1,["#F5C518","#2E7BEF","#19A858","#FF4FA3"][i%4],Math.cos(a)*5,Math.sin(a)*5,0,w);A.cabins.push(c);}A.wheel=w;}
 if(id==="barco"){for(const s of [-1,1]){const a=box(0.4,7,0.4,"#6E4A2A",s*2.5,3.5,0,g);a.rotation.x=0.4;const b=box(0.4,7,0.4,"#6E4A2A",s*2.5,3.5,0,g);b.rotation.x=-0.4;}const piv=grp(0,6.8,0,g);const sh=grp(0,-4.8,0,piv);box(2.2,1.2,7,"#9A6B3E",0,0,0,sh);box(2.4,0.3,7.4,"#C2553A",0,0.7,0,sh);box(0.15,3,0.15,"#3E4B59",0,2,0,sh);box(0.1,1.4,1.8,"#FFFFFF",0,2.6,0.2,sh);A.swing=piv;}
 if(id==="chocones"){box(9,0.2,9,"#3E4B59",0,0.1,0,g);for(let x=-4.5;x<=4.5;x+=1.5){box(0.15,0.6,0.15,"#F5C518",x,0.4,-4.5,g);box(0.15,0.6,0.15,"#F5C518",x,0.4,4.5,g);}A.cars=[];for(let i=0;i<5;i++){const c=grp(0,0.2,0,g);box(1.2,0.5,1.6,["#E2465C","#2E7BEF","#F5C518","#19A858","#FF4FA3"][i],0,0.35,0,c);cyl(0.04,0.04,1.6,"#C9D3DC",0,1.2,-0.5,c,4);A.cars.push({c,a:i*1.2,r:rnd(1.5,3.5),s:rnd(0.6,1.2)*(i%2?1:-1)});}}
 if(id==="montana"){const pts=[];for(let i=0;i<40;i++){const t=i/40*Math.PI*2;pts.push([Math.cos(t)*4.5,2+Math.sin(t*2)*1.8+Math.max(0,Math.sin(t))*2,Math.sin(t)*4.5]);}
  pts.forEach(p=>{box(0.7,0.15,0.7,"#E2465C",p[0],p[1],p[2],g);cyl(0.07,0.07,p[1],"#C9D3DC",p[0],p[1]/2,p[2],g,4);});const cart=grp(0,0,0,g);box(0.9,0.6,1.2,"#F5C518",0,0.4,0,cart);A.cart=cart;A.pts=pts;}
 if(id==="terror"){box(8,6,7,"#3B2A5A",0,3,0,g);const r=mesh(new T.ConeGeometry(1,1,4),"#2A1D40",0,7.2,0,g);r.rotation.y=Math.PI/4;r.scale.set(6.5,2.6,5.8);box(2,3,0.3,"#14212E",0,1.5,3.55,g);for(const s of [-1,1])box(1.2,1.2,0.2,"#F5C518",s*2.4,4,3.52,g).material=M("#F5C518","#6A4A00");const gh=emojiSprite("👻",2.4);gh.position.set(0,8.5,0);g.add(gh);A.ghost=gh;}
 if(id==="caida"){cyl(0.8,1,16,"#C9D3DC",0,8,0,g,12);cone(1.2,2,"#E2465C",0,17,0,g,12);const ring=grp(0,2,0,g);cyl(2.2,2.2,0.8,"#2E7BEF",0,0,0,ring,16);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;box(0.5,0.6,0.5,"#F5C518",Math.cos(a)*2.2,-0.6,Math.sin(a)*2.2,ring);}A.ring=ring;}
 return A;
}
let pkT=0;
mode({id:"parque",dbg:pk,init:buildPark,
 afterStart(){const now=Date.now();const secs=Math.max(0,(now-(S.park.last||now))/1000);const inc=parkIncome();if(inc>0&&secs>30){const add=Math.min(bankCap(),S.park.bank+inc*secs*0.5)-S.park.bank;if(add>0){S.park.bank+=add;setTimeout(()=>toast("🎡 Su parque ganó $ "+fmt(add)+" mientras no estaba"),2500);}}S.park.last=now;},
 update(dt){
  const inc=parkIncome();if(inc>0)S.park.bank=Math.min(Math.max(bankCap(),S.park.bank),S.park.bank+inc*dt);S.park.last=Date.now();
  if(curZone.id!=="parque")return;
  pkT+=perf;const t=perf;
  for(const id in pk.anim){const A=pk.anim[id];
   if(A.spin)A.spin.rotation.y+=dt*(id==="tazas"?0.8:0.6);
   if(A.cups)A.cups.forEach((c,i)=>c.rotation.y+=dt*(2+i));
   if(A.wheel){A.wheel.rotation.z+=dt*0.25;A.cabins.forEach(c=>c.rotation.z=-A.wheel.rotation.z);}
   if(A.swing)A.swing.rotation.x=Math.sin(t*1.1)*0.9;
   if(A.cars)A.cars.forEach(o=>{o.a+=dt*o.s;o.c.position.set(Math.cos(o.a)*o.r,0.2,Math.sin(o.a)*o.r);o.c.rotation.y=-o.a+(o.s>0?0:Math.PI);});
   if(A.cart){const n=A.pts.length;const f=(t*6)%n;const i=Math.floor(f),j=(i+1)%n,u=f-i;const p=A.pts[i],q=A.pts[j];A.cart.position.set(p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u+0.3,p[2]+(q[2]-p[2])*u);A.cart.rotation.y=Math.atan2(q[0]-p[0],q[2]-p[2]);}
   if(A.ghost)A.ghost.position.y=8.5+Math.sin(t*2)*0.5;
   if(A.ring)A.ring.position.y=2+((Math.sin(t*0.8)+1)/2)*12;
  }
  const open=RIDES.filter(r=>rideLvl(r.id)).length;
  pk.visitors.forEach((v,i)=>{v.ch.g.visible=i<2+open;if(!v.ch.g.visible)return;const dx=v.tx-v.x,dz=v.tz-v.z,d=Math.hypot(dx,dz);
   if(d<0.5||v.wait>0){v.wait-=dt;if(d<0.5){const k=Math.floor(Math.random()*Math.max(1,open));const rp=RIDE_POS[k];v.tx=PK.cx+(rp[0]<0?-4:4)+rnd(-1,1);v.tz=PK.cz+rp[1]+rnd(-2,2);v.wait=rnd(1,4);}animChar(v.ch,0,dt,false);}
   else{v.x+=dx/d*2.2*dt;v.z+=dz/d*2.2*dt;v.ch.g.rotation.y=Math.atan2(dx,dz);animChar(v.ch,2.2,dt,false);}v.ch.g.position.set(v.x,0.3,v.z);});
  zoneButton("🎡 Gana $ "+fmt(inc*60)+"/min · Caja $ "+fmt(S.park.bank),openTicket);
 }});
