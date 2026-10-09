#!/usr/bin/env python3
# custom/facturation/facturation.py — moteur facturation P2-10 (§12.2 + §12.5-bis).
# 0 € : stdlib seule. Même LXC que ics-sync :8090 / pricing :8091 / decision :8092.
#
# Génère depuis les templates versionnés docs/templates/ (FR source, validés humain) :
#   - contrat de séjour 1 page PWA 30 s (§12.5-bis + M-LLM-1) -> sortie runtime
#     /config/contrats/logX/<ref_resa>.md (+ .json preuve horodatée) — JAMAIS commités.
#   - facture B2C simple PDF (§12.5-bis) : nuitées + ménage ligne séparée + extras,
#     taxe de séjour ligne DISTINCTE hors CA, jamais dans le total.
#   - facture B2B Factur-X (§12.5-bis) : PDF lisible + XML structuré (profil BASIC
#     par défaut) depuis les MÊMES lignes CA « gestion/commission » (§12.6) + dépôt Chorus Pro.
#
# Règles inviolables (M-LLM-7 : trous seuls) :
#   - Montants/dates/adresses/SIRET TOUJOURS reçus (moteur direct / pricing / compta),
#     JAMAIS générés ni inventés. Placeholder {{ }} non fourni = ERREUR 422, jamais de trou vide.
#   - Garde-fou M-JEV-1 déterministe (en attendant Noul Jev Phase 7) : tout document généré
#     est scanné (interdits R.212-1/R.212-2) + mentions obligatoires (L.221-28/L.612-1/ODR)
#     + phrase caution VERBATIM pour les contrats → >0 manquement = BLOCAGE + log.
#   - Validation 1-tap : tout document naît `brouillon`, envoi/dépôt Chorus Pro EXIGENT
#     `POST /valider` humain. Relecture juriste initiale + expert-comptable (B2B) sur box.
#   - Direct : contrat signé EXIGÉ avant envoi PIN (orchestré par decision-engine P2-8).
#   - Secrets : aucun externe (pas d'appel réseau). HA non requis.
#
# Contrats :
#   GET  /health -> {"ok": true}
#   GET  /templates -> liste des templates versionnés {nom, lignes}
#   POST /contrat {logement_id, ref_resa, vars{...}} -> {ref, type, statut, fichier, garde_fou}
#   POST /facture {logement_id, ref_resa, b2b: false, vars{...}} -> idem (+ XML si b2b)
#   POST /valider {logement_id, ref_resa, type_doc, qui} -> statut brouillon -> valide
#   GET  /doc?logement_id=log1&ref_resa=X&type_doc=contrat|facture_b2c|facture_b2b -> contenu + statut
#
# Usage : python3 facturation.py --config config.yaml --logements ../logements.yaml [--serve]
#   env : LCD_SECRETS_YAML (non requis ici, aucun secret externe), LCD_HTTP_PORT.

import argparse
import datetime as dt
import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TYPES_DOC = {
    "contrat": "contrat_pwa.md",
    "facture_b2c": "facture_b2c.md",
    "facture_b2b": "facture_b2b_facturx.md",
}
TROU = re.compile(r"\{\{\s*(\w+)\s*\}\}")


def utcnow_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def charger_yaml_plat(path):
    """Parseur YAML plat (niveau 0) — même convention que pricing-engine."""
    data = {}
    try:
        with open(path, encoding="utf-8") as f:
            for ligne in f:
                ligne = ligne.split("#", 1)[0].rstrip()
                if not ligne.strip() or ligne[0] in (" ", "\t"):
                    continue
                if ":" in ligne:
                    k, v = ligne.split(":", 1)
                    k, v = k.strip(), v.strip().strip("\"'")
                    if v.startswith("[") and v.endswith("]"):
                        data[k] = [x.strip().strip("\"'") for x in v[1:-1].split(",") if x.strip()]
                    elif v in ("true", "false"):
                        data[k] = (v == "true")
                    elif re.fullmatch(r"-?\d+", v):
                        data[k] = int(v)
                    elif re.fullmatch(r"-?\d+\.\d+", v):
                        data[k] = float(v)
                    else:
                        data[k] = v
    except FileNotFoundError:
        pass
    return data


