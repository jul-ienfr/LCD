# Débloquer les tâches externes (état 2026-11-10)

Le code de la v2 est à parité sur tout ce qui est exécutable sans comptes
externes. Les tâches encore ouvertes dans
`specs/002-parite-lodgify/tasks.md` demandent un accès, un contrat ou une
signature. Ce runbook liste l'entrée exacte nécessaire et la preuve attendue.

## 1. Distribution temps réel — Beds24 / Channex

**Tâches** : T001, T002, T113, T114, T126, T127, T414.

Variables à fournir (`.env.local`, jamais commitées) :

```dotenv
BEDS24_API_BASE=https://api.beds24.com/v2
BEDS24_API_TOKEN=...
BEDS24_REFRESH_TOKEN=...
BEDS24_WEBHOOK_SECRET=...
BEDS24_PROPERTY_ID=...
BEDS24_ROOM_ID=...
SANDBOX_TESTS=1
```

Procédure :

1. Créer le compte sandbox et remplir `docs/decisions/benchmark-grille.md` §1.
2. Lancer `npm run db:test-mappings` puis les contrats :
   `npx vitest run tests/contract/beds24-ari.test.ts tests/contract/beds24-booking.test.ts`.
3. Renseigner un logement de test avec `externalRoomTypeId`, puis exécuter
   `npx playwright test e2e/canaux-temps-reel.spec.ts --project=js`.
4. Double-run 14 jours : suivre `docs/runbooks/distribution-temps-reel.md` et
   archiver la preuve « 0 surbooking ».
5. Seulement ensuite signer l'ADR-01 et clore le gate T414 après 30 jours de
   données réelles.

## 2. Paiement — Stripe test

**Tâches** : T003, T229, T908.

```dotenv
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Preuve attendue : une réservation directe payée de bout en bout sur un domaine
de test, webhook signé rejoué sans doublon, puis
`npx playwright test e2e/paiement.spec.ts --project=js`.

## 3. Inbox — IMAP / OTA / WhatsApp

**Tâches** : T306, T307, T309.

- **IMAP** : fournir une boîte dédiée (`IMAP_URL`, `IMAP_USER`, `IMAP_PASSWORD`,
  `IMAP_BOITE`) et un message réel avec `In-Reply-To` + pièce jointe.
  L'adaptateur d'entrée devra être écrit après validation du fournisseur.
- **OTA** : compte partenaire (Beds24/Channex messaging) et preuve d'un envoi
  et d'une réception.
- **WhatsApp** : compte Meta Business, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`,
  modèles approuvés.

Tant que ces accès manquent, `canal-message.ts` lève explicitement
`CANAL_INDISPONIBLE` et ne simule aucun envoi.

## 4. Swikly

**Tâche** : T713. Fournir le contrat, l'endpoint sandbox et les identifiants
(`SWIKLY_API_URL`, `SWIKLY_API_KEY`). La caution interne reste la solution par
défaut.

## 5. Décisions et gates humains

| Tâche | Entrée nécessaire | Preuve |
| --- | --- | --- |
| T001–T004 | benchmarks sandbox | grille remplie |
| T005–T010 | avis juridique/comptable, signatures | ADR + budget signés |
| T514 | un propriétaire réel et son accord | relevé envoyé |
| T718 | 3 intégrations live | captures/IDs fournisseur |
| T810–T811 | une conciergerie pilote | chrono < 1 jour |
| T907–T908 | scénarios 1–5 ci-dessus | revue de sortie |

Après chaque déblocage, relancer `npm run check`, `npm test`, le contrat
concerné et l'e2e ciblé, puis mettre à jour
`specs/002-parite-lodgify/tasks.md` avec la preuve.
