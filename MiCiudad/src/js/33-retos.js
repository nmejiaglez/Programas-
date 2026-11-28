/* ================= RETOS DIARIOS Y MEDALLAS ================= */
const RETO_POOL=[
 {k:"saltos",t:"Salta {n} veces",icon:"🦘",n:[25,40,60]},
 {k:"monedas",t:"Recoge {n} monedas en la ciudad",icon:"🪙",n:[10,20,30]},
 {k:"bailes",t:"Baila {n} veces",icon:"💃",n:[3,5,8]},
 {k:"trabajos",t:"Trabaja {n} veces en la ciudad",icon:"🧑‍⚕️",n:[2,4,6]},
 {k:"paseo",t:"Pasea {n} metros en tu vehículo",icon:"🚲",n:[200,400,700],veh:true},
 {k:"viajes",t:"Viaja en bus a {n} lugares",icon:"🚌",n:[2,3,4]},
 {k:"caidas",t:"Cáete {n} veces (¡con cuidado!)",icon:"💫",n:[2,3,5]},
 {k:"pintar",t:"Pinta {n} cuadros en el estudio de arte",icon:"🎨",n:[1,2,3]},
 {k:"tobogan",t:"Baja {n} veces por el tobogán",icon:"🛝",n:[3,5,8]},
 {k:"trampolin",t:"Rebota {n} veces en el trampolín",icon:"🤸",n:[10,20,30]},
 {k:"mascota",t:"Cuida a tu mascota {n} veces",icon:"🐶",n:[2,3,5]},
 {k:"amigas",t:"Juega en una sala con amigas",icon:"👭",n:[1,1,1]}
];
const MEDALS=[
 {k:"saltos",n:500,name:"Saltarina",icon:"🦘"},{k:"monedas",n:300,name:"Coleccionista",icon:"🪙"},{k:"bailes",n:60,name:"Estrella del baile",icon:"💃"},
 {k:"trabajos",n:50,name:"Gran trabajadora",icon:"🏅"},{k:"paseo",n:5000,name:"Viajera",icon:"🗺️"},{k:"caidas",n:30,name:"¡Ups!",icon:"🤕"},
 {k:"pintar",n:15,name:"Gran artista",icon:"🖼️"},{k:"tobogan",n:40,name:"Reina del tobogán",icon:"🛝"},{k:"trampolin",n:200,name:"Saltos al cielo",icon:"🚀"},
 {k:"amigas",n:10,name:"Mejor amiga",icon:"💞"},{k:"retos",n:30,name:"Campeona de retos",icon:"🏆"}
];
function hashDay(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function retoState(){
 if(!S.retos)S.retos={day:"",list:[],streak:0,last:"",tot:{},medals:{},bonus:false};
 const R=S.retos;R.tot=R.tot||{};R.medals=R.medals||{};
 const d=todayStr();
 if(R.day!==d){let h=hashDay(d+(NET&&NET.uid||"x"));const pool=RETO_POOL.filter(r=>!r.veh||S.vehicle);const list=[];
  while(list.length<3){const r=pool[h%pool.length];h=Math.imul(h^(h>>>13),2654435761)>>>0;if(list.some(x=>x.k===r.k))continue;const lvl=list.length;list.push({k:r.k,need:r.n[lvl],got:0,claimed:false});}
  R.day=d;R.list=list;R.bonus=false;}
 return R;}
function retoInfo(k){return RETO_POOL.find(r=>r.k===k);}
function retoAdd(k,n){const R=retoState();R.tot[k]=(R.tot[k]||0)+(n||1);
 for(const r of R.list){if(r.k!==k||r.got>=r.need)continue;r.got=Math.min(r.need,r.got+(n||1));if(r.got>=r.need){sfx("reto");toast("🏆 ¡Reto cumplido! "+retoInfo(k).icon+" Reclame su premio");}}
 for(const m of MEDALS){if(m.k===k&&!R.medals[m.k+m.n]&&R.tot[k]>=m.n){R.medals[m.k+m.n]=1;S.mc+=10;hud();sfx("reto");toast("🎖️ ¡Nueva medalla: "+m.name+"! +10 MediCoins");}}
 retoBadge();}
function retoBadge(){const b=$("retoBadge");if(!b)return;const R=retoState();const n=R.list.filter(r=>r.got>=r.need&&!r.claimed).length;b.hidden=!n;b.textContent=n;}
function retoPrize(i){return {money:[250,500,900][i],mc:[3,5,8][i]};}
function openRetos(){const R=retoState();sheet("🏆 Retos de hoy",b=>{
 b.appendChild(el("p","muted","Cada día hay 3 retos nuevos. ¡Cúmplalos todos para ganar un premio extra!"));
 R.list.forEach((r,i)=>{const inf=retoInfo(r.k);const pr=retoPrize(i);const c=el("div","reto"+(r.claimed?" done":""));
  c.innerHTML='<div class="ri">'+inf.icon+'</div><div class="rt"><b>'+inf.t.replace("{n}",r.need)+'</b><div class="rbar"><i style="width:'+Math.min(100,r.got/r.need*100)+'%"></i></div><small>'+Math.floor(r.got)+' / '+r.need+' · Premio: $ '+pr.money+' + <span class="coin sm"></span> '+pr.mc+'</small></div>';
  const bt=el("button","btn "+(r.claimed?"ghost":r.got>=r.need?"go":"ghost"),r.claimed?"✔":"Reclamar");bt.disabled=r.claimed||r.got<r.need;
  bt.onclick=()=>{r.claimed=true;S.money+=pr.money;S.mc+=pr.mc;R.tot.retos=(R.tot.retos||0)+1;sfx("compra");toast("🎉 +$"+pr.money+" y +"+pr.mc+" MediCoins");
   if(!R.bonus&&R.list.every(x=>x.claimed)){R.bonus=true;R.streak=(R.last===yStr()?R.streak:0)+1;R.last=todayStr();const bonus=10+Math.min(R.streak,7)*2;S.mc+=bonus;setTimeout(()=>toast("🌟 ¡Todos los retos! +"+bonus+" MediCoins · Racha: "+R.streak+" días"),900);}
   retoAdd("retos",0);hud();save();openRetos();};c.appendChild(bt);b.appendChild(c);});
 if(R.bonus)b.appendChild(el("div","note","🌟 ¡Cumplió todos los retos de hoy! Vuelva mañana. Racha: "+R.streak+" días seguidos."));
 b.appendChild(el("h3","","🎖️ Medallas"));const g=el("div","dgrid");
 MEDALS.forEach(m=>{const got=!!R.medals[m.k+m.n];const c=el("div","dcard"+(got?"":" off"),'<span class="de">'+(got?m.icon:"🔒")+'</span><b>'+m.name+'</b><small>'+Math.min(m.n,Math.floor(R.tot[m.k]||0))+" / "+m.n+'</small>');g.appendChild(c);});
 b.appendChild(g);});}
mode({id:"retos",afterStart(){const b=$("bRetos");if(b)b.onclick=openRetos;retoBadge();},
 update(dt){if(vehicleObj&&P.speed>1){retoMeters=(retoMeters||0)+P.speed*dt;if(retoMeters>10){retoAdd("paseo",Math.floor(retoMeters));retoMeters=0;}}}});
let retoMeters=0;
