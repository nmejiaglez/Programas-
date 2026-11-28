/* ================= ASERRADERO: talar árboles, juntar troncos y subir de nivel ================= */
const AS={cx:-660,cz:0};
const HACHAS=[{id:"madera",name:"Hacha de madera",icon:"🪓",hits:4,p:0},{id:"hierro",name:"Hacha de hierro",icon:"🪓",hits:3,p:800,cur:"$"},{id:"oro",name:"Hacha de oro",icon:"✨",hits:2,p:60,cur:"mc"},{id:"diamante",name:"Hacha de diamante",icon:"💎",hits:1,p:150,cur:"mc"}];
const MOCHILAS=[{n:5,name:"Bolsa pequeña",p:0},{n:10,name:"Mochila grande",p:1500,cur:"$"},{n:20,name:"Carretilla",p:80,cur:"mc"}];
const as={trees:[],logs:[],carry:0,tag:null,axe:null,hudT:0};
function asS(){if(!S.lenador)S.lenador={lvl:1,xp:0,axe:"madera",bag:5,total:0};return S.lenador;}
function asNeed(l){return 60+l*40;}
function asAxe(){return HACHAS.find(h=>h.id===asS().axe)||HACHAS[0];}
function makeChopTree(x,z,s){const g=grp(x,0.3,z);const trunk=new T.Group();g.add(trunk);
 cyl(0.42*s,0.55*s,3.2*s,"#8A5A2B",0,1.6*s,0,trunk,10);
 const k=Math.random();if(k<0.5){sph(2.0*s,"#3FA34D",0,4.0*s,0,trunk,10,8);sph(1.4*s,"#4DB85A",0.8*s,4.9*s,0.3*s,trunk,10,8);sph(1.3*s,"#5CC768",-0.7*s,4.6*s,-0.4*s,trunk,10,8);}
 else{cone(2.2*s,3.4*s,"#2E8B47",0,4.0*s,0,trunk,10);cone(1.7*s,2.6*s,"#3FA34D",0,5.4*s,0,trunk,10);}
 const stump=cyl(0.5*s,0.58*s,0.45*s,"#7A5232",0,0.22*s,0,g,10);const top=cyl(0.46*s,0.46*s,0.02,"#E8C38E",0,0.46*s,0,g,10);stump.visible=top.visible=false;
 const bar=new T.Group();bar.position.y=6.6*s;g.add(bar);const bg=new T.Mesh(new T.PlaneGeometry(1.6,0.22),new T.MeshBasicMaterial({color:0x14304A,depthTest:false}));bar.add(bg);
 const fg=new T.Mesh(new T.PlaneGeometry(1.5,0.14),new T.MeshBasicMaterial({color:0x3BC46F,depthTest:false}));fg.position.z=0.01;bar.add(fg);bar.visible=false;bg.renderOrder=fg.renderOrder=11;
 const t={g,trunk,stump,top,bar,fg,x,z,s,hp:1,down:false,fall:0,regrow:0};const c=addCol(x,z,1.1*s,1.1*s);t.col=c;return t;}
function makeLog(x,y,z){const g=grp(x,y,z);const m=cyl(0.28,0.28,1.4,"#B5762E",0,0.28,0,g,10);m.rotation.z=Math.PI/2;g.rotation.y=Math.random()*Math.PI;
 for(const s of [-1,1]){const e=cyl(0.27,0.27,0.02,"#E8C38E",s*0.71,0.28,0,g,10);e.rotation.z=Math.PI/2;}shadowAll(g);return {g,x,z,t:0};}
