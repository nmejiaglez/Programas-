/* ================= CONTROL DE PADRES Y NOMBRES SEGUROS ================= */
const MALAS=["puta","puto","mierda","verga","pija","cerote","culero","culo","pendejo","pendeja","idiota","estupido","estupida","tonto","tonta","cabron","chinga","joder","coño","cono","maricon","marica","perra","zorra","hdp","pene","vagina","sexo","sexy","porno","nazi","matar","muerte","droga","caca","pedo","baboso","jodido","malparido","hijueputa","gay","fuck","shit","bitch","ass","dick"];
const NOM_A=["Panda","Tigre","Delfín","Estrella","Cohete","Nube","Dragón","Gatito","Pingüino","Rayo","Luna","Sol","Volcán","Colibrí","Jaguar","Mango","Pitahaya","Coco"];
const NOM_B=["Veloz","Feliz","Valiente","Brillante","Genial","Mágico","Saltarín","Dorado","Azul","Alegre","Rápido","Súper"];
function nombreAuto(){return pick(NOM_A)+" "+pick(NOM_B);}
function nombreProblema(n){
 const t=(n||"").trim();if(!t)return "Escriba un nombre";
 if(t.length<2)return "El nombre es muy corto";
 if(/\d{3,}/.test(t))return "No use números largos (puede ser un teléfono)";
 if(/@|https?:|www\.|\.com|\.net/i.test(t))return "No escriba correos ni páginas";
 const plano=t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-zñ]/g,"").replace(/0/g,"o").replace(/1/g,"i").replace(/3/g,"e").replace(/4/g,"a");
 for(const m of MALAS){const mm=m.normalize("NFD").replace(/[̀-ͯ]/g,"");if(mm.length<=3?plano===mm||new RegExp("(^|[^a-z])"+mm+"([^a-z]|$)").test(t.toLowerCase()):plano.indexOf(mm)>=0)return "Ese nombre no está permitido. Elija otro.";}
 return null;
}
function parentCfg(){if(!S.parent)S.parent={pin:"",limit:0,spent:{},time:0,rooms:true};if(S.parent.rooms==null)S.parent.rooms=true;if(!S.parent.spent)S.parent.spent={};return S.parent;}
function monthKey(){const d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1);}
function priceUSD(p){const m=/([\d.]+)/.exec(String(p||""));return m?parseFloat(m[1]):0;}
function requireParent(fn,que){const c=parentCfg();if(!c.pin){fn();return;}
 sheet("👨‍👩‍👧 Permiso de papá o mamá",b=>{b.appendChild(el("p","","Para "+(que||"continuar")+" escriba la clave de padres."));const i=el("input");i.type="password";i.id="parPin";i.inputMode="numeric";i.maxLength=8;b.appendChild(i);
  const r=el("div","row");const no=el("button","btn ghost","Cancelar");no.onclick=closeSheet;const ok=el("button","btn go","Aceptar");ok.onclick=()=>{if(i.value===c.pin){closeSheet();fn();}else toast("Clave incorrecta");};r.append(no,ok);b.appendChild(r);setTimeout(()=>i.focus(),50);},{half:true});}
function openParents(){requireParent(parentsPanel,"abrir el control de padres");}
function parentsPanel(){sheet("👨‍👩‍👧 Control de padres",b=>{
 const c=parentCfg();
 b.appendChild(el("p","muted","Mi Ciudad es un juego para niños: no tiene chat libre, solo frases preparadas, y las salas son privadas con código. Aquí los papás pueden poner reglas."));
 b.appendChild(el("h3","","Clave de padres"));b.appendChild(el("p","muted",c.pin?"La clave protege las compras, la cuenta y estas opciones.":"Sin clave: cualquiera puede comprar o cambiar estas opciones."));
 const pi=el("input");pi.type="password";pi.id="parNew";pi.inputMode="numeric";pi.maxLength=8;pi.placeholder="Nueva clave de 4 a 8 números";b.appendChild(pi);
 const r=el("div","row");const sv=el("button","btn go",c.pin?"Cambiar clave":"Poner clave");sv.onclick=()=>{if(!/^\d{4,8}$/.test(pi.value)){toast("Use de 4 a 8 números");return;}c.pin=pi.value;save();toast("🔒 Clave de padres guardada");parentsPanel();};r.appendChild(sv);
 if(c.pin){const q=el("button","btn ghost","Quitar clave");q.onclick=()=>{c.pin="";save();toast("Clave quitada");parentsPanel();};r.appendChild(q);}b.appendChild(r);
 b.appendChild(el("h3","","Límite de compras por mes"));const gasto=c.spent[monthKey()]||0;b.appendChild(el("p","muted","Este mes: US$ "+gasto.toFixed(2)+" en MediCoins."));
 seg(b,[[0,"Sin límite"],[5,"US$ 5"],[10,"US$ 10"],[20,"US$ 20"]],c.limit,v=>{c.limit=v;save();parentsPanel();});
 b.appendChild(el("h3","","Recordatorio para descansar"));seg(b,[[0,"Apagado"],[30,"30 min"],[60,"1 hora"],[90,"1 h 30"]],c.time,v=>{c.time=v;playSec=0;save();parentsPanel();});
 b.appendChild(el("h3","","Jugar con amigos en línea"));seg(b,[[true,"Permitido"],[false,"No permitido"]],c.rooms,v=>{c.rooms=v;if(!v&&NET.room)leaveRoom();save();parentsPanel();});
 b.appendChild(el("h3","","Que lo puedan encontrar por su nombre"));b.appendChild(el("p","muted","Si lo apaga, solo pueden invitarlo quienes ya jugaron juntos o tienen su código."));seg(b,[[true,"Sí"],[false,"No"]],c.find!==false,v=>{c.find=v;save();if(NET.ok)db("PATCH","perfiles/"+NET.uid,{hide:findHidden()?1:0}).catch(()=>{});parentsPanel();});
});}
// límite de gasto y permiso en las compras de MediCoins
const _buyPack=buyPack;
buyPack=function(p){const c=parentCfg();const precio=priceUSD(p.price);const mes=monthKey();
 if(c.limit&&((c.spent[mes]||0)+precio)>c.limit){sheet("Límite de compras",b=>{b.appendChild(el("p","","Este mes ya se llegó al límite de compras que pusieron los papás (US$ "+c.limit+")."));},{half:true});return;}
 requireParent(()=>_buyPack(p),"comprar MediCoins");};
const _creditPack=creditPack;
creditPack=function(p){const c=parentCfg();const mes=monthKey();c.spent[mes]=(c.spent[mes]||0)+priceUSD(p.price);_creditPack(p);};
// recordatorio de tiempo
let playSec=0,restShown=false;
mode({id:"padres",update(dt){const c=S.parent;if(!c||!c.time||document.hidden)return;playSec+=dt;
 if(playSec>=c.time*60&&!uiOpen){playSec=0;sheet("⏰ ¡Hora de descansar!",b=>{b.appendChild(el("div","res","🧃<br>Lleva "+c.time+" minutos jugando."));b.appendChild(el("p","","Tome agua, estírese y descanse la vista un ratito."));const k=el("button","btn go big","Entendido");k.onclick=closeSheet;b.appendChild(k);},{half:true});}}});
