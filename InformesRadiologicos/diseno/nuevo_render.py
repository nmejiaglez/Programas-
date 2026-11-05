def barra(cont, texto):
    """Encabezado de sección: barra azul con texto blanco y filete dorado inferior."""
    p = parrafo(cont, antes=8, despues=4, interlineado=1.0)
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
        fila_no_partir(fila)  # el órgano nunca queda separado de su descripción
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
        for i, texto in enumerate(parrafos):
            p = parrafo(b, texto, 11, False, ROJO if rel else "222B38", WD_ALIGN_PARAGRAPH.JUSTIFY,
                        despues=3 if i < len(parrafos) - 1 else 0, interlineado=1.05)
    anchos(t, [izq, ancho - izq])
    parrafo(cont, despues=2, tam=4)
    return t


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
    parrafo(cont, despues=2, tam=4)
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
    parrafo(cont, despues=2, tam=4)


def conclusiones(cont, lineas, ancho):
    """Conclusiones numeradas en tabla: número en círculo de color, texto a la derecha.
    El PROBLEMA PRINCIPAL va primero, con número rojo y fondo rosado."""
    t = cont.add_table(rows=0, cols=2)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    bordes_tabla(t)
    margenes_celda(t, 1.0, 1.6)
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
    parrafo(cont, despues=2, tam=4)
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
    parrafo(cont, despues=2, tam=4)
    return t


def firma(cont, ancho):
    """Firma centrada en un bloque que no se parte entre páginas."""
    t = cont.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    bordes_tabla(t)
    fila_no_partir(t.rows[0])
    c = t.rows[0].cells[0]
    parrafo(c, "______________________________", 11, False, NAVY, WD_ALIGN_PARAGRAPH.CENTER, antes=22, despues=0)
    parrafo(c, MEDICO, 11, True, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=0, interlineado=1.0)
    parrafo(c, TITULO_FIRMA, 10, False, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=0, interlineado=1.0)
    parrafo(c, CODIGO, 10, False, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=0, interlineado=1.0)
    anchos(t, [ancho])


ROTULOS_ESTUDIO = r"(Indicaci[oó]n cl[ií]nica:|Indicaci[oó]n:|Antecedentes?:|Motivo de estudio:|Motivo:|T[eé]cnica:|Estudio:|Comparaci[oó]n:)"


def unidades(datos, secciones, hallazgos):
    """Lista ordenada de bloques del informe."""
    U = [("barra", "ESTUDIO / INDICACIÓN CLÍNICA")]
    for t in secciones.get("ESTUDIO", [datos.get("estudio", datos["modalidad"])]):
        U.append(("texto", re.sub(ROTULOS_ESTUDIO, r"**\1**", expandir(t))))
    U.append(("barra", "HALLAZGOS"))
    # Estudio positivo: los hallazgos patológicos (# ... !) van PRIMERO y en rojo;
    # el resto sigue en orden anatómico. Estudio negativo: orden anatómico normal.
    ordenados = [h for h in hallazgos if h[1]] + [h for h in hallazgos if not h[1]]
    if ordenados:
        U.append(("hallazgos", ordenados))
    if secciones.get("MEDICIONES"):
        U.append(("barra", "CUADRO DE MEDICIONES"))
        U.append(("mediciones", filas_mediciones(secciones["MEDICIONES"])))
    if secciones.get("IMAGENES"):
        U.append(("barra", "IMÁGENES DE LOS HALLAZGOS RELEVANTES"))
        U.append(("imagenes", secciones["IMAGENES"]))
    if secciones.get("CONCLUSIONES"):
        U.append(("barra", "CONCLUSIONES"))
        U.append(("conclusiones", secciones["CONCLUSIONES"]))
    if secciones.get("ETIOLOGIA"):
        U.append(("barra", "ANÁLISIS ETIOLÓGICO / CAUSA PROBABLE"))
        U.append(("recuadro", secciones["ETIOLOGIA"], DORADO))
    if datos.get("atlas"):
        U.append(("barra", "ESQUEMA ANATÓMICO DEL PROBLEMA PRINCIPAL"))
        U.append(("atlas", datos["atlas"]))
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
        elif tipo == "hallazgos":
            tabla_hallazgos(cont, u[1], ancho)
        elif tipo == "mediciones":
            tabla_mediciones(cont, u[1], ancho)
        elif tipo == "imagenes":
            tabla_imagenes(cont, u[1], base, ancho)
        elif tipo == "conclusiones":
            conclusiones(cont, u[1], ancho)
        elif tipo == "recuadro":
            recuadro(cont, u[1], ancho, u[2])
        elif tipo == "atlas":
            ruta = os.path.join(ASSETS, "atlas", u[1].strip() + ".png")
            if not os.path.exists(ruta):
                disp = sorted(f[:-4] for f in os.listdir(os.path.join(ASSETS, "atlas")))
                raise SystemExit(f"@atlas desconocido: {u[1]}. Disponibles: {', '.join(disp)}")
            p = imagen(cont, ruta, min(ancho, 85), despues=4)
            p.paragraph_format.keep_together = True
        elif tipo == "firma":
            firma(cont, ancho)


