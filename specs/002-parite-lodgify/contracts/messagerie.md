# Contrat — Messagerie unifiée

**Ports**: `messages-voyageur-repository.ts`, `email.ts`, `sms.ts`, `llm.ts`
**Statut**: proposition.

## 1. Modèle de fil

```ts
export interface FilVoyageur {
  id: string;
  tenantId: string;
  reservationId: string | null;
  canalPrincipal: "ota" | "email" | "sms" | "whatsapp" | "interne";
  externalThreadId: string | null;
  participants: Participant[];
  statut: "ouvert" | "en_attente" | "resolu" | "archive";
  assigneA: string | null;
  dernierMessageAt: string | null;
}

export interface MessageVoyageur {
  id: string;
  filId: string;
  tenantId: string;
  auteur: "voyageur" | "staff" | "systeme" | "ia";
  canal: "ota" | "email" | "sms" | "whatsapp" | "interne";
  externalId: string | null;
  contenu: string;
  piecesJointes: PieceJointe[];
  statutLivraison: "recu" | "brouillon" | "envoye" | "echec";
  luAt: string | null;
  createdAt: string;
}
```

## 2. Règles de regroupement

- Un fil par réservation quand elle existe.
- Sans réservation : un fil par `(tenant, email)` ou `(tenant, téléphone)`.
- Jamais de fusion automatique sur simple homonyme.
- Un message OTA arrive avec `externalThreadId` ; s'il correspond à une
  réservation connue, il rejoint son fil.
- Un email entrant est rattaché par `In-Reply-To`, puis par expéditeur, puis
  créé en fil orphelin.
- Un SMS est rattaché par numéro normalisé E.164.

## 3. Ports

```ts
export interface CanalMessage {
  code: "ota" | "email" | "sms" | "whatsapp";
  envoyer(entree: EnvoiMessage): Promise<MessageEnvoye>;
  recevoir?(payload: unknown): Promise<MessageRecu[]>;
}

export interface EnvoiMessage {
  tenantId: string;
  filId: string;
  destinataire: string;
  sujet?: string;
  contenu: string;
  piecesJointes?: PieceJointe[];
  metadata?: Record<string, string>;
}
```

## 4. Automatisations

| déclencheur | moment | exemple |
| --- | --- | --- |
| `reservation_confirmee` | immédiat | confirmation + guide |
| `j_moins_7` | J-7 10:00 | demande d'heure d'arrivée |
| `j_moins_1` | J-1 10:00 | instructions d'accès |
| `depart` | jour J 08:00 | rappel check-out |
| `j_plus_1` | J+1 10:00 | demande d'avis |
| `avis` | réception | remerciement |

Règles :

- Mode `brouillon` par défaut.
- `auto` nécessite une activation explicite + un test réussi.
- Une exécution est unique par `(automatisation, réservation)`.
- Les variables sont échappées ; aucun contenu utilisateur n'est interprété.
- Les heures sont dans le fuseau du logement.
- Un opt-out SMS/WhatsApp annule l'envoi et journalise.

## 5. IA

- Contexte : réservation, logement, guide, historique du fil, langue.
- Sortie : brouillon, jamais envoi direct.
- Le staff peut éditer, régénérer, ignorer.
- Chaque génération est auditée (modèle, tokens, coût, utilisateur).
- Aucune donnée d'un autre tenant dans le prompt.
- Les données sensibles (carte, pièce d'identité) sont masquées.

## 6. Webhooks et workers

- Un message entrant crée un événement, traité par un worker.
- Retry 3 fois, puis `erreur` visible.
- Le compteur de non-lus est mis à jour.
- Une notification est créée pour le staff assigné.

## 7. Critères de contrat

- [ ] Message OTA sandbox → fil de la réservation.
- [ ] Email entrant → même fil.
- [ ] SMS sortant tracé.
- [ ] Scénario J-1 → brouillon, pas d'envoi auto.
- [ ] Validation humaine → envoi + audit.
- [ ] Opt-out respecté.
- [ ] Aucun message d'un autre tenant visible.
