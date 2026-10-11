// ====== navegación ======
document.querySelectorAll("nav button").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll("nav button, .tab").forEach(e => e.classList.remove("activo"));
  b.classList.add("activo"); $(b.dataset.tab).classList.add("activo");
}));

const AZUL = "1F3864";
const guardar = (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };
const leer = k => { try { return localStorage.getItem(k); } catch { return null; } };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ====== formulario ======
$("pProc").innerHTML = PROCEDENCIAS.map(p => `<option>${p}</option>`).join("");
$("pEstudio").innerHTML = Object.keys(ESTUDIOS).map(p => `<option>${p}</option>`).join("");

let organos = [], medidas = [];
function seccionesActuales() { return ESTUDIOS[$("pEstudio").value].map(k => SEC[k]); }

function renderFormulario() {
  organos = []; medidas = [];
  let h = "";
  seccionesActuales().forEach(sec => {
    h += `<h3>${sec.t}</h3>`;
    sec.o.forEach(([nombre, ops]) => {
      const i = organos.length; organos.push({ nombre, ops, sec: sec.t });
      h += `<div class="organo" id="org${i}"><b>${nombre}</b><div class="ctrl">
        <select data-i="${i}" class="selOrg">${ops.map((o, j) => `<option value="${j}">${esc(o[0])}</option>`).join("")}</select>
        <input data-i="${i}" class="comOrg" placeholder="Comentario adicional (opcional)"></div></div>`;
    });
    sec.m.forEach(m => medidas.push({ ...m }));
  });
  $("hallazgos").innerHTML = h;
  document.querySelectorAll(".selOrg").forEach(s => s.addEventListener("change", () => {
    $("org" + s.dataset.i).classList.toggle("alterado", s.value !== "0"); generarConclusiones();
  }));
  renderMedidas(); generarConclusiones();
}

function renderMedidas() {
  $("medidas").innerHTML = `<tr><th>Estructura</th><th>Medidas</th><th>Unidad</th><th>Volumen</th></tr>` + medidas.map((m, i) => {
    const nombre = m.custom ? `<input class="mNom" data-i="${i}" value="${esc(m.n)}" placeholder="Estructura">` : m.n;
    const campos = m.t === 3
      ? ["L", "AP", "T"].map((x, k) => `<input class="mVal" data-i="${i}" data-k="${k}" placeholder="${x}" value="${(m.v || [])[k] ?? ""}" style="width:31%">`).join(" ")
      : `<input class="mVal" data-i="${i}" data-k="0" value="${(m.v || [])[0] ?? ""}">`;
    return `<tr><td>${nombre}</td><td>${campos}</td><td>${m.u}</td><td id="vol${i}">${m.t === 3 ? "—" : ""}</td></tr>`;
  }).join("");
  document.querySelectorAll(".mVal").forEach(e => e.addEventListener("input", () => {
    const m = medidas[e.dataset.i]; m.v = m.v || []; m.v[e.dataset.k] = e.value; actualizarVol(+e.dataset.i);
    if (esObst()) generarConclusiones();
  }));
  document.querySelectorAll(".mNom").forEach(e => e.addEventListener("input", () => medidas[e.dataset.i].n = e.value));
  medidas.forEach((_, i) => actualizarVol(i));
}
function volDe(m) { if (m.t !== 3 || !m.v) return null; const v = m.v.map(num); return v.length === 3 && v.every(x => x) ? volumen(...v) : null; }
function actualizarVol(i) { const v = volDe(medidas[i]); if (medidas[i].t === 3) $("vol" + i).textContent = v ? fmt(v) + " cm³" : "—"; }

$("btnFila").addEventListener("click", () => {
  const tres = confirm("¿La estructura tiene tres medidas ortogonales (L × AP × T)?\nAceptar = sí (calcula volumen) · Cancelar = una sola medida");
  medidas.push({ n: "", t: tres ? 3 : 1, u: tres ? "cm" : "mm", custom: true }); renderMedidas();
});

const esObst = () => ESTUDIOS[$("pEstudio").value].includes("obst");
function obstDesdeMedidas() {
  const g = n => { const m = medidas.find(x => x.n === n); return m && m.v ? num(m.v[0]) : null; };
  return obstCalc({ LCC: g("LCC"), DBP: g("DBP"), CC: g("CC"), CA: g("CA"), LF: g("LF") });
}

