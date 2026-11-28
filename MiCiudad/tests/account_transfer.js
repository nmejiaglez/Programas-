// Guardar cuenta en un teléfono y recuperarla en otro
const { chromium, devices } = require("playwright");
const path = require("path");
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;
async function tel(b, save) {
  const ctx = await b.newContext({ ...devices["Pixel 7"], ignoreHTTPSErrors: true }); const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(e.message));
  if (save) await p.addInitScript(s => localStorage.setItem("miCiudad.v1", s), JSON.stringify(save));
  await p.goto("file://" + path.resolve(__dirname, "../www/index.html") + "?test=1");
  await p.waitForFunction(() => window.__t && __t.NET.ok, null, { timeout: 30000 }); return { p, errs };
}
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=swiftshader"], proxy: PROXY ? { server: PROXY } : undefined });
  const mail = "familia" + Date.now().toString(36);
  const A = await tel(b, { name: "Sofi", created: true, money: 12345, mc: 777 });
  await A.p.evaluate(() => __t.openAccount()); await A.p.click("text=✨ Crear mi cuenta"); await A.p.fill("#cuUser", mail); await A.p.fill("#cuPass", "clave123"); await A.p.fill("#cuPass2", "clave123");
  await A.p.click("#cuGo"); await A.p.waitForTimeout(4000);
  console.log("teléfono 1 guardó:", await A.p.evaluate(() => __t.NET.email));
  const B = await tel(b, { name: "Nuevo", created: true, money: 5, mc: 1 });
  const uidTemp = await B.p.evaluate(() => [__t.NET.uid, __t.NET.token]);
  await B.p.evaluate(() => __t.openAccount()); await B.p.click("text=🔑 Entrar con otra cuenta"); await B.p.fill("#inUser", mail); await B.p.fill("#inPass", "clave123");
  await B.p.click("#inGo"); await B.p.waitForTimeout(5000);
  console.log("teléfono 2 recuperó:", await B.p.evaluate(() => [__t.S.name, __t.S.money, __t.S.mc, __t.NET.email]));
  // limpiar
  for (const J of [A]) await J.p.evaluate(async () => { const u = __t.NET.uid; for (const x of ["users/" + u, "perfiles/" + u, "ranking/" + u]) { try { await __t.db("DELETE", x); } catch (e) {} }
    await fetch("https://identitytoolkit.googleapis.com/v1/accounts:delete?key=AIzaSyCcK3SfW8lpa5fiDyr8BJzofaRqG3zTfg8", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: __t.NET.token }) }); });
  await B.p.evaluate(async ([u, t]) => { try { await fetch("https://mi-ciudad-c3dd2-default-rtdb.firebaseio.com/users/" + u + ".json?auth=" + t, { method: "DELETE" }); await fetch("https://mi-ciudad-c3dd2-default-rtdb.firebaseio.com/perfiles/" + u + ".json?auth=" + t, { method: "DELETE" }); } catch (e) {}
    await fetch("https://identitytoolkit.googleapis.com/v1/accounts:delete?key=AIzaSyCcK3SfW8lpa5fiDyr8BJzofaRqG3zTfg8", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: t }) }); }, uidTemp);
  console.log("ERRORES", A.errs, B.errs);
  await b.close();
})();
