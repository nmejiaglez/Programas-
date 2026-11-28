// Entrar a edificios, objetivos, Bosque de Retos (estrellas, animales, escalera, meta), cara y probador
const { open, baseSave } = require("./helpers");
(async () => {
  const out = process.argv[2] || "/tmp";
  const { b, p, errs } = await open({ save: Object.assign({}, baseSave) });
  const ev = (f, a) => p.evaluate(f, a); const res = {}; const bad = [];
  // entrar a la heladería y comprar helado -> objetivo 1
  await ev(() => __t.enter(__t.BUILDINGS.find(x => x.id === "helados")));
  await p.waitForFunction(() => __t.zone.id === "in_helados", null, { timeout: 10000 }).catch(() => bad.push("no entró a la heladería"));
  const sp = await ev(() => { const s = __t.SPOTS.find(s => s.zone === "in_helados" && String(s.label).indexOf("Comprar") >= 0); __t.P.x = s.x; __t.P.z = s.z; return s.label; });
  await p.waitForTimeout(600); await ev(() => __t.useSpot()); await p.waitForTimeout(2500);
  res.objetivo = await ev(() => __t.S.obj.i); if (res.objetivo < 1) bad.push("no cumplió el objetivo del helado");
  await ev(() => { const s = __t.SPOTS.find(s => s.zone === "in_helados" && String(s.label).indexOf("Salir") >= 0); __t.P.x = s.x; __t.P.z = s.z; });
  await p.waitForTimeout(500); await ev(() => __t.useSpot()); await p.waitForFunction(() => __t.zone.id === "city", null, { timeout: 8000 }).catch(() => bad.push("no salió a la calle"));
  // bosque nivel 2 (tiene escalera)
  await ev(() => __t.travelTo("bosque")); await p.waitForTimeout(1500);
  await ev(() => __t.bqStart(2)); await p.waitForTimeout(1500);
  res.nivel = await ev(() => ({ en: __t.bq.enemies.length, st: __t.bq.starObjs.length, lad: __t.bq.ladders.length }));
  console.log("nivel", res.nivel, await ev(() => __t.zone.id));
  // tocar un animal -> pierde corazón
  await ev(() => { const e = __t.bq.enemies[0]; __t.P.x = e.x; __t.P.z = e.z; __t.P.y = e.y; });
  await p.waitForTimeout(600); res.corazones = await ev(() => __t.bq.hearts); if (res.corazones !== 2) bad.push("el animal no quitó corazón (" + res.corazones + ")");
  // estrellas
  await ev(() => { __t.bq.inv = 5; }); for (let k = 0; k < 3; k++) { await ev(k => { const s = __t.bq.starObjs[k]; __t.P.x = s.x; __t.P.z = s.z; __t.P.y = s.y - 1; __t.P.vy = 0; }, k); await p.waitForTimeout(500); }
  res.estrellas = await ev(() => __t.bq.stars); if (res.estrellas !== 3) bad.push("no juntó 3 estrellas (" + res.estrellas + ")");
  // escalera: caminar hacia ella
  const l = await ev(() => { const l = __t.bq.ladders[0]; __t.P.x = l.x; __t.P.z = l.z + 0.3; __t.P.y = l.y0; __t.P.vy = 0; return l; });
  await ev(() => { __t.joy.id = 99; __t.joy.x = 0; __t.joy.y = -1; __t.setYaw(0); });
  await p.waitForFunction(y1 => __t.P.y > y1 - 0.2, l.y1, { timeout: 15000 }).catch(() => bad.push("no subió la escalera"));
  await ev(() => { __t.joy.id = null; __t.joy.x = 0; __t.joy.y = 0; });
  res.subio = await ev(() => +__t.P.y.toFixed(2));
  // meta
  await ev(() => { const z = __t.bq.finishZ; __t.P.x = 330; __t.P.z = z; __t.P.y = 12; __t.P.vy = 0; });
  await p.waitForSelector("text=superado", { timeout: 15000 }).catch(() => bad.push("no llegó a la meta"));
  await p.screenshot({ path: out + "/bq_meta.png" });
  res.guardado = await ev(() => __t.S.bosque && __t.S.bosque.lv[2]); res.pos = await ev(() => [__t.P.x, __t.P.y, __t.P.z, __t.bq.finishZ, __t.bq.run, __t.bq.hearts]); console.log(res, bad); await ev(() => __t.closeSheet());
  // cara y probador
  await ev(() => __t.travelTo("city")); await p.waitForTimeout(1200);
  await p.click("#bCloset"); await p.click("text=😊 Cara"); await p.click("text=Brillantes ✨").catch(() => bad.push("no hay ojos brillantes")); await p.waitForTimeout(300);
  res.ojos = await ev(() => __t.S.look.eyeS); if (res.ojos !== 3) bad.push("no compró los ojos");
  await p.click("text=Camisas"); await p.waitForTimeout(500);
  await p.click(".card:has-text('Unicornio') >> button"); await p.waitForSelector(".trycv", { timeout: 5000 }).catch(() => bad.push("no abrió el probador"));
  await p.waitForTimeout(600); await p.screenshot({ path: out + "/probador.png" });
  await p.click("text=Comprar ·"); await p.waitForTimeout(400);
  res.camisa = await ev(() => __t.S.look.shirt); if (res.camisa !== "s17") bad.push("no compró la camisa");
  console.log(res);
  console.log("ERRORES", errs.filter(e => e.indexOf("401") < 0).concat(bad));
  await b.close();
})();
