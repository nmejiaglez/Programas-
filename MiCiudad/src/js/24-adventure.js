/* ================= ISLA DE AVENTURA ================= */
const AV={cx:-330,cz:0,R:56};
const av={mons:[],cd:0,calm:0,chests:[]};
function advMaxHp(){return 100+(S.adv.lvl-1)*15;}
function advXpNeed(l){return Math.round(40*Math.pow(l,1.45));}
function swordOf(){return SWORDS.find(s=>s.id===S.adv.sword)||SWORDS[0];}
function advDmg(){return 12*swordOf().dmg*(1+(S.adv.lvl-1)*0.12);}
const MON_KINDS={
 slime:{name:"Gelatina",cols:["#5BD16B","#3FA9DE","#B06BE0"]},
 hongo:{name:"Hongo travieso",cols:["#E2465C","#F28C28","#7B4BD1"]},
 rey:{name:"Rey Gelatina",cols:["#F5C518"]}
};
function makeMonster(kind,lvl,col){
 const g=new T.Group();let size=1;
 if(kind==="slime"||kind==="rey"){size=kind==="rey"?3.2:0.9+lvl*0.05;const b=sph(1,col,0,0.75,0,g,16,12);b.scale.set(1,0.75,1);b.material=M(col,"#101010");
  for(const s of [-1,1]){sph(0.16,"#FFFFFF",s*0.33,0.95,0.82,g,8,6);sph(0.08,"#14212E",s*0.33,0.95,0.95,g,6,4);}
  box(0.4,0.06,0.05,"#14212E",0,0.65,0.97,g);if(kind==="rey"){const cr=cyl(0.5,0.5,0.35,"#F5C518",0,1.65,0,g,12);cr.material=M("#F5C518","#5A4000");for(let i=0;i<5;i++){const a=i/5*Math.PI*2;cone(0.1,0.3,"#F5C518",Math.cos(a)*0.45,1.95,Math.sin(a)*0.45,g,6).material=cr.material;}}}
 if(kind==="hongo"){size=1+lvl*0.04;cyl(0.35,0.45,0.9,"#F4F1E8",0,0.45,0,g,12);const cap=sph(0.85,col,0,1.05,0,g,14,10);cap.scale.y=0.6;for(let i=0;i<5;i++){const a=i*1.3;sph(0.14,"#FFFFFF",Math.cos(a)*0.55,1.35,Math.sin(a)*0.55,g,6,4);}
  for(const s of [-1,1])sph(0.08,"#14212E",s*0.15,0.6,0.36,g,6,4);}
 g.scale.setScalar(size);
 const bg=new T.Sprite(new T.SpriteMaterial({color:0x14212E,depthTest:false}));bg.scale.set(1.6/size,0.18/size,1);bg.position.y=2.1;g.add(bg);
 const fg=new T.Sprite(new T.SpriteMaterial({color:0xE2465C,depthTest:false}));fg.scale.set(1.5/size,0.12/size,1);fg.position.y=2.1;fg.renderOrder=11;g.add(fg);
 const tag=labelSprite("Nv "+lvl,"rgba(20,48,74,.7)","#fff");tag.scale.set(1.4/size,0.35/size,1);tag.position.y=2.55;g.add(tag);
 return {g,fg,size};
}
function buildAdventure(){
 const Z=zone({id:"aventura",name:"Isla Aventura",icon:"⚔️",desc:"Explore, derrote monstruos y suba de nivel",cx:AV.cx,cz:AV.cz,hw:60,hd:62,spawn:{x:AV.cx,z:AV.cz+48,face:Math.PI},sky:0xB8E6C8,combat:true,noVehicle:true,
  block:(x,z)=>Math.hypot(x-AV.cx,z-AV.cz)>AV.R&&!(Math.abs(x-AV.cx)<8&&z>AV.cz+40),
  onEnter(){P.maxHp=advMaxHp();P.hp=P.maxHp;drawHp();},onLeave(){P.maxHp=100;P.hp=100;zoneButton(null);},
  onDeath(){toast("💫 ¡Lo derrotaron! Vuelve al campamento");setTimeout(()=>{P.maxHp=advMaxHp();respawn();},600);}});
 ROOT=Z.g;
 const sea=plane(300,300,"#3FA9DE",AV.cx,0.05,AV.cz);sea.material=M("#3FA9DE","#0A3550");
 cyl(AV.R+2,AV.R+4,0.4,"#F2D79B",AV.cx,0.1,AV.cz,null,48);cyl(AV.R-1,AV.R,0.35,"#6FC25A",AV.cx,0.2,AV.cz,null,48);
 box(16,0.3,14,"#C9A574",AV.cx,0.16,AV.cz+50,null);
 // campamento
 const fire=grp(AV.cx-5,0.3,AV.cz+46);for(let i=0;i<5;i++){const l=cyl(0.15,0.15,1.6,"#6E4A2A",0,0.2,0,fire,6);l.rotation.z=Math.PI/2;l.rotation.y=i*1.25;}
 Z.flame=cone(0.6,1.4,"#F28C28",0,0.9,0,fire,8);Z.flame.material=M("#F28C28","#8A3A00");
 spot({zone:"aventura",x:AV.cx-5,z:AV.cz+46,r:2.8,label:"🔥 Descansar (curarse)",fn:()=>{P.maxHp=advMaxHp();heal(P.maxHp);toast("❤️ Vida completa");}});
 const tent=grp(AV.cx+5,0.3,AV.cz+48);const tc=mesh(new T.ConeGeometry(2.6,3,4),"#2E7BEF",0,1.5,0,tent);tc.rotation.y=Math.PI/4;addCol(AV.cx+5,AV.cz+48,3.6,3.6,3);
 spot({zone:"aventura",x:AV.cx+5,z:AV.cz+45.4,r:2.6,label:"⚔️ Herrería: espadas",fn:()=>openShop("espadas")});
 spot({zone:"aventura",x:AV.cx,z:AV.cz+53,r:2.2,label:"🚌 Viajar en bus",fn:openPlaces});
 signMesh("⚔️ Isla Aventura","#2E8B47",8,AV.cx,4.6,AV.cz+42,0);for(const s of [-1,1])box(0.3,4.5,0.3,"#6E4A2A",AV.cx+s*4,2.25,AV.cz+42,null);
 // naturaleza y ruinas
 for(let i=0;i<55;i++){const a=Math.random()*Math.PI*2,r=rnd(8,AV.R-3);const x=AV.cx+Math.cos(a)*r,z=AV.cz+Math.sin(a)*r;if(z>AV.cz+36&&Math.abs(x-AV.cx)<14)continue;if(Math.random()<0.75)tree(x,z,rnd(0.9,1.4));else{const rk=sph(rnd(0.8,1.6),"#8A8F96",x,0.6,z,null,7,5);rk.scale.y=0.7;addCol(x,z,2,2);}}
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const x=AV.cx+Math.cos(a)*7,z=AV.cz-36+Math.sin(a)*7;cyl(0.7,0.8,i%2?3:5,"#C9C2B2",x,i%2?1.8:2.8,z,null,10);addCol(x,z,1.6,1.6);}
 addPlat(AV.cx-25,1.3,AV.cz+5,8,1,8,"#7FA35A");addPlat(AV.cx-25,2.3,AV.cz+5,5,1,5,"#7FA35A");addPlat(AV.cx+28,1.3,AV.cz-10,7,1,7,"#7FA35A");
 // cofres
 const cpos=[[-20,20],[25,25],[-38,-8],[34,-22],[0,-20],[-12,-44]];
 cpos.forEach(([dx,dz],i)=>{const x=AV.cx+dx,z=AV.cz+dz;const g=grp(x,0.3,z);box(1.4,0.9,1,"#9A6B3E",0,0.45,0,g);box(1.5,0.35,1.1,"#B5762E",0,1.05,0,g);box(0.3,0.35,0.12,"#F5C518",0,0.8,0.55,g);
  const c={id:"c"+i,x,z,g};av.chests.push(c);spot({zone:"aventura",x,z,r:2.4,label:()=>S.adv.chests[c.id]===todayStr()?"🧰 Cofre vacío (vuelva mañana)":"🧰 Abrir cofre",fn:()=>openChest(c)});});
 // monstruos
 const spawns=[];
 for(let i=0;i<10;i++){const a=rnd(0.3,2.8),r=rnd(14,28);spawns.push(["slime",1+Math.floor(Math.random()*3),Math.cos(a)*r,Math.sin(a)*r*0.6+20]);}
 for(let i=0;i<10;i++){const a=rnd(-Math.PI,0),r=rnd(18,34);spawns.push([Math.random()<0.5?"slime":"hongo",4+Math.floor(Math.random()*3),Math.cos(a)*r,Math.sin(a)*r*0.5]);}
 for(let i=0;i<8;i++){const a=rnd(-2.6,-0.5),r=rnd(30,48);spawns.push([Math.random()<0.5?"slime":"hongo",7+Math.floor(Math.random()*3),Math.cos(a)*r,Math.sin(a)*r]);}
 spawns.push(["rey",12,0,-40]);
 spawns.forEach(([kind,lvl,dx,dz])=>{const x=AV.cx+dx,z=AV.cz+dz;if(Math.hypot(dx,dz)>AV.R-4)return;const tier=lvl>=7?2:lvl>=4?1:0;const col=MON_KINDS[kind].cols[Math.min(tier,MON_KINDS[kind].cols.length-1)];
  const mm=makeMonster(kind,lvl,col);mm.g.position.set(x,0.3,z);Z.g.add(mm.g);
  const maxhp=Math.round((kind==="rey"?600:30*Math.pow(lvl,1.25)));
  av.mons.push({kind,lvl,g:mm.g,fg:mm.fg,size:mm.size,hx:x,hz:z,x,z,hp:maxhp,max:maxhp,dmg:kind==="rey"?22:4+lvl*1.6,sp:kind==="rey"?2.4:2.4+lvl*0.12,hitCd:0,dead:0,tx:x,tz:z,hop:Math.random()*6,kb:0,kbx:0,kbz:0});});
 ROOT=scene;
}
function openChest(c){if(S.adv.chests[c.id]===todayStr()){toast("Ya abrió este cofre hoy");return;}S.adv.chests[c.id]=todayStr();
 const v=earn(rnd(100,400)|0,"aventura");let mc=0;if(Math.random()<0.25){mc=2+Math.floor(Math.random()*4);S.mc+=mc;}
 if(Math.random()<0.35){S.adv.potions++;}
 toast("🧰 +$"+fmt(v)+(mc?" y +"+mc+" MediCoins":""));save();hud();}
