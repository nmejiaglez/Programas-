/* ================= PASARELA DE MODA ================= */
const FS={cx:-330,cz:330};
const THEMES=[
 {id:"playa",name:"Día de playa",icon:"🏖️",tags:["playa"]},
 {id:"gala",name:"Fiesta de gala",icon:"✨",tags:["gala"]},
 {id:"heroe",name:"Superhéroe",icon:"🦸",tags:["heroe"]},
 {id:"medico",name:"Doctora o doctor",icon:"🩺",tags:["medico"]},
 {id:"campo",name:"Un día en la granja",icon:"🌾",tags:["campo"]},
 {id:"frio",name:"Invierno",icon:"❄️",tags:["frio"]},
 {id:"fantasia",name:"Mundo de fantasía",icon:"🦄",tags:["fantasia"]},
 {id:"espacio",name:"Viaje al espacio",icon:"🚀",tags:["espacio"]}
];
const ITEM_TAGS={
 s1:["playa"],s4:["playa","campo"],s5:["playa"],s6:["playa"],s7:["fantasia","playa"],s8:["espacio","fantasia"],s9:["medico"],s10:["gala"],s11:["frio","heroe"],s12:["playa"],s13:["gala","frio"],s14:["fantasia"],
 p1:["campo"],p2:["gala","frio"],p3:["campo"],p4:["medico","gala"],p5:["fantasia"],p6:["playa"],f1:["fantasia","playa"],f2:["playa"],f3:["campo","frio"],f4:["gala"],f5:["gala","fantasia"],
 gorra:["playa"],fiesta:["fantasia"],gato:["fantasia"],vaquero:["campo"],bombero:["heroe"],corona:["gala","fantasia"],chef:["campo"],policia:["heroe"],flores:["fantasia","playa"],tiara:["gala","fantasia"],astronauta:["espacio"],
 mochila:["campo","espacio"],capa_roja:["heroe"],capa_morada:["fantasia","heroe"],alas_mariposa:["fantasia"],alas_angel:["fantasia","gala"],alas_dragon:["fantasia","heroe"],jetpack:["espacio","heroe"],
 lentes:["playa"],mascarilla:["medico"],corazon:["fantasia","playa"],estrella:["espacio","fantasia"],antifaz:["heroe"],
 corbatin:["gala"],bufanda:["frio"],perlas:["gala"],medalla:["heroe","gala"]
};
const fs={state:"idle",theme:null,t:0,walkT:0,bots:[],judges:[],score:0};
function buildFashion(){
 const Z=zone({id:"moda",name:"Pasarela de Moda",icon:"👗",desc:"Vístase según el tema y gane el concurso",cx:FS.cx,cz:FS.cz,hw:30,hd:34,spawn:{x:FS.cx,z:FS.cz+28,face:Math.PI},sky:0x2A1D40,fogNear:60,fogFar:140,noVehicle:true,onLeave(){zoneButton(null);if(fs.state!=="idle"){fs.state="idle";uiOpen=false;}}});
 ROOT=Z.g;
 plane(80,80,"#3B2A5A",FS.cx,0.02,FS.cz);
 // escenario y pasarela
 addPlat(FS.cx,1.3,FS.cz-16,20,1,6,"#1E2329");box(20,8,0.4,"#7B4BD1",FS.cx,5,FS.cz-19.2,null);signMesh("👗 Pasarela de Moda","#E0307A",12,FS.cx,7,FS.cz-18.9,0);
 addPlat(FS.cx,1.3,FS.cz-4,4,1,18,"#F4F1E8");for(let z=-12;z<=4;z+=2){const l=sph(0.18,"#F5C518",FS.cx-2.2,1.4,FS.cz+z);l.material=M("#F5C518","#7A5A00");const r=sph(0.18,"#F5C518",FS.cx+2.2,1.4,FS.cz+z);r.material=M("#F5C518","#7A5A00");}
 addPlat(FS.cx,0.8,FS.cz+6.3,4,0.5,1.4,"#F4F1E8");
 for(const s of [-1,1]){const sp=cone(1.4,3,"#FFFFFF",FS.cx+s*7,10,FS.cz-6,null,12);sp.material=new T.MeshBasicMaterial({color:0xFFF6C8,transparent:true,opacity:0.18});}
 // público
 for(let i=0;i<12;i++){const side=i%2?1:-1;const row=Math.floor(i/2);const look={skin:i%4,hair:(i*3)%HAIRS.length,hstyle:STYLES_H[i%3].id,shirt:SHIRTS[(i*7)%SHIRTS.length].id,pants:PANTS[(i*2)%PANTS.length].id,hat:"none"};const ch=makeChar(look);ch.g.position.set(FS.cx+side*6,0.3,FS.cz-10+row*3);ch.g.rotation.y=-side*Math.PI/2;Z.g.add(ch.g);box(1.2,0.6,1.2,"#B5179E",FS.cx+side*6.4,0.3,FS.cz-10+row*3,null);fs.judges.push(ch);}
 // mesa del jurado
 box(8,1.2,1.4,"#F5C518",FS.cx,0.9,FS.cz+10,null);addCol(FS.cx,FS.cz+10,8,1.4,1.2);
 ["😎","🤩","🧐"].forEach((e,i)=>{const sp=emojiSprite(e,1.6);sp.position.set(FS.cx-2.6+i*2.6,2.4,FS.cz+11.2);Z.g.add(sp);});
 // competidoras
 for(let i=0;i<3;i++){const look={skin:(i+1)%4,hair:(i*2+1)%HAIRS.length,hstyle:STYLES_H[(i+1)%3].id,shirt:"s1",pants:"p1",hat:"none",acc:"none",face:"none",neck:"none"};fs.bots.push({look,name:["Valentina","Isabella","Emiliano"][i],ch:null,score:0});}
 spot({zone:"moda",x:FS.cx-6,z:FS.cz+20,r:3,label:()=>fs.state==="idle"?"👗 Participar en la pasarela":"⏳ Concurso en marcha",fn:()=>{if(fs.state==="idle")fsStart();}});
 const cam=grp(FS.cx-6,0.3,FS.cz+20);box(3,2.6,0.2,"#E0307A",0,1.3,-1,cam);
 spot({zone:"moda",x:FS.cx+8,z:FS.cz+28,r:2.4,label:"🚌 Viajar en bus",fn:openPlaces});
 ROOT=scene;
}
function lookTags(L){const t=[];["shirt","pants","hat","acc","face","neck"].forEach(k=>{(ITEM_TAGS[L[k]]||[]).forEach(x=>t.push(x));});return t;}
function lookValue(L){let v=0;["shirt","pants","hat","acc","face","neck"].forEach(k=>{const it=(SLOT_LISTS[k]||[]).find(x=>x.id===L[k]);if(it&&it.p)v+=it.cur==="mc"?0.5:0.2;if(it&&it.id!=="none")v+=0.15;});return v;}
function fsScore(L,theme){const tg=lookTags(L);const hits=tg.filter(x=>theme.tags.includes(x)).length;return Math.min(10,1.5+hits*1.6+lookValue(L));}
function fsStart(){fs.theme=pick(THEMES);fs.state="dress";fs.t=60;
 fs.bots.forEach(b=>{const L=b.look;const pickFor=(list,k)=>{const good=list.filter(x=>(ITEM_TAGS[x.id]||[]).some(t=>fs.theme.tags.includes(t)));L[k]=Math.random()<0.6&&good.length?pick(good).id:pick(list).id;};pickFor(SHIRTS,"shirt");pickFor(PANTS,"pants");pickFor(HATS,"hat");pickFor(ACCS,"acc");pickFor(FACES,"face");b.score=fsScore(L,fs.theme)*rnd(0.75,1.15);});
 teleport(FS.cx-6,FS.cz+18,0.4,Math.PI,()=>openDressing("shirt"));}
