// ====== utilidades ======
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const q = s => "'" + String(s).replace(/'/g, "'\\''") + "'"; // comillas para el shell del celular
const tam = kb => kb >= 1048576 ? (kb / 1048576).toFixed(1) + " GB" : kb >= 1024 ? (kb / 1024).toFixed(0) + " MB" : Math.round(kb) + " KB";
const dato = (k, v) => `<div class="dato"><span>${k}</span><span>${v}</span></div>`;
const barra = (pct, inverso) => { const c = inverso ? (pct < 20 ? "critico" : pct < 40 ? "alto" : "") : (pct > 90 ? "critico" : pct > 75 ? "alto" : "");
  return `<div class="barra ${c}"><div style="width:${Math.min(100, pct)}%"></div></div>`; };

let ocupado = 0;
async function trabajando(txt, fn) {
  ocupado++; $("cargandoTxt").textContent = txt; $("cargando").classList.remove("oculto");
  try { return await fn(); } finally { if (--ocupado === 0) $("cargando").classList.add("oculto"); }
}
function mostrar(id, html) { const e = $(id); e.innerHTML = html; e.classList.remove("oculto"); }

document.querySelectorAll("nav button").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll("nav button, .tab").forEach(e => e.classList.remove("activo"));
  b.classList.add("activo"); $(b.dataset.tab).classList.add("activo");
}));
$("btnTienda").addEventListener("click", () => sistema.abrirUrl("ms-windows-store://pdp/?ProductId=9NP83LWLPZ9K"));

// =====================================================================
// ANDROID (adb)
// =====================================================================
let serial = null;
const adb = (args, ms) => sistema.ejecutar("adb", serial ? ["-s", serial, ...args] : args, ms);
const sh = (cmd, ms) => adb(["shell", cmd], ms);

async function buscarAndroid() {
  const r = await sistema.ejecutar("adb", ["devices", "-l"], 30000);
  if (r.falta) return estadoA("error", "No se encontró la herramienta de Android (adb). Vuelva a descargar el programa completo.");
  const lineas = r.out.split("\n").slice(1).map(l => l.trim()).filter(Boolean);
  const listos = lineas.filter(l => /\sdevice\s/.test(l + " ")), sinPermiso = lineas.filter(l => /unauthorized/.test(l));
  if (!listos.length) {
    $("aPanel").classList.add("oculto"); serial = null;
    if (sinPermiso.length) return estadoA("", "📲 Celular detectado, pero <b>falta autorizar</b>. Desbloquee el celular, toque <b>«Permitir»</b> en el mensaje de depuración USB y vuelva a presionar «Buscar celular».");
    return estadoA("", "No se detecta ningún Android. Revise la pestaña <b>«Cómo conectar»</b>: hay que activar la <b>Depuración USB</b> la primera vez.");
  }
  serial = listos[0].split(/\s+/)[0];
  await cargarAndroid();
}
function estadoA(clase, html) { $("aEstado").className = "estado " + clase; $("aEstado").innerHTML = html; }

async function cargarAndroid() {
  const info = (await sh("getprop ro.product.manufacturer; getprop ro.product.model; getprop ro.build.version.release; getprop ro.build.version.sdk; getprop ro.product.marketname; getprop ro.serialno")).out.split("\n").map(s => s.trim());
  const [marca, modelo, version, sdk, comercial] = info;
  estadoA("ok", `✅ Conectado: <b>${esc(marca.toUpperCase())} ${esc(comercial || modelo)}</b> · Android ${esc(version)}`);
  $("aPanel").classList.remove("oculto");
  $("aInfo").innerHTML = dato("Marca", esc(marca)) + dato("Modelo", esc(comercial || modelo) + (comercial ? ` (${esc(modelo)})` : "")) + dato("Android", `${esc(version)} (API ${esc(sdk)})`) + dato("Serie", esc(serial));
  await Promise.all([bateriaA(), almacenA()]);
}

