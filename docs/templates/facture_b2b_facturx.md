# Facture B2B gestion/conciergerie — Factur-X e-facture 2026-2027 (FR source, validée humain + expert-comptable)
# Template docs/templates/ — §12.5-bis (B2B propriétaires tiers §13 / partenaires = Factur-X obligatoire
# calendrier DGFiP : grandes entreprises 2026, généralisation 2027).
# Format Factur-X = PDF + XML Chorus Pro : le présent template = LISIBILITÉ HUMAINE du PDF ;
# le XML structuré est généré par le moteur (facturation.py) depuis les MÊMES lignes CA
# « gestion/commission » (§12.6) + dépôt Chorus Pro. Montants JAMAIS générés (M-LLM-7 : trous seuls).
# Données personnelles → `llm_eu_only` si LLM impliqué. Validation 1-tap avant dépôt Chorus Pro.
# B2C voyageurs = facture simple PDF (facture_b2c.md) — ne jamais émettre en Factur-X vers un particulier.

# Facture B2B — {{ marque }}

Facture n° {{ numero_facture }} du {{ date_facture }} — Dossier {{ ref_dossier }}
Émetteur : {{ raison_sociale }}, {{ adresse_hote }}, SIRET {{ siren }}, TVA intracomm. {{ tva_ic }}
Client pro : {{ raison_sociale_client }}, SIRET {{ siren_client }}, TVA intracomm. {{ tva_ic_client }}

| Désignation | Base HT | TVA | Total TTC |
|---|---|---|---|
| {{ ligne_prestation }} ({{ periode }}) | {{ base_ht }} € | {{ tva_pct }} % | {{ total_ttc }} € |

Net à payer : {{ total_ttc }} € — échéance {{ date_echeance }}.
Pénalités de retard : 3× taux légal + indemnité forfaitaire 40 € (L.441-10 Code de commerce).
XML Factur-X joint (profil {{ facturx_profil }}) — dépôt Chorus Pro : {{ statut_chorus }}.

Litiges pro : médiation {{ mediateur_nom }} ({{ mediateur_site }}) — traçabilité `decision.logX.jsonl`.
