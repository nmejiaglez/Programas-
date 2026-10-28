/* ===================== RESONANCIA — CORTES SAGITALES ===================== */
function columnaLumbar(){ // L1–S1 generado
 const s=[
 ['Grasa prevertebral / retroperitoneo','grasa','q 0,0 30,0 30,100 0,100','',{nl:1}],
 ['Aorta abdominal','sangre','k 5 10,0 10,74','Anterior a la columna; vacío de señal por flujo.'],
 ['Saco dural (LCR)','liquido','q 46,0 55,0 56,100 47,100','Hiperintenso en T2 (efecto mielográfico); diámetro AP lumbar > 12 mm.'],
 ['Grasa epidural posterior','grasa','q 55,0 58,0 59,100 56,100','Hiperintensa en T1 y T2.'],
 ['Cono medular','medula','l 3.2 50.5,0 50.8,10 51,18','Termina normalmente en L1–L2; por debajo de L2–L3 sugiere médula anclada.',{a:[51,12]}],
 ['Raíces de la cola de caballo','nervio','l .5 51,18 51.5,60 52,100','Raíces en disposición posterior del saco en decúbito.'],
 ['Raíces de la cola de caballo','nervio','l .5 50,20 50,100','',{nl:1}],
 ['Raíces de la cola de caballo','nervio','l .5 52.5,20 53.5,100','',{nl:1}],
 ['Músculos paravertebrales (multífido y erectores)','musculo','q 70,0 100,0 100,100 70,100','Atrofia grasa en dolor lumbar crónico.'],
 ['Grasa subcutánea','grasa','q 92,0 100,0 100,100 92,100','',{nl:1}],
 ];
 const niv=['L1','L2','L3','L4','L5'];
 niv.forEach((n,i)=>{const y=2+i*18;
  s.push([`Cuerpo vertebral ${n}`,'esponjoso',`q 22,${y} 44,${y} 45,${y+13} 22.5,${y+13}`,`Médula ósea grasa hiperintensa en T1. Medir altura anterior, media y posterior.`]);
  s.push([`Platillo superior ${n}`,'hueso',`k .6 22,${y+.3} 44,${y+.3}`,'',{nl:1}]);s.push([`Platillo inferior ${n}`,'hueso',`k .6 22.5,${y+12.7} 45,${y+12.7}`,i==2?'Láminas corticales hipointensas; cambios Modic en la médula subcondral adyacente.':'',i==2?{}:{nl:1}]);
  s.push([`Anillo fibroso ${n}-${i<4?niv[i+1]:'S1'}`,'anillo',`q 22.5,${y+13.4} 45,${y+13.4} 45.5,${y+17.6} 22.8,${y+17.6}`,i==3?'Fibras de colágeno hipointensas en T2; las fisuras anulares aparecen como foco hiperintenso (HIZ).':'',i==3?{}:{nl:1}]);
  s.push([`Disco ${n}-${i<4?niv[i+1]:'S1'} (núcleo pulposo)`,'nucleo',`e 34 ${y+15.5} 7 1.6`,i<3?'Núcleo hidratado hiperintenso en T2 (Pfirrmann I–II).':'Nivel más frecuente de degeneración y hernia discal.',i==0||i>=3?{}:{nl:1}]);
  s.push([`Apófisis espinosa ${n}`,'esponjoso',`q 66,${y+2} 82,${y} 84,${y+8} 66,${y+10}`,i==2?'Unida a la lámina; ligamentos interespinoso y supraespinoso entre ellas.':'',i==2?{}:{nl:1}]);
  s.push([`Ligamento amarillo ${n}`,'fibrocart',`k 1.2 58.5,${y+11} 60,${y+17}`,i==3?'Hipointenso; > 4 mm de grosor contribuye a estenosis de canal.':'',i==3?{}:{nl:1}]);
  s.push([`Lámina ${n}`,'hueso',`q 59,${y+1} 66,${y+2} 66,${y+10} 60,${y+10}`,'',{nl:1}]);
 });
 s.push(['Sacro (S1)','esponjoso','q 22,92 46,92 48,100 23,100','Promontorio sacro.']);
 s.push(['Ligamento longitudinal anterior','fibrocart','k .8 21.6,0 22,100','Banda hipointensa anterior a cuerpos y discos.']);
 s.push(['Ligamento longitudinal posterior','fibrocart','k .8 45.6,0 46.2,100','Hipointenso; limita hernias centrales.']);
 s.push(['Plexo venoso basivertebral','vena','k 1 38,47 44.5,47','Hendidura central posterior del cuerpo vertebral (L3).']);
 return s;}

