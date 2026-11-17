# -*- coding: utf-8 -*-
"""Preparador V2: selección acumulativa de videos e imágenes."""
import os
import sys
import io
import queue
import threading
import subprocess
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from tkinter.scrolledtext import ScrolledText
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

VIDEOS = ('.mp4', '.mov', '.avi', '.mkv', '.wmv', '.m4v', '.webm')
IMAGENES = ('.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff')

class Salida(io.TextIOBase):
    def __init__(self, mensajes): self.mensajes = mensajes
    def write(self, texto):
        self.mensajes.put(('texto', texto))
        return len(texto)
    def flush(self): pass

class Preparador:
    def __init__(self, ventana):
        self.v = ventana
        self.archivos = []
        self.mensajes = queue.Queue()
        self.resultado = None
        self.trabajando = False
        ventana.title('PREPARADOR V2 - VARIOS VIDEOS Y JPG - Dr. Néstor Mejía')
        ventana.geometry('960x800')
        ventana.minsize(780, 650)
        ventana.configure(bg='white')
        self.paciente = tk.StringVar()
        self.contador = tk.StringVar(value='0 videos · 0 imágenes · 0 carpetas')
        self.mosaico = tk.StringVar(value='16 cortes')
        self.limite = tk.IntVar(value=100)
        tk.Label(ventana, text='PREPARADOR V2  |  VARIOS VIDEOS Y JPG', bg='#123A78', fg='white',
                 font=('Arial', 17, 'bold'), pady=14).pack(fill='x')
        area = ttk.Frame(ventana, padding=16); area.pack(fill='both', expand=True)
        ttk.Label(area, text='1. Agregue todos los archivos del mismo paciente', font=('Arial', 12, 'bold')).pack(anchor='w')
        ttk.Label(area, text='Puede usar cada botón varias veces. Los archivos nuevos se añaden a la lista.').pack(anchor='w', pady=(3,8))
        fila = ttk.Frame(area); fila.pack(fill='x')
        self.controles = []
        for texto, accion in [('AGREGAR VARIOS VIDEOS', self.videos), ('AGREGAR VARIOS JPG / PNG', self.imagenes), ('Agregar carpeta', self.carpeta)]:
            b=ttk.Button(fila, text=texto, command=accion); b.pack(side='left', padx=(0,8)); self.controles.append(b)
        ttk.Label(area, text='En la ventana de selección: Ctrl + A selecciona todos; Ctrl + clic selecciona archivos separados.').pack(anchor='w', pady=8)
        marco = ttk.Frame(area); marco.pack(fill='both', expand=True)
        self.lista = ttk.Treeview(marco, columns=('orden','tipo','nombre','ruta'), show='headings', selectmode='extended', height=9)
        for col,titulo,ancho in [('orden','Orden',55),('tipo','Tipo',75),('nombre','Archivo',270),('ruta','Carpeta',350)]:
            self.lista.heading(col,text=titulo);self.lista.column(col,width=ancho,stretch=col in ('nombre','ruta'))
        barra=ttk.Scrollbar(marco,orient='vertical',command=self.lista.yview)
        horizontal=ttk.Scrollbar(marco,orient='horizontal',command=self.lista.xview)
        self.lista.configure(yscrollcommand=barra.set,xscrollcommand=horizontal.set)
        self.lista.grid(row=0,column=0,sticky='nsew');barra.grid(row=0,column=1,sticky='ns');horizontal.grid(row=1,column=0,sticky='ew')
        marco.columnconfigure(0,weight=1);marco.rowconfigure(0,weight=1)
        f=ttk.Frame(area);f.pack(fill='x',pady=6)
        for texto,accion in [('Quitar seleccionados',self.quitar),('Vaciar lista',self.vaciar),('Subir',lambda:self.mover(-1)),('Bajar',lambda:self.mover(1))]:
            b=ttk.Button(f,text=texto,command=accion);b.pack(side='left',padx=(0,6));self.controles.append(b)
        ttk.Label(area,textvariable=self.contador,font=('Arial',11,'bold')).pack(anchor='w',pady=4)
        ttk.Label(area,text='2. Nombre del paciente',font=('Arial',11,'bold')).pack(anchor='w',pady=(8,2))
        self.nombre=ttk.Entry(area,textvariable=self.paciente,font=('Arial',12));self.nombre.pack(fill='x');self.controles.append(self.nombre)
        opts=ttk.Frame(area);opts.pack(fill='x',pady=10)
        ttk.Label(opts,text='Mosaico solo para videos / DICOM:').pack(side='left')
        combo=ttk.Combobox(opts,textvariable=self.mosaico,values=('9 cortes','16 cortes','25 cortes'),state='readonly',width=12);combo.pack(side='left',padx=6)
        ttk.Label(opts,text='Máximo de mosaicos:').pack(side='left',padx=(14,4))
        self.spin=ttk.Spinbox(opts,from_=1,to=100,textvariable=self.limite,width=5);self.spin.pack(side='left');self.controles.extend([combo,self.spin])
        ttk.Label(area,text='Cada JPG ocupa una página completa. Fotos y videos se incorporan en el orden de la lista.',wraplength=850).pack(anchor='w')
        self.btn=ttk.Button(area,text='3. CONVERTIR TODOS LOS ARCHIVOS A PDF',command=self.procesar);self.btn.pack(fill='x',pady=12)
        self.log=ScrolledText(area,height=7,font=('Consolas',10));self.log.pack(fill='both',expand=True)
        self.abrir_btn=ttk.Button(area,text='Abrir carpeta del PDF',command=self.abrir,state='disabled');self.abrir_btn.pack(fill='x',pady=(8,0))
        ventana.protocol('WM_DELETE_WINDOW',self.cerrar)
        ventana.after(100,self.revisar)

    def seleccionar(self,titulo,extensiones):
        if self.trabajando:return
        # Una tupla de patrones es compatible con el selector nativo de Windows.
        patrones=tuple('*'+ext for ext in extensiones)
        elegidos=filedialog.askopenfilenames(parent=self.v,title=titulo,
            filetypes=[('Archivos compatibles',patrones),('Todos los archivos','*.*')])
        self.agregar(elegidos)
    def videos(self):self.seleccionar('Seleccione VARIOS VIDEOS con Ctrl + A o Ctrl + clic',VIDEOS)
    def imagenes(self):self.seleccionar('Seleccione VARIOS JPG / PNG con Ctrl + A o Ctrl + clic',IMAGENES)
    def carpeta(self):
        if self.trabajando:return
        ruta=filedialog.askdirectory(parent=self.v,title='Agregar carpeta del mismo paciente')
        if ruta:self.agregar([ruta])
    def agregar(self,rutas):
        vistos={os.path.normcase(os.path.abspath(p)) for p in self.archivos}
        for p in rutas:
            clave=os.path.normcase(os.path.abspath(p))
            if clave not in vistos:self.archivos.append(p);vistos.add(clave)
        self.actualizar()
    def actualizar(self,seleccion=()):
        self.lista.delete(*self.lista.get_children())
        nv=ni=nc=0
        for i,p in enumerate(self.archivos):
            ext=os.path.splitext(p)[1].lower()
            if os.path.isdir(p):tipo='Carpeta';nc+=1
            elif ext in VIDEOS:tipo='Video';nv+=1
            elif ext in IMAGENES:tipo='Imagen';ni+=1
            else:tipo='DICOM'
            self.lista.insert('', 'end',iid=str(i),values=(i+1,tipo,os.path.basename(p),os.path.dirname(p)))
        self.contador.set(f'{len(self.archivos)} elementos seleccionados: {nv} videos · {ni} imágenes · {nc} carpetas')
        for i in seleccion:
            if i<len(self.archivos):self.lista.selection_add(str(i))
    def quitar(self):
        if self.trabajando:return
        for i in sorted((int(x) for x in self.lista.selection()),reverse=True):del self.archivos[i]
        self.actualizar()
    def vaciar(self):
        if self.trabajando:return
        self.archivos.clear();self.actualizar()
    def mover(self,direccion):
        if self.trabajando:return
        indices=sorted(int(x) for x in self.lista.selection())
        if not indices:return
        if (direccion<0 and indices[0]==0) or (direccion>0 and indices[-1]==len(self.archivos)-1):return
        for i in (indices if direccion<0 else reversed(indices)):
            self.archivos[i],self.archivos[i+direccion]=self.archivos[i+direccion],self.archivos[i]
        self.actualizar([i+direccion for i in indices])
    def procesar(self):
        if self.trabajando:return
        if not self.archivos:
            messagebox.showwarning('Lista vacía','Agregue los videos o JPG antes de convertir.',parent=self.v);return
        try:
            limite=self.limite.get()
            if not 1<=limite<=100:raise ValueError()
        except (ValueError,tk.TclError):
            messagebox.showwarning('Revise el límite','Indique entre 1 y 100 mosaicos.',parent=self.v);return
        lado={'9 cortes':3,'16 cortes':4,'25 cortes':5}[self.mosaico.get()]
        args=list(self.archivos)+['--paciente',self.paciente.get(),'--mosaico',str(lado),'--max-imagenes',str(limite),'--pdf']
        self.trabajando=True;self.btn.configure(state='disabled',text='Convirtiendo todos los archivos...')
        for b in self.controles:b.configure(state='disabled')
        self.abrir_btn.configure(state='disabled');self.log.delete('1.0','end')
        self.log.insert('end',f'Procesando {len(self.archivos)} elementos de la lista.\n')
        threading.Thread(target=self.tarea,args=(args,),daemon=True).start()
    def tarea(self,args):
        salida=None;error=None;viejo=sys.stdout
        try:
            sys.stdout=Salida(self.mensajes)
            import preparar_estudio
            salida=preparar_estudio.main(args)
        except (Exception,SystemExit) as e:error=str(e)
        finally:
            sys.stdout=viejo;self.mensajes.put(('fin',(salida,error)))
    def revisar(self):
        try:
            while True:
                tipo,dato=self.mensajes.get_nowait()
                if tipo=='texto':self.log.insert('end',dato);self.log.see('end')
                else:
                    self.trabajando=False;self.btn.configure(state='normal',text='3. CONVERTIR TODOS LOS ARCHIVOS A PDF')
                    for b in self.controles:b.configure(state='readonly' if isinstance(b,ttk.Combobox) else 'normal')
                    carpeta,error=dato
                    if carpeta:
                        self.resultado=carpeta;self.abrir_btn.configure(state='normal')
                        messagebox.showinfo('PDF listo','Se procesaron los archivos de la lista.\n\nPulse Abrir carpeta del PDF para encontrar el resultado.',parent=self.v)
                    else:messagebox.showerror('No se completó',error or 'Revise los archivos seleccionados.',parent=self.v)
        except queue.Empty:pass
        self.v.after(100,self.revisar)
    def abrir(self):
        if self.resultado:
            if os.name=='nt':os.startfile(self.resultado)
            else:subprocess.Popen(['xdg-open',self.resultado])
    def cerrar(self):
        if self.trabajando:
            messagebox.showinfo('Procesando','Espere a que termine la conversión antes de cerrar.',parent=self.v);return
        self.v.destroy()

if __name__=='__main__':
    root=tk.Tk();Preparador(root);root.mainloop()
