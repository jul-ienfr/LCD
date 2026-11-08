# Contrat — API publique v1

**Base**: `/api/v1`
**Auth**: `Authorization: Bearer lcd_...`
**Statut**: proposition.

## 1. Authentification

- Clé créée dans `/hote/integrations/api`.
- Format : `lcd_<prefixe>_<secret>` ; seul le hash est stocké.
- Scopes : `logements:read`, `reservations:read`, `disponibilites:read`,
  `prix:read`, `proprietaires:read`.
- Rate limit : 120 requêtes/minute par clé, en-têtes `X-RateLimit-*`.
- Révocation immédiate ; journal d'usage.

## 2. Endpoints

| méthode | route | scope | description |
| --- | --- | --- | --- |
| GET | `/api/v1/logements` | `logements:read` | liste paginée |
| GET | `/api/v1/logements/:id` | `logements:read` | détail |
| GET | `/api/v1/reservations` | `reservations:read` | filtres `depuis`, `jusqua`, `statut`, `canal` |
| GET | `/api/v1/reservations/:id` | `reservations:read` | détail |
| GET | `/api/v1/disponibilites` | `disponibilites:read` | `logementId`, `depuis`, `jusqua` |
| GET | `/api/v1/prix` | `prix:read` | `logementId`, `depuis`, `jusqua` |
| GET | `/api/v1/proprietaires` | `proprietaires:read` | liste |
| GET | `/api/v1/releves` | `proprietaires:read` | relevés publiés |

Pas d'écriture en v1. Une écriture nécessitera une v2 et un audit renforcé.

## 3. Pagination

```json
{
  "data": [],
  "meta": { "page": 1, "parPage": 50, "total": 123 },
  "links": { "next": "/api/v1/reservations?page=2" }
}
```

- `parPage` max 100.
- Curseur `cursor` pour les gros volumes (optionnel).

## 4. Erreurs

```json
{
  "error": {
    "code": "scope_insuffisant",
    "message": "La clé ne possède pas le scope reservations:read.",
    "requestId": "req_..."
  }
}
```

| code HTTP | code métier |
| --- | --- |
| 401 | `cle_invalide` |
| 403 | `scope_insuffisant` |
| 404 | `ressource_introuvable` |
| 429 | `rate_limit` |
| 500 | `erreur_interne` |

## 5. Webhooks

Événements :

- `reservation.creee`, `reservation.modifiee`, `reservation.annulee`
- `message.recu`, `message.envoye`
- `paiement.reussi`, `paiement.rembourse`
- `releve.envoye`
- `tache.assignee`

Payload :

```json
{
  "id": "evt_...",
  "type": "reservation.creee",
  "tenantId": "ten_...",
  "createdAt": "2026-11-06T10:00:00Z",
  "data": { "reservationId": "res_..." }
}
```

- Signature `X-LCD-Signature: t=...,v1=HMAC_SHA256(secret, t + "." + body)`.
- Retry : 5 tentatives, backoff 1 min, 5 min, 30 min, 2 h, 12 h.
- Rejeu manuel depuis l'interface.
- Un webhook échoué 5 fois passe en `desactive` avec alerte.

## 6. Documentation

- OpenAPI 3.1 dans `specs/002-parite-lodgify/contracts/openapi.yaml` (à générer).
- Exemples cURL pour chaque endpoint.
- Page publique `/developpeurs`.

## 7. Critères de contrat

- [ ] Clé valide → données du seul tenant.
- [ ] Clé d'un autre tenant → 404, jamais de fuite.
- [ ] Scope manquant → 403.
- [ ] Rate limit → 429 avec `Retry-After`.
- [ ] Webhook signé, rejouable, retry.
- [ ] OpenAPI valide et publié.
