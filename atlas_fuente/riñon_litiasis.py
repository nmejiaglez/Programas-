"""Genera los esquemas anatómicos de litiasis renal (riñón en corte coronal) para el informe.
Uso: python3 riñon_litiasis.py carpeta_salida   (requiere cairosvg solo aquí; el informe usa los PNG)."""
import math, os, sys
import cairosvg

W, H = 820, 720
CX, CY, RX, RY = 380, 360, 175, 290      # riñón (elipse de referencia)
IRX, IRY = 138, 250                       # límite córtico-medular
S = (470, 360)                            # centro del seno renal
GRUPOS = {"superior": (98, 142), "medio": (158, 202), "inferior": (218, 262)}
UNION = {"superior": (452, 280), "medio": (440, 360), "inferior": (452, 440)}

def rayo_elipse(px, py, ang, rx, ry):
    dx, dy = math.cos(math.radians(ang)), -math.sin(math.radians(ang))
    ox, oy = px - CX, py - CY
    a = dx*dx/rx**2 + dy*dy/ry**2; b = 2*(ox*dx/rx**2 + oy*dy/ry**2); c = ox*ox/rx**2 + oy*oy/ry**2 - 1
    t = (-b + math.sqrt(b*b - 4*a*c)) / (2*a)
    return px + t*dx, py + t*dy

def punto(ang, r):
    return S[0] + r*math.cos(math.radians(ang)), S[1] - r*math.sin(math.radians(ang))

