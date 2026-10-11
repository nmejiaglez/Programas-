// En el programa de escritorio: carpetas reales de Windows con la misma interfaz que usa archivo.js
if (window.nativo) {
  const err = (name, msg) => Object.assign(new Error(msg), { name });
  class ArchivoNativo {
    constructor(p, n) { this.p = p; this.name = n; this.kind = "file"; }
    async getFile() { return new File([nativo.leer(this.p)], this.name); }
    async createWritable() {
      const partes = [], p = this.p;
      return { write: async d => { partes.push(d); }, close: async () => nativo.escribir(p, new Uint8Array(await new Blob(partes).arrayBuffer())) };
    }
  }
  class CarpetaNativa {
    constructor(p) { this.p = p; this.name = nativo.nombre(p); this.kind = "directory"; }
    async getDirectoryHandle(n, o = {}) {
      const q = nativo.unir(this.p, n);
      if (!nativo.esCarpeta(q)) { if (!o.create) throw err("NotFoundError", "No existe: " + q); nativo.crearCarpeta(q); }
      return new CarpetaNativa(q);
    }
    async getFileHandle(n, o = {}) {
      const q = nativo.unir(this.p, n);
      if (!nativo.existe(q) && !o.create) throw err("NotFoundError", "No existe: " + q);
      return new ArchivoNativo(q, n);
    }
    async removeEntry(n) { nativo.borrar(nativo.unir(this.p, n)); }
    async *entries() { for (const e of nativo.listar(this.p)) { const q = nativo.unir(this.p, e.nombre); yield [e.nombre, e.carpeta ? new CarpetaNativa(q) : new ArchivoNativo(q, e.nombre)]; } }
    async queryPermission() { return "granted"; }
    async requestPermission() { return "granted"; }
  }
  window.CarpetaNativa = CarpetaNativa;
  document.documentElement.classList.add("escritorio");
}