function generarConclusiones() {
  const out = [];
  if (esObst()) {
    const r = obstDesdeMedidas(); const f = organos.find(o => o.nombre === "FETO");
    if (r) out.push(`Embarazo de ${r.egTxt} por biometría${r.pfe ? `, con peso fetal estimado de ${Math.round(r.pfe)} g (percentil ${r.pct})` : ""}. FPP por biometría: ${r.fpp}.`);
  }
  organos.forEach((o, i) => { const sel = document.querySelector(`.selOrg[data-i="${i}"]`); const c = o.ops[sel.value][1]; if (c && !out.includes(c)) out.push(c); });
  if (!out.length) out.push(`${$("pEstudio").value.replace(/^US/, "Ultrasonido")} sin alteraciones estructurales demostrables.`);
  $("conclusiones").value = out.join("\n");
}
$("btnConc").addEventListener("click", generarConclusiones);
$("pEstudio").addEventListener("change", renderFormulario);
$("pSexo").addEventListener("change", () => {
  const e = $("pEstudio").value, s = $("pSexo").value;
  if (s === "Masculino" && e === "US general femenino") { $("pEstudio").value = "US general masculino"; renderFormulario(); }
  if (s === "Femenino" && e === "US general masculino") { $("pEstudio").value = "US general femenino"; renderFormulario(); }
});
$("chkRec").addEventListener("change", e => $("recomendaciones").classList.toggle("oculto", !e.target.checked));
$("btnLimpiar").addEventListener("click", () => {
  if (!confirm("¿Limpiar el formulario para un nuevo paciente?")) return;
  ["pNombre", "pEdad", "pMedico", "pIndicacion", "etiologia", "recomendaciones"].forEach(i => $(i).value = "");
  $("chkRec").checked = false; $("recomendaciones").classList.add("oculto"); $("historial").innerHTML = ""; renderFormulario(); scrollTo(0, 0);
});
renderFormulario();

// ====== logos ======
const mostradores = [];
function mostrarLogos() { mostradores.forEach(f => f()); }
function logoInput(inp, prev, clave) {
  const mostrar = () => { const d = leer(clave); $(prev).src = d || ""; $(prev).style.display = d ? "block" : "none"; }; mostradores.push(mostrar);
  $(inp).addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => { if (!guardar(clave, r.result)) alert("La imagen es demasiado grande para guardarla. Use una imagen de menos de 1.5 MB."); mostrar(); Almacen.guardarLogosEnCarpeta(); };
    r.readAsDataURL(f);
  }); mostrar();
}
logoInput("logoHosp", "prevHosp", "logoHosp"); logoInput("logoNM", "prevNM", "logoNM"); logoInput("logoFirma", "prevFirma", "logoFirma");
$("btnQuitarLogos").addEventListener("click", async () => { ["logoHosp", "logoNM", "logoFirma"].forEach(k => { try { localStorage.removeItem(k); } catch {} }); await Almacen.guardarLogosEnCarpeta(); mostrarLogos(); });

async function imagen(clave, maxW, maxH) {
  const d = leer(clave); if (!d) return null;
  const img = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = d; });
  // dibujar en canvas → PNG (evita formatos no soportados por Word)
  const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext("2d").drawImage(img, 0, 0);
  const bin = atob(c.toDataURL("image/png").split(",")[1]); const data = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
  const k = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight); // conserva proporción
  return new docx.ImageRun({ data, transformation: { width: Math.round(img.naturalWidth * k), height: Math.round(img.naturalHeight * k) } });
}

// ====== Word ======
const D = docx;
const T = (text, o = {}) => new D.TextRun({ text, font: "Arial", size: o.size || 22, bold: o.bold, color: o.color, italics: o.it, break: o.br });
const P = (runs, o = {}) => new D.Paragraph({ children: Array.isArray(runs) ? runs : [runs], alignment: o.al, spacing: { after: o.after ?? 60, before: o.before ?? 0, line: o.line }, border: o.border, keepNext: o.keepNext });
const titulo = t => P(T(t, { bold: true, color: AZUL, size: 24 }), { before: 160, after: 80, keepNext: true, border: { bottom: { style: D.BorderStyle.SINGLE, size: 8, color: AZUL, space: 1 } } });
const SIN = { style: D.BorderStyle.NONE, size: 0, color: "FFFFFF" };
const sinBordes = { top: SIN, bottom: SIN, left: SIN, right: SIN, insideHorizontal: SIN, insideVertical: SIN };

