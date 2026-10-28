"""Utilidades para convertir volúmenes reales (NIfTI/DICOM) en pilas de cortes rotuladas
para el visor del Atlas Radiológico.

Convenciones de visualización (radiológicas):
  axial    : izquierda de la imagen = derecha del paciente, arriba = anterior; cefálico → caudal
  coronal  : izquierda = derecha del paciente, arriba = craneal; anterior → posterior
  sagital  : izquierda = anterior, arriba = craneal; derecha → izquierda del paciente
Los volúmenes de entrada deben estar en orden de vóxel RAS (x→izquierda, y→anterior, z→craneal).
"""
import base64, io, json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

PLANOS = ('axial', 'coronal', 'sagital')


def corte(vol, plano, i):
    """Devuelve el corte 2D (filas, columnas) orientado para mostrar."""
    if plano == 'axial':      # vol[x, y, z] -> filas = y (ant arriba), cols = x (der a la izq)
        return vol[:, ::-1, i].T
    if plano == 'coronal':    # filas = z (craneal arriba), cols = x
        return vol[:, i, ::-1].T
    return vol[i, ::-1, ::-1].T  # sagital: filas = z, cols = y (anterior a la izquierda)


def indices(vol_shape, plano, paso, rango=None):
    eje = {'axial': 2, 'coronal': 1, 'sagital': 0}[plano]
    n = vol_shape[eje]
    a, b = rango if rango else (0, n)
    idx = list(range(a, b, paso))
    if plano == 'axial':
        idx = idx[::-1]        # cefálico -> caudal
    elif plano == 'coronal':
        idx = idx[::-1]        # anterior -> posterior
    return idx


def espaciado_px(esp, plano):
    """(alto_px_mm, ancho_px_mm) del corte mostrado."""
    sx, sy, sz = esp
    return {'axial': (sy, sx), 'coronal': (sz, sx), 'sagital': (sz, sy)}[plano]


def a_uint8(v, lo, hi):
    return (np.clip((v - lo) / (hi - lo), 0, 1) * 255).astype(np.uint8)


def jpeg_b64(a, calidad=80, escala=1.0):
    im = Image.fromarray(a, 'L')
    if escala != 1.0:
        im = im.resize((round(im.width * escala), round(im.height * escala)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=calidad, optimize=True)
    return base64.b64encode(b.getvalue()).decode()


def png_b64(a):
    b = io.BytesIO(); Image.fromarray(a.astype(np.uint8), 'L').save(b, 'PNG', optimize=True)
    return base64.b64encode(b.getvalue()).decode()


def anclas(lab2d, min_area):
    """Para cada etiqueta del corte: punto interior representativo (x, y) y área en píxeles."""
    out = []
    for v in np.unique(lab2d):
        if v == 0:
            continue
        m = lab2d == v
        area = int(m.sum())
        if area < min_area:
            continue
        cc, n = ndimage.label(m)
        if n > 1:
            tam = ndimage.sum(m, cc, range(1, n + 1))
            m = cc == (int(np.argmax(tam)) + 1)
        # punto más interno (máximo de la transformada de distancia)
        dt = ndimage.distance_transform_edt(m)
        y, x = np.unravel_index(int(np.argmax(dt)), dt.shape)
        out.append([int(v), int(x), int(y), area])
    return out


def exportar_pila(destino, ident, plano, series, lab, esp, paso, rango=None, min_area=12,
                  escala=1.0, meta=None, lab_div=1):
    """series: dict nombre -> volumen uint8 (RAS). lab: volumen de etiquetas uint8 (RAS) o None.
    Escribe destino/<ident>_<plano>.js con imágenes JPEG y mapas de etiquetas PNG en base64."""
    any_vol = next(iter(series.values()))
    idx = indices(any_vol.shape, plano, paso, rango)
    data = {'id': ident, 'plano': plano, 'series': {k: [] for k in series}, 'lab': [], 'anc': [],
            'pos': []}
    h_mm, w_mm = espaciado_px(esp, plano)
    for i in idx:
        for k, v in series.items():
            data['series'][k].append(jpeg_b64(corte(v, plano, i), escala=escala))
        if lab is not None:
            l2 = np.ascontiguousarray(corte(lab, plano, i))
            if lab_div > 1:
                l2 = l2[::lab_div, ::lab_div] if plano == 'axial' else l2[:, ::lab_div]
            data['lab'].append(png_b64(l2))
            data['anc'].append(anclas(l2, min_area))
        data['pos'].append(int(i))
    s0 = corte(any_vol, plano, idx[0])
    data['h'], data['w'] = int(s0.shape[0]), int(s0.shape[1])
    if lab is not None:
        data['lh'], data['lw'] = l2.shape
    data['aspecto'] = round(h_mm / w_mm, 4)        # alto real de un píxel / ancho real
    data['mm'] = round(paso * {'axial': esp[2], 'coronal': esp[1], 'sagital': esp[0]}[plano], 2)
    if meta:
        data.update(meta)
    js = 'ATLAS_CARGA(' + json.dumps(data, separators=(',', ':')) + ');\n'
    Path(destino).mkdir(parents=True, exist_ok=True)
    f = Path(destino) / f'{ident}_{plano}.js'
    f.write_text(js)
    return f, len(idx)


def lado_por_centroide(lab, afin):
    """Devuelve {etiqueta: 'derecho'|'izquierdo'|None} según la coordenada RAS x del centroide."""
    res = {}
    vals = [v for v in np.unique(lab) if v]
    cms = ndimage.center_of_mass(np.ones_like(lab), lab, vals)
    for v, c in zip(vals, cms):
        x = (afin @ np.array([c[0], c[1], c[2], 1.0]))[0]
        res[int(v)] = 'derecho' if x < -4 else 'izquierdo' if x > 4 else None
    return res
