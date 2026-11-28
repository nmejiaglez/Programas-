/* ================= ENTRAR CAMINANDO A LOS EDIFICIOS ================= */
const INT={};let heldTreat=null;
function intZoneDef(id,i,name,icon,sky){const cx=600+i*70,cz=600;return {id:"in_"+id,cx,cz,name,icon,sky};}
function room(Z,w,d,floorCol,floorCol2,wallCol,trim){ROOT=Z.g;const x0=Z.cx,z0=Z.cz;
 const ft=canvasTex(128,128,(x,W,H)=>{x.fillStyle=floorCol;x.fillRect(0,0,W,H);x.fillStyle=floorCol2;x.fillRect(0,0,W/2,H/2);x.fillRect(W/2,H/2,W/2,H/2);});ft.wrapS=ft.wrapT=T.RepeatWrapping;ft.repeat.set(w/3,d/3);
 const fl=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshToonMaterial({map:ft,gradientMap:TOON}));fl.rotation.x=-Math.PI/2;fl.position.set(x0,0.31,z0);fl.receiveShadow=true;Z.g.add(fl);
 box(w,7,0.4,wallCol,x0,3.5,z0-d/2);box(0.4,7,d,wallCol,x0-w/2,3.5,z0);box(0.4,7,d,wallCol,x0+w/2,3.5,z0);
 box((w-4)/2,7,0.4,wallCol,x0-w/4-1,3.5,z0+d/2);box((w-4)/2,7,0.4,wallCol,x0+w/4+1,3.5,z0+d/2);box(4,2.6,0.4,wallCol,x0,5.7,z0+d/2);
 box(3.6,4.4,0.2,"#7A5232",x0,2.5,z0+d/2+0.05);box(w,0.5,0.45,trim,x0,0.55,z0-d/2+0.05);
 for(const s of [-1,1]){box(3,2.2,0.2,"#BFE6FF",x0+s*w/4,3.6,z0-d/2+0.25);box(3.3,0.25,0.3,trim,x0+s*w/4,2.45,z0-d/2+0.3);}
 for(let i=0;i<3;i++){const l=sph(0.35,"#FFF4C2",x0-w/3+i*w/3,6.6,z0,null,10,8);l.material=M("#FFF4C2","#8A7A30");}
 Z.hw=w/2-0.7;Z.hd=d/2-0.4;ROOT=scene;}
