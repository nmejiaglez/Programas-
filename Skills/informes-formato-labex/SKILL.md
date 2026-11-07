---
name: informes-formato-labex
description: Informes radiológicos FORMATO LABEX del Dr. Néstor José Mejía González (MINSA 37294) en Word. Usar con FORMATO LABEX o cuando envíe fotos, medidas o dictado de cualquier estudio de imagen (US, Doppler, obstetricia, TC, RM, Rx, mamografía).
---

# Informes FORMATO LABEX — Dr. Néstor José Mejía González

Archivos de esta carpeta:
- `ARCHIVO_UNICO_LABEX.py`: instrucciones clínicas, protocolos, logos, sello y el programa que arma el Word.
- `revisar.py`: REVISOR DE CALIDAD. Bloquea el informe si un órgano viene incompleto.
- `posproceso.py`: separa los datos en renglones con viñeta.
- `modelo_abdominopelvico.txt` y `modelo_obstetrico.txt`: INFORMES MODELO (el nivel exigido).

Si el doctor escribe FORMATO LABEX sin datos de un paciente, responder solo:
"Listo, Dr. Mejía. Formato LABEX activo. Envíe los datos del paciente."

## REGLA DE ORO: EL PACIENTE 30 IGUAL QUE EL PACIENTE 1
- ANTES DE CADA PACIENTE (no solo al inicio del chat) releer esta SKILL.md y el modelo del tipo de estudio.
- Comparar el dictado contra el MODELO, NUNCA contra el informe anterior del chat.
- Nunca acortar con el avance del día. El revisor debe dar "REVISOR OK" en cada paciente.
- Si el doctor escribe "nivel paciente 1": rehacer ese informe completo según el modelo.

## Paso 0 (una vez por chat): leer solo las instrucciones del programa
```bash
sed -n '1,/^=* FIN DE INSTRUCCIONES/p' ARCHIVO_UNICO_LABEX.py
```
NO leer el resto del archivo (es código y logos codificados).

## Paso 1: por cada paciente
1. Leer fotos/dictado. Avisar en el chat (1–3 líneas) solo conflictos reales (lateralidad, nombre, medida que no cuadra).
2. Escribir `dictado.txt` siguiendo el MODELO y las reglas de abajo (`@protocolo` obligatorio).
3. `python3 revisar.py dictado.txt` → si dice INCOMPLETO, completar lo que indique y repetir hasta "REVISOR OK".
4. `python3 ARCHIVO_UNICO_LABEX.py dictado.txt salida` (corregir y repetir si avisa frases prohibidas o estructuras faltantes).
5. `python3 posproceso.py salida/ARCHIVO.docx`
6. `soffice --headless --convert-to pdf --outdir salida/chk salida/ARCHIVO.docx` → `pdfinfo` (MÁXIMO 2 hojas) y revisar
   las páginas con `pdftoppm -r 60`. Si salen 3 hojas, aplicar "Cómo caber en 2 hojas" y regenerar.
7. Entregar primero el .docx (respuesta breve: qué interpretó, qué faltó). PDF final solo cuando el doctor lo apruebe.
   Dos estudios = dos archivos.

## FORMATO EN RENGLONES (todas las modalidades)
Detallado pero nunca corrido: un médico tratante se quejó de los párrafos largos con muchas medidas.

**Órgano CON patología** → título con `!` (tarjeta roja, va primero):
- 1 frase de síntesis.
- Un bloque `>> Nombre del órgano` con `- Estado:` y renglones `- Rótulo: dato`.
- Cada lesión en UN renglón: `- Mioma 1 · fúndico intramural: {m:32x28x26} · {v:32x28x26} · hipoecogénico · FIGO 4`
  (numerada igual que en el cuadro; medidas → volumen → características → clasificación).
- Los renglones obligatorios del órgano (tabla de abajo) van en ese mismo bloque.

**Órgano con medidas y sin patología** (riñón, útero, hígado, próstata, tiroides…): bloque `>>` con sus renglones obligatorios.

**Órgano sin medidas y sin patología** (porta, páncreas, bazo, suprarrenales, retroperitoneo, asas, anexos…):
1–2 frases técnicas (mínimo 6 palabras), sin bloques. El programa los agrupa por región en texto compacto.

