/* ---------- Bienvenida ---------- */
function welcome(){
 camYaw=Math.PI;camDist=6;camPitch=0.25;
 sheet("¡Bienvenido a Mi Ciudad!",body=>{
  body.appendChild(el("p","muted","Cree su personaje. Lo puede cambiar cuando quiera."));
  body.appendChild(el("h3","","¿Cómo se llama?"));const n=el("input");n.type="text";n.id="welName";n.maxLength=12;n.placeholder="Su nombre";n.value=S.name;body.appendChild(n);
  const sw=(label,arr,key)=>{body.appendChild(el("h3","",label));const r=el("div","seg");arr.forEach((c,i)=>{const b=el("button","");b.innerHTML='<span class="sw" style="display:block;background:'+c+'"></span>';b.setAttribute("aria-label",label+" "+(i+1));b.setAttribute("aria-pressed",S.look[key]===i?"true":"false");b.onclick=()=>{S.look[key]=i;r.querySelectorAll("button").forEach((x,k)=>x.setAttribute("aria-pressed",k===i?"true":"false"));buildPlayer();};r.appendChild(b);});body.appendChild(r);};
  sw("Piel",SKINS,"skin");sw("Pelo",HAIRS,"hair");
  body.appendChild(el("h3","","Camisa"));const r3=el("div","seg");SHIRTS.filter(s=>!s.p).forEach(s=>{const b=el("button","");b.innerHTML='<span class="sw" style="display:block;background:'+s.c+'"></span>';b.setAttribute("aria-label","Camisa "+s.name);b.setAttribute("aria-pressed",S.look.shirt===s.id?"true":"false");b.onclick=()=>{S.look.shirt=s.id;r3.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b?"true":"false"));buildPlayer();};r3.appendChild(b);});body.appendChild(r3);
  body.appendChild(el("h3","","Peinado"));const pr=seg(body,STYLES_H.map(s=>[s.id,s.name]),S.look.hstyle,id=>{S.look.hstyle=id;pr.querySelectorAll("button").forEach((x,k)=>x.setAttribute("aria-pressed",STYLES_H[k].id===id?"true":"false"));buildPlayer();});
  const go=el("button","btn go big","¡A jugar!");go.onclick=()=>{const v=n.value.trim().slice(0,12);if(!v){toast("Escriba su nombre");n.focus();return;}S.name=v;S.created=true;buildPlayer();closeSheet();camDist=13;camPitch=0.55;tutorial();};body.appendChild(go);
 },{clear:true,half:true,noClose:true});
}
function tutorial(){toast("👋 ¡Hola, "+S.name+"!");setTimeout(()=>toast(isTouch?"Mueva el dedo a la izquierda para caminar":"Use W A S D o las flechas para caminar"),1600);setTimeout(()=>toast("Toque 📍 Lugares o vaya al 🚌 bus del parque para viajar a las islas"),3600);}

