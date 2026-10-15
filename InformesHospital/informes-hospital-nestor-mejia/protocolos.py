"""Protocolos obligatorios por estudio (orden cefálico → caudal, anterior → posterior).

Cada estructura DEBE aparecer como título (# ...) en el dictado, en este orden, aunque el doctor solo envíe
medidas y "resto normal". El generador bloquea el Word si falta alguna.
Formato de cada estructura: "TÍTULO SUGERIDO|palabra clave|alternativa|..." (claves sin tildes, minúsculas).
Una estructura se da por incluida si algún título del dictado contiene alguna de sus claves.
"""


def P(*items):
    out = []
    for it in items:
        if isinstance(it, list):
            out += it
            continue
        if isinstance(it, tuple):
            out.append(it)
            continue
        partes = it.split("|")
        out.append((partes[0], partes[1:] or [partes[0].lower()]))
    return out


# ---------------------------------------------------------------- bloques reutilizables (cefálico → caudal)
HEPATO = P("HÍGADO|higado", "SISTEMA PORTAL Y VENAS HEPÁTICAS|portal|venas hepaticas|suprahepatic",
           "VESÍCULA BILIAR|vesicula", "VÍAS BILIARES INTRA Y EXTRAHEPÁTICAS / COLÉDOCO|vias biliares|via biliar|coledoco")
PANC_BAZO = P("PÁNCREAS|pancreas", "BAZO|bazo")
SUPRARRENAL = P("GLÁNDULAS SUPRARRENALES (REGIONES)|suprarrenal|adrenal")
RIÑONES = P("RIÑÓN DERECHO|rinon derecho|rinones", "RIÑÓN IZQUIERDO|rinon izquierdo|rinones")
URETERES = P("URÉTERES|ureter")
VEJIGA = P("VEJIGA URINARIA|vejiga")
RESIDUO = P("RESIDUO POSTMICCIONAL|residuo|postmiccional")
RETRO = P("RETROPERITONEO Y GRANDES VASOS (AORTA Y VENA CAVA INFERIOR)|retroperitone|aorta|grandes vasos")
PERITONEO = P("CAVIDAD PERITONEAL, LÍQUIDO LIBRE Y ESPACIOS EXTRAPERITONEALES|peritone|liquido libre|extraperitone")
ASAS_PARED = P("ASAS INTESTINALES Y PARED ABDOMINAL|asas|intestin|pared abdominal")
UTERO = P("ÚTERO|utero", "ENDOMETRIO|endometrio", "CÉRVIX|cervix|cuello uterino")
OVARIOS = P("OVARIO DERECHO|ovario derecho|ovarios", "OVARIO IZQUIERDO|ovario izquierdo|ovarios",
            "REGIONES ANEXIALES|anex", "FONDO DE SACO / ESPACIO DE DOUGLAS|douglas|fondo de saco")
PROSTATA = P("PRÓSTATA|prostata", "VESÍCULAS SEMINALES|seminal")
PIEL_TCS = P("PIEL Y TEJIDO CELULAR SUBCUTÁNEO|piel|subcutane|celular subcut")
MUSC = P("PLANOS FASCIALES Y MUSCULARES|fasci|muscul")
OSEO_ADY = P("SUPERFICIES ÓSEAS Y CORTICALES|ose|cortical|hueso")
VASC_GANG = P("ESTRUCTURAS VASCULARES Y GANGLIONARES REGIONALES|vascular|ganglion|vasos")
ABD_COMPLETO = HEPATO + PANC_BAZO + SUPRARRENAL + RIÑONES + URETERES + RETRO + VEJIGA + PERITONEO + ASAS_PARED


def msk(*estructuras):
    return P(*PIEL_TCS, *estructuras, *P("DERRAME ARTICULAR Y SINOVIAL|derrame|sinovi|articul"),
             *P("BURSAS|bursa"), *OSEO_ADY)


def venoso(miembro):
    if miembro == "superior":
        return P("VENA YUGULAR INTERNA Y SUBCLAVIA|yugular|subclavia", "VENA AXILAR|axilar",
                 "VENA BRAQUIAL|braquial", "VENAS CEFÁLICA Y BASÍLICA|cefalica|basilica",
                 "VENAS DEL ANTEBRAZO (RADIALES Y CUBITALES)|radial|cubital|antebrazo",
                 "TEJIDOS BLANDOS|tejidos blandos|partes blandas|subcutane")
    return P("VENA FEMORAL COMÚN|femoral comun", "UNIÓN SAFENOFEMORAL Y VENA SAFENA MAYOR|safenofemoral|safena mayor|safena magna|safena interna",
             "VENA FEMORAL Y FEMORAL PROFUNDA|vena femoral|femoral profunda|femoral superficial", "VENA POPLÍTEA|poplite",
             "UNIÓN SAFENOPOPLÍTEA Y VENA SAFENA MENOR|safenopoplite|safena menor|safena externa|safena parva",
             "VENAS TIBIALES, PERONEAS Y GEMELARES|tibial|perone|gemelar|soleo|infrapoplite",
             "VENAS PERFORANTES|perforante", "TEJIDOS BLANDOS|tejidos blandos|partes blandas|subcutane")


