#!/usr/bin/env python3
# custom/copro-wizard/copro_wizard.py — wizard copro P2-16 (§12.1-bis + §1.6.4-2).
# Stdlib seule. 0 € logiciel. Jamais de PIN, jamais de secrets en dur.
# 5 sources §12.1-bis-1 : (a) règlement, (b) PV AG, (c) accord syndic,
# (d) mairie/PLU, (e) CGU plateformes + droit FR.
# Tant que `copro.verifiee: false` -> mise en ligne BLOQUÉE (moteurs 403 + sensor rouge).
# Usage :
#   python3 copro_wizard.py --init log1     # crée docs/log1/copro/ + checklist (privé)
#   python3 copro_wizard.py --check          # exit 0 OK, exit 2 BLOQUÉE
#   python3 copro_wizard.py --generer log1   # règlement daté depuis copro: + templates/
# Test sans toucher le réel : LCD_LOGEMENTS_YAML=<copie verifiee:true>
#   + LCD_DOCS_BASE=<bac sable> --generer log1
import os
import re
import sys
from datetime import date

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(os.path.dirname(ICI))
LOGEMENTS = os.environ.get(
    "LCD_LOGEMENTS_YAML", os.path.join(RACINE, "custom", "logements.yaml"))
DOCS_BASE = os.environ.get(
    "LCD_DOCS_BASE", os.path.join(RACINE, "docs"))  # bac à sable en test
TEMPLATES = os.path.join(RACINE, "docs", "templates")
BRANDING = os.path.join(RACINE, "custom", "branding.yaml")

# 5 pièces attendues dans docs/logX/copro/ (§12.1-bis-1, ordre imposé)
PIECES_ATTENDUES = [
    "a_reglement_copro_extrait.md",   # art. occupation/usage/bruit/animaux cités
    "b_pv_ag.md",                     # clause interdiction LCD votée ? majorité Le Meur ?
    "c_accord_syndic.md",             # accord écrit — SANS accord : rester "sous réserve"
    "d_mairie_enregistrement.md",     # Cerfa 14004*04 + n° enregistrement + 120j/90j + quota
    "e_cgu_droit_fr.md",              # CGU 4 plateformes vérifiées + droit FR §12.1
]
# Garde-fou R.212-1 (M-JEV-1) : ces formulations dans les pièces = wizard BLOQUÉ
INTERDITS = ["amende forfaitaire", "expulsion", "coupure", "changement des codes",
             "paiement hors plateforme", "caution airbnb", "caméra intérieure",
             "caméra interieure", "copie passeport", "pas de recours",
             "modification unilatérale", "photos non contractuelles"]
TAILLE_MIN_PIECE = 50  # en dessous = pièce vide, manquante
MARQUEUR_GABARIT = "À remplir"  # phrase du gabarit --init : présente = pièce non remplie


def lire_bloc_copro(texte, logx):
    # logements: -> "  logX:" (2 espaces) ; tout jusqu'au prochain "  logY:".
    m = re.search(rf"^  {logx}:\n(.*?)(?=^  \w+:|\Z)", texte, re.M | re.S)
    if not m:
        return {}, False
    mc = re.search(r"^    copro:\n((?:^      .*\n?)+)", m.group(1), re.M)
    if not mc:
        return {}, False
    copro_txt = mc.group(1)

    def val(k):
        mm = re.search(rf"^\s*{k}:\s*(.+?)\s*$", copro_txt, re.M)
        return mm.group(1).strip().strip('"') if mm else ""

    ver = re.search(r"verifiee:\s*(true|false)", copro_txt)
    return {"verifiee": (ver.group(1) == "true") if ver else False,
            "heures_calmes": val("heures_calmes") or "22h-8h",
            "occupants_max": val("occupants_max") or "?",
            "animaux": val("animaux") or "false",
            "fetes": val("fetes") or "false",
            "non_fumeur": val("non_fumeur") or "true"}, True


def lire_marque():
    try:
        t = open(BRANDING, encoding="utf-8").read()
        m = re.search(r'marque:\s*"([^"]+)"', t)
        return m.group(1) if m else "{{ marque }}"
    except OSError:
        return "{{ marque }}"  # branding.yaml privé, absent sur PC = placeholder


def dossier_copro(logx):
    return os.path.join(DOCS_BASE, logx, "copro")


