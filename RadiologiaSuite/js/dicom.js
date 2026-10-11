// ====== visor / anonimizador DICOM (sin compresión) ======
const TAGS = [["x00100010", "Paciente"], ["x00100020", "ID paciente"], ["x00100030", "Fecha de nacimiento"], ["x00100040", "Sexo"], ["x00101010", "Edad"],
  ["x00080020", "Fecha del estudio"], ["x00080030", "Hora"], ["x00080060", "Modalidad"], ["x00081030", "Descripción del estudio"], ["x0008103e", "Descripción de la serie"],
  ["x00080080", "Institución"], ["x00080090", "Médico referente"], ["x00080070", "Fabricante"], ["x00081090", "Modelo"], ["x00180050", "Grosor de corte"],
  ["x00280010", "Filas"], ["x00280011", "Columnas"], ["x00280030", "Tamaño de píxel"], ["x00020010", "Transfer syntax"]];
const ANON = { x00100010: "ANONIMO", x00100020: "000000", x00100030: "19000101", x00101040: "", x00101000: "", x00080090: "", x00100050: "", x00102154: "" };
const SIN_COMPRESION = ["1.2.840.10008.1.2", "1.2.840.10008.1.2.1"];

let dcm = null; // { bytes, ds, nombre, wc, ww, wc0, ww0 }

$("dArchivo").addEventListener("change", e => {
  const f = e.target.files[0]; if (!f) return;
  f.arrayBuffer().then(buf => {
    try {
      const bytes = new Uint8Array(buf), ds = dicomParser.parseDicom(bytes);
      dcm = { bytes, ds, nombre: f.name.replace(/\.[^.]*$/, "") || "imagen" };
      $("dTags").innerHTML = "<tr><th>Etiqueta</th><th>Valor</th></tr>" + TAGS.map(([t, n]) => `<tr><td>${n}</td><td>${esc(ds.string(t) ?? "—")}</td></tr>`).join("");
      const wc = ds.floatString("x00281050"), ww = ds.floatString("x00281051");
      Object.assign(dcm, { wc0: wc, ww0: ww, wc, ww }); dibujar();
    } catch (err) { alert("No se pudo leer el archivo como DICOM: " + err); }
  });
});

function pixeles() {
  const ds = dcm.ds, ts = ds.string("x00020010") || "1.2.840.10008.1.2.1";
  const el = ds.elements.x7fe00010; if (!el) throw "El archivo no contiene imagen.";
  if (!SIN_COMPRESION.includes(ts)) throw `Imagen comprimida (${ts}). Exporte desde el equipo como DICOM sin compresión, o use RadiAnt/MicroDicom.`;
  const filas = ds.uint16("x00280010"), cols = ds.uint16("x00280011"), bits = ds.uint16("x00280100"), signo = ds.uint16("x00280103"), spp = ds.uint16("x00280002") || 1;
  const planar = ds.uint16("x00280006") || 0, foto = (ds.string("x00280004") || "").trim();
  const m = ds.floatString("x00281053") ?? 1, b = ds.floatString("x00281052") ?? 0, off = el.dataOffset, n = filas * cols;
  let raw;
  if (bits === 16) raw = signo ? new Int16Array(dcm.bytes.buffer.slice(off, off + n * spp * 2)) : new Uint16Array(dcm.bytes.buffer.slice(off, off + n * spp * 2));
  else raw = new Uint8Array(dcm.bytes.buffer, off, n * spp);
  return { filas, cols, spp, planar, foto, raw, m, b, n, bits };
}

function dibujar() {
  let px; try { px = pixeles(); } catch (e) { $("dInfo").textContent = e; return; }
  const c = $("dCanvas"), ctx = c.getContext("2d"); c.width = px.cols; c.height = px.filas;
  const img = ctx.createImageData(px.cols, px.filas), d = img.data;
  if (px.spp === 3) {
    for (let i = 0; i < px.n; i++) for (let k = 0; k < 3; k++) d[i * 4 + k] = px.planar ? px.raw[k * px.n + i] : px.raw[i * 3 + k];
    for (let i = 0; i < px.n; i++) d[i * 4 + 3] = 255;
    $("dInfo").textContent = `${px.cols} × ${px.filas} · color`;
  } else {
    if (dcm.wc == null || dcm.ww == null) { let mn = Infinity, mx = -Infinity; for (let i = 0; i < px.n; i++) { const v = px.raw[i] * px.m + px.b; if (v < mn) mn = v; if (v > mx) mx = v; }
      dcm.wc = dcm.wc0 = (mn + mx) / 2; dcm.ww = dcm.ww0 = Math.max(1, mx - mn); }
    const lo = dcm.wc - dcm.ww / 2, inv = px.foto === "MONOCHROME1";
    for (let i = 0; i < px.n; i++) { let g = ((px.raw[i] * px.m + px.b - lo) / dcm.ww) * 255; g = g < 0 ? 0 : g > 255 ? 255 : g; if (inv) g = 255 - g;
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = g; d[i * 4 + 3] = 255; }
    $("dInfo").textContent = `${px.cols} × ${px.filas} · W ${Math.round(dcm.ww)} / L ${Math.round(dcm.wc)}`;
  }
  ctx.putImageData(img, 0, 0);
}

// ventana/nivel con arrastre
let arr = null;
$("dCanvas").addEventListener("mousedown", e => { if (dcm) arr = { x: e.clientX, y: e.clientY, wc: dcm.wc, ww: dcm.ww }; });
addEventListener("mouseup", () => arr = null);
addEventListener("mousemove", e => { if (!arr) return; dcm.ww = Math.max(1, arr.ww + (e.clientX - arr.x) * 2); dcm.wc = arr.wc + (e.clientY - arr.y) * 2; dibujar(); });
$("dReset").addEventListener("click", () => { if (dcm) { dcm.wc = dcm.wc0; dcm.ww = dcm.ww0; dibujar(); } });

$("dPNG").addEventListener("click", () => { if (!dcm) return alert("Abra primero un archivo DICOM.");
  const a = document.createElement("a"); a.href = $("dCanvas").toDataURL("image/jpeg", 0.95); a.download = dcm.nombre + ".jpg"; a.click(); });

$("dAnon").addEventListener("click", () => {
  if (!dcm) return alert("Abra primero un archivo DICOM.");
  const copia = dcm.bytes.slice();
  Object.entries(ANON).forEach(([tag, valor]) => {
    const el = dcm.ds.elements[tag]; if (!el || !el.length) return;
    const v = valor.slice(0, el.length).padEnd(el.length, " ");
    for (let i = 0; i < el.length; i++) copia[el.dataOffset + i] = v.charCodeAt(i);
  });
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([copia], { type: "application/dicom" })); a.download = "ANONIMO_" + dcm.nombre + ".dcm"; a.click();
  alert("Se borraron nombre, ID, fecha de nacimiento, dirección y médico referente. Revise también si hay datos del paciente impresos dentro de la imagen; eso no se elimina.");
});
