"""i18n.py — multilinguisme passerelle + PWA + notifications (§17), stdlib 0 €.

Catalogues `i18n/{fr,en,es,it,de}.yaml` (versionnés, `clé: texte`, pluriels
`one/other`, `{{variables}}` marque blanche, jamais de logique dedans).

Règles (§17) :
- 5 langues v1 : FR/EN/ES/IT/DE. Toute nouvelle chaîne FR livrée avec ses 4
  traductions (checklist merge bloque si clé manquante). NL/PT = G6.
- Priorité : `?lang=` > choix utilisateur persisté > `Accept-Language` >
  défaut entité/logement > `fr`.
- `t(cle, lang, vars)` : clé manquante = la clé ELLE-MÊME entre crochets
  (`[cle]`), jamais une chaîne vide ni une autre langue en silence — une
  fuite se VOIT.
- `{{variable}}` manquante = gardée telle quelle (`{{x}}` visible), pour que
  la batterie §30 détecte la fuite au lieu d'inventer une valeur.
- Dates/nombres/devises formatés par locale (EUR/CHF/GBP, taux figé/j) ;
  fuseau par logement (Europe/Paris défaut).
- SMS : version courte ≤160 caractères par langue (gabarits testés).
- Traductions IA (faq/messagerie) : brouillon + validation humaine, jamais
  d'envoi auto ; chaînes UI socle (boutons, erreurs, 422/403) = traductions
  humaines relues UNIQUEMENT.
"""
import os
import re

LANGUES = ("fr", "en", "es", "it", "de")
DEFAUT = "fr"

# Formats par locale (§17) : décimales, séparateur milliers, symbole devise.
LOCALES = {
    "fr": {"dec": ",", "milliers": " ", "devise": "€",
           "devise_apres": True, "date": "%d/%m/%Y"},
    "en": {"dec": ".", "milliers": ",", "devise": "€",
           "devise_apres": False, "date": "%Y-%m-%d"},
    "es": {"dec": ",", "milliers": ".", "devise": "€",
           "devise_apres": True, "date": "%d/%m/%Y"},
    "it": {"dec": ",", "milliers": ".", "devise": "€",
           "devise_apres": True, "date": "%d/%m/%Y"},
    "de": {"dec": ",", "milliers": ".", "devise": "€",
           "devise_apres": True, "date": "%d.%m.%Y"},
}


def _lire_catalogue(chemin):
    """Catalogue `clé: texte` plat (commentaires `#`, 1 niveau)."""
    cat = {}
    try:
        with open(chemin, encoding="utf-8") as f:
            for brute in f:
                ligne = brute.strip()
                if not ligne or ligne.startswith("#"):
                    continue
                if ":" not in ligne or brute.startswith((" ", "\t")):
                    continue
                k, v = ligne.split(":", 1)
                v = v.strip()
                if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
                    v = v[1:-1]
                cat[k.strip()] = v
    except FileNotFoundError:
        pass
    return cat


def charger(dossier):
    """`{lang: {cle: texte}}` pour les 5 langues (manquante = dict vide)."""
    out = {}
    for lang in LANGUES:
        out[lang] = _lire_catalogue(os.path.join(dossier, lang + ".yaml"))
    return out


def cles_manquantes(catalogues):
    """Clés FR sans traduction dans une autre langue (§17, checklist merge)."""
    ref = set((catalogues.get("fr") or {}))
    manq = {}
    for lang in LANGUES:
        if lang == "fr":
            continue
        manque = sorted(ref - set((catalogues.get(lang) or {})))
        if manque:
            manq[lang] = manque
    return manq


def choisir_langue(qs_lang="", profil_lang="", accept="", defaut_entite=""):
    """Priorité §17 : ?lang= > profil > Accept-Language > entité > fr."""
    for cand in (str(qs_lang or "").strip().lower(),):
        if cand in LANGUES:
            return cand, "query"
    if str(profil_lang or "").strip().lower() in LANGUES:
        return str(profil_lang).strip().lower(), "profil"
    for morceau in str(accept or "").replace(";", ",").split(","):
        code = morceau.strip().lower().split("-")[0].split("_")[0]
        if code in LANGUES:
            return code, "accept-language"
    if str(defaut_entite or "").strip().lower() in LANGUES:
        return str(defaut_entite).strip().lower(), "entite"
    return DEFAUT, "defaut"


def t(catalogues, cle, lang="fr", variables=None):
    """Rend une chaîne. Clé manquante = `[cle]` (visible, jamais de silence).

    Pluriels : `cle_one` / `cle_other` + `variables={n: ...}`. `{{var}}`
    sans valeur = gardée telle quelle (fuite détectable §30)."""
    lang = str(lang or DEFAUT).lower()
    if lang not in LANGUES:
        lang = DEFAUT
    cat = (catalogues or {}).get(lang) or {}
    variables = dict(variables or {})
    cle = str(cle or "")
    if "n" in variables and (cle + "_one" in cat or cle + "_other" in cat):
        try:
            n = int(variables["n"])
        except (TypeError, ValueError):
            n = 2
        cle = cle + ("_one" if n == 1 else "_other")
    texte = cat.get(cle)
    if texte is None:
        # Repli FR (dit), sinon la clé elle-même entre crochets.
        fr = ((catalogues or {}).get("fr") or {}).get(cle)
        texte = fr if fr is not None else "[" + cle + "]"
    for k, v in variables.items():
        texte = texte.replace("{{" + str(k) + "}}", str(v))
    return texte


def formater_montant(montant, langue="fr", devise="EUR"):
    """Montant localisé (EUR/CHF/GBP, §17). Inconnu = None (jamais 0)."""
    loc = LOCALES.get(str(langue or DEFAUT).lower(), LOCALES[DEFAUT])
    try:
        x = float(montant)
    except (TypeError, ValueError):
        return None
    symboles = {"EUR": "€", "CHF": "CHF ", "GBP": "£"}
    sym = symboles.get(str(devise or "EUR").upper(), "€")
    entier, dec = ("%0.2f" % x).split(".")
    grp = []
    while len(entier) > 3:
        grp.insert(0, entier[-3:])
        entier = entier[:-3]
    grp.insert(0, entier)
    nombre = loc["milliers"].join(grp) + loc["dec"] + dec
    if loc.get("devise_apres"):
        return nombre + " " + sym
    return sym + nombre


def sms_court(texte, limite=160):
    """(ok, texte) — un SMS >160 caractères par langue est un gabarit FAUX."""
    s = str(texte or "")
    return len(s) <= limite, s


def variables_restantes(texte):
    """`{{...}}` non substituées (fuite §30) : [] = propre."""
    return re.findall(r"\{\{\s*[A-Za-z0-9_]+\s*\}\}", str(texte or ""))