function buildAserradero(){
 const Z=zone({id:"aserradero",name:"Aserradero",icon:"🪓",desc:"Tale árboles, junte troncos y suba de nivel",cx:AS.cx,cz:AS.cz,hw:46,hd:46,sky:0xB8E2F2,
  spawn:{x:AS.cx,z:AS.cz+38,face:Math.PI},onEnter(){as.axe=null;buildPlayer();asHud();},onLeave(){$("banner").hidden=true;zoneButton(null);if(as.tag){rm(as.tag);as.tag=null;}$("chopBtn").hidden=true;}});
 ROOT=Z.g;
 const gr=new T.Mesh(new T.PlaneGeometry(200,200),texMat(GRASS_TEX,30,30));gr.rotation.x=-Math.PI/2;gr.position.set(AS.cx,0.3,AS.cz);gr.receiveShadow=true;Z.g.add(gr);
 const path=new T.Mesh(new T.PlaneGeometry(6,90),new T.MeshToonMaterial({color:0xD9B98A,gradientMap:TOON}));path.rotation.x=-Math.PI/2;path.position.set(AS.cx,0.32,AS.cz);Z.g.add(path);
 // aserradero (depósito)
 const sx=AS.cx+14,sz=AS.cz+22;const mill=grp(sx,0.3,sz);box(9,4.5,6,"#B5762E",0,2.25,0,mill);const rf=box(10,0.4,7,"#7A3B22",0,4.8,0,mill);rf.rotation.z=0.12;
 box(3.2,3,0.2,"#3E2A1F",0,1.5,3.05,mill);const saw=cyl(1.2,1.2,0.08,"#C9D3DC",-5.6,1.6,1,mill,24);saw.rotation.x=Math.PI/2;as.saw=saw;
 box(3,1,1.4,"#8A5A2B",-5.6,0.8,1,mill);for(let i=0;i<6;i++){const l=cyl(0.3,0.3,2,"#B5762E",3.5+((i%3)*0.62),0.3+Math.floor(i/3)*0.55,-4,mill,10);l.rotation.x=Math.PI/2;}
 addCol(sx,sz,9.4,6.4,4);signMesh("🪓 Aserradero","#7A3B22",5,sx,5.8,sz+3.4,0);
 spot({zone:"aserradero",x:sx-3,z:sz+5,r:3.4,label:()=>as.carry?"🪵 Entregar "+as.carry+" troncos":"🪓 Mejorar hacha y mochila",fn:()=>{if(as.carry)asDeliver();else openAserradero();}});
 // bus
 const bs=grp(AS.cx+6,0.3,AS.cz+42);box(3.4,0.2,1.4,"#2E7BEF",0,2.6,0,bs);box(0.15,2.6,0.15,"#3E4B59",-1.5,1.3,0,bs);box(0.15,2.6,0.15,"#3E4B59",1.5,1.3,0,bs);
 spot({zone:"aserradero",x:AS.cx+6,z:AS.cz+40.5,r:2.6,label:"🚌 Viajar en bus",fn:openPlaces});
 // bosque para talar
 let n=0;for(let i=0;i<60&&n<26;i++){const x=AS.cx+rnd(-38,38),z=AS.cz+rnd(-40,12);if(Math.abs(x-AS.cx)<4)continue;if(as.trees.some(t=>Math.hypot(t.x-x,t.z-z)<6))continue;as.trees.push(makeChopTree(x,z,rnd(0.85,1.15)));n++;}
 for(let i=0;i<30;i++){const a=i/30*Math.PI*2;tree(AS.cx+Math.cos(a)*48,AS.cz+Math.sin(a)*48,1.3,false,Z.g);}
 ROOT=scene;}
function asHud(){const bn=$("banner");if(!curZone||curZone.id!=="aserradero"){bn.hidden=true;return;}const s=asS();
 bn.hidden=false;bn.style.background="#7A3B22";bn.textContent="🪓 Nivel "+s.lvl+" · "+s.xp+"/"+asNeed(s.lvl)+"  ·  🪵 "+as.carry+"/"+s.bag;
 if(as.tag)rm(as.tag);if(player){as.tag=labelSprite(as.carry+"/"+s.bag,as.carry>=s.bag?"rgba(226,70,92,.92)":"rgba(122,59,34,.9)","#fff");as.tag.position.y=4.5;player.g.add(as.tag);}}
function asNearTree(){let b=null,bd=3.2;for(const t of as.trees){if(t.down)continue;const d=Math.hypot(t.x-P.x,t.z-P.z)-0.6*t.s;if(d<bd){bd=d;b=t;}}return b;}
function chop(){const t=asNearTree();if(!t){toast("Acérquese a un árbol");return;}
 P.swing=0.35;P.face=Math.atan2(t.x-P.x,t.z-P.z);t.hp-=1/asAxe().hits;t.shake=0.25;t.bar.visible=true;t.fg.scale.x=Math.max(0.01,t.hp);t.fg.position.x=-(1-Math.max(0.01,t.hp))*0.75;
 try{sfx("pop");}catch(e){}
 if(t.hp<=0.001){t.down=true;t.fall=0.001;t.bar.visible=false;t.dir=Math.atan2(t.x-P.x,t.z-P.z);t.col.off=true;sfx("caida");retoAdd("talar",1);}}
function asPickup(){const s=asS();for(let i=as.logs.length-1;i>=0;i--){const l=as.logs[i];if(Math.hypot(l.x-P.x,l.z-P.z)<1.6){if(as.carry>=s.bag){if(!as.fullT||Date.now()-as.fullT>2500){as.fullT=Date.now();toast("🎒 ¡Mochila llena! Lleve los troncos al aserradero");}return;}
  rm(l.g);as.logs.splice(i,1);as.carry++;sfx("moneda");asHud();}}}
function asDeliver(){const s=asS();const n=as.carry;if(!n)return;as.carry=0;const v=earn(18*n*(1+s.lvl*0.15),"aserradero");s.total+=n;s.xp+=n*10;retoAdd("troncos",n);
 let up=0;while(s.xp>=asNeed(s.lvl)){s.xp-=asNeed(s.lvl);s.lvl++;up++;}
 if(up){S.mc+=5*up;hud();confetti();sfx("reto");sheet("🎉 ¡Subió al nivel "+s.lvl+"!",b=>{b.appendChild(el("div","res","🪓🌲<br>Nivel "+s.lvl));b.appendChild(el("p","","Ahora gana más por cada tronco. Premio: +"+(5*up)+" MediCoins."));const k=el("button","btn go big","¡Seguir talando!");k.onclick=closeSheet;b.appendChild(k);},{half:true});}
 else toast("🪵 Entregó "+n+" troncos · +$"+v);save();asHud();}
