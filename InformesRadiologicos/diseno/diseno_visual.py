def espacio(cont, pt=4):
    """Separador mínimo tras una tabla (Word exige un párrafo entre tablas)."""
    p = parrafo(cont, despues=0)
    p.paragraph_format.line_spacing = Pt(pt)
    fmt(p.add_run("\u200b"), 2)
    return p


def barra(cont, texto):
    """Encabezado de sección: barra azul con texto blanco y filete dorado inferior."""
    p = parrafo(cont, antes=4, despues=2, interlineado=1.0)
    sombrear(p._p, NAVY)
    borde_parrafo(p, "bottom", DORADO, 12, 0)
    fmt(p.add_run("  " + texto), 11, True, "FFFFFF")
    p.paragraph_format.keep_with_next = True
    return p


def _chips_medidas(medidas):
    """Medidas que el dictado puso con {m:} / {v:} → líneas cortas para la columna del órgano."""
    out = []
    for tipo, valor in medidas:
        if tipo == "m":
            out.append(bonita(valor).replace(" ", " "))
        else:
            v = volumen(valor)
            if v:
                out.append("Vol. " + v.replace(" ", " "))
    vistos = []
    for x in out:
        if x not in vistos:
            vistos.append(x)
    return vistos


def tabla_hallazgos(cont, items, ancho):
    """Hallazgos en tabla de dos columnas: a la izquierda el órgano (ilustración, nombre y
    medidas clave) y a la derecha su descripción. Una fila por estructura, filas separadas
    por líneas finas: el médico ubica cada órgano de un vistazo y el texto se lee a lo ancho."""
    t = cont.add_table(rows=0, cols=2)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    bordes_tabla(t)
    margenes_celda(t, 1.4, 2.0)
    izq = 40
    for n, (titulo, rel, parrafos, medidas) in enumerate(items):
        fila = t.add_row()
        if not any(x.startswith((">>", "[[")) for x in parrafos):
            fila_no_partir(fila)  # órgano corto: nunca separado de su descripción
        # (una fila con ficha puede continuar en la página siguiente para no dejar huecos)
        a, b = fila.cells
        a.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
        b.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
        for c in (a, b):
            borde_celda(c, "bottom", DATO_LINEA, 4)
            if n == 0:
                borde_celda(c, "top", NAVY, 8)
        sombrear(a._tc, ROSA if rel else DATO_FONDO)
        borde_celda(a, "left", ROJO if rel else AZUL, 24)
        if rel:
            sombrear(b._tc, "FFF7F7")
        # --- columna del órgano
        try:
            ilu = ilustracion_para(titulo)
            if ilu and os.path.exists(ilu):
                imagen(a, ilu, 11.5, despues=1)
            else:
                imagen(a, icono_para(titulo), 6, despues=1)
        except Exception:
            pass
        parrafo(a, titulo, 9, True, ROJO if rel else NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=1,
                interlineado=1.0)
        if rel:
            parrafo(a, "● HALLAZGO RELEVANTE", 7, True, ROJO, WD_ALIGN_PARAGRAPH.CENTER, despues=1,
                    interlineado=1.0)
        for chip in _chips_medidas(medidas):
            p = parrafo(a, chip, 8, True, "222B38", WD_ALIGN_PARAGRAPH.CENTER, despues=0, interlineado=1.0)
        # --- columna de la descripción
        descripcion(b, parrafos, rel, ancho - izq - 4)
    anchos(t, [izq, ancho - izq])
    espacio(cont)
    return t


FICHA_FILA = re.compile(r"^-\s*([^:]{2,40}):\s*(.+)$")


def _sin_parrafo_extra(t):
    """python-docx agrega un párrafo vacío tras la tabla anidada: se quita para no dejar huecos."""
    nxt = t._tbl.getnext()
    if nxt is not None and nxt.tag == qn("w:p") and not len(nxt):
        nxt.getparent().remove(nxt)


def ficha(celda, filas, ancho):
    """Ficha del hallazgo patológico: tabla de dos columnas Apartado | Descripción."""
    t = celda.add_table(rows=0, cols=2)
    _sin_parrafo_extra(t)
    bordes_tabla(t)
    margenes_celda(t, 0.8, 1.6)
    for n, (et, val) in enumerate(filas):
        fila = t.add_row()
        fila_no_partir(fila)
        a, b = fila.cells
        for c in (a, b):
            c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            borde_celda(c, "bottom", "E8C4C8", 4)
        sombrear(a._tc, ROSA)
        if n % 2:
            sombrear(b._tc, "FFFBFB")
        imp = _norm(et).startswith(("impresion", "clasificacion"))
        parrafo(a, et, 10, True, ROJO, despues=0, interlineado=1.0)
        p = parrafo(b, despues=0, interlineado=1.0)
        texto_rico(p, val, 10.5, imp, ROJO if imp else "222B38")
    anchos(t, [ancho * 0.30, ancho * 0.70])
    return t


def tabla_lesiones(celda, encabezado, filas, ancho):
    """Varias lesiones (p. ej. litiasis múltiple): una fila por lesión con sus medidas."""
    t = celda.add_table(rows=1, cols=len(encabezado))
    _sin_parrafo_extra(t)
    bordes_tabla(t)
    margenes_celda(t, 0.7, 1.2)
    for c, txt in zip(t.rows[0].cells, encabezado):
        sombrear(c._tc, ROJO)
        c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        parrafo(c, txt, 9, True, "FFFFFF", WD_ALIGN_PARAGRAPH.CENTER, despues=0, interlineado=1.0)
    fila_no_partir(t.rows[0], encabezado=True)
    for n, fila_datos in enumerate(filas):
        fila = t.add_row()
        fila_no_partir(fila)
        fila_datos = (fila_datos + [""] * len(encabezado))[:len(encabezado)]
        for i, (c, txt) in enumerate(zip(fila.cells, fila_datos)):
            c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            sombrear(c._tc, "FFFBFB" if n % 2 else "FFFFFF")
            borde_celda(c, "bottom", "E8C4C8", 4)
            es_medida = i > 0 and bool(re.search(r"\d", txt)) and len(txt) < 22
            parrafo(c, bonita(txt).replace(" ", "\u00a0") if es_medida and re.fullmatch(r"[\d.,x×* ]+", txt) else txt,
                    10, i in (0, 2), ROJO if i == 0 else "222B38",
                    WD_ALIGN_PARAGRAPH.CENTER if i != 1 else None, despues=0, interlineado=1.0)
    n = len(encabezado)
    base = [0.07, 0.29, 0.25, 0.15, 0.24] if n == 5 else [1 / n] * n
    anchos(t, [ancho * x for x in base])
    return t