def lire_logements(path):
    """Extrait par logement : identité + pricing + copro + ménage + branding statique."""
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return {}
    logts = {}
    cur = None
    section = None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        indent = len(ligne) - len(ligne.lstrip(" "))
        cle = ligne.strip()
        if indent == 2 and cle in ("log1:", "log2:"):
            cur = cle[:-1]
            logts[cur] = {}
            section = None
            continue
        if indent == 2 and cle.endswith(":"):
            if cur and cle[:-1] not in ("pricing", "copro", "menage", "features"):
                cur = None
            section = None
            continue
        if cur is None:
            continue
        if indent == 4 and cle.endswith(":") and ":" not in cle[:-1]:
            section = cle[:-1] if cle[:-1] in ("pricing", "copro", "menage") else None
            continue
        if ":" not in ligne:
            continue
        k, v = ligne.strip().split(":", 1)
        k, v = k.strip(), v.strip().strip("\"'")
        if v in ("true", "false"):
            v = (v == "true")
        elif re.fullmatch(r"-?\d+", v):
            v = int(v)
        elif re.fullmatch(r"-?\d+\.\d+", v):
            v = float(v)
        elif v in ("null", "~", ""):
            v = None
        if section:
            logts[cur].setdefault(section, {})[k] = v
        else:
            logts[cur][k] = v
    return logts


def charger_branding(path):
    """Variables statiques marque (fichier PRIVÉ, jamais commité). Absent local = trous exigés."""
    data = {}
    try:
        with open(path, encoding="utf-8") as f:
            for ligne in f:
                ligne = ligne.split("#", 1)[0].rstrip()
                if not ligne.strip() or ligne[0] in (" ", "\t") or ":" not in ligne:
                    continue
                k, v = ligne.split(":", 1)
                data[k.strip()] = v.strip().strip("\"'")
    except FileNotFoundError:
        pass
    return data


