// ====== Archivo de pacientes: carpeta de trabajo (memoria USB) ======
// Estructura creada en la carpeta elegida:
//   Pacientes/<Nombre_Apellidos>/<AAAA-MM-DD>_<Estudio>.docx
//   registro.json   (lista de todos los estudios)
//   config.json     (logos y firma)
const quitarAcentos = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const carpetaPaciente = nombre => quitarAcentos(nombre).replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/)
  .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("_");

// --- guardar el "permiso" de la carpeta entre sesiones (IndexedDB)
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

const Almacen = {
  dir: null, reg: [],
  soportado: "showDirectoryPicker" in window,

  local() { try { return JSON.parse(localStorage.getItem("registroEstudios")) || []; } catch { return []; } },
  lista() { return this.dir ? this.reg : this.local(); },

  async init() {
    const h = await idbGet("carpeta");
    if (h && (await h.queryPermission({ mode: "readwrite" })) === "granted") await this.conectar(h);
    else { this.estado(h ? "reconectar" : "sin"); renderPacientes(); }
  },
  async elegir() {
    if (!this.soportado) return alert("Este navegador no permite elegir carpetas. Use Google Chrome o Microsoft Edge.");
    let h; try { h = await showDirectoryPicker({ id: "radsuite", mode: "readwrite" }); } catch { return; }
    await idbSet("carpeta", h); await this.conectar(h);
  },
  async reconectar() {
    const h = await idbGet("carpeta"); if (!h) return this.elegir();
    try { if ((await h.requestPermission({ mode: "readwrite" })) === "granted") await this.conectar(h); }
    catch { alert("No se encontró la carpeta. ¿Está conectada la memoria USB? Si cambió de memoria, use «Elegir carpeta»."); }
  },
  async desconectar() { this.dir = null; this.reg = []; await idbDel("carpeta"); this.estado("sin"); refrescarTodo(); },

  async conectar(h) {
    this.dir = h;
    this.reg = JSON.parse(await leerTexto(h, "registro.json") || "[]");
    // pasar a la carpeta lo que estaba guardado en el navegador, y borrarlo de la PC
    const loc = this.local();
    if (loc.length) {
      const clave = r => [r.fecha, r.hora, r.paciente, r.estudio].join("|"); const ya = new Set(this.reg.map(clave));
      loc.forEach(r => { if (!ya.has(clave(r))) this.reg.push({ ...r, carpeta: carpetaPaciente(r.paciente) }); });
      await this.guardarRegistro(); try { localStorage.removeItem("registroEstudios"); } catch {}
    }
    // logos: si la PC no los tiene, tomarlos de la carpeta; si la carpeta no los tiene, copiarlos a ella
    const cfg = JSON.parse(await leerTexto(h, "config.json") || "{}"); let cambio = false;
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
    await escribir(this.dir, "config.json", JSON.stringify(cfg));
  },
  async guardarRegistro() {
    await escribir(this.dir, "registro.json", JSON.stringify(this.reg, null, 1));
    // copia en formato Excel (CSV) siempre actualizada
    const cols = ["fecha", "hora", "paciente", "edad", "sexo", "medico", "procedencia", "estudio", "diagnostico", "ruta"];
    await escribir(this.dir, "Registro_Pacientes.csv", "﻿" + cols.join(";") + "\n" + this.reg.map(r => cols.map(c => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(";")).join("\n"));
  },

  // guarda un archivo dentro de la carpeta del paciente; devuelve la ruta relativa
  async guardarArchivo(datos, paciente, nombreArchivo) {
    const carpeta = carpetaPaciente(paciente), dir = await subcarpeta(this.dir, ["Pacientes", carpeta]);
    let nom = nombreArchivo;
    if (await existe(dir, nom)) { const i = nom.lastIndexOf("."); let k = 2; while (await existe(dir, `${nom.slice(0, i)}_${k}${nom.slice(i)}`)) k++; nom = `${nom.slice(0, i)}_${k}${nom.slice(i)}`; }
    await escribir(dir, nom, datos);
    return { carpeta, ruta: `Pacientes/${carpeta}/${nom}`, archivo: nom };
  },

  async agregar(r) {
    r.carpeta = r.carpeta || carpetaPaciente(r.paciente);
    if (this.dir) { this.reg.push(r); await this.guardarRegistro(); }
    else { const l = this.local(); l.push(r); try { localStorage.setItem("registroEstudios", JSON.stringify(l)); } catch { alert("No se pudo guardar en el registro."); } }
    refrescarTodo();
  },

  async abrir(ruta) {
    const partes = ruta.split("/"); let dir = this.dir;
    for (const p of partes.slice(0, -1)) dir = await dir.getDirectoryHandle(p);
    const f = await (await dir.getFileHandle(partes.at(-1))).getFile();
    const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },

  estado(e) {
    const s = $("aEstado"); if (!s) return;
    const nombre = this.dir ? this.dir.name : "";
    s.className = "estado " + e;
    s.innerHTML = e === "ok" ? `✅ Carpeta conectada: <b>${esc(nombre)}</b> · ${new Set(this.reg.map(r => r.carpeta)).size} pacientes · ${this.reg.length} estudios`
      : e === "reconectar" ? "🔌 La carpeta de pacientes está desconectada. Conecte la memoria y presione <b>Reconectar</b>."
      : "⚠️ No hay carpeta de pacientes. Los informes se descargan sueltos en Descargas. Presione <b>Elegir carpeta</b> (por ejemplo su memoria USB).";
    $("aReconectar").style.display = e === "reconectar" ? "" : "none";
    $("aDesconectar").style.display = e === "ok" ? "" : "none";
    $("barraCarpeta").innerHTML = e === "ok" ? `📁 ${esc(nombre)}` : `<span style="color:#ffd27a">📁 Sin carpeta</span>`;
  },
};

// ====== pestaña Pacientes ======
function pacientesAgrupados(q = "") {
  const g = {};
  Almacen.lista().forEach(r => {
    const k = r.carpeta || carpetaPaciente(r.paciente);
    (g[k] = g[k] || { nombre: r.paciente, estudios: [] }).estudios.push(r);
  });
  q = quitarAcentos(q.toLowerCase());
  return Object.entries(g).filter(([k, p]) => !q || quitarAcentos(JSON.stringify(p).toLowerCase()).includes(q))
    .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre, "es"));
}
function renderPacientes() {
  const lista = pacientesAgrupados($("aBuscar").value);
  $("aLista").innerHTML = lista.length ? lista.map(([k, p]) => {
    const est = p.estudios.slice().sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
    return `<details class="paciente"><summary><b>${esc(p.nombre)}</b><span>${est.length} estudio(s) · último ${est[0].fecha.split("-").reverse().join("/")}</span></summary>
      <table class="tabla"><tr><th>Fecha</th><th>Estudio</th><th>Diagnóstico principal</th><th></th></tr>${est.map(r => `<tr><td>${r.fecha.split("-").reverse().join("/")}</td><td>${esc(r.estudio)}</td><td>${esc(r.diagnostico || "")}</td>
      <td>${r.ruta && Almacen.dir ? `<button class="sec chico" data-ruta="${esc(r.ruta)}">Abrir</button>` : ""}</td></tr>`).join("")}</table>
      <button class="sec chico" data-nuevo="${esc(p.nombre)}">+ Nuevo estudio para este paciente</button></details>`;
  }).join("") : `<p class="nota">${Almacen.lista().length ? "Sin resultados." : "Todavía no hay pacientes. Genere un informe o importe sus Word anteriores."}</p>`;
}
$("aLista").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.ruta) Almacen.abrir(b.dataset.ruta).catch(() => alert("No se encontró el archivo. ¿Está conectada la memoria?"));
  if (b.dataset.nuevo) {
    const ult = Almacen.lista().filter(r => r.paciente === b.dataset.nuevo).at(-1);
    $("pNombre").value = ult.paciente; $("pEdad").value = ult.edad || ""; $("pSexo").value = ult.sexo || "Femenino";
    document.querySelector('nav button[data-tab="informe"]').click(); historialPaciente(); scrollTo(0, 0);
  }
});

