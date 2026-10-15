"""Protocolos obligatorios por estudio. Cada estructura DEBE aparecer como título (# ...) en el dictado,
aunque el doctor solo envíe medidas y "resto normal". El generador bloquea el Word si falta alguna.

Formato: "clave": [("TÍTULO SUGERIDO", ["palabra clave", "alternativa", ...]), ...]
Una estructura se da por incluida si algún título del dictado contiene alguna de sus palabras clave
(sin importar mayúsculas ni tildes).
"""

_HIGADO = [
    ("HÍGADO", ["higado"]),
    ("SISTEMA PORTAL Y VENAS HEPÁTICAS", ["portal", "venas hepaticas", "suprahepatic"]),
    ("VESÍCULA BILIAR", ["vesicula biliar", "vesicula"]),
    ("VÍAS BILIARES INTRA Y EXTRAHEPÁTICAS / COLÉDOCO", ["vias biliares", "via biliar", "coledoco"]),
    ("PÁNCREAS", ["pancreas"]),
    ("BAZO", ["bazo"]),
]
_RENAL = [
    ("RIÑÓN DERECHO", ["rinon derecho", "rinones"]),
    ("RIÑÓN IZQUIERDO", ["rinon izquierdo", "rinones"]),
    ("URÉTERES", ["ureter"]),
    ("VEJIGA URINARIA", ["vejiga"]),
]
_RETRO = [
    ("GLÁNDULAS SUPRARRENALES (REGIONES)", ["suprarrenal", "adrenal"]),
    ("RETROPERITONEO Y GRANDES VASOS (AORTA Y VENA CAVA INFERIOR)", ["retroperitone", "aorta", "grandes vasos"]),
    ("CAVIDAD PERITONEAL, LÍQUIDO LIBRE Y ESPACIOS EXTRAPERITONEALES", ["peritone", "liquido libre"]),
    ("ASAS INTESTINALES Y PARED ABDOMINAL", ["asas", "intestin", "pared abdominal"]),
]
_PELVIS_F = [
    ("ÚTERO", ["utero"]),
    ("ENDOMETRIO", ["endometrio", "utero y endometrio"]),
    ("CÉRVIX", ["cervix", "cuello uterino"]),
    ("OVARIO DERECHO", ["ovario derecho", "ovarios"]),
    ("OVARIO IZQUIERDO", ["ovario izquierdo", "ovarios"]),
    ("REGIONES ANEXIALES", ["anex"]),
    ("FONDO DE SACO / ESPACIO DE DOUGLAS", ["douglas", "fondo de saco"]),
]
_PELVIS_M = [
    ("PRÓSTATA", ["prostata"]),
    ("VESÍCULAS SEMINALES", ["seminal"]),
]

