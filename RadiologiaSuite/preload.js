// Puente seguro entre el programa y los archivos de la computadora.
const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs"), path = require("path");
const arg = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || "").slice(k.length + 3);

contextBridge.exposeInMainWorld("nativo", {
  documentos: arg("docs"),
  unir: (...p) => path.join(...p),
  nombre: p => path.basename(p),
  existe: p => fs.existsSync(p),
  esCarpeta: p => { try { return fs.statSync(p).isDirectory(); } catch { return false; } },
  crearCarpeta: p => fs.mkdirSync(p, { recursive: true }),
  leer: p => new Uint8Array(fs.readFileSync(p)),
  escribir: (p, datos) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, Buffer.from(datos)); },
  borrar: p => fs.rmSync(p, { force: true }),
  listar: p => fs.readdirSync(p, { withFileTypes: true }).map(e => ({ nombre: e.name, carpeta: e.isDirectory() })),
  elegirCarpeta: () => ipcRenderer.invoke("elegirCarpeta"),
  abrir: p => ipcRenderer.invoke("abrir", p),
  mostrar: p => ipcRenderer.invoke("mostrar", p),
  cfg: () => ipcRenderer.invoke("cfg"),
  guardarCfg: c => ipcRenderer.invoke("guardarCfg", c),
});
