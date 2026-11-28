/* ================= MODO EN LÍNEA (Firebase por REST) ================= */
const FB={key:"AIzaSyCcK3SfW8lpa5fiDyr8BJzofaRqG3zTfg8",db:"https://mi-ciudad-c3dd2-default-rtdb.firebaseio.com",
 idt:"https://identitytoolkit.googleapis.com/v1/",stk:"https://securetoken.googleapis.com/v1/token"};
const AUTH_KEY="miCiudad.auth";
const NET={uid:null,token:null,refresh:null,exp:0,email:null,ok:false,admin:false,busy:false,lastErr:"",
 room:null,es:null,chatEs:null,poll:false,pollT:0,chatT:0,players:{},remotes:{},sendT:0,beatT:0,lastSent:"",chatSeen:{},
 syncT:0,grantT:0,rankT:0,lastSync:"",joinedAt:0};
const PHRASES=["👋 ¡Hola!","😄 ¡Qué divertido!","🏃 ¡Sígueme!","🙏 ¡Ayúdame!","🎉 ¡Lo logramos!","👍 ¡Sí!","👎 No","⏳ Espérame",
 "🏥 Vamos al hospital","🌋 Vamos a la isla","🧗 Vamos a la torre","🎡 Vamos al parque","🐶 ¡Mira mi mascota!","👗 ¡Qué linda tu ropa!","😂","❤️","⭐","👋 ¡Adiós!"];
const REPORT_REASONS=["Tiene un nombre feo","Molesta a otros jugadores","Otra cosa"];

/* ---------- cuenta ---------- */
function authLoad(){try{const a=JSON.parse(localStorage.getItem(AUTH_KEY)||"null");if(a){NET.uid=a.uid;NET.token=a.token;NET.refresh=a.refresh;NET.exp=a.exp;NET.email=a.email||null;}}catch(e){}}
function authSave(){try{localStorage.setItem(AUTH_KEY,JSON.stringify({uid:NET.uid,token:NET.token,refresh:NET.refresh,exp:NET.exp,email:NET.email}));}catch(e){}}
function setAuth(uid,tok,ref,expSec,email){NET.uid=uid;NET.token=tok;NET.refresh=ref;NET.exp=Date.now()+(+expSec||3600)*1000;if(email!==undefined)NET.email=email;authSave();}
async function idt(path,body){const r=await fetch(FB.idt+path+"?key="+FB.key,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.error&&j.error.message)||("HTTP "+r.status));return j;}
async function signUpAnon(){const j=await idt("accounts:signUp",{returnSecureToken:true});setAuth(j.localId,j.idToken,j.refreshToken,j.expiresIn,null);}
async function refreshToken(){const r=await fetch(FB.stk+"?key="+FB.key,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=refresh_token&refresh_token="+encodeURIComponent(NET.refresh)});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.error&&j.error.message)||"REFRESH");setAuth(j.user_id,j.id_token,j.refresh_token,j.expires_in);}
async function tok(){if(!NET.token)throw new Error("SIN_CUENTA");if(Date.now()>NET.exp-120000)await refreshToken();return NET.token;}
async function db(method,path,data,query){const t=await tok();const u=FB.db+"/"+path+".json?auth="+encodeURIComponent(t)+(query?"&"+query:"");
 const r=await fetch(u,{method,headers:{"Content-Type":"application/json"},body:data===undefined?undefined:JSON.stringify(data)});const j=await r.json().catch(()=>null);
 if(!r.ok){const e=new Error((j&&j.error)||("HTTP "+r.status));e.status=r.status;throw e;}return j;}
const SV_TIME={".sv":"timestamp"};
function errMsg(e){const m=String(e&&e.message||e);
 const map={EMAIL_EXISTS:"Ese correo ya tiene una cuenta. Use «Entrar con mi correo».",INVALID_EMAIL:"El correo no es válido.",WEAK_PASSWORD:"La contraseña debe tener al menos 6 letras o números.",
  INVALID_LOGIN_CREDENTIALS:"Correo o contraseña incorrectos.",EMAIL_NOT_FOUND:"No hay cuenta con ese correo.",INVALID_PASSWORD:"Contraseña incorrecta.",USER_DISABLED:"Esta cuenta está bloqueada.",
  "Permission denied":"No tiene permiso para eso.",TOO_MANY_ATTEMPTS_TRY_LATER:"Demasiados intentos. Espere unos minutos.","Failed to fetch":"Sin internet. Revise su conexión."};
 for(const k in map)if(m.indexOf(k)>=0)return map[k];return "No se pudo: "+m;}
function myTag(){const base=(S.name||"Jugador").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z]/g,"").slice(0,10)||"Jugador";const n=NET.uid?(h32(NET.uid)%9000)+1000:0;return base+"-"+n;}

