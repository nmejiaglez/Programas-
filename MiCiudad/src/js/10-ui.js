/* ================= INTERFAZ ================= */
function hud(){$("money").textContent="$ "+fmt(S.money);$("mc").textContent=fmt(S.mc);}
function toast(t){const el=document.createElement("div");el.className="toast";el.textContent=t;$("toasts").appendChild(el);setTimeout(()=>el.remove(),2300);while($("toasts").children.length>3)$("toasts").firstChild.remove();}
function pop(t){toast(t);}
let sheetClose=null;
function sheet(title,build,opts){closeSheet();opts=opts||{};uiOpen=true;joy.id=null;$("joy").hidden=true;
 const w=document.createElement("div");w.className="sheetwrap"+(opts.clear?" clear":"");
 w.innerHTML='<div class="sheet'+(opts.half?" half":"")+'" role="dialog" aria-label="'+title+'"><div class="sh-h"><h2></h2>'+(opts.noClose?"":'<button class="x" aria-label="Cerrar">✕</button>')+'</div><div class="sh-b"></div></div>';
 w.querySelector("h2").textContent=title;
 const body=w.querySelector(".sh-b");
 if(!opts.noClose){w.querySelector(".x").onclick=closeSheet;w.addEventListener("click",e=>{if(e.target===w)closeSheet();});}
 $("sheets").appendChild(w);sheetClose=opts.onClose||null;build(body,w);return body;}
function closeSheet(){const s=$("sheets");if(s.firstChild){s.innerHTML="";uiOpen=false;const f=sheetClose;sheetClose=null;if(f)f();hud();save();}}
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}
function seg(parent,tabs,cur,on){const s=el("div","seg");tabs.forEach(([id,label])=>{const b=el("button","",label);b.setAttribute("aria-pressed",id===cur?"true":"false");b.onclick=()=>on(id);s.appendChild(b);});parent.appendChild(s);return s;}

/* ---------- Tienda ---------- */
const SHOP_TABS=[];
function shopTab(id,label,render,order){SHOP_TABS.push({id,label,render,order:order||50});SHOP_TABS.sort((x,y)=>x.order-y.order);}
function openShop(tab){tab=tab||"paquetes";
 sheet("Tienda",body=>{
  seg(body,SHOP_TABS.map(t=>[t.id,t.label]),tab,t=>openShop(t));
  (SHOP_TABS.find(t=>t.id===tab)||SHOP_TABS[0]).render(body);
 });
}
shopTab("paquetes","MediCoins",body=>{
 if(!S.starter){const st=el("div","pack");st.style.borderColor="var(--danger)";st.innerHTML='<span class="tag">Solo una vez</span><div style="font-size:30px">🎁</div><b style="font-family:var(--display);font-size:20px">Paquete de bienvenida</b><small class="muted">600 MediCoins + Alas de mariposa + Huevo dorado</small>';
  const b=el("button","btn red","US$ 2.99");b.onclick=()=>buyPack({id:"starter",mc:600,price:"US$ 2.99",starter:true});st.appendChild(b);body.appendChild(st);}
 body.appendChild(el("p","muted","Las MediCoins sirven para mascotas, espadas, alas, vehículos, ropa especial y poderes."));
 const g=el("div","packs");PACKS.forEach(p=>{const c=el("div","pack",(p.tag?'<span class="tag">'+p.tag+'</span>':"")+'<div style="font-size:30px;line-height:1">'+p.ic+'</div><div class="amt"><span class="coin"></span> '+p.mc.toLocaleString("es")+'</div>');const b=el("button","btn coinb",p.price);b.onclick=()=>buyPack(p);c.appendChild(b);g.appendChild(c);});body.appendChild(g);
 body.appendChild(el("p","note","Versión de prueba: al tocar un paquete se acreditan gratis para que pruebe. En la versión de la tienda aquí se abre el pago de Google Play."));
 body.appendChild(el("h3","","¿Tiene un código?"));
 const inp=el("input");inp.type="text";inp.id="codeIn";inp.placeholder="MC-XXXX-XXXX";inp.autocomplete="off";inp.setAttribute("autocapitalize","characters");body.appendChild(inp);
 const rb=el("button","btn go","Canjear código");rb.onclick=()=>redeemOnline(inp.value);body.appendChild(rb);
},1);
function seeded(seed){let x=seed>>>0||1;return()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};}
function offerPool(){const pool=[];
 for(const [slot,list] of Object.entries(SLOT_LISTS))list.forEach(it=>{if(it.cur==="mc"&&it.p>0)pool.push({kind:"look",slot,it});});
 VEHICLES.forEach(it=>{if(it.cur==="mc")pool.push({kind:"veh",it});});
 if(typeof SWORDS!=="undefined")SWORDS.forEach(it=>{if(it.cur==="mc")pool.push({kind:"sword",it});});
 return pool;}
