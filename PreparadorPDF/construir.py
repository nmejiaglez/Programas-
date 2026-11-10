# -*- coding: utf-8 -*-
"""Arma PreparadorPDF.html: toma app.html y le añade el lector DICOM y los
decodificadores (JPEG 2000 / JPEG-LS) del Visor DICOM, para que sea un solo archivo.
Uso:  python construir.py"""
import os, re
aqui = os.path.dirname(os.path.abspath(__file__))
visor = open(os.path.join(aqui, '..', 'VisorDICOM', 'VisorDICOM.html'), encoding='utf-8').read()
app = open(os.path.join(aqui, 'app.html'), encoding='utf-8').read()
codecs = re.search(r'<script id="codecJ2K">.*?</script>\s*<script id="codecJLS">.*?</script>\s*<script>const WASM_J2K=.*?</script>', visor, re.S).group(0)
i = visor.index('/* ====================== lector ZIP'); j = visor.index('/* ====================== carga de archivos')
dicom = visor[i:j]
salida = app.replace('<!--CODECS-->', codecs).replace('/*DICOM*/', dicom)
open(os.path.join(aqui, 'PreparadorPDF.html'), 'w', encoding='utf-8').write(salida)
print('PreparadorPDF.html listo:', len(salida) // 1024, 'KB')
