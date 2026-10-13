"""seuils.py — G4-a : SEUILS D'ALERTE du parc (module PUR, 0 I/O).

Pourquoi un module à part : une alerte est une RÈGLE, donc elle doit être
lisible et testable sans moteur, sans docker et sans attendre 10 minutes
qu'une box tombe. Tout est calculé à partir de données INJECTÉES, `maintenant`
compris : aucun `time.time()` ici, sinon on ne peut pas prouver le comportement.

La règle qui gouverne tout le fichier : **une valeur inconnue ne produit JAMAIS
une alerte vide**. Un parc dont on ne sait pas s'il est joignable doit le DIRE
(`code: "..._inconnu"`), pas se taire. Une liste d'alertes vide qui veut dire
« tout va bien » alors qu'on ne mesure rien est le pire des états — c'est
exactement ce que §49 appelle « un moteur muet ne fait pas disparaître la
ligne, il la marque `stale` ».

Chaque alerte porte `regle` = la référence du plan d'où sort le seuil. Un
chiffre sans origine est un chiffre qu'on ne peut pas discuter.
"""

# --- Seuils nommés (constantes, jamais de chaîne en dur dans les comparaisons) - #
# §14 : « alerting (box down >10 min, outbox >50, écart rapprochement >2 %) ».
SEUIL_BOX_DOWN_S = 600            # §14 — 10 min sans signe de la box
SEUIL_OUTBOX_ALERTE = 50          # §16.2 — `outbox_len>50` déjà en /metrics
SEUIL_OUTBOX_PLAFOND = 500        # §16.2 — cap fichier/box, éviction ensuite
SEUIL_RAPPROCHEMENT_PCT = 2.0     # §5/§14 — écart de rapprochement compta
SEUIL_COUVERTURE_MIN = 2          # §5 — couverture < 2
SEUIL_CONFIANCE_MIN = 0.7         # §5 — confiance < 0.7
RC_J30 = 30                       # §5 — RC à J-30
RC_J7 = 7                         # §5 — RC à J-7
CLOTURE_JOUR_LIMITE = 5           # §5 — « clôture le 5 »
MANDAT_J30 = 30                   # §3bis — mandat qui expire bientôt
MANDAT_J7 = 7                     # §3bis — mandat qui expire très bientôt

NIVEAUX = ("info", "vigilance", "critique")


def _n(valeur, defaut=None):
    """Float sûr depuis un JSON : `None` si ce n'est pas un nombre.

    Un seuil se compare à un nombre. Si la source n'en donne pas, on renvoie
    `None` — jamais `0.0`, parce qu'un `0.0` passerait tous les seuils hauts et
    aucun des seuils bas, donc il mentirait dans les deux sens."""
    if isinstance(valeur, bool) or valeur is None:
        return None
    try:
        return float(valeur)
    except (TypeError, ValueError):
        return None


def alerte(code, niveau, message, regle, **extra):
    """Fabrique une alerte. `regle` est OBLIGATOIRE : d'où sort ce seuil."""
    if niveau not in NIVEAUX:
        niveau = "info"
    a = {"code": code, "niveau": niveau, "message": message, "regle": regle}
    a.update({k: v for k, v in extra.items() if v is not None})
    return a


