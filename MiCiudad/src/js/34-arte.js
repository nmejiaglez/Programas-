/* ================= ARTE: FOTOS 3D, COLORES, ESTUDIO DE PINTURA ================= */
/* ---------- Fotos 3D de las cosas de la tienda ---------- */
let thR=null,thS=null,thC=null;const thCache={};
function thumbSetup(){if(thR)return true;try{const c=document.createElement("canvas");thR=new T.WebGLRenderer({canvas:c,alpha:true,antialias:true,preserveDrawingBuffer:true});thR.setSize(150,150,false);thR.setPixelRatio(1);
 thS=new T.Scene();thS.add(new T.HemisphereLight(0xffffff,0xD8C8B0,1.0));const d=new T.DirectionalLight(0xffffff,0.55);d.position.set(3,5,6);thS.add(d);thC=new T.PerspectiveCamera(30,1,0.1,100);return true;}catch(e){thR=null;return false;}}
function thumb(key,build,frame){if(thCache[key])return thCache[key];if(!thumbSetup())return null;
 const g=build();thS.add(g);const f=frame||{y:1.6,d:7.5,ty:1.6};thC.position.set(f.x||1.2,f.y,f.d);thC.lookAt(0,f.ty,0);
 try{thR.render(thS,thC);thCache[key]=thR.domElement.toDataURL("image/png");}catch(e){thCache[key]=null;}thS.remove(g);return thCache[key];}
function lookThumb(over,frame){const L=Object.assign({},S.look,over);const key="L"+JSON.stringify(L)+JSON.stringify(frame||0);return thumb(key,()=>{const c=makeChar(L);c.g.rotation.y=-0.35;c.shadow.visible=false;if(c.wings)c.g.rotation.y=2.6;return c.g;},frame);}
function vehThumb(id){return thumb("V"+id+(S.look.carC||""),()=>{const v=makeVehicle(id,S.look.carC);v.g.rotation.y=-0.8;return v.g;},{y:2.6,d:7,ty:0.6,x:2.5});}
function imgTag(src,fb){return src?'<img class="th" alt="" src="'+src+'">':fb;}
const FRAME_HEAD={y:2.9,d:3.6,ty:2.55,x:0.6},FRAME_BODY={y:1.9,d:7.2,ty:1.55,x:1.2},FRAME_LEGS={y:1.2,d:6,ty:0.9,x:1};
/* ---------- Colores propios (pintar la ropa, el pelo y el carro) ---------- */
const PAINT=["#FFFFFF","#1E2329","#E2465C","#FF4FA3","#FF9EC7","#F28C28","#F5C518","#FFE68A","#19A858","#7FD8B5","#14B8A6","#2E7BEF","#7EC4EE","#7B4BD1","#C9A7FF","#8A5A2B"];
const MAGIC=["#FFD700","#C0C0C0","#00FFC8","#FF00AA","#7DF9FF","#B4FF00","#FF6EC7","#9D00FF"];
function paintRow(body,title,key,cb){body.appendChild(el("h3","",title));const r=el("div","seg pal");
 const add=(c,magic)=>{const b=el("button",magic?"mg":"");b.innerHTML='<span class="sw" style="display:block;background:'+c+'"></span>';b.setAttribute("aria-pressed",S.look[key]===c?"true":"false");b.setAttribute("aria-label","Color "+c);
  b.onclick=()=>{if(magic&&!S.owned.magia){toast("✨ Desbloquee la Paleta mágica");return;}S.look[key]=c;sfx("pop");buildPlayer();save();cb();};r.appendChild(b);};
 const x=el("button","");x.textContent="Original";x.setAttribute("aria-pressed",S.look[key]?"false":"true");x.onclick=()=>{delete S.look[key];buildPlayer();save();cb();};r.appendChild(x);
 PAINT.forEach(c=>add(c,false));MAGIC.forEach(c=>add(c,true));body.appendChild(r);}
