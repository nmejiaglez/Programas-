/* ================= MOTOR 3D ================= */
const canvas=$("c");
const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
renderer.shadowMap.type=T.PCFSoftShadowMap;
function setQuality(){renderer.setPixelRatio(S.quality==="baja"?0.75:Math.min(window.devicePixelRatio||1,S.quality==="alta"?2:1.6));const sh=S.quality!=="baja";if(renderer.shadowMap.enabled!==sh){renderer.shadowMap.enabled=sh;sun.castShadow=sh;scene.traverse(o=>{if(o.material&&o.material.needsUpdate!==undefined)o.material.needsUpdate=true;});}const ms=S.quality==="alta"?2048:1024;if(sun.shadow.mapSize.x!==ms){sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}}
const scene=new T.Scene();
scene.background=new T.Color(0x9FD8F5);
scene.fog=new T.Fog(0xCDEBFA,110,260);
const camera=new T.PerspectiveCamera(58,1,0.1,900);
const hemi=new T.HemisphereLight(0xF4FAFF,0xD8C8B0,0.95);scene.add(hemi);
const sun=new T.DirectionalLight(0xFFF4E2,0.62);sun.position.set(50,90,35);scene.add(sun);scene.add(sun.target);
sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;sun.shadow.camera.near=10;sun.shadow.camera.far=220;sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.03;sun.shadow.radius=3;sun.shadow.mapSize.set(1024,1024);
const SUN_OFF=new T.Vector3(30,80,45);
function followSun(x,y,z){const sx=Math.round(x),sz=Math.round(z);sun.position.set(sx+SUN_OFF.x,y+SUN_OFF.y,sz+SUN_OFF.z);sun.target.position.set(sx,y,sz);}
/* cielo con degradado */
const skyU={top:{value:new T.Color(0x3FA0EA)},bot:{value:new T.Color(0xCDEBFA)},glow:{value:new T.Color(0xFFF6D8)}};
const skyDome=new T.Mesh(new T.SphereGeometry(700,32,16),new T.ShaderMaterial({uniforms:skyU,side:T.BackSide,depthWrite:false,fog:false,
 vertexShader:"varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
 fragmentShader:"uniform vec3 top;uniform vec3 bot;uniform vec3 glow;varying vec3 vP;void main(){float h=clamp(vP.y,0.0,1.0);vec3 c=mix(bot,top,pow(h,0.55));float s=max(0.0,dot(vP,normalize(vec3(0.45,0.55,0.3))));c+=glow*pow(s,24.0)*0.55+glow*pow(s,4.0)*0.12;gl_FragColor=vec4(c,1.0);}"}));
skyDome.renderOrder=-10;skyDome.frustumCulled=false;scene.add(skyDome);
function setSky(hex){const c=new T.Color(hex);const top=c.clone().multiplyScalar(0.62);top.b=Math.min(1,top.b+0.18);skyU.top.value.copy(top);const bot=c.clone().lerp(new T.Color(0xFFFFFF),0.35);skyU.bot.value.copy(bot);scene.fog.color.copy(bot);scene.background.copy(bot);}
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
addEventListener("resize",resize);

const matCache={};
const TOON=(()=>{const d=new Uint8Array([178,178,178,255,222,222,222,255,255,255,255,255]);const t=new T.DataTexture(d,3,1,T.RGBAFormat);t.minFilter=t.magFilter=T.NearestFilter;t.needsUpdate=true;return t;})();
function M(c,em){const k=c+"|"+(em||"");if(!matCache[k])matCache[k]=new T.MeshToonMaterial({color:c,emissive:em||0x000000,gradientMap:TOON});return matCache[k];}
function shadowize(m){const g=m.geometry&&m.geometry.type;m.receiveShadow=true;m.castShadow=!(g==="PlaneGeometry"||g==="CircleGeometry"||(m.material&&m.material.transparent));return m;}
function shadowAll(root){root.traverse(o=>{if(o.isMesh&&o!==skyDome&&!(o.material&&o.material.isShaderMaterial))shadowize(o);});}
let ROOT=scene;
function mesh(geo,c,x,y,z,parent,em){const m=shadowize(new T.Mesh(geo,M(c,em)));m.position.set(x||0,y||0,z||0);(parent||ROOT).add(m);return m;}
function box(w,h,d,c,x,y,z,p,em){return mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p,em);}
function cyl(rt,rb,h,c,x,y,z,p,seg){return mesh(new T.CylinderGeometry(rt,rb,h,seg||14),c,x,y,z,p);}
function sph(r,c,x,y,z,p,ws,hs){return mesh(new T.SphereGeometry(r,ws||14,hs||10),c,x,y,z,p);}
function cone(r,h,c,x,y,z,p,seg){return mesh(new T.ConeGeometry(r,h,seg||14),c,x,y,z,p);}
function grp(x,y,z,p){const g=new T.Group();g.position.set(x||0,y||0,z||0);(p||ROOT).add(g);return g;}
function plane(w,d,c,x,y,z,p){const m=mesh(new T.PlaneGeometry(w,d),c,x,y,z,p);m.rotation.x=-Math.PI/2;return m;}

