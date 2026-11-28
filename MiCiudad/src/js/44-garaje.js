/* ================= GARAJE: sacar vehículos como en la ciudad, subirse, luces, bocina y radio ================= */
VEHICLES.push(
 {id:"sedan",name:"Sedán familiar",icon:"🚙",speed:2.2,p:0,free:true},
 {id:"camioneta",name:"Camioneta",icon:"🛻",speed:2.3,p:0,free:true},
 {id:"golf",name:"Carrito de golf",icon:"⛳",speed:1.8,p:0,free:true},
 {id:"podadora",name:"Podadora",icon:"🌱",speed:1.4,p:20,cur:"mc"},
 {id:"jeep",name:"Jeep de aventura",icon:"🚙",speed:2.6,p:80,cur:"mc"},
 {id:"limusina",name:"Limusina rosada",icon:"💗",speed:2.4,p:180,cur:"mc"},
 {id:"policia",name:"Patrulla",icon:"🚓",speed:2.7,p:120,cur:"mc"},
 {id:"ambulancia",name:"Ambulancia",icon:"🚑",speed:2.6,p:120,cur:"mc"}
);
VEHICLES.forEach(v=>{if(!v.cur&&!v.free&&v.p&&v.id!=="skate")v.cur="$";});
function vehFree(v){return !!v.free;}
function vehOwned(id){const v=VEHICLES.find(x=>x.id===id);return !!(v&&(v.free||S.owned[id]));}
// modelos nuevos
const _makeVehicle=makeVehicle;
makeVehicle=function(id,col){
 const V={sedan:"#3E7BD6",camioneta:"#C23B4E",jeep:"#5E7A3A",limusina:"#FF8DC4",policia:"#FFFFFF",ambulancia:"#FFFFFF"};
 if(id==="golf"){const g=new T.Group();const c=col||"#FFFFFF";box(1.4,0.35,2.2,c,0,0.55,0,g);box(1.4,0.08,1.9,"#2E7BEF",0,1.95,-0.1,g);for(const sx of [-0.62,0.62])for(const sz of [0.75,-0.95])box(0.06,1.25,0.06,"#C9D3DC",sx,1.3,sz,g);
  box(1.2,0.15,0.6,"#3E2A1F",0,0.85,-0.25,g);box(1.2,0.5,0.1,"#3E2A1F",0,1.1,-0.55,g);box(0.4,0.3,0.5,"#9DB4C8",0,0.75,-1.1,g);
  const w=[];for(const sx of [-0.7,0.7])for(const sz of [0.75,-0.75])w.push(wheel(g,0.25,0.18,sx,0.25,sz,"#E9EEF2"));return {g,lift:0.32,sit:true,pose:"car",wheels:w};}
 if(id==="podadora"){const g=new T.Group();const c=col||"#3FBF5F";box(1,0.45,1.5,c,0,0.5,0,g);box(1.1,0.15,0.6,"#2A2E35",0,0.28,0.45,g);box(0.5,0.1,0.5,"#2A2E35",0,0.85,-0.25,g);box(0.5,0.5,0.08,"#2A2E35",0,1.1,-0.5,g);
  tubeBetween(g,new T.Vector3(0,0.75,0.4),new T.Vector3(0,1.15,0.2),0.03,"#3E4B59");cyl(0.18,0.18,0.04,"#2A2E35",0,1.17,0.18,g,12).rotation.x=-0.6;
  const w=[wheel(g,0.32,0.22,-0.55,0.32,-0.45,"#F5C518"),wheel(g,0.32,0.22,0.55,0.32,-0.45,"#F5C518"),wheel(g,0.2,0.15,-0.5,0.2,0.55),wheel(g,0.2,0.15,0.5,0.2,0.55)];return {g,lift:0.42,sit:true,pose:"car",wheels:w};}
 if(V[id]){const g=new T.Group();const car=makeCar(col||V[id],{conv:id==="jeep",rim:id==="limusina"?"#FFE3F1":null});
  if(id==="limusina"){car.scale.z=1.55;car.scale.x=1.05;}
  if(id==="camioneta"){box(1.8,0.5,1.6,col||V[id],0,1.05,-1.25,car);box(1.6,0.2,1.4,"#3E2A1F",0,0.85,-1.25,car);car.children[1]&&(car.children[1].scale.z=0.75);}
  if(id==="jeep"){for(const sx of [-0.82,0.82])box(0.08,1.0,0.08,"#2A2E35",sx,1.6,-0.4,car);box(1.7,0.08,0.08,"#2A2E35",0,2.1,-0.4,car);box(0.7,0.7,0.25,"#2A2E35",0,1.1,-2.15,car);}
  if(id==="policia"||id==="ambulancia"){box(2.02,0.35,3.0,id==="policia"?"#1E2A55":"#E2465C",0,0.95,0,car);const lb=box(0.9,0.18,0.35,"#2A2E35",0,1.95,-0.3,car);const r=box(0.4,0.16,0.3,"#E2465C",-0.22,2.08,-0.3,car);r.material=M("#E2465C","#7A0A14");const b=box(0.4,0.16,0.3,"#2E7BEF",0.22,2.08,-0.3,car);b.material=M("#2E7BEF","#0A2A7A");g.userData.siren=[r,b];}
  g.add(car);return {g,lift:0.48,sit:true,pose:"car",wheels:car.userData.wheels,siren:g.userData.siren};}
 return _makeVehicle(id,col);};