function closetExtra(body,tab){
 if(tab==="pelo"){body.appendChild(el("h3","","Color de ojos"));seg(body,EYES.map((c,i)=>[i,'<span class="sw" style="display:inline-block;background:'+c+'"></span>']),S.look.eyes||0,v=>{S.look.eyes=v;buildPlayer();openCloset("pelo");});}
 if(tab==="colores"){
  body.appendChild(el("p","muted","¡Pinte su ropa, su pelo y su vehículo del color que quiera! Los colores con brillo son de la Paleta mágica."));
  if(!S.owned.magia){const m=el("button","btn coinb",'✨ Paleta mágica (8 colores brillantes) · <span class="coin sm"></span> 40');m.onclick=()=>{if(!pay({p:40,cur:"mc"}))return;S.owned.magia=1;sfx("compra");toast("✨ ¡Paleta mágica desbloqueada!");save();openCloset("colores");};body.appendChild(m);}
  const re=()=>openCloset("colores");
  paintRow(body,"👕 Camisa","shirtC",re);paintRow(body,"👖 Pantalón o falda","pantsC",re);paintRow(body,"👟 Zapatos","shoeC",re);paintRow(body,"💇 Pelo","hairC",re);
  if(S.vehicle&&S.vehicle!=="skate"){paintRow(body,"🚗 Mi vehículo","carC",re);}}
 if(tab==="estelas"){body.appendChild(el("p","muted","Al caminar deja una estela mágica que sus amigas también ven."));
  itemGrid(body,TRAILS.map(t=>Object.assign({},t)),it=>it.p?"":"Gratis",it=>S.owned["tr_"+it.id]||!it.p,it=>(S.look.trail||"none")===it.id,it=>{S.owned["tr_"+it.id]=1;S.look.trail=it.id;sfx("compra");buildPlayer();openCloset("estelas");});}
 if(tab==="bailes"){openDances();}
}
/* ---------- Estudio de arte ---------- */
const ART={x:-18.5,z:1};let easelTex=null,easelMesh=null;
function buildEasel(){ROOT=ZONES.city.g;const g=grp(ART.x,0.3,ART.z);g.rotation.y=Math.PI/2;
 for(const s of [-1,1]){const l=box(0.12,3.2,0.12,"#8A5A2B",s*0.7,1.5,0,g);l.rotation.z=-s*0.12;}const bl=box(0.12,3,0.12,"#8A5A2B",0,1.4,-0.6,g);bl.rotation.x=0.3;
 box(1.8,0.1,0.25,"#8A5A2B",0,1.0,0.08,g);
 easelMesh=new T.Mesh(new T.PlaneGeometry(1.7,1.7),new T.MeshBasicMaterial({color:0xffffff}));easelMesh.position.set(0,2.0,0.12);easelMesh.rotation.x=-0.08;g.add(easelMesh);
 box(1.85,1.85,0.06,"#F5C518",0,2.0,0.06,g).rotation.x=-0.08;
 const pal=cyl(0.5,0.5,0.05,"#E8C38E",1.4,0.95,0.6,g,16);[["#E2465C",0.2],["#2E7BEF",-0.2],["#F5C518",0.0],["#19A858",0.25]].forEach(([c,o],i)=>sph(0.08,c,1.4+Math.cos(i*1.5)*0.28,1.0,0.6+Math.sin(i*1.5)*0.28,g,6,4));
 box(1,0.9,1,"#FFFFFF",1.4,0.45,0.6,g);
 const sg=signMesh("🎨 Estudio de arte","#FF4FA3",3.2,0,3.6,0,0,g);
 addCol(ART.x,ART.z,1.4,2.4);ROOT=scene;
 spot({x:ART.x+2.2,z:ART.z,r:3.2,label:"🎨 Pintar un cuadro",fn:openArt});
 refreshEasel();}
