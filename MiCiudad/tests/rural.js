const { open, baseSave } = require("./helpers");
(async () => {
  const out = process.argv[2] || "/tmp";
  const { b, p, errs } = await open({ save: baseSave });
  await p.evaluate(() => __t.travelTo("rural")); await p.waitForTimeout(1200);
  console.log("zona", await p.evaluate(() => __t.zone.id), await p.evaluate(() => [__t.P.x, __t.P.z]));
  await p.screenshot({ path: out + "/r_arrive.png" });
  // ir a parcela 0 y sembrar maíz
  await p.evaluate(() => { __t.P.x = -44; __t.P.z = 301.5; }); await p.waitForTimeout(400);
  console.log("cerca", await p.evaluate(() => __t.near && (typeof __t.near.label === "function" ? __t.near.label() : __t.near.label)));
  await p.click("#act",{force:true}); await p.waitForTimeout(200);
  await p.click(".card >> nth=0 >> button"); await p.waitForTimeout(300);
  console.log("plot", await p.evaluate(() => __t.S.plots[0]));
  await p.click("#act",{force:true}); // regar
  await p.evaluate(() => { __t.S.plots[0].dur = 0; }); await p.waitForTimeout(700);
  await p.screenshot({ path: out + "/r_farm.png" });
  console.log("label listo", await p.evaluate(() => __t.near.label()));
  await p.click("#act",{force:true}); console.log("cosecha", await p.evaluate(() => __t.S.crops));
  // pesca
  await p.evaluate(() => { __t.P.x = 27; __t.P.z = 350; }); await p.waitForTimeout(400);
  console.log("cerca pesca", await p.evaluate(() => __t.near.label()));
  await p.click("#act",{force:true}); await p.waitForTimeout(200);
  let caught = 0;
  for (let k = 0; k < 5; k++) {
    const r = await p.evaluate(() => new Promise(res => {
      const btn = document.querySelector(".sh-b .btn.big"); btn.click();
      const iv = setInterval(() => {
        const bar = document.querySelector(".fbar"); if (bar.hidden) return;
        const z = document.getElementById("fz"), m = document.getElementById("fm");
        const zl = parseFloat(z.style.left), zw = parseFloat(z.style.width), ml = parseFloat(m.style.left);
        if (ml > zl + 2 && ml < zl + zw - 2) { clearInterval(iv); clearTimeout(window.__to); btn.click(); setTimeout(() => res(document.getElementById("fmsg").textContent), 50); }
      }, 10);
      const to = setTimeout(() => { clearInterval(iv); res("timeout"); }, 12000); window.__to = to;
    }));
    if (r.includes("¡") && !r.includes("soltó")) caught++;
    console.log("pesca", k, r.slice(0, 60));
  }
  console.log("atrapados", caught);
  await p.screenshot({ path: out + "/r_fish.png" });
  await p.evaluate(() => __t.closeSheet());
  // mercado
  await p.evaluate(() => { __t.P.x = 0; __t.P.z = 297; }); await p.waitForTimeout(400);
  await p.click("#act",{force:true}); await p.waitForTimeout(200);
  const before = await p.evaluate(() => __t.S.money);
  await p.click("text=Vender todo"); const after = await p.evaluate(() => __t.S.money);
  console.log("venta", after - before, await p.evaluate(() => __t.S.fishBag));
  await p.click("text=Álbum de peces"); await p.screenshot({ path: out + "/r_album.png" });
  await p.click("text=Cañas de pescar"); await p.click(".card >> nth=2 >> button");
  console.log("caña", await p.evaluate(() => __t.S.rod));
  await p.evaluate(() => __t.closeSheet());
  // caminar hacia el lago no debe entrar al agua
  await p.evaluate(() => { __t.P.x = 10; __t.P.z = 340; }); 
  await p.evaluate(() => { window.__start = [__t.P.x, __t.P.z]; });
  await p.keyboard.down("KeyD"); await p.waitForTimeout(1500); await p.keyboard.up("KeyD");
  console.log("lago bloquea", await p.evaluate(() => [__t.P.x, __t.P.z]));
  console.log("lago", await p.evaluate(() => [__t.ZONES.rural.block(25,345,0.5), __t.ZONES.rural.block(27,350,0.5), __t.ZONES.rural.block(10,340,0.5)]));
  console.log("ERRORES", errs);
  await b.close();
})();
