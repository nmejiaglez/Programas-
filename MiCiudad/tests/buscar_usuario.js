// Buscar a un amigo por su nombre de usuario de la cuenta
const { chromium, devices } = require("playwright");
const path = require("path");
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;
async function tel(b, name) {
  const ctx = await b.newContext({ ...devices["Pixel 7"], ignoreHTTPSErrors: true }); const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(e.message));
  await p.addInitScript(s => localStorage.setItem("miCiudad.v1", s), JSON.stringify({ name, created: true }));
  await p.goto("file://" + path.resolve(__dirname, "../www/index.html") + "?test=1");
  await p.waitForFunction(() => window.__t && __t.NET.ok, null, { timeout: 30000 }); return { p, errs };
}
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=swiftshader"], proxy: PROXY ? { server: PROXY } : undefined });
  const u = "nina" + Date.now().toString(36).slice(-5);
  const A = await tel(b, "Valentina"), B = await tel(b, "Amiga"); const bad = [];
  await A.p.evaluate(u => __t.crearCuenta(u, "2017", "2017"), u); await A.p.waitForTimeout(1500);
  await B.p.evaluate(q => __t.openSearch(q), u); await B.p.waitForTimeout(3500);
  const found = await B.p.$$eval(".fcard", els => els.map(e => e.textContent));
  console.log("buscó", u, "→", found); if (!found.some(t => t.indexOf("Valentina") >= 0 && t.indexOf("@" + u) >= 0)) bad.push("no la encontró por usuario");
  for (const J of [A, B]) await J.p.evaluate(async () => { __t.NET.ok = false; const u = __t.NET.uid, t = __t.NET.token; for (const x of ["users/", "perfiles/", "ranking/"]) { try { await fetch("https://mi-ciudad-c3dd2-default-rtdb.firebaseio.com/" + x + u + ".json?auth=" + t, { method: "DELETE" }); } catch (e) {} }
    await fetch("https://identitytoolkit.googleapis.com/v1/accounts:delete?key=AIzaSyCcK3SfW8lpa5fiDyr8BJzofaRqG3zTfg8", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: t }) }); });
  console.log("ERRORES", A.errs.concat(B.errs, bad)); await b.close();
})();
