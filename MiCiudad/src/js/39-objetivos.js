/* ================= OBJETIVOS: siempre hay una meta en pantalla ================= */
function doorOf(id){return doors.find(d=>d.b.id===id);}
function objTot(k){return (S.retos&&S.retos.tot&&S.retos.tot[k])||0;}
function bqLv(l){return S.bosque&&S.bosque.lv&&S.bosque.lv[l];}
const OBJS=[
 {id:"helado",t:"Entra a la heladería y cómprate un helado",i:"🍦",ok:()=>objF("helado"),go:()=>{const d=doorOf("helados");goCity(d.x,d.z,"la Heladería");}},
 {id:"tramp",t:"Salta 5 veces en el trampolín del parque",i:"🤸",ok:()=>objTot("trampolin")>=5,go:()=>goCity(PG.tramp.x,PG.tramp.z+3,"el trampolín")},
 {id:"bosque1",t:"Pasa el nivel 1 del Bosque de Retos",i:"🌳",ok:()=>!!bqLv(1),go:()=>travelTo("bosque")},
 {id:"pintar",t:"Pinta un cuadro en el estudio de arte",i:"🎨",ok:()=>objTot("pintar")>=1,go:()=>goCity(ART.x+2.5,ART.z,"el estudio de arte")},
 {id:"huevo",t:"Abre un huevo y adopta una mascota",i:"🥚",ok:()=>S.pets.length>0,go:()=>openShop("huevos")},
 {id:"hospital",t:"Entra al hospital y atiende pacientes",i:"🩺",ok:()=>objF("entrar_hospital")&&objTot("trabajos")>=1,go:()=>{const d=doorOf("hospital");goCity(d.x,d.z,"el Hospital");}},
 {id:"reto",t:"Cumple un reto del día y reclama el premio",i:"🏆",ok:()=>objTot("retos")>=1,go:()=>openRetos()},
 {id:"bosque3",t:"Pasa el nivel 3 del Bosque de Retos",i:"🌳",ok:()=>!!bqLv(3),go:()=>travelTo("bosque")},
 {id:"amiga",t:"Juega en línea con un amigo o amiga",i:"👫",ok:()=>objTot("amigas")>=1,go:()=>openFriends()},
 {id:"tobogan",t:"Tírate 3 veces por el tobogán",i:"🛝",ok:()=>objTot("tobogan")>=3,go:()=>goCity(PG.slide.x,PG.slide.z-3,"el tobogán")},
 {id:"cine",t:"Mira una película en el cine",i:"🎬",ok:()=>objF("pelicula"),go:()=>{const d=doorOf("cine");goCity(d.x,d.z,"el Cine");}},
 {id:"vehiculo",t:"Consigue tu propio vehículo",i:"🚲",ok:()=>!!S.vehicle,go:()=>openShop("vehiculos")},
 {id:"bosque5",t:"Gana las 3 estrellas del nivel 5 del Bosque",i:"🌟",ok:()=>{const l=bqLv(5);return !!(l&&l.stars>=3);},go:()=>travelTo("bosque")},
 {id:"torre",t:"Llega a la cima de la Torre de Obstáculos",i:"🧗",ok:()=>!!(S.obby&&S.obby.best),go:()=>travelTo("obby")},
 {id:"moda",t:"Gana el primer lugar en la pasarela de moda",i:"👗",ok:()=>S.fashion&&S.fashion.wins>=1,go:()=>travelTo("moda")},
 {id:"bosque7",t:"Pasa el nivel 7 del Bosque de Retos",i:"🌳",ok:()=>!!bqLv(7),go:()=>travelTo("bosque")},
 {id:"medalla",t:"Gana 3 medallas",i:"🎖️",ok:()=>S.retos&&Object.keys(S.retos.medals||{}).length>=3,go:()=>openRetos()},
 {id:"bosque10",t:"¡Pasa el nivel 10, el más difícil del Bosque!",i:"🏆",ok:()=>!!bqLv(10),go:()=>travelTo("bosque")}
];
function objS(){if(!S.obj)S.obj={i:0,flags:{}};S.obj.flags=S.obj.flags||{};return S.obj;}
function objF(k){return !!objS().flags[k];}
function objDone(k){objS().flags[k]=1;objCheck();}
function objCur(){const o=objS();return OBJS[o.i]||null;}
function objCheck(){const o=objS();let n=0;while(OBJS[o.i]&&OBJS[o.i].ok()&&n<20){const m=OBJS[o.i];o.i++;n++;const v=earn(400+o.i*100);S.mc+=8;hud();save();confetti();sfx("reto");
  setTimeout(()=>toast("🎯 ¡Objetivo cumplido! "+m.i+" +$"+v+" y 8 MediCoins"),300);}objChip();}
function objChip(){const c=$("objChip");if(!c)return;const m=objCur();if(!m||titleOn){c.hidden=true;return;}c.hidden=false;const t="🎯 "+m.i+" "+m.t;if(c.textContent!==t)c.textContent=t;}
function openObjs(){const o=objS();sheet("🎯 Mis objetivos",b=>{
 b.appendChild(el("p","muted","Cumpla cada objetivo para ganar dinero y MediCoins. ¡Cada uno es un poquito más difícil!"));
 b.appendChild(el("div","rbar big",'<i style="width:'+Math.round(o.i/OBJS.length*100)+'%"></i>'));b.appendChild(el("p","muted",o.i+" de "+OBJS.length+" cumplidos"));
 OBJS.forEach((m,k)=>{const done=k<o.i,cur=k===o.i;if(k>o.i+2)return;const r=el("div","reto"+(done?" done":""));r.innerHTML='<div class="ri">'+(done?"✅":cur?m.i:"🔒")+'</div><div class="rt"><b>'+(k>o.i?"???":m.t)+'</b><small>Premio: $ '+(400+(k+1)*100)+' + <span class="coin sm"></span> 8</small></div>';
  if(cur){const g=el("button","btn go","Ir ➜");g.onclick=()=>{closeSheet();m.go();};r.appendChild(g);}b.appendChild(r);});});}
mode({id:"objetivos",afterStart(){const c=$("objChip");if(c)c.onclick=openObjs;objCheck();},update(dt){this.t=(this.t||0)+dt;if(this.t>2){this.t=0;objCheck();}}});
