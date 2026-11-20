// Preparador de Estudios (extensión de Chrome): videos, JPG/PNG y DICOM -> PDF grandes, siempre < 40 MB.
"use strict";

const EXT_VIDEO = [".mp4", ".mov", ".avi", ".mkv", ".wmv", ".m4v", ".webm"];
const EXT_IMG = [".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp", ".gif"];
const LADO_MAX = 3000;    // px; páginas grandes para leer cada corte con detalle
const CALIDAD_JPG = 0.90;
const FPS = 2;            // fotogramas por segundo a muestrear en los videos
const UMBRAL = 6;         // diferencia mínima (0-255) para no repetir el mismo corte

const $ = (id) => document.getElementById(id);
const elementos = [];     // { tipo, nombre, archivos: [File], tam, clave }
const seleccion = new Set();
let trabajando = false;
let ultimaDescarga = null;

// ---------------------------------------------------------------- lista
function extension(nombre) {
  const i = nombre.lastIndexOf(".");
  const b = nombre.lastIndexOf("/");
  return i > b && i >= 0 ? nombre.slice(i).toLowerCase() : "";
}
function clase(nombre) {
  const e = extension(nombre);
  if (EXT_VIDEO.includes(e)) return "video";
  if (EXT_IMG.includes(e)) return "imagen";
  if (e === ".dcm" || e === "" || e === ".dicom") return "dicom";
  return null;
}
const claveArchivo = (f) => `${f.webkitRelativePath || f.name}|${f.size}|${f.lastModified}`;
const mb = (b) => (b / 1e6).toFixed(2) + " MB";

function agregarArchivos(archivos, forzarDicom = false) {
  const vistas = new Set(elementos.map((x) => x.clave));
  let ignorados = 0;
  for (const f of archivos) {
    const tipo = forzarDicom ? "dicom" : clase(f.name);
    if (!tipo) { ignorados++; continue; }
    const clave = claveArchivo(f);
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    elementos.push({ tipo, nombre: f.name, archivos: [f], tam: f.size, clave });
  }
  if (ignorados) escribir(`Se ignoraron ${ignorados} archivo(s) de tipo no compatible.\n`);
  actualizar();
}

function agregarCarpeta(nombre, archivos) {
  archivos = archivos.filter((f) => clase(f.webkitRelativePath || f.name) && !/(^|\/)\./.test(f.webkitRelativePath || f.name));
  archivos.sort((a, b) => (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name, "es", { numeric: true }));
  if (!archivos.length) { escribir(`La carpeta ${nombre} no tiene videos, imágenes ni DICOM.\n`); return; }
  const clave = "carpeta|" + archivos.map(claveArchivo).join("\n");
  if (elementos.some((x) => x.clave === clave)) return;
  elementos.push({ tipo: "carpeta", nombre: `${nombre}  (${archivos.length} archivos)`, archivos, tam: archivos.reduce((s, f) => s + f.size, 0), clave });
  actualizar();
}

function actualizar() {
  const tb = $("lista");
  tb.textContent = "";
  const n = { video: 0, imagen: 0, dicom: 0, carpeta: 0 };
  const etiquetas = { video: "Video", imagen: "Imagen", dicom: "DICOM", carpeta: "Carpeta" };
  elementos.forEach((x, i) => {
    n[x.tipo]++;
    const tr = document.createElement("tr");
    if (seleccion.has(i)) tr.className = "sel";
    for (const v of [i + 1, etiquetas[x.tipo], x.nombre, mb(x.tam)]) {
      const td = document.createElement("td");
      td.textContent = v;
      tr.appendChild(td);
    }
    tr.addEventListener("click", (ev) => {
      if (trabajando) return;
      if (!ev.ctrlKey && !ev.metaKey && !ev.shiftKey) seleccion.clear();
      if (ev.shiftKey && seleccion.size) {
        const a = Math.min(...seleccion, i), b = Math.max(...seleccion, i);
        for (let k = a; k <= b; k++) seleccion.add(k);
      } else if (seleccion.has(i) && (ev.ctrlKey || ev.metaKey)) seleccion.delete(i);
      else seleccion.add(i);
      actualizar();
    });
    tb.appendChild(tr);
  });
  $("vacia").hidden = elementos.length > 0;
  $("contador").textContent = `${elementos.length} elementos seleccionados: ${n.video} videos · ${n.imagen} imágenes · ${n.dicom} DICOM · ${n.carpeta} carpetas`;
}

