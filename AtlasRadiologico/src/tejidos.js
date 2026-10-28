/* ===================== TEJIDOS =====================
   us: ecogenicidad 0–1 · at: atenuación acústica (sombra) · fl: líquido (refuerzo posterior)
   hu: UH en TC simple · hc: UH con contraste IV · t1/t2/fr: señal relativa RM (0–1)
   rx: densidad radiográfica · op: 'add' suma densidad en proyección (hueso, glándula) */
const T = {
 fondo_us:  {us:.32},
 piel:      {us:.85,hu:40,t1:.5,t2:.4,fr:.4,rx:.4},
 grasa_sc:  {us:.3,hu:-100,t1:.92,t2:.75,fr:.8,rx:.28},
 grasa:     {us:.78,hu:-100,t1:.92,t2:.75,fr:.8,rx:.28},
 musculo:   {us:.27,hu:50,hc:60,t1:.38,t2:.2,fr:.25,rx:.42},
 tendon:    {us:.78,hu:85,t1:.05,t2:.05,fr:.05},
 higado:    {us:.5,hu:60,hc:110,t1:.56,t2:.3,fr:.3},
 bazo:      {us:.56,hu:48,hc:120,t1:.42,t2:.58,fr:.5},
 pancreas:  {us:.62,hu:45,hc:110,t1:.62,t2:.4,fr:.4},
 rinon:     {us:.4,hu:35,hc:180,t1:.46,t2:.56,fr:.5},
 med_renal: {us:.16,hu:35,hc:115,t1:.34,t2:.72,fr:.55},
 suprarrenal:{us:.5,hu:30,hc:70,t1:.45,t2:.4,fr:.4},
 intestino: {us:.45,hu:40,hc:90,t1:.4,t2:.45,fr:.4},
 liquido:   {us:0,fl:1,hu:5,hc:5,t1:.07,t2:.97,fr:.05,rx:.42},
 sangre:    {us:.02,fl:.7,hu:42,hc:270,t1:.08,t2:.06,fr:.06,t1c:.95},
 vena:      {us:.02,fl:.7,hu:40,hc:160,t1:.12,t2:.1,fr:.1,t1c:.85},
 hueso:     {us:1,at:1,hu:1200,t1:.04,t2:.04,fr:.04,rx:.55,op:'add'},
 esponjoso: {us:1,at:1,hu:260,t1:.8,t2:.55,fr:.5,rx:.35,op:'add'},
 calcio:    {us:1,at:1,hu:450,t1:.05,t2:.05,fr:.05,rx:.6,op:'add'},
 aire:      {us:.92,at:1,hu:-1000,t1:0,t2:0,fr:0,rx:0},
 pulmon:    {us:.55,at:1,hu:-860,t1:.02,t2:.03,fr:.02,rx:.1},
 cisura:    {us:.55,at:1,hu:-450,t1:.03,t2:.04,fr:.03},
 gris:      {us:.36,hu:38,hc:42,t1:.42,t2:.62,fr:.62},
 blanca:    {us:.42,hu:28,hc:30,t1:.66,t2:.38,fr:.42},
 palido:    {us:.4,hu:33,hc:36,t1:.5,t2:.45,fr:.45},
 dura:      {us:.85,hu:58,hc:90,t1:.2,t2:.1,fr:.1},
 miometrio: {us:.45,hu:50,hc:120,t1:.4,t2:.5,fr:.45},
 zona_union:{us:.22,hu:50,hc:110,t1:.4,t2:.12,fr:.12},
 endometrio:{us:.8,hu:50,hc:90,t1:.4,t2:.9,fr:.7},
 ovario:    {us:.38,hu:35,hc:80,t1:.35,t2:.7,fr:.5},
 testiculo: {us:.5,hu:40,hc:80,t1:.4,t2:.8,fr:.6},
 epididimo: {us:.54,hu:40,hc:80,t1:.4,t2:.55,fr:.5},
 prostata_zp:{us:.42,hu:40,hc:80,t1:.38,t2:.85,fr:.6},
 prostata_zt:{us:.34,hu:40,hc:80,t1:.38,t2:.38,fr:.35},
 ves_seminal:{us:.3,hu:25,hc:40,t1:.3,t2:.9,fr:.6},
 tiroides:  {us:.68,hu:100,hc:160,t1:.5,t2:.45,fr:.45},
 cartilago: {us:.05,hu:90,t1:.4,t2:.55,fr:.5},
 fibrocart: {us:.66,hu:80,t1:.04,t2:.04,fr:.04},
 nucleo:    {us:.4,hu:80,t1:.35,t2:.93,fr:.6},
 anillo:    {us:.6,hu:90,t1:.3,t2:.1,fr:.1},
 medula:    {us:.3,hu:35,hc:38,t1:.52,t2:.45,fr:.45},
 nervio:    {us:.55,hu:40,t1:.4,t2:.5,fr:.45},
 interfase: {us:.96,hu:50,t1:.3,t2:.2,fr:.2},
 plexo:     {us:.88,hu:60,hc:110,t1:.42,t2:.5,fr:.45},
 glandula:  {us:.8,hu:40,hc:60,t1:.35,t2:.4,fr:.4},
 neurohip:  {us:.4,hu:40,hc:90,t1:.95,t2:.5,fr:.5},
 // radiografía / mamografía (proyección)
 rx_blando: {rx:.42},
 rx_med:    {rx:.55},
 rx_pulmon: {rx:.1},
 rx_aire:   {rx:.12},
 rx_grasa:  {rx:.3},
 rx_hueso:  {rx:.22,op:'add'},
 rx_cortical:{rx:.4,op:'add'},
 rx_vaso:   {rx:.08,op:'add'},
 mg_grasa:  {rx:.2},
 mg_glan:   {rx:.3,op:'add'},
 mg_musc:   {rx:.5},
 mg_piel:   {rx:.55},
 mg_gang:   {rx:.25,op:'add'}
};

