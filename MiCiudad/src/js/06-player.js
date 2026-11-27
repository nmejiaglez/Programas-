/* ---------- Jugador ---------- */
const P={x:0,z:12,y:0.3,vy:0,face:Math.PI,ground:true,speed:0,hp:100,maxHp:100,inv:0,plat:null,dead:false};
let player=null,nameTag=null,vehicleObj=null,petObj=null,petInfo=null,petPos=new T.Vector3(),weaponObj=null;
function wingsOn(){const a=ACCS.find(x=>x.id===S.look.acc);return !!(a&&a.wings);}
function buildPlayer(){
 if(player)rm(player.g);
 player=makeChar(S.look);scene.add(player.g);
 const vip=S.perm.vip;
 nameTag=labelSprite((vip?"⭐ ":"")+(S.name||"Yo"),vip?"rgba(181,123,0,.92)":"rgba(20,48,74,.85)","#FFFFFF");nameTag.position.y=3.65;player.g.add(nameTag);
 vehicleObj=null;weaponObj=null;
 const inCombat=curZone&&curZone.combat;
 if(S.riding&&S.vehicle&&!(curZone&&curZone.noVehicle)){vehicleObj=makeVehicle(S.vehicle);player.g.add(vehicleObj.g);player.body.position.y=0;}
 if(inCombat&&typeof makeSword==="function"){weaponObj=makeSword(S.adv.sword);player.arms[1].add(weaponObj);weaponObj.position.set(0,-0.78,0.1);weaponObj.rotation.x=Math.PI/2;}
 if(petObj){rm(petObj);petObj=null;}
 petInfo=typeof activePetInfo==="function"?activePetInfo():null;
 if(petInfo){petObj=makePet(petInfo.type);petObj.scale.setScalar(petInfo.scale);petPos.set(P.x+1.5,P.y,P.z-1);petObj.position.copy(petPos);scene.add(petObj);}
 const rb=$("ride");rb.hidden=!S.vehicle||(curZone&&curZone.noVehicle);if(S.vehicle){rb.textContent=(VEHICLES.find(v=>v.id===S.vehicle)||{}).icon||"🛹";rb.setAttribute("aria-pressed",S.riding?"true":"false");}
}
function refreshCombatUI(){
 const c=!!(curZone&&curZone.combat);
 $("atk").hidden=!c;$("hpbar").hidden=!(c||(curZone&&curZone.showHp));
 if(player)buildPlayer();
 drawHp();
}
function drawHp(){const f=$("hpfill");if(!f)return;f.style.width=Math.max(0,P.hp/P.maxHp*100)+"%";$("hptx").textContent=Math.ceil(Math.max(0,P.hp))+" / "+P.maxHp;}
function damage(n){
 if(P.inv>0||P.dead)return;
 P.hp-=n;P.inv=0.6;drawHp();
 const fl=$("hurt");fl.hidden=false;fl.style.opacity=0.55;setTimeout(()=>{fl.style.opacity=0;setTimeout(()=>fl.hidden=true,250);},120);
 if(P.hp<=0){P.hp=0;P.dead=true;if(curZone.onDeath)curZone.onDeath();else respawn();}
}
function heal(n){P.hp=Math.min(P.maxHp,P.hp+n);drawHp();}
function respawn(){const sp=curZone.spawn||{x:curZone.cx,z:curZone.cz};P.dead=false;P.hp=P.maxHp;drawHp();teleport(sp.x,sp.z,sp.y,sp.face);}
function snapCamera(){const tx=P.x,ty=P.y+1.9,tz=P.z;camera.position.set(tx+Math.sin(camYaw)*Math.cos(camPitch)*camDist,ty+Math.sin(camPitch)*camDist,tz+Math.cos(camYaw)*Math.cos(camPitch)*camDist);camera.lookAt(tx,ty,tz);}
let teleporting=false;
function teleport(x,z,y,face,cb){
 if(teleporting)return;teleporting=true;const f=$("fade");f.hidden=false;requestAnimationFrame(()=>f.style.opacity=1);
 setTimeout(()=>{
  P.x=x;P.z=z;P.y=y==null?0.4:y;P.vy=0;P.plat=null;if(face!=null)P.face=face;camYaw=P.face+Math.PI;
  setZone(zoneAt(x,z));petPos.set(x+1,P.y,z+1);if(petObj)petObj.position.copy(petPos);snapCamera();
  if(cb)cb();
  setTimeout(()=>{f.style.opacity=0;setTimeout(()=>{f.hidden=true;teleporting=false;},300);},120);
 },320);
}
function travelTo(id){const Z=ZONES[id];if(!Z)return;closeSheet();const sp=Z.spawn||{x:Z.cx,z:Z.cz};teleport(sp.x,sp.z,sp.y,sp.face);}
