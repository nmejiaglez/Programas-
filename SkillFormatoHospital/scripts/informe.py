#!/usr/bin/env python3
"""Entrada única de preparación, generación y entrega técnica de informes."""
import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
import uuid
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from zipfile import ZipFile
from zoneinfo import ZoneInfo

from motor import ROOT, BRAND, digest, load_engine, sha

REF = ROOT / "references"
PROHIBIDO = re.compile(r"\b(?:normal(?:es|idad)?|anormal(?:es|idad)?|patologic[oa]s?|san[oa]s?)\b")
MARCADOR = re.compile(r"\b(?:pendiente|por completar|lorem ipsum|xxx|resto ok|sin datos)\b")
ID = re.compile(r"[a-z][a-z0-9_]*\Z")
UNIDADES = {"mm", "cm", "mL", "g", "kg", "%", "lpm", "cm/s", "m/s", "ms", "s",
            "UH", "°", "sin unidad", "mL/min", "cm³", "semanas", "días", "mm²", "cm²", "puntos"}
MAGNITUD = re.compile(
    r"(?<![\w.])(-?\d+(?:[.,]\d+)?(?:\s*[×x]\s*-?\d+(?:[.,]\d+)?){0,2})"
    r"\s*(cm/s|m/s|mL/min|cm[²³]|mm²|mm|cm|mL|lpm|kg|g|ms|s|UH|°|%)(?![\w/])", re.I)
VACUO = re.compile(r"(?:conservad[oa]s?|habitual(?:es)?|fisiologic[oa]s?|sin cambios|sin alteraciones|"
                   r"sin particularidades|sin hallazgos|ok|evaluad[oa]s?)[.!]?")
MEDIDAS_TIPADAS = {"longitud": ({1}, {"mm", "cm"}), "dimensiones": ({3}, {"mm", "cm"}),
                  "pre": ({1, 3}, {"mL", "cm³", "mm", "cm"}), "pos": ({1, 3}, {"mL", "cm³", "mm", "cm"}),
                  "fcf": ({1}, {"lpm"}), "dbp": ({1}, {"mm", "cm"}), "cc": ({1}, {"mm", "cm"}),
                  "ca": ({1}, {"mm", "cm"}), "lf": ({1}, {"mm", "cm"}), "pfe": ({1}, {"g", "kg"})}


def check(condition, message):
    if not condition:
        raise ValueError(message)


def unique(items):
    result = {}
    for key, value in items:
        check(key not in result, f"Clave JSON duplicada: {key}")
        result[key] = value
    return result


def read(path):
    return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=unique)


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def normalized(value):
    return "".join(c for c in unicodedata.normalize("NFKD", value.casefold()) if not unicodedata.combining(c))


def flat(value):
    return "".join(c for c in normalized(value) if c.isalnum())


def obj(value, required, optional=(), where="objeto"):
    check(isinstance(value, dict), f"{where}: se esperaba un objeto")
    missing = set(required) - value.keys()
    extra = value.keys() - set(required) - set(optional)
    check(not (missing or extra), f"{where}: faltan {sorted(missing)}. Campos inesperados {sorted(extra)}")
    return value


def phrase(value, where, editorial=False):
    check(isinstance(value, str) and any(c.isalpha() for c in value), f"{where}: falta texto")
    check(value == value.strip() and not any(ord(c) < 32 for c in value), f"{where}: usar texto de una línea")
    check(not any(c in value for c in ("**", "||", "[[", ">>", "{", "}", "|")), f"{where}: marcador reservado")
    if editorial:
        key = normalized(value)
        check(not VACUO.fullmatch(key), f"{where}: especifique el atributo evaluado")
        check(not PROHIBIDO.search(key) and not MARCADOR.search(key), f"{where}: término prohibido o marcador")
    return value


def case_id(value):
    check(isinstance(value, str) and re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,59}", value), "Identificador de caso inválido")
    return value


def protocol(value):
    check(isinstance(value, str) and ID.fullmatch(value), "Indicar un protocolo registrado")
    value = read(REF / "alias.json").get(value, value)
    path = REF / "protocolos" / f"{value}.json"
    check(path.is_file(), f"Protocolo sin ficha: {value}. Seleccione o configure una ficha específica")
    return read(path), path