function attack(){
 if(av.cd>0)return;av.cd=0.4;P.swing=0.35;
 const fx=Math.sin(P.face),fz=Math.cos(P.face);let hit=0;
 for(const m of av.mons){if(m.dead>0)continue;const dx=m.x-P.x,dz=m.z-P.z,d=Math.hypot(dx,dz);const reach=2.6+m.size*0.9;
  if(d<reach&&(dx*fx+dz*fz)/(d||1)>0.25){hit++;const dmg=advDmg()*(0.9+Math.random()*0.2);m.hp-=dmg;m.kb=0.18;m.kbx=dx/(d||1);m.kbz=dz/(d||1);m.g.scale.setScalar(m.size*1.15);
   m.fg.scale.x=Math.max(0.001,1.5/m.size*m.hp/m.max);
   if(m.hp<=0)monsterDie(m);}}
}
function monsterDie(m){m.dead=m.kind==="rey"?60:18;m.g.visible=false;S.stats.monsters++;
 const xp=m.kind==="rey"?400:10*m.lvl;const v=earn(m.kind==="rey"?600:8*m.lvl,"aventura");
 if(m.kind==="rey"){if(S.adv.boss!==todayStr()){S.adv.boss=todayStr();giveMC(10,"¡Derrotó al Rey Gelatina!");}else toast("👑 ¡Derrotó al Rey Gelatina! +$"+fmt(v));}
 else if(Math.random()<0.06){S.mc+=1;toast("💎 +1 MediCoin · +$"+v);}
 advXp(xp);save();hud();}
