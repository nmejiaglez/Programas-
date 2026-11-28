/* ---------- Mundo ---------- */
const doors=[];
function buildWorld(){
 const CZ=zone({id:"city",name:"Ciudad",icon:"🏙️",cx:0,cz:0,hw:96,hd:96,spawn:{x:0,z:18}});ROOT=CZ.g;
 {const gr=new T.Mesh(new T.PlaneGeometry(600,600),texMat(GRASS_TEX,90,90));gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;ROOT.add(gr);}
 const G=[-90,-30,30,90];
 const roadM="#5B6470";
 for(const g of G){
  const h=new T.Mesh(new T.PlaneGeometry(194,14),texMat(ROAD_TEX,28,2));h.position.set(0,0.02,g);h.rotation.x=-Math.PI/2;h.receiveShadow=true;ROOT.add(h);
  const v=new T.Mesh(new T.PlaneGeometry(14,194),texMat(ROAD_TEX,2,28));v.position.set(g,0.025,0);v.rotation.x=-Math.PI/2;v.receiveShadow=true;ROOT.add(v);
 }
 const dashGeo=new T.PlaneGeometry(2.4,0.35);
 for(const g of G){for(let t=-94;t<=94;t+=6){
   if(G.some(q=>Math.abs(q-t)<8))continue;
   let d=mesh(dashGeo,"#F4F1E8",t,0.04,g);d.rotation.x=-Math.PI/2;
   d=mesh(dashGeo,"#F4F1E8",g,0.04,t);d.rotation.x=-Math.PI/2;d.rotation.z=Math.PI/2;
 }}
 const zeb=new T.PlaneGeometry(1.1,5);
 for(const gx of [-30,30])for(const gz of [-30,30]){
  for(const s of [-1,1]){for(let k=-3;k<=3;k++){
   let z1=mesh(zeb,"#FFFFFF",gx+k*1.8,0.045,gz+s*10.5);z1.rotation.x=-Math.PI/2;
   let z2=mesh(zeb,"#FFFFFF",gx+s*10.5,0.045,gz+k*1.8);z2.rotation.x=-Math.PI/2;z2.rotation.z=Math.PI/2;
  }}
 }
 const C=[-60,0,60];
 for(const bx of C)for(const bz of C){
  const park=bx===0&&bz===0;
  const p=park?mesh(new T.BoxGeometry(46,0.3,46),"#7FCB60",bx,0.15,bz):new T.Mesh(new T.BoxGeometry(46,0.3,46),texMat(TILE_TEX,15,15));if(!park){p.position.set(bx,0.15,bz);p.receiveShadow=true;ROOT.add(p);}else{p.material=texMat(GRASS_TEX,8,8);}
  if(!park){ for(const s of [-1,1]){ lamp(bx+s*22.3,bz+22.3); lamp(bx+s*22.3,bz-22.3);} }
 }
 for(const b of BUILDINGS)building(b);
 buildCityPark();
 for(let t=-110;t<=110;t+=11){tree(t+Math.random()*3,-108+Math.random()*4,1.2,false);tree(t+Math.random()*3,108+Math.random()*4,1.2,false);tree(-108+Math.random()*4,t,1.2,false);tree(108+Math.random()*4,t,1.2,false);}
 for(let i=0;i<14;i++){const cl=new T.Group();for(let k=0;k<4;k++)sph(4+Math.random()*3,"#FFFFFF",k*5-7,Math.random()*2,Math.random()*3,cl);cl.position.set(Math.random()*300-150,52+Math.random()*18,Math.random()*300-150);cl.scale.y=0.55;ROOT.add(cl);clouds.push(cl);}
}
const clouds=[];
function lamp(x,z){cyl(0.15,0.2,5,"#3E4B59",x,2.8,z);sph(0.5,"#FFF4C2",x,5.4,z,null);}
function building(b){
 const f=FACE[b.f];const alongZ=b.f==="n"||b.f==="s";
 const cx=b.bx+f.x*(18-b.d/2),cz=b.bz+f.z*(18-b.d/2);
 const g=new T.Group();g.position.set(cx,0.3,cz);g.rotation.y=Math.atan2(f.x,f.z);ROOT.add(g);
 box(b.w,b.h,b.d,b.col,0,b.h/2,0,g);
 box(b.w+0.4,0.6,b.d+0.4,b.roof,0,0.3,0,g);
 if(b.id==="casa"){
  const r=mesh(new T.ConeGeometry(1,1,4),b.roof,0,b.h+2.6,0,g);r.rotation.y=Math.PI/4;r.scale.set((b.w+2)/1.414,5.2,(b.d+2)/1.414);
  box(1.6,3.5,1.6,"#B14A35",b.w/4,b.h+3,-b.d/5,g);
 }else box(b.w+1.2,1.2,b.d+1.2,b.roof,0,b.h+0.6,0,g);
 const fz=b.d/2;
 box(4.6,4.8,0.35,b.sign,0,2.4,fz+0.12,g);
 box(3.6,4.2,0.4,"#2D3B4A",0,2.1,fz+0.18,g);
 box(0.12,4.2,0.45,"#9DB4C8",0,2.1,fz+0.2,g);
 const winC=b.id==="mall"?"#7EC4EE":"#BFE6FF";
 for(let y=3.4;y<b.h-1.6;y+=3.6)for(let x=-b.w/2+3;x<=b.w/2-3;x+=4.2){if(Math.abs(x)<4.2&&y<6.5)continue;if(b.id==="bomberos"&&Math.abs(x)>4&&y<8)continue;box(2.2,1.7,0.2,winC,x,y,fz+0.1,g);}
 for(let y=3.4;y<b.h-1.6;y+=3.6)for(let z=-b.d/2+3;z<=b.d/2-3;z+=4.2){box(0.2,1.7,2.2,winC,b.w/2+0.1,y,z,g);box(0.2,1.7,2.2,winC,-b.w/2-0.1,y,z,g);}
 const sw=Math.min(b.w-3,15);
 const sg=new T.Mesh(new T.PlaneGeometry(sw,sw/4),new T.MeshBasicMaterial({map:signTex(b.icon+" "+b.name,b.sign)}));
 sg.position.set(0,Math.min(b.h-1.8,7.4),fz+0.25);g.add(sg);
 if(b.id==="hospital"){box(1.3,4.4,0.3,"#E2465C",b.w/2-5,b.h-4,fz+0.2,g);box(4.4,1.3,0.3,"#E2465C",b.w/2-5,b.h-4,fz+0.2,g);
  const hp=cyl(4,4,0.2,"#3E4B59",-6,b.h+1.3,0,g,24);box(0.6,0.1,3.4,"#FFFFFF",-7,b.h+1.45,0,g);box(0.6,0.1,3.4,"#FFFFFF",-5,b.h+1.45,0,g);box(2,0.1,0.6,"#FFFFFF",-6,b.h+1.45,0,g);
  const amb=makeCar("#FFFFFF");amb.position.set(b.w/2-3,0,fz+5);g.add(amb);box(2.06,0.3,3.6,"#E2465C",0,0.95,0,amb);}
 if(b.id==="escuela"){box(4.5,5,4.5,b.col,0,b.h+3.4,-2,g);cone(3.6,3.4,b.roof,0,b.h+7.6,-2,g,4).rotation.y=Math.PI/4;box(2,2,0.3,"#FFFFFF",0,b.h+3.6,0.3,g);
  cyl(0.12,0.12,9,"#C9D3DC",b.w/2-2,4.5,fz+4,g);box(3,1.8,0.08,"#2E6FD8",b.w/2-0.5,8,fz+4,g);box(3,0.6,0.1,"#FFFFFF",b.w/2-0.5,8,fz+4,g);}
 if(b.id==="bomberos"){for(const s of [-1,1]){box(7,6.5,0.3,"#EDEFF2",s*8.5,3.25,fz+0.12,g);for(let y=1;y<6.5;y+=1.2)box(7,0.1,0.35,"#C9D0D8",s*8.5,y,fz+0.14,g);}
  const tr=new T.Group();tr.position.set(-b.w/2-3.5,0,4);g.add(tr);box(3,2.6,7,"#D9483B",0,1.8,0,tr);box(2.8,1.5,2,"#BFE6FF",0,2.6,3,tr);box(0.6,0.6,6,"#C9D0D8",0,3.4,-0.5,tr);for(const sx of [-1.4,1.4])for(const sz of [-2.4,2.4]){const w=cyl(0.6,0.6,0.5,"#222831",sx,0.6,sz,tr);w.rotation.z=Math.PI/2;}}
 if(b.id==="super"||b.id==="helados"||b.id==="cine"){const aw=box(10,0.4,2.6,b.sign,0,5.3,fz+1.3,g);aw.rotation.x=0.18;}
 if(b.id==="cine"){for(let i=-6;i<=6;i+=1.5){sph(0.25,"#FFE68A",i,b.h-0.6,fz+0.4,g).material=M("#FFE68A","#8A6A00");}box(5,7,0.3,"#E2A511",-b.w/2+5,4.5,fz+0.15,g);box(4.4,6.4,0.32,"#2C1F5E",-b.w/2+5,4.5,fz+0.17,g);box(5,7,0.3,"#E2465C",b.w/2-5,4.5,fz+0.15,g);box(4.4,6.4,0.32,"#14304A",b.w/2-5,4.5,fz+0.17,g);}
 if(b.id==="helados"){const c=cone(2,5,"#D79A4E",0,b.h+3.8,0,g,14);c.rotation.x=Math.PI;sph(2.2,"#F48FB8",0,b.h+6.8,0,g);sph(1.7,"#7A4A2A",0,b.h+8.6,0,g);sph(0.5,"#E2465C",0,b.h+10.4,0,g);
  for(const s of [-1,1]){cyl(1,1,0.2,"#FFFFFF",s*6,1.2,fz+5,g);cyl(0.1,0.1,1.2,"#9DB4C8",s*6,0.6,fz+5,g);const um=cone(2.2,1,"#F48FB8",s*6,3.2,fz+5,g,8);cyl(0.08,0.08,2.6,"#9DB4C8",s*6,2,fz+5,g);}}
 if(b.id==="mall"){box(b.w-6,b.h-3,0.25,"#7EC4EE",0,(b.h-3)/2+0.5,fz+0.05,g);box(0.4,b.h,0.4,"#FFFFFF",-b.w/2+3,b.h/2,fz+0.2,g);box(0.4,b.h,0.4,"#FFFFFF",b.w/2-3,b.h/2,fz+0.2,g);}
 if(b.id==="casa"){for(let x=-b.w/2-2;x<=b.w/2+2;x+=1.4){box(0.25,1.2,0.25,"#FFFFFF",x,0.6,fz+6,g);}box(b.w+4,0.2,0.15,"#FFFFFF",0,1,fz+6,g);box(b.w+4,0.2,0.15,"#FFFFFF",0,0.5,fz+6,g);
  for(let i=0;i<5;i++)sph(0.45,["#E2465C","#F5C518","#FF4FA3","#7B4BD1","#F28C28"][i],-b.w/2+1.5+i*1.2,0.5,fz+2,g);
  box(0.8,1.1,0.5,"#2E6FD8",5,1.4,fz+5.4,g);cyl(0.08,0.08,1,"#3E4B59",5,0.5,fz+5.4,g);}
 for(const s of [-1,1])tree(b.bx-f.x*15+(alongZ?s*12:0),b.bz-f.z*15+(alongZ?0:s*12),1);
 const W=alongZ?b.w:b.d,D=alongZ?b.d:b.w;addCol(cx,cz,W,D,b.h+2);
 if(b.id==="bomberos"){const tx=cx+(-b.w/2-3.5)*Math.cos(0)+0,tz=cz+4;}
 const dx=b.bx+f.x*20.2,dz=b.bz+f.z*20.2;doors.push({b,x:dx,z:dz});spot({x:dx,z:dz,r:4.2,label:b.icon+" Entrar: "+b.name,fn:()=>enter(b)});
}
function buildCityPark(){
 const ring=cyl(4.6,4.8,1,"#C9C2B2",0,0.8,0,null,28);
 const water=cyl(4.1,4.1,0.2,"#4FB7E8",0,1.25,0,null,28);water.material=M("#4FB7E8","#0A3A55");
 cyl(0.6,0.8,2.6,"#C9C2B2",0,2.2,0,null,12);cyl(1.6,0.6,0.5,"#C9C2B2",0,3.6,0,null,16);
 fountainDrop=sph(0.45,"#BDEBFF",0,4.3,0);
 addCol(0,0,9.4,9.4);
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;if(i%3===0)continue;tree(Math.cos(a)*15,Math.sin(a)*15,1);}
 for(const [x,z,r] of [[8,-8,0.8],[-8,8,-2.3],[-8,-8,2.3],[8,8,-0.8]]){const bg=new T.Group();bg.position.set(x,0.3,z);bg.rotation.y=r;ROOT.add(bg);box(3.2,0.25,1,"#B5762E",0,0.8,0,bg);box(3.2,0.9,0.2,"#B5762E",0,1.3,-0.45,bg);box(0.2,0.8,0.8,"#3E4B59",-1.4,0.4,0,bg);box(0.2,0.8,0.8,"#3E4B59",1.4,0.4,0,bg);}
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2;sph(0.4,["#E2465C","#F5C518","#FF4FA3","#FFFFFF"][i%4],Math.cos(a)*7,0.5,Math.sin(a)*7,null,8,6);}
}
let fountainDrop=null;

