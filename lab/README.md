# lab/README.md — lab Docker LCD (branche `lab/docker`).

# Code dans CE repo, tests ici, déploiement prod/box ENSUITE.
# 0 € logiciel (images `python:slim`, stdlib seule). LAN du lab = réseau
# docker interne, jamais WAN. Secrets FAUX de lab seuls, jamais de clés réelles.

## Démarrage

```sh
cd lab
cp secrets.lab.yaml.EXAMPLE secrets.lab.yaml   # valeurs FAUSSES déjà dedans
cp ha-virtual/secrets.yaml.EXAMPLE ha-virtual/secrets.yaml   # idem (rest_command)
docker compose up -d --build
python3 tests_lab.py
```

Le lab FAIT OFFICE DE BOX : mêmes images génériques transférables, mêmes
ports, mêmes volumes — seule la config/logements/secrets change par box.
Nouveau logement = bloc `logements.lab.yaml` + `prestataires.lab/logX.yaml`,
0 rebuild. Export box : `sh export-box.sh` → `lcd-box-<date>.tar`
(`docker load -i ... && docker compose up -d` sur la box avec SES fichiers).

> Note volumes : `inventaire.lab/` est monté en RW (box-équivalent) car le
> registre est un état muté à chaque clôture ménage (+1 utilisation). Les runs
> de tests y ajoutent des biens `TEST-INV-*` (assertions en `>=`, jamais `==`) —
> reset via `git checkout -- inventaire.lab/` si besoin.

## Batterie (P2-14 : résa <60 s + conflit ICS ; P6-8 : dispatch prestataires ; P6-4 : inventaire ; P6-5 : extras ; P6-18 : compta ; P7-3 : routage)

`tests_lab.py` vérifie, dans l'ordre :
1. `/health` des 12 moteurs (8050 + 8090→8100) ;
2. bornes prix 75/290 inviolables (pivot août ∈ [75,290]) ;
3. garde-fou copro P2-16 (`copro_verifiee=true` dans le lab, `false` dans le réel) ;
4. tunnel direct <60 s : `POST /devis` → `POST /resa` (brouillon) →
   `POST /confirmer` (1-tap `qui=test-lab-humain`) ;
5. conflit ICS : 2e résa mêmes dates refusée ;
6. garde-fous : `confirmer qui=auto` refusé 400, `debiter qui=auto` refusé 400 ;
7. taxe séjour Métropole NCA via `/taxe`.
8. dispatch P6-8 (§12.4-bis) : annuaire log1 (serrurier RC expirée =
   `suspendu_assurance`, alerte couverture <2), dispatch `fuite_eau` =
   `lab_plomb_01` (tri prix en zone), `panne_elec` hors zone = escalade + 2e
   choix (jamais auto), migration `zone:`→`zones:` (log2), mission
   `qui=auto` 400 + mission humaine 201 (dossier `interventions/`), mission
   RC expirée 403, sinistre airbnb 201 (échéance 14 j).
9. parcours intervenant P6-2 (§12.4) : mission → pointage arrivée/départ
   (départ sans arrivée 409, `qui=auto` 400) → photos AVANT/APRÈS par pièce
   → clôture (preuves manquantes 409, écart >20 % sans justificatif 409,
   temps facturé = temps pointé) + traversée dossier bloquée.
10. inventaire biens P6-4 (§5.6-bis) : 5 biens seed log1, fiche + alertes
    dormant >90 j (`EQUI-LV-001`) / état ≤2 (`EQUI-TV-001`) / garantie <30 j
    (`EQUI-ASP-001`), stats (coût/séjour 25÷12=2.08, budget ≥400),
    log2 flag off = 503, `qui=auto` 400, création + `/utilisation` clôture
    `moteur-dispatch` 201 + lavage, `qui=auto` refusé, état 1 = remplacement
    proposé, état 6 refusé, qr `..` bloqué.
11. extras upsells P6-5 (§5.6-ter) : catalogue log1 (8 extras lab, late 50),
    log2 flag off = 503, `qui=auto` 400, extra inconnu 400, cut-off J-1 18h =
    409, commande 201 `a_payer` (petit-déj 2 pers = 30, todo ménage, compta
    rubrique `accueil` pour le kit offert), kit seul = `validee` 0 €,
    livrer avant paiement 402, payer sans preuve 402, payer 200 `payee`,
    livrer 200 `livree`, `GET /commandes`, id `..` bloqué.
12. contrat PWA P6-15 (§12.5-bis) : `GET /contrat` non_signe + `POST /contrat`
    1-tap humain (CGV 422, tactile 422, slug 400, `qui=auto` 400), 201 signé
    + 200 re-signé (sha256 seul, jamais raw), opt-ins mémoire/géoloc/CRM
    (log1 `crm_retour/geoloc on` = code `DIRECT-10-<REF>` + suivi séjour ;
    log2 off = en_attente sans code), liaison questionnaire, J-2 direct
    non signé = `pin_autorise` False indicatif (jamais bloquant).