def names(spec):
    return {item["id"]: item for item in spec["estructuras"]}


def validate_source(source, spec):
    obj(source, ("caso", "paciente", "protocolo", "tecnica", "hallazgos", "medidas"),
        ("indicacion", "clasificacion", "clasificaciones", "recomendaciones_solicitadas"), "fuente")
    case_id(source["caso"])
    patient = obj(source["paciente"], ("nombre", "modalidad"),
                  ("edad", "sexo", "medico", "procedencia", "fecha", "hora"), "paciente")
    for key, value in patient.items():
        if key == "fecha":
            datetime.strptime(value, "%d/%m/%Y")
        elif key == "hora":
            datetime.strptime(value, "%I:%M %p")
        elif key == "edad" and isinstance(value, int) and not isinstance(value, bool):
            check(value >= 0, "Edad negativa")
        else:
            phrase(value, key)
    for key in ("tecnica", "indicacion"):
        if key in source:
            phrase(source[key], key, editorial=key == "indicacion")
    if "recomendaciones_solicitadas" in source:
        check(type(source["recomendaciones_solicitadas"]) is bool, "recomendaciones_solicitadas debe ser booleano")
    expected = names(spec)
    obj(source["hallazgos"], expected, where="cobertura anatómica")
    for key, item in expected.items():
        entry = obj(source["hallazgos"][key], ("estado",), ("campos", "motivo"), key)
        if entry["estado"] == "evaluado":
            check("motivo" not in entry, f"{key}: motivo reservado para alcance o condición técnica")
            for field, value in obj(entry.get("campos"), item["campos"], where=key).items():
                phrase(value, f"fuente {key}.{field}")
        else:
            check(entry["estado"] in ("parcial", "no_evaluable", "fuera_de_alcance"), f"{key}: aclarar el dato esencial")
            phrase(entry.get("motivo"), f"{key}: motivo documentado")
            if entry["estado"] == "parcial":
                fields = obj(entry.get("campos"), (), item["campos"], key)
                check(bool(fields), f"{key}: consignar los aspectos realmente evaluados")
                for field, value in fields.items():
                    phrase(value, f"{key}.{field}")
            else:
                check("campos" not in entry, f"{key}: estado incompatible con hallazgos")
    check(any(e["estado"] in ("evaluado", "parcial") for e in source["hallazgos"].values()), "Sin hallazgos evaluados")

    check(isinstance(source["medidas"], list), "medidas debe ser una lista")
    seen = {}
    for row in source["medidas"]:
        obj(row, ("estructura", "id", "parametro", "valores", "unidad", "interpretacion"), where="medida")
        key, mid = row["estructura"], row["id"]
        check(key in expected and isinstance(mid, str) and ID.fullmatch(mid), "Identificador de medida inválido")
        check(source["hallazgos"][key]["estado"] in ("evaluado", "parcial"), f"{key}: medida sin evaluación")
        check((key, mid) not in seen, f"{key}.{mid}: medida duplicada")
        for field in ("parametro", "interpretacion"):
            phrase(row[field], f"{key}.{mid}.{field}", True)
        values, unit = row["valores"], row["unidad"]
        check(unit in UNIDADES, f"{key}.{mid}: unidad no reconocida")
        check(isinstance(values, list) and len(values) in (1, 2, 3), f"{key}.{mid}: valores inválidos")
        check(all(type(x) in (int, float) and math.isfinite(x) for x in values), f"{key}.{mid}: valor no finito o no numérico")
        if len(values) > 1:
            check(unit in {"mm", "cm"} and min(values) > 0, f"{key}.{mid}: dimensiones ortogonales positivas en mm o cm")
        if mid in expected[key]["medidas_requeridas"]:
            counts, units = MEDIDAS_TIPADAS[mid]
            check(len(values) in counts and unit in units and min(values) >= 0, f"{key}.{mid}: revisar unidad y valor")
            if mid in ("pre", "pos"):
                check((len(values) == 3) == (unit in {"mm", "cm"}), f"{key}.{mid}: indicar volumen escalar o tres ejes")
            if mid in ("longitud", "dimensiones", "pre"):
                check(min(values) > 0, f"{key}.{mid}: valor debe ser positivo")
        seen[key, mid] = row
    for key, item in expected.items():
        if source["hallazgos"][key]["estado"] == "evaluado":
            for mid in item["medidas_requeridas"]:
                check((key, mid) in seen, f"Falta medida esencial: {key}.{mid}")
    if spec["mediciones_us"] and not seen:
        # Una exploración cualitativa puede ser válida. Su alcance debe constar.
        check(spec["id"] in {"fast", "invaginacion", "perfil_biofisico", "pared_abdominal", "partes_blandas"}
              or any(e["estado"] == "parcial" for e in source["hallazgos"].values()),
              "Ultrasonido sin mediciones: aclarar qué cuantificación corresponde o documentar alcance técnico parcial")
    categories = classifications(source)
    expected = spec["clasificacion"]
    if expected:
        check(any(entry.get("sistema") == expected for entry in categories if isinstance(entry, dict)),
              f"Confirmar categoría {expected} y su sustento")
    for entry in categories:
        validate_classification(entry, source)


