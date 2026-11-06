"""Genera un ARCHIVO_UNICO con la PLANTILLA VISUAL DE 2 HOJAS a partir del original.

uso: python3 aplicar_final.py ORIGINAL.py SALIDA.py [diseno_visual.py]
Hace tres cosas: inserta las funciones de diseño (diseno_visual.py), compacta encabezado/pie
(compactar.py) y actualiza las instrucciones del dictado dentro del archivo.
"""
import os
import re
import subprocess
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
src, dst = sys.argv[1], sys.argv[2]
diseno = sys.argv[3] if len(sys.argv) > 3 else os.path.join(AQUI, "diseno_visual.py")

subprocess.run([sys.executable, os.path.join(AQUI, "aplicar.py"), src, dst, diseno], check=True)
subprocess.run([sys.executable, os.path.join(AQUI, "compactar.py"), dst], check=True)

s = open(dst, encoding="utf-8").read()
fmt = re.search(r"@formato (HOSPITAL|LABEX)\n@paciente", s).group(1)

viejo_ini = s.index("## Formato del .txt\n```")
viejo_fin = s.index("## Hallazgos positivos: PRIMERO y EN ROJO")
nuevo = f'''## Formato del .txt (PLANTILLA VISUAL DE 2 HOJAS)
```
@formato {fmt}
@paciente Nombre Apellidos
@edad 45 años   @sexo / @medico / @procedencia / @modalidad   (una por línea)
@archivo Nombre_Apellido_US_Abdominal
@protocolo general_femenino   (OBLIGATORIO; ver la sección PROTOCOLOS (más abajo))
@atlas litiasis_renal_derecho_superior   (opcional: esquema anatómico del PROBLEMA PRINCIPAL)
## ESTUDIO
Ultrasonido abdominal y pélvico. Indicación clínica: dolor en hipocondrio derecho.
# VESÍCULA BILIAR !          (# = órgano; ! = HALLAZGO RELEVANTE → tarjeta roja con dibujo, va primero)
Descripción general del órgano: forma, {{m:82x30x28}}, pared, etc.
>> Colelitiasis múltiple     (>> = lesión dentro del órgano; puede haber varias)
- Estado: No complicada      (etiqueta de color junto al órgano: No complicada / No obstructiva / Leve / Benignos
                              salen en gris azulado; cualquier otro estado, p. ej. Submucoso u Obstructiva, en ROJO)
- Hallazgo: 4 litos (fondo ×2, cuerpo y bacinete), el mayor de 12.4 mm; hiperecogénicos, sombra limpia, móviles
- Signos inflamatorios: Murphy ecográfico negativo, sin líquido perivesicular
- Impresión: Colelitiasis múltiple no complicada   (opcional; la impresión integrada va en CONCLUSIONES)
# HÍGADO                     (órgano sin patología: un solo párrafo; se agrupa solo por región con su dibujo)
De situación habitual, 152 mm en línea medioclavicular, contornos lisos...
## MEDICIONES                (sale en DOS MITADES lado a lado; medidas en mm)
== Hígado                    (== = grupo/órgano: se separa con una línea azul, no gasta fila)
Hígado | LMC | 152 | — | Conservado
Quiste 1 · seg. II | L × AP × T | 18 x 16 x 15 | auto | Simple !     (auto = volumen; ! = fila roja)
## IMAGENES                  (opcional) ruta.jpg | pie
## CONCLUSIONES              (tarjetas con dibujo; '||' separa DIAGNÓSTICO || sustento y significado clínico)
1. PROBLEMA PRINCIPAL: Colelitiasis múltiple no complicada || Cuatro litos móviles (mayor de 12.4 mm), sin
   colecistitis aguda y con vía biliar no dilatada (colédoco de 4 mm); correlaciona con el dolor en hipocondrio derecho.
2. Miomatosis uterina con componente submucoso || Útero de 222.44 cm³ con miomas FIGO 4, 6 y 2; el submucoso ...
## ETIOLOGIA                 (tarjeta dorada al lado de la firma: 1–2 líneas)
Sustrato metabólico común (colelitiasis, esteatosis, nefrolitiasis); miomatosis estrógeno-dependiente.
## RECOMENDACIONES           (solo si el doctor las pide)
```
Nunca calcular volúmenes a mano: usar `{{v:}}` o `auto` (L×AP×T×0.523). Con 2 medidas no hay volumen.

## PLANTILLA VISUAL DE 2 HOJAS — cómo redactar para que quede ordenada y quepa
- Lo arma el programa: tarjetas rojas con dibujo para cada órgano patológico, etiquetas de estado, medidas y
  clasificaciones en negrita AUTOMÁTICA (no poner ** a las medidas), órganos normales agrupados por región
  (ABDOMEN SUPERIOR, VÍA URINARIA Y RETROPERITONEO, PERITONEO Y PARED, PELVIS…) con su dibujo, cuadro de mediciones
  en dos mitades, conclusiones en tarjetas con dibujo, etiología dorada junto a la firma.
- Hallazgo patológico: 1 renglón del órgano + por cada lesión un bloque ">>" con apartados cortos "- Apartado:".
  Apartados sugeridos: Estado, Hallazgo (número, localización, tamaño, morfología, ecogenicidad, sombra/refuerzo),
  Doppler, Signos inflamatorios / Vía excretora / Efecto vecino, Clasificación, Impresión.
- Órganos normales: 1–3 frases por órgano, completas pero sin relleno, orden fijo: forma y tamaño → ecotextura →
  lesiones → vascularización. No repetir "de aspecto habitual" en cada frase.
- Cuadro: nombres cortos ("Quiste 1 · seg. II", "Lito 2 · cáliz medio", "Mioma 3 · submucoso") e interpretación de
  1–2 palabras (Conservado, Simple, Móvil, No obstruye, FIGO 4). Agrupar con "== Órgano".
- Conclusiones: DIAGNÓSTICO || sustento (datos clave, complicaciones descartadas o presentes, correlación clínica).
  Nuevas e integradoras, 1–2 líneas de sustento cada una, la 1 = PROBLEMA PRINCIPAL. Sin recomendaciones.
- Meta: abdominopélvico con varios hallazgos en 2 hojas. Si sale en 3, acortar primero el relleno de los órganos
  normales y las interpretaciones del cuadro; nunca quitar estructuras del protocolo ni datos del hallazgo.

'''
s = s[:viejo_ini] + nuevo + s[viejo_fin:]
viejo = ("- El programa la coloca AUTOMÁTICAMENTE de primera en HALLAZGOS y pone TODA su descripción en rojo; el resto\n"
         "  sigue después en orden anatómico (cefálico → caudal). Estudio negativo = sin \"!\" = orden anatómico normal.")
if viejo in s:
    s = s.replace(viejo, "- El programa la coloca AUTOMÁTICAMENTE de primera en HALLAZGOS, en tarjeta roja con su dibujo; el resto\n"
                         "  sigue después en orden anatómico (cefálico → caudal). Estudio negativo = sin \"!\" = orden anatómico normal.")
else:
    raise SystemExit("no se encontró el texto de hallazgos positivos")
open(dst, "w", encoding="utf-8").write(s)
print("PLANTILLA VISUAL aplicada:", dst, "formato", fmt)