async function bateriaA() {
  const t = (await sh("dumpsys battery")).out, v = k => (t.match(new RegExp("^\\s*" + k + ":\\s*(.+)$", "m")) || [])[1]?.trim();
  const nivel = +v("level"), temp = +v("temperature") / 10, volt = +v("voltage"), salud = +v("health"), estado = +v("status");
  const saludTxt = { 2: '<span class="bueno">Buena</span>', 3: '<span class="malo">Sobrecalentada</span>', 4: '<span class="malo">Dañada</span>', 5: '<span class="malo">Sobrevoltaje</span>', 6: '<span class="malo">Falla</span>', 7: '<span class="medio">Fría</span>' }[salud] || "Desconocida";
  const estTxt = { 2: "Cargando", 3: "Descargando", 4: "Sin cargar", 5: "Llena" }[estado] || "—";
  const ciclos = (await sh("cat /sys/class/power_supply/battery/cycle_count 2>/dev/null")).out.trim();
  $("aBateria").innerHTML = `<b style="font-size:22px">${nivel}%</b>${barra(nivel, true)}` + dato("Estado", estTxt) + dato("Salud reportada", saludTxt)
    + dato("Temperatura", `<span class="${temp > 40 ? "malo" : temp > 35 ? "medio" : "bueno"}">${temp.toFixed(1)} °C</span>`) + dato("Voltaje", `${(volt / 1000).toFixed(2)} V`)
    + (/^\d+$/.test(ciclos) ? dato("Ciclos de carga", ciclos) : "")
    + `<p class="nota">${temp > 40 ? "⚠️ Temperatura alta: retire la funda, deje de usar el celular mientras carga y evite el sol." : "Para cuidar la batería: cargue entre 20 % y 80 % y evite el calor."}</p>`;
}

async function almacenA() {
  const df = (await sh("df -k /data")).out.trim().split("\n").pop().split(/\s+/);
  const total = +df[1], usado = +df[2], libre = +df[3], pct = total ? usado / total * 100 : 0;
  const mem = (await sh("cat /proc/meminfo")).out, m = k => +((mem.match(new RegExp(k + ":\\s+(\\d+)")) || [])[1] || 0);
  const memT = m("MemTotal"), memL = m("MemAvailable");
  $("aAlmac").innerHTML = `<b>Almacenamiento</b>${barra(pct)}` + dato("Usado", `${tam(usado)} de ${tam(total)} (${pct.toFixed(0)} %)`) + dato("Libre", `<span class="${pct > 90 ? "malo" : pct > 75 ? "medio" : "bueno"}">${tam(libre)}</span>`)
    + `<br><b>Memoria RAM</b>${barra((memT - memL) / memT * 100)}` + dato("RAM total", tam(memT)) + dato("RAM disponible", tam(memL))
    + (pct > 85 ? `<p class="nota">⚠️ El almacenamiento está casi lleno: esto pone lento al celular. Use la limpieza de WhatsApp y de archivos grandes.</p>` : "");
}

// --- mantenimiento rápido
$("aCache").addEventListener("click", () => trabajando("Limpiando caché de todas las apps…", async () => {
  const libre = async () => +(await sh("df -k /data")).out.trim().split("\n").pop().split(/\s+/)[3];
  const antes = await libre(); await sh("pm trim-caches 9999G", 180000); const despues = await libre();
  mostrar("aRes", `✅ Caché limpiada. Espacio liberado: <b>${tam(Math.max(0, despues - antes))}</b>.\nSus datos, fotos y sesiones no se tocan.`); await almacenA();
}));
const anim = v => trabajando("Aplicando…", async () => {
  for (const k of ["window_animation_scale", "transition_animation_scale", "animator_duration_scale"]) await sh(`settings put global ${k} ${v}`);
  mostrar("aRes", v === "0.5" ? "🚀 Animaciones al doble de velocidad: el celular se siente más ágil." : "↩ Animaciones restauradas a lo normal.");
});
$("aAnimRapidas").addEventListener("click", () => anim("0.5"));
$("aAnimNormales").addEventListener("click", () => anim("1"));
$("aReiniciar").addEventListener("click", async () => { if (!confirm("¿Reiniciar el celular ahora?")) return; await adb(["reboot"]); estadoA("", "🔁 Reiniciando… Cuando encienda y lo desbloquee, presione «Buscar celular»."); $("aPanel").classList.add("oculto"); });

