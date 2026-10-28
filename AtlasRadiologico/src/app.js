/* ===================== APLICACIÓN ===================== */
const CORTES=[...CORTES_US,...CORTES_AX,...CORTES_RM,...CORTES_RX];
const MODS={US:'Ecografía',TC:'Tomografía',RM:'Resonancia',RX:'Radiografía',MG:'Mamografía'};
const enMod=(p,m)=>m=='US'?p.g=='US':m=='TC'?p.g=='AX':m=='RM'?(p.g=='AX'||p.g=='RMS'):m=='RX'?p.g=='RX':p.g=='MG';
const seqsDe=(p,m)=>m=='US'?['US']:m=='TC'?p.tc:m=='RM'?p.rm:m=='RX'?['RX']:['MG'];
const grupoSenal=(p,m)=>m=='US'?'US':p.g=='AX'?'AX':p.g=='RMS'?'RMS':m;
const refDe=(p,m)=>m=='TC'?p.refTC:m=='RM'?(p.refRM||p.ref):p.ref;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const strip=h=>{const d=document.createElement('div');d.innerHTML=h||'';return d.textContent.trim();};
const LS={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const movil=()=>innerWidth<760;

let mod=LS.get('atlas-mod','US'),cur=null,tab='atlas',seq=null,modo=null,sel=null,quiz=null,GAL=[];

function navMods(){$('#mods').innerHTML=Object.entries(MODS).map(([k,v])=>`<button class="${k==mod?'on':''}" data-m="${k}">${v} <span style="opacity:.6;font-weight:normal">${CORTES.filter(p=>enMod(p,k)).length}</span></button>`).join('')+`<button data-mi="1">⭐ Mi atlas</button>`;}
function lista(){const q=$('#q').value.trim().toLowerCase();
 const it=CORTES.filter(p=>enMod(p,mod)&&(!q||(p.n+' '+p.est+' '+p.s.map(s=>s[0]).join(' ')).toLowerCase().includes(q)));
 const g={};it.forEach(p=>(g[p.est]=g[p.est]||[]).push(p));
 $('#side').innerHTML=`<a data-home="1">🏠 Inicio · ${MODS[mod]}</a><div class="ord">Orden: cefálico → caudal</div>`+(it.length?Object.entries(g).map(([r,xs])=>`<h3>${r}</h3>`+xs.map(p=>`<a data-id="${p.id}" class="${cur==p.id?'on':''}">${esc(p.n)}</a>`).join('')).join(''):'<p style="padding:14px;color:var(--mu)">Sin resultados.</p>');
 return it;}

function home(){cur=null;quiz=null;const it=lista();const q=$('#q').value.trim().toLowerCase();
 let res='';
 if(q.length>=3){const hits=[];CORTES.forEach(p=>{if(!enMod(p,mod))return;p.s.forEach((s,i)=>{if(s[1]!='dash'&&!(s[4]||{}).nl&&s[0].toLowerCase().includes(q))hits.push({p,i,s});});});
  if(hits.length)res=`<h3 style="color:var(--az);margin:8px 0">Estructuras encontradas (${hits.length})</h3><div class="res">${hits.slice(0,40).map(h=>`<div data-id="${h.p.id}" data-sel="${h.i}"><b>${esc(h.s[0])}</b> — <span style="color:var(--mu)">${esc(h.p.n)}</span></div>`).join('')}</div>`;}
 const nE=it.reduce((a,p)=>a+rotulables(p).length,0);
 $('#main').innerHTML=`<div class="ttl"><span class="tag t-${mod}" style="margin:0">${mod}</span><h2>${MODS[mod]}</h2></div>
 <p class="sub">${it.length} cortes · ${nE} estructuras rotuladas en español, ordenadas de cefálico a caudal.</p>
 <div class="note">Cada corte es una <b>imagen anatómica reconstruida con la apariencia de la modalidad</b> (speckle y sombra acústica en ecografía; ventanas en UH en TC; contraste T1/T2/FLAIR en RM; proyección en radiografía y mamografía). Las estructuras están <b>señaladas en la imagen</b>; al tocarlas se muestra su descripción anatómica y su <b>ecogenicidad, densidad o señal</b>. En TC y RM puede cambiar la ventana o la secuencia. La pestaña <b>Casos reales</b> busca imágenes de pacientes reales (Wikimedia Commons) y <b>Mis imágenes</b> guarda sus propias capturas rotulables.</div>
 ${res}<div class="home">${it.map(p=>`<div class="tile" data-id="${p.id}"><b>${esc(p.n)}</b><p>${esc(p.est)} · ${rotulables(p).length} estructuras${p.g=='AX'?' · TC y RM':''}</p></div>`).join('')}</div>`;}

function abrirCorte(id,t,s){const p=CORTES.find(x=>x.id==id);if(!p)return home();
 if(!enMod(p,mod)){mod=p.g=='US'?'US':p.g=='RMS'?'RM':p.g=='AX'?mod=='RM'?'RM':'TC':p.g;navMods();}
 if(cur!=id){seq=null;sel=null;quiz=null;}cur=id;tab=t||'atlas';if(s!=null)sel=+s;
 const seqs=seqsDe(p,mod);if(!seq||!seqs.includes(seq))seq=seqs[0];
 if(!modo)modo=movil()?'numeros':'nombres';
 lista();const ref=refDe(p,mod),f=ref&&A.find(x=>x.id==ref);
 $('#main').innerHTML=`<div class="ttl"><span class="tag t-${mod}" style="margin:0">${MODS[mod]}</span><h2>${esc(p.n)}</h2></div><p class="sub">${esc(p.est)} · ${esc(p.cab||'')}</p>
 <div class="tabs"><button data-tab="atlas" class="${tab=='atlas'?'on':''}">🩻 Anatomía rotulada</button>${f?`<button data-tab="ref" class="${tab=='ref'?'on':''}">📋 Técnica, valores y patología</button>`:''}<button data-tab="img" class="${tab=='img'?'on':''}">🖼 Casos reales</button><button data-tab="mis" class="${tab=='mis'?'on':''}">⭐ Mis imágenes</button></div>
 <div id="cont"></div>`;
 if(tab=='ref'&&f)return fichaRef(f);
 if(tab=='img')return reales(p);
 if(tab=='mis')return misCorte(p);
 vistaAtlas(p);}

function vistaAtlas(p){const seqs=seqsDe(p,mod);
 $('#cont').innerHTML=`<div class="bar">
  ${seqs.length>1?`<span class="lb">${mod=='TC'?'Ventana':'Secuencia'}</span><div class="grp">${seqs.map(s=>`<button data-seq="${s}" class="${s==seq?'on':''}">${SEQ[s].n.replace(/^(TC|RM) ?·? ?/,'')}</button>`).join('')}</div>`:''}
  <span class="lb">Rótulos</span><div class="grp">${['nombres','numeros','ocultos'].map(m=>`<button data-modo="${m}" class="${m==modo&&!quiz?'on':''}">${{nombres:'Nombres',numeros:'Números',ocultos:'Ocultos'}[m]}</button>`).join('')}</div>
  <div class="grp"><button data-quiz="1" class="${quiz?'on':''}">🎯 Modo estudio</button></div>
 </div>
 <div class="atlas"><div><div id="qz"></div><div class="lz"><canvas id="cv"></canvas></div><p class="sub" style="margin-top:6px">${esc((p.ori||[]).join(' · '))} · Toque cualquier estructura de la imagen o de la lista.</p></div>
 <div class="panel"><div class="info" id="info"></div><div class="lista" id="lst"><input id="flt" placeholder="Filtrar estructuras…"></div></div></div>`;
 pintarLista(p);dibujar(p);mostrarInfo(p);
 const cv=$('#cv');cv.onclick=e=>clicLienzo(p,e);
 $('#flt').oninput=()=>pintarLista(p);}
function dibujar(p){const cv=$('#cv');if(!cv)return;const m=quiz?(quiz.ver?'numeros':'ocultos'):modo;
 const t0=performance.now();vistaAtlas.geo=dibujarCorte(cv,p,seq,m,quiz?quiz.marca:sel,{dash:!!quiz});}
function pintarLista(p){const L=rotulables(p),f=($('#flt')?.value||'').toLowerCase();
 const box=$('#lst');box.querySelectorAll('div').forEach(d=>d.remove());
 box.insertAdjacentHTML('beforeend',L.map((i,k)=>({i,k})).filter(o=>!f||p.s[o.i][0].toLowerCase().includes(f)).map(o=>`<div data-s="${o.i}" class="${o.i==sel?'on':''}"><b>${o.k+1}</b><span>${quiz&&!quiz.ver?'• • •':esc(p.s[o.i][0])}</span></div>`).join(''));}
function mostrarInfo(p){const box=$('#info');if(!box)return;
 if(quiz){const ob=p.s[quiz.obj];box.innerHTML=`<div class="quizbox">Toque en la imagen:<br><b>${esc(ob[0])}</b><br>${quiz.msg||''}<br><span style="font-size:12px">Aciertos ${quiz.ok} / ${quiz.n}</span></div><button class="more" style="margin:0" id="qsig">Siguiente ›</button> <button class="more" style="margin:0" id="qver">Ver respuesta</button>`;
  $('#qsig').onclick=()=>{nuevaPregunta(p);};$('#qver').onclick=()=>{quiz.marca=quiz.obj;quiz.msg='Respuesta resaltada en dorado.';dibujar(p);mostrarInfo(p);};return;}
 if(sel==null){box.innerHTML=`<h4>${rotulables(p).length} estructuras</h4><p>Seleccione una estructura para ver su ubicación, relaciones y su ${mod=='US'?'ecogenicidad':mod=='TC'?'densidad (UH)':mod=='RM'?'señal en T1/T2':'densidad radiográfica'}.</p>`;return;}
 const s=p.s[sel],L=rotulables(p),n=L.indexOf(sel)+1;
 const sig=s[1]!='-'?senal(s[1],grupoSenal(p,mod)):'';
 box.innerHTML=`<h4>${n}. ${esc(s[0])}</h4>${s[3]?`<p>${esc(s[3])}</p>`:''}${sig?`<p class="sg"><b>${s[1]=='-'?'':'Tejido: '+esc(NOMBRE_T[s[1]]||s[1])+'. '}</b>${esc(sig)}</p>`:'<p class="sg">Región o reparo anatómico (señalado con punto).</p>'}`;}
function seleccionar(p,i){sel=i;dibujar(p);mostrarInfo(p);pintarLista(p);
 const el=$(`#lst div[data-s="${i}"]`);if(el)el.scrollIntoView({block:'nearest'});}
function clicLienzo(p,e){const cv=$('#cv'),r=cv.getBoundingClientRect(),k=cv.width/r.width;
 const px=(e.clientX-r.left)*k,py=(e.clientY-r.top)*k,G=vistaAtlas.geo;
 if(!quiz&&modo=='nombres'&&dibujarCorte.boxes){const b=dibujarCorte.boxes.find(o=>o.box&&px>=o.box[0]-4&&px<=o.box[0]+o.box[2]+4&&py>=o.box[1]&&py<=o.box[1]+o.box[3]);if(b)return seleccionar(p,b.i);}
 const u=[(px-G.M)/G.S,py/G.S];if(u[0]<0||u[0]>100)return;
 let i=null;
 if(modo=='numeros'||(quiz&&quiz.ver)){const L=rotulables(p);let best=null,bd=14;L.forEach(j=>{const g=geo(p.s[j][2]),a=anc(p.s[j],g);const d=Math.hypot(px-(G.M+a[0]*G.S),py-a[1]*G.S);if(d<bd){bd=d;best=j;}});i=best;}
 if(i==null)i=hit(p,u);
 if(quiz){quiz.n++;const ok=i==quiz.obj;if(ok)quiz.ok++;quiz.msg=ok?'<span class="ok">✔ Correcto</span>':`<span class="no">✘ Tocó: ${esc(i!=null?p.s[i][0]:'zona sin rótulo')}</span>`;quiz.marca=quiz.obj;dibujar(p);mostrarInfo(p);setTimeout(()=>{if(quiz&&cur==p.id)nuevaPregunta(p);},ok?900:2200);return;}
 if(i!=null)seleccionar(p,i);}
function nuevaPregunta(p){const L=rotulables(p).filter(i=>p.s[i][1]!='-'||true);quiz.obj=L[Math.floor(Math.random()*L.length)];quiz.marca=null;quiz.msg='';dibujar(p);mostrarInfo(p);pintarLista(p);}

function fichaRef(a){$('#cont').innerHTML=`
 <section class="card"><h4>Técnica</h4><div class="bd">${a.tec}</div></section>
 <section class="card"><h4>Anatomía / semiología normal</h4><div class="bd"><ul>${a.anat.map(x=>`<li>${x}</li>`).join('')}</ul></div></section>
 <section class="card"><h4>Valores de referencia</h4><div class="bd" style="padding:0"><table><tr><th>Parámetro</th><th>Valor</th></tr>${a.val.map(v=>`<tr><td>${v[0]}</td><td><b>${v[1]}</b></td></tr>`).join('')}</table></div></section>
 <section class="card"><h4>Patología frecuente — signos clave</h4><div class="bd"><ul class="pat">${a.pat.map(p=>`<li><b>${p[0]}.</b> ${p[1]}</li>`).join('')}</ul></div></section>
 <section class="card"><h4>Clasificaciones</h4><div class="bd">${a.cls}</div></section>`;}

/* ---- Casos reales (Wikimedia Commons) ---- */
function reales(p){const c=$('#cont');const q=(mod=='TC'?'CT ':mod=='RM'?'MRI ':mod=='US'?'ultrasound ':'')+(p.q||p.n);
 c.innerHTML=`<div class="note">Imágenes de pacientes reales con licencia libre (Wikimedia Commons), cargadas en vivo; requiere internet. Las que tienen rótulos aparecen primero. Ábralas para ampliar, ajustar brillo/contraste y colocar sus propios rótulos.</div>
 <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px"><input id="q2" value="${esc(q.trim())}" style="flex:1;min-width:200px;padding:7px;border:1px solid var(--bd);border-radius:6px;background:var(--pn);color:var(--tx)"><button class="more" style="margin:0" id="bq2">Buscar</button></div>
 <div class="gal" id="gal"><p>Cargando imágenes…</p></div><div id="pg"></div>`;
 $('#bq2').onclick=()=>cargar(p,$('#q2').value,0,true);$('#q2').onkeydown=e=>{if(e.key=='Enter')$('#bq2').click();};
 cargar(p,q,0,true);}
async function cargar(p,q,off,reset){const g=$('#gal');if(reset){GAL=[];g.innerHTML='<p>Cargando imágenes…</p>';}
 try{let items=[],next;
  if(off==0){const [x,y]=await Promise.all([commons(q+' labeled'),commons(q)]);const seen=new Set();items=[...x.items,...y.items].filter(i=>!seen.has(i.src)&&seen.add(i.src));next=y.next;}
  else{const y=await commons(q,off);items=y.items;next=y.next;}
  items.sort((a,b)=>LAB.test(b.t+b.desc)-LAB.test(a.t+a.desc));
  if(cur!=p.id||tab!='img')return;
  const ini=GAL.length,est=rotulables(p).map(i=>p.s[i][0]);GAL.push(...items.map(i=>({...i,reg:p.id,est})));
  if(reset)g.innerHTML='';
  if(!GAL.length)g.innerHTML='<p>Sin resultados. Pruebe otros términos en inglés (ej. "sonography", "axial", "T2").</p>';
  g.insertAdjacentHTML('beforeend',items.map((i,k)=>`<div class="im" data-g="${ini+k}"><img loading="lazy" src="${esc(i.th)}" alt="${esc(i.t)}" onerror="this.closest('.im').remove()">${LAB.test(i.t+i.desc)?'<span class="mk">ROTULADA</span>':''}<div class="c">${esc(i.t)}</div></div>`).join(''));
  $('#pg').innerHTML=next?`<button class="more" id="bmas">Cargar más</button>`:'';if(next)$('#bmas').onclick=()=>cargar(p,q,next,false);
 }catch(e){g.innerHTML=`<div class="note">No se pudo conectar con Wikimedia Commons. Verifique la conexión a internet. La anatomía rotulada funciona sin conexión.</div>`;}}

/* ---- Mis imágenes ---- */
async function misCorte(p){const c=$('#cont');let all=[];try{all=(await dbAll()).filter(x=>x.reg==p.id);}catch(e){}
 c.innerHTML=`<div class="note">Agregue capturas propias (ecógrafo, PACS, celular) de <b>${esc(p.n)}</b>. Se guardan solo en este equipo; puede rotularlas con los nombres de este corte.</div>
 <label class="more" style="display:inline-block">➕ Agregar imágenes<input type="file" id="fup" accept="image/*" multiple hidden></label><div class="gal" id="gal"></div>`;
 const est=rotulables(p).map(i=>p.s[i][0]);
 GAL=all.map(x=>({...x,src:x.data,th:x.data,est,mine:1}));
 $('#gal').innerHTML=GAL.length?GAL.map((i,k)=>`<div class="im" data-g="${k}"><img src="${i.data}" alt=""><span class="mk">${i.web?'GUARDADA':'PROPIA'}</span><div class="c">${esc(i.t)}</div></div>`).join(''):'<p style="color:var(--mu)">Aún no hay imágenes en este corte.</p>';
 $('#fup').onchange=async e=>{for(const f of e.target.files){const d=await new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(f);});
  await dbPut({id:'p'+Date.now()+Math.random(),reg:p.id,t:f.name.replace(/\.[^.]+$/,''),data:d});}abrirCorte(p.id,'mis');};}