function staff(Z,x,z,look,face){const c=makeChar(Object.assign({skin:Math.floor(Math.random()*4),hair:Math.floor(Math.random()*6),hstyle:"coleta",shirt:"s4",pants:"p2",hat:"none"},look||{}));c.g.position.set(x,0.3,z);c.g.rotation.y=face||0;Z.g.add(c.g);Z.staff=(Z.staff||[]);Z.staff.push(c);return c;}
function counter(x,z,w,col,top){box(w,1.3,1.2,col,x,0.95,z);box(w+0.2,0.15,1.4,top||"#FFFFFF",x,1.65,z);addCol(x,z,w,1.2,1.3);}
function makeInterior(b,i){const def=intZoneDef(b.id,i,b.name,b.icon,0xFFF3E6);
 const Z=zone({id:def.id,name:b.name,icon:b.icon,hidden:true,indoor:true,cx:def.cx,cz:def.cz,hw:14,hd:11,sky:0xFFF3E6,noVehicle:true,camMax:10,spawn:{x:def.cx,z:def.cz+5,face:Math.PI}});
 const x0=def.cx,z0=def.cz;let w=28,d=22;
 if(b.id==="helados"){room(Z,w,d,"#F7A8C9","#FFD6E7","#FFC2DA","#E55B9A");ROOT=Z.g;
  counter(x0,z0-6,12,"#E55B9A","#FFFFFF");
  ["#F48FB8","#7A4A2A","#FFF1C2","#9BE07A","#C9A7FF","#FFB347"].forEach((c,k)=>{cyl(0.42,0.42,0.3,c,x0-4.2+k*1.7,1.85,z0-6,null,14);});
  box(12,1.2,0.08,"#BFE6FF",x0,2.4,z0-5.45).material=new T.MeshBasicMaterial({color:0xBFE6FF,transparent:true,opacity:0.35});
  const cn=cone(1.2,3,"#D79A4E",x0+11,1.8,z0-8,null,14);cn.rotation.x=Math.PI;sph(1.3,"#F48FB8",x0+11,3.6,z0-8);sph(1,"#FFF1C2",x0+11,4.8,z0-8);sph(0.3,"#E2465C",x0+11,5.9,z0-8);
  for(const [tx,tz] of [[-8,2],[0,3],[8,2],[-8,7],[8,7]]){cyl(1.1,1.1,0.12,"#FFFFFF",x0+tx,1.35,z0+tz,null,18);cyl(0.1,0.1,1,"#9DB4C8",x0+tx,0.8,z0+tz,null,8);addCol(x0+tx,z0+tz,1.6,1.6,1.2);for(const s of [-1,1])cyl(0.4,0.4,0.12,"#E55B9A",x0+tx+s*1.6,0.85,z0+tz,null,12);}
  signMesh("🍦 ¡Helados riquísimos!","#7A4BD1",6,x0,5.2,z0-10.7,0);
  staff(Z,x0,z0-7.8,{shirt:"s7",hat:"chef"},0);
  spot({zone:Z.id,x:x0-3,z:z0-4.4,r:2.4,label:"🍦 Comprar un helado · $15",fn:buyTreat});
  spot({zone:Z.id,x:x0+3,z:z0-4.4,r:2.4,label:"👩‍🍳 Trabajar preparando helados",fn:gameHelados});}
 if(b.id==="super"){room(Z,30,24,"#B9D6F2","#9EC3E6","#BFE8B4","#2F7D3A");w=30;d=24;ROOT=Z.g;
  const cols=["#E2465C","#F5C518","#2E7BEF","#19A858","#FF4FA3","#F28C28","#7B4BD1"];
  for(let r=0;r<3;r++){const sx=x0-9+r*7;box(1.2,3,9,"#C9D3DC",sx,1.8,z0-3);addCol(sx,z0-3,1.4,9,3);for(let lv=0;lv<3;lv++)for(let k=0;k<7;k++){for(const s of [-1,1])box(0.4,0.55,0.9,cols[(k+lv+r)%7],sx+s*0.75,0.9+lv*0.95,z0-6.6+k*1.2);}}
  for(let k=0;k<4;k++){const fx=x0+9,fz=z0-8+k*2.5;box(2.4,0.9,2,"#8A5A2B",fx,0.75,fz);for(let q=0;q<6;q++)sph(0.28,["#E2465C","#F5C518","#19A858","#F28C28"][k],fx-0.8+(q%3)*0.8,1.35,fz-0.4+Math.floor(q/3)*0.8,null,8,6);addCol(fx,fz,2.4,2,1.2);}
  counter(x0-6,z0+7,5,"#2F7D3A");counter(x0+2,z0+7,5,"#2F7D3A");staff(Z,x0-6,z0+8.3,{shirt:"s3"},Math.PI);
  signMesh("🛒 Supermercado","#F28C28",6,x0,5.5,z0-11.7,0);
  spot({zone:Z.id,x:x0-6,z:z0+5.4,r:2.6,label:"🛒 Trabajar de cajero",fn:gameSuper});
  spot({zone:Z.id,x:x0+9,z:z0+2,r:2.6,label:"🍎 Comprar una fruta · $10",fn:()=>buyTreat("🍎")});}
 if(b.id==="cine"){room(Z,28,26,"#5B3FA8","#4A2F96","#2C1F5E","#E2A511");w=28;d=26;ROOT=Z.g;
  const scr=new T.Mesh(new T.PlaneGeometry(16,6.5),new T.MeshBasicMaterial({color:0xffffff}));scr.position.set(x0,4.2,z0-12.7);Z.g.add(scr);Z.screen=scr;Z.scrT=0;
  for(let r=0;r<4;r++){const y=0.3+r*0.6;addPlat(x0,y+0.3,z0-2+r*2.6,22,0.3+r*0.6,2.6,r%2?"#3E2A7A":"#4A3390",{});for(let k=-4;k<=4;k++){if(k===0)continue;box(1.2,0.7,0.7,"#E2465C",x0+k*2.3,y+0.65,z0-2.3+r*2.6);box(1.2,1,0.2,"#E2465C",x0+k*2.3,y+1.0,z0-1.85+r*2.6);}}
  counter(x0+10,z0+9,4,"#E2A511");for(let q=0;q<5;q++)sph(0.25,"#FFF6C8",x0+9+q*0.5,2.0,z0+9,null,6,4);staff(Z,x0+10,z0+10.4,{shirt:"s2",hat:"gorra"},Math.PI);
  spot({zone:Z.id,x:x0+10,z:z0+7.4,r:2.4,label:"🍿 Trabajar atrapando palomitas",fn:gameCine});
  spot({zone:Z.id,x:x0,z:z0+5.8,r:2.2,label:"🎬 Sentarse a ver la película",fn:watchMovie});}
 if(b.id==="hospital"){room(Z,w,d,"#A9DCEB","#8FCBDD","#BDEDE3","#2BB5A0");ROOT=Z.g;
  counter(x0,z0+4,8,"#2BB5A0");staff(Z,x0,z0+2.7,{shirt:"s9",hstyle:"mono"},Math.PI);
  for(let k=0;k<4;k++){const bx=x0-10+k*6.5,bz=z0-7;box(2.4,0.7,4,"#FFFFFF",bx,0.75,bz);box(2.2,0.3,1,"#BFE6FF",bx,1.2,bz-1.4);box(2.6,1.6,0.15,"#7EC4EE",bx,1.4,bz-2.05);addCol(bx,bz,2.4,4,1);box(0.1,4,3,"#9FE0D2",bx+1.8,2.3,bz).material=new T.MeshBasicMaterial({color:0x9FE0D2,transparent:true,opacity:0.6});}
  box(4,3,0.15,"#1E2329",x0+11,3.2,z0-10.7);box(3.6,2.6,0.16,"#DCEBF5",x0+11,3.2,z0-10.65).material=M("#DCEBF5","#405A70");
  signMesh("🏥 Hospital","#E2465C",5,x0,5.5,z0-10.7,0);
  spot({zone:Z.id,x:x0,z:z0+6,r:2.6,label:"🩺 Atender pacientes",fn:gameHospital});}
 if(b.id==="escuela"){room(Z,w,d,"#D9A86C","#C99257","#FFE08A","#C2553A");ROOT=Z.g;
  box(10,3.4,0.15,"#2F5D3A",x0,3.5,z0-10.7);signMesh("¡Hola, clase! 📚","#2F5D3A",6,x0,4.2,z0-10.55,0);
  for(let r=0;r<3;r++)for(let k=0;k<4;k++){const dx=x0-7.5+k*5,dz=z0-4+r*4;box(2,0.15,1.3,"#C68A4A",dx,1.3,dz);for(const s of [-0.8,0.8])box(0.12,1,0.12,"#3E4B59",dx+s,0.8,dz);box(1,0.5,1,"#2E7BEF",dx,0.75,dz+1.1);addCol(dx,dz,2,1.3,1.3);}
  const gl=sph(0.8,"#2E7BEF",x0+11,2.6,z0-8);cyl(0.1,0.3,1.4,"#8A5A2B",x0+11,1.2,z0-8);staff(Z,x0-6,z0-9,{shirt:"s13",face:"lentes"},0);
  spot({zone:Z.id,x:x0,z:z0-7,r:3,label:"✏️ Responder preguntas",fn:gameEscuela});}
 if(b.id==="bomberos"){room(Z,w,d,"#9AA6B4","#8794A3","#F2C4BC","#D9483B");ROOT=Z.g;
  const tr=makeCar("#D9483B");tr.scale.set(1.6,1.6,1.6);tr.position.set(x0-5,0.3,z0-3);Z.g.add(tr);addCol(x0-5,z0-3,3.4,7);
  cyl(0.12,0.12,7,"#D9DEE5",x0+8,3.5,z0-6,null,10);for(let k=0;k<4;k++){const h=new T.Group();h.position.set(x0+4+k*1.6,2.4,z0-10.6);Z.g.add(h);const c=new T.Mesh(new T.SphereGeometry(0.5,12,8,0,Math.PI*2,0,Math.PI/2),M("#D9483B"));h.add(c);}
  staff(Z,x0+4,z0+2,{shirt:"s2",hat:"bombero"},Math.PI);
  spot({zone:Z.id,x:x0+4,z:z0+4,r:2.6,label:"🚒 Salir a apagar incendios",fn:()=>{exitInside(()=>openBomberos());}});}
 if(b.id==="mall"){w=32;d=26;room(Z,w,d,"#C9B6F0","#B39DE6","#BFDDF7","#2E6FD8");ROOT=Z.g;
  const shops=[["👕 Ropa","#FF4FA3",()=>openCloset("camisas")],["🥚 Huevos","#7B4BD1",()=>openShop("huevos")],["💎 MediCoins","#E2A511",()=>openShop("paquetes")],["🚗 Vehículos","#2E7BEF",()=>openShop("vehiculos")]];
  shops.forEach(([n,c,fn],k)=>{const sx=x0-11.5+k*7.7;box(6.6,4.2,0.3,c,sx,2.4,z0-12.7);box(5,3.2,0.32,"#BFE6FF",sx,1.9,z0-12.6);signMesh(n,c,5,sx,5.0,z0-12.5,0);spot({zone:Z.id,x:sx,z:z0-10.5,r:2.6,label:n,fn});});
  // escaleras al segundo piso
  for(let k=0;k<8;k++)addPlat(x0+12,0.3+0.4*(k+1),z0+9-k*1.1,4,0.25,1.1,k%2?"#9DB4C8":"#C9D3DC",{});
  addPlat(x0+10,3.5,z0-2,8,0.3,9,"#DCE6F2",{});for(let k=0;k<5;k++)box(0.1,1,0.1,"#9DB4C8",x0+6.1,4.0,z0-6+k*2);box(0.1,0.1,9,"#9DB4C8",x0+6.1,4.5,z0-2);
  const ft=cyl(2.2,2.4,0.8,"#C9D3DC",x0-6,0.7,z0+3,null,20);cyl(1.9,1.9,0.15,"#4FB7E8",x0-6,1.1,z0+3,null,20).material=M("#4FB7E8","#0A3A55");addCol(x0-6,z0+3,4.4,4.4,1);
  signMesh("🛍️ Centro Comercial","#E2465C",7,x0,6,z0-12.4,0);
  spot({zone:Z.id,x:x0+10,z:z0-5,r:2.6,label:"🎁 Ofertas del día",fn:()=>openShop("ofertas"),pos:()=>({x:x0+10,z:z0-5,y:3.5})});}
 ROOT=scene;
 spot({zone:Z.id,x:x0,z:z0+d/2-1.4,r:2.2,label:"🚪 Salir a la calle",fn:()=>exitInside()});
 INT[b.id]={Z,b};}
