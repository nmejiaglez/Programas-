---
name: informes-formato-labex
description: Informes radiológicos FORMATO LABEX del Dr. Néstor José Mejía González (Código MINSA 37294) en Word (.docx). Usar cuando el doctor escriba FORMATO LABEX o envíe fotos, capturas, medidas o dictado de cualquier estudio de imagen (US, Doppler, obstetricia, TC, RM, Rx, mamografía) para el formato LABEX. Los logos y el sello ya están dentro del programa.
---

# Informes FORMATO LABEX — Dr. Néstor José Mejía González

Todo lo necesario (instrucciones, protocolos, logos, sello, iconos, esquemas y el programa que arma el Word)
está en `ARCHIVO_UNICO_LABEX.py`, en esta misma carpeta.

## Paso 0: leer solo las instrucciones
```bash
sed -n '1,/FIN DE INSTRUCCIONES/p' ARCHIVO_UNICO_LABEX.py
```
(o leer el archivo hasta la línea "FIN DE INSTRUCCIONES"). NO leer el resto: es código y logos codificados.

## Paso 1: por cada paciente
1. Escribir el dictado `dictado.txt` con el formato descrito en las instrucciones (`@protocolo` obligatorio).
2. Ejecutar:
   ```bash
   python3 ARCHIVO_UNICO_LABEX.py dictado.txt salida
   ```
   (si falta python-docx: `pip install python-docx`).
3. Si el programa avisa FRASES NO PERMITIDAS o ESTRUCTURAS DEL PROTOCOLO SIN DESCRIBIR: corregir el dictado y volver
   a ejecutar sin preguntarle nada al doctor.
4. Entregar el .docx con una respuesta breve. Dos estudios = dos archivos.

## Presentación del Word (la arma el programa, no se diseña a mano)
- Encabezado con logos, cuadro de datos del paciente y fecha/hora de Managua.
- **HALLAZGOS en tabla ordenada**: columna izquierda con la ilustración del órgano, su nombre y sus medidas clave
  (las que se escriben con `{m:}` y `{v:}`); columna derecha con la descripción completa. Una fila por estructura,
  en orden del protocolo; los hallazgos marcados con `!` van primero, en rojo y con la etiqueta HALLAZGO RELEVANTE.
- **CUADRO DE MEDICIONES** a ancho completo: Estructura | Parámetro | Medida | Vol. (cm³) | Interpretación, filas
  alternas, números que no se parten y la fila patológica en rojo.
- **CONCLUSIONES** numeradas (la 1 = PROBLEMA PRINCIPAL en rojo) y **ANÁLISIS ETIOLÓGICO** en recuadro.

Si el doctor escribe FORMATO LABEX sin datos de un paciente, responder solo:
"Listo, Dr. Mejía. Formato LABEX activo. Envíe los datos del paciente."
