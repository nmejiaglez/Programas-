---
name: informes-formato-hospital
description: Informes radiológicos FORMATO HOSPITAL del Dr. Néstor José Mejía González (Código MINSA 37294) en Word (.docx). Usar cuando el doctor escriba FORMATO HOSPITAL o envíe fotos, capturas, medidas o dictado de cualquier estudio de imagen (US, Doppler, obstetricia, TC, RM, Rx, mamografía) para el formato HOSPITAL. Los logos y el sello ya están dentro del programa.
---

# Informes FORMATO HOSPITAL — Dr. Néstor José Mejía González

Todo lo necesario (instrucciones, protocolos, logos, sello, iconos, esquemas y el programa que arma el Word)
está en `ARCHIVO_UNICO_HOSPITAL.py`, en esta misma carpeta.

## Paso 0: leer solo las instrucciones
```bash
sed -n '1,/FIN DE INSTRUCCIONES/p' ARCHIVO_UNICO_HOSPITAL.py
```
(o leer el archivo hasta la línea "FIN DE INSTRUCCIONES"). NO leer el resto: es código y logos codificados.

## Paso 1: por cada paciente
1. Escribir el dictado `dictado.txt` con el formato descrito en las instrucciones (`@protocolo` obligatorio).
2. Ejecutar:
   ```bash
   python3 ARCHIVO_UNICO_HOSPITAL.py dictado.txt salida
   ```
   (si falta python-docx: `pip install python-docx`).
3. Si el programa avisa FRASES NO PERMITIDAS o ESTRUCTURAS DEL PROTOCOLO SIN DESCRIBIR: corregir el dictado y volver
   a ejecutar sin preguntarle nada al doctor.
4. Entregar el .docx con una respuesta breve. Dos estudios = dos archivos.

## Presentación del Word — PLANTILLA VISUAL DE 2 HOJAS (la arma el programa, no se diseña a mano)
- Encabezado con logos, cuadro de datos del paciente, fecha/hora de Managua y estudio/indicación en recuadro.
- **Hallazgos relevantes** (títulos con `!`): primero, en **tarjetas** con el nombre del órgano como rótulo rojo,
  etiqueta de estado (`- Estado:`), dibujo anatómico con el texto alrededor y cada lesión (`>>`) con apartados
  cortos (`- Hallazgo:`, `- Doppler:`, `- Efecto vecino:`…). Medidas y clasificaciones en negrita automática.
- **Resto del estudio**: órganos normales agrupados por región (ABDOMEN SUPERIOR, VÍA URINARIA, PERITONEO Y PARED,
  PELVIS…) con su dibujo; nombre de cada órgano en azul negrita y descripción completa.
- **Cuadro de mediciones** en dos mitades lado a lado, grupos por órgano (`== Órgano`), filas patológicas en rojo.
- **Conclusiones y causa probable**: tarjetas con dibujo; `DIAGNÓSTICO || sustento y significado clínico`.
  La 1 = PROBLEMA PRINCIPAL en rojo. Análisis etiológico en tarjeta dorada junto a la firma.
- Meta: abdominopélvico con varios hallazgos en 2 hojas. El formato completo del dictado está en las instrucciones
  del archivo (sección "Formato del .txt").

Si el doctor escribe FORMATO HOSPITAL sin datos de un paciente, responder solo:
"Listo, Dr. Mejía. Formato HOSPITAL activo. Envíe los datos del paciente."