**Renglones obligatorios (los exige revisar.py):**
| Órgano | Renglones |
|---|---|
| Riñón (cada uno) | Situación y forma · Dimensiones (L×AP×T + volumen) · Parénquima (cortical, ecogenicidad vs hígado/bazo, diferenciación corticomedular) · Sistema excretor (dilatación, litiasis, lesiones focales, espacio perirrenal) |
| Hígado | Tamaño y contornos · Parénquima (ecogenicidad, esteatosis y grado) · Lesiones |
| Útero | Posición · Dimensiones · Miometrio (+ cada mioma con FIGO) |
| Próstata | Dimensiones (volumen) · Ecotextura · Lóbulo medio |
| Lóbulo tiroideo | Dimensiones · Parénquima (+ nódulos con TI-RADS) |
| Biometría fetal | DBP · CC · CA · LF · PFE (+ EG promedio, relaciones) |
| Placenta | Inserción · Maduración (Grannum) |
| Líquido amniótico | ILA (cuadrantes + total) |
| Toda lesión numerada (`>> 1. …`) | Debe tener medidas |

**Otras modalidades (mismo principio, renglones por estructura):**
- Doppler vascular: Permeabilidad · Compresibilidad · Espectro · VPS/VTD · Índices · Reflujo/estenosis · Clasificación (SRU, CEAP).
- Mama: Patrón · Lesión (horario, distancia al pezón, medidas) · Forma/orientación/margen · Ecos posteriores · Doppler · BI-RADS · Axila.
- MSK: Espesor · Ecotextura · Desgarro (tipo, tamaño, retracción) · Derrame/bursa · Dinámica · Contralateral.
- Radiografía: Técnica · Alineación · Hueso/cortical · Espacios articulares · Partes blandas · Fractura con clasificación; tórax: Pleura · Parénquima · Hilios · Mediastino · ICT.
- Mamografía (por mama): Composición ACR · Masas · Calcificaciones · Asimetrías/distorsión · Axila · BI-RADS.
- TC: por órgano → Tamaño · Densidad (UH si las da) · Fases · Lesiones · Complicaciones · Clasificación.
- RM: por estructura → T1 · T2/STIR · Difusión/ADC · Realce · Lesiones · Clasificación (PI-RADS, Pfirrmann, Modic, Outerbridge…).

## CÓMO CABER EN 2 HOJAS (sin bajar el nivel)
1. Sin esquema anatómico (`@atlas`) salvo que el doctor lo pida (ocupa media hoja).
2. Una lesión = un renglón. Unir datos afines en un renglón (p. ej. "Parénquima: cortical 12.1 mm, ecogenicidad…, diferenciación…").
3. Un solo bloque `>>` por órgano (no separar "Litiasis" y "Riñón" en dos subtítulos).
4. Órganos normales sin medidas: 1–2 frases.
5. Conclusiones: 1 línea de sustento cada una. Etiología: 1 línea.
6. NUNCA quitar renglones obligatorios ni datos de una lesión para caber.

## Reglas clínicas que siguen vigentes
- Hallazgo principal primero y en rojo; conclusiones nuevas y jerarquizadas (1 = PROBLEMA PRINCIPAL); luego ETIOLOGÍA.
- Volumen con 3 medidas: usar `{v:LxAPxT}` o `auto` (L×AP×T×0.523). Con 2 medidas no hay volumen. Equipo: W→T, H→AP.
- Nunca inventar medidas ni hallazgos. Limitarse al tipo de estudio solicitado.
- Obstetricia: sin FUM ni BBT; cuadro con DBP, CC, CA, LF, FCF, EG, PFE, ILA, presentación (fila propia con situación y dorso), placenta (localización y grado); cérvix solo si se midió.
- Tiroides: escribir "enfermedad multinodular", nunca "bocio".
- Sin recomendaciones salvo que el doctor las pida. Sin fotos hasta nuevo aviso.
- Avisos del revisor y del programa son internos: corregir solo, nunca preguntarle al doctor por ellos.

## Consejo para días con muchos pacientes
Si el chat ya lleva unos 10 pacientes, sugerir al doctor (una vez, en una línea) abrir un chat nuevo y escribir FORMATO LABEX.