function ownedOffer(o){if(o.kind==="sword")return !!S.adv.swords[o.it.id];return !!S.owned[o.it.id];}
function todaysOffers(){const r=seeded(h32("ofertas"+todayStr()));const pool=offerPool();const out=[];let guard=0;while(out.length<4&&guard++<200){const o=pool[Math.floor(r()*pool.length)];if(!out.includes(o))out.push(o);}return out;}
function grantOffer(o){const id=o.it.id;
 if(o.kind==="look"){S.owned[id]=1;S.look[o.slot]=id;}
 if(o.kind==="veh"){S.owned[id]=1;S.vehicle=id;S.riding=true;}
 if(o.kind==="sword"){S.adv.swords[id]=1;S.adv.sword=id;}
 buildPlayer();}
shopTab("ofertas","Ofertas del día",body=>{
 body.appendChild(el("p","muted","Cada día cambian. Hoy con 30 % de descuento."));
 const g=el("div","grid");todaysOffers().forEach(o=>{const price=Math.max(5,Math.round(o.it.p*0.7));const own=ownedOffer(o);
  const c=el("div","card",'<span class="pill" style="background:var(--danger);color:#fff;border-radius:999px;font-size:11px;font-weight:800;padding:1px 8px">-30 %</span><div class="big">'+o.it.icon+'</div><b>'+o.it.name+'</b><small><s>'+o.it.p+'</s> → '+price+' MediCoins</small>');
  const b=el("button","btn coinb",own?"✓ Ya es suyo":'<span class="coin sm"></span> '+price);b.disabled=own;
  b.onclick=()=>{if(!pay({p:price,cur:"mc"}))return;grantOffer(o);toast("🎉 ¡"+o.it.name+"!");openShop("ofertas");};c.appendChild(b);g.appendChild(c);});
 body.appendChild(g);
},2);
shopTab("vip","VIP ⭐",body=>{
 body.appendChild(el("div","res","⭐ Pase VIP"));
 body.appendChild(el("div","list",[["💵","+50 % de dinero en todo"],["🎁","Regalo diario doble"],["🏷️","Nombre dorado con estrella"],["🥚","Huevo VIP con mascotas exclusivas"]].map(r=>'<div class="li"><div style="font-size:26px">'+r[0]+'</div><div class="tx"><b>'+r[1]+'</b></div></div>').join("")));
 const b=el("button","btn coinb big",S.perm.vip?"✓ Ya es VIP":'Ser VIP · <span class="coin sm"></span> 500');b.disabled=!!S.perm.vip;
 b.onclick=()=>{if(!pay({p:500,cur:"mc"}))return;S.perm.vip=1;buildPlayer();toast("⭐ ¡Ahora es VIP!");openShop("vip");};body.appendChild(b);
},3);
shopTab("vehiculos","Vehículos",body=>itemGrid(body,VEHICLES.map(v=>Object.assign({},v,{icon:imgTag(vehThumb(v.id),v.icon)})),it=>"Velocidad x"+it.speed,it=>S.owned[it.id],it=>S.vehicle===it.id,it=>{S.vehicle=it.id;S.riding=true;buildPlayer();openShop("vehiculos");}),20);
shopTab("poderes","Poderes",body=>{const l=el("div","list");POWERS.forEach(it=>{const own=it.perm&&S.perm[it.id];const r=el("div","li",'<div style="font-size:28px">'+it.icon+'</div><div class="tx"><b>'+it.name+'</b><small>'+(it.id==="turbo"&&turboOn()?"Activo: quedan "+Math.ceil((S.turboUntil-Date.now())/60000)+" min":it.desc)+'</small></div>');
 const b=el("button","btn coinb",own?"✓ Activo":'<span class="coin sm"></span> '+it.p);b.style.width="auto";b.style.padding="8px 12px";b.disabled=!!own;
 b.onclick=()=>{if(!pay({p:it.p,cur:"mc"}))return;if(it.perm)S.perm[it.id]=1;else S.turboUntil=Math.max(Date.now(),S.turboUntil)+15*60000;toast(it.icon+" "+it.name);openShop("poderes");};r.appendChild(b);l.appendChild(r);});body.appendChild(l);},40);
