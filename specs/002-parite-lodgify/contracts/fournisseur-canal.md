# Contrat — Fournisseur de distribution

**Port**: `v2/src/application/ports/fournisseur-canal.ts`
**Adapter cible**: `v2/src/infrastructure/adapters/beds24/` ou `channex/`
**Statut**: proposition, à valider en sandbox L0/L1.

## 1. Interface étendue

```ts
export interface FournisseurCanal {
  readonly code: CodeFournisseur;
  readonly mode: ModeFournisseur;
  readonly capacites: CapacitesFournisseur;

  testerConnexion(): Promise<ResultatTestFournisseur>;
  listerLogements(): Promise<LogementExterne[]>;

  recupererReservations(
    depuis: string,
    jusqua: string,
    externalPropertyId?: string,
  ): Promise<ReservationExterne[]>;

  pousserDisponibilites(changements: readonly DisponibiliteJour[]): Promise<void>;
  pousserTarifs(tarifs: readonly TarifJour[]): Promise<void>;
  pousserRestrictions(restrictions: readonly RestrictionJour[]): Promise<void>;

  verifierWebhook(entree: EntreeWebhook): Promise<boolean>;

  // Extensions 002
  lireSante?(): Promise<SanteConnexion>;
  lireMessages?(externalThreadId: string): Promise<MessageExterne[]>;
  envoyerMessage?(entree: EnvoiMessageExterne): Promise<MessageExterne>;
}

export interface CapacitesFournisseur {
  reservation: boolean;
  disponibilite: boolean;
  tarif: boolean;
  restriction: boolean;
  webhook: boolean;
  messaging: boolean;
  multiUnite: boolean;
  googleVr: boolean;
}

export interface SanteConnexion {
  ok: boolean;
  dernierPushAt: string | null;
  dernierPullAt: string | null;
  latenceMs: number | null;
  erreurs: Array<{ code: string; message: string; at: string }>;
}
```

## 2. Payloads sortants

### Disponibilité

```json
{
  "externalPropertyId": "prop_123",
  "externalRoomTypeId": "room_1",
  "date": "2026-12-24",
  "disponible": false
}
```

### Tarif

```json
{
  "externalPropertyId": "prop_123",
  "externalRoomTypeId": "room_1",
  "externalRatePlanId": "rate_std",
  "date": "2026-12-24",
  "prixCentimes": 18500,
  "devise": "EUR"
}
```

### Restriction

```json
{
  "externalPropertyId": "prop_123",
  "date": "2026-12-24",
  "sejourMin": 3,
  "sejourMax": 14,
  "arriveeAutorisee": true,
  "departAutorisee": false,
  "stopSell": false
}
```

## 3. Réservation entrante

```json
{
  "externalId": "BK-9981",
  "externalPropertyId": "prop_123",
  "externalRoomTypeId": "room_1",
  "reference": "AIRBNB-HMXY2",
  "arrivee": "2026-12-24",
  "depart": "2026-12-31",
  "statut": "confirmee",
  "clientNom": "Jane Doe",
  "clientEmail": "jane@example.com",
  "montantCentimes": 129500,
  "devise": "EUR"
}
```

## 4. Règles d'idempotence

- Clé : `(fournisseur, external_id)`.
- Webhook rejoué : `evenements_canal.external_id` unique, statut `traite`
  renvoyé sans réécriture.
- Polling et webhook en course : la réservation est créée une fois, la seconde
  source met à jour si le payload est plus récent.
- Annulation puis recréation avec le même `external_id` : nouveau statut, pas
  de nouvelle réservation.

## 5. Gestion des erreurs

| code | comportement |
| --- | --- |
| 401/403 | marquer la connexion `erreur`, alerter, ne pas réessayer en boucle |
| 404 | mapping invalide, marquer `degrade`, ticket |
| 409 | conflit de disponibilité, relire l'état, rejouer une fois |
| 429 | backoff exponentiel + jitter, conserver la demande |
| 5xx | retry 3 fois, puis `erreur` et alerte |
| timeout | retry, puis file d'attente |

## 6. Webhook

- Vérification de signature obligatoire (`verifierWebhook`).
- Réponse 202 en moins de 2 s ; mise en file `demandes_sync`, traitement par
  scheduler ou cron. Aucune synchronisation dans la requête webhook.
- Un webhook non vérifié est rejeté 401.
- Les reçus sont journalisés dans `evenements_canal` (métadonnées + empreinte,
  jamais le corps brut) avant mise en file.

## 7. Critères de contrat

- [ ] Un push de 30 jours de dispo/prix/restriction passe en une requête
      batchée ou un nombre documenté d'appels.
- [ ] Un webhook signé crée la réservation ; un webhook rejoué ne duplique pas.
- [ ] Une annulation libère les nuits et met à jour le canal.
- [ ] Un 429 est absorbé sans perte.
- [ ] Le mapping multi-unités est explicite.
- [ ] Le plan de retrait est documenté (export des mappings, désactivation).