function goInside(b){const I=INT[b.id];if(!I)return;const sp=I.Z.spawn;INT.cur=b.id;teleport(sp.x,sp.z,null,Math.PI,()=>{toast(b.icon+" ¡Bienvenida a "+b.name+"!");if(typeof objDone==="function")objDone("entrar_"+b.id);});}
function exitInside(after){const id=INT.cur||"helados";const d=doors.find(x=>x.b.id===id);const f=FACE[d.b.f];const face=Math.atan2(f.x,f.z);teleport(d.x+f.x*2.5,d.z+f.z*2.5,null,face,after);}
function buyTreat(kind){kind=typeof kind==="string"?kind:"🍦";const price=kind==="🍦"?15:10;if(!pay({p:price,cur:"$"}))return;sfx("compra");
 if(heldTreat)rm(heldTreat);heldTreat=new T.Group();
 if(kind==="🍦"){const c=cone(0.16,0.45,"#D79A4E",0,0,0,heldTreat,10);c.rotation.x=Math.PI;sph(0.17,pick(["#F48FB8","#7A4A2A","#FFF1C2","#9BE07A","#C9A7FF"]),0,0.27,0,heldTreat,10,8);sph(0.12,pick(["#F48FB8","#FFF1C2","#C9A7FF"]),0,0.42,0,heldTreat,10,8);}
 else{sph(0.2,"#E2465C",0,0.1,0,heldTreat,10,8);box(0.03,0.12,0.03,"#5A3A1F",0,0.32,0,heldTreat);}
 player.arms[0].add(heldTreat);heldTreat.position.set(0,-0.82,0.12);heldTreat.userData.until=Date.now()+90000;
 toast(kind+" ¡Qué rico! Le da energía para correr");P.boost=Date.now()+60000;if(typeof objDone==="function")objDone("helado");}
