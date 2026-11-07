#!/usr/bin/env python3
"""Post-proceso: separa en renglones con viñeta los bloques >> y los apartados de las tarjetas rojas.
Uso: python3 posproceso.py salida/ARCHIVO.docx"""
import docx,re,copy,sys
from docx.shared import RGBColor
from docx.text.run import Run
from docx.oxml.ns import qn
path=sys.argv[1]; d=docx.Document(path)
pat=re.compile(r'( ?>> [^-]+?(?= - )| - [A-ZÁÉÍÓÚ][^:\-]{0,30}:)')
def fix(p):
    from docx.enum.text import WD_ALIGN_PARAGRAPH as A
    from docx.shared import Inches
    if ">>" in p.text: p.alignment=A.LEFT
    if '>>' not in p.text or p.style is None: return
    for r in list(p.runs):
        t=r.text
        if not pat.search(t): continue
        parts=[x for x in pat.split(t) if x]
        prev=r._r
        for x in parts:
            nr=copy.deepcopy(r._r); prev.addnext(nr); prev=nr
            run=Run(nr,p); run.text=''
            if x.lstrip().startswith('>>'):
                run.add_break(); run.add_text(x.strip()[3:].strip()+':')
                run.bold=True; run.font.color.rgb=RGBColor(0x12,0x3A,0x78)
            elif x.startswith(' - '):
                run.add_break(); run.add_text('• '+x[3:]+' '); run.bold=True; run.font.color.rgb=RGBColor(0x22,0x2B,0x38)
            else:
                run.add_text(x)
        r._r.getparent().remove(r._r)
def walk(c):
    for p in c.paragraphs:
        if '>>' in p.text and 'Estática y vitalidad fetal:' not in p.text[:40]: fix(p)
    for t in c.tables:
        for row in t.rows:
            for cell in row.cells: walk(cell)
walk(d); d.save(path)
# tarjetas rojas: cada apartado en su renglón
d=docx.Document(path)
from docx.enum.text import WD_ALIGN_PARAGRAPH as A2
def card(c):
    for p in c.paragraphs:
        rs=p.runs
        if len(rs)>2 and rs[0].text.strip()=='▸':
            p.alignment=A2.LEFT
            for r in rs[2:]:
                if r.bold and r.text.rstrip().endswith(':') and len(r.text.strip())<32:
                    t=r.text.strip(); r.text=''; r.add_break(); r.add_text('• '+t+' ')
    for t in c.tables:
        for row in t.rows:
            for cell in row.cells: card(cell)
card(d); d.save(path)
