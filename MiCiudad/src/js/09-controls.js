/* ================= CONTROLES ================= */
const keys={};let joy={id:null,x:0,y:0,ox:0,oy:0},drag={id:null,x:0,y:0};
let camYaw=0,camPitch=0.36,camDist=11,camShake=0;
let uiOpen=false;const isTouch=matchMedia("(pointer:coarse)").matches||"ontouchstart" in window;
addEventListener("keydown",e=>{if(e.target.tagName==="INPUT")return;keys[e.code]=true;
 if(e.code==="Space"){e.preventDefault();doJump();}
 if((e.code==="KeyE"||e.code==="Enter")&&!uiOpen&&nearSpot)useSpot();
 if((e.code==="KeyF"||e.code==="KeyJ")&&!uiOpen)doAttack();});
addEventListener("keyup",e=>{keys[e.code]=false;});
canvas.addEventListener("pointerdown",e=>{if(uiOpen)return;canvas.setPointerCapture(e.pointerId);
 if(e.pointerType==="touch"&&e.clientX<innerWidth*0.45&&joy.id===null){joy.id=e.pointerId;joy.ox=e.clientX;joy.oy=e.clientY;joy.x=0;joy.y=0;const j=$("joy");j.style.left=e.clientX+"px";j.style.top=e.clientY+"px";j.hidden=false;$("knob").style.transform="";$("joyhint").hidden=true;}
 else if(drag.id===null){drag.id=e.pointerId;drag.x=e.clientX;drag.y=e.clientY;}});
canvas.addEventListener("pointermove",e=>{
 if(e.pointerId===joy.id){let dx=e.clientX-joy.ox,dy=e.clientY-joy.oy;const l=Math.hypot(dx,dy),m=50;if(l>m){dx=dx/l*m;dy=dy/l*m;}joy.x=dx/m;joy.y=dy/m;$("knob").style.transform="translate("+dx+"px,"+dy+"px)";}
 else if(e.pointerId===drag.id){camYaw-=(e.clientX-drag.x)*0.008;camPitch=Math.max(0.12,Math.min(1.15,camPitch+(e.clientY-drag.y)*0.005));drag.x=e.clientX;drag.y=e.clientY;}});
function endPtr(e){if(e.pointerId===joy.id){joy.id=null;joy.x=0;joy.y=0;$("joy").hidden=true;}if(e.pointerId===drag.id)drag.id=null;}
canvas.addEventListener("pointerup",endPtr);canvas.addEventListener("pointercancel",endPtr);
canvas.addEventListener("wheel",e=>{camDist=Math.max(6,Math.min(22,camDist+e.deltaY*0.01));},{passive:true});
let jumpHeld=false;
function doJump(){if(swingRun){swingRun.stop=true;return;}if(uiOpen||P.dead||P.lock||(player&&player.fall>0))return;if(P.ground){P.vy=S.perm.salto?11:7.5;P.ground=false;P.plat=null;sfx("salto");if(typeof retoAdd==="function")retoAdd("saltos",1);}}
$("jump").addEventListener("click",doJump);
$("jump").addEventListener("pointerdown",()=>{jumpHeld=true;});addEventListener("pointerup",()=>{jumpHeld=false;});
$("ride").addEventListener("click",()=>{if(!S.vehicle)return;S.riding=!S.riding;buildPlayer();save();});
$("act").addEventListener("click",()=>{if(nearSpot)useSpot();});
$("atk").addEventListener("click",()=>doAttack());
function doAttack(){if(uiOpen||P.dead||!curZone||!curZone.combat)return;if(typeof attack==="function")attack();}