// historial al escribir el nombre en el informe
function historialPaciente() {
  const n = $("pNombre").value.trim(); const box = $("historial");
  if (n.length < 4) return box.innerHTML = "";
  const c = carpetaPaciente(n), prev = Almacen.lista().filter(r => (r.carpeta || carpetaPaciente(r.paciente)) === c);
  box.innerHTML = prev.length ? `📋 <b>Paciente con ${prev.length} estudio(s) previo(s):</b> ` + prev.slice(-5).reverse().map(r =>
    `${r.fecha.split("-").reverse().join("/")} – ${esc(r.estudio)}${r.diagnostico ? ` (${esc(r.diagnostico)})` : ""}`).join(" · ") : "";
}
$("pNombre").addEventListener("change", historialPaciente);
$("pNombre").addEventListener("blur", historialPaciente);

// importar informes anteriores
$("aImportar").addEventListener("change", async e => {
  const files = [...e.target.files]; e.target.value = "";
  if (!Almacen.dir) return alert("Primero elija la carpeta de pacientes.");
  let ok = 0; const raros = [];
  for (const f of files) {
    const base = f.name.replace(/\.[^.]+$/, "");
    const m = base.match(/^(.+?)_((?:US|Doppler|RX|TC|RM|Mamografia)_.+)$/i);
    if (!m) { raros.push(f.name); continue; }
    const paciente = m[1].replace(/_/g, " "), estudio = m[2].replace(/_/g, " ");
    const fecha = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Managua" }).format(new Date(f.lastModified));
    const g = await Almacen.guardarArchivo(f, paciente, `${fecha}_${m[2]}${f.name.slice(base.length)}`);
    Almacen.reg.push({ fecha, hora: "", paciente, edad: "", sexo: "", medico: "", procedencia: "", estudio, diagnostico: "", archivo: g.archivo, ruta: g.ruta, carpeta: g.carpeta, importado: true });
    ok++;
  }
  await Almacen.guardarRegistro(); refrescarTodo();
  alert(`Importados: ${ok}` + (raros.length ? `\n\nNo reconocidos (renómbrelos como Nombre_Apellido_US_Estudio.docx):\n${raros.join("\n")}` : ""));
});

function refrescarTodo() {
  if (Almacen.dir) Almacen.estado("ok");
  renderPacientes(); if (typeof renderRegistro === "function") renderRegistro(); historialPaciente();
}
$("aElegir").addEventListener("click", () => Almacen.elegir());
$("aReconectar").addEventListener("click", () => Almacen.reconectar());
$("aDesconectar").addEventListener("click", () => { if (confirm("¿Desconectar la carpeta de pacientes de esta computadora? Los archivos NO se borran.")) Almacen.desconectar(); });
$("aBuscar").addEventListener("input", renderPacientes);
