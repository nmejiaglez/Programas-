"""RM cerebral real (plantilla MNI ICBM152 2009c, T1/T2/DP 1 mm, TemplateFlow, licencia libre)
con etiquetas anatómicas combinadas de FreeSurfer aseg, Harvard-Oxford cortical lateralizado y MASSP.
Uso: python rm_cerebro.py <carpeta_templateflow> <carpeta_salida>"""
import sys, json
import numpy as np, nibabel as nb
from scipy import ndimage
from atlaslib import exportar_pila, a_uint8, PLANOS

SRC, OUT = sys.argv[1], sys.argv[2]
P = SRC + '/tpl-MNI152NLin2009cAsym_res-01_'
def L(f):
    im = nb.load(P + f + '.nii.gz'); return np.asarray(im.dataobj), im.affine
t1, aff = L('T1w'); t2, _ = L('T2w'); pd, _ = L('PD')
aseg = L('seg-aseg_dseg')[0].astype(int)
ho = L('atlas-HOCPAL_desc-th25_dseg')[0].astype(int)
massp = L('atlas-MASSP20_dseg')[0].astype(int)

# ---------- nombres y descripciones (base, género, descripción) ----------
D = {}
def d(clave, nombre, g, desc): D[clave] = (nombre, g, desc)
d('wm', 'Sustancia blanca cerebral', 'f', 'Centro semioval y corona radiada. Hiperintensa en T1 e hipointensa en T2 por la mielina; las lesiones desmielinizantes y de pequeño vaso se ven hiperintensas en T2/FLAIR.')
d('ctx', 'Corteza cerebral', 'f', 'Sustancia gris cortical: hipointensa respecto a la sustancia blanca en T1 e hiperintensa en T2.')
d('vl', 'Ventrículo lateral', 'm', 'Astas frontal, cuerpo, atrio y asta occipital; contiene LCR (hipointenso en T1, hiperintenso en T2).')
d('vt', 'Asta temporal del ventrículo lateral', 'f', 'Por encima y medial al hipocampo; su dilatación es signo precoz de hidrocefalia y de atrofia hipocampal.')
d('cbwm', 'Sustancia blanca cerebelosa', 'f', 'Árbol de la vida; contiene los núcleos dentados.')
d('cbctx', 'Hemisferio cerebeloso', 'm', 'Corteza cerebelosa plegada en folias; irrigado por las arterias cerebelosas (PICA, AICA, cerebelosa superior).')
d('verm', 'Vermis cerebeloso', 'm', 'Porción media del cerebelo; su atrofia se asocia a alcoholismo; hipoplasia en Dandy-Walker.')
d('tal', 'Tálamo', 'm', 'Núcleo de relevo sensitivo y motor a ambos lados del III ventrículo; irrigado por arterias talamoperforantes (ACP).')
d('cau', 'Núcleo caudado', 'm', 'Cabeza en la pared lateral del asta frontal; atrofia de la cabeza en la enfermedad de Huntington.')
d('put', 'Putamen', 'm', 'Porción lateral del núcleo lenticular; sitio más frecuente de hemorragia hipertensiva.')
d('pal', 'Globo pálido', 'm', 'Porción medial del núcleo lenticular; lesión típica en intoxicación por CO; depósito de hierro (hipointenso en T2) con la edad.')
d('v3', 'Tercer ventrículo', 'm', 'Hendidura en línea media entre los tálamos; anchura < 6 mm en el adulto.')
d('v4', 'Cuarto ventrículo', 'm', 'Entre protuberancia/bulbo y cerebelo; su desplazamiento indica efecto de masa en fosa posterior.')
d('mes', 'Mesencéfalo', 'm', 'Pedúnculos cerebrales, tegmento y techo; contiene núcleos del III y IV par. Atrofia en parálisis supranuclear progresiva (signo del colibrí).')
d('pon', 'Protuberancia (puente)', 'f', 'Núcleos de los pares V a VIII y vías largas; hiperintensidad en cruz en atrofia multisistémica (signo del bollo caliente).')
d('bul', 'Bulbo raquídeo', 'm', 'Pirámides y olivas; unión bulbomedular en el foramen magno.')
d('hip', 'Hipocampo', 'm', 'Formación hipocampal en el lóbulo temporal medial; atrofia e hiperintensidad T2/FLAIR en la esclerosis mesial temporal y atrofia en Alzheimer (escala de Scheltens).')
d('amg', 'Amígdala', 'f', 'Núcleo del lóbulo temporal medial, anterior al hipocampo y a la punta del asta temporal.')
d('lcr', 'LCR de las cisternas basales', 'm', 'Cisternas supraselar, perimesencefálica y prepontina; sitio de hemorragia subaracnoidea.')
d('acc', 'Núcleo accumbens', 'm', 'Estriado ventral, en la unión de caudado y putamen.')
d('dcv', 'Diencéfalo ventral (hipotálamo y subtálamo)', 'm', 'Incluye hipotálamo, núcleos subtalámicos, cuerpos mamilares y tractos ópticos.')
d('plx', 'Plexo coroideo', 'm', 'En atrio y cuerpo ventricular; realza con gadolinio y calcifica en TC.')
d('qui', 'Quiasma óptico', 'm', 'Sobre la silla turca; su compresión por macroadenoma causa hemianopsia bitemporal.')
d('cc_r', 'Rodilla del cuerpo calloso', 'f', 'Porción anterior curva; une las cortezas prefrontales.')
d('cc_a', 'Cuerpo calloso, porción anterior del cuerpo', 'm', 'Comisura mayor del encéfalo.')
d('cc_c', 'Cuerpo del cuerpo calloso', 'm', 'Lesiones ovoides en su cara inferior (callososeptal) son típicas de esclerosis múltiple.')
d('cc_p', 'Istmo del cuerpo calloso', 'm', 'Porción estrecha entre cuerpo y esplenio.')
d('cc_e', 'Esplenio del cuerpo calloso', 'm', 'Porción posterior engrosada; lesión citotóxica reversible del esplenio en epilepsia, fármacos e infecciones.')
# MASSP
d('stn', 'Núcleo subtalámico', 'm', 'Pequeño núcleo lenticular sobre la sustancia negra; diana de estimulación cerebral profunda en Parkinson.')
d('sn', 'Sustancia negra', 'f', 'En el mesencéfalo ventral; pierde el signo de la cola de golondrina (nigrosoma-1) en Parkinson en SWI.')
d('rn', 'Núcleo rojo', 'm', 'Núcleo redondo del tegmento mesencefálico, hipointenso en T2 por su hierro.')
d('gpi', 'Globo pálido interno', 'm', 'Segmento medial del globo pálido; diana de estimulación cerebral profunda en distonía.')
d('gpe', 'Globo pálido externo', 'm', 'Segmento lateral del globo pálido, medial al putamen.')
d('ci', 'Cápsula interna', 'f', 'Brazo anterior (entre caudado y lenticular), rodilla y brazo posterior (entre tálamo y lenticular, vía corticoespinal). Un infarto lacunar del brazo posterior causa hemiparesia motora pura.')
d('vta', 'Área tegmental ventral', 'f', 'Origen de la vía dopaminérgica mesolímbica.')
d('fx', 'Fórnix', 'm', 'Vía eferente del hipocampo hacia los cuerpos mamilares; bajo el cuerpo calloso.')
d('pag', 'Sustancia gris periacueductal', 'f', 'Rodea el acueducto de Silvio en el mesencéfalo.')
d('ppn', 'Núcleo pedunculopontino', 'm', 'Unión mesencéfalo-protuberancia; relacionado con la marcha.')
d('cla', 'Claustro', 'm', 'Lámina de sustancia gris entre cápsula externa y cápsula extrema, lateral al putamen.')
d('ci_inf', 'Colículo inferior', 'm', 'Techo mesencefálico; vía auditiva.')
d('ci_sup', 'Colículo superior', 'm', 'Techo mesencefálico; reflejos visuales. Comprimido por tumores pineales (síndrome de Parinaud).')
d('hab', 'Habénula lateral', 'f', 'Epitálamo, junto a la glándula pineal.')
d('ca1', 'Hipocampo: sector CA1', 'm', 'Sector de Sommer, el más vulnerable a la hipoxia y a la esclerosis mesial.')
d('ca23', 'Hipocampo: sectores CA2–CA3', 'm', 'Asta de Amón, sectores intermedios.')
d('dg', 'Giro dentado', 'm', 'Capa granular del hipocampo.')
d('psub', 'Presubículo', 'm', 'Corteza de transición entre subículo y corteza entorrinal.')
d('sub', 'Subículo', 'm', 'Principal vía de salida del hipocampo.')
d('unc', 'Uncus', 'm', 'Porción anteromedial del giro parahipocampal; se hernia sobre el borde tentorial (herniación uncal) con compresión del III par.')
d('ca', 'Comisura anterior', 'f', 'Reparo de la línea CA–CP usada para orientar los cortes axiales.')
d('cp', 'Comisura posterior', 'f', 'Por encima del acueducto, en la base de la glándula pineal.')
d('mey', 'Núcleo basal de Meynert (prosencéfalo basal colinérgico)', 'm', 'Fuente principal de acetilcolina cortical; degenera en la enfermedad de Alzheimer.')
d('rdor', 'Núcleos del rafe dorsal', 'm', 'Núcleos serotoninérgicos del tronco.')
d('rmed', 'Núcleos del rafe medio', 'm', 'Núcleos serotoninérgicos del tronco.')
d('cgl', 'Cuerpo geniculado lateral', 'm', 'Relevo talámico de la vía visual.')
d('cgm', 'Cuerpo geniculado medial', 'm', 'Relevo talámico de la vía auditiva.')