function ownerUI(){const b=$("bOwner");if(!b)return;b.hidden=!NET.admin;b.onclick=ownerLogin;if(player)buildPlayer();}
async function netStart(){
 authLoad();
 try{
  if(!NET.uid)await signUpAnon();else await tok();
  NET.ok=true;netDot();
  NET.admin=(await db("GET","admins/"+NET.uid))===true;ownerUI();
  await pullCloud(false);
  await pushCloud(true);
  await checkGrants();
 }catch(e){NET.ok=false;NET.lastErr=errMsg(e);netDot();if(String(e.message).indexOf("TOKEN")>=0||String(e.message).indexOf("USER_NOT_FOUND")>=0){NET.uid=null;NET.token=null;authSave();}}
}
function netDot(){const d=$("netdot");if(!d)return;d.hidden=false;d.className="netdot "+(NET.ok?"on":"off");d.title=NET.ok?"En línea":"Sin conexión";}
function cleanSave(){const c=JSON.parse(JSON.stringify(S));delete c.pin;delete c.gen;delete c.used;if(c.parent)delete c.parent.pin;return c;}
async function pushCloud(force){
 if(!NET.ok)return;const c=cleanSave();const js=JSON.stringify(c);if(!force&&js===NET.lastSync)return;
 await db("PUT","users/"+NET.uid,{s:c,t:SV_TIME});NET.lastSync=js;
 await db("PUT","perfiles/"+NET.uid,{n:S.name||"Jugador",tag:myTag(),look:S.look,t:SV_TIME,hide:findHidden()?1:0});
}
async function pullCloud(replace){
 const d=await db("GET","users/"+NET.uid);if(!d||!d.s)return false;
 const cloudT=d.s.savedAt||0,localT=S.savedAt||0;
 if(replace||cloudT>localT+5000){const keep={pin:S.pin,gen:S.gen,used:S.used,parent:S.parent};S=deepMerge(fresh(),d.s);S.pin=keep.pin;S.gen=keep.gen;S.used=Object.assign({},keep.used,S.used);if(keep.parent)S.parent=Object.assign(S.parent||{},keep.parent);
  saveLocalOnly();buildPlayer();applyLoadedState();toast("☁️ Progreso traído de la nube");return true;}
 return false;
}
function applyLoadedState(){hud();if(typeof refreshRides==="function")refreshRides();}
async function checkGrants(){
 if(!NET.ok)return;const g=await db("GET","grants/"+NET.uid);if(!g)return;
 S.grantsDone=S.grantsDone||{};
 for(const id in g){const it=g[id]||{};if(!S.grantsDone[id]&&+it.a>0){S.mc+=+it.a;S.grantsDone[id]=1;toast("🎁 ¡Recibió "+fmt(+it.a)+" MediCoins"+(it.de?" de "+it.de:"")+"!");}
  try{await db("DELETE","grants/"+NET.uid+"/"+id);}catch(e){}}
 hud();save();
}
async function pushRanking(){if(!NET.ok)return;await db("PUT","ranking/"+NET.uid,{n:S.name||"Jugador",tag:myTag(),e:Math.floor(S.stats.earned||0),l:S.adv.lvl||1,o:S.obby.best||0,p:(S.pets||[]).length,t:SV_TIME});}

/* ---------- cuenta: vincular correo / entrar ---------- */
function openAccount(){sheet("👤 Mi cuenta",b=>{
 const st=el("div","li",'<div style="font-size:28px">'+(NET.ok?"🟢":"🔴")+'</div><div class="tx"><b>'+(NET.ok?"En línea":"Sin conexión")+'</b><small>'+(NET.ok?"Su progreso se guarda en internet":NET.lastErr||"El juego funciona igual sin internet")+'</small></div>');b.appendChild(st);
 if(NET.uid){b.appendChild(el("div","li",'<div style="font-size:28px">🏷️</div><div class="tx"><b class="mono">'+myTag()+'</b><small>Su nombre de usuario (para que el dueño le envíe premios)</small></div>'));}
 if(!NET.ok){const r=el("button","btn go","Reintentar conexión");r.onclick=async()=>{r.disabled=true;await netStart();openAccount();};b.appendChild(r);return;}
 if(NET.email){b.appendChild(el("p","muted","Cuenta guardada con el correo de los papás: "+NET.email+". Puede entrar con ese correo desde otro teléfono o computadora."));
  const o=el("button","btn ghost","Cerrar sesión en este aparato");o.onclick=()=>requireParent(()=>sheet("¿Cerrar sesión?",c=>{c.appendChild(el("p","","Su progreso queda guardado en internet con "+NET.email+". En este aparato el juego empieza de cero, sin sus MediCoins. Para volver, entre con su correo y contraseña."));const r=el("div","row");const no=el("button","btn ghost","Cancelar");no.onclick=closeSheet;const si=el("button","btn red","Cerrar sesión");si.onclick=async()=>{si.disabled=true;try{await pushCloud(true);}catch(e){}try{localStorage.removeItem(AUTH_KEY);}catch(e){}NET.uid=null;NET.token=null;NET.email=null;NET.ok=false;const q=S.quality;S=fresh();S.quality=q;save();location.reload();};r.append(no,si);c.appendChild(r);},{half:true}),"cerrar la sesión");b.appendChild(o);}
 else{b.appendChild(el("h3","","Guardar la cuenta (para papás)"));b.appendChild(el("p","muted","Con el correo de un adulto la cuenta no se pierde si cambia de teléfono. No escriba el correo del niño."));
  const e=el("input");e.type="text";e.id="accEmail";e.placeholder="Correo del papá o la mamá";e.setAttribute("autocapitalize","off");b.appendChild(e);
  const p=el("input");p.type="password";p.id="accPass";p.placeholder="Contraseña (6 o más)";b.appendChild(p);
  const g=el("button","btn go","Guardar mi cuenta");g.onclick=()=>requireParent(async()=>{g.disabled=true;try{const j=await idt("accounts:signUp",{idToken:await tok(),email:e.value.trim(),password:p.value,returnSecureToken:true});setAuth(j.localId,j.idToken,j.refreshToken,j.expiresIn,j.email);await pushCloud(true);toast("✅ Cuenta guardada");openAccount();}catch(er){toast(errMsg(er));g.disabled=false;}},"guardar la cuenta");b.appendChild(g);
 }
 b.appendChild(el("h3","","Entrar con otra cuenta"));
 const e2=el("input");e2.type="text";e2.id="logEmail";e2.placeholder="Correo";e2.setAttribute("autocapitalize","off");const p2=el("input");p2.type="password";p2.id="logPass";p2.placeholder="Contraseña";b.append(e2,p2);
 const l=el("button","btn ghost","Entrar con mi correo");l.onclick=()=>requireParent(async()=>{l.disabled=true;try{const j=await idt("accounts:signInWithPassword",{email:e2.value.trim(),password:p2.value,returnSecureToken:true});setAuth(j.localId,j.idToken,j.refreshToken,j.expiresIn,j.email);NET.admin=(await db("GET","admins/"+NET.uid))===true;const had=await pullCloud(true);if(!had)await pushCloud(true);toast("✅ Entró como "+j.email);openAccount();}catch(er){toast(errMsg(er));l.disabled=false;}},"entrar con otra cuenta");b.appendChild(l);
 const f=el("button","btn ghost","Olvidé la contraseña");f.onclick=async()=>{try{await idt("accounts:sendOobCode",{requestType:"PASSWORD_RESET",email:e2.value.trim()});toast("📧 Le enviamos un correo para cambiarla");}catch(er){toast(errMsg(er));}};b.appendChild(f);
});}

