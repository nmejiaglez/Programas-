const { open, baseSave } = require("./helpers");
(async () => {
  const out = process.argv[2] || "/tmp";
  const { b, p, errs } = await open({ save: baseSave });
  await p.evaluate(() => __t.travelTo("obby")); await p.waitForTimeout(1200);
  await p.screenshot({ path: out + "/o_base.png" });
  const info = await p.evaluate(() => { const r = []; for (let k = 0; k <= 12; k++) r.push(0); return { zone: __t.zone.id, cols: __t.colliders.length }; });
  console.log(info);
  // Recorrer etapas: poner al jugador sobre cada almohadilla y comprobar que se registra
  for (let k = 0; k <= 12; k++) {
    await p.evaluate(k => { const a = Math.PI / 2 + k * 0.9; __t.P.x = 0 + Math.cos(a) * 20; __t.P.z = -330 + Math.sin(a) * 20; __t.P.y = 0.3 + k * 2.7 + 1.5; __t.P.vy = 0; }, k);
    await p.waitForTimeout(450);
  }
  await p.waitForTimeout(300);
  console.log("estado", await p.evaluate(() => ({ money: __t.S.money, mc: __t.S.mc, obby: __t.S.obby, sheet: document.querySelector(".sh-h h2") && document.querySelector(".sh-h h2").textContent })));
  await p.screenshot({ path: out + "/o_top.png" });
  await p.evaluate(() => __t.closeSheet());
  // caída: debe volver a la bandera
  await p.evaluate(() => { __t.P.x = 40; __t.P.z = -330; __t.P.y = 12; });
  await p.waitForTimeout(2500);
  console.log("tras caer", await p.evaluate(() => [Math.round(__t.P.x), Math.round(__t.P.z), Math.round(__t.P.y), __t.P.ground]));
  // Probar física real: saltar de la 1ª almohadilla a la 1ª plataforma de la etapa 1 caminando
  await p.evaluate(() => { const a = Math.PI / 2; __t.P.x = Math.cos(a) * 20; __t.P.z = -330 + Math.sin(a) * 20; __t.P.y = 0.6; __t.P.face = 0; });
  await p.waitForTimeout(500);
  console.log("en pad0", await p.evaluate(() => [__t.P.y, __t.P.ground]));
  await p.screenshot({ path: out + "/o_pad0.png" });
  console.log("ERRORES", errs);
  await b.close();
})();
