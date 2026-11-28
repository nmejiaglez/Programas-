/* ================= MODA: caras, estampados, peinados, lentes y accesorios bonitos ================= */
/* --- catálogo nuevo --- */
SHIRTS.push(
 {id:"s15",name:"Corazones",c:"#FF9EC7",pat:"corazones",p:30,cur:"mc",tag:"Popular"},
 {id:"s16",name:"Estrellas",c:"#5B6CF0",pat:"estrellas",p:30,cur:"mc"},
 {id:"s17",name:"Unicornio",c:"#F3E8FF",pat:"unicornio",p:60,cur:"mc",tag:"Nuevo"},
 {id:"s18",name:"Galaxia",c:"#241B4D",pat:"galaxia",p:80,cur:"mc",tag:"Nuevo"},
 {id:"s19",name:"Flores",c:"#FFF4C2",pat:"flores",p:35,cur:"mc"},
 {id:"s20",name:"Sudadera de osito",c:"#C68A4A",pat:"oso",hood:true,p:70,cur:"mc",tag:"Popular"},
 {id:"s21",name:"Sudadera arcoíris",c:"#FFFFFF",pat:"arcoiris",hood:true,p:90,cur:"mc",tag:"Nuevo"},
 {id:"s22",name:"Dinosaurio",c:"#7FD8B5",pat:"dino",p:45,cur:"mc"},
 {id:"s23",name:"Gatito",c:"#FFD6E7",pat:"gato",p:40,cur:"mc"},
 {id:"s24",name:"Fresa",c:"#FF6F91",pat:"fresa",p:40,cur:"mc"},
 {id:"s25",name:"Brillos dorados",c:"#E2A511",pat:"brillos",p:150,cur:"mc",tag:"Limitado"},
 {id:"s26",name:"Fútbol",c:"#2E7BEF",pat:"futbol",p:30,cur:"mc",tag:"Popular"},
 {id:"s27",name:"Superhéroe",c:"#D9263B",pat:"rayo",p:50,cur:"mc",tag:"Nuevo"},
 {id:"s28",name:"Robot",c:"#9DB4C8",pat:"robot",p:40,cur:"mc"},
 {id:"s29",name:"Cohete espacial",c:"#1B2A5C",pat:"cohete",p:60,cur:"mc"},
 {id:"s30",name:"Tiburón",c:"#7EC4EE",pat:"tiburon",p:45,cur:"mc"},
 {id:"s31",name:"Carreras",c:"#FFFFFF",pat:"carreras",p:55,cur:"mc"},
 {id:"s32",name:"Sudadera de dinosaurio",c:"#19A858",pat:"dino",hood:true,p:80,cur:"mc",tag:"Popular"}
);
PANTS.push(
 {id:"f6",name:"Tutú de bailarina",c:"#FFB3D6",p:50,cur:"mc",skirt:true,tutu:true,tag:"Popular"},
 {id:"f7",name:"Vestido de princesa",c:"#B38CFF",p:120,cur:"mc",skirt:true,gala:true,stars:true,tag:"Nuevo"},
 {id:"f8",name:"Falda de estrellas",c:"#2E3A8C",p:40,cur:"mc",skirt:true,stars:true},
 {id:"p7",name:"Overol de mezclilla",c:"#4A79C7",p:45,cur:"mc",overol:true},
 {id:"p8",name:"Leggins arcoíris",c:"#FF7A59",p:30,cur:"mc"},
 {id:"p9",name:"Pantalón deportivo",c:"#1E2329",p:25,cur:"mc"},
 {id:"p10",name:"Camuflaje",c:"#5E7A3A",p:35,cur:"mc"}
);
HATS.push(
 {id:"mono",name:"Moño gigante",icon:"🎀",p:25,cur:"mc",tag:"Popular"},
 {id:"conejo",name:"Orejas de conejito",icon:"🐰",p:35,cur:"mc"},
 {id:"unicornio",name:"Cuerno de unicornio",icon:"🦄",p:60,cur:"mc",tag:"Nuevo"},
 {id:"audifonos",name:"Audífonos",icon:"🎧",p:45,cur:"mc"},
 {id:"oso",name:"Gorro de osito",icon:"🐻",p:50,cur:"mc"},
 {id:"flor",name:"Flor en el pelo",icon:"🌺",p:15,cur:"mc"},
 {id:"princesa",name:"Corona de princesa",icon:"👸",p:200,cur:"mc",tag:"Limitado"},
 {id:"vikingo",name:"Casco vikingo",icon:"🪖",p:60,cur:"mc",tag:"Nuevo"},
 {id:"reves",name:"Gorra al revés",icon:"🧢",p:20,cur:"mc"},
 {id:"rey",name:"Corona de rey",icon:"🤴",p:200,cur:"mc",tag:"Limitado"},
 {id:"dino",name:"Gorro de dinosaurio",icon:"🦖",p:55,cur:"mc",tag:"Popular"}
);
FACES.push(
 {id:"redondos",name:"Lentes redondos",icon:"👓",p:20,cur:"mc"},
 {id:"corazonrosa",name:"Lentes de corazón rosa",icon:"💗",p:35,cur:"mc",tag:"Popular"},
 {id:"estrelladorada",name:"Lentes de estrella",icon:"⭐",p:40,cur:"mc"},
 {id:"gatito",name:"Lentes de gatita",icon:"😼",p:45,cur:"mc",tag:"Nuevo"},
 {id:"visor",name:"Visor arcoíris",icon:"🌈",p:70,cur:"mc"},
 {id:"deportivos",name:"Lentes deportivos",icon:"🕶️",p:30,cur:"mc"},
 {id:"heroe",name:"Antifaz de superhéroe",icon:"🦸",p:35,cur:"mc"}
);
FACES.forEach(f=>{if(f.id==="corazon"||f.id==="estrella")f.hide=true;});
STYLES_H.push({id:"cresta",name:"Cresta"},{id:"ondas",name:"Ondas largas"},{id:"bob",name:"Bob"},{id:"chongos",name:"Chonguitos"},{id:"lado",name:"Coleta de lado"});
const EYE_STYLES=[{id:0,name:"Normales",p:0},{id:1,name:"Con pestañas",p:0},{id:2,name:"Felices ^^",p:0},{id:3,name:"Brillantes ✨",p:20},{id:4,name:"De estrella ⭐",p:35}];
const MOUTH_STYLES=[{id:0,name:"Sonrisa",p:0},{id:1,name:"Carcajada",p:0},{id:2,name:"Gatito :3",p:0},{id:3,name:"Lengüita",p:10}];
const CHEEKS=[{id:0,name:"Mejillas rosadas",p:0},{id:1,name:"Pecas",p:0},{id:2,name:"Corazoncitos",p:15},{id:3,name:"Estrellitas",p:15},{id:4,name:"Sin rubor",p:0}];
/* --- texturas de estampado --- */
const patCache={};
function patTex(pat,base){const k=pat+base;if(patCache[k])return patCache[k];
 const t=canvasTex(256,128,(x,W,H)=>{x.fillStyle=base;x.fillRect(0,0,W,H);x.textAlign="center";x.textBaseline="middle";
  const stamp=(e,sz,n,seed)=>{x.font=sz+"px sans-serif";let h=seed||7;for(let i=0;i<n;i++){h=(h*9301+49297)%233280;const px=h/233280*W;h=(h*9301+49297)%233280;const py=h/233280*H;x.fillText(e,px,py);}};
  const big=(e,sz)=>{x.font=sz+"px sans-serif";x.fillText(e,0,H/2+4);x.fillText(e,W,H/2+4);};
  if(pat==="corazones"){stamp("💗",18,22,3);big("💖",52);}
  if(pat==="estrellas"){stamp("⭐",16,26,5);big("🌟",50);}
  if(pat==="unicornio"){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,"#FFD6F2");g.addColorStop(1,"#D9F2FF");x.fillStyle=g;x.fillRect(0,0,W,H);stamp("✨",14,20,9);big("🦄",60);}
  if(pat==="galaxia"){for(let i=0;i<140;i++){x.fillStyle=["#FFFFFF","#C9A7FF","#7DF9FF"][i%3];x.fillRect(Math.random()*W,Math.random()*H,2,2);}stamp("✨",14,10,4);big("🪐",54);}
  if(pat==="flores"){stamp("🌼",18,20,2);stamp("🌸",16,14,8);}
  if(pat==="oso"){big("🐻",58);}
  if(pat==="arcoiris"){const c=["#FF4F6B","#FF9F43","#FFD93D","#4CD97B","#4DA3FF","#9B6BFF"];c.forEach((cc,i)=>{x.fillStyle=cc;x.fillRect(0,i*H/6,W,H/6+1);});big("🌈",50);}
  if(pat==="dino"){stamp("🦕",22,10,6);big("🦖",56);}
  if(pat==="gato"){stamp("🐾",14,18,5);big("🐱",56);}
  if(pat==="fresa"){stamp("🍓",16,18,4);big("🍓",50);}
  if(pat==="futbol"){x.fillStyle="#FFFFFF";for(let i=0;i<W;i+=32)x.fillRect(i,0,12,H);big("⚽",54);x.font="bold 22px sans-serif";x.fillStyle="#FFFFFF";x.fillText("10",W/2,H/2+4);}
  if(pat==="rayo"){big("⚡",64);stamp("⭐",12,8,3);}
  if(pat==="robot"){stamp("⚙️",16,14,5);big("🤖",58);}
  if(pat==="cohete"){for(let i=0;i<80;i++){x.fillStyle="#FFFFFF";x.fillRect(Math.random()*W,Math.random()*H,2,2);}big("🚀",56);stamp("🪐",14,4,7);}
  if(pat==="tiburon"){x.strokeStyle="#FFFFFF";x.lineWidth=4;for(let y=20;y<H;y+=34){x.beginPath();for(let i=0;i<=W;i+=16)x.lineTo(i,y+Math.sin(i/16*Math.PI)*5);x.stroke();}big("🦈",58);}
  if(pat==="carreras"){for(let yy=0;yy<H;yy+=16)for(let xx=0;xx<W;xx+=16)if(((xx+yy)/16)%2===0){x.fillStyle="#1E2329";x.fillRect(xx,yy,16,16);}x.fillStyle="#E2465C";x.fillRect(0,H/2-14,W,28);big("🏎️",44);}
  if(pat==="brillos"){const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,"#FFE68A");g.addColorStop(0.5,"#E2A511");g.addColorStop(1,"#FFF3C4");x.fillStyle=g;x.fillRect(0,0,W,H);stamp("✨",16,30,1);}
 });t.wrapS=T.RepeatWrapping;patCache[k]=t;return t;}
