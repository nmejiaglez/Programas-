/* ================= ISLA DE SUPERVIVENCIA ================= */
const SV={cx:330,cz:0,R:36};
const DISASTERS=[
 {id:"meteoros",name:"Lluvia de meteoritos",icon:"☄️",tip:"Aléjese de los círculos rojos"},
 {id:"inundacion",name:"Inundación",icon:"🌊",tip:"¡Suba a lo alto de las torres!"},
 {id:"tornado",name:"Tornados",icon:"🌪️",tip:"No deje que lo alcancen"},
 {id:"volcan",name:"Erupción del volcán",icon:"🌋",tip:"Esquive la lava y las rocas"},
 {id:"terremoto",name:"Terremoto",icon:"🫨",tip:"No pise las grietas que brillan"}
];
const sv={state:"idle",t:0,dis:null,bots:[],haz:[],water:null,waterY:-1,playerIn:false,streak:0,towers:[]};
function svIsland(x,z){return Math.hypot(x-SV.cx,z-SV.cz)<=SV.R;}
function buildSurvive(){
 const Z=zone({id:"sobrevivir",name:"Isla Desastre",icon:"🌋",desc:"Sobreviva a terremotos, tornados, meteoritos y más",cx:SV.cx,cz:SV.cz,hw:46,hd:50,spawn:{x:SV.cx,z:SV.cz+41,face:Math.PI},sky:0xF2C9A0,noVehicle:true,
  block:(x,z,r)=>{const d=Math.hypot(x-SV.cx,z-SV.cz);if(d<SV.R)return false;if(Math.abs(x-SV.cx)<3.5&&z>SV.cz+SV.R-3&&z<SV.cz+46)return false;if(Math.abs(x-SV.cx)<9&&z>SV.cz+42&&z<SV.cz+49)return false;return true;},
  onLeave(){svEnd(true);zoneButton(null);}});
 ROOT=Z.g;
 const sea=plane(260,260,"#3FA9DE",SV.cx,0.05,SV.cz);sea.material=M("#3FA9DE","#0A3550");
 cyl(SV.R+3,SV.R+5,0.5,"#F2D79B",SV.cx,0.1,SV.cz,null,40);cyl(SV.R-4,SV.R-2,0.4,"#8FD36C",SV.cx,0.2,SV.cz,null,40);
 // muelle y plaza de espera
 box(7,0.3,10,"#9A6B3E",SV.cx,0.15,SV.cz+SV.R+4,null);box(18,0.3,7,"#C9A574",SV.cx,0.15,SV.cz+45.5,null);
 signMesh("🌋 Isla Desastre","#C2553A",8,SV.cx,4.6,SV.cz+42.2,0);for(const s of [-1,1])box(0.3,4.5,0.3,"#6E4A2A",SV.cx+s*4,2.25,SV.cz+42.2,null);
 spot({zone:"sobrevivir",x:SV.cx-3,z:SV.cz+45,r:2.6,label:()=>sv.state==="idle"?"🌋 Empezar ronda":"⏳ Ronda en juego",fn:()=>{if(sv.state==="idle")svStart();}});
 spot({zone:"sobrevivir",x:SV.cx+5,z:SV.cz+45,r:2.4,label:()=>"🛡️ Escudos: "+S.surv.shield,fn:openShields});
 spot({zone:"sobrevivir",x:SV.cx+8,z:SV.cz+47.5,r:2,label:"🚌 Viajar en bus",fn:openPlaces});
 // volcán
 const v=cone(9,12,"#7A5232",SV.cx,6.2,SV.cz,null,16);cone(4,3,"#E2462B",SV.cx,11.6,SV.cz,null,12).material=M("#E2462B","#7A1A00");addCol(SV.cx,SV.cz,13,13,12);
 Z.vtop=sph(1.6,"#F28C28",SV.cx,12.4,SV.cz);Z.vtop.material=M("#F28C28","#8A3A00");
 // torres escalonadas
 const tiers=[[8,1.3],[6,2.3],[4.2,3.3],[2.6,4.3]];
 for(const [ox,oz] of [[-20,-14],[20,-14],[-20,16],[20,16]]){const x=SV.cx+ox,z=SV.cz+oz;tiers.forEach(([w,top],i)=>addPlat(x,top,z,w,1.05,w,["#C9A574","#B98F5E","#A57A48","#F5B21B"][i]));sv.towers.push({x,z,top:4.3});const fl=emojiSprite("🚩",1.2);fl.position.set(x,5.6,z);Z.g.add(fl);}
 // palmeras y rocas
 for(let i=0;i<18;i++){const a=i/18*Math.PI*2+0.1;const r=SV.R-2+Math.random()*2;const x=SV.cx+Math.cos(a)*r,z=SV.cz+Math.sin(a)*r;if(z>SV.cz+SV.R-6&&Math.abs(x-SV.cx)<6)continue;cyl(0.25,0.35,5,"#8A6A45",x,2.6,z,null,8);for(let k=0;k<5;k++){const l=box(0.4,0.1,2.6,"#2E8B47",x+Math.cos(k*1.3)*1.1,5.2,z+Math.sin(k*1.3)*1.1,null);l.rotation.y=k*1.3;l.rotation.x=0.3;}}
 // agua de inundación
 sv.water=plane(SV.R*2+8,SV.R*2+8,"#2A8FD0",SV.cx,-1,SV.cz);sv.water.material=new T.MeshLambertMaterial({color:0x2A8FD0,transparent:true,opacity:0.75,emissive:0x0A3550});sv.water.visible=false;
 // vecinos que juegan
 for(let i=0;i<7;i++){const look={skin:i%4,hair:i%HAIRS.length,hstyle:STYLES_H[i%3].id,shirt:SHIRTS[(i*3)%SHIRTS.length].id,pants:PANTS[i%PANTS.length].id,hat:["none","gorra","fiesta","vaquero"][i%4]};
  const ch=makeChar(look);Z.g.add(ch.g);const tag=labelSprite(["Ana","Luis","Sofi","Mateo","Valeria","Diego","Camila"][i],"rgba(20,48,74,.75)","#fff");tag.position.y=3.4;tag.scale.set(2.4,0.6,1);ch.g.add(tag);
  sv.bots.push({ch,x:SV.cx+(i-3)*2.5,z:SV.cz+45,y:0.3,alive:true,tx:0,tz:0,climb:false,wait:0});}
 svLobbyBots();
 ROOT=scene;
}
function svLobbyBots(){sv.bots.forEach((b,i)=>{b.x=SV.cx-7+i*2.2;b.z=SV.cz+46;b.y=0.3;b.alive=true;b.ch.g.visible=true;b.ch.g.position.set(b.x,b.y,b.z);b.ch.g.rotation.y=Math.PI;});}
function openShields(){sheet("🛡️ Escudos",b=>{b.appendChild(el("p","","Un escudo lo salva una vez cuando un desastre lo iba a sacar. Tiene "+S.surv.shield+"."));
 const r=el("div","row");const one=el("button","btn coinb",'1 escudo · <span class="coin sm"></span> 10');one.onclick=()=>{if(!pay({p:10,cur:"mc"}))return;S.surv.shield++;openShields();};
 const five=el("button","btn coinb",'5 escudos · <span class="coin sm"></span> 40');five.onclick=()=>{if(!pay({p:40,cur:"mc"}))return;S.surv.shield+=5;openShields();};r.append(one,five);b.appendChild(r);},{half:true});}
