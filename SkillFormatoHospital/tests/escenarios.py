"""Escenarios ficticios. Cada par contiene observación fuente y texto revisado."""

from informe import names, protocol


def m(structure, mid, label, values, unit, interpretation):
    return dict(estructura=structure, id=mid, parametro=label, valores=values,
                unidad=unit, interpretacion=interpretation)


def renal(i, code):
    r = "rinon_derecho"
    l = "rinon_izquierdo"
    positive = i % 3 == 0
    dilation = i % 3 == 1
    fields = {}
    for side in (r, l):
        fields[side] = {
            "morfologia": ("Forma de riñón y borde liso en su fosa.", "Configuración reniforme en su fosa, con contorno liso."),
            "parenquima": ("Cortical de brillo habitual y diferencia corteza médula visible.",
                           "Ecogenicidad cortical habitual y diferenciación corticomedular identificable."),
            "sistema_excretor": ("Seno brillante, pelvis y cálices sin ectasia.", "Seno ecogénico, sin dilatación pielocalicial."),
            "focos": ("Sin masas ni piedras visibles.", "Sin lesión focal ni litiasis visible."),
        }
    if positive:
        fields[r]["focos"] = ("Eco brillante inferior en cáliz con sombra.", "Foco hiperecogénico en el cáliz inferior con sombra acústica posterior.")
    if dilation:
        fields[l]["sistema_excretor"] = ("Pelvis y cálices de arriba y abajo dilatados.",
                                           "Dilatación de la pelvis y los cálices de los grupos superior e inferior.")
    fields["retroperitoneo_y_espacios_perirrenales"] = {
        "entorno": ("No veo líquido alrededor de los dos riñones.", "Sin colección en los espacios perirrenales explorados.")}
    measured = [
        m(r, "longitud", "Eje longitudinal", [94 + i], "mm", "Longitud documentada"),
        m(l, "longitud", "Eje longitudinal", [105 + i], "mm", "Longitud documentada"),
        m(r, "dimensiones", "Ejes L, AP y T", [94 + i, 41, 48], "mm", "Ejes ortogonales"),
    ]
    if positive:
        measured.append(m(r, "calculo", "Cálculo calicial inferior", [4 + i / 10], "mm", "Foco con sombra acústica"))
    if code != "renal_solo":
        fields["ureteres"] = {"segmentos": ("Segmentos proximales visibles sin ectasia.", "Sin dilatación en los segmentos ureterales proximales visualizados.")}
        fields["vejiga_urinaria"] = {
            "morfologia": ("Vejiga llena con pared lisa.", "Vejiga distendida, de pared lisa."),
            "contenido": ("Orina negra sin ecos móviles.", "Contenido anecoico sin ecos intraluminales móviles."),
        }
        residual = "residuo_postmiccional"
        fields[residual] = {"evaluacion": ("Se hizo medición después de orinar.", "Se cuantificaron los volúmenes vesicales antes y después de la micción.")}
        measured += [m(residual, "pre", "Volumen premiccional", [230 + i], "mL", "Vejiga distendida"),
                     m(residual, "pos", "Volumen posmiccional", [i], "mL", "Residuo medido")]
    if code == "renal_prostata":
        del fields["retroperitoneo_y_espacios_perirrenales"]
        fields["prostata"] = {"morfologia": ("Contorno liso, tres medidas.", "Contorno prostático liso. Se registran tres ejes ortogonales."),
                              "parenquima": ("Glándula homogénea.", "Ecoestructura glandular homogénea.")}
        fields["vesiculas_seminales"] = {"descripcion": ("Vesículas simétricas.", "Vesículas seminales de configuración simétrica.")}
        measured.append(m("prostata", "dimensiones", "Ejes L, AP y T", [44, 32, 37], "mm", "Ejes ortogonales"))
    conclusion = ("Litiasis calicial inferior derecha", "El foco produce sombra posterior y el sistema colector derecho carece de dilatación.", [r]) if positive else (
        "Dilatación pielocalicial izquierda", "La ectasia abarca la pelvis y los grupos caliciales superior e inferior.", [l]) if dilation else (
        "Sin dilatación pielocalicial bilateral", "Pelvis y cálices sin ectasia en ambos riñones.", [r, l])
    return fields, measured, conclusion, None


