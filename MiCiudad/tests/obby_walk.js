// Piloto automático: recorre la primera etapa (escalones) usando la física real del juego
const { open, baseSave } = require("./helpers");
(async () => {
  const { b, p, errs } = await open({ save: baseSave });
  await p.evaluate(() => __t.travelTo("obby")); await p.waitForTimeout(1200);
  const res = await p.evaluate(() => new Promise(res => {
    const pt = (k, t) => { const a = Math.PI / 2 + (k + t) * 0.9; return { x: Math.cos(a) * 20, z: -330 + Math.sin(a) * 20, y: 0.3 + (k + t) * 2.7 }; };
    const P = __t.P; const p0 = pt(0, 0); P.x = p0.x; P.z = p0.z; P.y = 0.4;
    const targets = [1, 2, 3, 4, 5].map(i => pt(0, i / 5));
    let i = 0, ticks = 0, jumps = 0;
    const iv = setInterval(() => {
      ticks++;
      const t = targets[i]; const dx = t.x - P.x, dz = t.z - P.z, d = Math.hypot(dx, dz);
      __t.setYaw(Math.atan2(-dx, -dz)); __t.joy.id = 99; __t.joy.x = 0; __t.joy.y = -1;
      if (P.ground && d < 3.3 && t.y > P.y + 0.2) { __t.doJump(); jumps++; }
      if (d < 0.7 && Math.abs(P.y - t.y) < 0.05 && P.ground) { i++; if (i >= targets.length) { clearInterval(iv); __t.joy.id = null; res({ ok: true, ticks, jumps, cp: __t.S.money }); } }
      if (P.y < 0.29 || ticks > 1500) { clearInterval(iv); __t.joy.id = null; res({ ok: false, i, P: [P.x, P.y, P.z], ticks }); }
    }, 16);
  }));
  console.log("recorrido etapa 1:", res);
  console.log("ERRORES", errs);
  await b.close();
})();
