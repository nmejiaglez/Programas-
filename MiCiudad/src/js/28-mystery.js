/* ================= MISTERIO: ¿QUIÉN SE COMIÓ EL PASTEL? ================= */
const HAIR_NAMES=["negro","café oscuro","castaño","rubio","rojo","morado","azul"];
const RARE_HATS=["corona","astronauta","flores","tiara","chef"];
const mys={on:false,culprit:null,clues:[],found:0};
function npcTraits(n){const L=n.look;return {shirt:(SHIRTS.find(s=>s.id===L.shirt)||{}).name||"",hair:HAIR_NAMES[L.hair]||"",hat:L.hat==="none"?"sin sombrero":(HATS.find(h=>h.id===L.hat)||{}).name||""};}
function buildMystery(){
 kiosk(17,17,"#7B4BD1","🕵️ Detective","🔍");
 spot({x:17,z:19.8,r:2.8,label:()=>mys.on?"🕵️ Misterio en marcha":"🕵️ Resolver un misterio",fn:()=>{if(!mys.on)mysIntro();else mysNotes();}});
 PLACES.push({icon:"🕵️",name:"Oficina del Detective",desc:"Resolver misterios",x:17,z:20});
 spot({x:0,z:0,r:2.6,label:"🕵️ Acusar a este vecino",pos:()=>{const n=mysNearNpc();return n?{x:n.x,z:n.z}:{x:9999,z:9999};},when:()=>mys.on&&mys.found>=1,fn:()=>{const n=mysNearNpc();if(n)mysAccuse(n);}});
}
function mysNearNpc(){let best=null,bd=2.6;for(const n of npcs){const d=Math.hypot(n.x-P.x,n.z-P.z);if(d<bd){bd=d;best=n;}}return best;}
function mysIntro(){intro("Oficina del Detective","🕵️","¡Alguien se comió el pastel de cumpleaños de la panadería! Busque las 3 lupas 🔍 en la ciudad: cada una le da una pista. Después encuentre al vecino que coincide con todas las pistas y acúselo.",mysStart);}
function mysStart(){closeSheet();mys.on=true;mys.found=0;mys.clues.forEach(c=>rm(c.sp));mys.clues=[];
 const c=pick(npcs);mys.culprit=c;const used=new Set(npcs.filter(n=>n!==c).map(n=>n.look.hat));const hat=RARE_HATS.find(h=>!used.has(h))||"corona";c.look.hat=hat;
 const old=c.ch.g;const ch=makeChar(c.look);ch.g.position.copy(old.position);ZONES.city.g.add(ch.g);rm(old);c.ch=ch;
 const tr=npcTraits(c);const texts=["Tenía una camisa "+tr.shirt.toLowerCase(),"Tenía el pelo "+tr.hair,(tr.hat.startsWith("sin")?"Andaba sin sombrero":"En la cabeza llevaba: "+tr.hat.toLowerCase())];
 for(let i=0;i<3;i++){const [x,z]=freeSpot(1.5);const sp=emojiSprite("🔍",1.8);sp.position.set(x,1.6,z);ZONES.city.g.add(sp);mys.clues.push({x,z,sp,text:texts[i],got:false});}
 toast("🔍 Busque las 3 lupas. Siga la flecha.");}
function mysNotes(){sheet("🕵️ Mis pistas",b=>{const got=mys.clues.filter(c=>c.got);if(!got.length)b.appendChild(el("p","muted","Aún no tiene pistas. Siga la flecha amarilla."));got.forEach((c,i)=>b.appendChild(el("div","li",'<div style="font-size:24px">🔍</div><div class="tx"><b>Pista '+(i+1)+'</b><small>'+c.text+'</small></div>')));
 b.appendChild(el("p","muted","Cuando esté cerca de un vecino, toque “Acusar a este vecino”."));const x=el("button","btn ghost","Abandonar misterio");x.onclick=()=>{mysEnd();closeSheet();};b.appendChild(x);},{half:true});}
function mysAccuse(n){const tr=npcTraits(n);sheet("🕵️ ¿Fue este vecino?",b=>{
 b.appendChild(el("div","list",[["👕","Camisa",tr.shirt],["💇","Pelo",tr.hair],["🎩","Cabeza",tr.hat]].map(r=>'<div class="li"><div style="font-size:22px">'+r[0]+'</div><div class="tx"><b>'+r[2]+'</b><small>'+r[1]+'</small></div></div>').join("")));
 b.appendChild(el("p","muted","Sus pistas: "+mys.clues.filter(c=>c.got).map(c=>c.text.toLowerCase()).join(" · ")));
 const r=el("div","row");const no=el("button","btn ghost","Seguir buscando");no.onclick=closeSheet;const si=el("button","btn red","¡Fue este!");si.onclick=()=>{
  if(n===mys.culprit){const v=earn(250,"misterio");giveMC(2);S.stats.mysteries++;S.stats.jobs++;mysEnd();sheet("🎉 ¡Misterio resuelto!",c=>{c.appendChild(el("div","res","🍰<br>¡Encontró a quien se comió el pastel!<br>+$ "+fmt(v)+" y 2 MediCoins"));const k=el("button","btn go big","¡Excelente!");k.onclick=closeSheet;c.appendChild(k);},{half:true});}
  else{closeSheet();toast("🙅 ¡No fue este vecino! Revise sus pistas.");}};r.append(no,si);b.appendChild(r);},{half:true});}
function mysEnd(){mys.on=false;mys.clues.forEach(c=>rm(c.sp));mys.clues=[];zoneButton(null);save();}
mode({id:"misterio",dbg:mys,init:buildMystery,
 arrow(){if(!mys.on||curZone.id!=="city")return null;let best=null,bd=1e9;for(const c of mys.clues){if(c.got)continue;const d=Math.hypot(c.x-P.x,c.z-P.z);if(d<bd){bd=d;best=c;}}return best?{x:best.x,z:best.z,name:"pista"}:null;},
 update(dt){
  if(!mys.on||curZone.id!=="city")return;
  for(const c of mys.clues){if(c.got)continue;c.sp.position.y=1.6+Math.sin(perf*3)*0.3;if(Math.hypot(c.x-P.x,c.z-P.z)<2){c.got=true;rm(c.sp);mys.found++;toast("🔍 Pista "+mys.found+": "+c.text);}}
  for(const n of npcs){if(Math.hypot(n.x-P.x,n.z-P.z)<3.5)n.wait=Math.max(n.wait,0.3);}
  zoneButton("🕵️ Pistas: "+mys.found+"/3 · Toque para verlas",mysNotes);
 }});