function svStart(){
 sv.dis=pick(DISASTERS);sv.state="count";sv.t=4;sv.playerIn=true;
 sv.bots.forEach(b=>{b.alive=true;b.ch.g.visible=true;b.climb=false;const a=Math.random()*Math.PI*2,r=rnd(13,30);b.x=SV.cx+Math.cos(a)*r;b.z=SV.cz+Math.sin(a)*r;b.y=0.3;b.tx=b.x;b.tz=b.z;});
 teleport(SV.cx,SV.cz+26,0.4,Math.PI,()=>toast(sv.dis.icon+" ¡Prepárese! Se viene: "+sv.dis.name));
}
function svBegin(){sv.state="run";sv.t=45;sv.waterY=-1;sv.spawnT=0;toast(sv.dis.icon+" "+sv.dis.name+" · "+sv.dis.tip);
 if(sv.dis.id==="inundacion"){sv.water.visible=true;sv.water.position.y=0;sv.bots.forEach(b=>{b.climb=Math.random()<0.6;if(b.climb){const t=pick(sv.towers);b.tx=t.x;b.tz=t.z;}});}
 if(sv.dis.id==="tornado"){for(let i=0;i<2;i++)svAddTornado();}
}
function svAddTornado(){const g=grp(0,0,0,ZONES.sobrevivir.g);for(let i=0;i<6;i++){const c=cone(0.6+i*0.45,1.6,"#9DA8B3",0,0.8+i*1.4,0,g,12);c.rotation.x=Math.PI;c.material=new T.MeshLambertMaterial({color:0x9DA8B3,transparent:true,opacity:0.65});}
 const a=Math.random()*Math.PI*2;const h={type:"tornado",x:SV.cx+Math.cos(a)*25,z:SV.cz+Math.sin(a)*25,r:3.2,g,tx:SV.cx,tz:SV.cz,t:0};g.position.set(h.x,0.3,h.z);sv.haz.push(h);}
