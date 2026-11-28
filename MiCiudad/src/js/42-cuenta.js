/* ================= CUENTAS CON USUARIO Y CONTRASEÑA + PANTALLA DE INICIO ================= */
const USER_DOMAIN="@jugadores-miciudad.com";
function userEmail(u){u=String(u||"").trim();return u.indexOf("@")>=0?u:u.toLowerCase()+USER_DOMAIN;}
function userName(email){email=String(email||"");return email.endsWith(USER_DOMAIN)?email.slice(0,-USER_DOMAIN.length):email;}
function realPass(u,p){return String(u).indexOf("@")>=0?p:"mc·"+p+"·ciudad";}
function userProblem(u){u=String(u||"").trim();if(u.length<3)return "El usuario debe tener al menos 3 letras";if(u.length>16)return "El usuario puede tener hasta 16 letras";
 if(!/^[A-Za-z][A-Za-z0-9_.]*$/.test(u))return "Use solo letras y números, y empiece con una letra (sin espacios ni acentos)";if(/\d{5,}/.test(u))return "Use máximo 4 números seguidos (no ponga su teléfono)";const letras=u.replace(/[\d_.]/g,"");if(letras.length>=2){const pr=nombreProblema(letras);if(pr&&pr.indexOf("no está permitido")>=0)return pr;}return null;}
function authError(e){const m=String(e&&e.message||e);
 if(m.indexOf("EMAIL_EXISTS")>=0)return "Ese usuario ya existe. Elija otro, o toque «Iniciar sesión» si es suyo.";
 if(m.indexOf("WEAK_PASSWORD")>=0)return "La contraseña debe tener al menos 4 letras o números.";
 if(/INVALID_LOGIN_CREDENTIALS|EMAIL_NOT_FOUND|INVALID_PASSWORD|INVALID_EMAIL/.test(m))return "Usuario o contraseña incorrectos.";
 if(m.indexOf("TOO_MANY_ATTEMPTS")>=0)return "Demasiados intentos. Espere unos minutos.";
 if(/Failed to fetch|NetworkError|network/i.test(m))return "Sin internet. Revise la conexión e intente otra vez.";
 return typeof errMsg==="function"?errMsg(e):m;}
async function ensureNet(){if(NET.ok&&NET.uid)return true;try{await netStart();}catch(e){}return NET.ok;}
async function crearCuenta(u,p1,p2){
 const pr=userProblem(u);if(pr)throw new Error(pr);if(String(p1).length<4)throw new Error("La contraseña debe tener al menos 4 letras o números.");if(p1!==p2)throw new Error("Las dos contraseñas no son iguales.");
 if(!await ensureNet())throw new Error("Sin internet. Revise la conexión e intente otra vez.");
 if(NET.email)throw new Error("Ya tiene una cuenta abierta. Cierre sesión primero.");
 const j=await idt("accounts:signUp",{idToken:await tok(),email:userEmail(u),password:realPass(u,p1),returnSecureToken:true});
 setAuth(j.localId,j.idToken,j.refreshToken,j.expiresIn,j.email);S.user=u.trim();save();await pushCloud(true).catch(()=>{});return true;}
async function iniciarSesion(u,p){
 if(!String(u).trim()||!p)throw new Error("Escriba su usuario y su contraseña.");
 if(!await ensureNet())throw new Error("Sin internet. Revise la conexión e intente otra vez.");
 let j;try{j=await idt("accounts:signInWithPassword",{email:userEmail(u),password:realPass(u,p),returnSecureToken:true});}catch(e){if(String(u).indexOf("@")<0&&String(p).length>=6)j=await idt("accounts:signInWithPassword",{email:userEmail(u),password:p,returnSecureToken:true});else throw e;}
 setAuth(j.localId,j.idToken,j.refreshToken,j.expiresIn,j.email);
 try{NET.admin=(await db("GET","admins/"+NET.uid))===true;}catch(e){NET.admin=false;}
 const had=await pullCloud(true);if(!had){S.user=String(u).trim();await pushCloud(true).catch(()=>{});}
 if(typeof ownerUI==="function")ownerUI();buildPlayer();hud();return true;}