function itemGrid(body,items,sub,owned,inUse,use,toggle){
 const g=el("div","grid");items.forEach(it=>{const own=owned(it),on=inUse(it);const c=el("div","card"+(on?" on":""),'<div class="big">'+it.icon+'</div><b>'+it.name+'</b><small>'+sub(it)+'</small>');
  const b=el("button","btn"+(own?(on&&!toggle?" ghost":" go"):(it.cur==="mc"?" coinb":"")),own?(on?(toggle?"Guardar":"En uso"):"Usar"):priceHTML(it));
  if(own&&on&&!toggle)b.disabled=true;
  b.onclick=()=>{if(!own){if(it.tryOver&&typeof tryOn==="function"&&tryOn(it.tryOver,it,()=>{S.owned[it.id]=1;toast("🎉 ¡"+it.name+" es suyo!");use(it);save();}))return;if(!pay(it))return;S.owned[it.id]=1;if(typeof confetti==="function")confetti();sfx("compra");toast("🎉 ¡"+it.name+" es suyo!");}use(it);save();};
  if(it.tag&&!own)c.appendChild(el("span","ptag pt"+it.tag.toLowerCase(),it.tag));
  c.appendChild(b);g.appendChild(c);});body.appendChild(g);}
function creditPack(p){S.mc+=p.mc;toast("💳 +"+p.mc+" MediCoins");if(p.starter){S.starter=true;S.owned.alas_mariposa=1;S.look.acc="alas_mariposa";if(typeof hatchEgg==="function")hatchEgg("dorado",true);buildPlayer();}save();hud();}
function buyPack(p){
 if(window.CiudadBilling&&typeof window.CiudadBilling.buy==="function"){window.CiudadBilling.buy(p.id,()=>{creditPack(p);hud();save();});return;}
 sheet("Comprar MediCoins",b=>{b.appendChild(el("div","res",'<span class="coin"></span> '+p.mc.toLocaleString("es")+" MediCoins"));b.appendChild(el("p","muted","Modo de prueba: en Play Store aquí aparece el pago de Google por "+p.price+". Ahora se le acreditan gratis."));
  const r=el("div","row");const c=el("button","btn ghost","Cancelar");c.onclick=()=>openShop("paquetes");const o=el("button","btn coinb","Acreditar");o.onclick=()=>{creditPack(p);if(!p.starter)openShop("paquetes");};r.append(c,o);b.appendChild(r);},{half:true});}

/* ---------- Códigos ---------- */
const B32="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function h32(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h>>>0;}
function enc(n,len){let s="";for(let i=0;i<len;i++){s+=B32[n%32];n=Math.floor(n/32);}return s;}
function makeCode(amount){const r=enc(Math.floor(Math.random()*1048576),4);return "MC-"+amount+"-"+r+"-"+enc(h32(SALT+amount+r),4);}
function checkCode(c){const m=/^MC-(\d{1,6})-([A-Z2-9]{4})-([A-Z2-9]{4})$/.exec((c||"").toUpperCase().replace(/\s/g,""));if(!m)return 0;if(enc(h32(SALT+m[1]+m[2]),4)!==m[3])return 0;return +m[1];}
function redeem(v){redeemOnline(v);}

