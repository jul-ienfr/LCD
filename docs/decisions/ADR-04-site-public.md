# ADR-04 — Site public et domaine

- **Statut** : Proposé — à signer en L0
- **Date** : 2026-11-06
- **Décideur** : fondateur LCD
- **Feature** : `specs/002-parite-lodgify`
- **Portée** : mini-builder, templates, pages, domaine, widget, SEO

## Contexte

LCD a une vitrine unique, six thèmes et cinq langues. Lodgify a un builder
no-code, des pages illimitées, un blog, un domaine par tenant, 32 langues, un
widget et Google Vacation Rentals. Le site direct est le seul canal sans
commission.

Un builder complet est un produit à part entière. La valeur tient d'abord dans
une page logement crédible, un domaine, un tunnel qui encaisse et un SEO propre.

## Décision proposée

**Mini-builder maison** : 3 templates (séjour, océan, sable), 4 types de pages
(accueil, logement, région, contact), 7 blocs (hero, galerie, description,
équipements, carte, avis, CTA), 6 langues, widget iframe, domaine personnalisé.
**Pas de blog, pas de thèmes infinis, pas de 32 langues.**

## Options évaluées

| option | effort | SEO | tunnel | maintenance | verdict |
| --- | --- | --- | --- | --- | --- |
| **Mini-builder** | moyen | maîtrisé | intégré | moyenne | **recommandé** |
| Builder complet | très élevé | maîtrisé | intégré | élevée | rejeté |
| Partenaire Wix/Squarespace | faible | dépendant | externe | faible | rejeté |
| Vitrine actuelle | nul | faible | limité | faible | repli |

## Critères de décision

1. Rendu sans JavaScript obligatoire (constitution II).
2. Page logement + tunnel de réservation + paiement.
3. Domaine par tenant, HTTPS, redirection canonique.
4. SEO : title/meta, OG, sitemap, JSON-LD, hreflang.
5. Édition par un non-technicien.
6. Six langues, repli fr.
7. Widget sur WordPress/Wix/Squarespace.
8. Coût et maintenance raisonnables.

## Conséquences

- Nouvelle table `sites_tenants` (le `parametres_site` actuel est global).
- Les thèmes globaux existants servent d'inspiration, pas de racine tenant.
- Le blog et les 32 langues restent hors périmètre ; documenté au client.
- Le widget est un iframe, sans cookie tiers.
- Le domaine échoué retombe sur le sous-domaine LCD, avec erreur explicite.
- Le tunnel peut charger Stripe.js ; le reste reste HTML-first.

## Preuves à joindre avant signature

- [ ] Site publié sur domaine de test, HTTPS valide — BLOQUÉ : exige un domaine
      réellement délégué et un certificat. La vérification DNS TXT, l'activation
      et le refus d'un domaine non vérifié sont, eux, testés
      (`v2/tests/lib/domaine-dns.test.ts`).
- [x] Page logement lisible sans JS — `v2/e2e/site-public.spec.ts` (3 tests
      `javaScriptEnabled: false`).
- [x] Sitemap et JSON-LD valides — même fichier.
- [ ] Widget fonctionnel sur une page externe — BLOQUÉ : nécessite un site tiers
      réel. Le contrat est vérifié localement (`/api/widget` 200, 404 sur tenant
      inconnu, CSP `frame-ancestors *`).
- [x] Six langues avec repli fr — `v2/tests/lib/i18n-site.test.ts`.
- [ ] Lighthouse mobile ≥ 90 (hors tunnel) — non mesuré à ce jour.

## Réserve de routage connue

Le routage d'un domaine personnalisé vers le site du tenant n'est pas
implémenté : SvelteKit résout la route avant d'exécuter `handle`, donc la
réécriture d'URL depuis le hook a lieu trop tard. La résolution par `Host` doit
être faite en amont (proxy) ou via un `reroute` de build. Tant que ce point
n'est pas tranché, T209 reste partiel : création, vérification, activation et
suppression d'un domaine fonctionnent, mais le domaine activé ne sert pas encore
le site.

## Plan de retrait

1. Désactiver le flag `site_paiement`.
2. Conserver les pages et domaines en lecture.
3. Revenir à la vitrine unique.
4. Documenter la perte de SEO et prévenir les clients.

## Références

- `specs/002-parite-lodgify/contracts/site-public.md`
- `specs/002-parite-lodgify/data-model.md` §2.2
