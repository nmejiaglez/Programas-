/* ================= BUSCAR AMIGAS E INVITACIONES (aceptar o no) ================= */
function findHidden(){return !!(S.parent&&(S.parent.find===false||S.parent.rooms===false));}
function charThumb(look,key){const L=Object.assign({},fresh().look,look||{});return thumb("C"+JSON.stringify(L),()=>{const c=makeChar(L);c.g.rotation.y=-0.3;c.shadow.visible=false;return c.g;},FRAME_BODY);}
function lastSeenTxt(t){const m=Math.floor((Date.now()-t)/60000);return m<1?"🟢 Jugando ahora":m<10?"🟢 Hace "+m+" min":"";}
const INV={seen:{},sentT:{},pollT:6,beatT:50};
async function searchPlayers(q){const all=await db("GET","perfiles")||{};const now=Date.now();q=q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
 return Object.keys(all).filter(id=>{const p=all[id];if(!p||id===NET.uid||p.hide||(S.blocked&&S.blocked[id]))return false;if(!p.t||now-p.t>10*60000)return false;
  const n=(p.n||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""),tg=(p.tag||"").toLowerCase();return n.startsWith(q)||tg===q;}).slice(0,12).map(id=>Object.assign({id},all[id]));}
function openSearch(q){sheet("🔎 Buscar amiga",b=>{
 b.appendChild(el("p","muted","Escriba el nombre de su amiga. Solo aparecen las niñas y niños que están jugando ahora."));
 const i=el("input");i.type="text";i.id="findIn";i.placeholder="Nombre, por ejemplo Valeria";i.maxLength=16;i.value=q||"";b.appendChild(i);
 const go=el("button","btn go","🔎 Buscar");b.appendChild(go);const res=el("div","list");b.appendChild(res);
 const run=async()=>{const v=i.value.trim();if(v.length<2){toast("Escriba al menos 2 letras");return;}go.disabled=true;res.innerHTML="";res.appendChild(el("p","muted","Buscando…"));
  try{const list=await searchPlayers(v);res.innerHTML="";if(!list.length)res.appendChild(el("p","muted","No encontré a nadie jugando con ese nombre. Pídale que abra el juego, o use el código de sala."));
   list.forEach(p=>{const r=el("div","li fcard");r.innerHTML=imgTag(charThumb(p.look),'<div style="font-size:30px">🙂</div>')+'<div class="tx"><b>'+escapeHtml(p.n||"Jugador")+'</b><small>'+escapeHtml(p.tag||"")+'<br>'+lastSeenTxt(p.t)+'</small></div>';
    const iv=el("button","btn go","💌 Invitar");iv.style.width="auto";iv.style.padding="8px 12px";iv.onclick=()=>sendInvite(p.id,p);r.appendChild(iv);res.appendChild(r);});}
  catch(e){res.innerHTML="";res.appendChild(el("p","muted",errMsg(e)));}go.disabled=false;};
 go.onclick=run;i.addEventListener("keydown",e=>{if(e.key==="Enter")run();});if(q)run();
});}
async function sendInvite(uid,p){
 if(!NET.ok){toast("Necesita internet");return;}if(S.parent&&S.parent.rooms===false){toast("Los papás desactivaron jugar con amigas");return;}
 if(INV.sentT[uid]&&Date.now()-INV.sentT[uid]<30000){toast("Ya la invitó. Espere su respuesta 💌");return;}
 const home=myHome();
 try{await db("PUT","invites/"+uid+"/"+NET.uid,{n:S.name||"Jugador",tag:myTag(),room:home,look:S.look,t:SV_TIME});}catch(e){toast(errMsg(e).indexOf("ermiso")>=0||String(e).indexOf("401")>=0?"Falta activar las invitaciones en Firebase (pídale al dueño)":errMsg(e));return;}
 INV.sentT[uid]=Date.now();sfx("pop");
 if(NET.room!==home)await joinRoom(home);
 sheet("💌 Invitación enviada",b=>{b.appendChild(el("div","res",imgTag(charThumb(p.look),"🙂")));b.appendChild(el("p","","Le mandó una invitación a <b>"+escapeHtml(p.n||"su amiga")+"</b>. Si acepta, aparecerá aquí en su sala. Si no quiere, no pasa nada."));
  const k=el("button","btn go big","¡A jugar!");k.onclick=closeSheet;b.appendChild(k);},{half:true});
}
async function checkInvites(){if(!NET.ok||(S.parent&&S.parent.rooms===false))return;
 if(INV.off)return;let d=null;try{d=await db("GET","invites/"+NET.uid);}catch(e){if(String(e.message).indexOf("ermission")>=0)INV.off=true;return;}if(!d)return;
 const now=Date.now();
 for(const from in d){const v=d[from];const old=!v||!v.t||now-v.t>5*60000;
  if(old||(S.blocked&&S.blocked[from])||(S.parent&&S.parent.rooms===false)){db("DELETE","invites/"+NET.uid+"/"+from).catch(()=>{});continue;}
  if(INV.seen[from]===v.t||uiOpen||titleOn)continue;INV.seen[from]=v.t;showInvite(from,v);return;}}
function showInvite(from,v){sfx("reto");sheet("💌 ¡Te invitan a jugar!",b=>{
 b.appendChild(el("div","res",imgTag(charThumb(v.look),"🙂")));
 b.appendChild(el("p","",'<b>'+escapeHtml(v.n||"Alguien")+'</b> <span class="muted">('+escapeHtml(v.tag||"")+')</span> te invita a jugar en su sala.'));
 const r=el("div","row");const no=el("button","btn ghost","❌ No, gracias");const si=el("button","btn go","✅ Aceptar");
 const del=()=>db("DELETE","invites/"+NET.uid+"/"+from).catch(()=>{});
 no.onclick=()=>{del();closeSheet();toast("Invitación rechazada");};
 si.onclick=async()=>{del();closeSheet();if(typeof v.room==="string"&&/^[A-Z0-9]{5}$/.test(v.room)){await joinRoom(v.room);toast("👭 ¡Ya está con "+(v.n||"su amiga")+"!");}};
 r.append(no,si);b.appendChild(r);
 const bl=el("button","btn ghost","🔇 No quiero invitaciones de esta persona");bl.onclick=()=>{del();S.blocked=S.blocked||{};S.blocked[from]=1;save();closeSheet();toast("Bloqueada");};b.appendChild(bl);
},{half:true});}
mode({id:"invitaciones",update(dt){if(!NET.ok)return;INV.pollT+=dt;INV.beatT+=dt;
 if(INV.pollT>8){INV.pollT=0;checkInvites();}
 if(INV.beatT>60){INV.beatT=0;db("PATCH","perfiles/"+NET.uid,{t:SV_TIME,hide:findHidden()?1:0,n:S.name||"Jugador",tag:myTag()}).catch(()=>{});}}});