# Los pares conservan el mismo hecho clínico con una redacción propia.
DATA = {
 "rx_torax": [
  ("PA con inspiración suficiente.", "Proyección posteroanterior obtenida en inspiración."),
  ("Costillas visibles sin trazos.", "Sin trazo de fractura en los arcos costales incluidos."),
  ("Tráquea en medio y mediastino estrecho.", "Tráquea centrada, sin ensanchamiento mediastínico."),
  ("Corazón sin aumento.", "Silueta cardíaca de dimensiones conservadas en proyección posteroanterior."),
  ("Hilios iguales.", "Hilios pulmonares simétricos."),
  ("Opacidad basal derecha.", "Opacidad de espacio aéreo proyectada sobre el campo pulmonar inferior derecho."),
  ("Senos abiertos.", "Senos costofrénicos libres."),
  ("Diafragmas lisos, gas bajo cúpula izquierda en estómago.", "Cúpulas diafragmáticas lisas y burbuja gástrica subdiafragmática izquierda."),
  ("Sin tubos.", "Sin dispositivos intratorácicos visibles."),
 ],
 "mamografia": [
  ("Densidad B.", "Áreas dispersas de tejido fibroglandular, composición mamaria tipo B."),
  ("Derecha sin masa ni distorsión.", "En las proyecciones derechas no se identifican masas ni distorsión arquitectural."),
  ("Izquierda sin masa ni distorsión.", "En las proyecciones izquierdas no se identifican masas ni distorsión arquitectural."),
  ("Calcificación vascular bilateral.", "Calcificaciones lineales que siguen trayectos vasculares en ambas mamas."),
  ("Sin retracción del pezón ni engrosamiento de piel.", "Complejos areola-pezón sin retracción y piel sin engrosamiento visible."),
  ("Ganglios con hilio graso en ambas axilas.", "Ganglios axilares bilaterales con hilio adiposo conservado."),
 ],
 "tc_craneo": [
  ("Hematoma cuero cabelludo frontal izq.", "Engrosamiento hiperatenuante del tejido subcutáneo frontal izquierdo."),
  ("Sin fractura de calota o base.", "Calota y base craneal sin trazo de fractura visible."),
  ("Sin sangre fuera del cerebro.", "Sin colección hemática extraaxial visible."),
  ("Se ve límite gris blanca.", "Diferenciación entre sustancia gris y blanca conservada."),
  ("Ventrículos y cisternas sin dilatación.", "Sistema ventricular sin dilatación y cisternas basales permeables."),
  ("Sin desviación.", "Estructuras de línea media centradas."),
  ("Sin hematoma en tronco o cerebelo.", "Sin foco hemorrágico visible en tronco encefálico ni cerebelo."),
  ("Sin ocupación en senos ni mastoides, órbitas simétricas.", "Órbitas simétricas y cavidades paranasales y mastoideas incluidas aireadas."),
 ],
 "tc_torax": [
  ("Tiroides incluida homogénea.", "Porción incluida de la tiroides de atenuación homogénea."),
  ("Pared sin masas y axilas sin ganglios grandes.", "Sin masa de pared torácica ni adenopatía axilar por tamaño."),
  ("Sin adenopatías mediastinales.", "Sin ganglios mediastínicos aumentados de tamaño."),
  ("Corazón no aumentado, pericardio seco y aorta sin dilatar.", "Sin aumento de dimensiones cardíacas, derrame pericárdico ni dilatación aórtica torácica."),
  ("Tráquea y bronquios principales abiertos.", "Luz traqueal y de ambos bronquios principales permeable."),
  ("Nódulo sólido apical derecho.", "Nódulo sólido en el segmento apical del lóbulo superior derecho."),
  ("Pleura sin líquido.", "Sin derrame pleural."),
  ("Sin lesiones óseas destructivas.", "Sin lesión ósea destructiva visible en el territorio explorado."),
  ("Sin nódulos en suprarrenales incluidas.", "Porciones suprarrenales incluidas sin nódulos visibles."),
 ],
 "rm_rodilla": [
  ("Rotura horizontal posterior medial sale abajo.", "Trazo de señal horizontal en el cuerno posterior del menisco medial, comunicado con la superficie articular inferior."),
  ("Lateral sin rotura.", "Menisco lateral sin trazo de señal que contacte una superficie articular."),
  ("LCA entero.", "Fibras del ligamento cruzado anterior en continuidad."),
  ("LCP entero.", "Ligamento cruzado posterior de trayecto continuo."),
  ("Colaterales enteros.", "Ligamentos colaterales medial y lateral con continuidad fibrilar."),
  ("Cuadricipital y rotuliano sin rotura.", "Tendones cuadricipital y rotuliano continuos."),
  ("Cartílago sin huecos visibles.", "Sin defecto focal visible del cartílago articular."),
  ("Sin edema óseo.", "Sin señal de edema medular en secuencias sensibles a líquido."),
  ("Poco líquido arriba de rótula.", "Pequeño derrame en el receso suprarrotuliano."),
  ("No quiste posterior.", "Sin colección poplítea entre semimembranoso y gastrocnemio medial."),
 ],
 "doppler_venoso_mmii": [
  ("Femoral común comprime y fluye fásico.", "Vena femoral común completamente compresible, con flujo fásico."),
  ("Cayado y safena mayor compresibles.", "Unión safenofemoral y safena mayor compresibles en los segmentos explorados."),
  ("Femoral y profunda sin trombo y comprimen.", "Venas femoral y femoral profunda compresibles, sin material endoluminal visible."),
  ("Poplítea con trombo, no colapsa, no flujo.", "Vena poplítea no compresible, con material endoluminal y sin flujo detectable con Doppler color."),
  ("Cayado menor y safena menor compresibles.", "Unión safenopoplítea y safena menor compresibles."),
  ("Tibiales, peroneas y gemelares colapsan.", "Venas tibiales, peroneas y gemelares examinadas con compresibilidad conservada."),
  ("Perforantes vistas permeables.", "Permeabilidad de las perforantes visualizadas."),
  ("Edema del celular en pierna.", "Edema del tejido celular subcutáneo de la pierna explorada."),
 ],
 "fast": [
  ("Sin líquido en Morison.", "Receso hepatorrenal sin líquido libre visible."),
  ("Sin líquido junto a bazo.", "Espacio esplenorrenal sin líquido libre visible."),
  ("Líquido en fondo pélvico.", "Líquido libre en el fondo de saco pélvico."),
  ("No líquido pericárdico en subxifoidea.", "Ventana subxifoidea sin derrame pericárdico visible."),
  ("Pleuras sin líquido.", "Sin líquido visible en las ventanas pleurales exploradas."),
 ],
 "rx_osea": [
  ("AP y lateral.", "Proyecciones anteroposterior y lateral del segmento explorado."),
  ("Ejes bien.", "Alineación ósea conservada."),
  ("Fractura transversa radio distal.", "Trazo transversal en la metáfisis distal del radio."),
  ("No se extiende a articulación.", "Sin extensión visible del trazo a la superficie articular radiocarpiana."),
  ("Hinchazón alrededor de muñeca.", "Aumento de volumen de los tejidos blandos periarticulares."),
 ],
 "partes_blandas": [
  ("Piel engrosada localmente.", "Engrosamiento focal de la piel sobre el área de interés."),
  ("Fascia profunda intacta.", "Plano fascial profundo de continuidad conservada."),
  ("Colección superficial con ecos internos.", "Colección subcutánea con ecos internos, superficial al plano fascial."),
  ("Sin señal interna en Doppler.", "Sin señal Doppler color dentro de la colección."),
  ("Cortical subyacente continua.", "Cortical ósea subyacente de continuidad conservada en la ventana disponible."),
 ],
 "obstetrico": [
  {"vitalidad": ("Uno con latido.", "Feto único con actividad cardíaca identificada."),
   "estatica": ("Longitudinal cefálico dorso izquierdo.", "Situación longitudinal, presentación cefálica y dorso a la izquierda.")},
  {"biometria": ("30 semanas por medidas.", "La biometría fetal compuesta corresponde a 30 semanas."),
   "peso": ("Se estimó por Hadlock.", "Peso fetal estimado mediante fórmula de Hadlock.")},
  ("Ventrículos simétricos y línea media visible.", "Ventrículos laterales simétricos y estructuras de línea media visibles."),
  ("Perfil y labio sin interrupción visible.", "Perfil facial identificable y labio superior sin discontinuidad visible."),
  ("Cuatro cámaras, pulmones de aspecto simétrico.", "Vista de cuatro cámaras obtenida y campos pulmonares simétricos."),
  ("Estómago, riñones y vejiga visibles.", "Cámara gástrica, ambos riñones y vejiga identificados."),
  ("Columna sin defecto dorsal visible.", "Sin defecto visible de cierre dorsal en la columna evaluada."),
  ("Se ven cuatro miembros.", "Extremidades superiores e inferiores identificadas bilateralmente."),
  {"localizacion": ("Posterior arriba.", "Placenta de inserción posterior alta."),
   "aspecto": ("Homogénea.", "Ecoestructura placentaria homogénea.")},
  ("Tres vasos.", "Cordón umbilical de tres vasos."),
  {"cuantificacion": ("Se midió bolsillo mayor.", "Cuantificación del líquido amniótico mediante bolsillo vertical máximo.")},
  ("Cérvix cerrado.", "Canal cervical cerrado en la ventana evaluada."),
 ],
}
TECH = {
 "rx_torax": ("Tórax PA.", "Radiografía de tórax en proyección posteroanterior."),
 "rx_osea": ("Muñeca derecha AP y perfil.", "Radiografía de muñeca derecha en proyecciones anteroposterior y lateral."),
 "mamografia": ("Mamografía bilateral CC y MLO.", "Mamografía bilateral con proyecciones craneocaudal y mediolateral oblicua."),
 "tc_craneo": ("TC cabeza simple.", "Tomografía de cráneo sin contraste intravenoso."),
 "tc_torax": ("TC tórax sin contraste.", "Tomografía torácica sin contraste intravenoso."),
 "rm_rodilla": ("RM rodilla izquierda sin contraste.", "Resonancia magnética de rodilla izquierda sin contraste intravenoso."),
 "doppler_venoso_mmii": ("Doppler pierna izquierda color y compresión.", "Doppler venoso de miembro inferior izquierdo con compresión y Doppler color."),
 "fast": ("FAST por trauma.", "Evaluación ecográfica focalizada de ventanas peritoneales, subxifoidea y pleurales en contexto traumático."),
 "partes_blandas": ("Ultrasonido lineal muslo derecho.", "Ecografía de partes blandas del muslo derecho con transductor lineal y Doppler color."),
 "obstetrico": ("US por abdomen segundo control.", "Ultrasonido obstétrico transabdominal de seguimiento."),
}
CONC = {
 "rx_torax": (5, "Opacidad pulmonar basal derecha", "Distribución de espacio aéreo en el campo inferior derecho."),
 "rx_osea": (2, "Fractura metafisaria distal del radio derecho", "Trazo transversal extraarticular en las proyecciones obtenidas."),
 "mamografia": (3, "Calcificaciones vasculares bilaterales", "Morfología lineal y distribución en trayectos vasculares."),
 "tc_craneo": (0, "Hematoma subcutáneo frontal izquierdo", "Engrosamiento hiperatenuante extracraneal en la región frontal."),
 "tc_torax": (5, "Nódulo pulmonar sólido en lóbulo superior derecho", "Localización en el segmento apical."),
 "rm_rodilla": (0, "Rotura horizontal del menisco medial izquierdo", "El trazo del cuerno posterior alcanza la superficie articular inferior."),
 "doppler_venoso_mmii": (3, "Trombosis de la vena poplítea izquierda", "Material endoluminal, ausencia de compresibilidad y falta de señal Doppler color."),
 "fast": (2, "Líquido libre pélvico", "Acúmulo identificado en el fondo de saco durante la evaluación focalizada."),
 "partes_blandas": (2, "Colección subcutánea del muslo derecho", "Contiene ecos internos y se sitúa superficial a la fascia profunda."),
 "obstetrico": (0, "Gestación única con actividad cardíaca", "Feto en situación longitudinal y presentación cefálica."),
}
CODES = ("renal", "rx_torax", "tc_craneo", "mamografia", "renal_solo", "tc_torax", "rm_rodilla",
         "doppler_venoso_mmii", "fast", "renal_prostata", "rx_osea", "partes_blandas", "obstetrico")