13. état des lieux auto P6-16 (§5.6) : `GET /edl` non_commence + `POST
    /edl-consentement` 1-tap voyageur (refus = manuel ménage, 403 sans
    consentement) + `POST /edl-photo` 5 pièces E/S (socle salon/cuisine/
    chambre/sdb/entree, EXIF/horodatage, galerie >24 h 422) + `POST
    /edl-video` optionnelle 30 s (61 s 422) + comparatif présent/partiel/
    complet + clôture ménage liée (EDL commencé incomplet = 409, complet =
    201) + `POST /edl-purge` 90 j.
14. boucle avis P6-17 (§5.7-bis) : `GET/POST /avis` J+1 (note 1-5, 201/200,
    >=4★ lien_public / 3★ late_gratuite auto / <=2★ geste à valider + todo
    correctif mots-clés) + `POST /avis-geste` 1-tap humain (alerte si >20 €,
    jamais de débit auto) + `POST /avis-reponse` brouillon (422 si promesse)
    puis validation (publication manuelle) + `GET/POST /scene` 3 scènes
    1-tap + objets trouvés dispatch (`/objet-trouve` 201 forfait 15 +
    message J+0, `/objets`, `/objet-reclamer`, `/objet-envoyer` 402 sans
    preuve,     `/objet-cloturer` don/stock après 30 j) + `GET /livret` 5
    fiches QR 30 s (guide de base, dispo même si upsell off).