function cuentaForm(b,modo,done){
 const crear=modo==="crear";
 b.appendChild(el("div","acchead",crear?'<div class="ai">🎮</div><b>Crea tu cuenta de Mi Ciudad</b><small>No necesitas correo. Solo un usuario y una contraseña.</small>':'<div class="ai">🔑</div><b>Inicia sesión</b><small>Escribe tu usuario y tu contraseña.</small>'));
 const u=el("input");u.type="text";u.id=crear?"cuUser":"inUser";u.placeholder=crear?"Nombre de usuario (ej.: Sofi_Estrella)":"Usuario";u.maxLength=40;u.setAttribute("autocapitalize","off");u.setAttribute("autocomplete","username");u.setAttribute("spellcheck","false");b.appendChild(u);
 if(crear)b.appendChild(el("p","muted","🔒 No uses tu nombre completo ni tu teléfono. Este nombre es para entrar al juego."));
 const p1=el("input");p1.type="password";p1.id=crear?"cuPass":"inPass";p1.placeholder="Contraseña (4 o más letras o números)";p1.setAttribute("autocomplete",crear?"new-password":"current-password");b.appendChild(p1);
 let p2=null;if(crear){p2=el("input");p2.type="password";p2.id="cuPass2";p2.placeholder="Repite la contraseña";p2.setAttribute("autocomplete","new-password");b.appendChild(p2);
  b.appendChild(el("p","note","✍️ Anota tu usuario y contraseña en un lugar seguro, o pídele a papá o mamá que los guarde. El teléfono la recordará: no tendrás que escribirla otra vez, a menos que cierres sesión."));}
 const er=el("p","accerr","");b.appendChild(er);
 const go=el("button","btn go big",crear?"✨ Crear mi cuenta":"Iniciar sesión");go.id=crear?"cuGo":"inGo";
 go.onclick=async()=>{er.textContent="";go.disabled=true;go.textContent=crear?"Creando…":"Entrando…";
  try{if(crear)await crearCuenta(u.value,p1.value,p2.value);else await iniciarSesion(u.value,p1.value);sfx("reto");closeSheet();toast(crear?"🎉 ¡Cuenta creada! Bienvenido, "+u.value.trim():"👋 ¡Hola de nuevo, "+(S.name||u.value.trim())+"!");done&&done();}
  catch(e){er.textContent=authError(e);go.disabled=false;go.textContent=crear?"✨ Crear mi cuenta":"Iniciar sesión";}};
 b.appendChild(go);
 if(!crear){const f=el("button","btn ghost","¿Olvidaste tu contraseña?");f.onclick=async()=>{const v=u.value.trim();
  if(v.indexOf("@")>=0){try{await idt("accounts:sendOobCode",{requestType:"PASSWORD_RESET",email:v});toast("📧 Le enviamos un correo para cambiarla");}catch(e){er.textContent=authError(e);}return;}
  sheet("¿Olvidaste tu contraseña?",c=>{c.appendChild(el("p","","Pídele a tu papá o mamá que escriba por WhatsApp al soporte de Mi Ciudad con tu usuario. Te ayudaremos a recuperar tus cosas."));
   const w=el("button","btn go","💬 Escribir a soporte");w.onclick=()=>{try{window.open("https://wa.me/"+VENTAS_WA+"?text="+encodeURIComponent("Hola 👋 Olvidé la contraseña de Mi Ciudad. Mi usuario es: "+v),"_blank");}catch(e){}};c.appendChild(w);},{half:true});};b.appendChild(f);}
 const sw=el("button","btn ghost",crear?"Ya tengo cuenta: iniciar sesión":"No tengo cuenta: crear una");sw.onclick=()=>openCuenta(crear?"entrar":"crear",done);b.appendChild(sw);
 setTimeout(()=>{try{u.focus();}catch(e){}},80);}
