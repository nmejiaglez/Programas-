---
name: informes-labex-nestor-mejia
description: Informes radiológicos de nivel subespecialista del Dr. Néstor Mejía en Word con FORMATO LABEX (plantilla fija generada por script). Usar cuando el doctor pida FORMATO LABEX.
---
# Informes FORMATO LABEX — Dr. Néstor José Mejía González (Código MINSA 37294)

## INICIO DE CHAT
- Si el doctor activa la habilidad o escribe FORMATO LABEX SIN datos de un paciente real: responder ÚNICAMENTE
  "Listo, Dr. Mejía. Formato LABEX activo. Envíe los datos del paciente." y ESPERAR. NO generar ejemplos, NO ejecutar
  el programa, NO probarlo, NO resumir estas instrucciones, NO leer más archivos. Empezar solo cuando lleguen datos.

## ANTES DE REDACTAR (OBLIGATORIO EN CADA INFORME)
1. Leer `referencias/estandar_detalle.md` (nivel de detalle mínimo por órgano y plantilla de lesión).
2. Leer `referencias/reglas_completas.md` (reglas originales completas del doctor; la sección 6 de diseño la aplica el script).
3. Redactar hallazgos EXTENSOS y minuciosos: 4–8 oraciones por órgano, 6–12 por hallazgo patológico.
   Un informe con hallazgos breves o telegráficos es un ERROR: rehacerlo antes de entregar.
   El ahorro de uso viene del script (diseño), NUNCA de acortar los hallazgos.

## REDACCIÓN REALISTA (el informe lo firma el radiólogo, no una IA)
- PROHIBIDO: "no se documentó/aportó/proporcionó/consignó/especificó", "no consignado", "no disponible",
  "según su dictado", "imágenes enviadas/proporcionadas", "pusiste", "enviaste", "el doctor refiere", "el usuario",
  o cualquier frase que hable de cómo llegaron los datos.
- Si falta un dato: OMITIRLO en silencio (campo administrativo vacío; en hallazgos describir solo lo evaluado).
  Avisar del faltante ÚNICAMENTE en el chat, nunca dentro del Word.
- Limitaciones técnicas reales sí se dicen en lenguaje radiológico: "valoración limitada por interposición de gas",
  "no evaluable por escasa repleción vesical", "el segmento ureteral no se visualiza".
- El script bloquea el Word si detecta estas frases: reescribir la línea indicada y volver a generar.

## COBERTURA COMPLETA OBLIGATORIA (aunque el doctor solo envíe medidas y "resto normal")
- Cada estudio lleva @protocolo. TODAS las estructuras del protocolo se describen como "# TÍTULO" con su párrafo
  completo (estandar_detalle.md), incluidas cavidad peritoneal, retroperitoneo, espacios extraperitoneales,
  suprarrenales, uréteres, asas, pared, ganglios, etc. Nada se omite. Sin patología = descripción normal COMPLETA.
- Orden de los títulos = orden del protocolo (cefálico → caudal, anterior → posterior; derecho antes que izquierdo).
- Hay protocolo para TODO estudio de US convexo, lineal y endocavitario, Rx, mamografía, TC y RM
  (lista completa en referencias/protocolos.md). "@protocolo libre" SOLO si el estudio no existe en la lista; en ese
  caso construir igualmente la lista completa cefálico → caudal de la región y describir cada estructura.
- Estructura no visualizada: decirlo con causa técnica ("no visualizada por interposición de gas").
- El script BLOQUEA el Word si falta alguna estructura del protocolo y dice cuáles: Claude las agrega SOLO (con su
  descripción normal completa) y regenera. Ese aviso es interno: NUNCA mostrarlo ni preguntarle nada al doctor por ello.
- NUNCA pedir al doctor medidas de estructuras que no midió. Estructura sin medida = descripción cualitativa completa
  ("dimensiones dentro de parámetros esperados"), sin inventar números. Solo preguntar si falta un dato CRÍTICO del
  hallazgo principal (y aun así, en el chat, en una línea).
- Estudios combinados (p. ej. abdominal + tiroides) = dos informes, cada uno con su protocolo.

## LOGOS Y SELLOS: YA ESTÁN INCLUIDOS — NUNCA PEDIRLOS
- Todos los logos y el sello NM están en la carpeta `assets/` de ESTA habilidad (junto a este SKILL.md).
- El script `generar_informe.py` (misma carpeta) los inserta solo. NO pedir al doctor que suba sellos ni logos,
  NO buscar logos en el chat, NO dibujarlos. Solo usar otros si el doctor los envía y pide cambiarlos.
