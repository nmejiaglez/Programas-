/* ================= POLICÍAS Y LADRONES ================= */
const pol={on:false,t:0,robbers:[],caught:0};
function kiosk(x,z,color,text,icon){ROOT=ZONES.city.g;const g=grp(x,0.3,z);box(5,3.6,4,color,0,1.8,0,g);box(5.6,0.5,4.6,"#FFFFFF",0,3.85,0,g);box(1.6,2.4,0.2,"#2D3B4A",0,1.2,2.05,g);
 const sp=emojiSprite(icon,2.2);sp.position.y=5.4;g.add(sp);signMesh(text,color,4.4,x,3,z+2.2,0);addCol(x,z,5,4,4);ROOT=scene;}
function buildPolice(){
 kiosk(-17,-17,"#2A4C8F","🚓 Policía","👮");
 spot({x:-17,z:-14.2,r:2.8,label:()=>pol.on?"🚓 Persecución en marcha":"🚓 Atrapar ladrones",fn:()=>{if(!pol.on)polIntro();}});
 PLACES.push({icon:"🚓",name:"Estación de Policía",desc:"Atrapar ladrones traviesos",x:-17,z:-14});
}
function polIntro(){intro("Estación de Policía","🚓","¡Tres ladrones traviesos se llevaron bolsas de dinero del banco! Siga la flecha y tóquelos para atraparlos. Corren rápido: con patineta o carro es más fácil. Tiene 2 minutos 30 segundos.",polStart);}
function polStart(){closeSheet();pol.on=true;pol.t=150;pol.caught=0;
 pol.robbers.forEach(r=>rm(r.ch.g));pol.robbers=[];
 for(let i=0;i<3;i++){const look={skin:i%4,hair:0,hstyle:"corto",shirt:"s12",pants:"p2",hat:"none",acc:"mochila",face:"antifaz",neck:"none"};const ch=makeChar(look);ZONES.city.g.add(ch.g);
  let bi=0,bj=0,best=-1;for(let k=0;k<20;k++){const a=Math.floor(Math.random()*6),b=Math.floor(Math.random()*6);const d=Math.hypot(LINES[a]-P.x,LINES[b]-P.z);if(d>best){best=d;bi=a;bj=b;}}
  const tag=labelSprite("💰 Ladrón","rgba(226,70,92,.9)","#fff");tag.position.y=3.5;tag.scale.set(2.6,0.65,1);ch.g.add(tag);
  pol.robbers.push({ch,i:bi,j:bj,ti:bi,tj:bj,x:LINES[bi],z:LINES[bj],caught:false});}
 toast("🚨 ¡Atrápelos!");}
function polEnd(win){pol.on=false;pol.robbers.forEach(r=>rm(r.ch.g));pol.robbers=[];zoneButton(null);S.stats.jobs++;
 if(win){const v=earn(200,"policia");giveMC(2);sheet("🏅 ¡Ciudad segura!",b=>{b.appendChild(el("div","res","🚓<br>¡Atrapó a los 3 ladrones!<br>+$ "+fmt(v)+" de premio y 2 MediCoins"));const k=el("button","btn go big","¡Genial!");k.onclick=closeSheet;b.appendChild(k);},{half:true});}
 else toast("⏰ Se acabó el tiempo. Atrapó "+pol.caught+" de 3.");save();}
mode({id:"policia",dbg:pol,init:buildPolice,
 arrow(){if(!pol.on||curZone.id!=="city")return null;let best=null,bd=1e9;for(const r of pol.robbers){if(r.caught)continue;const d=Math.hypot(r.x-P.x,r.z-P.z);if(d<bd){bd=d;best=r;}}return best?{x:best.x,z:best.z,name:"ladrón"}:null;},
 update(dt){
  if(!pol.on)return;
  if(curZone.id!=="city"){polEnd(false);return;}
  pol.t-=dt;
  for(const r of pol.robbers){if(r.caught)continue;
   const tx=LINES[r.ti],tz=LINES[r.tj];const dx=tx-r.x,dz=tz-r.z,d=Math.hypot(dx,dz);
   if(d<0.15){r.i=r.ti;r.j=r.tj;const opts=[];for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ni=r.i+di,nj=r.j+dj;if(ni<0||nj<0||ni>5||nj>5)continue;opts.push([ni,nj,Math.hypot(LINES[ni]-P.x,LINES[nj]-P.z)+Math.random()*12]);}
    opts.sort((a,b)=>b[2]-a[2]);r.ti=opts[0][0];r.tj=opts[0][1];continue;}
   const near=Math.hypot(r.x-P.x,r.z-P.z)<22;const sp=near?5.6:2.8;const st=Math.min(d,sp*dt);r.x+=dx/d*st;r.z+=dz/d*st;
   r.ch.g.position.set(r.x,0.3,r.z);r.ch.g.rotation.y=Math.atan2(dx,dz);animChar(r.ch,sp,dt,false);
   if(Math.hypot(r.x-P.x,r.z-P.z)<1.9){r.caught=true;pol.caught++;S.stats.thieves++;rm(r.ch.g);const v=earn(80,"policia");toast("🚓 ¡Atrapado! +$"+v);}
  }
  const s=Math.max(0,Math.ceil(pol.t));zoneButton("🚓 Ladrones: "+pol.caught+"/3 · ⏱ "+Math.floor(s/60)+":"+String(s%60).padStart(2,"0"),null);
  if(pol.caught>=3)polEnd(true);else if(pol.t<=0)polEnd(false);
 }});