def classifications(source):
    if "clasificaciones" in source:
        entries = source["clasificaciones"]
        check("clasificacion" not in source and isinstance(entries, list) and entries,
              "Use una lista de clasificaciones o una clasificación individual")
        return entries
    return [source["clasificacion"]] if source.get("clasificacion") is not None else []


def supported_structures(refs, source, label):
    check(isinstance(refs, list) and refs and all(isinstance(ref, str) for ref in refs)
          and len(set(refs)) == len(refs), f"{label}: indique estructuras vinculadas")
    for ref in refs:
        check(source["hallazgos"].get(ref, {}).get("estado") in ("evaluado", "parcial"),
              f"{label} sin respaldo en estructura evaluada: {ref}")


def validate_classification(entry, source):
    obj(entry, ("sistema", "categoria", "sustento"), ("version", "estructura", "objetivo"), "clasificación")
    system = phrase(entry["sistema"], "sistema", True)
    category = phrase(entry["categoria"], "categoría", True)
    phrase(entry["sustento"], "sustento", True)
    for key in ("version", "objetivo"):
        if key in entry:
            phrase(entry[key], key, True)
    if "estructura" in entry:
        supported_structures([entry["estructura"]], source, "Clasificación")
    if "clasificaciones" in source:
        obj(entry, ("sistema", "categoria", "sustento", "version", "estructura", "objetivo"),
            where="clasificación por objetivo")
    if system == "BI-RADS":
        check(re.fullmatch(r"BI-RADS [0-6](?:[ABC])?", category),
              "Categoría BI-RADS inválida")
        check(len(category) == len("BI-RADS 0") or category.startswith("BI-RADS 4"),
              "Subcategoría BI-RADS reservada para categoría 4")


def anchor(folder):
    info = read(folder / "control.json")
    source_file = folder / "fuente.json"
    check(digest(source_file) == info["fuente_sha256"], "Cambió la fuente. Abra un caso nuevo para la corrección")
    source = read(source_file)
    spec, path = protocol(source["protocolo"])
    check(digest(path) == info["protocolo_sha256"], "Cambió el protocolo. Reabra el caso")
    check(digest(ROOT / "SKILL.md") == info["skill_sha256"]
          and digest(REF / "estandar.md") == info["estandar_sha256"]
          and digest(REF / "contrato.md") == info["contrato_sha256"], "Cambió el estándar. Reabra el caso")
    validate_source(source, spec)
    return info, source, spec


def open_case(source_file, root):
    source = read(source_file)
    check(isinstance(source, dict), "La fuente debe ser un objeto")
    spec, path = protocol(source.get("protocolo"))
    validate_source(source, spec)
    token = uuid.uuid4().hex
    folder = root / f"{source['caso']}-{token}"
    folder.mkdir(parents=True, exist_ok=False, mode=0o700)
    write(folder / "fuente.json", source)
    info = {"caso": source["caso"], "token": token, "fuente_sha256": digest(folder / "fuente.json"),
            "protocolo_sha256": digest(path), "skill_sha256": digest(ROOT / "SKILL.md"),
            "estandar_sha256": digest(REF / "estandar.md"), "contrato_sha256": digest(REF / "contrato.md")}
    write(folder / "control.json", info)
    return folder, info


