# Facture B2C voyageur — facture simple PDF (FR source, validée humain)
# Template docs/templates/ — §12.5-bis (B2C voyageurs = facture simple PDF inchangée).
# Génération auto depuis lignes CA moteur direct (§4-bis) / compta (§12.6) — montants JAMAIS générés
# (M-LLM-7 : LLM remplit les trous seuls, jamais de clause ni de montant inventé).
# Placeholders {{ }} INTOUCHABLES : montants, dates, SIRET, adresses = injectés APRÈS traduction.
# Taxe de séjour : ligne DISTINCTE, hors CA, jamais dans le total (direct = voyageur paie via
# casa.taxesejour.fr ; OTA = collectée par la plateforme). Validation 1-tap avant envoi.

# Facture — {{ marque }}

Facture n° {{ numero_facture }} du {{ date_facture }} — Réservation {{ ref_resa }}
Émetteur : {{ raison_sociale }}, {{ adresse_hote }}, SIRET {{ siren }}
Client : {{ nom_voyageur }} — {{ adresse_voyageur }}
Logement : {{ logement }} ({{ adresse_logement }}) — Séjour : du {{ arrivee }} au {{ depart }}

| Désignation | Qté | PU TTC | Total TTC |
|---|---|---|---|
| Nuitée(s) {{ logement }} | {{ nb_nuits }} | {{ prix_nuitee_ttc }} € | {{ total_nuitees }} € |
| Frais de ménage (ligne séparée §12.2-ter) | 1 | {{ montant_menage }} € | {{ montant_menage }} € |
| Extras pré-commandés ({{ detail_extras }}) | {{ nb_extras }} | — | {{ total_extras }} € |

Total TTC acquitté : {{ prix_total_ttc }} € via {{ canal_paiement }}.
Taxe de séjour (hors CA, reversée CASA) : {{ taxe_sejour }} € — {{ mode_collecte_taxe }}.
TVA non applicable (LMNP micro-BIC, art. 293 B CGI) — à adapter selon régime fiscal (§12.6).

Mentions : L.111-1 / L.112-1 — réclamation : {{ email_hote }}, médiation {{ mediateur_nom }}
({{ mediateur_site }}) + https://ec.europa.eu/consumers/odr (L.612-1).
