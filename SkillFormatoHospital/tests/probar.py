#!/usr/bin/env python3
"""Prueba secuencial del mismo flujo en un directorio nuevo."""
import argparse
import copy
import subprocess

import sys
from pathlib import Path
from zipfile import ZipFile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from escenarios import CODES, sample
from informe import REF, flat, generate, names, open_case, protocol, read, release, write


def blocked(label, callback, expected, audit):
    try:
        callback()
    except ValueError as error:
        assert expected in str(error), (label, str(error))
        audit.append({"prueba": label, "estado": "BLOQUEADO", "motivo": str(error)})
    else:
        raise AssertionError(f"Se aceptó una entrada inválida: {label}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("directorio", type=Path)
    parser.add_argument("--cantidad", type=int, default=34)
    args = parser.parse_args()
    root = args.directorio.resolve()
    root.mkdir(exist_ok=False, parents=True)
    audit = []
    previous = None

    def start(source, name):
        path = root / f"{name}.json"
        write(path, source)
        return open_case(path, root / "casos")

    cards = sorted((REF / "protocolos").glob("*.json"))
    assert len(cards) >= 70
    for card in cards:
        spec, _ = protocol(card.stem)
        assert spec["id"] == card.stem and len(names(spec)) == len(spec["estructuras"])
        assert all(item["campos"] for item in spec["estructuras"])
    first_source, _ = sample(1, "renal")
    blocked("Entrada vacía", lambda: start({}, "vacio"), "protocolo registrado", audit)
    removed = copy.deepcopy(first_source)
    removed["hallazgos"].pop("rinon_izquierdo")
    blocked("Riñón izquierdo omitido", lambda: start(removed, "sin-izquierdo"), "rinon_izquierdo", audit)
    removed = copy.deepcopy(first_source)
    removed["medidas"] = [row for row in removed["medidas"] if row["estructura"] != "rinon_izquierdo"]
    blocked("Longitud renal ausente", lambda: start(removed, "sin-longitud"), "Falta medida esencial", audit)
    unknown = copy.deepcopy(first_source)
    unknown["protocolo"] = "libre"
    blocked("Protocolo libre", lambda: start(unknown, "protocolo-libre"), "Protocolo sin ficha", audit)
    wrong_unit = copy.deepcopy(first_source)
    wrong_unit["medidas"][0]["unidad"] = "lpm"
    blocked("Unidad renal incompatible", lambda: start(wrong_unit, "unidad"), "revisar unidad", audit)
    mammogram, _ = sample(2, "mamografia")
    del mammogram["clasificacion"]
    blocked("Mamografía sin clasificación", lambda: start(mammogram, "sin-bi-rads"), "Confirmar categoría", audit)
    for i in range(1, args.cantidad + 1):
        code = {29: "obstetrico", 30: "renal", 31: "renal_solo", 32: "renal_prostata", 33: "rm_rodilla",
                34: "obstetrico"}.get(i, CODES[(i - 1) % len(CODES)])
        source, draft = sample(i, code)
        folder, control = start(source, source["caso"])
        if i == 1:
            blocked("Redacción vacía", lambda: generate(folder, root / "vacio.json"), "redacción: faltan", audit)
            script = Path(__file__).resolve().parents[1] / "scripts/informe.py"
            result = subprocess.run([sys.executable, str(script), "revisar", str(folder), str(root / "vacio.json")],
                                    capture_output=True, text=True, encoding="utf-8")
            assert result.returncode == 1 and "BLOQUEADO" in result.stderr
            audit.append({"prueba": "Revisor CLI con redacción vacía", "estado": "BLOQUEADO", "motivo": result.stderr.strip()})
        draft.update({key: control[key] for key in ("caso", "token", "fuente_sha256")})
        draft_path = folder / "entrada-redaccion.json"
        if i == 1:
            for label, key, value, message in (
                ("Sin conclusiones", "conclusiones", [], "Faltan conclusiones"),
                ("Sin hallazgos", "hallazgos", {}, "hallazgos redactados: faltan"),
                ("Marcador genérico", "tecnica", "Resto ok", "término prohibido"),
            ):
                write(draft_path, {**draft, key: value})
                blocked(label, lambda: generate(folder, draft_path), message, audit)
            invalid = copy.deepcopy(draft)
            invalid["conclusiones"][0]["estructuras"] = ["estructura_inventada"]
            write(draft_path, invalid)
            blocked("Conclusión sin estructura fuente", lambda: generate(folder, draft_path), "sin respaldo", audit)
            literal = copy.deepcopy(draft)
            literal["tecnica"] = source["tecnica"]
            for key, entry in literal["hallazgos"].items():
                entry["campos"] = source["hallazgos"][key]["campos"]
            write(draft_path, literal)
            blocked("Dictado copiado íntegramente", lambda: generate(folder, draft_path), "copia literal", audit)
            invalid = copy.deepcopy(draft)
            invalid["hallazgos"]["rinon_derecho"]["campos"]["morfologia"] = "Riñón reniforme de 999 mm."
            write(draft_path, invalid)
            blocked("Medida ajena en prosa", lambda: generate(folder, draft_path), "Medición redactada sin respaldo", audit)
        if previous is not None:
            blocked(f"{source['caso']} rechaza redacción previa", lambda: generate(folder, previous), "Redacción ajena", audit)
        write(draft_path, draft)
        revision = generate(folder, draft_path)
        report = read(revision / "verificacion.json")
        if i == 1:
            blocked("Entrega sin cotejo de páginas", lambda: release(folder, revision, []), "Confirme todas", audit)
            page = revision / report["paginas"][0]
            original = page.read_bytes()
            page.write_bytes(b"modificado")
            blocked("Vista previa manipulada", lambda: release(folder, revision, [1]), "Cambió un archivo", audit)
            page.write_bytes(original)
            invalid_source = copy.deepcopy(source)
            invalid_source["medidas"][-1]["valores"] = [2000]
            other, other_control = start(invalid_source, "residuo-incompatible")
            path = other / "entrada.json"
            write(path, {**draft, **{k: other_control[k] for k in ("caso", "token", "fuente_sha256")}})
            blocked("Residuo incoherente", lambda: generate(other, path), "Volúmenes pre/pos incompatibles", audit)
        word = next(revision.glob("*.docx"))
        from lxml import etree
        import fitz
        with ZipFile(word) as z:
            doc = etree.fromstring(z.read("word/document.xml"))
            body = flat(" ".join(doc.xpath("//*[local-name()='t']/text()")))
        with fitz.open(word.with_suffix(".pdf")) as pdf:
            visible = flat(" ".join(p.get_text() for p in pdf))
        for j in range(1, args.cantidad + 1):
            sentinel = f"ficticiocentinela{j:02}prueba"
            assert (sentinel in body) == (i == j), (i, j, "Word")
            assert (sentinel in visible) == (i == j), (i, j, "PDF")
        if source["protocolo"].startswith("renal"):
            assert "ejeslapy t".replace(" ", "") in body
            assert flat(f"{94+i} mm") in body
            if source["protocolo"] != "renal_solo" and i != 30:
                assert flat(f"{100*i/(230+i):.1f} %") in body
        if i == 30:
            assert "volumenposmiccional" not in body
        if i == 31:
            assert "lainterposiciondegasimpidevalorarlosespaciosperirrenales" in visible
        if i == 34:
            assert len(report["paginas"]) >= 2 and "il atotal".replace(" ", "") in visible
        audit.append({"prueba": source["caso"], "protocolo": source["protocolo"], "estado": "RENDERIZADO",
                      "paginas": len(report["paginas"]), "revision": str(revision.relative_to(root)),
                      "campos": report["campos_redactados"], "copias_literales": report["campos_identicos_a_fuente"]})
        previous = draft_path
        write(root / "resultados.json", audit)
        print(f"{source['caso']}: {source['protocolo']}, {len(report['paginas'])} página(s)", flush=True)
    print(f"Total: {args.cantidad} Word y PDF. {sum(x['estado']=='BLOQUEADO' for x in audit)} rechazos comprobados.")


if __name__ == "__main__":
    main()