function advXp(n){S.adv.xp+=n;while(S.adv.xp>=advXpNeed(S.adv.lvl)){S.adv.xp-=advXpNeed(S.adv.lvl);S.adv.lvl++;P.maxHp=advMaxHp();P.hp=P.maxHp;drawHp();toast("⭐ ¡Subió a nivel "+S.adv.lvl+"! Más vida y más fuerza");if(S.adv.lvl%5===0)giveMC(2,"nivel "+S.adv.lvl);}}
function usePotion(){if(S.adv.potions<=0){sheet("🧪 Pociones",b=>{b.appendChild(el("p","","Cada poción le devuelve 60 de vida."));const r=el("div","row");const a=el("button","btn go","3 por $ 300");a.onclick=()=>{if(!pay({p:300,cur:"$"}))return;S.adv.potions+=3;closeSheet();};const c=el("button","btn coinb",'10 · <span class="coin sm"></span> 8');c.onclick=()=>{if(!pay({p:8,cur:"mc"}))return;S.adv.potions+=10;closeSheet();};r.append(a,c);b.appendChild(r);},{half:true});return;}
 if(P.hp>=P.maxHp){toast("Ya tiene la vida llena");return;}S.adv.potions--;heal(60);toast("🧪 +60 de vida");}
shopTab("espadas","Espadas ⚔️",body=>{
 body.appendChild(el("p","muted","Úselas en la Isla Aventura. Más fuerte la espada, más rápido derrota monstruos. Su nivel: "+S.adv.lvl+"."));
 itemGrid(body,SWORDS,s=>"Fuerza x"+s.dmg,s=>!!S.adv.swords[s.id],s=>S.adv.sword===s.id,s=>{S.adv.swords[s.id]=1;S.adv.sword=s.id;buildPlayer();openShop("espadas");});
},30);
mode({id:"aventura",dbg:av,init:buildAdventure,update(dt){
 if(curZone.id!=="aventura")return;
 const Z=ZONES.aventura;Z.flame.scale.y=1+Math.sin(perf*12)*0.2;
 if(av.cd>0)av.cd-=dt;
 let threatened=false;
 for(const m of av.mons){
  if(m.dead>0){m.dead-=dt;if(m.dead<=0){m.hp=m.max;m.x=m.hx;m.z=m.hz;m.g.visible=true;m.fg.scale.x=1.5/m.size;}continue;}
  if(m.g.scale.x>m.size)m.g.scale.setScalar(Math.max(m.size,m.g.scale.x-dt*2));
  const dx=P.x-m.x,dz=P.z-m.z,d=Math.hypot(dx,dz);
  const aggro=!P.dead&&d<(m.kind==="rey"?18:12)&&Math.hypot(P.x-m.hx,P.z-m.hz)<30;
  if(m.kb>0){m.kb-=dt;m.x+=m.kbx*10*dt;m.z+=m.kbz*10*dt;}
  else if(aggro){threatened=true;const stop=0.9+m.size*0.55;if(d>stop){m.x+=dx/d*m.sp*dt;m.z+=dz/d*m.sp*dt;}m.g.rotation.y=Math.atan2(dx,dz);
   if(d<stop+0.4&&Math.abs(P.y-0.3)<2.5){m.hitCd-=dt;if(m.hitCd<=0){m.hitCd=0.9;damage(m.dmg);}}}
  else{const tx=m.tx-m.x,tz=m.tz-m.z,td=Math.hypot(tx,tz);if(td<0.5||Math.random()<0.003){m.tx=m.hx+rnd(-5,5);m.tz=m.hz+rnd(-5,5);}else{m.x+=tx/td*1.2*dt;m.z+=tz/td*1.2*dt;m.g.rotation.y=Math.atan2(tx,tz);}}
  if(Math.hypot(m.x-AV.cx,m.z-AV.cz)>AV.R-2){const a=Math.atan2(m.z-AV.cz,m.x-AV.cx);m.x=AV.cx+Math.cos(a)*(AV.R-2);m.z=AV.cz+Math.sin(a)*(AV.R-2);}
  m.hop+=dt*(aggro?9:5);m.g.position.set(m.x,0.3+Math.abs(Math.sin(m.hop))*0.35*(m.kind==="hongo"?0.5:1),m.z);
 }
 if(threatened)av.calm=0;else{av.calm+=dt;if(av.calm>4&&P.hp<P.maxHp&&!P.dead)heal(dt*4);}
 const need=advXpNeed(S.adv.lvl);
 zoneButton("⭐ Nv "+S.adv.lvl+" ("+Math.floor(S.adv.xp/need*100)+" %) · 🧪 Poción ×"+S.adv.potions,usePotion);
}});
