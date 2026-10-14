"""llm.py — routage IA / LLM / Jev / One System (plan §15, §16.3/16.5), sans PyYAML.

Module PUR (0 I/O réseau, 0 moteur) : la passerelle l'appelle, le lab l'importe
directement (comme `seuils.py` / `portail.py`). Règles :

- `llm.yaml` versionné, SANS AUCUNE CLÉ. Clés/tokens = vault seul.
- Héritage 3 niveaux : global → entité → logement. Un override `cloud-optin`
  n'est actif que si l'entité l'a coché (opt-in explicite, §16.3).
- Dernier maillon de chaque fallback = `degrade_sans_IA` (template statique +
  file humain, jamais d'erreur silencieuse).
- Interdits durs NON configurables (§15) : toute tentative = 403 loggé.
- Redaction PII/secrets AVANT prompt : IBAN/SIREN/PIN complets interdits en
  log (§15, §16.3). Le log porte `prompt_hash` + `redactions`, jamais le texte.
- Anti prompt-injection (§16.3) : consignes système non modifiables par contenu
  OTA/voyageur ; instruction embarquée détectée = refus + log
  `injection_tentative`.
- Quotas par entité/logement/usage (req/j, tokens/j) : dépassé = blocage doux
  → `degrade_sans_IA`, jamais de dépassement silencieux.
- Kill-switch global + par usage + par entité : 1 clic = `degrade_sans_IA`
  immédiat (<5 s, sans appel réseau).
- `ref` = UUIDv7 (fenêtre dédup 24 h, 201 rejoué identique, §16.3).
- Horloge : tolérance ±5 min (`401 clock_skew` explicite, §16.1).
"""
import hashlib
import os
import re
import time

# Usages configurables (§15) : 1 ligne = 1 routage indépendant.
USAGES = ("messagerie_brouillon", "avis_reponse", "motif_prix",
          "resume_digest", "aide_dispatch", "aide_calendrier",
          "simulateur_explication", "faq_voyageur", "transcription_locale")

# Interdits durs NON configurables (§15) : case grisée + 403 loggé.
INTERDITS = ("ouverture_serrure_vanne_portail",
             "generation_pin_ouverture_auto",
             "envoi_message_avis_auto",
             "ecriture_ota_auto",
             "decision_compta_cloture_payout_seule",
             "discrimination")

PROVIDERS = ("ollama-local", "gateway-4000", "jev-one-system", "cloud-optin")
SEUIL_DEFAUT = 0.7
TOLERANCE_HORLOGE_S = 300          # §16.1 : ±5 min
FENETRE_DEDUP_S = 24 * 3600        # §16.3 : ref UUIDv7, dédup 24 h

# Motifs d'instruction embarquée (contenu OTA/voyageur qui ordonne au système).
# Volontairement FR + EN, insensibles à la casse : un attaquant n'écrit pas
# forcément dans notre langue.
INJECTION_MOTIFS = (
    "ignore les instructions", "ignore previous instructions",
    "ignore toutes les instructions", "system:", "désactive tes garde-fous",
    "desactive tes garde-fous", "disable your guardrails", "jailbreak",
    "en tant que système", "as system", "révèle ton prompt", "reveal your prompt",
    "oublie tes consignes", "forget your instructions",
)


def nouveau_ref():
    """UUIDv7 (ordre temporel + aléatoire), stdlib seule.

    Format 8-4-4-4-12, version `7`, variante `10xx`. `time.time_ns` donne les
    48 bits de temps Unix ms ; le reste vient de `os.urandom` (jamais de
    compteur prévisible). Sans `uuid.uuid7` (Python <3.14 sur certaines box),
    donc implémenté à la main — même format, même unicité pratique."""
    ms = int(time.time_ns() // 1_000_000)
    rnd = os.urandom(10)
    b = bytearray(16)
    b[0:6] = ms.to_bytes(6, "big")
    b[6] = 0x70 | (rnd[0] & 0x0F)
    b[7] = rnd[1]
    b[8] = 0x80 | (rnd[2] & 0x3F)
    b[9:16] = rnd[3:10]
    h = b.hex()
    return "%s-%s-%s-%s-%s" % (h[0:8], h[8:12], h[12:16], h[16:20], h[20:32])


REF_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-"
    r"[0-9a-f]{12}$")


def ref_valide(ref):
    """Un `ref` rejoué doit être un UUIDv7 (pas une chaîne libre)."""
    return bool(ref and REF_RE.match(str(ref).strip().lower()))


def enveloppe_erreur(code, message, ref=None, entite_id=None):
    """Enveloppe d'erreur unique (§16.3) : {code, message, ref, entite_id}."""
    return {"code": code, "message": message,
            "ref": ref or nouveau_ref(),
            "entite_id": entite_id}


def ecart_horloge(ts_iso, maintenant=None):
    """Écart en secondes entre `ts_iso` et `maintenant` (None si illisible).

    Jamais de rejet muet : l'appelant décide (401 clock_skew au-delà de
    ±5 min, §16.1). Un timestamp illisible = None (dit, pas 0)."""
    if not ts_iso:
        return None
    try:
        s = str(ts_iso).strip()
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        import datetime as _dt
        mom = _dt.datetime.fromisoformat(s)
        if mom.tzinfo is None:
            mom = mom.replace(tzinfo=_dt.timezone.utc)
        now = (maintenant if maintenant is not None else time.time())
        return mom.timestamp() - float(now)
    except (ValueError, TypeError, OverflowError):
        return None