def descripcion(celda, parrafos, rel, ancho):
    """Párrafos normales; '>> TÍTULO' abre una ficha y las líneas '- Apartado: texto' son sus filas."""
    i = 0
    while i < len(parrafos):
        tx = parrafos[i]
        if tx.startswith(">>"):
            p = parrafo(celda, tx[2:].strip().upper(), 10.5, True, ROJO, antes=4, despues=2, interlineado=1.0)
            borde_parrafo(p, "bottom", ROJO, 8, 1)
            p.paragraph_format.keep_with_next = True
            i += 1
            continue
        if tx.startswith("[[") and tx.endswith("]]"):
            enc = [x.strip() for x in tx[2:-2].split("|")]
            filas = []
            i += 1
            while i < len(parrafos) and parrafos[i].startswith("+ "):
                filas.append([x.strip() for x in parrafos[i][2:].split("|")])
                i += 1
            tabla_lesiones(celda, enc, filas, ancho)
            fin = parrafo(celda, despues=0, tam=2)
            fin.paragraph_format.line_spacing = Pt(3)
            fmt(fin.add_run("\u200b"), 2)
            _rpr = fin._p.get_or_add_pPr(); _m = OxmlElement("w:rPr"); _sz = OxmlElement("w:sz"); _sz.set(qn("w:val"), "4"); _m.append(_sz); _rpr.append(_m)
            continue
        if FICHA_FILA.match(tx):
            filas = []
            while i < len(parrafos) and FICHA_FILA.match(parrafos[i]):
                m = FICHA_FILA.match(parrafos[i])
                filas.append((m.group(1).strip(), m.group(2).strip()))
                i += 1
            ficha(celda, filas, ancho)
            fin = parrafo(celda, despues=0, tam=2)  # Word exige un párrafo tras la tabla anidada
            fin.paragraph_format.line_spacing = Pt(3)
            fmt(fin.add_run("\u200b"), 2)
            _rpr = fin._p.get_or_add_pPr(); _m = OxmlElement("w:rPr"); _sz = OxmlElement("w:sz"); _sz.set(qn("w:val"), "4"); _m.append(_sz); _rpr.append(_m)
            continue
        parrafo(celda, tx, 11, False, ROJO if rel else "222B38", WD_ALIGN_PARAGRAPH.JUSTIFY,
                despues=3, interlineado=1.05)
        i += 1


def cuerpo(cont, texto, color=None):
    return parrafo(cont, texto, color=color or "222B38", alin=WD_ALIGN_PARAGRAPH.JUSTIFY, despues=3,
                   interlineado=1.05)


def tabla_mediciones(cont, filas, ancho):
    """Cuadro de mediciones a ancho completo, columnas fijas, filas alternas y números sin partirse."""
    t = cont.add_table(rows=1, cols=5)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    bordes_tabla(t)
    margenes_celda(t, 0.9, 1.6)
    prop = [0.23, 0.17, 0.22, 0.13, 0.25]
    for i, (c, txt) in enumerate(zip(t.rows[0].cells, ("Estructura", "Parámetro", "Medida", "Vol. (cm³)",
                                                       "Interpretación"))):
        sombrear(c._tc, NAVY)
        c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        borde_celda(c, "bottom", DORADO, 12)
        parrafo(c, txt, 9.5, True, "FFFFFF", WD_ALIGN_PARAGRAPH.CENTER if i in (2, 3) else None, despues=0,
                interlineado=1.0)
    fila_no_partir(t.rows[0], encabezado=True)
    for n, (est, par, med, vol, interp, rel) in enumerate(filas):
        fila = t.add_row()
        fila_no_partir(fila)
        fondo = ROSA if rel else ("F4F7FB" if n % 2 else "FFFFFF")
        vol = vol.replace(" cm³", "").strip() if vol else "—"
        for i, (c, txt) in enumerate(zip(fila.cells, (est, par or "—", med, vol or "—", interp or "—"))):
            c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            sombrear(c._tc, fondo)
            borde_celda(c, "bottom", DATO_LINEA, 4)
            if i == 0:
                borde_celda(c, "left", ROJO if rel else AZUL, 18)
            if i in (2, 3):
                txt = txt.replace(" ", " ")
            color = ROJO if rel else (NAVY if i == 0 else "222B38")
            parrafo(c, txt, 10, rel or i in (0, 3), color,
                    WD_ALIGN_PARAGRAPH.CENTER if i in (2, 3) else None, despues=0, interlineado=1.0)
    for c in t.rows[-1].cells:
        borde_celda(c, "bottom", NAVY, 8)
    anchos(t, [ancho * x for x in prop])
    espacio(cont)
    return t


def tabla_imagenes(cont, lineas, base, ancho):
    items = []
    for ln in lineas:
        ruta, _, pie = (x.strip() for x in ln.partition("|"))
        if not os.path.isabs(ruta):
            ruta = os.path.join(base, ruta)
        items.append((ruta, pie))
    n = 3 if ancho >= 120 else 2
    for i in range(0, len(items), n):
        grupo = items[i:i + n]
        t = cont.add_table(rows=1, cols=n)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        bordes_tabla(t)
        margenes_celda(t, 1, 1.5)
        fila_no_partir(t.rows[0])
        w = ancho / n
        for c, (ruta, pie) in zip(t.rows[0].cells, grupo):
            sombrear(c._tc, "F4F7FB")
            imagen(c, ruta, w - 6)
            parrafo(c, pie, 8.5, True, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=2)
        anchos(t, [w] * n)
    espacio(cont)


