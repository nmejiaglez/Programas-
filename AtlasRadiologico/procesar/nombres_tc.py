"""Nombres en español y descripciones de las estructuras segmentadas en TC
(TotalSegmentator y contornos de Pediatric-CT-SEG)."""
import re

ORD = {'First': 'primera', 'Second': 'segunda', 'Third': 'tercera', 'Fourth': 'cuarta', 'Fifth': 'quinta',
       'Sixth': 'sexta', 'Seventh': 'séptima', 'Eighth': 'octava', 'Ninth': 'novena', 'Tenth': 'décima',
       'Eleventh': 'undécima', 'Twelfth': 'duodécima'}

N = {
 'spleen': ('Bazo', 'Densidad homogénea en fase portal (algo menor que el hígado en simple); longitud normal ≤ 12–13 cm.'),
 'right kidney': ('Riñón derecho', 'Corteza y médula; más bajo que el izquierdo por el hígado. Longitud 10–12 cm.'),
 'left kidney': ('Riñón izquierdo', 'Retroperitoneal, en el espacio perirrenal (fascia de Gerota).'),
 'gallbladder': ('Vesícula biliar', 'Bilis de 0–20 UH; pared ≤ 3 mm; en la fosa vesicular entre segmentos IVb y V.'),
 'liver': ('Hígado', 'Parénquima de 55–65 UH en simple, más denso que el bazo; esteatosis si < 40 UH o 10 UH menos que el bazo.'),
 'stomach': ('Estómago', 'Fundus, cuerpo y antro; pared que realza en capas; contiene gas y líquido.'),
 'aorta': ('Aorta', 'Ascendente < 40 mm, descendente torácica < 30 mm, abdominal < 25–30 mm (aneurisma ≥ 30 mm).'),
 'inferior vena cava': ('Vena cava inferior', 'A la derecha de la aorta; recibe venas renales y hepáticas.'),
 'portal vein and splenic vein': ('Vena porta y vena esplénica', 'La porta se forma por detrás del cuello pancreático (confluencia esplenomesentérica); calibre ≤ 13 mm.'),
 'pancreas': ('Páncreas', 'Cabeza, cuello, cuerpo y cola; conducto de Wirsung ≤ 3 mm; involución grasa con la edad.'),
 'right adrenal gland': ('Glándula suprarrenal derecha', 'Lineal o en "V" invertida, posterior a la VCI; grosor de rama < 5 mm.'),
 'left adrenal gland': ('Glándula suprarrenal izquierda', 'En "λ", anteromedial al polo superior renal izquierdo.'),
 'left upper lobe of lung': ('Lóbulo superior izquierdo', 'Incluye la língula; separado del inferior por la cisura mayor (oblicua).'),
 'left lower lobe of lung': ('Lóbulo inferior izquierdo', 'Segmentos superior (S6) y basales; posterior a la cisura mayor.'),
 'right upper lobe of lung': ('Lóbulo superior derecho', 'Segmentos apical, posterior y anterior; limitado por las cisuras menor y mayor.'),
 'middle lobe of right lung': ('Lóbulo medio', 'Segmentos lateral y medial; entre la cisura menor (horizontal) y la mayor; borra el borde cardíaco derecho.'),
 'right lower lobe of lung': ('Lóbulo inferior derecho', 'Segmentos superior (S6) y basales; posterior a la cisura mayor.'),
 'esophagus': ('Esófago', 'Retrotraqueal y retrocardíaco, ligeramente a la izquierda; pared ≤ 3–5 mm distendido.'),
 'trachea': ('Tráquea', 'Columna aérea con anillos cartilaginosos en "C"; diámetro coronal ≤ 25 mm (varón).'),
 'myocardium': ('Miocardio del ventrículo izquierdo', 'Pared ventricular izquierda (8–11 mm en diástole).'),
 'left atrium': ('Aurícula izquierda', 'Estructura cardíaca más posterior, anterior al esófago; recibe las venas pulmonares.'),
 'left ventricle of heart': ('Ventrículo izquierdo', 'Cavidad del ventrículo izquierdo; forma el ápex.'),
 'right atrium': ('Aurícula derecha', 'Recibe VCS, VCI y seno coronario; forma el borde cardíaco derecho.'),
 'right ventricle of heart': ('Ventrículo derecho', 'Cámara más anterior, detrás del esternón; relación VD/VI > 1 en TEP sugiere sobrecarga.'),
 'pulmonary artery': ('Arteria pulmonar', 'Tronco y ramas principales; tronco > 29 mm o mayor que la aorta sugiere hipertensión pulmonar.'),
 'left common iliac artery': ('Arteria ilíaca común izquierda', 'Rama terminal de la aorta (bifurcación en L4).'),
 'right common iliac artery': ('Arteria ilíaca común derecha', 'Rama terminal de la aorta (bifurcación en L4).'),
 'left common iliac vein': ('Vena ilíaca común izquierda', 'Pasa por detrás de la arteria ilíaca común derecha (síndrome de May-Thurner).'),
 'right common iliac vein': ('Vena ilíaca común derecha', 'Forma la VCI con la contralateral a nivel de L5.'),
 'small intestine': ('Intestino delgado (yeyuno e íleon)', 'Asas con válvulas conniventes; calibre < 2.5–3 cm.'),
 'duodenum': ('Duodeno', 'Bulbo, 2.ª porción descendente (papila), 3.ª horizontal entre AMS y aorta, 4.ª ascendente.'),
 'colon': ('Colon', 'Ciego, ascendente, transverso, descendente y sigma; calibre máximo 6 cm (ciego 9 cm).'),
 'left humerus': ('Húmero izquierdo', 'Cabeza y diáfisis proximal.'),
 'right humerus': ('Húmero derecho', 'Cabeza y diáfisis proximal.'),
 'left scapula': ('Escápula izquierda', 'Cuerpo, espina, acromion y apófisis coracoides.'),
 'right scapula': ('Escápula derecha', 'Cuerpo, espina, acromion y apófisis coracoides.'),
 'left clavicle': ('Clavícula izquierda', 'Articulaciones esternoclavicular y acromioclavicular.'),
 'right clavicle': ('Clavícula derecha', 'Articulaciones esternoclavicular y acromioclavicular.'),
 'left hip': ('Hueso coxal izquierdo', 'Ilion, isquion y pubis; acetábulo.'),
 'right hip': ('Hueso coxal derecho', 'Ilion, isquion y pubis; acetábulo.'),
 'sacrum': ('Sacro', 'Cinco vértebras fusionadas; agujeros sacros y articulaciones sacroilíacas.'),
 'face': ('Macizo facial', 'Huesos y partes blandas de la cara (incluidos en el campo de visión).'),
 'left deep muscle of back': ('Músculos paravertebrales izquierdos (erectores de la columna)', 'Iliocostal, longísimo y multífido; atrofia grasa en lumbalgia crónica.'),
 'right deep muscle of back': ('Músculos paravertebrales derechos (erectores de la columna)', 'Iliocostal, longísimo y multífido.'),
 'left iliopsoas muscle': ('Músculo iliopsoas izquierdo', 'Psoas mayor e ilíaco; referencia de ganglios lumboaórticos y de abscesos del psoas.'),
 'right iliopsoas muscle': ('Músculo iliopsoas derecho', 'Psoas mayor e ilíaco.'),
 # Pediatric-CT-SEG
 'bladder': ('Vejiga urinaria', 'Orina 0–15 UH; pared ≤ 3 mm distendida.'),
 'rectum': ('Recto', 'Ampolla rectal rodeada por el mesorrecto.'),
 'prostate': ('Próstata', 'Bajo la vejiga, anterior al recto.'),
 'uterocervix': ('Útero y cérvix', 'Entre vejiga y recto.'),
 'femoral head left': ('Cabeza femoral izquierda', 'Articulación coxofemoral.'),
 'femoral head right': ('Cabeza femoral derecha', 'Articulación coxofemoral.'),
 'bones': ('Huesos', 'Esqueleto axial y apendicular.'),
 'gonads': ('Gónadas', 'Testículos u ovarios según el sexo.'),
 'heart': ('Corazón', 'Silueta cardíaca con pericardio.'),
 'lung left': ('Pulmón izquierdo', 'Lóbulos superior (con língula) e inferior.'),
 'lung right': ('Pulmón derecho', 'Lóbulos superior, medio e inferior.'),
 'spinal canal': ('Conducto raquídeo', 'Contiene médula espinal y saco dural.'),
 'thymus': ('Timo', 'Mediastino anterior; prominente en niños, involuciona con la edad.'),
 'thyroid': ('Glándula tiroides', 'Hiperdensa en TC por su contenido de yodo; lóbulos e istmo.'),
 'breast left': ('Mama izquierda', 'Tejido fibroglandular y graso.'),
 'breast right': ('Mama derecha', 'Tejido fibroglandular y graso.'),
 'large bowel': ('Colon', 'Ciego, ascendente, transverso, descendente y sigma.'),
 'skin': ('Piel', ''),
}