function mover(dir) {
  if (trabajando || !seleccion.size) return;
  const idx = [...seleccion].sort((a, b) => a - b);
  if ((dir < 0 && idx[0] === 0) || (dir > 0 && idx[idx.length - 1] === elementos.length - 1)) return;
  for (const i of dir < 0 ? idx : idx.reverse()) [elementos[i], elementos[i + dir]] = [elementos[i + dir], elementos[i]];
  seleccion.clear();
  idx.forEach((i) => seleccion.add(i + dir));
  actualizar();
}

// Carpetas arrastradas: se recorren completas.
async function leerEntrada(entrada, ruta = "") {
  if (entrada.isFile) {
    const f = await new Promise((ok, mal) => entrada.file(ok, mal));
    Object.defineProperty(f, "webkitRelativePath", { value: ruta + f.name });
    return [f];
  }
  const lector = entrada.createReader();
  const hijos = [];
  for (;;) {
    const lote = await new Promise((ok, mal) => lector.readEntries(ok, mal));
    if (!lote.length) break;
    hijos.push(...lote);
  }
  const res = [];
  for (const h of hijos) res.push(...(await leerEntrada(h, ruta + entrada.name + "/")));
  return res;
}

// ---------------------------------------------------------------- imágenes
function lienzo(w, h) {
  const c = new OffscreenCanvas(Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  return c;
}
function miniatura(fuente) {
  const c = lienzo(96, 96);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(fuente, 0, 0, 96, 96);
  const d = ctx.getImageData(0, 0, 96, 96).data;
  const g = new Uint8Array(96 * 96);
  for (let i = 0; i < g.length; i++) g[i] = (d[4 * i] * 299 + d[4 * i + 1] * 587 + d[4 * i + 2] * 114) / 1000;
  return g;
}
function diferencia(a, b) {
  if (!a || !b) return 255;
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
}
function escalar(fuente, ladoMax) {
  const w = fuente.width, h = fuente.height;
  const f = Math.min(1, ladoMax / Math.max(w, h));
  const c = lienzo(w * f, h * f);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(fuente, 0, 0, c.width, c.height);
  return c;
}
async function aJpg(c, calidad = CALIDAD_JPG) {
  const b = await c.convertToBlob({ type: "image/jpeg", quality: calidad });
  return new Uint8Array(await b.arrayBuffer());
}
const base = (nombre) => nombre.replace(/^.*\//, "").replace(/\.[^.]+$/, "");

async function abrirImagen(f) {
  try {
    return await createImageBitmap(f, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`No se pudo abrir la imagen ${f.name} (formato no compatible con Chrome; conviértala a JPG o PNG).`);
  }
}

// ---------------------------------------------------------------- videos
function esperar(el, evento, error = "error") {
  return new Promise((ok, mal) => {
    const fin = () => { el.removeEventListener(evento, bien); el.removeEventListener(error, malo); };
    const bien = () => { fin(); ok(); };
    const malo = () => { fin(); mal(new Error("no se pudo leer")); };
    el.addEventListener(evento, bien, { once: true });
    el.addEventListener(error, malo, { once: true });
  });
}

async function* framesVideo(f) {
  const url = URL.createObjectURL(f);
  const v = document.createElement("video");
  v.muted = true; v.preload = "auto"; v.playsInline = true;
  try {
    v.src = url;
    try { await esperar(v, "loadeddata"); }
    catch { escribir(`  [!] No se pudo abrir ${f.name}: Chrome no reproduce este formato de video. Conviértalo a MP4 o grabe en MP4.\n`); return; }
    let dur = v.duration;
    if (!Number.isFinite(dur)) {   // algunos WEBM no informan duración hasta llegar al final
      v.currentTime = 1e7;
      await esperar(v, "seeked");
      dur = v.duration;
    }
    if (!Number.isFinite(dur) || !v.videoWidth) { escribir(`  [!] No se pudo leer la duración de ${f.name}\n`); return; }
    const total = Math.max(1, Math.floor(dur * FPS));
    escribir(`  Video: ${f.name} | ${dur.toFixed(1)} s | ${v.videoWidth}x${v.videoHeight} | muestreo ${FPS} por segundo\n`);
    let previa = null;
    for (let k = 0; k < total; k++) {
      const t = Math.min(k / FPS, Math.max(0, dur - 0.001));
      if (Math.abs(v.currentTime - t) > 1e-4) {
        v.currentTime = t;
        await esperar(v, "seeked");
      }
      const m = miniatura(v);
      if (diferencia(m, previa) >= UMBRAL) {
        previa = m;
        const c = lienzo(v.videoWidth, v.videoHeight);
        c.getContext("2d").drawImage(v, 0, 0);
        yield { etiqueta: `${base(f.name)}_t${t.toFixed(2).padStart(7, "0")}s`, lienzo: c };
      }
      progresoParcial(k + 1, total);
    }
  } finally {
    v.removeAttribute("src"); v.load();
    URL.revokeObjectURL(url);
  }
}

// ---------------------------------------------------------------- recolección
// Un bloque de videos y DICOM (lo que va a mosaicos), en el orden de la lista.
async function* recolectar(rutas) {
  const dicoms = [];
  for (const { archivo, tipo } of rutas) {
    if (tipo === "video") yield* framesVideo(archivo);
    else if (tipo === "dicom") {
      try { dicoms.push(await imagenDicom(archivo)); }
      catch (e) {
        if (!/No es DICOM|sin imagen/.test(e.message)) escribir(`  [!] ${archivo.name}: ${e.message}\n`);
      }
    }
  }
  if (dicoms.length) {
    escribir(`  DICOM: ${dicoms.length} cortes\n`);
    dicoms.sort((a, b) => a.serie - b.serie || a.instancia - b.instancia);
    for (const d of dicoms) {
      yield { etiqueta: `S${String(d.serie).padStart(3, "0")}_I${String(d.instancia).padStart(4, "0")}`, lienzo: d.lienzo };
    }
  }
}

async function* mosaicos(fuente, lado, maxImgs) {
  const celda = Math.floor(LADO_MAX / lado); // 2x2: 1500 px | 3x3: 1000 | 4x4: 750 | 5x5: 600 por corte
  let cortes = [];
  for await (const { etiqueta, lienzo: c } of fuente) {      // se guardan reducidos para no agotar la memoria
    const r = escalar(c, celda);
    cortes.push({ etiqueta, blob: await r.convertToBlob({ type: "image/jpeg", quality: 0.93 }) });
  }
  if (!cortes.length) return;
  const cupo = lado * lado * maxImgs;
  if (cortes.length > cupo) {                                 // cortes equidistantes a lo largo del estudio
    cortes = Array.from({ length: cupo }, (_, i) => cortes[Math.round(i * (cortes.length - 1) / (cupo - 1))]);
  }
  escribir(`  Cortes elegidos: ${cortes.length} (de forma equidistante) -> mosaicos de ${lado}x${lado}\n`);
  const fuenteTxt = Math.max(16, Math.floor(celda / 14));
  for (let k = 0; k < cortes.length; k += lado * lado) {
    const grupo = cortes.slice(k, k + lado * lado);
    const hoja = lienzo(celda * lado, celda * lado);
    const ctx = hoja.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, hoja.width, hoja.height);
    ctx.font = `bold ${fuenteTxt}px Arial`;
    ctx.textBaseline = "top";
    for (let j = 0; j < grupo.length; j++) {
      const im = await createImageBitmap(grupo[j].blob);
      const x = (j % lado) * celda, y = Math.floor(j / lado) * celda;
      ctx.drawImage(im, x + Math.floor((celda - im.width) / 2), y + Math.floor((celda - im.height) / 2));
      im.close();
      ctx.strokeStyle = "rgb(90,90,90)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, celda - 1, celda - 1);
      ctx.lineWidth = Math.max(3, fuenteTxt / 6);
      ctx.strokeStyle = "#000";
      ctx.strokeText(String(k + j + 1), x + 8, y + 6);
      ctx.fillStyle = "#fff";
      ctx.fillText(String(k + j + 1), x + 8, y + 6);
    }
    const a = String(k + 1).padStart(4, "0"), b = String(k + grupo.length).padStart(4, "0");
    yield { etiqueta: `mosaico_cortes_${a}-${b}`, lienzo: hoja };
  }
}

// Las fotos conservan una página completa; solo video/DICOM usa mosaicos.
async function* fuenteEstudio(rutas, lado, maxImgs) {
  let pendientes = [];
  const bloque = () => (lado > 1 ? mosaicos(recolectar(pendientes), lado, maxImgs) : recolectar(pendientes));
  for (const r of rutas) {
    if (r.tipo === "imagen") {
      if (pendientes.length) { yield* bloque(); pendientes = []; }
      const bmp = await abrirImagen(r.archivo);
      yield { etiqueta: base(r.archivo.name), lienzo: bmp };
    } else pendientes.push(r);
  }
  if (pendientes.length) yield* bloque();
}

// Si una sola página fuera enorme, baja la calidad hasta que quepa holgadamente.
async function ajustarPeso(c, datos) {
  const tope = LIMITE_PDF_BYTES / 4;
  if (datos.length <= tope) return { datos, c };
  for (const q of [0.82, 0.75, 0.68, 0.6]) {
    datos = await aJpg(c, q);
    if (datos.length <= tope) return { datos, c };
  }
  for (;;) {
    c = escalar(c, Math.floor(Math.max(c.width, c.height) * 0.8));
    datos = await aJpg(c, 0.75);
    if (datos.length <= tope) return { datos, c };
  }
}

// ---------------------------------------------------------------- conversión
function nombreSeguro(texto) {
  // Chrome no acepta tildes en las carpetas de descarga: María López -> Maria_Lopez
  const n = texto.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_\-.()]/g, "_").replace(/^[._]+|[._]+$/g, "");
  return n || "Estudio";
}

