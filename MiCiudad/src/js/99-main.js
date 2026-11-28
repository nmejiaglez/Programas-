/* ================= BUCLE ================= */
let last=performance.now(),saveT=0,coinT=0;
function loop(now){
 const dt=Math.min(0.05,(now-last)/1000);last=now;perf+=dt;
 try{
  updatePlayer(dt);updateCamera(dt);
  if(curZone.id==="city"){
   updateCars(dt);updateNPCs(dt);updateCoins(dt);
   coinT+=dt;if(coinT>2.5&&coins.length<30){coinT=0;spawnCoin();}
   for(const c of clouds){c.position.x+=dt*1.5;if(c.position.x>170)c.position.x=-170;}
   if(fountainDrop)fountainDrop.position.y=4.3+Math.abs(Math.sin(perf*3))*0.6;
  }
  updateFires(dt);
  for(const c of colliders){if(c.dx||c.dz||c.dy){c.dx=0;c.dz=0;c.dy=0;}}
  for(const m of MODES)if(m.update)m.update(dt);
  updateArrow();
 }catch(e){console.error(e);}
 saveT+=dt;if(saveT>5){saveT=0;save();}
 renderer.render(scene,camera);
 requestAnimationFrame(loop);
}
function buildBusStop(){
 ROOT=ZONES.city.g;
 const g=grp(6,0.3,21);box(4.4,0.2,1.8,"#2E7BEF",0,3,0,g);box(0.15,3,0.15,"#3E4B59",-2,1.5,-0.7,g);box(0.15,3,0.15,"#3E4B59",2,1.5,-0.7,g);box(3.8,0.2,0.7,"#B5762E",0,0.8,-0.4,g);
 signMesh("🚌 Bus","#F5B21B",2.4,6,3.9,21.95,0);addCol(6,20.6,4.4,0.6);
 ROOT=scene;
 spot({x:6,z:23.2,r:3.2,label:"🚌 Viajar en bus",fn:openPlaces});
}
function start(){
 load();setQuality();resize();
 buildWorld();setupCars();setupNPCs();for(let i=0;i<22;i++)spawnCoin();
 buildBusStop();
 for(const m of MODES){if(m.init){try{m.init();}catch(e){console.error("Modo "+m.id,e);}ROOT=scene;}}
 setZone(ZONES.city);
 buildPlayer();
 snapCamera();
 $("loading").remove();
 $("hud").hidden=false;$("jump").hidden=false;
 if(isTouch)$("joyhint").hidden=false;else $("pchint").hidden=false;
 hud();
 $("mcBtn").onclick=()=>openShop("paquetes");$("bShop").onclick=()=>openShop("ofertas");$("bCloset").onclick=()=>openCloset();$("bPlaces").onclick=openPlaces;$("bSet").onclick=openSettings;
 document.addEventListener("visibilitychange",()=>{if(document.hidden)save();});addEventListener("pagehide",save);
 for(const m of MODES)if(m.afterStart)try{m.afterStart();}catch(e){console.error(e);}
 if(!S.created)welcome();else{toast("👋 ¡Hola de nuevo, "+S.name+"!");}
 setTimeout(()=>{if(!isTouch)$("pchint").hidden=true;},14000);
 if(/[?&]test/.test(location.search))window.__t={get S(){return S;},P,teleport,travelTo,enter,ZONES,SPOTS,MODES,useSpot,get near(){return nearSpot;},doJump,doAttack,closeSheet,damage,colliders,get zone(){return curZone;},joy,setYaw(v){camYaw=v;},openShop,openPlaces,renderer,scene,NET,openFriends,joinRoom,leaveRoom,sendChat,redeemOnline,openAccount,openParents,nombreProblema,netStart,pushCloud,db};
 requestAnimationFrame(t=>{last=t;loop(t);});
}
const fontsReady=document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]):Promise.resolve();
fontsReady.then(()=>{try{start();}catch(e){$("loadmsg").textContent="Error al iniciar: "+e.message;console.error(e);}});