def validate_draft(draft, info, source, spec, engine):
    obj(draft, ("caso", "token", "fuente_sha256", "tecnica", "hallazgos", "conclusiones"),
        ("recomendaciones", "etiologia", "diferenciales", "atlas"), "redacción")
    for key in ("caso", "token", "fuente_sha256"):
        check(draft[key] == info[key], f"Redacción ajena o desactualizada: {key}")
    editorial = lambda value, where: phrase(value, where, True)
    clinical = [editorial(draft["tecnica"], "técnica")]
    copies = 0
    fields = 0
    findings_text = set()
    expected = names(spec)
    obj(draft["hallazgos"], expected, where="hallazgos redactados")
    for key in expected:
        raw = source["hallazgos"][key]
        entry = obj(draft["hallazgos"][key], ("campos",), ("destacar",), key)
        check(type(entry.get("destacar", False)) is bool, f"{key}: destacar debe ser booleano")
        if raw["estado"] == "fuera_de_alcance":
            obj(entry["campos"], (), where=key)
            check(not entry.get("destacar"), f"{key}: no destacar un apartado fuera de alcance")
            continue
        labels = set(raw.get("campos", {}))
        if raw["estado"] != "evaluado":
            labels.add("motivo")
        for field, value in obj(entry["campos"], labels, where=key).items():
            clinical.append(editorial(value, f"{key}.{field}"))
            findings_text.add(flat(value))
            raw_text = raw["motivo"] if field == "motivo" else raw["campos"][field]
            copies += flat(value) == flat(raw_text)
            fields += 1
    conclusions = draft["conclusiones"]
    check(isinstance(conclusions, list) and conclusions, "Faltan conclusiones")
    for index, row in enumerate(conclusions, 1):
        obj(row, ("diagnostico", "sustento", "estructuras"), where=f"conclusión {index}")
        clinical.extend(editorial(row[k], k) for k in ("diagnostico", "sustento"))
        supported_structures(row["estructuras"], source, "Conclusión")
        check(all(flat(row[key]) not in findings_text for key in ("diagnostico", "sustento")),
              "Conclusión copiada de un hallazgo. Sintetice su significado clínico")
    analyses = []
    if "etiologia" in draft:
        analyses.append(draft["etiologia"])
    if "diferenciales" in draft:
        alternatives = draft["diferenciales"]
        check(isinstance(alternatives, list) and alternatives, "Diferenciales vacíos o inválidos")
        analyses.extend(alternatives)
    for row in analyses:
        obj(row, ("hipotesis", "sustento", "estructuras"), where="interpretación etiológica o diferencial")
        supported_structures(row["estructuras"], source, "Interpretación")
        clinical.extend(editorial(row[key], key) for key in ("hipotesis", "sustento"))
    if "atlas" in draft:
        atlas = obj(draft["atlas"], ("lado", "segmento", "estructura"), where="atlas de litiasis renal")
        side, segment, ref = atlas["lado"], atlas["segmento"], atlas["estructura"]
        check(side in ("derecho", "izquierdo") and ref == f"rinon_{side}"
              and segment in ("inferior", "medio", "superior", "pelvis", "union_pieloureteral"),
              "Seleccione lado y segmento documentados del atlas renal")
        supported_structures([ref], source, "Atlas")
        check(ref in conclusions[0]["estructuras"], "El atlas debe corresponder al problema principal")
        observations = " ".join(source["hallazgos"][ref]["campos"].values())
        key = {"pelvis": "pelvi", "union_pieloureteral": "pieloureteral"}.get(segment, segment)
        check(key in normalized(observations), "Segmento del atlas sin respaldo en el hallazgo fuente")
    if "recomendaciones" in draft:
        check(source.get("recomendaciones_solicitadas", True) and isinstance(draft["recomendaciones"], list)
              and draft["recomendaciones"], "Recomendaciones excluidas para este caso o vacías")
        clinical.extend(editorial(x, "recomendación") for x in draft["recomendaciones"])
    for value in clinical:
        check(not any(re.search(pattern, value, re.IGNORECASE) for pattern, _ in engine.PROHIBIDAS),
              "Se detectó una frase editorial incompatible con el informe")
    check(copies < fields, "Todos los campos de hallazgos son copia literal. Elabore la redacción clínica")
    raw_clinical = [source["tecnica"], source.get("indicacion", "")]
    for entry in source["hallazgos"].values():
        raw_clinical.extend(entry.get("campos", {}).values())
        raw_clinical.append(entry.get("motivo", ""))
    raw_clinical.extend(entry["sustento"] for entry in classifications(source))
    allowed = {item for value in raw_clinical for item in quantified(value)}
    for row in source["medidas"]:
        allowed.add((tuple(Decimal(str(x)) for x in row["valores"]), row["unidad"].casefold()))
        if computed := volume(row)[1]:
            allowed.update(quantified(computed))
    for value in clinical:
        for number, unit in quantified(value):
            check((number, unit) in allowed, f"Medición redactada sin respaldo exacto en la fuente: {number} {unit}")
    return {"campos_redactados": fields, "campos_identicos_a_fuente": copies}


