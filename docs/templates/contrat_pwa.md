# Contrat voyageur PWA 30 s — résumé 1 page + acceptation + signature tactile (FR source, validée humain)
# Template docs/templates/ — §12.5-bis + M-LLM-1 (résumé CGV/contrat 1 page par langue).
# Lien J-2 + QR accueil → CGV direct §12.2 résumées (capacité, bruit 22h-8h, non-fumeur, caution/hold,
# annulation) + case acceptation + signature tactile → PDF horodaté `/config/contrats/logX/<ref_resa>.pdf`
# (RUNTIME /config/ = gitignoré, JAMAIS commité) + preuve d'acceptation opposable.
# Direct : contrat signé EXIGÉ avant envoi PIN. OTA : règlement via messagerie plateforme déjà traçé.
# Placeholders {{ }} INTOUCHABLES par la traduction (§5.7-ter) : montants, dates, heures, adresses,
# noms propres = injectés APRÈS traduction. Montants depuis custom/logements.yaml + moteur direct,
# JAMAIS inventés. Phrase caution VERBATIM obligatoire (M-LLM-1, ne jamais reformuler) :
# « Une empreinte de XXX EUR sera demandée à l'arrivée et libérée sous 7 jours après état des lieux. »
# Mentions L.111-1 / L.112-1 / L.221-28 / L.612-1 + médiateur nom+site + ODR OBLIGATOIRES.
# R.212-1 interdit. Relecture juriste initiale + validation 1-tap avant gel socle.

# Contrat de séjour — {{ marque }} — {{ logement }}

Référence réservation : {{ ref_resa }} — Voyageur : {{ nom_voyageur }} — Séjour : du {{ arrivee }}
({{ heure_arrivee }}) au {{ depart }} ({{ heure_depart }}) — {{ nb_voyageurs }} personne(s).

Logement : {{ logement }}, {{ adresse_logement }} — N° enregistrement mairie : {{ numero_enregistrement }}.

## Votre séjour en 1 page (résumé des CGV — le contrat complet : {{ cgv_url }})

1. **Capacité** : {{ capacite_max }} personnes maximum, occupants déclarés. Fêtes et sous-location interdites.
2. **Calme et voisinage** : heures calmes {{ heures_calmes }}, seuils 75 dB jour / 60 dB nuit,
   escalade en 3 niveaux (rappel, visite, départ anticipé en cas de manquement grave après mise en demeure).
3. **Non-fumeur, animaux** : logement non-fumeur. Animaux : {{ animaux_regle }}.
4. **Prix TTC** : {{ prix_total_ttc }} € TTC tout compris (nuitée {{ prix_nuitee_ttc }} € + ménage
   {{ montant_menage }} € + taxe de séjour {{ taxe_sejour }} €), payé via {{ canal_paiement }}.
   Aucun frais supplémentaire sur place sans pré-commande avant J-1 18h.
5. **Caution** : Une empreinte de {{ montant_caution }} EUR sera demandée à l'arrivée et libérée
   sous 7 jours après état des lieux. Retenues uniquement sur justificatifs (photos + facture/devis).
6. **Annulation** : {{ politique_annulation }}. Pas de droit de rétractation de 14 jours pour un
   hébergement à date déterminée (L.221-28 12°).
7. **Réclamation / médiation** : {{ email_hote }}, puis {{ mediateur_nom }} ({{ mediateur_site }})
   + https://ec.europa.eu/consumers/odr (L.612-1).

## Acceptation

☐ Je reconnais avoir pris connaissance des CGV complètes ({{ cgv_url }}) et du règlement intérieur,
et je les accepte sans réserve.

Signature tactile : ____________________ Date et heure : {{ horodatage_signature }}

Document horodaté généré automatiquement — preuve d'acceptation opposable conservée avec la réservation.
Données : voir politique RGPD {{ rgpd_url }} (conservation 24 mois, révocation 1-tap).