# --- Une alerte par type de seuil -------------------------------------------- #
def box_down(box_id, last_seen_ts, maintenant_ts, seuil_s=SEUIL_BOX_DOWN_S):
    """Box muette depuis trop longtemps. `last_seen_ts` = epoch seconds.

    - `last_seen_ts` absent/None → **`box_joignabilite_inconnue`**, pas
      `box_down`. On n'a jamais vu la box : dire « down depuis 600 s » serait
      une invention, et la classer muette la ferait fermer.
    - âge > seuil → `box_down` (critique). L'alerte porte l'âge ET le seuil, pour
      qu'un humain voie de combien on a dépassé."""
    if not box_id:
        return None
    vu = _n(last_seen_ts)
    if vu is None:
        return alerte("box_joignabilite_inconnue", "vigilance",
                      f"{box_id} : aucun contact enregistré — joignabilité "
                      "inconnue, à vérifier (ce n'est PAS une box tombée)",
                      "§14")
    age = float(maintenant_ts) - vu
    if age < 0:
        # Horloge qui recule : on le dit, on n' « arrondit » pas à 0.
        return alerte("horloge_incoherente", "vigilance",
                      f"{box_id} : last_seen dans le futur ({age:.0f} s) — "
                      "dérive d'horloge à vérifier", "§29")
    if age > seuil_s:
        return alerte("box_down", "critique",
                      f"{box_id} : muette depuis {age:.0f} s (seuil "
                      f"{seuil_s} s)", "§14",
                      age_s=round(age, 1), seuil_s=seuil_s)
    return None


def outbox(box_id, longueur, seuil=SEUIL_OUTBOX_ALERTE,
           plafond=SEUIL_OUTBOX_PLAFOND):
    """File d'attente hors-ligne qui grossit. Deux régimes, pas un :

    - `longueur` inconnue → `outbox_inconnue` (on ne sait pas si la file
      grossit, et le budget disque est le risque réel).
    - > `plafond` (500) → **critique** : §16.2 impose l'éviction, reporting
      d'abord, financier jamais évincé. C'est une perte de données possible.
    - > `seuil` (50) → vigilance : alerte `outbox_len>50` déjà prévue en
      `/metrics`, la box est probablement injoignable."""
    if not box_id:
        return None
    n = _n(longueur)
    if n is None:
        return alerte("outbox_inconnue", "vigilance",
                      f"{box_id} : longueur de la file d'attente inconnue — "
                      "budget disque non vérifiable", "§16.2")
    n = int(n)
    if n > plafond:
        return alerte("outbox_plafond_depasse", "critique",
                      f"{box_id} : {n} fichiers en attente (plafond {plafond}) "
                      "— éviction attendue, reporting d'abord, financier "
                      "jamais évincé", "§16.2", longueur=n, plafond=plafond)
    if n > seuil:
        return alerte("outbox_grossit", "vigilance",
                      f"{box_id} : {n} fichiers en attente (seuil {seuil}) — "
                      "la box ne rattrape pas", "§16.2",
                      longueur=n, seuil=seuil)
    return None


def rapprochement(ecart_pct, seuil=SEUIL_RAPPROCHEMENT_PCT,
                 exiger=True):
    """Écart de rapprochement compta. `None` = `compta_inconnue`.

    §5/§14 : au-delà de 2 %, l'écart part dans une file de validation. Un
    écart de 0 % « parce qu'on n'a pas les données » serait faux : la compta
    muette doit se voir."""
    e = _n(ecart_pct)
    if e is None:
        if not exiger:
            return None
        return alerte("compta_rapprochement_inconnu", "vigilance",
                      "rapprochement non calculable : la compta n'expose pas "
                      "l'écart — à vérifier avant clôture", "§5")
    if abs(e) > seuil:
        return alerte("rapprochement_ecart", "vigilance",
                      f"écart de rapprochement {e:.2f} % (seuil {seuil} %) — "
                      "part en file de validation, jamais de correction auto",
                      "§14", ecart_pct=e, seuil=seuil)
    return None


def couverture(nb, seuil=SEUIL_COUVERTURE_MIN, exiger=True):
    n = _n(nb)
    if n is None:
        if not exiger:
            return None
        return alerte("couverture_inconnue", "info",
                      "couverture non communiquée", "§5")
    if n < seuil:
        return alerte("couverture_faible", "vigilance",
                      f"couverture {n:.0f} (minimum {seuil})", "§5",
                      couverture=n, seuil=seuil)
    return None