// vehículo estacionado en la calle
let parked=null;
function spawnVehicle(id){const v=VEHICLES.find(x=>x.id===id);if(!v)return;
 if(curZone&&curZone.noVehicle){toast("Aquí no se pueden sacar vehículos");return;}
 if(S.riding){S.riding=false;}
 removeParked();const o=makeVehicle(id,S.look.carC);
 const dx=Math.cos(P.face)*3.2,dz=-Math.sin(P.face)*3.2;let x=P.x+dx,z=P.z+dz;if(blocked(x,z,1.4,P.y)){x=P.x-dx;z=P.z-dz;}
 o.g.position.set(x,P.y,z);o.g.rotation.y=P.face;(curZone?curZone.g:scene).add(o.g);shadowAll(o.g);
 parked={id,o,x,z,y:P.y,zone:curZone&&curZone.id,face:P.face};S.vehicle=id;save();buildPlayer();
 const fx=$("fade");sfx("pop");toast(v.icon+" ¡Su "+v.name+" está listo! Camine hacia él para subirse");}
function removeParked(){if(parked){rm(parked.o.g);parked=null;}}
function enterParked(){if(!parked)return;S.vehicle=parked.id;P.x=parked.x;P.z=parked.z;P.face=parked.face;removeParked();S.riding=true;buildPlayer();save();sfx("salto");}
function leaveVehicle(){if(!S.riding||!S.vehicle)return;const id=S.vehicle;const veh=VEHICLES.find(v=>v.id===id);S.riding=false;
 const sit=vehicleObj&&vehicleObj.sit;buildPlayer();
 if(sit||["golf","podadora"].includes(id)){const o=makeVehicle(id,S.look.carC);o.g.position.set(P.x,P.y,P.z);o.g.rotation.y=P.face;(curZone?curZone.g:scene).add(o.g);shadowAll(o.g);parked={id,o,x:P.x,z:P.z,y:P.y,zone:curZone&&curZone.id,face:P.face};
  P.x+=Math.cos(P.face)*1.8;P.z-=Math.sin(P.face)*1.8;}
 save();}
spot({zone:"city",x:0,z:0,r:2.6,label:"🚗 Subirse",pos:()=>parked?{x:parked.x,z:parked.z,y:parked.y}:{x:9999,z:9999},when:()=>!!parked&&!S.riding&&parked.zone==="city",fn:enterParked});
spot({zone:"rural",x:0,z:0,r:2.6,label:"🚗 Subirse",pos:()=>parked?{x:parked.x,z:parked.z,y:parked.y}:{x:9999,z:9999},when:()=>!!parked&&!S.riding&&parked.zone==="rural",fn:enterParked});
// menú del garaje
function openGarage(){sheet("🚗 Sacar vehículo",b=>{
 b.appendChild(el("p","muted","Elija un vehículo y aparece a su lado. Camine hacia él para subirse. Los de la fila de arriba son gratis."));
 const g=el("div","garage");
 VEHICLES.slice().sort((a,c)=>(c.free?1:0)-(a.free?1:0)).forEach(v=>{const own=vehOwned(v.id);
  const c=el("button","gcard"+(own?"":" lock")+(S.vehicle===v.id?" on":""),imgTag(vehThumb(v.id),'<div style="font-size:40px">'+v.icon+'</div>')+'<b>'+v.name+'</b><small>'+(v.free?"Gratis":own?"Suyo":priceHTML(v))+'</small>');
  c.onclick=()=>{if(!own){if(!pay(v))return;S.owned[v.id]=1;confetti();sfx("compra");toast("🎉 ¡"+v.name+" es suyo!");}closeSheet();spawnVehicle(v.id);};g.appendChild(c);});
 b.appendChild(g);
 if(parked||S.riding){const q=el("button","btn ghost","🧹 Guardar el vehículo");q.onclick=()=>{if(S.riding)leaveVehicle();removeParked();closeSheet();toast("Vehículo guardado");};b.appendChild(q);}
},{half:true});}
// controles del carro
let lightsOn=false,radioOn=false,radioT=0,radioI=0;
const SONG=[523,659,784,659,587,698,880,698,523,659,784,1047,988,784,659,587];
function honk(){try{sfx("pop");if(!AC)return;const t=AC.currentTime;[0,0.18].forEach(d=>{const o=AC.createOscillator(),g=AC.createGain();o.type="square";o.frequency.value=392;g.gain.setValueAtTime(0.08,t+d);g.gain.exponentialRampToValueAtTime(0.001,t+d+0.16);o.connect(g);g.connect(AC.destination);o.start(t+d);o.stop(t+d+0.17);});}catch(e){}}
function setLights(on){lightsOn=on;if(!vehicleObj)return;if(on&&!vehicleObj.beam){const bm=new T.Mesh(new T.ConeGeometry(2.4,9,16,1,true),new T.MeshBasicMaterial({color:0xFFF4B0,transparent:true,opacity:0.18,depthWrite:false,side:T.DoubleSide}));bm.rotation.x=-Math.PI/2;bm.position.set(0,0.9,6.4);vehicleObj.g.add(bm);vehicleObj.beam=bm;}
 if(vehicleObj.beam)vehicleObj.beam.visible=on;}
