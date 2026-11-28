/* ================= DIVERSIÓN: SONIDOS, BAILES, CÁSCARAS, ESTELAS ================= */
let AC=null;
function sfx(k){if(S.sound===false)return;try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();
 const t=AC.currentTime;const tone=(f,f2,d,type,v,delay)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f,t+(delay||0));if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+(delay||0)+d);g.gain.setValueAtTime(v||0.12,t+(delay||0));g.gain.exponentialRampToValueAtTime(0.001,t+(delay||0)+d);o.connect(g);g.connect(AC.destination);o.start(t+(delay||0));o.stop(t+(delay||0)+d+0.02);};
 if(k==="salto")tone(380,720,0.16,"sine",0.08);
 if(k==="moneda"){tone(988,0,0.08,"square",0.05);tone(1319,0,0.18,"square",0.05,0.07);}
 if(k==="caida"){tone(520,140,0.45,"triangle",0.12);tone(900,1200,0.08,"sine",0.05,0.45);tone(1100,1500,0.08,"sine",0.05,0.55);}
 if(k==="compra"){tone(660,0,0.1,"triangle",0.1);tone(880,0,0.1,"triangle",0.1,0.1);tone(1320,0,0.25,"triangle",0.1,0.2);}
 if(k==="pop")tone(600,900,0.08,"sine",0.08);
 if(k==="reto"){[523,659,784,1047].forEach((f,i)=>tone(f,0,0.18,"triangle",0.09,i*0.1));}
 if(k==="boing")tone(200,900,0.35,"sine",0.12);
}catch(e){}}
/* ---------- Bailes y gestos ---------- */
const DANCES=[
 {id:2,name:"Saludar",icon:"👋",p:0},{id:0,name:"Bailar",icon:"💃",p:0},{id:1,name:"Girar",icon:"🌀",p:0},
 {id:3,name:"Saltos de alegría",icon:"🤸",p:25,cur:"mc"},{id:4,name:"Balanceo",icon:"🎶",p:35,cur:"mc"},
 {id:5,name:"Robot",icon:"🤖",p:50,cur:"mc"},{id:6,name:"Estrella",icon:"🌟",p:80,cur:"mc"}
];
function playDance(id,silent){if(!player||player.fall>0)return;if(vehicleObj){toast("Bájese del vehículo para bailar");return;}player.dance=id===2?2.2:5;player.danceT=id;player.wave=0;if(id===2)player.wave=0;
 if(!silent&&typeof sendEmote==="function")sendEmote(id);if(typeof retoAdd==="function")retoAdd("bailes",1);}
function openDances(){sheet("😀 Bailes y gestos",b=>{
 b.appendChild(el("p","muted","Toque un baile. Sus amigas lo ven si están en la misma sala."));
 const g=el("div","dgrid");
 DANCES.forEach(d=>{const own=!d.p||(S.dances&&S.dances[d.id]);const c=el("button","dcard"+(own?"":" lock"),'<span class="de">'+d.icon+'</span><b>'+d.name+'</b>'+(own?"":'<small><span class="coin sm"></span> '+d.p+'</small>'));
  c.onclick=()=>{if(own){closeSheet();playDance(d.id);return;}if(!pay(d))return;S.dances=S.dances||{};S.dances[d.id]=1;save();sfx("compra");toast("🎉 Nuevo baile: "+d.name);openDances();};g.appendChild(c);});
 b.appendChild(g);},{half:true});}
/* ---------- Cáscaras de banano (para caerse) ---------- */
const peels=[];
function setupPeels(){ROOT=ZONES.city.g;for(let i=0;i<7;i++){const [x,z]=freeSpot(1.5);const g=grp(x,0.32,z);const c=new T.Group();g.add(c);
 for(let k=0;k<3;k++){const p=sph(0.22,"#F5D22B",0,0.06,0,c,8,6);p.scale.set(0.45,0.25,1.3);p.rotation.y=k*2.1;p.position.set(Math.sin(k*2.1)*0.18,0.04,Math.cos(k*2.1)*0.18);}
 sph(0.12,"#8A6A1F",0,0.1,0,c,8,6);peels.push({g,x,z,cd:0});}ROOT=scene;}
function updatePeels(dt){for(const p of peels){if(p.cd>0){p.cd-=dt;if(p.cd<=0){const [x,z]=freeSpot(1.5);p.x=x;p.z=z;p.g.position.set(x,0.32,z);p.g.visible=true;}continue;}
 if(!vehicleObj&&P.ground&&Math.hypot(p.x-P.x,p.z-P.z)<0.8&&P.speed>1){p.cd=20;p.g.visible=false;P.push={x:Math.sin(P.face)*6,z:Math.cos(P.face)*6};setTimeout(()=>P.push=null,350);trip("¡Se resbaló con una cáscara!");if(typeof sendEmote==="function")sendEmote(-1);}}}
/* ---------- Estelas mágicas al caminar ---------- */
const TRAILS=[
 {id:"none",name:"Sin estela",icon:"🚫",p:0},
 {id:"brillos",name:"Brillitos",icon:"✨",p:40,cur:"mc",e:["✨","⭐"]},
 {id:"corazones",name:"Corazones",icon:"💖",p:60,cur:"mc",e:["💖","💗","💕"]},
 {id:"arcoiris",name:"Arcoíris",icon:"🌈",p:90,cur:"mc",e:["🔴","🟠","🟡","🟢","🔵","🟣"]},
 {id:"flores",name:"Flores",icon:"🌸",p:70,cur:"mc",e:["🌸","🌼","🌷"]},
 {id:"burbujas",name:"Burbujas",icon:"🫧",p:50,cur:"mc",e:["🫧","💧"]},
 {id:"fuego",name:"Fueguito",icon:"🔥",p:120,cur:"mc",e:["🔥","✨"]},
 {id:"musica",name:"Notas musicales",icon:"🎵",p:80,cur:"mc",e:["🎵","🎶"]}
];
const trailTex={};function trailMat(e){if(!trailTex[e]){const t=canvasTex(64,64,x=>{x.font="52px sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText(e,32,36);});trailTex[e]=new T.SpriteMaterial({map:t,transparent:true,depthWrite:false});}return trailTex[e];}
const trailParts=[];let trailT=0;
function emitTrail(id,x,y,z){const tr=TRAILS.find(t=>t.id===id);if(!tr||!tr.e)return;const s=new T.Sprite(trailMat(pick(tr.e)).clone());s.position.set(x+rnd(-0.3,0.3),y+0.4+rnd(0,0.6),z+rnd(-0.3,0.3));const sc=rnd(0.35,0.6);s.scale.set(sc,sc,1);scene.add(s);trailParts.push({s,life:1.1,vy:rnd(0.3,0.9),sc});}
function updateTrails(dt){
 if(S.look.trail&&S.look.trail!=="none"&&P.speed>1&&player&&player.g.visible){trailT+=dt;if(trailT>0.07){trailT=0;emitTrail(S.look.trail,P.x,P.y,P.z);}}
 for(let i=trailParts.length-1;i>=0;i--){const t=trailParts[i];t.life-=dt;t.s.position.y+=t.vy*dt;t.s.material.opacity=Math.max(0,t.life);const k=t.sc*(0.6+t.life*0.4);t.s.scale.set(k,k,1);if(t.life<=0){scene.remove(t.s);t.s.material.dispose();trailParts.splice(i,1);}}}
mode({id:"diversion",
 init(){setupPeels();},
 afterStart(){const b=$("emoBtn");if(b)b.onclick=openDances;},
 update(dt){if(curZone&&curZone.id==="city")updatePeels(dt);updateTrails(dt);}
});
