const { open, baseSave } = require("./helpers");
(async () => {
  const out = process.argv[2] || "/tmp";
  const { b, p, errs } = await open({ save: { ...baseSave, surv: { shield: 1, wins: 0 } } });
  await p.evaluate(() => __t.travelTo("sobrevivir")); await p.waitForTimeout(1200);
  await p.screenshot({ path: out + "/v_lobby.png" });
  const M = "__t.MODES.find(m=>m.id==='sobrevivir')";
  for (const dis of ["meteoros", "inundacion", "tornado", "volcan", "terremoto"]) {
    await p.evaluate(M + ".start()"); await p.waitForTimeout(900);
    await p.evaluate(d => { const m = __t.MODES.find(m => m.id === "sobrevivir"); m.dbg.dis = { id: d, name: d, icon: "*", tip: "" }; m.dbg.t = 0.1; }, dis);
    await p.waitForTimeout(400);
    // si es inundación, subir a la torre más cercana
    if (dis === "inundacion") await p.evaluate(() => { __t.P.x = 330 - 20; __t.P.z = -14; __t.P.y = 4.4; });
    await p.waitForTimeout(3500);
    if (dis === "volcan" || dis === "tornado") await p.screenshot({ path: out + "/v_" + dis + ".png" });
    const st = await p.evaluate(M + ".dbg.state"); 
    const info = await p.evaluate(() => { const d = __t.MODES.find(m => m.id === "sobrevivir").dbg; return { st: d.state, haz: d.haz.length, inRound: d.playerIn, alive: d.bots.filter(b => b.alive).length, water: d.waterY, shield: __t.S.surv.shield }; });
    console.log(dis, info);
    // terminar la ronda rápido
    await p.evaluate(() => { const d = __t.MODES.find(m => m.id === "sobrevivir").dbg; d.t = 0.05; });
    await p.waitForTimeout(500);
    const title = await p.evaluate(() => { const h = document.querySelector(".sh-h h2"); return h && h.textContent; });
    console.log("  fin:", title, await p.evaluate(() => [__t.S.stats.survived, __t.S.mc]));
    await p.evaluate(() => __t.closeSheet());
  }
  console.log("ERRORES", errs);
  await b.close();
})();
