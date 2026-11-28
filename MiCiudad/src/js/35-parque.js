/* ================= PARQUE INFANTIL: TRAMPOLÍN, TOBOGÁN, COLUMPIOS, CARRUSEL ================= */
const PG={tramp:{x:-17,z:13},slide:{x:17,z:-15},swing:{x:-16,z:20},caro:{x:18,z:2}};
let carousel=null,caroDisc=null,swingSeats=[],slideRun=null,swingRun=null;
function buildPlayground(){ROOT=ZONES.city.g;
 // trampolín
 const t=PG.tramp;const tg=grp(t.x,0.3,t.z);const ring=mesh(new T.TorusGeometry(1.8,0.18,8,28),"#2E7BEF",0,0.75,0,tg);ring.rotation.x=Math.PI/2;
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2;cyl(0.08,0.08,0.75,"#3E4B59",Math.cos(a)*1.75,0.37,Math.sin(a)*1.75,tg,6);}
 const pad=cyl(1.65,1.65,0.08,"#FF4FA3",0,0.72,0,tg,28);const st=cyl(0.5,0.5,0.09,"#FFFFFF",0,0.74,0,tg,16);
 const net=mesh(new T.CylinderGeometry(1.85,1.85,1.6,24,1,true),"#FFFFFF",0,1.6,0,tg);net.material=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.18,side:T.DoubleSide,depthWrite:false});
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2+0.5;cyl(0.05,0.05,1.7,"#2E7BEF",Math.cos(a)*1.85,1.6,Math.sin(a)*1.85,tg,6);}
 addPlat(t.x,1.06,t.z,2.8,0.1,2.8,"#FF4FA3",{bounce:15,onLand(){sfx("boing");retoAdd("trampolin",1);pad.scale.y=0.3;setTimeout(()=>pad.scale.y=1,120);}}).mesh.visible=false;
 signMesh("🤸 Trampolín","#2E7BEF",2.6,t.x,3.8,t.z-2.2,0);
 // tobogán con escalera
 const s=PG.slide;const sg=grp(s.x,0.3,s.z);
 for(const sx of [-0.8,0.8])for(const sz of [-0.8,0.8])cyl(0.1,0.1,3.4,"#F5C518",sx,1.7,sz,sg,8);
 const roof=cone(1.5,1.2,"#E2465C",0,4.0,0,sg,4);roof.rotation.y=Math.PI/4;
 const ramp=box(1.1,0.12,4.6,"#19A858",0,1.55,2.75,sg);ramp.rotation.x=0.62;for(const sx of [-0.55,0.55]){const w=box(0.1,0.35,4.6,"#14B8A6",sx,1.72,2.75,sg);w.rotation.x=0.62;}
 addPlat(s.x,3.0,s.z,1.8,0.2,1.8,"#7B4BD1",{});
 for(let i=0;i<7;i++)addPlat(s.x,0.3+0.385*(i+1)-(i===6?0.02:0),s.z-0.9-0.32*(7-i)+0.16,1.5,0.12,0.34,i%2?"#C9A7FF":"#7B4BD1",{});
 addCol(s.x,s.z+2.75,1.3,4.2,1.2);
 signMesh("🛝 Tobogán","#19A858",2.4,s.x,4.9,s.z,0);
 spot({x:s.x,z:s.z,r:1.6,label:"🛝 ¡Tirarse por el tobogán!",when:()=>P.y>2.5,fn:startSlide});
 // columpios
 const w=PG.swing;const wg=grp(w.x,0.3,w.z);for(const sx of [-2.6,2.6]){const a=box(0.18,4.4,0.18,"#F28C28",sx,2.1,-0.7,wg);a.rotation.x=0.18;const b=box(0.18,4.4,0.18,"#F28C28",sx,2.1,0.7,wg);b.rotation.x=-0.18;}
 box(5.6,0.2,0.2,"#F28C28",0,4.25,0,wg);
 for(const sx of [-1.2,1.2]){const pv=new T.Group();pv.position.set(sx,4.2,0);wg.add(pv);box(0.04,2.9,0.04,"#9DB4C8",-0.42,-1.45,0,pv);box(0.04,2.9,0.04,"#9DB4C8",0.42,-1.45,0,pv);box(1.0,0.12,0.5,sx<0?"#FF4FA3":"#2E7BEF",0,-2.9,0,pv);swingSeats.push(pv);}
 addCol(w.x-2.6,w.z,0.5,1.8);addCol(w.x+2.6,w.z,0.5,1.8);
 signMesh("🎠 Columpios","#F28C28",2.4,w.x,5.1,w.z,0);
 spot({x:w.x,z:w.z+1.6,r:2.6,label:"🎠 Columpiarse",fn:startSwing});
 // carrusel que gira
 const c=PG.caro;caroDisc=grp(c.x,0.3,c.z);const disc=cyl(2.6,2.6,0.3,"#F5C518",0,0.45,0,caroDisc,32);
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const wedge=box(2.4,0.04,0.5,i%2?"#FF4FA3":"#2E7BEF",Math.cos(a)*1.25,0.62,Math.sin(a)*1.25,caroDisc);wedge.rotation.y=-a;}
 cyl(0.15,0.15,2.4,"#E2465C",0,1.6,0,caroDisc,8);for(let i=0;i<4;i++){const a=i/4*Math.PI*2;const h=tubeBetween(caroDisc,new T.Vector3(0,2.6,0),new T.Vector3(Math.cos(a)*2.2,1.4,Math.sin(a)*2.2),0.05,"#E2465C");cyl(0.05,0.05,0.8,"#E2465C",Math.cos(a)*2.2,1.0,Math.sin(a)*2.2,caroDisc,6);}
 carousel=addPlat(c.x,0.62,c.z,4.6,0.2,4.6,"#F5C518",{});carousel.mesh.visible=false;
 signMesh("🎡 Carrusel","#E2465C",2.4,c.x,4.0,c.z-3,0);
 ROOT=scene;}
