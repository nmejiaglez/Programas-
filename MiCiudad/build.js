// Arma el juego: une src/head.html + src/js/*.js
//  dist/game.html  -> versión web (motor 3D desde internet)
//  www/index.html  -> versión app (motor 3D local, funciona sin internet)
const fs = require("fs");
const path = require("path");
const root = __dirname;
const head = fs.readFileSync(path.join(root, "src/head.html"), "utf8");
const dir = path.join(root, "src/js");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".js")).sort();
const js = files.map(f => "/* ==== " + f + " ==== */\n" + fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
const CDN = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>';
const game = head + CDN + '\n<script>\n(function(){\n"use strict";\n' + js + '\n})();\n</script>\n';
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist/game.html"), game);
const app = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#9FD8F5">
<style>:root{box-sizing:border-box}*,*::before,*::after{box-sizing:border-box}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
` + game.replace(CDN, '<script src="three.min.js"></script>') + "\n</body>\n</html>\n";
fs.mkdirSync(path.join(root, "www"), { recursive: true });
fs.writeFileSync(path.join(root, "www/index.html"), app);
fs.copyFileSync(path.join(root, "node_modules/three/build/three.min.js"), path.join(root, "www/three.min.js"));
// versión para jugar en el navegador (GitHub Pages): ../jugar/
const web = path.join(root, "../jugar");
if (fs.existsSync(web)) {
  fs.writeFileSync(path.join(web, "index.html"), app.replace('<meta name="theme-color" content="#9FD8F5">', '<meta name="theme-color" content="#2E7BEF">\n<title>Mi Ciudad</title>\n<link rel="manifest" href="manifest.json">\n<link rel="icon" href="icono-192.png">\n<link rel="apple-touch-icon" href="icono-192.png">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">'));
  fs.copyFileSync(path.join(root, "www/three.min.js"), path.join(web, "three.min.js"));
}
console.log("Listo:", files.length, "partes");
