// Arma www/index.html (documento completo para la app Android) a partir de src/game.html
const fs = require("fs");
const body = fs.readFileSync(__dirname + "/src/game.html", "utf8");
const head = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#0E9C89">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);box-sizing:border-box}*,*::before,*::after{box-sizing:border-box}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
`;
fs.mkdirSync(__dirname + "/www", { recursive: true });
fs.writeFileSync(__dirname + "/www/index.html", head + body + "\n</body>\n</html>\n");
console.log("www/index.html listo");