def arterial(miembro):
    if miembro == "superior":
        return P("ARTERIA SUBCLAVIA|subclavia", "ARTERIA AXILAR|axilar", "ARTERIA BRAQUIAL|braquial",
                 "ARTERIAS RADIAL Y CUBITAL|radial|cubital", "ARCO PALMAR|palmar")
    return P("AORTA DISTAL E ILÍACAS (SI EVALUABLES)|aorta|iliaca", "ARTERIA FEMORAL COMÚN|femoral comun",
             "ARTERIA FEMORAL PROFUNDA|femoral profunda", "ARTERIA FEMORAL SUPERFICIAL|femoral superficial|arteria femoral",
             "ARTERIA POPLÍTEA|poplite", "ARTERIAS TIBIAL ANTERIOR, TIBIAL POSTERIOR Y PERONEA|tibial|perone|infrapoplite|distal",
             "ARTERIA PEDIA|pedia|dorsal del pie")


CUELLO_BASE = P("GLÁNDULAS PARÓTIDAS|parotid", "GLÁNDULAS SUBMANDIBULARES|submandibular|submaxilar",
                "LÓBULO TIROIDEO DERECHO|lobulo derecho|tiroides", "ISTMO TIROIDEO|istmo",
                "LÓBULO TIROIDEO IZQUIERDO|lobulo izquierdo|tiroides", "GLÁNDULAS PARATIROIDES (REGIONES)|paratiroid",
                "CADENAS GANGLIONARES CERVICALES (NIVELES I–VI)|ganglion|adenopat|linfat",
                "ESTRUCTURAS VASCULARES DEL CUELLO|vascular|carotid|yugular",
                "TEJIDOS BLANDOS Y MUSCULATURA CERVICAL|tejidos blandos|partes blandas|muscul")