function openAserradero(){const s=asS();sheet("🪓 Aserradero",b=>{
 b.appendChild(el("div","res","Nivel "+s.lvl+'<div class="rbar big" style="margin:8px 0"><i style="width:'+Math.round(s.xp/asNeed(s.lvl)*100)+'%"></i></div><small style="font-size:14px">'+s.xp+" / "+asNeed(s.lvl)+" · Troncos entregados: "+s.total+"</small>"));
 b.appendChild(el("p","muted","Toque 🪓 Talar cerca de un árbol. Junte los troncos caminando sobre ellos y tráigalos aquí. Cada nivel le paga más."));
 b.appendChild(el("h3","","Hachas (talan más rápido)"));const g=el("div","grid");
 HACHAS.forEach(h=>{const own=!h.p||S.owned["hacha_"+h.id];const on=s.axe===h.id;const c=el("div","card"+(on?" on":""),'<div class="big">'+h.icon+'</div><b>'+h.name+'</b><small>'+h.hits+" golpe"+(h.hits>1?"s":"")+" por árbol</small>");
  const bt=el("button","btn"+(own?(on?" ghost":" go"):(h.cur==="mc"?" coinb":"")),own?(on?"En uso":"Usar"):priceHTML(h));bt.disabled=on;bt.onclick=()=>{if(!own){if(!pay(h))return;S.owned["hacha_"+h.id]=1;sfx("compra");confetti();}s.axe=h.id;as.axe=null;save();openAserradero();};c.appendChild(bt);g.appendChild(c);});b.appendChild(g);
 b.appendChild(el("h3","","Mochila (lleva más troncos)"));const g2=el("div","grid");
 MOCHILAS.forEach(m=>{const own=!m.p||S.owned["bolsa"+m.n];const on=s.bag===m.n;const c=el("div","card"+(on?" on":""),'<div class="big">'+(m.n>10?"🛒":"🎒")+'</div><b>'+m.name+'</b><small>'+m.n+" troncos</small>");
  const bt=el("button","btn"+(own?(on?" ghost":" go"):(m.cur==="mc"?" coinb":"")),own?(on?"En uso":"Usar"):priceHTML(m));bt.disabled=on;bt.onclick=()=>{if(!own){if(!pay(m))return;S.owned["bolsa"+m.n]=1;sfx("compra");confetti();}s.bag=m.n;save();asHud();openAserradero();};c.appendChild(bt);g2.appendChild(c);});b.appendChild(g2);
});}
mode({id:"aserradero",init(){buildAserradero();},
 afterStart(){const c=$("chopBtn");if(c)c.onclick=chop;},
 update(dt){if(!curZone||curZone.id!=="aserradero"){return;}
  const cb=$("chopBtn");cb.hidden=!!(uiOpen||S.riding);const near=asNearTree();cb.classList.toggle("near",!!near);
  // hacha en la mano
  if(player&&!as.axe&&!S.riding){const ax=new T.Group();box(0.07,0.75,0.07,"#8A5A2B",0,0,0,ax);const hd=box(0.32,0.22,0.06,asS().axe==="oro"?"#F5C518":asS().axe==="diamante"?"#7FD8F5":asS().axe==="hierro"?"#C9D3DC":"#B5762E",0.12,0.3,0,ax);player.arms[1].add(ax);ax.position.set(0,-0.75,0.1);ax.rotation.x=Math.PI/2;as.axe=ax;asHud();}
  if(as.saw)as.saw.rotation.z+=dt*8;
  for(const t of as.trees){
   if(t.shake>0){t.shake-=dt;t.trunk.rotation.z=Math.sin(t.shake*60)*0.05;}
   if(t.fall>0&&t.fall<1){t.fall=Math.min(1,t.fall+dt*1.6);const a=t.fall*t.fall*1.45;t.trunk.rotation.set(Math.cos(t.dir)*a,0,-Math.sin(t.dir)*a);
    if(t.fall>=1){t.trunk.visible=false;t.stump.visible=t.top.visible=true;const n=2+(Math.random()<0.4?1:0);for(let k=0;k<n;k++){const d=2+k*1.6;ROOT=curZone.g;as.logs.push(makeLog(t.x+Math.sin(t.dir)*d,0.3,t.z+Math.cos(t.dir)*d));ROOT=scene;}t.regrow=25;}}
   if(t.regrow>0){t.regrow-=dt;if(t.regrow<=0){t.down=false;t.hp=1;t.fall=0;t.trunk.visible=true;t.trunk.rotation.set(0,0,0);t.stump.visible=t.top.visible=false;t.col.off=false;t.trunk.scale.setScalar(0.2);t.grow=1;}}
   if(t.grow>0){t.grow-=dt;t.trunk.scale.setScalar(Math.min(1,1-t.grow+0.2));}}
  for(const l of as.logs){l.t+=dt;l.g.position.y=0.3+Math.abs(Math.sin(l.t*3))*0.08;}
  asPickup();as.hudT+=dt;if(as.hudT>1){as.hudT=0;if(!$("banner").hidden)asHud();}}});