def sample(i, code):
    spec, _ = protocol(code)
    keys = list(names(spec))
    if code.startswith("renal"):
        fields, measured, (diagnosis, support, refs), category = renal(i, code)
        tech = ("US en modo B.", "Ecografía en modo B con evaluación de las estructuras incluidas en el protocolo.")
    else:
        fields = {key: pair if isinstance(pair, dict) else {"descripcion": pair}
                  for key, pair in zip(keys, DATA[code], strict=True)}
        if code == "mamografia":
            fields[keys[0]] = {"composicion": fields[keys[0]]["descripcion"]}
        tech = TECH[code]
        idx, diagnosis, support = CONC[code]
        refs = [keys[idx]]
        category = None
        measured = []
        if code == "mamografia":
            category = dict(sistema="BI-RADS", categoria="BI-RADS 2", sustento="Calcificaciones de distribución vascular.")
        elif code == "tc_torax":
            measured = [m(keys[5], "nodulo", "Nódulo apical derecho", [5 + i / 10], "mm", "Atenuación sólida")]
        elif code == "partes_blandas":
            measured = [m(keys[2], "coleccion", "Colección subcutánea", [20 + i, 8, 12], "mm", "Superficial a la fascia")]
        elif code == "doppler_venoso_mmii":
            measured = [m(keys[3], "extension", "Longitud del segmento poplíteo ocupado", [18 + i], "mm", "Segmento no compresible")]
        elif code == "obstetrico":
            measured = [m(keys[0], "fcf", "Frecuencia cardíaca", [130 + i], "lpm", "Actividad cardíaca presente")]
            for key, label, value, unit in (("dbp", "Diámetro biparietal", 76, "mm"), ("cc", "Circunferencia cefálica", 280, "mm"),
                                            ("ca", "Circunferencia abdominal", 258, "mm"), ("lf", "Longitud femoral", 56, "mm"),
                                            ("pfe", "Peso fetal estimado", 1500 + i, "g")):
                measured.append(m(keys[1], key, label, [value], unit, "Biometría de seguimiento"))
            measured += [m(keys[10], "bolsillo", "Bolsillo vertical máximo", [42], "mm", "Medición vertical")]
    if i == 34 and code == "obstetrico":
        liquid = keys[10]
        fields[liquid]["cuantificacion"] = ("ILA por cuatro cuadrantes.", "Índice de líquido amniótico por suma de cuatro bolsillos verticales.")
        measured = [row for row in measured if row["estructura"] != liquid]
        for q, val in enumerate((35, 42, 27, 30), 1):
            measured.append(m(liquid, f"q{q}", f"Cuadrante {q}", [val], "mm", "Bolsillo vertical"))
        measured.append(m(liquid, "ila", "ILA total", [134], "mm", "Suma de cuatro cuadrantes"))
    raw = {key: {"estado": "evaluado", "campos": {field: pair[0] for field, pair in entries.items()}}
           for key, entries in fields.items()}
    findings = {key: {"campos": {field: pair[1] for field, pair in entries.items()}, "destacar": key in refs}
                for key, entries in fields.items()}
    if i == 31 and code == "renal_solo":
        raw["retroperitoneo_y_espacios_perirrenales"] = {
            "estado": "no_evaluable", "motivo": "Ventana perirrenal insuficiente por interposición gaseosa."}
        findings["retroperitoneo_y_espacios_perirrenales"] = {
            "campos": {"motivo": "La interposición de gas impide valorar los espacios perirrenales."}}
    if i == 30 and code == "renal":
        residual = "residuo_postmiccional"
        raw[residual] = {"estado": "fuera_de_alcance", "motivo": "Se solicitó evaluación sin prueba posmiccional."}
        findings[residual] = {"campos": {}}
        measured = [row for row in measured if row["estructura"] != residual]
    ident = f"Caso{i:02}"
    source = dict(caso=ident, protocolo=code, tecnica=tech[0], hallazgos=raw, medidas=measured,
                  paciente=dict(nombre=f"Ficticio Centinela{i:02} Prueba", modalidad=spec["modalidad"].capitalize(),
                                edad=27 + i, procedencia="Banco de pruebas", fecha="11/11/2026", hora="08:00 AM"))
    if category:
        source["clasificacion"] = category
    draft = dict(tecnica=tech[1], hallazgos=findings,
                 conclusiones=[dict(diagnostico=diagnosis, sustento=support, estructuras=refs)])
    return source, draft
