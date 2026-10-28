"""TC real de tórax, abdomen y pelvis superior (NLST, NCI/TCIA vía Imaging Data Commons, CC BY 4.0)
con segmentación TotalSegmentator v1.5.6 (89 estructuras) publicada en IDC.
Uso: python tc_nlst.py <carpeta_ct> <carpeta_seg> <salida>"""
import sys, glob, json
import numpy as np, pydicom
from atlaslib import exportar_pila, a_uint8
from nombres_tc import nombre_tc

CT, SEG, OUT = sys.argv[1:4]
fs = [pydicom.dcmread(f) for f in glob.glob(CT + '/*.dcm')]
fs.sort(key=lambda d: float(d.ImagePositionPatient[2]))
zs = np.array([float(d.ImagePositionPatient[2]) for d in fs])
vol = np.stack([d.pixel_array.astype(np.float32) * float(d.RescaleSlope) + float(d.RescaleIntercept) for d in fs], -1)
# DICOM (filas=posterior, columnas=izquierda) -> RAS [x, y, z]
vol = np.transpose(vol, (1, 0, 2))[:, ::-1, :]
ps = [float(v) for v in fs[0].PixelSpacing]
dz = float(np.median(np.diff(zs)))
print('volumen', vol.shape, 'px', ps, 'dz', dz)

seg = pydicom.dcmread(glob.glob(SEG + '/*.dcm')[0])
px = seg.pixel_array
etq = {s.SegmentNumber: s.SegmentLabel for s in seg.SegmentSequence}
# geometría: mapear cada píxel de la segmentación a la fila/columna de la TC por coordenadas del paciente
ori = [float(v) for v in seg.SharedFunctionalGroupsSequence[0].PlaneOrientationSequence[0].ImageOrientationPatient]
sps = [float(v) for v in seg.SharedFunctionalGroupsSequence[0].PixelMeasuresSequence[0].PixelSpacing]
o_ct = [float(v) for v in fs[0].ImagePositionPatient]
R, C = px.shape[1:]
lab = np.zeros(vol.shape, np.uint8)
nombres = {}
for f, fg in enumerate(seg.PerFrameFunctionalGroupsSequence):
    sn = int(fg.SegmentIdentificationSequence[0].ReferencedSegmentNumber)
    z = float(fg.PlanePositionSequence[0].ImagePositionPatient[2])
    k = int(np.argmin(np.abs(zs - z)))
    if abs(zs[k] - z) > dz / 2:
        continue
    o = [float(v) for v in fg.PlanePositionSequence[0].ImagePositionPatient]
    rr, cc = np.nonzero(px[f])
    if not len(rr):
        continue
    xp = o[0] + cc * sps[1] * ori[0] + rr * sps[0] * ori[3]
    yp = o[1] + cc * sps[1] * ori[1] + rr * sps[0] * ori[4]
    col = np.round((xp - o_ct[0]) / ps[1]).astype(int)       # columna TC = x RAS
    fil = np.round((yp - o_ct[1]) / ps[0]).astype(int)       # fila TC (posterior hacia abajo)
    ok = (col >= 0) & (col < vol.shape[0]) & (fil >= 0) & (fil < vol.shape[1])
    lab[col[ok], vol.shape[1] - 1 - fil[ok], k] = sn
for sn, e in etq.items():
    if (lab == sn).any():
        n, d = nombre_tc(e)
        nombres[sn] = {'n': n, 'd': d}
print('estructuras con vóxeles:', len(nombres))

# reducción en el plano a ~1.2 mm para coronal/sagital
v2, l2 = vol[::2, ::2, :], lab[::2, ::2, :]
win = lambda v: {'Partes blandas': a_uint8(v, -160, 240), 'Pulmón': a_uint8(v, -1350, 150), 'Hueso': a_uint8(v, -500, 1500)}
cuerpo = np.argwhere(v2 > -500)
mn, mx = cuerpo.min(0), cuerpo.max(0) + 1
esp_full = (ps[1], ps[0], dz)
esp2 = (ps[1] * 2, ps[0] * 2, dz)
f, n = exportar_pila(OUT, 'tc-torax-abdomen', 'axial', win(vol), lab, esp_full, 2, min_area=40, escala=0.75)
print('axial', n, round(f.stat().st_size / 1e6, 1), 'MB')
f, n = exportar_pila(OUT, 'tc-torax-abdomen', 'coronal', win(v2), l2, esp2, 2, (mn[1], mx[1]), min_area=15, escala=1.4)
print('coronal', n, round(f.stat().st_size / 1e6, 1), 'MB')
f, n = exportar_pila(OUT, 'tc-torax-abdomen', 'sagital', win(v2), l2, esp2, 2, (mn[0], mx[0]), min_area=15, escala=1.4)
print('sagital', n, round(f.stat().st_size / 1e6, 1), 'MB')
json.dump(nombres, open(OUT + '/tc-torax-abdomen_etiquetas.json', 'w'), ensure_ascii=False)
