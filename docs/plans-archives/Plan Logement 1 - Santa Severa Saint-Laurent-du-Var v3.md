# Plan Logement 1 — Santa Severa Saint-Laurent-du-Var (v3 zéro-défaut)
## Logement vitrine + gabarit duplicable SaaS conciergerie

Date MAJ : 13 octobre 2026 (v3 réécrite à neuf — système cible. v1 du 05/10/2026 et v2 SaaS conservées intactes)
Statut : ce document décrit le système cible comme un tout cohérent. Le déjà-construit est en Annexe A.

Sommaire :
- §0 Logement vitrine
- §1 Pack box par forfait
- §2 Onboarding 7 étapes
- §3 Exploitation
- §4 Règle anti-dispersion
- Annexe A État réel

---

### §0. Logement vitrine — Santa Severa

Log1 Santa Severa = logement pilote réel + vitrine commerciale + banc d'essai.
Ce qui y est validé devient le standard appliqué à chaque client tiers.
Rien n'est vendu avant d'avoir tourné sur log1.

**Bien.**
- T2, 65 m², 4-5 pax, Résidence Santa Severa, avenue Louis Ravet, Saint-Laurent-du-Var.
- Adresse exacte : fichier privé `docs/log1/infos-adresse.md`, hors git. Jamais dans une annonce ni dans un doc client.
- Atouts : résidence urbaine classique, Intermarché à côté, ~3 km aéroport Nice-Côte d'Azur, vue mer (pas pied d'eau).
- Usage : location meublée courte durée, appartement entier (Airbnb / Booking / Abritel / Leboncoin).
- Mention annonce obligatoire : proximité Intermarché + ~3 km aéroport + phrase transparence : « avions inaudibles à l'intérieur en pratique ; sous certaines conditions météo, passage lointain perceptible ».

**Copro — autorise le meublé entier.**
- Source : règlement reçu, page 17, 3e partie. Articles 8 et 9.
- Art. 8 : immeuble à usage d'habitation et profession libérale.
- Art. 9-1 occupation bourgeoise : « la location en meublé d'appartements entiers est autorisée. En revanche, la transformation en chambres meublées louées à des personnes distinctes est interdite. »
- Obligation tranquillité + interdiction animaux malfaisants / malodorants / malpropres / criards.
- Donc : appartement entier OK. Interdits : découpe à la chambre, coloc à la chambre, chambres d'hôtes dans l'appart.
- Condition : règlement intérieur strict, pas de fêtes, horaires, pas d'occupants non déclarés.
- Syndic : relance écrite exigée « pas d'interdiction / pas de clause habitation exclusive / pas de vote AG contraire », + dernière version règlement + PV d'AG éventuels (loi Le Meur : interdiction votable à la majorité simple).
- Standard client : refuser tout logement dont le règlement interdit la saisonnière. Vérif règlement + PV d'AG à chaque visite.

**Mairie + séjour max.**
- Cerfa 14004*04 déposé en mairie de Saint-Laurent-du-Var. Récépissé + n° de déclaration obligatoires sur toutes les annonces.
- Sans n° : les plateformes doivent dépublier. Pas de go-live sans n°.
- Résidence principale : 120 j/an max (vérifier si 90 j votés Métropole). Résidence secondaire : vérifier PLU + changement d'usage / quota / compensation Métropole Nice Côte d'Azur.
- Registre national (loi 19/11/2024) : bascule dès mise en service 2026, veille active.
- Standard client : refaire Cerfa + PLU + quota dans SA commune. 1 dossier conformité par logement.

**SIRET / fiscalité.**
- LMNP via Guichet INPI/INSEE. SIRET vérifié à l'onboarding, pas de pilotage de CA sans existence légale.
- Micro-BIC vs réel : Le Meur = non classé 30 % dans limite 15 000 € ; classé / chambres d'hôtes 50 % dans limite 77 700 €.
- Classement 1-5* via Office de Tourisme : non obligatoire, proposé en option (levier fiscal).

**Taxe de séjour.**
- Saint-Laurent-du-Var ∈ Métropole Nice Côte d'Azur. Taxe au réel toute l'année + parts département 06 + régionale (taux à confirmer mairie / portail Métropole).
- Airbnb / Booking / Expedia / Vrbo collectent et reversent direct 2x/an quand intermédiaires de paiement. Ne jamais reverser 2 fois.
- Reste à faire : compte portail taxe Métropole par client/logement, déclaration périodique (collectée OTA = 0 € à reverser), reversement direct uniquement nuits directes / Leboncoin sans paiement, conservation factures + attestations + registre logeur, affichage tarifs dans logement.
- Fonds tagués par logement (Stripe / Swikly). FULL = on gère. PILOTAGE/KIT = on crée puis on forme.

