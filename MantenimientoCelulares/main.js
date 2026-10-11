// Mantenimiento Celulares — programa de Windows para dar mantenimiento a Android (adb) e iPhone (libimobiledevice) por USB.
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require("electron");
const path = require("path"), fs = require("fs"), { execFile } = require("child_process");

// herramientas incluidas junto al programa: bin/adb y bin/imobiledevice
const BIN = app.isPackaged ? path.join(process.resourcesPath, "bin") : path.join(__dirname, "bin");
function herramienta(nombre) {
  const exe = process.platform === "win32" ? nombre + ".exe" : nombre;
  for (const sub of ["adb", "imobiledevice", ""]) { const p = path.join(BIN, sub, exe); if (fs.existsSync(p)) return p; }
  return exe; // si no está incluida, usar la del sistema
}

ipcMain.handle("ejecutar", (_e, nombre, args, ms = 60000) => new Promise(ok => {
  const exe = herramienta(nombre);
  execFile(exe, args, { timeout: ms, maxBuffer: 64 * 1024 * 1024, windowsHide: true, encoding: "utf8" }, (err, out, errOut) => {
    ok({ ok: !err, out: out || "", err: (errOut || "") + (err && !errOut ? String(err.message || err) : ""), falta: !!(err && err.code === "ENOENT") });
  });
}));
ipcMain.handle("elegirCarpeta", async () => { const r = await dialog.showOpenDialog({ title: "¿Dónde guardar el respaldo?", properties: ["openDirectory", "createDirectory"] }); return r.canceled ? null : r.filePaths[0]; });
ipcMain.handle("abrir", (_e, p) => shell.openPath(p));
ipcMain.handle("abrirUrl", (_e, u) => shell.openExternal(u));
ipcMain.handle("rutaFotos", () => app.getPath("pictures"));

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 1180, height: 820, show: false, title: "Mantenimiento Celulares",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false } });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, "index.html"));
  win.once("ready-to-show", () => { win.maximize(); win.show(); });
  win.webContents.on("will-navigate", e => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
});
app.on("window-all-closed", () => {
  execFile(herramienta("adb"), ["kill-server"], { windowsHide: true }, () => app.quit());
  setTimeout(() => app.quit(), 1500);
});