def quantified(text):
    for match in MAGNITUD.finditer(text):
        values, unit = match.groups()
        yield tuple(Decimal(part.strip().replace(",", ".")) for part in re.split(r"[×x]", values)), unit.casefold()


def num(value):
    return str(value).removesuffix(".0")


def volume(row):
    values, unit = row["valores"], row["unidad"]
    if len(values) == 3:
        ml = math.prod(values) * 0.523 / (1000 if unit == "mm" else 1)
        return ml, f"{ml:.2f} cm³"
    if len(values) == 1 and unit in {"mL", "cm³"}:
        return values[0], None
    return None, None


def content(source, spec, draft):
    data = dict(source["paciente"])
    data["paciente"] = data.pop("nombre")
    if type(data.get("edad")) is int:
        data["edad"] = f"{data['edad']} años"
    data["formato"] = "HOSPITAL"
    # Mantener una sola fecha/hora para las verificaciones y la vista previa.
    now = datetime.now(ZoneInfo("America/Managua"))
    data.setdefault("fecha", now.strftime("%d/%m/%Y"))
    data.setdefault("hora", now.strftime("%I:%M %p"))
    findings = []
    categories = classifications(source)
    for key, item in names(spec).items():
        entry = draft["hallazgos"][key]
        if not entry["campos"]:
            continue
        fields = [entry["campos"][field] for field in (*item["campos"], "motivo") if field in entry["campos"]]
        featured = entry.get("destacar", False)
        labels = {row["categoria"] for row in categories if row.get("estructura") == key}
        if featured and len(labels) == 1:
            fields.append(f"- Estado: {next(iter(labels))}")
        findings.append((item["titulo"], featured, fields, []))
    study = [draft["tecnica"]]
    if "indicacion" in source:
        study.append(source["indicacion"])
    sections = {"ESTUDIO": study, "CONCLUSIONES": [f"{r['diagnostico']} || {r['sustento']}" for r in draft["conclusiones"]]}
    main_refs = draft["conclusiones"][0]["estructuras"]
    if any(draft["hallazgos"][key].get("destacar") for key in main_refs):
        sections["CONCLUSIONES"][0] = "PROBLEMA PRINCIPAL: " + sections["CONCLUSIONES"][0]
    for classification in categories:
        label = classification["categoria"]
        if "objetivo" in classification:
            label = f"{classification['objetivo']} · {label}"
        sections["CONCLUSIONES"].append(f"{label} || {classification['sustento']}")
    if "etiologia" in draft:
        cause = draft["etiologia"]
        sections["ETIOLOGIA"] = [f"{cause['hipotesis']}. {cause['sustento']}"]
    if draft.get("diferenciales"):
        sections["DIFERENCIALES"] = [f"{row['hipotesis']}. {row['sustento']}" for row in draft["diferenciales"]]
    if "atlas" in draft:
        atlas = draft["atlas"]
        data["atlas"] = f"litiasis_renal_{atlas['lado']}_{atlas['segmento']}"
    if draft.get("recomendaciones"):
        sections["RECOMENDACIONES"] = draft["recomendaciones"]
    measurements = []
    by_id = {}
    for row in source["medidas"]:
        key = row["estructura"]
        label = names(spec)[key]["titulo"]
        value = " × ".join(num(x) for x in row["valores"])
        if row["unidad"] != "sin unidad":
            value += " " + row["unidad"]
        else:
            # El motor original interpreta una cifra desnuda como milímetros.
            value += " (adimensional)"
        measurements.append((label, row["parametro"], value, volume(row)[1] or "", row["interpretacion"]))
        by_id[key, row["id"]] = row
    for key, item in names(spec).items():
        if not {"pre", "pos"}.issubset(item["medidas_requeridas"]):
            continue
        if (key, "pre") in by_id and (key, "pos") in by_id:
            pre = volume(by_id[key, "pre"])[0]
            post = volume(by_id[key, "pos"])[0]
            check(pre is not None and post is not None and 0 <= post <= pre, "Volúmenes pre/pos incompatibles. Verificar antes de calcular el residuo")
            measurements.append(("Residuo posmiccional", "Fracción", f"{100 * post / pre:.1f} %", "", "Del volumen premiccional"))
    if measurements:
        sections["MEDICIONES"] = [" | ".join(row) for row in measurements]
    return data, sections, findings, measurements


