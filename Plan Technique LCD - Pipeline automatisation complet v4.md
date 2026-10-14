# Cahier Technique — Pipeline automatisation v4

> Statut : figé le 2026-10-13. Référence : socle commun v1 (`§S*`).
> Forfaits, archi, tenant, hébergement, intangibles, bornes = socle.
> Ici = box, moteurs, flags, pricing, synchro, voix/IA, front, juridique.
> Sobre, normatif, sans code.

## §T1 Socle box : 1 HA par site + central mutualisé

1 box HA par logement, autonome offline-first (PIN, guide, scénarios sans
WAN, test offline 2 h exigible par phase). 1 central mutualisé chez l'hôte
(Proxmox existant, 0 € hardware) : moteurs + proxy LLM + UI routage.
WireGuard seul, jamais d'expo WAN box. Sites dispersés = jamais un HA pour
2 LAN distants.

FULL (log1) : mini-PC N100 16 Go + SLZB-06p7 PoE/Ethernet (jamais WiFi) +
ZBT-2 Thread (Nuki Matter) + onduleur NUT + Nuki Go + Keypad 2.0 + Hub
ESP32 (codes MQTT) + KeyMaster (slots 1-10) + fumée certifiés + fuite +
bras vanne <2 s (réarmement manuel) + bruit 3 niveaux + NodOn/ZLinky/
Shelly/prises Nous + RM4 clim IR local. Constaté : Phase 0 ~1 100-1 200 €,
complet ~2 050-2 150 €. 3 paniers (EU garantie + 2× Chine <150 €, CE).

Light (log2) : HA Green ou RPi4 + SLZB + onduleur + boîte à clés (~650-750
€). Pas de Nuki/ZBT-2/voix/RM4 inutile. Migration FULL = pack + flip
`smart_lock: true`, 0 automation réécrite. Même socle logiciel, branches
off sautées.

Moteurs stdlib 0 € (ports 8090-8100) : `ics-sync` :8090 (pull OTA 15 min,
anti-double-résa, stop-sell) ; `pricing` :8091 (pivot × K_saison×K_events×
K_we×K_occ×K_duree×K_lastmin) ; `decision-engine` :8092 (règles + jugements) ;
`facturation` :8093 (Factur-X B2B / PDF B2C) ; `caution` :8094 (holds,
jamais dans le prix) ; `booking-direct` :8095 (`POST /resa`, `PUT /prix`,
`GET /dispo`, QloApps transitoire → maison par flag) ; `dispatch` :8096
(score prix×note×dispo×délai, zone + RC) ; `inventaire` :8097 (QR/NFC) ;
`extras` :8098 ; `stocks` :8099 (Grocy seuils) ; `compta` :8100
(rapprochement, exports). Transverses : `:4000` proxy, `:8050` routage,
`:8060` supervision, `:8443` plane. Tous lisent `logement_id` +
`entite_id`, jamais d'ID en dur.

