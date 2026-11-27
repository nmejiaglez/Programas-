// Ayudantes de prueba: abre el juego en un teléfono simulado con el modo de prueba activado
const { chromium, devices } = require("playwright");
const path = require("path");
async function open(opts = {}) {
  const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const ctx = await b.newContext({ ...devices["Pixel 7"] });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", e => errs.push("PAGEERROR " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  if (opts.save) await p.addInitScript(s => localStorage.setItem("miCiudad.v1", s), JSON.stringify(opts.save));
  await p.goto("file://" + path.resolve(__dirname, "../www/index.html") + "?test=1");
  await p.waitForFunction(() => window.__t, null, { timeout: 20000 });
  await p.waitForTimeout(500);
  return { b, ctx, p, errs };
}
const baseSave = { name: "Prueba", created: true, money: 100000, mc: 5000 };
module.exports = { open, baseSave };
