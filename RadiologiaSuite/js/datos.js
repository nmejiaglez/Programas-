// Catálogo de estudios. Cada opción: [texto del hallazgo, conclusión sugerida (o "" si no genera conclusión)]
const NE = ["No evaluable adecuadamente por interposición de gas intestinal / ventana acústica limitada.", ""];

const ORG = {
  higado: ["HÍGADO", [
    ["De forma, contornos y dimensiones conservadas; ecotextura homogénea y ecogenicidad habitual, bordes lisos, sin lesiones focales sólidas ni quísticas identificables.", ""],
    ["Aumento difuso de la ecogenicidad parenquimatosa con adecuada visualización de las paredes portales y del diafragma.", "Esteatosis hepática grado I."],
    ["Aumento difuso de la ecogenicidad parenquimatosa con atenuación parcial de la visualización de las paredes portales.", "Esteatosis hepática grado II."],
    ["Marcado aumento de la ecogenicidad con importante atenuación posterior que impide valorar diafragma y paredes portales.", "Esteatosis hepática grado III."],
    ["Aumentado de tamaño, de ecotextura homogénea, sin lesiones focales identificables.", "Hepatomegalia homogénea."],
    ["Contornos nodulares, ecotextura heterogénea y gruesa, con hipertrofia relativa del lóbulo caudado.", "Hallazgos ecográficos compatibles con hepatopatía crónica."],
    ["Lesión focal hiperecogénica, bien definida, homogénea, sin flujo interno significativo, de aspecto típico de hemangioma.", "Lesión focal hepática de aspecto típico de hemangioma."],
    ["Imagen quística anecoica, de paredes finas, con refuerzo acústico posterior.", "Quiste hepático simple."],
    ["Lesión focal sólida (ver comentario y cuadro de mediciones).", "Lesión focal hepática sólida que requiere caracterización."],
    NE]],
  porta: ["SISTEMA PORTAL", [
    ["Vena porta de calibre conservado, permeable, con flujo hepatópeto.", ""],
    ["Vena porta de calibre aumentado, con flujo hepatópeto de baja velocidad.", "Signos ecográficos sugestivos de hipertensión portal."],
    ["Contenido ecogénico intraluminal en vena porta con ausencia de flujo.", "Trombosis portal."], NE]],
  suprahep: ["VENAS HEPÁTICAS", [
    ["Permeables, de calibre habitual.", ""],
    ["Dilatadas, con pérdida de la fasicidad habitual.", "Signos de congestión hepática pasiva."], NE]],
  vesicula: ["VESÍCULA BILIAR", [
    ["Adecuadamente distendida, de paredes finas y regulares, contenido anecoico homogéneo; sin litiasis ni barro biliar. Signo de Murphy ecográfico negativo.", ""],
    ["Distendida, con imagen(es) ecogénica(s) intraluminal(es) móvil(es) con sombra acústica posterior; paredes finas. Murphy ecográfico negativo.", "Colelitiasis sin signos ecográficos de colecistitis aguda."],
    ["Distendida, con litiasis, engrosamiento parietal difuso con edema mural, líquido perivesicular y signo de Murphy ecográfico positivo.", "Colecistitis aguda litiásica."],
    ["Contenido ecogénico declive, sin sombra acústica posterior.", "Barro biliar."],
    ["Imagen(es) ecogénica(s) adherida(s) a la pared, fija(s), sin sombra acústica posterior.", "Pólipo(s) vesicular(es)."],
    ["Contraída (paciente posprandial), lo que limita su evaluación.", ""],
    ["No visualizada; antecedente de colecistectomía.", "Estado posterior a colecistectomía."], NE]],
  vias: ["VÍAS BILIARES", [
    ["Vías biliares intra y extrahepáticas sin dilatación; colédoco de calibre conservado.", ""],
    ["Dilatación de las vías biliares intrahepáticas y del colédoco.", "Dilatación de la vía biliar intra y extrahepática."],
    ["Colédoco dilatado con imagen ecogénica intraluminal con sombra acústica posterior.", "Coledocolitiasis."], NE]],
  pancreas: ["PÁNCREAS", [
    ["Cabeza, cuerpo y cola de morfología y ecogenicidad conservadas; conducto pancreático principal no dilatado, sin lesiones focales identificables.", ""],
    ["Aumentado de tamaño, hipoecoico, con borramiento de los planos grasos peripancreáticos.", "Signos ecográficos sugestivos de pancreatitis aguda (correlacionar con lipasa / Atlanta revisada)."],
    ["Parcialmente evaluado por interposición de gas; segmentos visibles sin alteraciones.", ""], NE]],
  bazo: ["BAZO", [
    ["De dimensiones y ecotextura conservadas, sin lesiones focales identificables.", ""],
    ["Aumentado de tamaño, de ecotextura homogénea, sin lesiones focales.", "Esplenomegalia homogénea."],
    ["Bazo accesorio (esplenúnculo) en el hilio esplénico.", ""],
    ["No visualizado; antecedente de esplenectomía.", ""]]],
  retro: ["RETROPERITONEO Y GRANDES VASOS", [
    ["Aorta abdominal de calibre conservado, sin dilataciones aneurismáticas; vena cava inferior permeable. Sin adenomegalias retroperitoneales evaluables.", ""],
    ["Aorta abdominal con placas ateromatosas parietales calcificadas, sin dilatación aneurismática.", "Ateromatosis aórtica abdominal."],
    ["Dilatación aneurismática de la aorta abdominal (ver cuadro de mediciones).", "Aneurisma de aorta abdominal."], NE]],
  peritoneo: ["CAVIDAD PERITONEAL", [
    ["Sin evidencia de líquido libre ni colecciones.", ""],
    ["Líquido libre en escasa cuantía.", "Líquido libre peritoneal en escasa cuantía."],
    ["Líquido libre en moderada cuantía.", "Ascitis moderada."],
    ["Líquido libre abundante distribuido en todos los compartimentos peritoneales.", "Ascitis abundante."],
    ["Colección organizada (ver comentario y cuadro de mediciones).", "Colección intraabdominal."]]],
  rinon: lado => ["RIÑÓN " + lado, [
    ["De situación, forma, tamaño y contornos conservados; adecuada diferenciación corticomedular y grosor parenquimatoso preservado; sistema pielocalicial sin dilatación; sin litiasis ni lesiones focales.", ""],
    ["Imagen ecogénica con sombra acústica posterior en grupo calicial, sin dilatación del sistema pielocalicial.", "Nefrolitiasis " + lado.toLowerCase() + " no obstructiva."],
    ["Ectasia pielocalicial leve.", "Hidronefrosis " + lado.toLowerCase() + " grado I."],
    ["Dilatación pielocalicial moderada con parénquima preservado.", "Hidronefrosis " + lado.toLowerCase() + " grado II."],
    ["Dilatación pielocalicial severa con adelgazamiento cortical.", "Hidronefrosis " + lado.toLowerCase() + " grado III–IV."],
    ["Imagen quística cortical anecoica, de paredes finas y lisas, sin septos ni calcificaciones, con refuerzo acústico posterior.", "Quiste renal " + lado.toLowerCase() + " simple (Bosniak I)."],
    ["Aumento difuso de la ecogenicidad cortical con pérdida de la diferenciación corticomedular.", "Nefropatía médica " + lado.toLowerCase() + "."],
    ["Disminuido de tamaño con adelgazamiento cortical difuso.", "Riñón " + lado.toLowerCase() + " de tamaño disminuido con adelgazamiento cortical."],
    ["No visualizado en la fosa renal (agenesia / nefrectomía).", "Riñón " + lado.toLowerCase() + " no visualizado."]]],
  ureteres: ["URÉTERES", [
    ["Porciones proximales y distales evaluables no dilatadas.", ""],
    ["Uréter derecho dilatado.", "Ureterectasia derecha."],
    ["Uréter izquierdo dilatado.", "Ureterectasia izquierda."],
    ["Imagen ecogénica con sombra acústica en unión ureterovesical.", "Litiasis en unión ureterovesical."], NE]],
  vejiga: ["VEJIGA URINARIA", [
    ["Adecuadamente distendida, de paredes finas y regulares, contenido anecoico; sin litiasis, masas ni divertículos.", ""],
    ["Engrosamiento parietal difuso con trabeculación.", "Vejiga de esfuerzo."],
    ["Contenido ecogénico en suspensión.", "Sedimento vesical."],
    ["Imagen ecogénica móvil con sombra acústica posterior.", "Litiasis vesical."],
    ["Lesión polipoide parietal (ver comentario).", "Lesión parietal vesical que requiere estudio."],
    ["Insuficientemente distendida, lo que limita su evaluación.", ""],
    ["Sonda vesical in situ.", ""]]],
  residuo: ["RESIDUO POSMICCIONAL", [
    ["No significativo.", ""],
    ["Significativo (ver volumen en cuadro de mediciones).", "Residuo posmiccional significativo."],
    ["No evaluado.", ""]]],
  utero: ["ÚTERO", [
    ["En anteversoflexión, de forma, contornos y dimensiones conservadas; miometrio de ecotextura homogénea, sin lesiones focales.", ""],
    ["En retroversoflexión, de forma y dimensiones conservadas, miometrio homogéneo.", ""],
    ["Aumentado de tamaño, con imagen(es) nodular(es) hipoecoica(s) bien definida(s), con sombra en abanico.", "Miomatosis uterina."],
    ["Globuloso, miometrio heterogéneo con asimetría de paredes y quistes miometriales.", "Hallazgos sugestivos de adenomiosis."],
    ["De características posmenopáusicas, atrófico.", ""],
    ["No visualizado; antecedente de histerectomía.", "Estado posterior a histerectomía."]]],
  endometrio: ["ENDOMETRIO", [
    ["Lineal, ecogénico, de grosor acorde a la fase del ciclo menstrual.", ""],
    ["De patrón trilaminar (fase proliferativa).", ""],
    ["Ecogénico y homogéneo (fase secretora).", ""],
    ["Engrosado para la edad y estado hormonal.", "Engrosamiento endometrial."],
    ["Contenido líquido en la cavidad endometrial.", "Colección líquida endometrial."],
    ["Dispositivo intrauterino normoinserto.", "DIU normoinserto."],
    ["Dispositivo intrauterino descendido.", "DIU descendido."]]],
  ovario: lado => ["OVARIO " + lado, [
    ["De tamaño y morfología conservados, con folículos de aspecto fisiológico.", ""],
    ["Imagen quística unilocular anecoica de paredes finas y lisas.", "Quiste simple de ovario " + lado.toLowerCase() + " (O-RADS US 2)."],
    ["Quiste con ecos internos homogéneos en vidrio esmerilado.", "Quiste de ovario " + lado.toLowerCase() + " sugestivo de endometrioma (O-RADS US 2)."],
    ["Quiste con patrón reticular interno sin flujo.", "Quiste hemorrágico de ovario " + lado.toLowerCase() + " (O-RADS US 2)."],
    ["Aumento de volumen con múltiples folículos de disposición periférica.", "Morfología poliquística del ovario " + lado.toLowerCase() + "."],
    ["No visualizado (posmenopausia / interposición de gas).", ""]]],
  anexos: ["ANEXOS Y FONDO DE SACO", [
    ["Regiones anexiales sin masas; fondo de saco de Douglas libre.", ""],
    ["Escaso líquido libre en fondo de saco de Douglas, de aspecto fisiológico.", ""],
    ["Líquido libre en moderada cantidad en fondo de saco.", "Líquido libre en fondo de saco."],
    ["Masa anexial (ver comentario).", "Masa anexial que requiere caracterización."]]],
  prostata: ["PRÓSTATA", [
    ["De forma, contornos y dimensiones conservadas, ecotextura homogénea, sin lesiones focales.", ""],
    ["Aumentada de tamaño, ecotextura heterogénea con calcificaciones en zona de transición.", "Hiperplasia prostática."],
    ["Aumentada de tamaño con protrusión del lóbulo medio hacia la base vesical.", "Hiperplasia prostática con lóbulo medio prominente."],
    ["Calcificaciones intraprostáticas.", "Prostatolitiasis."],
    ["Lesión focal hipoecoica en zona periférica (ver comentario).", "Lesión focal prostática; correlacionar con APE / RM multiparamétrica."]]],
  vesiculas: ["VESÍCULAS SEMINALES", [
    ["Simétricas, de aspecto habitual.", ""],
    ["Asimétricas / dilatadas.", "Asimetría de vesículas seminales."], ["No evaluadas.", ""]]],
  tiroides: lado => ["LÓBULO TIROIDEO " + lado, [
    ["De forma y dimensiones conservadas, ecotextura homogénea, sin nódulos identificables.", ""],
    ["Con nódulo descrito en comentario (ver TI-RADS).", "Nódulo tiroideo " + lado.toLowerCase() + " (ver categoría ACR TI-RADS)."],
    ["Ecotextura heterogénea, con hipoecogenicidad difusa y septos ecogénicos.", "Tiroiditis crónica (patrón de Hashimoto)."],
    ["Aumentado de tamaño, con múltiples nódulos.", "Bocio multinodular."],
    ["No visualizado (tiroidectomía).", ""]]],
  istmo: ["ISTMO", [["De grosor conservado, sin nódulos.", ""], ["Engrosado.", "Engrosamiento del istmo tiroideo."], ["Con nódulo (ver comentario).", "Nódulo ístmico (ver TI-RADS)."]]],
  glandulas: ["GLÁNDULAS SALIVALES", [["Parótidas y submandibulares de tamaño y ecotextura conservados.", ""], ["Aumento de tamaño con ecotextura heterogénea.", "Sialoadenopatía."]]],
  ganglios: ["CADENAS GANGLIONARES CERVICALES", [
    ["Sin adenomegalias; ganglios de morfología ovalada con hilio graso conservado.", ""],
    ["Ganglios de aspecto reactivo (ovalados, hilio conservado).", "Adenopatías cervicales de aspecto reactivo."],
    ["Ganglio(s) redondeado(s) con pérdida del hilio graso / microcalcificaciones / flujo periférico.", "Adenopatía(s) cervical(es) de aspecto sospechoso."]]],
  mama: lado => ["MAMA " + lado, [
    ["Patrón fibroglandular sin masas, quistes ni distorsión arquitectural.", ""],
    ["Imagen quística anecoica, de paredes finas, con refuerzo acústico posterior.", "Quiste simple en mama " + lado.toLowerCase() + "."],
    ["Nódulo sólido ovalado, circunscrito, paralelo a la piel, hipoecoico.", "Nódulo sólido en mama " + lado.toLowerCase() + " de características probablemente benignas."],
    ["Nódulo sólido irregular, de márgenes no circunscritos, no paralelo, con sombra acústica.", "Nódulo en mama " + lado.toLowerCase() + " de características sospechosas."],
    ["Ectasia ductal retroareolar.", "Ectasia ductal en mama " + lado.toLowerCase() + "."]]],
  axila: lado => ["AXILA " + lado, [["Sin adenopatías; ganglios de morfología habitual.", ""], ["Adenopatía de cortical engrosada / pérdida del hilio.", "Adenopatía axilar " + lado.toLowerCase() + " de aspecto sospechoso."]]],
  sistProf: lado => ["SISTEMA VENOSO PROFUNDO " + lado, [
    ["Venas femoral común, femoral, poplítea y tibiales permeables, totalmente compresibles, con flujo fásico respiratorio y adecuada respuesta a la maniobra de aumento; sin reflujo patológico.", ""],
    ["Vena con contenido ecogénico intraluminal, no compresible, con ausencia de flujo (ver comentario para segmentos).", "Trombosis venosa profunda " + lado.toLowerCase() + "."],
    ["Reflujo patológico (>1 s) en sistema profundo.", "Insuficiencia venosa profunda " + lado.toLowerCase() + "."]]],
  sistSup: lado => ["SISTEMA VENOSO SUPERFICIAL " + lado, [
    ["Venas safena mayor y menor de calibre conservado, competentes, sin reflujo.", ""],
    ["Reflujo patológico (>0.5 s) en unión safenofemoral y safena mayor, con dilataciones varicosas tributarias.", "Insuficiencia venosa superficial " + lado.toLowerCase() + " (safena mayor)."],
    ["Reflujo en safena menor.", "Insuficiencia de safena menor " + lado.toLowerCase() + "."],
    ["Trombosis de vena superficial.", "Tromboflebitis superficial " + lado.toLowerCase() + "."]]],
  feto: ["FETO", [
    ["Feto único, vivo, con movimientos fetales y actividad cardíaca presentes.", "Embarazo único con feto vivo."],
    ["Gestación gemelar (ver comentario: corionicidad / amnionicidad).", "Embarazo gemelar."],
    ["Ausencia de actividad cardíaca fetal.", "Óbito fetal."]]],
  presentacion: ["PRESENTACIÓN / SITUACIÓN", [
    ["Presentación cefálica, situación longitudinal, dorso a la izquierda.", ""],
    ["Presentación cefálica, situación longitudinal, dorso a la derecha.", ""],
    ["Presentación pélvica, situación longitudinal.", "Presentación pélvica."],
    ["Situación transversa.", "Situación transversa."], ["Variable (embarazo temprano).", ""]]],
  placenta: ["PLACENTA", [
    ["Corporal anterior, de espesor conservado, Grannum 0.", ""], ["Corporal anterior, Grannum I.", ""],
    ["Corporal posterior, Grannum I.", ""], ["Fúndica, Grannum II.", ""], ["Grannum III.", ""],
    ["De inserción baja / previa (ver distancia al orificio cervical interno).", "Placenta de inserción baja / previa."]]],
  liquido: ["LÍQUIDO AMNIÓTICO", [
    ["Cantidad conservada para la edad gestacional.", ""],
    ["Disminuido.", "Oligohidramnios."], ["Aumentado.", "Polihidramnios."]]],
  cordon: ["CORDÓN UMBILICAL", [
    ["Trivascular, de inserción central, sin circulares visualizadas.", ""],
    ["Trivascular, con circular simple al cuello.", "Circular simple de cordón al cuello."],
    ["Trivascular, con doble circular al cuello.", "Doble circular de cordón al cuello."],
    ["Arteria umbilical única.", "Arteria umbilical única."]]],
  anatomia: ["ANATOMÍA FETAL BÁSICA", [
    ["Cráneo, estructuras de línea media, columna, cuatro cámaras cardíacas, estómago, riñones, vejiga y extremidades visibles sin alteraciones evidentes en el presente estudio.", ""],
    ["Evaluación anatómica limitada por posición fetal.", ""], ["Hallazgo descrito en comentario.", "Hallazgo anatómico fetal que requiere evaluación dirigida."]]],
  cervix: ["CÉRVIX", [["Cerrado, de longitud conservada.", ""], ["Acortado (ver medida).", "Cérvix acortado."], ["No evaluado.", ""]]],
};