def confiance(score, seuil=SEUIL_CONFIANCE_MIN, exiger=True):
    s = _n(score)
    if s is None:
        if not exiger:
            return None
        return alerte("confiance_inconnue", "info",
                      "confiance non communiquée", "§5")
    if s < seuil:
        return alerte("confiance_faible", "vigilance",
                      f"confiance {s:.2f} (minimum {seuil})", "§5",
                      confiance=s, seuil=seuil)
    return None


def rc(jours_restants, exiger=True):
    """RC (responsabilité civile) : expirée, à J-30, à J-7 (§5)."""
    j = _n(jours_restants)
    if j is None:
        if not exiger:
            return None
        return alerte("rc_inconnue", "vigilance",
                      "date de RC non communiquée — à vérifier", "§5")
    if j < 0:
        return alerte("rc_expiree", "critique",
                      f"RC expirée depuis {-j:.0f} j", "§5", jours=j)
    if j <= RC_J7:
        return alerte("rc_bientot_expiree", "critique",
                      f"RC expire dans {j:.0f} j", "§5", jours=j)
    if j <= RC_J30:
        return alerte("rc_a_renouveler", "vigilance",
                      f"RC à renouveler sous {j:.0f} j", "§5", jours=j)
    return None


def cloture(jour_mois, limite=CLOTURE_JOUR_LIMITE):
    """Clôture compta « le 5 ». Passé la limite sans clôture = vigilance."""
    j = _n(jour_mois)
    if j is None:
        return alerte("cloture_jour_inconnu", "info",
                      "jour de clôture non communiqué", "§5")
    if j <= limite:
        return alerte("cloture_possible", "info",
                      f"clôture faisable depuis le {j:.0f}", "§5", jour=j)
    if j <= limite + 5:
        return alerte("cloture_en_retard", "vigilance",
                      f"clôture ouverte depuis le {j:.0f} (attendu le {limite})",
                      "§5", jour=j)
    return None


def copro(valeur, exiger=True):
    """`copro.verifiee = false` = écritures BLOQUÉES (§12.1).

    On n'alerte QUE sur un `False` explicite : `None` (moteur muet) est déjà
    couvert par `stale`, et alerter « copro non vérifiée » sur une absence de
    donnée ferait doublon avec un message faux."""
    if valeur is not False:
        return None          # True = coché ; None = moteur muet (canal stale)
    return alerte("copro_non_verifiee", "vigilance",
                      "copro non vérifiée : écritures bloquées en attendant "
                      "vérification", "§12.1")
    return None


def mandat_echeance(jours_restants, logement_id=""):
    """§3bis (G2bis-a/b) : un mandat qui expire. Rappel J puis J-7."""
    j = _n(jours_restants)
    if j is None:
        return None
    ou = f"{logement_id} : " if logement_id else ""
    if j < 0:
        return alerte("mandat_expire", "critique",
                      f"{ou}mandat expiré depuis {-j:.0f} j — plus de "
                      "reversement possible sans renouvellement", "§3bis",
                      jours=j)
    if j <= MANDAT_J7:
        return alerte("mandat_expire_bientot", "critique",
                      f"{ou}mandat expire dans {j:.0f} j", "§3bis", jours=j)
    if j <= MANDAT_J30:
        return alerte("mandat_a_renouveler", "vigilance",
                      f"{ou}mandat à renouveler sous {j:.0f} j", "§3bis",
                      jours=j)
    return None


def fanout_slo(p95_ms, budget_ms):
    """Le budget fan-out. Dépassé = alerte, PAS une panne.

    On garde le `p95` mesuré tel quel (déjà en `/metrics`) et on le confronte
    au budget : un SLO qu'on mesure sans jamais le comparer à un budget ne sert
    à rien. `None` → `fanout_slo_inconnu` (moins d'une mesure)."""
    p = _n(p95_ms)
    b = _n(budget_ms)
    if p is None or b is None or b <= 0:
        return alerte("fanout_slo_inconnu", "info",
                      "budget fan-out non mesurable encore", "§14")
    if p > b:
        return alerte("fanout_slo_depasse", "vigilance",
                      f"fan-out p95 {p:.0f} ms > budget {b:.0f} ms", "§14",
                      p95_ms=round(p, 1), budget_ms=b)
    return None