**DPE + sécurité (loi Le Meur).**
- DPE obligatoire affiché sur annonces, trajectoire perf minimale jusqu'en 2034.
- Détecteurs fumée + diagnostics élec/gaz si besoin + assurance habitation spéciale saisonnière + décence/sécurité.
- Pas d'install box si DPE / détecteurs / assurance manquants. Prérequis, pas option.

**Annonces — standard.**
- Mentions : n° déclaration + classement éventuel + DPE + taxe incluse/distincte selon canal + règlement intérieur.
- Objectif : Superhost, note ≥ 4,8, taux réponse ≥ 90 %. Alerte + plan rattrapage sous seuils.

**Clients tiers visés.**
- Côte d'Azur : Saint-Laurent-du-Var, Nice ouest, Sophia Antipolis. T2-T3 meublés en copro classique.
- Proprio qui ne veut pas gérer : calendriers, pricing, messages, ménage, extras, conformité.
- Exclus : hôtellerie, découpe chambre, fêtes, animaux contraires copro.

---

### §1. Pack box par forfait

1 seul pack par forfait. Écart = devis séparé, jamais gratuit.
Délai standard : ½ journée de pose, J+7 après visite si pack en stock.
Tout le matériel = propriété du client après paiement. FULL/PILOTAGE : reprise box si résiliation < 12 mois, au choix client.
Chaque box = `box_id` / `logement_id` + entrée registre (adresse, commune, proprio, forfait, prestas zone, dates install/go-live). Sans entrée registre = pas de support.

| Forfait | Pack | Prix client | Supervision |
|---|---|---|---|
| FULL-SERVICE 25 % brut | Pack complet : mini-PC + serrure Nuki + Minut + 2 sondes CO2 + clé secours + clayette mini-bar + QR + kit bienvenue + stocks initiaux + runbook papier | Entrée 290 € (pose + mise en route ; box offerte si 12 mois) + 25 % brut HT + ménage 110 € refacturé voyageur ; plancher 149 €/mois ; 22 % dès 3 lots | Complète : calendriers, pricing, messages, dispatch, contrôle ménage, compta, taxe, astreinte |
| PILOTAGE 149 €/mois | Box légère : mini-PC + Nuki + 1 sonde CO2 + QR + runbook (sans Minut, sans mini-bar) | Matériel ~640 € + mise en route 190 € + 149 €/logement/mois (129 € dès 3 lots) | Pilotage seul : todos + contrôle photos/score, pas de dispatch ménage |
| KIT 890 € + 240 €/an | Box + doc : mini-PC + Nuki + QR + guide autonome + formation 1 h | 890 € posé + maintenance 240 €/an | Aucune. Intervention à la demande, facturée hors maintenance |

Base coût constatée 2025-2026 : mini-PC ~180 €, Nuki ~280 €, Minut ~150 €, sondes/QR/stocks ~100 €, main d'œuvre ½ j.
Logement > T3, 2e serrure, câblage spécifique = devis.

**Fonctions communes (cible).**
- Booking-direct : questionnaire pré-arrivée J-2 (lien PWA + PIN, 3 min : arrivée + préférences + extras + contrat), cut-off J-1 18h, rappel J-1 15h. Sans réponse = kit standard + consignes défaut, accès jamais bloqué.
- Paiement extras d'avance : Stripe Payment Link / Swikly tagué par logement. Rien d'improvisé sur place.
- Guide PWA multilingue : socle FR/EN/ES/IT/DE validé humain + maternelle auto, sélecteur visible, fallback EN + badge traduction auto. 20 phrases critiques = contrôle humain 1-tap.
- Contrat voyageur signé PWA 30 s (PDF horodaté). Mémoire voyageur opt-in 1-tap, révocable, purge 24 mois, jamais visible prestas.
- Lien supervision FULL/PILOTAGE : paire WireGuard box ↔ supervision. KIT : pas de lien permanent.

---

### §2. Onboarding 7 étapes — identique pour chaque client

