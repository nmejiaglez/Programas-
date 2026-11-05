# Informes Radiológicos — Dr. Néstor José Mejía González

Tres programas separados, cada uno en su carpeta y listo para usarse por su cuenta:

| Carpeta | Para qué | Cómo se usa |
|---|---|---|
| `skill-formato-hospital/` | Skill de Claude, FORMATO HOSPITAL | Subir la carpeta comprimida (.zip) como skill en Claude, o adjuntar `ARCHIVO_UNICO_HOSPITAL.py` al chat |
| `skill-formato-labex/` | Skill de Claude, FORMATO LABEX | Igual, con `ARCHIVO_UNICO_LABEX.py` |
| `chatgpt-formato-hospital/` | ChatGPT, FORMATO HOSPITAL | Adjuntar `CHATGPT_HOSPITAL.py` y seguir `INSTRUCCIONES_PARA_EL_GPT.txt` |

Cada `.py` trae dentro las instrucciones, los protocolos, los logos, el sello y el programa que arma el Word.

## Diseño de los hallazgos y las tablas
- **Hallazgos**: tabla de dos columnas. A la izquierda, el órgano con su ilustración, su nombre y sus medidas clave;
  a la derecha, la descripción completa, justificada y a lo ancho de la página (ya no en dos columnas estrechas).
  Una fila por estructura y en el orden del protocolo; los hallazgos patológicos van primero, en rojo, con la etiqueta
  HALLAZGO RELEVANTE. Un órgano nunca queda separado de su descripción entre páginas.
- **Cuadro de mediciones**: ancho completo, columnas fijas (Estructura | Parámetro | Medida | Vol. (cm³) | Interpretación),
  filas alternas, números que no se parten y la fila patológica en rojo.
- **Conclusiones**: numeradas en recuadros; la 1 (PROBLEMA PRINCIPAL) en rojo.
- **Análisis etiológico** y recomendaciones: en recuadro con filete lateral.

## Cambiar el diseño más adelante
`diseno/nuevo_render.py` contiene las funciones de diseño y `diseno/aplicar.py` las inserta en un archivo original:

```
python3 diseno/aplicar.py ORIGINAL.py NUEVO.py diseno/nuevo_render.py
```

`diseno/ejemplo_dictado.txt` es un dictado de prueba.
