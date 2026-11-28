// Garaje (sacar carro, subirse, bajarse) y Aserradero (talar, juntar, entregar, nivel)
const { open, baseSave } = require("./helpers");
(async () => {
  const out = process.argv[2] || "/tmp";
  const { b, p, errs } = await open({ save: Object.assign({}, baseSave) });
  const ev = (f, a) => p.evaluate(f, a); const bad = [];
  await ev(() => { __t.P.x = 40; __t.P.z = 30; __t.P.face = 0; });
  await p.click("#garBtn"); await p.waitForTimeout(800); await p.screenshot({ path: out + "/g_menu.png" });
  await p.click(".gcard:has-text('Sedán')"); await p.waitForTimeout(600);
  const pk = await ev(() => !!__t.parked); if (!pk) bad.push("no apareció el carro");
  await ev(() => { __t.P.x = __t.parked.x; __t.P.z = __t.parked.z + 1; }); await p.waitForTimeout(500);
  const lbl = await ev(() => __t.near && __t.near.label); if (String(lbl).indexOf("Subirse") < 0) bad.push("no ofrece subirse: " + lbl);
  await ev(() => __t.useSpot()); await p.waitForTimeout(500);
  const riding = await ev(() => __t.S.riding); if (!riding) bad.push("no se subió");
  await p.click("#cbLights"); await p.click("#cbHorn"); await p.waitForTimeout(400);
  await ev(() => { __t.joy.id = 9; __t.joy.y = -1; }); await p.waitForTimeout(1200); await ev(() => { __t.joy.id = null; __t.joy.y = 0; });
  await p.screenshot({ path: out + "/g_drive.png" });
  await p.click("#cbOut"); await p.waitForTimeout(400);
  if (await ev(() => __t.S.riding) || !(await ev(() => !!__t.parked))) bad.push("no se bajó bien");
  // aserradero
  await ev(() => __t.travelTo("aserradero")); await p.waitForTimeout(1800);
  await p.screenshot({ path: out + "/a_0.png" });
  const t = await ev(() => { const t = __t.as.trees[0]; __t.P.x = t.x + 1.6; __t.P.z = t.z; return [t.x, t.z]; }); await p.waitForTimeout(400);
  for (let i = 0; i < 4; i++) { await p.click("#chopBtn", { force: true }); await p.waitForTimeout(250); }
  await p.waitForTimeout(1500);
  const logs = await ev(() => __t.as.logs.length); if (logs < 2) bad.push("no salieron troncos: " + logs);
  for (let i = 0; i < logs; i++) { await ev(i => { const l = __t.as.logs[0]; if (l) { __t.P.x = l.x; __t.P.z = l.z; } }, i); await p.waitForTimeout(300); }
  const carry = await ev(() => __t.as.carry); if (carry < 2) bad.push("no juntó troncos: " + carry);
  await p.screenshot({ path: out + "/a_1.png" });
  const m0 = await ev(() => __t.S.money);
  await ev(() => { const s = __t.SPOTS.find(s => s.zone === "aserradero" && typeof s.label === "function"); __t.P.x = s.x; __t.P.z = s.z; }); await p.waitForTimeout(500);
  await ev(() => __t.useSpot()); await p.waitForTimeout(400);
  const m1 = await ev(() => __t.S.money); const lv = await ev(() => __t.S.lenador);
  if (!(m1 > m0) || lv.total < 2) bad.push("no pagó la entrega");
  console.log({ logs, carry, ganó: m1 - m0, lenador: lv });
  console.log("ERRORES", errs.concat(bad)); await b.close();
})();
