# Skills de informes radiológicos — Dr. Néstor José Mejía González (MINSA 37294)

Tres skills independientes, todas con el nivel completo del paquete original *informes-formato-hospital*
(regla de oro "paciente 30 = paciente 1", revisor de calidad, posproceso en renglones, informes modelo y límite de 2 hojas):

| Carpeta | Uso | Programa |
|---|---|---|
| `informes-formato-hospital/` | Claude · FORMATO HOSPITAL | `ARCHIVO_UNICO_HOSPITAL.py` |
| `informes-formato-labex/` | Claude · FORMATO LABEX | `ARCHIVO_UNICO_LABEX.py` |
| `chatgpt-formato-hospital/` | ChatGPT (GPT personalizado) · FORMATO HOSPITAL | `CHATGPT_HOSPITAL.py` |

Cada carpeta incluye además `revisar.py`, `posproceso.py`, `modelo_abdominopelvico.txt` y `modelo_obstetrico.txt`.
Claude: subir la carpeta comprimida en .zip como skill. ChatGPT: seguir `INSTRUCCIONES_PARA_EL_GPT.txt`.