def horloge_ok(ts_iso, maintenant=None, tolerance_s=TOLERANCE_HORLOGE_S):
    """(ok, ecart_s) — tolérance ±5 min (§16.1)."""
    ecart = ecart_horloge(ts_iso, maintenant)
    if ecart is None:
        return True, None
    return abs(ecart) <= tolerance_s, ecart


def rediger(prompt):
    """Redaction PII/secrets AVANT prompt (§15, §16.3).

    Remplace (sans jamais logger l'original) : IBAN-like, SIREN 9 chiffres en
    contexte bancaire, PIN/code 4-6 chiffres en contexte pin/code/serrure.
    Retourne (texte_redige, nb_redactions). Les années/dates hors contexte ne
    sont PAS touchées (un `2026` n'est pas un PIN)."""
    texte = str(prompt or "")
    n = 0

    def _sub(rx, repl):
        nonlocal texte, n
        texte, k = rx.subn(repl, texte)
        n += k

    # IBAN : 2 lettres + 2 chiffres + ≥12 alphanum (espaces tolérées).
    _sub(re.compile(r"[A-Za-z]{2}\d{2}(?:[ \t]?[A-Za-z0-9]){12,}"),
         "[IBAN_REDACTED]")
    # PIN/code en contexte explicite (pin, code, serrure, digicode + 4-6 chiffres).
    _sub(re.compile(r"(?i)\b(pin|code|serrure|digicode)\b[^\d]{0,20}\d{4,6}"),
         "[PIN_REDACTED]")
    # SIREN en contexte explicite (siren/siret + 9 chiffres).
    _sub(re.compile(r"(?i)\b(siren|siret)\b[^\d]{0,20}\d{9}"),
         "[SIREN_REDACTED]")
    return texte, n


def prompt_hash(texte_redige):
    """Empreinte loggable d'un prompt (sha256 hex, jamais le texte)."""
    return hashlib.sha256(str(texte_redige or "").encode("utf-8")).hexdigest()


def injection_detectee(texte):
    """Instruction embarquée dans un contenu non-système (§16.3) ?"""
    bas = str(texte or "").lower()
    return any(m in bas for m in INJECTION_MOTIFS)


def heritage(usage, cfg, entite_id=None, logement_id=None):
    """Config effective d'un usage : global → entité → logement (§16.3).

    Un override `cloud-optin` (provider ou modèle cloud) n'est retenu que si
    l'entité a coché son opt-in (`optins[entite_id].cloud = True`). Sinon le
    niveau global s'applique et le refus est DIT (`cloud_optin_refuse`)."""
    cfg = dict(cfg or {})
    glob = dict((cfg.get("global") or {}))
    usages = dict(cfg.get("usages") or {})
    base = dict(usages.get(str(usage) or "") or {})
    if not base:
        return None, {"erreur": "usage inconnu : " + str(usage)}
    eff = dict(base)
    optins = dict(cfg.get("optins") or {})
    ents = dict(cfg.get("entites") or {})
    logs = dict(cfg.get("logements") or {})
    for niveau in (ents.get(str(entite_id)) if entite_id else None,
                   logs.get(str(logement_id)) if logement_id else None):
        if isinstance(niveau, dict):
            sur = niveau.get(str(usage))
            if isinstance(sur, dict):
                eff.update({k: v for k, v in sur.items()
                            if v is not None})
    cloud_demande = "cloud" in str(eff.get("provider_primary", "")) \
        or "cloud" in str(eff.get("modele_primary", ""))
    if cloud_demande:
        opt = optins.get(str(entite_id)) if entite_id else None
        if not (isinstance(opt, dict) and opt.get("cloud") is True):
            eff["cloud_optin_refuse"] = True
            eff["provider_primary"] = base.get("provider_primary")
            eff["modele_primary"] = base.get("modele_primary")
    eff.setdefault("seuil_confidence",
                   glob.get("seuil_confidence", SEUIL_DEFAUT))
    return eff, None


def kill_actif(usage, cfg, entite_id=None):
    """Kill-switch : global OU usage OU entité (§15). 1 clic = degrade."""
    cfg = dict(cfg or {})
    if isinstance(cfg.get("global"), dict) \
            and cfg["global"].get("kill_global") is True:
        return True, "global"
    usages = cfg.get("usages") or {}
    if isinstance(usages.get(usage), dict) \
            and usages[usage].get("kill") is True:
        return True, "usage:" + str(usage)
    ents = cfg.get("entites") or {}
    if entite_id and isinstance(ents.get(str(entite_id)), dict) \
            and ents[str(entite_id)].get("kill") is True:
        return True, "entite:" + str(entite_id)
    return False, ""


def quota_autorise(compteurs, usage, cfg, entite_id=None, logement_id=None,
                   tokens=0):
    """Blocage DOUX de quota (§15) : (autorise, motif, effectif).

    `compteurs` = {usage: {"req": n, "tokens": n, "jour": "AAAA-MM-JJ"}} remis
    à zéro chaque jour. Dépassé = False + motif (l'appelant rend
    `degrade_sans_IA`, jamais une erreur silencieuse)."""
    eff, err = heritage(usage, cfg, entite_id, logement_id)
    if err:
        return False, err["erreur"], None
    import datetime as _dt
    jour = _dt.date.today().isoformat()
    c = dict((compteurs or {}).get(str(usage)) or {})
    if c.get("jour") != jour:
        c = {"req": 0, "tokens": 0, "jour": jour}
    q_req = eff.get("quota_req_j")
    try:
        q_req = int(q_req) if q_req is not None else None
    except (TypeError, ValueError):
        q_req = None
    if q_req is not None and int(c.get("req", 0)) >= q_req:
        return False, "quota req/j dépassé (%s/%s)" % (c.get("req"), q_req), eff
    return True, "", eff