// --- WhatsApp
const WA_BASES = ["/sdcard/Android/media/com.whatsapp/WhatsApp/Media", "/sdcard/WhatsApp/Media", "/sdcard/Android/media/com.whatsapp.w4b/WhatsApp Business/Media"];
const WA_NOMBRES = { "WhatsApp Images": "Fotos", "WhatsApp Video": "Videos", "WhatsApp Audio": "Audios", "WhatsApp Voice Notes": "Notas de voz", "WhatsApp Documents": "Documentos",
  "WhatsApp Animated Gifs": "GIF", "WhatsApp Stickers": "Stickers", "WhatsApp Video Notes": "Videonotas", ".Statuses": "Estados vistos",
  "WhatsApp Business Images": "Fotos (Business)", "WhatsApp Business Video": "Videos (Business)", "WhatsApp Business Documents": "Documentos (Business)", "WhatsApp Business Audio": "Audios (Business)", "WhatsApp Business Voice Notes": "Notas de voz (Business)" };
let waCarpetas = [];
$("aWaAnalizar").addEventListener("click", () => trabajando("Analizando WhatsApp…", async () => {
  waCarpetas = [];
  for (const base of WA_BASES) {
    const r = await sh(`cd ${q(base)} 2>/dev/null && du -sk * .Statuses 2>/dev/null`, 120000);
    r.out.split("\n").forEach(l => { const m = l.match(/^(\d+)\s+(.+)$/); if (m && +m[1] > 0) waCarpetas.push({ base, nombre: m[2].trim(), kb: +m[1] }); });
  }
  if (!waCarpetas.length) return $("aWa").innerHTML = `<p class="nota">No se encontró la carpeta de WhatsApp o está vacía.</p>`;
  waCarpetas.sort((a, b) => b.kb - a.kb);
  const total = waCarpetas.reduce((a, c) => a + c.kb, 0);
  $("aWa").innerHTML = `<p>Total WhatsApp: <b>${tam(total)}</b></p><table class="tabla"><tr><th>Tipo</th><th>Tamaño</th><th>Borrar archivos con más de…</th></tr>` +
    waCarpetas.map((c, i) => `<tr><td>${esc(WA_NOMBRES[c.nombre] || c.nombre)}</td><td>${tam(c.kb)}</td><td>
      <select id="waDias${i}"><option value="30">1 mes</option><option value="90" selected>3 meses</option><option value="180">6 meses</option><option value="365">1 año</option><option value="0">Todo</option></select>
      <button class="peligro chico" data-wa="${i}">Borrar</button></td></tr>`).join("") + `</table>`;
}));
$("aWa").addEventListener("click", e => {
  const b = e.target.closest("button[data-wa]"); if (!b) return;
  const c = waCarpetas[+b.dataset.wa], dias = +$("waDias" + b.dataset.wa).value, nom = WA_NOMBRES[c.nombre] || c.nombre;
  if (!confirm(`¿Borrar ${dias ? `los archivos de «${nom}» con más de ${dias} días` : `TODOS los archivos de «${nom}»`}?\n\nNo se puede deshacer. Si quiere conservarlos, use antes «Respaldar › Multimedia de WhatsApp».`)) return;
  trabajando("Borrando…", async () => {
    const ruta = `${c.base}/${c.nombre}`;
    await sh(`find ${q(ruta)} -type f ! -name '.nomedia' ${dias ? `-mtime +${dias}` : ""} -delete`, 300000);
    await sh(`am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d ${q("file://" + ruta)} >/dev/null 2>&1`);
    $("aWaAnalizar").click(); almacenA();
  });
});

// --- archivos grandes
let grandes = [];
$("aGrandes").addEventListener("click", () => trabajando("Buscando archivos grandes…", async () => {
  const r = await sh("find /sdcard/ -type f -size +51200k ! -path '*/Android/data/*' ! -path '*/Android/obb/*' -exec stat -c '%s|%n' {} + 2>/dev/null", 300000);
  grandes = r.out.split("\n").map(l => { const i = l.indexOf("|"); return i > 0 ? { b: +l.slice(0, i), ruta: l.slice(i + 1).trim() } : null; }).filter(Boolean).sort((a, b) => b.b - a.b);
  $("aGrandesLista").innerHTML = grandes.length ? `<table class="tabla"><tr><th>Archivo</th><th>Tamaño</th><th></th></tr>` + grandes.map((g, i) =>
    `<tr><td>${esc(g.ruta.replace("/sdcard/", ""))}</td><td>${tam(g.b / 1024)}</td><td style="white-space:nowrap"><button class="sec chico" data-guardar="${i}">Copiar a PC</button> <button class="peligro chico" data-borrar="${i}">Borrar</button></td></tr>`).join("") + `</table>`
    : `<p class="nota">No hay archivos de más de 50 MB.</p>`;
}));
$("aGrandesLista").addEventListener("click", async e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.borrar) { const g = grandes[+b.dataset.borrar]; if (!confirm(`¿Borrar del celular?\n${g.ruta}\n\nNo se puede deshacer.`)) return;
    await trabajando("Borrando…", () => sh(`rm -f ${q(g.ruta)}`)); b.closest("tr").remove(); almacenA(); }
  if (b.dataset.guardar) { const g = grandes[+b.dataset.guardar], dest = await sistema.elegirCarpeta(); if (!dest) return;
    const r = await trabajando("Copiando a la computadora…", () => adb(["pull", g.ruta, dest], 3600000));
    alert(r.ok ? "✅ Copiado a " + dest : "No se pudo copiar:\n" + r.err); }
});

