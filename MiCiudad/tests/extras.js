const { open, baseSave } = require("./helpers");
const SP = process.argv[2] || "/tmp";
(async () => {
  const { b, p, errs } = await open({ save: { ...baseSave, furn: { cama: 1, sofa: 1, tele: 1, planta: 1 } } });
  const log = (...a) => console.log(...a);
  // ---- Moda
  await p.evaluate(() => __t.travelTo("moda")); await p.waitForTimeout(1200);
  await p.evaluate(() => { __t.P.x = -336; __t.P.z = 350; }); await p.waitForTimeout(400);
  log("moda spot", await p.evaluate(() => __t.near && __t.near.label()));
  await p.click("#act", { force: true }); await p.waitForTimeout(1200);
  log("vestidor", await p.evaluate(() => document.querySelector(".sh-h h2").textContent));
  await p.click(".seg >> text=Cabeza"); await p.click(".card >> nth=1 >> button");
  await p.screenshot({ path: SP + "/m_dress.png" });
  await p.click("text=¡Listo! Salir a la pasarela"); await p.waitForTimeout(3500);
  await p.screenshot({ path: SP + "/m_walk.png" });
  await p.waitForTimeout(5500);
  log("moda resultado", await p.evaluate(() => document.querySelector(".sh-h h2") && document.querySelector(".sh-h h2").textContent), await p.evaluate(() => __t.S.stats.catwalks));
  await p.evaluate(() => __t.closeSheet());
  // ---- Policía
  await p.evaluate(() => __t.travelTo("city")); await p.waitForTimeout(1200);
  await p.evaluate(() => { __t.P.x = -17; __t.P.z = -13.5; }); await p.waitForTimeout(400);
  log("policia spot", await p.evaluate(() => __t.near && __t.near.label()));
  await p.click("#act", { force: true }); await p.click("text=Empezar"); await p.waitForTimeout(500);
  for (let i = 0; i < 3; i++) { await p.evaluate(() => { const pol = __t.MODES.find(m => m.id === "policia").dbg; const r = pol.robbers.find(r => !r.caught); if (!r) return; __t.P.x = r.x; __t.P.z = r.z; }); await p.waitForTimeout(300); }
  await p.waitForTimeout(300);
  log("policia", await p.evaluate(() => [__t.S.stats.thieves, document.querySelector(".sh-h h2") && document.querySelector(".sh-h h2").textContent]));
  await p.evaluate(() => __t.closeSheet());
  // ---- Misterio
  await p.evaluate(() => { __t.P.x = 17; __t.P.z = 19.5; }); await p.waitForTimeout(400);
  log("misterio spot", await p.evaluate(() => __t.near && __t.near.label()));
  await p.click("#act", { force: true }); await p.click("text=Empezar"); await p.waitForTimeout(500);
  for (let i = 0; i < 3; i++) { await p.evaluate(() => { const m = __t.MODES.find(m => m.id === "misterio").dbg; const c = m.clues.find(c => !c.got); if (!c) return; __t.P.x = c.x; __t.P.z = c.z; }); await p.waitForTimeout(300); }
  log("pistas", await p.evaluate(() => __t.MODES.find(m => m.id === "misterio").dbg.clues.map(c => c.text)));
  // acusar a uno equivocado y luego al correcto
  await p.evaluate(() => { const m = __t.MODES.find(m => m.id === "misterio").dbg; const wrong = window.__npcs = null; });
  await p.evaluate(() => { const m = __t.MODES.find(m => m.id === "misterio").dbg; const c = m.culprit; __t.P.x = c.x + 1.2; __t.P.z = c.z; }); await p.waitForTimeout(400);
  log("acusar label", await p.evaluate(() => __t.near && (typeof __t.near.label === "function" ? __t.near.label() : __t.near.label)));
  await p.click("#act", { force: true }); await p.waitForTimeout(200);
  await p.screenshot({ path: SP + "/x_accuse.png" });
  await p.click("text=¡Fue este!"); await p.waitForTimeout(200);
  log("misterio", await p.evaluate(() => [__t.S.stats.mysteries, document.querySelector(".sh-h h2") && document.querySelector(".sh-h h2").textContent]));
  await p.evaluate(() => __t.closeSheet());
  // ---- Casa 3D
  await p.evaluate(() => __t.enter({ id: "casa" }));
  await p.waitForTimeout(300);
  await p.click("text=🚪 Entrar a la casa"); await p.waitForTimeout(1200);
  log("casa zona", await p.evaluate(() => __t.zone.id));
  await p.screenshot({ path: SP + "/h_room.png" });
  await p.click("#zbtn"); await p.waitForTimeout(200);
  await p.click("text=🏡 Casa grande"); await p.waitForTimeout(300);
  await p.evaluate(() => __t.closeSheet());
  await p.screenshot({ path: SP + "/h_big.png" });
  await p.evaluate(() => { const s = __t.SPOTS.find(s => s.zone === "casa"); const q = s.pos(); __t.P.x = q.x; __t.P.z = q.z; }); await p.waitForTimeout(400);
  await p.click("#act", { force: true }); await p.waitForTimeout(1200);
  log("salió a", await p.evaluate(() => [__t.zone.id, Math.round(__t.P.x), Math.round(__t.P.z)]));
  // ---- Ofertas y VIP
  await p.evaluate(() => __t.openShop("ofertas")); await p.click(".card >> nth=0 >> button"); await p.waitForTimeout(200);
  await p.click("text=VIP ⭐"); await p.click("text=Ser VIP"); await p.waitForTimeout(200);
  log("vip", await p.evaluate(() => __t.S.perm.vip));
  const mcAntes = await p.evaluate(() => __t.S.mc);
  await p.click("text=MediCoins"); await p.click("text=US$ 2.99"); await p.waitForSelector("text=💬 Pedir por WhatsApp"); await p.waitForTimeout(300);
  const mcDespues = await p.evaluate(() => __t.S.mc);
  log("compra por WhatsApp (no regala)", mcAntes === mcDespues, await p.evaluate(() => __t.S.starter));
  if (mcAntes !== mcDespues) errs.push("la compra regaló MediCoins");
  await p.evaluate(() => __t.closeSheet());
  await p.screenshot({ path: SP + "/x_wings.png" });
  log("ERRORES", errs);
  await b.close();
})();
