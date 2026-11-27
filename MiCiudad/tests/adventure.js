const { open, baseSave } = require("./helpers");
(async () => {
  const out = process.argv[2] || "/tmp";
  const { b, p, errs } = await open({ save: baseSave });
  await p.evaluate(() => __t.travelTo("aventura")); await p.waitForTimeout(1200);
  console.log("zona", await p.evaluate(() => [__t.zone.id, __t.P.maxHp, !document.getElementById("atk").hidden, !document.getElementById("hpbar").hidden]));
  await p.screenshot({ path: out + "/a_camp.png" });
  const A = () => __t.MODES.find(m => m.id === "aventura").dbg;
  // ir junto al monstruo de nivel más bajo
  const m0 = await p.evaluate(() => { const av = __t.MODES.find(m => m.id === "aventura").dbg; const m = av.mons.filter(m => m.lvl === 1)[0] || av.mons[0]; __t.P.x = m.x; __t.P.z = m.z + 2.2; __t.P.face = Math.PI; return { lvl: m.lvl, hp: m.hp, n: av.mons.length }; });
  console.log("monstruo", m0);
  await p.waitForTimeout(300);
  const before = await p.evaluate(() => [__t.S.money, __t.S.adv.xp, __t.S.stats.monsters]);
  for (let i = 0; i < 25; i++) { await p.evaluate(() => { const av = __t.MODES.find(m => m.id === "aventura").dbg; const alive = av.mons.filter(m => m.dead <= 0).sort((a, b) => Math.hypot(a.x - __t.P.x, a.z - __t.P.z) - Math.hypot(b.x - __t.P.x, b.z - __t.P.z))[0]; __t.P.face = Math.atan2(alive.x - __t.P.x, alive.z - __t.P.z); __t.doAttack(); }); await p.waitForTimeout(450); }
  await p.screenshot({ path: out + "/a_fight.png" });
  const after = await p.evaluate(() => [__t.S.money, __t.S.adv.xp, __t.S.stats.monsters, __t.S.adv.lvl, Math.round(__t.P.hp)]);
  console.log("antes", before, "después", after);
  // poción
  await p.evaluate(() => { __t.P.hp = 30; }); await p.click("#zbtn"); console.log("pocion", await p.evaluate(() => [Math.round(__t.P.hp), __t.S.adv.potions]));
  // cofre
  await p.evaluate(() => { __t.P.x = -330 - 20; __t.P.z = 20 + 1.6; }); await p.waitForTimeout(400);
  console.log("cofre", await p.evaluate(() => __t.near && __t.near.label()));
  await p.click("#act", { force: true }); await p.waitForTimeout(200);
  // morir
  await p.evaluate(() => { __t.P.inv = 0; __t.damage(9999); }); await p.waitForTimeout(2000);
  console.log("tras morir", await p.evaluate(() => [Math.round(__t.P.x), Math.round(__t.P.z), __t.P.hp, __t.P.dead]));
  // tienda de espadas
  await p.evaluate(() => __t.openShop("espadas")); await p.click(".card >> nth=2 >> button"); await p.waitForTimeout(200);
  console.log("espada", await p.evaluate(() => __t.S.adv.sword));
  await p.evaluate(() => __t.closeSheet());
  await p.evaluate(() => __t.travelTo("city")); await p.waitForTimeout(1200);
  console.log("ciudad", await p.evaluate(() => [__t.zone.id, __t.P.maxHp, document.getElementById("atk").hidden]));
  console.log("ERRORES", errs);
  await b.close();
})();
