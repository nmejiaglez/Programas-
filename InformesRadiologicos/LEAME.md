# Generador de informes radiológicos — Dr. Néstor Mejía

Genera el Word definitivo (FORMATO HOSPITAL o LABEX) a partir de un dictado corto en texto.
Claude solo redacta el contenido clínico; el diseño lo pone el programa. Así se gasta mucho menos uso.

## Cómo instalarlo en Claude (Cowork)
1. Descargue `informes-radiologicos-nestor-mejia.zip` de esta carpeta.
2. En Claude: Configuración → Capacidades → Habilidades (Skills) → Subir habilidad → elija el .zip.
3. Desactive o reemplace la habilidad anterior del mismo nombre.
4. En un chat nuevo envíe fotos/dictado y escriba "FORMATO HOSPITAL" o "FORMATO LABEX".

## Uso manual (en una computadora con Python)
    pip install python-docx
    python3 generar_informe.py ejemplos/ejemplo_hospital.txt salida
(LibreOffice es opcional: permite llenar la página 1 con precisión y crear la vista previa PDF.)

Ver ejemplos en `ejemplos/` y el formato completo en `SKILL.md`.
Logos en `assets/` (reemplazables por archivos con el mismo nombre).