function carBar(){const bar=$("carbar");if(!bar)return;const show=!!(S.riding&&vehicleObj&&!uiOpen&&!titleOn);bar.hidden=!show;}
function radioTick(dt){if(!radioOn||!S.riding)return;radioT+=dt;if(radioT>0.26){radioT=0;try{if(!AC)return;const t=AC.currentTime;const o=AC.createOscillator(),g=AC.createGain();o.type="triangle";o.frequency.value=SONG[radioI%SONG.length]/2;g.gain.setValueAtTime(0.05,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.24);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+0.25);radioI++;}catch(e){}}}
/* ---------- palmeras y toldos para una ciudad más bonita ---------- */
function palm(x,z,p){const g=grp(x,0.3,z,p);let px=0,py=0;for(let i=0;i<7;i++){const s=cyl(0.24-i*0.015,0.27-i*0.015,0.9,"#9A7B5B",px,py+0.45,0,g,8);px+=0.07;py+=0.85;s.position.x=px;s.rotation.z=-0.08;}
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const l=new T.Group();l.position.set(px,py+0.2,0);l.rotation.y=a;g.add(l);const f=box(0.5,0.06,2.6,"#2FA34D",0,0,1.2,l);f.rotation.x=0.45;const f2=box(0.4,0.05,1.4,"#3FBF5F",0,-0.45,2.4,l);f2.rotation.x=0.9;}
 sph(0.2,"#8A5A2B",px,py,0.15,g,8,6);sph(0.2,"#8A5A2B",px-0.15,py,-0.1,g,8,6);addCol(x,z,0.7,0.7);return g;}
mode({id:"garaje",
 init(){ROOT=ZONES.city.g;
  for(const bx of [-60,60])for(const bz of [-60,0,60]){for(const s of [-1,1]){palm(bx+s*21.5,bz+9);palm(bx+s*21.5,bz-9);}}
  for(const bx of [-60,0,60])for(const bz of [-60,60]){for(const s of [-1,1])palm(bx+(s*9),bz+(bz<0?21.5:-21.5));}
  ROOT=scene;},
 afterStart(){const gb=$("garBtn");if(gb)gb.onclick=openGarage;
  $("ride").onclick=null;const rb=$("ride");const nb=rb.cloneNode(true);rb.parentNode.replaceChild(nb,rb);nb.addEventListener("click",()=>{if(S.riding)leaveVehicle();else if(parked&&parked.zone===(curZone&&curZone.id)&&Math.hypot(parked.x-P.x,parked.z-P.z)<6)enterParked();else if(S.vehicle&&vehOwned(S.vehicle))spawnVehicle(S.vehicle);else openGarage();});
  $("cbHorn").onclick=honk;$("cbLights").onclick=()=>{setLights(!lightsOn);$("cbLights").setAttribute("aria-pressed",lightsOn?"true":"false");};
  $("cbRadio").onclick=()=>{radioOn=!radioOn;$("cbRadio").setAttribute("aria-pressed",radioOn?"true":"false");toast(radioOn?"📻 Radio encendida":"📻 Radio apagada");};
  $("cbLock").onclick=()=>{const l=$("cbLock");const on=l.getAttribute("aria-pressed")!=="true";l.setAttribute("aria-pressed",on?"true":"false");l.textContent=on?"🔒":"🔓";toast(on?"🔒 Carro con seguro":"🔓 Carro sin seguro");};
  $("cbOut").onclick=leaveVehicle;},
 update(dt){carBar();radioTick(dt);if(vehicleObj&&lightsOn&&!vehicleObj.beam)setLights(true);
  if(vehicleObj&&vehicleObj.siren){const k=Math.floor(perf*4)%2;vehicleObj.siren[0].visible=!!k;vehicleObj.siren[1].visible=!k;}
  const gb=$("garBtn");if(gb)gb.hidden=!!(titleOn||uiOpen||(curZone&&curZone.noVehicle));}
});