/* ---------- Zonas ---------- */
const ZONES={};
function zone(def){def.g=new T.Group();scene.add(def.g);if(def.floor==null)def.floor=true;if(def.floorY==null)def.floorY=0.3;ZONES[def.id]=def;return def;}
let curZone=null;
function zoneAt(x,z){for(const id in ZONES){const Z=ZONES[id];if(Math.abs(x-Z.cx)<=Z.hw+8&&Math.abs(z-Z.cz)<=Z.hd+8)return Z;}return ZONES.city;}
function setZone(Z){
 if(curZone===Z)return;const prev=curZone;curZone=Z;
 for(const id in ZONES)ZONES[id].g.visible=ZONES[id]===Z;
 setSky(Z.sky||0x9FD8F5);scene.fog.near=Z.fogNear||110;scene.fog.far=Z.fogFar||260;
 const zt=$("zonetag");zt.textContent=Z.icon+" "+Z.name;zt.hidden=Z.id==="city";
 if(prev&&prev.onLeave)prev.onLeave();
 if(Z.onEnter)Z.onEnter();
 refreshCombatUI();
}

/* ---------- Colisiones y plataformas ---------- */
const colliders=[];
function addCol(cx,cz,w,d,h,y0){const c={a:cx-w/2,b:cx+w/2,c:cz-d/2,d:cz+d/2,h:h||0,y0:y0||0,y1:h?(y0||0)+h+1.5:Infinity};colliders.push(c);return c;}
function addPlat(x,top,z,w,th,d,color,opts){
 const m=box(w,th,d,color,x,top-th/2,z,opts&&opts.parent);
 const c=Object.assign({a:x-w/2,b:x+w/2,c:z-d/2,d:z+d/2,y0:top-th,y1:top,h:0,plat:true,mesh:m,dx:0,dz:0,dy:0},opts||{});
 colliders.push(c);return c;
}
function movePlat(c,x,top,z){
 const w=c.b-c.a,d=c.d-c.c,th=c.y1-c.y0;const ox=(c.a+c.b)/2,oz=(c.c+c.d)/2;
 c.dx+=x-ox;c.dz+=z-oz;c.dy+=top-c.y1;
 c.a=x-w/2;c.b=x+w/2;c.c=z-d/2;c.d=z+d/2;c.y1=top;c.y0=top-th;
 c.mesh.position.set(x,top-th/2,z);
}
function rm(o){if(o&&o.parent)o.parent.remove(o);}
function removeCol(c){const i=colliders.indexOf(c);if(i>=0)colliders.splice(i,1);}
function blocked(x,z,r,y,Zo){
 const Z=Zo||curZone||ZONES.city;
 if(Math.abs(x-Z.cx)>Z.hw||Math.abs(z-Z.cz)>Z.hd)return true;
 if(Z.block&&Z.block(x,z,r))return true;
 y=y==null?0.3:y;
 for(const k of colliders){
  if(k.off)continue;
  if(x>k.a-r&&x<k.b+r&&z>k.c-r&&z<k.d+r){if(k.y1<=y+0.45)continue;if(k.y0>=y+1.8)continue;return true;}
 }
 return false;
}
function support(x,z,y,r){
 r=r==null?0.3:r;const Z=curZone||ZONES.city;
 let best=Z.floor?Z.floorY:-Infinity,plat=null;
 for(const k of colliders){
  if(k.off||k.y1===Infinity||k.nostand)continue;
  if(x>k.a-r&&x<k.b+r&&z>k.c-r&&z<k.d+r&&k.y1<=y+0.45&&k.y1>best){best=k.y1;plat=k;}
 }
 return {y:best,plat};
}