function svAddImpact(x,z,big,color){const warn=mesh(new T.CircleGeometry(big?2.6:1.8,20),"#E2262B",x,0.35,z,ZONES.sobrevivir.g);warn.rotation.x=-Math.PI/2;warn.material=new T.MeshBasicMaterial({color:0xE2262B,transparent:true,opacity:0.5});
 const rock=sph(big?1.1:0.7,color||"#5A3A24",x,30,z,ZONES.sobrevivir.g);rock.material=M(color||"#5A3A24",color?"#7A2A00":"#000000");sv.haz.push({type:"impact",x,z,r:big?2.6:1.8,t:1.4,warn,rock});}
function svAddCrack(){const a=Math.random()*Math.PI*2,r=rnd(12,30);const x=SV.cx+Math.cos(a)*r,z=SV.cz+Math.sin(a)*r;const len=rnd(6,12),ang=Math.random()*Math.PI;
 const m=box(len,0.06,1.1,"#3A2A20",x,0.34,z,ZONES.sobrevivir.g);m.rotation.y=ang;sv.haz.push({type:"crack",x,z,len,ang,w:0.8,t:5,armed:1.1,m});}
function svAddLava(){const a=Math.random()*Math.PI*2,r=rnd(12,30);const x=SV.cx+Math.cos(a)*r,z=SV.cz+Math.sin(a)*r;const m=mesh(new T.CircleGeometry(1,24),"#F2462B",x,0.36,z,ZONES.sobrevivir.g);m.rotation.x=-Math.PI/2;m.material=M("#F2462B","#9A2A00");sv.haz.push({type:"lava",x,z,r:0.5,max:rnd(3,4.5),m,t:12});}
function svHits(h,x,z,y){
 if(h.type==="impact")return h.t<=0&&h.t>-0.15&&Math.hypot(x-h.x,z-h.z)<h.r&&y<6;
 if(h.type==="tornado")return Math.hypot(x-h.x,z-h.z)<h.r;
 if(h.type==="lava")return Math.hypot(x-h.x,z-h.z)<h.r&&y<0.8;
 if(h.type==="crack"&&h.armed<=0){const dx=x-h.x,dz=z-h.z;const ca=Math.cos(-h.ang),sa=Math.sin(-h.ang);const lx=dx*ca-dz*sa,lz=dx*sa+dz*ca;return Math.abs(lx)<h.len/2&&Math.abs(lz)<h.w&&y<0.8;}
 return false;}