function parrafoOrgano(o, i) {
  const sel = document.querySelector(`.selOrg[data-i="${i}"]`).value, com = document.querySelector(`.comOrg[data-i="${i}"]`).value.trim();
  let txt = o.ops[sel][0]; if (com) txt += " " + (/[.]$/.test(com) ? com : com + ".");
  return { len: o.nombre.length + txt.length, p: P([T(o.nombre + ": ", { bold: true, color: AZUL }), T(txt)], { al: D.AlignmentType.JUSTIFIED }) };
}

function tablaMedidas() {
  const filas = medidas.filter(m => m.v && m.v.some(x => x && String(x).trim()) && m.n);
  if (!filas.length) return null;
  const W = [4200, 3200, 3040];
  const celda = (t, w, o = {}) => new D.TableCell({ width: { size: w, type: D.WidthType.DXA }, columnSpan: o.span, shading: o.fill ? { type: D.ShadingType.CLEAR, fill: o.fill, color: "auto" } : undefined,
    margins: { top: 40, bottom: 40, left: 90, right: 90 }, children: [P(T(t, { bold: o.bold, color: o.color }), { after: 0 })] });
  const rows = [new D.TableRow({ tableHeader: true, children: ["Estructura", "Medidas", "Volumen"].map((h, k) => celda(h, W[k], { bold: true, color: "FFFFFF", fill: AZUL })) })];
  filas.forEach((m, i) => {
    const vals = m.t === 3 ? m.v.map(x => (x ?? "").trim()).filter(Boolean).join(" × ") : String(m.v[0]).trim();
    const v = volDe(m), fill = i % 2 ? "F2F5FA" : undefined;
    rows.push(new D.TableRow({ cantSplit: true, children: [celda(m.n, W[0], { fill }), celda(`${vals} ${m.u}`, W[1], { fill }), celda(v ? `Volumen: ${fmt(v)} cm³${/pr[óo]stata/i.test(m.n) ? ` (peso estimado ${fmt(v * 1.05)} g)` : ""}` : "—", W[2], { fill })] }));
  });
  if (esObst()) { const r = obstDesdeMedidas(); if (r) {
    const extra = [["EG biométrica", r.egTxt], ["FPP por biometría", r.fpp]]; if (r.pfe) extra.push(["PFE (Hadlock)", `${Math.round(r.pfe)} g · percentil ${r.pct}`]);
    extra.forEach(([a, b]) => rows.push(new D.TableRow({ children: [celda(a, W[0], { bold: true, fill: "E8EEF7" }), celda(b, W[1] + W[2], { bold: true, fill: "E8EEF7", span: 2 })] })));
  } }
  return new D.Table({ width: { size: 10440, type: D.WidthType.DXA }, columnWidths: W, rows });
}

