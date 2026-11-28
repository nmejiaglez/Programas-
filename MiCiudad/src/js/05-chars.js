/* ---------- Personajes ---------- */
function capsule(r,len,c,x,y,z,p){const g=new T.Group();g.position.set(x,y,z);p.add(g);cyl(r,r,len,c,0,0,0,g,12);sph(r,c,0,len/2,0,g,12,8);sph(r,c,0,-len/2,0,g,12,8);return g;}
const EYE_HI=new T.MeshBasicMaterial({color:0xffffff});
function makeChar(look){
 const L=look;const g=new T.Group();
 const skin=SKINS[L.skin]||SKINS[0],hair=L.hairC||HAIRS[L.hair]||HAIRS[0];
 const sItem=SHIRTS.find(s=>s.id===L.shirt)||SHIRTS[0];const shirt=L.shirtC||sItem.c;
 const pItem=PANTS.find(s=>s.id===L.pants)||PANTS[0],pants=pItem.skirt?skin:(L.pantsC||pItem.c);
 const shoe=L.shoeC||"#F4F6FA",sole="#3E4B59";
 const body=new T.Group();g.add(body);
 // piernas y zapatos
 const legs=[];for(const s of [-1,1]){const pv=new T.Group();pv.position.set(s*0.19,0.92,0);body.add(pv);
  cyl(0.15,0.13,0.62,pants,0,-0.3,0,pv,12);sph(0.15,pants,0,0,0,pv,10,8);
  const sh=sph(0.17,shoe,0,-0.66,0.06,pv,12,8);sh.scale.set(1,0.62,1.45);const so=cyl(0.16,0.17,0.06,sole,0,-0.74,0.07,pv,12);so.scale.z=1.4;legs.push(pv);}
 // torso redondeado
 const tor=new T.Group();tor.position.y=1.3;body.add(tor);
 const tg=cyl(0.38,0.44,0.78,L.shirtC||sItem.c,0,0,0,tor,18);tg.scale.z=0.74;
 const tt=sph(0.38,shirt,0,0.39,0,tor,18,10);tt.scale.set(1,0.42,0.74);
 const tb=sph(0.44,pItem.skirt?shirt:pants,0,-0.39,0,tor,18,10);tb.scale.set(1,0.3,0.74);
 const belt=cyl(0.445,0.445,0.12,pItem.skirt?shirt:pants,0,-0.33,0,tor,18);belt.scale.z=0.75;
 // cuello
 cyl(0.13,0.15,0.16,skin,0,1.76,0,body,12);
 if(pItem.skirt){const sk=mesh(new T.CylinderGeometry(0.42,pItem.gala?0.95:0.7,pItem.gala?1.5:0.6,20),pItem.c,0,pItem.gala?0.4:0.7,0,body);sk.scale.z=0.86;
  const fr=mesh(new T.TorusGeometry(pItem.gala?0.93:0.68,0.04,6,24),"#FFFFFF",0,pItem.gala?-0.34:0.41,0,body);fr.rotation.x=Math.PI/2;fr.scale.y=0.86;}
 if(L.shirt==="s9"){box(0.1,0.6,0.02,"#2E7BEF",0.17,1.33,0.33,body);sph(0.06,"#9DB4C8",-0.2,1.5,0.31,body);for(const s of [-1,1]){const c=box(0.18,0.3,0.03,"#E9EEF2",s*0.12,1.62,0.3,body);c.rotation.z=s*0.5;}}
 if(L.shirt==="s12"){for(let i=0;i<4;i++){const r=cyl(0.445,0.445,0.07,"#2E7BEF",0,1.0+i*0.18,0,body,18);r.scale.z=0.76;}}
 if(L.shirt==="s14"){["#F5C518","#19A858","#2E7BEF","#7B4BD1"].forEach((c,i)=>{const r=cyl(0.445,0.445,0.12,c,0,1.02+i*0.17,0,body,18);r.scale.z=0.76;});}
 // brazos
 const arms=[];for(const s of [-1,1]){const pv=new T.Group();pv.position.set(s*0.5,1.62,0);body.add(pv);
  sph(0.15,shirt,0,0,0,pv,10,8);cyl(0.13,0.12,0.36,shirt,0,-0.2,0,pv,10);cyl(0.1,0.095,0.3,skin,0,-0.48,0,pv,10);sph(0.12,skin,0,-0.66,0.02,pv,10,8);pv.rotation.z=s*0.08;arms.push(pv);}
 // cabeza
 const head=new T.Group();head.position.set(0,2.27,0);head.scale.setScalar(1.17);body.add(head);
 const hs=sph(0.46,skin,0,0,0,head,24,18);hs.scale.set(1.04,0.97,1);
 for(const s of [-1,1])sph(0.08,skin,s*0.47,-0.02,0,head,8,6).scale.z=0.6;
 const eyeC=L.eyeC||EYES[L.eyes||0]||EYES[0];const eyes=[];
 for(const s of [-1,1]){const eg=new T.Group();eg.position.set(s*0.165,0.0,0.4);head.add(eg);
  const e=sph(0.085,eyeC,0,0,0,eg,12,10);e.scale.set(0.9,1.2,0.55);
  const hi=new T.Mesh(new T.SphereGeometry(0.028,8,6),EYE_HI);hi.position.set(-s*0.02+0.02,0.04,0.045);eg.add(hi);
  const h2=new T.Mesh(new T.SphereGeometry(0.014,6,4),EYE_HI);h2.position.set(0.0,-0.04,0.045);eg.add(h2);
  eyes.push(eg);
  const br=box(0.13,0.025,0.03,hair,s*0.17,0.17,0.42,head);br.rotation.z=-s*0.12;
  const ck=sph(0.075,"#FF9EAA",s*0.27,-0.12,0.35,head,10,8);ck.scale.set(1.15,0.7,0.35);ck.material=M("#FF9EAA");}
 const mouth=mesh(new T.TorusGeometry(0.065,0.018,6,14,Math.PI),"#8A2F3B",0,-0.13,0.43,head);mouth.rotation.z=Math.PI;
 const nose=sph(0.035,skin,0,-0.05,0.455,head,8,6);
 // pelo
 const hc=new T.Mesh(new T.SphereGeometry(0.5,22,14,0,Math.PI*2,0,Math.PI*0.5),M(hair));hc.rotation.x=-0.42;hc.position.set(0,0.04,-0.02);hc.castShadow=true;head.add(hc);
 const st=L.hstyle||"corto";
 if(st!=="punta"&&st!=="rizado"){for(let i=0;i<5;i++){const bx=-0.3+i*0.15;const f=sph(0.13,hair,bx,0.3-Math.abs(bx)*0.15,0.3,head,10,8);f.scale.set(1,0.75,0.6);f.rotation.z=0.3;}}
 for(const s of [-1,1]){const sd=sph(0.17,hair,s*0.4,0.08,-0.05,head,10,8);sd.scale.set(0.5,1.1,0.9);}
 if(st==="largo"||st==="trenzas"||st==="melena"){const bk=sph(0.5,hair,0,-0.12,-0.12,head,16,12);bk.scale.set(1,1.05,0.75);}
 if(st==="largo"){const lg=box(0.86,0.9,0.3,hair,0,-0.5,-0.26,head);for(const s of [-1,1]){const sl=box(0.16,0.8,0.24,hair,s*0.42,-0.42,0.02,head);}sph(0.43,hair,0,-0.95,-0.26,head,12,8).scale.set(1,0.3,0.4);}
 if(st==="melena"){for(const s of [-1,1]){const m1=sph(0.2,hair,s*0.4,-0.25,0.05,head,10,8);m1.scale.set(0.7,1.2,0.9);}const m2=sph(0.48,hair,0,-0.3,-0.15,head,14,10);m2.scale.set(1.05,0.75,0.8);}
 if(st==="coleta"){sph(0.15,hair,0,0.18,-0.5,head,10,8);const pt=sph(0.2,hair,0,-0.25,-0.62,head,12,10);pt.scale.y=1.8;sph(0.07,"#FF4FA3",0,0.12,-0.6,head,8,6);}
 if(st==="coletas"){for(const s of [-1,1]){sph(0.07,"#FF4FA3",s*0.46,0.18,-0.1,head,8,6);const pt=sph(0.18,hair,s*0.6,-0.05,-0.12,head,12,10);pt.scale.set(0.9,1.6,0.9);pt.rotation.z=s*0.35;}}
 if(st==="mono"){const bn=sph(0.24,hair,0,0.48,-0.18,head,14,10);const r=mesh(new T.TorusGeometry(0.16,0.035,6,16),"#FF4FA3",0,0.36,-0.15,head);r.rotation.x=Math.PI/2+0.4;}
 if(st==="rizado"){for(let i=0;i<22;i++){const a=i/22*Math.PI*2,t=0.2+(i%3)*0.35;sph(0.15,hair,Math.cos(a)*0.42*Math.cos(t*0.8),0.15+Math.sin(t)*0.32,Math.sin(a)*0.42*Math.cos(t*0.8)-0.04,head,8,6);}for(let i=0;i<5;i++)sph(0.13,hair,-0.28+i*0.14,0.32,0.26,head,8,6);}
 if(st==="trenzas"){for(const s of [-1,1])for(let k=0;k<5;k++){const b=sph(0.1-k*0.008,hair,s*0.36,-0.32-k*0.17,-0.12,head,8,6);b.scale.y=1.2;}for(const s of [-1,1])sph(0.05,"#7B4BD1",s*0.36,-1.18,-0.12,head,8,6);}
 if(st==="punta"){for(let i=0;i<7;i++){const a=(i/6-0.5)*1.8;const c=cone(0.13,0.42,hair,Math.sin(a)*0.3,0.42,0.12-Math.abs(a)*0.08,head,6);c.rotation.z=-a*0.6;c.rotation.x=-0.5;}}
 hat(L.hat,head);
 const wings=extraLook(L,body,head);
 if(typeof lookExtras==="function")lookExtras(L,{body,head,tor,tg,tt,eyes,mouth,hair,skin,shirt,sItem,pItem});
 const sh=new T.Mesh(new T.CircleGeometry(0.7,18),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.18,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=0.33;g.add(sh);
 return {g,body,legs,arms,head,shadow:sh,wings,eyes,mouth,tor,phase:Math.random()*6,blink:2+Math.random()*3,t:Math.random()*10};
}
function hat(id,head){
 if(id==="chef"){cyl(0.36,0.32,0.5,"#FFFFFF",0,0.55,0,head,16);sph(0.42,"#FFFFFF",0,0.85,0,head,12,8).scale.y=0.6;}
 if(id==="policia"){cyl(0.5,0.5,0.22,"#2A4C8F",0,0.45,0,head,18);box(0.62,0.05,0.4,"#1B2E52",0,0.35,0.4,head);box(0.16,0.14,0.04,"#F5C518",0,0.48,0.49,head);}
 if(id==="flores"){const ring=new T.Mesh(new T.TorusGeometry(0.44,0.05,6,20),M("#3FA34D"));ring.rotation.x=Math.PI/2;ring.position.y=0.25;head.add(ring);["#FF4FA3","#F5C518","#FFFFFF","#7B4BD1","#E2465C","#FF4FA3"].forEach((c,i)=>{const a=i/6*Math.PI*2;sph(0.1,c,Math.cos(a)*0.44,0.3,Math.sin(a)*0.44,head,8,6);});}
 if(id==="tiara"){const t=cyl(0.42,0.44,0.08,"#D9DEE5",0,0.32,0,head,20);t.material=M("#D9DEE5","#303844");const g=cone(0.1,0.3,"#25B9E8",0,0.5,0.36,head,6);g.material=M("#25B9E8","#0A4A66");}
 if(id==="astronauta"){const h=sph(0.68,"#E8EEF2",0,0,0,head,18,14);h.material=new T.MeshLambertMaterial({color:0xBFE6FF,transparent:true,opacity:0.35});box(0.3,0.12,0.12,"#E2465C",0.4,0.45,0.2,head);}
 if(id==="gorra"){const c=new T.Mesh(new T.SphereGeometry(0.5,16,10,0,Math.PI*2,0,Math.PI*0.45),M("#E2465C"));c.position.y=0.06;head.add(c);box(0.6,0.06,0.45,"#E2465C",0,0.2,0.48,head);}
 if(id==="fiesta"){cone(0.3,0.8,"#7B4BD1",0,0.78,0,head);sph(0.1,"#F5C518",0,1.2,0,head);}
 if(id==="gato"){for(const s of [-1,1]){const e=cone(0.16,0.4,"#2B1B12",s*0.27,0.45,0,head,4);e.rotation.z=-s*0.35;cone(0.08,0.2,"#F4A0A0",s*0.27,0.44,0.05,head,4).rotation.z=-s*0.35;}}
 if(id==="vaquero"){cyl(0.75,0.75,0.06,"#8A5A2B",0,0.3,0,head,20);cyl(0.36,0.42,0.45,"#8A5A2B",0,0.52,0,head,16);}
 if(id==="bombero"){const c=new T.Mesh(new T.SphereGeometry(0.52,16,10,0,Math.PI*2,0,Math.PI*0.5),M("#D9483B"));c.position.y=0.08;head.add(c);cyl(0.66,0.66,0.06,"#D9483B",0,0.1,-0.06,head,18);box(0.2,0.25,0.06,"#F5C518",0,0.4,0.48,head);}
 if(id==="corona"){const cr=cyl(0.36,0.36,0.24,"#F5C518",0,0.5,0,head,16);cr.material=M("#F5C518","#5A4000");for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const sp=cone(0.08,0.24,"#F5C518",Math.cos(a)*0.32,0.74,Math.sin(a)*0.32,head,6);sp.material=cr.material;}sph(0.07,"#E2465C",0,0.52,0.36,head,8,6);}
}
function animChar(ch,speed,dt,air){
 ch.t=(ch.t||0)+dt;ch.phase+=dt*(4+speed*1.3);
 const a=Math.min(1,speed/4)*0.8;
 const sw=Math.sin(ch.phase)*a;
 // parpadeo
 if(ch.eyes){ch.blink-=dt;const bl=ch.blink<0.12&&ch.blink>0?0.12:1;if(ch.blink<0)ch.blink=2+Math.random()*3.5;ch.eyes.forEach(e=>e.scale.y=bl);}
 if(ch.fall>0){ // se cayó: queda acostado y se levanta
  ch.fall-=dt;const k=ch.fall>0.9?Math.min(1,(1.6-ch.fall)/0.25):Math.max(0,ch.fall/0.9);
  ch.body.rotation.x=-1.45*k;ch.body.position.y=0.25*k;ch.body.position.z=-0.9*k;
  ch.legs[0].rotation.x=0.3*k;ch.legs[1].rotation.x=-0.2*k;ch.arms[0].rotation.x=-2.8*k;ch.arms[1].rotation.x=-2.6*k;ch.arms[0].rotation.z=-0.6*k;ch.arms[1].rotation.z=0.6*k;
  if(ch.stars){ch.stars.visible=ch.fall>0.5;ch.stars.rotation.y+=dt*6;}
  if(ch.fall<=0){ch.body.rotation.x=0;ch.body.position.z=0;ch.arms[0].rotation.z=-0.08;ch.arms[1].rotation.z=0.08;if(ch.stars)ch.stars.visible=false;}
  return;}
 if(ch.dance>0){ch.dance-=dt;const d=ch.danceT||0;const tt=ch.t*7;
  if(d===0){ch.arms[0].rotation.x=-2.6+Math.sin(tt)*0.5;ch.arms[1].rotation.x=-2.6-Math.sin(tt)*0.5;ch.body.position.y=Math.abs(Math.sin(tt))*0.25;ch.body.rotation.y=Math.sin(tt*0.5)*0.4;ch.legs[0].rotation.x=Math.sin(tt)*0.3;ch.legs[1].rotation.x=-Math.sin(tt)*0.3;}
  if(d===1){ch.body.rotation.y+=dt*9;ch.arms[0].rotation.z=-1.3;ch.arms[1].rotation.z=1.3;ch.arms[0].rotation.x=0;ch.arms[1].rotation.x=0;ch.body.position.y=0.05;}
  if(d===2){ch.arms[1].rotation.x=-2.9;ch.arms[1].rotation.z=0.4+Math.sin(tt*1.4)*0.5;ch.arms[0].rotation.x=0;ch.body.rotation.z=Math.sin(tt*0.7)*0.06;ch.body.position.y=0;}
  if(d===3){const j=Math.abs(Math.sin(tt*0.9));ch.body.position.y=j*0.9;ch.arms[0].rotation.x=-3;ch.arms[1].rotation.x=-3;ch.arms[0].rotation.z=-0.5;ch.arms[1].rotation.z=0.5;ch.legs[0].rotation.x=-j*0.6;ch.legs[1].rotation.x=-j*0.6;}
  if(d===4){ch.body.rotation.z=Math.sin(tt*0.8)*0.25;ch.arms[0].rotation.z=-0.9+Math.sin(tt*0.8)*0.5;ch.arms[1].rotation.z=0.9+Math.sin(tt*0.8)*0.5;ch.arms[0].rotation.x=0;ch.arms[1].rotation.x=0;ch.body.position.y=Math.abs(Math.sin(tt*0.8))*0.1;ch.legs[0].rotation.x=0;ch.legs[1].rotation.x=0;}
  if(d===5){const st=Math.floor(tt*0.6)%4;ch.arms[0].rotation.x=st%2?-1.57:0;ch.arms[1].rotation.x=st%2?0:-1.57;ch.arms[0].rotation.z=-0.08;ch.arms[1].rotation.z=0.08;ch.body.rotation.y=[0,0.4,0,-0.4][st];ch.head.rotation.z=[0,0.2,0,-0.2][st];ch.body.position.y=0;ch.legs[0].rotation.x=0;ch.legs[1].rotation.x=0;}
  if(d===6){const j=Math.abs(Math.sin(tt*0.8));ch.body.position.y=j*0.7;ch.arms[0].rotation.z=-0.2-j*1.8;ch.arms[1].rotation.z=0.2+j*1.8;ch.arms[0].rotation.x=0;ch.arms[1].rotation.x=0;ch.legs[0].rotation.z=-j*0.5;ch.legs[1].rotation.z=j*0.5;ch.legs[0].rotation.x=0;ch.legs[1].rotation.x=0;}
  if(ch.dance<=0){ch.body.rotation.set(0,0,0);ch.legs[0].rotation.z=0;ch.legs[1].rotation.z=0;ch.head.rotation.z=0;ch.arms[0].rotation.z=-0.08;ch.arms[1].rotation.z=0.08;}
  if(speed<0.5)return;ch.dance=0;ch.body.rotation.set(0,0,0);ch.legs[0].rotation.z=0;ch.legs[1].rotation.z=0;ch.arms[0].rotation.z=-0.08;ch.arms[1].rotation.z=0.08;}
 if(ch.wave>0){ch.wave-=dt;ch.arms[1].rotation.x=-2.8;ch.arms[1].rotation.z=0.3+Math.sin(ch.t*14)*0.35;}
 else{ch.arms[1].rotation.z=0.08;ch.arms[1].rotation.x=air?-2.6:sw*0.9;}
 ch.legs[0].rotation.x=air?-0.6:sw;ch.legs[1].rotation.x=air?0.35:-sw;
 ch.arms[0].rotation.x=air?-2.6:-sw*0.9;
 const idle=speed<0.3&&!air;
 ch.body.position.y=air?0:(idle?0:Math.abs(Math.sin(ch.phase))*0.09*Math.min(1,speed/3));
 if(ch.tor)ch.tor.scale.y=idle?1+Math.sin(ch.t*2.2)*0.015:1;
 if(ch.head){ch.head.rotation.z=idle?Math.sin(ch.t*0.9)*0.05:0;ch.head.rotation.x=idle?Math.sin(ch.t*1.3)*0.03:Math.min(0.12,speed*0.015);}
 ch.body.rotation.x=air?0:Math.min(0.12,speed*0.012);
}
function addStars(ch){const g=new T.Group();g.position.y=3.05;for(let i=0;i<4;i++){const s=emojiSprite(i%2?"⭐":"💫",0.45);const a=i/4*Math.PI*2;s.position.set(Math.cos(a)*0.55,0,Math.sin(a)*0.55);g.add(s);}g.visible=false;ch.g.add(g);ch.stars=g;}
function tubeBetween(p,a,b,r,c){const d=new T.Vector3().subVectors(b,a);const m=cyl(r,r,d.length(),c,0,0,0,p,8);m.position.copy(a).addScaledVector(d,0.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
function wheel(p,r,w,x,y,z,rim,tire){const g=new T.Group();g.position.set(x,y,z);p.add(g);const t=cyl(r,r,w,tire||"#23272F",0,0,0,g,18);t.rotation.z=Math.PI/2;const rr_=cyl(r*0.58,r*0.58,w+0.02,rim||"#E9EEF2",0,0,0,g,14);rr_.rotation.z=Math.PI/2;const h=cyl(r*0.2,r*0.2,w+0.04,"#9DB4C8",0,0,0,g,8);h.rotation.z=Math.PI/2;for(let i=0;i<5;i++){const sp=box(w+0.03,r*0.08,r*0.5,"#B7C4D1",0,0,0,g);sp.rotation.x=i/5*Math.PI;}return g;}
function roundedSide(pts,depth,bev,c){const sh=new T.Shape();sh.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)sh.lineTo(pts[i][0],pts[i][1]);sh.closePath();const geo=new T.ExtrudeGeometry(sh,{depth,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:3,curveSegments:6});geo.translate(0,0,-depth/2);const m=shadowize(new T.Mesh(geo,M(c)));m.rotation.y=-Math.PI/2;return m;}
function makeCar(color,opts){opts=opts||{};const g=new T.Group();const wheels=[];
 const lo=roundedSide([[-1.85,0.45],[1.85,0.45],[1.95,0.75],[1.8,1.05],[0.9,1.15],[-1.6,1.15],[-1.9,1.0],[-1.95,0.6]],1.62,0.14,color);g.add(lo);
 if(!opts.conv){const cab=roundedSide([[-1.25,1.1],[0.75,1.1],[0.35,1.75],[-1.05,1.75]],1.42,0.1,color);g.add(cab);
  const gl=M("#9FD4F0","#0E3A55");for(const s of [-1,1]){const w=box(0.04,0.46,0.62,"#9FD4F0",s*0.8,1.42,-0.05,g);w.material=gl;const w2=box(0.04,0.42,0.5,"#9FD4F0",s*0.8,1.42,-0.75,g);w2.material=gl;}
  const ws=box(1.36,0.5,0.06,"#9FD4F0",0,1.43,0.58,g);ws.rotation.x=-0.85;ws.material=gl;const rw=box(1.36,0.45,0.06,"#9FD4F0",0,1.43,-1.22,g);rw.rotation.x=0.5;rw.material=gl;}
 else{const ws=box(1.5,0.4,0.05,"#BFE6FF",0,1.35,0.55,g);ws.rotation.x=-0.6;ws.material=M("#BFE6FF","#0E3A55");for(const s of [-1,1]){box(0.5,0.25,0.6,"#3E2A1F",s*0.38,1.15,-0.5,g);box(0.5,0.5,0.12,"#3E2A1F",s*0.38,1.4,-0.85,g);}}
 for(const s of [-1,1]){const hl=sph(0.15,"#FFF6C8",s*0.6,0.85,2.0,g,10,8);hl.material=M("#FFF6C8","#8A7A30");hl.scale.z=0.5;const tl=box(0.32,0.14,0.05,"#E2465C",s*0.62,0.92,-2.06,g);tl.material=M("#E2465C","#5A0A14");
  const mir=box(0.08,0.12,0.2,color,s*0.98,1.2,0.45,g);}
 box(1.75,0.18,0.18,"#D9DEE5",0,0.55,2.05,g);box(1.75,0.18,0.18,"#D9DEE5",0,0.55,-2.05,g);box(0.55,0.16,0.03,"#FFFFFF",0,0.62,-2.15,g);
 box(0.7,0.08,0.04,"#3E4B59",0,0.78,2.08,g);
 for(const sx of [-1,1])for(const sz of [-1.2,1.25])wheels.push(wheel(g,0.4,0.3,sx*0.86,0.4,sz,opts.rim,null));
 g.userData.wheels=wheels;return g;}
function makeVehicle(id,col){
 const g=new T.Group();let wheels=[];
 if(id==="skate"){const sk=col||"#FF4FA3";const d=box(0.55,0.06,1.2,sk,0,0.22,0,g);for(const s of [-1,1]){const e=cyl(0.275,0.275,0.06,sk,0,0.22,s*0.6,g,16);}box(0.4,0.02,0.9,"#7B4BD1",0,0.255,0,g);
  for(const sz of [-0.45,0.45]){box(0.42,0.05,0.08,"#C9D3DC",0,0.15,sz,g);for(const sx of [-0.22,0.22]){const w=cyl(0.08,0.08,0.08,"#5FD3B8",sx,0.09,sz,g,10);w.rotation.z=Math.PI/2;wheels.push(w);}}
  return {g,lift:0.22,sit:false,pose:"skate",wheels};}
 if(id==="bici"){const fc=col||"#2E7BEF";
  for(const sz of [-0.78,0.78]){const wg=new T.Group();wg.position.set(0,0.45,sz);g.add(wg);const t=new T.Mesh(new T.TorusGeometry(0.4,0.055,8,24),M("#23272F"));t.rotation.y=Math.PI/2;wg.add(t);shadowize(t);
   const rim=new T.Mesh(new T.TorusGeometry(0.34,0.02,6,20),M("#D9DEE5"));rim.rotation.y=Math.PI/2;wg.add(rim);for(let i=0;i<6;i++){const sp=box(0.015,0.68,0.015,"#C9D3DC",0,0,0,wg);sp.rotation.x=i/6*Math.PI;}cyl(0.06,0.06,0.1,"#9DB4C8",0,0,0,wg,8).rotation.z=Math.PI/2;wheels.push(wg);}
  const V=(x,y,z)=>new T.Vector3(x,y,z);const pd=V(0,0.5,0),st=V(0,1.08,-0.25),hd=V(0,1.12,0.55);
  tubeBetween(g,pd,st,0.045,fc);tubeBetween(g,pd,hd,0.05,fc);tubeBetween(g,st,hd,0.045,fc);tubeBetween(g,pd,V(0,0.45,-0.78),0.035,fc);tubeBetween(g,st,V(0,0.45,-0.78),0.035,fc);tubeBetween(g,hd,V(0,0.45,0.78),0.04,fc);
  const seat=sph(0.16,"#3E2A1F",0,1.15,-0.28,g,10,6);seat.scale.set(0.9,0.35,1.5);tubeBetween(g,V(-0.33,1.32,0.52),V(0.33,1.32,0.52),0.03,"#3E4B59");tubeBetween(g,hd,V(0,1.32,0.52),0.035,"#3E4B59");
  for(const s of [-1,1])cyl(0.045,0.045,0.12,"#FF4FA3",s*0.37,1.32,0.52,g,8).rotation.z=Math.PI/2;
  const bk=box(0.42,0.28,0.3,"#C68A4A",0,1.05,0.95,g);["#FF4FA3","#F5C518","#FFFFFF"].forEach((c,i)=>sph(0.07,c,-0.1+i*0.1,1.22,0.95,g,6,4));
  const pdl=new T.Group();pdl.position.copy(pd);g.add(pdl);for(const s of [-1,1]){box(0.04,0.22,0.04,"#3E4B59",s*0.1,-0.08,0,pdl);box(0.14,0.03,0.08,"#23272F",s*0.16,-0.18,0,pdl);}
  return {g,lift:0.38,sit:false,pose:"bike",wheels,pedals:pdl};}
 if(id==="moto"){const c=col||"#5FD3B8";
  const body=roundedSide([[-0.8,0.35],[0.55,0.35],[0.7,0.6],[0.45,0.75],[-0.2,0.72],[-0.75,0.85],[-0.9,0.6]],0.5,0.12,c);g.add(body);
  const shield=roundedSide([[0.5,0.4],[0.85,0.45],[0.95,1.35],[0.72,1.35],[0.6,0.8]],0.45,0.08,c);g.add(shield);
  const seat=sph(0.25,"#3E2A1F",0,0.98,-0.35,g,12,8);seat.scale.set(0.95,0.35,1.7);
  tubeBetween(g,new T.Vector3(0,1.35,0.82),new T.Vector3(0,1.5,0.72),0.05,"#3E4B59");tubeBetween(g,new T.Vector3(-0.38,1.52,0.7),new T.Vector3(0.38,1.52,0.7),0.035,"#3E4B59");
  const hl=sph(0.13,"#FFF6C8",0,1.4,0.98,g,10,8);hl.material=M("#FFF6C8","#8A7A30");for(const s of [-1,1]){sph(0.07,"#D9DEE5",s*0.42,1.65,0.66,g,8,6);tubeBetween(g,new T.Vector3(s*0.32,1.52,0.7),new T.Vector3(s*0.42,1.65,0.66),0.015,"#3E4B59");}
  box(0.3,0.12,0.04,"#E2465C",0,0.95,-1.13,g).material=M("#E2465C","#5A0A14");
  wheels.push(wheel(g,0.3,0.18,0,0.3,0.78,"#F4F6FA"));wheels.push(wheel(g,0.3,0.18,0,0.3,-0.72,"#F4F6FA"));
  return {g,lift:0.6,sit:false,pose:"moto",wheels};}
 const car=makeCar(col||(id==="oro"?"#E2A511":"#FF6F91"),{conv:true,rim:id==="oro"?"#F5C518":"#FFFFFF"});g.add(car);
 return {g,lift:0.48,sit:true,pose:"car",wheels:car.userData.wheels};
}
function makePetBase(id){
 const g=new T.Group();let c="#C68A4A";
 if(id==="gato")c="#F28C28";if(id==="conejo")c="#F4F1E8";if(id==="pinguino")c="#22303D";if(id==="unicornio")c="#FFFFFF";if(id==="dragon")c="#19A858";
 if(id==="pinguino"){const b=sph(0.45,c,0,0.55,0,g);b.scale.y=1.3;const w=sph(0.32,"#FFFFFF",0,0.5,0.18,g);w.scale.y=1.2;sph(0.3,c,0,1.15,0,g);box(0.15,0.08,0.2,"#F28C28",0,1.1,0.3,g);for(const s of [-1,1])sph(0.05,"#FFFFFF",s*0.12,1.2,0.25,g,6,4);return g;}
 const bd=box(0.6,0.5,0.95,c,0,0.55,0,g);
 for(const sx of [-0.2,0.2])for(const sz of [-0.32,0.32])box(0.14,0.35,0.14,c,sx,0.18,sz,g);
 const hd=new T.Group();hd.position.set(0,0.95,0.5);g.add(hd);box(0.52,0.45,0.48,c,0,0,0,hd);
 for(const s of [-1,1])sph(0.05,"#14212E",s*0.13,0.06,0.25,hd,6,4);sph(0.06,"#14212E",0,-0.06,0.26,hd,6,4);
 if(id==="perro"){for(const s of [-1,1])box(0.12,0.3,0.2,"#7A5232",s*0.28,0.0,0,hd);}
 if(id==="gato"){for(const s of [-1,1])cone(0.1,0.22,c,s*0.16,0.32,0,hd,4);}
 if(id==="conejo"){for(const s of [-1,1])box(0.1,0.5,0.06,c,s*0.12,0.45,0,hd);}
 if(id==="unicornio"){const h=cone(0.07,0.45,"#F5C518",0,0.42,0.12,hd,8);h.rotation.x=0.4;box(0.12,0.5,0.6,"#FF4FA3",0,0.25,-0.2,hd).position.set(0,0.3,-0.1);}
 if(id==="dragon"){for(const s of [-1,1]){const w=box(0.7,0.05,0.5,"#7FD8B5",s*0.6,0.9,0,g);w.rotation.z=s*0.4;}for(let i=0;i<3;i++)cone(0.07,0.18,"#F5C518",0,0.88,0.2-i*0.3,g,4);}
 const tl=box(0.1,0.1,0.4,c,0,0.7,-0.6,g);tl.rotation.x=-0.6;
 const sh=new T.Mesh(new T.CircleGeometry(0.55,14),new T.MeshBasicMaterial({color:0,transparent:true,opacity:0.2}));sh.rotation.x=-Math.PI/2;sh.position.y=0.33;g.add(sh);
 return g;
}

