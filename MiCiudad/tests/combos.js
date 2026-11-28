// Tienda en córdobas y combos: todo lo que se compra se puede usar
const { open, baseSave } = require("./helpers");
(async () => {
  const { b, p, errs } = await open({ save: Object.assign({}, baseSave, { mc: 100 }) });
  const bad = [];
  const precios = await p.evaluate(() => { __t.openShop("paquetes"); return [...document.querySelectorAll(".pack .btn")].map(x => x.textContent); });
  console.log("precios:", precios.join(" | ")); if (precios.some(t => t.indexOf("US$") >= 0)) bad.push("todavía hay dólares");
  for (const c of await p.evaluate(() => __t.COMBOS.map(c => c.id))) {
    const r = await p.evaluate(id => { const before = JSON.stringify(__t.S.look); __t.applyCombo(id); const c = __t.COMBOS.find(x => x.id === id);
      const own = (c.own || []).every(k => __t.S.owned[k]); const look = Object.entries(c.look || {}).every(([k, v]) => __t.S.look[k] === v); const veh = !c.vehicle || __t.S.vehicle === c.vehicle; return { own, look, veh }; }, c);
    if (!r.own || !r.look || !r.veh) bad.push("combo " + c + " " + JSON.stringify(r));
    await p.waitForTimeout(300);
  }
  // que el personaje se dibuje con cada combo sin errores
  await p.evaluate(() => __t.buildPlayer()); await p.waitForTimeout(800);
  console.log("combos ok:", bad.length === 0);
  console.log("ERRORES", errs.concat(bad));
  await b.close();
})();
