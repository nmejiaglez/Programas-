// ====== registro de estudios (localStorage) ======
const CLAVE_REG = "registroEstudios";
const leerReg = () => { try { return JSON.parse(localStorage.getItem(CLAVE_REG)) || []; } catch { return []; } };
function registrarEstudio(r) {
  const reg = leerReg(); reg.push(r);
  try { localStorage.setItem(CLAVE_REG, JSON.stringify(reg)); } catch { alert("No se pudo guardar en el registro (almacenamiento lleno o bloqueado)."); }
  renderRegistro();
}
function filtrados() {
  const mes = $("rMes").value, q = $("rBuscar").value.toLowerCase();
  return leerReg().filter(r => (!mes || r.fecha.startsWith(mes)) && (!q || Object.values(r).join(" ").toLowerCase().includes(q)));
}
function renderRegistro() {
  const f = filtrados(); const cuenta = (k) => f.reduce((a, r) => (a[r[k]] = (a[r[k]] || 0) + 1, a), {});
  const est = cuenta("estudio"), proc = cuenta("procedencia");
  $("rStats").innerHTML = `<div><b>${f.length}</b>Total</div>` +
    Object.entries(est).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div><b>${v}</b>${esc(k)}</div>`).join("") +
    Object.entries(proc).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div style="background:#f3f0e8"><b>${v}</b>${esc(k)}</div>`).join("");
  $("rTabla").innerHTML = `<tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Edad</th><th>Sexo</th><th>Estudio</th><th>Procedencia</th><th>Diagnóstico principal</th></tr>` +
    f.slice().reverse().map(r => `<tr><td>${r.fecha.split("-").reverse().join("/")}</td><td>${r.hora}</td><td>${esc(r.paciente)}</td><td>${esc(r.edad)}</td><td>${r.sexo}</td><td>${esc(r.estudio)}</td><td>${esc(r.procedencia)}</td><td>${esc(r.diagnostico)}</td></tr>`).join("");
}
$("rMes").value = ahoraManagua().iso.slice(0, 7);
["rMes", "rBuscar"].forEach(i => $(i).addEventListener("input", renderRegistro));
$("rCSV").addEventListener("click", () => {
  const cols = ["fecha", "hora", "paciente", "edad", "sexo", "medico", "procedencia", "estudio", "diagnostico", "archivo"];
  const csv = "﻿" + cols.join(";") + "\n" + filtrados().map(r => cols.map(c => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `Registro_Radiologia_${$("rMes").value || "todo"}.csv`; a.click();
});
$("rBorrar").addEventListener("click", () => {
  if (confirm("¿Borrar TODO el registro? Exporte el CSV antes. Esta acción no se puede deshacer.")) { try { localStorage.removeItem(CLAVE_REG); } catch {} renderRegistro(); }
});
renderRegistro();