async function descargar(blob, ruta) {
  const url = URL.createObjectURL(blob);
  try {
    if (globalThis.chrome && chrome.downloads) {
      const id = await chrome.downloads.download({ url, filename: ruta, conflictAction: "uniquify", saveAs: false });
      await new Promise((ok) => {
        const oir = (d) => {
          if (d.id === id && d.state && d.state.current !== "in_progress") { chrome.downloads.onChanged.removeListener(oir); ok(); }
        };
        chrome.downloads.onChanged.addListener(oir);
        chrome.downloads.search({ id }).then(([d]) => { if (d && d.state !== "in_progress") { chrome.downloads.onChanged.removeListener(oir); ok(); } });
      });
      return id;
    }
    const a = document.createElement("a");    // abierto fuera de la extensión (pruebas)
    a.href = url; a.download = ruta.replace(/\//g, "_");
    document.body.appendChild(a); a.click(); a.remove();
    await new Promise((ok) => setTimeout(ok, 300));
    return null;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}

async function convertir() {
  if (trabajando) return;
  if (!elementos.length) { alert("Agregue los videos o JPG antes de convertir."); return; }
  const limite = parseInt($("limite").value, 10);
  if (!(limite >= 1 && limite <= 100)) { alert("Indique entre 1 y 100 mosaicos."); return; }
  const lado = parseInt($("mosaico").value, 10);

  // Se expanden las carpetas y se quitan repetidos sin cambiar el orden.
  const rutas = [], vistas = new Set();
  for (const x of elementos) {
    for (const f of x.archivos) {
      const k = claveArchivo(f);
      if (vistas.has(k)) continue;
      vistas.add(k);
      rutas.push({ archivo: f, tipo: x.tipo === "dicom" ? "dicom" : clase(f.webkitRelativePath || f.name) });
    }
  }
  const nombre = nombreSeguro($("paciente").value || base(elementos[0].nombre));
  const carpeta = `${nombre}_PARA_CLAUDE`;
  const originalMb = rutas.reduce((s, r) => s + r.archivo.size, 0) / 1e6;

  bloquear(true);
  $("registro").textContent = "";
  ultimaDescarga = null;
  $("btnAbrir").disabled = true;
  escribir(`Procesando ${elementos.length} elementos de la lista (${rutas.length} archivos).\n\n`);
  try {
    const paginas = [];
    let totalBytes = 0;
    for await (const { lienzo: c0 } of fuenteEstudio(rutas, lado, limite)) {
      let c = escalar(c0, LADO_MAX);
      if (c0.close) c0.close();
      let datos = await aJpg(c);
      ({ datos, c } = await ajustarPeso(c, datos));
      paginas.push({ datos, ancho: c.width, alto: c.height });
      totalBytes += datos.length;
      $("progreso").removeAttribute("value");
    }
    if (!paginas.length) throw new Error("No se encontraron videos, imágenes ni DICOM válidos.");

    const partes = dividirPdf(paginas);
    const lineas = [];
    for (let i = 0; i < partes.length; i++) {
      const nom = partes.length === 1 ? `${nombre}_Estudio.pdf` : `${nombre}_parte${i + 1}_de_${partes.length}.pdf`;
      const pdf = construirPdf(partes[i]);
      if (pdf.size >= 40e6) throw new Error("Error interno: un PDF superó 40 MB.");
      const id = await descargar(pdf, `${carpeta}/${nom}`);
      if (id !== null && ultimaDescarga === null) ultimaDescarga = id;
      lineas.push(`  ${nom}: ${partes[i].length} páginas | ${mb(pdf.size)}`);
    }
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString("es-NI", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " " + ahora.toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit", hour12: true });
    const raya = "=".repeat(62);
    const reporte = [
      raya, ` RESUMEN - ${nombre.replace(/_/g, " ")}   (${fecha})`, raya,
      `  Tamaño original del estudio : ${originalMb.toFixed(2).padStart(8)} MB`,
      `  Páginas generadas           : ${String(paginas.length).padStart(8)}`,
      `  Tamaño total para enviar    : ${(totalBytes / 1e6).toFixed(2).padStart(8)} MB`,
      "  ENVÍE A CLAUDE EL/LOS ARCHIVO(S) PDF:",
      ...lineas, "",
      "  Fotos: una página grande por imagen, a color. Video/DICOM: mosaicos numerados.",
      "  Cada PDF queda siempre por debajo de 40 MB; envíe todas las partes.",
      `\n  Carpeta: Descargas/${carpeta}`, raya,
    ].join("\n");
    await descargar(new Blob([reporte], { type: "text/plain;charset=utf-8" }), `${carpeta}/RESUMEN.txt`);
    escribir("\n" + reporte + "\n");
    $("btnAbrir").disabled = ultimaDescarga === null;
    alert("PDF listo.\n\nLos archivos están en Descargas, carpeta " + carpeta + ".");
  } catch (e) {
    escribir(`\nNo se completó: ${e.message}\n`);
    alert("No se completó:\n" + e.message);
  } finally {
    bloquear(false);
  }
}

// ---------------------------------------------------------------- interfaz
function escribir(t) {
  const r = $("registro");
  r.textContent += t;
  r.scrollTop = r.scrollHeight;
}
function progresoParcial(a, b) {
  const p = $("progreso");
  p.max = b; p.value = a;
}
function bloquear(si) {
  trabajando = si;
  document.querySelectorAll("button, input, select").forEach((el) => { if (el.id !== "btnAbrir") el.disabled = si; });
  $("btnConvertir").textContent = si ? "Convirtiendo todos los archivos..." : "3. CONVERTIR TODOS LOS ARCHIVOS A PDF";
  $("progreso").hidden = !si;
}

function iniciar() {
  const abrir = (id) => () => { if (!trabajando) $(id).click(); };
  $("btnVideos").onclick = abrir("selVideos");
  $("btnImagenes").onclick = abrir("selImagenes");
  $("btnDicom").onclick = abrir("selDicom");
  $("btnCarpeta").onclick = abrir("selCarpeta");
  $("selVideos").onchange = (e) => { agregarArchivos([...e.target.files]); e.target.value = ""; };
  $("selImagenes").onchange = (e) => { agregarArchivos([...e.target.files]); e.target.value = ""; };
  $("selDicom").onchange = (e) => { agregarArchivos([...e.target.files], true); e.target.value = ""; };
  $("selCarpeta").onchange = (e) => {
    const fs = [...e.target.files];
    if (fs.length) agregarCarpeta((fs[0].webkitRelativePath || "").split("/")[0] || "Carpeta", fs);
    e.target.value = "";
  };
  $("btnQuitar").onclick = () => {
    if (trabajando) return;
    [...seleccion].sort((a, b) => b - a).forEach((i) => elementos.splice(i, 1));
    seleccion.clear(); actualizar();
  };
  $("btnVaciar").onclick = () => { if (!trabajando) { elementos.length = 0; seleccion.clear(); actualizar(); } };
  $("btnSubir").onclick = () => mover(-1);
  $("btnBajar").onclick = () => mover(1);
  $("btnConvertir").onclick = convertir;
  $("btnAbrir").onclick = () => { if (ultimaDescarga !== null) chrome.downloads.show(ultimaDescarga); };

  const zona = $("zona");
  zona.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("encima"); });
  zona.addEventListener("dragleave", () => zona.classList.remove("encima"));
  zona.addEventListener("drop", async (e) => {
    e.preventDefault();
    zona.classList.remove("encima");
    if (trabajando) return;
    const entradas = [...e.dataTransfer.items].map((it) => it.webkitGetAsEntry && it.webkitGetAsEntry()).filter(Boolean);
    const sueltos = [];
    for (const en of entradas) {
      if (en.isDirectory) agregarCarpeta(en.name, await leerEntrada(en));
      else sueltos.push(...(await leerEntrada(en)));
    }
    if (sueltos.length) agregarArchivos(sueltos);
  });
  window.addEventListener("beforeunload", (e) => { if (trabajando) { e.preventDefault(); e.returnValue = ""; } });
  actualizar();
}

if (typeof document !== "undefined") iniciar();
