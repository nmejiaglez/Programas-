/* ================= ZONA RURAL: GRANJA, PESCA, MERCADO Y REFUGIO ================= */
const SEEDS=[
 {id:"maiz",name:"Maíz",icon:"🌽",p:20,cur:"$",time:60,sell:45,c:"#F5C518"},
 {id:"frijol",name:"Frijol",icon:"🫘",p:30,cur:"$",time:90,sell:70,c:"#7A2A22"},
 {id:"tomate",name:"Tomate",icon:"🍅",p:60,cur:"$",time:150,sell:140,c:"#E2465C"},
 {id:"chiltoma",name:"Chiltoma",icon:"🫑",p:90,cur:"$",time:240,sell:220,c:"#19A858"},
 {id:"sandia",name:"Sandía",icon:"🍉",p:150,cur:"$",time:360,sell:380,c:"#2E8B47"},
 {id:"pitahaya",name:"Pitahaya",icon:"🌺",p:5,cur:"mc",time:600,sell:1500,c:"#E0307A"},
 {id:"cacao",name:"Cacao",icon:"🍫",p:12,cur:"mc",time:1200,sell:4000,c:"#7A4A2A"},
 {id:"dorada",name:"Mazorca dorada",icon:"✨",p:25,cur:"mc",time:1800,sell:9000,c:"#E2A511"}
];
const FISH=[
 {id:"bota",name:"Bota vieja",icon:"🥾",r:"comun",w:8,sell:2},
 {id:"sardina",name:"Sardina",icon:"🐟",r:"comun",w:30,sell:15},
 {id:"tilapia",name:"Tilapia",icon:"🐟",r:"comun",w:28,sell:30},
 {id:"mojarra",name:"Mojarra",icon:"🐠",r:"comun",w:20,sell:45},
 {id:"guapote",name:"Guapote",icon:"🐠",r:"rara",w:12,sell:90},
 {id:"robalo",name:"Róbalo",icon:"🐟",r:"rara",w:8,sell:150},
 {id:"sabalo",name:"Sábalo real",icon:"🐡",r:"epica",w:4,sell:400},
 {id:"sierra",name:"Pez sierra",icon:"🦈",r:"epica",w:2,sell:900},
 {id:"tiburon",name:"Tiburón del lago",icon:"🦈",r:"legendaria",w:0.6,sell:3000},
 {id:"cofre",name:"Cofre del tesoro",icon:"🧰",r:"legendaria",w:0.6,mc:5}
];
const RODS=[
 {id:"basica",name:"Caña básica",icon:"🎣",zone:0.22,luck:1,p:0},
 {id:"bambu",name:"Caña de bambú",icon:"🎋",zone:0.28,luck:1.5,p:800,cur:"$"},
 {id:"fibra",name:"Caña de fibra",icon:"🎣",zone:0.34,luck:2.2,p:40,cur:"mc"},
 {id:"dorada",name:"Caña dorada",icon:"🏆",zone:0.42,luck:3.5,p:120,cur:"mc"}
];
const RZ={cx:0,cz:330};
const LAKE={x:38,z:350,r:20};
const PLOT_POS=[];for(let r=0;r<3;r++)for(let c=0;c<3;c++)PLOT_POS.push({x:-44+c*9,z:300+r*9});
const plotVis=[];
function plotsOpen(){return S.plotsOpen||6;}
function plotState(i){const p=S.plots[i];if(!p)return "vacio";return Date.now()>=p.t0+p.dur?"listo":"creciendo";}
function buildRural(){
 const Z=zone({id:"rural",name:"Granja y Lago",icon:"🌾",desc:"Siembre, coseche, pesque y adopte mascotas",cx:RZ.cx,cz:RZ.cz,hw:70,hd:60,spawn:{x:0,z:282,face:0},sky:0xA8DDF5,
  block:(x,z,r)=>{const d=Math.hypot(x-LAKE.x,z-LAKE.z);if(d<LAKE.r+r-0.5){if(z>LAKE.z-1.4&&z<LAKE.z+1.4&&x<LAKE.x-LAKE.r+11)return false;return true;}return false;}});
 ROOT=Z.g;
 plane(180,160,"#8FD36C",RZ.cx,0.01,RZ.cz);
 plane(6,120,"#D8C39A",0,0.03,RZ.cz);plane(120,5,"#D8C39A",0,0.035,300-6);
 // lago y muelle
 const w=cyl(LAKE.r,LAKE.r,0.2,"#3FA9DE",LAKE.x,0.12,LAKE.z,null,40);w.material=M("#3FA9DE","#0A3550");
 cyl(LAKE.r+1.2,LAKE.r+1.2,0.15,"#D8C39A",LAKE.x,0.06,LAKE.z,null,40);
 for(let i=0;i<10;i++)box(1.1,0.2,2.6,"#9A6B3E",LAKE.x-LAKE.r-1+i*1.15,0.42,LAKE.z,null);
 for(const s of [-1,1])for(let i=0;i<3;i++)cyl(0.15,0.15,1.2,"#6E4A2A",LAKE.x-LAKE.r+i*4,0.2,LAKE.z+s*1.2,null,8);
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2+0.3;const lp=cyl(0.9,0.9,0.05,"#3FA34D",LAKE.x+Math.cos(a)*12,0.25,LAKE.z+Math.sin(a)*12,null,10);}
 const boat=grp(LAKE.x+8,0.3,LAKE.z-6);box(1.6,0.5,3.6,"#C2553A",0,0,0,boat);box(1.3,0.2,3.2,"#7A4A2A",0,0.2,0,boat);
 // granja
 for(let i=0;i<9;i++){const p=PLOT_POS[i];const soil=box(7,0.35,7,"#7A5232",p.x,0.18,p.z);for(let k=-2;k<=2;k++)box(6.6,0.12,0.5,"#6A4628",p.x,0.4,p.z+k*1.3);
  const g=grp(p.x,0.4,p.z);plotVis.push({g,last:"",lock:null});}
 for(let x=-49;x<=-12;x+=2.2){box(0.2,1.1,0.2,"#FFFFFF",x,0.55,294.5);box(0.2,1.1,0.2,"#FFFFFF",x,0.55,326.5);}
 box(37,0.12,0.1,"#FFFFFF",-30.5,0.9,294.5);box(37,0.12,0.1,"#FFFFFF",-30.5,0.9,326.5);
 // granero
 const barn=grp(-48,0.3,345);box(12,7,10,"#C2333B",0,3.5,0,barn);const rf=mesh(new T.ConeGeometry(1,1,4),"#7A2A22",0,9,0,barn);rf.rotation.y=Math.PI/4;rf.scale.set(9.5,4.5,8);
 box(4,5,0.3,"#F4F1E8",0,2.5,5.05,barn);box(3.4,0.25,0.35,"#C2333B",0,2.5,5.1,barn).rotation.z=0.9;box(3.4,0.25,0.35,"#C2333B",0,2.5,5.1,barn).rotation.z=-0.9;addCol(-48,345,12,10,7);
 // molino
 const mill=grp(-20,0.3,360);cyl(1.2,2,12,"#F4F1E8",0,6,0,mill,10);cone(2.4,2.5,"#C2553A",0,13.2,0,mill,10);addCol(-20,360,4,4,12);
 const blades=grp(0,11,2.2,mill);for(let i=0;i<4;i++){const bl=box(0.6,5,0.15,"#B5762E",0,2.5,0,blades);const piv=new T.Group();blades.add(piv);piv.add(bl);piv.rotation.z=i*Math.PI/2;}
 Z.blades=blades;
 // mercado
 const mk=grp(0,0.3,300);box(8,1.2,3,"#9A6B3E",0,0.6,0,mk);for(const s of [-1,1])box(0.25,4,0.25,"#6E4A2A",s*3.8,2,1.3,mk);const aw=box(9,0.3,4,"#E2465C",0,4,0.4,mk);
 ["🌽","🍅","🍉","🐟"].forEach((e,i)=>{const sp=emojiSprite(e,1);sp.position.set(-3+i*2,1.7,0);mk.add(sp);});
 signMesh("🧺 Mercado","#E2465C",5,0,5,298.3,Math.PI);addCol(0,300,8,3,4);
 spot({zone:"rural",x:0,z:297,r:3.2,label:"🧺 Mercado: vender y comprar",fn:()=>openMarket("vender")});
 // refugio de mascotas
 const sh=grp(40,0.3,300);box(10,5,8,"#FFD6E8",0,2.5,0,sh);const sr=mesh(new T.ConeGeometry(1,1,4),"#E55B9A",0,6.5,0,sh);sr.rotation.y=Math.PI/4;sr.scale.set(8,3,6.5);box(3,3.6,0.3,"#7B4BD1",0,1.8,-4.05,sh);
 signMesh("🐾 Refugio","#7B4BD1",5,40,6,295.6,Math.PI);addCol(40,300,10,8,5);
 spot({zone:"rural",x:40,z:294,r:3.4,label:"🐾 Refugio de mascotas",fn:()=>openShop("huevos")});
 ["perro","gato","conejo"].forEach((t,i)=>{const pt=makePet(t);pt.position.set(34+i*3,0.3,291);pt.rotation.y=Math.PI*0.9;Z.g.add(pt);});
 // muelle: pescar
 spot({zone:"rural",x:LAKE.x-LAKE.r+9,z:LAKE.z,r:3,label:()=>RODS.find(r=>r.id===S.rod).icon+" Pescar",fn:openFishing});
 // parcelas
 PLOT_POS.forEach((p,i)=>spot({zone:"rural",x:p.x,z:p.z,r:3.4,label:()=>plotLabel(i),fn:()=>plotAction(i)}));
 // parada de bus
 const bs=grp(6,0.3,278);box(4.4,0.2,1.8,"#2E7BEF",0,3,0,bs);box(0.15,3,0.15,"#3E4B59",-2,1.5,-0.7,bs);box(0.15,3,0.15,"#3E4B59",2,1.5,-0.7,bs);
 spot({zone:"rural",x:6,z:280,r:3,label:"🚌 Viajar en bus",fn:openPlaces});
 for(let i=0;i<30;i++){const x=rnd(-68,68),z=rnd(272,388);if(Math.hypot(x-LAKE.x,z-LAKE.z)<LAKE.r+4||(x<-8&&x>-54&&z<330)||Math.abs(x)<5||(Math.abs(x)<12&&Math.abs(z-300)<6)||(Math.abs(x-40)<9&&Math.abs(z-300)<8)||Math.hypot(x+48,z-345)<10||Math.hypot(x+20,z-360)<5)continue;tree(x,z,1.1);}
 for(let i=0;i<40;i++)sph(0.35,pick(["#E2465C","#F5C518","#FF4FA3","#FFFFFF","#7B4BD1"]),rnd(-65,65),0.4,rnd(380,388),null,6,5);
 ROOT=scene;
}
function plotLabel(i){if(i>=plotsOpen())return "🔒 Abrir parcela";const st=plotState(i);const p=S.plots[i];
 if(st==="vacio")return "🌱 Sembrar";const sd=SEEDS.find(s=>s.id===p.seed);
 if(st==="listo")return "🧺 Cosechar "+sd.icon;
 const left=Math.ceil((p.t0+p.dur-Date.now())/1000);return (p.w?"⏳ ":"💧 Regar · ")+sd.icon+" "+fmtTime(left);}
