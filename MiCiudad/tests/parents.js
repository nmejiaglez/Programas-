// Control de padres, filtro de nombres y cuenta con correo (en línea)
const { chromium, devices } = require("playwright");
const path = require("path");
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"], proxy: PROXY ? { server: PROXY } : undefined });
  const ctx = await b.newContext({ ...devices["Pixel 7"], ignoreHTTPSErrors: true }); const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push("PAGEERROR " + e.message));
  await p.goto("file://" + path.resolve(__dirname, "../www/index.html") + "?test=1");
  await p.waitForFunction(() => window.__t, null, { timeout: 30000 });
  // nombres
  const casos = ["Sofía", "Mateo", "puta", "Kevin 88812345", "ana@gmail.com", "Valeria", "Pendejo123", "Panda Veloz", "Sebastián"];
  console.log("filtro:", await p.evaluate(c => c.map(n => n + "→" + (__t.nombreProblema(n) ? "NO" : "ok")), casos));
  await p.fill("#welName", "puta"); await p.click("text=¡A jugar!"); await p.waitForTimeout(200);
  console.log("bienvenida bloqueó nombre feo:", await p.evaluate(() => !__t.S.created));
  await p.click("text=🎲 Elegir un nombre al azar"); const auto = await p.inputValue("#welName"); await p.click("text=¡A jugar!"); await p.waitForTimeout(300);
  console.log("nombre al azar:", auto, "creado:", await p.evaluate(() => __t.S.created));
  // control de padres: poner clave, límite 5 USD
  await p.evaluate(() => __t.openParents()); await p.fill("#parNew", "4321"); await p.click("text=Poner clave"); await p.waitForTimeout(200);
  await p.click(".seg >> text=US$ 5"); await p.waitForTimeout(200); await p.evaluate(() => __t.closeSheet());
  // comprar paquete pide clave
  await p.evaluate(() => __t.openShop("paquetes")); await p.click(".pack >> nth=2 >> button"); await p.waitForTimeout(200);
  console.log("pide clave:", await p.locator("#parPin").count());
  await p.fill("#parPin", "0000"); await p.click("text=Aceptar"); await p.waitForTimeout(200);
  console.log("clave mala rechazada:", await p.locator("#parPin").count());
  await p.fill("#parPin", "4321"); await p.click("text=Aceptar"); await p.waitForTimeout(200);
  console.log("con la clave abre compra por WhatsApp:", await p.locator("text=💬 Pedir por WhatsApp").count());
  await p.evaluate(() => __t.closeSheet());
  await p.evaluate(() => __t.closeSheet());
  // recordatorio de descanso (forzado a 3 segundos)
  await p.evaluate(() => { __t.S.parent.time = 0.05; }); await p.waitForSelector("text=¡Hora de descansar!", { timeout: 25000 }).catch(() => {});
  const rec = await p.locator("text=¡Hora de descansar!").count(); console.log("recordatorio:", rec); if (!rec) errs.push("no salió el recordatorio");
  await p.evaluate(() => { __t.S.parent.time = 0; __t.closeSheet(); });
  // salas desactivadas
  await p.evaluate(() => { __t.S.parent.rooms = false; __t.openFriends(); }); await p.waitForTimeout(200);
  console.log("salas desactivadas:", await p.locator("text=desactivaron").count());
  await p.evaluate(() => { __t.S.parent.rooms = true; __t.closeSheet(); });
  // cuenta con correo (pide clave de padres)
  await p.waitForFunction(() => __t.NET.ok, null, { timeout: 30000 });
  const uid0 = await p.evaluate(() => __t.NET.uid);
  const mail = "papas" + Date.now().toString(36);
  await p.evaluate(() => __t.openAccount()); await p.click("text=✨ Crear mi cuenta"); await p.fill("#parPin", "4321"); await p.click("text=Aceptar");
  await p.fill("#cuUser", mail); await p.fill("#cuPass", "clave123"); await p.fill("#cuPass2", "clave123"); await p.click("#cuGo"); await p.waitForTimeout(4000);
  console.log("cuenta guardada:", await p.evaluate(() => __t.NET.email), "mismo uid:", await p.evaluate(u => __t.NET.uid === u, uid0));
  // limpiar
  await p.evaluate(async () => { const u = __t.NET.uid; for (const x of ["users/" + u, "perfiles/" + u, "ranking/" + u]) { try { await __t.db("DELETE", x); } catch (e) {} }
    await fetch("https://identitytoolkit.googleapis.com/v1/accounts:delete?key=AIzaSyCcK3SfW8lpa5fiDyr8BJzofaRqG3zTfg8", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: __t.NET.token }) }); });
  console.log("ERRORES", errs);
  await b.close();
})();
