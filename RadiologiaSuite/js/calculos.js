// ====== utilidades ======
const $ = id => document.getElementById(id);
const num = v => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : null; };
const fmt = (n, d = 1) => n.toFixed(d).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
const volumen = (l, ap, t) => l * ap * t * 0.523;

function ahoraManagua() {
  const d = new Date();
  const f = new Intl.DateTimeFormat("es-NI", { timeZone: "America/Managua", day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
  const h = new Intl.DateTimeFormat("es-NI", { timeZone: "America/Managua", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Managua" }).format(d); // AAAA-MM-DD
  return { fecha: f, hora: h, iso };
}

// ====== obstetricia (Hadlock) ======
function egSemanas(m) { // m en mm
  const est = [];
  if (m.LCC) { const c = m.LCC / 10; est.push(["LCC", Math.exp(1.684969 + 0.315646 * c - 0.049306 * c ** 2 + 0.004057 * c ** 3 - 0.000120456 * c ** 4) / 7]); }
  if (m.DBP) { const c = m.DBP / 10; est.push(["DBP", 9.54 + 1.482 * c + 0.1676 * c * c]); }
  if (m.CC) { const c = m.CC / 10; est.push(["CC", 8.96 + 0.540 * c + 0.0003 * c ** 3]); }
  if (m.CA) { const c = m.CA / 10; est.push(["CA", 8.14 + 0.753 * c + 0.0036 * c * c]); }
  if (m.LF) { const c = m.LF / 10; est.push(["LF", 10.35 + 2.460 * c + 0.170 * c * c]); }
  return est;
}
const semDias = s => { let w = Math.floor(s), d = Math.round((s - w) * 7); if (d === 7) { w++; d = 0; } return `${w} semanas ${d} días`; };
function phi(z) { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; }

function obstCalc(m) {
  const est = egSemanas(m); if (!est.length) return null;
  // LCC solo en primer trimestre (cuando no hay otras biometrías)
  const otras = est.filter(e => e[0] !== "LCC");
  const usadas = otras.length ? otras : est;
  const eg = usadas.reduce((a, e) => a + e[1], 0) / usadas.length;
  const r = { est, eg, egTxt: semDias(eg) };
  const hoy = new Date(); const fpp = new Date(hoy.getTime() + (40 - eg) * 7 * 864e5);
  r.fpp = fpp.toLocaleDateString("es-NI", { timeZone: "America/Managua", day: "2-digit", month: "2-digit", year: "numeric" });
  if (m.CC && m.CA && m.LF && m.DBP) {
    const [hc, ac, fl, bpd] = [m.CC / 10, m.CA / 10, m.LF / 10, m.DBP / 10];
    r.pfe = Math.pow(10, 1.3596 - 0.00386 * ac * fl + 0.0064 * hc + 0.00061 * bpd * ac + 0.0424 * ac + 0.174 * fl);
    const media = Math.exp(0.578 + 0.332 * eg - 0.00354 * eg * eg);
    r.pct = Math.round(phi((r.pfe - media) / (0.127 * media)) * 100);
  }
  return r;
}

// ====== UI calculadoras ======
function enlazar(ids, fn) { ids.forEach(i => document.querySelectorAll(i).forEach(e => e.addEventListener("input", fn))); fn(); }

enlazar(["#vL", "#vAP", "#vT", "#vTipo"], () => {
  const [l, ap, t] = ["vL", "vAP", "vT"].map(i => num($(i).value));
  if (!(l && ap && t)) return $("vRes").textContent = "Ingrese las tres medidas ortogonales.";
  const v = volumen(l, ap, t); let s = `Volumen: <b>${fmt(v)} cm³</b>`;
  const tipo = $("vTipo").value;
  if (tipo === "prost") s += `<br>Peso estimado: <b>${fmt(v * 1.05)} g</b> · ${v <= 25 ? "Dentro de parámetros esperados (≤ 25 cm³)" : v <= 40 ? "Aumento leve" : v <= 80 ? "Aumento moderado" : "Aumento severo"}`;
  if (tipo === "vej") s += `<br>Equivale a <b>${Math.round(v)} mL</b>`;
  if (tipo === "tir") s += `<br>Referencia por lóbulo: aproximadamente 4–9 cm³ en mujer y 5–12 cm³ en hombre`;
  if (tipo === "tes") s += `<br>${v < 12 ? "Volumen disminuido (<12 cm³ en adulto)" : "Volumen dentro de parámetros esperados en adulto"}`;
  $("vRes").innerHTML = s;
});

enlazar([".tr", ".trf", "#trD"], () => {
  let p = ["trC", "trE", "trF", "trM"].reduce((a, i) => a + +$(i).value, 0);
  document.querySelectorAll(".trf:checked").forEach(c => p += +c.value);
  const tr = p === 0 ? 1 : p <= 2 ? 2 : p === 3 ? 3 : p <= 6 ? 4 : 5;
  const nom = ["", "Benigno", "No sospechoso", "Levemente sospechoso", "Moderadamente sospechoso", "Altamente sospechoso"][tr];
  const lim = { 3: [2.5, 1.5], 4: [1.5, 1.0], 5: [1.0, 0.5] }[tr];
  const d = num($("trD").value); let conducta = "No requiere PAAF.";
  if (lim) conducta = d == null ? `PAAF si ≥ ${lim[0]} cm; seguimiento si ≥ ${lim[1]} cm.` : d >= lim[0] ? "<b>Indicada PAAF.</b>" : d >= lim[1] ? "Seguimiento ecográfico." : "No requiere PAAF ni seguimiento por tamaño.";
  $("trRes").innerHTML = `Puntos: <b>${p}</b> → <b>ACR TI-RADS ${tr}</b> (${nom})<br>${conducta}`;
});

const BOSNIAK = [
  ["I — Quiste simple: pared fina (≤2 mm), lisa, sin septos, calcificaciones ni componente sólido; contenido homogéneo.", "Benigno. No requiere seguimiento."],
  ["II — Hasta 3 septos finos (≤2 mm) o calcificaciones finas; o lesión homogénea hiperatenuante (≥70 UH) no realzante.", "Benigno. No requiere seguimiento."],
  ["IIF — Pared o septo liso mínimamente engrosado (3 mm), o ≥4 septos finos lisos con realce.", "Probablemente benigno. Seguimiento a los 6 y 12 meses y luego anual hasta los 5 años."],
  ["III — Pared o septos engrosados (≥4 mm) o irregulares (≤3 mm de protrusión obtusa) con realce.", "Indeterminado (aproximadamente 50 % maligno). Valoración urológica."],
  ["IV — Nódulo(s) realzante(s): protrusión ≥4 mm de margen obtuso, o cualquier protrusión de margen agudo.", "Probablemente maligno (aproximadamente 90 %). Valoración urológica."],
];
const BIRADS = [
  ["0 — Incompleto", "Requiere estudios adicionales o comparación con estudios previos."],
  ["1 — Negativo", "Control de rutina según la edad."],
  ["2 — Hallazgo benigno", "Control de rutina según la edad."],
  ["3 — Probablemente benigno (≤2 % de malignidad)", "Seguimiento a corto plazo (6 meses)."],
  ["4A — Baja sospecha (>2–10 %)", "Biopsia."], ["4B — Sospecha moderada (>10–50 %)", "Biopsia."], ["4C — Alta sospecha (>50–<95 %)", "Biopsia."],
  ["5 — Altamente sugestivo de malignidad (≥95 %)", "Biopsia y tratamiento apropiado."],
  ["6 — Malignidad confirmada por biopsia", "Tratamiento oncológico."],
];
const ORADS = [
  ["Ovario premenopáusico habitual: folículo ≤3 cm o cuerpo lúteo", "O-RADS 1 — Normal."],
  ["Quiste simple ≤10 cm; quiste unilocular liso no simple <3 cm (premenopausia)", "O-RADS 2 — Casi ciertamente benigno (<1 %)."],
  ["Lesión benigna típica <10 cm: hemorrágico, dermoide, endometrioma; paraovárico simple; seudoquiste de inclusión; hidrosálpinx", "O-RADS 2 — Casi ciertamente benigno (<1 %)."],
  ["Lesión benigna típica ≥10 cm o quiste simple >10 cm", "O-RADS 3 — Bajo riesgo (1–<10 %)."],
  ["Unilocular de pared interna irregular (<3 mm) o multilocular liso <10 cm (CS 1–3)", "O-RADS 3 — Bajo riesgo (1–<10 %)."],
  ["Sólido de contorno liso, puntuación de color (CS) 1", "O-RADS 3 — Bajo riesgo (1–<10 %)."],
  ["Multilocular liso ≥10 cm o CS 4; multilocular irregular sin componente sólido", "O-RADS 4 — Riesgo intermedio (10–<50 %)."],
  ["Unilocular con componente sólido y 1–3 papilas; uni/bilocular con componente sólido", "O-RADS 4 — Riesgo intermedio (10–<50 %)."],
  ["Sólido de contorno liso con CS 2–3", "O-RADS 4 — Riesgo intermedio (10–<50 %)."],
  ["Unilocular con ≥4 papilas; multilocular con componente sólido CS 3–4", "O-RADS 5 — Alto riesgo (≥50 %)."],
  ["Sólido de contorno irregular; sólido liso con CS 4", "O-RADS 5 — Alto riesgo (≥50 %)."],
  ["Ascitis y/o nódulos peritoneales", "O-RADS 5 — Alto riesgo (≥50 %)."],
];
function selector(id, resId, lista) {
  $(id).innerHTML = lista.map((x, i) => `<option value="${i}">${x[0]}</option>`).join("");
  const f = () => $(resId).innerHTML = "<b>" + lista[$(id).value][1] + "</b>";
  $(id).addEventListener("change", f); f();
}
selector("bosniak", "bosRes", BOSNIAK); selector("birads", "biRes", BIRADS); selector("orads", "orRes", ORADS);

enlazar(["#dPSV", "#dEDV", "#dVm"], () => {
  const [s, d, m] = ["dPSV", "dEDV", "dVm"].map(i => num($(i).value));
  if (!(s && d != null)) return $("dRes").textContent = "Ingrese VPS y VFD.";
  const vm = m || (s + 2 * d) / 3;
  $("dRes").innerHTML = `IR: <b>${fmt((s - d) / s, 2)}</b> · IP: <b>${fmt((s - d) / vm, 2)}</b> · S/D: <b>${d ? fmt(s / d, 2) : "∞"}</b>${m ? "" : "<br><small>Vmedia estimada como (VPS + 2·VFD)/3</small>"}`;
});

enlazar(["#cPSV", "#cEDV", "#cCCA", "#cPlaca"], () => {
  const [p, e, c] = ["cPSV", "cEDV", "cCCA"].map(i => num($(i).value)); const placa = $("cPlaca").checked;
  if (!p) return $("cRes").textContent = "Ingrese al menos la VPS de la ACI.";
  const ratio = c ? p / c : null; let g;
  if (p > 230 || (ratio && ratio > 4) || (e && e > 100)) g = "Estenosis ≥70 % (sin llegar a suboclusión)";
  else if (p >= 125 || (ratio && ratio >= 2) || (e && e >= 40)) g = "Estenosis 50–69 %";
  else g = placa ? "Estenosis <50 %" : "Sin estenosis hemodinámicamente significativa";
  $("cRes").innerHTML = `<b>${g}</b>${ratio ? `<br>Índice VPS ACI/ACC: ${fmt(ratio, 2)}` : ""}<br><small>Criterios del consenso SRU 2003. El criterio principal es la VPS; con suboclusión las velocidades pueden ser bajas o variables.</small>`;
});

enlazar(["#rPSV", "#rAo", "#rIR"], () => {
  const [p, a, ir] = ["rPSV", "rAo", "rIR"].map(i => num($(i).value)); const out = [];
  if (p) out.push(p >= 180 ? `VPS ${p} cm/s: <b>sugiere estenosis significativa (≥60 %)</b>` : `VPS ${p} cm/s: sin criterio de estenosis`);
  if (p && a) { const rar = p / a; out.push(`RAR: <b>${fmt(rar, 2)}</b> ${rar > 3.5 ? "(>3.5: estenosis ≥60 %)" : "(≤3.5)"}`); }
  if (ir) out.push(`IR intrarrenal: <b>${ir}</b> ${ir > 0.7 ? "(elevado, >0.70)" : "(dentro de parámetros esperados)"}`);
  $("rRes").innerHTML = out.join("<br>") || "Ingrese valores.";
});

enlazar(["#oLCC", "#oDBP", "#oCC", "#oCA", "#oLF"], () => {
  const m = {}; ["LCC", "DBP", "CC", "CA", "LF"].forEach(k => m[k] = num($("o" + k).value));
  const r = obstCalc(m); if (!r) return $("oRes").textContent = "Ingrese al menos una biometría (mm).";
  let s = r.est.map(e => `${e[0]}: ${semDias(e[1])}`).join("<br>");
  s += `<hr>EG biométrica: <b>${r.egTxt}</b><br>FPP por biometría: <b>${r.fpp}</b>`;
  if (r.pfe) s += `<br>PFE (Hadlock): <b>${Math.round(r.pfe)} g</b> · Percentil aproximado: <b>${r.pct}</b>${r.pct < 10 ? " → <b>PEG / sospecha de RCIU</b>" : r.pct > 90 ? " → <b>GEG</b>" : ""}`;
  $("oRes").innerHTML = s;
});

enlazar([".ila", "#oBVM"], () => {
  const q = [...document.querySelectorAll(".ila")].map(e => num(e.value)); const bvm = num($("oBVM").value); const out = [];
  if (q.every(x => x != null)) { const t = q.reduce((a, b) => a + b, 0);
    out.push(`ILA: <b>${fmt(t)} cm</b> → ${t <= 5 ? "<b>Oligohidramnios</b>" : t < 8 ? "Líquido disminuido / limítrofe" : t < 25 ? "Dentro de parámetros esperados" : "<b>Polihidramnios</b>"}`); }
  if (bvm != null) out.push(`BVM: <b>${bvm} cm</b> → ${bvm < 2 ? "<b>Oligohidramnios</b>" : bvm > 8 ? "<b>Polihidramnios</b>" : "Dentro de parámetros esperados"}`);
  $("ilaRes").innerHTML = out.join("<br>") || "Ingrese los cuatro cuadrantes o el BVM.";
});

enlazar(["#oIPAU", "#oIPACM"], () => {
  const [u, c] = [num($("oIPAU").value), num($("oIPACM").value)];
  if (!(u && c)) return $("icpRes").textContent = "Ingrese ambos IP.";
  const icp = c / u;
  $("icpRes").innerHTML = `Índice cerebroplacentario: <b>${fmt(icp, 2)}</b> → ${icp < 1 ? "<b>Alterado (<1): sugiere redistribución hemodinámica</b>" : "Dentro de parámetros esperados"}<br><small>Para interpretar el IP de la arteria umbilical, compárelo con el percentil 95 para la edad gestacional.</small>`;
});

// reloj
setInterval(() => { const a = ahoraManagua(); $("reloj").textContent = `Managua · ${a.fecha} ${a.hora}`; }, 1000);
