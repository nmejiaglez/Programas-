/* ===================== ATLAS RADIOLÓGICO — VISOR DE PILAS REALES ===================== */
const MODS = {RM: 'Resonancia magnética', TC: 'Tomografía computarizada', US: 'Ecografía', RX: 'Radiografía', MG: 'Mamografía'};
const PLANOS = {axial: 'Axial', coronal: 'Coronal', sagital: 'Sagital', imagenes: 'Imágenes'};
const ORIENT = {axial: ['D', 'I', 'A', 'P'], coronal: ['D', 'I', 'Cr', 'Ca'], sagital: ['A', 'P', 'Cr', 'Ca']};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const LS = {get(k, d) {try {return JSON.parse(localStorage.getItem(k)) ?? d} catch (e) {return d}}, set(k, v) {try {localStorage.setItem(k, JSON.stringify(v))} catch (e) {}}};
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ---------- carga perezosa de pilas (archivos datos/*.js) ---------- */
const PILAS = {}, ESPERA = {};
function ATLAS_CARGA(d) {const k = d.id + '_' + d.plano; PILAS[k] = d; (ESPERA[k] || []).forEach(f => f(d)); delete ESPERA[k];}
function pila(id, plano) {
 const k = id + '_' + plano;
 if (PILAS[k]) return Promise.resolve(PILAS[k]);
 return new Promise((ok, ko) => {
  const nuevo = !ESPERA[k]; (ESPERA[k] = ESPERA[k] || []).push(ok);
  if (!nuevo) return;
  const porScript = () => {const s = document.createElement('script'); s.src = `datos/${k}.js`;
   s.onerror = () => ko(new Error('No se encontró datos/' + k + '.js. Descomprima el ZIP completo y mantenga la carpeta "datos" junto al archivo HTML.'));
   document.head.appendChild(s);};
  if (location.protocol == 'file:') return porScript();
  fetch(`datos/${k}.js`).then(r => {if (!r.ok) throw 0; return r.text();}).then(t => ATLAS_CARGA(JSON.parse(t.slice(t.indexOf('(') + 1, t.lastIndexOf(')'))))).catch(porScript);
 });
}
/* imágenes y mapas de etiquetas decodificados con caché */
const CACHE = new Map();
function cache(k, crear) {if (CACHE.has(k)) {const v = CACHE.get(k); CACHE.delete(k); CACHE.set(k, v); return v;} const v = crear(); CACHE.set(k, v); if (CACHE.size > 500) CACHE.delete(CACHE.keys().next().value); return v;}
function imagen(d, serie, k) {
 return cache(`i|${d.id}|${d.plano}|${serie}|${k}`, () => {const im = new Image(); im.src = 'data:image/jpeg;base64,' + d.series[serie][k]; return im;});
}
function mapa(d, k) {
 if (!d.lab || !d.lab.length) return null;
 return cache(`m|${d.id}|${d.plano}|${k}`, () => {
  const o = {listo: false, a: null}; const im = new Image();
  im.onload = () => {const c = document.createElement('canvas'); c.width = d.lw; c.height = d.lh; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
   const px = x.getImageData(0, 0, d.lw, d.lh).data, a = new Uint8Array(d.lw * d.lh); for (let i = 0; i < a.length; i++) a[i] = px[i * 4]; o.a = a; o.listo = true; o.capas = {}; if (V.d === d && V.k === k) dibujar();};
  im.src = 'data:image/png;base64,' + d.lab[k]; return o;
 });
}
const color = id => {const h = (id * 137.508) % 360; return [h, 75, 55];};
function hsl(h, s, l) {s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return [f(0) * 255, f(8) * 255, f(4) * 255];}
function capa(d, k, modo, sel) { // lienzo con colores de todas las etiquetas o solo la seleccionada
 const m = mapa(d, k); if (!m || !m.listo) return null;
 const key = modo + '|' + sel; if (m.capas[key]) return m.capas[key];
 const c = document.createElement('canvas'); c.width = d.lw; c.height = d.lh; const x = c.getContext('2d'), img = x.createImageData(d.lw, d.lh), p = img.data, a = m.a, W = d.lw;
 const pal = {};
 for (let i = 0; i < a.length; i++) {const v = a[i]; if (!v) continue;
  const borde = (i % W && a[i - 1] != v) || (i % W < W - 1 && a[i + 1] != v) || a[i - W] != v || a[i + W] != v;
  if (modo == 'sel') {if (v != sel) continue; p[i * 4] = 255; p[i * 4 + 1] = 210; p[i * 4 + 2] = 70; p[i * 4 + 3] = borde ? 255 : 95; continue;}
  const q = pal[v] || (pal[v] = hsl(...color(v))); p[i * 4] = q[0]; p[i * 4 + 1] = q[1]; p[i * 4 + 2] = q[2]; p[i * 4 + 3] = borde ? 200 : (v == sel ? 150 : 70);}
 x.putImageData(img, 0, 0); return m.capas[key] = c;
}

/* ---------- estado del visor ---------- */
const V = {e: null, d: null, plano: null, serie: null, k: 0, sel: null, rot: LS.get('atlas-rot', 'lados'), mapa: false, zoom: 1, px: 0, py: 0, br: 100, ct: 100, quiz: null, geo: null};

function navLateral() {
 const g = {}; ESTUDIOS.forEach(e => (g[e.mod] = g[e.mod] || []).push(e));
 $('#side').innerHTML = `<a data-home="1">🏠 Inicio</a>` + Object.keys(MODS).filter(m => g[m]).map(m => `<h3>${MODS[m]}</h3>` + g[m].map(e => `<a data-est="${e.id}" class="${V.e && V.e.id == e.id ? 'on' : ''}">${esc(e.titulo)}<small>${esc(e.sub)}</small></a>`).join('')).join('')
  + `<h3>Referencia</h3><a data-fichas="1">📋 Técnica, valores y clasificaciones</a><a data-fuentes="1">📚 Fuentes y licencias</a>`;
}
function inicio() {
 V.e = null; navLateral(); const q = $('#q').value.trim();
 let res = '';
 if (q.length >= 3) {const h = []; const nq = norm(q);
  ESTUDIOS.forEach(e => Object.entries(e.et).forEach(([id, o]) => {if (norm(o.n).includes(nq)) h.push({e, id, o});}));
  res = `<h3 style="color:var(--az)">Estructuras encontradas: ${h.length}</h3><div class="res">${h.slice(0, 60).map(x => `<div data-est="${x.e.id}" data-buscar="${x.id}"><b>${esc(x.o.n)}</b> — <span class="sub">${esc(x.e.titulo)}</span></div>`).join('') || '<p class="sub">Sin coincidencias.</p>'}</div>`;}
 const tot = ESTUDIOS.reduce((s, e) => s + Object.keys(e.et).length, 0), cortes = ESTUDIOS.reduce((s, e) => s + e.ncortes, 0);
 $('#main').innerHTML = `<h2>Atlas de anatomía seccional real</h2>
 <p class="sub">${ESTUDIOS.length} estudios reales · ${cortes.toLocaleString('es')} cortes e imágenes · ${tot} estructuras rotuladas en español.</p>
 <div class="note">Todas las imágenes son <b>estudios reales</b> (RM, TC, ecografía, radiografía y mamografía) de bases públicas con licencia libre. En RM y TC cada estructura proviene de una <b>segmentación vóxel a vóxel</b> (atlas FreeSurfer/Harvard-Oxford/MASSP en RM; TotalSegmentator y contornos manuales en TC): al tocar cualquier punto de la imagen se identifica la estructura exacta. Recorra los cortes con la rueda del ratón, arrastrando sobre la imagen o con el deslizador, y cambie de plano (axial, coronal, sagital), de secuencia o de ventana.</div>
 ${res}
 ${Object.keys(MODS).map(m => {const L = ESTUDIOS.filter(e => e.mod == m); if (!L.length) return ''; return `<h3 style="color:var(--az);margin:18px 0 8px">${MODS[m]}</h3><div class="home">${L.map(e => `<div class="card" data-est="${e.id}"><div class="mini"><img alt="" src="${e.mini}"></div><div class="bd"><span class="tag t-${e.mod}">${e.mod}</span><b>${esc(e.titulo)}</b><p>${esc(e.sub)}<br>${e.ncortes} ${e.planos[0] == 'imagenes' ? 'imágenes' : 'cortes'} · ${Object.keys(e.et).length} estructuras</p></div></div>`).join('')}</div>`;}).join('')}`;
}

async function abrir(id, buscar) {
 const e = ESTUDIOS.find(x => x.id == id); if (!e) return inicio();
 if (!V.e || V.e.id != id) {V.e = e; V.plano = e.planos[0]; V.serie = e.series[0]; V.sel = null; V.k = null; V.quiz = null; V.mapa = false; V.zoom = 1; V.px = V.py = 0;}
 navLateral(); $('#side').classList.remove('open');
 $('#main').innerHTML = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="tag t-${e.mod}">${MODS[e.mod]}</span><h2>${esc(e.titulo)}</h2></div><p class="sub">${esc(e.desc)}</p>
 <div class="bar" id="barra"></div>
 <div class="visor"><div><div id="qz"></div><div class="lz"><canvas id="cv"></canvas><div class="ctl"><button id="kprev" title="Corte anterior">▲</button><input type="range" id="kr" min="0" max="0" value="0"><button id="knext" title="Corte siguiente">▼</button><span id="kt"></span>
  <label>☼<input type="range" class="sl" id="br" min="40" max="200" value="${V.br}"></label><label>◐<input type="range" class="sl" id="ctr" min="40" max="250" value="${V.ct}"></label><button id="zi">＋</button><button id="zo">－</button><button id="zf">Ajustar</button></div></div>
  <p class="sub" style="margin-top:6px">${matchMedia('(pointer:coarse)').matches ? 'Deslice el dedo arriba/abajo sobre la imagen para recorrer cortes · toque para identificar.' : 'Rueda o arrastre vertical: recorrer cortes · Ctrl + rueda: zoom · Clic: identificar estructura · Teclas ↑ ↓.'}</p></div>
 <div class="panel"><div class="info" id="info"></div><div class="lista" id="lst"><input id="flt" placeholder="Buscar en este estudio…"><div id="items"></div></div></div></div>`;
 barra(); eventosVisor();
 await cambiarPlano(V.plano, buscar);
}
function barra() {const e = V.e;
 $('#barra').innerHTML = (e.planos.length > 1 ? `<span class="lb">Plano</span><div class="grp">${e.planos.map(p => `<button data-plano="${p}" class="${p == V.plano ? 'on' : ''}">${PLANOS[p]}</button>`).join('')}</div>` : '')
 + (e.series.length > 1 ? `<span class="lb">${e.mod == 'TC' ? 'Ventana' : 'Secuencia'}</span><div class="grp">${e.series.map(s => `<button data-serie="${s}" class="${s == V.serie ? 'on' : ''}">${s}</button>`).join('')}</div>` : '')
 + `<span class="lb">Rótulos</span><div class="grp">${[['lados', 'Nombres'], ['numeros', 'Números'], ['sel', 'Solo selección'], ['no', 'Ocultos']].map(([k, t]) => `<button data-rot="${k}" class="${V.rot == k && !V.quiz ? 'on' : ''}">${t}</button>`).join('')}</div>`
 + (e.planos[0] != 'imagenes' ? `<div class="grp"><button data-mapa="1" class="${V.mapa ? 'on' : ''}">🎨 Mapa de colores</button></div>` : '')
 + `<div class="grp"><button data-quiz="1" class="${V.quiz ? 'on' : ''}">🎯 Modo estudio</button></div>`;}

async function cambiarPlano(p, buscar) {
 V.plano = p; barra();
 const cv = $('#cv'); cv.style.height = '420px'; const c = cv.getContext('2d'); cv.width = cv.clientWidth; cv.height = 420; c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#cfd8e6'; c.font = '15px Arial'; c.fillText('Cargando cortes…', 20, 40);
 try {V.d = await pila(V.e.id, p);} catch (err) {$('#info').innerHTML = `<h4>No se pudieron cargar las imágenes</h4><p>${esc(err.message)}</p>`; return;}
 if (V.e == null || V.plano != p) return;
 const n = V.d.series[V.serie].length; $('#kr').max = n - 1;
 if (buscar != null) {V.sel = +buscar; const b = mejorCorte(V.sel); V.k = b != null ? b : Math.floor(n / 2);}
 else if (V.sel != null) {const b = mejorCorte(V.sel); V.k = b != null ? b : Math.min(V.k ?? 0, n - 1);}
 else V.k = V.k == null || V.k >= n ? Math.floor(n / 2) : V.k;
 if (V.d.puntos) V.k = buscar != null ? (mejorCorte(V.sel) ?? 0) : (V.k ?? 0);
 precargar(); irA(V.k); mostrarInfo();
}
function mejorCorte(id) {let best = null, ba = -1; V.d.anc.forEach((L, k) => L.forEach(r => {if (r[0] == id && r[3] > ba) {ba = r[3]; best = k;}})); return best;}
function precargar() {const d = V.d; for (let k = 0; k < d.series[V.serie].length; k++) imagen(d, V.serie, k);}
function irA(k) {const d = V.d; if (!d) return; const n = d.series[V.serie].length; V.k = Math.max(0, Math.min(n - 1, k)); $('#kr').value = V.k;
 $('#kt').textContent = d.puntos ? `${V.k + 1}/${n} · ${d.tit[V.k]}` : `Corte ${V.k + 1}/${n} · ${d.mm} mm`;
 const im = imagen(d, V.serie, V.k); if (!im.complete) im.onload = () => {if (V.k == k) dibujar();};
 mapa(d, V.k); dibujar(); lista();}

/* ---------- dibujo ---------- */
function rotulosVisibles() {const d = V.d, L = (d.anc[V.k] || []).slice().sort((a, b) => b[3] - a[3]);
 if (V.quiz) return V.quiz.ver ? L.filter(r => r[0] == V.quiz.obj) : [];
 if (V.rot == 'no') return [];
 if (V.rot == 'sel') return L.filter(r => r[0] == V.sel);
 const cv = $('#cv'), max = d.puntos ? 99 : Math.max(8, Math.floor(cv.height / 19) * 2);
 const out = L.slice(0, max); if (V.sel != null && !out.find(r => r[0] == V.sel)) {const s = L.find(r => r[0] == V.sel); if (s) out.push(s);}
 return out;}
function dibujar() {
 const cv = $('#cv'); if (!cv || !V.d) return; const d = V.d, dpr = window.devicePixelRatio || 1;
 const cssW = cv.clientWidth, dims = d.dims ? d.dims[V.k] : [d.w, d.h], asp = d.puntos ? 1 : d.aspecto;
 const lados = V.rot == 'lados' && !V.quiz && cssW >= 760;
 const M = lados ? Math.min(260, cssW * .24) : 0;
 V.num = !lados && (V.rot == 'lados' || V.rot == 'numeros');
 const maxH = Math.max(280, Math.min(window.innerHeight - (window.innerWidth < 820 ? 260 : 190), 900));
 let esc0 = Math.min((cssW - 2 * M) / dims[0], maxH / (dims[1] * asp));
 const cssH = Math.round(Math.min(maxH, dims[1] * asp * esc0 + 2));
 if (cv.width != Math.round(cssW * dpr) || cv.height != Math.round(cssH * dpr)) {cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr); cv.style.height = cssH + 'px';}
 const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, cssW, cssH);
 const s = esc0 * V.zoom, iw = dims[0] * s, ih = dims[1] * asp * s, ox = M + (cssW - 2 * M - iw) / 2 + V.px, oy = (cssH - ih) / 2 + V.py;
 V.geo = {ox, oy, iw, ih, M, cssW, cssH};
 c.save(); c.beginPath(); c.rect(M, 0, cssW - 2 * M, cssH); c.clip();
 const im = imagen(d, V.serie, V.k);
 c.filter = `brightness(${V.br}%) contrast(${V.ct}%)`; c.imageSmoothingEnabled = true; if (im.complete) c.drawImage(im, ox, oy, iw, ih); c.filter = 'none';
 if (!d.puntos) {c.imageSmoothingEnabled = false;
  if (V.mapa && !V.quiz) {const l = capa(d, V.k, 'todo', V.sel); if (l) c.drawImage(l, ox, oy, iw, ih);}
  const sel = V.quiz ? V.quiz.marca : V.sel;
  if (sel != null && (!V.mapa || V.quiz)) {const l = capa(d, V.k, 'sel', sel); if (l) c.drawImage(l, ox, oy, iw, ih);}}
 c.restore();
 // orientación
 c.font = 'bold 14px Arial'; c.fillStyle = '#C9A227'; c.textBaseline = 'middle';
 const o = ORIENT[V.plano]; if (o) {c.textAlign = 'left'; c.fillText(o[0], M + 6, cssH / 2); c.textAlign = 'right'; c.fillText(o[1], cssW - M - 6, cssH / 2); c.textAlign = 'center'; c.fillText(o[2], M + (cssW - 2 * M) / 2, 12); c.fillText(o[3], M + (cssW - 2 * M) / 2, cssH - 10);}
 c.textAlign = 'left'; c.fillStyle = '#e6ebf2'; c.font = '12px Arial'; c.fillText(`${V.e.mod} · ${PLANOS[V.plano]} · ${V.serie}`, M + 8, 14);
 // rótulos
 const R = rotulosVisibles(), P = r => [ox + r[1] / d.lw * iw, oy + r[2] / d.lh * ih];
 V.cajas = [];
 if (!R.length) return;
 if (lados) {
  const col = [[], []]; R.forEach(r => {const p = P(r); col[p[0] < M + (cssW - 2 * M) / 2 ? 0 : 1].push({r, p});});
  c.font = '13px Arial'; c.textBaseline = 'middle';
  col.forEach((arr, ld) => {arr.sort((a, b) => a.p[1] - b.p[1]); const gap = Math.min(19, (cssH - 16) / Math.max(1, arr.length));
   arr.forEach(o => o.y = Math.max(10, Math.min(cssH - 8, o.p[1])));
   for (let j = 1; j < arr.length; j++) if (arr[j].y < arr[j - 1].y + gap) arr[j].y = arr[j - 1].y + gap;
   for (let j = arr.length - 1; j >= 0; j--) {const lim = j == arr.length - 1 ? cssH - 8 : arr[j + 1].y - gap; if (arr[j].y > lim) arr[j].y = lim;}
   arr.forEach(o => {const id = o.r[0], on = id == V.sel, n = V.e.et[id]?.n || id, lx = ld ? cssW - M + 6 : M - 6;
    c.strokeStyle = on ? '#ffd65a' : 'rgba(201,162,39,.75)'; c.lineWidth = on ? 1.6 : 1;
    c.beginPath(); c.moveTo(lx, o.y); c.lineTo(ld ? cssW - M : M, o.y); c.lineTo(o.p[0], o.p[1]); c.stroke();
    c.fillStyle = on ? '#ffd65a' : '#C9A227'; c.beginPath(); c.arc(o.p[0], o.p[1], 2.8, 0, 7); c.fill();
    c.font = (on ? 'bold ' : '') + '13px Arial'; c.fillStyle = on ? '#ffd65a' : '#e6ebf2'; c.textAlign = ld ? 'left' : 'right';
    let t = n; while (c.measureText(t).width > M - 12 && t.length > 6) t = t.slice(0, -2); if (t != n) t = t.slice(0, -1) + '…';
    c.fillText(t, lx, o.y); const w = c.measureText(t).width; V.cajas.push({id, x: ld ? lx : lx - w, y: o.y - 9, w, h: 18});});});
 } else {
  c.font = 'bold 12px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
  R.forEach((r, i) => {const p = P(r), on = r[0] == V.sel, num = numero(r[0]);
   c.fillStyle = on ? '#ffd65a' : 'rgba(201,162,39,.92)'; c.beginPath(); c.arc(p[0], p[1], 10, 0, 7); c.fill(); c.strokeStyle = '#000'; c.lineWidth = 1; c.stroke();
   c.fillStyle = '#000'; c.fillText(num, p[0], p[1] + .5); V.cajas.push({id: r[0], x: p[0] - 11, y: p[1] - 11, w: 22, h: 22});
   if (V.rot == 'sel' || V.quiz) {const t = V.e.et[r[0]]?.n || ''; c.textAlign = 'left'; c.font = 'bold 13px Arial'; const w = c.measureText(t).width, tx = Math.min(p[0] + 14, cssW - w - 6); c.fillStyle = 'rgba(0,0,0,.72)'; c.fillRect(tx - 4, p[1] - 10, w + 8, 20); c.fillStyle = '#ffd65a'; c.fillText(t, tx, p[1]); c.textAlign = 'center'; c.font = 'bold 12px Arial';}});
 }
}
function numero(id) {const L = (V.d.anc[V.k] || []).map(r => r[0]).sort((a, b) => (V.e.et[a]?.n || '').localeCompare(V.e.et[b]?.n || '', 'es')); return L.indexOf(id) + 1;}

/* ---------- panel ---------- */
function lista() {const box = $('#items'); if (!box) return; const f = norm($('#flt').value || ''), d = V.d;
 const aqui = (d.anc[V.k] || []).map(r => r[0]);
 const conv = id => V.e.et[id]?.n || ('#' + id);
 if (V.quiz && !V.quiz.ver) {box.innerHTML = '<div class="h">Rótulos ocultos durante el modo estudio</div>'; return;}
 let html = '';
 const enCorte = aqui.filter(id => !f || norm(conv(id)).includes(f)).sort((a, b) => conv(a).localeCompare(conv(b), 'es'));
 html += `<div class="h">${d.puntos ? 'En esta imagen' : 'En este corte'} (${enCorte.length})</div>` + enCorte.map(id => {const q = hsl(...color(id)); return `<div class="it ${id == V.sel ? 'on' : ''}" data-s="${id}"><i style="background:rgb(${q.map(Math.round)})"></i>${V.num ? `<b style="color:var(--do);min-width:20px">${numero(id)}</b>` : ''}${esc(conv(id))}</div>`;}).join('');
 if (f) {const otros = Object.keys(V.e.et).map(Number).filter(id => !aqui.includes(id) && norm(conv(id)).includes(f)).sort((a, b) => conv(a).localeCompare(conv(b), 'es'));
  html += `<div class="h">En otros ${d.puntos ? 'imágenes' : 'cortes'} (${otros.length})</div>` + otros.map(id => `<div class="it fuera" data-s="${id}">↪ ${esc(conv(id))}</div>`).join('');}
 box.innerHTML = html;}
function mostrarInfo() {const box = $('#info'); if (!box) return;
 if (V.quiz) {const ob = V.e.et[V.quiz.obj];
  box.innerHTML = `<div class="quiz">Toque en la imagen:<br><b>${esc(ob?.n)}</b><br>${V.quiz.msg || ''}<br><small>Aciertos ${V.quiz.ok} de ${V.quiz.n}</small></div><button id="qsig">Siguiente ›</button> <button id="qver">Ver respuesta</button>`;
  $('#qsig').onclick = () => nuevaPregunta(); $('#qver').onclick = () => {V.quiz.marca = V.quiz.obj; V.quiz.ver = true; V.quiz.msg = 'Respuesta resaltada en dorado.'; dibujar(); mostrarInfo(); lista();}; return;}
 if (V.sel == null) {box.innerHTML = `<h4>${Object.keys(V.e.et).length} estructuras en este estudio</h4><p>Toque cualquier punto de la imagen o un nombre de la lista. Use la búsqueda para saltar al corte donde la estructura se ve mejor.</p><p class="sub">${esc(V.e.fuente)}</p>`; return;}
 const o = V.e.et[V.sel] || {n: '#' + V.sel, d: ''}; const enEste = (V.d.anc[V.k] || []).some(r => r[0] == V.sel);
 box.innerHTML = `<h4>${esc(o.n)}</h4>${o.d ? `<p>${esc(o.d)}</p>` : ''}<p class="sub">${enEste ? 'Visible en este corte.' : 'No visible en este corte.'}</p>${V.d.puntos ? '' : '<button id="mejor">Ir al corte donde es más grande</button> '}<button id="dsel">Quitar selección</button>`;
 if ($('#mejor')) $('#mejor').onclick = () => {const b = mejorCorte(V.sel); if (b != null) irA(b);};
 $('#dsel').onclick = () => seleccionar(null);}
function seleccionar(id) {V.sel = id; mostrarInfo(); lista(); dibujar(); const el = document.querySelector(`#items [data-s="${id}"]`); if (el) el.scrollIntoView({block: 'nearest'});}
function nuevaPregunta() {const L = (V.d.anc[V.k] || []).filter(r => V.d.puntos || r[3] > 60).map(r => r[0]); if (!L.length) {V.quiz.msg = 'Cambie de corte: no hay estructuras suficientes aquí.'; mostrarInfo(); return;}
 V.quiz.obj = L[Math.floor(Math.random() * L.length)]; V.quiz.marca = null; V.quiz.ver = false; V.quiz.msg = ''; dibujar(); mostrarInfo(); lista();}

/* ---------- interacción ---------- */
function identificar(x, y) { // coordenadas CSS en el lienzo
 const d = V.d, g = V.geo; if (!g) return null;
 const b = (V.cajas || []).find(o => x >= o.x - 3 && x <= o.x + o.w + 3 && y >= o.y && y <= o.y + o.h); if (b) return b.id;
 const fx = (x - g.ox) / g.iw, fy = (y - g.oy) / g.ih; if (fx < 0 || fy < 0 || fx > 1 || fy > 1) return null;
 if (d.puntos) {let best = null, bd = 30; (d.anc[V.k] || []).forEach(r => {const dx = (r[1] / d.lw - fx) * g.iw, dy = (r[2] / d.lh - fy) * g.ih, dd = Math.hypot(dx, dy); if (dd < bd) {bd = dd; best = r[0];}}); return best;}
 const m = mapa(d, V.k); if (!m || !m.listo) return null;
 const v = m.a[Math.min(d.lh - 1, Math.floor(fy * d.lh)) * d.lw + Math.min(d.lw - 1, Math.floor(fx * d.lw))]; return v || null;}
function eventosVisor() {
 const cv = $('#cv'); let dn = null;
 cv.addEventListener('wheel', e => {e.preventDefault(); if (e.ctrlKey) {zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.offsetX, e.offsetY);} else irA(V.k + (e.deltaY > 0 ? 1 : -1));}, {passive: false});
 cv.addEventListener('pointerdown', e => {dn = {x: e.clientX, y: e.clientY, px: V.px, py: V.py, k: V.k, mov: false}; cv.setPointerCapture(e.pointerId);});
 cv.addEventListener('pointermove', e => {if (!dn) return; const dx = e.clientX - dn.x, dy = e.clientY - dn.y; if (Math.abs(dx) + Math.abs(dy) > 5) dn.mov = true; if (!dn.mov) return;
  if (V.zoom > 1.01) {V.px = dn.px + dx; V.py = dn.py + dy; dibujar();} else irA(dn.k + Math.round(dy / 7));});
 cv.addEventListener('pointerup', e => {const was = dn; dn = null; if (!was || was.mov) return; const r = cv.getBoundingClientRect(); const id = identificar(e.clientX - r.left, e.clientY - r.top);
  if (V.quiz) {if (V.quiz.ver) return; V.quiz.n++; const ok = id == V.quiz.obj; if (ok) V.quiz.ok++; V.quiz.msg = ok ? '<span class="ok">✔ Correcto</span>' : `<span class="no">✘ Tocó: ${esc(id ? V.e.et[id]?.n : 'zona sin estructura')}</span>`; V.quiz.marca = V.quiz.obj; V.quiz.ver = true; dibujar(); mostrarInfo(); lista(); setTimeout(() => {if (V.quiz) nuevaPregunta();}, ok ? 1100 : 2600); return;}
  seleccionar(id);});
 $('#kr').oninput = e => irA(+e.target.value); $('#kprev').onclick = () => irA(V.k - 1); $('#knext').onclick = () => irA(V.k + 1);
 $('#br').oninput = e => {V.br = +e.target.value; dibujar();}; $('#ctr').oninput = e => {V.ct = +e.target.value; dibujar();};
 $('#zi').onclick = () => zoom(1.25); $('#zo').onclick = () => zoom(.8); $('#zf').onclick = () => {V.zoom = 1; V.px = V.py = 0; V.br = 100; V.ct = 100; $('#br').value = 100; $('#ctr').value = 100; dibujar();};
 $('#flt').oninput = lista;
}
function zoom(f, x, y) {const g = V.geo; if (!g) return; x = x ?? g.cssW / 2; y = y ?? g.cssH / 2; const cx = g.M + (g.cssW - 2 * g.M) / 2, cy = g.cssH / 2;
 const nz = Math.max(1, Math.min(8, V.zoom * f)), r = nz / V.zoom; V.px = (V.px + cx - x) * r - (cx - x); V.py = (V.py + cy - y) * r - (cy - y); V.zoom = nz; if (nz == 1) V.px = V.py = 0; dibujar();}
document.addEventListener('keydown', e => {if (!V.e || e.target.tagName == 'INPUT') return; if (e.key == 'ArrowDown' || e.key == 'ArrowRight') {irA(V.k + 1); e.preventDefault();} if (e.key == 'ArrowUp' || e.key == 'ArrowLeft') {irA(V.k - 1); e.preventDefault();}});
document.addEventListener('click', e => {
 const t = e.target.closest('[data-est],[data-home],[data-plano],[data-serie],[data-rot],[data-mapa],[data-quiz],[data-s],[data-fichas],[data-fuentes]'); if (!t) return;
 if (t.dataset.s !== undefined) {const id = +t.dataset.s; if (V.quiz) return; const aqui = (V.d.anc[V.k] || []).some(r => r[0] == id); V.sel = id; if (!aqui) {const b = mejorCorte(id); if (b != null) {irA(b); mostrarInfo(); return;}} seleccionar(id);}
 else if (t.dataset.plano) cambiarPlano(t.dataset.plano);
 else if (t.dataset.serie) {V.serie = t.dataset.serie; barra(); precargar(); irA(V.k);}
 else if (t.dataset.rot) {V.rot = t.dataset.rot; V.quiz = null; LS.set('atlas-rot', V.rot); barra(); dibujar(); lista(); mostrarInfo();}
 else if (t.dataset.mapa) {V.mapa = !V.mapa; barra(); dibujar();}
 else if (t.dataset.quiz) {if (V.quiz) V.quiz = null; else {V.quiz = {ok: 0, n: 0}; V.sel = null; nuevaPregunta();} barra(); dibujar(); mostrarInfo(); lista();}
 else if (t.dataset.est) abrir(t.dataset.est, t.dataset.buscar);
 else if (t.dataset.home) inicio();
 else if (t.dataset.fichas) fichas();
 else if (t.dataset.fuentes) fuentes();
});
$('#ir-inicio').onclick = inicio;
$('#q').addEventListener('input', () => {if (!V.e) inicio();});
$('#q').addEventListener('keydown', e => {if (e.key == 'Enter') inicio();});
$('#menu').onclick = () => $('#side').classList.toggle('open');
$('#tema').onclick = () => {const r = document.documentElement, d = r.dataset.theme == 'dark' || (!r.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches); r.dataset.theme = d ? 'light' : 'dark'; LS.set('atlas-tema', r.dataset.theme);};
{const t = LS.get('atlas-tema', null); if (t) document.documentElement.dataset.theme = t;}
let rz; window.addEventListener('resize', () => {clearTimeout(rz); rz = setTimeout(dibujar, 120);});

/* ---------- referencia ---------- */
function fichas() {V.e = null; navLateral();
 $('#main').innerHTML = `<h2>Técnica, valores de referencia y clasificaciones</h2><p class="sub">Resumen de consulta rápida por región.</p>` + A.map(a => `
 <section class="ficha"><h4>${esc(a.n)} · ${a.m}</h4><div class="b"><p><b>Técnica.</b> ${a.tec}</p><ul>${a.anat.map(x => `<li>${x}</li>`).join('')}</ul>
 <table><tr><th>Parámetro</th><th>Valor</th></tr>${a.val.map(v => `<tr><td>${v[0]}</td><td><b>${v[1]}</b></td></tr>`).join('')}</table>
 <p><b>Patología frecuente.</b></p><ul>${a.pat.map(p => `<li><b style="color:var(--ro)">${p[0]}.</b> ${p[1]}</li>`).join('')}</ul><p><b>Clasificaciones.</b> ${a.cls}</p></div></section>`).join('');}
function fuentes() {V.e = null; navLateral();
 $('#main').innerHTML = `<h2>Fuentes y licencias</h2><div class="note">Todas las imágenes provienen de repositorios públicos de investigación, desidentificados, con licencias que permiten su uso con atribución. Los rótulos en español, las descripciones y la selección son de este atlas.</div>` + FUENTES.map(f => `<section class="ficha"><h4>${esc(f.t)}</h4><div class="b">${f.h}</div></section>`).join('');}

navLateral(); inicio();
