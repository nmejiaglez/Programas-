#!/usr/bin/env python3
"""Compila el Atlas Radiológico.
Uso: python3 build.py [carpeta_salida_de_procesar]
  - copia las pilas (<estudio>_<plano>.js) a datos/
  - copia las etiquetas a procesar/etiquetas/
  - genera AtlasRadiologico.html con el índice de estudios incrustado."""
import sys, json, shutil, base64, io, glob
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).parent
DATOS, ETQ, WEB = RAIZ / 'datos', RAIZ / 'procesar' / 'etiquetas', RAIZ / 'web'
if len(sys.argv) > 1:
    src = Path(sys.argv[1]); DATOS.mkdir(exist_ok=True); ETQ.mkdir(parents=True, exist_ok=True)
    for f in src.glob('*.js'): shutil.copy(f, DATOS / f.name)
    for f in src.glob('*_etiquetas.json'): shutil.copy(f, ETQ / f.name)

TC = ['Partes blandas', 'Pulmón', 'Hueso']
EST = [
 dict(id='rm-cerebro', mod='RM', titulo='Cerebro — RM T1, T2 y densidad protónica', sub='Axial, coronal y sagital · cortes cada 2 mm',
      planos=['axial', 'coronal', 'sagital'], series=['T1', 'T2', 'DP'],
      desc='Resonancia magnética real de cerebro de 1 mm isotrópico (plantilla ICBM152 2009c, promedio de 152 adultos) con segmentación de núcleos profundos, giros corticales, ventrículos, tronco, cerebelo, cuerpo calloso, subcampos del hipocampo y núcleos del tronco.',
      fuente='RM: MNI ICBM152 2009c (TemplateFlow). Etiquetas: FreeSurfer aseg, Harvard-Oxford cortical lateralizado y MASSP.'),
 dict(id='tc-torax-abdomen', mod='TC', titulo='Tórax y abdomen — TC de adulto sin contraste', sub='De C6 a la pelvis · lóbulos, corazón, vértebras y costillas numeradas',
      planos=['axial', 'coronal', 'sagital'], series=TC,
      desc='Tomografía real de un adulto (estudio NLST), cortes de 1.5 mm reconstruidos en tres planos, con 89 estructuras segmentadas: lóbulos pulmonares, cavidades cardíacas, grandes vasos, vísceras abdominales, cada vértebra de C6 a L5, cada costilla, cinturas escapular y pélvica, y músculos.',
      fuente='TC: National Lung Screening Trial (NCI/TCIA, CC BY 4.0) vía Imaging Data Commons. Segmentación: TotalSegmentator v1.5.6 publicada en IDC (CC BY 4.0).'),
 dict(id='tc-abdomen-pelvis-m', mod='TC', titulo='Tórax, abdomen y pelvis — TC con contraste (masculino)', sub='Paciente de 16 años · 24 órganos contorneados',
      planos=['axial', 'coronal', 'sagital'], series=TC,
      desc='Tomografía real con contraste intravenoso de tórax, abdomen y pelvis de un adolescente de 16 años, con órganos contorneados manualmente por especialistas: vejiga, próstata, recto, cabezas femorales, riñones, suprarrenales, hígado, páncreas, bazo, intestino, corazón, timo y pulmones.',
      fuente='TC y contornos: Pediatric-CT-SEG (TCIA, CC BY 4.0) vía Imaging Data Commons.'),
 dict(id='tc-abdomen-pelvis-f', mod='TC', titulo='Tórax, abdomen y pelvis — TC con contraste (femenino)', sub='Paciente de 16 años · útero, mamas y 24 órganos más',
      planos=['axial', 'coronal', 'sagital'], series=TC,
      desc='Tomografía real con contraste intravenoso de una adolescente de 16 años con órganos contorneados manualmente, incluidos útero y cérvix, mamas, vejiga y recto.',
      fuente='TC y contornos: Pediatric-CT-SEG (TCIA, CC BY 4.0) vía Imaging Data Commons.'),
 dict(id='us-cuello', mod='US', titulo='Tiroides y cuello — ecografía real', sub='Transversal y longitudinal del lóbulo derecho',
      planos=['imagenes'], series=['Imagen'],
      desc='Imágenes reales de un estudio ecográfico de tiroides con transductor lineal, rotuladas punto a punto. Incluye un nódulo tiroideo medido.',
      fuente='Ecografía: Cancer Moonshot Biobank – Melanoma (CMB-MEL, TCIA, CC BY 4.0) vía Imaging Data Commons.'),
 dict(id='us-abdomen', mod='US', titulo='Abdomen y pelvis — ecografía real', sub='Hígado, venas hepáticas, porta, vesícula, riñón, vejiga, próstata y útero',
      planos=['imagenes'], series=['Imagen'],
      desc='Imágenes reales de ecografías abdominales completas con transductor convexo, ordenadas de craneal a caudal y rotuladas punto a punto.',
      fuente='Ecografía: CPTAC-AML y CPTAC-UCEC (TCIA, CC BY 4.0) vía Imaging Data Commons.'),
 dict(id='us-venoso', mod='US', titulo='Doppler venoso de miembros inferiores — real', sub='Ingle: vena y arteria femoral común, safena mayor',
      planos=['imagenes'], series=['Imagen'],
      desc='Imagen real de Doppler color de la región inguinal derecha, rotulada punto a punto.',
      fuente='Ecografía: Cancer Moonshot Biobank – Colorectal (CMB-CRC, TCIA, CC BY 4.0) vía Imaging Data Commons.'),
 dict(id='rx-torax', mod='RX', titulo='Tórax PA y lateral — radiografía real', sub='Arcos cardíacos, hilios, senos y diafragmas',
      planos=['imagenes'], series=['Imagen'],
      desc='Radiografía digital real de tórax en proyecciones posteroanterior y lateral, rotulada punto a punto.',
      fuente='Radiografía: LIDC-IDRI (TCIA, CC BY 3.0) vía Imaging Data Commons.'),
 dict(id='mg-mama', mod='MG', titulo='Mamografía digital MLO y CC — real', sub='Mama izquierda · pectoral, tejido fibroglandular, pezón',
      planos=['imagenes'], series=['Imagen'],
      desc='Mamografía digital real de la mama izquierda en proyecciones oblicua mediolateral y craneocaudal, rotulada punto a punto.',
      fuente='Mamografía: Chinese Mammography Database (CMMD, TCIA, CC BY 4.0) vía Imaging Data Commons.'),
]

