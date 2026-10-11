#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DIAGNÓSTICO PC UNIVERSAL 2026 - Windows / macOS / Linux

Analiza la computadora, muestra los problemas encontrados y ofrece
corregir cada uno (siempre con confirmación).

Reglas de seguridad:
  - Nunca borra documentos, fotos ni archivos personales.
  - Solo elimina temporales y cachés con más de 1 día de antigüedad.
  - Nunca desactiva antivirus, firewall ni actualizaciones.
  - Cada corrección pide confirmación antes de ejecutarse.
"""
import datetime
import os
import platform
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time

try:
    import psutil  # opcional: da mediciones más precisas
except ImportError:
    psutil = None

APP = "DIAGNÓSTICO PC UNIVERSAL 2026"
SO = platform.system()  # 'Windows', 'Darwin' (macOS) o 'Linux'
NOMBRE_SO = {"Darwin": "macOS"}.get(SO, SO)
HOME = os.path.expanduser("~")
UN_DIA = 86400

# Procesos que nunca se ofrecen cerrar
PROTEGIDOS = {
    "system", "idle", "registry", "smss.exe", "csrss.exe", "wininit.exe", "winlogon.exe",
    "services.exe", "lsass.exe", "svchost.exe", "dwm.exe", "explorer.exe", "msmpeng.exe",
    "securityhealthservice.exe", "kernel_task", "launchd", "windowserver", "finder", "dock",
    "loginwindow", "systemd", "init", "xorg", "xwayland", "gnome-shell", "plasmashell",
    "kwin_x11", "kwin_wayland", "pulseaudio", "pipewire", "dbus-daemon", "sshd", "python",
    "python3", "pythonw.exe", "python.exe", "diagnostico_pc", "diagnostico_pc.exe",
}


# ============================================================================
#  UTILIDADES
# ============================================================================
def ejecutar(cmd, timeout=120, shell=False):
    """Ejecuta un comando sin ventana y devuelve (código, texto)."""
    kw = {}
    if SO == "Windows":
        kw["creationflags"] = 0x08000000  # CREATE_NO_WINDOW
    try:
        r = subprocess.run(cmd, capture_output=True, timeout=timeout, shell=shell, **kw)
        txt = (r.stdout or b"") + (r.stderr or b"")
        for enc in ("utf-8", "cp850", "latin-1"):
            try:
                return r.returncode, txt.decode(enc).replace("\x00", "")
            except UnicodeDecodeError:
                continue
        return r.returncode, ""
    except Exception as e:  # comando inexistente, tiempo agotado, etc.
        return -1, str(e)


def existe(cmd):
    return shutil.which(cmd) is not None


def es_admin():
    if SO == "Windows":
        try:
            import ctypes
            return bool(ctypes.windll.shell32.IsUserAnAdmin())
        except Exception:
            return False
    return os.geteuid() == 0


def mb(b):
    return b / 1024 / 1024


def gb(b):
    return b / 1024 / 1024 / 1024


def tamano_carpeta(ruta, min_edad=0):
    total, ahora = 0, time.time()
    for raiz, _dirs, archivos in os.walk(ruta, onerror=lambda e: None):
        for a in archivos:
            try:
                st = os.lstat(os.path.join(raiz, a))
                if ahora - st.st_mtime >= min_edad:
                    total += st.st_size
            except OSError:
                pass
    return total


def borrar_contenido(ruta, min_edad=UN_DIA):
    """Borra archivos antiguos dentro de 'ruta' (nunca la carpeta en sí). Devuelve bytes liberados."""
    liberado, ahora = 0, time.time()
    if not os.path.isdir(ruta):
        return 0
    for raiz, dirs, archivos in os.walk(ruta, topdown=False, onerror=lambda e: None):
        for a in archivos:
            p = os.path.join(raiz, a)
            try:
                st = os.lstat(p)
                if ahora - st.st_mtime >= min_edad:
                    os.remove(p)
                    liberado += st.st_size
            except OSError:
                pass  # en uso o sin permiso: se omite
        for d in dirs:
            p = os.path.join(raiz, d)
            try:
                if not os.path.islink(p) and not os.listdir(p):
                    os.rmdir(p)
            except OSError:
                pass
    return liberado


def carpetas_temporales():
    """Solo carpetas de temporales y cachés. Ninguna carpeta personal."""
    c = [tempfile.gettempdir()]
    if SO == "Windows":
        la = os.environ.get("LOCALAPPDATA", "")
        win = os.environ.get("WINDIR", r"C:\Windows")
        c += [
            os.path.join(win, "Temp"),
            os.path.join(la, "CrashDumps"),
            os.path.join(la, "Microsoft", "Windows", "INetCache"),
            os.path.join(la, "Microsoft", "Windows", "WER"),
            os.path.join(la, "Google", "Chrome", "User Data", "Default", "Cache"),
            os.path.join(la, "Microsoft", "Edge", "User Data", "Default", "Cache"),
        ]
    elif SO == "Darwin":
        c += [os.path.join(HOME, "Library", "Caches"), os.path.join(HOME, "Library", "Logs")]
    else:
        c += [os.path.join(HOME, ".cache"), os.path.join(HOME, ".local", "share", "Trash", "expunged")]
    vistos, res = set(), []
    for x in c:
        x = os.path.normpath(x)
        if x and os.path.isdir(x) and x not in vistos and x != os.path.normpath(HOME):
            vistos.add(x)
            res.append(x)
    return res


def carpeta_papelera():
    if SO == "Darwin":
        return os.path.join(HOME, ".Trash")
    if SO == "Linux":
        return os.path.join(HOME, ".local", "share", "Trash", "files")
    return None


# ============================================================================
#  MEDICIONES (con psutil si está, si no con comandos del sistema)
# ============================================================================
def ram():
    """(total, disponible) en bytes."""
    if psutil:
        m = psutil.virtual_memory()
        return m.total, m.available
    if SO == "Linux":
        d = {}
        with open("/proc/meminfo") as f:
            for l in f:
                k, v = l.split(":")
                d[k] = int(v.split()[0]) * 1024
        return d["MemTotal"], d.get("MemAvailable", d["MemFree"])
    if SO == "Windows":
        import ctypes

        class M(ctypes.Structure):
            _fields_ = [("l", ctypes.c_ulong), ("load", ctypes.c_ulong), ("tot", ctypes.c_ulonglong),
                        ("avail", ctypes.c_ulonglong), ("a", ctypes.c_ulonglong), ("b", ctypes.c_ulonglong),
                        ("c", ctypes.c_ulonglong), ("d", ctypes.c_ulonglong), ("e", ctypes.c_ulonglong)]
        m = M(); m.l = ctypes.sizeof(M)
        ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m))
        return m.tot, m.avail
    if SO == "Darwin":
        tot = int(ejecutar(["sysctl", "-n", "hw.memsize"])[1].strip() or 0)
        _, vm = ejecutar(["vm_stat"])
        pag = 4096; libres = 0
        for l in vm.splitlines():
            if "page size of" in l:
                pag = int(l.split("page size of")[1].split()[0])
            if l.startswith(("Pages free", "Pages inactive", "Pages speculative")):
                libres += int(l.split(":")[1].strip().rstrip("."))
        return tot, libres * pag
    return 0, 0


def uso_cpu():
    if psutil:
        return psutil.cpu_percent(interval=2)
    if SO == "Linux":
        def leer():
            v = list(map(int, open("/proc/stat").readline().split()[1:]))
            return sum(v), v[3] + v[4]
        t1, i1 = leer(); time.sleep(2); t2, i2 = leer()
        return 100 * (1 - (i2 - i1) / max(t2 - t1, 1))
    if SO == "Windows":
        _, t = ejecutar(["wmic", "cpu", "get", "loadpercentage"])
        n = [int(x) for x in t.split() if x.isdigit()]
        return sum(n) / len(n) if n else 0
    if hasattr(os, "getloadavg"):
        return min(100, os.getloadavg()[0] / (os.cpu_count() or 1) * 100)
    return 0


def tiempo_encendido():
    if psutil:
        return time.time() - psutil.boot_time()
    if SO == "Linux":
        return float(open("/proc/uptime").read().split()[0])
    if SO == "Windows":
        import ctypes
        return ctypes.windll.kernel32.GetTickCount64() / 1000
    if SO == "Darwin":
        t = ejecutar(["sysctl", "-n", "kern.boottime"])[1]
        try:
            return time.time() - int(t.split("sec =")[1].split(",")[0])
        except Exception:
            return 0
    return 0


def procesos_pesados(n=8):
    """Lista de (nombre, pid, MB, cpu%)."""
    res = []
    if psutil:
        procs = list(psutil.process_iter(["name", "pid", "memory_info"]))
        for p in procs:
            try:
                p.cpu_percent(None)
            except Exception:
                pass
        time.sleep(1.5)
        for p in procs:
            try:
                res.append((p.info["name"] or "?", p.info["pid"], mb(p.info["memory_info"].rss), p.cpu_percent(None) / (os.cpu_count() or 1)))
            except Exception:
                pass
    elif SO == "Windows":
        _, t = ejecutar(["tasklist", "/fo", "csv", "/nh"])
        for l in t.splitlines():
            c = [x.strip('"') for x in l.split('","')]
            if len(c) >= 5:
                kb = "".join(ch for ch in c[4] if ch.isdigit())
                if kb:
                    res.append((c[0], int(c[1]), int(kb) / 1024, 0.0))
    else:
        _, t = ejecutar(["ps", "-axo", "pid=,rss=,pcpu=,comm="])
        for l in t.splitlines():
            c = l.split(None, 3)
            if len(c) == 4:
                try:
                    res.append((os.path.basename(c[3]), int(c[0]), int(c[1]) / 1024, float(c[2].replace(",", "."))))
                except ValueError:
                    pass
    res.sort(key=lambda x: x[2] + x[3] * 20, reverse=True)
    return res[:n]


def bateria():
    """(porcentaje, conectado, salud%) o None."""
    if psutil and hasattr(psutil, "sensors_battery"):
        b = psutil.sensors_battery()
        if b:
            return b.percent, b.power_plugged, None
    if SO == "Linux":
        for b in ("BAT0", "BAT1"):
            r = "/sys/class/power_supply/" + b
            if os.path.isdir(r):
                try:
                    pct = int(open(r + "/capacity").read())
                    salud = None
                    for a, d in (("energy_full", "energy_full_design"), ("charge_full", "charge_full_design")):
                        if os.path.exists(r + "/" + a):
                            salud = 100 * int(open(r + "/" + a).read()) / int(open(r + "/" + d).read())
                    return pct, open(r + "/status").read().strip() != "Discharging", salud
                except Exception:
                    pass
    if SO == "Darwin":
        _, t = ejecutar(["pmset", "-g", "batt"])
        if "%" in t:
            pct = int(t.split("%")[0].split()[-1])
            return pct, "AC Power" in t, None
    return None


def temperatura_cpu():
    if psutil and hasattr(psutil, "sensors_temperatures"):
        try:
            for nombre, lst in psutil.sensors_temperatures().items():
                for s in lst:
                    if s.current and 0 < s.current < 120:
                        return s.current
        except Exception:
            pass
    if SO == "Linux":
        for i in range(10):
            p = "/sys/class/thermal/thermal_zone%d/temp" % i
            if os.path.exists(p):
                try:
                    t = int(open(p).read()) / 1000
                    if 0 < t < 120:
                        return t
                except Exception:
                    pass
    return None


def programas_inicio():
    """Lista de nombres de programas que arrancan con el sistema."""
    res = []
    if SO == "Windows":
        import winreg
        for raiz, ruta in ((winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run"),
                           (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run")):
            try:
                k = winreg.OpenKey(raiz, ruta)
                i = 0
                while True:
                    res.append(winreg.EnumValue(k, i)[0]); i += 1
            except OSError:
                pass
        sf = os.path.join(os.environ.get("APPDATA", ""), r"Microsoft\Windows\Start Menu\Programs\Startup")
        if os.path.isdir(sf):
            res += [f for f in os.listdir(sf) if f.lower() != "desktop.ini"]
    elif SO == "Darwin":
        for d in (os.path.join(HOME, "Library", "LaunchAgents"), "/Library/LaunchAgents"):
            if os.path.isdir(d):
                res += [f for f in os.listdir(d) if f.endswith(".plist")]
        _, t = ejecutar(["osascript", "-e", 'tell application "System Events" to get the name of every login item'])
        res += [x.strip() for x in t.split(",") if x.strip() and "error" not in t.lower()]
    else:
        d = os.path.join(HOME, ".config", "autostart")
        if os.path.isdir(d):
            res += [f for f in os.listdir(d) if f.endswith(".desktop")]
    return res


def ping(host):
    """Tiempo de respuesta en ms o None."""
    if SO == "Windows":
        c, t = ejecutar(["ping", "-n", "3", "-w", "2000", host], timeout=15)
    else:
        c, t = ejecutar(["ping", "-c", "3", "-W", "2", host], timeout=15)
    if c != 0:
        return None
    import re
    m = re.findall(r"[=<]\s*([\d.,]+)\s*ms", t)
    if not m:
        return 0.0
    v = [float(x.replace(",", ".")) for x in m]
    return sum(v) / len(v)


def conexion_tcp(host, puerto=443, timeout=3):
    t = time.time()
    try:
        socket.create_connection((host, puerto), timeout).close()
        return (time.time() - t) * 1000
    except OSError:
        return None


# ============================================================================
#  PROBLEMAS Y CORRECCIONES
# ============================================================================
class Problema:
    def __init__(self, gravedad, titulo, detalle, correccion=None, texto_boton=None, confirmacion=None):
        self.gravedad = gravedad          # 'alta', 'media', 'baja', 'info'
        self.titulo = titulo
        self.detalle = detalle
        self.correccion = correccion      # función que devuelve (ok, mensaje)
        self.texto_boton = texto_boton or "Corregir"
        self.confirmacion = confirmacion or "¿Desea aplicar esta corrección?"
        self.resuelto = False


# ---------------- Correcciones (todas seguras) ----------------
def fix_temporales():
    total = 0
    for c in carpetas_temporales():
        total += borrar_contenido(c, UN_DIA)
    return True, "Se liberaron %.0f MB de archivos temporales y cachés." % mb(total)


def fix_papelera():
    if SO == "Windows":
        import ctypes
        r = ctypes.windll.shell32.SHEmptyRecycleBinW(None, None, 0x7)  # sin confirmación/sonido/progreso
        return r in (0, -2147418113), "Papelera de reciclaje vaciada."
    p = carpeta_papelera()
    lib = 0
    for raiz in (p, os.path.join(os.path.dirname(p), "info")) if SO == "Linux" else (p,):
        if raiz and os.path.isdir(raiz):
            for item in os.listdir(raiz):
                ruta = os.path.join(raiz, item)
                try:
                    if os.path.isdir(ruta) and not os.path.islink(ruta):
                        lib += tamano_carpeta(ruta); shutil.rmtree(ruta, ignore_errors=True)
                    else:
                        lib += os.lstat(ruta).st_size; os.remove(ruta)
                except OSError:
                    pass
    return True, "Papelera vaciada (%.0f MB liberados)." % mb(lib)


def fix_dns():
    if SO == "Windows":
        c, _ = ejecutar(["ipconfig", "/flushdns"])
    elif SO == "Darwin":
        c, _ = ejecutar(["sudo", "-n", "dscacheutil", "-flushcache"])
        ejecutar(["sudo", "-n", "killall", "-HUP", "mDNSResponder"])
    else:
        c, _ = ejecutar(["resolvectl", "flush-caches"]) if existe("resolvectl") else (-1, "")
    return c == 0, "Caché DNS limpiada." if c == 0 else "No se pudo limpiar la caché DNS (puede requerir administrador)."


def fix_paquetes_linux():
    if existe("apt-get"):
        cmd = "apt-get clean && apt-get -y autoremove"
    elif existe("dnf"):
        cmd = "dnf clean all && dnf -y autoremove"
    elif existe("pacman"):
        cmd = "pacman -Sc --noconfirm"
    elif existe("zypper"):
        cmd = "zypper clean --all"
    else:
        return False, "Gestor de paquetes no reconocido."
    pref = [] if es_admin() else (["pkexec"] if existe("pkexec") else ["sudo", "-n"])
    c, t = ejecutar(pref + ["sh", "-c", cmd], timeout=900)
    return c == 0, "Caché de paquetes limpiada y paquetes huérfanos eliminados." if c == 0 else "No se pudo (se requiere contraseña de administrador)."


def fix_journal_linux():
    pref = [] if es_admin() else (["pkexec"] if existe("pkexec") else ["sudo", "-n"])
    c, _ = ejecutar(pref + ["journalctl", "--vacuum-size=200M"], timeout=300)
    return c == 0, "Registros del sistema reducidos a 200 MB." if c == 0 else "No se pudo (se requiere administrador)."


def fix_sfc_windows():
    if not es_admin():
        return False, "Ejecute el programa como administrador para reparar Windows."
    if int(platform.release() if platform.release().isdigit() else 10) >= 8:
        ejecutar(["DISM", "/Online", "/Cleanup-Image", "/RestoreHealth"], timeout=7200)
    c, t = ejecutar(["sfc", "/scannow"], timeout=7200)
    if "did not find" in t or "no encontr" in t:
        return True, "SFC: Windows no tiene archivos dañados."
    if "successfully repaired" in t or "correctamente" in t:
        return True, "SFC reparó archivos dañados de Windows. Reinicie."
    return c == 0, "SFC terminó (código %d). Revise C:\\Windows\\Logs\\CBS\\CBS.log." % c


def fix_disco_windows():
    if not es_admin():
        return False, "Ejecute el programa como administrador."
    unidad = os.environ.get("SystemDrive", "C:")
    c, t = ejecutar(["chkdsk", unidad, "/scan"], timeout=3600)
    if c == 0:
        return True, "Disco %s analizado: sin errores." % unidad
    return False, "Se encontraron errores en %s. Programe 'chkdsk %s /f' y reinicie (haga copia de seguridad antes)." % (unidad, unidad)


def fix_disco_mac():
    c, t = ejecutar(["diskutil", "verifyVolume", "/"], timeout=3600)
    return c == 0, "Disco verificado: sin errores." if c == 0 else "Se detectaron problemas: use Utilidad de Discos > Primera ayuda."


def fix_cerrar(pid, nombre):
    def f():
        try:
            if psutil:
                p = psutil.Process(pid); p.terminate()
                try:
                    p.wait(5)
                except psutil.TimeoutExpired:
                    p.kill()
            elif SO == "Windows":
                ejecutar(["taskkill", "/PID", str(pid)])
            else:
                os.kill(pid, 15)
            return True, "Programa '%s' cerrado." % nombre
        except Exception as e:
            return False, "No se pudo cerrar '%s': %s" % (nombre, e)
    return f


def fix_abrir_inicio():
    if SO == "Windows":
        subprocess.Popen(["taskmgr", "/0", "/startup"])
    elif SO == "Darwin":
        subprocess.Popen(["open", "x-apple.systempreferences:com.apple.LoginItems-Settings.extension"])
    else:
        for app in ("gnome-session-properties", "gnome-tweaks", "systemsettings"):
            if existe(app):
                subprocess.Popen([app]); break
        else:
            subprocess.Popen(["xdg-open", os.path.join(HOME, ".config", "autostart")])
    return True, "Se abrió el administrador de inicio: desactive lo que no use."


def fix_actualizaciones():
    if SO == "Windows":
        subprocess.Popen(["cmd", "/c", "start", "ms-settings:windowsupdate"])
    elif SO == "Darwin":
        subprocess.Popen(["open", "x-apple.systempreferences:com.apple.Software-Update-Settings.extension"])
    else:
        for app in ("update-manager", "gnome-software", "discover", "pamac-manager"):
            if existe(app):
                subprocess.Popen([app]); break
    return True, "Se abrió el centro de actualizaciones."


# ---------------- Diagnóstico ----------------
def diagnosticar(log):
    """Analiza el equipo; 'log' recibe texto de avance. Devuelve lista de Problema."""
    P = []
    log("Sistema: %s %s (%s) - Python %s" % (NOMBRE_SO, platform.release(), platform.machine(), platform.python_version()))
    log("Equipo: %s   Procesador: %s   Núcleos: %s" % (platform.node(), platform.processor() or "?", os.cpu_count()))
    if not psutil:
        log("(Opcional: instale 'psutil' para mediciones más precisas)")

    # RAM
    log("Analizando memoria RAM...")
    tot, disp = ram()
    if tot:
        uso = 100 * (1 - disp / tot)
        log("  RAM: %.1f GB total, %.1f GB disponible (%.0f %% en uso)" % (gb(tot), gb(disp), uso))
        if gb(tot) < 3.8:
            P.append(Problema("media", "Poca memoria RAM (%.1f GB)" % gb(tot),
                              "Con menos de 4 GB el sistema usa el disco como memoria y se vuelve lento. Ampliar a 8 GB es la mejora más efectiva (requiere hardware)."))
        if uso > 85:
            P.append(Problema("alta", "Memoria casi llena (%.0f %%)" % uso,
                              "Hay demasiados programas abiertos. Cierre los que no use (ver programas pesados abajo)."))

    # CPU
    log("Midiendo uso del procesador (2 s)...")
    cpu = uso_cpu()
    log("  Procesador: %.0f %% de uso" % cpu)
    if cpu > 80:
        P.append(Problema("alta", "Procesador saturado (%.0f %%)" % cpu, "Algún programa está consumiendo todo el procesador. Revise los programas pesados."))
    t = temperatura_cpu()
    if t:
        log("  Temperatura: %.0f °C" % t)
        if t > 85:
            P.append(Problema("alta", "Temperatura alta (%.0f °C)" % t, "Limpie el polvo de ventiladores y rejillas; use la computadora sobre superficie dura."))

    # Disco
    log("Analizando espacio en disco...")
    raiz = os.environ.get("SystemDrive", "C:") + "\\" if SO == "Windows" else "/"
    du = shutil.disk_usage(raiz)
    pct = 100 * du.free / du.total
    log("  Disco %s: %.1f GB libres de %.1f GB (%.0f %% libre)" % (raiz, gb(du.free), gb(du.total), pct))
    if pct < 15:
        P.append(Problema("alta" if pct < 7 else "media", "Disco casi lleno (%.0f %% libre)" % pct,
                          "Con poco espacio el sistema se vuelve lento e inestable. Use las limpiezas de abajo y mueva archivos grandes a un disco externo."))
    if SO == "Windows":
        P.append(Problema("info", "Verificar errores del disco",
                          "Análisis de solo lectura del disco del sistema (chkdsk /scan).", fix_disco_windows, "Analizar",
                          "Se analizará el disco en modo solo lectura (puede tardar). ¿Continuar?"))
    elif SO == "Darwin":
        P.append(Problema("info", "Verificar errores del disco", "Verificación de solo lectura del volumen del sistema.", fix_disco_mac, "Analizar",
                          "Se verificará el disco (solo lectura). ¿Continuar?"))

    # Temporales
    log("Calculando archivos temporales y cachés...")
    temp = sum(tamano_carpeta(c, UN_DIA) for c in carpetas_temporales())
    log("  Temporales/cachés eliminables: %.0f MB" % mb(temp))
    if mb(temp) > 200:
        P.append(Problema("media" if mb(temp) > 1024 else "baja", "%.0f MB de archivos temporales y cachés" % mb(temp),
                          "Archivos sobrantes de programas y navegadores. No incluye documentos personales ni contraseñas.",
                          fix_temporales, "Limpiar", "Se eliminarán temporales y cachés con más de 1 día. Sus documentos NO se tocan. ¿Continuar?"))

    # Papelera
    pap = carpeta_papelera()
    if pap and os.path.isdir(pap):
        tp = tamano_carpeta(pap)
        if mb(tp) > 100:
            P.append(Problema("baja", "Papelera con %.0f MB" % mb(tp), "Los archivos en la papelera siguen ocupando espacio.",
                              fix_papelera, "Vaciar", "ATENCIÓN: lo que está en la papelera se eliminará DEFINITIVAMENTE. Revísela antes. ¿Vaciar?"))
    elif SO == "Windows":
        P.append(Problema("info", "Vaciar la Papelera de reciclaje", "Libera el espacio que ocupan los archivos ya borrados.",
                          fix_papelera, "Vaciar", "ATENCIÓN: lo que está en la Papelera se eliminará DEFINITIVAMENTE. Revísela antes. ¿Vaciar?"))

    # Linux: caché de paquetes y registros
    if SO == "Linux":
        cache = 0
        for d in ("/var/cache/apt/archives", "/var/cache/dnf", "/var/cache/pacman/pkg", "/var/cache/zypp"):
            if os.path.isdir(d):
                cache += tamano_carpeta(d)
        if mb(cache) > 300:
            P.append(Problema("baja", "Caché de paquetes de %.0f MB" % mb(cache), "Instaladores descargados que ya no se necesitan.",
                              fix_paquetes_linux, "Limpiar", "Se limpiará la caché de paquetes y los paquetes huérfanos (pedirá contraseña). ¿Continuar?"))
        j = tamano_carpeta("/var/log/journal") if os.path.isdir("/var/log/journal") else 0
        if mb(j) > 500:
            P.append(Problema("baja", "Registros del sistema ocupan %.0f MB" % mb(j), "Los registros antiguos pueden reducirse a 200 MB sin riesgo.",
                              fix_journal_linux, "Reducir", "Se reducirán los registros del sistema a 200 MB (pedirá contraseña). ¿Continuar?"))

    # Tiempo encendido
    up = tiempo_encendido()
    if up:
        log("  Encendida desde hace %.1f días" % (up / 86400))
        if up > 7 * 86400:
            P.append(Problema("media", "Sin reiniciar hace %.0f días" % (up / 86400),
                              "Reiniciar libera memoria, cierra procesos colgados y aplica actualizaciones pendientes. Guarde su trabajo y reinicie."))

    # Inicio
    log("Revisando programas que arrancan con el sistema...")
    ini = programas_inicio()
    log("  Programas de inicio: %d" % len(ini))
    if len(ini) > 8:
        P.append(Problema("media", "%d programas arrancan con el sistema" % len(ini),
                          "Demasiados programas al inicio hacen que la computadora encienda lenta: " + ", ".join(ini[:12]) + ("..." if len(ini) > 12 else ""),
                          fix_abrir_inicio, "Administrar", "Se abrirá el administrador de inicio del sistema para que desactive lo que no use. ¿Continuar?"))

    # Procesos pesados
    log("Buscando programas que consumen muchos recursos...")
    mem_tot_mb = mb(tot) if tot else 4096
    for nombre, pid, mem, c in procesos_pesados(10):
        if nombre.lower() in PROTEGIDOS or pid == os.getpid():
            continue
        if mem > max(800, mem_tot_mb * 0.2) or c > 30:
            P.append(Problema("media", "Programa pesado: %s (%.0f MB, %.0f %% CPU)" % (nombre, mem, c),
                              "Está consumiendo muchos recursos. Si no lo usa, ciérrelo.",
                              fix_cerrar(pid, nombre), "Cerrar",
                              "¿Cerrar '%s'? Si tiene trabajo sin guardar en ese programa, guárdelo antes." % nombre))

    # Batería
    b = bateria()
    if b:
        pct_b, conectado, salud = b
        log("  Batería: %d %% %s" % (pct_b, "(cargando)" if conectado else "(en uso)"))
        if salud and salud < 60:
            P.append(Problema("media", "Batería desgastada (%.0f %% de su capacidad original)" % salud, "La batería dura menos. Considere reemplazarla."))

    # Internet
    log("Comprobando internet...")
    lat = conexion_tcp("1.1.1.1", 443) or conexion_tcp("8.8.8.8", 53)
    try:
        t0 = time.time(); socket.gethostbyname("www.google.com"); dns_ms = (time.time() - t0) * 1000
    except OSError:
        dns_ms = None
    if lat is None:
        P.append(Problema("alta", "Sin conexión a internet", "Revise el cable o el Wi-Fi y reinicie el router.", fix_dns, "Limpiar DNS",
                          "Se limpiará la caché DNS. ¿Continuar?"))
    else:
        log("  Internet: %.0f ms   DNS: %s" % (lat, "%.0f ms" % dns_ms if dns_ms is not None else "falla"))
        if lat > 200:
            P.append(Problema("baja", "Internet lento (%.0f ms de respuesta)" % lat, "Conexión con mucha demora. Acérquese al router o use cable."))
        if dns_ms is None or dns_ms > 400:
            P.append(Problema("media", "El DNS falla o es lento", "Las páginas tardan en empezar a cargar. Limpiar la caché DNS suele resolverlo.",
                              fix_dns, "Limpiar DNS", "Se limpiará la caché DNS. ¿Continuar?"))

    # Reparación del sistema (Windows)
    if SO == "Windows":
        P.append(Problema("info", "Reparar archivos de Windows (SFC + DISM)",
                          "Busca y repara archivos del sistema dañados. Tarda 15-45 minutos. Requiere administrador.",
                          fix_sfc_windows, "Reparar", "Se ejecutará DISM y SFC (15-45 min, no apague la PC). ¿Continuar?"))
    P.append(Problema("info", "Buscar actualizaciones del sistema",
                      "Las actualizaciones corrigen errores y fallos de seguridad.", fix_actualizaciones, "Abrir", "Se abrirá el centro de actualizaciones. ¿Continuar?"))

    orden = {"alta": 0, "media": 1, "baja": 2, "info": 3}
    P.sort(key=lambda p: orden[p.gravedad])
    return P


# ============================================================================
#  INFORME
# ============================================================================
def guardar_informe(problemas, registro):
    carpeta = os.path.join(HOME, "Documents" if os.path.isdir(os.path.join(HOME, "Documents")) else "", "DiagnosticoPC_Informes")
    os.makedirs(carpeta, exist_ok=True)
    f = os.path.join(carpeta, "Informe_%s.txt" % datetime.datetime.now().strftime("%Y-%m-%d_%H%M"))
    with open(f, "w", encoding="utf-8") as h:
        h.write("%s - Informe\n%s\n%s\n\n" % (APP, datetime.datetime.now().strftime("%d/%m/%Y %H:%M"), "=" * 60))
        h.write("PROBLEMAS DETECTADOS:\n")
        for p in problemas:
            if p.gravedad != "info":
                h.write("  [%s] %s%s\n" % (p.gravedad.upper(), p.titulo, "  -> RESUELTO" if p.resuelto else ""))
        h.write("\nREGISTRO:\n" + "\n".join(registro) + "\n")
    return f


# ============================================================================
#  MODO CONSOLA (si no hay entorno gráfico)
# ============================================================================
def modo_consola():
    print("=" * 60 + "\n  " + APP + "\n" + "=" * 60)
    reg = []
    def log(t):
        print(t); reg.append(t)
    P = diagnosticar(log)
    while True:
        print("\nPROBLEMAS Y ACCIONES:")
        for i, p in enumerate(P, 1):
            est = "RESUELTO" if p.resuelto else ("corregible" if p.correccion else "consejo")
            print("  %2d. [%s] %s (%s)" % (i, p.gravedad.upper(), p.titulo, est))
        op = input("\nNúmero a corregir, I = informe, 0 = salir: ").strip().lower()
        if op == "0":
            break
        if op == "i":
            print("Informe guardado en:", guardar_informe(P, reg)); continue
        if op.isdigit() and 1 <= int(op) <= len(P):
            p = P[int(op) - 1]
            print("\n" + p.titulo + "\n" + p.detalle)
            if p.correccion and not p.resuelto and input(p.confirmacion + " (s/n): ").lower().startswith("s"):
                ok, msg = p.correccion(); p.resuelto = ok; log(("[OK] " if ok else "[X] ") + msg)


# ============================================================================
#  INTERFAZ GRÁFICA
# ============================================================================
def modo_grafico():
    import tkinter as tk
    from tkinter import messagebox, ttk

    COLORES = {"alta": "#c62828", "media": "#ef6c00", "baja": "#f9a825", "info": "#1565c0"}
    ETIQ = {"alta": "GRAVE", "media": "MEDIO", "baja": "LEVE", "info": "HERRAMIENTA"}

    root = tk.Tk()
    root.title(APP)
    root.geometry("1000x680")
    root.minsize(820, 560)
    root.configure(bg="#f3f6fb")
    fuente = ("Segoe UI", 10) if SO == "Windows" else ("Helvetica", 11)

    cab = tk.Frame(root, bg="#1565c0"); cab.pack(fill="x")
    tk.Label(cab, text=APP, bg="#1565c0", fg="white", font=(fuente[0], 18, "bold")).pack(anchor="w", padx=16, pady=(10, 0))
    tk.Label(cab, text="%s %s  |  Seguro: nunca borra documentos personales y pide confirmación antes de cada cambio" % (NOMBRE_SO, platform.release()),
             bg="#1565c0", fg="#dce8ff", font=fuente).pack(anchor="w", padx=18, pady=(0, 10))

    barra = tk.Frame(root, bg="#f3f6fb"); barra.pack(fill="x", padx=12, pady=8)
    estado = tk.StringVar(value="Pulse 'Analizar computadora' para comenzar.")
    prog = ttk.Progressbar(barra, mode="indeterminate", length=180)

    cuerpo = tk.PanedWindow(root, orient="vertical", bg="#f3f6fb", sashwidth=6)
    cuerpo.pack(fill="both", expand=True, padx=12, pady=(0, 12))

    # Lista de problemas (desplazable)
    marco = tk.Frame(cuerpo, bg="white")
    lienzo = tk.Canvas(marco, bg="white", highlightthickness=0)
    sb = ttk.Scrollbar(marco, orient="vertical", command=lienzo.yview)
    lista = tk.Frame(lienzo, bg="white")
    lista.bind("<Configure>", lambda e: lienzo.configure(scrollregion=lienzo.bbox("all")))
    win = lienzo.create_window((0, 0), window=lista, anchor="nw")
    lienzo.bind("<Configure>", lambda e: lienzo.itemconfigure(win, width=e.width))
    lienzo.configure(yscrollcommand=sb.set)
    lienzo.pack(side="left", fill="both", expand=True); sb.pack(side="right", fill="y")
    cuerpo.add(marco, minsize=250, height=420)

    texto = tk.Text(cuerpo, height=8, font=("Consolas", 10) if SO == "Windows" else ("Menlo" if SO == "Darwin" else "Monospace", 10), bg="#fafafa", relief="flat")
    cuerpo.add(texto, minsize=100)

    estado_app = {"problemas": [], "registro": [], "ocupado": False}

    def log(t):
        estado_app["registro"].append(t)
        root.after(0, lambda: (texto.insert("end", t + "\n"), texto.see("end")))

    def ocupado(si, msg=""):
        estado_app["ocupado"] = si
        estado.set(msg)
        (prog.start(12) if si else prog.stop())
        for b in (b_analizar, b_todo, b_informe):
            b.configure(state="disabled" if si else "normal")

    def en_hilo(func, al_terminar):
        def run():
            try:
                r = func()
            except Exception as e:
                r = e
            root.after(0, lambda: al_terminar(r))
        threading.Thread(target=run, daemon=True).start()

    def pintar():
        for w in lista.winfo_children():
            w.destroy()
        P = estado_app["problemas"]
        reales = [p for p in P if p.gravedad != "info" and not p.resuelto]
        if not reales:
            tk.Label(lista, text="✔  No se detectaron problemas importantes.", fg="#2e7d32", bg="white",
                     font=(fuente[0], 13, "bold")).pack(anchor="w", padx=12, pady=10)
        else:
            tk.Label(lista, text="Se detectaron %d problema(s):" % len(reales), fg="#c62828", bg="white",
                     font=(fuente[0], 13, "bold")).pack(anchor="w", padx=12, pady=10)
        for p in P:
            f = tk.Frame(lista, bg="white", highlightbackground="#e0e6ef", highlightthickness=1)
            f.pack(fill="x", padx=10, pady=4)
            col = "#2e7d32" if p.resuelto else COLORES[p.gravedad]
            tk.Label(f, text="RESUELTO" if p.resuelto else ETIQ[p.gravedad], bg=col, fg="white", width=12,
                     font=(fuente[0], 9, "bold")).pack(side="left", fill="y")
            t = tk.Frame(f, bg="white"); t.pack(side="left", fill="both", expand=True, padx=10, pady=6)
            tk.Label(t, text=p.titulo, bg="white", font=(fuente[0], 11, "bold"), anchor="w", justify="left").pack(fill="x")
            tk.Label(t, text=p.detalle, bg="white", fg="#555", font=fuente, anchor="w", justify="left", wraplength=620).pack(fill="x")
            if p.correccion and not p.resuelto:
                tk.Button(f, text=p.texto_boton, width=12, bg="#1565c0", fg="white", relief="flat", cursor="hand2",
                          command=lambda p=p: corregir(p)).pack(side="right", padx=10)

    def analizar():
        if estado_app["ocupado"]:
            return
        texto.delete("1.0", "end"); estado_app["registro"].clear()
        ocupado(True, "Analizando la computadora...")
        def fin(r):
            ocupado(False, "Análisis terminado.")
            if isinstance(r, Exception):
                log("Error: %s" % r); return
            estado_app["problemas"] = r; pintar()
        en_hilo(lambda: diagnosticar(log), fin)

    def corregir(p, preguntar=True, siguiente=None):
        if estado_app["ocupado"] and preguntar:
            return
        if preguntar and not messagebox.askyesno(APP, p.titulo + "\n\n" + p.confirmacion):
            return
        ocupado(True, "Corrigiendo: " + p.titulo)
        def fin(r):
            ok, msg = (False, str(r)) if isinstance(r, Exception) else r
            p.resuelto = ok
            log(("[OK] " if ok else "[X] ") + msg)
            ocupado(False, msg); pintar()
            if siguiente:
                siguiente()
        en_hilo(p.correccion, fin)

    def corregir_todo():
        # Solo correcciones de limpieza seguras (no cierra programas ni vacía papelera ni reparaciones largas)
        seguras = (fix_temporales, fix_dns)
        cola = [p for p in estado_app["problemas"] if p.correccion in seguras and not p.resuelto]
        if not cola:
            messagebox.showinfo(APP, "No hay correcciones automáticas seguras pendientes.\nRevise la lista para las demás opciones."); return
        if not messagebox.askyesno(APP, "Se aplicarán estas correcciones seguras:\n\n- " + "\n- ".join(p.titulo for p in cola) +
                                   "\n\nLos programas abiertos, la papelera y las reparaciones largas se deciden una por una.\n¿Continuar?"):
            return
        def paso():
            if cola:
                corregir(cola.pop(0), preguntar=False, siguiente=paso)
            else:
                messagebox.showinfo(APP, "Correcciones aplicadas. Pulse 'Analizar' de nuevo para verificar.")
        paso()

    def informe():
        f = guardar_informe(estado_app["problemas"], estado_app["registro"])
        log("Informe guardado en: " + f)
        try:
            if SO == "Windows":
                os.startfile(f)
            else:
                subprocess.Popen(["open" if SO == "Darwin" else "xdg-open", f])
        except Exception:
            pass

    estilo = dict(relief="flat", fg="white", font=(fuente[0], 11, "bold"), padx=14, pady=6, cursor="hand2")
    b_analizar = tk.Button(barra, text="🔍  Analizar computadora", bg="#1565c0", command=analizar, **estilo)
    b_todo = tk.Button(barra, text="✔  Corregir lo seguro", bg="#2e7d32", command=corregir_todo, **estilo)
    b_informe = tk.Button(barra, text="📄  Guardar informe", bg="#455a64", command=informe, **estilo)
    for b in (b_analizar, b_todo, b_informe):
        b.pack(side="left", padx=(0, 8))
    prog.pack(side="left", padx=8)
    tk.Label(barra, textvariable=estado, bg="#f3f6fb", font=fuente).pack(side="left", padx=8)

    if not es_admin():
        log("Nota: sin permisos de administrador algunas reparaciones no estarán disponibles.")
    root.after(300, analizar)
    root.mainloop()


def main():
    if "--consola" in sys.argv:
        return modo_consola()
    try:
        import tkinter  # noqa: F401
        if SO == "Linux" and not (os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY")):
            raise RuntimeError("sin entorno gráfico")
        modo_grafico()
    except Exception as e:
        print("(Interfaz gráfica no disponible: %s. Usando modo consola.)" % e)
        modo_consola()


if __name__ == "__main__":
    main()