let movieOn=0;
function watchMovie(){if(movieOn)return;const Z=INT.cine.Z;movieOn=8;P.lock=true;P.x=Z.cx;P.z=Z.cz+5.8;P.y=2.4;P.face=Math.PI;toast("🎬 ¡Disfrute la película! 🍿");}
mode({id:"interiores",
 init(){BUILDINGS.forEach((b,i)=>{if(b.id!=="casa")makeInterior(b,i);});
  const _enter=enter;enter=function(b){if(INT[b.id])goInside(b);else _enter(b);};},
 update(dt){
  if(heldTreat&&Date.now()>heldTreat.userData.until){rm(heldTreat);heldTreat=null;}
  if(curZone&&curZone.staff)for(const c of curZone.staff){animChar(c,0,dt,false);if(Math.random()<0.002)c.wave=1.5;}
  if(curZone&&curZone.screen){curZone.scrT+=dt;const h=(curZone.scrT*0.08)%1;curZone.screen.material.color.setHSL(h,0.7,0.6);}
  if(movieOn>0){movieOn-=dt;const Z=INT.cine.Z;P.x=Z.cx;P.z=Z.cz+5.8;P.y=2.3;P.vy=0;player.g.position.set(P.x,P.y,P.z);player.g.rotation.y=Math.PI;player.legs.forEach(l=>l.rotation.x=-1.4);
   if(movieOn<=0){P.lock=false;P.z+=1.6;toast("🎬 ¡Qué buena película!");}}
 }});