def conclusiones(cont, lineas, ancho):
    """Conclusiones numeradas en tabla: número en círculo de color, texto a la derecha.
    El PROBLEMA PRINCIPAL va primero, con número rojo y fondo rosado."""
    t = cont.add_table(rows=0, cols=2)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    bordes_tabla(t)
    margenes_celda(t, 0.6, 1.6)
    n = 0
    for ln in lineas:
        m = re.match(r"^(\d+)?[.)]?\s*(PROBLEMA PRINCIPAL:)?\s*(.*)$", ln)
        n = int(m.group(1)) if m.group(1) else n + 1
        principal = bool(m.group(2))
        fila = t.add_row()
        fila_no_partir(fila)
        a, b = fila.cells
        a.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        b.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        sombrear(a._tc, ROJO if principal else NAVY)
        parrafo(a, str(n), 11, True, "FFFFFF", WD_ALIGN_PARAGRAPH.CENTER, despues=0, interlineado=1.0)
        if principal:
            sombrear(b._tc, ROSA)
        borde_celda(b, "bottom", DATO_LINEA, 4)
        p = parrafo(b, alin=WD_ALIGN_PARAGRAPH.JUSTIFY, despues=0, interlineado=1.05)
        if principal:
            fmt(p.add_run("PROBLEMA PRINCIPAL: "), 11, True, ROJO)
        texto_rico(p, expandir(m.group(3)), color=ROJO if principal else "222B38",
                   negrita=principal)
    anchos(t, [8, ancho - 8])
    espacio(cont)
    return t


def recuadro(cont, lineas, ancho, borde=None):
    """Texto en recuadro gris claro con filete lateral (análisis etiológico, recomendaciones)."""
    t = cont.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    bordes_tabla(t)
    margenes_celda(t, 1.4, 2.5)
    c = t.rows[0].cells[0]
    sombrear(c._tc, "F4F7FB")
    borde_celda(c, "left", borde or DORADO, 24)
    for i, ln in enumerate(lineas):
        parrafo(c, expandir(ln), 11, False, "222B38", WD_ALIGN_PARAGRAPH.JUSTIFY,
                despues=3 if i < len(lineas) - 1 else 0, interlineado=1.05)
    anchos(t, [ancho])
    espacio(cont)
    return t


def firma(cont, ancho):
    """Firma centrada en un bloque que no se parte entre páginas."""
    t = cont.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    bordes_tabla(t)
    fila_no_partir(t.rows[0])
    c = t.rows[0].cells[0]
    parrafo(c, "______________________________", 11, False, NAVY, WD_ALIGN_PARAGRAPH.CENTER, antes=12, despues=0)
    parrafo(c, MEDICO, 11, True, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=0, interlineado=1.0)
    parrafo(c, TITULO_FIRMA, 10, False, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=0, interlineado=1.0)
    parrafo(c, CODIGO, 10, False, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=0, interlineado=1.0)
    anchos(t, [ancho])


ROTULOS_ESTUDIO = r"(Indicaci[oó]n cl[ií]nica:|Indicaci[oó]n:|Antecedentes?:|Motivo de estudio:|Motivo:|T[eé]cnica:|Estudio:|Comparaci[oó]n:)"


def unidades(datos, secciones, hallazgos):
    """Lista ordenada de bloques del informe."""
    U = []
    for i, t in enumerate(secciones.get("ESTUDIO", [datos.get("estudio", datos["modalidad"])])):
        U.append(("estudio", re.sub(ROTULOS_ESTUDIO, r"**\1**", expandir(t)), i == 0))
    U.append(("barra", "HALLAZGOS"))
    # Estudio positivo: los hallazgos patológicos (# ... !) van PRIMERO y en rojo;
    # el resto sigue en orden anatómico. Estudio negativo: orden anatómico normal.
    ordenados = [h for h in hallazgos if h[1]] + [h for h in hallazgos if not h[1]]
    if ordenados:
        U.append(("hallazgos", ordenados))
    if secciones.get("MEDICIONES"):
        U.append(("barra", "CUADRO DE MEDICIONES"))
        U.append(("mediciones", filas_mediciones_bc(secciones["MEDICIONES"])))
    if secciones.get("IMAGENES"):
        U.append(("barra", "IMÁGENES DE LOS HALLAZGOS RELEVANTES"))
        U.append(("imagenes", secciones["IMAGENES"]))
    if datos.get("atlas"):
        U.append(("barra", "ESQUEMA ANATÓMICO DEL PROBLEMA PRINCIPAL"))
        U.append(("atlas", datos["atlas"]))
    if secciones.get("CONCLUSIONES"):
        U.append(("barra", "CONCLUSIONES Y CAUSA PROBABLE" if secciones.get("ETIOLOGIA") else "CONCLUSIONES"))
        U.append(("conclusiones", secciones["CONCLUSIONES"], secciones.get("ETIOLOGIA")))
    if secciones.get("ETIOLOGIA"):
        pass  # la etiología va como tarjeta dorada dentro del bloque de conclusiones
    if secciones.get("RECOMENDACIONES"):
        U.append(("barra", "RECOMENDACIONES"))
        U.append(("recuadro", secciones["RECOMENDACIONES"], AZUL))
    U.append(("firma",))
    return U


def pintar(cont, U, ancho, base):
    for u in U:
        tipo = u[0]
        if tipo == "barra":
            barra(cont, u[1])
        elif tipo == "texto":
            cuerpo(cont, u[1])
        elif tipo == "estudio":
            # estudio e indicación en recuadro azul claro, sin barra (ahorra espacio)
            p = parrafo(cont, alin=WD_ALIGN_PARAGRAPH.JUSTIFY, antes=3 if u[2] else 0, despues=2, interlineado=1.0)
            sombrear(p._p, DATO_FONDO)
            borde_parrafo(p, "left", NAVY, 24, 4)
            if u[2]:
                fmt(p.add_run("ESTUDIO / INDICACIÓN CLÍNICA:  "), 10, True, NAVY)
            texto_rico(p, u[1], 11, False, "222B38")
        elif tipo == "hallazgos":
            hallazgos_bc(cont, u[1], ancho)
        elif tipo == "mediciones":
            tabla_mediciones_2col(cont, u[1], ancho)
        elif tipo == "imagenes":
            tabla_imagenes(cont, u[1], base, ancho)
        elif tipo == "conclusiones":
            conclusiones(cont, u[1], ancho, u[2] if len(u) > 2 else None)
        elif tipo == "recuadro":
            recuadro(cont, u[1], ancho, u[2])
        elif tipo == "atlas":
            ruta = os.path.join(ASSETS, "atlas", u[1].strip() + ".png")
            if not os.path.exists(ruta):
                disp = sorted(f[:-4] for f in os.listdir(os.path.join(ASSETS, "atlas")))
                raise SystemExit(f"@atlas desconocido: {u[1]}. Disponibles: {', '.join(disp)}")
            p = imagen(cont, ruta, min(ancho, 85), despues=4)
            p.paragraph_format.keep_together = True
        elif tipo == "etio_firma":
            etiologia_y_firma(cont, u[1], ancho)
        elif tipo == "firma":
            if not any(x[0] == "etio_firma" for x in U) and not FIRMA_HECHA:
                firma_compacta(cont, ancho)




