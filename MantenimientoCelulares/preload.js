const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("sistema", {
  ejecutar: (nombre, args, ms) => ipcRenderer.invoke("ejecutar", nombre, args, ms),
  elegirCarpeta: () => ipcRenderer.invoke("elegirCarpeta"),
  abrir: p => ipcRenderer.invoke("abrir", p),
  abrirUrl: u => ipcRenderer.invoke("abrirUrl", u),
  rutaFotos: () => ipcRenderer.invoke("rutaFotos"),
});