// --- respaldos
document.querySelectorAll("[data-respaldo]").forEach(b => b.addEventListener("click", async () => {
  const dest = await sistema.elegirCarpeta(); if (!dest) return;
  let origenes = [b.dataset.respaldo];
  if (origenes[0] === "WA") origenes = [];
  if (b.dataset.respaldo === "WA") for (const base of WA_BASES) if ((await sh(`[ -d ${q(base)} ] && echo si`)).out.includes("si")) origenes.push(base);
  const res = [];
  for (const o of origenes) {
    const r = await trabajando(`Copiando ${o.replace("/sdcard/", "")} a la computadora… (puede tardar varios minutos)`, () => adb(["pull", "-a", o, dest], 6 * 3600000));
    res.push(r.ok ? `✅ ${o.replace("/sdcard/", "")}: ${(r.out.trim().split("\n").pop() || "copiado")}` : `❌ ${o}: ${r.err.trim().split("\n").pop()}`);
  }
  mostrar("aResp", (res.join("\n") || "No había nada que copiar.") + `\n\nGuardado en: ${dest}`);
  sistema.abrir(dest);
}));

// --- aplicaciones
const BLOAT = {
  "com.facebook.appmanager": "Facebook App Manager", "com.facebook.services": "Facebook Services", "com.facebook.system": "Facebook App Installer", "com.facebook.katana": "Facebook (preinstalada)",
  "com.netflix.partner.activation": "Netflix (activación de fábrica)", "com.netflix.mediaclient": "Netflix (preinstalada)", "com.linkedin.android": "LinkedIn (preinstalada)",
  "com.microsoft.skydrive": "OneDrive (preinstalada)", "com.microsoft.office.officehubrow": "Microsoft 365 (preinstalada)", "com.spotify.music": "Spotify (preinstalada)",
  "com.amazon.mShop.android.shopping": "Amazon (preinstalada)", "com.amazon.appmanager": "Amazon App Manager", "com.booking": "Booking (preinstalada)", "com.tiktok.android": "TikTok (preinstalada)",
  "com.samsung.android.app.tips": "Samsung Consejos", "com.samsung.android.bixby.agent": "Bixby", "com.samsung.android.bixby.wakeup": "Bixby voz", "com.samsung.android.bixbyvision.framework": "Bixby Vision",
  "com.samsung.android.visionintelligence": "Bixby Vision", "com.samsung.android.app.spage": "Samsung Free / Bixby Home", "com.samsung.android.ardrawing": "AR Doodle", "com.samsung.android.aremoji": "AR Emoji",
  "com.samsung.android.arzone": "AR Zone", "com.samsung.android.game.gamehome": "Game Launcher", "com.samsung.android.game.gametools": "Game Tools", "com.samsung.android.mdx.kit": "Samsung Continuity",
  "com.samsung.android.kidsinstaller": "Samsung Kids", "com.samsung.android.app.watchmanagerstub": "Galaxy Wearable (instalador)", "com.samsung.android.tvplus": "Samsung TV Plus", "com.samsung.android.scloud": "Samsung Cloud",
  "com.miui.msa.global": "Anuncios de Xiaomi (MSA)", "com.miui.analytics": "Analítica de Xiaomi", "com.miui.daemon": "Recolector de datos MIUI", "com.xiaomi.mipicks": "GetApps (tienda Xiaomi)",
  "com.miui.videoplayer": "Mi Video", "com.miui.player": "Mi Music", "com.mi.globalbrowser": "Mi Browser", "com.xiaomi.glgm": "Juegos Xiaomi", "com.miui.yellowpage": "Páginas amarillas MIUI",
  "com.zhiliaoapp.musically": "TikTok (preinstalada)", "com.hihonor.hnstore": "Tienda Honor", "com.huawei.appmarket": "AppGallery", "com.transsion.phonemaster": "Phone Master (Tecno/Infinix)",
  "com.transsion.aivoiceassistant": "Asistente Tecno/Infinix", "com.google.android.apps.youtube.music": "YouTube Music", "com.google.android.apps.tachyon": "Google Meet/Duo",
  "com.google.android.videos": "Google TV / Play Películas", "com.google.android.apps.podcasts": "Google Podcasts", "com.google.android.apps.magazines": "Google Noticias",
};
let apps = [];
$("aCargarApps").addEventListener("click", () => cargarApps());
$("aTipoApps").addEventListener("change", () => cargarApps());
$("aBuscarApp").addEventListener("input", pintarApps);
async function cargarApps() {
  if (!serial) return;
  await trabajando("Leyendo aplicaciones…", async () => {
    const lista = async f => (await sh("pm list packages " + f)).out.split("\n").map(l => l.replace("package:", "").trim()).filter(Boolean);
    const tipo = $("aTipoApps").value;
    if (tipo === "quitadas") { const inst = new Set(await lista("")); apps = (await lista("-u")).filter(p => !inst.has(p)).map(p => ({ p, quitada: true })); }
    else if (tipo === "bloat") { const inst = new Set(await lista("")); apps = Object.keys(BLOAT).filter(p => inst.has(p)).map(p => ({ p })); }
    else apps = (await lista("-" + tipo)).map(p => ({ p, usuario: tipo === "3" }));
    apps.sort((a, b) => (BLOAT[b.p] ? 1 : 0) - (BLOAT[a.p] ? 1 : 0) || a.p.localeCompare(b.p));
  });
  pintarApps();
}
function pintarApps() {
  const f = $("aBuscarApp").value.toLowerCase(), l = apps.filter(a => !f || a.p.includes(f) || (BLOAT[a.p] || "").toLowerCase().includes(f));
  $("aApps").innerHTML = l.length ? `<p class="nota">${l.length} aplicación(es)</p><table class="tabla"><tr><th>Aplicación</th><th>Paquete</th><th></th></tr>` + l.map(a =>
    `<tr><td>${BLOAT[a.p] ? "✅ " + esc(BLOAT[a.p]) : "—"}</td><td>${esc(a.p)}</td><td style="white-space:nowrap">${a.quitada
      ? `<button class="sec chico" data-restaurar="${esc(a.p)}">Restaurar</button>`
      : `<button class="peligro chico" data-quitar="${esc(a.p)}" data-usuario="${a.usuario ? 1 : ""}">${a.usuario ? "Desinstalar" : "Quitar"}</button>`}</td></tr>`).join("") + `</table>`
    : `<p class="nota">${$("aTipoApps").value === "bloat" ? "🎉 No se encontraron apps de fábrica conocidas para quitar." : "No hay aplicaciones en esta lista."}</p>`;
}
$("aApps").addEventListener("click", async e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.quitar) {
    const p = b.dataset.quitar, usuario = !!b.dataset.usuario;
    if (!BLOAT[p] && !usuario && !confirm(`«${p}» es una app del sistema que NO está en la lista de seguras.\nQuitarla podría hacer fallar alguna función del celular.\n\n¿Está seguro? (Se puede restaurar después.)`)) return;
    if (usuario && !confirm(`¿Desinstalar «${p}»? Se borran también sus datos.`)) return;
    const r = await trabajando("Quitando…", () => sh(usuario ? `pm uninstall ${q(p)}` : `pm uninstall -k --user 0 ${q(p)}`));
    if (/Success/i.test(r.out)) b.closest("tr").remove(); else alert("No se pudo quitar:\n" + (r.out + r.err).trim());
  }
  if (b.dataset.restaurar) {
    const r = await trabajando("Restaurando…", () => sh(`cmd package install-existing ${q(b.dataset.restaurar)}`));
    if (/installed/i.test(r.out)) b.closest("tr").remove(); else alert("No se pudo restaurar:\n" + (r.out + r.err).trim());
  }
});