class Facturation:
    def __init__(self, cfg, logts, branding):
        self.cfg = cfg
        self.logts = logts
        self.branding = branding
        self.templates_dir = cfg.get("templates_dir", "../docs/templates")
        self.contrats_dir = cfg.get("contrats_dir", "./state/contrats")
        self.decision_dir = cfg.get("decision_log_dir", "./state")
        self.interdits = [s.lower() for s in cfg.get("interdits_garde_fou", [])]
        self.mentions_par_type = {
            "contrat": cfg.get("mentions_contrat", cfg.get("mentions_requises", [])),
            "facture_b2c": cfg.get("mentions_facture_b2c", []),
            "facture_b2b": cfg.get("mentions_facture_b2b", []),
        }
        self.phrase_caution = cfg.get("phrase_caution", "Une empreinte de")
        try:
            with open(os.path.join(os.path.dirname(__file__), "..", "branding.yaml"),
                      encoding="utf-8") as f:
                pass
        except FileNotFoundError:
            pass

    # --- gabarits ---
    def template(self, type_doc):
        nom = TYPES_DOC.get(type_doc)
        if not nom:
            return None, f"type_doc inconnu (contrat|facture_b2c|facture_b2b)"
        path = os.path.join(self.templates_dir, nom)
        try:
            with open(path, encoding="utf-8") as f:
                return f.read(), None
        except FileNotFoundError:
            return None, f"template absent: {nom}"

    def liste_templates(self):
        res = []
        for type_doc, nom in TYPES_DOC.items():
            path = os.path.join(self.templates_dir, nom)
            try:
                with open(path, encoding="utf-8") as f:
                    res.append({"type_doc": type_doc, "fichier": nom,
                                "lignes": sum(1 for _ in f)})
            except FileNotFoundError:
                res.append({"type_doc": type_doc, "fichier": nom, "lignes": None,
                            "alerte": "template absent"})
        return res

    # --- variables statiques (logements + branding) ---
    def vars_statiques(self, logement_id):
        log = self.logts.get(logement_id, {})
        copro = log.get("copro", {}) or {}
        pricing = log.get("pricing", {}) or {}
        menage = log.get("menage", {}) or {}
        v = {
            "logement": log.get("nom", logement_id),
            "adresse_logement": log.get("commune", ""),
            "surface_m2": log.get("surface_m2", ""),
            "capacite_max": log.get("capacite", copro.get("occupants_max", "")),
            "heures_calmes": copro.get("heures_calmes", "22h-8h"),
            "animaux_regle": ("non admis" if copro.get("animaux") is False
                              else "admis sur demande"),
            "montant_menage": menage.get("montant", ""),
            "prix_nuitee_ttc": pricing.get("prix_base", ""),
        }
        for k, val in self.branding.items():
            if k not in v:
                v[k] = val
        return v

    # --- génération : trous seuls (M-LLM-7), jamais de clause/montant inventé ---
    def generer(self, logement_id, ref_resa, type_doc, vars_resa, qui="moteur-direct"):
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        gabarit, err = self.template(type_doc)
        if err:
            return 500, {"erreur": err}
        if not isinstance(vars_resa, dict):
            return 400, {"erreur": "vars{} requis (montants/dates reçus, jamais générés)"}
        fusion = self.vars_statiques(logement_id)
        fusion.update({k: v for k, v in vars_resa.items() if v is not None})
        trous = sorted(set(TROU.findall(gabarit)))
        manquants = [t for t in trous if t not in fusion or fusion[t] in (None, "")]
        if manquants:
            return 422, {"erreur": "placeholders non fournis (refus de trou vide)",
                         "manquants": manquants}
        doc = TROU.sub(lambda m: str(fusion[m.group(1)]), gabarit)
        if TROU.search(doc):
            return 422, {"erreur": "trou résiduel après remplissage"}
        # Purge le bloc de commentaires internes EN TÊTE (lignes `# ...` avant la
        # première ligne vide) : jamais destinés au voyageur. Les titres markdown
        # (`# Titre`, `## Article`) du corps, APRÈS la ligne vide, sont conservés.
        # Ne saute le premier bloc que s'il est ENTIÈREMENT des commentaires.
        lignes = doc.splitlines()
        i = 0
        while i < len(lignes) and lignes[i].strip():
            i += 1              # fin du premier bloc non-vide
        if i > 0 and i < len(lignes) and all(
                l.lstrip().startswith("#") for l in lignes[:i]):
            j = i
            while j < len(lignes) and not lignes[j].strip():
                j += 1          # saute la/les lignes vides de séparation
            if j < len(lignes):
                doc = "\n".join(lignes[j:])
        # Garde-fou M-JEV-1 déterministe : interdits + mentions + phrase caution (contrat).
        bas = doc.lower()
        trouves = [s for s in self.interdits if s in bas]
        mentions_abs = [m for m in self.mentions_par_type.get(type_doc, []) if m not in doc]
        if type_doc == "contrat" and self.phrase_caution not in doc:
            mentions_abs.append("phrase_caution_verbatim")
        garde_fou = {"interdits_trouves": trouves, "mentions_absentes": mentions_abs,
                     "bloque": bool(trouves or mentions_abs)}
        horodatage = utcnow_iso()
        statut = "bloque" if garde_fou["bloque"] else "brouillon"
        meta = {"ts": horodatage, "logement_id": logement_id, "ref_resa": ref_resa,
                "type_doc": type_doc, "qui": qui, "statut": statut,
                "garde_fou": garde_fou, "vars": sorted(fusion.keys())}
        self._stocker(logement_id, ref_resa, type_doc, doc, meta)
        self.log_decision(logement_id, ref_resa, qui, f"{type_doc}-{statut}",
                          vars_resa.get("canal", "direct"),
                          vars_resa.get("prix_total_ttc", vars_resa.get("total_ttc")),
                          f"garde_fou bloque={garde_fou['bloque']}")
        code = 200 if statut == "brouillon" else 422
        corps = {"ref_resa": ref_resa, "type_doc": type_doc, "statut": statut,
                 "fichier": self._chemin(logement_id, ref_resa, type_doc, "md"),
                 "garde_fou": garde_fou,
                 "rappel": ("validation 1-tap requise (POST /valider) avant envoi/dépôt"
                            if statut == "brouillon" else "document BLOQUÉ — corriger, jamais forcer")}
        if type_doc == "facture_b2b" and statut == "brouillon":
            xml = self._xml_facturx(meta, vars_resa)
            self._stocker(logement_id, ref_resa, type_doc, xml, meta, ext="xml")
            corps["fichier_xml"] = self._chemin(logement_id, ref_resa, type_doc, "xml")
        return code, corps

    def valider(self, logement_id, ref_resa, type_doc, qui):
        meta = self._lire_meta(logement_id, ref_resa, type_doc)
        if not meta:
            return 404, {"erreur": "document introuvable (générer d'abord)"}
        if meta.get("statut") == "bloque":
            return 422, {"erreur": "document BLOQUÉ par le garde-fou — corriger, jamais forcer"}
        if not qui or qui in ("moteur-direct", "auto", "llm", "jev"):
            return 400, {"erreur": "validation 1-tap HUMAINE exigée (qui=<humain>)"}
        meta["statut"] = "valide"
        meta["valide_par"] = qui
        meta["valide_le"] = utcnow_iso()
        self._stocker_meta(logement_id, ref_resa, type_doc, meta)
        self.log_decision(logement_id, ref_resa, qui, f"{type_doc}-valide",
                          meta.get("vars") and "direct", None, "validation 1-tap humain")
        return 200, {"ref_resa": ref_resa, "type_doc": type_doc, "statut": "valide",
                     "rappel": ("direct : contrat signé EXIGÉ avant envoi PIN"
                                if type_doc == "contrat"
                                else "B2B : dépôt Chorus Pro autorisé")}

    def lire(self, logement_id, ref_resa, type_doc):
        dossier = os.path.join(self.contrats_dir, logement_id)
        base = f"{ref_resa}_{type_doc}"
        try:
            with open(os.path.join(dossier, base + ".md"), encoding="utf-8") as f:
                doc = f.read()
        except FileNotFoundError:
            return 404, {"erreur": "document introuvable"}
        return 200, {"meta": self._lire_meta(logement_id, ref_resa, type_doc) or {},
                     "document": doc}

    # --- Factur-X XML minimal (profil BASIC, MÊMES montants que le PDF) ---
    def _xml_facturx(self, meta, v):
        profil = v.get("facturx_profil", "BASIC")
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:'
            'CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:'
            'ReusableAggregateBusinessInformationEntity:100">\n'
            f"  <!-- Factur-X {profil} — {meta['ref_resa']} — montants identiques au PDF -->\n"
            "  <rsm:ExchangedDocument>\n"
            f"    <ram:ID>{v.get('numero_facture', '')}</ram:ID>\n"
            f"    <ram:IssueDateTime>{v.get('date_facture', '')}</ram:IssueDateTime>\n"
            "  </rsm:ExchangedDocument>\n"
            "  <rsm:SupplyChainTradeTransaction>\n"
            "    <ram:ApplicableHeaderTradeSettlement>\n"
            f"      <ram:DueDateDateTime>{v.get('date_echeance', '')}</ram:DueDateDateTime>\n"
            f"      <ram:GrandTotalAmount>{v.get('total_ttc', '')}</ram:GrandTotalAmount>\n"
            f"      <ram:TaxBasisTotalAmount>{v.get('base_ht', '')}</ram:TaxBasisTotalAmount>\n"
            "    </ram:ApplicableHeaderTradeSettlement>\n"
            "  </rsm:SupplyChainTradeTransaction>\n"
            "</rsm:CrossIndustryInvoice>\n")

    # --- stockage runtime (box : /config/contrats/ monté ici, gitignoré) ---
    def _chemin(self, logement_id, ref_resa, type_doc, ext):
        return os.path.join(self.contrats_dir, logement_id, f"{ref_resa}_{type_doc}.{ext}")

    def _stocker(self, logement_id, ref_resa, type_doc, contenu, meta, ext="md"):
        dossier = os.path.join(self.contrats_dir, logement_id)
        os.makedirs(dossier, exist_ok=True)
        with open(os.path.join(dossier, f"{ref_resa}_{type_doc}.{ext}"),
                  "w", encoding="utf-8") as f:
            f.write(contenu)
        if ext == "md":
            self._stocker_meta(logement_id, ref_resa, type_doc, meta)

    def _stocker_meta(self, logement_id, ref_resa, type_doc, meta):
        dossier = os.path.join(self.contrats_dir, logement_id)
        os.makedirs(dossier, exist_ok=True)
        cible = os.path.join(dossier, f"{ref_resa}_{type_doc}.json")
        tmp = cible + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
        os.replace(tmp, cible)

    def _lire_meta(self, logement_id, ref_resa, type_doc):
        try:
            with open(os.path.join(self.contrats_dir, logement_id,
                                   f"{ref_resa}_{type_doc}.json"), encoding="utf-8") as f:
                return json.load(f)
        except (FileNotFoundError, ValueError):
            return None

    def log_decision(self, logement_id, ref, qui, quoi, canal, montant, motif):
        ligne = {"ts": utcnow_iso(), "logement_id": logement_id, "ref": ref,
                 "qui": qui, "quoi": quoi, "canal": canal,
                 "commission": None, "net_hote": montant, "motif": motif}
        os.makedirs(self.decision_dir, exist_ok=True)
        with open(os.path.join(self.decision_dir, f"decision.{logement_id}.jsonl"),
                  "a", encoding="utf-8") as f:
            f.write(json.dumps(ligne, ensure_ascii=False) + "\n")