/* ---------- Ropa ---------- */
function swatch(c){return '<span class="sw" style="display:inline-block;width:40px;height:40px;background:'+c+'"></span>';}
function wearGrid(body,list,key,tab){const fr=key==="hat"||key==="face"?FRAME_HEAD:key==="pants"?FRAME_LEGS:FRAME_BODY;itemGrid(body,list.filter(x=>!x.hide||S.owned[x.id]).map(x=>Object.assign({},x,{slot:key,tryOver:{[key]:x.id,[key+"C"]:undefined},tryTab:tab,tryKey:key,icon:x.id==="none"?(x.icon||"🚫"):imgTag(lookThumb({[key]:x.id,[key+"C"]:undefined},fr),x.icon||swatch(x.c))})),it=>it.p?"":"Gratis",it=>S.owned[it.id]||!it.p,it=>S.look[key]===it.id,it=>{S.look[key]=it.id;buildPlayer();openCloset(tab);});}
function openCloset(tab){tab=tab||"pelo";
 sheet("Mi personaje",body=>{
  seg(body,[["pelo","Piel y pelo"],["cara","😊 Cara"],["camisas","Camisas"],["pantalones","Pantalones y faldas"],["sombreros","Sombreros"],["accesorios","Accesorios"],["colores","🎨 Colores"],["estelas","✨ Estelas"],["bailes","💃 Bailes"],["rol","Mi rol"]],tab,t=>openCloset(t));
  if(typeof closetExtra==="function")closetExtra(body,tab);
  if(tab==="pelo"){
   body.appendChild(el("h3","","Color de piel"));const r1=el("div","seg");SKINS.forEach((c,i)=>{const b=el("button","");b.innerHTML='<span class="sw" style="display:block;background:'+c+'"></span>';b.setAttribute("aria-pressed",S.look.skin===i?"true":"false");b.setAttribute("aria-label","Piel "+(i+1));b.onclick=()=>{S.look.skin=i;buildPlayer();openCloset("pelo");};r1.appendChild(b);});body.appendChild(r1);
   body.appendChild(el("h3","","Color de pelo"));const r2=el("div","seg");HAIRS.forEach((c,i)=>{const b=el("button","");b.innerHTML='<span class="sw" style="display:block;background:'+c+'"></span>';b.setAttribute("aria-pressed",S.look.hair===i?"true":"false");b.setAttribute("aria-label","Pelo "+(i+1));b.onclick=()=>{S.look.hair=i;buildPlayer();openCloset("pelo");};r2.appendChild(b);});body.appendChild(r2);
   body.appendChild(el("h3","","Peinado"));seg(body,STYLES_H.map(s=>[s.id,s.name]),S.look.hstyle,id=>{S.look.hstyle=id;buildPlayer();openCloset("pelo");});
  }
  if(tab==="camisas")wearGrid(body,SHIRTS,"shirt",tab);
  if(tab==="pantalones")wearGrid(body,PANTS,"pants",tab);
  if(tab==="sombreros")wearGrid(body,HATS,"hat",tab);
  if(tab==="accesorios"){body.appendChild(el("h3","","En la espalda"));body.appendChild(el("p","muted","Con alas o mochila cohete cae despacio. Mantenga presionado Saltar para planear."));wearGrid(body,ACCS,"acc",tab);body.appendChild(el("h3","","En la cara"));wearGrid(body,FACES,"face",tab);body.appendChild(el("h3","","En el cuello"));wearGrid(body,NECKS,"neck",tab);}
  if(tab==="rol"){body.appendChild(el("p","muted","Elija qué quiere ser en la ciudad. Su rol gana 50 % más en sus trabajos y le regala su uniforme. Puede cambiarlo cuando quiera."));
   const l=el("div","list");ROLES.forEach(r=>{const on=S.role===r.id;const row=el("div","li",'<div style="font-size:28px">'+r.icon+'</div><div class="tx"><b>'+r.name+'</b><small>'+r.desc+'</small></div>');
    const b=el("button","btn"+(on?" ghost":" go"),on?"✓ Mi rol":"Elegir");b.style.width="auto";b.style.padding="8px 14px";b.disabled=on;
    b.onclick=()=>{S.role=r.id;for(const k in r.gift){S.owned[r.gift[k]]=1;S.look[k]=r.gift[k];}buildPlayer();toast(r.icon+" Ahora es "+r.name);openCloset("rol");};row.appendChild(b);l.appendChild(row);});body.appendChild(l);}
 },{clear:true,half:true});
}

