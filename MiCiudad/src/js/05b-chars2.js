/* ---------- Accesorios, mascotas y espadas ---------- */
function extraLook(L,body,head){
 let wings=null;
 const a=L.acc||"none",f=L.face||"none",n=L.neck||"none";
 if(a==="mochila"){box(0.62,0.7,0.3,"#E2465C",0,1.3,-0.4,body);box(0.5,0.25,0.06,"#F5C518",0,1.15,-0.56,body);}
 if(a==="capa_roja"||a==="capa_morada"){const c=a==="capa_roja"?"#D9263B":"#5B2DA8";const cp=box(0.9,1.35,0.06,c,0,1.05,-0.32,body);cp.rotation.x=0.18;box(0.9,0.08,0.3,c,0,1.72,-0.15,body);}
 if(a==="alas_mariposa"||a==="alas_angel"||a==="alas_dragon"){
  const col=a==="alas_mariposa"?"#FF4FA3":a==="alas_angel"?"#FFFFFF":"#2E8B47";const col2=a==="alas_mariposa"?"#25B9E8":a==="alas_angel"?"#E8EEF2":"#7FD8B5";
  wings=[];for(const s of [-1,1]){const pv=new T.Group();pv.position.set(s*0.12,1.55,-0.3);body.add(pv);
   const w1=box(0.06,0.9,1.1,col,0,0.2,-0.55,pv);w1.position.x=s*0.02;const w2=box(0.05,0.6,0.7,col2,0,-0.35,-0.45,pv);
   if(a==="alas_angel"){w1.scale.set(1,1.1,1.2);}
   pv.rotation.z=s*0.2;wings.push(pv);pv.children.forEach(c=>{c.position.x+=s*0.05;});pv.rotation.y=s*0.35;
   const holder=new T.Group();pv.add(holder);}
  // abrir hacia los lados
  wings.forEach((w,i)=>{w.rotation.order="YXZ";});
 }
 if(a==="jetpack"){for(const s of [-1,1]){cyl(0.16,0.16,0.8,"#C9D3DC",s*0.2,1.3,-0.42,body,12);const fl=cone(0.13,0.35,"#F28C28",s*0.2,0.78,-0.42,body,8);fl.rotation.x=Math.PI;fl.material=M("#F28C28","#8A3A00");}}
 if(f==="lentes"||f==="corazon"||f==="estrella"){const c=f==="lentes"?"#14212E":f==="corazon"?"#FF4FA3":"#F5C518";for(const s of [-1,1]){const l=f==="lentes"?box(0.24,0.14,0.04,c,s*0.17,0.04,0.45,head):cyl(0.13,0.13,0.05,c,s*0.17,0.04,0.45,head,f==="estrella"?5:12);if(f!=="lentes")l.rotation.x=Math.PI/2;}box(0.12,0.03,0.03,c,0,0.06,0.46,head);}
 if(f==="antifaz"){box(0.72,0.16,0.06,"#14212E",0,0.05,0.42,head);}
 if(f==="mascarilla"){box(0.5,0.26,0.06,"#BFE6FF",0,-0.14,0.42,head);}
 if(n==="corbatin"){box(0.28,0.12,0.06,"#E2465C",0,1.74,0.28,body);}
 if(n==="bufanda"){const b=mesh(new T.TorusGeometry(0.33,0.1,8,16),"#E2465C",0,1.78,0,body);b.rotation.x=Math.PI/2;box(0.16,0.45,0.08,"#E2465C",0.15,1.55,0.3,body);}
 if(n==="perlas"){for(let i=0;i<9;i++){const t=-0.8+i*0.2;sph(0.05,"#F4F1E8",Math.sin(t)*0.36,1.72-Math.cos(t)*0.06,0.2+Math.cos(t)*0.1,body,8,6);}}
 if(n==="medalla"){box(0.05,0.3,0.02,"#2E7BEF",0,1.6,0.27,body);const m=cyl(0.1,0.1,0.03,"#F5C518",0,1.42,0.28,body,14);m.rotation.x=Math.PI/2;m.material=M("#F5C518","#5A4000");}
 return wings;
}
const PET_TYPES={
 perro:{name:"Perrito",icon:"🐶",r:"comun"},gato:{name:"Gatito",icon:"🐱",r:"comun"},conejo:{name:"Conejo",icon:"🐰",r:"comun"},
 pinguino:{name:"Pingüino",icon:"🐧",r:"rara"},panda:{name:"Panda",icon:"🐼",r:"rara"},zorro:{name:"Zorro",icon:"🦊",r:"rara"},
 unicornio:{name:"Unicornio",icon:"🦄",r:"epica"},dragon:{name:"Dragón bebé",icon:"🐲",r:"legendaria",fly:true},fenix:{name:"Fénix",icon:"🔥",r:"legendaria",fly:true}
};
const RARITY={comun:{name:"Común",c:"#8A99A6"},rara:{name:"Rara",c:"#2E7BEF"},epica:{name:"Épica",c:"#7B4BD1"},legendaria:{name:"Legendaria",c:"#E2A511"}};
function makePet(id){
 if(id==="panda"){const g=makePetBase("conejo");recolor(g,"#F4F1E8");const hd=g.children.find(c=>c.type==="Group");if(hd){hd.children.forEach(c=>{if(c.geometry&&c.geometry.type==="BoxGeometry"&&c.position.y>0.3)c.visible=false;});for(const s of [-1,1]){sph(0.1,"#1E2329",s*0.2,0.25,0,hd,8,6);sph(0.09,"#1E2329",s*0.13,0.05,0.22,hd,8,6);}}
  g.children.forEach(c=>{if(c.geometry&&c.geometry.type==="BoxGeometry"&&c.position.y<0.3)c.material=M("#1E2329");});return g;}
 if(id==="zorro"){const g=makePetBase("gato");recolor(g,"#E86A2A");const t=box(0.22,0.22,0.6,"#FFFFFF",0,0.75,-0.75,g);t.rotation.x=-0.5;return g;}
 if(id==="fenix"){const g=new T.Group();const b=sph(0.42,"#F28C28",0,0.7,0,g);b.material=M("#F28C28","#7A2A00");b.scale.z=1.3;sph(0.28,"#F5C518",0,1.1,0.35,g).material=M("#F5C518","#6A4A00");cone(0.08,0.22,"#E2465C",0,1.1,0.65,g,6).rotation.x=Math.PI/2;
  for(const s of [-1,1]){const w=box(0.9,0.06,0.5,"#E2465C",s*0.65,0.85,0,g);w.rotation.z=s*0.4;w.material=M("#E2465C","#6A1010");}
  for(let i=0;i<3;i++){const t=cone(0.1,0.7,"#F5C518",(i-1)*0.15,0.6,-0.7,g,6);t.rotation.x=-1.9;t.material=M("#F5C518","#6A4A00");}return g;}
 return makePetBase(id);
}
function recolor(g,c){g.traverse(o=>{if(o.isMesh&&o.material&&o.material.color&&o.material!==undefined){const hex=o.material.color.getHexString();if(["c68a4a","f28c28","f4f1e8"].includes(hex))o.material=M(c);}});}
const SWORDS=[
 {id:"madera",name:"Espada de madera",icon:"🪵",dmg:1,p:0,c:"#B5762E",glow:null},
 {id:"hierro",name:"Espada de hierro",icon:"⚔️",dmg:1.7,p:1500,cur:"$",c:"#C9D3DC",glow:null},
 {id:"cristal",name:"Espada de cristal",icon:"💎",dmg:2.6,p:60,cur:"mc",c:"#7FD8F5",glow:"#0A5A7A"},
 {id:"fuego",name:"Espada de fuego",icon:"🔥",dmg:3.6,p:120,cur:"mc",c:"#F2662B",glow:"#7A2A00"},
 {id:"rayo",name:"Espada del rayo",icon:"⚡",dmg:4.5,p:200,cur:"mc",c:"#F5D22B",glow:"#6A5A00"},
 {id:"arcoiris",name:"Espada arcoíris",icon:"🌈",dmg:6,p:350,cur:"mc",c:"#FF4FA3",glow:"#6A1050"}
];
function makeSword(id){
 const s=SWORDS.find(x=>x.id===id)||SWORDS[0];const g=new T.Group();
 box(0.08,0.32,0.08,"#5A3A1F",0,0,0,g);box(0.4,0.07,0.1,"#F5C518",0,0.18,0,g);
 const bl=box(0.1,1.15,0.04,s.c,0,0.8,0,g);if(s.glow)bl.material=M(s.c,s.glow);
 if(id==="arcoiris"){["#F5C518","#19A858","#2E7BEF"].forEach((c,i)=>{const st=box(0.105,0.3,0.045,c,0,0.45+i*0.32,0,g);st.material=M(c,"#303030");});}
 cone(0.05,0.18,s.c,0,1.46,0,g,4);
 return g;
}