class Handler(BaseHTTPRequestHandler):
    engine = None

    def log_message(self, *a):
        pass

    def _json(self, code, obj):
        corps = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def _lire_json(self):
        try:
            n = int(self.headers.get("Content-Length", 0))
        except ValueError:
            n = 0
        if not n:
            return {}, None
        try:
            return json.loads(self.rfile.read(n) or b"{}"), None
        except (ValueError, json.JSONDecodeError):
            return None, "JSON invalide"

    def do_GET(self):
        import urllib.parse
        url = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(url.query)
        eng = self.engine
        if url.path == "/health":
            return self._json(200, {"ok": True})
        if url.path == "/templates":
            return self._json(200, {"templates": eng.liste_templates()})
        if url.path == "/doc":
            logement_id = qs.get("logement_id", [""])[0]
            ref = qs.get("ref_resa", [""])[0]
            type_doc = qs.get("type_doc", [""])[0]
            if not (logement_id and ref and type_doc):
                return self._json(400, {"erreur": "logement_id + ref_resa + type_doc requis"})
            code, obj = eng.lire(logement_id, ref, type_doc)
            return self._json(code, obj)
        return self._json(404, {"erreur": "inconnu"})

    def do_POST(self):
        import urllib.parse
        url = urllib.parse.urlparse(self.path)
        p, err = self._lire_json()
        if err:
            return self._json(400, {"erreur": err})
        eng = self.engine
        if url.path in ("/contrat", "/facture"):
            type_doc = ("contrat" if url.path == "/contrat"
                        else ("facture_b2b" if p.get("b2b") else "facture_b2c"))
            if not (p.get("logement_id") and p.get("ref_resa")):
                return self._json(400, {"erreur": "logement_id + ref_resa + vars{} requis"})
            code, obj = eng.generer(p["logement_id"], p["ref_resa"], type_doc,
                                    p.get("vars", {}), p.get("qui", "moteur-direct"))
            return self._json(code, obj)
        if url.path == "/valider":
            if not (p.get("logement_id") and p.get("ref_resa") and p.get("type_doc")):
                return self._json(400, {"erreur": "logement_id + ref_resa + type_doc requis"})
            code, obj = eng.valider(p["logement_id"], p["ref_resa"],
                                    p["type_doc"], p.get("qui", ""))
            return self._json(code, obj)
        return self._json(404, {"erreur": "inconnu"})


