/* ================= COMBOS TEMÁTICOS (se compran por WhatsApp, se canjean con código) ================= */
const COMBOS=[
 {id:"princesa",name:"Combo Princesa",icon:"👸",price:"C$ 150",mc:200,tag:"Popular",desc:"Vestido de princesa, corona de princesa, alas de ángel, camisa de corazones, ojos brillantes y 200 MediCoins",
  look:{shirt:"s15",pants:"f7",hat:"princesa",acc:"alas_angel",eyeS:3},own:["s15","f7","princesa","alas_angel","eyeS3"]},
 {id:"heroe",name:"Combo Superhéroe",icon:"🦸",price:"C$ 120",mc:200,desc:"Camiseta de superhéroe, antifaz, capa de héroe, pantalón deportivo y 200 MediCoins",
  look:{shirt:"s27",pants:"p9",face:"heroe",acc:"capa_roja"},own:["s27","p9","heroe","capa_roja"]},
 {id:"dino",name:"Combo Dinosaurio",icon:"🦖",price:"C$ 120",mc:150,tag:"Nuevo",desc:"Sudadera y gorro de dinosaurio, pantalón de camuflaje, estela de fueguito y 150 MediCoins",
  look:{shirt:"s32",pants:"p10",hat:"dino",trail:"fuego"},own:["s32","p10","dino","tr_fuego"]},
 {id:"futbol",name:"Combo Futbolista",icon:"⚽",price:"C$ 100",mc:150,desc:"Camiseta de fútbol, pantalón deportivo, gorra al revés, lentes deportivos, bicicleta y 150 MediCoins",
  look:{shirt:"s26",pants:"p9",hat:"reves",face:"deportivos"},own:["s26","p9","reves","deportivos","bici"],vehicle:"bici"},
 {id:"unicornio",name:"Combo Unicornio",icon:"🦄",price:"C$ 150",mc:200,tag:"Popular",desc:"Camisa de unicornio, tutú, cuerno de unicornio, estela arcoíris, mejillas de corazón y 200 MediCoins",
  look:{shirt:"s17",pants:"f6",hat:"unicornio",trail:"arcoiris",cheekS:2},own:["s17","f6","unicornio","tr_arcoiris","cheekS2"]},
 {id:"piloto",name:"Combo Piloto de carreras",icon:"🏎️",price:"C$ 250",mc:300,tag:"Limitado",desc:"Deportivo dorado, camiseta de carreras, lentes deportivos, Paleta mágica para pintar el carro y 300 MediCoins",
  look:{shirt:"s31",face:"deportivos"},own:["s31","deportivos","oro","magia"],vehicle:"oro"},
 {id:"mascotas",name:"Combo Mascotas",icon:"🐾",price:"C$ 120",mc:150,desc:"Un huevo legendario, un huevo dorado, 6 espacios más en el refugio y 150 MediCoins",
  eggs:["legendario","dorado"],slots:6}
];
function applyCombo(id){const c=COMBOS.find(x=>x.id===id);if(!c)return false;
 (c.own||[]).forEach(k=>S.owned[k]=1);if(c.look)Object.assign(S.look,c.look);if(c.vehicle){S.vehicle=c.vehicle;S.riding=false;}
 if(c.slots)S.petSlots+=c.slots;buildPlayer();save();
 (c.eggs||[]).forEach((e,i)=>setTimeout(()=>{closeSheet();if(typeof hatchEgg==="function")hatchEgg(e,true);},2200+i*7000));
 return true;}
function comboLook(c){return Object.assign({},c.look||{},{shirtC:undefined,pantsC:undefined});}
shopTab("combos","Combos 🎁",body=>{
 body.appendChild(el("p","muted","Conjuntos completos que se ponen solos en su personaje. ¡Más baratos que comprar todo por separado!"));
 const g=el("div","combos");
 COMBOS.forEach(c=>{const card=el("div","combo");
  const pic=c.look?imgTag(lookThumb(comboLook(c),FRAME_BODY),'<div class="big">'+c.icon+'</div>'):'<div class="cbig">🥚🌟</div>';
  card.innerHTML=(c.tag?'<span class="ptag pt'+c.tag.toLowerCase()+'">'+c.tag+'</span>':"")+'<div class="cpic">'+pic+'</div><b>'+c.icon+" "+c.name+'</b><small>'+c.desc+'</small>';
  const bt=el("button","btn coinb big",c.price);bt.onclick=()=>buyPack({id:"combo_"+c.id,mc:c.mc,price:c.price,combo:c});card.appendChild(bt);g.appendChild(card);});
 body.appendChild(g);
 body.appendChild(el("p","note","💬 Se compran por WhatsApp con el vendedor oficial. Le mandan un código y lo canjea en la pestaña MediCoins: todo se pone solo."));
},2);