FUENTES = [
 dict(t='Imaging Data Commons (NCI)', h='Fedorov A, et al. National Cancer Institute Imaging Data Commons. <i>RadioGraphics</i> 2023;43(12):e230180. Fuente de todas las TC, ecografías, radiografías y mamografías de este atlas.'),
 dict(t='NLST y segmentaciones TotalSegmentator', h='National Lung Screening Trial Research Team. NLST (TCIA), CC BY 4.0. Wasserthal J, et al. TotalSegmentator: robust segmentation of 104 anatomic structures in CT images. <i>Radiol Artif Intell</i> 2023. Segmentaciones de NLST publicadas en IDC (CC BY 4.0).'),
 dict(t='Pediatric-CT-SEG', h='Jordan P, et al. Pediatric chest/abdomen/pelvic CT exams with expert organ contours. <i>Med Phys</i> 2022. TCIA, CC BY 4.0.'),
 dict(t='RM cerebral y atlas', h='Fonov V, et al. Unbiased average age-appropriate atlases for pediatric studies / MNI ICBM152 2009c (licencia libre con atribución), distribuido por TemplateFlow (Ciric R, et al. <i>Nat Methods</i> 2022). Etiquetas: FreeSurfer aseg; atlas Harvard-Oxford (FSL, uso no comercial); MASSP (Bazin PL, et al. <i>eLife</i> 2020, CC BY).'),
 dict(t='Ecografía', h='CPTAC-AML, CPTAC-UCEC, CMB-CRC y CMB-MEL (TCIA, CC BY 4.0).'),
 dict(t='Radiografía y mamografía', h='Armato SG III, et al. LIDC-IDRI (TCIA, CC BY 3.0). Cui C, et al. The Chinese Mammography Database (CMMD), TCIA, CC BY 4.0.'),
 dict(t='Rótulos', h='En RM y TC los rótulos provienen de segmentaciones vóxel a vóxel (atlas y TotalSegmentator automáticos; contornos manuales en Pediatric-CT-SEG): pueden existir pequeñas imprecisiones en los bordes. En ecografía, radiografía y mamografía los rótulos son puntos colocados en este atlas sobre cada imagen.'),
]

def miniatura(e):
    p = e['planos'][0]; f = DATOS / f"{e['id']}_{p}.js"
    s = f.read_text(); d = json.loads(s[s.index('(') + 1:s.rindex(')')])
    ser = d['series'][e['series'][0]]; k = len(ser) // 2 if p != 'imagenes' else 0
    if e['id'] == 'tc-torax-abdomen': k = int(len(ser) * .35)
    im = Image.open(io.BytesIO(base64.b64decode(ser[k]))).convert('L')
    if p != 'imagenes' and d.get('aspecto', 1) != 1: im = im.resize((im.width, round(im.height * d['aspecto'])))
    im.thumbnail((260, 170)); b = io.BytesIO(); im.save(b, 'JPEG', quality=78)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode(), sum(len(json.loads((lambda t: t[t.index('(') + 1:t.rindex(')')])((DATOS / f"{e['id']}_{q}.js").read_text()))['series'][e['series'][0]]) for q in e['planos'])

for e in EST:
    e['et'] = json.load(open(ETQ / f"{e['id']}_etiquetas.json"))
    e['mini'], e['ncortes'] = miniatura(e)
    print(e['id'], len(e['et']), 'estructuras', e['ncortes'], 'cortes')

js = ('const ESTUDIOS=' + json.dumps(EST, ensure_ascii=False, separators=(',', ':')) + ';\n'
      + 'const FUENTES=' + json.dumps(FUENTES, ensure_ascii=False) + ';\n'
      + (WEB / 'fichas.js').read_text() + '\n' + (WEB / 'app.js').read_text())
html = (WEB / 'plantilla.html').read_text().replace('/*JS*/', js)
(RAIZ / 'AtlasRadiologico.html').write_text(html)
print('AtlasRadiologico.html', len(html) // 1024, 'KB · datos:', round(sum(f.stat().st_size for f in DATOS.glob('*.js')) / 1e6, 1), 'MB')

# versión de un solo archivo con todos los cortes incrustados (para descargar y abrir sin carpeta)
bloques = ''.join(f'<script type="text/plain" id="d_{f.stem}">{f.read_text()}</script>\n' for f in sorted(DATOS.glob('*.js')))
(RAIZ / 'AtlasRadiologico_completo.html').write_text(html.replace('</body>', bloques + '</body>'))
print('AtlasRadiologico_completo.html', round((RAIZ / 'AtlasRadiologico_completo.html').stat().st_size / 1e6, 1), 'MB')
