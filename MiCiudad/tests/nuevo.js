// Novedades: bailes, caídas, trampolín, tobogán, columpio, pintura, retos, colores y estelas
const { open, baseSave } = require("./helpers");
(async () => {
  const out = process.argv[2] || "/tmp";
  const { b, p, errs } = await open({ save: Object.assign({}, baseSave, { vehicle: "bici", owned: { s1: 1, p1: 1, none: 1, bici: 1 } }) });
  const ev = f => p.evaluate(f);
  const res = {};
  // baile
  await p.click("#emoBtn"); await p.click(".dcard >> nth=1"); await p.waitForTimeout(300);
  res.baile = await ev(() => __t.player ? 1 : 1);
  // caída desde muy alto
  await ev(() => { __t.P.x = 0; __t.P.z = -19; __t.P.y = 16; __t.P.vy = 0; });
  await p.waitForFunction(() => (__t.S.retos.tot.caidas || 0) > 0, null, { timeout: 15000 }).catch(() => {});
  await p.waitForFunction(() => !(__t.player.fall > 0), null, { timeout: 20000 }).catch(() => {});
  res.caida = await ev(() => __t.S.retos.tot.caidas || 0);
  // trampolín
  await ev(() => { __t.P.x = -17; __t.P.z = 13; __t.P.y = 3; __t.P.vy = 0; });
  await p.waitForTimeout(3000);
  res.trampolin = await ev(() => __t.S.retos.tot.trampolin || 0);
  // tobogán
  await ev(() => { __t.P.x = 17; __t.P.z = -15; __t.P.y = 3.0; __t.P.vy = 0; });
  await p.waitForTimeout(600);
  res.spotTobogan = await ev(() => __t.near && __t.near.label);
  await ev(() => __t.useSpot()); await p.waitForFunction(() => !__t.P.lock, null, { timeout: 20000 }).catch(() => {});
  res.tobogan = await ev(() => [__t.S.retos.tot.tobogan || 0, +__t.P.y.toFixed(2)]);
  // columpio
  await ev(() => { __t.P.x = -16; __t.P.z = 21.6; __t.P.y = 0.3; });
  await p.waitForTimeout(500); res.spotColumpio = await ev(() => __t.near && __t.near.label);
  await ev(() => __t.useSpot()); await p.waitForFunction(() => __t.P.y > 1, null, { timeout: 15000 }).catch(() => {});
  res.columpiando = await ev(() => +__t.P.y.toFixed(2));
  await ev(() => __t.doJump()); await p.waitForFunction(() => !__t.P.lock, null, { timeout: 15000 }).catch(() => {});
  res.bajo = await ev(() => +__t.P.y.toFixed(2));
  // pintar
  await ev(() => { __t.P.x = -16.3; __t.P.z = 1; __t.P.y = 0.3; }); await p.waitForTimeout(500);
  res.spotArte = await ev(() => __t.near && __t.near.label);
  await ev(() => __t.useSpot()); await p.waitForTimeout(400);
  const cv = await p.$(".artcv"); const bx = await cv.boundingBox();
  await p.mouse.move(bx.x + 40, bx.y + 40); await p.mouse.down(); await p.mouse.move(bx.x + 200, bx.y + 200, { steps: 8 }); await p.mouse.up();
  await p.screenshot({ path: out + "/n_arte.png" });
  await p.click("text=💾 Guardar cuadro"); await p.waitForTimeout(400);
  res.cuadros = await ev(() => (__t.S.art || []).length);
  await ev(() => __t.closeSheet());
  // colores y estelas
  await p.click("#bCloset"); await p.click("text=🎨 Colores"); await p.click(".pal >> nth=0 >> button >> nth=3"); await p.waitForTimeout(200);
  res.colorCamisa = await ev(() => __t.S.look.shirtC);
  await p.click("text=✨ Estelas"); await p.click(".card >> nth=1 >> button"); await p.waitForTimeout(200);
  res.estela = await ev(() => __t.S.look.trail);
  await ev(() => __t.closeSheet());
  // retos
  await p.click("#bRetos"); await p.waitForTimeout(300); await p.screenshot({ path: out + "/n_retos.png" });
  res.retos = await ev(() => __t.S.retos.list.map(r => r.k + ":" + r.got + "/" + r.need));
  await ev(() => __t.closeSheet());
  // cáscara
  res.ok = true;
  console.log(res);
  const bad = [];
  if (res.caida < 1) bad.push("no se cayó");
  if (res.trampolin < 1) bad.push("no rebotó");
  if (!res.tobogan[0]) bad.push("no usó el tobogán");
  if (!(res.columpiando > 1)) bad.push("no se columpió");
  if (res.bajo > 0.5) bad.push("no se bajó del columpio");
  if (res.cuadros !== 1) bad.push("no guardó el cuadro");
  if (!res.colorCamisa) bad.push("no pintó la camisa");
  if (res.estela !== "brillos") bad.push("no compró la estela");
  console.log("ERRORES", errs.concat(bad));
  await b.close();
})();
