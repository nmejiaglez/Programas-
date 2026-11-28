// Buscar a una amiga por su nombre, invitarla y que ella acepte o rechace
const { chromium, devices } = require("playwright");
const path = require("path");
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;
async function tel(b, save) {
  const ctx = await b.newContext({ ...devices["Pixel 7"], ignoreHTTPSErrors: true }); const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(e.message));
  await p.addInitScript(s => localStorage.setItem("miCiudad.v1", s), JSON.stringify(save));
  await p.goto("file://" + path.resolve(__dirname, "../www/index.html") + "?test=1");
  await p.waitForFunction(() => window.__t && __t.NET.ok, null, { timeout: 30000 }); return { p, errs };
}
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=swiftshader"], proxy: PROXY ? { server: PROXY } : undefined });
  const nombre = "Zafiro" + String.fromCharCode(97 + Math.floor(Math.random() * 26)) + String.fromCharCode(97 + Math.floor(Math.random() * 26));
  const A = await tel(b, { name: nombre, created: true, money: 100, mc: 10 });
  const B = await tel(b, { name: "Luna", created: true, money: 100, mc: 10 });
  const bad = [];
  await A.p.evaluate(() => __t.pushCloud(true)); await A.p.waitForTimeout(1500);
  // B busca a A
  await B.p.evaluate(q => __t.openSearch(q), nombre.slice(0, 5)); await B.p.waitForTimeout(3000);
  const found = await B.p.$$eval(".fcard b", els => els.map(e => e.textContent));
  console.log("encontró:", found); if (!found.includes(nombre)) bad.push("no la encontró");
  await B.p.screenshot({ path: (process.argv[2] || "/tmp") + "/inv_buscar.png" });
  await B.p.click(".fcard >> text=💌 Invitar"); await B.p.waitForTimeout(2500);
  const roomB = await B.p.evaluate(() => __t.NET.room);
  // A recibe y acepta
  await A.p.waitForSelector("text=✅ Aceptar", { timeout: 20000 }).catch(() => bad.push("no le llegó la invitación"));
  await A.p.screenshot({ path: (process.argv[2] || "/tmp") + "/inv_recibe.png" });
  await A.p.click("text=✅ Aceptar").catch(() => {}); await A.p.waitForTimeout(3000);
  const roomA = await A.p.evaluate(() => __t.NET.room);
  console.log("salas:", roomA, roomB); if (!roomA || roomA !== roomB) bad.push("no entró a la sala");
  // segunda invitación: rechazar
  await A.p.evaluate(() => __t.leaveRoom()); await B.p.waitForTimeout(31000);
  await B.p.evaluate(() => { __t.closeSheet(); });
  await B.p.evaluate(q => __t.openSearch(q), nombre); await B.p.waitForTimeout(3000);
  await B.p.click(".fcard >> text=💌 Invitar").catch(() => bad.push("no pudo reinvitar")); await B.p.waitForTimeout(1500);
  await A.p.waitForSelector("text=❌ No, gracias", { timeout: 20000 }).catch(() => bad.push("no llegó la segunda"));
  await A.p.click("text=❌ No, gracias").catch(() => {}); await A.p.waitForTimeout(1500);
  const quedo = await A.p.evaluate(async () => { try { return await __t.db("GET", "invites/" + __t.NET.uid); } catch (e) { return "ERROR " + e.message; } });
  if (quedo) bad.push("la invitación no se borró");
  console.log("después de rechazar:", quedo, "sala A:", await A.p.evaluate(() => __t.NET.room));
  // limpiar
  for (const J of [A, B]) await J.p.evaluate(async () => { __t.leaveRoom(); const u = __t.NET.uid; for (const x of ["users/" + u, "perfiles/" + u, "ranking/" + u, "invites/" + u]) { try { await __t.db("DELETE", x); } catch (e) {} }
    await fetch("https://identitytoolkit.googleapis.com/v1/accounts:delete?key=AIzaSyCcK3SfW8lpa5fiDyr8BJzofaRqG3zTfg8", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: __t.NET.token }) }); });
  console.log("ERRORES", A.errs.concat(B.errs, bad));
  await b.close();
})();
