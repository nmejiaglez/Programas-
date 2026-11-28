/* ================= MASCOTAS CON HUEVOS ================= */
const EGGS=[
 {id:"comun",name:"Huevo común",icon:"🥚",p:400,cur:"$",col:"#F4F1E8",odds:[["perro",35],["gato",35],["conejo",20],["pinguino",9],["unicornio",1]]},
 {id:"dorado",name:"Huevo dorado",icon:"🌟",p:50,cur:"mc",col:"#F5C518",odds:[["perro",10],["gato",10],["conejo",10],["pinguino",25],["panda",20],["zorro",17],["unicornio",6],["dragon",2]]},
 {id:"legendario",name:"Huevo legendario",icon:"💎",p:150,cur:"mc",col:"#7B4BD1",odds:[["panda",15],["zorro",20],["unicornio",35],["dragon",22],["fenix",8]]},
 {id:"vip",name:"Huevo VIP",icon:"⭐",p:80,cur:"mc",col:"#E2A511",vip:true,odds:[["unicornio",40],["dragon",35],["fenix",25]]}
];
const RAR_BONUS={comun:0.02,rara:0.04,epica:0.07,legendaria:0.1};
const RAR_SELL={comun:100,rara:400,epica:1500,legendaria:5000};
function petLevelNeed(l){return 30*l;}
function petTick(p){const now=Date.now();const h=(now-(p.t||now))/3600000;if(h>0){p.food=Math.max(0,p.food-h*10);p.joy=Math.max(0,p.joy-h*8);p.t=now;}return p;}
function activePet(){return S.pets.find(p=>p.uid===S.petActive)||null;}
function activePetInfo(){const p=activePet();if(!p)return null;const t=PET_TYPES[p.type]||{};return {type:p.type,scale:0.75+p.lvl*0.06,fly:!!t.fly};}
function activePetBonus(){const p=activePet();if(!p)return 0;petTick(p);const r=(PET_TYPES[p.type]||{}).r||"comun";const happy=p.food>40&&p.joy>40?1:0.5;return RAR_BONUS[r]*(0.5+p.lvl/10)*happy;}
function petName(p){return p.name||(PET_TYPES[p.type]||{}).name||p.type;}
function addPetXp(p,n){if(p.lvl>=10){p.xp=0;return;}p.xp+=n;while(p.lvl<10&&p.xp>=petLevelNeed(p.lvl)){p.xp-=petLevelNeed(p.lvl);p.lvl++;toast("🎉 "+petName(p)+" subió a nivel "+p.lvl+(p.lvl===10?" · ¡Ya es adulto!":""));if(p.uid===S.petActive)buildPlayer();}}
function rollEgg(e){const r=weighted(e.odds.map(o=>({id:o[0],w:o[1]})));return r.id;}
function hatchEgg(eggId,free){
 const e=EGGS.find(x=>x.id===eggId);if(!e)return;
 if(S.pets.length>=S.petSlots){toast("Su refugio está lleno. Libere una mascota o compre más espacio.");return;}
 if(!free){if(e.vip&&!S.perm.vip){toast("El huevo VIP es solo para jugadores VIP");openShop("vip");return;}if(!pay(e))return;}
 const type=rollEgg(e);const pet={uid:S.petUid++,type,lvl:1,xp:0,food:80,joy:80,t:Date.now(),name:""};
 S.pets.push(pet);if(!S.petActive)S.petActive=pet.uid;save();
 const T_=PET_TYPES[type],R=RARITY[T_.r];
 sheet("¡Está naciendo!",b=>{
  const box_=el("div","hatch",'<div class="egg" style="--egg:'+e.col+'">'+e.icon+'</div>');b.appendChild(box_);
  const msg=el("p","muted","Toque el huevo para ayudarlo a salir…");msg.style.textAlign="center";b.appendChild(msg);
  let taps=0;const egg=box_.querySelector(".egg");
  const reveal=()=>{box_.innerHTML='<div class="born"><div class="pe">'+T_.icon+'</div><div class="rar" style="background:'+R.c+'">'+R.name+'</div></div>';
   msg.innerHTML="<b>¡Le salió un "+T_.name+"!</b>";
   const r=el("div","row");const k=el("button","btn ghost","Guardar");k.onclick=()=>openMyPets();const u=el("button","btn go","Llevarlo conmigo");u.onclick=()=>{S.petActive=pet.uid;buildPlayer();closeSheet();toast(T_.icon+" "+T_.name+" lo acompaña");};r.append(k,u);b.appendChild(r);
   if(T_.r==="legendaria"||T_.r==="epica")toast("🌟 ¡Increíble! Mascota "+R.name);};
  egg.onclick=()=>{taps++;egg.classList.remove("wob");void egg.offsetWidth;egg.classList.add("wob");if(taps>=3)setTimeout(reveal,350);};
  setTimeout(()=>{if(taps<3){taps=3;reveal();}},6000);
 },{half:true});
}
function renderEggs(body){
 body.appendChild(el("p","muted","Abra un huevo y descubra qué mascota le sale. Cada mascota sube de nivel, crece y le da más dinero."));
 const mb=el("button","btn ghost","🐾 Ver mis mascotas ("+S.pets.length+"/"+S.petSlots+")");mb.onclick=openMyPets;body.appendChild(mb);
 EGGS.forEach(e=>{
  const c=el("div","eggcard");
  c.innerHTML='<div class="eggic" style="--egg:'+e.col+'">'+e.icon+'</div><div class="tx"><b>'+e.name+(e.vip?' <span class="pill">VIP</span>':'')+'</b><div class="odds">'+e.odds.map(o=>{const t=PET_TYPES[o[0]];return '<span title="'+t.name+'" style="border-color:'+RARITY[t.r].c+'">'+t.icon+' '+o[1]+' %</span>';}).join("")+'</div></div>';
  const b=el("button","btn"+(e.cur==="mc"?" coinb":""),priceHTML(e));b.onclick=()=>hatchEgg(e.id);c.appendChild(b);body.appendChild(c);
 });
 body.appendChild(el("p","note","Las probabilidades de cada mascota se muestran en cada huevo."));
}
shopTab("huevos","Huevos 🥚",renderEggs,10);
function openMyPets(){sheet("Mis mascotas",body=>{
 if(!S.pets.length){body.appendChild(el("p","muted","Todavía no tiene mascotas. Abra un huevo en la tienda o en el refugio."));const b=el("button","btn go big","Ver huevos");b.onclick=()=>openShop("huevos");body.appendChild(b);return;}
 body.appendChild(el("p","muted","Aliméntela y acaríciela para que suba de nivel. Si camina con ella también gana experiencia. Bono actual de su mascota: +"+Math.round(activePetBonus()*100)+" % de dinero."));
 const g=el("div","petgrid");
 S.pets.forEach(p=>{petTick(p);const t=PET_TYPES[p.type],R=RARITY[t.r];const on=p.uid===S.petActive;
  const c=el("div","petcard"+(on?" on":""));
  c.innerHTML='<div class="pe">'+t.icon+'</div><b>'+petName(p)+'</b><span class="rar" style="background:'+R.c+'">'+R.name+'</span><small>Nivel '+p.lvl+(p.lvl>=10?" · Adulto":"")+'</small>'+
   '<div class="bar"><i style="width:'+(p.lvl>=10?100:p.xp/petLevelNeed(p.lvl)*100)+'%"></i></div>'+
   '<div class="mini"><span>🍖 '+Math.round(p.food)+'</span><span>❤️ '+Math.round(p.joy)+'</span></div>';
  const acts=el("div","pacts");
  const feed=el("button","btn","🍖 $30");feed.onclick=()=>{if(!pay({p:30,cur:"$"}))return;p.food=Math.min(100,p.food+40);addPetXp(p,10);retoAdd("mascota",1);openMyPets();};
  const pet=el("button","btn go","❤️ Acariciar");const cd=(p.petT||0)+300000-Date.now();if(cd>0){pet.disabled=true;pet.textContent="❤️ "+Math.ceil(cd/60000)+" min";}
  pet.onclick=()=>{p.joy=Math.min(100,p.joy+25);p.petT=Date.now();addPetXp(p,5);retoAdd("mascota",1);openMyPets();};
  const treat=el("button","btn coinb",'🍬 <span class="coin sm"></span> 3');treat.onclick=()=>{if(p.lvl>=10){toast("Ya es adulto");return;}if(!pay({p:3,cur:"mc"}))return;p.food=100;p.joy=100;addPetXp(p,100);openMyPets();};
  const use=el("button","btn"+(on?" ghost":" go"),on?"Guardar":"Llevar");use.onclick=()=>{S.petActive=on?null:p.uid;buildPlayer();openMyPets();};
  const more=el("button","btn ghost","⋯");more.onclick=()=>petOptions(p);
  acts.append(feed,pet,treat,use,more);c.appendChild(acts);g.appendChild(c);});
 body.appendChild(g);
 const sl=el("button","btn coinb",'Más espacio (+6) · <span class="coin sm"></span> 30');sl.onclick=()=>{if(!pay({p:30,cur:"mc"}))return;S.petSlots+=6;openMyPets();};body.appendChild(sl);
});}
function petOptions(p){const t=PET_TYPES[p.type];sheet(t.icon+" "+petName(p),b=>{
 b.appendChild(el("h3","","Cambiar nombre"));const i=el("input");i.type="text";i.id="petName";i.maxLength=12;i.value=p.name||"";i.placeholder=t.name;b.appendChild(i);
 const sv=el("button","btn go","Guardar nombre");sv.onclick=()=>{const v=i.value.trim().slice(0,12);if(v){const pr=nombreProblema(v);if(pr){toast(pr);return;}}p.name=v;save();openMyPets();};b.appendChild(sv);
 const val=Math.round(RAR_SELL[t.r]*(1+p.lvl/5));
 b.appendChild(el("h3","","Dejarla en el refugio"));b.appendChild(el("p","muted","Otra familia la cuidará y usted recibe $ "+fmt(val)+"."));
 const rel=el("button","btn red","Dejar en el refugio");rel.onclick=()=>{sheet("¿Seguro?",c=>{c.appendChild(el("p","","Se despedirá de "+petName(p)+" y recibirá $ "+fmt(val)+"."));const r=el("div","row");const no=el("button","btn ghost","Cancelar");no.onclick=openMyPets;const si=el("button","btn red","Sí, dejarla");si.onclick=()=>{S.pets=S.pets.filter(x=>x!==p);if(S.petActive===p.uid)S.petActive=null;S.money+=val;buildPlayer();toast("💵 +$"+fmt(val));openMyPets();};r.append(no,si);c.appendChild(r);},{half:true});};b.appendChild(rel);
 const back=el("button","btn ghost","Volver");back.onclick=openMyPets;b.appendChild(back);
},{half:true});}
let petWalk=0;
mode({id:"mascotas",
 init(){},
 afterStart(){$("bPets").onclick=openMyPets;},
 update(dt){const p=activePet();if(!p||P.speed<0.5||uiOpen)return;petWalk+=P.speed*dt;if(petWalk>25){petWalk=0;addPetXp(p,1);}}
});
