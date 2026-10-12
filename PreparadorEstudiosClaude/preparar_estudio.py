# -*- coding: utf-8 -*-
"""
PREPARADOR DE ESTUDIOS PARA CLAUDE (TC / RM / US / Doppler)
Dr. Néstor José Mejía González - Radiología e Imagen

Claude NO reproduce video: analiza IMÁGENES. Este programa:
  1. Extrae fotogramas de videos (.mp4 .mov .avi .mkv .wmv) grabados del monitor/PACS.
  2. Convierte cortes DICOM (.dcm o sin extensión) a JPG con ventana adecuada.
  3. Elimina fotogramas repetidos (cuando el video se detiene en un mismo corte).
  4. Redimensiona a 1568 px (máximo útil para Claude) y comprime en JPG.
  5. Arma PAQUETES que respetan los límites de envío y reporta los MB por paciente.

Uso:
  python preparar_estudio.py  CARPETA_O_ARCHIVO  [--paciente "Maria Lopez"]
                              [--fps 2] [--modo web|api] [--umbral 6]
"""
import argparse, os, sys, io, math, shutil, datetime

try:
    import cv2
    import numpy as np
    from PIL import Image
except ImportError:
    sys.exit("Faltan librerías. Ejecute:  pip install opencv-python pillow numpy pydicom")

try:
    import pydicom
except ImportError:
    pydicom = None

# ---------------- LÍMITES DE ENVÍO (verificar periódicamente, pueden cambiar) ----------------
LIMITES = {
    # claude.ai (web / app): hasta 20 archivos por mensaje, 30 MB por archivo.
    "web": {"imgs_por_paquete": 20, "mb_por_imagen": 30.0, "mb_por_paquete": 30.0 * 20},
    # API de Anthropic: hasta 100 imágenes por solicitud, 5 MB por imagen, 32 MB por solicitud.
    "api": {"imgs_por_paquete": 100, "mb_por_imagen": 5.0, "mb_por_paquete": 32.0},
}
LADO_MAX = 1568          # px; más resolución la reduce Claude de todos modos
CALIDAD_JPG = 88
EXT_VIDEO = {".mp4", ".mov", ".avi", ".mkv", ".wmv", ".m4v", ".webm"}
EXT_IMG = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}


def redimensionar(img):
    w, h = img.size
    f = LADO_MAX / max(w, h)
    if f < 1:
        img = img.resize((round(w * f), round(h * f)), Image.LANCZOS)
    return img.convert("L") if es_gris(img) else img.convert("RGB")


def es_gris(img):
    a = np.asarray(img.convert("RGB").resize((64, 64)), dtype=np.int16)
    return np.abs(a[..., 0] - a[..., 1]).mean() < 2 and np.abs(a[..., 1] - a[..., 2]).mean() < 2


def a_jpg(img):
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=CALIDAD_JPG, optimize=True)
    return buf.getvalue()


def diferencia(a, b):
    """Diferencia media (0-255) entre dos fotogramas reducidos."""
    if a is None or b is None:
        return 255.0
    return float(np.abs(a.astype(np.int16) - b.astype(np.int16)).mean())


def miniatura(img):
    return np.asarray(img.convert("L").resize((96, 96)))


def frames_video(ruta, fps_obj, umbral):
    cap = cv2.VideoCapture(ruta)
    if not cap.isOpened():
        print(f"  [!] No se pudo abrir {ruta}")
        return
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    paso = max(1, round(fps / fps_obj))
    print(f"  Video: {os.path.basename(ruta)} | {total} fotogramas a {fps:.0f} fps "
          f"({total / fps:.1f} s) | muestreo cada {paso}")
    previa, i = None, 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if i % paso == 0:
            img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            m = miniatura(img)
            if diferencia(m, previa) >= umbral:
                previa = m
                yield f"{os.path.splitext(os.path.basename(ruta))[0]}_t{i / fps:07.2f}s", img
        i += 1
    cap.release()