function startSlide(){if(slideRun||player.fall>0)return;const s=PG.slide;slideRun={t:0,x0:s.x,z0:s.z+0.6,y0:3.0};P.lock=true;P.face=0;sfx("boing");}
function startSwing(){if(swingRun)return;if(vehicleObj){toast("Bájese del vehículo primero");return;}const w=PG.swing;swingRun={t:0,seat:swingSeats[0],x:w.x-1.2,z:w.z};P.lock=true;P.face=0;toast("🎠 ¡Weee! Toque Saltar para bajarse");}
function updatePlayground(dt){
 if(caroDisc){caroDisc.rotation.y+=dt*0.9;if(P.plat===carousel&&P.ground){const c=PG.caro;const dx=P.x-c.x,dz=P.z-c.z;const a=-dt*0.9;const nx=c.x+dx*Math.cos(a)-dz*Math.sin(a),nz=c.z+dx*Math.sin(a)+dz*Math.cos(a);P.x=nx;P.z=nz;P.face+=-a;}}
 if(slideRun){const r=slideRun;r.t+=dt;const k=Math.min(1,r.t/1.3);const e=k*k;P.x=r.x0;P.z=r.z0+e*4.6;P.y=r.y0-e*2.9+0.3*(1-k);P.vy=0;P.face=0;
  player.legs.forEach(l=>l.rotation.x=-1.4);player.arms.forEach(a=>a.rotation.x=-2.8);player.g.position.set(P.x,P.y,P.z);player.g.rotation.y=0;
  if(k>=1){slideRun=null;P.lock=false;P.y=0.3;P.z+=0.8;retoAdd("tobogan",1);toast("🛝 ¡Weee!");}}
 for(const sw of swingSeats)if(!swingRun||sw!==swingRun.seat)sw.rotation.x*=0.98;
 if(swingRun){const r=swingRun;r.t+=dt;const a=Math.sin(r.t*2.2)*Math.min(0.8,0.2+r.t*0.12);r.seat.rotation.x=a;
  const py=4.5-Math.cos(a)*2.9,pz=r.z+Math.sin(a)*2.9;P.x=r.x;P.z=pz;P.y=py-0.95;P.vy=0;P.face=0;
  player.g.position.set(P.x,P.y,P.z);player.g.rotation.y=0;player.body.rotation.x=a*0.6;player.legs.forEach(l=>l.rotation.x=-1.4+a*0.6);player.arms.forEach(q=>q.rotation.x=-2.6);
  if(r.t>12||r.stop){swingRun=null;P.lock=false;P.y=0.3;P.z=r.z+2;player.body.rotation.x=0;}}
}
mode({id:"parque",init(){buildPlayground();},update(dt){if(curZone&&curZone.id==="city")updatePlayground(dt);}});
