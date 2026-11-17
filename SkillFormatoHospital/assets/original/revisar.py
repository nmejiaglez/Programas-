#!/usr/bin/env python3
"""Revisor de calidad del dictado (.txt) FORMATO HOSPITAL.
Uso: python3 revisar.py dictado.txt   -> sale con código 1 y lista lo que falta.
Garantiza que el paciente 30 tenga el mismo nivel que el paciente 1."""
import re, sys, unicodedata
def n(s): return ''.join(c for c in unicodedata.normalize('NFD', s.upper()) if unicodedata.category(c) != 'Mn')
# título (normalizado, contiene) -> renglones obligatorios (rótulos '- Rótulo:')
REQ = {
 'RINON':       ['SITUACION Y FORMA', 'DIMENSIONES', 'PARENQUIMA', 'SISTEMA EXCRETOR'],
 'HIGADO':      ['TAMANO Y CONTORNOS', 'PARENQUIMA', 'LESIONES'],
 'UTERO':       ['POSICION', 'DIMENSIONES', 'MIOMETRIO'],
 'PROSTATA':    ['DIMENSIONES', 'ECOTEXTURA', 'LOBULO MEDIO'],
 'LOBULO':      ['DIMENSIONES', 'PARENQUIMA'],
 'BIOMETRIA':   ['DBP', 'CC', 'CA', 'LF', 'PFE'],
 'PLACENTA':    ['INSERCION', 'MADURACION'],
 'LIQUIDO AMNIOTICO': ['ILA'],
}
EXCLUIR = ['URETER', 'REGIONES', 'SUPRARRENAL', 'RETROPERITONEO', 'DOPPLER']
# exclusiones propias de cada órgano (p. ej. los riñones fetales no llevan los renglones del riñón adulto)
EXCLUIR_POR = {'RINON': ['FETAL', 'FETO', 'ANATOMIA'], 'LOBULO': ['MEDIO', 'HEPATIC', 'CAUDADO', 'PULMON'], 'HIGADO': ['FETAL']}
txt = open(sys.argv[1], encoding='utf-8').read()
cuerpo = txt.split('## MEDICIONES')[0]
bloques = re.split(r'^# (.+)$', cuerpo, flags=re.M)
errores = []
for i in range(1, len(bloques), 2):
    tit, texto = bloques[i].strip(), bloques[i+1]
    T = n(tit)
    rot = {n(m) for m in re.findall(r'^- ([^:]+):', texto, flags=re.M)}
    for clave, req in REQ.items():
        if clave in T and not any(e in T for e in EXCLUIR + EXCLUIR_POR.get(clave, [])):
            falt = [r for r in req if not any(r in x for x in rot)]
            if falt: errores.append(f'{tit}: faltan renglones {falt}')
    for les in re.findall(r'^>> (\d+\..*)\n((?:- .*\n?)*)', texto, flags=re.M):
        if not re.search(r'\d+(\.\d+)?\s*(mm|cm)|\{m:', les[1]):
            errores.append(f'{tit} / lesión "{les[0]}": sin medidas')
    palabras = len(re.sub(r'\{[^}]*\}', 'x', texto).split())
    if palabras < 6:
        errores.append(f'{tit}: descripción demasiado breve ({palabras} palabras, mínimo 6)')
if errores:
    print('REVISOR: INFORME INCOMPLETO — completar y volver a revisar (no generar el Word):')
    for e in errores: print('  -', e)
    sys.exit(1)
print('REVISOR OK: nivel completo.')
