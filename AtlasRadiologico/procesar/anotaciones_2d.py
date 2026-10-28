"""Imágenes 2D reales (ecografía, radiografía y mamografía de Imaging Data Commons, CC BY)
rotuladas punto a punto. Coordenadas en % del ancho/alto de la imagen recortada.
Uso: python anotaciones_2d.py <carpeta_png> <salida>"""
import sys, json, base64, io
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]

D = {  # descripciones reutilizables
 'pared': 'Piel, tejido celular subcutáneo y músculos de la pared: primeras capas del campo cercano.',
 'hig': 'Ecotextura homogénea de grano fino; isoecoico o levemente hiperecoico respecto a la corteza renal.',
 'vci': 'Recibe las venas hepáticas en la confluencia (signo del “conejo” en el corte subcostal). Colapsabilidad respiratoria > 50 % en condiciones normales.',
 'vhm': 'Recorre la cisura portal principal (línea de Cantlie): separa el lóbulo derecho (VIII/V) del izquierdo (IV).',
 'vhd': 'Separa el segmento VIII (anterior) del VII (posterior) del lóbulo derecho.',
 'diaf': 'Interfase curvilínea muy ecogénica en el campo lejano (reflector especular).',
 'refuerzo': 'Aumento de la ecogenicidad detrás de una estructura líquida por menor atenuación: confirma contenido líquido.',
}