function svElimPlayer(why){
 if(!sv.playerIn)return;
 if(S.surv.shield>0){S.surv.shield--;P.inv=2;toast("🛡️ ¡Su escudo lo salvó! Le quedan "+S.surv.shield);return;}
 if(P.inv>0)return;
 sv.playerIn=false;sv.streak=0;toast("💥 "+why+" · Lo sacaron de la ronda");teleport(SV.cx,SV.cz+45,0.4,Math.PI);
}
function svEnd(silent){
 sv.haz.forEach(h=>{rm(h.g);rm(h.warn);rm(h.rock);rm(h.m);});sv.haz=[];sv.water.visible=false;sv.waterY=-1;camShake=0;
 const alive=sv.bots.filter(b=>b.alive).length;
 if(!silent&&sv.state==="run"){
  if(sv.playerIn){sv.streak++;const v=earn(120+sv.streak*20,"sobrevivir");S.stats.survived++;giveMC(1);save();
   sheet("🏆 ¡Sobrevivió!",b=>{b.appendChild(el("div","res",sv.dis.icon+"<br>¡Sobrevivió a "+sv.dis.name.toLowerCase()+"!<br>+$ "+fmt(v)+" y 1 MediCoin"));b.appendChild(el("p","muted","Racha: "+sv.streak+" rondas seguidas · también sobrevivieron "+alive+" vecinos"));const k=el("button","btn go big","Otra ronda");k.onclick=()=>{closeSheet();svStart();};b.appendChild(k);},{half:true});}
  else sheet("Ronda terminada",b=>{b.appendChild(el("div","res",sv.dis.icon+"<br>Sobrevivieron "+alive+" vecinos"));b.appendChild(el("p","muted","Con un escudo 🛡️ puede salvarse una vez."));const r=el("div","row");const s=el("button","btn coinb","🛡️ Escudos");s.onclick=openShields;const k=el("button","btn go","Otra ronda");k.onclick=()=>{closeSheet();svStart();};r.append(s,k);b.appendChild(r);},{half:true});
 }
 sv.state="idle";sv.playerIn=false;svLobbyBots();
}
mode({id:"sobrevivir",dbg:sv,start:()=>svStart(),init:buildSurvive,update(dt){
 if(curZone.id!=="sobrevivir")return;
 const Z=ZONES.sobrevivir;Z.vtop.scale.setScalar(1+Math.sin(perf*3)*0.1);
 if(sv.state==="idle"){zoneButton("🌋 Camine al letrero para empezar una ronda",null);for(const b of sv.bots)animChar(b.ch,0,dt,false);return;}
 if(sv.state==="count"){sv.t-=dt;zoneButton(sv.dis.icon+" "+sv.dis.name+" en "+Math.ceil(sv.t)+"…",null);if(sv.t<=0)svBegin();}
 if(sv.state!=="run"&&sv.state!=="count")return;
 // vecinos
 for(const b of sv.bots){if(!b.alive)continue;
  if(sv.state==="run"&&sv.dis.id==="inundacion"&&b.climb){const d=Math.hypot(b.tx-b.x,b.tz-b.z);if(d<2.5){b.y=Math.min(4.3,b.y+dt*2.5);animChar(b.ch,1,dt,false);b.ch.g.position.set(b.x,b.y,b.z);continue;}}
  let dx=b.tx-b.x,dz=b.tz-b.z,d=Math.hypot(dx,dz);
  if(d<0.5||b.wait>0){b.wait-=dt;if(d<0.5&&!(sv.dis.id==="inundacion"&&b.climb)){const a=Math.random()*Math.PI*2,r=rnd(11,31);b.tx=SV.cx+Math.cos(a)*r;b.tz=SV.cz+Math.sin(a)*r;if(Math.random()<0.3)b.wait=rnd(0.5,1.5);}animChar(b.ch,0,dt,false);b.ch.g.position.set(b.x,b.y,b.z);continue;}
  const sp=4.2;b.x+=dx/d*sp*dt;b.z+=dz/d*sp*dt;b.ch.g.position.set(b.x,b.y,b.z);b.ch.g.rotation.y=Math.atan2(dx,dz);animChar(b.ch,sp,dt,false);}
 if(sv.state!=="run")return;
 sv.t-=dt;sv.spawnT-=dt;const id=sv.dis.id;
 if(id==="meteoros"&&sv.spawnT<=0){sv.spawnT=0.45;const near=Math.random()<0.4&&sv.playerIn;const a=Math.random()*Math.PI*2,r=rnd(0,SV.R-2);svAddImpact(near?P.x+rnd(-4,4):SV.cx+Math.cos(a)*r,near?P.z+rnd(-4,4):SV.cz+Math.sin(a)*r,Math.random()<0.3);}
 if(id==="volcan"){if(sv.spawnT<=0){sv.spawnT=0.8;const near=Math.random()<0.35&&sv.playerIn;const a=Math.random()*Math.PI*2,r=rnd(10,SV.R-2);svAddImpact(near?P.x+rnd(-3,3):SV.cx+Math.cos(a)*r,near?P.z+rnd(-3,3):SV.cz+Math.sin(a)*r,true,"#F2662B");if(Math.random()<0.45)svAddLava();}camShake=Math.max(camShake,0.05);}
 if(id==="terremoto"){camShake=Math.max(camShake,0.08);if(sv.spawnT<=0){sv.spawnT=1.2;svAddCrack();if(Math.random()<0.6){const a=Math.random()*Math.PI*2,r=rnd(8,SV.R-2);svAddImpact(SV.cx+Math.cos(a)*r,SV.cz+Math.sin(a)*r,false,"#8A7A6A");}}}
 if(id==="inundacion"){sv.waterY=Math.min(3.7,(45-sv.t)/25*3.7);sv.water.position.y=sv.waterY;}
 // peligros
 for(let i=sv.haz.length-1;i>=0;i--){const h=sv.haz[i];
  if(h.type==="impact"){h.t-=dt;h.rock.position.y=Math.max(0.6,30*(Math.max(0,h.t)/1.4));h.warn.material.opacity=0.3+0.4*Math.abs(Math.sin(perf*12));if(h.t<-0.4){rm(h.warn);rm(h.rock);sv.haz.splice(i,1);continue;}}
  if(h.type==="tornado"){h.t+=dt;if(Math.hypot(h.tx-h.x,h.tz-h.z)<1||Math.random()<0.005){const toP=sv.playerIn&&Math.random()<0.35;const a=Math.random()*Math.PI*2,r=rnd(5,SV.R-3);h.tx=toP?P.x:SV.cx+Math.cos(a)*r;h.tz=toP?P.z:SV.cz+Math.sin(a)*r;}
   const dx=h.tx-h.x,dz=h.tz-h.z,d=Math.hypot(dx,dz)||1;h.x+=dx/d*4.6*dt;h.z+=dz/d*4.6*dt;h.g.position.set(h.x,0.3,h.z);h.g.rotation.y+=dt*6;}
  if(h.type==="lava"){h.r=Math.min(h.max,h.r+dt*0.9);h.m.scale.setScalar(h.r);h.t-=dt;if(h.t<0){rm(h.m);sv.haz.splice(i,1);continue;}}
  if(h.type==="crack"){h.armed-=dt;h.t-=dt;if(h.armed<=0)h.m.material=M("#F2462B","#9A2A00");if(h.t<0){rm(h.m);sv.haz.splice(i,1);continue;}}
  if(sv.playerIn&&svHits(h,P.x,P.z,P.y))svElimPlayer(h.type==="tornado"?"¡Lo atrapó el tornado!":h.type==="lava"||h.type==="crack"?"¡Pisó la lava!":"¡Le cayó una roca!");
  for(const b of sv.bots)if(b.alive&&svHits(h,b.x,b.z,b.y)){b.alive=false;b.ch.g.visible=false;}
 }
 if(id==="inundacion"&&sv.waterY>0.6){if(sv.playerIn&&P.y<sv.waterY-0.2){P.wet=(P.wet||0)+dt;if(P.wet>1.5){P.wet=0;svElimPlayer("¡El agua lo alcanzó!");}}else P.wet=0;
  for(const b of sv.bots)if(b.alive&&b.y<sv.waterY-0.2){b.alive=false;b.ch.g.visible=false;}}
 const alive=sv.bots.filter(b=>b.alive).length+(sv.playerIn?1:0);
 zoneButton(sv.dis.icon+" "+sv.dis.name+" · ⏱ "+Math.max(0,Math.ceil(sv.t))+" · 👥 "+alive+"/8"+(sv.playerIn?"":" · Usted salió"),null);
 if(sv.t<=0)svEnd(false);
}});
