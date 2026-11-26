// Versión para computadora (Windows) de Mi Ciudad
const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({ width: 1280, height: 800, backgroundColor: "#9FD8F5", title: "Mi Ciudad", autoHideMenuBar: true });
  win.loadFile(path.join(__dirname, "app", "index.html"));
});
app.on("window-all-closed", () => app.quit());
