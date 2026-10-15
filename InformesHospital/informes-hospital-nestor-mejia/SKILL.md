---
name: informes-hospital-nestor-mejia
description: Informes radiológicos de nivel subespecialista del Dr. Néstor Mejía en Word con FORMATO HOSPITAL (plantilla fija generada por script). Usar cuando el doctor pida FORMATO HOSPITAL.
---
# Informes FORMATO HOSPITAL — Dr. Néstor José Mejía González (Código MINSA 37294)

## Flujo (ahorro de uso: NO diseñar el Word a mano)
1. Leer fotos/dictado. Avisar en 1–3 líneas solo conflictos o datos faltantes reales.
2. Escribir UN archivo `.txt` con el formato de abajo (solo contenido clínico).
3. Ejecutar: `python3 generar_informe.py dictado.txt carpeta_salida`
   (el script pone plantilla, logos, columna lateral, fecha/hora Managua, volúmenes y llena la página 1).
4. Revisar SOLO una vez el PDF de vista previa (pdftoppm -r 50). No re-renderizar salvo error real.
5. Entregar el .docx con respuesta breve. Dos estudios = dos archivos.

## Formato del .txt
```
@formato HOSPITAL
@paciente Nombre Apellidos
@edad 45 años   @sexo / @medico / @procedencia / @modalidad   (una por línea)
@archivo Nombre_Apellido_US_Abdominal
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