def cmd_init(logx):
    d = dossier_copro(logx)
    os.makedirs(d, exist_ok=True)
    for p in PIECES_ATTENDUES:
        fp = os.path.join(d, p)
        if not os.path.exists(fp):
            with open(fp, "w", encoding="utf-8") as f:
                f.write(f"# {p} — {logx} (§12.1-bis-1)\n"
                        "# À remplir : citer articles + date + source. "
                        "Gabarit vide = wizard incomplet = BLOQUÉ.\n")
    chk = os.path.join(d, "checklist.md")
    with open(chk, "w", encoding="utf-8") as f:
        f.write(f"# Checklist wizard {logx} — {date.today().isoformat()}\n"
                "- [ ] (a) règlement copro : art. occupation/usage/bruit/animaux\n"
                "- [ ] (b) PV AG + votes : interdiction LCD ? majorité Le Meur ?\n"
                "- [ ] (c) accord écrit syndic (sinon mention « sous réserve » + relance tracée)\n"
                "- [ ] (d) mairie/PLU : Cerfa 14004*04 + n° enregistrement + 120j/90j + quota\n"
                "- [ ] (e) CGU 4 plateformes + droit FR §12.1 vérifiés\n"
                "- [ ] M-LLM-2 : DPE, taxe séjour Métropole NCA, RC/PNO/MRH, classement, jamais n° inventé\n"
                "- [ ] relecture juriste datée avant verifiee:true\n")
    print(f"init {logx} -> {d} (privé, jamais commité — .gitignore docs/{logx}/ OK)")


def auditer(logx):
    """Retourne (bloque: bool, details: dict). Jamais d'écriture."""
    with open(LOGEMENTS, encoding="utf-8") as f:
        t = f.read()
    copro, _ = lire_bloc_copro(t, logx)
    d = dossier_copro(logx)
    manq = []
    for p in PIECES_ATTENDUES:
        fp = os.path.join(d, p)
        if (not os.path.exists(fp)
                or os.path.getsize(fp) < TAILLE_MIN_PIECE):
            manq.append(p)
            continue
        txt0 = open(fp, encoding="utf-8", errors="ignore").read()
        if MARQUEUR_GABARIT in txt0:
            manq.append(p)  # gabarit --init jamais rempli = pièce manquante
    abus = []
    for p in PIECES_ATTENDUES:
        fp = os.path.join(d, p)
        if os.path.exists(fp):
            txt = open(fp, encoding="utf-8", errors="ignore").read().lower()
            abus += [i for i in INTERDITS if i in txt]
    bloque = (not copro.get("verifiee")) or bool(manq) or bool(abus)
    return bloque, {"verifiee": copro.get("verifiee"), "manquantes": manq,
                    "interdits": sorted(set(abus)), "copro": copro}


def cmd_check():
    ok_global = True
    for logx in ["log1", "log2"]:
        try:
            bloque, det = auditer(logx)
        except OSError as e:
            print(f"{logx}: ERREUR {e} -> BLOQUÉE")
            ok_global = False
            continue
        print(f"{logx}: verifiee={det['verifiee']} manquantes={det['manquantes']} "
              f"interdits={det['interdits']} -> {'BLOQUEE' if bloque else 'OK'}")
        if bloque:
            ok_global = False
    sys.exit(0 if ok_global else 2)


def cmd_generer(logx):
    bloque, det = auditer(logx)
    if bloque:
        print(f"{logx}: BLOQUÉE — verifiee={det['verifiee']} "
              f"manquantes={det['manquantes']} interdits={det['interdits']} "
              "(compléter wizard d'abord, jamais forcé)")
        sys.exit(2)
    copro = det["copro"]
    src = os.path.join(TEMPLATES, "reglement-interieur.fr.md")
    tpl = open(src, encoding="utf-8").read()
    out = tpl.replace("{{ logement }}", logx)\
             .replace("{{ marque }}", lire_marque())\
             .replace("{{ heures_calmes }}", copro["heures_calmes"])\
             .replace("{{ occupants_max }}", copro["occupants_max"])
    # Propagation §1.5.2-bis : fêtes/heures/animaux/max déjà injectés via copro:
    out += (f"\n_Généré le {date.today().isoformat()} depuis custom/logements.yaml "
            f"(heures {copro['heures_calmes']}, max {copro['occupants_max']}, "
            f"fêtes {copro['fetes']}, animaux {copro['animaux']}, "
            f"non-fumeur {copro['non_fumeur']}). FR source validée humain._\n")
    dest_dir = os.path.join(DOCS_BASE, logx)
    os.makedirs(dest_dir, exist_ok=True)
    datee = os.path.join(dest_dir, f"reglement-interieur.fr.{date.today().isoformat()}.md")
    open(datee, "w", encoding="utf-8").write(out)
    # Copie courante + version datée conservée (§12.1 : versions datées)
    open(os.path.join(dest_dir, "reglement-interieur.fr.md"), "w", encoding="utf-8").write(out)
    print(f"{logx}: règlement généré -> {datee}")


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in ("--init", "--check", "--generer"):
        print("usage: --init logX | --check | --generer logX")
        sys.exit(1)
    if sys.argv[1] == "--init":
        cmd_init(sys.argv[2])
    elif sys.argv[1] == "--check":
        cmd_check()
    else:
        cmd_generer(sys.argv[2])
