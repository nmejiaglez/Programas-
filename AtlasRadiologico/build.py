#!/usr/bin/env python3
"""Une los módulos de src/ en un único AtlasRadiologico.html autónomo."""
from pathlib import Path

SRC = Path(__file__).parent / 'src'
ORDEN = ['tejidos.js', 'motor.js', 'cortes_us.js', 'cortes_ax.js', 'cortes_rm.js',
         'cortes_rx.js', 'fichas.js', 'imagenes.js', 'app.js', 'visor.js']

js = '\n'.join((SRC / f).read_text(encoding='utf-8') for f in ORDEN)
html = (SRC / 'plantilla.html').read_text(encoding='utf-8').replace('/*JS*/', js)
(Path(__file__).parent / 'AtlasRadiologico.html').write_text(html, encoding='utf-8')
print('AtlasRadiologico.html', len(html) // 1024, 'KB')