1. Visite (45 min).
- [ ] Règlement copro + PV d'AG : saisonnière autorisée ? Sinon stop.
- [ ] DPE / détecteurs / diagnostics / assurance : OK ? Sinon prérequis devis.
- [ ] Logement extras-compatible : frigo, place kits, bruit, serrure compatible Nuki.
- [ ] Zone prestas : ≥ 2 actifs par métier critique (plomberie, élec, serrurerie, ménage) à ~10 km. Sinon alerte, pas de FULL.
- [ ] Photos avant + mesures + commerces locaux (courses, petit-déj).

2. Contrat.
- [ ] FULL/PILOTAGE : mandat écrit de gestion saisonnière + CGV. KIT : bon de vente + maintenance.
- [ ] RC pro conciergerie à jour côté nous. RC pro prestas vérifiée + expiry suivie (dispatch bloqué si expirée).
- [ ] Fonds : Stripe / Swikly tagué par logement. Transport / garde enfants = prestas assurés uniquement, jamais direct.
- [ ] Forfait + prix actés. Rôles : proprio = que SES logements (Planning/Prix/Finances), jamais les autres clients ni le système. 1 compte nominatif/personne, 2FA admin/gestionnaire, révocation auto fin mission/résiliation.

3. Pack.
- [ ] Box préparée (même image que vitrine). `box_id` / `logement_id` créés au registre.
- [ ] Tarifs + extras du client saisis. Prestas de zone rattachés. Langues activées.
- [ ] Règlement intérieur adapté à SA copro. Fiche prix mini-bar imprimée.

4. Install (½ journée).
- [ ] Pose box + Minut (FULL) + CO2 + clé secours. Clayette mini-bar + QR + fiche prix.
- [ ] Kit bienvenue + stocks initiaux. Runbook 2 pages plastifié dans logement. Photos install.

5. Config.
- [ ] Paire WireGuard + entrée registre (FULL/PILOTAGE). KIT = à la demande.
- [ ] Calendriers OTA connectés. Questionnaire J-2 + paiement tagué logement. PWA aux couleurs du logement.

6. Conformité.
- [ ] Cerfa mairie déposé + n° récupéré. Compte portail taxe créé. SIRET/LMNP vérifié.
- [ ] Assurance saisonnière vérifiée. DPE/détecteurs OK. Affichage taxe dans logement.

7. Go-live.
- [ ] N° déclaration + DPE sur toutes les annonces. 1 résa test bout en bout : questionnaire → paiement extra → todo ménage → enquête J+1.
- [ ] Drill ménage 3 h. Remise doc au proprio. Date go-live au registre.
- [ ] Jalon : pas de 2e client FULL avant 1 mois de pilotage vitrine sans incident copro.

---

### §3. Exploitation — standard cible

**Ménage — runbook 3 h.**
- Rotation standard 6 étapes + page incidents (fuite, bruit, serrure HS, internet, double-résa, objets trouvés). Drill 1x/trimestre.
- Checklist checkout : réassort kit + mini-bar + seuils stock, photos avant/après exigées FULL/PILOTAGE.
- Score ménage 1-5 + temps vs 3 h. Sans photos (PILOTAGE) = alerte qualité.
- Ménage intermédiaire séjours 7 j+ : 60 € (offert dès 14 j si remplissage), date certaine selon préférences mémorisées (fréquence + heure + pendant absence si possible).

**Extras — catalogue cible.**
- Kit bienvenue OFFERT chaque séjour (~3-5 €) : eau 1,5 L + 2 cocas + café/thé + biscuits + chips + chocolat + spécialité locale. Fixe, identique. Au-delà = bascule mini-bar payant. Voyageur reconnu = ajusté goûts mémorisés sans surcoût gestion.
- Mini-bar honnêteté PAYANT soft-only (pas de licence) : 8-10 refs (~35 € stock), eau 2 €, soda 3 €, jus bio 3,50 €, chips 3 €, biscuits 3,50 €, chocolat 3,50 €, dosettes 1 €/u, kit apéro soft 12 €. Marge ~7-12 €/séjour. Alcool uniquement après petite licence à emporter.
- Tableau prix cible (ajuster par logement) : late checkout 14 h 40-60 €, early check-in 12 h 30 €, transfert aéroport 25-35 €, courses 25 € + tickets, kit bébé 30-45 €, kit plage 15-25 €, petit-déj 15 €/pers, linge sup 15 €/pers, consigne 15 €, déco 49 €.
- Potentiel : +250-400 €/mois à 60 % occ. Extras calmes uniquement (copro).
- Télétravail (hors saison, 0 bruit) : pack 20-30 € (2e écran + clavier/souris + chaise pliante + lampe, stock ~150 €), visio silencieuse +10 €, impression 1 €/page, day pass cowork en commission 10-15 %.
- Conciergerie séjour = que du partenariat à commission, 0 min ménage : accueil option 25-30 €, VTC 20-30 %, voiture/vélo 15-20 %, chef/panier 15 %, massage 15-20 %, babysitting 15-20 %, pressing 15 € + tickets, resto/plage 10 % côté pro, excursions 10-15 %.
- Ne jamais faire : accueil systématique, alcool sans licence, fêtes, transport/garde direct, fonds sans séquestre tagué.
- Potentiel conciergerie : +150-250 €/mois/logement.