let nearSpot=null;let perf=0;
function trip(msg){if(!player||player.fall>0)return;player.fall=1.6;player.dance=0;if(msg)toast("💫 "+msg);if(typeof sfx==="function")sfx("caida");if(typeof retoAdd==="function")retoAdd("caidas",1);}
function rideAnim(ch,v,speed,dt){const ps=v.pose;ch.body.rotation.set(0,0,0);ch.body.position.z=0;
 if(ps==="car"){ch.body.position.y=v.lift-0.55;ch.body.position.z=-0.25;ch.legs.forEach(l=>{l.visible=true;l.rotation.x=-1.4;});ch.arms.forEach(a=>{a.rotation.x=-1.2;a.rotation.z=0;});}
 else if(ps==="bike"){ch.body.position.y=v.lift-0.08;ch.body.position.z=-0.35;ch.body.rotation.x=0.25;v.pedals&&(v.pedals.rotation.x+=speed*dt*1.4);const a=v.pedals?v.pedals.rotation.x:0;ch.legs[0].visible=ch.legs[1].visible=true;ch.legs[0].rotation.x=-1.0+Math.sin(a)*0.45;ch.legs[1].rotation.x=-1.0-Math.sin(a)*0.45;ch.arms.forEach(a2=>{a2.rotation.x=-1.25;});}
 else if(ps==="moto"){ch.body.position.y=v.lift-0.15;ch.body.position.z=-0.35;ch.legs.forEach(l=>{l.visible=true;l.rotation.x=-1.25;});ch.arms.forEach(a=>a.rotation.x=-1.35);}
 else {ch.body.position.y=v.lift;ch.legs[0].rotation.x=0.25;ch.legs[1].rotation.x=-0.25;ch.legs.forEach(l=>l.visible=true);ch.arms[0].rotation.x=0.4;ch.arms[1].rotation.x=-0.4;ch.arms[0].rotation.z=-0.5;ch.arms[1].rotation.z=0.5;ch.body.rotation.y=0.6;}
 if(v.wheels)for(const w of v.wheels)w.rotation.x+=speed*dt*(ps==="skate"?6:2.4);}
