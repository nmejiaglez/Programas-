// PDF con los JPG incrustados tal cual (sin recomprimir ni perder calidad).
"use strict";

const LIMITE_PDF_BYTES = 38000000; // cada PDF queda por debajo de 40 MB (margen de seguridad)
const PAGINAS_POR_PDF = 100;       // límite de páginas por PDF

// paginas: [{ datos: Uint8Array (JPEG RGB), ancho, alto }]  ->  Blob PDF
function construirPdf(paginas) {
  const cod = new TextEncoder();
  const trozos = [];
  let pos = 0;
  const posiciones = [];
  const escribir = (x) => {
    const b = typeof x === "string" ? cod.encode(x) : x;
    trozos.push(b);
    pos += b.length;
  };
  const objetos = []; // cada objeto: { dic: string, flujo?: Uint8Array }
  objetos.push({ dic: "<< /Type /Catalog /Pages 2 0 R >>" });
  objetos.push(null); // árbol de páginas, se completa al final
  const hijos = [];
  for (const p of paginas) {
    const n = objetos.length + 1; // imagen n, contenido n+1, página n+2
    const pw = (p.ancho * 72 / 200).toFixed(2); // 200 ppp: página grande y nítida
    const ph = (p.alto * 72 / 200).toFixed(2);
    objetos.push({
      dic: `<< /Type /XObject /Subtype /Image /Width ${p.ancho} /Height ${p.alto} ` +
           `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.datos.length} >>`,
      flujo: p.datos,
    });
    const dibujo = cod.encode(`q ${pw} 0 0 ${ph} 0 0 cm /Im Do Q`);
    objetos.push({ dic: `<< /Length ${dibujo.length} >>`, flujo: dibujo });
    objetos.push({
      dic: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] ` +
           `/Resources << /XObject << /Im ${n} 0 R >> >> /Contents ${n + 1} 0 R >>`,
    });
    hijos.push(n + 2);
  }
  objetos[1] = { dic: `<< /Type /Pages /Kids [${hijos.map((h) => h + " 0 R").join(" ")}] /Count ${hijos.length} >>` };

  escribir("%PDF-1.4\n");
  escribir(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
  objetos.forEach((o, i) => {
    posiciones.push(pos);
    escribir(`${i + 1} 0 obj\n${o.dic}`);
    if (o.flujo) {
      escribir("\nstream\n");
      escribir(o.flujo);
      escribir("\nendstream");
    }
    escribir("\nendobj\n");
  });
  const xref = pos;
  let tabla = `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (const p of posiciones) tabla += String(p).padStart(10, "0") + " 00000 n \n";
  escribir(tabla);
  escribir(`trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(trozos, { type: "application/pdf" });
}

// Agrupa páginas en orden: cada parte <= 38 MB y <= 100 páginas.
function dividirPdf(paginas) {
  const partes = [];
  let actual = [];
  let peso = 0;
  for (const p of paginas) {
    const costo = p.datos.length + 600; // JPG + estructura del PDF
    if (actual.length && (peso + costo > LIMITE_PDF_BYTES - 4096 || actual.length >= PAGINAS_POR_PDF)) {
      partes.push(actual);
      actual = [];
      peso = 0;
    }
    actual.push(p);
    peso += costo;
  }
  if (actual.length) partes.push(actual);
  return partes;
}
