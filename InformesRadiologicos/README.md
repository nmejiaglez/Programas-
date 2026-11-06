# Informes Radiológicos — Dr. Néstor José Mejía González

Tres programas separados, cada uno en su carpeta y listo para usarse por su cuenta:

| Carpeta | Para qué | Cómo se usa |
|---|---|---|
| `skill-formato-hospital/` | Skill de Claude, FORMATO HOSPITAL | Subir la carpeta comprimida (.zip) como skill en Claude, o adjuntar `ARCHIVO_UNICO_HOSPITAL.py` al chat |
| `skill-formato-labex/` | Skill de Claude, FORMATO LABEX | Igual, con `ARCHIVO_UNICO_LABEX.py` |
| `chatgpt-formato-hospital/` | ChatGPT, FORMATO HOSPITAL | Adjuntar `CHATGPT_HOSPITAL.py` y seguir `INSTRUCCIONES_PARA_EL_GPT.txt` |

Cada `.py` trae dentro las instrucciones, los protocolos, los logos, el sello y el programa que arma el Word.

## Diseño: PLANTILLA VISUAL DE 2 HOJAS
- **Hallazgos relevantes** primero, en tarjetas: rótulo rojo con el órgano, etiqueta de estado (gris azulado si es
  tranquilizador, roja si importa), dibujo anatómico con el texto alrededor, cada lesión con apartados cortos y
  las medidas en negrita.
- **Órganos normales** agrupados por región, cada región con su dibujo y cada órgano con su nombre en negrita.
- **Cuadro de mediciones** en dos mitades lado a lado, separado por órgano, filas patológicas en rojo.
- **Conclusiones** en tarjetas con dibujo: diagnóstico en negrita y debajo su sustento y significado clínico;
  la 1 (PROBLEMA PRINCIPAL) en rojo. **Causa probable** en tarjeta dorada junto a la firma.
- Un abdominopélvico con 5 patologías queda en 2 hojas.

## Cambiar el diseño más adelante
En `diseno/`: `diseno_visual.py` (funciones de diseño), `compactar.py` (encabezado/pie), `aplicar_final.py`
(arma un archivo nuevo a partir del original) y `ejemplo_dictado.txt` (dictado de prueba con 5 patologías):

```
python3 diseno/aplicar_final.py ORIGINAL.py NUEVO.py
```