# ============================== DISEÑO B + C (compacto) ==============================
def subtitulo(cont, texto, color):
    p = parrafo(cont, antes=4, despues=3, interlineado=1.0)
    fmt(p.add_run(texto), 9.5, True, color)
    borde_parrafo(p, "bottom", color, 6, 1)
    p.paragraph_format.keep_with_next = True
    return p


def _parrafos_compactos(parrafos):
    """Agrupa: '>> título' + líneas '- Apartado: texto' en un solo párrafo corrido."""
    bloques, actual = [], None
    for tx in parrafos:
        if tx.startswith("[[") or tx.startswith("+ "):
            continue  # las lesiones individuales van en el cuadro de mediciones
        if tx.startswith(">>"):
            actual = [tx[2:].strip(), []]
            bloques.append(("lesion", actual))
            continue
        m = FICHA_FILA.match(tx)
        if m:
            if actual is None:
                actual = ["", []]
                bloques.append(("lesion", actual))
            actual[1].append((m.group(1).strip(), m.group(2).strip()))
            continue
        actual = None
        bloques.append(("texto", tx))
    return bloques


def hallazgo_relevante(cont, titulo, parrafos, ancho):
    """Recuadro del hallazgo con el dibujo anatómico flotando a la izquierda del texto."""
    t = cont.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    bordes_tabla(t)
    margenes_celda(t, 0.7, 2.0)
    c = t.rows[0].cells[0]
    sombrear(c._tc, "FFF6F6")
    borde_celda(c, "left", ROJO, 24)
    p = parrafo(c, alin=WD_ALIGN_PARAGRAPH.JUSTIFY, despues=0, interlineado=1.0)
    fmt(p.add_run(titulo + ". "), 11, True, ROJO)
    try:
        ilu = ilustracion_para(titulo)
        dibujo_flotante(p, ilu if ilu and os.path.exists(ilu) else icono_para(titulo), 13 if ilu else 8)
    except Exception:
        pass
    for tipo, val in _parrafos_compactos(parrafos):
        if tipo == "texto":
            texto_rico(p, val + " ", 11, False, "222B38")
        else:
            nombre, filas = val
            fmt(p.add_run(" "), 11)
            if nombre:
                fmt(p.add_run(nombre.upper() + ": "), 11, True, ROJO)
            for i, (et, tx) in enumerate(filas):
                imp = _norm(et).startswith(("impresion", "clasificacion"))
                fmt(p.add_run(("  " if i else "") + et + ": "), 11, True, NAVY)
                tx = tx if tx.endswith(".") else tx + "."
                texto_rico(p, tx, 11, imp, ROJO if imp else "222B38")
    anchos(t, [ancho])
    parrafo(cont, despues=0, tam=2).paragraph_format.line_spacing = Pt(4)


def hallazgos_bc(cont, items, ancho):
    rel = [h for h in items if h[1]]
    resto = [h for h in items if not h[1]]
    if rel:
        if len(rel) > 1 and RESUMEN_ARRIBA:
            resumen_visual(cont, rel, ancho)
        for titulo, _, parrafos, _m in rel:
            hallazgo_relevante(cont, titulo, parrafos, ancho)
    if resto:
        pass  # la tabla por regiones (franja azul) distingue el resto del estudio de los recuadros rojos
        # órganos sin patología: una fila por región anatómica, con su dibujo a la izquierda
        grupos = []
        for titulo, _, parrafos, _m in resto:
            reg = region_de(titulo)
            if not grupos or grupos[-1][0] != reg:
                grupos.append((reg, []))
            grupos[-1][1].append((titulo, " ".join(t for t in parrafos if not t.startswith(("[[", "+ ")))))
        t = cont.add_table(rows=0, cols=1)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        bordes_tabla(t)
        margenes_celda(t, 0.6, 2.0)
        for reg, organos in grupos:
            fila = t.add_row()
            c = fila.cells[0]
            borde_celda(c, "left", AZUL, 18)
            borde_celda(c, "bottom", DATO_LINEA, 4)
            p = parrafo(c, alin=WD_ALIGN_PARAGRAPH.JUSTIFY, despues=0, interlineado=1.0)
            if reg in NOMBRE_REGION:
                fmt(p.add_run(NOMBRE_REGION[reg] + "  "), 8, True, AZUL)
            for k, (titulo, texto) in enumerate(organos):
                if k:
                    fmt(p.add_run(" "), 11)
                fmt(p.add_run(titulo[:1] + titulo[1:].lower() + ": "), 11, True, NAVY)
                texto_rico(p, resaltar(texto), 11, False, TEXTO_NORMAL)
            try:  # dibujo de la región flotando a la izquierda, el texto lo rodea
                ilu = ilustracion_para(DIBUJO_REGION.get(reg, organos[0][0]))
                dibujo_flotante(p, ilu if ilu and os.path.exists(ilu) else icono_para(organos[0][0]),
                                11 if ilu else 6.5)
            except Exception:
                pass
        anchos(t, [ancho])
        espacio(cont)


DIBUJO_REGION = {"abdomen superior": "higado", "urinario": "rinon derecho", "peritoneo y pared": "peritoneo",
                 "pelvis": "utero", "tiroides": "tiroides"}


def filas_mediciones_bc(lineas):
    out = []
    for ln in lineas:
        if ln.startswith("=="):
            out.append(("grupo", ln.strip("= ").upper()))
        else:
            out.extend(("fila",) + f for f in filas_mediciones([ln]))
    return out