VERT = {'C': 'cervical', 'T': 'torácica (dorsal)', 'L': 'lumbar'}


def nombre_tc(etq):
    k = etq.strip().lower().replace('_', ' ')
    k = re.sub(r'\s+', ' ', k)
    m = re.match(r'^([ctl])(\d+) vertebra$', k)
    if m:
        r, n = m.group(1).upper(), m.group(2)
        extra = {'C7': ' (vértebra prominente)', 'T12': ' (unión toracolumbar)', 'L5': ' (unión lumbosacra)'}.get(r + n, '')
        return (f'Vértebra {r}{n}{extra}', f'Vértebra {VERT[r]}: cuerpo, pedículos, láminas, apófisis transversas y espinosa. Contar desde C7 o L5 para localizar el nivel.')
    m = re.match(r'^(left|right) (\w+) rib$', etq.strip().lower())
    if m:
        lado = 'izquierda' if m.group(1) == 'left' else 'derecha'
        o = ORD[m.group(2).capitalize()]
        num = list(ORD).index(m.group(2).capitalize()) + 1
        tipo = 'costilla verdadera (vertebroesternal)' if num <= 7 else 'costilla falsa (vertebrocondral)' if num <= 10 else 'costilla flotante'
        return (f'{o.capitalize()} costilla {lado} (arco {num})', f'{tipo.capitalize()}; arco posterior articulado con la vértebra T{num}.')
    if k in N:
        return N[k]
    return (etq, '')
