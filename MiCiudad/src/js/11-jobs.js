/* ================= EDIFICIOS ================= */
function enter(b){
 if(b.id==="hospital")return gameHospital();
 if(b.id==="super")return gameSuper();
 if(b.id==="helados")return gameHelados();
 if(b.id==="cine")return gameCine();
 if(b.id==="escuela")return gameEscuela();
 if(b.id==="bomberos")return openBomberos();
 if(b.id==="casa")return openCasa();
 if(b.id==="mall")return openShop("paquetes");
}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function finish(title,lines,total){S.stats.jobs++;save();sheet(title,b=>{b.appendChild(el("div","res",lines));const r=el("div","row");const k=el("button","btn go big","¡Listo!");k.onclick=closeSheet;r.appendChild(k);b.appendChild(r);},{half:true});}
function intro(title,icon,desc,start){sheet(title,b=>{b.appendChild(el("div","res",'<div style="font-size:56px">'+icon+'</div>'));b.appendChild(el("p","",desc));if(payMult()>1)b.appendChild(el("p","muted","Bono activo: ganancias x"+payMult().toFixed(2).replace(/\.00$/,"")));const s=el("button","btn go big","Empezar");s.onclick=start;b.appendChild(s);});}

function gameHospital(){intro("Hospital","🏥","Atienda 6 pacientes. Escuche qué les pasa y elija el tratamiento correcto antes de que se acabe el tiempo.",()=>{
 const list=shuffle(CASES).slice(0,6);let i=0,ok=0,tot=0,timer=null,tl=0;
 sheet("Consulta",body=>{
  const top=el("div","mg-top");const pt=el("div","patient");const opts=el("div","opts");body.append(top,pt,opts);
  function next(){clearInterval(timer);if(i>=list.length){finish("Turno terminado","🩺<br>Atendió bien a "+ok+" de "+list.length+"<br>+$ "+tot);return;}
   const c=list[i];tl=10;pt.innerHTML='<div class="pe">'+c.p+'</div><div class="bubble">“'+c.t+'”</div>';
   const others=shuffle(CASES.filter(x=>x.ok!==c.ok)).slice(0,2).map(x=>x.ok);opts.innerHTML="";
   shuffle([c.ok,...others]).forEach(o=>{const b=el("button","opt",o);b.onclick=()=>{clearInterval(timer);opts.querySelectorAll("button").forEach(x=>x.disabled=true);if(o===c.ok){b.classList.add("ok");ok++;tot+=earn(40,"hospital");}else{b.classList.add("bad");opts.querySelectorAll("button").forEach(x=>{if(x.textContent===c.ok)x.classList.add("ok");});}i++;setTimeout(next,850);};opts.appendChild(b);});
   draw();timer=setInterval(()=>{tl--;draw();if(tl<=0){clearInterval(timer);i++;toast("⏰ ¡El paciente se fue!");next();}},1000);}
  function draw(){top.innerHTML="<span>Paciente "+(i+1)+" de "+list.length+"</span><span>⏱ "+tl+" s</span>";}
  next();
 },{noClose:false,onClose:()=>clearInterval(timer)});
});}

function gameSuper(){intro("Supermercado","🛒","Usted es el cajero. Busque en el estante los productos de la lista de cada cliente. ¡Rápido, la fila espera!",()=>{
 let cust=0,timer=null,time=45,tot=0,order=[],got=[];
 sheet("Caja registradora",body=>{
  const top=el("div","mg-top");const ord=el("div","order");const gr=el("div","shop-grid");body.append(top,ord,gr);
  function newOrder(){order=shuffle(PRODUCTS).slice(0,3+Math.min(2,cust));got=[];renderOrder();gr.innerHTML="";
   shuffle(PRODUCTS).forEach(p=>{const b=el("button","prod",p[0]+"<small>"+p[1]+"</small>");b.onclick=()=>{const k=order.findIndex((o,ix)=>o[0]===p[0]&&!got.includes(ix));if(k>=0){got.push(k);b.classList.add("got");tot+=earn(12,"super");renderOrder();if(got.length===order.length){cust++;tot+=earn(30,"super");toast("🧾 ¡Cliente atendido!");setTimeout(newOrder,400);}}else{time=Math.max(0,time-2);b.classList.remove("shake");void b.offsetWidth;b.classList.add("shake");}};gr.appendChild(b);});}
  function renderOrder(){ord.innerHTML="<span>Cliente "+(cust+1)+" quiere:</span>"+order.map((o,ix)=>'<span class="it'+(got.includes(ix)?" got":"")+'">'+o[0]+"</span>").join("");}
  function draw(){top.innerHTML="<span>Clientes: "+cust+"</span><span>⏱ "+time+" s</span>";}
  newOrder();draw();timer=setInterval(()=>{time--;draw();if(time<=0){clearInterval(timer);finish("¡Cerró la caja!","🛒<br>Atendió "+cust+" clientes<br>+$ "+tot);}},1000);
 },{onClose:()=>clearInterval(timer)});
});}

