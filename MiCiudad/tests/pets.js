const { open, baseSave } = require("./helpers");
(async () => {
  const out = process.argv[2] || "/tmp";
  const { b, p, errs } = await open({ save: baseSave });
  await p.click("#bShop"); await p.click("text=Huevos 🥚"); await p.waitForTimeout(200);
  await p.screenshot({ path: out + "/p_eggs.png" });
  for (let k = 0; k < 3; k++) {
    await p.click(".eggcard >> nth=" + (k % 3) + " >> button");
    for (let i = 0; i < 3; i++) { await p.click(".egg", { timeout: 3000 }).catch(() => {}); await p.waitForTimeout(120); }
    await p.waitForSelector("text=Llevarlo conmigo", { timeout: 9000 });
    await p.waitForTimeout(600);
    if (k === 0) await p.screenshot({ path: out + "/p_born.png" });
    await p.click("text=Llevarlo conmigo"); await p.waitForTimeout(200);
    await p.click("#bShop"); await p.click("text=Huevos 🥚");
  }
  await p.evaluate(() => __t.closeSheet());
  await p.click("#bPets"); await p.waitForTimeout(200);
  await p.click(".petcard >> nth=0 >> text=🍖 $30"); await p.click(".petcard >> nth=0 >> text=❤️ Acariciar");
  await p.click(".petcard >> nth=0 >> .coinb");
  await p.screenshot({ path: out + "/p_list.png" });
  const st = await p.evaluate(() => ({ n: __t.S.pets.length, act: __t.S.petActive, pets: __t.S.pets.map(x => x.type + ":" + x.lvl), mc: __t.S.mc, money: __t.S.money }));
  console.log(st);
  await p.evaluate(() => __t.closeSheet());
  await p.keyboard.down("KeyW"); await p.waitForTimeout(700); await p.keyboard.up("KeyW");
  await p.screenshot({ path: out + "/p_walk.png" });
  console.log("ERRORES", errs);
  await b.close();
})();
