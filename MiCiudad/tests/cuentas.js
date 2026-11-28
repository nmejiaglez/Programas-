// Cuentas con usuario y contraseña: crear, recordar, cerrar sesión, volver a entrar, errores y compra por WhatsApp
const { chromium, devices } = require("playwright");
const path = require("path");
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;
const KEY = "AIzaSyCcK3SfW8lpa5fiDyr8BJzofaRqG3zTfg8";
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=swiftshader"], proxy: PROXY ? { server: PROXY } : undefined });
  const ctx = await b.newContext({ ...devices["Pixel 7"], ignoreHTTPSErrors: true }); const p = await ctx.newPage(); const errs = []; const bad = [];
  p.on("pageerror", e => errs.push(e.message));
  let wa = null; await ctx.route("https://wa.me/**", r => { wa = r.request().url(); r.fulfill({ status: 200, body: "ok" }); });

  const url = "file://" + path.resolve(__dirname, "../www/index.html");
  const u = "prueba" + Date.now().toString(36);
  await p.goto(url); await p.waitForSelector("#hCrear", { timeout: 30000 });
  // crear
  await p.click("#hCrear"); await p.fill("#cuUser", u); await p.fill("#cuPass", "clave123"); await p.fill("#cuPass2", "clave999");
  await p.click("#cuGo"); await p.waitForTimeout(300);
  const e1 = await p.textContent(".accerr"); if (e1.indexOf("no son iguales") < 0) bad.push("no avisó contraseñas distintas");
  await p.fill("#cuPass2", "clave123"); await p.click("#cuGo"); await p.waitForSelector(".hgame", { timeout: 30000 });
  // jugar y crear personaje
  await p.click(".tplay", { force: true }); await p.fill("#welName", "Lunita"); await p.click("text=¡A jugar!"); await p.waitForTimeout(800);
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("miCiudad.v1")); }); 
  // compra -> WhatsApp, no gratis
  const mc0 = await p.evaluate(() => JSON.parse(localStorage.getItem("miCiudad.v1")).mc);
  await p.click("#mcBtn"); await p.click(".pack >> nth=1 >> button"); await p.waitForTimeout(400);
  const hasWa = await p.locator("text=💬 Pedir por WhatsApp").count(); if (!hasWa) bad.push("no ofrece comprar por WhatsApp");
  await p.click("text=💬 Pedir por WhatsApp").catch(() => {}); await p.waitForTimeout(800);
  const mc1 = await p.evaluate(() => JSON.parse(localStorage.getItem("miCiudad.v1")).mc);
  if (mc1 !== mc0) bad.push("las MediCoins se regalaron (" + mc0 + "→" + mc1 + ")");
  console.log("MediCoins al empezar:", mc0, "· WhatsApp:", decodeURIComponent(String(wa).split("text=")[1] || "no abrió"));
  // recordar sesión
  await p.goto(url); await p.waitForSelector("#title", { timeout: 30000 }); await p.waitForTimeout(1500);
  const recordo = await p.locator(".hgame").count(); if (!recordo) bad.push("no recordó la sesión");
  // cerrar sesión
  await p.click(".tplay", { force: true }); await p.waitForTimeout(500);
  await p.evaluate(() => { document.querySelector("#bSet").click(); }); await p.click("text=👤 Mi cuenta"); await p.waitForTimeout(400);
  const verUser = await p.locator(".sheet >> text=" + u).count(); if (!verUser) bad.push("Mi cuenta no muestra el usuario");
  await p.click("text=Cerrar sesión en este aparato"); await p.waitForTimeout(300);
  await Promise.all([p.waitForNavigation(), p.click(".sheet >> text=Cerrar sesión >> nth=-1")]);
  await p.waitForSelector("#hCrear", { timeout: 30000 });
  // contraseña equivocada
  await p.click("#hEntrar"); await p.fill("#inUser", u); await p.fill("#inPass", "malamala"); await p.click("#inGo"); await p.waitForTimeout(2500);
  const e2 = await p.textContent(".accerr"); if (e2.indexOf("incorrectos") < 0) bad.push("no avisó contraseña incorrecta: " + e2);
  // usuario repetido
  await p.click("text=No tengo cuenta: crear una"); await p.fill("#cuUser", u); await p.fill("#cuPass", "otra123"); await p.fill("#cuPass2", "otra123"); await p.click("#cuGo"); await p.waitForTimeout(2500);
  const e3 = await p.textContent(".accerr"); if (e3.indexOf("ya existe") < 0) bad.push("no avisó usuario repetido: " + e3);
  // entrar bien: recupera el personaje
  await p.click("text=Ya tengo cuenta: iniciar sesión"); await p.fill("#inUser", u.toUpperCase()); await p.fill("#inPass", "clave123"); await p.click("#inGo");
  await p.waitForSelector(".hgame", { timeout: 30000 });
  const nombre = await p.evaluate(() => JSON.parse(localStorage.getItem("miCiudad.v1")).name); if (nombre !== "Lunita") bad.push("no recuperó el personaje: " + nombre);
  console.log("recuperó:", nombre);
  // limpiar
  await p.evaluate(async k => { const a = JSON.parse(localStorage.getItem("miCiudad.auth")); for (const x of ["users/", "perfiles/", "ranking/"]) { try { await fetch("https://mi-ciudad-c3dd2-default-rtdb.firebaseio.com/" + x + a.uid + ".json?auth=" + a.token, { method: "DELETE" }); } catch (e) {} }
    await fetch("https://identitytoolkit.googleapis.com/v1/accounts:delete?key=" + k, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: a.token }) }); }, KEY);
  console.log("ERRORES", errs.concat(bad));
  await b.close();
})();
