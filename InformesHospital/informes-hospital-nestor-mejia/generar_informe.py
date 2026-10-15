#!/usr/bin/env python3
"""Generador de informes radiológicos — Dr. Néstor José Mejía González.

Convierte un dictado en texto plano (formato .txt descrito en LEAME.md) en el
Word definitivo (FORMATO HOSPITAL o FORMATO LABEX), con columna lateral en la
página 1, ancho completo desde la página 2, volúmenes calculados y fecha/hora
de America/Managua. La plantilla es fija: el contenido cambia, el diseño no.

Uso:  python3 generar_informe.py dictado.txt [carpeta_salida]
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime
from zoneinfo import ZoneInfo

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Mm, Pt, RGBColor

AQUI = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(AQUI, "assets")

NAVY = "1F3A5F"
AZUL = "2E5C9A"
LATERAL = "E8EEF7"
ROJO = "C00000"
ROSA = "FBE4E4"
GRIS = "6B7280"
FUENTE = "Arial"

FORMATOS = {
    "HOSPITAL": {
        "logo": "hospital.png",
        "institucion": "HOSPITAL REGIONAL ESCUELA CAMILO ORTEGA SAAVEDRA",
        "depto": "Departamento de Radiología e Imágenes Médicas",
        "lugar": "Juigalpa, Chontales",
        "pie_logos": ("gobierno.png", "logo4719.png"),
    },
    "LABEX": {
        "logo": "labex.png",
        "institucion": "LABEX LABORATORIO",
        "depto": "Servicio de Radiología e Imagen",
        "lugar": "Juigalpa, Chontales",
        "pie_logos": None,
    },
}

MEDICO = "Dr. Néstor José Mejía González"
TITULO_FIRMA = "Médico Especialista en Radiología e Imágenes"
CODIGO = "Código MINSA: 37294"

# Página carta
ANCHO, ALTO = Mm(215.9), Mm(279.4)
M_IZQ = M_DER = Mm(13)
M_SUP, M_INF = Mm(11), Mm(24)
UTIL = 215.9 - 26  # mm
LAT = 44  # columna lateral (mm) ≈ 23 %
CONT = UTIL - LAT


# --------------------------------------------------------------------------
# Lectura del dictado
# --------------------------------------------------------------------------
def num(s):
    return float(s.replace(",", "."))


def volumen(texto):
    """'12.70 x 16.18 x 15.99' (mm) -> '1.72 cm³'. None si no hay 3 medidas."""
    partes = re.split(r"\s*[x×*]\s*", texto.replace("mm", "").strip())
    if len(partes) != 3:
        return None
    try:
        a, b, c = (num(p) for p in partes)
    except ValueError:
        return None
    return f"{a * b * c * 0.523 / 1000:.2f} cm³"


def bonita(medida):
    m = re.sub(r"\s*[x×*]\s*", " × ", medida.strip())
    if re.fullmatch(r"[\d.,× ]+", m):
        m += " mm"
    return m


def expandir(texto):
    """{v:LxAPxT} -> volumen; {m:LxAPxT} -> medidas con ×."""
    def rv(mt):
        v = volumen(mt.group(1))
        if not v:
            raise SystemExit(f"Volumen inválido (se necesitan 3 medidas): {mt.group(0)}")
        return v
    texto = re.sub(r"\{v:([^}]+)\}", rv, texto)
    texto = re.sub(r"\{m:([^}]+)\}", lambda mt: bonita(mt.group(1)), texto)
    return texto


def leer(ruta):
    datos = {"formato": "HOSPITAL"}
    secciones = {}
    hallazgos = []  # [(titulo, relevante, [parrafos])]
    actual = None
    with open(ruta, encoding="utf-8") as f:
        lineas = f.read().splitlines()
    for ln in lineas:
        s = ln.strip()
        if not s or s.startswith("//"):
            continue
        if s.startswith("@"):
            k, _, v = s[1:].partition(" ")
            datos[k.lower()] = v.strip()
            continue
        if s.startswith("## "):
            actual = ("sec", s[3:].strip().upper())
            secciones.setdefault(actual[1], [])
            continue
        if s.startswith("# "):
            t = s[2:].strip()
            rel = t.endswith("!")
            hallazgos.append((t.rstrip("! ").upper(), rel, []))
            actual = ("org",)
            continue
        if actual is None:
            raise SystemExit(f"Texto fuera de sección: {s}")
        if actual[0] == "org":
            hallazgos[-1][2].append(expandir(s))
        else:
            secciones[actual[1]].append(s)
    datos["formato"] = "HOSPITAL"  # habilidad exclusiva de este formato
    if datos["formato"] not in FORMATOS:
        raise SystemExit("@formato debe ser HOSPITAL o LABEX")
    for k in ("paciente", "modalidad"):
        if k not in datos:
            raise SystemExit(f"Falta @{k}")
    return datos, secciones, hallazgos


def filas_mediciones(lineas):
    filas = []
    for ln in lineas:
        rel = ln.rstrip().endswith("!")
        c = [x.strip() for x in ln.rstrip("! ").split("|")]
        c += [""] * (5 - len(c))
        est, par, med, vol, interp = c[:5]
        if vol.lower() in ("auto", "a"):
            vol = volumen(med) or "—"
        filas.append((est, par, bonita(med) if med else "—", vol or "—", interp, rel))
    return filas


# --------------------------------------------------------------------------
# Utilidades OOXML
# --------------------------------------------------------------------------
def sombrear(el, color):
    pr = el.get_or_add_tcPr() if el.tag.endswith("}tc") else el.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    pr.append(shd)


def borde_parrafo(p, lado, color, tam=12, espacio=4):
    pPr = p._p.get_or_add_pPr()
    bd = pPr.find(qn("w:pBdr"))
    if bd is None:
        bd = OxmlElement("w:pBdr")
        pPr.append(bd)
    b = OxmlElement(f"w:{lado}")
    b.set(qn("w:val"), "single")
    b.set(qn("w:sz"), str(tam))
    b.set(qn("w:space"), str(espacio))
    b.set(qn("w:color"), color)
    bd.append(b)


def bordes_tabla(tabla, color=None, tam=4, internos=True):
    tblPr = tabla._tbl.tblPr
    bd = OxmlElement("w:tblBorders")
    for lado in ("top", "left", "bottom", "right", "insideH", "insideV"):
        b = OxmlElement(f"w:{lado}")
        if color and (internos or lado in ("top", "left", "bottom", "right")):
            b.set(qn("w:val"), "single")
            b.set(qn("w:sz"), str(tam))
            b.set(qn("w:color"), color)
        else:
            b.set(qn("w:val"), "nil")
        bd.append(b)
    tblPr.append(bd)


def borde_celda(celda, lado, color, tam=12):
    tcPr = celda._tc.get_or_add_tcPr()
    bd = tcPr.find(qn("w:tcBorders"))
    if bd is None:
        bd = OxmlElement("w:tcBorders")
        tcPr.append(bd)
    b = OxmlElement(f"w:{lado}")
    b.set(qn("w:val"), "single")
    b.set(qn("w:sz"), str(tam))
    b.set(qn("w:color"), color)
    bd.append(b)


def anchos(tabla, mms):
    tabla.autofit = False
    tblPr = tabla._tbl.tblPr
    lay = OxmlElement("w:tblLayout")
    lay.set(qn("w:type"), "fixed")
    tblPr.append(lay)
    tw = tblPr.find(qn("w:tblW"))
    if tw is None:
        tw = OxmlElement("w:tblW")
        tblPr.append(tw)
    tw.set(qn("w:w"), str(int(sum(mms) * 56.7)))
    tw.set(qn("w:type"), "dxa")
    grid = tabla._tbl.tblGrid
    for gc, w in zip(grid.findall(qn("w:gridCol")), mms):
        gc.set(qn("w:w"), str(int(w * 56.7)))
    for fila in tabla.rows:
        for c, w in zip(fila.cells, mms):
            c.width = Mm(w)


def margenes_celda(tabla, sup=0.6, izq=1.5):
    tblPr = tabla._tbl.tblPr
    m = OxmlElement("w:tblCellMar")
    for lado, v in (("top", sup), ("bottom", sup), ("left", izq), ("right", izq)):
        e = OxmlElement(f"w:{lado}")
        e.set(qn("w:w"), str(int(v * 56.7)))
        e.set(qn("w:type"), "dxa")
        m.append(e)
    tblPr.append(m)


def fila_no_partir(fila, encabezado=False):
    trPr = fila._tr.get_or_add_trPr()
    trPr.append(OxmlElement("w:cantSplit"))
    if encabezado:
        trPr.append(OxmlElement("w:tblHeader"))


def campo(parrafo, codigo, tam, color):
    for tipo, txt in (("begin", None), ("instr", codigo), ("separate", None), ("texto", "1"), ("end", None)):
        r = parrafo.add_run()
        fmt(r, tam, color=color)
        if tipo == "instr":
            e = OxmlElement("w:instrText")
            e.set(qn("xml:space"), "preserve")
            e.text = f" {txt} "
        elif tipo == "texto":
            e = OxmlElement("w:t")
            e.text = txt
        else:
            e = OxmlElement("w:fldChar")
            e.set(qn("w:fldCharType"), tipo)
        r._r.append(e)


def fmt(run, tam=11, negrita=False, color=None, cursiva=False):
    run.font.name = FUENTE
    run._r.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), FUENTE)
    run.font.size = Pt(tam)
    run.font.bold = negrita
    run.font.italic = cursiva
    if color:
        run.font.color.rgb = RGBColor.from_string(color)
    return run


def parrafo(cont, texto="", tam=11, negrita=False, color=None, alin=None,
            antes=0, despues=3, interlineado=1.08, primer=True):
    p = cont.paragraphs[0] if primer and len(cont.paragraphs) == 1 and not cont.paragraphs[0].text \
        and not cont.paragraphs[0].runs else cont.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(antes)
    pf.space_after = Pt(despues)
    pf.line_spacing = interlineado
    if alin is not None:
        p.alignment = alin
    if texto:
        texto_rico(p, texto, tam, negrita, color)
    return p


def texto_rico(p, texto, tam=11, negrita=False, color=None):
    """**negrita**  y  !!rojo!! (hallazgo relevante resaltado)."""
    for trozo in re.split(r"(\*\*.+?\*\*|!!.+?!!)", texto):
        if not trozo:
            continue
        if trozo.startswith("**"):
            fmt(p.add_run(trozo[2:-2]), tam, True, color)
        elif trozo.startswith("!!"):
            fmt(p.add_run(trozo[2:-2]), tam, True, ROJO)
        else:
            fmt(p.add_run(trozo), tam, negrita, color)


def imagen(cont, ruta, ancho_mm, alin=WD_ALIGN_PARAGRAPH.CENTER, despues=2):
    p = parrafo(cont, alin=alin, despues=despues)
    p.add_run().add_picture(ruta, width=Mm(ancho_mm))  # alto proporcional
    return p


# --------------------------------------------------------------------------
# Bloques del informe (flujo)
# --------------------------------------------------------------------------
def barra(cont, texto):
    p = parrafo(cont, antes=6, despues=4)
    sombrear(p._p, NAVY)
    fmt(p.add_run(" " + texto), 11, True, "FFFFFF")
    p.paragraph_format.keep_with_next = True
    return p


def organo(cont, texto, relevante):
    p = parrafo(cont, antes=5, despues=2)
    sombrear(p._p, LATERAL)
    borde_parrafo(p, "left", AZUL, 24, 4)
    fmt(p.add_run(texto), 11, True, NAVY)
    if relevante:
        fmt(p.add_run("   ● HALLAZGO RELEVANTE"), 8, True, ROJO)
    p.paragraph_format.keep_with_next = True
    return p


def cuerpo(cont, texto):
    return parrafo(cont, texto, alin=WD_ALIGN_PARAGRAPH.JUSTIFY, despues=3)


def tabla_mediciones(cont, filas, ancho):
    t = cont.add_table(rows=1, cols=5)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    bordes_tabla(t, "B4C2D8", 4)
    margenes_celda(t, 0.7, 1.5)
    prop = [0.19, 0.25, 0.22, 0.11, 0.23]
    for c, txt in zip(t.rows[0].cells, ("Estructura", "Parámetro", "Medida", "Volumen", "Interpretación objetiva")):
        sombrear(c._tc, NAVY)
        parrafo(c, txt, 9, True, "FFFFFF", despues=0)
    fila_no_partir(t.rows[0], encabezado=True)
    for est, par, med, vol, interp, rel in filas:
        fila = t.add_row()
        fila_no_partir(fila)
        col = ROJO if rel else None
        for i, (c, txt) in enumerate(zip(fila.cells, (est, par, med, vol, interp))):
            c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if rel:
                sombrear(c._tc, ROSA)
            alin = WD_ALIGN_PARAGRAPH.CENTER if i in (2, 3) else None
            parrafo(c, txt, 9, rel or i == 0, col or (NAVY if i == 0 else None), alin=alin, despues=0)
    anchos(t, [ancho * x for x in prop])
    parrafo(cont, despues=2, tam=4)
    return t


def tabla_imagenes(cont, lineas, base, ancho):
    items = []
    for ln in lineas:
        ruta, _, pie = (x.strip() for x in ln.partition("|"))
        if not os.path.isabs(ruta):
            ruta = os.path.join(base, ruta)
        items.append((ruta, pie))
    for i in range(0, len(items), 3):
        grupo = items[i:i + 3]
        t = cont.add_table(rows=1, cols=3)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        bordes_tabla(t)
        fila_no_partir(t.rows[0])
        w = ancho / 3
        for c, (ruta, pie) in zip(t.rows[0].cells, grupo):
            imagen(c, ruta, w - 4)
            parrafo(c, pie, 8.5, True, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=2)
        anchos(t, [w] * 3)
    parrafo(cont, despues=2, tam=4)


def conclusiones(cont, lineas):
    for ln in lineas:
        m = re.match(r"^(\d+[.)]\s*)?(PROBLEMA PRINCIPAL:)?\s*(.*)$", ln)
        p = parrafo(cont, alin=WD_ALIGN_PARAGRAPH.JUSTIFY, despues=3)
        p.paragraph_format.left_indent = Mm(5)
        p.paragraph_format.first_line_indent = Mm(-5)
        if m.group(1):
            fmt(p.add_run(m.group(1).strip() + " "), 11, True, NAVY)
        if m.group(2):
            fmt(p.add_run("PROBLEMA PRINCIPAL: "), 11, True, ROJO)
        texto_rico(p, expandir(m.group(3)))


def firma(cont):
    p = parrafo(cont, "______________________________", alin=WD_ALIGN_PARAGRAPH.CENTER, antes=26, despues=0)
    p.paragraph_format.keep_with_next = True
    for i, (txt, neg) in enumerate(((MEDICO, True), (TITULO_FIRMA, False), (CODIGO, False))):
        p = parrafo(cont, txt, 11 if neg else 10, neg, NAVY if neg else None, WD_ALIGN_PARAGRAPH.CENTER, despues=0)
        if i < 2:
            p.paragraph_format.keep_with_next = True


def unidades(datos, secciones, hallazgos):
    """Lista ordenada de unidades del flujo. Los párrafos largos se dividen por
    oraciones para poder llenar la página 1 justo hasta el final."""
    U = []
    def texto_largo(tipo_id, texto):
        oraciones = re.split(r"(?<=[.;:])\s+(?=[A-ZÁÉÍÓÚÑ(])", texto)
        for i, o in enumerate(oraciones):
            U.append(("frase", tipo_id, o, i == 0))
    U.append(("barra", "ESTUDIO / INDICACIÓN CLÍNICA"))
    pid = 0
    for t in secciones.get("ESTUDIO", [datos.get("estudio", datos["modalidad"])]):
        pid += 1
        texto_largo(pid, expandir(t))
    U.append(("barra", "HALLAZGOS"))
    for titulo, rel, parrafos in hallazgos:
        U.append(("organo", titulo, rel))
        for t in parrafos:
            pid += 1
            texto_largo(pid, t)
    if secciones.get("MEDICIONES"):
        U.append(("barra", "CUADRO DE MEDICIONES"))
        U.append(("mediciones", filas_mediciones(secciones["MEDICIONES"])))
    if secciones.get("IMAGENES"):
        U.append(("barra", "IMÁGENES DE LOS HALLAZGOS RELEVANTES"))
        U.append(("imagenes", secciones["IMAGENES"]))
    for clave, titulo in (("CONCLUSIONES", "CONCLUSIONES"),
                          ("ETIOLOGIA", "ANÁLISIS ETIOLÓGICO / CAUSA PROBABLE"),
                          ("RECOMENDACIONES", "RECOMENDACIONES")):
        if secciones.get(clave):
            U.append(("barra", titulo))
            if clave == "CONCLUSIONES":
                U.append(("conclusiones", secciones[clave]))
            else:
                for t in secciones[clave]:
                    pid += 1
                    texto_largo(pid, expandir(t))
    U.append(("firma",))
    return U


def pintar(cont, U, ancho, base):
    ultimo_pid, p_actual = None, None
    for u in U:
        tipo = u[0]
        if tipo == "frase":
            _, pid, texto, inicio = u
            if pid == ultimo_pid and p_actual is not None and not inicio:
                texto_rico(p_actual, " " + texto)
            else:
                p_actual = cuerpo(cont, texto)
            ultimo_pid = pid
            continue
        ultimo_pid = p_actual = None
        if tipo == "barra":
            barra(cont, u[1])
        elif tipo == "organo":
            organo(cont, u[1], u[2])
        elif tipo == "mediciones":
            tabla_mediciones(cont, u[1], ancho)
        elif tipo == "imagenes":
            tabla_imagenes(cont, u[1], base, ancho)
        elif tipo == "conclusiones":
            conclusiones(cont, u[1])
        elif tipo == "firma":
            firma(cont)


# --------------------------------------------------------------------------
# Página, columna lateral, encabezado y pie
# --------------------------------------------------------------------------
def fecha_hora(datos):
    ahora = datetime.now(ZoneInfo("America/Managua"))
    f = datos.get("fecha") or ahora.strftime("%d/%m/%Y")
    h = datos.get("hora") or ahora.strftime("%I:%M %p")
    return f, h


def lateral(celda, datos, F, fecha, hora):
    sombrear(celda._tc, LATERAL)
    borde_celda(celda, "right", NAVY, 18)
    celda.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
    imagen(celda, os.path.join(ASSETS, F["logo"]), LAT - 6, despues=4)
    imagen(celda, os.path.join(ASSETS, "sello_nm.png"), LAT - 6, despues=8)
    for etiqueta, clave, defecto in (("PACIENTE", "paciente", ""), ("EDAD", "edad", "No consignada"),
                                     ("SEXO", "sexo", "No consignado"),
                                     ("MÉDICO SOLICITANTE", "medico", "No consignado"),
                                     ("PROCEDENCIA", "procedencia", "No consignada"),
                                     ("MODALIDAD", "modalidad", "")):
        parrafo(celda, etiqueta, 7.5, True, AZUL, despues=0, antes=3)
        p = parrafo(celda, datos.get(clave) or defecto, 9.5, True, "111827", despues=2, interlineado=1.0)
        borde_parrafo(p, "bottom", "B4C2D8", 4, 3)
    for etiqueta, valor in (("FECHA", fecha), ("HORA", hora)):
        parrafo(celda, etiqueta, 7.5, True, AZUL, despues=0, antes=3)
        p = parrafo(celda, valor, 9.5, True, "111827", despues=2)
        borde_parrafo(p, "bottom", "B4C2D8", 4, 3)
    parrafo(celda, MEDICO, 8, True, NAVY, antes=18, despues=0, interlineado=1.0)
    parrafo(celda, "Especialista en Radiología e Imagen", 7.5, False, GRIS, despues=0, interlineado=1.0)
    parrafo(celda, "Código MINSA 37294", 7.5, False, GRIS, despues=0)


def cabecera_derecha(celda, F):
    parrafo(celda, "INFORME RADIOLÓGICO", 20, True, NAVY, despues=0, interlineado=1.0)
    parrafo(celda, F["depto"], 10.5, False, AZUL, despues=0)
    p = parrafo(celda, f'{F["institucion"].title() if F is FORMATOS["HOSPITAL"] else "LABEX Laboratorio"} · {F["lugar"]}',
                9, False, GRIS, despues=4)
    borde_parrafo(p, "bottom", NAVY, 12, 4)


def encabezado(seccion, F, datos, fecha):
    h = seccion.header
    h.is_linked_to_previous = False
    t = h.add_table(1, 3, Mm(UTIL))
    bordes_tabla(t)
    anchos(t, [24, UTIL - 48, 24])
    a, b, c = t.rows[0].cells
    for x in (a, b, c):
        x.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    imagen(a, os.path.join(ASSETS, F["logo"]), 15, despues=0)
    parrafo(b, F["institucion"], 10, True, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=0)
    parrafo(b, f'{F["depto"]} · {F["lugar"]}', 8, False, AZUL, WD_ALIGN_PARAGRAPH.CENTER, despues=0)
    parrafo(b, f'Informe radiológico (continuación) · Paciente: {datos["paciente"]} · {fecha}', 8, False, GRIS,
            WD_ALIGN_PARAGRAPH.CENTER, despues=0)
    imagen(c, os.path.join(ASSETS, "sello_nm.png"), 15, despues=0)
    p = h.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    borde_parrafo(p, "top", NAVY, 12, 1)
    fmt(p.add_run(""), 4)
    # quitar el párrafo vacío inicial antes de la tabla: la tabla va primero
    h._element.remove(p._p)
    h._element.append(p._p)


def pie(footer, F):
    footer.is_linked_to_previous = False
    t = footer.add_table(1, 3, Mm(UTIL))
    bordes_tabla(t)
    anchos(t, [42, UTIL - 84, 42])
    a, b, c = t.rows[0].cells
    for x in (a, b, c):
        x.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    if F["pie_logos"]:
        imagen(a, os.path.join(ASSETS, F["pie_logos"][0]), 38, WD_ALIGN_PARAGRAPH.LEFT, 0)
        imagen(c, os.path.join(ASSETS, F["pie_logos"][1]), 20, WD_ALIGN_PARAGRAPH.RIGHT, 0)
    parrafo(b, f"{MEDICO} · Especialista en Radiología e Imagen", 7.5, False, GRIS, WD_ALIGN_PARAGRAPH.CENTER, despues=0)
    parrafo(b, f'Código MINSA 37294 · {F["lugar"]}', 7.5, False, GRIS, WD_ALIGN_PARAGRAPH.CENTER, despues=0)
    p = parrafo(b, "Página ", 7.5, False, GRIS, WD_ALIGN_PARAGRAPH.CENTER, despues=0)
    campo(p, "PAGE", 7.5, GRIS)
    fmt(p.add_run(" de "), 7.5, color=GRIS)
    campo(p, "NUMPAGES", 7.5, GRIS)
    p0 = footer.paragraphs[0]
    borde_parrafo(p0, "top", "B4C2D8", 6, 1)
    p0.paragraph_format.space_after = Pt(0)
    fmt(p0.add_run(""), 3)


def construir(datos, U, k, base, F):
    doc = Document()
    st = doc.styles["Normal"]
    st.font.name = FUENTE
    st.font.size = Pt(11)
    st.element.rPr.rFonts.set(qn("w:eastAsia"), FUENTE)
    s = doc.sections[0]
    s.page_width, s.page_height = ANCHO, ALTO
    s.left_margin, s.right_margin, s.top_margin, s.bottom_margin = M_IZQ, M_DER, M_SUP, M_INF
    s.header_distance, s.footer_distance = Mm(6), Mm(5)
    s.different_first_page_header_footer = True
    fecha, hora = fecha_hora(datos)
    encabezado(s, F, datos, fecha)
    pie(s.footer, F)
    pie(s.first_page_footer, F)
    s.first_page_header.is_linked_to_previous = False

    t = doc.add_table(rows=1, cols=2)
    bordes_tabla(t)
    margenes_celda(t, 0, 2)
    fila = t.rows[0]
    trPr = fila._tr.get_or_add_trPr()
    alto = OxmlElement("w:trHeight")
    alto.set(qn("w:val"), str(int(ALTO_FILA * 56.7)))
    alto.set(qn("w:hRule"), "atLeast")
    trPr.append(alto)
    anchos(t, [LAT, CONT])
    izq, der = fila.cells
    lateral(izq, datos, F, fecha, hora)
    der.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
    cabecera_derecha(der, F)
    pintar(der, U[:k], CONT - 5, base)
    resto = U[k:]
    # si la primera unidad del resto continúa una frase, abrir párrafo nuevo
    pintar(doc, [("frase", -1, u[2], True) if i == 0 and u[0] == "frase" else u
                 for i, u in enumerate(resto)], UTIL, base)
    # quitar el párrafo vacío final que Word agrega tras la tabla si no hay resto
    if not resto:
        p = parrafo(doc, despues=0, tam=1)
        p.paragraph_format.line_spacing = Pt(1)
    return doc


ALTO_FILA = 279.4 - 11 - 24 - 6  # alto útil de la página 1 (mm)


def a_pdf(ruta_docx, carpeta):
    soffice = shutil.which("soffice") or shutil.which("libreoffice")
    if not soffice:
        return None
    subprocess.run([soffice, "--headless", "--convert-to", "pdf", "--outdir", carpeta, ruta_docx],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180)
    pdf = os.path.join(carpeta, os.path.splitext(os.path.basename(ruta_docx))[0] + ".pdf")
    return pdf if os.path.exists(pdf) else None


def texto_pagina(pdf, n):
    r = subprocess.run(["pdftotext", "-f", str(n), "-l", str(n), "-layout", pdf, "-"],
                       capture_output=True, text=True)
    return re.sub(r"\s+", "", r.stdout)


def paginas(pdf):
    r = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True)
    return int(re.search(r"Pages:\s+(\d+)", r.stdout).group(1))


def huella(u):
    if u[0] == "frase":
        t = u[2]
    elif u[0] in ("barra", "organo"):
        t = u[1]
    else:
        return None
    return re.sub(r"\s+", "", re.sub(r"\*\*|!!", "", t))[-18:]


def cabe(datos, U, k, base, F, tmp):
    """¿Las primeras k unidades caben en la página 1?"""
    if k == 0:
        return True
    marca = huella(U[k - 1])
    if marca is None:
        return False
    ruta = os.path.join(tmp, "prueba.docx")
    construir(datos, U, k, base, F).save(ruta)
    pdf = a_pdf(ruta, tmp)
    return marca in texto_pagina(pdf, 1)


def corte_valido(U, k):
    if k == 0 or k == len(U):
        return k == 0
    previo = U[k - 1][0]
    # no dejar una barra o título de órgano al final de la página 1;
    # tablas, conclusiones y firma solo van a ancho completo.
    return previo == "frase"


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    entrada = sys.argv[1]
    salida = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(entrada))
    base = os.path.dirname(os.path.abspath(entrada))
    datos, secciones, hallazgos = leer(entrada)
    F = FORMATOS[datos["formato"]]
    U = unidades(datos, secciones, hallazgos)
    # solo unidades de texto pueden ir en la página 1
    limite = next((i for i, u in enumerate(U) if u[0] not in ("frase", "barra", "organo")), len(U))
    tmp = tempfile.mkdtemp()
    k = 0
    if shutil.which("soffice") or shutil.which("libreoffice"):
        lo, hi = 0, limite  # búsqueda binaria del mayor k que cabe
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if cabe(datos, U, mid, base, F, tmp):
                lo = mid
            else:
                hi = mid - 1
        # margen de seguridad para Word (renderiza un poco distinto a LibreOffice)
        k = max(0, lo - 1)
        while k > 0 and not corte_valido(U, k):
            k -= 1
    else:
        # sin LibreOffice: estimación por caracteres
        total = 0
        for i, u in enumerate(U[:limite]):
            total += len(u[2]) if u[0] == "frase" else 120
            if total > 2600:
                break
            if corte_valido(U, i + 1):
                k = i + 1
    nombre = datos.get("archivo") or re.sub(r"[^A-Za-z0-9_]+", "", "_".join(datos["paciente"].split()[:1] +
                                                                            datos["paciente"].split()[-1:]) + "_Informe")
    nombre = re.sub(r"[^A-Za-z0-9_\-]", "", nombre.replace(" ", "_"))
    os.makedirs(salida, exist_ok=True)
    ruta = os.path.join(salida, nombre + ".docx")
    construir(datos, U, k, base, F).save(ruta)
    pdf = a_pdf(ruta, salida)
    msg = f"OK  {ruta}"
    if pdf:
        msg += f"\n    Vista previa: {pdf} ({paginas(pdf)} páginas)"
    print(msg)
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