// =====================================================================
// IPHONE (libimobiledevice)
// =====================================================================
let udid = null;
const ios = (h, args, ms) => sistema.ejecutar(h, udid ? ["-u", udid, ...args] : args, ms);
const plistDic = t => { const o = {}; t.split("\n").forEach(l => { const m = l.match(/^\s*([A-Za-z0-9]+):\s*(.*)$/); if (m) o[m[1]] = m[2].trim(); }); return o; };
const MODELOS = { "iPhone10,1": "iPhone 8", "iPhone10,4": "iPhone 8", "iPhone10,2": "iPhone 8 Plus", "iPhone10,5": "iPhone 8 Plus", "iPhone10,3": "iPhone X", "iPhone10,6": "iPhone X",
  "iPhone11,2": "iPhone XS", "iPhone11,4": "iPhone XS Max", "iPhone11,6": "iPhone XS Max", "iPhone11,8": "iPhone XR", "iPhone12,1": "iPhone 11", "iPhone12,3": "iPhone 11 Pro", "iPhone12,5": "iPhone 11 Pro Max",
  "iPhone12,8": "iPhone SE (2.ª gen.)", "iPhone13,1": "iPhone 12 mini", "iPhone13,2": "iPhone 12", "iPhone13,3": "iPhone 12 Pro", "iPhone13,4": "iPhone 12 Pro Max", "iPhone14,4": "iPhone 13 mini",
  "iPhone14,5": "iPhone 13", "iPhone14,2": "iPhone 13 Pro", "iPhone14,3": "iPhone 13 Pro Max", "iPhone14,6": "iPhone SE (3.ª gen.)", "iPhone14,7": "iPhone 14", "iPhone14,8": "iPhone 14 Plus",
  "iPhone15,2": "iPhone 14 Pro", "iPhone15,3": "iPhone 14 Pro Max", "iPhone15,4": "iPhone 15", "iPhone15,5": "iPhone 15 Plus", "iPhone16,1": "iPhone 15 Pro", "iPhone16,2": "iPhone 15 Pro Max",
  "iPhone17,3": "iPhone 16", "iPhone17,4": "iPhone 16 Plus", "iPhone17,1": "iPhone 16 Pro", "iPhone17,2": "iPhone 16 Pro Max", "iPhone17,5": "iPhone 16e" };
