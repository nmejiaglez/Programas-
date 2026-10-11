// ====== Archivo de pacientes: carpeta de trabajo (PC o memoria USB) ======
// Estructura creada en la carpeta elegida:
//   Pacientes/<AAAA>/<MM - Mes>/<Nombre_Apellidos>/<AAAA-MM-DD>_<Estudio>.docx
//   registro.json · Registro_Pacientes.csv · config.json (logos)
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const quitarAcentos = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const carpetaPaciente = nombre => quitarAcentos(nombre).replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean)
  .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("_") || "Sin_Nombre";
const nombreMes = ym => { const [y, m] = ym.split("-"); return `${MESES[+m - 1]} ${y}`; };
const fechaLocal = iso => iso ? iso.split("-").reverse().join("/") : "";
const nombreArchivoSeguro = s => quitarAcentos(s).replace(/[^A-Za-z0-9._ -]/g, "").replace(/\s+/g, "_");

// --- recordar la carpeta entre sesiones (IndexedDB)
function idb(modo, fn) {
  return new Promise((ok, mal) => {
    const r = indexedDB.open("radsuite", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onerror = () => mal(r.error);
    r.onsuccess = () => { const tx = r.result.transaction("kv", modo); const q = fn(tx.objectStore("kv")); tx.oncomplete = () => ok(q && q.result); tx.onerror = () => mal(tx.error); };
  });
}
const idbGet = k => idb("readonly", s => s.get(k)).catch(() => null);
const idbSet = (k, v) => idb("readwrite", s => s.put(v, k)).catch(() => null);
const idbDel = k => idb("readwrite", s => s.delete(k)).catch(() => null);

async function subcarpeta(dir, partes) { for (const p of partes) dir = await dir.getDirectoryHandle(p, { create: true }); return dir; }
async function existe(dir, nombre) { try { await dir.getFileHandle(nombre); return true; } catch { return false; } }
async function escribir(dir, nombre, datos) { const f = await dir.getFileHandle(nombre, { create: true }); const w = await f.createWritable(); await w.write(datos); await w.close(); }
async function leerTexto(dir, nombre) { try { return await (await (await dir.getFileHandle(nombre)).getFile()).text(); } catch { return null; } }

function explicarError(e) {
  const n = e && e.name, m = (e && e.message) || String(e);
  if (n === "SecurityError") return "El navegador bloqueó el acceso a carpetas.\n\n• Abra el programa con Google Chrome o Microsoft Edge.\n• Si lo abrió desde dentro del ZIP, descomprímalo primero (clic derecho › Extraer todo).";
  if (n === "NotAllowedError") return "No se dio permiso para usar la carpeta.\n\nVuelva a intentarlo y presione «Permitir» / «Guardar cambios» cuando el navegador lo pregunte.";
  if (n === "NotFoundError") return "No se encontró la carpeta. ¿Está conectada la memoria USB?\nSi cambió de memoria o de carpeta, use «Elegir carpeta de pacientes».";
  if (n === "NoModificationAllowedError" || n === "InvalidModificationError") return "Esa carpeta no permite guardar archivos (puede ser de solo lectura).\n\nCree una carpeta nueva, por ejemplo Documentos › Archivo Pacientes, y elíjala.";
  if (n === "QuotaExceededError") return "No hay espacio suficiente en el disco o la memoria.";
  return "No se pudo usar la carpeta: " + m + "\n\nCree una carpeta nueva (por ejemplo Documentos › Archivo Pacientes) y elíjala. No elija Escritorio, Documentos o Descargas directamente.";
}

const Almacen = {
  dir: null, reg: [],
  soportado: "showDirectoryPicker" in window || !!window.nativo,

  local() { try { return JSON.parse(localStorage.getItem("registroEstudios")) || []; } catch { return []; } },
  guardarLocal(l) { try { localStorage.setItem("registroEstudios", JSON.stringify(l)); return true; } catch { return false; } },
  lista() { return this.dir ? this.reg : this.local(); },

  async init() {
    if (window.nativo) { // programa de escritorio: carpeta automática en Documentos
      try {
        const cfg = await nativo.cfg();
        let p = cfg.carpeta && nativo.esCarpeta(cfg.carpeta) ? cfg.carpeta : nativo.unir(nativo.documentos, "Archivo Pacientes");
        if (!nativo.esCarpeta(p)) { if (cfg.carpeta && cfg.carpeta !== p) alert(`No se encontró la carpeta de pacientes:\n${cfg.carpeta}\n\n¿Está conectada la memoria USB? Mientras tanto se usará Documentos › Archivo Pacientes.`); nativo.crearCarpeta(p); }
        return await this.conectar(new CarpetaNativa(p));
      } catch (e) { alert(explicarError(e)); this.estado("sin"); return refrescarTodo(); }
    }
    try {
      const h = await idbGet("carpeta");
      if (h && (await h.queryPermission({ mode: "readwrite" })) === "granted") return await this.conectar(h);
      this.estado(h ? "reconectar" : "sin");
    } catch { this.estado("sin"); }
    refrescarTodo();
  },
  async elegir() {
    if (!this.soportado) return alert("Este navegador no permite guardar en carpetas.\n\nAbra el programa con Google Chrome o Microsoft Edge.\n\nMientras tanto, los informes se descargan en Descargas y el registro queda en este navegador.");
    let h;
    if (window.nativo) {
      const p = await nativo.elegirCarpeta(); if (!p) return;
      h = new CarpetaNativa(p);
      try { await escribir(h, ".prueba_radsuite", "ok"); await h.removeEntry(".prueba_radsuite"); await this.conectar(h); await nativo.guardarCfg({ carpeta: p });
        avisar(`✅ Ahora sus pacientes se guardan en <b>${esc(p)}</b>`); } catch (e) { alert(explicarError(e)); }
      return;
    }
    try { h = await showDirectoryPicker({ id: "radsuite", mode: "readwrite", startIn: "documents" }); }
    catch (e) { if (e.name === "AbortError") return; return alert(explicarError(e)); }
    try {
      // prueba real de escritura antes de aceptar la carpeta
      await escribir(h, ".prueba_radsuite", "ok"); await h.removeEntry(".prueba_radsuite");
      await this.conectar(h); await idbSet("carpeta", h);
      avisar(`✅ Carpeta <b>${esc(h.name)}</b> conectada. Sus pacientes se guardarán ahí.`);
    } catch (e) { this.dir = null; alert(explicarError(e)); this.estado("sin"); }
  },
  async reconectar() {
    const h = await idbGet("carpeta"); if (!h) return this.elegir();
    try { if ((await h.requestPermission({ mode: "readwrite" })) === "granted") await this.conectar(h); else alert(explicarError({ name: "NotAllowedError" })); }
    catch (e) { alert(explicarError(e)); }
  },
  async desconectar() { this.dir = null; this.reg = []; await idbDel("carpeta"); this.estado("sin"); refrescarTodo(); },

  async conectar(h) {
    const reg = JSON.parse(await leerTexto(h, "registro.json") || "[]");
    this.dir = h; this.reg = Array.isArray(reg) ? reg : [];
    // pasar a la carpeta lo que estaba guardado en el navegador, y borrarlo de la PC
    const loc = this.local();
    if (loc.length) {
      const clave = r => [r.fecha, r.hora, r.paciente, r.estudio].join("|"); const ya = new Set(this.reg.map(clave));
      loc.forEach(r => { if (!ya.has(clave(r))) this.reg.push({ ...r, carpeta: carpetaPaciente(r.paciente) }); });
      await this.guardarRegistro(); try { localStorage.removeItem("registroEstudios"); } catch {}
    }
    // logos: si la PC no los tiene, tomarlos de la carpeta; si la carpeta no los tiene, copiarlos a ella
    let cfg = {}; try { cfg = JSON.parse(await leerTexto(h, "config.json") || "{}"); } catch {}
    let cambio = false;
    for (const k of ["logoHosp", "logoNM", "logoFirma"]) {
      const enPC = leer(k);
      if (!enPC && cfg[k]) guardar(k, cfg[k]); else if (enPC && !cfg[k]) { cfg[k] = enPC; cambio = true; }
    }
    if (cambio) await escribir(h, "config.json", JSON.stringify(cfg));
    if (typeof mostrarLogos === "function") mostrarLogos();
    this.estado("ok"); refrescarTodo();
  },
  async guardarLogosEnCarpeta() {
    if (!this.dir) return;
    const cfg = {}; ["logoHosp", "logoNM", "logoFirma"].forEach(k => { const v = leer(k); if (v) cfg[k] = v; });
    try { await escribir(this.dir, "config.json", JSON.stringify(cfg)); } catch {}
  },
  async guardarRegistro() {
    this.reg.sort((a, b) => (a.fecha + (a.hora || "")).localeCompare(b.fecha + (b.hora || "")));
    await escribir(this.dir, "registro.json", JSON.stringify(this.reg, null, 1));
    const cols = ["fecha", "hora", "paciente", "edad", "sexo", "medico", "procedencia", "estudio", "diagnostico", "ruta"];
    await escribir(this.dir, "Registro_Pacientes.csv", "﻿" + cols.join(";") + "\n" + this.reg.map(r => cols.map(c => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(";")).join("\n"));
  },

  // guarda un archivo en Pacientes/AAAA/MM - Mes/Paciente/ ; devuelve la ruta relativa
  async guardarArchivo(datos, paciente, nombreArchivo, fechaIso) {
    const [y, m] = fechaIso.split("-"), carpeta = carpetaPaciente(paciente);
    const partes = ["Pacientes", y, `${m} - ${MESES[+m - 1]}`, carpeta], dir = await subcarpeta(this.dir, partes);
    let nom = nombreArchivoSeguro(nombreArchivo);
    if (await existe(dir, nom)) { const i = nom.lastIndexOf("."); let k = 2; while (await existe(dir, `${nom.slice(0, i)}_${k}${nom.slice(i)}`)) k++; nom = `${nom.slice(0, i)}_${k}${nom.slice(i)}`; }
    await escribir(dir, nom, datos);
    return { carpeta, ruta: [...partes, nom].join("/"), archivo: nom };
  },

  async agregar(r) {
    r.carpeta = r.carpeta || carpetaPaciente(r.paciente);
    if (this.dir) { this.reg.push(r); await this.guardarRegistro(); }
    else { const l = this.local(); l.push(r); if (!this.guardarLocal(l)) alert("No se pudo guardar en el registro."); }
    refrescarTodo();
  },

  async eliminar(idx) { // idx en la lista actual
    const l = this.lista(); const r = l[idx]; if (!r) return;
    l.splice(idx, 1);
    if (this.dir) await this.guardarRegistro(); else this.guardarLocal(l);
    refrescarTodo(); return r;
  },

  async abrir(ruta) {
    if (window.nativo) { const p = nativo.unir(this.dir.p, ...ruta.split("/")); if (!nativo.existe(p)) throw Object.assign(new Error(""), { name: "NotFoundError" }); const r = await nativo.abrir(p); if (r) alert("No se pudo abrir el archivo: " + r); return; }
    const partes = ruta.split("/"); let dir = this.dir;
    for (const p of partes.slice(0, -1)) dir = await dir.getDirectoryHandle(p);
    const f = await (await dir.getFileHandle(partes.at(-1))).getFile();
    const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },

  estado(e) {
    const s = $("aEstado"); if (!s) return;
    const nombre = this.dir ? this.dir.name : "";
    s.className = "estado " + e;
    s.innerHTML = e === "ok" ? `✅ Carpeta de pacientes: <b>${esc(window.nativo ? this.dir.p : nombre)}</b> · ${new Set(this.reg.map(r => r.carpeta)).size} pacientes · ${this.reg.length} estudios`
      : e === "reconectar" ? "🔌 La carpeta de pacientes está desconectada. Conecte la memoria (si la usa) y presione <b>Reconectar</b>."
      : "⚠️ Todavía no hay carpeta de pacientes. Puede trabajar igual: los informes se descargan en Descargas y el registro queda en este navegador. Para ordenarlos por paciente y por mes, presione <b>Elegir carpeta de pacientes</b>.";
    $("aReconectar").style.display = e === "reconectar" ? "" : "none";
    $("aDesconectar").style.display = e === "ok" && !window.nativo ? "" : "none";
    $("aVerCarpeta").style.display = e === "ok" && window.nativo ? "" : "none";
    $("barraCarpeta").innerHTML = e === "ok" ? `📁 ${esc(nombre)}` : `<span style="color:#ffd27a">📁 Sin carpeta</span>`;
  },
};

// ====== Agregar pacientes (formulario manual) ======
$("nProc").innerHTML = PROCEDENCIAS.map(p => `<option>${p}</option>`).join("");
$("listaEstudios").innerHTML = Object.keys(ESTUDIOS).concat(["Radiografía", "Mamografía", "Tomografía", "Resonancia magnética", "US Doppler arterial", "US Doppler carotídeo", "US testicular", "US de partes blandas"]).map(e => `<option value="${e}">`).join("");
$("nFecha").value = ahoraManagua().iso;
$("nGuardar").addEventListener("click", async () => {
  const nombre = $("nNombre").value.trim(), fecha = $("nFecha").value, estudio = $("nEstudio").value.trim() || "Estudio";
  if (!nombre) { alert("Escriba el nombre del paciente."); return $("nNombre").focus(); }
  if (!fecha) { alert("Elija la fecha del estudio."); return $("nFecha").focus(); }
  const archivos = [...$("nArchivos").files];
  if (archivos.length && !Almacen.dir && !confirm("No hay carpeta de pacientes conectada: el paciente se registrará, pero los archivos adjuntos NO se guardarán.\n\n¿Continuar?")) return;
  const base = { fecha, hora: "", paciente: nombre, edad: $("nEdad").value.trim(), sexo: $("nSexo").value, medico: $("nMedico").value.trim(),
    procedencia: $("nProc").value, estudio, diagnostico: $("nDx").value.trim(), manual: true };
  try {
    if (Almacen.dir && archivos.length) {
      for (const [i, f] of archivos.entries()) {
        const ext = f.name.includes(".") ? f.name.slice(f.name.lastIndexOf(".")) : "";
        const g = await Almacen.guardarArchivo(f, nombre, `${fecha}_${estudio}${archivos.length > 1 ? "_" + (i + 1) : ""}${ext}`, fecha);
        if (i === 0) Object.assign(base, g); else (base.extras = base.extras || []).push(g.ruta);
      }
    }
    await Almacen.agregar(base);
  } catch (e) { return alert(explicarError(e)); }
  $("nMsg").innerHTML = `✅ ${esc(nombre)} guardado (${fechaLocal(fecha)} · ${esc(estudio)}). Escriba el siguiente.`;
  ["nNombre", "nEdad", "nDx"].forEach(i => $(i).value = ""); $("nArchivos").value = ""; $("nNombre").focus();
});
$("nNombre").addEventListener("keydown", e => { if (e.key === "Enter") $("nGuardar").click(); });

// ====== Importar varios ======
$("iModoFecha").addEventListener("change", () => { $("iFechaL").style.display = $("iModoFecha").value === "fija" ? "" : "none"; if (!$("iFecha").value) $("iFecha").value = ahoraManagua().iso; });
$("aImportar").addEventListener("change", async e => {
  const files = [...e.target.files]; e.target.value = "";
  if (!files.length) return;
  if (!Almacen.dir) return alert("Primero elija la carpeta de pacientes (arriba). Sin carpeta no hay dónde guardar los archivos.");
  const fija = $("iModoFecha").value === "fija" ? $("iFecha").value : null;
  let ok = 0, omitidos = 0;
  try {
    for (const f of files) {
      const base = f.name.replace(/\.[^.]+$/, ""), ext = f.name.slice(base.length);
      const m = base.match(/^(.+?)_((?:US|Doppler|RX|TC|RM|Mamografia|Rx|Tc|Rm)_.+)$/);
      let paciente, estudio, etiqueta;
      if (m) { paciente = m[1].replace(/_/g, " "); estudio = m[2].replace(/_/g, " "); etiqueta = m[2]; }
      else {
        paciente = prompt(`No reconozco el paciente en el archivo:\n«${f.name}»\n\nEscriba el nombre del paciente (o deje vacío para omitirlo):`, base.replace(/[_-]+/g, " "));
        if (!paciente || !paciente.trim()) { omitidos++; continue; }
        estudio = prompt(`Estudio de «${f.name}»:`, "Ultrasonido") || "Estudio"; etiqueta = estudio;
      }
      const fecha = fija || new Intl.DateTimeFormat("en-CA", { timeZone: "America/Managua" }).format(new Date(f.lastModified));
      const g = await Almacen.guardarArchivo(f, paciente.trim(), `${fecha}_${etiqueta}${ext}`, fecha);
      Almacen.reg.push({ fecha, hora: "", paciente: paciente.trim(), edad: "", sexo: "", medico: "", procedencia: "", estudio, diagnostico: "", ...g, importado: true });
      ok++;
    }
  } catch (err) { alert(explicarError(err)); }
  await Almacen.guardarRegistro(); refrescarTodo();
  alert(`Importados: ${ok}${omitidos ? `\nOmitidos: ${omitidos}` : ""}`);
});

// ====== Mis pacientes: por mes ======
function renderMeses() {
  const sel = $("aMes"), actual = sel.value;
  const meses = [...new Set(Almacen.lista().map(r => r.fecha.slice(0, 7)))].sort().reverse();
  sel.innerHTML = `<option value="">Todos los meses</option>` + meses.map(m => `<option value="${m}">${nombreMes(m)} (${Almacen.lista().filter(r => r.fecha.startsWith(m)).length})</option>`).join("");
  if ([...sel.options].some(o => o.value === actual)) sel.value = actual;
}
function renderPacientes() {
  renderMeses();
  const lista = Almacen.lista(), mes = $("aMes").value, q = quitarAcentos($("aBuscar").value.toLowerCase());
  const items = lista.map((r, i) => ({ r, i })).filter(({ r }) => (!mes || r.fecha.startsWith(mes)) && (!q || quitarAcentos(Object.values(r).join(" ").toLowerCase()).includes(q)));
  $("aResumen").textContent = items.length ? `${items.length} estudio(s) · ${new Set(items.map(x => x.r.carpeta || carpetaPaciente(x.r.paciente))).size} paciente(s)` : "";
  if (!items.length) return $("aLista").innerHTML = `<p class="nota">${lista.length ? "Sin resultados para ese mes o búsqueda." : "Todavía no hay pacientes. Genere un informe, agréguelos arriba o importe sus Word anteriores."}</p>`;
  // agrupar por mes, y dentro por paciente
  const porMes = {};
  items.forEach(x => { const m = x.r.fecha.slice(0, 7), k = x.r.carpeta || carpetaPaciente(x.r.paciente);
    ((porMes[m] = porMes[m] || {})[k] = porMes[m][k] || { nombre: x.r.paciente, est: [] }).est.push(x); });
  $("aLista").innerHTML = Object.keys(porMes).sort().reverse().map(m => {
    const pacs = Object.values(porMes[m]).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return `<div class="mes-titulo">📅 ${nombreMes(m)} · ${pacs.length} paciente(s)</div>` + pacs.map(p => {
      const est = p.est.sort((a, b) => (b.r.fecha + b.r.hora).localeCompare(a.r.fecha + a.r.hora));
      const total = lista.filter(r => (r.carpeta || carpetaPaciente(r.paciente)) === carpetaPaciente(p.nombre)).length;
      return `<details class="paciente"><summary><b>${esc(p.nombre)}</b><span>${est.length} estudio(s) este mes${total > est.length ? ` · ${total} en total` : ""}</span></summary>
        <table class="tabla"><tr><th>Fecha</th><th>Estudio</th><th>Diagnóstico principal</th><th></th></tr>${est.map(({ r, i }) => `<tr><td>${fechaLocal(r.fecha)}</td><td>${esc(r.estudio)}</td><td>${esc(r.diagnostico || "")}</td>
        <td style="white-space:nowrap">${r.ruta && Almacen.dir ? `<button class="sec chico" data-ruta="${esc(r.ruta)}">Abrir</button> ` : ""}${(r.extras || []).map((x, k) => Almacen.dir ? `<button class="sec chico" data-ruta="${esc(x)}">Archivo ${k + 2}</button> ` : "").join("")}<button class="peligro chico" data-borrar="${i}" title="Quitar del registro">✕</button></td></tr>`).join("")}</table>
        <button class="sec chico" data-nuevo="${esc(p.nombre)}">+ Nuevo informe para este paciente</button></details>`;
    }).join("");
  }).join("");
}
$("aLista").addEventListener("click", async e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.ruta) Almacen.abrir(b.dataset.ruta).catch(err => alert(explicarError(err)));
  if (b.dataset.borrar) {
    const r = Almacen.lista()[+b.dataset.borrar];
    if (r && confirm(`¿Quitar del registro el estudio de ${r.paciente} del ${fechaLocal(r.fecha)}?\n\n(El archivo Word NO se borra de la carpeta.)`)) await Almacen.eliminar(+b.dataset.borrar);
  }
  if (b.dataset.nuevo) {
    const ult = Almacen.lista().filter(r => r.paciente === b.dataset.nuevo).at(-1);
    $("pNombre").value = ult.paciente; $("pEdad").value = ult.edad || ""; if (ult.sexo) $("pSexo").value = ult.sexo;
    document.querySelector('nav button[data-tab="informe"]').click(); historialPaciente(); scrollTo(0, 0);
  }
});