/* ---------- Lugares y ajustes ---------- */
const PLACES=[];
function goCity(x,z,name){navTarget={x,z,name};closeSheet();if(curZone.id!=="city"){const sp=ZONES.city.spawn;teleport(sp.x,sp.z,null,Math.PI,()=>toast("Siga la flecha amarilla ➜"));}else toast("Siga la flecha amarilla ➜");}
function openPlaces(){sheet("¿A dónde quiere ir?",body=>{
 body.appendChild(el("h3","","🚌 Viajar en bus"));
 const z=el("div","list");Object.values(ZONES).filter(Z=>Z.id!=="city"&&!Z.hidden).forEach(Z=>{const r=el("div","li",'<div style="font-size:28px">'+Z.icon+'</div><div class="tx"><b>'+Z.name+'</b><small>'+(Z.desc||"")+'</small></div>');const go=el("button","btn go",curZone===Z?"Aquí está":"Viajar");go.style.width="auto";go.style.padding="8px 14px";go.disabled=curZone===Z;go.onclick=()=>travelTo(Z.id);r.appendChild(go);z.appendChild(r);});
 if(curZone.id!=="city"){const r=el("div","li",'<div style="font-size:28px">🏙️</div><div class="tx"><b>Volver a la ciudad</b><small>Parque central</small></div>');const go=el("button","btn go","Viajar");go.style.width="auto";go.style.padding="8px 14px";go.onclick=()=>travelTo("city");r.appendChild(go);z.prepend(r);}
 body.appendChild(z);
 body.appendChild(el("h3","","🏙️ En la ciudad"));
 const l=el("div","list");
 const add=(icon,name,desc,x,zz)=>{const dist=curZone.id==="city"?" · a "+Math.round(Math.hypot(x-P.x,zz-P.z))+" pasos":"";const r=el("div","li",'<div style="font-size:28px">'+icon+'</div><div class="tx"><b>'+name+'</b><small>'+desc+dist+'</small></div>');const go=el("button","btn go","Ir");go.style.width="auto";go.style.padding="8px 16px";go.onclick=()=>goCity(x,zz,name);r.appendChild(go);l.appendChild(r);};
 BUILDINGS.forEach(b=>{const d=doors.find(x=>x.b===b);add(b.icon,b.name,b.job,d.x,d.z);});
 PLACES.forEach(p=>add(p.icon,p.name,p.desc,p.x,p.z));
 add("⛲","Parque central","Punto de encuentro",0,8);
 body.appendChild(l);});}