def imagen_dicom(ruta):
    ds = pydicom.dcmread(ruta, force=True)
    arr = ds.pixel_array.astype(np.float32)
    if arr.ndim == 3 and arr.shape[-1] != 3:      # multiframe: corte central
        arr = arr[arr.shape[0] // 2]
    arr = arr * float(getattr(ds, "RescaleSlope", 1)) + float(getattr(ds, "RescaleIntercept", 0))
    c, w = getattr(ds, "WindowCenter", None), getattr(ds, "WindowWidth", None)
    if c is not None and w is not None:
        c = float(c[0] if isinstance(c, pydicom.multival.MultiValue) else c)
        w = float(w[0] if isinstance(w, pydicom.multival.MultiValue) else w)
        lo, hi = c - w / 2, c + w / 2
    else:
        lo, hi = np.percentile(arr, (0.5, 99.5))
    arr = np.clip((arr - lo) / max(hi - lo, 1) * 255, 0, 255).astype(np.uint8)
    if getattr(ds, "PhotometricInterpretation", "") == "MONOCHROME1":
        arr = 255 - arr
    orden = (int(getattr(ds, "SeriesNumber", 0) or 0), int(getattr(ds, "InstanceNumber", 0) or 0))
    return orden, Image.fromarray(arr)


def recolectar(entrada, fps, umbral, umbral_dicom=None):
    rutas = [entrada] if os.path.isfile(entrada) else sorted(
        os.path.join(r, f) for r, _, fs in os.walk(entrada) for f in fs)
    dicoms = []
    for r in rutas:
        ext = os.path.splitext(r)[1].lower()
        if ext in EXT_VIDEO:
            yield from frames_video(r, fps, umbral)
        elif ext in EXT_IMG:
            yield os.path.splitext(os.path.basename(r))[0], Image.open(r)
        elif ext in (".dcm", "") and pydicom:
            try:
                dicoms.append((*imagen_dicom(r), r))
            except Exception:
                pass
    if dicoms:
        print(f"  DICOM: {len(dicoms)} cortes")
        previa = None
        for (serie, inst), img, r in sorted(dicoms, key=lambda d: d[0]):
            m = miniatura(img)
            if diferencia(m, previa) >= (umbral / 2 if umbral_dicom is None else umbral_dicom):
                previa = m
                yield f"S{serie:03d}_I{inst:04d}", img


def mosaicos(fuente, lado, max_imgs):
    """Reduce cientos/miles de cortes a pocas imágenes: cada una es una cuadrícula lado x lado."""
    from PIL import ImageDraw
    celda = LADO_MAX // lado
    cortes = []
    for etiqueta, img in fuente:                     # se guardan reducidos para no agotar la memoria
        im = img.convert("L"); im.thumbnail((celda, celda), Image.LANCZOS)
        b = io.BytesIO(); im.save(b, "JPEG", quality=92); cortes.append((etiqueta, b.getvalue()))
    if not cortes:
        return
    cupo = lado * lado * max_imgs
    if len(cortes) > cupo:                           # cortes equidistantes a lo largo de todo el estudio
        cortes = [cortes[round(i * (len(cortes) - 1) / (cupo - 1))] for i in range(cupo)]
    print(f"  Cortes elegidos: {len(cortes)} (de forma equidistante) -> mosaicos de {lado}x{lado}")
    for k in range(0, len(cortes), lado * lado):
        grupo = cortes[k:k + lado * lado]
        hoja = Image.new("L", (celda * lado, celda * lado), 0)
        d = ImageDraw.Draw(hoja)
        try:
            from PIL import ImageFont
            fuente_txt = ImageFont.load_default(size=max(16, celda // 14))
        except Exception:
            fuente_txt = None
        for j, (etq, datos) in enumerate(grupo):
            im = Image.open(io.BytesIO(datos))
            x, y = (j % lado) * celda, (j // lado) * celda
            hoja.paste(im, (x + (celda - im.width) // 2, y + (celda - im.height) // 2))
            d.rectangle([x, y, x + celda - 1, y + celda - 1], outline=90)
            d.text((x + 6, y + 4), f"{k + j + 1}", fill=255, font=fuente_txt)
        yield f"mosaico_cortes_{k + 1:04d}-{k + len(grupo):04d}", hoja


def main():
    ap = argparse.ArgumentParser(description="Prepara TC/RM/US para analizar con Claude")
    ap.add_argument("entrada", help="Carpeta del paciente o archivo de video/DICOM")
    ap.add_argument("--paciente", default="", help="Nombre del paciente (para la carpeta de salida)")
    ap.add_argument("--fps", type=float, default=2.0, help="Fotogramas por segundo a muestrear (def. 2)")
    ap.add_argument("--umbral", type=float, default=6.0, help="Sensibilidad para descartar repetidos (def. 6)")
    ap.add_argument("--mosaico", type=int, default=4,
                    help="Cortes por lado de cada imagen (4 = 16 cortes por imagen; 1 = sin mosaico)")
    ap.add_argument("--max-imagenes", type=int, default=5, help="Máximo de imágenes a enviar (def. 5)")
    ap.add_argument("--modo", choices=LIMITES, default="web", help="web = claude.ai | api = API")
    a = ap.parse_args()

    lim = LIMITES[a.modo]
    nombre = (a.paciente or os.path.basename(os.path.normpath(a.entrada))).strip().replace(" ", "_")
    salida = os.path.join(os.path.dirname(os.path.abspath(a.entrada)), f"{nombre}_PARA_CLAUDE")
    shutil.rmtree(salida, ignore_errors=True)
    print(f"\nProcesando: {a.entrada}\nModo: {a.modo}\n")

    paquetes, actual, mb_actual, total_mb, n, original_mb = [], [], 0.0, 0.0, 0, 0.0
    if os.path.isfile(a.entrada):
        original_mb = os.path.getsize(a.entrada) / 1e6
    else:
        original_mb = sum(os.path.getsize(os.path.join(r, f))
                          for r, _, fs in os.walk(a.entrada) for f in fs) / 1e6

    if a.mosaico > 1:
        lim = dict(lim, imgs_por_paquete=a.max_imagenes)
        fuente = mosaicos(recolectar(a.entrada, a.fps, a.umbral, umbral_dicom=0), a.mosaico, a.max_imagenes)
    else:
        fuente = recolectar(a.entrada, a.fps, a.umbral)
    for etiqueta, img in fuente:
        datos = a_jpg(redimensionar(img))
        mb = len(datos) / 1e6 * (4 / 3 if a.modo == "api" else 1)   # base64 en API
        if actual and (len(actual) >= lim["imgs_por_paquete"] or mb_actual + mb > lim["mb_por_paquete"] * 0.95):
            paquetes.append(actual); actual, mb_actual = [], 0.0
        n += 1
        actual.append((f"{n:04d}_{etiqueta}.jpg", datos)); mb_actual += mb; total_mb += len(datos) / 1e6
    if actual:
        paquetes.append(actual)
    if not n:
        sys.exit("No se encontraron videos, imágenes ni DICOM válidos.")

    lineas = []
    for i, p in enumerate(paquetes, 1):
        d = os.path.join(salida, f"Paquete_{i:02d}")
        os.makedirs(d, exist_ok=True)
        for f, datos in p:
            with open(os.path.join(d, f), "wb") as fh:
                fh.write(datos)
        mb = sum(len(x) for _, x in p) / 1e6
        lineas.append(f"  Paquete_{i:02d}: {len(p):3d} imágenes | {mb:6.2f} MB")

    ahora = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")
    reporte = [
        "=" * 62, f" RESUMEN - {nombre.replace('_', ' ')}   ({ahora})", "=" * 62,
        f"  Tamaño original del estudio : {original_mb:8.2f} MB",
        f"  Imágenes útiles generadas   : {n:8d}",
        f"  Tamaño total para enviar    : {total_mb:8.2f} MB",
        f"  Promedio por imagen         : {total_mb / n * 1000:8.0f} KB",
        f"  Paquetes (1 paquete = 1 mensaje a Claude): {len(paquetes)}",
        *lineas, "",
        f"  Límites usados ({a.modo}): máx. {lim['imgs_por_paquete']} imágenes por mensaje, "
        f"{lim['mb_por_imagen']:.0f} MB por imagen" + (", 32 MB por solicitud" if a.modo == "api" else ""),
        "  Cada imagen es un mosaico numerado de cortes del estudio." if a.mosaico > 1 else
        "  Si salen demasiadas: use --fps 1 o --umbral 10.",
        f"\n  Carpeta: {salida}", "=" * 62,
    ]
    with open(os.path.join(salida, "RESUMEN.txt"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(reporte))
    print("\n".join(reporte))


if __name__ == "__main__":
    main()