PROTOCOLOS = {
    "abdominal": _HIGADO + _RENAL + _RETRO,
    "renal": _RENAL + [("RETROPERITONEO Y ESPACIOS PERIRRENALES", ["retroperitone", "perirrenal"]),
                       ("RESIDUO POSTMICCIONAL", ["residuo", "postmiccional", "vejiga"])],
    "renal_prostata": _RENAL + _PELVIS_M + [("RESIDUO POSTMICCIONAL", ["residuo", "postmiccional"])],
    "pelvico_femenino": [("VEJIGA URINARIA", ["vejiga"])] + _PELVIS_F
                        + [("CAVIDAD PERITONEAL PÉLVICA Y PARED", ["peritone", "liquido libre", "douglas"])],
    "transvaginal": _PELVIS_F + [("CICATRIZ / NICHO DE CESÁREA O DIU (SI APLICA)", ["nicho", "cesarea", "diu", "cicatriz", "cavidad"])],
    "pelvico_masculino": [("VEJIGA URINARIA", ["vejiga"])] + _PELVIS_M
                         + [("RESIDUO POSTMICCIONAL", ["residuo", "postmiccional"])],
    "general_femenino": _HIGADO + _RENAL + _RETRO + _PELVIS_F,
    "general_masculino": _HIGADO + _RENAL + _RETRO + _PELVIS_M,
    "tiroides": [
        ("LÓBULO TIROIDEO DERECHO", ["lobulo derecho", "tiroides"]),
        ("LÓBULO TIROIDEO IZQUIERDO", ["lobulo izquierdo", "tiroides"]),
        ("ISTMO", ["istmo"]),
        ("GLÁNDULAS PARATIROIDES (REGIONES)", ["paratiroid"]),
        ("GLÁNDULAS PARÓTIDAS", ["parotid"]),
        ("GLÁNDULAS SUBMANDIBULARES", ["submandibular", "submaxilar"]),
        ("CADENAS GANGLIONARES CERVICALES (NIVELES I–VI)", ["ganglion", "adenopat", "linfat"]),
        ("ESTRUCTURAS VASCULARES DEL CUELLO", ["vascular", "carotid", "yugular"]),
        ("TEJIDOS BLANDOS Y MUSCULATURA CERVICAL", ["tejidos blandos", "partes blandas", "muscul"]),
    ],
    "mama": [
        ("MAMA DERECHA", ["mama derecha", "mamas"]),
        ("MAMA IZQUIERDA", ["mama izquierda", "mamas"]),
        ("PIEL Y COMPLEJO AREOLA-PEZÓN", ["piel", "areola", "pezon"]),
        ("REGIONES RETROAREOLARES Y CONDUCTOS", ["retroareolar", "conduct"]),
        ("REGIÓN AXILAR DERECHA", ["axila derecha", "axilar derech", "axilas", "axilares"]),
        ("REGIÓN AXILAR IZQUIERDA", ["axila izquierda", "axilar izquierd", "axilas", "axilares"]),
    ],
    "testicular": [
        ("PIEL, TEJIDO CELULAR SUBCUTÁNEO Y TÚNICAS", ["piel", "tunica", "bolsa", "escrot"]),
        ("TESTÍCULO DERECHO", ["testiculo derecho", "testiculos"]),
        ("TESTÍCULO IZQUIERDO", ["testiculo izquierdo", "testiculos"]),
        ("EPIDÍDIMO DERECHO", ["epididimo derecho", "epididimos"]),
        ("EPIDÍDIMO IZQUIERDO", ["epididimo izquierdo", "epididimos"]),
        ("PLEXOS PAMPINIFORMES Y CORDONES ESPERMÁTICOS (REPOSO Y VALSALVA)", ["pampiniforme", "cordon", "varicocele"]),
        ("CONDUCTOS INGUINALES", ["inguinal"]),
    ],
    "partes_blandas": [
        ("PIEL Y TEJIDO CELULAR SUBCUTÁNEO", ["piel", "subcutane", "celular"]),
        ("PLANOS FASCIALES Y MUSCULARES", ["fasci", "muscul"]),
        ("LESIÓN / REGIÓN DE INTERÉS", ["lesion", "region", "masa", "coleccion", "lipoma", "hernia", "quiste", "nodulo"]),
        ("ESTRUCTURAS VASCULARES Y GANGLIONARES REGIONALES", ["vascular", "ganglion", "vasos"]),
        ("ESTRUCTURAS ÓSEAS Y ARTICULARES ADYACENTES", ["ose", "hueso", "cortical", "articul"]),
    ],
    "doppler_venoso_mmii": [
        ("VENA FEMORAL COMÚN", ["femoral comun"]),
        ("UNIÓN SAFENOFEMORAL Y VENA SAFENA MAYOR", ["safenofemoral", "safena mayor", "safena magna", "safena interna"]),
        ("VENA FEMORAL (SUPERFICIAL) Y FEMORAL PROFUNDA", ["vena femoral", "femoral profunda", "femoral superficial"]),
        ("VENA POPLÍTEA", ["poplite"]),
        ("UNIÓN SAFENOPOPLÍTEA Y VENA SAFENA MENOR", ["safenopoplite", "safena menor", "safena externa", "safena parva"]),
        ("VENAS TIBIALES, PERONEAS Y GEMELARES", ["tibial", "perone", "gemelar", "soleo", "infrapoplite"]),
        ("VENAS PERFORANTES", ["perforante"]),
        ("TEJIDOS BLANDOS", ["tejidos blandos", "partes blandas", "subcutane"]),
    ],
    "doppler_arterial_mmii": [
        ("ARTERIA FEMORAL COMÚN", ["femoral comun"]),
        ("ARTERIA FEMORAL PROFUNDA", ["femoral profunda"]),
        ("ARTERIA FEMORAL SUPERFICIAL", ["femoral superficial", "arteria femoral"]),
        ("ARTERIA POPLÍTEA", ["poplite"]),
        ("ARTERIAS TIBIAL ANTERIOR, TIBIAL POSTERIOR Y PERONEA", ["tibial", "perone", "infrapoplite", "distal"]),
        ("ARTERIA PEDIA", ["pedia", "dorsal del pie"]),
    ],
    "doppler_carotideo": [
        ("ARTERIA CARÓTIDA COMÚN DERECHA", ["carotida comun derecha", "carotidas"]),
        ("BULBO Y CARÓTIDAS INTERNA Y EXTERNA DERECHAS", ["carotida interna derecha", "bulbo derecho", "carotidas"]),
        ("ARTERIA CARÓTIDA COMÚN IZQUIERDA", ["carotida comun izquierda", "carotidas"]),
        ("BULBO Y CARÓTIDAS INTERNA Y EXTERNA IZQUIERDAS", ["carotida interna izquierda", "bulbo izquierdo", "carotidas"]),
        ("ARTERIAS VERTEBRALES", ["vertebral"]),
        ("COMPLEJO ÍNTIMA-MEDIA Y PLACAS", ["intima", "placa"]),
    ],
    "obstetrico_1t": [
        ("ÚTERO Y LOCALIZACIÓN DE LA GESTACIÓN", ["utero", "localizacion"]),
        ("SACO GESTACIONAL", ["saco gestacional"]),
        ("VESÍCULA VITELINA", ["vitelin"]),
        ("EMBRIÓN, LCC Y ACTIVIDAD CARDÍACA", ["embrion", "lcc", "actividad cardiaca", "cardiac"]),
        ("TROFOBLASTO / CORION", ["trofoblast", "corion", "placenta"]),
        ("CÉRVIX", ["cervix", "cuello"]),
        ("OVARIOS Y ANEXOS", ["ovario", "anex"]),
        ("FONDO DE SACO", ["douglas", "fondo de saco", "liquido libre"]),
    ],
    "obstetrico": [
        ("NÚMERO DE FETOS, VITALIDAD Y ESTÁTICA FETAL", ["vitalidad", "estatica", "feto", "presentacion"]),
        ("BIOMETRÍA FETAL Y PESO FETAL ESTIMADO", ["biometr", "peso fetal", "pfe"]),
        ("ANATOMÍA FETAL", ["anatomia fetal", "anatomia"]),
        ("PLACENTA", ["placenta"]),
        ("CORDÓN UMBILICAL", ["cordon"]),
        ("LÍQUIDO AMNIÓTICO", ["liquido amniotico", "ila"]),
        ("CÉRVIX", ["cervix", "cuello"]),
    ],
    "transfontanelar": [
        ("PARÉNQUIMA CEREBRAL Y ECOGENICIDAD PERIVENTRICULAR", ["parenquima", "periventricular", "sustancia blanca"]),
        ("SISTEMA VENTRICULAR", ["ventricul"]),
        ("PLEXOS COROIDEOS Y REGIÓN GERMINAL", ["coroide", "germinal", "talamocaudad"]),
        ("ESTRUCTURAS DE LÍNEA MEDIA Y CUERPO CALLOSO", ["linea media", "calloso", "septum", "cavum"]),
        ("FOSA POSTERIOR Y CEREBELO", ["fosa posterior", "cerebel", "cisterna magna"]),
        ("ESPACIOS EXTRAAXIALES", ["extraaxial", "subaracnoide", "extra-axial"]),
    ],
    "rx_torax": [
        ("CALIDAD TÉCNICA", ["tecnica", "calidad"]),
        ("PARTES BLANDAS Y ESTRUCTURAS ÓSEAS", ["partes blandas", "ose", "hueso"]),
        ("TRÁQUEA Y MEDIASTINO", ["traquea", "mediastin"]),
        ("SILUETA CARDÍACA", ["cardi", "silueta"]),
        ("HILIOS PULMONARES", ["hilio"]),
        ("PARÉNQUIMA PULMONAR", ["parenquima", "pulmon"]),
        ("PLEURA Y SENOS COSTOFRÉNICOS", ["pleura", "costofrenic"]),
        ("DIAFRAGMA", ["diafragma"]),
    ],
    "rx_osea": [
        ("CALIDAD TÉCNICA Y PROYECCIONES", ["tecnica", "proyeccion"]),
        ("ALINEACIÓN", ["alineacion"]),
        ("ESTRUCTURAS ÓSEAS, CORTICAL Y TRABECULADO", ["ose", "cortical", "trabecul", "hueso"]),
        ("ARTICULACIONES Y ESPACIOS ARTICULARES", ["articul"]),
        ("TEJIDOS BLANDOS", ["tejidos blandos", "partes blandas"]),
    ],
    "mamografia": [
        ("COMPOSICIÓN MAMARIA (ACR)", ["composicion", "densidad", "acr"]),
        ("MAMA DERECHA (CC Y MLO)", ["mama derecha", "mamas"]),
        ("MAMA IZQUIERDA (CC Y MLO)", ["mama izquierda", "mamas"]),
        ("CALCIFICACIONES", ["calcificacion"]),
        ("PIEL Y COMPLEJO AREOLA-PEZÓN", ["piel", "areola", "pezon"]),
        ("REGIONES AXILARES", ["axil"]),
    ],
    "tc_craneo": [
        ("PARÉNQUIMA CEREBRAL (SUSTANCIA GRIS Y BLANCA)", ["parenquima", "sustancia"]),
        ("SISTEMA VENTRICULAR Y CISTERNAS", ["ventricul", "cisterna"]),
        ("ESPACIOS EXTRAAXIALES", ["extraaxial", "subaracnoide", "extra-axial", "subdural"]),
        ("ESTRUCTURAS DE LÍNEA MEDIA", ["linea media"]),
        ("FOSA POSTERIOR Y TRONCO", ["fosa posterior", "tronco", "cerebel"]),
        ("CALOTA Y BASE DE CRÁNEO", ["calota", "base de craneo", "ose"]),
        ("SENOS PARANASALES, ÓRBITAS Y MASTOIDES", ["senos", "orbita", "mastoid"]),
        ("TEJIDOS BLANDOS EPICRANEALES", ["tejidos blandos", "epicraneal", "partes blandas"]),
    ],
    "tc_torax": [
        ("TIROIDES Y BASE DEL CUELLO", ["tiroides", "base del cuello"]),
        ("MEDIASTINO Y GANGLIOS", ["mediastin", "ganglion", "adenopat"]),
        ("CORAZÓN, PERICARDIO Y GRANDES VASOS", ["corazon", "pericardi", "aorta", "pulmonar", "grandes vasos"]),
        ("VÍA AÉREA", ["via aerea", "traquea", "bronqu"]),
        ("PARÉNQUIMA PULMONAR", ["parenquima", "pulmon"]),
        ("PLEURA", ["pleura"]),
        ("PARED TORÁCICA, AXILAS Y ESTRUCTURAS ÓSEAS", ["pared", "axil", "ose"]),
        ("ABDOMEN SUPERIOR INCLUIDO", ["abdomen superior", "higado", "suprarrenal"]),
    ],
    "tc_abdomen_pelvis": _HIGADO + _RENAL + _RETRO + [
        ("ESTÓMAGO, INTESTINO DELGADO, COLON Y APÉNDICE", ["estomago", "intestin", "colon", "apendice", "asas"]),
        ("GANGLIOS ABDOMINOPÉLVICOS", ["ganglion", "adenopat"]),
        ("ÓRGANOS PÉLVICOS", ["utero", "prostata", "pelvi", "ovario"]),
        ("BASES PULMONARES", ["bases pulmonares", "pulmon"]),
        ("ESTRUCTURAS ÓSEAS Y PARED ABDOMINAL", ["ose", "pared"]),
    ],
    "rm_cerebro": [
        ("PARÉNQUIMA CEREBRAL (SUSTANCIA GRIS Y BLANCA)", ["parenquima", "sustancia"]),
        ("DIFUSIÓN (DWI/ADC)", ["difusion", "dwi", "adc"]),
        ("SISTEMA VENTRICULAR Y ESPACIOS SUBARACNOIDEOS", ["ventricul", "subaracnoide"]),
        ("ESTRUCTURAS DE LÍNEA MEDIA, SILLA TURCA E HIPÓFISIS", ["linea media", "hipofis", "silla"]),
        ("FOSA POSTERIOR, TRONCO Y CEREBELO", ["fosa posterior", "tronco", "cerebel"]),
        ("ESTRUCTURAS VASCULARES (VACÍOS DE FLUJO) Y SENOS VENOSOS", ["vascular", "flujo", "senos venosos"]),
        ("ÓRBITAS, SENOS PARANASALES Y MASTOIDES", ["orbita", "senos paranasales", "mastoid"]),
        ("CALOTA Y TEJIDOS BLANDOS", ["calota", "tejidos blandos", "ose"]),
    ],
    "rm_columna": [
        ("ALINEACIÓN Y CURVATURAS", ["alineacion", "curvatura", "lordosis", "cifosis"]),
        ("CUERPOS VERTEBRALES Y SEÑAL DE MÉDULA ÓSEA", ["cuerpos vertebrales", "medula osea", "vertebra"]),
        ("DISCOS INTERVERTEBRALES (NIVEL POR NIVEL)", ["disco"]),
        ("CANAL RAQUÍDEO Y FORÁMENES", ["canal", "foram"]),
        ("MÉDULA ESPINAL / CONO MEDULAR / RAÍCES", ["medula espinal", "cono", "raices", "cola de caballo"]),
        ("ARTICULACIONES FACETARIAS Y LIGAMENTOS", ["facet", "ligament"]),
        ("PARTES BLANDAS PARAVERTEBRALES", ["paravertebral", "partes blandas", "tejidos blandos"]),
    ],
}

ALIAS = {
    "abdomen": "abdominal", "abdominal_completo": "abdominal", "us_abdominal": "abdominal",
    "abdominopelvico_femenino": "general_femenino", "abdominopelvico": "general_femenino",
    "abdominopelvico_masculino": "general_masculino", "renal_vejiga": "renal",
    "prostata": "pelvico_masculino", "pelvico": "pelvico_femenino", "cuello": "tiroides",
    "obstetrico_2t": "obstetrico", "obstetrico_3t": "obstetrico", "escrotal": "testicular",
}


def _norm(t):
    import unicodedata
    t = unicodedata.normalize("NFD", t.lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn").replace("ñ", "n")


def faltantes(protocolo, titulos):
    """Lista de estructuras obligatorias que no aparecen en los títulos del dictado."""
    clave = ALIAS.get(protocolo, protocolo)
    if clave not in PROTOCOLOS:
        raise SystemExit(f"@protocolo desconocido: {protocolo}. Disponibles: {', '.join(sorted(PROTOCOLOS))}")
    tt = [_norm(t) for t in titulos]
    return [nombre for nombre, claves in PROTOCOLOS[clave]
            if not any(_norm(k) in t for t in tt for k in claves)]
