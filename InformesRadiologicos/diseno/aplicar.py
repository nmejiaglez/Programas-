"""Aplica el nuevo diseño de hallazgos/tablas a un ARCHIVO_UNICO (uso: aplicar.py entrada.py salida.py)."""
import sys

src, dst = sys.argv[1], sys.argv[2]
nuevo = open(sys.argv[3] if len(sys.argv) > 3 else __file__.replace("aplicar.py", "nuevo_render.py"),
             encoding="utf-8").read()
s = open(src, encoding="utf-8").read()


def reemplazar(viejo, nuevo_txt, cuenta=1):
    global s
    n = s.count(viejo)
    if n != cuenta:
        raise SystemExit(f"Se esperaban {cuenta} coincidencias y hay {n}: {viejo[:70]!r}")
    s = s.replace(viejo, nuevo_txt)


# 1) bloques del informe
ini = s.index("def barra(cont, texto):")
fin = s.index("# --------------------------------------------------------------------------\n# Página, columna lateral")
s = s[:ini] + nuevo + s[fin:]

# 2) leer: guardar las medidas {m:} / {v:} de cada órgano para la columna del órgano
reemplazar('hallazgos.append((t.rstrip("! ").upper(), rel, []))',
           'hallazgos.append((t.rstrip("! ").upper(), rel, [], []))')
reemplazar('hallazgos[-1][2].append(expandir(s))',
           'hallazgos[-1][3].extend(re.findall(r"\\{([mv]):([^}]+)\\}", s))\n'
           '            hallazgos[-1][2].append(expandir(s))')

# 3) construir: informe a ancho completo (sin dos columnas)
viejo_cols = s[s.index("    # el encabezado ocupa el ancho completo; el informe sigue a dos columnas"):
               s.index("    pintar(doc, U, COL, base)\n")]
reemplazar(viejo_cols + "    pintar(doc, U, COL, base)\n",
           "    # informe a ancho completo: hallazgos en tabla órgano | descripción\n"
           "    pintar(doc, U, UTIL, base)\n")

# 4) rojo institucional del hallazgo principal
reemplazar('ROJO = "C00000"', 'ROJO = "C00028"')

# 5) instrucciones
reemplazar("(el script pone plantilla a dos columnas, logos, iconos anatómicos, cuadro de datos, fecha/hora Managua, volúmenes y llena la página 1).",
           "(el script pone encabezado con logos, cuadro de datos del paciente, fecha/hora Managua, volúmenes y el diseño ordenado:\n"
           "   HALLAZGOS en tabla de dos columnas [órgano con ilustración y sus medidas | descripción], CUADRO DE MEDICIONES\n"
           "   a ancho completo con filas alternas, CONCLUSIONES numeradas y ANÁLISIS ETIOLÓGICO en recuadro).")
reemplazar("Texto. !!hallazgo en rojo!!  **negrita**  {m:12.7x16.2x16}=medidas  {v:12.7x16.2x16}=volumen cm³",
           "Texto. !!hallazgo en rojo!!  **negrita**  {m:12.7x16.2x16}=medidas  {v:12.7x16.2x16}=volumen cm³\n"
           "                             (las {m:} y {v:} de cada órgano salen también bajo su nombre, en la columna izquierda)")

open(dst, "w", encoding="utf-8").write(s)
print("OK", dst)