def verify_word(path, brands, data, sections, findings, measurements):
    from lxml import etree

    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
          "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
          "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
    with ZipFile(path) as z:
        check(z.testzip() is None, "Word corrupto")
        for part, required in (("document.xml", BRAND[:2]), ("header1.xml", BRAND[:2]),
                               ("footer1.xml", BRAND[2:]), ("footer2.xml", BRAND[2:])):
            xml = etree.fromstring(z.read("word/" + part))
            rels = etree.fromstring(z.read("word/_rels/" + part + ".rels"))
            images = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels if rel.attrib["Target"].startswith("media/")}
            embedded = {sha(z.read("word/" + images[ref])) for ref in xml.xpath("//a:blip/@r:embed", namespaces=ns)
                        if ref in images}
            check(all(brands[name] in embedded for name in required), f"Recurso institucional ausente en {part}")
        body = etree.fromstring(z.read("word/document.xml"))
        if "atlas" in data:
            manifest = read(ROOT / "assets" / "sha256.json")["incrustados"]
            checksum = manifest[f"atlas/{data['atlas']}.png"]
            rels = etree.fromstring(z.read("word/_rels/document.xml.rels"))
            targets = {rel.get("Id"): rel.get("Target") for rel in rels
                       if rel.get("Target", "").startswith("media/")}
            check(any(sha(z.read("word/" + targets[ref])) == checksum
                      for ref in body.xpath("//a:blip/@r:embed", namespaces=ns) if ref in targets),
                  "El esquema anatómico seleccionado no quedó incorporado")
        text = flat(" ".join(body.xpath("//w:t/text()", namespaces=ns)))
        rows = [[flat(" ".join(cell.xpath(".//w:t/text()", namespaces=ns)))
                 for cell in row.xpath("./w:tc", namespaces=ns)]
                for row in body.xpath("//w:tr[not(./w:tc//w:tbl)]", namespaces=ns)]
        for label, parameter, value, vol, interpretation in measurements:
            measure_cells = {flat(value), flat(value.removesuffix(" mm"))}
            volume_cells = {flat(vol), flat(vol.removesuffix(" cm³"))}
            check(any((flat(label + parameter) in row or (flat(label) in row and flat(parameter) in row))
                      and measure_cells.intersection(row) and flat(interpretation) in row
                      and (not vol or volume_cells.intersection(row)) for row in rows),
                  f"Fila de medida incompleta o incongruente: {label} / {parameter}")
        check("codigominsa37294" in text and "informeradiologico" in text, "Firma o encabezado ausente")
        required = [data["paciente"], data["modalidad"], data["fecha"], data["hora"], *sections["ESTUDIO"]]
        for key in ("edad", "sexo", "medico", "procedencia"):
            if key in data:
                required.append(data[key])
        required.extend(x.removeprefix("- Estado: ") for title, _, fields, _ in findings for x in [title, *fields])
        required.extend(x.strip() for row in sections["CONCLUSIONES"] for x in row.split("||"))
        for section in ("ETIOLOGIA", "DIFERENCIALES", "RECOMENDACIONES"):
            required.extend(sections.get(section, []))
        if "atlas" in data:
            required.append("ESQUEMA ANATÓMICO DEL PROBLEMA PRINCIPAL")
        for fragment in required:
            check(flat(fragment) in text, f"Texto no conservado en Word: {fragment[:100]}")
        return required