function fmtTime(s){if(s>=60)return Math.floor(s/60)+" min "+(s%60)+" s";return s+" s";}
const PLOT_PRICES=[null,null,null,null,null,null,{p:2000,cur:"$"},{p:6000,cur:"$"},{p:20,cur:"mc"}];
function plotAction(i){
 if(i>=plotsOpen()){const pr=PLOT_PRICES[plotsOpen()];sheet("Abrir otra parcela",b=>{b.appendChild(el("p","","Más parcelas = más cosechas al mismo tiempo."));const k=el("button","btn"+(pr.cur==="mc"?" coinb":" go")+" big","Abrir por "+priceHTML(pr));k.onclick=()=>{if(!pay(pr))return;S.plotsOpen=plotsOpen()+1;closeSheet();toast("🌱 Nueva parcela lista");};b.appendChild(k);},{half:true});return;}
 const st=plotState(i);
 if(st==="vacio")return openSeedPicker(i);
 const p=S.plots[i],sd=SEEDS.find(s=>s.id===p.seed);
 if(st==="listo"){const n=sd.id==="dorada"?1:2+Math.floor(Math.random()*2);S.crops[sd.id]=(S.crops[sd.id]||0)+n;S.plots[i]=null;S.stats.harvest++;toast("🧺 +"+n+" "+sd.icon+" "+sd.name);save();return;}
 if(!p.w){const left=p.t0+p.dur-Date.now();p.dur-=left*0.35;p.w=1;toast("💧 ¡Regado! Crece más rápido");save();return;}
 sheet(sd.icon+" "+sd.name+" creciendo",b=>{b.appendChild(el("p","","Falta "+fmtTime(Math.ceil((p.t0+p.dur-Date.now())/1000))+". Sigue creciendo aunque cierre el juego."));
  const k=el("button","btn coinb big",'✨ Abono mágico para todas · <span class="coin sm"></span> 5');k.onclick=()=>{if(!pay({p:5,cur:"mc"}))return;S.plots.forEach(x=>{if(x)x.dur=Date.now()-x.t0;});closeSheet();toast("✨ ¡Todas listas para cosechar!");};b.appendChild(k);},{half:true});
}
function openSeedPicker(i){sheet("¿Qué quiere sembrar?",body=>{
 body.appendChild(el("p","muted","Cuanto más tarda en crecer, más vale. Riéguela una vez para que crezca más rápido."));
 const g=el("div","grid");SEEDS.forEach(sd=>{const c=el("div","card",'<div class="big">'+sd.icon+'</div><b>'+sd.name+'</b><small>'+fmtTime(sd.time)+' · vende $'+fmt(sd.sell*2)+'+</small>');
  const b=el("button","btn"+(sd.cur==="mc"?" coinb":" go"),priceHTML(sd));b.onclick=()=>{if(!pay(sd))return;S.plots[i]={seed:sd.id,t0:Date.now(),dur:sd.time*1000,w:0};save();closeSheet();toast("🌱 "+sd.name+" sembrado");};c.appendChild(b);g.appendChild(c);});
 body.appendChild(g);});}
