/* ================= MI CASA EN 3D ================= */
FURN.push(
 {id:"trampolin",name:"Trampolín",icon:"🤸",p:80,cur:"mc"},
 {id:"piscina",name:"Piscina inflable",icon:"🏊",p:100,cur:"mc"},
 {id:"arcade",name:"Máquina arcade",icon:"🕹️",p:120,cur:"mc"},
 {id:"castillo",name:"Cama castillo",icon:"🏰",p:150,cur:"mc"}
);
const HS={cx:-330,cz:-330};
const hs={g:null,cols:[]};
function houseSize(){return S.house.big?{w:24,d:18}:{w:16,d:12};}
const FURN_SLOTS=[
 ["cama",-1,-1],["cuadro",-0.35,-1.05],["trofeo",-0.35,-1],["tele",0.15,-1],["libros",0.6,-1.05],["juegos",0.15,-0.62],
 ["lampara",-1,-0.1],["sofa",0.15,-0.05],["castillo",0.8,-0.35],["tina",-0.85,0.55],["planta",1,0.75],["acuario",1,0.2],
 ["piano",-1,0.2],["trampolin",-0.35,0.45],["piscina",0.5,0.6],["arcade",-0.6,-0.95]
];
function buildHouse(){
 const Z=zone({id:"casa",name:"Mi Casa",icon:"🏠",desc:"Su casa por dentro",hidden:true,cx:HS.cx,cz:HS.cz,hw:14,hd:11,spawn:{x:HS.cx,z:HS.cz+4,face:Math.PI},sky:0xFFF3DE,noVehicle:true,
  onEnter(){buildRoom();},onLeave(){zoneButton(null);},camMax:7.5});
 hs.g=Z.g;
 spot({zone:"casa",x:0,z:0,r:2.2,label:"🚪 Salir a la calle",pos:()=>({x:HS.cx,z:HS.cz+houseSize().d/2-1.2}),fn:exitHouse});
}
function buildRoom(){
 const Z=ZONES.casa;hs.g.clear();hs.cols.forEach(removeCol);hs.cols=[];ROOT=hs.g;
 const {w,d}=houseSize();Z.hw=w/2-0.6;Z.hd=d/2-0.6;const x0=HS.cx,z0=HS.cz;
 plane(w,d,"#E7C9A0",x0,0.31,z0);for(let i=-w/2+1;i<w/2;i+=2)plane(0.05,d,"#C9A574",x0+i,0.32,z0);
 const wc="#FFF3DE";box(w,6,0.4,wc,x0,3,z0-d/2,null);box(0.4,6,d,wc,x0-w/2,3,z0,null);box(0.4,6,d,wc,x0+w/2,3,z0,null);
 box(w/2-1.5,1.2,0.4,wc,x0-w/4-0.75,0.9,z0+d/2,null);box(w/2-1.5,1.2,0.4,wc,x0+w/4+0.75,0.9,z0+d/2,null);
 plane(2.6,1.4,"#7A5232",x0,0.33,z0+d/2-0.4);
 box(3,2,0.2,"#BFE6FF",x0-w/4,3.4,z0-d/2+0.25,null);box(3,2,0.2,"#BFE6FF",x0+w/4,3.4,z0-d/2+0.25,null);
 box(w,0.2,0.3,"#F28C28",x0,0.6,z0-d/2+0.3,null);
 if(S.art&&S.art[0]){box(2.3,2.3,0.12,"#F5C518",x0,3.5,z0-d/2+0.28,null);const pm=new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({color:0xffffff}));pm.position.set(x0,3.5,z0-d/2+0.36);hs.g.add(pm);const im=new Image();im.onload=()=>{const t=new T.Texture(im);t.needsUpdate=true;pm.material.map=t;pm.material.needsUpdate=true;};im.src=S.art[0];}
 for(const [k,fx,fz] of FURN_SLOTS){if(!S.furn[k])continue;furniture(k,x0+fx*(w/2-2.2),z0+fz*(d/2-2));}
 ROOT=scene;
 const n=Object.keys(S.furn).length;zoneButton("🛋️ Muebles: "+n+" · Comprar más",openCasa);
}
function hcol(x,z,w,d,h){const c=addCol(x,z,w,d,h||1.2);c.y1=(h||1.2)+0.3;hs.cols.push(c);return c;}
function furniture(k,x,z){
 const g=grp(x,0.3,z);
 if(k==="cama"){box(3,0.7,4.2,"#7A5232",0,0.35,0,g);box(2.8,0.35,4,"#FFFFFF",0,0.85,0,g);box(2.8,0.3,2.5,"#2E7BEF",0,1.05,0.7,g);box(1.4,0.35,0.8,"#FFFFFF",0,1.15,-1.5,g);hcol(x,z,3,4.2);}
 if(k==="planta"){cyl(0.5,0.35,0.8,"#C2553A",0,0.4,0,g,10);sph(0.9,"#3FA34D",0,1.5,0,g);hcol(x,z,1,1);}
 if(k==="sofa"){box(4,0.8,1.6,"#E2465C",0,0.4,0,g);box(4,1.2,0.4,"#E2465C",0,1,-0.6,g);for(const s of [-1,1])box(0.4,1,1.6,"#C23B4E",s*2,0.7,0,g);hcol(x,z,4.2,1.6);}
 if(k==="lampara"){cyl(0.08,0.08,3,"#3E4B59",0,1.5,0,g,6);cone(0.6,0.7,"#FFF4C2",0,3.1,0,g,12).material=M("#FFF4C2","#806A20");}
 if(k==="tele"){box(3,0.7,0.9,"#7A5232",0,0.35,0,g);box(2.6,1.6,0.15,"#14212E",0,1.6,0,g);box(2.4,1.4,0.16,"#2E7BEF",0,1.6,0.02,g).material=M("#2E7BEF","#0A2A60");hcol(x,z,3,0.9);}
 if(k==="libros"){box(2.4,3,0.8,"#9A6B3E",0,1.5,0,g);for(let r=0;r<3;r++)for(let i=0;i<6;i++)box(0.25,0.7,0.6,pick(["#E2465C","#2E7BEF","#F5C518","#19A858","#7B4BD1"]),-0.9+i*0.36,0.55+r*0.95,0.05,g);hcol(x,z,2.4,0.8);}
 if(k==="cuadro"){box(2,1.4,0.1,"#F5C518",0,3.4,0,g);box(1.7,1.1,0.12,"#7FD8F5",0,3.4,0.02,g);sph(0.25,"#F28C28",0.4,3.6,0.08,g,8,6);}
 if(k==="acuario"){box(2,0.8,1,"#3E4B59",0,0.4,0,g);const gl=box(2,1.2,1,"#7FD8F5",0,1.4,0,g);gl.material=new T.MeshLambertMaterial({color:0x7FD8F5,transparent:true,opacity:0.6});const f=emojiSprite("🐠",0.6);f.position.set(0.3,1.4,0);g.add(f);hcol(x,z,2,1);}
 if(k==="juegos"){box(1.4,0.5,0.8,"#14212E",0,0.25,0,g);box(0.5,0.12,0.3,"#E2465C",-0.3,0.56,0.1,g);box(0.5,0.12,0.3,"#2E7BEF",0.3,0.56,0.1,g);}
 if(k==="piano"){box(2.6,1.3,1.2,"#1E2329",0,0.65,0,g);box(2.4,0.1,0.4,"#FFFFFF",0,1.32,0.45,g);for(let i=0;i<8;i++)box(0.1,0.12,0.25,"#1E2329",-1+i*0.3,1.38,0.4,g);hcol(x,z,2.6,1.2);}
 if(k==="tina"){box(3,0.9,1.6,"#FFFFFF",0,0.45,0,g);box(2.6,0.1,1.2,"#7FD8F5",0,0.88,0,g);hcol(x,z,3,1.6);}
 if(k==="trofeo"){box(0.8,1,0.8,"#9A6B3E",0,0.5,0,g);const c=cyl(0.35,0.2,0.6,"#F5C518",0,1.35,0,g,12);c.material=M("#F5C518","#5A4000");}
 if(k==="trampolin"){const t=addPlat(x,0.9,z,3,0.3,3,"#2E7BEF",{parent:hs.g});t.bounce=13;hs.cols.push(t);for(const s of [-1,1])for(const u of [-1,1])cyl(0.08,0.08,0.6,"#3E4B59",s*1.3,0.3,u*1.3,g,6);}
 if(k==="piscina"){cyl(2,2,0.7,"#FF4FA3",0,0.35,0,g,20);cyl(1.8,1.8,0.1,"#4FB7E8",0,0.66,0,g,20).material=M("#4FB7E8","#0A3550");}
 if(k==="arcade"){box(1.4,2.8,1.2,"#7B4BD1",0,1.4,0,g);box(1.1,0.9,0.1,"#14212E",0,2.1,0.6,g).material=M("#25B9E8","#0A4A66");box(1,0.2,0.5,"#E2465C",0,1.4,0.5,g);hcol(x,z,1.4,1.2,2.8);}
 if(k==="castillo"){box(3.4,1,4.4,"#FF4FA3",0,0.5,0,g);box(3.2,0.3,4.2,"#FFFFFF",0,1.1,0,g);for(const s of [-1,1]){cyl(0.4,0.4,3,"#FF4FA3",s*1.5,1.5,-2,g,10);cone(0.55,1,"#7B4BD1",s*1.5,3.5,-2,g,10);}hcol(x,z,3.4,4.4);}
}
function enterHouse(){closeSheet();const {d}=houseSize();teleport(HS.cx,HS.cz+d/2-2,0.4,Math.PI);}
function exitHouse(){const door=doors.find(x=>x.b.id==="casa");const f=FACE[door.b.f];teleport(door.x+f.x*1.5,door.z+f.z*1.5,0.4,Math.atan2(f.x,f.z));}
function houseUpgradeUI(body){if(S.house.big){body.appendChild(el("p","muted","🏡 Tiene la casa grande."));return;}
 const b=el("button","btn coinb",'🏡 Casa grande: más espacio para muebles · <span class="coin sm"></span> 200');b.onclick=()=>{if(!pay({p:200,cur:"mc"}))return;S.house.big=true;save();toast("🏡 ¡Su casa ahora es grande!");if(curZone.id==="casa")buildRoom();openCasa();};body.appendChild(b);}
mode({id:"casa",init:buildHouse,update(){}});

function refreshHouseArt(){if(curZone&&curZone.id==="casa")buildRoom();}