def tabla_mediciones_bc(cont, filas, ancho):
    t = cont.add_table(rows=1, cols=5)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    bordes_tabla(t)
    margenes_celda(t, 0.3, 1.4)
    prop = [0.29, 0.13, 0.21, 0.10, 0.27]
    for i, (c, txt) in enumerate(zip(t.rows[0].cells, ("Estructura / lesión", "Parámetro", "Medida", "Vol. (cm³)",
                                                       "Interpretación"))):
        sombrear(c._tc, NAVY)
        c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        parrafo(c, txt, 9.5, True, "FFFFFF", WD_ALIGN_PARAGRAPH.CENTER if i in (2, 3) else None, despues=0,
                interlineado=1.0)
    fila_no_partir(t.rows[0], encabezado=True)
    n = 0
    nuevo_grupo = False
    for f in filas:
        if f[0] == "grupo":
            # el grupo (órgano) se marca con una línea azul gruesa, sin gastar una fila
            nuevo_grupo = n > 0 or len(t.rows) > 1
            n = 0
            continue
        fila = t.add_row()
        fila_no_partir(fila)
        if nuevo_grupo:
            for c in fila.cells:
                borde_celda(c, "top", AZUL, 12)
            nuevo_grupo = False
        _, est, par, med, vol, interp, rel = f
        fondo = ROSA if rel else ("F4F7FB" if n % 2 else "FFFFFF")
        n += 1
        vol = vol.replace(" cm³", "").strip() if vol else "—"
        for i, (c, txt) in enumerate(zip(fila.cells, (est, par or "—", med, vol or "—", interp or "—"))):
            c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            sombrear(c._tc, fondo)
            borde_celda(c, "bottom", DATO_LINEA, 4)
            if i in (2, 3):
                txt = txt.replace(" ", " ")
            parrafo(c, txt, 9.5, rel or i in (0, 3), ROJO if rel else (NAVY if i == 0 else "222B38"),
                    WD_ALIGN_PARAGRAPH.CENTER if i in (2, 3) else None, despues=0, interlineado=1.0)
    anchos(t, [ancho * x for x in prop])
    espacio(cont)


def etiologia_y_firma(cont, lineas, ancho):
    """Análisis etiológico (izquierda) y firma (derecha) en el mismo bloque, para ahorrar espacio."""
    t = cont.add_table(rows=1, cols=2)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    bordes_tabla(t)
    margenes_celda(t, 1.0, 2.2)
    fila_no_partir(t.rows[0])
    a, b = t.rows[0].cells
    sombrear(a._tc, "F4F7FB")
    borde_celda(a, "left", DORADO, 24)
    a.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
    b.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.BOTTOM
    for i, ln in enumerate(lineas):
        p = parrafo(a, alin=WD_ALIGN_PARAGRAPH.JUSTIFY, despues=3 if i < len(lineas) - 1 else 0, interlineado=1.0)
        texto_rico(p, expandir(ln), 11, False, "222B38")
    pf = parrafo(b, MEDICO, 10, True, NAVY, WD_ALIGN_PARAGRAPH.CENTER, antes=6, despues=0, interlineado=1.0)
    borde_parrafo(pf, "top", NAVY, 6, 2)  # línea de firma
    parrafo(b, "Especialista en Radiología e Imágenes", 8, False, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=0,
            interlineado=1.0)
    parrafo(b, CODIGO, 8, False, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=0, interlineado=1.0)
    anchos(t, [ancho * 0.72, ancho * 0.28])