function gameHelados(){intro("Heladería","🍦","Prepare 5 helados. Toque los sabores en el orden del pedido, de abajo hacia arriba.",()=>{
 let n=0,tot=0,good=0,want=[],have=[];
 sheet("Heladería",body=>{
  const top=el("div","mg-top");const ordW=el("div","order");const cone=el("div","cone");const fl=el("div","flv");const fn=el("div","flvn");body.append(top,ordW,cone,fl,fn);
  FLAVORS.forEach((f,i)=>{const b=el("button","");b.style.background=f.c;b.setAttribute("aria-label",f.n);b.onclick=()=>add(i);fl.appendChild(b);fn.appendChild(el("span","",f.n));});
  function newOrder(){want=Array.from({length:1+Math.floor(Math.random()*3)},()=>Math.floor(Math.random()*FLAVORS.length));have=[];render();}
  function render(){top.innerHTML="<span>Pedido "+(n+1)+" de 5</span><span>Bien: "+good+"</span>";
   ordW.innerHTML='<span>Pedido:</span><span class="wantrow">'+want.map(i=>'<span class="dotf" style="background:'+FLAVORS[i].c+'"></span>').join("")+'</span><span class="muted">'+want.map(i=>FLAVORS[i].n).join(" + ")+"</span>";
   cone.innerHTML='<div class="c"></div>'+have.map(i=>'<div class="s" style="background:'+FLAVORS[i].c+'"></div>').join("");}
  function add(i){if(have.length>=want.length)return;have.push(i);render();
   if(have[have.length-1]!==want[have.length-1]){toast("😬 ¡Ese no era el sabor!");next(false);return;}
   if(have.length===want.length){tot+=earn(30+want.length*10,"helados");good++;toast("🍦 ¡Delicioso!");next(true);}}
  function next(){n++;setTimeout(()=>{if(n>=5){finish("¡Cerró la heladería!","🍦<br>Helados perfectos: "+good+" de 5<br>+$ "+tot);}else newOrder();},600);}
  newOrder();
 });
});}

function gameCine(){intro("Cine","🎬","Mueva la cubeta para atrapar las palomitas 🍿. Las estrellas ⭐ valen más. ¡Cuidado con las cebollas 🧅!",()=>{
 let raf=null,iv=null;
 sheet("Palomitas del cine",body=>{
  const top=el("div","mg-top");const cv=el("canvas");cv.id="pop";body.append(top,cv);
  const W=cv.clientWidth||340,H=320;const dpr=Math.min(2,devicePixelRatio||1);cv.width=W*dpr;cv.height=H*dpr;const x=cv.getContext("2d");x.scale(dpr,dpr);
  let bx=W/2,score=0,time=25,items=[],spawn=0,last=performance.now();
  const mv=e=>{const r=cv.getBoundingClientRect();bx=Math.max(30,Math.min(W-30,e.clientX-r.left));};
  cv.addEventListener("pointermove",mv);cv.addEventListener("pointerdown",mv);
  function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;spawn-=dt;
   if(spawn<=0){spawn=0.35+Math.random()*0.3;const r=Math.random();items.push({x:20+Math.random()*(W-40),y:-20,v:120+Math.random()*120,k:r<0.12?"⭐":r<0.25?"🧅":"🍿"});}
   x.clearRect(0,0,W,H);x.fillStyle="rgba(255,255,255,.08)";for(let i=0;i<6;i++)x.fillRect(i*W/6+10,0,2,H);
   x.font="30px sans-serif";x.textAlign="center";x.textBaseline="middle";
   for(let i=items.length-1;i>=0;i--){const it=items[i];it.y+=it.v*dt;x.fillText(it.k,it.x,it.y);
    if(it.y>H-50&&it.y<H-10&&Math.abs(it.x-bx)<38){items.splice(i,1);score+=it.k==="⭐"?5:it.k==="🧅"?-3:1;if(score<0)score=0;continue;}
    if(it.y>H+20)items.splice(i,1);}
   x.fillStyle="#E2465C";x.beginPath();x.moveTo(bx-34,H-48);x.lineTo(bx+34,H-48);x.lineTo(bx+26,H-6);x.lineTo(bx-26,H-6);x.closePath();x.fill();
   x.fillStyle="#fff";for(let i=-2;i<=2;i++)x.fillRect(bx+i*12-3,H-46,6,38);
   top.innerHTML="<span>Palomitas: "+score+"</span><span>⏱ "+Math.ceil(time)+" s</span>";
   raf=requestAnimationFrame(frame);}
  raf=requestAnimationFrame(frame);
  iv=setInterval(()=>{time--;if(time<=0){clearInterval(iv);cancelAnimationFrame(raf);const v=earn(score*6,"cine");finish("¡Fin de la función!","🍿<br>Atrapó "+score+" puntos<br>+$ "+v);}},1000);
 },{onClose:()=>{cancelAnimationFrame(raf);clearInterval(iv);}});
});}