HO = ['Polo frontal|m|Extremo anterior del lóbulo frontal; sitio de contusiones por contragolpe.',
 'Ínsula (corteza insular)|f|Cubierta por los opérculos en el fondo de la cisura de Silvio; el borramiento de la cinta insular es signo precoz de infarto de la ACM.',
 'Giro frontal superior|m|Corteza prefrontal dorsolateral y área motora suplementaria en su porción posterior.',
 'Giro frontal medio|m|Contiene el campo ocular frontal (área 8).',
 'Giro frontal inferior, porción triangular|m|Área de Broca (hemisferio dominante, área 45).',
 'Giro frontal inferior, porción opercular|m|Área de Broca (área 44); afasia motora en lesiones del hemisferio dominante.',
 'Giro precentral (corteza motora primaria)|m|Delante del surco central; homúnculo motor (signo de la mano en omega).',
 'Polo temporal|m|Extremo anterior del lóbulo temporal; sitio de contusión y de quistes aracnoideos de fosa media.',
 'Giro temporal superior, división anterior|m|Borde inferior de la cisura de Silvio.',
 'Giro temporal superior, división posterior|m|Área de Wernicke en el hemisferio dominante (afasia sensitiva).',
 'Giro temporal medio, división anterior|m|Cara lateral del lóbulo temporal.',
 'Giro temporal medio, división posterior|m|Cara lateral del lóbulo temporal.',
 'Giro temporal medio, porción temporooccipital|m|Área visual de movimiento (V5).',
 'Giro temporal inferior, división anterior|m|Cara inferolateral del lóbulo temporal.',
 'Giro temporal inferior, división posterior|m|Cara inferolateral del lóbulo temporal.',
 'Giro temporal inferior, porción temporooccipital|m|Transición temporooccipital.',
 'Giro poscentral (corteza somatosensitiva primaria)|m|Detrás del surco central.',
 'Lobulillo parietal superior|m|Por encima del surco intraparietal.',
 'Giro supramarginal, división anterior|m|Lobulillo parietal inferior, rodea el extremo de la cisura de Silvio.',
 'Giro supramarginal, división posterior|m|Lobulillo parietal inferior.',
 'Giro angular|m|Rodea el extremo del surco temporal superior; lesión dominante: síndrome de Gerstmann.',
 'Corteza occipital lateral, división superior|f|Cara lateral del lóbulo occipital.',
 'Corteza occipital lateral, división inferior|f|Cara lateral del lóbulo occipital.',
 'Corteza intracalcarina (corteza visual primaria)|f|Bordes de la cisura calcarina (área 17); infarto de la ACP: hemianopsia homónima contralateral.',
 'Corteza frontal medial|f|Cara medial del lóbulo frontal, anterior al cíngulo.',
 'Lobulillo yuxtaposicional (área motora suplementaria)|m|Cara medial frontal posterior.',
 'Corteza subcallosa|f|Bajo la rodilla del cuerpo calloso.',
 'Giro paracingulado|m|Paralelo al giro del cíngulo.',
 'Giro del cíngulo, división anterior|m|Sistema límbico, por encima del cuerpo calloso; se hernia bajo la hoz (herniación subfalcina).',
 'Giro del cíngulo, división posterior|m|Afectado precozmente en la enfermedad de Alzheimer (hipometabolismo).',
 'Precúneo|m|Cara medial del lóbulo parietal, anterior al surco parietooccipital.',
 'Cúneo (corteza cuneal)|m|Entre el surco parietooccipital y la cisura calcarina.',
 'Corteza orbitofrontal|f|Superficie inferior del lóbulo frontal sobre el techo orbitario; sitio frecuente de contusión.',
 'Giro parahipocampal, división anterior|m|Corteza entorrinal; atrofia temprana en Alzheimer.',
 'Giro parahipocampal, división posterior|m|Lateral al hipocampo.',
 'Giro lingual|m|Cara medial inferior del lóbulo occipital, bajo la calcarina.',
 'Giro fusiforme temporal, división anterior|m|Cara basal temporal.',
 'Giro fusiforme temporal, división posterior|m|Cara basal temporal; reconocimiento facial.',
 'Giro fusiforme temporooccipital|m|Cara basal temporooccipital.',
 'Giro fusiforme occipital|m|Cara basal occipital.',
 'Opérculo frontal|m|Cubre la ínsula por arriba y adelante.',
 'Opérculo central|m|Opérculo frontoparietal sobre la ínsula.',
 'Opérculo parietal|m|Corteza somatosensitiva secundaria.',
 'Plano polar|m|Superficie superior del giro temporal superior, anterior al giro de Heschl.',
 'Giro de Heschl (corteza auditiva primaria)|m|Giro temporal transverso.',
 'Plano temporal|m|Posterior al giro de Heschl; mayor en el hemisferio dominante.',
 'Corteza supracalcarina|f|Por encima de la cisura calcarina.',
 'Polo occipital|m|Extremo posterior del lóbulo occipital; representación de la visión macular.']