async function miAtlas(){cur=null;lista();let all=[];try{all=await dbAll();}catch(e){}
 $('#main').innerHTML=`<div class="ttl"><h2>⭐ Mi atlas</h2></div><p class="sub">${all.length} imágenes propias o guardadas. Para agregar, abra un corte y use “Mis imágenes”.</p>
 ${CORTES.filter(p=>all.some(x=>x.reg==p.id)).map(p=>`<h3 style="color:var(--az)">${esc(p.n)}</h3><div class="gal">${all.filter(x=>x.reg==p.id).map(x=>`<div class="im" data-goreg="${p.id}"><img src="${x.data}" alt=""><div class="c">${esc(x.t)}</div></div>`).join('')}</div>`).join('')||'<p>Todavía vacío.</p>'}`;}

/* ---- eventos ---- */
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-m],[data-id],[data-home],[data-mi],[data-tab],[data-g],[data-goreg],[data-seq],[data-modo],[data-quiz],[data-s]');if(!t)return;
 const p=CORTES.find(x=>x.id==cur);
 if(t.dataset.s!==undefined&&p){if(quiz)return;seleccionar(p,+t.dataset.s);}
 else if(t.dataset.seq){seq=t.dataset.seq;vistaAtlas(p);}
 else if(t.dataset.modo){modo=t.dataset.modo;quiz=null;LS.set('atlas-modo',modo);vistaAtlas(p);}
 else if(t.dataset.quiz){if(quiz){quiz=null;vistaAtlas(p);}else{const L=rotulables(p);quiz={ok:0,n:0,obj:L[Math.floor(Math.random()*L.length)]};sel=null;vistaAtlas(p);}}
 else if(t.dataset.g!==undefined)abrir(+t.dataset.g);
 else if(t.dataset.goreg)abrirCorte(t.dataset.goreg,'mis');
 else if(t.dataset.tab)abrirCorte(cur,t.dataset.tab);
 else if(t.dataset.mi)miAtlas();
 else if(t.dataset.m){mod=t.dataset.m;LS.set('atlas-mod',mod);navMods();home();}
 else if(t.dataset.id){abrirCorte(t.dataset.id,'atlas',t.dataset.sel);$('#side').classList.remove('open');}
 else if(t.dataset.home){home();$('#side').classList.remove('open');}
});
$('#q').oninput=()=>{lista();if(!cur)home();};
$('#q').onkeydown=e=>{if(e.key=='Enter'){cur=null;home();}};
$('#menu').onclick=()=>$('#side').classList.toggle('open');
$('#tema').onclick=()=>{const r=document.documentElement,d=r.dataset.theme=='dark'||(!r.dataset.theme&&matchMedia('(prefers-color-scheme: dark)').matches);r.dataset.theme=d?'light':'dark';LS.set('atlas-tema',r.dataset.theme);const p=CORTES.find(x=>x.id==cur);if(p&&tab=='atlas')dibujar(p);};
{const t=LS.get('atlas-tema',null);if(t)document.documentElement.dataset.theme=t;modo=LS.get('atlas-modo',null);}
window.addEventListener('resize',()=>{if($('#vw').classList.contains('open'))fit();});
if(!MODS[mod])mod='US';
navMods();home();