def svg(lado, sitio):
    m = (lambda x: W - x) if lado == "izquierdo" else (lambda x: x)
    P = lambda x, y: f"{m(x):.1f},{y:.1f}"
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W+120}" height="{H}" viewBox="0 0 {W+120} {H}">',
         '<rect width="100%" height="100%" fill="white"/><g transform="translate(60,0)">',
         '<defs><radialGradient id="cx" cx="40%" cy="40%"><stop offset="0" stop-color="#d9826a"/>'
         '<stop offset="1" stop-color="#a8483a"/></radialGradient>'
         '<radialGradient id="pi" cx="50%" cy="50%"><stop offset="0" stop-color="#b85a4c"/>'
         '<stop offset="1" stop-color="#8c3b30"/></radialGradient>'
         '<radialGradient id="li" cx="35%" cy="35%"><stop offset="0" stop-color="#c9a36b"/>'
         '<stop offset="0.6" stop-color="#7a5326"/><stop offset="1" stop-color="#4a2f12"/></radialGradient></defs>']
    # vasos del hilio (por detrás)
    o.append(f'<path d="M{P(470,318)} C{P(560,300)} {P(640,300)} {P(700,290)}" stroke="#7a1b1b" stroke-width="30" fill="none"/>')
    o.append(f'<path d="M{P(470,318)} C{P(560,300)} {P(640,300)} {P(700,290)}" stroke="#d23b3b" stroke-width="24" fill="none"/>')
    o.append(f'<path d="M{P(470,392)} C{P(560,400)} {P(640,410)} {P(705,415)}" stroke="#1d3e7a" stroke-width="36" fill="none"/>')
    o.append(f'<path d="M{P(470,392)} C{P(560,400)} {P(640,410)} {P(705,415)}" stroke="#4b7bd1" stroke-width="30" fill="none"/>')
    # contorno renal (cápsula + corteza) con hilio medial
    k = (f"M{P(370,70)} C{P(230,70)} {P(205,220)} {P(205,360)} C{P(205,500)} {P(230,650)} {P(370,650)} "
         f"C{P(480,650)} {P(545,560)} {P(540,470)} C{P(536,430)} {P(500,420)} {P(500,360)} "
         f"C{P(500,300)} {P(536,290)} {P(540,250)} C{P(545,160)} {P(480,70)} {P(370,70)} Z")
    o.append(f'<path d="{k}" fill="url(#cx)" stroke="#6e2a20" stroke-width="5"/>')
    # seno renal (grasa)
    o.append(f'<ellipse cx="{m(462):.1f}" cy="360" rx="62" ry="175" fill="#f5e3a6" stroke="#d9c27a" stroke-width="2"/>')
    # pirámides y cálices menores
    cal = {}
    for g, (a0, a1) in GRUPOS.items():
        cal[g] = []
        for ang in [a0 + i*(a1 - a0)/2 for i in range(3)]:
            ap = punto(ang, 92)
            b1 = rayo_elipse(S[0], S[1], ang - 8, IRX, IRY); b2 = rayo_elipse(S[0], S[1], ang + 8, IRX, IRY)
            o.append(f'<path d="M{P(*ap)} L{P(*b1)} Q{P(*rayo_elipse(S[0],S[1],ang,IRX+6,IRY+6))} {P(*b2)} Z" '
                     f'fill="url(#pi)" stroke="#6e2a20" stroke-width="1.5"/>')
            cal[g].append(punto(ang, 84))
    # sistema colector: cálices mayores, pelvis y uréter
    def tubo(d, w):
        o.append(f'<path d="{d}" stroke="#b89a3a" stroke-width="{w+5}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
        o.append(f'<path d="{d}" stroke="#fbeec0" stroke-width="{w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    for g in GRUPOS:
        for c in cal[g]:
            tubo(f"M{P(*c)} L{P(*UNION[g])}", 14)
        tubo(f"M{P(*UNION[g])} L{P(505,362)}", 24)
    tubo(f"M{P(495,362)} L{P(540,375)}", 52)
    tubo(f"M{P(545,385)} C{P(560,440)} {P(545,520)} {P(560,700)}", 16)
    for g in GRUPOS:
        for c in cal[g]:
            o.append(f'<circle cx="{m(c[0]):.1f}" cy="{c[1]:.1f}" r="11" fill="#fbeec0" stroke="#b89a3a" stroke-width="2.5"/>')
    # cálculo
    pos = {"superior": cal["superior"][1], "medio": cal["medio"][1], "inferior": cal["inferior"][1],
           "pelvis": (522, 368), "union_pieloureteral": (552, 405)}[sitio]
    x, y = m(pos[0]), pos[1]
    r = 15 if sitio in ("pelvis",) else 12
    pts = " ".join(f"{x + r*(1+0.25*math.sin(5*t))*math.cos(t):.1f},{y + r*(1+0.25*math.sin(5*t))*math.sin(t)*0.9:.1f}"
                   for t in [i*2*math.pi/14 for i in range(14)])
    o.append(f'<polygon points="{pts}" fill="url(#li)" stroke="#2b1a08" stroke-width="2"/>')
    o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r+13}" fill="none" stroke="#C00000" stroke-width="3" stroke-dasharray="6 4"/>')
    # rótulos
    def rot(txt, px, py, tx, ty, color="#1F3A5F", neg=False):
        anc = "end" if m(tx) < W/2 else "start"
        o.append(f'<line x1="{m(px):.1f}" y1="{py}" x2="{m(tx):.1f}" y2="{ty}" stroke="{color}" stroke-width="1.6"/>')
        o.append(f'<circle cx="{m(px):.1f}" cy="{py}" r="3" fill="{color}"/>')
        dx = -6 if anc == "end" else 6
        o.append(f'<text x="{m(tx)+dx:.1f}" y="{ty+5}" font-family="Arial" font-size="{19 if neg else 17}" '
                 f'font-weight="{"bold" if neg else "normal"}" fill="{color}" text-anchor="{anc}">{txt}</text>')
    rot("Cápsula y corteza renal", 225, 210, 150, 120)
    rot("Pirámide medular", *[round(v) for v in punto(180, 125)], 150, 360)
    rot("Grupo calicial superior", *[round(v) for v in UNION["superior"]], 150, 60)
    rot("Grupo calicial medio", *[round(v) for v in UNION["medio"]], 150, 470)
    rot("Grupo calicial inferior", *[round(v) for v in UNION["inferior"]], 150, 600)
    rot("Arteria renal", 640, 300, 720, 240)
    rot("Vena renal", 650, 410, 720, 480)
    rot("Pelvis renal", 530, 372, 720, 365)
    rot("Uréter", 553, 620, 720, 640)
    nombre = {"superior": "grupo calicial superior", "medio": "grupo calicial medio", "inferior": "grupo calicial inferior",
              "pelvis": "pelvis renal", "union_pieloureteral": "unión pieloureteral"}[sitio]
    o.append(f'<line x1="{x:.1f}" y1="{y-r-13:.1f}" x2="{x:.1f}" y2="25" stroke="#C00000" stroke-width="2"/>')
    o.append(f'<text x="{W/2}" y="22" font-family="Arial" font-size="21" font-weight="bold" fill="#C00000" text-anchor="middle">'
             f'Litiasis en {nombre} — riñón {lado}</text>')
    o.append(f'<text x="{W/2}" y="712" font-family="Arial" font-size="14" fill="#6B7280" text-anchor="middle">'
             'Esquema anatómico ilustrativo · corte coronal, vista anterior · no a escala</text>')
    o.append("</g></svg>")
    return "\n".join(o)

if __name__ == "__main__":
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for lado in ("derecho", "izquierdo"):
        for sitio in ("superior", "medio", "inferior", "pelvis", "union_pieloureteral"):
            cairosvg.svg2png(bytestring=svg(lado, sitio).encode(), write_to=f"{out}/litiasis_renal_{lado}_{sitio}.png",
                             output_width=1400)
    print("listo")
