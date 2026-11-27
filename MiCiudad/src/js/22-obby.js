/* ================= TORRE DE OBSTÁCULOS ================= */
const OB={cx:0,cz:-330,R:20,a0:Math.PI/2,da:0.9,H:2.7,stages:12};
const ob={cp:0,reached:0,t0:0,running:false,pads:[],movers:[],vanish:[],stageType:[]};
const OB_TYPES=["escalones","movil","desaparecen","trampolin","lava","angostos","elevador","giratorio"];
const OB_NAMES={escalones:"Escalones",movil:"Plataformas que se mueven",desaparecen:"Pisos que desaparecen",trampolin:"Trampolín",lava:"Cuidado con la lava",angostos:"Pisos angostos",elevador:"Elevador",giratorio:"Plataformas que giran"};
const OB_COLORS=["#FF4FA3","#2E7BEF","#F5B21B","#19A858","#7B4BD1","#F28C28","#14B8A6","#E2465C"];
function obPt(k,t){const a=OB.a0+(k+t)*OB.da;return {x:OB.cx+Math.cos(a)*OB.R,z:OB.cz+Math.sin(a)*OB.R,y:0.3+(k+t)*OB.H,a};}
function obRadial(p,off){return {x:p.x+Math.cos(p.a)*off,z:p.z+Math.sin(p.a)*off};}
function zoneButton(text,fn){const b=$("zbtn");if(!text){b.hidden=true;return;}b.hidden=false;if(b.textContent!==text)b.textContent=text;b.onclick=fn;}
function buildObby(){
 const Z=zone({id:"obby",name:"Torre de Obstáculos",icon:"🧗",desc:"Salte hasta la cima sin caerse",cx:OB.cx,cz:OB.cz,hw:58,hd:58,floor:false,killY:-6,spawn:{x:OB.cx,z:OB.cz+36,y:0.5,face:Math.PI},sky:0xC9B8F5,noVehicle:true,
  onEnter(){ob.cp=0;ob.reached=0;ob.running=false;S.riding=false;buildPlayer();},onLeave(){zoneButton(null);},onFall(){obRespawn();}});
 ROOT=Z.g;
 // base
 addPlat(OB.cx,0.3,OB.cz,96,1,96,"#7FCB60");
 const col=cyl(11,12,OB.stages*OB.H+6,"#8E7CE8",OB.cx,(OB.stages*OB.H+6)/2,OB.cz,null,24);
 addCol(OB.cx,OB.cz,22,22);
 for(let i=0;i<OB.stages*OB.H+6;i+=3){const r=cyl(11.2,11.2,0.4,OB_COLORS[(i/3)%8|0],OB.cx,i+1,OB.cz,null,24);}
 signMesh("🧗 Torre de Obstáculos","#7B4BD1",12,OB.cx,6,OB.cz+12.2,0);
 // bus y salida
 const bs=grp(OB.cx+8,0.3,OB.cz+36);box(4.4,0.2,1.8,"#2E7BEF",0,3,0,bs);box(0.15,3,0.15,"#3E4B59",-2,1.5,-0.7,bs);box(0.15,3,0.15,"#3E4B59",2,1.5,-0.7,bs);
 spot({zone:"obby",x:OB.cx+8,z:OB.cz+34,r:3,label:"🚌 Viajar en bus",fn:openPlaces});
 // tipos de etapa al azar, la primera siempre fácil
 const order=[ "escalones",...OB_TYPES.filter(t=>t!=="escalones").sort(()=>Math.random()-0.5)];while(order.length<OB.stages)order.push(OB_TYPES[order.length%OB_TYPES.length]);
 ob.stageType=order.slice(0,OB.stages);
 // almohadillas de control
 for(let k=0;k<=OB.stages;k++){const p=obPt(k,0);const last=k===OB.stages;
  const pad=addPlat(p.x,p.y,p.z,last?6:3.8,0.6,last?6:3.8,last?"#F5C518":k===0?"#FFFFFF":"#3BC46F");
  if(last){pad.mesh.material=M("#F5C518","#5A4000");const tr=emojiSprite("🏆",2.2);tr.position.set(p.x,p.y+2,p.z);Z.g.add(tr);}
  else{const n=emojiSprite(k===0?"🏁":"🚩",1.2);n.position.set(p.x,p.y+1.6,p.z);Z.g.add(n);}
  pad.onLand=()=>obReach(k);ob.pads.push(pad);}
 // rampa de inicio desde la base hasta la primera almohadilla
 const p0=obPt(0,0);
 // etapas
 for(let k=0;k<OB.stages;k++)buildStage(k,ob.stageType[k],OB_COLORS[k%8]);
 spot({zone:"obby",x:p0.x,z:p0.z,r:2.5,label:"🏁 Empezar la torre",when:()=>!ob.running&&P.y<1.5,fn:()=>{ob.running=true;ob.cp=0;ob.reached=0;ob.t0=performance.now();toast("¡Vamos! Llegue a la 🏆 de arriba");}});
 ROOT=scene;
}
function buildStage(k,type,c){
 const n=type==="trampolin"||type==="elevador"?2:4;
 for(let i=1;i<=n;i++){const t=i/(n+1);const p=obPt(k,t);
  if(type==="escalones")addPlat(p.x,p.y,p.z,2.4,0.5,2.4,c);
  if(type==="angostos"){const q=obRadial(p,(i%2?1:-1)*1.2);addPlat(q.x,p.y,q.z,1.2,0.5,1.2,c);}
  if(type==="movil"){const pl=addPlat(p.x,p.y,p.z,2.4,0.5,2.4,c);ob.movers.push({pl,kind:"radial",p,amp:2.6,ph:i*1.7,sp:1.3});}
  if(type==="giratorio"){const pl=addPlat(p.x,p.y,p.z,2.2,0.5,2.2,c);ob.movers.push({pl,kind:"circle",p,amp:1.6,ph:i*2.1,sp:1.6});}
  if(type==="desaparecen"){const pl=addPlat(p.x,p.y,p.z,2.4,0.4,2.4,c);pl.mesh.material=new T.MeshLambertMaterial({color:c,transparent:true,opacity:1});pl.onLand=()=>{if(!pl.vt)pl.vt=0.9;};ob.vanish.push(pl);}
  if(type==="lava"){const safe=Math.random()<0.5?1:-1;for(const s of [1,-1]){const q=obRadial(p,s*1.5);const pl=addPlat(q.x,p.y,q.z,1.9,0.5,1.9,s===safe?c:"#E2262B");if(s!==safe){pl.mesh.material=M("#E2262B","#7A0A00");pl.onStand=()=>{toast("🔥 ¡Lava! Vuelva a intentar");obRespawn();};}}}
  if(type==="trampolin"){if(i===1){const pl=addPlat(p.x,p.y-0.4,p.z,2.4,0.4,2.4,"#FF4FA3");pl.bounce=12.5;const sp=cyl(1,1,0.2,"#FFFFFF",p.x,p.y-0.25,p.z,null,16);}else addPlat(p.x,obPt(k,1).y-0.6,p.z,2.6,0.5,2.6,c);}
  if(type==="elevador"){if(i===1)addPlat(p.x,p.y,p.z,2.6,0.5,2.6,c);else{const pl=addPlat(p.x,p.y,p.z,2.6,0.5,2.6,"#C9D3DC");ob.movers.push({pl,kind:"vertical",p,y0:obPt(k,1/3).y,y1:obPt(k,1).y,ph:0,sp:0.9});}}
 }
}
function obReach(k){
 if(!ob.running){ob.running=true;ob.t0=performance.now();}
 if(k>ob.cp)ob.cp=k;
 if(k>ob.reached){ob.reached=k;
  if(k===OB.stages){const secs=Math.round((performance.now()-ob.t0)/1000);const v=earn(500,"obby");S.stats.obby++;let extra="";if(S.obby.daily!==todayStr()){S.obby.daily=todayStr();giveMC(5,"primera torre del día");extra=" + 5 MediCoins";}
   if(!S.obby.best||secs<S.obby.best)S.obby.best=secs;save();ob.running=false;
   sheet("🏆 ¡Llegó a la cima!",b=>{b.appendChild(el("div","res","🏆<br>"+fmtTime(secs)+"<br>+$ "+fmt(v)+extra));b.appendChild(el("p","muted","Mejor tiempo: "+fmtTime(S.obby.best)));const r=el("div","row");const a=el("button","btn ghost","Bajar");a.onclick=()=>{closeSheet();teleport(OB.cx,OB.cz+34,0.5,Math.PI);};const c=el("button","btn go","Quedarme");c.onclick=closeSheet;r.append(a,c);b.appendChild(r);},{half:true});}
  else{const v=earn(25*k,"obby");toast("🚩 Etapa "+k+" · +$"+v);}
 }
}
function obRespawn(){const p=obPt(ob.cp,0);P.vy=0;P.hp=P.maxHp;P.dead=false;teleport(p.x,p.z,p.y+0.3,P.face);}
function obSkip(){
 if(ob.cp>=OB.stages)return;
 sheet("⏭️ Saltar etapa",b=>{b.appendChild(el("p","","Pase directo a la siguiente bandera."));const k=el("button","btn coinb big",'Saltar · <span class="coin sm"></span> 5');k.onclick=()=>{if(!pay({p:5,cur:"mc"}))return;closeSheet();ob.cp++;const p=obPt(ob.cp,0);teleport(p.x,p.z,p.y+0.3,P.face,()=>obReach(ob.cp));};b.appendChild(k);},{half:true});
}
mode({id:"obby",dbg:ob,init:buildObby,update(dt){
 if(curZone.id!=="obby")return;
 const tt=perf;
 for(const m of ob.movers){
  if(m.kind==="radial"){const o=Math.sin(tt*m.sp+m.ph)*m.amp;const q=obRadial(m.p,o);movePlat(m.pl,q.x,m.p.y,q.z);}
  if(m.kind==="circle"){const a=tt*m.sp+m.ph;movePlat(m.pl,m.p.x+Math.cos(a)*m.amp,m.p.y,m.p.z+Math.sin(a)*m.amp);}
  if(m.kind==="vertical"){const f=(Math.sin(tt*m.sp+m.ph)+1)/2;movePlat(m.pl,m.p.x,m.y0+(m.y1-m.y0+0.2)*f,m.p.z);}
 }
 for(const v of ob.vanish){
  if(v.vt>0){v.vt-=dt;v.mesh.material.opacity=Math.max(0.15,v.vt/0.9);if(v.vt<=0){v.off=true;v.mesh.visible=false;v.back=3;}}
  else if(v.back>0){v.back-=dt;if(v.back<=0){v.off=false;v.mesh.visible=true;v.mesh.material.opacity=1;v.vt=0;}}
 }
 // si cae a la base después de empezar, vuelve a su bandera
 if(ob.running&&ob.cp>0&&P.ground&&P.y<0.6)obRespawn();
 const secs=ob.running?Math.floor((performance.now()-ob.t0)/1000):0;
 zoneButton(ob.running?"🚩 Etapa "+ob.cp+"/"+OB.stages+" · "+fmtTime(secs)+" · ⏭️ Saltar":"🧗 Camine a la 🏁 para empezar",ob.running?obSkip:null);
}});