ESTUDIOS = {
 'us-abdomen': {'titulo': 'Ecografía abdominal y pélvica real', 'modalidad': 'US', 'imagenes': [
  ('higado_trans3', 'Hígado — subcostal oblicuo: confluencia de venas hepáticas', None, [
    ('Vena cava inferior y confluencia de las venas hepáticas', 52, 78, D['vci']),
    ('Vena hepática media', 57, 45, D['vhm']),
    ('Vena hepática derecha', 36, 52, D['vhd']),
    ('Segmento VIII (anterosuperior derecho)', 42, 33, 'Entre las venas hepáticas derecha y media, por encima del plano portal.'),
    ('Segmento VII (posterosuperior derecho)', 20, 63, 'Posterior y lateral a la vena hepática derecha.'),
    ('Segmento IVa (medial superior izquierdo)', 70, 42, 'Medial a la vena hepática media, por encima del plano portal.'),
    ('Diafragma', 35, 87, D['diaf']),
    ('Parénquima hepático', 27, 40, D['hig']),
    ('Pared abdominal', 50, 9, D['pared'])]),
  ('vci_long', 'Hígado — sagital por la vena cava inferior', None, [
    ('Vena porta principal (paredes ecogénicas)', 66, 61, 'Anterior a la VCI; las paredes ecogénicas (tejido fibroadiposo de la tríada portal) la distinguen de las venas hepáticas. Calibre ≤ 13 mm.'),
    ('Vena cava inferior', 80, 74, D['vci']),
    ('Lóbulo caudado (segmento I)', 50, 70, 'Entre la vena porta (anterior) y la VCI (posterior); drena directamente a la VCI.'),
    ('Vena hepática (drenaje a la VCI)', 27, 57, 'Estructura tubular anecoica sin pared ecogénica que converge hacia la VCI.'),
    ('Diafragma', 8, 75, D['diaf']),
    ('Parénquima hepático', 42, 38, D['hig'])]),
  ('coledoco', 'Hilio hepático — Doppler color de la vena porta', None, [
    ('Vena porta principal (flujo hepatópeto, en rojo)', 50, 70, 'Flujo hacia el transductor y hacia el hígado (hepatópeto), velocidad normal 15–40 cm/s; el flujo hepatófugo indica hipertensión portal.'),
    ('Ventana de Doppler color', 64, 52, 'Área donde se codifica la velocidad en color: rojo hacia el transductor, azul alejándose.'),
    ('Parénquima hepático', 42, 30, D['hig'])]),
  ('vesicula_long', 'Vesícula biliar — eje largo', None, [
    ('Luz vesicular (bilis anecoica)', 70, 62, 'Contenido anecoico homogéneo, sin ecos ni sombras; medir hasta 10 × 4 cm.'),
    ('Pared vesicular', 75, 47, 'Línea ecogénica fina; grosor ≤ 3 mm en ayunas.'),
    ('Cuello vesicular (bolsa de Hartmann)', 57, 50, 'Porción cercana al hilio hepático; sitio de impactación litiásica.'),
    ('Fondo vesicular', 90, 70, 'Porción caudal y anterior.'),
    ('Refuerzo acústico posterior', 72, 90, D['refuerzo']),
    ('Rama de la vena porta (pared ecogénica)', 44, 36, 'Rama portal intrahepática con paredes ecogénicas.'),
    ('Hígado (lecho vesicular, segmentos IVb y V)', 33, 55, 'La fosa vesicular marca el límite entre los segmentos IVb y V.'),
    ('Pared abdominal', 60, 12, D['pared'])]),
  ('vesicula_trans', 'Vesícula biliar — eje corto', None, [
    ('Luz vesicular', 55, 55, 'Contenido anecoico.'),
    ('Pared vesicular', 52, 38, 'Grosor ≤ 3 mm.'),
    ('Refuerzo acústico posterior', 55, 88, D['refuerzo']),
    ('Interfase gaseosa intestinal (sombra sucia)', 80, 60, 'Gas de asas adyacentes (duodeno/colon) con artefacto de reverberación.'),
    ('Parénquima hepático', 25, 50, D['hig']),
    ('Pared abdominal', 60, 12, D['pared'])]),
  ('rinon_der_long2', 'Riñón derecho — eje largo', None, [
    ('Hígado (segmento VI)', 40, 30, 'Ventana acústica; la corteza renal normal es iso- o hipoecoica respecto al hígado.'),
    ('Cápsula renal / interfase hepatorrenal', 50, 54, 'Línea ecogénica que delimita el riñón; espacio de Morison entre hígado y riñón.'),
    ('Corteza renal', 25, 72, 'Espesor parenquimatoso 15–20 mm; cortical ≥ 7 mm.'),
    ('Seno renal (complejo ecogénico central)', 50, 78, 'Grasa, vasos y sistema colector no dilatado.'),
    ('Polo superior renal', 16, 80, 'Craneal (a la izquierda de la imagen en eje largo).'),
    ('Polo inferior renal', 82, 74, 'Caudal. Longitud renal normal 10–12 cm.')]),
  ('vejiga_prostata', 'Vejiga y próstata — transversal suprapúbico', None, [
    ('Luz vesical (orina anecoica)', 42, 40, 'Contenido anecoico; volumen = L × AP × T × 0.52.'),
    ('Pared vesical anterior', 40, 22, 'Grosor ≤ 3 mm en repleción.'),
    ('Próstata (base, impronta sobre el piso vesical)', 40, 76, 'Glándula ecogénica bajo la vejiga; la protrusión intravesical del lóbulo medio se mide en sagital.'),
    ('Piso vesical / trígono', 34, 60, 'Base vesical entre los meatos ureterales.'),
    ('Pared abdominal', 50, 7, D['pared'])]),
  ('ut2', 'Pelvis femenina — transversal suprapúbico', (0.08, 0.04, 0.92, 1.0), [
    ('Vejiga urinaria', 48, 48, 'Ventana acústica para la pelvis transabdominal.'),
    ('Útero (posterior a la vejiga)', 50, 67, 'Miometrio de ecogenicidad intermedia por detrás de la vejiga.'),
    ('Pared abdominal', 50, 12, D['pared'])]),
 ]},
 'us-cuello': {'titulo': 'Ecografía de tiroides y cuello real', 'modalidad': 'US', 'imagenes': [
  ('t0', 'Tiroides derecha — transversal (polo superior)', (0.25, 0.0, 0.775, 0.92), [
    ('Vena yugular interna derecha', 36, 37, 'Ovalada, anecoica y compresible; lateral a la carótida.'),
    ('Arteria carótida común derecha', 44, 46, 'Circular, anecoica, pulsátil y no compresible.'),
    ('Lóbulo tiroideo derecho (polo superior)', 60, 42, 'Parénquima con nódulos de componente sólido y quístico en este paciente.'),
    ('Músculos del cuello (esternocleidomastoideo e infrahioideos)', 50, 18, 'Planos musculares hipoecoicos con septos ecogénicos.'),
    ('Piel y tejido celular subcutáneo', 50, 3, 'Primeras capas del campo cercano.')]),
  ('t1', 'Tiroides derecha — longitudinal', (0.25, 0.0, 0.775, 0.92), [
    ('Lóbulo tiroideo derecho (eje longitudinal)', 45, 45, 'Parénquima de ecogenicidad media, más ecogénico que los músculos.'),
    ('Nódulo tiroideo hipoecoico (medido con calibradores)', 63, 50, 'Nódulo bien delimitado en el polo del lóbulo; caracterizar con ACR TI-RADS (composición, ecogenicidad, forma, margen, focos ecogénicos).'),
    ('Músculos infrahioideos', 50, 14, 'Esternohioideo y esternotiroideo, anteriores a la glándula.'),
    ('Piel y tejido celular subcutáneo', 50, 3, 'Primeras capas del campo cercano.')]),
 ]},
 'us-venoso': {'titulo': 'Doppler venoso de miembros inferiores real', 'modalidad': 'US', 'imagenes': [
  ('ven0', 'Ingle derecha — Doppler color de la vena femoral común', (0.235, 0.125, 0.69, 1.0), [
    ('Vena femoral común (azul)', 43, 49, 'Mayor calibre, compresible; el color azul indica flujo alejándose del transductor.'),
    ('Arteria femoral común (rojo)', 53, 47, 'Pulsátil y no compresible.'),
    ('Vena safena mayor (unión safenofemoral)', 37, 33, 'Superficial; desemboca en la vena femoral común (reflujo > 0.5 s = insuficiencia).'),
    ('Rama arterial profunda', 36, 64, 'Rama de la arteria femoral en un plano más profundo.'),
    ('Tejido celular subcutáneo', 50, 22, 'Plano superficial.')]),
 ]},
 'rx-torax': {'titulo': 'Radiografía de tórax real (PA y lateral)', 'modalidad': 'RX', 'imagenes': [
  ('rx_pa', 'Tórax — proyección posteroanterior (PA)', None, [
    ('Tráquea (columna aérea)', 49, 20, 'Centrada sobre las apófisis espinosas; se desvía por masas, atelectasias o neumotórax a tensión.'),
    ('Carina', 51, 31, 'Bifurcación traqueal (ángulo 60–75°; aumenta con crecimiento auricular izquierdo).'),
    ('Bronquio principal izquierdo', 57, 34, 'Más largo y horizontal que el derecho.'),
    ('Botón aórtico (cayado aórtico)', 57, 27, 'Primer arco del borde mediastínico izquierdo.'),
    ('Arco de la arteria pulmonar (2.º arco izquierdo)', 59, 37, 'Convexo en hipertensión pulmonar.'),
    ('Ventrículo izquierdo (borde cardíaco izquierdo)', 69, 62, 'Forma el borde inferior izquierdo y el ápex; ICT normal < 0.5.'),
    ('Aurícula derecha (borde cardíaco derecho)', 39, 58, 'Arco inferior derecho de la silueta cardíaca.'),
    ('Vena cava superior (borde mediastínico derecho)', 41, 24, 'Borde superior derecho del mediastino.'),
    ('Hilio pulmonar derecho', 35, 45, 'Arteria pulmonar derecha y bronquios; el izquierdo suele estar 1–2 cm más alto.'),
    ('Hilio pulmonar izquierdo', 63, 41, 'Arteria pulmonar izquierda sobre el bronquio principal izquierdo.'),
    ('Hemidiafragma derecho', 25, 67, 'Contorno nítido y convexo; habitualmente más alto que el izquierdo.'),
    ('Hemidiafragma izquierdo', 80, 76, 'Contorno nítido; la cámara gástrica se ubica por debajo.'),
    ('Seno costofrénico lateral derecho', 8, 71, 'Ángulo agudo y libre; se borra con derrame pleural.'),
    ('Seno costofrénico lateral izquierdo', 91, 80, 'Ángulo agudo y libre.'),
    ('Seno cardiofrénico derecho', 33, 66, 'Ángulo entre corazón y diafragma.'),
    ('Clavícula derecha', 18, 10, 'Extremos mediales equidistantes de las apófisis espinosas: placa sin rotación.'),
    ('Clavícula izquierda', 80, 10, 'Comparar con la contralateral para valorar rotación.'),
    ('Vértice pulmonar derecho', 33, 14, 'Región apical, por encima de la clavícula y primeras costillas.'),
    ('Vértice pulmonar izquierdo', 64, 14, 'Región apical izquierda.'),
    ('Campo pulmonar derecho', 20, 45, 'Trama broncovascular de calibre decreciente hacia la periferia.'),
    ('Campo pulmonar izquierdo', 78, 52, 'Trama broncovascular simétrica.'),
    ('Arco costal posterior', 25, 26, 'Arcos posteriores horizontales: contar ≥ 9–10 sobre el hemidiafragma derecho para una inspiración adecuada.'),
    ('Columna dorsal (apófisis espinosas)', 50, 9, 'Visibles a través del mediastino superior.')]),
  ('rx_lat', 'Tórax — proyección lateral', None, [
    ('Esternón', 27, 40, 'Borde anterior del tórax en la proyección lateral.'),
    ('Espacio claro retroesternal', 38, 32, 'Ocupado por masas del mediastino anterior (timo, linfoma, teratoma, tiroides).'),
    ('Tráquea (columna aérea)', 54, 28, 'Desciende oblicua hacia atrás hasta la carina.'),
    ('Hilio pulmonar (arterias pulmonares)', 53, 48, 'Densidades vasculares hiliares superpuestas.'),
    ('Orificio bronquial lobar', 58, 46, 'Bronquio de lóbulo superior visto en su eje.'),
    ('Silueta cardíaca', 36, 60, 'Ventrículo derecho anterior; aurícula y ventrículo izquierdos posteriores.'),
    ('Espacio claro retrocardíaco', 60, 62, 'Se borra con crecimiento auricular izquierdo o consolidación del lóbulo inferior.'),
    ('Cuerpos vertebrales dorsales', 75, 45, 'Se oscurecen progresivamente hacia caudal (signo de la columna).'),
    ('Hemidiafragma (cúpula anterior)', 40, 66, 'Contorno diafragmático.'),
    ('Seno costofrénico posterior', 82, 80, 'El más declive: primer sitio en borrarse con derrame pleural (~75 mL).'),
    ('Cámara gástrica', 54, 77, 'Gas gástrico bajo el hemidiafragma izquierdo.'),
    ('Arcos vertebrales posteriores', 88, 40, 'Láminas y apófisis espinosas.')]),
 ]},
 'mg-mama': {'titulo': 'Mamografía digital real (mama izquierda)', 'modalidad': 'MG', 'imagenes': [
  ('mg_mlo', 'Mama izquierda — oblicua mediolateral (MLO)', None, [
    ('Músculo pectoral mayor', 12, 15, 'Banda triangular en el ángulo superior posterior; en una MLO correcta llega hasta la línea del pezón.'),
    ('Tejido fibroglandular', 50, 70, 'Densidad heterogénea con predominio inferior y retroareolar en esta paciente.'),
    ('Grasa subcutánea (premamaria)', 70, 35, 'Radiolúcida, entre la piel y el tejido fibroglandular.'),
    ('Ligamentos de Cooper (trabéculas fibrosas)', 72, 52, 'Líneas curvas finas; su retracción es signo indirecto de malignidad.'),
    ('Calcificaciones groseras (macrocalcificaciones)', 25, 59, 'Densas, gruesas y bien definidas: aspecto benigno típico (BI-RADS 2).'),
    ('Pezón / complejo areola-pezón', 86, 81, 'Debe verse de perfil en al menos una proyección.'),
    ('Piel', 94, 50, 'Contorno cutáneo fino (≤ 2 mm).'),
    ('Grasa retroglandular', 17, 47, 'Banda grasa entre glándula y pectoral; zona donde se pierden lesiones si la mama no se tracciona.'),
    ('Pliegue inframamario', 35, 97, 'Debe incluirse en la MLO (criterio de calidad).')]),
  ('mg_cc', 'Mama izquierda — craneocaudal (CC)', None, [
    ('Tejido fibroglandular', 40, 50, 'Distribución central y externa.'),
    ('Grasa subcutánea (premamaria)', 75, 30, 'Radiolúcida.'),
    ('Pezón (de perfil)', 96, 50, 'Referencia para la distancia y la posición horaria de las lesiones.'),
    ('Calcificaciones groseras (macrocalcificaciones)', 17, 62, 'Correlacionan con las vistas en la MLO.'),
    ('Cuadrantes externos', 35, 8, 'Hacia arriba en la CC (lado lateral).'),
    ('Cuadrantes internos', 35, 93, 'Hacia abajo en la CC (lado medial).'),
    ('Piel', 85, 24, 'Contorno cutáneo.')]),
 ]},
}