function useSpot(){const s=nearSpot;if(!s)return;s.fn(s);}
function spotPos(s){return s.pos?s.pos():s;}
function updatePlayer(dt){
 let mx=0,mz=0;
 const fallen=player&&player.fall>0;
 if(!uiOpen&&!P.dead&&!teleporting&&!fallen&&!P.lock){
  if(keys.KeyW||keys.ArrowUp)mz-=1;if(keys.KeyS||keys.ArrowDown)mz+=1;if(keys.KeyA||keys.ArrowLeft)mx-=1;if(keys.KeyD||keys.ArrowRight)mx+=1;
  if(joy.id!==null){mx+=joy.x;mz+=joy.y;}
 }
 const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml;}
 const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),rx=Math.cos(camYaw),rz=-Math.sin(camYaw);
 const vx=rx*mx+fx*(-mz),vz=rz*mx+fz*(-mz);
 const veh=vehicleObj&&S.riding&&S.vehicle?VEHICLES.find(v=>v.id===S.vehicle):null;
 const zoneMul=curZone&&curZone.speedMul||1;
 const maxS=7*(veh?veh.speed:1)*zoneMul*(P.slow||1)*(P.boost>Date.now()?1.3:1);
 const amt=Math.min(1,Math.hypot(vx,vz));
 P.speed=amt*maxS;
 // plataforma en movimiento
 if(P.plat&&P.ground&&(P.plat.dx||P.plat.dz)){const nx=P.x+P.plat.dx,nz=P.z+P.plat.dz;if(!blocked(nx,P.z,0.5,P.y))P.x=nx;if(!blocked(P.x,nz,0.5,P.y))P.z=nz;}
 if(amt>0.05){const nx=P.x+vx*maxS*dt,nz=P.z+vz*maxS*dt;const r=veh&&veh.speed>2.2?1.1:0.5;
  if(!blocked(nx,P.z,r,P.y))P.x=nx;if(!blocked(P.x,nz,r,P.y))P.z=nz;
  const target=Math.atan2(vx,vz);let d=target-P.face;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;P.face+=d*Math.min(1,dt*12);}
 if(P.push){P.x+=P.push.x*dt;P.z+=P.push.z*dt;}
 // gravedad y suelo
 P.vy-=22*dt;
 if(P.vy<0&&wingsOn()&&!P.ground)P.vy=Math.max(P.vy,jumpHeld||keys.Space?-1.6:-4.2);
 const sup=support(P.x,P.z,P.y);
 let ny=P.y+P.vy*dt;
 if(ny<=sup.y&&P.y>=sup.y-0.5){ny=sup.y;if(P.vy<-19&&!P.ground&&!wingsOn()&&!vehicleObj&&!(sup.plat&&sup.plat.bounce))trip("¡Ay! Qué caída");P.vy=0;if(!P.ground&&sup.plat&&sup.plat.onLand)sup.plat.onLand(sup.plat);P.ground=true;P.plat=sup.plat;if(sup.plat&&sup.plat.bounce){P.vy=sup.plat.bounce;P.ground=false;P.plat=null;}}
 else{P.ground=false;P.plat=null;}
 P.y=ny;
 if(P.plat&&P.plat.onStand)P.plat.onStand(P.plat,dt);
 if(curZone.killY!=null&&P.y<curZone.killY&&!P.dead){if(curZone.onFall)curZone.onFall();else respawn();}
 if(P.inv>0)P.inv-=dt;
 player.g.position.set(P.x,P.y,P.z);player.g.rotation.y=P.face;
 player.g.visible=!(P.inv>0&&Math.floor(P.inv*12)%2===0&&P.hp<P.maxHp);
 if(vehicleObj){rideAnim(player,vehicleObj,P.speed,dt);player.shadow.scale.setScalar(1.6);}
 else{player.legs.forEach(l=>l.visible=true);player.shadow.scale.setScalar(1);animChar(player,P.forceWalk||P.speed,dt,!P.ground);if(P.swing>0){P.swing-=dt;player.arms[1].rotation.x=-2.6+(0.35-P.swing)*9;}}
 if(player.wings){const fl=!P.ground?Math.sin(perf*14)*0.5:Math.sin(perf*2)*0.1;player.wings.forEach((w,i)=>w.rotation.y=(i?-1:1)*(0.35+fl));}
 if(petObj){const tx=P.x-Math.sin(P.face)*1.8+Math.cos(P.face)*1.2,tz=P.z-Math.cos(P.face)*1.8-Math.sin(P.face)*1.2;const k=Math.min(1,dt*(veh?6:3.5));const ox=petPos.x,oz=petPos.z;petPos.x+=(tx-petPos.x)*k;petPos.z+=(tz-petPos.z)*k;
  const ps=support(petPos.x,petPos.z,P.y+0.3,0.1);const gy=ps.y>-1e9?ps.y:P.y;petPos.y+=(gy-petPos.y)*Math.min(1,dt*8);
  const mv=Math.hypot(petPos.x-ox,petPos.z-oz);
  petObj.position.set(petPos.x,petPos.y+(mv>0.01?Math.abs(Math.sin(perf*12))*0.25:0)+(petInfo&&petInfo.fly?1.2+Math.sin(perf*3)*0.2:0),petPos.z);if(mv>0.005)petObj.rotation.y=Math.atan2(petPos.x-ox,petPos.z-oz);}
 // lugares cercanos
 nearSpot=null;let bd=1e9;
 for(const s of SPOTS){if(s.zone!==curZone.id||(s.when&&!s.when()))continue;const p=spotPos(s);const dd=Math.hypot(p.x-P.x,p.z-P.z);if(dd<s.r&&dd<bd&&Math.abs((p.y||P.y)-P.y)<3){bd=dd;nearSpot=s;}}
 const act=$("act");if(nearSpot&&!uiOpen&&!teleporting){act.hidden=false;const t=typeof nearSpot.label==="function"?nearSpot.label():nearSpot.label;if(act.textContent!==t)act.textContent=t;}else act.hidden=true;
}
function updateCamera(dt){
 const cp=curZone.indoor?Math.max(camPitch,0.62):camPitch;
 const tx=P.x,ty=P.y+1.9,tz=P.z;
 const cmax=Math.min(camDist,curZone.camMax||99);let dist=cmax;
 for(let k=1;k<=12;k++){const t=cmax*k/12;const px=tx+Math.sin(camYaw)*Math.cos(cp)*t,py=ty+Math.sin(cp)*t,pz=tz+Math.cos(camYaw)*Math.cos(cp)*t;
  if(colliders.some(c=>c.h&&!c.off&&py<c.y1&&px>c.a-0.5&&px<c.b+0.5&&pz>c.c-0.5&&pz<c.d+0.5)){dist=Math.max(2.5,t-cmax/12);break;}}
 let cx=tx+Math.sin(camYaw)*Math.cos(cp)*dist,cy=ty+Math.sin(cp)*dist,cz=tz+Math.cos(camYaw)*Math.cos(cp)*dist;
 if(curZone.indoor){const Z=curZone;cx=Math.max(Z.cx-Z.hw+0.2,Math.min(Z.cx+Z.hw-0.2,cx));cz=Math.max(Z.cz-Z.hd+0.2,Math.min(Z.cz+Z.hd-0.2,cz));cy=Math.min(cy,9);}
 const k=Math.min(1,dt*8);camera.position.x+=(cx-camera.position.x)*k;camera.position.y+=(cy-camera.position.y)*k;camera.position.z+=(cz-camera.position.z)*k;
 camera.lookAt(tx,ty,tz);
 if(camShake>0){camShake-=dt;camera.position.x+=(Math.random()-0.5)*0.5;camera.position.y+=(Math.random()-0.5)*0.4;}
}
