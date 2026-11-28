// Jugador nuevo: sin partida guardada, crea personaje y juega los trabajos de la ciudad
const { open } = require("./helpers");
(async () => {
  const out = process.argv[2] || "/tmp";
  const { b, p, errs } = await open({});
  await p.fill("#welName", "Sofía"); await p.click("text=¡A jugar!"); await p.waitForTimeout(500);
  const job = { hospital: "Atender", super: "cajero", helados: "preparando", cine: "palomitas", escuela: "Responder", bomberos: "incendios" };
  for (const id of ["hospital", "super", "helados", "cine", "escuela", "casa", "mall", "bomberos"]) {
    await p.evaluate(i => __t.enter(__t.BUILDINGS.find(b => b.id === i)), id); await p.waitForTimeout(250);
    if (id === "casa") { await p.evaluate(() => __t.closeSheet()); continue; }
    await p.waitForFunction(i => __t.zone.id === "in_" + i, id, { timeout: 10000 });
    if (id === "mall") { await p.screenshot({ path: out + "/n_mall.png" }); await p.evaluate(() => __t.travelTo("city")); await p.waitForTimeout(900); continue; }
    await p.evaluate(w => { const s = __t.SPOTS.find(s => s.zone === __t.zone.id && String(typeof s.label === "function" ? s.label() : s.label).indexOf(w) >= 0); __t.P.x = s.x; __t.P.z = s.z; }, job[id]);
    await p.waitForTimeout(500); console.log(id, await p.evaluate(() => __t.near && __t.near.label)); await p.evaluate(() => __t.useSpot()); await p.waitForTimeout(1300);
    await p.click("text=Empezar"); await p.waitForTimeout(400);
    if (id === "bomberos") break;
    await p.evaluate(() => { __t.closeSheet(); __t.travelTo("city"); }); await p.waitForTimeout(900);
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
