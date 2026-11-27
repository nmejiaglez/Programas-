// Jugador nuevo: sin partida guardada, crea personaje y juega los trabajos de la ciudad
const { open } = require("./helpers");
(async () => {
  const out = process.argv[2] || "/tmp";
  const { b, p, errs } = await open({});
  await p.fill("#welName", "Sofía"); await p.click("text=¡A jugar!"); await p.waitForTimeout(500);
  for (const id of ["hospital", "super", "helados", "cine", "escuela", "casa", "mall", "bomberos"]) {
    await p.evaluate(i => __t.enter({ id: i }), id); await p.waitForTimeout(250);
    if (["hospital", "super", "helados", "cine", "escuela"].includes(id)) { await p.click("text=Empezar"); await p.waitForTimeout(400); }
    if (id === "bomberos") { await p.click("text=Empezar"); await p.waitForTimeout(400); break; }
    await p.evaluate(() => __t.closeSheet());
  }
  await p.evaluate(() => __t.closeSheet());
  // monedas del suelo: ir a una moneda
  await p.waitForTimeout(500);
  console.log("estado", await p.evaluate(() => ({ name: __t.S.name, money: __t.S.money, mc: __t.S.mc, zone: __t.zone.id })));
  // bus a cada zona y de regreso
  for (const z of ["rural", "obby", "sobrevivir", "aventura", "parque", "moda", "city"]) { await p.evaluate(z => __t.travelTo(z), z); await p.waitForTimeout(900); }
  console.log("zona final", await p.evaluate(() => __t.zone.id));
  await p.screenshot({ path: out + "/n_city.png" });
  // guardar y recargar conserva datos
  await p.evaluate(() => { __t.S.money = 777; });
  await p.waitForTimeout(5600);
  await p.reload(); await p.waitForFunction(() => window.__t, null, { timeout: 20000 });
  console.log("tras recargar", await p.evaluate(() => [__t.S.name, __t.S.money]));
  console.log("ERRORES", errs);
  await b.close();
})();