// historial al escribir el nombre en el informe
function historialPaciente() {
  const n = $("pNombre").value.trim(); const box = $("historial");
  if (n.length < 4) return box.innerHTML = "";
  const c = carpetaPaciente(n), prev = Almacen.lista().filter(r => (r.carpeta || carpetaPaciente(r.paciente)) === c);
  box.innerHTML = prev.length ? `📋 <b>Paciente con ${prev.length} estudio(s) previo(s):</b> ` + prev.slice(-5).reverse().map(r =>
    `${fechaLocal(r.fecha)} – ${esc(r.estudio)}${r.diagnostico ? ` (${esc(r.diagnostico)})` : ""}`).join(" · ") : "";
}
$("pNombre").addEventListener("change", historialPaciente);
$("pNombre").addEventListener("blur", historialPaciente);

function refrescarTodo() {
  if (Almacen.dir) Almacen.estado("ok");
  renderPacientes(); if (typeof renderRegistro === "function") renderRegistro(); historialPaciente();
}
$("aElegir").addEventListener("click", () => Almacen.elegir());
$("aReconectar").addEventListener("click", () => Almacen.reconectar());
$("aDesconectar").addEventListener("click", () => { if (confirm("¿Desconectar la carpeta de pacientes de esta computadora? Los archivos NO se borran.")) Almacen.desconectar(); });
$("aBuscar").addEventListener("input", renderPacientes);
$("aMes").addEventListener("change", renderPacientes);

$("aVerCarpeta").addEventListener("click", () => { if (window.nativo && Almacen.dir) nativo.abrir(Almacen.dir.p); });
if (window.nativo) { $("aElegir").textContent = "📁 Cambiar carpeta (por ejemplo, memoria USB)"; document.querySelector("details.ayuda").style.display = "none"; }