const CORTES_RM = [
{id:'rm-sag-cer',g:'RMS',est:'Cráneo',n:'Cerebro — sagital medio',cab:'Sagital · línea media',ori:['Anterior ←'],rm:['T1','T2','FLAIR'],q:'sagittal brain MRI midline',ref:'rm-cer',
 s:[
 ['Cuero cabelludo y tejido celular subcutáneo','grasa_sc','e 54 44 44 41','Grasa hiperintensa en T1.',{nl:1}],
 ['Calota (díploe)','esponjoso','e 54 44 42.5 39.5','Díploe con médula ósea grasa.',{a:[54,4.8]}],
 ['Tabla interna','hueso','r 54 44 40.8 37.8 .8','',{nl:1}],
 ['Espacio subaracnoideo','liquido','e 54 44 40 37','',{nl:1}],
 ['Corteza cerebral','gris','e 54 44 39 36','Giros de la cara medial de los hemisferios.',{surcos:40,a:[86,22]}],
 ['Seno sagital superior','vena','l 1.3 22,18 40,8.5 60,7.3 80,12 92,30 94,46','Seno venoso dural en el borde superior de la hoz; trombosis = signo del delta vacío.'],
 ['Giro del cíngulo','gris','l 3 30,38 40,28.5 56,26 70,29 76,36','Sistema límbico, por encima del surco calloso.'],
 ['Surco calloso','liquido','l .8 33,36 44,31 58,30.5 69,34','Separa el cuerpo calloso del giro del cíngulo.',{nl:1}],
 ['Ventrículo lateral (cuerpo)','liquido','p 35,42 44,37 58,36 66,40 62,44 48,43 38,45','Sobre el tálamo y el fórnix.'],
 ['Rodilla del cuerpo calloso','blanca','l 3 35,46 31.5,41.5 35,36.5','Porción anterior curva.'],
 ['Cuerpo del cuerpo calloso','blanca','l 3 35,36 46,33 58,32.5 67,35','Comisura mayor; adelgazamiento en atrofia; lesiones en dedos de Dawson (EM).'],
 ['Esplenio del cuerpo calloso','blanca','e 69 39 3.4 2.8','Porción posterior engrosada.'],
 ['Rostro del cuerpo calloso','blanca','l 1.8 35,46 38,49','Continúa con la lámina terminal.'],
 ['Septum pelúcido / fórnix','blanca','l 1.4 62,44.5 54,46.5 46,48','Fórnix: vía eferente del hipocampo.'],
 ['Tercer ventrículo','liquido','p 43,50 58,49 60,56 51,60 44,56','En la línea media entre los tálamos.'],
 ['Adhesión intertalámica (masa intermedia)','gris','e 52 53 2.4 1.8','Puente gris que cruza el III ventrículo.'],
 ['Comisura anterior','blanca','e 42 50.5 .9 .9','Referencia de la línea CA-CP.'],
 ['Quiasma óptico','blanca','e 40 59.5 3 1.1','Sobre la silla turca; compresión por macroadenoma (hemianopsia bitemporal).'],
 ['Tallo hipofisario (infundíbulo)','gris','l 1 41,60.5 40.5,65','Grosor < 3 mm, de inserción central.'],
 ['Adenohipófisis','gris','e 38.6 68 3.4 2.3','Altura normal ≤ 9 mm (hasta 12 mm en embarazo).'],
 ['Neurohipófisis (punto brillante)','neurohip','e 42.2 68 1.4 1.8','Hiperintensa en T1; su ausencia se asocia a diabetes insípida central.'],
 ['Silla turca','hueso','l 1.4 34.5,66 36.5,71.5 43,71.8 45,66.5','Fosa hipofisaria del esfenoides.'],
 ['Seno esfenoidal','aire','p 25,63 34,62 35,74 27,74','Debajo de la silla; abordaje transesfenoidal.'],
 ['Clivus','esponjoso','l 4 40,74 45,82 50,90','Médula ósea grasa hiperintensa en T1 (la pérdida sugiere infiltración).'],
 ['Mesencéfalo','blanca','p 50,58 58,56 62,62 56,66 50,64','Pedúnculos cerebrales y techo.'],
 ['Lámina cuadrigémina (tectum)','gris','e 63.5 60 2.4 2.2','Colículos superiores e inferiores.'],
 ['Acueducto de Sylvio','liquido','l .8 58,59.5 61,64','Comunica III y IV ventrículos; su estenosis produce hidrocefalia.'],
 ['Cisterna prepontina','liquido','e 46.5 72 2.4 6','Contiene la arteria basilar.'],
 ['Arteria basilar','sangre','l 1.2 46.8,66 47.5,78','Vacío de señal por flujo.'],
 ['Protuberancia (puente)','blanca','e 53 71 6 5.6','Abombamiento anterior del tronco.'],
 ['Bulbo raquídeo','blanca','l 5 52,76 53,88','Unión bulbomedular a nivel del foramen magno.'],
 ['Médula cervical','medula','l 4 53,88 54,100','',{}],
 ['Cuarto ventrículo','liquido','q 57.5,67.5 64,70 60.5,76 56,72','Techo formado por el velo medular; fastigio en su vértice posterior.'],
 ['Vermis cerebeloso','gris','e 70 74 12 10','Folias con patrón arborescente (árbol de la vida).',{surcos:26}],
 ['Sustancia blanca cerebelosa (árbol de la vida)','blanca','l 1.4 62,72 68,72 74,70','',{nl:1}],
 ['Amígdala cerebelosa','gris','e 61 84 2.6 2','Su descenso > 5 mm bajo el foramen magno define Chiari I.'],
 ['Cisterna magna','liquido','e 74 87 5 3','Posterior e inferior al vermis.'],
 ['Seno recto','vena','l 1.4 70,40 78,48 85,56','Unión de la vena de Galeno y el seno sagital inferior.'],
 ['Surco parietooccipital','liquido','l .8 82,26 76,44','Separa lóbulos parietal y occipital en la cara medial.'],
 ['Cisura calcarina','liquido','l .8 76,46 90,54','Corteza visual primaria (área 17).'],
 ['Surco central (cara medial / lobulillo paracentral)','liquido','l .7 58,9 59,20','',{}],
 ['Lóbulo frontal','-','pt 22 32','',{}],
 ['Lóbulo parietal','-','pt 70 17','',{}],
 ['Lóbulo occipital','-','pt 87 42','',{}],
 ['Nasofaringe','aire','p 18,74 28,76 31,86 18,86','Vía aérea; adenoides en su techo.'],
 ['Apófisis odontoides (C2)','esponjoso','e 50 97 3 4','Relación con el foramen magno (línea de Chamberlain).'],
 ]},

{id:'rm-sag-lum',g:'RMS',est:'Columna',n:'Columna lumbar — sagital medio',cab:'Sagital · línea media',ori:['Anterior ←'],rm:['T2','T1'],q:'sagittal lumbar spine MRI T2',ref:'rm-col',s:columnaLumbar()},

{id:'rm-sag-rod',g:'RMS',est:'Musculoesquelético',n:'Rodilla — sagital por la escotadura (LCA y LCP)',cab:'Sagital · intercondíleo',ori:['Anterior ←'],rm:['T1','T2'],q:'sagittal knee MRI cruciate ligament',ref:'rm-rod',
 s:[
 ['Tejido celular subcutáneo','grasa_sc','q 0,0 100,0 100,100 0,100','',{nl:1}],
 ['Músculo cuádriceps','musculo','q 18,0 34,0 32,22 20,24','Vasto intermedio y recto femoral.'],
 ['Tendón cuadricipital','tendon','k 2.2 28,0 24,26','Hipointenso homogéneo; estructura trilaminar.'],
 ['Receso suprarrotuliano (bursa)','liquido','l 2 34,10 32,26','Comunica con la articulación; derrame articular.'],
 ['Grasa prefemoral','grasa','e 36 18 2.4 8','',{nl:1}],
 ['Diáfisis-metáfisis femoral (médula ósea)','esponjoso','p 36,0 64,0 66,30 70,46 52,52 34,48 34,30','Médula ósea grasa hiperintensa en T1.',{a:[50,20]}],
 ['Cortical femoral anterior','hueso','l .8 36,0 34,30 34,46','',{nl:1}],
 ['Cortical femoral posterior','hueso','l .8 64,0 66,30 70,46','',{nl:1}],
 ['Línea de Blumensaat (techo de la escotadura)','hueso','k 1 40,42 64,32','El LCA normal es paralelo a esta línea.'],
 ['Rótula','esponjoso','p 22,26 28,25 30,40 24,46 20,38','Médula grasa; cartílago rotuliano posterior (el más grueso del cuerpo).'],
 ['Cartílago rotuliano','cartilago','l 1.2 28.5,27 30.5,40 26,46','Valorar condromalacia (Outerbridge).'],
 ['Cartílago troclear','cartilago','l 1.1 34,32 34,46 40,51','',{}],
 ['Tendón rotuliano','tendon','l 2 23,46 22,62 25,78','Hipointenso; índice de Insall-Salvati 0.8–1.2.'],
 ['Grasa de Hoffa (infrarrotuliana)','grasa','p 26,48 38,52 38,62 30,72 24,62','Edema en el síndrome de pinzamiento de Hoffa.'],
 ['Cartílago femoral','cartilago','l 1 40,52 52,54 66,49','',{nl:1}],
 ['Ligamento cruzado anterior','fibrocart','l 2.2 58,44 50,54 41,63','De la cara medial del cóndilo lateral a la espina tibial anterior; fibras tensas, paralelas a Blumensaat.'],
 ['Ligamento cruzado posterior','fibrocart','l 3 54,44 63,48 66,56 64,66','Banda gruesa hipointensa en arco; más fuerte que el LCA.'],
 ['Espinas tibiales (eminencia intercondílea)','-','pt 46 60','Inserción tibial del LCA.'],
 ['Epífisis tibial proximal','esponjoso','p 32,60 50,58 70,60 72,70 66,100 38,100 34,72','Médula ósea grasa; edema óseo en contusión.',{a:[52,80]}],
 ['Cortical tibial','hueso','k .8 32,60 50,58 72,60','',{nl:1}],
 ['Cartílago tibial','cartilago','k 1 34,58.5 50,57 70,58.5','',{nl:1}],
 ['Cápsula articular posterior','fibrocart','l .8 70,46 74,60','',{nl:1}],
 ['Músculo gastrocnemio (cabezas)','musculo','q 74,30 94,30 96,100 76,100','Origen en los cóndilos femorales; el quiste de Baker sale entre el gastrocnemio medial y el semimembranoso.'],
 ['Arteria poplítea','sangre','k 2 80,0 82,100','En la fosa poplítea, profunda a la vena.'],
 ['Vena poplítea','vena','k 2.4 86,0 88,100','',{}],
 ['Músculo poplíteo','musculo','p 70,66 76,70 76,80 68,78','Posterior a la tibia proximal.'],
 ]},
];