let ownerTaps=0;
function openSettings(){sheet("Ajustes",body=>{
 body.appendChild(el("h3","","Su nombre"));const n=el("input");n.type="text";n.id="nameIn";n.maxLength=12;n.value=S.name;body.appendChild(n);
 const nr=el("div","row");const sv=el("button","btn go","Guardar nombre");sv.onclick=()=>{const v=n.value.trim().slice(0,12);const pr=nombreProblema(v);if(pr){toast(pr);return;}S.name=v;buildPlayer();save();if(NET.ok)pushCloud(true).catch(()=>{});toast("Nombre guardado");};
 const rnd_=el("button","btn ghost","🎲 Nombre al azar");rnd_.onclick=()=>{n.value=nombreAuto();};nr.append(rnd_,sv);body.appendChild(nr);
 const acc=el("div","row");const ab=el("button","btn ghost","👤 Mi cuenta");ab.onclick=openAccount;const pb=el("button","btn ghost","👨‍👩‍👧 Control de padres");pb.onclick=openParents;acc.append(ab,pb);body.appendChild(acc);
 body.appendChild(el("h3","","Calidad de imagen"));seg(body,[["normal","Normal"],["baja","Rápida (teléfonos básicos)"]],S.quality,q=>{S.quality=q;setQuality();resize();openSettings();});
 body.appendChild(el("h3","","Estadísticas"));
 body.appendChild(el("div","list",[["💵","Dinero ganado",$fmt(S.stats.earned)],["🧰","Trabajos completados",S.stats.jobs],["🪙","Monedas recogidas",S.stats.coins],["🔥","Incendios apagados",S.stats.fires],["🚓","Ladrones atrapados",S.stats.thieves],["🕵️","Misterios resueltos",S.stats.mysteries],["👾","Monstruos derrotados",S.stats.monsters],["🌋","Desastres sobrevividos",S.stats.survived],["🧗","Torres completadas",S.stats.obby],["🐟","Peces pescados",S.stats.fish],["🌽","Cosechas",S.stats.harvest],["👗","Pasarelas",S.stats.catwalks]].map(r=>'<div class="li"><div style="font-size:24px">'+r[0]+'</div><div class="tx"><b>'+r[2]+'</b><small>'+r[1]+'</small></div></div>').join("")));
 const rs=el("button","btn ghost","Reiniciar partida");rs.onclick=()=>requireParent(()=>sheet("¿Reiniciar?",b=>{b.appendChild(el("p","","Se borra todo el progreso, el dinero y las MediCoins de este dispositivo."));const r=el("div","row");const c=el("button","btn ghost","Cancelar");c.onclick=openSettings;const o=el("button","btn red","Reiniciar");o.onclick=()=>{const keep={pin:S.pin,gen:S.gen,parent:S.parent};S=fresh();S.pin=keep.pin;S.gen=keep.gen;S.parent=keep.parent;save();location.reload();};r.append(c,o);b.appendChild(r);},{half:true}),"reiniciar la partida");body.appendChild(rs);
 const ver=el("p","muted","Mi Ciudad · versión 3.0");ver.style.textAlign="center";ver.onclick=()=>{if(!(typeof NET!=="undefined"&&NET.admin))return;ownerTaps++;if(ownerTaps>=5){ownerTaps=0;ownerLogin();}};body.appendChild(ver);
});}
function $fmt(n){return "$ "+fmt(n);}

/* ---------- Panel de dueño ---------- */
function ownerLogin(){if(!(typeof NET!=="undefined"&&NET.admin&&NET.ok))return;sheet("Panel de dueño",b=>{
 const first=!S.pin;b.appendChild(el("p","muted",first?"Cree una clave de 4 a 8 números. Solo usted debe saberla.":"Escriba su clave de dueño."));
 const i=el("input");i.type="password";i.id="pinIn";i.inputMode="numeric";i.maxLength=8;b.appendChild(i);
 const ok=el("button","btn go",first?"Crear clave":"Entrar");ok.onclick=()=>{const v=i.value.trim();if(first){if(!/^\d{4,8}$/.test(v)){toast("Use de 4 a 8 números");return;}S.pin=v;save();ownerPanel();}else if(v===S.pin)ownerPanel();else toast("Clave incorrecta");};b.appendChild(ok);},{half:true});}
function ownerPanel(amt){if(!(typeof NET!=="undefined"&&NET.admin&&NET.ok)){closeSheet();return;}amt=amt||10000;sheet("👑 Panel de dueño",b=>{
 b.appendChild(el("h3","","Mis MediCoins (este teléfono)"));
 const ci=el("input");ci.type="number";ci.id="amtIn";ci.min=1;ci.max=999999;ci.value=amt;b.appendChild(ci);
 const me=el("button","btn go","Darme estas MediCoins a mí");me.onclick=()=>{if(!NET.admin)return;const a=Math.max(1,Math.min(999999,parseInt(ci.value,10)||0));S.mc+=a;hud();save();if(NET.ok)pushCloud(true).catch(()=>{});toast("+"+fmt(a)+" MediCoins para usted");};b.appendChild(me);
 ownerOnline(b);
 if(S.gen.length){b.appendChild(el("h3","","Últimos códigos creados"));const l=el("div","list");S.gen.slice(0,15).forEach(g=>{const d=new Date(g.t);l.appendChild(el("div","li",'<div class="tx"><b class="mono">'+g.code+'</b><small>'+fmt(g.a)+' MediCoins · '+d.toLocaleDateString("es")+' '+d.toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})+'</small></div>'));});b.appendChild(l);}
});}
function selectText(n){const r=document.createRange();r.selectNodeContents(n);const s=getSelection();s.removeAllRanges();s.addRange(r);toast("Mantenga presionado para copiar");}

