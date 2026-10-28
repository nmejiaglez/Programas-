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

# ===================== AMPLIACIÓN: más ecografía y radiografía de todo el cuerpo =====================
H = 'Hueso cortical denso; valorar continuidad cortical, trabeculado y alineación.'
ESTUDIOS['us-abdomen']['imagenes'] += [
  ('c_higado_med', 'Hígado — sagital lóbulo derecho con medición', None, [
    ('Parénquima hepático (longitud 14.7 cm, medida en línea medioclavicular)', 45, 35, 'Longitud craneocaudal normal < 15.5 cm en la línea medioclavicular.'),
    ('Ramas portales intrahepáticas', 62, 43, 'Estructuras tubulares con paredes ecogénicas.'),
    ('Diafragma (calibrador inferior)', 30, 67, D['diaf'])]),
  ('c_vci_doppler', 'Vena cava inferior — sagital con Doppler color', None, [
    ('Vena cava inferior (flujo en azul, hacia la aurícula)', 38, 66, 'Flujo fásico con la respiración y el ciclo cardíaco; diámetro < 2.1 cm con colapso > 50 % = presión auricular normal.'),
    ('Desembocadura de vena hepática', 55, 47, 'Drenaje de las venas hepáticas en la VCI intrahepática.'),
    ('Parénquima hepático', 75, 40, D['hig']),
    ('Pared abdominal', 50, 20, D['pared'])]),
  ('c_aorta_doppler', 'Aorta abdominal — sagital con Doppler color', None, [
    ('Aorta abdominal (flujo en rojo)', 45, 58, 'Calibre normal < 2.5–3 cm; medir de pared externa a pared externa. ≥ 3 cm = aneurisma.'),
    ('Lóbulo hepático izquierdo (ventana)', 28, 42, 'Ventana acústica epigástrica.'),
    ('Pared abdominal', 50, 20, D['pared'])]),
  ('c_pancreas2', 'Epigastrio — transversal: páncreas y grandes vasos', None, [
    ('Páncreas (cuerpo)', 47, 31, 'Ecogenicidad igual o mayor que el hígado; anterior a los vasos mesentéricos y a la vena esplénica.'),
    ('Vasos mesentéricos superiores', 42, 37, 'Vena y arteria mesentéricas superiores, referencia del cuello pancreático.'),
    ('Vena cava inferior', 34, 45, 'A la derecha del paciente (izquierda de la imagen).'),
    ('Aorta abdominal', 47, 48, 'Circular, pulsátil, a la izquierda de la VCI.'),
    ('Interfase del cuerpo vertebral', 40, 56, 'Sombra acústica posterior del hueso.'),
    ('Pared abdominal', 50, 18, D['pared'])]),
  ('c_bazo_sag', 'Bazo — corte coronal intercostal izquierdo', None, [
    ('Parénquima esplénico (longitud 9.6 cm)', 50, 55, 'Ecotextura homogénea; longitud normal ≤ 12–13 cm.'),
    ('Diafragma / interfase pleural', 25, 85, D['diaf']),
    ('Pared torácica', 55, 22, 'Músculos intercostales y costillas.')]),
  ('c_vejiga_sag', 'Vejiga — sagital suprapúbico', None, [
    ('Luz vesical (orina)', 62, 45, 'Contenido anecoico; volumen = L × AP × T × 0.52.'),
    ('Pared vesical posterior', 40, 58, 'Grosor ≤ 3 mm distendida.'),
    ('Refuerzo acústico posterior', 60, 82, D['refuerzo']),
    ('Pared abdominal', 50, 22, D['pared'])]),
]
ESTUDIOS['us-cuello']['imagenes'] += [
  ('tt16', 'Tiroides — transversal con carótida', None, [
    ('Lóbulo tiroideo', 55, 42, 'Parénquima homogéneo más ecogénico que los músculos.'),
    ('Arteria carótida común', 90, 45, 'Circular, anecoica, no compresible; lateral a la glándula.'),
    ('Músculos infrahioideos', 50, 14, 'Esternohioideo y esternotiroideo.'),
    ('Piel y tejido celular subcutáneo', 50, 3, 'Campo cercano.')]),
]
ESTUDIOS['us-venoso']['imagenes'] += [
  ('vv20', 'Muslo — vasos femorales (tercio medio) con Doppler color', None, [
    ('Vena femoral (azul)', 42, 63, 'Antes “femoral superficial”: vena profunda. Debe ser compresible y con flujo fásico.'),
    ('Arteria femoral superficial (rojo)', 33, 55, 'Acompaña a la vena; anterior a ella en el canal aductor.'),
    ('Músculos del muslo', 50, 25, 'Vasto medial y sartorio.')]),
  ('vv10', 'Muslo — vena femoral (tercio distal)', None, [
    ('Vena femoral distal (azul)', 55, 62, 'Segmento del canal de Hunter; sitio frecuente de trombosis.'),
    ('Músculos del muslo', 50, 25, 'Planos musculares.')]),
]
ESTUDIOS['rx-craneo-columna'] = {'titulo': 'Radiografía de cráneo y columna', 'modalidad': 'RX', 'imagenes': [
  ('rx_craneo_lat', 'Cráneo — lateral', None, [
    ('Hueso frontal', 64, 26, H), ('Hueso parietal', 42, 20, 'Calota: tabla externa, díploe y tabla interna. En estudios de mieloma, buscar lesiones líticas en sacabocados.'),
    ('Hueso occipital', 23, 52, H), ('Seno frontal', 76, 40, 'Seno neumatizado por encima de la órbita.'),
    ('Órbita', 73, 46, 'Techo y paredes orbitarias superpuestos.'), ('Fosa craneal anterior (techo orbitario)', 62, 49, 'Piso de la fosa anterior.'),
    ('Seno maxilar', 67, 61, 'Radiolucencia por encima de las raíces dentarias.'), ('Celdas mastoideas (porción petrosa)', 44, 59, 'Neumatización del temporal.'),
    ('Rama de la mandíbula', 57, 72, H), ('Cuerpo de la mandíbula', 72, 85, H), ('Piezas dentarias', 69, 73, 'Arcadas superior e inferior.'),
    ('Columna cervical alta (C2–C3)', 47, 84, 'Axis y vértebras superiores.')]),
  ('rx_cerv_lat', 'Columna cervical — lateral', None, [
    ('Axis (C2) y apófisis odontoides', 48, 28, 'La odontoides articula con el arco anterior del atlas (intervalo atlantoodontoideo < 3 mm en adultos).'),
    ('Apófisis espinosa de C2', 62, 30, 'La mayor de las espinosas cervicales altas.'),
    ('Cuerpo vertebral cervical medio (C4)', 54, 46, 'Alineación por las líneas vertebral anterior, posterior y espinolaminar.'),
    ('Espacio discal intervertebral', 54, 42, 'Altura conservada; pinzamiento en discopatía.'),
    ('Macizo articular / facetas', 59, 46, 'Superposición en “tejas”.'),
    ('Cuerpo vertebral C7', 56, 64, 'Debe incluirse la unión cervicotorácica.'),
    ('Tejidos blandos prevertebrales', 40, 47, 'Grosor < 7 mm a nivel de C2 y < 22 mm a nivel de C6.'),
    ('Vía aérea (laringe y tráquea)', 35, 56, 'Columna aérea anterior a la columna.'),
    ('Mandíbula', 18, 40, H), ('Hueso occipital', 70, 15, 'Base del cráneo.')]),
  ('rx_cerv_ap', 'Columna cervical — anteroposterior', None, [
    ('Apófisis espinosas (línea media)', 51, 58, 'Alineadas en la línea media; desviación indica rotación o luxación facetaria.'),
    ('Cuerpos vertebrales cervicales', 45, 50, 'Superposición de cuerpos y apófisis unciformes.'),
    ('Articulaciones uncovertebrales (de Luschka)', 39, 52, 'Sitio de osteofitos que estrechan el foramen.'),
    ('Tráquea (columna aérea)', 50, 69, 'Centrada.'), ('Mandíbula', 50, 18, 'Superpuesta a C1–C2 (se ven con boca abierta).'),
    ('Clavícula', 78, 76, H), ('Clips quirúrgicos', 70, 36, 'Material de una cirugía cervical previa.')]),
  ('rx_dors_ap', 'Columna dorsal — anteroposterior', None, [
    ('Cuerpo vertebral dorsal', 50, 45, 'Cuerpos rectangulares de altura uniforme.'), ('Pedículos', 45, 44, 'Óvalos corticales; su ausencia sugiere lesión lítica (signo del guiño).'),
    ('Apófisis espinosa', 51, 48, 'Línea media.'), ('Arcos costales posteriores', 22, 35, 'Articulan con cuerpos y apófisis transversas.'),
    ('Clavícula', 25, 15, H), ('Tráquea', 49, 22, 'Columna aérea.'), ('Hemidiafragma derecho', 18, 70, 'Contorno diafragmático.'),
    ('Cámara gástrica', 75, 77, 'Gas gástrico.'), ('Reservorio venoso subcutáneo (port)', 85, 25, 'Dispositivo de acceso venoso con catéter hacia la vena cava superior.')]),
  ('rx_lumb_ap', 'Columna lumbar — anteroposterior', None, [
    ('Cuerpo vertebral lumbar', 45, 45, 'Altura y alineación conservadas.'), ('Pedículo', 38, 44, 'Ojos de la vértebra.'),
    ('Apófisis transversa', 31, 47, 'Las de L3 son las más largas.'), ('Apófisis espinosa', 46, 48, 'Línea media.'),
    ('Espacio discal', 45, 51, 'Altura simétrica.'), ('Cresta ilíaca (nivel L4–L5)', 84, 72, 'Reparo para contar niveles.'),
    ('Sacro', 50, 86, 'Agujeros sacros.'), ('Gas en colon', 58, 25, 'Superposición intestinal.')]),
  ('rx_lumb_lat', 'Columna lumbar — lateral', None, [
    ('Cuerpo vertebral lumbar', 40, 42, 'Bordes anterior y posterior alineados (lordosis).'), ('Espacio discal', 40, 50, 'Altura progresivamente mayor hacia caudal, excepto L5–S1.'),
    ('Platillo vertebral', 40, 57, 'Superficie cortical; nódulos de Schmorl.'), ('Pedículo', 50, 40, 'Une cuerpo y arco posterior.'),
    ('Agujero de conjunción', 52, 46, 'Paso de la raíz nerviosa.'), ('Apófisis espinosa', 62, 46, 'Arco posterior.'),
    ('Espacio discal L5–S1', 42, 70, 'Último espacio sobre el sacro.'), ('Sacro (promontorio)', 45, 80, 'Base sacra.')]),
]}
ESTUDIOS['rx-mmii'] = {'titulo': 'Radiografía de pelvis y miembro inferior', 'modalidad': 'RX', 'imagenes': [
  ('rx_pelvis', 'Pelvis — anteroposterior', None, [
    ('Cabeza femoral derecha', 30, 45, 'Esférica, congruente con el acetábulo.'), ('Cabeza femoral izquierda', 74, 47, 'Comparar con la contralateral.'),
    ('Cuello femoral derecho', 21, 50, 'Sitio de fracturas subcapitales (Garden).'), ('Trocánter mayor derecho', 12, 53, 'Inserción de glúteos medio y menor.'),
    ('Trocánter mayor izquierdo', 89, 55, 'Inserción de glúteos.'), ('Techo acetabular derecho', 28, 40, 'Ceja cotiloidea.'),
    ('Agujero obturador derecho', 40, 63, 'Simetría = pelvis sin rotación.'), ('Agujero obturador izquierdo', 61, 63, 'Simetría con el derecho.'),
    ('Sínfisis del pubis', 52, 62, 'Anchura < 5 mm.'), ('Tuberosidad isquiática derecha', 40, 72, 'Origen de los isquiotibiales.'),
    ('Sacro', 50, 28, 'Agujeros sacros y líneas arcuatas.'), ('Articulación sacroilíaca derecha', 40, 25, 'Espacio regular.'),
    ('Articulación sacroilíaca izquierda', 63, 25, 'Espacio regular.'), ('Cresta ilíaca derecha', 25, 10, 'Borde superior del ilion.'),
    ('Ala ilíaca izquierda', 76, 20, H), ('Vértebra L5', 50, 8, 'Unión lumbosacra.'), ('Flebolitos pélvicos', 64, 52, 'Calcificaciones redondas venosas, benignas.')]),
  ('rx_femur', 'Fémur izquierdo — anteroposterior', None, [
    ('Cabeza femoral', 42, 12, 'En el acetábulo.'), ('Trocánter mayor', 60, 8, 'Lateral.'), ('Trocánter menor', 45, 20, 'Medial; inserción del psoas ilíaco.'),
    ('Diáfisis femoral', 55, 60, H), ('Cortical medial', 49, 50, 'Más gruesa en el tercio medio.'), ('Canal medular', 54, 50, 'Radiolúcido central.'),
    ('Agujero obturador', 15, 12, 'Pelvis.'), ('Isquion', 25, 20, H)]),
  ('rx_rodilla_ap', 'Rodilla derecha — anteroposterior', None, [
    ('Diáfisis femoral distal', 50, 15, H), ('Cóndilo femoral lateral', 35, 47, 'Lateral en la imagen (lado del peroné).'),
    ('Cóndilo femoral medial', 65, 47, 'Más prominente.'), ('Rótula (superpuesta)', 50, 42, 'Proyectada sobre el fémur en AP.'),
    ('Interlínea femorotibial medial', 65, 55, 'Se pinza primero en la gonartrosis.'), ('Interlínea femorotibial lateral', 35, 55, 'Espacio articular.'),
    ('Espinas tibiales', 50, 54, 'Inserción de los cruzados.'), ('Meseta tibial', 50, 60, H),
    ('Cabeza del peroné', 25, 62, 'Articulación tibioperonea proximal.'), ('Diáfisis tibial', 55, 85, H), ('Diáfisis del peroné', 30, 85, H)]),
  ('rx_rodilla_lat', 'Rodilla derecha — lateral', None, [
    ('Rótula', 13, 47, 'Polo inferior a nivel de la interlínea; índice de Insall-Salvati 0.8–1.2.'), ('Diáfisis femoral', 45, 20, H),
    ('Cóndilos femorales', 45, 45, 'Superpuestos en la lateral verdadera.'), ('Meseta tibial', 45, 57, H),
    ('Tuberosidad anterior de la tibia', 30, 64, 'Inserción del tendón rotuliano.'), ('Cabeza del peroné', 62, 62, 'Posterolateral.'),
    ('Diáfisis tibial', 55, 80, H), ('Diáfisis del peroné', 78, 80, H)]),
  ('rx_tibia', 'Pierna derecha — anteroposterior (tibia y peroné)', None, [
    ('Diáfisis tibial', 50, 40, 'Hueso de carga, medial.'), ('Diáfisis del peroné', 34, 40, 'Lateral.'), ('Pilón tibial', 48, 85, 'Superficie articular distal.'),
    ('Maléolo medial', 62, 88, 'Prolongación distal de la tibia.'), ('Maléolo lateral', 32, 88, 'Extremo distal del peroné (Weber).'),
    ('Astrágalo', 48, 94, 'Mortaja tibioperonea.'), ('Sindesmosis tibioperonea', 38, 82, 'Espacio claro < 6 mm.')]),
]}
ESTUDIOS['rx-mmss'] = {'titulo': 'Radiografía de miembro superior', 'modalidad': 'RX', 'imagenes': [
  ('rx_hombro', 'Hombro izquierdo — anteroposterior', None, [
    ('Cabeza humeral', 75, 45, 'Congruente con la glena.'), ('Troquíter (tuberosidad mayor)', 84, 45, 'Inserción del supraespinoso.'),
    ('Articulación glenohumeral', 66, 47, 'Espacio regular.'), ('Acromion', 78, 34, 'Distancia acromiohumeral normal 7–14 mm.'),
    ('Articulación acromioclavicular', 72, 32, 'Anchura < 8 mm.'), ('Clavícula', 55, 26, H), ('Apófisis coracoides', 55, 37, 'Anterior a la glena.'),
    ('Cuerpo de la escápula', 56, 62, H), ('Cuello quirúrgico del húmero', 73, 58, 'Sitio frecuente de fractura.'),
    ('Diáfisis humeral', 77, 82, H), ('Arcos costales', 35, 55, 'Pared torácica.')]),
  ('rx_humero', 'Húmero izquierdo — anteroposterior', None, [
    ('Cabeza humeral', 36, 12, H), ('Apófisis coracoides (axial)', 27, 10, 'Vista de frente como anillo.'),
    ('Acromion', 35, 3, H), ('Clavícula', 15, 5, H), ('Diáfisis humeral', 55, 45, 'Surco del nervio radial en el tercio medio.'),
    ('Paleta humeral / codo', 80, 85, 'Epicóndilos y fosa olecraniana.'), ('Arcos costales', 15, 32, 'Pared torácica.')]),
  ('rx_codo', 'Codo derecho — anteroposterior y lateral', None, [
    ('Húmero distal (AP)', 20, 25, H), ('Epicóndilo lateral (AP)', 12, 47, 'Origen de los extensores.'), ('Epitróclea (AP)', 29, 47, 'Origen de los flexores; nervio cubital detrás.'),
    ('Interlínea articular (AP)', 20, 55, 'Humerorradial y humerocubital.'), ('Cabeza del radio (AP)', 14, 58, 'Lateral.'),
    ('Cúbito proximal (AP)', 22, 63, H), ('Olécranon (lateral)', 66, 57, 'Sitio de bursitis y fracturas.'),
    ('Tróclea y escotadura troclear (lateral)', 72, 52, 'Congruencia articular.'), ('Diáfisis humeral (lateral)', 73, 25, H), ('Antebrazo (lateral)', 85, 58, 'Radio y cúbito superpuestos.')]),
  ('rx_antebrazo', 'Antebrazo y muñeca — anteroposterior', None, [
    ('Radio (diáfisis)', 35, 45, 'Lateral, del lado del pulgar.'), ('Cúbito (diáfisis)', 45, 45, 'Medial.'),
    ('Radio distal', 22, 66, 'Fractura de Colles en esta región.'), ('Estiloides cubital', 30, 70, 'Extremo distal del cúbito.'),
    ('Huesos del carpo', 16, 74, 'Fila proximal y distal.'), ('Metacarpianos', 12, 82, H), ('Codo (olécranon)', 62, 10, 'Extremo proximal.')]),
]}
ESTUDIOS['rx-abdomen'] = {'titulo': 'Radiografía de abdomen', 'modalidad': 'RX', 'imagenes': [
  ('rx_abd3', 'Abdomen — anteroposterior (con contraste vesical excretado)', None, [
    ('Vejiga con contraste', 48, 84, 'Opacificada por contraste yodado eliminado por la orina.'), ('Colon con contenido fecal', 80, 25, 'Patrón moteado de heces y gas.'),
    ('Ángulo hepático del colon', 15, 35, 'Colon ascendente/transverso.'), ('Columna lumbar', 43, 40, H), ('Apófisis transversa', 33, 37, 'Lumbar.'),
    ('Sombra del psoas', 35, 47, 'Borde lateral visible por grasa.'), ('Ala ilíaca derecha', 20, 60, H), ('Ala ilíaca izquierda', 75, 60, H),
    ('Articulación sacroilíaca', 36, 66, 'Espacio regular.'), ('Sacro', 45, 70, H), ('Costilla', 90, 15, 'Arcos costales inferiores.')]),
  ('rx_urograma', 'Urografía — fase excretora (20 min)', None, [
    ('Pelvis renal izquierda con contraste', 73, 45, 'Sistema colector opacificado.'), ('Uréter proximal izquierdo', 65, 60, 'Trayecto paravertebral sobre el psoas.'),
    ('Riñón izquierdo (silueta)', 80, 40, 'Contorno renal.'), ('Columna lumbar', 45, 50, H), ('Sombra hepática', 20, 25, 'Hipocondrio derecho.'),
    ('Clips quirúrgicos', 40, 55, 'Material de cirugía previa.')]),
]}

for ident, est in ESTUDIOS.items():
    data = {'id': ident, 'plano': 'imagenes', 'series': {'Imagen': []}, 'lab': [], 'anc': [], 'pos': [], 'tit': [],
            'lw': 1000, 'lh': 1000, 'aspecto': 1, 'mm': 0, 'puntos': True}
    nombres = {}; nid = 0; dims = []
    for k, (archivo, tit, rec, pts) in enumerate(est['imagenes']):
        im = Image.open(f'{SRC}/{archivo}.png').convert('RGB')
        import numpy as np
        a = np.asarray(im).astype(int)
        if (np.abs(a[..., 0] - a[..., 2]) > 40).mean() < 0.002:   # sin color Doppler: guardar en grises
            pass  # se guarda siempre en RGB por compatibilidad
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