def main():
    ap = argparse.ArgumentParser(description="LCD facturation P2-10")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--logements", default="../logements.yaml")
    ap.add_argument("--branding", default="../branding.yaml")
    ap.add_argument("--serve", action="store_true",
                    help="démarre l'API HTTP (défaut : liste les templates + sortie)")
    args = ap.parse_args()

    cfg = charger_yaml_plat(args.config)
    # Listes entre crochets sur 2 lignes (interdits_garde_fou, mentions_requises).
    try:
        with open(args.config, encoding="utf-8") as f:
            brut = f.read()
        for cle in ("interdits_garde_fou", "mentions_requises", "mentions_contrat",
                      "mentions_facture_b2c", "mentions_facture_b2b"):
            m = re.search(rf"^{cle}:\s*\[(.*?)\]", brut, re.M | re.S)
            if m:
                cfg[cle] = [x.strip().strip("\"'") for x in m.group(1).split(",") if x.strip()]
    except FileNotFoundError:
        print(f"config introuvable: {args.config}", file=sys.stderr)
        return 2
    # Chemins relatifs ancrés au dossier du config (cwd systemd = / en prod).
    base = os.path.dirname(os.path.abspath(args.config))
    for cle in ("templates_dir", "contrats_dir", "decision_log_dir", "state_dir"):
        val = cfg.get(cle, "")
        if val and not os.path.isabs(val):
            cfg[cle] = os.path.normpath(os.path.join(base, val))
    logts = lire_logements(args.logements)
    if not logts:
        print(f"logements introuvables ou vides: {args.logements}", file=sys.stderr)
        return 2
    eng = Facturation(cfg, logts, charger_branding(args.branding))
    Handler.engine = eng

    if not args.serve:
        print(json.dumps({"templates": eng.liste_templates(),
                          "logements": sorted(logts)}, ensure_ascii=False))
        return 0
    port = int(os.environ.get("LCD_HTTP_PORT", cfg.get("http_port", 8093)))
    bind = os.environ.get("LCD_BIND", "127.0.0.1")  # lab Docker : 0.0.0.0
    srv = ThreadingHTTPServer((bind, port), Handler)
    print(f"facturation :8093 (127.0.0.1:{port})")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