function updatePlots(){
 for(let i=0;i<9;i++){const v=plotVis[i];const open=i<plotsOpen();const p=S.plots[i];const st=open?plotState(i):"lock";
  const prog=p?Math.min(1,(Date.now()-p.t0)/p.dur):0;const key=st+(p?p.seed:"")+Math.floor(prog*5);
  if(v.last===key)continue;v.last=key;v.g.clear();
  if(!open){const sp=emojiSprite("🔒",1.6);sp.position.y=1.2;v.g.add(sp);continue;}
  if(!p)continue;const sd=SEEDS.find(s=>s.id===p.seed);
  const sc=0.3+prog*0.9;
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const st_=cyl(0.08,0.1,1.2*sc,"#3FA34D",a*2,0.6*sc,b*2,v.g,6);const lf=sph(0.35*sc,"#4DB85A",a*2,1.2*sc,b*2,v.g,8,6);
   if(st==="listo"){const fr=sph(0.3,sd.c,a*2+0.2,1.1*sc,b*2+0.2,v.g,8,6);}}
  if(st==="listo"){const sp=emojiSprite(sd.icon,1.8);sp.position.y=2.6;v.g.add(sp);}
 }
}
/* ---------- Pesca ---------- */
function rollFish(){const rod=RODS.find(r=>r.id===S.rod)||RODS[0];return weighted(FISH.map(f=>({f,w:f.w*(f.r==="comun"?1:rod.luck)}))).f;}
function openFishing(){
 const rod=RODS.find(r=>r.id===S.rod)||RODS[0];
 let phase="idle",timer=null,raf=null,fish=null,pos=0,dir=1,zoneStart=0;
 sheet("🎣 Pesca en el lago",body=>{
  const water=el("div","fishwater",'<div class="bob" id="bob">🔴</div><div class="fmsg" id="fmsg">Toque “Lanzar” para tirar el anzuelo</div>');
  const bar=el("div","fbar",'<div class="fz" id="fz"></div><div class="fm" id="fm"></div>');bar.hidden=true;
  const btn=el("button","btn go big","🎣 Lanzar");
  const info=el("p","muted",rod.icon+" "+rod.name+" · Tiene "+fishCount()+" peces para vender en el mercado.");
  body.append(water,bar,btn,info);
  const msg=water.querySelector("#fmsg"),bob=water.querySelector("#bob"),fz=bar.querySelector("#fz"),fm=bar.querySelector("#fm");
  function reset(t){phase="idle";btn.textContent="🎣 Lanzar otra vez";btn.className="btn go big";bar.hidden=true;bob.className="bob";if(t)msg.innerHTML=t;cancelAnimationFrame(raf);clearTimeout(timer);}
  btn.onclick=()=>{
   if(phase==="idle"){phase="wait";btn.textContent="Esperando…";btn.className="btn ghost big";bob.className="bob in";msg.textContent="Esperando que pique…";
    timer=setTimeout(()=>{phase="bite";fish=rollFish();bob.className="bob bite";msg.innerHTML="<b>¡PICÓ!</b> Toque “Jalar” cuando la raya esté en lo verde";btn.textContent="💪 ¡Jalar!";btn.className="btn red big";
     bar.hidden=false;const zw=rod.zone*100;zoneStart=Math.random()*(100-zw);fz.style.left=zoneStart+"%";fz.style.width=zw+"%";pos=0;dir=1;
     const speed={comun:38,rara:50,epica:64,legendaria:80}[fish.r];let lt=performance.now();const t0=lt;
     const step=now=>{const d=(now-lt)/1000;lt=now;pos+=dir*speed*d;if(pos>100){pos=100;dir=-1;}if(pos<0){pos=0;dir=1;}fm.style.left=pos+"%";if(now-t0>5000){reset("😅 Se escapó… tardó mucho en jalar.");return;}raf=requestAnimationFrame(step);};raf=requestAnimationFrame(step);},rnd(1500,4500));
    return;}
   if(phase==="wait"){clearTimeout(timer);reset("Jaló muy pronto y el pez se asustó. Espere a que pique.");return;}
   if(phase==="bite"){cancelAnimationFrame(raf);const ok=pos>=zoneStart-3&&pos<=zoneStart+rod.zone*100+3;
    if(ok){catchFish(fish);const R=RARITY[fish.r];reset('<span class="catch">'+fish.icon+'</span><b>¡'+fish.name+'!</b> <span class="rar" style="background:'+R.c+'">'+R.name+'</span>');info.textContent=rod.icon+" "+rod.name+" · Tiene "+fishCount()+" peces para vender en el mercado.";}
    else reset("💨 ¡Se soltó! Intente jalar cuando la raya esté en lo verde.");}
  };
 },{onClose:()=>{clearTimeout(timer);cancelAnimationFrame(raf);}});
}
function fishCount(){return Object.values(S.fishBag).reduce((a,b)=>a+b,0);}
function catchFish(f){S.stats.fish++;const isNew=!S.fishBook[f.id];S.fishBook[f.id]=1;
 if(f.mc){giveMC(f.mc,"¡Cofre del tesoro!");}else S.fishBag[f.id]=(S.fishBag[f.id]||0)+1;
 if(isNew)toast("📖 ¡Nuevo en su álbum: "+f.name+"!");
 if(FISH.every(x=>S.fishBook[x.id])&&!S.fishBook._done){S.fishBook._done=1;giveMC(50,"¡Álbum de peces completo!");}
 save();}
