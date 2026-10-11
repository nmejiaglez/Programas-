// Radiología Suite — programa de escritorio (Windows), funciona sin internet.
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require("electron");
const path = require("path"), fs = require("fs");

const cfgPath = () => path.join(app.getPath("userData"), "config.json");
const leerCfg = () => { try { return JSON.parse(fs.readFileSync(cfgPath(), "utf8")); } catch { return {}; } };
const guardarCfg = c => { fs.mkdirSync(path.dirname(cfgPath()), { recursive: true }); fs.writeFileSync(cfgPath(), JSON.stringify(c, null, 1)); };

if (!app.requestSingleInstanceLock()) app.quit();

function crearVentana() {
  const win = new BrowserWindow({
    width: 1280, height: 860, show: false, title: "Radiología Suite",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: false, nodeIntegration: false,
      additionalArguments: ["--docs=" + app.getPath("documents"), "--escritorio=" + app.getPath("desktop")] },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, "index.html"));
  win.once("ready-to-show", () => { win.maximize(); win.show(); });
  // nunca navegar fuera del programa
  win.webContents.on("will-navigate", e => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  app.on("second-instance", () => { if (win.isMinimized()) win.restore(); win.focus(); });
}

ipcMain.handle("elegirCarpeta", async () => {
  const r = await dialog.showOpenDialog({ title: "Elija la carpeta de pacientes", properties: ["openDirectory", "createDirectory"] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle("abrir", (_e, p) => shell.openPath(p));
ipcMain.handle("mostrar", (_e, p) => shell.showItemInFolder(p));
ipcMain.handle("cfg", () => leerCfg());
ipcMain.handle("guardarCfg", (_e, c) => guardarCfg({ ...leerCfg(), ...c }));

app.whenReady().then(() => {
  // primer uso en Windows: acceso directo en el escritorio
  const c = leerCfg();
  if (process.platform === "win32" && !c.accesoDirecto && app.isPackaged) {
    try { shell.writeShortcutLink(path.join(app.getPath("desktop"), "Radiología Suite.lnk"), "create", { target: process.execPath, description: "Radiología Suite" }); } catch {}
    guardarCfg({ ...c, accesoDirecto: true });
  }
  crearVentana();
});
app.on("window-all-closed", () => app.quit());