function estadoI(clase, html) { $("iEstado").className = "estado " + clase; $("iEstado").innerHTML = html; }

async function buscarIphone() {
  const r = await sistema.ejecutar("idevice_id", ["-l"], 20000);
  if (r.falta) return estadoI("error", "No se encontraron las herramientas de iPhone. Vuelva a descargar el programa completo.");
  const ids = r.out.split("\n").map(s => s.trim()).filter(Boolean);
  if (!ids.length) { $("iPanel").classList.add("oculto"); udid = null;
    return estadoI("", "No se detecta ningún iPhone. Revise que esté <b>desbloqueado</b> y que la computadora tenga instalado <b>«Dispositivos Apple»</b> o <b>iTunes</b> (vea «Cómo conectar»)."); }
  udid = ids[0];
  const info = await ios("ideviceinfo", [], 30000);
  if (!info.ok) {
    await ios("idevicepair", ["pair"], 30000);
    return estadoI("", "📲 iPhone detectado. <b>Desbloquéelo</b> y toque <b>«Confiar»</b> en el mensaje que aparece; luego presione otra vez «Buscar celular».");
  }
  const d = plistDic(info.out);
  estadoI("ok", `✅ Conectado: <b>${esc(d.DeviceName || "iPhone")}</b> · ${esc(MODELOS[d.ProductType] || d.ProductType)} · iOS ${esc(d.ProductVersion)}`);
  $("iPanel").classList.remove("oculto");
  $("iInfo").innerHTML = dato("Nombre", esc(d.DeviceName)) + dato("Modelo", esc(MODELOS[d.ProductType] || d.ProductType)) + dato("iOS", esc(d.ProductVersion))
    + dato("Número de serie", esc(d.SerialNumber)) + dato("Color / capacidad", esc([d.DeviceColor, d.ModelNumber].filter(Boolean).join(" · ")));
  await Promise.all([bateriaI(), almacenI()]);
}