for ident, est in ESTUDIOS.items():
    data = {'id': ident, 'plano': 'imagenes', 'series': {'Imagen': []}, 'lab': [], 'anc': [], 'pos': [], 'tit': [],
            'lw': 1000, 'lh': 1000, 'aspecto': 1, 'mm': 0, 'puntos': True}
    nombres = {}; nid = 0; dims = []
    for k, (archivo, tit, rec, pts) in enumerate(est['imagenes']):
        im = Image.open(f'{SRC}/{archivo}.png').convert('RGB')
        import numpy as np
        a = np.asarray(im).astype(int)
        if (np.abs(a[..., 0] - a[..., 2]) > 40).mean() < 0.002:   # sin color Doppler: guardar en grises
            im = im.convert('L')
        x0 = y0 = 0; W, H = im.size
        if rec:
            box = (int(rec[0] * W), int(rec[1] * H), int(rec[2] * W), int(rec[3] * H))
            im = im.crop(box); x0, y0 = box[0], box[1]
        if im.height > 900:
            im = im.resize((round(im.width * 900 / im.height), 900), Image.LANCZOS)
        b = io.BytesIO(); im.save(b, 'JPEG', quality=88, optimize=True)
        data['series']['Imagen'].append(base64.b64encode(b.getvalue()).decode())
        anc = []
        for n, x, y, d in pts:
            # convertir % de la imagen original a % de la imagen recortada
            if rec:
                x = (x / 100 * W - x0) / (box[2] - box[0]) * 100
                y = (y / 100 * H - y0) / (box[3] - box[1]) * 100
            nid += 1; nombres[nid] = {'n': n, 'd': d}
            anc.append([nid, round(x * 10), round(y * 10), 1])
        data['anc'].append(anc); data['pos'].append(k); data['tit'].append(tit)
        dims.append((im.width, im.height))
    data['dims'] = dims
    data['w'], data['h'] = dims[0]
    with open(f'{OUT}/{ident}_imagenes.js', 'w') as f:
        f.write('ATLAS_CARGA(' + json.dumps(data, separators=(',', ':')) + ');\n')
    json.dump(nombres, open(f'{OUT}/{ident}_etiquetas.json', 'w'), ensure_ascii=False)
    print(ident, len(est['imagenes']), 'imágenes', nid, 'rótulos')