/* ---------- salas con amigas ---------- */
function myHome(){if(!NET.uid)return roomCode();let h=h32(NET.uid+"casa"),out="";for(let i=0;i<5;i++){out+=B32[h%32];h=Math.floor(h/32)+h32(out+NET.uid)%997;}return out;}
function inviteText(code){return "¡Ven a jugar conmigo en Mi Ciudad! 🌈🏙️ Mi sala es: "+code+" — Abre el juego, toca 👫 Amigos y escribe el código.";}
function invite(code){const t=inviteText(code);sfx("pop");
 if(navigator.share){navigator.share({text:t}).catch(()=>{});return;}
 try{window.open("https://wa.me/?text="+encodeURIComponent(t),"_blank");}catch(e){}
 try{navigator.clipboard.writeText(t).then(()=>toast("📋 Invitación copiada: péguela en WhatsApp"));}catch(e){}}
function rememberFriend(id,p){if(!p||!p.n||!p.home||id===NET.uid||(S.blocked&&S.blocked[id]))return;S.friends=S.friends||{};const f=S.friends[id];
 if(!f||f.home!==p.home||f.n!==p.n||Date.now()-f.t>60000){S.friends[id]={n:p.n,tag:p.tag||"",home:p.home,t:Date.now(),look:p.look?{skin:p.look.skin,hair:p.look.hair,hstyle:p.look.hstyle}:null};
  const ids=Object.keys(S.friends).sort((a,b)=>S.friends[b].t-S.friends[a].t);ids.slice(30).forEach(k=>delete S.friends[k]);if(!f)toast("💞 "+p.n+" se guardó en Mis amigos");}}