15. compta auto P6-18 (§12.6) : `POST /facture` 1-tap humain (montant 422
    si absent, catégorisation mots-clés + confiance, <0.7 = file
    validation) + `POST /facture-valider` (+ correction rubrique) +
    `POST /payout` (net = brut − commission) + `POST /releve` (matching
    ±2 %/±7 j : rapproché vs écart vs orpheline, jamais d'écriture auto) +
    `GET /finances` (CA/charges/net + jauges 15 k€/77,7 k€ + 120 j,
    alertes 80/100 %) + `GET /simulateur` (micro vs réel + levier
    classement, jamais d'option auto) + `POST /cloture` (le 5 suivant,
    409 avant, idempotente).
16. supplément ménage P6-19 (§12.2-ter) : `GET /menage-tarif` (110 €
    log1 / 90 € log2, 10 postes prorata total == montant, surcharge +20 €
    juin-sept info, alerte inclus_nuit) + `POST /menage-cout` (coût réel
    rotation → OPEX) + `GET /menage-couts` (moyenne + dérive >10 % +
    payload `sensor.menage_cout_rotation`) + `POST /menage-note` (score
    1-5 + alerte temps vs ~3h) + `GET /menage-score` (moyenne + alerte
    <3,5 + durées pointées).
17. RBAC 5 rôles P6-20 (§1.6) : `GET /acces` (audit nominatif MFA/expiry/
    révocations/doublons, réservé super_admin/admin) + `POST
    /acces-revoquer` (jamais soi-même ni super_admin, idempotent) +
    `POST /acces-reactiver` + `GET /journal` (90 j, périmètre, cap 200,
    PIN lab jamais en clair ; voyageur = pas de compte nominatif).
18. carnet preuve + lettre + RGPD + mentions P6-21 (§12.5-bis) : `POST
    /preuve-db` (dB seuls 0-120, jamais d'audio, trimestre auto) + `POST
    /preuve-attestation` (intervention/ménage/message) + `GET /carnet`
    (synthèse trimestre jour/nuit + attestations, hôte seul, 1 an) +
    `POST /lettre-tranquillite` (brouillon chiffré) + `POST
    /lettre-envoyer` (1-tap, messagerie tracée) + `GET /registre-rgpd`
    (7 traitements + durées, filtré features) + `GET /mentions-annonce`
    (9 obligatoires, renseigné/manquant + actions, jamais inventé).
19. formation ménage P6-22 (§14) : `GET /formation` (programme 30 min,
    5 modules + drill trimestriel) + `POST /formation-session` (rotation
    blanche) + `POST /formation-module` (1-tap, idempotent, 409 si
    validée) + `POST /formation-valider` (5 modules + dossier
    `remise_en_dispo`, 409 sinon, attestée hôte).
20. seuils LLM/Jev P7-6 (§6.7) : `GET /seuils` (doc vivante) + `POST
    /gardien` (RBAC -> outil interdit serrure/vanne/portail/PIN toujours
    BLOQUÉ -> hors_bornes>0,5 BLOQUÉ -> confidence<0,7 dashboard jamais
    d'auto -> noul>0,8+conf>0,75 auto borné + trace P7-7, sinon
    dashboard ; scores absents = 0).
21. traçabilité P7-7 (§6.7) : langue voyageur en log JSONL + `GET
    /journal?backend=&alias=&langue=` (filtres dashboard combinables,
    vides = sans filtre).
22. UI routage P7-3 (§6.5) : `GET /routes` (primaire + fallbacks + 6
    aliases + validation garde-fous, clés API jamais exposées) + `POST
    /route` 1-tap humain (alias connus, anti-redondance, retry 0-3,
    cooldown 0-300, clés garde-fou 400, backup 5 max + audit) + `POST
    /tester` (TCP court : gateway `:4000` hôte OK, Ollama/custom KO
    documentés, santé mémorisée) + `POST /reload`.
23. aliases P7-4 (§6.5) : `POST /resoudre` (lecture seule : `eu_only` →
    override eu (EU non garanti via gateway), alias direct
    fast/strong/eu/local, sinon primaire ;
    selects/sensors/couts/dépréciation = box HA).
24. prompts voyageur M1-M8 P7-10 (§6.7.1) : `GET /prompts` (8 usages +
    alias + variables + interdits) + `POST /composer` (trous seuls 422,
    placeholders injectés APRÈS, jamais d'appel LLM — proxy `:4000` box).
25. prompts voyageur Jev J1-J9 P7-11 (§6.7.2) : registre étendu (moteur
    jev + construits Noul/Choice/Score + seuils, backend zen `:4000`
    box) + composeur (même contrat trous seuls, backend zen).
26. prompts pricing/compta P7-12/13 (§6.7.3-4) : M-LLM-1→7 + M-JEV-1→6
    (registre étendu, seuils file/blocage/1-tap, exécution box).
27. prompts ops M-LLM1→10 P7-14 (§6.7.5) : classification dégât sans
    vision + résumé sinistre SLA + digest intervention + scoring
    presta + conflit ICS + diagnostic runbook + résumé logs +
    fiche mission + dossier incomplet + écart compta/onboarding
    (registre étendu, garde-fous jamais retenue/promesse/
    montant/hors-zone/PIN/écriture auto, exécution box).
28. prompts ops Jev M-JEV1→9 P7-15 (§6.7.6) : vrai scoring dispatch
    Choice, gravité sinistre SLA, complétude photo sans vision,
    conflit ICS garder, diagnostic supervision, fusion WiFi-sensing
    (verbatim, jamais seul), linge, caution/litige (jamais sans
    justificatifs), gating palier (verifiee false = BLOQUÉE)
    (registre étendu, seuils dashboard/file/BLOQUÉE, exécution box).
29. prompts juridique LLM M-LLM-1→7 P7-16 (§6.7.7) : résumé CGV 1
    page/langue (caution verbatim, jamais inventé), check-list
    conformité (verifiee false = BLOQUÉE), lettre syndic (dB seuls),
    relances (sans menace, humain valide), médiation L.612-1 + ODR,
    digest audit (jamais PIN), filtre RBAC scopé (refuse hors scope,
    secrets jamais exposés) (registre étendu, exécution box).
30. prompts juridique Jev M-JEV-1→7 P7-17 (§6.7.8) : garde-fou
    clauses R.212-1 (auto-bloquant), complétude conformité
    (verifiee false + stop-sell), routage litige (jamais clôture
    auto), éligibilité caution (jamais sans justificatifs),
    criticité échéances (push/digest), anti-fuite RBAC (blocage +
    log), anomalie     pilotage (file, jamais écriture auto)
    (registre étendu, seuils dashboard/file/BLOQUÉE, exécution box).
31. proxy P7-2 (§6.5) : gateway `:4000` apportée (muse-spark 1.3 +
    jev-1.13) + alias `lcd-chat-custom-1` (`api_base` endpoint box +
    clé `CUSTOM_LLM_API_KEY_1`, garde-fous 0.2/250) +
    `router_settings` (retry 1, cooldown 30 s, fallbacks
    fast→eu→local) + `POST /resoudre` direct + `POST /tester`
    (TCP gateway OK, Ollama/custom KO documentés ; clés/quota =
    proxy, jamais lab).
32. garde-fous P7-19 (§6.5) : cascade muse-spark → eu → Ollama
    local (offline) + EU-only non garanti via gateway + secrets
    jamais exposés (routes + composer audités) + UI LAN seule
    (défaut `127.0.0.1`, `0.0.0.0` = exception lab explicite) +
    kill-switch `jev_enabled` + `sensor.llm/jev_cout_mois` +
    backends custom-1 (entités log1 ; coûts = proxy).
33. Jev P7-5 (§6.6) : squelette `rest_command` versionné
    (gateway `:4000` OpenAI-compatible, modèle `jev-1.13`,
    timeout 6 s, kill-switch, seuils) + selects backend +
    override endpoint (option B P7-20 non retenue : direct
    compatible, pas de wrapper).
34. voix P7-1/8 (§6.5) : squelettes Wyoming + Whisper-small + Piper
    + openWakeWord (BYOD, consentement révocable, offline-first,
    jamais codes/PIN/serrure/vanne, urgences fixe + 112) + 2
    satellites + PWA parler/écrire (même pipeline M1-M8/J1-J9,
    escalation humaine <15 min, critères 5 s) (install + mesures
    box ; P7-9 recette terrain restante).
35. gate go/no-go prix P8-7 (§9) : balayage bornes [75,290] +
    clamp prouvé (290/75 + `clampe`) + objectivité art. 225-1
    (attributs voyageur ignorés) + `PUT /prix` direct seul (422
    hors bornes sans motif) + `GET /reco-ota` 1-tap lecture seule
    (jamais d'écriture auto OTA).
36. marque blanche P8-3 (§1.5.4) : `GET /phrases` au_revoir FR/EN
    rendu avec marque lab (0 fuite `LCD`/`Home Assistant`, 0
    placeholder) + dispatch `--branding` (fiche mission = marque
    ou repli `votre hôte`, jamais `LCD` en dur) + volume branding
    monté (navigation PWA + SMS = box).
37. clone log2 P8-12 (§9) : prod `verifiee: false` + light
    (serrure/voix/extras/vitrines off) + bornes intactes + porte
    décision unitaire (events J-2 log1+log2 → 403 BLOQUÉE,
    wizard copro requis ; lab `verifiee: true` = exception).
38. box HA virtuelle (§1.5.6/P1-10) : conteneur
    `homeassistant:stable` + provisionnement headless
    (`ha-bootstrap` : admin lab + token, `.storage` éphémère) +
    packages RÉELS montés (miroir vérifié, 0 dérive) + API `:8123`
    + entités socle (jev/enabled, backends dont custom-1, coûts,
    `input_text` fusionnés log1+log2 — 0 clé dupliquée) + push
    réel moteurs→HA (§40) + boucle HA→moteur (§41).
39. push HA réel (P1-10/P2-4/P2-7/P2-9) : event J-2 → 200 `emis`
    + `sensor.log1_prix_nuit` == pivot J après recalcul +
    `calendar.log1_planning` contient la résa (JWT lab forgé ;
    box = Bearer `secrets.yaml`, repli `ha_non_configure`
    conservé si HA injoignable).
40. boucle HA→moteur (P2-9) : service `script.log1_renvoi_j2`
    → `rest_command` → decision `:8092` (`qui=dashboard_hote`,
    matrice `gestionnaire/dashboard`, tracé au journal) ; compte
    machine audité (`/acces` : 8 comptes).
41. recorder (P1-10/P2-7) : `history:` activé (graphe Vue Prix
    30 j — manquait partout, box incluse) + `/api/history`
    relit le pivot poussé en §40 (commit recorder prouvé).

> Note état : `extras-state/<logX>/extras_commandes.json` est un runtime
> (jamais commité, comme `inventaire.lab/` pour le registre). `contrat-<logX>.json`
> (decision-state) est un runtime gitignoré (comme `questionnaire-<logX>.json`).

## Fichiers

- `Dockerfile.moteur` : image générique stdlib (build-args `SCRIPT` + `CONFIG`).
- `docker-compose.yml` : 9 moteurs + volumes state/logs + healthchecks.
- `export-box.sh` : `docker save` → `.tar` transférable (box = `docker load` + up).
- `prestataires.lab/log{1,2}.yaml` : annuaires FICTIFS lab (tri prix, hors zone,
  RC expirée, migration `zone:`) — le réel `custom/prestataires/` reste vide.
- `lab-config/*.yaml` : configs de LAB (URLs inter-services docker, `ha_url: ""`).
- `logements.lab.yaml` : COPIE lab (`verifiee:true`, `moteur_direct:maison`,
  noms fictifs) — le réel `custom/logements.yaml` garde `verifiee:false` BLOQUÉ.
- `secrets.lab.yaml` (gitignoré, à créer depuis `.EXAMPLE`) : faux secrets de lab.
- `branding.lab.yaml` : marque fictive (le réel `custom/branding.yaml` est privé).

## Teardown

```sh
docker compose down -v   # supprime conteneurs + volumes runtime
```

`lab/*state*/`, `lab/secrets.lab.yaml`, `lab/*.log` sont gitignorés (runtime,
jamais commités — cf. `.gitignore`). Seuls code + configs lab + gabarits sont
versionnés sur `lab/docker`.
