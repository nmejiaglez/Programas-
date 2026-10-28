/* ---------- Visor con zoom, ventana y rótulos ---------- */
let vi=0,S=1,X=0,Y=0,inv=false,rot=false,hide=false;
function key(i){return 'pins:'+(i.mine?i.id:i.src);}
function abrir(i){vi=i;const it=GAL[i];if(!it)return;$('#vw').classList.add('open');rot=false;$('#vlab').classList.remove('on');
 const img=$('#vimg');img.onload=fit;img.src=it.src;
 $('#vsave').style.display=it.mine?'none':'';
 $('#vfoot').innerHTML=it.mine?`<b>${esc(it.t)}</b> · imagen propia · <a href="#" id="vdel">Eliminar de Mi atlas</a>`:
  `<b>${esc(it.t)}</b>${it.desc?' — '+esc(it.desc):''}<br>Autor: ${esc(it.aut||'ver página')} · Licencia: ${esc(it.lic)} · <a href="${esc(it.page)}" target="_blank" rel="noopener">Ver en Wikimedia Commons</a>`;
 if(it.mine)$('#vdel').onclick=async e=>{e.preventDefault();if(confirm('¿Eliminar esta imagen de Mi atlas?')){await dbDel(it.id);cerrar();abrirCorte(cur,'mis');}};
 pins();}
function cerrar(){$('#vw').classList.remove('open');$('#vlist').classList.remove('on');}
function fit(){const st=$('#vst'),im=$('#vimg');S=Math.min(st.clientWidth/im.naturalWidth,st.clientHeight/im.naturalHeight);X=(st.clientWidth-im.naturalWidth*S)/2;Y=(st.clientHeight-im.naturalHeight*S)/2;tr();pins();}
function tr(){$('#vin').style.transform=`translate(${X}px,${Y}px) scale(${S})`;$('#vimg').style.filter=`brightness(${$('#vb').value}%) contrast(${$('#vc').value}%)${inv?' invert(1)':''}`;
 document.querySelectorAll('.pin').forEach(p=>p.style.transform=`translate(-50%,-50%) scale(${1/S})`);}
function zoom(f,cx,cy){const st=$('#vst').getBoundingClientRect();cx=cx??st.width/2;cy=cy??st.height/2;X=cx-(cx-X)*f;Y=cy-(cy-Y)*f;S*=f;tr();}
function pins(){const it=GAL[vi];const ps=LS.get(key(it),[]);const im=$('#vimg');
 document.querySelectorAll('.pin').forEach(p=>p.remove());
 if(!hide)ps.forEach((p,k)=>{const d=document.createElement('div');d.className='pin';d.style.left=p.x*im.naturalWidth+'px';d.style.top=p.y*im.naturalHeight+'px';d.innerHTML=`<i>${k+1}</i><span>${esc(p.n)}</span>`;$('#vin').appendChild(d);});
 $('#vlist').innerHTML='<b>Rótulos</b>'+(ps.length?ps.map((p,k)=>`<div><span>${k+1}. ${esc(p.n)}</span><button data-dp="${k}">✕</button></div>`).join(''):'<p>Sin rótulos. Use 📍 Rotular y toque la imagen.</p>');
 tr();}
let drag=null,moved=false;
$('#vst').addEventListener('pointerdown',e=>{if(e.target.closest('#vlist'))return;drag={x:e.clientX,y:e.clientY,X,Y};moved=false;$('#vst').setPointerCapture(e.pointerId);});
$('#vst').addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;if(moved){X=drag.X+dx;Y=drag.Y+dy;tr();}});
$('#vst').addEventListener('pointerup',e=>{const was=drag;drag=null;if(!was||moved||!rot||e.target.closest('#vlist'))return;
 const r=$('#vst').getBoundingClientRect(),im=$('#vimg');const x=(e.clientX-r.left-X)/S/im.naturalWidth,y=(e.clientY-r.top-Y)/S/im.naturalHeight;if(x<0||y<0||x>1||y>1)return;
 const n=prompt('Nombre de la estructura anatómica:\n('+(GAL[vi].est||[]).slice(0,14).join(', ')+')');if(!n)return;
 const it=GAL[vi],ps=LS.get(key(it),[]);ps.push({x,y,n});LS.set(key(it),ps);pins();});
$('#vst').addEventListener('wheel',e=>{e.preventDefault();const r=$('#vst').getBoundingClientRect();zoom(e.deltaY<0?1.15:1/1.15,e.clientX-r.left,e.clientY-r.top);},{passive:false});
$('#vlist').addEventListener('click',e=>{const b=e.target.closest('[data-dp]');if(!b)return;const it=GAL[vi],ps=LS.get(key(it),[]);ps.splice(+b.dataset.dp,1);LS.set(key(it),ps);pins();});
$('#vx').onclick=cerrar;$('#vzi').onclick=()=>zoom(1.25);$('#vzo').onclick=()=>zoom(.8);$('#vfit').onclick=fit;
$('#vprev').onclick=()=>abrir((vi-1+GAL.length)%GAL.length);$('#vnext').onclick=()=>abrir((vi+1)%GAL.length);
$('#vb').oninput=tr;$('#vc').oninput=tr;$('#vinv').onclick=e=>{inv=!inv;e.target.classList.toggle('on',inv);tr();};
$('#vlab').onclick=e=>{rot=!rot;e.target.classList.toggle('on',rot);$('#vst').style.cursor=rot?'crosshair':'grab';};
$('#vls').onclick=e=>{$('#vlist').classList.toggle('on');e.target.classList.toggle('on');};
$('#vhide').onclick=e=>{hide=!hide;e.target.classList.toggle('on',hide);pins();};
$('#vsave').onclick=async()=>{const it=GAL[vi];try{const b=await (await fetch(it.src)).blob();const d=await new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(b);});
 const id='w'+Date.now();await dbPut({id,reg:it.reg,t:it.t,data:d,web:1,page:it.page,lic:it.lic,aut:it.aut});LS.set('pins:'+id,LS.get(key(it),[]));alert('Guardada en Mi atlas (disponible sin internet).');}catch(e){alert('No se pudo guardar: '+e.message);}};
document.addEventListener('keydown',e=>{if(!$('#vw').classList.contains('open'))return;if(e.key=='Escape')cerrar();if(e.key=='ArrowRight')$('#vnext').click();if(e.key=='ArrowLeft')$('#vprev').click();});

