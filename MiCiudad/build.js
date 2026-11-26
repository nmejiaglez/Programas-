// Arma www/ para la app: documento completo + motor 3D local (funciona sin internet)
const fs = require("fs");
const path = require("path");
const root = __dirname;
let body = fs.readFileSync(path.join(root, "src/game.html"), "utf8");
const CDN = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>';
if (!body.includes(CDN)) throw new Error("No se encontró la etiqueta de three.js");
body = body.replace(CDN, '<script src="three.min.js"></script>');
const head = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#9FD8F5">
<style>:root{box-sizing:border-box}*,*::before,*::after{box-sizing:border-box}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
`;
fs.mkdirSync(path.join(root, "www"), { recursive: true });
fs.writeFileSync(path.join(root, "www/index.html"), head + body + "\n</body>\n</html>\n");
fs.copyFileSync(path.join(root, "node_modules/three/build/three.min.js"), path.join(root, "www/three.min.js"));
console.log("www/ listo");
