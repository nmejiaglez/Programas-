"""Crea UN SOLO archivo por formato (instrucciones + protocolos + logos + programa) para adjuntar a un chat.
Uso: python3 herramientas/empaquetar.py"""
import base64, io, os
from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORMATOS = {"HOSPITAL": "InformesHospital/informes-hospital-nestor-mejia",
            "LABEX": "InformesLabex/informes-labex-nestor-mejia"}


def png_b64(ruta, atlas):
    im = Image.open(ruta)
    if atlas:  # esquemas: paleta de 256 colores, mucho más livianos
        im = im.convert("RGB").quantize(256)
    b = io.BytesIO(); im.save(b, "PNG", optimize=True)
    return base64.b64encode(b.getvalue()).decode()


for fmt, rel in FORMATOS.items():
    d = os.path.join(BASE, rel)
    leer = lambda f: open(os.path.join(d, f), encoding="utf-8").read()
    instrucciones = "\n\n".join([leer("SKILL.md").split("---", 2)[2].strip(),
                                 leer("referencias/estandar_detalle.md"), leer("referencias/protocolos.md"),
                                 leer("referencias/reglas_completas.md")]).replace('"""', "'''").replace("`referencias/estandar_detalle.md`", "la sección ESTÁNDAR DE DETALLE (más abajo)").replace("`referencias/reglas_completas.md`", "la sección de reglas originales del doctor (más abajo)").replace("referencias/protocolos.md", "la sección PROTOCOLOS (más abajo)").replace("estandar_detalle.md", "ESTÁNDAR DE DETALLE").replace("carpeta `assets/` de ESTA habilidad (junto a este SKILL.md)", "dentro de ESTE archivo").replace("`python3 <carpeta_de_esta_skill>/generar_informe.py dictado.txt salida`", "`python3 ESTE_ARCHIVO.py dictado.txt salida`")
    activos = {}
    for raiz, _, archivos in os.walk(os.path.join(d, "assets")):
        for a in sorted(archivos):
            r = os.path.relpath(os.path.join(raiz, a), os.path.join(d, "assets"))
            activos[r] = png_b64(os.path.join(raiz, a), r.startswith("atlas"))
    prot = leer("protocolos.py")
    gen = leer("generar_informe.py")
    gen = gen.replace('ASSETS = os.path.join(AQUI, "assets")', 'ASSETS = None  # se define al final del archivo')
    guardia = 'if __name__ == "__main__":\n    main()'
    assert guardia in gen
    gen = gen.replace(guardia, '')
    gen = gen.replace("    sys.path.insert(0, AQUI)\n    from protocolos import faltantes\n", "")
    gen = gen.replace("from docx import Document", "from docx import Document  # pip install python-docx")
    cab = f'''#!/usr/bin/env python3
"""
=====================================================================================================
 INFORMES RADIOLÓGICOS — FORMATO {fmt} — Dr. Néstor José Mejía González (Código MINSA 37294)
 ARCHIVO ÚNICO: contiene instrucciones, protocolos, logos, sellos, esquemas y el programa que arma el Word.
=====================================================================================================

INSTRUCCIONES PARA CLAUDE
>>> LEER SOLO DESDE AQUÍ HASTA LA LÍNEA "FIN DE INSTRUCCIONES". NO leer el resto del archivo: es código y logos
>>> codificados y leerlo gastaría muchísimo uso. Para usarlo basta con EJECUTARLO.
- AL RECIBIR ESTE ARCHIVO (o al iniciar el chat) SIN datos de un paciente real: responder ÚNICAMENTE
  "Listo, Dr. Mejía. Formato {fmt} activo. Envíe los datos del paciente." y ESPERAR. NO generar ejemplos, NO ejecutar
  el programa, NO probarlo, NO resumir estas instrucciones, NO leer más archivos. Empezar solo cuando lleguen datos.
- Este archivo es TODO lo necesario. Los logos y sellos YA están dentro: NUNCA pedirlos al doctor.
- Todos los informes de este chat son FORMATO {fmt}.
- Para cada paciente: escribir el dictado .txt con el formato descrito abajo y ejecutar
      python3 ESTE_ARCHIVO.py dictado.txt carpeta_salida
  (si falta python-docx: pip install python-docx). Entregar el .docx generado.
- Los avisos del programa (frases prohibidas, estructuras faltantes) son internos: corregir y regenerar
  sin preguntarle nada al doctor.

{instrucciones}

==================================== FIN DE INSTRUCCIONES ====================================
"""
'''
    activos_py = "_ACTIVOS = {\n" + "".join(f'    "{k}": "{v}",\n' for k, v in activos.items()) + "}\n"
    extraer = '''

def _extraer_activos():
    import base64 as _b, tempfile as _t
    carpeta = os.path.join(_t.gettempdir(), "nm_informes_activos_''' + fmt.lower() + '''")
    for nombre, datos in _ACTIVOS.items():
        ruta = os.path.join(carpeta, nombre)
        if not os.path.exists(ruta):
            os.makedirs(os.path.dirname(ruta), exist_ok=True)
            with open(ruta, "wb") as f:
                f.write(_b.b64decode(datos))
    return carpeta

'''
    # separar el docstring y los imports del generador para insertar protocolos y activos después de los imports
    i = gen.index("AQUI = ")
    cuerpo = gen[:i] + "\n# ------------------------- protocolos obligatorios\n" + prot.split('"""', 2)[2] + extraer + gen[i:]
    cuerpo = cuerpo.split('"""', 2)[2]  # quitar docstring original del generador
    salida = os.path.join(BASE, f"ARCHIVO_UNICO_{fmt}.py")
    with open(salida, "w", encoding="utf-8") as f:
        f.write(cab + cuerpo + "\n\n# ------------------------- logos, sellos y esquemas (no editar)\n" + activos_py + '\nASSETS = _extraer_activos()\n\nif __name__ == "__main__":\n    main()\n')
    print(salida, round(os.path.getsize(salida) / 1e6, 2), "MB")