/* ---------- Mercado ---------- */
function openMarket(tab){sheet("🧺 Mercado",body=>{
 seg(body,[["vender","Vender"],["canas","Cañas de pescar"],["album","Álbum de peces"]],tab,t=>openMarket(t));
 if(tab==="vender"){
  const rows=[];let total=0;
  SEEDS.forEach(sd=>{const n=S.crops[sd.id]||0;if(n){rows.push([sd.icon,sd.name,n,sd.sell,"granja"]);}});
  FISH.forEach(f=>{const n=S.fishBag[f.id]||0;if(n){rows.push([f.icon,f.name,n,f.sell,"pesca"]);}});
  if(!rows.length){body.appendChild(el("p","muted","No tiene nada para vender. Coseche en sus parcelas o pesque en el lago."));return;}
  const l=el("div","list");rows.forEach(r=>{const v=Math.round(r[2]*r[3]*payMult(r[4]));total+=v;l.appendChild(el("div","li",'<div style="font-size:26px">'+r[0]+'</div><div class="tx"><b>'+r[2]+' × '+r[1]+'</b><small>$ '+fmt(r[3])+' cada uno</small></div><b>$ '+fmt(v)+'</b>'));});
  body.appendChild(l);
  const b=el("button","btn go big","Vender todo · $ "+fmt(total));b.onclick=()=>{let got=0;rows.forEach(r=>{got+=earn(r[2]*r[3],r[4]);});S.crops={};S.fishBag={};S.stats.jobs++;save();toast("💵 +$"+fmt(got));openMarket("vender");};body.appendChild(b);
 }
 if(tab==="canas")itemGrid(body,RODS,r=>"Zona verde "+Math.round(r.zone*100)+" % · suerte x"+r.luck,r=>!!S.rods[r.id],r=>S.rod===r.id,r=>{S.rods[r.id]=1;S.rod=r.id;openMarket("canas");});
 if(tab==="album"){const got=FISH.filter(f=>S.fishBook[f.id]).length;body.appendChild(el("p","muted","Ha encontrado "+got+" de "+FISH.length+". ¡Complete el álbum y gane 50 MediCoins!"));
  const g=el("div","grid");FISH.forEach(f=>{const k=S.fishBook[f.id];const R=RARITY[f.r];g.appendChild(el("div","card",'<div class="big">'+(k?f.icon:"❔")+'</div><b>'+(k?f.name:"???")+'</b><span class="rar" style="background:'+R.c+'">'+R.name+'</span>'));});body.appendChild(g);}
});}
let ruralT=0;
mode({id:"rural",init:buildRural,update(dt){if(curZone.id!=="rural")return;ruralT+=dt;const Z=ZONES.rural;Z.blades.rotation.z+=dt*0.8;if(ruralT>0.5){ruralT=0;updatePlots();}}});
