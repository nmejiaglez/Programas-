# -*- coding: utf-8 -*-
"""Ventana del Preparador de Estudios para Claude (doble clic para abrir)."""
import os, sys, io, queue, threading, subprocess
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

AZUL = "#1F4E79"
cola = queue.Queue()


class Salida(io.TextIOBase):
    def write(self, s):
        cola.put(("txt", s))
        return len(s)


def elegir_carpeta():
    r = filedialog.askdirectory(title="Elija la carpeta del estudio del paciente")
    if r:
        ruta.set(r)


def elegir_video():
    r = filedialog.askopenfilename(title="Elija el video del estudio",
                                   filetypes=[("Videos", "*.mp4 *.mov *.avi *.mkv *.wmv *.m4v *.webm"),
                                              ("Todos", "*.*")])
    if r:
        ruta.set(r)


def procesar():
    if not ruta.get():
        messagebox.showwarning("Falta el estudio", "Primero elija la carpeta o el video del paciente.")
        return
    btn.config(state="disabled", text="Procesando... espere")
    caja.delete("1.0", "end")
    lado = {"9 (más detalle)": 3, "16 (recomendado)": 4, "25 (más cortes)": 5}[cantidad.get()]
    args = ["x", ruta.get(), "--paciente", paciente.get(), "--mosaico", str(lado),
            "--max-imagenes", str(max_imgs.get())] + (["--pdf"] if formato.get() == "pdf" else [])

    def tarea():
        import preparar_estudio
        viejo = sys.stdout
        sys.stdout = Salida()
        carpeta = None
        try:
            sys.argv = args
            preparar_estudio.main()
            nombre = (paciente.get() or os.path.basename(os.path.normpath(ruta.get()))).strip().replace(" ", "_")
            carpeta = os.path.join(os.path.dirname(os.path.abspath(ruta.get())), f"{nombre}_PARA_CLAUDE")
        except SystemExit as e:
            if e.code:
                print(f"\n{e.code}")
        except Exception as e:
            print(f"\nError: {e}")
        finally:
            sys.stdout = viejo
            cola.put(("fin", carpeta))

    threading.Thread(target=tarea, daemon=True).start()


def revisar_cola():
    try:
        while True:
            tipo, dato = cola.get_nowait()
            if tipo == "txt":
                caja.insert("end", dato); caja.see("end")
            else:
                btn.config(state="normal", text="▶  PREPARAR IMÁGENES")
                if dato and os.path.isdir(dato):
                    ultima.set(dato)
                    btn_abrir.config(state="normal")
                    messagebox.showinfo("Listo", "Listo.\n\nEnvíe a Claude el archivo PDF que aparece "
                                                 "en la carpeta (o las imágenes del Paquete_01).")
                    os.startfile(dato) if os.name == "nt" else None
    except queue.Empty:
        pass
    v.after(150, revisar_cola)


def abrir():
    if os.name == "nt":
        os.startfile(ultima.get())
    else:
        subprocess.Popen(["xdg-open", ultima.get()])


v = tk.Tk()
v.title("Preparador de Estudios para Claude - Dr. Néstor Mejía")
v.geometry("720x620")
v.configure(bg="white")
ruta, paciente, cantidad, ultima = tk.StringVar(), tk.StringVar(), tk.StringVar(value="16 (recomendado)"), tk.StringVar()
max_imgs = tk.IntVar(value=100)
formato = tk.StringVar(value="pdf")
F = ("Arial", 11)

tk.Label(v, text="PREPARADOR DE ESTUDIOS PARA CLAUDE", bg=AZUL, fg="white",
         font=("Arial", 15, "bold"), pady=10).pack(fill="x")
tk.Label(v, text="TC · RM · Ultrasonido · Doppler · DICOM", bg=AZUL, fg="white", font=F).pack(fill="x")

m = tk.Frame(v, bg="white", padx=18, pady=10); m.pack(fill="both", expand=True)

tk.Label(m, text="1.  Elija el estudio del paciente:", bg="white", font=("Arial", 11, "bold")).pack(anchor="w")
f1 = tk.Frame(m, bg="white"); f1.pack(fill="x", pady=4)
tk.Button(f1, text="📁  Carpeta (DICOM / varios)", font=F, command=elegir_carpeta).pack(side="left")
tk.Button(f1, text="🎞  Un video", font=F, command=elegir_video).pack(side="left", padx=8)
tk.Label(m, textvariable=ruta, bg="#EEF3F8", font=("Arial", 9), anchor="w", wraplength=660).pack(fill="x")

tk.Label(m, text="2.  Nombre del paciente:", bg="white", font=("Arial", 11, "bold")).pack(anchor="w", pady=(12, 0))
tk.Entry(m, textvariable=paciente, font=("Arial", 12)).pack(fill="x", pady=4)

tk.Label(m, text="3.  Cortes dentro de cada imagen:", bg="white", font=("Arial", 11, "bold")).pack(anchor="w", pady=(10, 0))
f3 = tk.Frame(m, bg="white"); f3.pack(anchor="w")
for t in ("9 (más detalle)", "16 (recomendado)", "25 (más cortes)"):
    tk.Radiobutton(f3, text=t, variable=cantidad, value=t, bg="white", font=F).pack(side="left", padx=4)

f4 = tk.Frame(m, bg="white"); f4.pack(anchor="w", pady=(10, 0))
f5 = tk.Frame(m, bg="white"); f5.pack(anchor="w", pady=(10, 0))
tk.Label(f5, text="5.  Entregar como:", bg="white", font=("Arial", 11, "bold")).pack(side="left")
tk.Radiobutton(f5, text="UN SOLO PDF (recomendado)", variable=formato, value="pdf", bg="white", font=F,
               command=lambda: max_imgs.set(100)).pack(side="left", padx=4)
tk.Radiobutton(f5, text="Imágenes sueltas", variable=formato, value="img", bg="white", font=F,
               command=lambda: max_imgs.set(5)).pack(side="left", padx=4)
tk.Label(f4, text="4.  Páginas / imágenes máximas:", bg="white", font=("Arial", 11, "bold")).pack(side="left")
tk.Spinbox(f4, from_=1, to=100, width=4, textvariable=max_imgs, font=("Arial", 12)).pack(side="left", padx=6)

btn = tk.Button(m, text="▶  PREPARAR IMÁGENES", bg="#2E7D32", fg="white", font=("Arial", 13, "bold"),
                pady=6, command=procesar)
btn.pack(fill="x", pady=12)

caja = scrolledtext.ScrolledText(m, height=12, font=("Consolas", 9))
caja.pack(fill="both", expand=True)
btn_abrir = tk.Button(m, text="📂  Abrir carpeta de resultados", font=F, state="disabled", command=abrir)
btn_abrir.pack(fill="x", pady=(8, 0))

v.after(150, revisar_cola)
v.mainloop()
