"""TC real con contraste de tórax-abdomen-pelvis (Pediatric-CT-SEG, TCIA vía IDC, CC BY 4.0)
con 29 órganos contorneados manualmente (RTSTRUCT). Paciente de 16 años.
Uso: python tc_pediatrico.py <carpeta_ct> <carpeta_rt> <salida> <ident> <titulo>"""
import sys, glob, json
import numpy as np, pydicom
from PIL import Image, ImageDraw
from atlaslib import exportar_pila, a_uint8
from nombres_tc import nombre_tc

CT, RT, OUT, ID = sys.argv[1:5]
fs = [pydicom.dcmread(f) for f in glob.glob(CT + '/*.dcm')]
fs = [d for d in fs if hasattr(d, 'ImagePositionPatient')]
fs.sort(key=lambda d: float(d.ImagePositionPatient[2]))
zs = np.array([float(d.ImagePositionPatient[2]) for d in fs])
o_ct = [float(v) for v in fs[0].ImagePositionPatient]
ps = [float(v) for v in fs[0].PixelSpacing]
dz = float(np.median(np.diff(zs)))
vol = np.stack([d.pixel_array.astype(np.float32) * float(d.RescaleSlope) + float(d.RescaleIntercept) for d in fs], -1)
vol = np.transpose(vol, (1, 0, 2))[:, ::-1, :]
print('volumen', vol.shape, ps, dz)

ALIAS = {'femoral head lef': 'femoral head left', 'femoral head rig': 'femoral head right', 'lung l': 'lung left',
         'lung r': 'lung right', 'gall bladder': 'gallbladder', 'kidney left': 'left kidney', 'kidney right': 'right kidney',
         'adrenal left': 'left adrenal gland', 'adrenal right': 'right adrenal gland', 'large intestine': 'colon'}
rt = pydicom.dcmread(glob.glob(RT + '/*.dcm')[0])
roin = {r.ROINumber: r.ROIName for r in rt.StructureSetROISequence}
EXCL = {'skin'}
# los órganos grandes primero para que los pequeños queden encima
PRIOR = ['bones', 'lung left', 'lung right', 'liver', 'small intestine', 'colon', 'heart']
items = []
for c in rt.ROIContourSequence:
    nm = roin[c.ReferencedROINumber].strip().lower().replace('_', ' ')
    nm = ALIAS.get(nm, nm)
    if nm in EXCL or not hasattr(c, 'ContourSequence'):
        continue
    items.append((PRIOR.index(nm) if nm in PRIOR else 99, nm, c))
items.sort(key=lambda t: t[0])
H, W = vol.shape[1], vol.shape[0]
lab = np.zeros(vol.shape, np.uint8); nombres = {}
for i, (_, nm, c) in enumerate(items, 1):
    capas = {}
    for cs in c.ContourSequence:
        p = np.array(cs.ContourData, float).reshape(-1, 3)
        k = int(np.argmin(np.abs(zs - p[0, 2])))
        if abs(zs[k] - p[0, 2]) > dz / 2:
            continue
        col = (p[:, 0] - o_ct[0]) / ps[1]
        fil = (p[:, 1] - o_ct[1]) / ps[0]
        capas.setdefault(k, []).append(list(zip(col, H - 1 - fil)))
    for k, polys in capas.items():
        im = Image.new('L', (W, H), 0); dr = ImageDraw.Draw(im)
        for poly in polys:            # XOR para respetar huecos
            m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(poly, fill=255)
            im = Image.fromarray(np.bitwise_xor(np.array(im), np.array(m)))
        mk = np.array(im).T > 0          # (x, y)
        lab[:, :, k][mk] = i
    if (lab == i).any():
        n, d = nombre_tc(nm)
        nombres[i] = {'n': n, 'd': d}
print('estructuras:', len(nombres), [v['n'] for v in nombres.values()])

v2, l2 = vol[::2, ::2, :], lab[::2, ::2, :]
win = lambda v: {'Partes blandas': a_uint8(v, -160, 240), 'Pulmón': a_uint8(v, -1350, 150), 'Hueso': a_uint8(v, -500, 1500)}
cuerpo = np.argwhere(v2 > -500); mn, mx = cuerpo.min(0), cuerpo.max(0) + 1
cz = np.argwhere(vol[::4, ::4, :] > -500)[:, 2]; z0, z1 = cz.min(), cz.max() + 1
f, n = exportar_pila(OUT, ID, 'axial', win(vol), lab, (ps[1], ps[0], dz), 2, (z0, z1), min_area=40, escala=0.75)
print('axial', n, round(f.stat().st_size / 1e6, 1))
for pl, r in (('coronal', (mn[1], mx[1])), ('sagital', (mn[0], mx[0]))):
    f, n = exportar_pila(OUT, ID, pl, win(v2), l2, (ps[1] * 2, ps[0] * 2, dz), 2, r, min_area=15, escala=1.4)
    print(pl, n, round(f.stat().st_size / 1e6, 1))
json.dump(nombres, open(f'{OUT}/{ID}_etiquetas.json', 'w'), ensure_ascii=False)
