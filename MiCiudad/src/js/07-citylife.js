/* ---------- Tráfico, vecinos, monedas ---------- */
const cars=[];
function setupCars(){
 const cols=["#2E7BEF","#F5C518","#19A858","#7B4BD1","#F28C28","#14B8A6","#E2465C","#FFFFFF"];
 const rings=[[26.5,1],[33.5,-1],[86.5,1],[93.5,-1]];
 let i=0;for(const [r,dir] of rings){for(let k=0;k<2;k++){const g=makeCar(cols[i%cols.length]);ZONES.city.g.add(g);cars.push({g,r,dir,s:Math.random()*8*r,v:9+Math.random()*4});i++;}}
}
function carPos(c){const r=c.r,L=8*r;let s=((c.s%L)+L)%L;const seg=Math.floor(s/(2*r));const u=s-seg*2*r-r;
 if(seg===0)return [u,-r,1,0];if(seg===1)return [r,u,0,1];if(seg===2)return [-u,r,-1,0];return [-r,-u,0,-1];}
function updateCars(dt){for(const c of cars){const p=carPos(c);const dx=p[2]*c.dir,dz=p[3]*c.dir;
 const ax=p[0]+dx*3,az=p[1]+dz*3;const near=Math.hypot(ax-P.x,az-P.z)<3.2||npcs.some(n=>Math.hypot(ax-n.x,az-n.z)<2.6);
 if(!near)c.s+=c.v*dt*c.dir;const q=carPos(c);c.g.position.set(q[0],0.3,q[1]);c.g.rotation.y=Math.atan2(q[2]*c.dir,q[3]*c.dir);}}
const LINES=[-80.5,-39.5,-20.5,20.5,39.5,80.5];
const npcs=[];
function setupNPCs(){
 for(let i=0;i<12;i++){
  const look={skin:Math.floor(Math.random()*4),hair:Math.floor(Math.random()*HAIRS.length),hstyle:STYLES_H[Math.floor(Math.random()*3)].id,shirt:SHIRTS[Math.floor(Math.random()*SHIRTS.length)].id,pants:PANTS[Math.floor(Math.random()*PANTS.length)].id,hat:Math.random()<0.25?["gorra","vaquero","fiesta"][i%3]:"none"};
  const ch=makeChar(look);ZONES.city.g.add(ch.g);
  const n={ch,look,i:Math.floor(Math.random()*6),j:Math.floor(Math.random()*6),x:0,z:0,ti:0,tj:0,wait:0};
  n.x=LINES[n.i];n.z=LINES[n.j];n.ti=n.i;n.tj=n.j;ch.g.position.set(n.x,0.3,n.z);npcs.push(n);
 }
}
function updateNPCs(dt){for(const n of npcs){
 const tx=LINES[n.ti],tz=LINES[n.tj];const dx=tx-n.x,dz=tz-n.z;const d=Math.hypot(dx,dz);
 if(n.wait>0){n.wait-=dt;animChar(n.ch,0,dt,false);continue;}
 if(d<0.1){n.i=n.ti;n.j=n.tj;if(Math.random()<0.5){n.ti=Math.max(0,Math.min(5,n.i+(Math.random()<0.5?-1:1)));}else{n.tj=Math.max(0,Math.min(5,n.j+(Math.random()<0.5?-1:1)));}if(Math.random()<0.2)n.wait=1+Math.random()*2;continue;}
 const sp=2.1;const st=Math.min(d,sp*dt);n.x+=dx/d*st;n.z+=dz/d*st;
 n.ch.g.position.set(n.x,0.3,n.z);n.ch.g.rotation.y=Math.atan2(dx,dz);animChar(n.ch,sp,dt,false);}}
const coins=[];const coinGeo=new T.CylinderGeometry(0.45,0.45,0.12,16),gemGeo=new T.OctahedronGeometry(0.45);
function freeSpot(r,Z){Z=Z||ZONES.city;for(let k=0;k<60;k++){const x=Z.cx+(Math.random()*2-1)*(Z.hw-3),z=Z.cz+(Math.random()*2-1)*(Z.hd-3);if(!blocked(x,z,r||1.2,0.3,Z)&&Math.hypot(x-Z.cx,z-Z.cz)>6)return [x,z];}return [Z.cx+10,Z.cz+10];}
function spawnCoin(){const gem=Math.random()<0.07;const [x,z]=freeSpot();const m=new T.Mesh(gem?gemGeo:coinGeo,gem?M("#25B9E8","#0A4A66"):M("#F5B21B","#5A3D00"));if(!gem)m.rotation.x=Math.PI/2;m.position.set(x,1.2,z);ZONES.city.g.add(m);coins.push({m,gem,x,z,t:Math.random()*6});}
function updateCoins(dt){const R=S.perm.iman?4.5:1.6;for(let i=coins.length-1;i>=0;i--){const c=coins[i];c.t+=dt;c.m.position.y=1.2+Math.sin(c.t*3)*0.2;c.m.rotation.y+=dt*3;if(c.gem)c.m.rotation.x+=dt;
 const d=Math.hypot(c.x-P.x,c.z-P.z);
 if(S.perm.iman&&d<R&&d>0.6){c.x+=(P.x-c.x)*dt*6;c.z+=(P.z-c.z)*dt*6;c.m.position.x=c.x;c.m.position.z=c.z;}
 if(d<1.3){rm(c.m);coins.splice(i,1);S.stats.coins++;sfx("moneda");if(typeof retoAdd==="function")retoAdd("monedas",1);if(c.gem){S.mc+=1;toast("💎 +1 MediCoin");}else{const v=earn(5+Math.floor(Math.random()*11));pop("+$"+v);}hud();}}}

