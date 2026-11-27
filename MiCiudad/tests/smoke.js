const { open, baseSave } = require("./helpers");
(async () => {
  const out = process.argv[2] || "/tmp";
  const { b, p, errs } = await open({ save: baseSave });
  await p.screenshot({ path: out + "/s_city.png" });
  // caminar con teclado
  await p.keyboard.down("KeyW"); await p.waitForTimeout(800); await p.keyboard.up("KeyW");
  const pos = await p.evaluate(() => [__t.P.x, __t.P.z, __t.P.y, __t.P.ground]);
  console.log("pos", pos);
  // saltar
  await p.evaluate(() => __t.doJump()); await p.waitForTimeout(250);
  const yj = await p.evaluate(() => __t.P.y); await p.waitForTimeout(900);
  const yl = await p.evaluate(() => [__t.P.y, __t.P.ground]);
  console.log("salto", yj, yl);
  // abrir menús
  for (const id of ["bShop", "bCloset", "bPlaces", "bSet"]) { await p.click("#" + id); await p.waitForTimeout(200); await p.evaluate(() => __t.closeSheet()); }
  await p.click("#bShop"); for (const t of ["MediCoins", "Ofertas del día", "VIP ⭐", "Vehículos", "Poderes"]) { await p.click("text=" + t); await p.waitForTimeout(100); }
  await p.evaluate(() => __t.closeSheet());
  await p.click("#bCloset"); for (const t of ["Camisas", "Pantalones y faldas", "Sombreros", "Accesorios", "Mi rol"]) { await p.click(".seg >> text=" + t); await p.waitForTimeout(100); }
  await p.evaluate(() => __t.closeSheet());
  console.log("zonas", await p.evaluate(() => Object.keys(__t.ZONES)));
  console.log("ERRORES", errs);
  await b.close();
})();
