# Registre — Benchmark OSS + verdict récupérer vs réécrire (v2 plan-only)

> Recherche web Jan 2026 + lecture contrats réels 2026-10-14. Vérifier licences/état GitHub avant toute reprise. Règle R-09 : inspiration fonctionnelle OK, copier-coller GPL en repo privé/client = NON.

## 1. Projets équivalents retenus

### HotelDruid (PMS historique)
- Licence GNU GPL v3, PHP + MySQL/MariaDB/PostgreSQL, self-hosted.
- Fonctions : planning dispo, moteur résa web propre, multi-biens, saisons/tarifs/taxe séjour, clients, e-mails, factures, stats, multi-langue/devises.
- Limites : UI datée, install/maintenance manuelle, pas de channel manager natif, pas de passerelle paiement native, support communautaire.
- Enseignement LCD : modèle planning + grille tarifs/saisons + ICS à imiter fonctionnellement ; ne pas copier le code (GPL + stack PHP vs Next.js/Python stdlib).

### QloApps (fork PrestaShop)
- Licence **AFL-3.0 (Academic Free License, vérifiée web 2026-10-14 — pas OSL-3.0)**, fork PrestaShop 1.6, code GitHub QloApps/QloApps. Licence permissive type PrestaShop : pas de copyleft réseau contraignant.
- Fonctions : booking engine + front-desk + créateur site, chambres=produits, dispo temps réel, paiement partiel, extras, multi-hôtel/langue/devise, modules channel-manager.
- Enseignement LCD : référence fonctionnelle pour `moteur_direct` (booking engine + front-desk éprouvés). ÉCARTÉ v1 — T-01 TRANCHÉ 2026-10-14 : maison `booking:8095` seul (poids PrestaShop + multi-tenant `entite_id` + allowlist 1-tap absents d'origine).
- Verdict : MAISON v1 (AFL-3.0 permissive notée — attribution + conservation de licence si inspiration, audit avant tout fork tout de même).

### Vik Booking (Joomla/WordPress)
- Core Lite GPLv2+ sur WordPress.org, versions Pro/Joomla commerciales mais GPL (zip ~99 €+), pas de repo public complet.
- Channel Manager séparé commercial (**~249 €/an licence 1 domaine, vérifié web 2026-10-14**, core VikBooking requis en plus, hors TVA) : 2-way API (pas juste iCal) Airbnb + Booking.com + Expedia, Google Hotels, Vrbo, 100+ OTAs — dispo + tarifs/rate plans + restrictions (min stay, closed) + résas re-poussées.
- Enseignement LCD : confirme stratégie v1 ICS pull 15 min seul (suffit 1-5 lots) + Won't Channel API 2-way maison (T-03). Doctrine 0 € stricte — T-03 TRANCHÉ 2026-10-14 : si 2-way un jour = RÉÉCRIRE maison intégralement (toutes fonctions/options/configurations), jamais acheter.
- Verdict : ICS d'abord, réécriture maison 0 € si besoin futur, jamais d'achat (Vik ~249 €/an noté pour mémoire seule).

### Roomify / BAT (Drupal, archivé)
- Roomify D7 EOL archivé, BAT = framework dispo/événements Drupal.
- Enseignement : ne pas fonder du neuf sur D7 mort ; idée à garder : dispo = événements (indisponibilités) fusionnés, comme `ics-sync:8090` + `booking:8095`.

### Jomres / Solidres (Joomla)
- PMS légers petites structures, logique folio/ménage/caution.
- Enseignement : périmètre folio + housekeeping +hlignes séparées ménage/caution, déjà prévu §S7/§T3.

### Odoo (LGPLv3) + apps Hôtel/Rental tierces
- Rental officiel (commandes, retours, retards), apps Hôtel (Odoo-Mates, SerpentCS, Cybrosys) : chambres, folio, housekeeping, POS.
- Enseignement : si besoin ERP plus tard, Odoo = écosystème App Store, mais charge + mono-SIREN + périmètre mandat à adapter.

### ERPNext + Frappe Hospitality
- ERPNext GPLv3, Frappe MIT, app `frappe/hospitality` : Hôtel, Room Type, Room, Réservation, Folio, Restaurant, compta native.
- Enseignement : meilleur candidat si compta native + e-facture Chorus/PDP exigée à l'échelle (T-04). Surdimensionné pour 2 vitrines Phase 1.
- Verdict : garder `compta:8100` maison + export Chorus/PDP en v1, réévaluer ERPNext au 1er mandat tiers.

### KeyMaster (HACS) + Nuki
- `FutureTense/keymaster` : intégration HA HACS, PIN temporaires par slot, plages dates, sync iCal Airbnb/Vrbo, auto-expire checkout, notifs par slot. Idéal Z-Wave (Schlage/Yale/Kwikset).
- Nuki : Smart Lock + Keypad + Bridge/Web API/MQTT, intégration HA officielle, gestion PIN via Web/Bridge.
- Enseignement LCD : SEUL code à récupérer tel quel (T-02) : KeyMaster si serrure Z-Wave, ou automatisations Nuki si Nuki. Les deux sont MIT/GPL compatibles usage interne + jamais de PIN en clair (REQ R-02).
- Verdict : RÉCUPÉRER (HACS/automatisations), adapter slots 1-10 PIN séjour + purge checkout. Réserve 2026-10-14 : KeyMaster HACS = Z-Wave (`zwave_js`) ; si log1 = Nuki Matter/Thread, reprendre le PATTERN (slots + auto-expire + purge) via automatisations Nuki, pas le module brut.

### Scripts ics-sync DIY (MIT)
- Dozens de syncs iCal Airbnb↔Booking↔direct, sensibilité double-résa.
- Enseignement : valide ICS pull 15 min + jamais partagé + stop-sell (REQ-S-002), jamais de scraping auto.

### Pricing ML (XGBoost/LightGBM, Aerosolve)
- Kaggle RMSE ~30-45 $, non prod-ready sans pipeline données.
- Enseignement : valide choix règles `clamp(pivot x K_*)` + IA aide seule (motif_prix, `confidence<0.7 → dashboard`), jamais d'auto-OTA.

## 2. Verdict global récupérer vs réécrire

> Ce registre = OSS statique (récupérer vs réécrire, licences).
> `docs/registres/teardowns-rea.md` = comportement concurrentiel côté
> client (parité + dépassement, clean-room §S9, lab seul, 0 code pompé).
> Les deux se complètent : OSS = briques à récupérer, REA = fonctions à
> comprendre puis rebuild maison. Règle commune : jamais de copier-coller
> (R-09 + §S9).

- RÉCUPÉRER tel quel : KeyMaster si Z-Wave, sinon patterns Nuki adaptés (T-02, réserve 2026-10-14) pour PIN séjour ; catalogues i18n/outillage e-facture si MIT/Apache.
- PILOTER en lab avant choix : QloApps comme `moteur_direct` Phase 1 (T-01, AFL-3.0 permissive vérifiée — pilote allégé juridiquement, audit avant fork) ; ERPNext+Hospitality si compta native requise (T-04).
- ACHETER plutôt que réécrire : Vik Channel Manager (~249 €/an) si 2-way OTA un jour (T-03).
- RÉÉCRIRE maison (déjà fait en lab) : gateway `:8443` + outbox idempotente + WG + SQLite parc.db + pricing clamp + ICS anti-double-résa + front 8 dashboards — aucun OSS ne fait ce tout (offline-first box + multi-tenant FR + 1-tap tracé).
- NE JAMAIS copier-coller : HotelDruid/Vik/ERPNext/Odoo (GPL) dans repo privé/client sans audit — inspiration fonctionnelle seule (R-09). QloApps = AFL-3.0 permissive : reprise possible avec attribution + conservation de licence, audit avant fork.

## 3. Complément REA — radar concurrentiel (ne pas confondre)

> Ce registre = OSS statique (récupérer vs réécrire, licences).
> `docs/registres/teardowns-rea.md` = comportement concurrentiel côté
> client (parité + dépassement, clean-room §S9, lab seul, 0 code pompé).
> Les deux se complètent : OSS = briques à récupérer, REA = fonctions à
> comprendre puis rebuild maison. Règle commune : jamais de copier-coller
> (R-09 + §S9).
