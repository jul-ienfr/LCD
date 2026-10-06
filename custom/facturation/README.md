# custom/facturation — moteur facturation P2-10 (§12.2 + §12.5-bis)

0 € : stdlib Python seule. Port `:8093` (127.0.0.1, même LXC que ics-sync/pricing/decision).

## Ce que fait ce moteur

Génère les documents voyageur/compta depuis les templates versionnés `docs/templates/`
(FR source, validés humain — CGV 14 articles §12.2, contrat PWA 30 s §12.5-bis + M-LLM-1,
facture B2C simple, facture B2B Factur-X) :

- `POST /contrat {logement_id, ref_resa, vars{...}}` → contrat 1 page rempli → sortie
  runtime `<contrats_dir>/logX/<ref_resa>_contrat.md` (+ `.json` preuve horodatée).
  Sortie = `/config/contrats/` sur box (gitignoré, JAMAIS commité).
- `POST /facture {logement_id, ref_resa, b2b, vars{...}}` → facture B2C (nuitées + ménage
  ligne séparée + extras ; taxe séjour ligne DISTINCTE hors CA) ou B2B (PDF lisible + XML
  Factur-X profil BASIC depuis les MÊMES lignes CA, dépôt Chorus Pro).
- `POST /valider {logement_id, ref_resa, type_doc, qui}` → `brouillon` → `valide`
  (1-tap HUMAINE exigée — `qui` ≠ auto/llm/jev refusé).
- `GET /doc?logement_id&ref_resa&type_doc` → contenu + statut.
- `GET /templates`, `GET /health`.

## Règles inviolables (M-LLM-7 : trous seuls)

- Montants/dates/adresses/SIRET **TOUJOURS reçus** (moteur direct / pricing / compta),
  **JAMAIS générés**. Placeholder `{{ }}` non fourni → **422, jamais de trou vide**.
- Garde-fou M-JEV-1 déterministe (en attendant Noul Jev Phase 7) : chaque document est
  scanné — motifs interdits R.212-1/R.212-2 (`interdits_garde_fou`), mentions obligatoires
  (L.221-28, L.612-1, ODR), phrase caution VERBATIM pour les contrats
  (« Une empreinte de … »). Manquement → statut `bloque` + log, **jamais forcé**.
- Naissance `brouillon` → envoi voyageur / dépôt Chorus Pro **seulement après**
  `POST /valider` humain. Relecture juriste initiale (CGV/contrat) + expert-comptable
  (B2B) sur box avant gel socle.
- Direct : contrat signé **EXIGÉ avant envoi PIN** (orchestré par decision-engine P2-8).
- B2C voyageurs = facture simple, **jamais de Factur-X vers un particulier**.
- Secrets : aucun (pas d'appel réseau). `branding.yaml` PRIVÉ (jamais commité) ;
  absent en local → variables marque exigées dans `vars{}`.
- Variables statiques auto : `logement`, `adresse_logement`, `surface_m2`,
  `capacite_max`, `heures_calmes`, `animaux_regle`, `montant_menage`, `prix_nuitee_ttc`
  (depuis `custom/logements.yaml`) + clés `branding.yaml` si présent.
- Traçabilité : chaque génération/validation → `decision.logX.jsonl`.

## Fichiers

- `facturation.py` — moteur (stdlib : `http.server`, `argparse`, `json`, `re`).
- `config.yaml` — port `:8093`, chemins (`contrats_dir` à monter sur `/config/contrats/`),
  listes garde-fou, mentions, phrase caution.
- `facturation.service` — systemd (`After pricing-engine`).

## Tests locaux 2026-10-06 (0 €, stdlib, Python 3.14)

- Liste templates : contrat 45 l. / facture_b2c 27 l. / facture_b2b 24 l. — OK.
- Contrat TEST-001C : `brouillon`, garde-fou clean (`bloque: false`), purge vérifiée
  (zéro ligne `# Template`, 3 titres `#`/`##` intacts), `POST /valider` humain → `valide`.
- Trous vides → 422 + liste manquants (19 placeholders) ; `amende forfaitaire` →
  `bloque` + `interdits_trouves` ; `qui=auto` → 400 (1-tap HUMAINE seule).
- Facture B2C `brouillon` (mentions L.612-1 + ODR) ; B2B `brouillon` + XML Factur-X
  BASIC (mêmes montants CA, dépôt Chorus Pro).
- Reste box : déploiement LXC + relecture juriste (CGV/contrat) + expert-comptable (B2B).
