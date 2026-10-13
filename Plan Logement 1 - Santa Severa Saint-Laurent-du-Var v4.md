# Cahier Logement — Vitrine + gabarit client v4

> Statut : figé le 2026-10-13. Référence : socle commun v1 (`§S*`).
> Forfaits, archi, seuils = socle. Ici = le logement et son exploitation.
> Log1 = pilote réel + vitrine + banc d'essai : ce qui y est validé devient
> le standard client. Rien n'est vendu avant d'avoir tourné sur log1.

## §L1 Bien vitrine — Santa Severa

T2, 65 m², 4-5 pax, Résidence Santa Severa, avenue Louis Ravet,
Saint-Laurent-du-Var. Adresse exacte : `docs/log1/infos-adresse.md` privé,
hors git. Atouts : Intermarché à côté, ~3 km aéroport, vue mer (pas pied
d'eau). Usage : meublé entier (Airbnb / Booking / Abritel / Leboncoin).
Mention annonce : proximité commerces + ~3 km aéroport + « avions
inaudibles à l'intérieur ; passage lointain possible selon météo ».

Copro (règlement reçu, p.17, art. 8-9) : meublé d'appartements ENTIERS
autorisé ; découpe à la chambre / coloc à la chambre / chambres d'hôtes
interdites. Condition : occupation bourgeoise + tranquillité → règlement
strict, pas de fêtes, horaires. Syndic : relance écrite exigée (« pas
d'interdiction / pas de clause exclusive / pas de vote AG contraire ») +
dernière version + PV d'AG (Le Meur : interdiction votable majorité simple).
Standard client : refuser tout logement au règlement interdisant la
saisonnière. Vérif règlement + PV à chaque visite.

Mairie : Cerfa 14004*04 + récépissé + n° sur toutes les annonces. Sans n° =
dépublier. Pas de go-live sans n°. 120 j/an max résidence principale
(vérifier 90 j Métropole) ; secondaire = PLU + changement d'usage / quota.
**Changement d'usage / compensation (résidence secondaire, Métropole NCA) :
vérifier délibération en vigueur à chaque onboarding (règle = date du mandat,
jamais du plan) ; si compensation exigée = devis + notaire, jamais promis
au client sans écrit mairie ; local commercial / ERP = exclu (pas de
transformation, pas d'ERP).**
Registre national (loi 19/11/2024) : bascule 2026, veille active.
Par client : 1 dossier conformité (Cerfa + PLU + quota de SA commune).

SIRET : LMNP via Guichet INPI/INSEE, vérifié à l'onboarding. Micro-BIC vs
réel (Le Meur : non classé 30 % / 15 000 € ; classé 50 % / 77 700 €).
Classement 1-5* en option (levier fiscal). Taxe de séjour : Métropole NCA
au réel + parts 06 + régionale ; OTA collectent et reversent 2x/an quand
intermédiaires — jamais reverser 2 fois. Compte portail taxe par
client/logement. Fonds tagués par logement (Stripe/Swikly).

DPE + sécurité (prérequis, pas option) : DPE affiché, détecteurs fumée,
diagnostics, assurance saisonnière. Pas d'install box si manquants.
Annonces : n° + classement + DPE + taxe + règlement. Objectif Superhost,
≥4,8, réponse ≥90 %.

Clients visés : Côte d'Azur (St-Laurent, Nice ouest, Sophia), T2-T3 meublés
copro classique, proprio ne voulant pas gérer. Exclus : hôtellerie,
découpe chambre, fêtes, animaux contraires copro.

## §L2 Pack box par forfait

1 seul pack par forfait. Écart = devis séparé, jamais gratuit.
½ journée de pose, J+7 après visite si stock. Matériel = propriété client
après paiement (FULL/PILOTAGE : reprise si résiliation <12 mois, au choix).
Chaque box = `box_id`/`logement_id` + entrée registre. Sans entrée =
pas de support.

| Forfait | Pack | Prix client (§S1) |
|---|---|---|
| FULL | mini-PC + Nuki + Minut + 2 sondes CO2 + clé + mini-bar + QR + kit + stocks + runbook | Entrée 290 € + 25 % brut HT + ménage 110 € ; plancher 149 €/mois ; 22 % dès 3 lots |
| PILOTAGE | mini-PC + Nuki + 1 sonde CO2 + QR + runbook (sans Minut/mini-bar) | Matériel ~640 € + mise en route 190 € + 149 €/mois (129 € dès 3 lots) |
| KIT | mini-PC + Nuki + QR + guide + formation 1 h | 890 € + 240 €/an ; pas de WG permanent |

Base coûts 2025-2026 : mini-PC ~180 €, Nuki ~280 €, Minut ~150 €,
sondes/QR/stocks ~100 €, ½ j main d'œuvre. >T3, 2e serrure, câblage =
devis. FULL = supervision complète. PILOTAGE = pilotage seul (todos +
photos/score, pas de dispatch, pas de sinistre sur place sans devis).
KIT = autonome (intervention à la demande, facturée hors maintenance).

Fonctions communes : questionnaire J-2 (PWA + PIN, 3 min, cut-off J-1 18h,
rappel J-1 15h ; sans réponse = kit standard, accès jamais bloqué),
extras payés d'avance (Stripe/Swikly tagué), guide PWA 5 langues (20 phrases
critiques validées humain), contrat voyageur PWA 30 s (PDF horodaté),
mémoire opt-in révocable purge 24 mois, WG FULL/PILOTAGE (KIT à la demande).
Fiche de police (R.611-42, étrangers hors UE) : remplie à l'arrivée
(questionnaire J-2 + PWA, 1 fiche/personne : nom, prénoms, date/lieu
naissance, nationalité, domicile, mobile), conservée 6 mois puis purge
auto, jamais de copie passeport stockée (Airbnb vérifie l'identité —
nous = fiche seule). Défaut = rappel J+1, jamais de blocage d'arrivée.
Permis de louer (si commune l'instaure, ex Nice programme) : dossier +
visite + autorisation affichés avant go-live, renouvellement suivi au
registre ; sans permis là où exigé = pas de mise en ligne.
Diagnostics obligatoires avant go-live : DPE + CREP (plomb, si bâti
<1949) + ERP/merguez état des risques + détecteurs fumée ; rapport
affiché dans le logement + PDF au contrat PWA ; défaut = go-live bloqué.

## §L3 Onboarding 7 étapes — identique par client

1. **Visite (45 min)** : règlement + PV (sinon stop) ; DPE/détecteurs/
   assurance (sinon prérequis devis) ; DPE E min (F/G = refusé sans devis
   travaux : G interdit en touristique au 01/01/2028, F puis E jusqu'en
   2034 — jamais de mandat sur une passoire sans plan) ; extras-compatible
   (frigo, kits, bruit, serrure Nuki) ; ≥2 prestas/métier critique à
   ~10 km (sinon pas de FULL) ; photos + mesures + commerces locaux.
2. **Contrat** : mandat écrit + CGV (FULL/PILOTAGE) ou vente + maintenance
   (KIT). RC pro à jour côté nous, RC prestas vérifiée (dispatch bloqué si
   expirée). Fonds tagués. Forfait acté. Équipement sécurité enfants +
   allergènes vérifié (lit parapluie aux normes + chaise haute + caches
   prises + housses anti-acariens, lessive hypoallergénique, mention
   annonce). Literie standard (matelas ferme ≤8 ans + protège imperméable,
   oreillers 1x/an, couettes 4 saisons, 3 jeux linge). Trousse secours
   (pansements + Doliprane scellé + notice, DLC 1x/an). Login client créé
   (dashboard `dash-proprio` : SES logements seuls, §S3.1), nominatif, 2FA
   admin/gestionnaire. Voisinage : lettre de présentation aux voisins
   (activité + contact + horaires, dès le go-live) + pouvoir AG client =
   jamais de vote sans mandat écrit (représentation 30 €/AG si demandée,
   jamais d'engagement sans consigne).
3. **Pack** : box préparée (image vitrine), ids créés, tarifs + extras
   saisis, prestas rattachés, langues, règlement adapté à SA copro, fiche
   mini-bar imprimée.
4. **Install (½ j)** : box + Minut (FULL) + CO2 + clé, mini-bar + QR +
   prix, kit + stocks, runbook plastifié, photos.
5. **Config** : WG + registre (FULL/PILOTAGE), OTA connectés, J-2 +
   paiement tagué, PWA aux couleurs.
6. **Conformité** : Cerfa + n° récupéré, portail taxe, SIRET vérifié,
   assurance + DPE + détecteurs OK, affichage taxe.
7. **Go-live** : n° + DPE sur annonces, 1 résa test bout en bout
   (questionnaire → extra → todo → enquête J+1), drill ménage 3 h, doc
   remise, date au registre. Jalon : pas de 2e FULL avant 1 mois vitrine
   sans incident copro.

## §L4 Exploitation — standard cible

Ménage runbook 3 h (6 étapes + incidents : fuite, bruit, serrure, net,
double-résa, trouvés). Drill trimestriel. Checkout : réassort + seuils +
photos avant/après (FULL/PILOTAGE). Score 1-5 + temps vs 3 h ; sans photos
(PILOTAGE) = alerte. Intermédiaire 7 j+ : 60 € (offert dès 14 j si
remplissage).

Moyen séjour (7-90 j, digital nomads / mission / relogement) : durée min
paramétrable par saison (creux 7 j, standard 2-3 j, pics 3-4 j) ; remise
dégressive affichée (7 j+ −10 %, 28 j+ −20 %, jamais sous plancher) ;
ménage intermédiaire inclus 14 j+ (60 € sinon) ; contrat + EDL complets
(même standard, pas de bail meublé déguisé <90 j sans cadre) ; charges
réelles au-delà de 28 j (relevé Linky, forfait €/j affiché d'avance).
Positionnement : remplissage creux hiver, jamais au détriment du
court-séjour haute saison (arbitrage prix affiché, validation 1-tap).

Hors saisonnière (refus ou orientation, jamais de bail déguisé) : bail
mobilité 1-10 mois (étudiant/mission, logement meublé, loyer encadré si
zone tendue — mandat dédié, pas le mandat LCD) ; relocation entreprises
(convention B2B, facturation mensuelle, pas de commission %) ; tournage /
shooting (forfait jour + EDL renforcé + assurance pro du client exigée,
jamais de tarif nuitée) ; au-delà de 90 j sans cadre = refusé.
Assurance annulation voyageur : proposée au tunnel direct (facultative,
assureur référencé, commission affichée), jamais imposée, jamais
condition d'accès ; OTA = leurs propres assurances, on ne duplique pas.

Extras : kit bienvenue OFFERT (~3-5 €, fixe) ; mini-bar soft PAYANT (8-10
refs, ~35 € stock, marge ~7-12 €/séjour ; alcool = licence à emporter
seule). Petit-déj 15 €/pers (HACCP : traiteur agréé OU pré-emballé DLC OK,
allergènes affichés + questionnaire, jamais de fait-maison sans agrément ;
chaîne du froid tracée, jamais de rupture). Late 14 h 40-60 €, early 12 h
30 €, aéroport 25-35 €, courses 25 € + tickets, bébé 30-45 €, plage 15-25 €,
petit-déj 15 €/pers, linge 15 €, consigne 15 €, déco 49 €. Potentiel
+250-400 €/mois à 60 % occ, extras calmes seuls (copro). Télétravail hors
saison : pack 20-30 €, visio +10 €.
Conciergerie = partenariats à commission seuls (VTC 20-30 %, voiture/vélo
15-20 %, chef 15 %, massage/baby 15-20 %, pressing 15 € + tickets,
resto/plage 10 % côté pro, excursions 10-15 %).
Grille prestas affichée (révisée 1x/an, indexée, jamais d'oral) : ménage
3 h + linge, dépannage (forfait déplacement + /h par métier), astreinte
nuit/week-end ; devis >200 € systématique, validation 1-tap ; temps
pointé = temps facturé (PWA), écart >20 % = 409 + revue.
Accueil physique option 25-30 € (FULL/PILOTAGE, jamais systématique) :
presta assuré de la zone, créneau 30 min (remise clés + tour logement +
consignes tri), photo horodatée = preuve, commandé d'avance (cut-off J-1
18h), annulation <24 h = dû. Hors créneau = boîte à clés / Nuki, jamais
d'attente improvisée.
Jamais : accueil systématique, alcool sans licence, fêtes,
transport/garde direct, fonds sans séquestre. Potentiel +150-250 €/mois.

Seniors / PMR (option, jamais promis sans visite) : visite = checklist
accessibilité (plain-pied ou ascenseur, douche vs baignoire, seuils <2 cm,
lit ≥140 cm ferme, WC surélevé si besoin, éclairage nuit, barres si
posées). Si compatible : mention annonce « adapté PMR partiel : … »
(détail exact, jamais « accessible » seul), voix satellite proposée,
accueil physique recommandé. Si incompatible : on le dit au prospect,
jamais de réservation senior forcée.

Spa gonflable / jacuzzi : refusé en copro (eau + élec + bruit + assurance,
jamais négociable) ; si villa : conditions (local technique hors d'eau,
traitement eau tracé anti-légionellose, EDL renforcé, assurance étendue,
forfait entretien affiché) + validation 1-tap, jamais d'installation
sauvage.
Communication de crise (avis assassin / bad buzz / presse) : 1 réponse
factuelle max (jamais d'émotion, jamais 2 rounds), gel des réponses auto
(humain seul), presse = super_admin seul (jamais de nom client, jamais de
chiffre) ; dossier preuves en parallèle (EDL + messages + factures).

Pilotage revenus : trou 1-2 nuits −20 % (jamais sous plancher) ; creux
J+30 <30 % = 1 nuit min ; pics = 3-4 nuits + sam/mer. Flex pivot (J-7) /
non-remb −10 % / flex+ +15 % pics. Late <2 h gratuit si pas de rotation
sinon 50 % d'avance. Retour direct J+30/J+180 si 4★+ (−10 % code perso).
Animaux 25-35 € si copro OK + caution majorée.

Politique d'annulation (affichée avant paiement, identique OTA + direct) :
flex = pivot, annulation J-7 remboursée −10 % frais ; standard = J-14
remboursée −1 nuit ; non-remb = −10 % à la résa, 0 remboursé. No-show =
dû intégral, EDL non fait = caution tenue 48 h. Remboursement sous 7 j
sur le moyen d'origine, jamais d'avoir imposé. Litige = dossier preuves
+ médiation plateforme d'abord, jamais de débit sans justificatifs.
Occupants : capacité max affichée = ferme (personne sup refusée si non
déclarée, facturée au tarif affiché si annoncée) ; sous-location interdite
(clause + contrôle EDL, résiliation pour manquement grave) ; perte clés =
forfait 80-150 € (serrurier + EDL, jamais d'oral).
Cession de séjour (voyageur → tiers) : autorisée si identités du
cessionnaire au J-2 (questionnaire + fiche de police refaite, validation
1-tap, jamais de frais cachés) ; refusée si capacité dépassée ou profil
incompatible copro (animaux, fêtes) ; jamais de sous-location déguisée
(prix identique, contrat initial maintenu + avenant).
Tabac / odeurs : intérieur strictement non-fumeur (balcon si copro OK,
jamais de mégots au sol) ; Minut = preuve (dB + tabac, jamais d'audio) ;
frais de remise en état sur justificatifs seuls (blanchisserie +
désodorisation, jamais d'amende forfaitaire) ; mention annonce +
règlement + questionnaire J-2.
ANCV / chèques-vacances (direct seul, option par logement) : convention
+ commission ~2,5 % + remboursement 2-4 sem ; jamais imposé au client,
jamais sur OTA ; provisionné au relevé (ligne dédiée).
Labels (jamais bloquants, par logement) : Clé Verte (argument copro +
mairie, audit ~500 €/an), Gîtes de France / Clévacances (confiance FR,
commission/adhésion affichée), GreenGo (écoresponsable, 0 €) ; 1 label
min/logement à 10 logements.
Cartes cadeaux / coffrets (Wonderbox & co) : refusés (tiers payeur opaque,
commission 20-30 %, dates imposées, avis non maîtrisés) ; alternative =
carte cadeau maison (montant libre, valable 12 mois, direct seul,
remboursable jamais d'avoir imposé).

Arrivée autonome standard (FULL/PILOTAGE/KIT) : consigne envoyée J-2
(PIN/fenêtre + code boîte + photo porte + parking + poubelles) ; fallback
= clé physique Master Lock (code tournant, changé par séjour) ; preuve =
1re ouverture logguée (Nuki) ou photo EDL <2 h (boîte) ; retard >30 min =
pré-chauffe décalée + message ; sans nouvelles J+1 12h = appel + visite
si silence 24 h (sécurité, pas surveillance).

Fidélité + parrainage + apporteurs : retour direct −10 % (J+30/J+180 si
4★+) ; parrainage = 100 € au parrain (avoir ou virement) + entrée −50 €
au filleul, versés après 3 mois mandat actif ; apporteurs (agences,
notaires, syndics) = 1 mois de commission FULL ou 150 € PILOTAGE/KIT,
après signature + go-live, convention écrite, jamais d'espèces.
Benchmark : 10 appels mystères initiaux (grille : commission, abo, entrée,
ménage, SLA, avis Google ≥4,5) puis 5/an ; tableau comparatif revu
trimestriel, jamais de prix copié (positionnement milieu-premium assumé).

Maintenance préventive + consommables (FULL : inclus pilotage, pièces au
réel ; PILOTAGE : plan fourni, exécution devis ; KIT : plan + doc) :
trimestriel = détecteurs + piles + joints + filtres + flexible + siphons ;
annuel = DPE veille + chauffe-eau + clim + serrure + extincteur +
VMC + toiture/copro signalée au syndic. Stocks seuils (kit, linge, ampoules,
piles, produits) + inventaire annuel QR. Boucle qualité : score ménage +
avis + incidents → revue mensuelle (top 3 causes → standard MAJ → batterie
si logicielle) ; post-mortem écrit si récidive ou coût >200 €.

Feu / barbecue / cheminée : interdits sauf équipement dédié validé à la
visite (barbecue gaz fixe + extincteur + distance façade, jamais de
charbon sur balcon copro) ; détecteurs fumée + CO + extincteur vérifiés
trimestriellement, plan d'évacuation affiché (sortie + extincteur +
coupure gaz/élec), mention règlement + annonce. Feu = P1 (évacuation
d'abord, 112, jamais de remise en location sans expertise).
Nuisibles (punaises N°1) : housses anti-punaises dès l'équipement +
inspection lampe UV à chaque intermédiaire 14 j+ ; signalement = P1
(désinsectisation 200-400 € sous 48 h, relogement à nos frais, geste,
linge à 60 °C + housse neuve, avis géré humain seul) ; coût = charge
exploitation (FULL) ou refacturé si faute voyageur prouvée (photos EDL).
Décès voyageur (P1, protocole affiché runbook) : ne rien toucher, 15/112,
prévenir famille via plateforme (jamais de contact direct sans accord
autorités), gel du logement (pas de remise en location sans mainlevée),
dossier assureur + protection juridique ; accompagnement humain, jamais
de communication publique.
Canicule / plan chaleur (>35 °C) : volets fermés inter-séjours, clim
bridée 26 °C min (jamais coupée en occupé), consigne hydratation au
message J-1, ventilateur de secours en stock ; pic conso suivi (ZLinky),
jamais de coupure à distance en occupé.
Vols : retard >30 min = pré-chauffe décalée + message. Carnet tranquillité
/trimestre (bruit + 22h-8h + interventions = anti-litige syndic). Budget
vitrine ~1 100-1 200 € + capteurs → amorti ~3-4 mois à 60 % occ.

Acompte / solde direct (Stripe/Swikly, jamais d'oral) : acompte 25-30 %
à la résa, solde J-30 auto (relance J-35/J-32, défaut = annulation +
remise en vente, jamais de séjour sans solde) ; OTA = leurs échéanciers,
on ne duplique pas. Remboursement sous 7 j sur le moyen d'origine.
Événements Côte d'Azur (calendrier annuel, revu en janvier) : Festival
Cannes ×3-5, Grand Prix Monaco ×3-4, Carnaval Nice ×2, été ×1,5-2 ; min-stay events
4-7 j, jamais sous plancher, validation 1-tap ; hors events = remplissage
classique. Linge : dotation 3 jeux/logement, blanchisserie externe (devis
annuel, RABC ou équivalent affiché) vs interne (lave-linge + sèche-linge,
coût/eau/élec suivi) — arbitrage chiffré à l'onboarding, jamais d'oral.
Home staging / shooting (option onboarding 150-300 €) : mise en valeur +
photos pro + titres/descriptions SEO par langue ; refonte si note <4,7
(photos <12 mois, jamais de photos trompeuses L.121-1).
Acquisition directe (objectif : part direct >30 % à 10 logements) :
fiche Google Business par logement + lien avis post-séjour (J+30/J+180
−10 % direct) + site vitrine + UTM `?src=` tracé ; jamais d'achat de
faux avis, jamais de double saisie calendrier (ICS ou stop-sell).

Avis ≥4,8 : enquête privée J+1 (≥4★ = lien public, <4★ = rattrapage +
geste, humain si >20 €), pré-réponse IA 1-tap, livret vidéo QR, trouvés
(photo + 15 € envoi), boutons Arrivée/Départ/Nuit calme.

Pilotage mensuel : RevPAR, prix moyen, occupation, marge/séjour,
CA extras/séjour, 12 mois + N-1. Rapprochement CSV (alerte >2 %),
maintenance calendaire, incidents + post-mortem si récidive. Conformité :
contrat PWA, RC expiry auto, Factur-X B2B.

## §L5 Anti-dispersion

1 pack par forfait. On change : ids, adresse, commune/copro, tarifs,
prestas zone, langues. Pas de code spécifique par client. Pas de 2e zone
FULL sans ≥2 prestas/métier. Hors zone = 2e choix + surcoût, jamais auto
sans validation.

## Annexe L-A — État réel (2026-10-13)

Lab log1/log2 : bancs d'essai, batterie verte alimentation + supervision.
Reste vitrine : relance syndic écrite, Cerfa + n°, SIRET LMNP, portail
taxe, assurance + DPE + détecteurs, règlement + affichage taxe, mise en
ligne, partenariats RC vérifiée, Minut + CO2 + clé, boucle avis + contrat
PWA + carnet, runbook + drill.
