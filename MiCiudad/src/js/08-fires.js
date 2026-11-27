/* ---------- Incendios y navegación ---------- */
let mission=null;const fireObjs=[];
function makeFire(x,z){const g=new T.Group();g.position.set(x,0.3,z);ZONES.city.g.add(g);
 const parts=[];for(let i=0;i<5;i++){const c=cone(0.6+Math.random()*0.4,1.6+Math.random(),i%2?"#F5B21B":"#F2662B",(Math.random()-0.5)*1.2,0.9,(Math.random()-0.5)*1.2,g,8);c.material=M(i%2?"#F5B21B":"#F2662B",i%2?"#8A5A00":"#7A2A00");parts.push(c);}
 box(1.6,0.3,1.6,"#3E2A1E",0,0.15,0,g);return {g,parts,x,z};}
function startFires(){if(mission)return;closeSheet();mission={left:5,total:5,time:120,fires:[]};for(let i=0;i<5;i++){const [x,z]=freeSpot(2);mission.fires.push(makeFire(x,z));}toast("🚒 ¡Apague los 5 incendios!");}
function updateFires(dt){if(!mission)return;mission.time-=dt;
 for(let i=mission.fires.length-1;i>=0;i--){const f=mission.fires[i];f.parts.forEach((p,k)=>{p.scale.y=0.8+Math.sin(perf*10+k*2)*0.25;});
  if(Math.hypot(f.x-P.x,f.z-P.z)<2.6){rm(f.g);mission.fires.splice(i,1);mission.left--;S.stats.fires++;const v=earn(60,"bomberos");pop("🧯 +$"+v);}}
 const b=$("banner");b.hidden=false;const s=Math.max(0,Math.ceil(mission.time));b.textContent="🔥 Incendios: "+mission.left+" · "+Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
 if(mission.left<=0){const v=earn(150,"bomberos");S.mc+=3;S.stats.jobs++;b.hidden=true;mission=null;toast("🏆 ¡Ciudad a salvo! +$"+v+" y +3 MediCoins");save();}
 else if(mission.time<=0){mission.fires.forEach(f=>rm(f.g));b.hidden=true;mission=null;toast("⏰ Se acabó el tiempo. Intente de nuevo en Bomberos.");}}
let navTarget=null;
const arrow=new T.Group();{const c=cone(0.45,1.2,"#F5B21B",0,0,0,arrow,12);c.rotation.x=Math.PI/2;c.material=M("#F5B21B","#6A4A00");scene.add(arrow);arrow.visible=false;}
function updateArrow(){let t=curZone.id==="city"?navTarget:null;
 for(const m of MODES){if(m.arrow){const r=m.arrow();if(r){t=r;break;}}}
 if(mission&&mission.fires.length&&curZone.id==="city"){let best=null,bd=1e9;for(const f of mission.fires){const d=Math.hypot(f.x-P.x,f.z-P.z);if(d<bd){bd=d;best=f;}}t={x:best.x,z:best.z};}
 if(!t){arrow.visible=false;return;}
 const dx=t.x-P.x,dz=t.z-P.z,d=Math.hypot(dx,dz);
 if(t===navTarget&&d<4){navTarget=null;arrow.visible=false;toast("📍 Llegó a "+t.name);return;}
 arrow.visible=true;arrow.position.set(P.x,P.y+4.8+Math.sin(perf*4)*0.15,P.z);arrow.rotation.y=Math.atan2(dx,dz);}

