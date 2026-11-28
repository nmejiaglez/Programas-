// Cerrar sesión deja el aparato en cero y se puede volver a entrar
const { chromium, devices } = require("playwright");
const path = require("path");
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;
const KEY = "AIzaSyCcK3SfW8lpa5fiDyr8BJzofaRqG3zTfg8";
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=swiftshader"], proxy: PROXY ? { server: PROXY } : undefined });
  const ctx = await b.newContext({ ...devices["Pixel 7"], ignoreHTTPSErrors: true }); const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(e.message));
  await p.addInitScript(s => { if (!sessionStorage.getItem("ya")) { sessionStorage.setItem("ya", 1); localStorage.setItem("miCiudad.v1", s); } }, JSON.stringify({ name: "Dueno", created: true, money: 999, mc: 1000000 }));
  const url = "file://" + path.resolve(__dirname, "../www/index.html") + "?test=1";
  await p.goto(url); await p.waitForFunction(() => window.__t && __t.NET.ok, null, { timeout: 30000 });
  const mail = "salir." + Date.now() + "@example.com";
  await p.evaluate(() => __t.openAccount()); await p.fill("#accEmail", mail); await p.fill("#accPass", "clave123");
  await p.click("text=Guardar mi cuenta"); await p.waitForTimeout(4000);
  const uid1 = await p.evaluate(() => __t.NET.uid);
  await p.evaluate(() => __t.openAccount()); await p.click("text=Cerrar sesión en este aparato"); await p.waitForTimeout(500);
  await Promise.all([p.waitForNavigation(), p.click(".sheet >> text=Cerrar sesión >> nth=-1")]);
  await p.waitForFunction(() => window.__t && __t.NET.ok, null, { timeout: 30000 });
  const tras = await p.evaluate(() => [__t.S.mc, __t.S.money, __t.NET.uid, __t.NET.token, __t.NET.email]);
  console.log("tras cerrar sesión:", tras[0], tras[1], tras[2] !== uid1 ? "uid nuevo" : "MISMO UID", tras[4]);
  if (tras[0] >= 1000000 || tras[2] === uid1) errs.push("no se limpió");
  await p.evaluate(() => __t.openAccount()); await p.fill("#logEmail", mail); await p.fill("#logPass", "clave123");
  await p.click("text=Entrar con mi correo"); await p.waitForTimeout(5000);
  const back = await p.evaluate(() => [__t.S.mc, __t.NET.uid, __t.NET.email]);
  console.log("al volver a entrar:", back[0], back[1] === uid1 ? "mismo uid" : "OTRO UID", back[2]);
  if (back[0] !== 1000000 || back[1] !== uid1) errs.push("no recuperó");
  await p.evaluate(async () => { const u = __t.NET.uid; for (const x of ["users/" + u, "perfiles/" + u, "ranking/" + u]) { try { await __t.db("DELETE", x); } catch (e) {} } }).catch(() => {});
  await p.evaluate(async ([k, t]) => { await fetch("https://identitytoolkit.googleapis.com/v1/accounts:delete?key=" + k, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: __t.NET.token }) }); }, [KEY]);
  await p.evaluate(async ([k, u, t]) => { for (const x of ["users/", "perfiles/", "ranking/"]) { try { await fetch("https://mi-ciudad-c3dd2-default-rtdb.firebaseio.com/" + x + u + ".json?auth=" + t, { method: "DELETE" }); } catch (e) {} }
    await fetch("https://identitytoolkit.googleapis.com/v1/accounts:delete?key=" + k, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: t }) }); }, [KEY, tras[2], tras[3]]);
  console.log("ERRORES", errs);
  await b.close();
})();