# ============================== PLANTILLA 2 HOJAS ==============================
def _mitad(filas):
    """Punto de corte cerca de la mitad, preferiblemente al inicio de un grupo (órgano)."""
    datos = [i for i, f in enumerate(filas) if f[0] == "fila"]
    if len(datos) < 8:
        return len(filas)
    medio = datos[(len(datos) + 1) // 2]
    grupos = [i for i, f in enumerate(filas) if f[0] == "grupo" and i > 0]
    if grupos:
        mejor = min(grupos, key=lambda g: abs(g - medio))
        if abs(mejor - medio) <= 1:
            return mejor
    return medio


def _medio_cuadro(celda, filas, ancho):
    t = celda.add_table(rows=1, cols=4)
    previo = t._tbl.getprevious()  # párrafo vacío inicial de la celda: se quita (la celda termina en párrafo)
    if previo is not None and previo.tag == qn("w:p") and not len(previo.findall(qn("w:r"))):
        previo.getparent().remove(previo)
    bordes_tabla(t)
    margenes_celda(t, 0.15, 1.0)
    for i, (c, txt) in enumerate(zip(t.rows[0].cells, ("Estructura / lesión", "Medida (mm)", "Vol.", "Interpret."))):
        sombrear(c._tc, NAVY)
        borde_celda(c, "bottom", DORADO, 8)
        parrafo(c, txt, 8.5, True, "FFFFFF", WD_ALIGN_PARAGRAPH.CENTER if i in (1, 2) else None, despues=0,
                interlineado=1.0)
    fila_no_partir(t.rows[0], encabezado=True)
    n, nuevo = 0, False
    for f in filas:
        if f[0] == "grupo":
            nuevo = len(t.rows) > 1
            n = 0
            continue
        _, est, par, med, vol, interp, rel = f
        fila = t.add_row()
        fila_no_partir(fila)
        fondo = ROSA if rel else ("F4F7FB" if n % 2 else "FFFFFF")
        n += 1
        vol = vol.replace(" cm³", "").strip() if vol else "—"
        med = med.replace(" mm", "")
        for i, (c, txt) in enumerate(zip(fila.cells, (est, med, vol or "—", interp or "—"))):
            c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            sombrear(c._tc, fondo)
            borde_celda(c, "bottom", DATO_LINEA, 4)
            if nuevo:
                borde_celda(c, "top", AZUL, 12)
            if i in (1, 2):
                txt = txt.replace(" ", " ")
            parrafo(c, txt, 8.5, rel or i in (0, 2), ROJO if rel else (NAVY if i == 0 else "222B38"),
                    WD_ALIGN_PARAGRAPH.CENTER if i in (1, 2) else None, despues=0, interlineado=1.0)
        nuevo = False
    anchos(t, [ancho * x for x in (0.40, 0.24, 0.13, 0.23)])


def tabla_mediciones_2col(cont, filas, ancho):
    """Cuadro de mediciones dividido en dos mitades lado a lado (medidas en mm)."""
    k = _mitad(filas)
    if k >= len(filas):
        return tabla_mediciones_bc(cont, filas, ancho)
    t = cont.add_table(rows=1, cols=2)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    bordes_tabla(t)
    margenes_celda(t, 0, 0.8)
    a, b = t.rows[0].cells
    a.vertical_alignment = b.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
    w = ancho / 2
    _medio_cuadro(a, filas[:k], w - 2)
    _medio_cuadro(b, filas[k:], w - 2)
    for c in (a, b):
        p = c.paragraphs[-1]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = Pt(2)
    anchos(t, [w, w])
    parrafo(cont, despues=0, tam=2).paragraph_format.line_spacing = Pt(4)


REGIONES = [
    ("abdomen superior", "higado|hepatic|portal|vesicula biliar|biliar|coledoco|pancrea|bazo|esplen|suprarrenal|adrenal"),
    ("urinario", "rinon|renal|ureter|retroperitone|aorta|cava|vejiga|residuo|perirrenal"),
    ("peritoneo y pared", "peritone|liquido libre|asas|intestin|pared|extraperitone|apendic|ciego"),
    ("pelvis", "utero|endometr|cervix|ovario|anex|douglas|fondo de saco|prostat|seminal|testic|escrot"),
    ("tiroides", "tiroid|istmo|paratiroid"),
    ("cuello", "parotid|submandibular|ganglion|cervical|carotid|yugular"),
]


def region_de(titulo):
    t = _norm(titulo)
    for nombre, claves in REGIONES:
        if any(k in t for k in claves.split("|")):
            return nombre
    return t  # sin región conocida: párrafo propio


def dibujo_flotante(p, ruta, alto_mm, lado="left"):
    """Inserta un dibujo anclado al párrafo con el texto alrededor (no ocupa una columna propia)."""
    from docx.oxml import parse_xml
    run = p.add_run()
    run.add_picture(ruta, height=Mm(alto_mm))
    inline = run._r.find(".//" + qn("wp:inline"))
    cx, cy = inline.find(qn("wp:extent")).get("cx"), inline.find(qn("wp:extent")).get("cy")
    graphic = inline.find(qn("a:graphic"))
    docpr = inline.find(qn("wp:docPr"))
    sep = str(int(Mm(1.5)))
    anchor = parse_xml(
        '<wp:anchor xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        f'distT="0" distB="0" distL="{sep}" distR="{sep}" simplePos="0" relativeHeight="2" behindDoc="0" '
        'locked="0" layoutInCell="1" allowOverlap="0">'
        '<wp:simplePos x="0" y="0"/>'
        f'<wp:positionH relativeFrom="column"><wp:align>{lado}</wp:align></wp:positionH>'
        '<wp:positionV relativeFrom="paragraph"><wp:posOffset>0</wp:posOffset></wp:positionV>'
        f'<wp:extent cx="{cx}" cy="{cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
        '<wp:wrapSquare wrapText="bothSides"/>'
        f'<wp:docPr id="{docpr.get("id")}" name="{docpr.get("name")}"/>'
        '<wp:cNvGraphicFramePr/></wp:anchor>')
    anchor.append(graphic)
    inline.getparent().replace(inline, anchor)
    # mover el run del dibujo al inicio del párrafo
    p._p.remove(run._r)
    ppr = p._p.find(qn("w:pPr"))
    (ppr.addnext if ppr is not None else lambda e: p._p.insert(0, e))(run._r)
    return run


# ============================== LECTURA FÁCIL (renglones fijos, medidas en negrita, etiquetas) ==============================
TEXTO_NORMAL = "3A4250"  # gris oscuro: lo normal se lee, lo patológico resalta
NOMBRE_REGION = {"abdomen superior": "ABDOMEN SUPERIOR", "urinario": "VÍA URINARIA Y RETROPERITONEO",
                 "peritoneo y pared": "PERITONEO Y PARED", "pelvis": "PELVIS", "tiroides": "TIROIDES",
                 "cuello": "CUELLO"}
_MEDIDA = re.compile(r"(\d+(?:[.,]\d+)?(?:\s*[×x]\s*\d+(?:[.,]\d+)?)*\s*(?:mm|cm³|cm|%)"
                     r"|FIGO\s*\d|grado\s*[1-4I]+\b|TI-RADS\s*\d|BI-RADS\s*\d|O-RADS\s*\d|Bosniak\s*[IV]+F?)")


def resaltar(texto):
    """Pone en negrita las medidas y clasificaciones (fuera de ** ** y !! !! existentes)."""
    partes = re.split(r"(\*\*.+?\*\*|!!.+?!!)", texto)
    return "".join(p if p.startswith(("**", "!!")) else _MEDIDA.sub(r"**\1**", p) for p in partes)


def etiqueta(p, texto, fondo):
    """Etiqueta tipo 'pastilla' (texto blanco sobre color) dentro del renglón."""
    r = p.add_run(" " + texto.upper() + " ")
    fmt(r, 8, True, "FFFFFF")
    rpr = r._r.get_or_add_rPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto"); shd.set(qn("w:fill"), fondo)
    rpr.append(shd)


def _color_estado(est):
    e = _norm(est)
    if "no complicad" in e or "no obstruct" in e or "benign" in e or "leve" in e:
        return "5B7A99"
    return ROJO


def hallazgo_relevante(cont, titulo, parrafos, ancho):
    """Renglones fijos: órgano · ▸ lesión con sus datos · ■ impresión en rojo."""
    t = cont.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    bordes_tabla(t)
    margenes_celda(t, 0.8, 2.0)
    c = t.rows[0].cells[0]
    sombrear(c._tc, "FFF6F6")
    borde_celda(c, "left", ROJO, 24)
    bloques = _parrafos_compactos(parrafos)
    estados = [tx for tipo, val in bloques if tipo == "lesion" for et, tx in val[1] if _norm(et).startswith("estado")]
    # renglón 1: órgano y su descripción general
    p = parrafo(c, alin=WD_ALIGN_PARAGRAPH.JUSTIFY, despues=1, interlineado=1.0)
    fmt(p.add_run(titulo + ".  "), 11, True, ROJO)
    for est in dict.fromkeys(estados):
        etiqueta(p, est, _color_estado(est)); fmt(p.add_run(" "), 9)
    fmt(p.add_run(" "), 11)
    try:
        ilu = ilustracion_para(titulo)
        dibujo_flotante(p, ilu if ilu and os.path.exists(ilu) else icono_para(titulo), 13 if ilu else 8)
    except Exception:
        pass
    for tipo, val in bloques:
        if tipo == "texto":
            texto_rico(p, resaltar(val) + " ", 11, False, "222B38")
    # renglones de cada lesión
    for tipo, val in bloques:
        if tipo != "lesion":
            continue
        nombre, filas = val
        datos = [(et, tx) for et, tx in filas if not _norm(et).startswith(("impresion", "estado"))]
        imp = [tx for et, tx in filas if _norm(et).startswith("impresion")]
        p = parrafo(c, alin=WD_ALIGN_PARAGRAPH.JUSTIFY, despues=1, interlineado=1.0)
        fmt(p.add_run("▸ "), 11, True, ROJO)
        if nombre:
            fmt(p.add_run(nombre[:1].upper() + nombre[1:] + ": "), 11, True, ROJO)
        for i, (et, tx) in enumerate(datos):
            tx = tx if tx.endswith(".") else tx + "."
            fmt(p.add_run(("  " if i else "") + et + ": "), 10, True, NAVY)
            texto_rico(p, resaltar(tx), 11, False, "222B38")
        if imp:
            q = parrafo(c, despues=1, interlineado=1.0)
            fmt(q.add_run("■ Impresión: "), 11, True, ROJO)
            texto_rico(q, imp[0], 11, True, ROJO)
    anchos(t, [ancho])
    espacio(cont)


# ============================== VERSIÓN VISUAL (tarjetas y resumen) ==============================
def etiqueta2(p, texto, fondo, color="FFFFFF", tam=7.5):
    r = p.add_run(" " + texto.upper() + " ")
    fmt(r, tam, True, color)
    rpr = r._r.get_or_add_rPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto"); shd.set(qn("w:fill"), fondo)
    rpr.append(shd)


def _datos_relevante(titulo, parrafos):
    bloques = _parrafos_compactos(parrafos)
    lesiones = [val[0] for tipo, val in bloques if tipo == "lesion" and val[0]]
    estados = [tx for tipo, val in bloques if tipo == "lesion" for et, tx in val[1] if _norm(et).startswith("estado")]
    return bloques, lesiones, list(dict.fromkeys(estados))


def resumen_visual(cont, rel, ancho):
    """Tarjetas pequeñas con lo más importante: dibujo, órgano, diagnóstico y estado."""
    n = min(len(rel), 4)
    filas = [rel[i:i + n] for i in range(0, len(rel), n)]
    espacio(cont, 3)
    for grupo in filas:
        t = cont.add_table(rows=1, cols=n)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        bordes_tabla(t)
        margenes_celda(t, 0.8, 1.2)
        fila_no_partir(t.rows[0])
        for k, c in enumerate(t.rows[0].cells):
            if k >= len(grupo):
                continue
            titulo, _, parrafos, _m = grupo[k]
            _, lesiones, estados = _datos_relevante(titulo, parrafos)
            sombrear(c._tc, "FFF6F6")
            borde_celda(c, "top", ROJO, 24)
            borde_celda(c, "left", "FFFFFF", 24)
            borde_celda(c, "right", "FFFFFF", 24)
            c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            q = parrafo(c, alin=WD_ALIGN_PARAGRAPH.LEFT, despues=0, interlineado=1.0)
            try:
                ilu = ilustracion_para(titulo)
                dibujo_flotante(q, ilu if ilu and os.path.exists(ilu) else icono_para(titulo), 8.5 if ilu else 6)
            except Exception:
                pass
            fmt(q.add_run(titulo), 8.5, True, ROJO)
            q2 = parrafo(c, despues=0, interlineado=1.0)
            fmt(q2.add_run(" + ".join(l[:1].upper() + l[1:] for l in lesiones)), 8.5, True, "222B38")
            if estados:
                q3 = parrafo(c, despues=0, interlineado=1.0, antes=1)
                for est in estados:
                    etiqueta2(q3, est, _color_estado(est), tam=6.5); fmt(q3.add_run(" "), 6)
        anchos(t, [ancho / n] * n)
    espacio(cont, 4)


def hallazgo_relevante(cont, titulo, parrafos, ancho):
    """Tarjeta: nombre del órgano como rótulo rojo, estado en etiquetas, dibujo, lesiones e impresión resaltada."""
    bloques, lesiones, estados = _datos_relevante(titulo, parrafos)
    t = cont.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    bordes_tabla(t)
    margenes_celda(t, 0.7, 2.0)
    c = t.rows[0].cells[0]
    sombrear(c._tc, "FFFBFB")
    borde_celda(c, "left", ROJO, 24); borde_celda(c, "top", "F2C9CF", 4)
    borde_celda(c, "right", "F2C9CF", 4); borde_celda(c, "bottom", "F2C9CF", 4)
    p = parrafo(c, alin=WD_ALIGN_PARAGRAPH.JUSTIFY, despues=1, interlineado=1.0)
    etiqueta2(p, titulo, ROJO, tam=10)
    fmt(p.add_run(" "), 9)
    for est in estados:
        etiqueta2(p, est, _color_estado(est), tam=7.5); fmt(p.add_run(" "), 8)
    fmt(p.add_run("  "), 11)
    try:
        ilu = ilustracion_para(titulo)
        dibujo_flotante(p, ilu if ilu and os.path.exists(ilu) else icono_para(titulo), 12 if ilu else 8)
    except Exception:
        pass
    for tipo, val in bloques:
        if tipo == "texto":
            texto_rico(p, resaltar(val) + " ", 11, False, "222B38")
    imps = []
    for tipo, val in bloques:
        if tipo != "lesion":
            continue
        nombre, filas = val
        datos = [(et, tx) for et, tx in filas if not _norm(et).startswith(("impresion", "estado"))]
        imps += [tx for et, tx in filas if _norm(et).startswith("impresion")]
        p = parrafo(c, alin=WD_ALIGN_PARAGRAPH.JUSTIFY, despues=1, interlineado=1.0)
        fmt(p.add_run("▸ "), 11, True, ROJO)
        if nombre:
            fmt(p.add_run(nombre[:1].upper() + nombre[1:] + ": "), 11, True, ROJO)
        for i, (et, tx) in enumerate(datos):
            tx = tx if tx.endswith(".") else tx + "."
            fmt(p.add_run(("  " if i else "") + et + ": "), 10, True, NAVY)
            texto_rico(p, resaltar(tx), 11, False, "222B38")
    for imp in (imps if IMPRESION_EN_TARJETA else []):
        q = parrafo(c, despues=0, interlineado=1.0, antes=1)
        sombrear(q._p, "FBE4E6")
        fmt(q.add_run(" ■ IMPRESIÓN:  "), 9.5, True, ROJO)
        texto_rico(q, imp, 11, True, ROJO)
    anchos(t, [ancho])
    espacio(cont, 3)


CONC_DIBUJO = [("coleli|colecist|vesicul|biliar|coledoc", "vesicula biliar"), ("miom|uter|endometr|adenomios", "utero"),
               ("nefrolit|renal|rinon|riñon|hidronef|pielocal|calicial|ureter", "rinon izquierdo"), ("esteatos|hepat|higad|hígad", "higado"),
               ("ovari|anex", "ovario"), ("prostat", "prostata"), ("tiroid", "tiroides"), ("pancrea", "pancreas"),
               ("bazo|esplen", "bazo"), ("vejig|vesical", "vejiga"), ("mama", "mama"), ("testic|escrot", "testiculo")]


def _dibujo_conclusion(texto):
    t = _norm(texto)
    for claves, organo in CONC_DIBUJO:
        if any(k in t for k in claves.split("|")):
            if organo == "rinon izquierdo" and "derech" in t:
                organo = "rinon derecho"
            ilu = ilustracion_para(organo)
            return ilu if ilu and os.path.exists(ilu) else icono_para(organo)
    return None


def conclusiones(cont, lineas, ancho, etiologia=None):
    """Conclusiones como tarjetas numeradas en dos columnas, con el dibujo del órgano.
    La 1 (PROBLEMA PRINCIPAL) ocupa todo el ancho y va en rojo."""
    items = []
    n = 0
    for ln in lineas:
        m = re.match(r"^(\d+)?[.)]?\s*(PROBLEMA PRINCIPAL:)?\s*(.*)$", ln)
        n = int(m.group(1)) if m.group(1) else n + 1
        items.append((n, bool(m.group(2)), expandir(m.group(3))))
    principales = [x for x in items if x[1]]
    resto = [x for x in items if not x[1]]

    def tarjeta(c, num, principal, texto):
        """Título del diagnóstico en negrita y, en el renglón siguiente, su sustento y significado clínico
        (en el dictado se separan con '||')."""
        c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        sombrear(c._tc, ROSA if principal else "F4F7FB")
        borde_celda(c, "left", ROJO if principal else NAVY, 24)
        titulo, _, detalle = (x.strip() for x in texto.partition("||"))
        p = parrafo(c, alin=WD_ALIGN_PARAGRAPH.LEFT, despues=0, interlineado=1.0)
        dib = _dibujo_conclusion(titulo + " " + detalle)
        if dib:
            try:
                dibujo_flotante(p, dib, 10)
            except Exception:
                pass
        etiqueta2(p, str(num), ROJO if principal else NAVY, tam=10)
        fmt(p.add_run("  "), 10)
        if principal:
            fmt(p.add_run("PROBLEMA PRINCIPAL: "), 11, True, ROJO)
        texto_rico(p, titulo, 11, True, ROJO if principal else NAVY)
        if detalle:
            q = parrafo(c, alin=WD_ALIGN_PARAGRAPH.JUSTIFY, despues=0, interlineado=1.0)
            texto_rico(q, resaltar(detalle), 10.5, False, "222B38")

    for num, principal, texto in principales:
        t = cont.add_table(rows=1, cols=1)
        bordes_tabla(t); margenes_celda(t, 0.4, 1.8); fila_no_partir(t.rows[0])
        tarjeta(t.rows[0].cells[0], num, principal, texto)
        anchos(t, [ancho])
        espacio(cont, 1.5)
    def tarjeta_etio(c):
        c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        sombrear(c._tc, "FBF6E6")
        borde_celda(c, "left", DORADO, 24)
        p = parrafo(c, alin=WD_ALIGN_PARAGRAPH.LEFT, despues=0, interlineado=1.0)
        fmt(p.add_run("ANÁLISIS ETIOLÓGICO / CAUSA PROBABLE: "), 8.5, True, "8A6D0B")
        texto_rico(p, expandir(" ".join(etiologia)), 10.5, False, "222B38")

    etio_pendiente = bool(etiologia)
    for num, principal, texto in resto:
        t = cont.add_table(rows=1, cols=1)
        bordes_tabla(t); margenes_celda(t, 0.4, 1.8); fila_no_partir(t.rows[0])
        tarjeta(t.rows[0].cells[0], num, principal, texto)
        anchos(t, [ancho])
        espacio(cont, 1.5)
    if etio_pendiente:
        # causa probable (tarjeta dorada) y firma en la misma fila
        global FIRMA_HECHA
        t = cont.add_table(rows=1, cols=2)
        bordes_tabla(t); margenes_celda(t, 0.4, 1.8); fila_no_partir(t.rows[0])
        a, b = t.rows[0].cells
        tarjeta_etio(a)
        b.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.BOTTOM
        pf = parrafo(b, MEDICO, 10, True, NAVY, WD_ALIGN_PARAGRAPH.CENTER, antes=2, despues=0, interlineado=1.0)
        borde_parrafo(pf, "top", NAVY, 6, 2)
        parrafo(b, TITULO_FIRMA, 7.5, False, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=0, interlineado=1.0)
        parrafo(b, CODIGO, 7.5, False, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=0, interlineado=1.0)
        anchos(t, [ancho * 0.64, ancho * 0.36])
        FIRMA_HECHA = True

RESUMEN_ARRIBA = False  # tarjetas de resumen arriba (ocupa ~2 cm); las conclusiones ya van en tarjetas


def firma_compacta(cont, ancho):
    t = cont.add_table(rows=1, cols=2)
    bordes_tabla(t); fila_no_partir(t.rows[0])
    b = t.rows[0].cells[1]
    pf = parrafo(b, MEDICO, 10.5, True, NAVY, WD_ALIGN_PARAGRAPH.CENTER, antes=1, despues=0, interlineado=1.0)
    borde_parrafo(pf, "top", NAVY, 6, 2)
    parrafo(b, "Médico Especialista en Radiología e Imágenes · " + CODIGO, 8.5, False, NAVY,
            WD_ALIGN_PARAGRAPH.CENTER, despues=0, interlineado=1.0)
    anchos(t, [ancho * 0.42, ancho * 0.58])

IMPRESION_EN_TARJETA = False  # la impresión integrada va en las conclusiones (evita repetirla)

FIRMA_HECHA = False