const M3 = (n) => ({ n, t: 3, u: "cm" }), M1 = (n, u = "mm") => ({ n, t: 1, u });
const SEC = {
  abdomen: { t: "ABDOMEN", o: [ORG.higado, ORG.porta, ORG.suprahep, ORG.vesicula, ORG.vias, ORG.pancreas, ORG.bazo, ORG.retro, ORG.peritoneo],
    m: [M1("Hígado (lóbulo derecho)", "cm"), M1("Vena porta"), M3("Vesícula biliar"), M1("Pared vesicular"), M1("Colédoco"), M3("Bazo"), M1("Aorta abdominal")] },
  renal: { t: "RIÑONES Y VÍAS URINARIAS", o: [ORG.rinon("DERECHO"), ORG.rinon("IZQUIERDO"), ORG.ureteres, ORG.vejiga, ORG.residuo],
    m: [M3("Riñón derecho"), M1("Parénquima renal derecho"), M3("Riñón izquierdo"), M1("Parénquima renal izquierdo"), M3("Vejiga prevaciado"), M3("Vejiga posvaciado")] },
  fem: { t: "PELVIS FEMENINA", o: [ORG.utero, ORG.endometrio, ORG.ovario("DERECHO"), ORG.ovario("IZQUIERDO"), ORG.anexos],
    m: [M3("Útero"), M1("Endometrio"), M3("Ovario derecho"), M3("Ovario izquierdo")] },
  masc: { t: "PRÓSTATA / PELVIS MASCULINA", o: [ORG.prostata, ORG.vesiculas], m: [M3("Próstata")] },
  vejigaSola: { t: "VEJIGA", o: [ORG.vejiga, ORG.residuo], m: [M3("Vejiga prevaciado"), M3("Vejiga posvaciado")] },
  tiroides: { t: "TIROIDES Y CUELLO", o: [ORG.tiroides("DERECHO"), ORG.tiroides("IZQUIERDO"), ORG.istmo, ORG.glandulas, ORG.ganglios],
    m: [M3("Lóbulo tiroideo derecho"), M3("Lóbulo tiroideo izquierdo"), M1("Istmo")] },
  mama: { t: "MAMAS Y AXILAS", o: [ORG.mama("DERECHA"), ORG.mama("IZQUIERDA"), ORG.axila("DERECHA"), ORG.axila("IZQUIERDA")], m: [] },
  doppler: { t: "SISTEMA VENOSO DE MIEMBROS INFERIORES", o: [ORG.sistProf("DERECHO"), ORG.sistSup("DERECHO"), ORG.sistProf("IZQUIERDO"), ORG.sistSup("IZQUIERDO")],
    m: [M1("Safena mayor derecha (calibre)"), M1("Reflujo USF derecha", "s"), M1("Safena mayor izquierda (calibre)"), M1("Reflujo USF izquierda", "s")] },
  obst: { t: "EVALUACIÓN OBSTÉTRICA", o: [ORG.feto, ORG.presentacion, ORG.placenta, ORG.liquido, ORG.cordon, ORG.anatomia, ORG.cervix],
    m: [M1("LCC"), M1("DBP"), M1("CC"), M1("CA"), M1("LF"), M1("Frecuencia cardíaca fetal", "lpm"), M1("ILA", "cm"), M1("Longitud cervical")] },
};

const ESTUDIOS = {
  "US abdominal completo": ["abdomen", "renal"],
  "US abdominal superior": ["abdomen"],
  "US renal y de vías urinarias": ["renal"],
  "US general femenino": ["abdomen", "renal", "fem"],
  "US general masculino": ["abdomen", "renal", "masc"],
  "US pélvico transabdominal": ["vejigaSola", "fem"],
  "US prostático / vesicoprostático": ["vejigaSola", "masc"],
  "US de tiroides y cuello": ["tiroides"],
  "US de mamas": ["mama"],
  "US Doppler venoso de miembros inferiores": ["doppler"],
  "US obstétrico": ["obst"],
};

const PROCEDENCIAS = ["Consulta externa", "Emergencia", "Hospitalización", "Medicina interna", "Cirugía", "Ginecoobstetricia", "Pediatría", "Ortopedia", "Urología", "UCI", "Externo"];