function openCuenta(modo,done){sheet(modo==="crear"?"Crear cuenta":"Iniciar sesión",b=>cuentaForm(b,modo,done));}
/* ---------- pantalla de inicio estilo «mundos» ---------- */
function homeCollage(){const imgs=PORTADAS.concat(PORTADAS).concat(PORTADAS);return '<div class="hcol" aria-hidden="true"><div class="hgrid">'+imgs.map((p,i)=>'<div class="hcard" style="--r:'+((i%3)-1)*4+'deg"><img src="'+p.img+'" alt=""><span>'+p.i+" "+p.t+'</span></div>').join("")+'</div></div>';}
function showHome(go){titleOn=true;const t=document.createElement("div");t.id="title";t.className="home";
 const cols=["#FF4FA3","#F5C518","#2E7BEF","#19A858","#7B4BD1","#F28C28","#14B8A6","#E2465C","#FF4FA3"];
 const word=(w,o)=>w.split("").map((c,i)=>'<span style="color:'+cols[(i+o)%cols.length]+';animation-delay:'+((i+o)*0.12)+'s">'+c+'</span>').join("");
 const logo='<div class="logo"><div class="w">'+word("Mi",0)+'</div><div class="w">'+word("Ciudad",2)+'</div></div>';
 const logged=!!NET.email;
 const hideHud=()=>{$("hud").hidden=true;$("jump").hidden=true;$("emoBtn").hidden=true;$("joyhint").hidden=true;const oc=$("objChip");if(oc)oc.hidden=true;};
 const close=fn=>{sfx("pop");titleOn=false;t.remove();$("hud").hidden=false;$("jump").hidden=false;$("emoBtn").hidden=false;if(isTouch)$("joyhint").hidden=false;snapCamera();if(typeof objChip==="function")objChip();go();if(fn)setTimeout(fn,350);};
 if(!logged){
  t.innerHTML=homeCollage()+'<div class="hshade"></div>'+logo+'<div class="hsub">Juega, crea y comparte con tus amigos</div><div class="menu acc"><button class="hb hwhite" id="hCrear">Crear cuenta</button><button class="hb hline" id="hEntrar">Iniciar sesión</button><button class="hlink" id="hSin" hidden>Jugar sin internet</button></div>';
  document.body.appendChild(t);hideHud();
  const after=()=>{t.remove();showHome(go);};
  t.querySelector("#hCrear").onclick=()=>openCuenta("crear",after);
  t.querySelector("#hEntrar").onclick=()=>openCuenta("entrar",after);
  const sin=t.querySelector("#hSin");setTimeout(()=>{if(!NET.ok&&sin.isConnected)sin.hidden=false;},6000);sin.onclick=()=>close();
  return;}
 const user=userName(NET.email);
 t.innerHTML=homeCollage()+'<div class="hshade dark"></div><div class="htop">'+logo.replace('class="logo"','class="logo sm"')+'<div class="hhola">👋 ¡Hola, <b>'+escapeHtml(S.name||user)+'</b>!<small>@'+escapeHtml(user)+'</small></div></div>'+
  '<div class="hrow"><h3>🎮 Mundos para jugar</h3><div class="hscroll">'+PORTADAS.map(p=>'<button class="hgame" data-g="'+p.id+'"><img src="'+p.img+'" alt=""><b>'+p.i+" "+p.t+'</b></button>').join("")+'</div></div>'+
  '<div class="menu"><button class="tbig tplay">▶ Jugar</button><div class="row"><button class="tbig tfr">👫 Amigos</button><button class="tbig tav">🎨 Mi personaje</button></div><div class="ver">Juego seguro para niñas y niños</div></div>';
 document.body.appendChild(t);hideHud();
 const ZG={ciudad:"city",bosque:"bosque",obby:"obby",sobrevivir:"sobrevivir",aventura:"aventura",parque:"parque",moda:"moda",rural:"rural"};
 t.querySelectorAll(".hgame").forEach(b=>b.onclick=()=>{const g=b.dataset.g;close(()=>{if(!S.created)return;if(g==="helados")enter(BUILDINGS.find(x=>x.id==="helados"));else if(ZG[g])travelTo(ZG[g]);});});
 t.querySelector(".tplay").onclick=()=>close();t.querySelector(".tfr").onclick=()=>close(()=>{if(S.created)openFriends();});t.querySelector(".tav").onclick=()=>close(()=>{if(S.created)openCloset();});
}