function openDressing(slot){
 const names={shirt:"Camisa",pants:"Abajo",hat:"Cabeza",acc:"Espalda",face:"Cara",neck:"Cuello"};
 sheet(fs.theme.icon+" Tema: "+fs.theme.name,body=>{
  const tm=el("div","mg-top",'<span>Vístase para el tema</span><span id="fsT">⏱ '+Math.ceil(fs.t)+' s</span>');body.appendChild(tm);
  seg(body,Object.keys(names).map(k=>[k,names[k]]),slot,k=>openDressing(k));
  const list=SLOT_LISTS[slot];const g=el("div","grid");
  list.forEach(it=>{const own=!it.p||S.owned[it.id];const on=S.look[slot]===it.id;const fits=(ITEM_TAGS[it.id]||[]).some(t=>fs.theme.tags.includes(t));
   const c=el("div","card"+(on?" on":""),'<div class="big">'+(it.icon||swatch(it.c))+'</div><b>'+it.name+'</b><small>'+(fits?"⭐ Va con el tema":own?"":"En la tienda")+'</small>');
   const b=el("button","btn"+(own?" go":" coinb"),own?(on?"Puesto":"Ponerme"):priceHTML(it));b.disabled=own&&on;
   b.onclick=()=>{if(!own){if(!pay(it))return;S.owned[it.id]=1;}S.look[slot]=it.id;buildPlayer();openDressing(slot);};c.appendChild(b);g.appendChild(c);});
  body.appendChild(g);
  const go=el("button","btn red big","¡Listo! Salir a la pasarela");go.onclick=fsWalk;body.appendChild(go);
 },{clear:true,half:true,noClose:true});
}
function fsWalk(){closeSheet();fs.state="walk";fs.walkT=0;uiOpen=true;S.riding=false;buildPlayer();P.x=FS.cx;P.z=FS.cz-15;P.y=1.4;P.face=0;camYaw=0.6;camPitch=0.3;camDist=9;fs.score=fsScore(S.look,fs.theme)*rnd(0.95,1.1);}
function fsResults(){
 fs.state="idle";uiOpen=false;P.forceWalk=0;camDist=13;camPitch=0.55;S.stats.catwalks++;
 const all=[{name:S.name||"Usted",score:fs.score,me:true},...fs.bots.map(b=>({name:b.name,score:b.score}))].sort((a,b)=>b.score-a.score);
 const pos=all.findIndex(x=>x.me)+1;const prizes=[500,250,120,50];const v=earn(prizes[pos-1],"moda");
 let mcTxt="";if(pos===1){S.fashion.wins++;if(S.fashion.last!==todayStr()){S.fashion.last=todayStr();giveMC(3);mcTxt=" y 3 MediCoins";}}save();
 const stars=n=>"⭐".repeat(Math.max(1,Math.min(5,Math.round(n/2))));
 sheet(pos===1?"👑 ¡Ganó la pasarela!":"Resultados",b=>{
  b.appendChild(el("div","res",["🥇","🥈","🥉","🎀"][pos-1]+"<br>Lugar "+pos+" de 4<br>+$ "+fmt(v)+mcTxt));
  b.appendChild(el("div","list",all.map((x,i)=>'<div class="li"><div style="font-size:24px">'+["🥇","🥈","🥉","🎀"][i]+'</div><div class="tx"><b>'+x.name+(x.me?" (usted)":"")+'</b><small>'+stars(x.score)+'</small></div></div>').join("")));
  b.appendChild(el("p","muted","Consejo: las prendas con ⭐ van con el tema y suben su puntaje. Las prendas especiales también ayudan."));
  const k=el("button","btn go big","Otra vez");k.onclick=()=>{closeSheet();fsStart();};b.appendChild(k);
 },{half:true});
}
mode({id:"moda",dbg:fs,init:buildFashion,update(dt){
 if(curZone.id!=="moda")return;
 fs.judges.forEach((j,i)=>{j.arms[0].rotation.x=fs.state==="walk"?-2.5+Math.sin(perf*14+i)*0.4:0;j.arms[1].rotation.x=fs.state==="walk"?-2.5+Math.cos(perf*14+i)*0.4:0;});
 if(fs.state==="dress"){fs.t-=dt;const t=$("fsT");if(t)t.textContent="⏱ "+Math.max(0,Math.ceil(fs.t))+" s";if(fs.t<=0)fsWalk();zoneButton(fs.theme.icon+" "+fs.theme.name,null);return;}
 if(fs.state==="walk"){fs.walkT+=dt;const z=Math.min(FS.cz+4.5,FS.cz-15+fs.walkT*3.2);P.x=FS.cx;P.z=z;P.y=1.3;P.vy=0;P.face=0;P.forceWalk=3;camYaw+=dt*0.25;
  if(fs.walkT>6.5&&fs.walkT<7.6){P.face=Math.PI;player.arms[1].rotation.x=-2.8;}
  zoneButton("✨ ¡Desfilando! "+fs.theme.icon+" "+fs.theme.name,null);if(fs.walkT>8)fsResults();return;}
 zoneButton("👗 Camine al letrero rosado para participar",null);
}});
