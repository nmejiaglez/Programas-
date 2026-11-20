// Lector DICOM básico: sin compresión (implícito / explícito little endian) y JPEG baseline.
"use strict";

const TS_IMPLICITO = "1.2.840.10008.1.2";
const TS_EXPLICITO = "1.2.840.10008.1.2.1";
const TS_JPEG = ["1.2.840.10008.1.2.4.50", "1.2.840.10008.1.2.4.51", "1.2.840.10008.1.2.4.70", "1.2.840.10008.1.2.4.57"];
const VR_LARGOS = new Set(["OB", "OD", "OF", "OL", "OV", "OW", "SQ", "SV", "UC", "UN", "UR", "UT", "UV"]);
const INDEFINIDO = 0xffffffff;

const TAGS = {
  "00020010": "ts", "00280002": "spp", "00280004": "foto", "00280006": "planar", "00280008": "frames",
  "00280010": "filas", "00280011": "columnas", "00280100": "bits", "00280103": "signo",
  "00281050": "centro", "00281051": "anchoVentana", "00281052": "intercepto", "00281053": "pendiente",
  "00200011": "serie", "00200013": "instancia", "7FE00010": "pixeles",
};

function pareceDicom(buf) {
  if (buf.byteLength < 132) return false;
  const v = new Uint8Array(buf, 128, 4);
  return String.fromCharCode(...v) === "DICM";
}

function leerDicom(buf) {
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  const datos = {};
  const texto = (p, n) => {
    let s = "";
    for (let i = 0; i < n; i++) s += String.fromCharCode(u8[p + i]);
    return s.replace(/[\0 ]+$/g, "").trim();
  };
  const hex = (g, e) => (g.toString(16).padStart(4, "0") + e.toString(16).padStart(4, "0")).toUpperCase();

  // Recorre un conjunto de elementos. nivel 0 guarda los datos; los niveles internos solo se saltan.
  function recorrer(pos, fin, explicito, nivel, hastaItem) {
    while (pos + 8 <= fin) {
      const g = dv.getUint16(pos, true), e = dv.getUint16(pos + 2, true);
      if (g === 0xfffe) {
        const largo = dv.getUint32(pos + 4, true);
        if (e === 0xe00d && hastaItem) return pos + 8; // fin de ítem
        if (e === 0xe0dd) return pos + 8;              // fin de secuencia
        if (e === 0xe000) {                            // ítem
          pos = largo === INDEFINIDO ? recorrer(pos + 8, fin, explicito, nivel + 1, true) : pos + 8 + largo;
          continue;
        }
        pos += 8;
        continue;
      }
      // El grupo 0002 siempre es explícito
      const exp = g === 0x0002 ? true : explicito;
      let vr = null, largo, cab;
      if (exp) {
        vr = String.fromCharCode(u8[pos + 4], u8[pos + 5]);
        if (VR_LARGOS.has(vr)) { largo = dv.getUint32(pos + 8, true); cab = 12; }
        else { largo = dv.getUint16(pos + 6, true); cab = 8; }
      } else {
        largo = dv.getUint32(pos + 4, true); cab = 8;
      }
      const clave = TAGS[hex(g, e)];
      const ini = pos + cab;
      if (clave === "pixeles" && nivel === 0) {
        datos.pixelesInicio = ini;
        datos.pixelesLargo = largo;
        if (largo === INDEFINIDO) datos.fragmentos = leerFragmentos(ini);
        return fin;
      }
      if (largo === INDEFINIDO) {
        pos = recorrer(ini, fin, explicito, nivel + 1, false);
        continue;
      }
      if (clave && nivel === 0 && ini + largo <= fin) {
        if (["spp", "planar", "filas", "columnas", "bits", "signo"].includes(clave)) {
          datos[clave] = largo >= 2 ? dv.getUint16(ini, true) : 0;
        } else {
          datos[clave] = texto(ini, largo);
        }
      }
      if (g === 0x0002 && e === 0x0010) explicito = datos.ts !== TS_IMPLICITO;
      pos = ini + largo;
    }
    return pos;
  }

  function leerFragmentos(p) {
    const frags = [];
    while (p + 8 <= buf.byteLength) {
      const g = dv.getUint16(p, true), e = dv.getUint16(p + 2, true), largo = dv.getUint32(p + 4, true);
      if (g !== 0xfffe || e === 0xe0dd) break;
      frags.push(u8.subarray(p + 8, p + 8 + largo));
      p += 8 + largo;
    }
    return frags.slice(1); // el primero es la tabla de desplazamientos
  }

  let inicio = 0, explicito = false;
  if (pareceDicom(buf)) { inicio = 132; explicito = true; }
  else {
    // Sin preámbulo: se prueba implícito (como pydicom force=True)
    const g = dv.getUint16(0, true);
    if (g !== 0x0008 && g !== 0x0002) throw new Error("No es DICOM");
    explicito = /^[A-Z]{2}$/.test(String.fromCharCode(u8[4], u8[5]));
  }
  recorrer(inicio, buf.byteLength, explicito, 0, false);
  if (datos.pixelesInicio === undefined) throw new Error("DICOM sin imagen");
  return datos;
}

