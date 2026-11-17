"""Carga el motor original verificado sin usar su caché global de imágenes."""
import base64
import hashlib
import json
from pathlib import Path
from types import ModuleType

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT / "assets" / "original"
MANIFEST = ROOT / "assets" / "sha256.json"
BRAND = ("hospital.png", "sello_nm.png", "gobierno.png", "logo4719.png")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def digest(path):
    return sha(path.read_bytes())


def load_engine(destination=None):
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    expected = manifest["original"]
    if {p.name for p in ORIGINAL.iterdir()} != set(expected):
        raise ValueError("Inventario original alterado")
    for name, checksum in expected.items():
        if digest(ORIGINAL / name) != checksum:
            raise ValueError(f"Recurso original alterado: {name}")
    origin = ORIGINAL / "CHATGPT_HOSPITAL.py"
    source = origin.read_text(encoding="utf-8")
    target = "ASSETS = _extraer_activos()"
    if source.count(target) != 1:
        raise ValueError("Punto de carga de recursos inesperado")
    mod = ModuleType("motor_original")
    mod.__file__ = str(origin)
    # La plantilla sigue siendo la misma. La tabla doble conserva unidades mixtas
    # y el parámetro explícito, que el original descartaba en esa presentación.
    corrections = {
        target: "ASSETS = None",
        '        imps += [tx for et, tx in filas if _norm(et).startswith("impresion")]\n        p = parrafo(c,': (
            '        imps += [tx for et, tx in filas if _norm(et).startswith("impresion")]\n'
            '        if not nombre and not datos:\n'
            '            continue\n'
            '        p = parrafo(c,'
        ),
        '    if etio_pendiente:\n        # causa probable': (
            '    if etio_pendiente and FIRMA_AL_FINAL:\n'
            '        t = cont.add_table(rows=1, cols=1)\n'
            '        bordes_tabla(t); margenes_celda(t, 0.4, 1.8); fila_no_partir(t.rows[0])\n'
            '        tarjeta_etio(t.rows[0].cells[0])\n'
            '        anchos(t, [ancho])\n'
            '    elif etio_pendiente:\n        # causa probable'
        ),
        '    if secciones.get("RECOMENDACIONES"):\n        U.append': (
            '    if secciones.get("DIFERENCIALES"):\n'
            '        U.append(("barra", "DIAGNÓSTICO DIFERENCIAL"))\n'
            '        U.append(("recuadro", secciones["DIFERENCIALES"], AZUL))\n'
            '    if secciones.get("RECOMENDACIONES"):\n        U.append'
        ),
        # Logotipos grandes y legibles (pedido del Dr. Mejía, 2026-11-17)
        '    anchos(t, [30, UTIL - 60, 30])': '    anchos(t, [48, UTIL - 96, 48])',
        '"sello_nm.png"), 16, WD_ALIGN_PARAGRAPH.LEFT, 0)': '"sello_nm.png"), 42, WD_ALIGN_PARAGRAPH.LEFT, 0)',
        'F["logo"]), 15, WD_ALIGN_PARAGRAPH.RIGHT, 0)': 'F["logo"]), 42, WD_ALIGN_PARAGRAPH.RIGHT, 0)',
        '    anchos(t, [18, UTIL - 36, 18])': '    anchos(t, [26, UTIL - 52, 26])',
        '"sello_nm.png"), 10, despues=0)': '"sello_nm.png"), 16, despues=0)',
        'F["logo"]), 10, despues=0)': 'F["logo"]), 16, despues=0)',
        'F["pie_logos"][0]), 34, WD_ALIGN_PARAGRAPH.LEFT, 0)': 'F["pie_logos"][0]), 40, WD_ALIGN_PARAGRAPH.LEFT, 0)',
        'F["pie_logos"][1]), 12, WD_ALIGN_PARAGRAPH.RIGHT, 0)': 'F["pie_logos"][1]), 15, WD_ALIGN_PARAGRAPH.RIGHT, 0)',
        '"Medida (mm)", "Vol.", "Interpret."': '"Medida", "Vol. (cm³)", "Interpret."',
        '        med = med.replace(" mm", "")': '        est = f"{est} · {par}" if par else est',
    }
    for old, new in corrections.items():
        if source.count(old) != 1:
            raise ValueError("Punto de adaptación del motor inesperado")
        source = source.replace(old, new)
    exec(compile(source, str(origin), "exec"), vars(mod))
    mod.FIRMA_AL_FINAL = False
    if set(mod._ACTIVOS) != set(manifest["incrustados"]):
        raise ValueError("Inventario incrustado alterado")
    for name, encoded in mod._ACTIVOS.items():
        data = base64.b64decode(encoded, validate=True)
        if sha(data) != manifest["incrustados"][name]:
            raise ValueError(f"Imagen incrustada alterada: {name}")
        if destination is not None:
            path = destination / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
    if destination is not None:
        mod.ASSETS = str(destination)
    return mod, {name: manifest["incrustados"][name] for name in BRAND}