async function generarWord() {
  const nombre = $("pNombre").value.trim();
  if (!nombre) { alert("Escriba el nombre del paciente."); $("pNombre").focus(); return; }
  const a = ahoraManagua(), estudio = $("pEstudio").value;
  const [lHosp, lNM, lNMh, lFirma] = await Promise.all([imagen("logoHosp", 150, 150), imagen("logoNM", 150, 150), imagen("logoNM", 34, 34), imagen("logoFirma", 170, 80)]);

  // --- columna lateral izquierda
  const izq = [];
  if (lHosp) izq.push(P(lHosp, { al: D.AlignmentType.CENTER, after: 120 }));
  if (lNM) izq.push(P(lNM, { al: D.AlignmentType.CENTER, after: 160 }));
  if (!lHosp && !lNM) izq.push(P(T("HOSPITAL REGIONAL ESCUELA CAMILO ORTEGA SAAVEDRA", { bold: true, color: AZUL, size: 18 }), { al: D.AlignmentType.CENTER, after: 200 }));
  [["PACIENTE", nombre], ["EDAD", $("pEdad").value], ["SEXO", $("pSexo").value], ["MÉDICO SOLICITANTE", $("pMedico").value], ["PROCEDENCIA", $("pProc").value],
   ["MODALIDAD", /Doppler/.test(estudio) ? "Ultrasonido Doppler" : "Ultrasonido"], ["FECHA", a.fecha], ["HORA", a.hora]].forEach(([k, v]) => {
    izq.push(P(T(k + ":", { bold: true, color: AZUL, size: 17 }), { after: 0 }));
    izq.push(P(T(v || "—", { size: 20, bold: k === "PACIENTE" }), { after: 110 }));
  });
  izq.push(P([T("Dr. Néstor José Mejía González", { bold: true, color: AZUL, size: 16 }), T("Especialista en Radiología e Imagen", { size: 15, br: 1 }), T("Código MINSA 37294", { size: 15, br: 1 })], { before: 200, after: 0 }));

  // --- área clínica derecha
  const der = [
    P(T("INFORME RADIOLÓGICO", { bold: true, color: AZUL, size: 32 }), { al: D.AlignmentType.CENTER, after: 0 }),
    P([T("Departamento de Radiología e Imágenes Médicas", { size: 18, color: "404040" }), T("Juigalpa, Chontales", { size: 18, color: "404040", br: 1 })], { al: D.AlignmentType.CENTER, after: 60 }),
    titulo("ESTUDIO / INDICACIÓN CLÍNICA"),
    P([T("Estudio: ", { bold: true }), T(estudio.replace(/^US/, "Ultrasonido") + ".")]),
  ];
  if ($("pIndicacion").value.trim()) der.push(P([T("Indicación clínica: ", { bold: true }), T($("pIndicacion").value.trim())]));
  der.push(P([T("Técnica: ", { bold: true }), T("Estudio realizado en tiempo real con transductor multifrecuencia, en cortes longitudinales, transversales y oblicuos" + (/Doppler/.test(estudio) ? ", con modo color y análisis espectral." : "."))]));
  der.push(titulo("HALLAZGOS"));

  // reparto: lo que cabe en la primera página va a la derecha; el resto, a ancho completo
  let presupuesto = 30, enDerecha = true; const resto = []; let secActual = null;
  organos.forEach((o, i) => {
    const { len, p } = parrafoOrgano(o, i);
    const lineas = Math.ceil(len / 78) + 0.4 + (o.sec !== secActual && seccionesActuales().length > 1 ? 1.8 : 0);
    const encabezado = o.sec !== secActual && seccionesActuales().length > 1 ? P(T(o.sec, { bold: true, color: "2E5597", size: 21 }), { before: 80, after: 40, keepNext: true }) : null;
    secActual = o.sec;
    if (enDerecha && presupuesto - lineas >= 0) { presupuesto -= lineas; if (encabezado) der.push(encabezado); der.push(p); }
    else { enDerecha = false; if (encabezado) resto.push(encabezado); resto.push(p); }
  });

  const celda = (hijos, w, fill) => new D.TableCell({ width: { size: w, type: D.WidthType.DXA }, children: hijos, verticalAlign: D.VerticalAlign.TOP,
    shading: fill ? { type: D.ShadingType.CLEAR, fill, color: "auto" } : undefined, margins: { top: 120, bottom: 120, left: fill ? 140 : 220, right: 140 },
    borders: fill ? { right: { style: D.BorderStyle.SINGLE, size: 18, color: AZUL }, top: SIN, bottom: SIN, left: SIN } : undefined });
  const portada = new D.Table({ width: { size: 10440, type: D.WidthType.DXA }, columnWidths: [2450, 7990], borders: sinBordes, layout: D.TableLayoutType.FIXED,
    rows: [new D.TableRow({ cantSplit: true, children: [celda(izq, 2450, "E8EEF7"), celda(der, 7990)] })] });

  const cuerpo = [portada, ...resto];
  const tm = tablaMedidas(); if (tm) cuerpo.push(titulo("CUADRO DE MEDICIONES"), tm);
  cuerpo.push(titulo("CONCLUSIONES"));
  $("conclusiones").value.split("\n").map(s => s.trim()).filter(Boolean).forEach((c, i) =>
    cuerpo.push(P([T(`${i + 1}. `, { bold: true, color: AZUL }), T(c, { bold: i === 0 })], { al: D.AlignmentType.JUSTIFIED, keepNext: true })));
  if ($("etiologia").value.trim()) { cuerpo.push(titulo("ANÁLISIS ETIOLÓGICO / CAUSA PROBABLE"), P(T($("etiologia").value.trim()), { al: D.AlignmentType.JUSTIFIED, keepNext: true })); }
  if ($("chkRec").checked && $("recomendaciones").value.trim()) cuerpo.push(titulo("RECOMENDACIONES"), ...$("recomendaciones").value.split("\n").filter(s => s.trim()).map(s => P(T(s.trim()), { keepNext: true })));
  cuerpo.push(P(lFirma ? lFirma : T(""), { al: D.AlignmentType.CENTER, before: lFirma ? 300 : 700, after: 0, keepNext: true }));
  cuerpo.push(P([T("_______________________________"), T("Dr. Néstor José Mejía González", { bold: true, color: AZUL, br: 1 }), T("Médico Especialista en Radiología e Imágenes", { br: 1 }), T("Código MINSA: 37294", { br: 1 })], { al: D.AlignmentType.CENTER, after: 0 }));

  const encab = new D.Header({ children: [P([...(lNMh ? [lNMh, T("  ")] : []), T("HOSPITAL REGIONAL ESCUELA CAMILO ORTEGA SAAVEDRA", { bold: true, color: AZUL, size: 16 }),
    T(`   ·   ${nombre}   ·   ${estudio.replace(/^US/, "Ultrasonido")}   ·   ${a.fecha}`, { size: 15, color: "595959" })],
    { after: 120, border: { bottom: { style: D.BorderStyle.SINGLE, size: 8, color: AZUL, space: 2 } } })] });
  const pie = new D.Footer({ children: [P([T("Dr. Néstor José Mejía González · Especialista en Radiología e Imagen · Código MINSA 37294 · Página ", { size: 15, color: "595959" }),
    new D.TextRun({ children: [D.PageNumber.CURRENT], size: 15, color: "595959", font: "Arial" }), T(" de ", { size: 15, color: "595959" }),
    new D.TextRun({ children: [D.PageNumber.TOTAL_PAGES], size: 15, color: "595959", font: "Arial" })], { al: D.AlignmentType.CENTER, after: 0,
    border: { top: { style: D.BorderStyle.SINGLE, size: 6, color: AZUL, space: 2 } } })] });

  const doc = new D.Document({
    creator: "Dr. Néstor José Mejía González", title: `Informe ${estudio} - ${nombre}`,
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [{ properties: { titlePage: true, page: { size: { width: 12240, height: 15840 }, margin: { top: 720, bottom: 1300, left: 900, right: 900, header: 400, footer: 500 } } },
      headers: { first: new D.Header({ children: [P(T(""), { after: 0 })] }), default: encab }, footers: { first: pie, default: pie }, children: cuerpo }],
  });
  const blob = await D.Packer.toBlob(doc);
  const limpio = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/);
  const n = limpio(nombre), corto = { "US abdominal completo": "US_Abdominal", "US abdominal superior": "US_Abdominal_Superior", "US renal y de vías urinarias": "US_Renal",
    "US general femenino": "US_General_Femenino", "US general masculino": "US_General_Masculino", "US pélvico transabdominal": "US_Pelvico", "US prostático / vesicoprostático": "US_Prostatico",
    "US de tiroides y cuello": "US_Tiroides", "US de mamas": "US_Mamas", "US Doppler venoso de miembros inferiores": "Doppler_Venoso_MMII", "US obstétrico": "US_Obstetrico" }[estudio];
  const archivo = `${[n[0], n.length > 2 ? n[n.length - 2] : n[1]].filter(Boolean).join("_")}_${corto}.docx`;
  const reg = { fecha: a.iso, hora: a.hora, paciente: nombre, edad: $("pEdad").value, sexo: $("pSexo").value, medico: $("pMedico").value,
    procedencia: $("pProc").value, estudio, diagnostico: $("conclusiones").value.split("\n")[0] || "", archivo };
  if (Almacen.dir) {
    const g = await Almacen.guardarArchivo(blob, nombre, `${a.iso}_${corto}.docx`);
    Object.assign(reg, g); await Almacen.agregar(reg);
    avisar(`✅ Informe guardado en <b>${esc(Almacen.dir.name)}/${esc(g.ruta)}</b>`);
  } else {
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = archivo; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    await Almacen.agregar(reg);
    avisar(`⬇ Informe descargado (${esc(archivo)}). Para guardarlo ordenado por paciente, conecte la carpeta en 🗂 Pacientes.`);
  }
}
function avisar(html) { const d = document.createElement("div"); d.className = "aviso"; d.innerHTML = html; document.body.appendChild(d); setTimeout(() => d.remove(), 6000); }
$("btnWord").addEventListener("click", () => generarWord().catch(e => { console.error(e); alert("Error al generar el Word: " + e.message); }));
