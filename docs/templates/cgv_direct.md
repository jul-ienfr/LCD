# CGV direct — Conditions Générales de Vente (FR source, validée humain + relecture juriste initiale OBLIGATOIRE avant mise en ligne)
# Template docs/templates/ — moteur direct §4-bis (§12.2). Plan type 14 articles (recommandé DGCCRF).
# Variables {{ }} injectées depuis custom/logements.yaml + custom/branding.yaml + données résa moteur direct.
# Placeholders {{ }} INTOUCHABLES par la traduction (§5.7-ter) : montants, dates, heures, adresses,
# noms propres, n° enregistrement = injectés APRÈS traduction. Traductions EN/ES/IT/DE validées humain,
# toute autre maternelle = auto LLM badge auto. Garde-fou pré-publication : M-JEV-1 (Noul clause_abusive_R2121
# + amende_forfaitaire + paiement_hors_plateforme, >0,5 = blocage mise en ligne).
# R.212-1/R.212-2 : aucune clause de la liste noire/grise — tout déséquilibre significatif = réputé non écrit.

# Conditions Générales de Vente — {{ marque }} — {{ logement }}

## Article 1 — Préambule : identité et statut

Le présent contrat est proposé par {{ raison_sociale }}, {{ adresse_hote }}, tél. {{ tel_hote }},
email {{ email_hote }}, SIRET {{ siren }} (L.111-1, R.111-1 du Code de la consommation).
Médiateur de la consommation : {{ mediateur_nom }} ({{ mediateur_site }}). Litiges en ligne :
https://ec.europa.eu/consumers/odr (L.612-1, R.612-1).

## Article 2 — Objet et descriptif

Location saisonnière meublée : {{ logement }}, {{ adresse_logement }}, {{ surface_m2 }} m²,
capacité maximale {{ capacite_max }} personnes, classement {{ classement }}.
N° d'enregistrement mairie : {{ numero_enregistrement }} (affiché sur toutes les annonces, L.311-6 ;
interdiction d'afficher un classement non attribué par Atout France).
Règlement intérieur applicable : affiché dans le logement et remis avant réservation (identique tous canaux).

## Article 3 — Prix TTC, taxe de séjour, charges, caution (L.112-1)

Prix total TTC en euros, détaillé avant réservation : nuitée {{ prix_nuitee_ttc }} € TTC,
frais de ménage {{ montant_menage }} € TTC en ligne séparée (§12.2-ter), linge et charges inclus,
taxe de séjour {{ taxe_sejour }} €/nuit/adulte collectée pour le compte de la CASA
(intercommunale +44 % : +10 % départemental 06 +34 % LNPCA), hors chiffre d'affaires, jamais du CA.
Caution (dépôt de garantie, restitué — ce n'est pas du prix, §12.3) : mentionnée à part, article 6.
Aucun frais caché après réservation (L.121-1). Remises éventuelles (durée 7+/28+, saison, early-bird,
last-minute, jour semaine) : critères objectifs affichés avant réservation uniquement —
jamais selon origine, nom, photo, statut ou tout critère discriminatoire (art. 225-1 Code pénal, §12.2-bis).

## Article 4 — Réservation, acompte, solde

Réservation ferme après acceptation des présentes CGV (case cochée, support durable L.221-5) et
versement d'un acompte de {{ acompte_pct }} %. Solde exigible au plus tard {{ solde_echeance }}.
Tarifs : flex = pivot (annulation J-7) / non remboursable −10 % (encaissé d'avance, non remboursé) /
flex+ +15 % (annulation J-1) en périodes de pointe — {{ politique_annulation }}.

## Article 5 — Arrivée, départ, état des lieux, inventaire

Arrivée à partir de {{ heure_arrivee }}, départ au plus tard {{ heure_depart }}.
État des lieux d'entrée et de sortie contradictoire avec photos horodatées + inventaire.
Late check-out / early check-in : gratuit si <2 h et sans rotation le jour même, sinon 50 % de la nuitée,
proposé uniquement si le calendrier le permet.

## Article 6 — Dépôt de garantie : montant, mode, retenues, délais

Une empreinte de {{ montant_caution }} EUR sera demandée à l'arrivée et libérée sous 7 jours après
état des lieux. Retenues possibles uniquement sur justificatifs (photos + facture/devis) :
dégradations, manquants d'inventaire, ménage non restitué en l'état au-delà de l'usure normale.
Restitution au plus tard 30 jours après le départ. Jamais de retenue automatique pour ménage,
usure normale, état des lieux non contradictoire, ni délai excessif (R.212-1).

## Article 7 — Annulation du client, du loueur, force majeure (art. 1218 Code civil)

Grille d'annulation graduée (voir article 4). Annulation par le loueur : remboursement intégral +
indemnité miroir. Force majeure (art. 1218) : report ou avoir proposé en premier, puis remboursement.
Proposition d'assurance annulation facultative à la réservation.

## Article 8 — Obligations du locataire

Jouissance paisible, capacité maximale {{ capacite_max }} personnes (occupants déclarés),
fêtes et sous-location interdites, tabac interdit, animaux : selon annonce et contrat.
Heures calmes : {{ heures_calmes }}. Tout manquement grave après mise en demeure peut entraîner
la résiliation ; les frais de remise en état sont chiffrés sur justificatifs uniquement —
jamais d'amende forfaitaire punitive (R.212-1).

## Article 9 — Obligations du loueur

Délivrance d'un logement conforme au descriptif et entretenu. Coordonnées d'urgence :
{{ tel_urgence }}, délai d'intervention communiqué à l'arrivée. Diagnostics et DPE annexés au contrat.

## Article 10 — Assurance et sinistre

Attestation d'assurance responsabilité civile villégiature exigée du locataire.
En cas de sinistre : déclaration sous 48 h, photos, dépôt au dossier ; procédure rappelée
selon le canal (direct : hold Swikly/Stripe, §12.4).

## Article 11 — Absence de droit de rétractation (L.221-28)

Conformément à l'article L.221-28 12° du Code de la consommation, le droit de rétractation
de 14 jours ne s'applique pas aux prestations d'hébergement fournies à une date déterminée.

## Article 12 — Réclamation et médiation (L.612-1)

Réclamation écrite à {{ email_hote }} (réponse sous 30 jours). À défaut d'accord, médiation
obligatoire si professionnel : {{ mediateur_nom }} ({{ mediateur_site }}) +
https://ec.europa.eu/consumers/odr. Aucune clause attributive de compétence ni médiation
payante imposée (R.212-1).

## Article 13 — Données personnelles (RGPD), DPE, ERP/bruit

Données collectées limitées au séjour (identités occupants, contacts, préférences si opt-in),
conservation 24 mois, présence 90 jours, révocation 1-tap (voir politique RGPD : {{ rgpd_url }}).
DPE classe {{ dpe_classe }} affiché dans le logement et remis sur demande. ERP et niveaux
sonores d'information disponibles dans le guide voyageur.

## Article 14 — Droit applicable et juridiction

Contrat soumis au droit français. Juridiction compétente : tribunaux du lieu de situation
du logement, sans préjudice des règles protectrices du consommateur.

## Annexes

DPE, ERP, notice piscine (le cas échéant), attestation détecteur de fumée.
Si conciergerie pour tiers : carte professionnelle G + mandat Loi Hoguet.
Version datée conservée à chaque modification — toute modification = revalidation M-JEV-1.