function numero(valor, defecto) {
  if (valor === undefined || valor === "") return defecto;
  const n = parseFloat(String(valor).split("\\")[0]);
  return Number.isFinite(n) ? n : defecto;
}

// Devuelve { serie, instancia, lienzo }
async function imagenDicom(archivo) {
  const buf = await archivo.arrayBuffer();
  const d = leerDicom(buf);
  const filas = d.filas, cols = d.columnas;
  const ts = d.ts || TS_IMPLICITO;
  const frames = Math.max(1, Math.round(numero(d.frames, 1)));
  const medio = Math.floor(frames / 2); // multiframe: corte central
  const orden = { serie: Math.trunc(numero(d.serie, 0)), instancia: Math.trunc(numero(d.instancia, 0)) };

  if (d.fragmentos) {
    if (!TS_JPEG.includes(ts)) throw new Error(`compresión DICOM no compatible (${ts})`);
    const fr = d.fragmentos;
    const datosJpg = frames > 1 && fr.length === frames ? fr[medio] : concatenar(fr);
    const bmp = await createImageBitmap(new Blob([datosJpg], { type: "image/jpeg" }));
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    c.getContext("2d").drawImage(bmp, 0, 0);
    bmp.close();
    return { ...orden, lienzo: c };
  }
  if (ts !== TS_IMPLICITO && ts !== TS_EXPLICITO && ts !== "1.2.840.10008.1.2.1.99") {
    throw new Error(`formato DICOM no compatible (${ts})`);
  }
  if (!filas || !cols) throw new Error("DICOM sin dimensiones");
  const spp = d.spp || 1, bits = d.bits || 16;
  const bytesPx = bits / 8;
  const porFrame = filas * cols * spp * bytesPx;
  const off = d.pixelesInicio + porFrame * (frames > 1 ? medio : 0);
  if (off + porFrame > buf.byteLength) throw new Error("DICOM incompleto");
  const c = new OffscreenCanvas(cols, filas);
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(cols, filas);
  const px = img.data;
  const n = filas * cols;

  if (spp === 3 && bits === 8) {
    const u8 = new Uint8Array(buf, off, porFrame);
    for (let i = 0; i < n; i++) {
      const [r, g, b] = d.planar ? [u8[i], u8[i + n], u8[i + 2 * n]] : [u8[3 * i], u8[3 * i + 1], u8[3 * i + 2]];
      px[4 * i] = r; px[4 * i + 1] = g; px[4 * i + 2] = b; px[4 * i + 3] = 255;
    }
  } else {
    const dv = new DataView(buf, off, porFrame);
    const valores = new Float32Array(n);
    const pend = numero(d.pendiente, 1), inter = numero(d.intercepto, 0);
    for (let i = 0; i < n; i++) {
      let v;
      if (bits === 8) v = d.signo ? dv.getInt8(i) : dv.getUint8(i);
      else if (bits === 16) v = d.signo ? dv.getInt16(2 * i, true) : dv.getUint16(2 * i, true);
      else if (bits === 32) v = d.signo ? dv.getInt32(4 * i, true) : dv.getUint32(4 * i, true);
      else throw new Error(`DICOM de ${bits} bits no compatible`);
      valores[i] = v * pend + inter;
    }
    let lo, hi;
    const centro = numero(d.centro, NaN), ancho = numero(d.anchoVentana, NaN);
    if (Number.isFinite(centro) && Number.isFinite(ancho)) { lo = centro - ancho / 2; hi = centro + ancho / 2; }
    else [lo, hi] = percentiles(valores, 0.005, 0.995);
    const escala = 255 / Math.max(hi - lo, 1);
    const invertir = (d.foto || "").toUpperCase() === "MONOCHROME1";
    for (let i = 0; i < n; i++) {
      let g = Math.min(255, Math.max(0, (valores[i] - lo) * escala)) | 0;
      if (invertir) g = 255 - g;
      px[4 * i] = px[4 * i + 1] = px[4 * i + 2] = g; px[4 * i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { ...orden, lienzo: c };
}

function concatenar(lista) {
  const total = lista.reduce((s, a) => s + a.length, 0);
  const r = new Uint8Array(total);
  let p = 0;
  for (const a of lista) { r.set(a, p); p += a.length; }
  return r;
}

function percentiles(valores, a, b) {
  const paso = Math.max(1, Math.floor(valores.length / 200000));
  const m = [];
  for (let i = 0; i < valores.length; i += paso) m.push(valores[i]);
  m.sort((x, y) => x - y);
  return [m[Math.floor(a * (m.length - 1))], m[Math.floor(b * (m.length - 1))]];
}