async function bateriaI() {
  const b = plistDic((await ios("ideviceinfo", ["-q", "com.apple.mobile.battery"])).out);
  const x = (await ios("idevicediagnostics", ["ioregentry", "AppleSmartBattery"], 30000)).out;
  const k = n => { const m = x.match(new RegExp(`<key>${n}</key>\\s*<integer>(-?\\d+)</integer>`)); return m ? +m[1] : null; };
  const diseno = k("DesignCapacity"), maxima = k("AppleRawMaxCapacity") ?? k("NominalChargeCapacity"), ciclos = k("CycleCount"), temp = k("Temperature");
  const salud = diseno && maxima ? Math.min(100, maxima / diseno * 100) : null;
  $("iBateria").innerHTML = `<b style="font-size:22px">${esc(b.BatteryCurrentCapacity ?? "—")}%</b>${barra(+b.BatteryCurrentCapacity || 0, true)}`
    + dato("Cargando", b.BatteryIsCharging === "true" ? "Sí" : "No")
    + (salud ? dato("Salud (capacidad máxima)", `<span class="${salud >= 85 ? "bueno" : salud >= 80 ? "medio" : "malo"}">${salud.toFixed(0)} %</span>`) : "")
    + (ciclos != null ? dato("Ciclos de carga", ciclos) : "") + (diseno ? dato("Capacidad original / actual", `${diseno} / ${maxima} mAh`) : "")
    + (temp != null ? dato("Temperatura", `${(temp / 100).toFixed(1)} °C`) : "")
    + `<p class="nota">${salud && salud < 80 ? "⚠️ Por debajo del 80 %: Apple recomienda cambiar la batería." : "Por encima del 80 % la batería se considera en buen estado."}</p>`;
}
async function almacenI() {
  const d = plistDic((await ios("ideviceinfo", ["-q", "com.apple.disk_usage"])).out);
  const total = +d.TotalDiskCapacity, libre = +(d.AmountDataAvailable || d.TotalDataAvailable), pct = total ? (total - libre) / total * 100 : 0;
  $("iAlmac").innerHTML = total ? `${barra(pct)}` + dato("Capacidad", (total / 1e9).toFixed(0) + " GB") + dato("Libre", `<span class="${pct > 90 ? "malo" : pct > 75 ? "medio" : "bueno"}">${(libre / 1e9).toFixed(1)} GB</span>`)
    + dato("Usado", `${pct.toFixed(0)} %`) + (pct > 85 ? `<p class="nota">⚠️ Casi lleno: el iPhone se pone lento y no se actualiza. Vea los consejos abajo.</p>` : "") : `<p class="nota">No disponible.</p>`;
}
$("iReiniciar").addEventListener("click", async () => { if (!confirm("¿Reiniciar el iPhone ahora?")) return; await ios("idevicediagnostics", ["restart"]); estadoI("", "🔁 Reiniciando… Cuando encienda, desbloquéelo y presione «Buscar celular»."); $("iPanel").classList.add("oculto"); });
$("iLogs").addEventListener("click", async () => {
  const dest = await sistema.elegirCarpeta(); if (!dest) return;
  const r = await trabajando("Extrayendo y limpiando registros de errores…", () => ios("idevicecrashreport", [dest], 600000));
  mostrar("iRes", r.ok ? `✅ Registros de errores movidos a la computadora (${dest}) y borrados del iPhone.` : "No se pudieron limpiar: " + r.err);
});
$("iFotos").addEventListener("click", async () => {
  mostrar("iRes", "Se abrirá la importación de fotos de Windows (aplicación «Fotos»):\n1. En Fotos, toque «Importar» › «Desde un dispositivo conectado» y elija el iPhone.\n2. Elija las fotos y la carpeta, y presione «Importar».\nSi no abre, abra «Este equipo», entre al iPhone › Internal Storage › DCIM y copie las carpetas.");
  sistema.abrirUrl("ms-photos:");
});

// =====================================================================
async function buscarTodo() {
  $("btnBuscar").disabled = true;
  try { await trabajando("Buscando celulares conectados…", () => Promise.all([buscarAndroid(), buscarIphone()]));
    if (udid && !serial) document.querySelector('nav button[data-tab="iphone"]').click();
    if (serial) document.querySelector('nav button[data-tab="android"]').click();
  } finally { $("btnBuscar").disabled = false; }
}
$("btnBuscar").addEventListener("click", buscarTodo);
buscarTodo();
