const { open, baseSave } = require("./helpers");
(async () => {
  const out = process.argv[2] || "/tmp";
  const { b, p, errs } = await open({ save: { ...baseSave, money: 2000000, park: { rides: {}, bank: 0, last: Date.now() - 3600 * 1000, boostUntil: 0, manager: false } } });
  await p.evaluate(() => __t.travelTo("parque")); await p.waitForTimeout(1200);
  // construir todas en orden usando los lugares
  const RP = [[-22,18],[22,18],[-22,0],[22,0],[-22,-18],[22,-18],[-8,-30],[10,-30]];
  for (let i = 0; i < 8; i++) {
    await p.evaluate(([dx, dz]) => { const x = 330 + dx, z = 330 + dz; __t.P.x = dz <= -30 ? x : (dx < 0 ? x + 7.5 : x - 7.5); __t.P.z = dz <= -30 ? z + 7 : z; }, RP[i]);
    await p.waitForTimeout(300);
    await p.click("#act", { force: true }); await p.waitForTimeout(150);
    await p.click("text=Construir ·"); await p.waitForTimeout(150);
  }
  console.log("atracciones", await p.evaluate(() => __t.S.park.rides));
  // mejorar carrusel
  await p.evaluate(() => { __t.P.x = 330 - 22 + 7.5; __t.P.z = 348; }); await p.waitForTimeout(300);
  await p.click("#act", { force: true }); await p.click("text=Mejorar ·"); await p.click("text=Mejorar ·");
  await p.evaluate(() => __t.closeSheet());
  await p.waitForTimeout(2000);
  await p.evaluate(() => { __t.P.x = 330; __t.P.z = 352; __t.P.face = Math.PI; }); await p.waitForTimeout(1500);
  await p.screenshot({ path: out + "/k_park.png" });
  const bank = await p.evaluate(() => __t.S.park.bank);
  await p.click("#zbtn"); await p.click("text=Cobrar"); 
  console.log("caja", Math.round(bank), "carrusel nv", await p.evaluate(() => __t.S.park.rides.carrusel));
  await p.click("text=Día de fiesta"); console.log("fiesta", await p.evaluate(() => __t.S.park.boostUntil > Date.now()));
  console.log("ERRORES", errs);
  await b.close();
})();