PROTOCOLOS = {
    # ================================================= ULTRASONIDO CONVEXO
    "abdominal": ABD_COMPLETO,
    "abdomen_superior": HEPATO + PANC_BAZO + SUPRARRENAL + RIÑONES + RETRO + PERITONEO,
    "hepatobiliar": HEPATO + PANC_BAZO + PERITONEO,
    "renal": RIÑONES + URETERES + P("RETROPERITONEO Y ESPACIOS PERIRRENALES|retroperitone|perirrenal") + VEJIGA + RESIDUO,
    "renal_prostata": RIÑONES + URETERES + VEJIGA + PROSTATA + RESIDUO,
    "pelvico_femenino": VEJIGA + UTERO + OVARIOS + P("CAVIDAD PERITONEAL PÉLVICA|peritone|liquido libre"),
    "pelvico_masculino": VEJIGA + PROSTATA + RESIDUO + P("CAVIDAD PERITONEAL PÉLVICA|peritone|liquido libre"),
    "general_femenino": ABD_COMPLETO + UTERO + OVARIOS,
    "general_masculino": ABD_COMPLETO + PROSTATA + RESIDUO,
    "apendicular": P("FOSA ILÍACA DERECHA Y APÉNDICE CECAL|apendice|fosa iliaca derecha",
                     "CIEGO E ÍLEON TERMINAL|ciego|ileon", "GRASA MESENTÉRICA Y GANGLIOS|mesenter|ganglion|grasa",
                     "LÍQUIDO LIBRE Y COLECCIONES|liquido libre|coleccion|peritone") + RIÑONES[:1] + VEJIGA,
    "pared_abdominal": PIEL_TCS + P("PLANO APONEURÓTICO Y LÍNEA ALBA|aponeur|linea alba",
                                    "MÚSCULOS RECTOS Y OBLICUOS|muscul|recto", "ORIFICIOS HERNIARIOS Y DEFECTOS PARIETALES|hernia|defecto|orificio",
                                    "CONTENIDO Y MANIOBRA DE VALSALVA|contenido|valsalva|reductib"),
    "fast": P("ESPACIO HEPATORRENAL (MORISON)|morison|hepatorrenal", "ESPACIO ESPLENORRENAL|esplenorrenal|periesplen",
              "PELVIS / FONDO DE SACO|pelvi|douglas|fondo de saco|retrovesical", "VENTANA SUBXIFOIDEA / PERICARDIO|pericard|subxifoide",
              "ESPACIOS PLEURALES|pleura"),
    "toracico": P("PARED TORÁCICA|pared", "ESPACIO PLEURAL DERECHO|pleural derecho|hemitorax derecho|pleura",
                  "ESPACIO PLEURAL IZQUIERDO|pleural izquierdo|hemitorax izquierdo|pleura",
                  "DESLIZAMIENTO PLEURAL Y LÍNEAS PULMONARES|deslizamiento|lineas|pulmon", "DIAFRAGMA|diafragma"),
    "doppler_portal": HEPATO[:1] + P("VENA PORTA (CALIBRE, VELOCIDAD, DIRECCIÓN)|porta", "VENAS HEPÁTICAS|venas hepaticas|suprahepatic",
                                     "ARTERIA HEPÁTICA|arteria hepatica", "VENA ESPLÉNICA Y MESENTÉRICA SUPERIOR|esplenica|mesenterica",
                                     "CIRCULACIÓN COLATERAL Y SIGNOS DE HIPERTENSIÓN PORTAL|colateral|hipertension"),
    "doppler_renal": P("AORTA ABDOMINAL (VPS DE REFERENCIA)|aorta", "ARTERIA RENAL DERECHA|arteria renal derecha|arterias renales",
                       "ARTERIA RENAL IZQUIERDA|arteria renal izquierda|arterias renales",
                       "ARTERIAS INTRARRENALES (IR, TIEMPO DE ACELERACIÓN)|intrarrenal|segmentaria|interlobar",
                       "VENAS RENALES|vena renal|venas renales") + RIÑONES,
    "doppler_aorta": P("AORTA ABDOMINAL PROXIMAL|aorta proximal|aorta", "AORTA ABDOMINAL MEDIA Y DISTAL|aorta media|aorta distal|aorta",
                       "BIFURCACIÓN E ILÍACAS COMUNES|bifurcacion|iliaca", "VENA CAVA INFERIOR|cava"),
    "obstetrico_1t": P("ÚTERO Y LOCALIZACIÓN DE LA GESTACIÓN|utero|localizacion", "SACO GESTACIONAL|saco gestacional",
                       "VESÍCULA VITELINA|vitelin", "EMBRIÓN, LCC Y ACTIVIDAD CARDÍACA|embrion|lcc|cardiac",
                       "TROFOBLASTO / CORION Y HEMATOMAS|trofoblast|corion|placenta|hematoma", "CÉRVIX|cervix|cuello",
                       "OVARIOS Y ANEXOS|ovario|anex", "FONDO DE SACO|douglas|fondo de saco|liquido libre"),
    "obstetrico": P("NÚMERO DE FETOS, VITALIDAD Y ESTÁTICA FETAL|vitalidad|estatica|feto|presentacion",
                    "BIOMETRÍA FETAL Y PESO FETAL ESTIMADO|biometr|peso fetal|pfe",
                    "ANATOMÍA FETAL: CRÁNEO Y SNC|craneo|snc|cerebr", "ANATOMÍA FETAL: CARA Y CUELLO|cara|perfil|labio",
                    "ANATOMÍA FETAL: TÓRAX Y CORAZÓN|torax|corazon|cardiac", "ANATOMÍA FETAL: ABDOMEN, ESTÓMAGO, RIÑONES Y VEJIGA|abdomen|estomago|rinones",
                    "ANATOMÍA FETAL: COLUMNA|columna", "ANATOMÍA FETAL: EXTREMIDADES|extremidad",
                    "PLACENTA|placenta", "CORDÓN UMBILICAL|cordon", "LÍQUIDO AMNIÓTICO|liquido amniotico|ila", "CÉRVIX|cervix|cuello"),
    "obstetrico_gemelar": P("CORIONICIDAD Y AMNIONICIDAD|corion|amnio", "FETO A|feto a|gemelo a|feto 1",
                            "FETO B|feto b|gemelo b|feto 2", "PLACENTA(S)|placenta", "LÍQUIDO AMNIÓTICO POR SACO|liquido amniotico|bolsillo",
                            "CORDONES UMBILICALES|cordon", "DISCORDANCIA DE PESO|discordancia|peso", "CÉRVIX|cervix|cuello"),
    "perfil_biofisico": P("MOVIMIENTOS RESPIRATORIOS|respirator", "MOVIMIENTOS CORPORALES|corporal|movimiento",
                          "TONO FETAL|tono", "LÍQUIDO AMNIÓTICO|liquido amniotico|ila|bolsillo", "PUNTUACIÓN TOTAL|puntuacion|total"),
    "doppler_obstetrico": P("ARTERIA UMBILICAL|umbilical", "ARTERIA CEREBRAL MEDIA|cerebral media",
                            "ÍNDICE CEREBROPLACENTARIO|cerebroplacentario|icp", "ARTERIAS UTERINAS|uterina",
                            "DUCTUS VENOSO|ductus"),
    "transfontanelar": P("PARÉNQUIMA CEREBRAL Y ECOGENICIDAD PERIVENTRICULAR|parenquima|periventricular|sustancia blanca",
                         "SISTEMA VENTRICULAR|ventricul", "PLEXOS COROIDEOS Y MATRIZ GERMINAL|coroide|germinal|talamocaudad",
                         "LÍNEA MEDIA, CUERPO CALLOSO Y CAVUM|linea media|calloso|septum|cavum",
                         "FOSA POSTERIOR Y CEREBELO|fosa posterior|cerebel|cisterna magna",
                         "ESPACIOS EXTRAAXIALES|extraaxial|subaracnoide|extra-axial", "DOPPLER (IR ARTERIAS CEREBRALES)|doppler|indice|ir"),
    "cadera_pediatrica": P("CADERA DERECHA (GRAF: ÁNGULOS ALFA Y BETA)|cadera derecha|caderas",
                           "CADERA IZQUIERDA (GRAF: ÁNGULOS ALFA Y BETA)|cadera izquierda|caderas",
                           "COBERTURA CEFÁLICA Y ESTABILIDAD DINÁMICA|cobertura|estabilidad|dinamic"),
    "piloro": P("CANAL PILÓRICO (LONGITUD)|canal|piloro", "GROSOR MUSCULAR PILÓRICO|grosor|muscul",
                "VACIAMIENTO GÁSTRICO|vaciamiento|estomago|paso"),
    "invaginacion": P("CUADRANTES ABDOMINALES (RASTREO)|cuadrante|rastreo", "ASAS INTESTINALES|asas|intestin|invagin|diana",
                      "GANGLIOS MESENTÉRICOS|ganglion|mesenter", "LÍQUIDO LIBRE|liquido libre|peritone"),
    # ================================================= ULTRASONIDO LINEAL
    "tiroides": CUELLO_BASE,
    "cuello": CUELLO_BASE,
    "glandulas_salivales": P("GLÁNDULA PARÓTIDA DERECHA|parotida derecha|parotidas", "GLÁNDULA PARÓTIDA IZQUIERDA|parotida izquierda|parotidas",
                             "GLÁNDULA SUBMANDIBULAR DERECHA|submandibular derecha|submandibulares",
                             "GLÁNDULA SUBMANDIBULAR IZQUIERDA|submandibular izquierda|submandibulares",
                             "CONDUCTOS EXCRETORES|conducto|stenon|wharton", "GANGLIOS INTRA Y PERIGLANDULARES|ganglion|adenopat"),
    "mama": P("MAMA DERECHA (CUADRANTES)|mama derecha|mamas", "MAMA IZQUIERDA (CUADRANTES)|mama izquierda|mamas",
              "PIEL Y COMPLEJO AREOLA-PEZÓN|piel|areola|pezon", "REGIONES RETROAREOLARES Y CONDUCTOS|retroareolar|conduct",
              "PATRÓN TISULAR Y LIGAMENTOS DE COOPER|patron|cooper|tejido", "REGIÓN AXILAR DERECHA|axila derecha|axilar derech|axilas|axilares",
              "REGIÓN AXILAR IZQUIERDA|axila izquierda|axilar izquierd|axilas|axilares"),
    "testicular": P("PIEL, TCS Y TÚNICAS ESCROTALES|piel|tunica|bolsa|escrot", "TESTÍCULO DERECHO|testiculo derecho|testiculos",
                    "EPIDÍDIMO DERECHO|epididimo derecho|epididimos", "TESTÍCULO IZQUIERDO|testiculo izquierdo|testiculos",
                    "EPIDÍDIMO IZQUIERDO|epididimo izquierdo|epididimos",
                    "PLEXOS PAMPINIFORMES Y CORDONES (REPOSO Y VALSALVA)|pampiniforme|cordon|varicocele",
                    "CONDUCTOS INGUINALES|inguinal"),
    "inguinal": PIEL_TCS + P("CONDUCTO INGUINAL DERECHO|inguinal derech|inguinales", "CONDUCTO INGUINAL IZQUIERDO|inguinal izquierd|inguinales",
                             "REGIONES FEMORALES|femoral", "MANIOBRA DE VALSALVA Y CONTENIDO|valsalva|contenido|hernia",
                             "GANGLIOS INGUINALES|ganglion|adenopat"),
    "partes_blandas": PIEL_TCS + MUSC + P("LESIÓN / REGIÓN DE INTERÉS|lesion|region|masa|coleccion|lipoma|hernia|quiste|nodulo") + VASC_GANG + OSEO_ADY,
    "ganglios": P("REGIÓN EXPLORADA|region|cadena", "GANGLIOS (MORFOLOGÍA, HILIO, CORTEZA, DOPPLER)|ganglion|adenopat",
                  "TEJIDOS BLANDOS ADYACENTES|tejidos blandos|partes blandas"),
    "ocular": P("GLOBO OCULAR DERECHO|ojo derecho|globo ocular derecho|globos", "GLOBO OCULAR IZQUIERDO|ojo izquierdo|globo ocular izquierdo|globos",
                "CRISTALINO|cristalino", "CÁMARA VÍTREA|vitre", "RETINA Y COROIDES|retina|coroide",
                "NERVIO ÓPTICO Y DIÁMETRO DE VAINA|nervio optico|vaina"),
    "hombro": msk("TENDÓN DE LA PORCIÓN LARGA DEL BÍCEPS|biceps", "TENDÓN SUBESCAPULAR|subescapular",
                  "TENDÓN SUPRAESPINOSO|supraespinoso", "TENDÓN INFRAESPINOSO|infraespinoso", "TENDÓN REDONDO MENOR|redondo",
                  "ARTICULACIÓN ACROMIOCLAVICULAR|acromioclavicular", "INTERVALO ROTADOR Y PRUEBA DINÁMICA|intervalo|dinamic|pinzamiento"),
    "codo": msk("COMPARTIMENTO ANTERIOR: TENDÓN DEL BÍCEPS DISTAL Y BRAQUIAL|biceps|braquial|anterior",
                "COMPARTIMENTO LATERAL: TENDÓN EXTENSOR COMÚN|extensor|epicondil|lateral",
                "COMPARTIMENTO MEDIAL: TENDÓN FLEXOR COMÚN|flexor|epitroclea|medial",
                "COMPARTIMENTO POSTERIOR: TRÍCEPS Y OLÉCRANON|triceps|olecran|posterior", "NERVIO CUBITAL|cubital|nervio"),
    "muneca_mano": msk("TENDONES FLEXORES|flexor", "TENDONES EXTENSORES (COMPARTIMENTOS I–VI)|extensor|compartimento",
                       "NERVIO MEDIANO Y TÚNEL CARPIANO|mediano|carpiano|tunel", "CANAL DE GUYON Y NERVIO CUBITAL|guyon|cubital",
                       "ARTICULACIONES RADIOCARPIANA E INTERCARPIANAS|radiocarp|intercarp|articul"),
    "cadera": msk("ARTICULACIÓN COXOFEMORAL Y RECESO ANTERIOR|coxofemoral|receso|anterior", "MÚSCULO PSOAS ILÍACO|psoas",
                  "TENDONES GLÚTEOS (MEDIO Y MENOR)|gluteo", "TROCÁNTER MAYOR|trocanter", "MÚSCULOS ADUCTORES E ISQUIOTIBIALES PROXIMALES|aductor|isquiotibial"),
    "rodilla": msk("TENDÓN CUADRICIPITAL|cuadricipital", "TENDÓN ROTULIANO|rotuliano|patelar", "RECESO SUPRARROTULIANO|suprarrotuliano|suprapatelar",
                   "LIGAMENTO COLATERAL MEDIAL|colateral medial|lcm", "MENISCO MEDIAL (CUERNO PERIFÉRICO)|menisco medial|meniscos",
                   "LIGAMENTO COLATERAL LATERAL Y CINTILLA ILIOTIBIAL|colateral lateral|lcl|iliotibial",
                   "MENISCO LATERAL (CUERNO PERIFÉRICO)|menisco lateral|meniscos", "FOSA POPLÍTEA Y QUISTE DE BAKER|poplite|baker",
                   "PATA DE GANSO|pata de ganso|anserina"),
    "tobillo_pie": msk("TENDONES ANTERIORES (TIBIAL ANTERIOR, EXTENSORES)|tibial anterior|extensor|anterior",
                       "TENDONES MEDIALES (TIBIAL POSTERIOR, FLEXORES)|tibial posterior|flexor|medial",
                       "TENDONES PERONEOS|perone", "TENDÓN DE AQUILES|aquiles|calcaneo",
                       "LIGAMENTOS LATERALES (PAA, PC)|ligament|peroneoastragal|lateral", "FASCIA PLANTAR|fascia plantar|plantar"),
    "aquiles": msk("TENDÓN DE AQUILES: UNIÓN MIOTENDINOSA|miotendinos|aquiles", "TENDÓN DE AQUILES: PORCIÓN MEDIA|porcion media|aquiles",
                   "TENDÓN DE AQUILES: INSERCIÓN CALCÁNEA|insercion|calcane", "GRASA DE KAGER|kager"),
    "muscular": PIEL_TCS + P("MÚSCULO(S) EXPLORADO(S): ARQUITECTURA FIBRILAR|muscul|fibril",
                             "UNIONES MIOTENDINOSAS Y FASCIAS|miotendin|fascia", "LESIÓN / COLECCIÓN|lesion|coleccion|hematoma|desgarro") + VASC_GANG,
    "doppler_venoso_mmii": venoso("inferior"),
    "doppler_venoso_mmss": venoso("superior"),
    "insuficiencia_venosa": venoso("inferior") + P("REFLUJO (VALSALVA Y COMPRESIÓN DISTAL)|reflujo|valsalva", "CLASIFICACIÓN CEAP|ceap"),
    "doppler_arterial_mmii": arterial("inferior"),
    "doppler_arterial_mmss": arterial("superior"),
    "doppler_carotideo": P("ARTERIA CARÓTIDA COMÚN DERECHA|carotida comun derecha|carotidas",
                           "BULBO Y CARÓTIDAS INTERNA Y EXTERNA DERECHAS|carotida interna derecha|bulbo derecho|carotidas",
                           "ARTERIA VERTEBRAL DERECHA|vertebral derecha|vertebrales",
                           "ARTERIA CARÓTIDA COMÚN IZQUIERDA|carotida comun izquierda|carotidas",
                           "BULBO Y CARÓTIDAS INTERNA Y EXTERNA IZQUIERDAS|carotida interna izquierda|bulbo izquierdo|carotidas",
                           "ARTERIA VERTEBRAL IZQUIERDA|vertebral izquierda|vertebrales", "COMPLEJO ÍNTIMA-MEDIA Y PLACAS|intima|placa"),
    "fistula_av": P("ARTERIA AFERENTE|aferente|arteria", "ANASTOMOSIS|anastomosis", "VENA EFERENTE / DE DRENAJE|eferente|vena|drenaje",
                    "FLUJO DE ACCESO (ML/MIN)|flujo|volumen", "ESTENOSIS, TROMBOSIS Y COLECCIONES|estenosis|trombo|coleccion"),
    "doppler_peneano": P("CUERPOS CAVERNOSOS|cavernoso", "CUERPO ESPONJOSO Y URETRA|esponjoso|uretra", "TÚNICA ALBUGÍNEA|albuginea|placa",
                         "ARTERIAS CAVERNOSAS (VPS, VFD, IR)|arteria cavernosa|arterias", "VENA DORSAL PROFUNDA|vena dorsal|venoso"),
    # ================================================= ENDOCAVITARIO
    "transvaginal": UTERO + P("CAVIDAD ENDOMETRIAL, DIU Y NICHO DE CESÁREA|cavidad|diu|nicho|cesarea") + OVARIOS,
    "folicular": UTERO[:2] + P("OVARIO DERECHO: RECUENTO Y DIÁMETRO FOLICULAR|ovario derecho|ovarios",
                               "OVARIO IZQUIERDO: RECUENTO Y DIÁMETRO FOLICULAR|ovario izquierdo|ovarios",
                               "LÍQUIDO LIBRE|liquido libre|douglas|fondo de saco"),
    "embarazo_temprano_tv": P("ÚTERO Y LOCALIZACIÓN DE LA GESTACIÓN|utero|localizacion", "SACO GESTACIONAL|saco gestacional",
                              "VESÍCULA VITELINA|vitelin", "EMBRIÓN, LCC Y ACTIVIDAD CARDÍACA|embrion|lcc|cardiac",
                              "CÉRVIX|cervix", "OVARIOS Y CUERPO LÚTEO|ovario|luteo", "ANEXOS (DESCARTE DE ECTÓPICO)|anex|ectopic",
                              "FONDO DE SACO|douglas|fondo de saco|liquido libre"),
    "cervicometria": P("LONGITUD CERVICAL|longitud", "ORIFICIO CERVICAL INTERNO Y EMBUDO|orificio|embudo|funnel",
                       "ORIFICIO CERVICAL EXTERNO|externo", "SLUDGE AMNIÓTICO|sludge|barro", "PRESENTACIÓN Y PLACENTA|presentacion|placenta"),
    "transrectal": P("PRÓSTATA: ZONA PERIFÉRICA|periferica|prostata", "PRÓSTATA: ZONA DE TRANSICIÓN Y CENTRAL|transicion|central|prostata",
                     "CÁPSULA PROSTÁTICA|capsula", "VESÍCULAS SEMINALES|seminal", "CONDUCTOS DEFERENTES Y EYACULADORES|deferente|eyaculador",
                     "VEJIGA (BASE)|vejiga", "VOLUMEN Y PESO PROSTÁTICO|volumen|peso"),
    # ================================================= RADIOLOGÍA CONVENCIONAL
    "rx_torax": P("CALIDAD TÉCNICA|tecnica|calidad", "PARTES BLANDAS Y ESTRUCTURAS ÓSEAS|partes blandas|ose|hueso",
                  "TRÁQUEA Y MEDIASTINO|traquea|mediastin", "SILUETA CARDÍACA (ÍNDICE CARDIOTORÁCICO)|cardi|silueta",
                  "HILIOS PULMONARES|hilio", "PARÉNQUIMA PULMONAR POR CAMPOS|parenquima|pulmon", "PLEURA Y SENOS COSTOFRÉNICOS|pleura|costofrenic",
                  "DIAFRAGMA Y ABDOMEN SUPERIOR VISIBLE|diafragma", "DISPOSITIVOS Y CATÉTERES|dispositivo|cateter|sonda|tubo"),
    "rx_abdomen": P("CALIDAD TÉCNICA Y PROYECCIONES|tecnica|proyeccion", "PATRÓN GASEOSO INTESTINAL|gas|patron",
                    "NIVELES HIDROAÉREOS|nivel", "AIRE LIBRE / NEUMOPERITONEO|neumoperitone|aire libre",
                    "SOMBRAS DE ÓRGANOS SÓLIDOS Y PSOAS|psoas|sombra|visceromegal", "CALCIFICACIONES Y CUERPOS EXTRAÑOS|calcificacion|cuerpo extrano|litiasis",
                    "ESTRUCTURAS ÓSEAS|ose|hueso|columna|pelvis"),
    "rx_columna": P("CALIDAD TÉCNICA Y PROYECCIONES|tecnica|proyeccion", "ALINEACIÓN Y CURVATURAS|alineacion|curvatura|lordosis|cifosis|escoliosis",
                    "CUERPOS VERTEBRALES|cuerpos vertebrales|vertebra", "ESPACIOS INTERVERTEBRALES|espacio|disco",
                    "ELEMENTOS POSTERIORES Y FACETAS|posterior|facet|pediculo|apofisis", "TEJIDOS BLANDOS PREVERTEBRALES Y PARAVERTEBRALES|tejidos blandos|partes blandas|prevertebral|paravertebral"),
    "rx_osea": P("CALIDAD TÉCNICA Y PROYECCIONES|tecnica|proyeccion", "ALINEACIÓN|alineacion",
                 "ESTRUCTURAS ÓSEAS, CORTICAL Y TRABECULADO|ose|cortical|trabecul|hueso", "ARTICULACIONES Y ESPACIOS ARTICULARES|articul",
                 "TEJIDOS BLANDOS|tejidos blandos|partes blandas"),
    "rx_craneo_senos": P("CALIDAD TÉCNICA Y PROYECCIONES|tecnica|proyeccion", "BÓVEDA CRANEAL|boveda|calota|craneo",
                         "SENOS FRONTALES|frontal", "CELDAS ETMOIDALES|etmoid", "SENOS MAXILARES|maxilar", "SENO ESFENOIDAL|esfenoid",
                         "TABIQUE NASAL Y CORNETES|tabique|cornete", "TEJIDOS BLANDOS|tejidos blandos|partes blandas|adenoide"),
    "mamografia": P("COMPOSICIÓN MAMARIA (ACR A–D)|composicion|densidad|acr", "MAMA DERECHA (CC Y MLO)|mama derecha|mamas",
                    "MAMA IZQUIERDA (CC Y MLO)|mama izquierda|mamas", "CALCIFICACIONES|calcificacion",
                    "PIEL Y COMPLEJO AREOLA-PEZÓN|piel|areola|pezon", "REGIONES AXILARES|axil"),
    # ================================================= TOMOGRAFÍA
    "tc_craneo": P("TEJIDOS BLANDOS EPICRANEALES|tejidos blandos|epicraneal|partes blandas", "CALOTA Y BASE DE CRÁNEO|calota|base de craneo|ose",
                   "ESPACIOS EXTRAAXIALES|extraaxial|subaracnoide|extra-axial|subdural|epidural",
                   "PARÉNQUIMA CEREBRAL (SUSTANCIA GRIS Y BLANCA)|parenquima|sustancia", "SISTEMA VENTRICULAR Y CISTERNAS|ventricul|cisterna",
                   "ESTRUCTURAS DE LÍNEA MEDIA|linea media", "FOSA POSTERIOR, TRONCO Y CEREBELO|fosa posterior|tronco|cerebel",
                   "ÓRBITAS, SENOS PARANASALES Y MASTOIDES|orbita|senos|mastoid"),
    "tc_senos": P("SENOS FRONTALES|frontal", "CELDAS ETMOIDALES ANTERIORES Y POSTERIORES|etmoid", "SENOS MAXILARES|maxilar",
                  "COMPLEJOS OSTEOMEATALES|osteomeatal", "SENO ESFENOIDAL Y RECESO ESFENOETMOIDAL|esfenoid",
                  "FOSAS NASALES, TABIQUE Y CORNETES|tabique|cornete|fosas nasales", "VARIANTES ANATÓMICAS|variante|keros|onodi|haller",
                  "ÓRBITAS Y BASE DE CRÁNEO|orbita|base de craneo"),
    "tc_cuello": P("NASOFARINGE|nasofaring", "OROFARINGE Y CAVIDAD ORAL|orofaring|cavidad oral", "GLÁNDULAS PARÓTIDAS Y SUBMANDIBULARES|parotid|submandibular",
                   "HIPOFARINGE Y LARINGE|hipofaring|laring", "GLÁNDULA TIROIDES|tiroides", "GANGLIOS CERVICALES (NIVELES I–VI)|ganglion|adenopat",
                   "ESTRUCTURAS VASCULARES|vascular|carotid|yugular", "ESPACIOS PROFUNDOS DEL CUELLO|espacio|parafaring|retrofaring",
                   "COLUMNA CERVICAL Y ÁPICES PULMONARES|columna|vertebra|apice|ose"),
    "tc_torax": P("TIROIDES Y BASE DEL CUELLO|tiroides|base del cuello", "PARED TORÁCICA Y AXILAS|pared|axil",
                  "MEDIASTINO Y GANGLIOS|mediastin|ganglion|adenopat", "CORAZÓN, PERICARDIO Y GRANDES VASOS|corazon|pericardi|aorta|pulmonar|grandes vasos",
                  "VÍA AÉREA|via aerea|traquea|bronqu", "PARÉNQUIMA PULMONAR POR LÓBULOS|parenquima|pulmon|lobulo", "PLEURA|pleura",
                  "ESTRUCTURAS ÓSEAS|ose|hueso|columna|costill", "ABDOMEN SUPERIOR INCLUIDO|abdomen superior|higado|suprarrenal"),
    "angiotc_toracica": P("ARTERIAS PULMONARES (TRONCO, PRINCIPALES, LOBARES, SEGMENTARIAS)|arteria pulmonar|arterias pulmonares|tep|embol",
                          "CAVIDADES CARDÍACAS Y RELACIÓN VD/VI|ventricul|vd|cavidades|corazon", "AORTA TORÁCICA|aorta",
                          "PARÉNQUIMA PULMONAR|parenquima|pulmon", "PLEURA Y PERICARDIO|pleura|pericardi", "MEDIASTINO|mediastin",
                          "ESTRUCTURAS ÓSEAS|ose|hueso"),
    "tc_abdomen_pelvis": P("BASES PULMONARES|bases pulmonares|pulmon") + HEPATO + PANC_BAZO + SUPRARRENAL + RIÑONES + URETERES
                         + P("ESTÓMAGO, INTESTINO DELGADO, COLON Y APÉNDICE|estomago|intestin|colon|apendice|asas") + RETRO
                         + P("GANGLIOS ABDOMINOPÉLVICOS|ganglion|adenopat") + VEJIGA
                         + P("ÓRGANOS PÉLVICOS|utero|prostata|pelvi|ovario") + PERITONEO
                         + P("PARED ABDOMINAL Y ESTRUCTURAS ÓSEAS|pared|ose"),
    "urotc": RIÑONES + P("SISTEMAS PIELOCALICIALES (FASE EXCRETORA)|pielocalicial|excretor|calic") + URETERES + VEJIGA
             + P("LITIASIS (LOCALIZACIÓN, TAMAÑO, UH)|litiasis|calculo") + RETRO + PERITONEO,
    "tc_columna": P("ALINEACIÓN|alineacion|curvatura", "CUERPOS VERTEBRALES|cuerpos vertebrales|vertebra",
                    "DISCOS INTERVERTEBRALES (NIVEL POR NIVEL)|disco", "CANAL RAQUÍDEO Y FORÁMENES|canal|foram",
                    "ELEMENTOS POSTERIORES Y FACETAS|posterior|facet", "PARTES BLANDAS PARAVERTEBRALES|paravertebral|partes blandas|tejidos blandos"),
    # ================================================= RESONANCIA MAGNÉTICA
    "rm_cerebro": P("CALOTA Y TEJIDOS BLANDOS|calota|tejidos blandos|ose", "ESPACIOS EXTRAAXIALES|extraaxial|subaracnoide|extra-axial",
                    "PARÉNQUIMA CEREBRAL (SUSTANCIA GRIS Y BLANCA)|parenquima|sustancia", "DIFUSIÓN (DWI/ADC)|difusion|dwi|adc",
                    "SISTEMA VENTRICULAR|ventricul", "LÍNEA MEDIA, SILLA TURCA E HIPÓFISIS|linea media|hipofis|silla",
                    "FOSA POSTERIOR, TRONCO Y CEREBELO|fosa posterior|tronco|cerebel",
                    "ESTRUCTURAS VASCULARES Y SENOS VENOSOS|vascular|flujo|senos venosos",
                    "ÓRBITAS, SENOS PARANASALES Y MASTOIDES|orbita|senos paranasales|mastoid"),
    "rm_hipofisis": P("ADENOHIPÓFISIS|adenohipofis|hipofisis", "NEUROHIPÓFISIS|neurohipofis", "TALLO HIPOFISARIO|tallo",
                      "SILLA TURCA|silla", "SENOS CAVERNOSOS|cavernoso", "QUIASMA ÓPTICO|quiasma", "COMPORTAMIENTO DINÁMICO CON CONTRASTE|dinamic|contraste"),
    "rm_columna": P("ALINEACIÓN Y CURVATURAS|alineacion|curvatura|lordosis|cifosis", "CUERPOS VERTEBRALES Y MÉDULA ÓSEA|cuerpos vertebrales|medula osea|vertebra",
                    "DISCOS INTERVERTEBRALES (NIVEL POR NIVEL)|disco", "CANAL RAQUÍDEO Y FORÁMENES|canal|foram",
                    "MÉDULA ESPINAL / CONO MEDULAR / RAÍCES|medula espinal|cono|raices|cola de caballo",
                    "ARTICULACIONES FACETARIAS Y LIGAMENTOS|facet|ligament", "PARTES BLANDAS PARAVERTEBRALES|paravertebral|partes blandas|tejidos blandos"),
    "rm_rodilla": P("MENISCO MEDIAL|menisco medial|meniscos", "MENISCO LATERAL|menisco lateral|meniscos",
                    "LIGAMENTO CRUZADO ANTERIOR|cruzado anterior|lca", "LIGAMENTO CRUZADO POSTERIOR|cruzado posterior|lcp",
                    "LIGAMENTOS COLATERALES|colateral", "APARATO EXTENSOR|extensor|cuadricipital|rotuliano",
                    "CARTÍLAGO ARTICULAR|cartilago", "MÉDULA ÓSEA|medula osea|edema oseo|ose", "DERRAME Y SINOVIAL|derrame|sinovi",
                    "FOSA POPLÍTEA|poplite|baker"),
    "rm_hombro": P("TENDÓN SUPRAESPINOSO|supraespinoso", "TENDÓN INFRAESPINOSO|infraespinoso", "TENDÓN SUBESCAPULAR|subescapular",
                   "TENDÓN DEL BÍCEPS|biceps", "RODETE GLENOIDEO|rodete|labrum", "CARTÍLAGO Y MÉDULA ÓSEA|cartilago|medula osea|ose",
                   "ARTICULACIÓN ACROMIOCLAVICULAR Y ARCO CORACOACROMIAL|acromioclavicular|acromi", "BURSA SUBACROMIOSUBDELTOIDEA|bursa"),
    "rm_pelvis_prostata": P("PRÓSTATA: ZONA PERIFÉRICA (PI-RADS)|periferica|prostata", "PRÓSTATA: ZONA DE TRANSICIÓN|transicion|prostata",
                            "CÁPSULA Y EXTENSIÓN EXTRAPROSTÁTICA|capsula|extraprostat", "VESÍCULAS SEMINALES|seminal",
                            "VEJIGA|vejiga", "GANGLIOS PÉLVICOS|ganglion|adenopat", "ESTRUCTURAS ÓSEAS|ose|hueso"),
    "rm_abdomen": HEPATO + PANC_BAZO + SUPRARRENAL + RIÑONES + RETRO + PERITONEO + P("ESTRUCTURAS ÓSEAS|ose|hueso"),
    "rm_mama": P("PARÉNQUIMA FIBROGLANDULAR (ACR)|fibroglandular|composicion|parenquima", "REALCE PARENQUIMATOSO DE FONDO|fondo|bpe",
                 "MAMA DERECHA|mama derecha|mamas", "MAMA IZQUIERDA|mama izquierda|mamas", "PIEL Y COMPLEJO AREOLA-PEZÓN|piel|areola|pezon",
                 "REGIONES AXILARES|axil", "PARED TORÁCICA|pared"),
}

