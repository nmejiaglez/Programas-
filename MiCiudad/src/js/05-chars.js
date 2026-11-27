/* ---------- Personajes ---------- */
function makeChar(look){
 const L=look;const g=new T.Group();
 const skin=SKINS[L.skin]||SKINS[0],hair=HAIRS[L.hair]||HAIRS[0];
 const shirt=(SHIRTS.find(s=>s.id===L.shirt)||SHIRTS[0]).c,pItem=PANTS.find(s=>s.id===L.pants)||PANTS[0],pants=pItem.skirt?skin:pItem.c;
 const body=new T.Group();g.add(body);
 const legs=[];for(const s of [-1,1]){const pv=new T.Group();pv.position.set(s*0.2,0.85,0);body.add(pv);box(0.34,0.75,0.38,pants,0,-0.38,0,pv);box(0.36,0.16,0.48,"#2A2E35",0,-0.78,0.05,pv);legs.push(pv);}
 box(0.86,0.92,0.52,shirt,0,1.3,0,body);
 if(pItem.skirt){const sk=mesh(new T.CylinderGeometry(0.46,pItem.gala?0.95:0.72,pItem.gala?1.5:0.62,16),pItem.c,0,pItem.gala?0.38:0.62,0,body);}
 if(L.shirt==="s9"){box(0.12,0.6,0.02,"#2E7BEF",0.18,1.35,0.27,body);sph(0.06,"#9DB4C8",-0.2,1.5,0.27,body);}
 const arms=[];for(const s of [-1,1]){const pv=new T.Group();pv.position.set(s*0.56,1.68,0);body.add(pv);box(0.24,0.7,0.3,shirt,0,-0.33,0,pv);sph(0.15,skin,0,-0.75,0,pv,8,6);arms.push(pv);}
 const head=new T.Group();head.position.set(0,2.2,0);body.add(head);
 sph(0.46,skin,0,0,0,head,18,14);
 for(const s of [-1,1]){sph(0.07,"#14212E",s*0.16,0.03,0.42,head,8,6);sph(0.08,"#F4A0A0",s*0.27,-0.12,0.36,head,8,6).scale.z=0.4;}
 const mo=box(0.16,0.04,0.04,"#9A3B3B",0,-0.17,0.44,head);
 const hc=new T.Mesh(new T.SphereGeometry(0.49,18,12,0,Math.PI*2,0,Math.PI*0.52),M(hair));hc.rotation.x=-0.28;hc.position.y=0.03;head.add(hc);
 if(L.hstyle==="largo"){box(0.86,0.8,0.24,hair,0,-0.3,-0.3,head);}
 if(L.hstyle==="coleta"){sph(0.2,hair,0,0.05,-0.52,head,10,8);const pt=sph(0.22,hair,0,-0.3,-0.6,head,10,8);pt.scale.y=1.6;}
 hat(L.hat,head);
 const wings=extraLook(L,body,head);
 const sh=new T.Mesh(new T.CircleGeometry(0.7,18),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.22}));sh.rotation.x=-Math.PI/2;sh.position.y=0.33;g.add(sh);
 return {g,body,legs,arms,head,shadow:sh,wings,phase:Math.random()*6};
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
 ch.phase+=dt*(4+speed*1.3);
 const a=Math.min(1,speed/4)*0.75;
 const sw=Math.sin(ch.phase)*a;
 ch.legs[0].rotation.x=air?-0.5:sw;ch.legs[1].rotation.x=air?0.3:-sw;
 ch.arms[0].rotation.x=air?-2.4:-sw*0.9;ch.arms[1].rotation.x=air?-2.4:sw*0.9;
 ch.body.position.y=air?0:Math.abs(Math.sin(ch.phase))*0.08*Math.min(1,speed/3);
}
function makeCar(color){const g=new T.Group();box(2,0.8,3.8,color,0,0.75,0,g);box(1.8,0.7,1.9,color,0,1.45,-0.3,g);box(1.82,0.5,0.1,"#BFE6FF",0,1.5,0.66,g);box(1.82,0.5,0.1,"#BFE6FF",0,1.5,-1.26,g);
 for(const sx of [-1,1])for(const sz of [-1.2,1.2]){const w=cyl(0.38,0.38,0.3,"#222831",sx*1,0.4,sz,g,12);w.rotation.z=Math.PI/2;}
 sph(0.14,"#FFF4C2",0.6,0.85,1.92,g,8,6);sph(0.14,"#FFF4C2",-0.6,0.85,1.92,g,8,6);return g;}
function makeVehicle(id){
 const g=new T.Group();
 if(id==="skate"){box(0.55,0.08,1.4,"#E2465C",0,0.2,0,g);for(const sz of [-0.5,0.5])for(const sx of [-0.22,0.22]){const w=cyl(0.09,0.09,0.08,"#F5C518",sx,0.09,sz,g,8);w.rotation.z=Math.PI/2;}return {g,lift:0.22,sit:false};}
 if(id==="bici"){for(const sz of [-0.75,0.75]){const w=new T.Mesh(new T.TorusGeometry(0.42,0.06,6,18),M("#222831"));w.position.set(0,0.45,sz);w.rotation.y=Math.PI/2;g.add(w);}
  const f1=box(0.08,0.08,1.4,"#2E7BEF",0,0.8,0,g);box(0.08,0.6,0.08,"#2E7BEF",0,0.75,0.7,g);box(0.7,0.06,0.06,"#3E4B59",0,1.05,0.72,g);box(0.3,0.08,0.4,"#2A2E35",0,1.02,-0.3,g);return {g,lift:0.35,sit:false};}
 if(id==="moto"){box(0.5,0.4,1.6,"#14B8A6",0,0.55,0,g);box(0.3,0.9,0.2,"#14B8A6",0,0.95,0.75,g);box(0.8,0.07,0.07,"#3E4B59",0,1.4,0.75,g);for(const sz of [-0.7,0.7]){const w=cyl(0.3,0.3,0.2,"#222831",0,0.3,sz,g,12);w.rotation.z=Math.PI/2;}return {g,lift:0.55,sit:false};}
 const car=makeCar(id==="oro"?"#E2A511":"#E2465C");if(id==="oro"){car.children[1].visible=false;car.children[2].visible=false;car.children[3].visible=false;}
 car.children.forEach(c=>{if(c.material===M(id==="oro"?"#E2A511":"#E2465C")){}});
 g.add(car);return {g,lift:0.45,sit:true};
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

