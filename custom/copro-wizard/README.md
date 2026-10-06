# custom/copro-wizard/README.md — wizard copro P2-16 (§12.1-bis + §1.6.4-2).

# 0 € logiciel (Python stdlib seule). Pas de port, pas de service : script CLI
# lancé par l'hôte (super_admin/admin) pendant l'onboarding, jamais en fond.
#
# ## Objet
# Méthode 5 sources §12.1-bis-1 dans l'ordre : (a) règlement copro
# (art. occupation/usage/bruit/animaux), (b) PV AG + votes (clause interdiction
# LCD ? majorité Le Meur ?), (c) accord écrit syndic, (d) mairie/PLU (Cerfa
# 14004*04 + n° enregistrement + 120j/90j + quota), (e) CGU 4 plateformes +
# droit FR §12.1. Résultat versé dans `copro:` (logements.yaml) + `docs/logN/copro/`
# → génération auto règlement/CGV/annonces, versions datées conservées.
#
# ## Blocage (défaut sûr)
# Tant que `copro.verifiee: false` → mise en ligne BLOQUÉE partout :
# moteurs 403 (decision.py, booking_direct.py), `sensor.logX_config_ok` rouge,
# carte dashboard SYSTÈME. `--check` sort exit 2. Jamais forcé.
# Garde-fou R.212-1 (M-JEV-1) : formulation interdite trouvée dans une pièce
# (amende forfaitaire, expulsion, coupure, caméras intérieures, …) = BLOQUÉ aussi.
#
# ## Bascule (humaine seule, après pièces réelles)
# - log1 Santa Severa : `verifiee: false → true` UNIQUEMENT après accord écrit
#   syndic + Cerfa/n° enregistrement versés dans `docs/log1/copro/` + relecture
#   juriste datée. Tant que `c_accord_syndic.md` manque → garder la formulation
#   « sous réserve du règlement + usages copro » (§12.1-bis-5) + relance tracée.
# - log2 : reste `false` défaut sûr = BLOQUÉ jusqu'au wizard copro complet.
#
# ## Recette locale (2026-10-06, OK)
# - `--init log1|log2` → `docs/logN/copro/` + 5 gabarits + checklist.md.
# - `--check` sur réel → exit 2 (les 2 `verifiee:false` + 5 pièces non remplies).
# - `--generer` sur bac à sable `LCD_LOGEMENTS_YAML` (copie `verifiee:true`)
#   + `LCD_DOCS_BASE` + 5 pièces remplies TEST → règlement daté + copie
#   courante ({{ logement }} {{ heures_calmes }} {{ occupants_max }} substitués,
#   ligne de traçabilité datée, mentions L.111-1/L.112-1/L.221-28/L.612-1).
# - Garde-fou : pièce avec « amende forfaitaire » → BLOQUÉ exit 2 (`interdits`,
#   verifiee=True — jamais de clause abusive générée).
# - `--generer` sur log1 réel → refusé (BLOQUÉE, comportement attendu).
# - Bac à sable `state/` supprimé après test ; runtime `docs/logN/` = PRIVÉ
#   jamais commité (`.gitignore` docs/log1/ docs/log2/).
#
# ## Fichiers
# - `copro_wizard.py` : `--init | --check | --generer` (stdlib seule).
# - `config.yaml` : 5 pièces + garde-fou R.212-1 + logements.
