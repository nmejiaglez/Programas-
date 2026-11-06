"""Ajustes de página para la plantilla de 2 hojas (encabezados y pies más bajos)."""
import sys
p = sys.argv[1]; s = open(p, encoding="utf-8").read()
for o, n in [
    ('M_SUP, M_INF = Mm(11), Mm(35)', 'M_SUP, M_INF = Mm(10), Mm(21)'),
    ('    anchos(t, [24, UTIL - 48, 24])', '    anchos(t, [18, UTIL - 36, 18])'),
    ('imagen(a, os.path.join(ASSETS, "sello_nm.png"), 15, despues=0)', 'imagen(a, os.path.join(ASSETS, "sello_nm.png"), 10, despues=0)'),
    ('imagen(c, os.path.join(ASSETS, F["logo"]), 15, despues=0)', 'imagen(c, os.path.join(ASSETS, F["logo"]), 10, despues=0)'),
    ('F["pie_logos"][0]), 46, WD_ALIGN_PARAGRAPH.LEFT, 0)', 'F["pie_logos"][0]), 34, WD_ALIGN_PARAGRAPH.LEFT, 0)'),
    ('F["pie_logos"][1]), 24, WD_ALIGN_PARAGRAPH.RIGHT, 0)', 'F["pie_logos"][1]), 12, WD_ALIGN_PARAGRAPH.RIGHT, 0)'),
    ('imagen(a, os.path.join(ASSETS, "sello_nm.png"), 26, WD_ALIGN_PARAGRAPH.LEFT, 0)', 'imagen(a, os.path.join(ASSETS, "sello_nm.png"), 16, WD_ALIGN_PARAGRAPH.LEFT, 0)'),
    ('imagen(c, os.path.join(ASSETS, F["logo"]), 24, WD_ALIGN_PARAGRAPH.RIGHT, 0)', 'imagen(c, os.path.join(ASSETS, F["logo"]), 15, WD_ALIGN_PARAGRAPH.RIGHT, 0)'),
    ('s.header_distance, s.footer_distance = Mm(6), Mm(12)', 's.header_distance, s.footer_distance = Mm(6), Mm(9)'),
    # encabezado de continuación en 2 líneas
    ('''    parrafo(b, F["institucion"], 10, True, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=0)
    parrafo(b, f'{F["depto"]} · {F["lugar"]}', 8, False, AZUL, WD_ALIGN_PARAGRAPH.CENTER, despues=0)''',
     '''    parrafo(b, F["institucion"], 8.5, True, NAVY, WD_ALIGN_PARAGRAPH.CENTER, despues=0)'''),
    # bloque de datos del paciente sin párrafo extra grande
    ('''    anchos(d, [42, 54, 36, UTIL - 132])
    parrafo(doc, despues=0, tam=2, primer=False)''', '''    anchos(d, [42, 54, 36, UTIL - 132])
    parrafo(doc, despues=0, tam=2, primer=False).paragraph_format.line_spacing = Pt(3)'''),
]:
    if s.count(o) != 1:
        raise SystemExit(f"no encontrado: {o}")
    s = s.replace(o, n)
open(p, "w", encoding="utf-8").write(s)
print("compactado", p)