# --- Agrégation --------------------------------------------------------------- #
def evaluer(boxes, logements, metrics, maintenant_ts, seuils=None):
    """Toutes les alertes G4 du parc, en une liste triée par gravité.

    `boxes`    : [{"box_id","last_seen_ts","outbox_len"}]
    `logements`: [{"logement_id","copro_verifiee","confiance","couverture",
                   "rapprochement_pct","rc_jours","mandat_jours"}]
    `metrics`  : ce que `metriques()` expose déjà (fanout_p95_ms, budget).

    Le tri met les `critique` d'abord : un parc avec 3 alertes dont une
    critique ne doit pas la faire disparaître sous deux `vigilance`. Les
    alertes des moteurs (`decision alertes[]`) ne passent PAS ici : elles ont
    déjà leur canal dans `/etat-parc`, et les mélanger ferait deux vérités."""
    s = dict(seuils or {})
    out = []
    for b in boxes or []:
        out.append(box_down(b.get("box_id"), b.get("last_seen_ts"),
                            maintenant_ts, s.get("box_down_s",
                                                 SEUIL_BOX_DOWN_S)))
        out.append(outbox(b.get("box_id"), b.get("outbox_len"),
                          s.get("outbox_alerte", SEUIL_OUTBOX_ALERTE),
                          s.get("outbox_plafond", SEUIL_OUTBOX_PLAFOND)))
    manquants = set()
    for l in logements or []:
        lid = l.get("logement_id")
        for mesure, val in (("copro_verifiee", l.get("copro_verifiee")),
                            ("confiance", l.get("confiance")),
                            ("couverture", l.get("couverture")),
                            ("rapprochement_pct", l.get("rapprochement_pct")),
                            ("rc_jours", l.get("rc_jours"))):
            if _n(val) is None and not isinstance(val, bool):
                manquants.add(mesure)
        out.append(copro(l.get("copro_verifiee"), exiger=False))
        out.append(confiance(l.get("confiance"),
                             s.get("confiance_min", SEUIL_CONFIANCE_MIN),
                             exiger=False))
        out.append(couverture(l.get("couverture"),
                              s.get("couverture_min", SEUIL_COUVERTURE_MIN),
                              exiger=False))
        out.append(rapprochement(l.get("rapprochement_pct"),
                                 s.get("rapprochement_pct",
                                       SEUIL_RAPPROCHEMENT_PCT),
                                 exiger=False))
        out.append(rc(l.get("rc_jours"), exiger=False))
        out.append(mandat_echeance(l.get("mandat_jours"), lid))
    out.append(fanout_slo((metrics or {}).get("fanout_p95_ms"),
                          (metrics or {}).get("fanout_budget_ms")))
    vues = [a for a in out if a]
    rang = {"critique": 0, "vigilance": 1, "info": 2}
    vues = sorted(vues, key=lambda a: (rang.get(a.get("niveau"), 3),
                                       str(a.get("code", ""))))
    vues.append(alerte("mesures_absentes", "info",
                       "non évalué ici (pas dans les données du gateway) : "
                       + ", ".join(sorted(manquants)),
                       "§5 — un parc qu'on ne mesure pas doit le dire"))
    return vues


def resumer(alertes):
    """Compte par niveau. Un parc « 0 alerte » se lit enfin honnêtement : on
    rend AUSSI `inconnues` (les seuils qu'on n'a pas pu évaluer)."""
    par = {"critique": 0, "vigilance": 0, "info": 0}
    for a in alertes or []:
        par[a.get("niveau", "info")] = par.get(a.get("niveau", "info"), 0) + 1
    return {"total": len(alertes or []),
            "critique": par["critique"],
            "vigilance": par["vigilance"],
            "info": par["info"]}
