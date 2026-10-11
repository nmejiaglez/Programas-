#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AHORRADOR DE RAM 2026 - Windows / macOS / Linux

Programa ligero (usa ~20-30 MB) para que la poca memoria RAM no se desperdicie:
  - Medidor de RAM en vivo.
  - Agrupa los programas por nombre (ej.: todas las pestañas de Chrome juntas)
    y muestra cuánta memoria gasta cada uno.
  - Cerrar programas que no use (con confirmación; nunca los del sistema).
  - Windows: "Compactar memoria" de programas en segundo plano (devuelve a
    Windows la memoria que no están usando; seguro, no cierra nada).
  - Vigilante: avisa cuando la RAM pasa del 90 % y dice quién la está gastando.
  - Consejos según lo que detecta (navegador, programas de inicio, etc.).
"""
import os
import platform
import subprocess
import sys
import threading
import time

try:
    import psutil
except ImportError:
    psutil = None

APP = "AHORRADOR DE RAM 2026"
SO = platform.system()
MI_PID = os.getpid()

PROTEGIDOS = {
    "system", "idle", "registry", "memory compression", "smss", "csrss", "wininit", "winlogon",
    "services", "lsass", "svchost", "dwm", "explorer", "msmpeng", "nissrv", "securityhealthservice",
    "securityhealthsystray", "fontdrvhost", "audiodg", "spoolsv", "sihost", "ctfmon", "conhost",
    "kernel_task", "launchd", "windowserver", "finder", "dock", "loginwindow", "systemd", "init",
    "xorg", "xwayland", "gnome-shell", "plasmashell", "kwin_x11", "kwin_wayland", "pipewire",
    "pulseaudio", "dbus-daemon", "networkmanager", "sshd", "ahorrador_ram", "ahorradorram_windows",
}
NAVEGADORES = {"chrome", "msedge", "firefox", "opera", "brave", "vivaldi", "safari", "chromium", "google chrome"}


def ejecutar(cmd):
    kw = {"creationflags": 0x08000000} if SO == "Windows" else {}
    try:
        return subprocess.run(cmd, capture_output=True, timeout=20, **kw).stdout.decode("utf-8", "ignore")
    except Exception:
        return ""


def nombre_base(n):
    n = os.path.basename(n or "?")
    return n[:-4] if n.lower().endswith(".exe") else n


# ---------------------------------------------------------------- Mediciones
def ram():
    """(total, disponible) en MB."""
    if psutil:
        m = psutil.virtual_memory()
        return m.total / 1048576, m.available / 1048576
    if SO == "Linux":
        d = {}
        for l in open("/proc/meminfo"):
            k, v = l.split(":")
            d[k] = int(v.split()[0]) / 1024
        return d["MemTotal"], d.get("MemAvailable", d["MemFree"])
    if SO == "Windows":
        import ctypes

        class M(ctypes.Structure):
            _fields_ = [("l", ctypes.c_ulong), ("c", ctypes.c_ulong)] + [(x, ctypes.c_ulonglong) for x in "tavpqrs"]
        m = M(); m.l = ctypes.sizeof(M)
        ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m))
        return m.t / 1048576, m.a / 1048576
    tot = int(ejecutar(["sysctl", "-n", "hw.memsize"]).strip() or 0) / 1048576
    pag, libres = 4096, 0
    for l in ejecutar(["vm_stat"]).splitlines():
        if "page size of" in l:
            pag = int(l.split("page size of")[1].split()[0])
        if l.startswith(("Pages free", "Pages inactive", "Pages speculative", "Pages purgeable")):
            libres += int(l.split(":")[1].strip().rstrip("."))
    return tot, libres * pag / 1048576


def procesos():
    """Lista de (pid, nombre, MB)."""
    res = []
    if psutil:
        for p in psutil.process_iter(["pid", "name", "memory_info"]):
            try:
                res.append((p.info["pid"], nombre_base(p.info["name"]), p.info["memory_info"].rss / 1048576))
            except Exception:
                pass
    elif SO == "Windows":
        for l in ejecutar(["tasklist", "/fo", "csv", "/nh"]).splitlines():
            c = [x.strip('"') for x in l.split('","')]
            if len(c) >= 5:
                kb = "".join(ch for ch in c[4] if ch.isdigit())
                if kb and c[1].isdigit():
                    res.append((int(c[1]), nombre_base(c[0]), int(kb) / 1024))
    else:
        for l in ejecutar(["ps", "-axo", "pid=,rss=,comm="]).splitlines():
            c = l.split(None, 2)
            if len(c) == 3 and c[0].isdigit():
                res.append((int(c[0]), nombre_base(c[2]), int(c[1]) / 1024))
    return res


def agrupar(lista):
    """{nombre: [MB_total, [pids]]} ordenado de mayor a menor."""
    g = {}
    for pid, n, m in lista:
        if pid == MI_PID:
            continue
        e = g.setdefault(n, [0.0, []])
        e[0] += m; e[1].append(pid)
    return sorted(g.items(), key=lambda x: x[1][0], reverse=True)


def protegido(nombre):
    return nombre.lower() in PROTEGIDOS


# ---------------------------------------------------------------- Acciones
def cerrar(pids):
    ok = 0
    for pid in pids:
        try:
            if psutil:
                p = psutil.Process(pid); p.terminate()
                try:
                    p.wait(4)
                except psutil.TimeoutExpired:
                    p.kill()
            elif SO == "Windows":
                ejecutar(["taskkill", "/PID", str(pid), "/T"])
            else:
                os.kill(pid, 15)
            ok += 1
        except Exception:
            pass
    return ok


def compactar_windows():
    """Pide a los programas en segundo plano que devuelvan la memoria que no usan.
    Equivale a lo que hace Windows cuando falta RAM: no cierra nada ni pierde datos."""
    import ctypes
    from ctypes import wintypes
    k32, psapi, u32 = ctypes.windll.kernel32, ctypes.windll.psapi, ctypes.windll.user32
    k32.OpenProcess.restype = wintypes.HANDLE
    psapi.EmptyWorkingSet.argtypes = [wintypes.HANDLE]
    k32.CloseHandle.argtypes = [wintypes.HANDLE]
    activo = wintypes.DWORD()
    u32.GetWindowThreadProcessId(u32.GetForegroundWindow(), ctypes.byref(activo))
    _, antes = ram()
    n = 0
    for pid, nombre, mb in procesos():
        if pid in (MI_PID, activo.value, 0, 4) or protegido(nombre) or mb < 30:
            continue
        h = k32.OpenProcess(0x0400 | 0x0100, False, pid)  # QUERY_INFORMATION | SET_QUOTA
        if h:
            if psapi.EmptyWorkingSet(h):
                n += 1
            k32.CloseHandle(h)
    time.sleep(1)
    _, despues = ram()
    return n, max(0, despues - antes)


def consejos(total, grupos):
    c = []
    nav = sum(m for n, (m, _p) in grupos if n.lower() in NAVEGADORES)
    if nav > total * 0.3:
        c.append("El navegador usa %.0f MB. Cierre pestañas que no use; en Chrome/Edge active "
                 "'Ahorro de memoria' (Configuración > Rendimiento)." % nav)
    if total < 4500:
        c.append("Con %.1f GB de RAM, evite tener abiertos a la vez navegador con muchas pestañas, "
                 "Office y programas de video." % (total / 1024))
        if SO == "Windows":
            c.append("Desactive programas que arrancan con Windows (Administrador de tareas > Inicio) "
                     "y los efectos visuales (Sistema > Configuración avanzada > Rendimiento).")
    if total < 3800:
        c.append("Ampliar a 8 GB de RAM es la mejora más efectiva y económica para esta PC.")
    return c


# ---------------------------------------------------------------- Interfaz
def modo_grafico():
    import tkinter as tk
    from tkinter import messagebox, ttk

    f = ("Segoe UI", 10) if SO == "Windows" else ("Helvetica", 11)
    root = tk.Tk()
    root.title(APP)
    root.geometry("640x600")
    root.minsize(520, 460)
    root.configure(bg="#f3f6fb")

    cab = tk.Frame(root, bg="#1565c0"); cab.pack(fill="x")
    tk.Label(cab, text=APP, bg="#1565c0", fg="white", font=(f[0], 16, "bold")).pack(anchor="w", padx=14, pady=(8, 0))
    tk.Label(cab, text="Que la poca memoria RAM no se desperdicie", bg="#1565c0", fg="#dce8ff", font=f).pack(anchor="w", padx=14, pady=(0, 8))

    med = tk.Frame(root, bg="#f3f6fb"); med.pack(fill="x", padx=12, pady=8)
    txt_ram = tk.StringVar()
    tk.Label(med, textvariable=txt_ram, bg="#f3f6fb", font=(f[0], 12, "bold")).pack(anchor="w")
    estilo = ttk.Style(); estilo.theme_use("default")
    for nom, col in (("V", "#2e7d32"), ("A", "#ef6c00"), ("R", "#c62828")):
        estilo.configure(nom + ".Horizontal.TProgressbar", background=col)
    barra = ttk.Progressbar(med, maximum=100, style="V.Horizontal.TProgressbar")
    barra.pack(fill="x", pady=4)

    botones = tk.Frame(root, bg="#f3f6fb"); botones.pack(fill="x", padx=12)
    tabla = ttk.Treeview(root, columns=("mb", "n"), height=12)
    tabla.heading("#0", text="Programa"); tabla.heading("mb", text="Memoria (MB)"); tabla.heading("n", text="Procesos")
    tabla.column("#0", width=300); tabla.column("mb", width=120, anchor="e"); tabla.column("n", width=80, anchor="center")
    tabla.pack(fill="both", expand=True, padx=12, pady=8)
    tabla.tag_configure("pesado", background="#ffe4e1")
    tabla.tag_configure("sistema", foreground="#888")

    txt_consejo = tk.StringVar()
    tk.Label(root, textvariable=txt_consejo, bg="#fff8e1", fg="#5d4037", font=f, justify="left", anchor="w",
             wraplength=600).pack(fill="x", padx=12, pady=(0, 10))

    vigilar = tk.BooleanVar(value=True)
    estado = {"grupos": [], "ultimo_aviso": 0, "total": 0}

    def actualizar_medidor():
        tot, disp = ram()
        uso = 100 * (1 - disp / tot) if tot else 0
        estado["total"] = tot
        txt_ram.set("RAM: %.0f %% en uso  —  %.0f MB libres de %.0f MB" % (uso, disp, tot))
        barra["value"] = uso
        barra.configure(style=("R" if uso > 90 else "A" if uso > 75 else "V") + ".Horizontal.TProgressbar")
        if vigilar.get() and uso > 90 and time.time() - estado["ultimo_aviso"] > 300 and estado["grupos"]:
            estado["ultimo_aviso"] = time.time()
            top = [n for n, _ in estado["grupos"] if not protegido(n)][:3]
            root.deiconify(); root.lift()
            messagebox.showwarning(APP, "¡Memoria casi llena (%.0f %%)!\n\nLos que más gastan: %s.\n"
                                   "Cierre lo que no use para que la PC no se ponga lenta." % (uso, ", ".join(top)))
        root.after(3000, actualizar_medidor)

    def refrescar_lista():
        sel = tabla.selection()
        sel_nombre = tabla.item(sel[0], "text") if sel else None
        grupos = agrupar(procesos())
        estado["grupos"] = grupos
        tabla.delete(*tabla.get_children())
        tot = estado["total"] or ram()[0]
        for nombre, (mb, pids) in grupos[:40]:
            tag = "sistema" if protegido(nombre) else ("pesado" if mb > tot * 0.1 else "")
            iid = tabla.insert("", "end", text=nombre + ("  (sistema)" if protegido(nombre) else ""),
                               values=("%.0f" % mb, len(pids)), tags=(tag,))
            if nombre == sel_nombre:
                tabla.selection_set(iid)
        c = consejos(tot, grupos)
        txt_consejo.set("💡 " + "\n💡 ".join(c) if c else "💡 La memoria se está usando bien.")

    def ciclo_lista():
        refrescar_lista()
        root.after(8000, ciclo_lista)  # refresco espaciado: el propio programa casi no consume

    def cerrar_sel():
        sel = tabla.selection()
        if not sel:
            messagebox.showinfo(APP, "Seleccione un programa de la lista."); return
        nombre = tabla.item(sel[0], "text")
        if nombre.endswith("(sistema)"):
            messagebox.showinfo(APP, "Es un componente del sistema y está protegido."); return
        g = dict(estado["grupos"]).get(nombre)
        if not g:
            return
        if messagebox.askyesno(APP, "¿Cerrar '%s' (%d procesos, %.0f MB)?\n\nSi tiene trabajo sin guardar en ese programa, guárdelo antes."
                               % (nombre, len(g[1]), g[0])):
            _, antes = ram()
            n = cerrar(g[1]); time.sleep(1)
            _, desp = ram()
            refrescar_lista()
            messagebox.showinfo(APP, "Se cerraron %d procesos de '%s'.\nMemoria recuperada: %.0f MB." % (n, nombre, max(0, desp - antes)))

    def compactar():
        if not messagebox.askyesno(APP, "Se pedirá a los programas en segundo plano que devuelvan la memoria que no están usando.\n"
                                   "No se cierra nada ni se pierde ningún dato.\n\n¿Continuar?"):
            return
        b_comp.configure(state="disabled")
        def run():
            try:
                n, lib = compactar_windows()
                msg = "Memoria compactada en %d programas.\nRAM liberada: %.0f MB." % (n, lib)
            except Exception as e:
                msg = "No se pudo compactar: %s" % e
            root.after(0, lambda: (b_comp.configure(state="normal"), refrescar_lista(), messagebox.showinfo(APP, msg)))
        threading.Thread(target=run, daemon=True).start()

    est = dict(relief="flat", fg="white", font=(f[0], 10, "bold"), padx=10, pady=5, cursor="hand2")
    tk.Button(botones, text="Cerrar programa", bg="#c62828", command=cerrar_sel, **est).pack(side="left", padx=(0, 6))
    b_comp = tk.Button(botones, text="Compactar memoria", bg="#2e7d32", command=compactar, **est)
    if SO == "Windows":
        b_comp.pack(side="left", padx=(0, 6))
    tk.Button(botones, text="Actualizar", bg="#455a64", command=refrescar_lista, **est).pack(side="left", padx=(0, 6))
    tk.Checkbutton(botones, text="Avisarme si la RAM se llena", variable=vigilar, bg="#f3f6fb", font=f).pack(side="left", padx=6)

    actualizar_medidor()
    ciclo_lista()
    root.mainloop()


def modo_consola():
    tot, disp = ram()
    print("%s\nRAM: %.0f %% en uso, %.0f MB libres de %.0f MB\n" % (APP, 100 * (1 - disp / tot), disp, tot))
    grupos = agrupar(procesos())
    for i, (n, (mb, pids)) in enumerate(grupos[:15], 1):
        print("%2d. %-30s %8.0f MB  (%d)%s" % (i, n, mb, len(pids), "  [sistema]" if protegido(n) else ""))
    for c in consejos(tot, grupos):
        print("Consejo:", c)
    op = input("\nNúmero a cerrar (ENTER = salir): ").strip()
    if op.isdigit() and 1 <= int(op) <= 15:
        n, (mb, pids) = grupos[int(op) - 1]
        if not protegido(n) and input("¿Cerrar %s? (s/n): " % n).lower().startswith("s"):
            print("Procesos cerrados:", cerrar(pids))


if __name__ == "__main__":
    if "--consola" in sys.argv:
        modo_consola()
    else:
        try:
            import tkinter  # noqa: F401
            if SO == "Linux" and not (os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY")):
                raise RuntimeError("sin pantalla")
            modo_grafico()
        except Exception as e:
            print("(Modo consola: %s)" % e)
            modo_consola()