ALIAS = {
    "abdomen": "abdominal", "abdominal_completo": "abdominal", "us_abdominal": "abdominal",
    "abdominopelvico_femenino": "general_femenino", "abdominopelvico": "general_femenino",
    "abdominopelvico_masculino": "general_masculino", "renal_vejiga": "renal", "vias_urinarias": "renal",
    "prostata": "pelvico_masculino", "pelvico": "pelvico_femenino", "ginecologico": "pelvico_femenino",
    "obstetrico_2t": "obstetrico", "obstetrico_3t": "obstetrico", "escrotal": "testicular",
    "tiroideo": "tiroides", "partes_blandas_lineal": "partes_blandas", "eco_fast": "fast", "efast": "fast",
    "pleural": "toracico", "rodilla_us": "rodilla", "hombro_us": "hombro", "venoso": "doppler_venoso_mmii",
    "arterial": "doppler_arterial_mmii", "carotideo": "doppler_carotideo", "transvaginal_gine": "transvaginal",
    "tc_abdomen": "tc_abdomen_pelvis", "angiotc_tep": "angiotc_toracica", "rm_columna_lumbar": "rm_columna",
    "rm_columna_cervical": "rm_columna", "rm_columna_dorsal": "rm_columna", "rx_extremidad": "rx_osea",
}


def _norm(t):
    import unicodedata
    t = unicodedata.normalize("NFD", t.lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn")


def faltantes(protocolo, titulos):
    """Estructuras obligatorias que no aparecen en los títulos del dictado."""
    clave = ALIAS.get(protocolo, protocolo)
    if clave not in PROTOCOLOS:
        raise SystemExit(f"@protocolo desconocido: {protocolo}. Disponibles: {', '.join(sorted(PROTOCOLOS))}")
    tt = [_norm(t) for t in titulos]
    return [nombre for nombre, claves in PROTOCOLOS[clave]
            if not any(_norm(k) in t for t in tt for k in claves)]