function patMat(pat,base){return new T.MeshToonMaterial({map:patTex(pat,base),gradientMap:TOON});}
/* --- formas --- */
function heartShape(s){const h=new T.Shape();h.moveTo(0,-0.6*s);h.bezierCurveTo(-0.9*s,0,-0.6*s,0.7*s,0,0.35*s);h.bezierCurveTo(0.6*s,0.7*s,0.9*s,0,0,-0.6*s);return h;}
function starShape(s){const h=new T.Shape();for(let i=0;i<10;i++){const r=i%2?0.42*s:s;const a=Math.PI/2+i*Math.PI/5;const px=Math.cos(a)*r,py=Math.sin(a)*r;if(i)h.lineTo(px,py);else h.moveTo(px,py);}h.closePath();return h;}
function flatShape(shape,c,em,depth){const g=new T.ExtrudeGeometry(shape,{depth:depth||0.03,bevelEnabled:false});return new T.Mesh(g,M(c,em));}
/* --- aplicar al personaje --- */
function lookExtras(L,P_){const {body,head,tor,tg,tt,eyes,mouth,hair,skin,shirt,sItem,pItem}=P_;
 // estampado de camisa
 if(sItem&&sItem.pat&&!L.shirtC){tg.material=patMat(sItem.pat,sItem.c);}
 if(sItem&&sItem.hood){const h=mesh(new T.TorusGeometry(0.3,0.13,8,16,Math.PI),L.shirtC||sItem.c,0,1.78,-0.22,body);h.rotation.x=-0.3;h.rotation.z=0;const pk=box(0.42,0.18,0.04,L.shirtC||sItem.c,0,1.08,0.33,body);for(const s of [-1,1])cyl(0.015,0.015,0.3,"#FFFFFF",s*0.09,1.6,0.3,body,4);
  if(sItem.pat==="oso")for(const s of [-1,1])sph(0.11,"#8A5A2B",s*0.33,2.7,-0.05,body,8,6);}
 // ropa de abajo especial
 if(pItem&&pItem.tutu){for(let k=0;k<3;k++){const t=mesh(new T.CylinderGeometry(0.45,0.85-k*0.06,0.16,22),k%2?"#FFFFFF":pItem.c,0,0.82-k*0.09,0,body);t.scale.z=0.86;}}
 if(pItem&&pItem.stars){for(let i=0;i<10;i++){const a=i/10*Math.PI*2;const st=flatShape(starShape(0.07),"#FFE68A","#6A5A00",0.02);st.position.set(Math.sin(a)*(pItem.gala?0.75:0.6),pItem.gala?0.0:0.55,Math.cos(a)*(pItem.gala?0.66:0.53));st.rotation.y=a;body.add(st);}}
 if(pItem&&pItem.overol){const bib=box(0.5,0.42,0.04,pItem.c,0,1.32,0.33,body);for(const s of [-1,1]){const st=box(0.08,0.5,0.04,pItem.c,s*0.2,1.55,0.3,body);st.rotation.z=s*0.08;sph(0.04,"#F5C518",s*0.2,1.46,0.34,body,6,4);}}
 // ojos
 const es=L.eyeS||0;
 if(es===1){eyes.forEach((eg,i)=>{const s=i?1:-1;for(let k=0;k<3;k++){const l=box(0.012,0.06,0.012,"#14212E",(k-1)*0.035*s+s*0.06,0.11+(k===1?0.01:0),0.02,eg);l.rotation.z=-s*(0.3+k*0.25);}});}
 if(es===2){eyes.forEach(eg=>{eg.children.forEach(c=>c.visible=false);const a=mesh(new T.TorusGeometry(0.06,0.018,6,12,Math.PI),"#14212E",0,-0.01,0.02,eg);});}
 if(es===3){eyes.forEach((eg,i)=>{eg.scale.setScalar(1.18);const ir=sph(0.062,L.eyeC||EYES[L.eyes||0]||"#2E7BEF",0,-0.01,0.03,eg,10,8);ir.scale.set(0.9,1.15,0.4);const p=sph(0.03,"#14212E",0,-0.01,0.05,eg,8,6);p.scale.z=0.4;const hi=new T.Mesh(new T.SphereGeometry(0.03,8,6),EYE_HI);hi.position.set(0.025,0.04,0.06);eg.add(hi);const h2=new T.Mesh(new T.SphereGeometry(0.016,6,4),EYE_HI);h2.position.set(-0.025,-0.04,0.06);eg.add(h2);});}
 if(es===4){eyes.forEach(eg=>{eg.children.forEach(c=>c.visible=false);const st=flatShape(starShape(0.085),"#F5C518","#7A5A00",0.02);st.position.z=0.02;eg.add(st);const hi=new T.Mesh(new T.SphereGeometry(0.018,6,4),EYE_HI);hi.position.set(0.02,0.03,0.05);eg.add(hi);});}
 // boca
 const ms=L.mouthS||0;
 if(ms===1){mouth.visible=false;const m=mesh(new T.CircleGeometry(0.075,16,Math.PI,Math.PI),"#8A2F3B",0,-0.11,0.445,head);const tng=sph(0.035,"#FF7A8A",0,-0.16,0.44,head,8,6);tng.scale.z=0.4;}
 if(ms===2){mouth.visible=false;for(const s of [-1,1]){const a=mesh(new T.TorusGeometry(0.035,0.012,6,10,Math.PI),"#8A2F3B",s*0.035,-0.14,0.445,head);a.rotation.z=Math.PI;}}
 if(ms===3){const tng=sph(0.03,"#FF7A8A",0.02,-0.19,0.43,head,8,6);tng.scale.set(1,1.2,0.4);}
 // mejillas
 const ck=L.cheekS||0;
 if(ck>0)head.children.forEach(c=>{if(c.material&&c.material.color&&c.material.color.getHexString()==="ff9eaa")c.visible=false;});
 if(ck===1){for(const s of [-1,1])for(let k=0;k<3;k++)sph(0.012,"#B5762E",s*(0.22+k*0.04),-0.07-(k%2)*0.03,0.4,head,5,4);for(const s of [-1,1]){const c=sph(0.06,"#FFB8C0",s*0.27,-0.12,0.35,head,8,6);c.scale.set(1.1,0.6,0.3);}}
 if(ck===2){for(const s of [-1,1]){const h=flatShape(heartShape(0.06),"#FF6F91","#5A1020",0.01);h.position.set(s*0.27,-0.12,0.38);h.rotation.y=s*0.5;head.add(h);}}
 if(ck===3){for(const s of [-1,1]){const st=flatShape(starShape(0.05),"#F5C518","#6A5A00",0.01);st.position.set(s*0.28,-0.1,0.37);st.rotation.y=s*0.55;head.add(st);}}
 // peinados nuevos
 const hs=L.hstyle;
 if(hs==="ondas"){const bk=sph(0.5,hair,0,-0.12,-0.12,head,16,12);bk.scale.set(1,1.05,0.75);for(let k=0;k<6;k++){for(const s of [-1,1]){const w=sph(0.17,hair,s*(0.3+((k%2)*0.06)),-0.45-k*0.17,-0.15,head,8,6);}}for(let k=0;k<4;k++)sph(0.18,hair,-0.2+k*0.13,-0.5-k*0.05,-0.38,head,8,6);}
 if(hs==="bob"){const b=sph(0.55,hair,0,-0.05,-0.04,head,16,12);b.scale.set(1.05,0.85,0.95);for(const s of [-1,1]){const sd=sph(0.2,hair,s*0.45,-0.28,0.08,head,10,8);sd.scale.set(0.8,1,1);}}
 if(hs==="chongos"){for(const s of [-1,1]){sph(0.2,hair,s*0.3,0.45,-0.05,head,12,8);const r=mesh(new T.TorusGeometry(0.13,0.03,6,12),"#FF4FA3",s*0.3,0.36,-0.05,head);r.rotation.x=Math.PI/2;}}
 if(hs==="lado"){sph(0.16,hair,0.4,0.15,-0.25,head,10,8);const pt=sph(0.21,hair,0.55,-0.25,-0.3,head,12,10);pt.scale.y=1.8;pt.rotation.z=0.25;sph(0.07,"#7B4BD1",0.45,0.08,-0.32,head,8,6);}
 // sombreros nuevos
 const ht=L.hat;
 if(ht==="mono"){const g=new T.Group();g.position.set(0.2,0.42,0.05);head.add(g);for(const s of [-1,1]){const l=sph(0.17,"#FF4FA3",s*0.17,0,0,g,10,8);l.scale.set(1.3,0.9,0.5);}sph(0.07,"#FF4FA3",0,0,0,g,8,6);for(const s of [-1,1]){const t=box(0.06,0.16,0.03,"#FF4FA3",s*0.06,-0.12,0,g);t.rotation.z=s*0.4;}g.rotation.z=-0.3;}
 if(ht==="conejo"){cyl(0.47,0.47,0.06,"#FFFFFF",0,0.28,0,head,20).rotation.x=0.2;for(const s of [-1,1]){const e=sph(0.13,"#FFFFFF",s*0.18,0.75,0,head,10,8);e.scale.set(0.8,3,0.5);e.rotation.z=-s*0.15;const i=sph(0.07,"#FFB3D6",s*0.18,0.75,0.05,head,8,6);i.scale.set(0.8,3.4,0.3);i.rotation.z=-s*0.15;}}
 if(ht==="unicornio"){const h=cone(0.09,0.5,"#FFE68A",0,0.6,0.22,head,10);h.rotation.x=0.35;h.material=M("#FFE68A","#6A5A00");for(let k=0;k<3;k++){const r=mesh(new T.TorusGeometry(0.07-k*0.015,0.012,4,10),"#FF4FA3",0,0.46+k*0.12,0.18+k*0.04,head);r.rotation.x=Math.PI/2+0.35;}for(const s of [-1,1]){const e=cone(0.09,0.2,"#FFFFFF",s*0.3,0.42,0,head,6);e.rotation.z=-s*0.4;}sph(0.07,"#FF9EC7",0.2,0.44,0.22,head,8,6);sph(0.07,"#C9A7FF",-0.2,0.44,0.22,head,8,6);}
 if(ht==="audifonos"){const a=mesh(new T.TorusGeometry(0.5,0.04,6,24,Math.PI),"#7B4BD1",0,0.05,0,head);for(const s of [-1,1]){const c=cyl(0.15,0.15,0.12,"#FF4FA3",s*0.5,0.0,0,head,14);c.rotation.z=Math.PI/2;}}
 if(ht==="oso"){const c=new T.Mesh(new T.SphereGeometry(0.53,16,10,0,Math.PI*2,0,Math.PI*0.5),M("#B5762E"));c.position.y=0.04;head.add(c);for(const s of [-1,1]){sph(0.13,"#B5762E",s*0.36,0.42,0,head,10,8);sph(0.07,"#E8C9A0",s*0.36,0.42,0.07,head,8,6);}}
 if(ht==="flor"){const g=new T.Group();g.position.set(-0.36,0.25,0.18);head.add(g);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const p=sph(0.07,"#FF6F91",Math.cos(a)*0.08,Math.sin(a)*0.08,0,g,8,6);p.scale.z=0.5;}sph(0.05,"#F5C518",0,0,0.02,g,6,4);}
 if(ht==="princesa"){const cr=new T.Group();cr.position.y=0.42;head.add(cr);const m_=M("#F5C518","#5A4000");for(let i=0;i<5;i++){const a=(i-2)*0.32;const st=flatShape(starShape(0.09),"#F5C518","#5A4000",0.03);st.position.set(Math.sin(a)*0.32,0.06+(i===2?0.05:0),Math.cos(a)*0.32);st.rotation.y=a;cr.add(st);}
  const band=mesh(new T.TorusGeometry(0.33,0.03,6,24,Math.PI),"#F5C518",0,0,0,cr);band.rotation.x=-Math.PI/2;band.rotation.z=Math.PI;band.material=m_;sph(0.05,"#FF4FA3",0,0.07,0.33,cr,8,6);}
 if(ht==="vikingo"){const c=new T.Mesh(new T.SphereGeometry(0.52,16,10,0,Math.PI*2,0,Math.PI*0.5),M("#9DB4C8"));c.position.y=0.05;head.add(c);cyl(0.53,0.53,0.08,"#C68A4A",0,0.08,0,head,20);for(const s of [-1,1]){const h=cone(0.09,0.42,"#FFF6C8",s*0.5,0.4,0,head,10);h.rotation.z=-s*0.9;}}
 if(ht==="reves"){const c=new T.Mesh(new T.SphereGeometry(0.5,16,10,0,Math.PI*2,0,Math.PI*0.45),M("#2E7BEF"));c.position.y=0.06;head.add(c);box(0.6,0.06,0.42,"#2E7BEF",0,0.2,-0.48,head);}
 if(ht==="rey"){const cr=cyl(0.38,0.4,0.28,"#F5C518",0,0.48,0,head,16);cr.material=M("#F5C518","#5A4000");for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const sp=cone(0.07,0.2,"#F5C518",Math.cos(a)*0.36,0.72,Math.sin(a)*0.36,head,6);sp.material=cr.material;sph(0.04,["#E2465C","#2E7BEF","#19A858"][i%3],Math.cos(a)*0.39,0.48,Math.sin(a)*0.39,head,6,4);}box(0.62,0.08,0.62,"#C23B4E",0,0.36,0,head).visible=false;}
 if(ht==="dino"){const c=new T.Mesh(new T.SphereGeometry(0.54,16,10,0,Math.PI*2,0,Math.PI*0.55),M("#19A858"));c.position.y=0.03;head.add(c);for(let i=0;i<5;i++){const sp=cone(0.1,0.22,"#F5C518",0,0.5-i*0.05+(i===0?0:0),0.2-i*0.18,head,4);sp.position.y=0.52-Math.abs(i-1)*0.06;}for(const s of [-1,1]){sph(0.08,"#FFFFFF",s*0.16,0.42,0.42,head,8,6);sph(0.04,"#14212E",s*0.16,0.43,0.48,head,6,4);}}
 if(hs==="cresta"){for(let i=0;i<6;i++){const c=cone(0.12,0.4-Math.abs(i-2.5)*0.05,hair,0,0.45,0.3-i*0.16,head,6);c.rotation.x=-0.2+i*0.12;}}
 // lentes nuevos
 const f=L.face;
 if(f==="redondos"){for(const s of [-1,1]){const r=mesh(new T.TorusGeometry(0.11,0.018,6,18),"#8A5A2B",s*0.17,0.0,0.46,head);const gl=new T.Mesh(new T.CircleGeometry(0.1,16),new T.MeshBasicMaterial({color:0xBFE6FF,transparent:true,opacity:0.3}));gl.position.set(s*0.17,0,0.465);head.add(gl);}box(0.1,0.02,0.02,"#8A5A2B",0,0.02,0.47,head);}
 if(f==="corazonrosa"||f==="corazon"){for(const s of [-1,1]){const h=flatShape(heartShape(0.17),"#FF4FA3","#5A1030",0.03);h.position.set(s*0.17,0.0,0.45);head.add(h);const l=flatShape(heartShape(0.12),"#FFB3D6","#5A2040",0.035);l.position.set(s*0.17,0.01,0.452);head.add(l);}box(0.1,0.02,0.02,"#FF4FA3",0,0.03,0.47,head);}
 if(f==="estrelladorada"||f==="estrella"){for(const s of [-1,1]){const h=flatShape(starShape(0.16),"#F5C518","#5A4000",0.03);h.position.set(s*0.17,0.01,0.45);head.add(h);const l=flatShape(starShape(0.1),"#FFF6C8","#6A5A20",0.035);l.position.set(s*0.17,0.01,0.452);head.add(l);}box(0.1,0.02,0.02,"#F5C518",0,0.03,0.47,head);}
 if(f==="gatito"){for(const s of [-1,1]){const sh=new T.Shape();sh.moveTo(-0.13,-0.06);sh.lineTo(0.1,-0.07);sh.quadraticCurveTo(0.15,0.0,0.16,0.1);sh.lineTo(0.05,0.05);sh.lineTo(-0.13,0.06);sh.closePath();const m=flatShape(sh,"#7B4BD1","#2A1050",0.03);m.position.set(s*0.17,0,0.45);if(s<0)m.scale.x=-1;head.add(m);sph(0.02,"#F5C518",s*0.3,0.08,0.47,head,6,4);}box(0.1,0.02,0.02,"#7B4BD1",0,0.02,0.47,head);}
 if(f==="deportivos"){const v=new T.Mesh(new T.CylinderGeometry(0.49,0.49,0.15,24,1,true,-0.85,1.7),new T.MeshToonMaterial({color:0x1E2329,gradientMap:TOON,side:T.DoubleSide}));v.position.y=0.02;head.add(v);const st=new T.Mesh(new T.CylinderGeometry(0.495,0.495,0.03,24,1,true,-0.85,1.7),M("#FF4F6B"));st.position.y=0.09;head.add(st);}
 if(f==="heroe"){const v=new T.Mesh(new T.CylinderGeometry(0.48,0.48,0.17,24,1,true,-1.1,2.2),new T.MeshToonMaterial({color:0xD9263B,gradientMap:TOON,side:T.DoubleSide}));v.position.y=0.03;head.add(v);for(const s of [-1,1]){const h=new T.Mesh(new T.CircleGeometry(0.075,12),new T.MeshBasicMaterial({color:0xffffff}));h.position.set(s*0.165,0.01,0.475);head.add(h);}}
 if(f==="visor"){const v=new T.Mesh(new T.CylinderGeometry(0.5,0.5,0.16,24,1,true,-0.9,1.8),new T.MeshBasicMaterial({map:patTex("arcoiris","#FFFFFF"),transparent:true,opacity:0.85,side:T.DoubleSide}));v.position.y=0.02;head.add(v);}
}
/* --- probador 3D (girando) antes de comprar --- */
let tryR=null,tryS=null,tryC=null,tryChar=null,tryAnim=0;
function tryOn(over,item,onBuy){if(!thumbSetup())return false;
 if(!tryR){tryR=document.createElement("canvas");tryR.width=tryR.height=280;tryS=new T.Scene();tryS.add(new T.HemisphereLight(0xffffff,0xD8C8B0,1));const d=new T.DirectionalLight(0xffffff,0.5);d.position.set(3,5,6);tryS.add(d);tryC=new T.PerspectiveCamera(30,1,0.1,100);}
 sheet("✨ Probador",b=>{const cv=document.createElement("canvas");cv.width=cv.height=280;cv.className="trycv";b.appendChild(cv);const ctx=cv.getContext("2d");
  b.appendChild(el("div","res",item.name+(item.tag?' <span class="ptag">'+item.tag+'</span>':"")));
  if(tryChar)tryS.remove(tryChar.g);tryChar=makeChar(Object.assign({},S.look,over));tryChar.shadow.visible=false;tryS.add(tryChar.g);
  const head=item.slot==="hat"||item.slot==="face";tryC.position.set(0,head?2.75:1.8,head?3.8:7.4);tryC.lookAt(0,head?2.5:1.5,0);
  let t=0;const tick=()=>{if(!cv.isConnected){cancelAnimationFrame(tryAnim);return;}t+=0.016;tryChar.g.rotation.y=Math.sin(t*0.8)*0.9;animChar(tryChar,0,0.016,false);thR.setSize(280,280,false);thR.render(tryS,tryC);ctx.clearRect(0,0,280,280);ctx.drawImage(thR.domElement,0,0);tryAnim=requestAnimationFrame(tick);};tick();
  const r=el("div","row");const no=el("button","btn ghost","Volver");no.onclick=()=>{thR.setSize(150,150,false);closeSheet();};const yes=el("button","btn coinb big",'Comprar · '+priceHTML(item));
  yes.onclick=()=>{if(!pay(item))return;thR.setSize(150,150,false);onBuy();confetti();sfx("compra");};r.append(no,yes);b.appendChild(r);},{half:false});
 return true;}