def render(word, staging, required, measurements):
    import fitz

    soffice = shutil.which("soffice") or shutil.which("libreoffice")
    check(soffice, "Instale LibreOffice Writer para generar y comprobar la vista previa")
    with tempfile.TemporaryDirectory(prefix="hospital-lo-") as profile:
        result = subprocess.run([soffice, f"-env:UserInstallation={Path(profile).as_uri()}",
                                 "--headless", "--convert-to", "pdf", "--outdir", str(staging), str(word)],
                                capture_output=True, text=True, timeout=120)
    pdf = word.with_suffix(".pdf")
    check(result.returncode == 0 and pdf.is_file(), "Falló la conversión a PDF con LibreOffice")
    with fitz.open(pdf) as doc:
        check(len(doc) > 0, "PDF vacío")
        pages = []
        combined = []
        for index, page in enumerate(doc, 1):
            text = page.get_text()
            combined.append(text)
            box = page.rect
            check(box.width < box.height, "La vista previa debe estar en orientación vertical")
            check(len(page.get_image_info()) >= 4, f"Página {index}: se esperaban imágenes institucionales")
            spans = [span for block in page.get_text("dict")["blocks"] if block["type"] == 0
                     for line in block["lines"] for span in line["spans"] if span["text"].strip()]
            for span in spans:
                x0, y0, x1, y1 = span["bbox"]
                check(x0 >= -1 and y0 >= -1 and x1 <= box.width + 1 and y1 <= box.height + 1,
                      f"Página {index}: texto fuera del área visible")
            body = [s for s in spans if 76 < s["bbox"][1] < box.height - 79]
            check(body, f"Página {index}: página sin cuerpo")
            preview = f"pagina-{index:02}.png"
            page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False).save(staging / preview)
            pages.append(preview)
        merged = flat(" ".join(combined))
        # Un párrafo puede cruzar página y quedar intercalado con su encabezado.
        ordered_spans = []
        for page in doc:
            for block in page.get_text("dict")["blocks"]:
                if block["type"] == 0:
                    for line in block["lines"]:
                        for span in line["spans"]:
                            if 59 < span["bbox"][1] < page.rect.height - 62:
                                ordered_spans.append(span["text"])
        body_merged = flat(" ".join(ordered_spans))
        for fragment in required:
            needle = flat(fragment)
            check(needle in merged or needle in body_merged, f"Texto ausente o cortado en PDF: {fragment[:100]}")
        for label, parameter, value, vol, interpretation in measurements:
            for full in (label, parameter, value, interpretation, vol):
                trimmed = full.removesuffix(" mm").removesuffix(" cm³")
                check(flat(full) in merged or flat(trimmed) in merged, f"Celda ausente en PDF: {full}")
        check("conclusiones" in merged and "codigominsa37294" in merged, "Conclusiones o firma ausentes en PDF")
        return pdf, pages


def generate(folder, draft_path):
    info, source, spec = anchor(folder)
    draft = read(draft_path)
    version = uuid.uuid4().hex
    with tempfile.TemporaryDirectory(prefix=".generacion-", dir=folder) as temp:
        staging = Path(temp) / "revision"
        staging.mkdir()
        engine, brands = load_engine(Path(temp) / "activos")
        audit = validate_draft(draft, info, source, spec, engine)
        data, sections, findings, measurements = content(source, spec, draft)
        engine.PRESENTACION = engine.detectar_presentacion(" ".join(x for _, _, fs, _ in findings for x in fs))
        engine.FIRMA_AL_FINAL = bool(sections.get("DIFERENCIALES") or sections.get("RECOMENDACIONES"))
        units = engine.unidades(data, sections, findings)
        word = staging / f"{source['caso']}_Hospital.docx"
        doc = engine.construir(data, units, 0, str(folder), engine.FORMATOS["HOSPITAL"])
        doc.core_properties.title = "Informe radiológico hospitalario"
        doc.save(word)
        required = verify_word(word, brands, data, sections, findings, measurements)
        pdf, pages = render(word, staging, required, measurements)
        write(staging / "redaccion.json", draft)
        artifact_names = [word.name, pdf.name, *pages, "redaccion.json"]
        write(staging / "verificacion.json", {
            **info, **audit, "revision": version, "paginas": pages,
            "archivos": {name: digest(staging / name) for name in artifact_names},
            "estado": "pendiente de revisión visual y cotejo de fuente",
        })
        final = folder / f"revision-{version}"
        staging.rename(final)
    return final