const NOMBRE_T = {piel:'piel',grasa_sc:'grasa subcutánea',grasa:'grasa',musculo:'músculo',tendon:'tendón',higado:'parénquima hepático',bazo:'parénquima esplénico',pancreas:'parénquima pancreático',rinon:'corteza renal',med_renal:'médula renal',suprarrenal:'glándula suprarrenal',intestino:'pared intestinal',liquido:'líquido',sangre:'sangre arterial / cavidad',vena:'sangre venosa',hueso:'hueso cortical',esponjoso:'hueso esponjoso / médula ósea',calcio:'calcificación',aire:'aire / gas',pulmon:'pulmón aireado',cisura:'cisura pleural',gris:'sustancia gris',blanca:'sustancia blanca',palido:'globo pálido',dura:'duramadre',miometrio:'miometrio',zona_union:'zona de unión',endometrio:'endometrio',ovario:'estroma ovárico',testiculo:'parénquima testicular',epididimo:'epidídimo',prostata_zp:'zona periférica prostática',prostata_zt:'zona de transición prostática',ves_seminal:'vesícula seminal',tiroides:'parénquima tiroideo',cartilago:'cartílago hialino',fibrocart:'fibrocartílago / ligamento',nucleo:'núcleo pulposo',anillo:'anillo fibroso',medula:'médula espinal',nervio:'nervio',interfase:'interfase ecogénica',plexo:'plexo coroideo',glandula:'tejido fibroglandular',neurohip:'neurohipófisis'};

function nivel(v,pal){return v<.06?pal[0]:v<.3?pal[1]:v<.5?pal[2]:v<.75?pal[3]:pal[4];}
/* Descripción de señal / ecogenicidad / densidad según modalidad */
function senal(t,grupo){const x=T[t];if(!x)return '';
 if(grupo=='US'){if(t=='interfase')return 'Interfase lineal marcadamente hiperecogénica (reflector especular).';
  let s=nivel(x.us,['Anecoico','Hipoecoico','Ecogenicidad intermedia','Hiperecoico','Marcadamente hiperecogénico']);
  if(x.at)s+=t=='pulmon'||t=='aire'?', con reverberación y sombra sucia posterior':', con sombra acústica posterior limpia';
  if(x.fl==1)s+=', con refuerzo acústico posterior';return s+'.';}
 if(grupo=='RX'||grupo=='MG'){const v=x.rx??.4;return (x.op?'Radiodensidad que se suma a la de estructuras superpuestas':v<.2?'Radiolúcido (aire)':v<.35?'Densidad grasa':v<.5?'Densidad de partes blandas':'Densidad aumentada')+'.';}
 const p=['hipointenso marcado (vacío de señal)','hipointenso','intermedio / isointenso','hiperintenso','hiperintenso marcado'];
 let s='';
 if(grupo=='AX')s+=`TC: ≈ ${x.hu} UH en fase simple${x.hc&&x.hc!=x.hu?`; ≈ ${x.hc} UH con contraste IV`:''}. `;
 if(x.t1!=null)s+=`RM: T1 ${nivel(x.t1,p)}; T2 ${nivel(x.t2,p)}${x.fr!=null&&grupo!='AX'||t=='liquido'?`; FLAIR ${nivel(x.fr,p)}`:''}.`;
 return s;}
