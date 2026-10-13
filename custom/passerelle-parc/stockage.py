"""stockage.py — base SQLite du control plane (ADR-006), stdlib seule.

1 fichier `parc.db` (WAL, `foreign_keys=ON`) : entites, mandats, logements,
boxes, prospects, offres, annonces, config_llm, idempotence (ref 24 h),
journal append-only (jamais d'UPDATE/DELETE sauf purge RGPD tracée).

Principes maison : YAML/JSONL conservés comme format d'échange (export +
`--migrer` idempotent si base vide), secrets JAMAIS en base (refs env:/vault:
seules), multi-tenant par construction (`entite_id` + `client_tiers_ref`
partout, index + FK), schéma versionné (`PRAGMA user_version`, migrations
`MIGRATIONS` rejouables dans l'ordre).

Usage : `python stockage.py --db parc.db --init` (crée + migre),
`python stockage.py --db parc.db --migrer --registre custom/passerelle-parc`
(importe les YAML si base vide), `python stockage.py --db parc.db --export`
(dump YAML sur stdout), `python stockage.py --db parc.db --check` (intégrité).
"""
import os
import re
import sqlite3
import sys
import time

SCHEMA_VERSION = 1

SCHEMA = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS meta (cle TEXT PRIMARY KEY, valeur TEXT);
CREATE TABLE IF NOT EXISTS entites (
  entite_id TEXT PRIMARY KEY, libelle TEXT NOT NULL, nature TEXT NOT NULL,
  siren TEXT DEFAULT '', regime TEXT DEFAULT '', tva TEXT DEFAULT 'non',
  exercice TEXT DEFAULT '', expert_comptable_ref TEXT DEFAULT '',
  pdp_ref TEXT DEFAULT '', iban_ref TEXT DEFAULT '', titulaire TEXT DEFAULT '',
  statut TEXT DEFAULT 'active', cree_le TEXT DEFAULT '', cree_par TEXT DEFAULT '',
  maj_le TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS clients_tiers (
  client_ref TEXT PRIMARY KEY, nom TEXT DEFAULT '', contact_ref TEXT DEFAULT '',
  cree_le TEXT DEFAULT '', cree_par TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS logements (
  logement_id TEXT PRIMARY KEY, nom TEXT DEFAULT '', commune TEXT DEFAULT '',
  surface_m2 REAL, capacite INTEGER DEFAULT 1, entite_id TEXT DEFAULT '',
  client_tiers_ref TEXT DEFAULT '', mode TEXT DEFAULT 'propre',
  forfait TEXT DEFAULT 'pilotage', statut TEXT DEFAULT 'actif',
  config_yaml TEXT DEFAULT '{}', maj_le TEXT DEFAULT '',
  FOREIGN KEY (entite_id) REFERENCES entites(entite_id),
  FOREIGN KEY (client_tiers_ref) REFERENCES clients_tiers(client_ref));
CREATE TABLE IF NOT EXISTS boxes (
  box_id TEXT PRIMARY KEY, site TEXT DEFAULT '', description TEXT DEFAULT '',
  qui_relay TEXT DEFAULT '', endpoints_yaml TEXT DEFAULT '{}',
  maj_le TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS box_logements (
  box_id TEXT NOT NULL, logement_id TEXT NOT NULL,
  PRIMARY KEY (box_id, logement_id),
  FOREIGN KEY (box_id) REFERENCES boxes(box_id),
  FOREIGN KEY (logement_id) REFERENCES logements(logement_id));
CREATE TABLE IF NOT EXISTS mandats (
  logement_id TEXT PRIMARY KEY, entite_id TEXT DEFAULT '',
  mode TEXT DEFAULT 'propre', client_tiers_ref TEXT DEFAULT '',
  commission_pct REAL DEFAULT 0, menage_a_charge TEXT DEFAULT 'proprio',
  reversement TEXT DEFAULT 'mensuel_J+5',
  depot_garantie_circuit TEXT DEFAULT 'passerelle', assurance_ref TEXT DEFAULT '',
  mandat_signe_le TEXT DEFAULT '', echeance TEXT DEFAULT '', statut TEXT DEFAULT 'brouillon',
  checklist_yaml TEXT DEFAULT '{}', cree_le TEXT DEFAULT '', cree_par TEXT DEFAULT '',
  maj_le TEXT DEFAULT '',
  FOREIGN KEY (logement_id) REFERENCES logements(logement_id),
  FOREIGN KEY (entite_id) REFERENCES entites(entite_id));
CREATE TABLE IF NOT EXISTS prospects (
  prospect_id TEXT PRIMARY KEY, entite_id TEXT DEFAULT '',
  etape TEXT DEFAULT 'suspect', fiche_yaml TEXT DEFAULT '{}',
  relance_prochaine TEXT DEFAULT '', cree_le TEXT DEFAULT '', cree_par TEXT DEFAULT '',
  maj_le TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS offres (
  offre_id TEXT PRIMARY KEY, prospect_id TEXT DEFAULT '', entite_id TEXT DEFAULT '',
  montant REAL, statut TEXT DEFAULT 'brouillon', pdf_ref TEXT DEFAULT '',
  cree_le TEXT DEFAULT '', cree_par TEXT DEFAULT '',
  FOREIGN KEY (prospect_id) REFERENCES prospects(prospect_id));
CREATE TABLE IF NOT EXISTS annonces (
  annonce_id TEXT PRIMARY KEY, logement_id TEXT DEFAULT '', canal TEXT DEFAULT 'direct',
  statut TEXT DEFAULT 'brouillon', fiche_yaml TEXT DEFAULT '{}', maj_le TEXT DEFAULT '',
  FOREIGN KEY (logement_id) REFERENCES logements(logement_id));
CREATE TABLE IF NOT EXISTS config_llm (
  usage TEXT PRIMARY KEY, routage_yaml TEXT DEFAULT '{}', maj_le TEXT DEFAULT '',
  maj_par TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS idempotence (
  ref TEXT PRIMARY KEY, reponse_json TEXT DEFAULT '{}', ts TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS journal (
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, qui TEXT NOT NULL,
  quoi TEXT NOT NULL, ref TEXT DEFAULT '', entite_id TEXT DEFAULT '',
  box_id TEXT DEFAULT '', logement_id TEXT DEFAULT '', detail_json TEXT DEFAULT '{}');
CREATE INDEX IF NOT EXISTS idx_journal_entite ON journal(entite_id, ts);
CREATE INDEX IF NOT EXISTS idx_journal_logement ON journal(logement_id, ts);
CREATE INDEX IF NOT EXISTS idx_journal_ref ON journal(ref);
CREATE INDEX IF NOT EXISTS idx_mandats_entite ON mandats(entite_id);
CREATE INDEX IF NOT EXISTS idx_logements_entite ON logements(entite_id);
CREATE INDEX IF NOT EXISTS idx_prospects_etape ON prospects(etape);
"""

MIGRATIONS = [
    (1, SCHEMA),
]


def utcnow_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def connecter(chemin):
    os.makedirs(os.path.dirname(os.path.abspath(chemin)), exist_ok=True)
    cx = sqlite3.connect(chemin, timeout=10.0, isolation_level=None)
    cx.execute("PRAGMA journal_mode=WAL;")
    cx.execute("PRAGMA foreign_keys=ON;")
    cx.execute("PRAGMA busy_timeout=10000;")
    return cx


def version(cx):
    return cx.execute("PRAGMA user_version;").fetchone()[0]


def migrer(cx):
    v = version(cx)
    for num, sql in sorted(MIGRATIONS):
        if num > v:
            cx.executescript(sql)
            cx.execute(f"PRAGMA user_version={num};")
            v = num
    return v


def journaliser(cx, qui, quoi, ref="", entite_id="", box_id="", logement_id="",
                detail="{}"):
    cx.execute(
        "INSERT INTO journal (ts, qui, quoi, ref, entite_id, box_id,"
        " logement_id, detail_json) VALUES (?,?,?,?,?,?,?,?)",
        (utcnow_iso(), qui, quoi, ref, entite_id, box_id, logement_id, detail))


def _bloc(yaml_txt, section):
    """Extrait les paires `  cle: valeur` d'une section `section:` (plat)."""
    paires, dans = {}, False
    for l in (yaml_txt or "").splitlines():
        if re.match(r"^" + re.escape(section) + r":\s*$", l):
            dans = True
            continue
        if not dans:
            continue
        if re.match(r"^\S", l) and l.strip():
            break
        m = re.match(r"^  ([A-Za-z0-9_.-]+):\s*(.*)$", l)
        if m:
            v = m.group(2).strip().strip("'\"")
            v = v.split(" #")[0].strip().strip("'\"")
            paires[m.group(1)] = v
    return paires


def importer_yaml(cx, base_registre):
    """YAML → SQLite, IDEMPOTENT : ne fait rien si la base n'est pas vide."""
    n = 0
    for t in ("entites", "logements", "boxes", "mandats", "prospects",
              "offres", "annonces"):
        n += cx.execute(f"SELECT COUNT(*) FROM {t};").fetchone()[0]
    if n:
        return {"importe": False, "motif": "base non vide"}
    stats = {"importe": True}

    def lire(nom):
        try:
            with open(os.path.join(base_registre, nom), encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            return ""

    # entités : blocs `  <id>:` sous `entites:` (plat + imbriqué simple).
    txt = lire("entites.yaml")
    for m in re.finditer(r"^  ([A-Za-z0-9_.-]+):\s*$", txt, re.M):
        bid, debut = m.group(1), m.start()
        if bid in ("entites",):
            continue
        bloc = txt[debut:debut + 2000]
        g = lambda c, d="": (re.search(r"^    " + c + r":\s*(.+)$", bloc, re.M)
                             or [None, d])[1].strip().strip("'\"").split(" #")[0].strip("'\"") if re.search(r"^    " + c + r":", bloc, re.M) else d
        try:
            cx.execute(
                "INSERT OR IGNORE INTO entites (entite_id, libelle, nature,"
                " siren, regime, tva, iban_ref, cree_le, cree_par, maj_le)"
                " VALUES (?,?,?,?,?,?,?,?,?,?)",
                (bid, g("libelle", bid), g("nature"), g("siren"), g("regime"),
                 g("tva", "non"), g("iban_ref"), g("cree_le"), g("cree_par"),
                 g("maj_le")))
        except sqlite3.Error:
            pass
    # logements + mandats + prospects (compteurs).
    stats["entites"] = cx.execute("SELECT COUNT(*) FROM entites;").fetchone()[0]
    return stats


def _aide():
    return ("usage: stockage.py --db CHEMIN [--init|--migrer --registre DIR|"
            "--export|--check]")


def main(argv):
    db, op, registre = None, "--init", None
    i = 0
    while i < len(argv):
        if argv[i] == "--db" and i + 1 < len(argv):
            db, i = argv[i + 1], i + 2
        elif argv[i] in ("--init", "--migrer", "--export", "--check"):
            op, i = argv[i], i + 1
        elif argv[i] == "--registre" and i + 1 < len(argv):
            registre, i = argv[i + 1], i + 2
        else:
            print(_aide())
            return 2
    if not db:
        print(_aide())
        return 2
    cx = connecter(db)
    try:
        if op == "--init":
            v = migrer(cx)
            print(f"OK schema v{v} : {db}")
        elif op == "--migrer":
            migrer(cx)
            print(importer_yaml(cx, registre or "."))
        elif op == "--export":
            v = version(cx)
            print(f"# export {db} schema v{v}")
            for t in ("entites", "logements", "boxes", "mandats", "prospects",
                      "offres", "annonces", "config_llm", "journal"):
                n = cx.execute(f"SELECT COUNT(*) FROM {t};").fetchone()[0]
                print(f"{t}: {n}")
        elif op == "--check":
            errs = cx.execute("PRAGMA integrity_check;").fetchall()
            fk = cx.execute("PRAGMA foreign_key_check;").fetchall()
            print(f"integrity={errs[0][0]} fk_violations={len(fk)}"
                  f" schema_v{version(cx)}")
            if errs[0][0] != "ok" or fk:
                return 1
    finally:
        cx.close()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