def release(folder, revision, pages):
    info, _, _ = anchor(folder)
    check(revision.parent.resolve() == folder.resolve(), "La revisión pertenece a otra carpeta")
    report = read(revision / "verificacion.json")
    check(all(report.get(key) == value for key, value in info.items()), "Revisión ajena o desactualizada")
    check(revision.name == "revision-" + report["revision"], "Identificador de revisión incompatible")
    check(pages == list(range(1, len(report["paginas"]) + 1)), "Confirme todas las páginas en orden")
    for name, checksum in report["archivos"].items():
        check(Path(name).name == name and digest(revision / name) == checksum, "Cambió un archivo de revisión")
    name = f"entrega-{report['revision']}"
    result = folder / name
    check(not result.exists(), "Esta revisión ya fue entregada")
    with tempfile.TemporaryDirectory(prefix=".entrega-", dir=folder) as temp:
        staging = Path(temp) / "entrega"
        staging.mkdir()
        for ext in ("docx", "pdf"):
            filename = f"{info['caso']}_Hospital.{ext}"
            shutil.copyfile(revision / filename, staging / filename)
            check(digest(staging / filename) == report["archivos"][filename], f"Archivo cambiado durante copia: {ext}")
        write(staging / "control-entrega.json", {
            "revision": report["revision"], "fuente_sha256": report["fuente_sha256"],
            "fecha_revision": datetime.now(ZoneInfo("America/Managua")).isoformat(),
            "paginas_revisadas": pages, "validacion_clinica": "a cargo del radiólogo",
        })
        staging.rename(result)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    p = commands.add_parser("protocolo")
    p.add_argument("codigo", nargs="?")
    p = commands.add_parser("abrir")
    p.add_argument("fuente", type=Path)
    p.add_argument("directorio", type=Path)
    for command in ("revisar", "generar"):
        p = commands.add_parser(command)
        p.add_argument("caso", type=Path)
        p.add_argument("redaccion", type=Path)
    p = commands.add_parser("entregar")
    p.add_argument("caso", type=Path)
    p.add_argument("revision", type=Path)
    p.add_argument("--paginas", type=int, nargs="+", required=True)
    p.add_argument("--cotejado", action="store_true", required=True)
    args = parser.parse_args()
    try:
        if args.command == "protocolo":
            if args.codigo is None:
                print("\n".join(p.stem for p in sorted((REF / "protocolos").glob("*.json"))))
            else:
                spec, _ = protocol(args.codigo)
                print(json.dumps(spec, ensure_ascii=False, indent=2))
        elif args.command == "abrir":
            folder, info = open_case(args.fuente, args.directorio)
            print(json.dumps({"directorio": str(folder.resolve()), **info}, ensure_ascii=False))
        elif args.command == "revisar":
            info, source, spec = anchor(args.caso.resolve())
            draft = read(args.redaccion)
            engine, _ = load_engine()
            audit = validate_draft(draft, info, source, spec, engine)
            content(source, spec, draft)
            print(json.dumps({"estado": "estructura verificada", **audit}, ensure_ascii=False))
        elif args.command == "generar":
            print(generate(args.caso.resolve(), args.redaccion))
        elif args.command == "entregar":
            print(release(args.caso, args.revision, args.paginas))
    except (ValueError, TypeError, KeyError, OSError, subprocess.SubprocessError) as error:
        print(f"BLOQUEADO. {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