function gameEscuela(){intro("Escuela","🏫","Responda 5 preguntas. Cada respuesta correcta le da dinero.",()=>{
 const qs=shuffle(QUIZ).slice(0,5);let i=0,ok=0,tot=0;
 sheet("Clase",body=>{
  const top=el("div","mg-top");const q=el("div","bubble");q.style.background="#EAF7FF";const opts=el("div","opts");body.append(top,q,opts);
  function next(){if(i>=qs.length){if(ok===5){S.mc+=2;toast("⭐ ¡Perfecto! +2 MediCoins");}finish("Clase terminada","🎓<br>Respuestas correctas: "+ok+" de 5<br>+$ "+tot);return;}
   const [t,a]=qs[i];top.innerHTML="<span>Pregunta "+(i+1)+" de 5</span><span>Correctas: "+ok+"</span>";q.textContent=t;opts.innerHTML="";
   shuffle(a).forEach(o=>{const b=el("button","opt",o);b.onclick=()=>{opts.querySelectorAll("button").forEach(x=>x.disabled=true);if(o===a[0]){b.classList.add("ok");ok++;tot+=earn(40,"escuela");}else{b.classList.add("bad");opts.querySelectorAll("button").forEach(x=>{if(x.textContent===a[0])x.classList.add("ok");});}i++;setTimeout(next,900);};opts.appendChild(b);});}
  next();
 });
});}

function openBomberos(){if(mission){toast("Ya hay incendios activos. ¡Siga la flecha!");return;}
 intro("Estación de Bomberos","🚒","¡Hay 5 incendios en la ciudad! Siga la flecha amarilla y camine hasta cada fuego para apagarlo. Tiene 2 minutos. Premio: dinero y 3 MediCoins.",startFires);}

function openCasa(){sheet("Mi Casa",body=>{
 if(typeof enterHouse==="function"&&curZone.id!=="casa"){const eb=el("button","btn go big","🚪 Entrar a la casa");eb.onclick=enterHouse;body.appendChild(eb);}
 const ready=S.daily.last!==todayStr();const streak=(S.daily.last===yStr()||S.daily.last===todayStr())?S.daily.streak:0;const day=ready?streak+1:streak;const amt=DAILY[Math.min(Math.max(day,1),7)-1];
 const gift=el("div","li",'<div style="font-size:30px">📬</div><div class="tx"><b>Regalo diario · día '+Math.max(day,1)+'</b><small>'+(ready?"Hoy: "+amt+" MediCoins gratis":"Ya lo recogió. Vuelva mañana.")+'</small></div>');
 const gb=el("button","btn coinb",ready?"Recoger":"✓");gb.style.width="auto";gb.style.padding="8px 14px";gb.disabled=!ready;gb.onclick=()=>{S.daily.streak=day;S.daily.last=todayStr();const g2=amt*(S.perm.vip?2:1);S.mc+=g2;toast("🎁 +"+g2+" MediCoins");openCasa();};gift.appendChild(gb);body.appendChild(gift);
 const n=Object.keys(S.furn).length;
 body.appendChild(el("h3","","Mi sala"));
 body.appendChild(el("div","house",n?FURN.filter(f=>S.furn[f.id]).map(f=>"<span title='"+f.name+"'>"+f.icon+"</span>").join(""):"<span style='grid-column:1/-1;font-size:14px;color:var(--muted)'>Su casa está vacía. ¡Compre muebles!</span>"));
 body.appendChild(el("p","muted","Cada mueble aumenta 3 % lo que gana en todos los trabajos. Bono actual: +"+(n*3)+" %."));
 if(typeof houseUpgradeUI==="function")houseUpgradeUI(body);
 itemGrid(body,FURN.filter(f=>!S.furn[f.id]).map(f=>Object.assign({cur:"$"},f)),()=>"+3 % de ganancias",()=>false,()=>false,it=>{S.furn[it.id]=1;if(curZone.id==="casa"&&typeof buildRoom==="function")buildRoom();openCasa();});
});}

