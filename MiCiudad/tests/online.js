// Prueba en línea REAL contra Firebase: dos jugadores en la misma sala
const { chromium, devices } = require("playwright");
const path = require("path");
const OUT = process.argv[2] || "/tmp";
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;
async function jugador(b, nombre) {
  const ctx = await b.newContext({ ...devices["Pixel 7"], ignoreHTTPSErrors: true });
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push("PAGEERROR " + e.message));
  p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.addInitScript(n => localStorage.setItem("miCiudad.v1", JSON.stringify({ name: n, created: true, money: 1000, mc: 100 })), nombre);
  await p.goto("file://" + path.resolve(__dirname, "../www/index.html") + "?test=1");
  await p.waitForFunction(() => window.__t && __t.NET.ok, null, { timeout: 30000 });
  return { ctx, p, errs };
}
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"], proxy: PROXY ? { server: PROXY } : undefined });
  const A = await jugador(b, "Ana"), B = await jugador(b, "Bea");
  const uidA = await A.p.evaluate(() => __t.NET.uid), uidB = await B.p.evaluate(() => __t.NET.uid);
  console.log("cuentas", !!uidA, !!uidB, uidA !== uidB);
  // nube
  await A.p.evaluate(() => __t.pushCloud(true));
  const nube = await A.p.evaluate(async () => { const d = await __t.db("GET", "users/" + __t.NET.uid); return d && d.s && d.s.name; });
  console.log("nube guarda nombre:", nube);
  // sala
  const code = "T" + Math.random().toString(36).slice(2, 6).toUpperCase();
  await A.p.evaluate(c => __t.joinRoom(c), code);
  await B.p.evaluate(c => __t.joinRoom(c), code);
  await A.p.waitForTimeout(9000);
  console.log("modo respaldo A/B:", await A.p.evaluate(() => __t.NET.poll), await B.p.evaluate(() => __t.NET.poll));
  const veA = await A.p.evaluate(u => !!(__t.NET.players[u] && __t.NET.remotes[u]), uidB);
  const veB = await B.p.evaluate(u => !!(__t.NET.players[u] && __t.NET.remotes[u]), uidA);
  console.log("Ana ve a Bea:", veA, " Bea ve a Ana:", veB);
  // Bea se mueve
  await B.p.evaluate(() => { __t.P.x = 5; __t.P.z = 18; });
  await A.p.waitForTimeout(2500);
  const posB = await A.p.evaluate(u => { const r = __t.NET.remotes[u]; return r && [Math.round(r.x), Math.round(r.z)]; }, uidB);
  console.log("Ana ve a Bea en", posB);
  await A.p.screenshot({ path: OUT + "/on_A.png" });
  // chat
  await A.p.evaluate(() => __t.sendChat(0));
  await B.p.waitForTimeout(3500);
  const chatB = await B.p.evaluate(() => Object.keys(__t.NET.chatSeen).length);
  console.log("Bea recibió mensajes:", chatB);
  await B.p.screenshot({ path: OUT + "/on_B.png" });
  // lista de la sala y bloqueo
  await A.p.evaluate(() => __t.openFriends()); await A.p.waitForTimeout(300);
  await A.p.screenshot({ path: OUT + "/on_sala.png" });
  await A.p.click("text=🔇 Bloquear"); await A.p.waitForTimeout(300);
  console.log("Ana bloqueó:", await A.p.evaluate(u => !!__t.S.blocked[u], uidB));
  await A.p.evaluate(() => __t.closeSheet());
  // ranking
  await A.p.evaluate(() => __t.openFriends("ranking")); await A.p.waitForTimeout(3000);
  console.log("ranking filas:", await A.p.locator(".sh-b .list .li").count());
  await A.p.screenshot({ path: OUT + "/on_rank.png" });
  await A.p.evaluate(() => __t.closeSheet());
  // código inexistente
  await A.p.evaluate(() => __t.redeemOnline("MC-ZZZZ-ZZZZ")); await A.p.waitForTimeout(1500);
  console.log("toast código:", await A.p.evaluate(() => [...document.querySelectorAll(".toast")].map(t => t.textContent).join(" | ")));
  // panel de dueño (no es dueño)
  await A.p.click("#bSet"); for (let i = 0; i < 5; i++) await A.p.click("text=Mi Ciudad · versión 3.0");
  await A.p.fill("#pinIn", "1234"); await A.p.click("text=Crear clave"); await A.p.waitForTimeout(300);
  console.log("panel muestra número:", await A.p.locator("text=Copiar mi número").count());
  await A.p.screenshot({ path: OUT + "/on_owner.png" });
  await A.p.evaluate(() => __t.closeSheet());
  // salir y limpiar
  for (const J of [A, B]) {
    await J.p.evaluate(async () => { __t.leaveRoom(); const u = __t.NET.uid; for (const p of ["users/" + u, "perfiles/" + u, "ranking/" + u]) { try { await __t.db("DELETE", p); } catch (e) {} } });
  }
  await A.p.waitForTimeout(1500);
  const quedan = await A.p.evaluate(async c => await __t.db("GET", "rooms/" + c + "/players"), code);
  console.log("jugadores tras salir:", quedan);
  for (const J of [A, B]) await J.p.evaluate(async () => { const t = __t.NET.token; await fetch("https://identitytoolkit.googleapis.com/v1/accounts:delete?key=AIzaSyCcK3SfW8lpa5fiDyr8BJzofaRqG3zTfg8", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: t }) }); });
  console.log("ERRORES A", A.errs, "B", B.errs);
  await b.close();
})();