**Pilotage revenus.**
- Trou 1-2 nuits : −20 % auto jamais sous plancher + push last-minute. Creux occ J+30 < 30 % : 1 nuit min. Pics : 3-4 nuits min + arrivées sam/mer.
- Flex pivot (annulation J-7) / non-remboursable −10 % d'avance / flex+ +15 % pics. Late < 2 h gratuit si pas de rotation, sinon 50 % nuitée d'avance.
- Retour direct J+30 / J+180 si 4★+ : −10 % code perso. Animaux 25-35 € si copro OK + caution majorée.

**Fiabilisation.**
- Minut (dB seuls, pas d'audio, RGPD) ~150 € : preuve fête/tabac. CO2 SDB + chambre ~35 € : moisissure + aération. Clé secours ~30 €.
- Suivi vol : retard > 30 min = pré-chauffe décalée + message. Carnet preuve tranquillité / trimestre : logs bruit + messages 22h-8h + interventions (arme anti-litige syndic).
- Budget vitrine : box ~1 100-1 200 € + Minut + CO2 + clé + kit 4 €/séjour + stock 35 € → amorti ~3-4 mois à 60 % occ.

**Avis — objectif ≥ 4,8.**
- Enquête privée J+1 : ≥ 4★ = lien avis public, < 4★ = rattrapage privé + geste (validation humaine si > 20 €).
- Pré-réponse IA 1-tap à chaque avis, livret vidéo 30 s par QR, objets trouvés (photo + 15 € envoi), boutons 1-tap Arrivée/Départ/Nuit calme.

**Pilotage mensuel.**
- RevPAR, prix moyen, occupation, marge nette/séjour, CA extras/séjour, courbes 12 mois + N-1.
- Rapprochement bancaire CSV (alerte > 2 %), maintenance calendaire (hotte, clim, DAAF, VMC), registre incidents + post-mortem si récidive.
- Conformité : contrat PWA, RC pro expiry auto, Factur-X B2B.

---

### §4. Règle anti-dispersion

- 1 pack par forfait. On change uniquement : `box_id`/`logement_id`, adresse, commune/copro, tarifs, prestas zone, langues.
- Pas de code spécifique par client. Écart au pack = devis séparé, jamais gratuit.
- Pas de 2e zone FULL sans ≥ 2 prestas par métier critique. Hors zone = 2e choix + surcoût déplacement, jamais auto sans validation.
- Vente uniquement sur les 3 forfaits §1. Anciens % v1 (15/20-25/30 %) ne sont plus vendus.

---

### Annexe A. État réel — déjà-construit (informatif, pas la cible)

- Lab log1/log2 : bancs d'essai existants, box de référence log1 en service. Batterie verte : alimentation + connectivité supervision OK au 13/10/2026.
- Reste vitrine à finir (v1 §11) : relance syndic écrite, Cerfa + n° déclaration, SIRET LMNP, compte portail taxe Métropole, assurance + DPE + détecteurs, règlement intérieur + affichage taxe, mise en ligne avec n°, partenariats commission RC pro vérifiée, Minut + CO2 + clé, boucle avis + contrat PWA + carnet tranquillité, runbook imprimé + drill.
- V2 SaaS (312 lignes) = base de travail reprise ici en standard cible. V1 originale (211 lignes) conservée intacte.
- Points à trancher : zone max km + surcoût hors zone, seuil embauche (3 ou 5 FULL).

---
*Document de travail — informatif, pas un avis juridique. Confirmer avec Mairie Saint-Laurent-du-Var, Métropole Nice Côte d'Azur, syndic. Adresse exacte en docs/log1/ privé.*