function refreshEasel(){if(!easelMesh)return;const a=S.art&&S.art[0];if(!a){easelMesh.material.map=null;easelMesh.material.needsUpdate=true;return;}const img=new Image();img.onload=()=>{const t=new T.Texture(img);t.needsUpdate=true;easelMesh.material.map=t;easelMesh.material.needsUpdate=true;};img.src=a;}
const STAMPS=["⭐","💖","🌈","🦄","🌸","🐱","🍦","☀️","🦋","🎀"];
function openArt(){sheet("🎨 Estudio de arte",b=>{
 const cv=document.createElement("canvas");cv.width=360;cv.height=360;cv.className="artcv";b.appendChild(cv);
 const x=cv.getContext("2d");x.fillStyle="#FFFFFF";x.fillRect(0,0,360,360);x.lineCap="round";x.lineJoin="round";
 let col="#E2465C",size=10,tool="pincel",stamp="⭐",last=null;
 const pos=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*360,(e.clientY-r.top)/r.height*360];};
 cv.addEventListener("pointerdown",e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);const p=pos(e);
  if(tool==="cubeta"){x.fillStyle=col;x.fillRect(0,0,360,360);return;}
  if(tool==="sello"){x.font=(size*4+20)+"px sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText(stamp,p[0],p[1]);sfx("pop");return;}
  last=p;x.beginPath();x.fillStyle=tool==="borrador"?"#FFFFFF":col;x.arc(p[0],p[1],size/2,0,Math.PI*2);x.fill();});
 cv.addEventListener("pointermove",e=>{if(!last)return;const p=pos(e);x.strokeStyle=tool==="borrador"?"#FFFFFF":tool==="arcoiris"?"hsl("+(Date.now()/4%360)+",90%,60%)":col;x.lineWidth=size;x.beginPath();x.moveTo(last[0],last[1]);x.lineTo(p[0],p[1]);x.stroke();last=p;});
 const up=()=>{last=null;};cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
 const tools=el("div","seg");[["pincel","🖌️ Pincel"],["arcoiris","🌈 Arcoíris"],["sello","⭐ Sellos"],["cubeta","🪣 Fondo"],["borrador","🧽 Borrar"]].forEach(([k,n])=>{const bt=el("button","",n);bt.setAttribute("aria-pressed",k===tool?"true":"false");bt.onclick=()=>{tool=k;tools.querySelectorAll("button").forEach(q=>q.setAttribute("aria-pressed","false"));bt.setAttribute("aria-pressed","true");st.hidden=k!=="sello";};tools.appendChild(bt);});b.appendChild(tools);
 const st=el("div","seg");st.hidden=true;STAMPS.forEach(s=>{const bt=el("button","",s);bt.style.fontSize="22px";bt.onclick=()=>{stamp=s;st.querySelectorAll("button").forEach(q=>q.setAttribute("aria-pressed","false"));bt.setAttribute("aria-pressed","true");};st.appendChild(bt);});b.appendChild(st);
 const pal=el("div","seg pal");PAINT.concat(S.owned.magia?MAGIC:[]).forEach(c=>{const bt=el("button","");bt.innerHTML='<span class="sw" style="display:block;background:'+c+'"></span>';bt.setAttribute("aria-pressed",c===col?"true":"false");bt.onclick=()=>{col=c;pal.querySelectorAll("button").forEach(q=>q.setAttribute("aria-pressed","false"));bt.setAttribute("aria-pressed","true");if(tool==="borrador")tool="pincel";};pal.appendChild(bt);});b.appendChild(pal);
 seg(b,[[5,"Fino"],[12,"Medio"],[26,"Grueso"]],size,v=>{size=v;});
 const r=el("div","row");const cl=el("button","btn ghost","🗑️ Limpiar");cl.onclick=()=>{x.fillStyle="#FFFFFF";x.fillRect(0,0,360,360);};
 const sv=el("button","btn go","💾 Guardar cuadro");sv.onclick=()=>{const sm=document.createElement("canvas");sm.width=sm.height=180;sm.getContext("2d").drawImage(cv,0,0,180,180);const data=sm.toDataURL("image/jpeg",0.72);
  S.art=[data].concat(S.art||[]).slice(0,6);S.artDay=S.artDay&&S.artDay.d===todayStr()?S.artDay:{d:todayStr(),n:0};S.artDay.n++;
  if(S.artDay.n<=3){const v=earn(120);toast("🖼️ ¡Qué bonito! Ganó $"+v);}else toast("🖼️ Cuadro guardado");
  sfx("reto");retoAdd("pintar",1);save();refreshEasel();openGallery();};r.append(cl,sv);b.appendChild(r);
 if(S.art&&S.art.length){const gb=el("button","btn ghost","🖼️ Ver mis cuadros ("+S.art.length+")");gb.onclick=openGallery;b.appendChild(gb);}
});}
function openGallery(){sheet("🖼️ Mis cuadros",b=>{if(!S.art||!S.art.length){b.appendChild(el("p","muted","Todavía no ha pintado. ¡Vaya al estudio de arte del parque!"));return;}
 b.appendChild(el("p","muted","El primero se muestra en el caballete del parque y en su casa. Se guardan los últimos 6."));
 const g=el("div","gal");S.art.forEach((a,i)=>{const c=el("div","gi");c.innerHTML='<img alt="Cuadro '+(i+1)+'" src="'+a+'">';const r=el("div","row");
  if(i){const u=el("button","btn ghost","⭐ Mostrar");u.onclick=()=>{S.art.unshift(S.art.splice(i,1)[0]);save();refreshEasel();if(typeof refreshHouseArt==="function")refreshHouseArt();openGallery();};r.appendChild(u);}
  const d=el("button","btn ghost","🗑️");d.onclick=()=>{S.art.splice(i,1);save();refreshEasel();openGallery();};r.appendChild(d);c.appendChild(r);g.appendChild(c);});b.appendChild(g);
 const n=el("button","btn go","🎨 Pintar otro");n.onclick=openArt;b.appendChild(n);});}
mode({id:"arte",init(){buildEasel();}});