- Ejecutar con la ruta de esta habilidad: `python3 <carpeta_de_esta_skill>/generar_informe.py dictado.txt salida`
  (si falta python-docx: `pip install python-docx`).

## Flujo (ahorro de uso: NO diseñar el Word a mano)
1. Leer fotos/dictado. Avisar en 1–3 líneas solo conflictos o datos faltantes reales.
2. Escribir UN archivo `.txt` con el formato de abajo (solo contenido clínico).
3. Ejecutar: `python3 generar_informe.py dictado.txt carpeta_salida`
   (el script pone plantilla, logos, columna lateral, fecha/hora Managua, volúmenes y llena la página 1).
4. Revisar SOLO una vez el PDF de vista previa (pdftoppm -r 50). No re-renderizar salvo error real.
5. Entregar el .docx con respuesta breve. Dos estudios = dos archivos.

## Formato del .txt
```
@formato LABEX
@paciente Nombre Apellidos
@edad 45 años   @sexo / @medico / @procedencia / @modalidad   (una por línea)
@archivo Nombre_Apellido_US_Abdominal
@protocolo general_femenino   (OBLIGATORIO; ver referencias/protocolos.md)
@atlas litiasis_renal_derecho_superior   (opcional: esquema anatómico del PROBLEMA PRINCIPAL)
## ESTUDIO
Indicación clínica.
# HÍGADO !                   (# = órgano; ! = HALLAZGO RELEVANTE)
Texto. !!hallazgo en rojo!!  **negrita**  {m:12.7x16.2x16}=medidas  {v:12.7x16.2x16}=volumen cm³
## MEDICIONES
Estructura | Parámetro | 12.7 x 16.2 x 16 | auto | Interpretación !     (auto = volumen; ! = fila roja)
## IMAGENES                  (opcional) ruta.jpg | pie
## CONCLUSIONES
1. PROBLEMA PRINCIPAL: ...
## ETIOLOGIA
Texto breve.
## RECOMENDACIONES           (solo si el doctor las pide)
```
Nunca calcular volúmenes a mano: usar `{v:}` o `auto` (L×AP×T×0.523). Con 2 medidas no hay volumen.

## Reglas clínicas (no negociables)
- Nivel subespecialista del primer al último paciente; sistemático órgano por órgano, cefálico→caudal.
- Terminología: conservado, habitual, sin alteraciones morfológicas demostrables, sin evidencia de. Evitar "normal".
- Reinterpretar, no copiar el dictado. Patológico descrito ULTRA completo. Nunca inventar medidas ni hallazgos;
  "resto conservado" = desarrollar el protocolo sin inventar. Estructura no evaluable: decirlo.
- Medidas en el cuadro; en el texto solo si importan al diagnóstico. Equipo: W→T, T/H→AP.
- Clasificaciones (TI-RADS, BI-RADS, O-RADS, Bosniak, PI-RADS, LI-RADS, CEAP, Atlanta, Grannum) solo si los datos lo permiten.
- Conclusiones nuevas y jerarquizadas, primero PROBLEMA PRINCIPAL. Luego ETIOLOGIA breve.
- Sin recomendaciones salvo petición. Sin FUM ni BBT. Verificar lateralidad, nombre, edad y sexo.
- Cobertura por estudio: abdominal (hígado, porta, venas hepáticas, vesícula, vías biliares, colédoco, páncreas,
  bazo, riñones, vejiga, retroperitoneo, grandes vasos, peritoneo); femenino + útero, endometrio, ovarios, anexos,
  fondo de saco; masculino + próstata; cuello; Doppler (permeabilidad, compresibilidad, flujo, espectro, índices);
  obstetricia (fetos, vitalidad, FCF, biometría, EG, PFE, placenta/Grannum, cordón, LA/ILA, FPP).

## Esquema anatómico (@atlas) — sin costo extra
Si el PROBLEMA PRINCIPAL tiene esquema disponible, agregar SIEMPRE la línea @atlas (el script inserta la imagen tras
las conclusiones; Claude NO dibuja nada). Disponibles (carpeta assets/atlas):
- litiasis_renal_{derecho|izquierdo}_{superior|medio|inferior|pelvis|union_pieloureteral}
Si no hay esquema para el diagnóstico, omitir @atlas (no inventar ni dibujar).