Feature-flags logX (règle d'or) : 1 feature = 1 flag `logements.yaml` + 1
dossier + 1 dashboard (`visibility:`). Héritage `global` → `logX`. Flags :
`smart_lock, portail, chauffage_fp, clim_ir, ecs_pilotee, vanne_eau, bruit,
incendie, alarme_intrusion, voix, voix_satellite, geoloc_voyageur,
assistance_voyageur, etat_lieux_auto, traca_intervenants, inventaire_biens,
events_auto, sinistre_auto, annuaire_presta, concurrence_suivi, compta_auto,
extras_upsell, memoire_voyageur, moteur_direct`. Decision-engine +
dashboards + watchdog sautent les branches off. Kill-switch global
`jev_enabled`. Ajouter log3 = 5 lignes. Forfait = flag par logement
(branches full/pilotage/kit, jamais de fork, jamais de promesse rendement).

Arborescence : repo template public (code + `*.example` + `docs/templates`)
; privé chiffré par client (branding, logements, secrets, `docs/logN`,
backups) ; runtime `/config` non versionné + `decision.logX.jsonl` tagué
`{entite_id, client_tiers_ref, marque, rôle}`. Nommage `logX_objet_fonction`,
dates `AAAA-MM-JJ`. `config_ok` rouge si copro non vérifiée = mise en
ligne bloquée. Bornes en code, reco 1-tap, jamais PIN par modèle, jamais
d'amende, incendie prioritaire, PIN 4 derniers + excludes, backups
quotidien + hebdo chiffrée + restore trimestriel.

## §T2 Multi-tenant natif

Clés : `entite_id` (facturant) + `client_tiers_ref` (vide = vitrine) +
`forfait` par logement. Moteurs, factu, dashboards, plane filtrent ce
triplet. Aucune compta mutualisée, aucun dashboard croisé, support
multi-marques par tag.

Login par rôle → dashboard plugin (§S3.1) : super_admin/admin (vous
seuls, secrets = super seul + « voir comme » §S3.3), opérateur (logX
opérés, pas `/systeme`/secrets), comptable (Finances + exports seuls),
client tiers (ses logX : Planning/Prix/Finances/Incidents lecture),
presta (mission/fenêtre : PWA + pointage + photos + facture), voyageur
(PWA séjour, session révoquée + purge), commercial (prospects/simulateur/
offres seuls). Source `acces.yaml` (1 entrée/personne : rôle, sous-rôle,
logements, expiry). Onboarding auto à la signature + révocation auto.
Journal qui/quand/quoi 90 j, forçage = motif loggué.

Marque blanche jour 1 : tout vient de `branding.yaml` (marque, logo,
couleurs, domaine, contacts, mentions, langues). PWA thémée, messages
signés `{{ marque }}`, QR génériques, docs templates. Changer de client =
1 fichier + logos, 0 code.

Wizard copro par client (bloquant) : photo règlement + accord syndic +
heures calmes + animaux + occupants max → `docs/logN/copro/`. Tant que
`copro.verifiee: false` → mise en ligne BLOQUÉE. Propagation auto
(règlement 5 langues + CGV + annonces + J-1 + PWA). `usage interdit` =
logement désactivé. Modif copro = MAJ YAML + régénération datée. Bruit 3
niveaux + Alarmo + EDL photo = preuves.

## §T3 Pricing + synchro par tenant

Prix = `clamp(pivot × K_*, min, max)` par logement. Recalcul 1×/j + par
résa, log ancien→nouveau. Capteurs `prix_nuit` + `prix_canal_*` (+bornes,
K_*). Direct = écriture auto ; OTA = reco 1-tap, jamais auto. Graphe 30 j
+ occupation J+30.

Canal : `arrondi(pivot / (1 − commission) + fixes)`, clampé. Défauts :
direct 0 %, Airbnb 15 %, Booking 17 %, Abritel 10 % (vérifier Extranet par
client). Caution hors prix. Ménage/linge/taxe au facial seuls si déclarés
avant résa et payés plateforme. Remises = critères objectifs affichés.
Jamais de discrimination. Hors bornes = humain + motif.

Modes (1 select) : `remplissage_max` / `equilibre` (défaut) / `revenu_max`.
Règlent pricing + last-minute + durée min + énergie + dispatch +
concurrence. Bascule 1-tap logguée. `mode_auto_saison` = proposition au
digest, validation 1-tap. Tradeoff affiché, plancher protège la marge.

Revenus : gap-night −20 % (jamais sous plancher) + push ; séjour min
dynamique (creux 1 nuit, pics 3-4 sam/mer) ; flex pivot (J-7) / non-remb
−10 % / flex+ +15 % pics ; late/early (<2 h gratuit si pas de rotation,
sinon 50 % d'avance) ; CRM retour J+30/J+180 si 4★+ (−10 % direct) ;
objectif −15 % dépendance OTA / 12 mois ; animaux 25-35 € si copro OK ;
Superhost watch (<4,8 / <90 % / annulation → alerte + rattrapage).

Synchro : ICS pull 15 min par logement, jamais partagé entre clients.
Fusion direct <60 s + OTA, anti-double-résa + stop-sell same-day.
Chevauchement = critique + blocage sortant + relogement. Events auto
(fériés + vacances A/B/C+UK/DE/IT + ICS local Cannes/GP/Carnaval/Ironman/
Jazz/matchs/congrès). Concurrence : relevé manuel trimestriel 5 annonces,
±10 % 1-tap. Jamais de scraping auto (ban + données faussées).
Simulateur = closing + révision annuelle (bornes + J+30 réelles, jamais
de promesse).

## §T4 Voix + LLM/Jev (coûts par tenant)

BYOD strict (smartphone voyageur, aucun téléphone laissé). QR/PWA →
consentement → STT téléphone → `:4000` → TTS téléphone. Texte seul en API
(jamais d'audio), session = séjour, révocation checkout. Scripts bornés
(FAQ, WiFi, horaires, tri/départ, clim). Jamais : codes, KeyMaster,
portail, vanne, alarme OFF, caméras (aucune dedans). Satellites S3-BOX-3
+ Atom (+75 €) si `voix_satellite` (PMR/premium). Sans WAN : 3 questions
<5 s via sentences offline.

Proxy unique `:4000` (LiteLLM, aliases `lcd-chat-*`). Fallbacks + retry 1
+ cooldown 30 s + local/Ollama + sentences. WAN down >2 min → force local.
UI `:8050` (LAN/WG seuls) : primaire + fallbacks par usage, bouton Tester
(`test_ui`, n'écrit rien). `routing.json` versionné + reload à chaud.
Pivot : gateway apportée par l'hôte (flash/strong/Jev). Historique Groq/
Mistral/TypeSafe = spec inchangée.

Jev consultatif : `Choice` (routage), `Score` (gravité), `Noul`
(urgence/garde-fou). Tri bruit, dispatch proposé (validation humaine),
garde-fous prix/messages, arbitrage pré-chauffe/prix, no-show/surconso/
litige. `noul>0,8 + confidence>0,75` → action bornée, sinon dashboard.
Jamais d'effet de bord direct. `cache_ttl: 0` sur `lcd-jev-*`,
kill-switch. Chaque décision loggue fournisseur+modèle+endpoint+étage+
confidence+tokens+latence.

Compteurs : `llm_cout_mois` + `jev_cout_mois` ventilés `{logement, usage}`
→ ligne « IA/voix » tenant. Ordre : ~1-3 €/mois/logement UE + ~0,1 € Jev,
0 € strict. Alerte >5 €. FULL incluse jusqu'au seuil puis réel ;
PILOTAGE/KIT dès le 1er token. Kill-switch par entité.

RGPD : texte seul TLS, opt-in par échange/séjour révocable, géoloc OFF
défaut (1×/séjour, 2 zones, jamais fond), jamais d'ouverture auto,
révocation checkout. Logs 90 j (texte + zone), audio 0 j, voyageurs
24 mois / présence 90 j. 100 % local possible. Mentions guide + règlement
+ QR consentement.

## §T5 Front web/ (8 dashboards plugins, §S3)

App `web/` Next.js (build + lint verts) derrière `:8443`. 5 langues +
maternelle auto (glossaire + badge). PWA (offline guide + QR fallback),
sans-JS OK lecture. Thème par marque (dark/light, mobile-first, a11y).
0 nom de stack côté voyageur/presta. Hôte FR, ménage FR + pictos, guest =
langue résa. Budgets front (mesurés en CI, build bloqué si dépassés) :
LCP <2,5 s, JS <200 Ko/page, PWA offline <1 s, images <150 Ko (AVIF/WebP).
Charge par box (N100 cible) : 1 box = 1-3 logements max (HA + moteurs
~1,5 Go RAM) ; au-delà = 2e box ou logement `cloud`. Stockage preuves :
quota 5 Go/logement (photos EDL + vidéos), éviction oldest-first après
90 j (originaux basse-def gardés 1 an), alerte 80 %.

Login → dashboard plugin (§S3.1) : super_admin (`dash-super`, « voir
comme » + `/systeme` + secrets), admin (`dash-admin`, sans secrets),
opérateur (`dash-operateur`, 14 actions : planning, accès/PIN, prix +
modes, énergie, incidents/sinistres, supervision, finances, messages,
clôture…), comptable (`dash-comptable`, Finances + exports seuls),
client tiers (`dash-proprio` : CA/charges/net, travaux >seuil, exports
périmètre), presta (`dash-presta` : mission + pointage + photos),
voyageur (`dash-voyageur` : WiFi <3 s, guide QR, parler/écrire, extras,
départ zéro friction, SAV <15 min 8h-22h), commercial (`dash-commercial` :
simulateur, offres, pipeline CRM, fiche PDF). Auth nominative, scopes par
tenant, sessions à expiry auto.

Dashboards HA (compat box) : hôte 7 onglets (Planning, Accès, Prix,
Énergie, Incidents, Supervision, Finances) ; ménage 3 onglets (todos +
deadline check-in −2 h, checklist bloquante, stocks) ; guest kiosk
(WallPanel, QR backup). Lovelace YAML versionné ; front lit les mêmes
APIs. Switcher `logement_actif`, bandeau offline. Recette : mobile +
offline 2 h + 1 séjour témoin zéro-touch (hors ménage).

Preuves : EDL PWA photos horodatées par pièce + vidéo optionnelle
(anti-galerie >24 h, EXIF, comparatif, clôture bloquée si manquantes).
Traça intervenants (pointage, photos, temps pointé = temps facturé).
Journal accès 90 j (heures + slot, jamais code). Inventaire QR/NFC
(dormants/dégradés/garanties). Extras (stock vs seuil, CA/séjour, top).
Questionnaire J-2 (cut-off J-1 18 h, jamais bloquant).

## §T6 0 € logiciel + qualité

HAOS, Proxmox, Mosquitto, Z2M, OTBR, Nuki Hub, Versatile, KeyMaster,
Wyoming/Whisper/Piper/openWakeWord, LiteLLM, ESPHome, WireGuard, Grocy,
WallPanel, `ics_calendar`, DuckDNS/LE, Telegram/Companion. Maison :
`ics-sync, pricing, decision-engine, branding, llm-proxy, router-ui,
jev-gateway, qloapps-module-ha`. Blueprints : arrivée, départ-ménage,
bridage, bruit, fuite, incendie. Moteurs lab stdlib, aucun abonnement,
aucun SaaS intermédiaire obligatoire.

`versions.lock` committé. Revue mensuelle (EOL, quotas, CVE). MAJ
fenêtrées + backup avant + test PIN sans WAN après. WAN box : fibre/ADSL
+ clé 4G failover partagée (~10 €/mois, active si WAN down >5 min,
quota 5 Go, alerte conso) — jamais de PIN distant sans WAN de secours
le jour d'arrivée ; Starlink = option zone blanche (devis, jamais par
défaut). OPEX logiciel : 0 € strict à ~1-3,2 €/mois/logement (UE + Jev).
Coûts LLM/Jev au dashboard, alerte >5 €.

Batterie lab verte exigée avant commit (tenue : 1125 OK / 0 KO). DoD par
phase (5 items, tous cochés ou phase non close) : doc plan MAJ + batterie
verte + runbook daté + test offline/rotation concerné + tag. 1 séjour
témoin zéro-touch par phase. Drill trimestriel + version papier. Runbook
2 pages (rotation ~3 h) + incidents (fuite, bruit, serrure, net,
double-résa, trouvés). Maintenance calendaire + tests mensuels 1-tap.
Tableau dernier-test / prochain-test par runbook (revue mensuelle, retard
>30 j = P2). Restore chronométré sur VM réelle 1x/semestre (RTO cible 2 h,
mesuré + daté, écart = P2).
Qualité données (entrée + mensuel) : SIREN/SIRET vérifié (API INSEE au
mandat), IBAN vérifié (clé + BIC), doublons prospects (tel + mail,
fusion manuelle seule), annonces (n° + DPE + photos <12 mois). Rapport
mensuel : doublons, champs vides, exports rejetés (Chorus/PDP).

## §T7 Juridique FR par client (matrice, pas de conseil)

Mandat écrit par proprio (périmètre, forfait, seuils, durée, rémunération).
CGV direct + CGU plateformes (CGU > propres). Contrat voyageur PWA 30 s +
règlement copro-aligné + mentions annonces. Factur-X B2B / PDF B2C,
registre national + taxe NCA + DPE. Classement Atout France en option.
Comptes créés à la signature (invitation scopée, login → dashboard §S3.1).
Médiation consommation L.612-1 (pro, obligatoire) : médiateur désigné
(~200-400 €/an, nommé au go-live, coordonnées sur factures + site +
contrat PWA) ; réclamation écrite d'abord, saisine <12 mois si échec ;
jamais de clause abusive R.212-1 (médiation payante imposée = interdite).
ODR + rétractation voyageur (droit UE, perdu des archives v1 → réintégré) :
lien plateforme ODR `ec.europa.eu/consumers/odr` sur site + contrat PWA
(obligatoire pro) ; mention L.221-28 12° au contrat/CGV (hébergement à date
= pas de rétractation 14 j — à écrire, sinon le voyageur l'invoque).
Registre des réclamations (1/logement, DGCCRF) : toute réclamation écrite
= entrée datée + réponse <30 j (humaine, tracée) → médiation si échec ;
revue trimestrielle (top causes → standard MAJ).
CFE : due dès la 2e année par logement (exonération 1re année,
~200-500 €/an, vérifiée avec l'expert-comptable) ; provisionnée au
prévisionnel, jamais une surprise.
Vente du bien / fin anticipée : transfert mandat au notaire (box = meuble,
reprise ou cession chiffrée), préavis acquéreur 3 mois, dernier relevé +
reversement soldé J+5, révocations + purge 90 j ; jamais de mandat
transféré sans accord écrit des 3 parties. Kit de sortie (portabilité,
jamais un litige) : à la résiliation = export complet 1-clic (relevés,
factures, EDL, docs) sous 30 j, puis purge ; jamais de rétention
documentaire après sortie.
Refus de quitter / squat post-checkout : relance → mise en demeure →
huissier (jamais de force, jamais de coupure eau/élec/codes en occupé) ;
relogement du suivant à nos frais + geste ; dossier plateforme + protection
juridique ; jamais de négociation d'occupation sans écrit.
Protection juridique (~300-500 €/an, obligatoire dès le 1er mandat tiers) :
litiges voyageurs / plateformes / voisins / copro ; activée <48 h
(dossier photos + EDL + contrat + messages) ; jamais sans PJ au-delà de
2 biens tiers.
Dégât des eaux / IRSI (cas N°1 en copro) : tranches <1 600 € / <5 000 €
(1 / 2 assureurs), qui appelle qui sous 5 j (constat amiable + syndic +
photos) ; jamais de travaux sans accord assureur ; dossier copro suivi
au ticket, jamais d'oral.
CATNAT (complète la force majeure) : arrêté interministériel + déclaration
mairie/assureur sous 10 j (30 j sécheresse), franchise légale 380 €,
expertise ; report/avoir/remboursement comme force majeure, jamais de
rétention abusive.
Démarchage / devis / factures : mandat signé hors établissement (visite,
visio) = bordereau de rétractation 14 j joint, jamais omis ; devis >200 €
= mentions (validité 3 mois, assurance, médiation, TVA) ; factures = piste
d'audit fiable (devis → BL → facture, art. 242 nonies A, numérotation
continue, jamais de trou).

Caution : Airbnb = AirCover + 14 j (caution hors plateforme INTERDITE) ;
Booking = collecte séparée déclarée (VCC = séjour seul) ; Abritel =
caution OU Damage Protection (jamais cumul) ; direct = hold 500-800 €
(Swikly/Stripe/TPE, jamais dans le prix). Fonds tagués par logement,
jamais communs. Retenue = justificatifs seuls (photos + dB + factures),
jamais punitive. Damage waiver en option (à trancher, benchmark chiffré) :
Superhog ou équivalent (payé par le voyageur, 0 friction) vs hold
Swikly/Stripe (friction + impayés possibles) — décision tracée au mandat
(coût voyageur vs friction vs sinistres), jamais les deux cumulés. Test A/B
waiver vs hold (3 mois, décision chiffrée) : conversion direct + friction
carte + sinistres réels → gagnant au mandat suivant, jamais d'avis sans
chiffres.
Chargebacks / contestations paiement (Stripe/Swikly, 180 j CB) : dossier
preuve prêt (contrat PWA signé + EDL photos + messages + facture) ;
réponse <7 j (alerte dashboard dès notification) ; provision 1 mois
d'encaissements directs ; hold > capture (jamais de débit sans
justificatifs) ; récidive même voyageur = blacklist + refus direct
(OTA seule, prépayée). Chargeback 1-tap (au-delà de 20 lots) : template
pré-rempli (contrat + EDL + messages + facture) + envoi 1-clic, jamais de
dossier manuel ; en dessous = réponse <7 j manuelle, jamais de retard.
Impayés / recouvrement : extra impayé = relance J+3/J+7 (brouillon humain)
puis débit caution si motif + justificatifs, sinon créance ; abo client
impayé = rappel J+5, mise en demeure J+15, suspension pilotage J+30
(calendriers rendus, box locale active, jamais de sabotage), recouvrement
amiable puis injonction si >500 €. Tout est tracé, jamais de coupure
sauvage d'un séjour en cours. RC pro + expiry, transport/enfants =
prestas assurés.
Assurances par logement (vérifiées à l'onboarding, expiry auto) : PNO
obligatoire en copro (loi ALUR, même en saisonnière) + déclaration LCD à
l'assureur (MRH classique seule = refus d'indemnisation) + RC Exploitation
loueur meublé ; client (mandat) = attestation PNO couvrant la courte durée
remise au mandat puis à chaque renouvellement, défaut = suspension
commercialisation après mise en demeure ; voyageur = RC villégiature
exigée au questionnaire J-2 (défaut = assurance plateforme rappelée,
jamais de blocage d'arrivée).
Requalification : auto-entrepreneur banni pour le ménage régulier (lien
de subordination) — prestas = sociétés ou indépendants multi-clients
facturant au réel, grille affichée, jamais de planning imposé.
Non-sollicitation + confidentialité prestas (clause contrat, 12 mois) :
jamais de démarchage direct du client, jamais de code/adresse diffusé,
jamais de photo client publiée ; manquement = déréférencement + mise en
demeure, jamais de pénalité occulte.
Convention-cadre presta (signée avant la 1re mission, modèle en templates) :
missions, SLA, tarifs indexés, assurance, non-sollicitation, résiliation
30 j ; sans convention = pas de dispatch, jamais d'exception.
Gros travaux client (suivi, jamais de pilotage sans DO) : DO du client
vérifiée avant travaux ; devis + réception écrite avec réserves ;
retenue de garantie 5 % (1 an) ; photos avant/pendant/après au dossier ;
jamais d'avance de notre part, jamais de réception tacite.
GLI / Visale (jalon, si un jour un bail classique) : GLI ~3-5 % loyers vs
Visale gratuit <30 ans — exiger l'une avant toute signature hors LCD ;
jamais de bail classique sans garantie.
Fermeture / hivernage (vide >30 j) : box ON, hors-gel 12 °C, VMC auto,
passage presta mensuel 25 €, EDL d'inoccupation horodaté ; remise en
service = checklist 1 h + photos.
Force majeure / catastrophe (inondation, tempête, fermeture admin) :
ordre = sécurité (évacuation + 112) → relogement proposé (frais à qui de
droit selon assurance) → report (avoir 12 mois) puis remboursement au
prorata si report impossible ; jamais de rétention abusive ; activation
perte d'exploitation (assureur <48 h, dossier photos + EDL + résas
annulées) ; décision = humain seul, tracée, jamais auto.
Annuaire ≥2 actifs/métier/zone RC vérifiée, alerte si <2. Sinistres :
dossier auto + dispatch + compte à rebours + suivi + clôture compta.

Fiscalité : LMNP 1 SIREN = N logements indépendants, plafonds micro
cumulés. Jauges 15 000 € / 77 700 € + 120 j, alertes 80 %/100 %.
Taxe foncière (client, mais intégrée au rendement) : saisie au mandat +
au simulateur (jamais de rentabilité affichée sans TF) + rappel annuel
au relevé (provision mensuelle conseillée, jamais d'avance de notre part).
Simulateur micro vs réel + export 1-clic, clôture le 5. Réel = amortissements
par composant (gros-œuvre 50 ans / toiture 25 ans / agencement 10-15 ans /
mobilier 5-10 ans, barème comptable au mandat) ; alerte revente : réforme
15/02/2025 = amortissements réintégrés dans la plus-value (le « passez au
réel » se paie à la revente — jamais conseillé sans comptable + projection
revente). Factures + OCR → `docs/logN/compta/`, file basse confiance.
DAC7 : plateformes = déclarantes (revenus vendeurs → fisc 1x/an, elles
transmettent) ; nous = conservation 10 ans des relevés + exported
payouts par SIREN pour contrôle. E-facture : export Chorus Pro / PDP
`GET /v1/export-compta?entite=&format=facturx` dès G2bis (obligation ETI
en vigueur 09/2026, généralisation par paliers — veille active).
RGPD : registre, consentements par séjour, purge (24 mois / 90 j /
0 j audio), effacement sur demande, revente/croisement interdits. Données
sensibles J-2 (allergies, PMR, santé) : consentement explicite à part,
jamais réutilisées en marketing, purge checkout+30 j (jamais 90 j).
Compta 1 dossier chiffré/client, backups chiffrés par client.
DAS2 / RBE (échéances, renvoi comptable) : DAS2 = honoraires versés
>1 200 €/bénéficiaire/an (mai N+1) ; RBE = bénéficiaires effectifs au
Guichet Unique ; jamais d'oubli (sanctions). Factures B2B art. 441-10 :
mentions (40 € forfaitaire + 3× BCE + échéance), numérotation continue,
jamais de trou. APL (jalon, si bail classique un jour) : décence + DPE +
loyer de référence — jamais de dossier APL en saisonnière.

## Annexe T-A — État réel (2026-10-13)

Lab ~19 services (moteurs 8090-8100 + `:8443` + `:8050`/`:8060` +
`:4000`), boxes log1/log2 simulées + VPS-sim Caddy TLS, registre parc +
batterie. Configs `lab/lab-config/*.yaml`. Batterie 1125 OK / 0 KO
(design system + KPIs + i18n + simulateur, vitest + build + lint verts).
Front `web/` Next.js 16 (hôte 14 actions, voyageur, proprio, commercial),
PWA manifest. Commits : `0fae986` refonte SaaS ; `2d2add3` P9/P10 ;
`ec8532c` forfaits + VPS-sim ; `29846aa` SaaS + PWA ; `ba2dad2` vision
SaaS ; `7005bf4` front.

## Annexe T-B — Points à trancher

1. Ligne IA/voix par tenant (incluse FULL jusqu'au seuil, réel au-delà ;
   réel dès le 1er token PILOTAGE/KIT).
2. Nom commercial + domaine + SIREN/RC pro + mentions légales.
3. `llm_eu_only` par défaut vs 0 € strict.
4. Accord syndic log1 (écrit, hall/portail) + cylindre débrayable +
   comptage radiateurs.
5. Seuil validation travaux/dépenses par client (mandat type).