function roomCode(){let s="";for(let i=0;i<5;i++)s+=B32[Math.floor(Math.random()*32)];return s;}
function openFriends(tab){tab=tab||"sala";
 if(!S.parent||S.parent.rooms===false){sheet("👫 Jugar con amigos",b=>{b.appendChild(el("p","","Los papás desactivaron el juego con amigos en Control de padres."));});return;}
 sheet("👫 Jugar con amigos",body=>{
  seg(body,[["sala","Mi sala"],["ranking","🏆 Ranking"]],tab,t=>openFriends(t));
  if(tab==="ranking"){renderRanking(body);return;}
  if(!NET.ok){body.appendChild(el("p","","Necesita internet para jugar con amigos."));const r=el("button","btn go","Reintentar conexión");r.onclick=async()=>{await netStart();openFriends();};body.appendChild(r);return;}
  if(NET.room){
   body.appendChild(el("p","muted","Comparta este código con sus amigos. Solo entra quien lo tenga."));
   const cb=el("div","codebox",NET.room);body.appendChild(cb);
   const rw=el("div","row");const cp=el("button","btn ghost","📋 Copiar código");cp.onclick=()=>{try{navigator.clipboard.writeText(NET.room).then(()=>toast("Copiado"),()=>selectText(cb));}catch(e){selectText(cb);}};
   const iv=el("button","btn go","📲 Invitar amigos");iv.onclick=()=>invite(NET.room);rw.append(cp,iv);body.appendChild(rw);
   const sb=el("button","btn","🔎 Buscar e invitar amigos");sb.onclick=()=>openSearch();body.appendChild(sb);
   body.appendChild(el("h3","","En la sala"));
   const l=el("div","list");const ids=Object.keys(NET.players).filter(id=>id!==NET.uid&&remoteAlive(NET.players[id]));
   l.appendChild(el("div","li",'<div style="font-size:24px">⭐</div><div class="tx"><b>'+escapeHtml(S.name||"Yo")+' (usted)</b><small>'+myTag()+'</small></div>'));
   ids.forEach(id=>{const p=NET.players[id];const blk=S.blocked&&S.blocked[id];const r=el("div","li",'<div style="font-size:24px">'+(blk?"🔇":"🙂")+'</div><div class="tx"><b>'+escapeHtml(p.n||"Jugador")+'</b><small>'+escapeHtml(p.tag||"")+(p.zone&&ZONES[p.zone]?" · "+ZONES[p.zone].icon+" "+ZONES[p.zone].name:"")+'</small></div>');
    const bb=el("button","btn ghost",blk?"Desbloquear":"🔇 Bloquear");bb.style.width="auto";bb.style.padding="6px 10px";bb.onclick=()=>{S.blocked=S.blocked||{};if(blk)delete S.blocked[id];else S.blocked[id]=1;save();openFriends();};
    const rp=el("button","btn ghost","🚩");rp.style.width="auto";rp.style.padding="6px 10px";rp.setAttribute("aria-label","Reportar");rp.onclick=()=>openReport(id,p);
    r.append(bb,rp);l.appendChild(r);});
   if(!ids.length)l.appendChild(el("p","muted","Todavía no ha entrado nadie. Mande el código a sus amigos."));
   body.appendChild(l);
   if(NET.poll)body.appendChild(el("p","note","Conexión en modo de respaldo: los amigos se mueven un poco más lento."));
   const lv=el("button","btn red","Salir de la sala");lv.onclick=()=>{leaveRoom();openFriends();};body.appendChild(lv);
   return;}
  body.appendChild(el("p","muted","Su sala tiene un código fijo: compártalo una vez y sus amigos siempre la encuentran. Solo entra quien tenga el código."));
  const home=myHome();const hb=el("div","codebox",home);body.appendChild(hb);
  const rw=el("div","row");const c=el("button","btn go big","🏠 Abrir mi sala");c.onclick=()=>{joinRoom(home);openFriends();};const iv=el("button","btn big","📲 Invitar");iv.onclick=()=>invite(home);rw.append(c,iv);body.appendChild(rw);
  const sb=el("button","btn big","🔎 Buscar amigos por su nombre");sb.style.background="linear-gradient(#B38CFF,#7B4BD1)";sb.style.boxShadow="0 3px 0 #5A2FA8";sb.onclick=()=>openSearch();body.appendChild(sb);
  const fr=S.friends?Object.keys(S.friends).filter(id=>!(S.blocked&&S.blocked[id])).sort((a,b)=>S.friends[b].t-S.friends[a].t):[];
  body.appendChild(el("h3","","💞 Mis amigos"));
  if(!fr.length)body.appendChild(el("p","muted","Cuando juegue con alguien en una sala, aparecerá aquí para visitarla con un toque."));
  else{const l=el("div","list");fr.forEach(id=>{const f=S.friends[id];const r=el("div","li",'<div style="font-size:26px">'+["🧒","👧","👦","🧒🏽","👧🏾"][h32(id)%5]+'</div><div class="tx"><b>'+escapeHtml(f.n)+'</b><small>'+escapeHtml(f.tag)+' · Sala '+f.home+'</small></div>');
    const v=el("button","btn go","🏠 Visitar");v.style.width="auto";v.style.padding="7px 10px";v.onclick=()=>{joinRoom(f.home);openFriends();};
    const ivf=el("button","btn","💌");ivf.style.width="auto";ivf.style.padding="7px 10px";ivf.setAttribute("aria-label","Invitar");ivf.onclick=()=>sendInvite(id,{n:f.n,look:f.look});r.appendChild(ivf);
    const x=el("button","btn ghost","✖");x.style.width="auto";x.style.padding="7px 10px";x.setAttribute("aria-label","Quitar de mis amigos");x.onclick=()=>{delete S.friends[id];save();openFriends();};r.append(v,x);l.appendChild(r);});body.appendChild(l);}
  body.appendChild(el("h3","","Entrar a la sala de un amigo o amiga"));
  const i=el("input");i.type="text";i.id="roomIn";i.placeholder="Código, por ejemplo K7P2Q";i.maxLength=5;i.setAttribute("autocapitalize","characters");body.appendChild(i);
  const j=el("button","btn go","Entrar");j.onclick=()=>{const v=i.value.toUpperCase().replace(/[^A-Z0-9]/g,"");if(v.length!==5){toast("El código tiene 5 letras o números");return;}joinRoom(v);openFriends();};body.appendChild(j);
 });
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function remoteAlive(p){return p&&p._seen&&Date.now()-p._seen<20000;}
function streamUrl(path,query){return FB.db+"/"+path+".json?auth="+encodeURIComponent(NET.token)+(query?"&"+query:"");}
async function joinRoom(code){
 if(NET.room)leaveRoom();
 NET.room=code;NET.players={};NET.chatSeen={};NET.poll=false;NET.joinedAt=Date.now();NET.lastSent="";
 try{await tok();await sendMyState(true);}catch(e){toast(errMsg(e));NET.room=null;return;}
 toast("👫 Está en la sala "+code);if(typeof retoAdd==="function")retoAdd("amigas",1);openStreams();$("chatBtn").hidden=false;
}
function openStreams(){
 closeStreams();if(!NET.room)return;
 let gotAny=false;
 try{
  const es=new EventSource(streamUrl("rooms/"+NET.room+"/players"));NET.es=es;
  const onPut=(ev,patch)=>{gotAny=true;let d;try{d=JSON.parse(ev.data);}catch(e){return;}applyPlayersEvent(d.path,d.data,patch);};
  es.addEventListener("put",ev=>onPut(ev,false));es.addEventListener("patch",ev=>onPut(ev,true));
  es.addEventListener("auth_revoked",()=>{refreshToken().then(openStreams).catch(()=>{});});
  es.addEventListener("cancel",()=>{toast("No tiene permiso para esta sala");});
  const cs=new EventSource(streamUrl("rooms/"+NET.room+"/chat",'orderBy="$key"&limitToLast=10'));NET.chatEs=cs;
  const onChat=ev=>{gotAny=true;let d;try{d=JSON.parse(ev.data);}catch(e){return;}applyChatEvent(d.path,d.data);};
  cs.addEventListener("put",onChat);cs.addEventListener("patch",onChat);
 }catch(e){}
 setTimeout(()=>{if(NET.room&&!gotAny){closeStreams();NET.poll=true;}},6000);
}
function closeStreams(){if(NET.es){NET.es.close();NET.es=null;}if(NET.chatEs){NET.chatEs.close();NET.chatEs=null;}}
function applyPlayersEvent(path,data,patch){
 const parts=path.split("/").filter(Boolean);
 if(!parts.length){if(!patch){NET.players={};}if(data)for(const id in data)setPlayer(id,data[id],patch);return;}
 const id=parts[0];if(parts.length===1){if(data===null){delete NET.players[id];removeRemote(id);}else setPlayer(id,data,patch);return;}
 const p=NET.players[id]||(NET.players[id]={});p[parts[1]]=data;p._seen=Date.now();
}
function setPlayer(id,data,patch){if(data===null){delete NET.players[id];removeRemote(id);return;}const p=patch&&NET.players[id]?Object.assign(NET.players[id],data):Object.assign({},data);p._seen=Date.now();NET.players[id]=p;rememberFriend(id,p);}
function applyChatEvent(path,data){
 const parts=path.split("/").filter(Boolean);
 if(!parts.length){if(data)Object.keys(data).sort().forEach(k=>showChat(k,data[k]));return;}
 if(parts.length===1&&data)showChat(parts[0],data);
}
function showChat(id,m){
 if(!m||NET.chatSeen[id])return;NET.chatSeen[id]=1;
 if(m.t&&m.t<NET.joinedAt-60000)return;
 if(S.blocked&&S.blocked[m.uid])return;
 const txt=PHRASES[m.m];if(!txt)return;
 if(m.uid===NET.uid){bubble(player.g,txt);return;}
 const p=NET.players[m.uid];const r=NET.remotes[m.uid];toast((p&&p.n?p.n:"Amigo")+": "+txt);if(r)bubble(r.ch.g,txt);
}
function bubble(g,txt){if(!g)return;const old=g.getObjectByName("burbuja");if(old)g.remove(old);
 const s=labelSprite(txt,"rgba(255,255,255,.96)","#14304A");s.name="burbuja";s.position.y=4.5;s.scale.set(4.2,1.05,1);g.add(s);setTimeout(()=>{if(s.parent)s.parent.remove(s);},4500);}
async function pollRoom(){
 if(!NET.room)return;
 try{const d=await db("GET","rooms/"+NET.room+"/players");const seen=Date.now();const ids=new Set(Object.keys(d||{}));
  for(const id in d){const prev=NET.players[id];const same=prev&&prev._raw===JSON.stringify(d[id]);if(!same){setPlayer(id,d[id],false);NET.players[id]._raw=JSON.stringify(d[id]);}else prev._seen=prev._lastT===d[id].t?prev._seen:seen;NET.players[id]._lastT=d[id].t;}
  for(const id in NET.players)if(!ids.has(id)){delete NET.players[id];removeRemote(id);}
 }catch(e){}
}
async function pollChat(){if(!NET.room)return;try{const d=await db("GET","rooms/"+NET.room+"/chat",undefined,'orderBy="$key"&limitToLast=10');if(d)Object.keys(d).sort().forEach(k=>showChat(k,d[k]));}catch(e){}}
function myPetLite(){const pi=petInfo;return pi?{type:pi.type,s:+pi.scale.toFixed(2),fly:pi.fly?1:0}:null;}
async function sendMyState(full){
 if(!NET.room||!NET.ok)return;
 const pos={x:+P.x.toFixed(2),z:+P.z.toFixed(2),y:+P.y.toFixed(2),f:+P.face.toFixed(2),zone:curZone?curZone.id:"city",mv:P.speed>0.5?1:0,t:SV_TIME};
 if(full){await db("PUT","rooms/"+NET.room+"/players/"+NET.uid,Object.assign({n:S.name||"Jugador",tag:myTag(),home:myHome(),look:S.look,pet:myPetLite(),veh:S.riding&&S.vehicle&&!(curZone&&curZone.noVehicle)?S.vehicle:null,vip:S.perm.vip?1:0},pos));return;}
 await db("PATCH","rooms/"+NET.room+"/players/"+NET.uid,pos);
}
function sendEmote(id){if(!NET.room||!NET.ok)return;db("PATCH","rooms/"+NET.room+"/players/"+NET.uid,{em:id,emt:Date.now()}).catch(()=>{});}
function leaveRoom(){
 const code=NET.room;if(!code)return;NET.room=null;closeStreams();
 db("DELETE","rooms/"+code+"/players/"+NET.uid).catch(()=>{});
 for(const id in NET.remotes)removeRemote(id);NET.players={};$("chatBtn").hidden=true;toast("Salió de la sala");
}
function sendChat(i){if(!NET.room)return;db("POST","rooms/"+NET.room+"/chat",{uid:NET.uid,m:i,t:SV_TIME}).then(r=>{if(r&&r.name&&!NET.chatEs){}}).catch(e=>toast(errMsg(e)));closeSheet();if(NET.poll)setTimeout(pollChat,400);}
function openChat(){sheet("💬 Mensajes",b=>{b.appendChild(el("p","muted","Toque un mensaje para enviarlo a la sala."));const g=el("div","phr");PHRASES.forEach((p,i)=>{const x=el("button","",p);x.onclick=()=>sendChat(i);g.appendChild(x);});b.appendChild(g);},{half:true});}
function openReport(id,p){sheet("🚩 Reportar a "+(p.n||"jugador"),b=>{b.appendChild(el("p","muted","El dueño del juego revisará el reporte. Además puede bloquear a este jugador para no verlo."));
 REPORT_REASONS.forEach(r=>{const x=el("button","btn ghost",r);x.onclick=async()=>{try{await db("POST","reports",{by:NET.uid,who:id,quien:p.n||"",tag:p.tag||"",motivo:r,sala:NET.room,t:SV_TIME});S.blocked=S.blocked||{};S.blocked[id]=1;save();toast("Gracias. Reporte enviado y jugador bloqueado.");openFriends();}catch(e){toast(errMsg(e));}};b.appendChild(x);});},{half:true});}

/* ---------- avatares de las amigas ---------- */
function lookKey(p){return JSON.stringify([p.look,p.pet,p.veh,p.n,p.vip]);}
function ensureRemote(id,p){
 let r=NET.remotes[id];const k=lookKey(p);
 if(r&&r.key===k)return r;
 if(r)removeRemote(id);
 const look=Object.assign(fresh().look,p.look||{});const ch=makeChar(look);scene.add(ch.g);
 const tag=labelSprite((p.vip?"⭐ ":"")+(p.n||"Amigo"),p.vip?"rgba(181,123,0,.9)":"rgba(123,75,209,.88)","#FFFFFF");tag.position.y=3.85;tag.scale.multiplyScalar(0.72);ch.g.add(tag);addStars(ch);
 let veh=null;if(p.veh){const v=makeVehicle(p.veh,p.look&&p.look.carC);ch.g.add(v.g);veh=v;}
 let pet=null;if(p.pet&&p.pet.type){pet=makePet(p.pet.type);pet.scale.setScalar(p.pet.s||1);scene.add(pet);}
 r={ch,veh,pet,key:k,x:p.x||0,z:p.z||0,y:p.y||0.3,f:p.f||0,px:p.x||0,pz:p.z||0};NET.remotes[id]=r;return r;
}
function removeRemote(id){const r=NET.remotes[id];if(!r)return;rm(r.ch.g);if(r.pet)rm(r.pet);delete NET.remotes[id];}
function updateRemotes(dt){
 for(const id in NET.players){
  if(id===NET.uid)continue;const p=NET.players[id];
  if(!remoteAlive(p)||(S.blocked&&S.blocked[id])){if(NET.remotes[id])removeRemote(id);continue;}
  const r=ensureRemote(id,p);const vis=p.zone===(curZone&&curZone.id);r.ch.g.visible=vis;if(r.pet)r.pet.visible=vis;if(!vis)continue;
  const k=Math.min(1,dt*10);const ox=r.x,oz=r.z;r.x+=(p.x-r.x)*k;r.z+=(p.z-r.z)*k;r.y+=((p.y||0.3)-r.y)*k;
  let d=(p.f||0)-r.f;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;r.f+=d*k;
  r.ch.g.position.set(r.x,r.y,r.z);r.ch.g.rotation.y=r.f;
  const sp=Math.hypot(r.x-ox,r.z-oz)/Math.max(dt,0.001);
  if(p.emt&&p.emt!==r.emt){const first=r.emt===undefined;r.emt=p.emt;if(!first||Date.now()-p.emt<6000){if(p.em===-1)r.ch.fall=1.6;else if(p.em!=null){r.ch.dance=p.em===2?2.2:5;r.ch.danceT=p.em;}}}
  if(p.look&&p.look.trail&&p.look.trail!=="none"&&sp>1){r.trT=(r.trT||0)+dt;if(r.trT>0.09){r.trT=0;emitTrail(p.look.trail,r.x,r.y,r.z);}}
  if(r.veh){rideAnim(r.ch,r.veh,p.mv?Math.max(sp,4):0,dt);}else animChar(r.ch,p.mv?Math.max(sp,3):0,dt,(p.y||0.3)>((support(r.x,r.z,r.y+0.3).y)||0.3)+0.6);
  if(r.pet){const tx=r.x-Math.sin(r.f)*1.6,tz=r.z-Math.cos(r.f)*1.6;r.px+=(tx-r.px)*Math.min(1,dt*3);r.pz+=(tz-r.pz)*Math.min(1,dt*3);r.pet.position.set(r.px,r.y+(p.pet.fly?1.2:0),r.pz);r.pet.rotation.y=r.f;}
 }
 for(const id in NET.remotes)if(!NET.players[id])removeRemote(id);
}

/* ---------- ranking ---------- */
async function renderRanking(body){
 const box=el("div","list");box.appendChild(el("p","muted","Cargando…"));body.appendChild(box);
 if(!NET.ok){box.innerHTML="";box.appendChild(el("p","muted","Necesita internet para ver el ranking."));return;}
 try{await pushRanking();const d=await db("GET","ranking")||{};const arr=Object.keys(d).map(id=>Object.assign({id},d[id])).sort((a,b)=>(b.e||0)-(a.e||0));
  box.innerHTML="";const me=arr.findIndex(x=>x.id===NET.uid);
  arr.slice(0,20).forEach((x,i)=>box.appendChild(el("div","li"+(x.id===NET.uid?" me":""),'<div style="font-size:22px;width:34px;text-align:center">'+(["🥇","🥈","🥉"][i]||(i+1))+'</div><div class="tx"><b>'+escapeHtml(x.n||"Jugador")+'</b><small>$ '+fmt(x.e||0)+' ganados · nivel '+(x.l||1)+(x.o?" · torre "+fmtTime(x.o):"")+'</small></div>')));
  if(me>=20)box.appendChild(el("p","muted","Usted va en el lugar "+(me+1)+" de "+arr.length+"."));
  if(!arr.length)box.appendChild(el("p","muted","Todavía no hay jugadores en el ranking."));
 }catch(e){box.innerHTML="";box.appendChild(el("p","muted",errMsg(e)));}
}

/* ---------- canje de códigos en línea ---------- */
function normCode(v){return (v||"").toUpperCase().replace(/[^A-Z0-9-]/g,"");}
async function redeemOnline(v){
 const code=normCode(v).replace(/-/g,"");
 if(code.length<6){toast("Escriba el código completo");return;}
 if(!NET.ok){toast("Necesita internet para canjear códigos.");return;}
 try{
  const c=await db("GET","codes/"+code);if(!c||!(+c.a>0)){toast("❌ Ese código no existe. Revise que esté bien escrito.");return;}
  try{await db("PUT","redeemed/"+code,NET.uid);}catch(e){toast("Ese código ya fue usado.");return;}
  S.mc+=+c.a;S.used[code]=Date.now();save();hud();pushCloud(true).catch(()=>{});
  sheet("¡Código canjeado!",b=>{b.appendChild(el("div","res","🎉<br><span class='coin'></span> +"+fmt(+c.a)+" MediCoins"));const k=el("button","btn go big","¡Genial!");k.onclick=closeSheet;b.appendChild(k);},{half:true});
 }catch(e){toast(errMsg(e));}
}

/* ---------- panel de dueño en línea ---------- */
function ownerOnline(b){
 b.appendChild(el("h3","","🌐 En línea"));
 if(!NET.ok){b.appendChild(el("p","note","Sin internet: los códigos y envíos necesitan conexión."));return;}
 if(!NET.admin){
  b.appendChild(el("p","note","Esta cuenta todavía no está registrada como dueña. Mande este número a Claude para registrarla:"));
  const u=el("div","codebox",NET.uid);u.style.fontSize="15px";b.appendChild(u);
  const cp=el("button","btn ghost","Copiar mi número");cp.onclick=()=>{try{navigator.clipboard.writeText(NET.uid).then(()=>toast("Copiado"),()=>selectText(u));}catch(e){selectText(u);}};b.appendChild(cp);
  const re=el("button","btn ghost","Ya me registraron: revisar otra vez");re.onclick=async()=>{try{NET.admin=(await db("GET","admins/"+NET.uid))===true;toast(NET.admin?"✅ ¡Ahora es dueño!":"Todavía no aparece como dueño");ownerPanel();}catch(e){toast(errMsg(e));}};b.appendChild(re);
  return;}
 b.appendChild(el("p","muted","✅ Cuenta de dueño. Los códigos sirven una sola vez en total."));
 const amt=el("input");amt.type="number";amt.id="onAmt";amt.min=1;amt.max=999999;amt.value=1000;b.appendChild(amt);
 const out=el("div","codebox","—");
 const g=el("button","btn coinb big","Crear código de un solo uso");g.onclick=async()=>{const a=Math.max(1,Math.min(999999,parseInt(amt.value,10)||0));let code="";for(let i=0;i<8;i++)code+=B32[Math.floor(Math.random()*32)];
  try{await db("PUT","codes/"+code,{a,t:SV_TIME,by:NET.uid});const pretty="MC-"+code.slice(0,4)+"-"+code.slice(4);out.textContent=pretty;S.gen.unshift({code:pretty,a,t:Date.now()});S.gen=S.gen.slice(0,50);save();toast("Código creado");}catch(e){toast(errMsg(e));}};
 b.append(g,out);
 const cp=el("button","btn ghost","Copiar código");cp.onclick=()=>{const t=out.textContent;if(t==="—")return;try{navigator.clipboard.writeText(t).then(()=>toast("Copiado"),()=>selectText(out));}catch(e){selectText(out);}};b.appendChild(cp);
 b.appendChild(el("h3","","Enviar MediCoins a un jugador"));
 const tg=el("input");tg.type="text";tg.id="onTag";tg.placeholder="Usuario, por ejemplo Sofi-4821";b.appendChild(tg);
 const sb=el("button","btn go","Enviar");sb.onclick=async()=>{const a=Math.max(1,Math.min(999999,parseInt(amt.value,10)||0));const want=tg.value.trim().toLowerCase();if(!want){toast("Escriba el usuario");return;}
  sb.disabled=true;try{const all=await db("GET","perfiles")||{};const id=Object.keys(all).find(k=>(all[k].tag||"").toLowerCase()===want);if(!id){toast("No encontré ese usuario");sb.disabled=false;return;}
   await db("POST","grants/"+id,{a,de:"el dueño",t:SV_TIME});toast("🎁 Enviadas "+fmt(a)+" MediCoins a "+all[id].tag);}catch(e){toast(errMsg(e));}sb.disabled=false;};b.appendChild(sb);
 const rp=el("button","btn ghost","🚩 Ver reportes de jugadores");rp.onclick=async()=>{try{const d=await db("GET","reports")||{};sheet("🚩 Reportes",x=>{const ks=Object.keys(d).reverse();if(!ks.length)x.appendChild(el("p","muted","No hay reportes."));
  ks.slice(0,40).forEach(k=>{const r=d[k];x.appendChild(el("div","li",'<div class="tx"><b>'+escapeHtml(r.quien||"?")+' · '+escapeHtml(r.tag||"")+'</b><small>'+escapeHtml(r.motivo||"")+' · sala '+escapeHtml(r.sala||"")+(r.t?" · "+new Date(r.t).toLocaleString("es"):"")+'</small></div>'));});
  const bk=el("button","btn ghost","Volver");bk.onclick=ownerPanel;x.appendChild(bk);});}catch(e){toast(errMsg(e));}};b.appendChild(rp);
}

/* ---------- ciclo ---------- */
mode({id:"online",dbg:NET,
 afterStart(){
  $("bFriends").onclick=()=>openFriends();$("chatBtn").onclick=openChat;
  netStart();
  addEventListener("pagehide",()=>{if(NET.room&&NET.token){try{fetch(FB.db+"/rooms/"+NET.room+"/players/"+NET.uid+".json?auth="+encodeURIComponent(NET.token),{method:"DELETE",keepalive:true});}catch(e){}}});
 },
 update(dt){
  if(NET.room){
   updateRemotes(dt);
   NET.sendT+=dt;NET.beatT+=dt;
   const sig=[P.x.toFixed(1),P.z.toFixed(1),P.y.toFixed(1),P.face.toFixed(1),curZone&&curZone.id].join("|");
   if((NET.sendT>0.3&&sig!==NET.lastSent)||NET.beatT>5){NET.sendT=0;NET.beatT=0;const full=NET.lastFull!==lookKey({look:S.look,pet:myPetLite(),veh:S.riding?S.vehicle:null,n:S.name,vip:S.perm.vip});
    NET.lastSent=sig;if(full)NET.lastFull=lookKey({look:S.look,pet:myPetLite(),veh:S.riding?S.vehicle:null,n:S.name,vip:S.perm.vip});sendMyState(full).catch(()=>{});}
   if(NET.poll){NET.pollT+=dt;NET.chatT+=dt;if(NET.pollT>0.5){NET.pollT=0;pollRoom();}if(NET.chatT>1.5){NET.chatT=0;pollChat();}}
  }
  NET.syncT+=dt;NET.grantT+=dt;NET.rankT+=dt;
  if(NET.ok&&NET.syncT>20){NET.syncT=0;pushCloud(false).catch(()=>{});}
  if(NET.ok&&NET.grantT>45){NET.grantT=0;checkGrants().catch(()=>{});}
  if(NET.ok&&NET.rankT>120){NET.rankT=0;pushRanking().catch(()=>{});}
  if(!NET.ok&&NET.syncT>60){NET.syncT=0;netStart();}
 }
});