MASSP_MAP = {3: 'stn', 4: 'stn', 5: 'sn', 6: 'sn', 7: 'rn', 8: 'rn', 9: 'gpi', 10: 'gpi', 11: 'gpe', 12: 'gpe',
             21: 'ci', 22: 'ci', 23: 'vta', 24: 'vta', 25: 'fx', 26: 'pag', 27: 'pag', 28: 'ppn', 29: 'ppn',
             30: 'cla', 31: 'cla', 32: 'ci_inf', 33: 'ci_inf', 34: 'ci_sup', 35: 'ci_sup', 36: 'hab', 37: 'hab',
             42: 'ca1', 43: 'ca1', 44: 'ca23', 45: 'ca23', 46: 'dg', 47: 'dg', 48: 'psub', 49: 'psub',
             50: 'sub', 51: 'sub', 52: 'unc', 53: 'unc', 54: 'ca', 55: 'cp', 56: 'mey', 57: 'mey',
             58: 'rdor', 59: 'rmed', 60: 'cgl', 61: 'cgl', 62: 'cgm', 63: 'cgm'}
ASEG_MAP = {2: 'wm', 41: 'wm', 77: 'wm', 3: 'ctx', 42: 'ctx', 4: 'vl', 43: 'vl', 5: 'vt', 44: 'vt',
            7: 'cbwm', 46: 'cbwm', 8: 'cbctx', 47: 'cbctx', 10: 'tal', 49: 'tal', 11: 'cau', 50: 'cau',
            12: 'put', 51: 'put', 13: 'pal', 52: 'pal', 14: 'v3', 15: 'v4', 16: 'tronco', 17: 'hip', 53: 'hip',
            18: 'amg', 54: 'amg', 24: 'lcr', 26: 'acc', 58: 'acc', 28: 'dcv', 60: 'dcv', 31: 'plx', 63: 'plx',
            85: 'qui', 255: 'cc_r', 254: 'cc_a', 253: 'cc_c', 252: 'cc_p', 251: 'cc_e'}