function canvasTex(w,h,draw){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);const t=new T.CanvasTexture(c);t.anisotropy=4;return t;}
function rr(x,X,Y,W,H,R){x.beginPath();x.moveTo(X+R,Y);x.arcTo(X+W,Y,X+W,Y+H,R);x.arcTo(X+W,Y+H,X,Y+H,R);x.arcTo(X,Y+H,X,Y,R);x.arcTo(X,Y,X+W,Y,R);x.closePath();}
function signTex(text,bg){return canvasTex(512,128,(x,w,h)=>{x.fillStyle=bg;rr(x,0,0,w,h,26);x.fill();x.strokeStyle="rgba(255,255,255,.9)";x.lineWidth=8;rr(x,6,6,w-12,h-12,22);x.stroke();x.fillStyle="#fff";let fs=62;x.font="800 "+fs+"px 'Baloo 2', Nunito, Arial, sans-serif";while(x.measureText(text).width>w-50&&fs>30){fs-=4;x.font="800 "+fs+"px 'Baloo 2', Nunito, Arial, sans-serif";}x.textAlign="center";x.textBaseline="middle";x.fillText(text,w/2,h/2+4);});}
function signMesh(text,bg,w,x,y,z,ry,p){const g=new T.PlaneGeometry(w,w/4),m=new T.MeshBasicMaterial({map:signTex(text,bg)});const s=new T.Mesh(g,m);const b=new T.Mesh(g,m);b.rotation.y=Math.PI;b.position.z=-0.01;s.add(b);s.position.set(x,y,z);s.rotation.y=ry||0;(p||ROOT).add(s);return s;}
function labelSprite(text,bg,fg){const tex=canvasTex(256,64,(x,w,h)=>{x.font="800 30px Nunito, Arial, sans-serif";const tw=Math.min(w-8,x.measureText(text).width+28);x.fillStyle=bg;rr(x,(w-tw)/2,8,tw,48,22);x.fill();x.fillStyle=fg;x.textAlign="center";x.textBaseline="middle";x.fillText(text,w/2,33);});const s=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:false,transparent:true}));s.scale.set(3.2,0.8,1);s.renderOrder=10;return s;}
function emojiSprite(e,size){const tex=canvasTex(128,128,(x)=>{x.font="96px sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText(e,64,70);});const s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthTest:true}));s.scale.set(size||1.5,size||1.5,1);return s;}
function tree(x,z,s,col,p){s=s||1;cyl(0.35*s,0.45*s,2.6*s,"#7A5232",x,1.3*s,z,p);const k=Math.random();if(k<0.5){sph(2.1*s,k<0.25?"#3FA34D":"#4DB85A",x,3.8*s,z,p);sph(1.4*s,"#5CC768",x+0.8*s,4.8*s,z+0.4*s,p);}else{cone(2.2*s,4.2*s,"#2E8B47",x,4.4*s,z,p,10);}if(col!==false)addCol(x,z,1.2,1.2);}

/* ---------- Texturas del suelo ---------- */
function noiseTex(base,spots,n,size,draw){const t=canvasTex(size||256,size||256,(x,w,h)=>{x.fillStyle=base;x.fillRect(0,0,w,h);for(let i=0;i<(n||900);i++){x.fillStyle=spots[Math.floor(Math.random()*spots.length)];const px=Math.random()*w,py=Math.random()*h;if(draw)draw(x,px,py);else x.fillRect(px,py,2+Math.random()*3,2+Math.random()*3);}});t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
function texMat(tex,rx,ry,col){const t=tex.clone();t.needsUpdate=true;t.repeat.set(rx,ry);return new T.MeshToonMaterial({map:t,color:col||0xffffff,gradientMap:TOON});}
const GRASS_TEX=noiseTex("#86CF62",["#7BC457","#93DA6E","#6FB84E","#A2E07C"],1400,256,(x,px,py)=>{x.save();x.translate(px,py);x.rotate((Math.random()-0.5)*0.8);x.fillRect(0,0,2,5+Math.random()*5);x.restore();});
const ROAD_TEX=noiseTex("#5B6470",["#545C67","#646D79","#59616C","#6A727E"],2200,256);
const TILE_TEX=canvasTex(128,128,(x,w,h)=>{x.fillStyle="#E9E3D6";x.fillRect(0,0,w,h);for(let i=0;i<500;i++){x.fillStyle=Math.random()<0.5?"#E1DACB":"#F0EBE0";x.fillRect(Math.random()*w,Math.random()*h,3,3);}x.strokeStyle="#D2C9B6";x.lineWidth=3;x.strokeRect(0,0,w,h);x.beginPath();x.moveTo(w/2,0);x.lineTo(w/2,h);x.moveTo(0,h/2);x.lineTo(w,h/2);x.lineWidth=1.5;x.stroke();});TILE_TEX.wrapS=TILE_TEX.wrapT=T.RepeatWrapping;
/* ---------- Lugares para interactuar ---------- */
const SPOTS=[];
function spot(def){def.zone=def.zone||"city";def.r=def.r||3.5;SPOTS.push(def);return def;}

/* ---------- Modos de juego ---------- */
const MODES=[];
function mode(m){MODES.push(m);return m;}
