/* ================= BUCLE ================= */
let last=performance.now(),saveT=0,coinT=0;
function loop(now){
 const dt=Math.min(0.05,(now-last)/1000);last=now;perf+=dt;
 try{
  updatePlayer(dt);if(titleOn)titleCam(dt);else if(!window.__freeCam)updateCamera(dt);skyDome.position.copy(camera.position);followSun(P.x,P.y,P.z);
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
let titleOn=false,titleT=0;
function showTitle(go){if(typeof showHome==="function")return showHome(go);titleOn=true;const t=document.createElement("div");t.id="title";
 const cols=["#FF4FA3","#F5C518","#2E7BEF","#19A858","#7B4BD1","#F28C28","#14B8A6","#E2465C","#FF4FA3"];
 const word=(w,o)=>w.split("").map((c,i)=>'<span style="color:'+cols[(i+o)%cols.length]+';animation-delay:'+((i+o)*0.12)+'s">'+c+'</span>').join("");
 t.innerHTML='<div class="logo"><div class="w">'+word("Mi",0)+'</div><div class="w">'+word("Ciudad",2)+'</div><div class="sub">🌈 Juega, crea y comparte con tus amigos</div></div><div class="menu"><button class="tbig tplay">▶ Jugar</button><button class="tbig tfr">👫 Jugar con amigos</button><button class="tbig tav">🎨 Mi personaje</button><div class="ver">'+(S.name&&S.created?"¡Hola, "+S.name+"! ":"")+'Juego seguro para niñas y niños</div></div>';
 document.body.appendChild(t);$("hud").hidden=true;$("jump").hidden=true;$("emoBtn").hidden=true;$("joyhint").hidden=true;
 const close=fn=>{sfx("pop");titleOn=false;t.remove();$("hud").hidden=false;$("jump").hidden=false;$("emoBtn").hidden=false;if(isTouch)$("joyhint").hidden=false;snapCamera();go();if(fn&&S.created)setTimeout(fn,300);};
 t.querySelector(".tplay").onclick=()=>close();t.querySelector(".tfr").onclick=()=>close(()=>openFriends());t.querySelector(".tav").onclick=()=>close(()=>openCloset());
}
function titleCam(dt){titleT+=dt*0.12;const r=26;camera.position.set(Math.sin(titleT)*r,9+Math.sin(titleT*0.7)*2,Math.cos(titleT)*r);camera.lookAt(0,3,0);}
function start(){
 load();setQuality();resize();
 buildWorld();setupCars();setupNPCs();for(let i=0;i<22;i++)spawnCoin();
 buildBusStop();
 for(const m of MODES){if(m.init){try{m.init();}catch(e){console.error("Modo "+m.id,e);}ROOT=scene;}}
 setZone(ZONES.city);
 buildPlayer();shadowAll(scene);
 snapCamera();
 $("loading").remove();
 $("hud").hidden=false;$("jump").hidden=false;
 if(isTouch)$("joyhint").hidden=false;else $("pchint").hidden=false;
 hud();
 $("mcBtn").onclick=()=>openShop("paquetes");$("bShop").onclick=()=>openShop("ofertas");$("bCloset").onclick=()=>openCloset();$("bPlaces").onclick=openPlaces;$("bSet").onclick=openSettings;
 document.addEventListener("visibilitychange",()=>{if(document.hidden)save();});addEventListener("pagehide",save);
 for(const m of MODES)if(m.afterStart)try{m.afterStart();}catch(e){console.error(e);}
 $("emoBtn").hidden=false;
 const testMode=/[?&]test/.test(location.search);
 const go=()=>{if(!S.created)welcome();else{toast("👋 ¡Hola de nuevo, "+S.name+"!");}};
 if(testMode)go();else showTitle(go);
 setTimeout(()=>{if(!isTouch)$("pchint").hidden=true;},14000);
 if(/[?&]test/.test(location.search))window.__t={get S(){return S;},P,teleport,travelTo,enter,ZONES,SPOTS,MODES,useSpot,get near(){return nearSpot;},doJump,doAttack,closeSheet,damage,colliders,get zone(){return curZone;},joy,setYaw(v){camYaw=v;},openShop,openPlaces,renderer,scene,NET,openFriends,joinRoom,leaveRoom,sendChat,redeemOnline,openAccount,openParents,nombreProblema,netStart,pushCloud,db,makeChar,makeVehicle,camera,animChar,addStars,buildPlayer,rideAnim,get player(){return player;},openSearch,BUILDINGS,crearCuenta,iniciarSesion,openCuenta,userEmail,applyCombo,COMBOS,userProblem,bqStart,get bq(){return bq;},openBosque};
 requestAnimationFrame(t=>{last=t;loop(t);});
}
const fontsReady=document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))]):Promise.resolve();
fontsReady.then(()=>{try{start();}catch(e){$("loadmsg").textContent="Error al iniciar: "+e.message;console.error(e);}});