# coordenadas RAS de cada vóxel (para dividir tronco y vermis)
X = aff[0, 0] * np.arange(t1.shape[0])[:, None, None] + aff[0, 3]
Z = aff[2, 2] * np.arange(t1.shape[2])[None, None, :] + aff[2, 3]

# ---------- volumen de etiquetas compuesto: clave textual + mitad (para lado) ----------
clave = np.full(t1.shape, '', dtype=object)
for v, k in ASEG_MAP.items():
    clave[aseg == v] = k
tr = clave == 'tronco'
clave[tr & (Z > -17)] = 'mes'; clave[tr & (Z <= -17) & (Z > -42)] = 'pon'; clave[tr & (Z <= -42)] = 'bul'
clave[(clave == 'cbctx') & (np.abs(X) <= 6)] = 'verm'
ctx = clave == 'ctx'
hoidx = ((ho + 1) // 2)                    # región HO 1..48 (impares/pares = hemisferios)
for r in range(1, 49):
    clave[ctx & (hoidx == r)] = f'ho{r}'
for v, k in MASSP_MAP.items():
    clave[massp == v] = k

for r, s in enumerate(HO, 1):
    n, g, desc = s.split('|'); D[f'ho{r}'] = (n, g, desc)

MEDIAS = {'v3', 'v4', 'mes', 'pon', 'bul', 'verm', 'lcr', 'qui', 'fx', 'ca', 'cp', 'rdor', 'rmed',
          'cc_r', 'cc_a', 'cc_c', 'cc_p', 'cc_e'}
def con_lado(n, g, lado):
    if not lado: return n
    s = ('derecho' if lado == 'derecho' else 'izquierdo') if g == 'm' else ('derecha' if lado == 'derecho' else 'izquierda')
    if n.startswith('Hipocampo: '): return n.replace('Hipocampo', 'Hipocampo ' + s, 1)
    if ',' in n: a, b = n.split(',', 1); return f'{a} {s},{b}'
    if ' (' in n: a, b = n.split(' (', 1); return f'{a} {s} ({b}'
    return f'{n} {s}'

lab = np.zeros(t1.shape, np.uint8); nombres = {}; nid = 0
for k in sorted({c for c in np.unique(clave) if c}):
    m = clave == k
    lados = [None] if k in MEDIAS else ['derecho', 'izquierdo']
    for lado in lados:
        mm = m if lado is None else m & ((X < 0) if lado == 'derecho' else (X >= 0))
        if mm.sum() < 8: continue
        nid += 1; lab[mm] = nid
        n, g, desc = D[k]
        nombres[nid] = {'n': con_lado(n, g, lado), 'd': desc, 't': 'neuro'}
print('etiquetas:', nid)

def norm(v):
    lo, hi = np.percentile(v[v > np.percentile(v, 30)], [0.5, 99.7]); return a_uint8(v, 0, hi)
series = {'T1': norm(t1), 'T2': norm(t2), 'DP': norm(pd)}
cab = np.argwhere(t1 > np.percentile(t1, 60))
mn, mx = cab.min(0), cab.max(0) + 1
rangos = {'axial': (mn[2], mx[2]), 'coronal': (mn[1], mx[1]), 'sagital': (mn[0], mx[0])}
for p in PLANOS:
    f, n = exportar_pila(OUT, 'rm-cerebro', p, series, lab, (1, 1, 1), 2, rangos[p], min_area=10, escala=1.5)
    print(p, n, 'cortes', round(f.stat().st_size / 1e6, 2), 'MB')
json.dump(nombres, open(OUT + '/rm-cerebro_etiquetas.json', 'w'), ensure_ascii=False)