/* --- opciones de cara en el armario --- */
function faceStylesUI(body){
 const row=(title,list,key,re)=>{body.appendChild(el("h3","",title));const g=el("div","seg");list.forEach(o=>{const own=!o.p||S.owned[key+o.id];const b=el("button","",o.name+(own?"":' · <span class="coin sm"></span> '+o.p));b.setAttribute("aria-pressed",(S.look[key]||0)===o.id?"true":"false");
  b.onclick=()=>{if(!own){if(!pay({p:o.p,cur:"mc"}))return;S.owned[key+o.id]=1;confetti();sfx("compra");}S.look[key]=o.id;buildPlayer();save();re();};g.appendChild(b);});body.appendChild(g);};
 const re=()=>openCloset("cara");
 body.appendChild(el("div","res",imgTag(lookThumb({},FRAME_HEAD),"")));
 row("👀 Ojos",EYE_STYLES,"eyeS",re);row("😊 Boca",MOUTH_STYLES,"mouthS",re);row("🌸 Mejillas",CHEEKS,"cheekS",re);
 body.appendChild(el("h3","","🎨 Color de ojos"));seg(body,EYES.map((c,i)=>[i,'<span class="sw" style="display:inline-block;background:'+c+'"></span>']),S.look.eyes||0,v=>{S.look.eyes=v;buildPlayer();re();});}
