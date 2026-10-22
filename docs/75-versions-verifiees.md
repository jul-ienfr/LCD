# 75 - Versions deployees (genere)

**Genere le** : 2026-10-23 00:16 par `deploy/versions.ps1`.
**Ne pas editer a la main** : `-Accepter` enregistre un changement **voulu**, avec sa date.

Ce document dit ce qui tourne **vraiment**, pas ce que le depot demande : l'identifiant
d'image execute est la seule preuve qu'un rebuild n'a pas change le service en douce.

| Service | Image demandee | Image EXECUTEE | Conteneur cree le |
|---|---|---|---|
| web | `lcd-deploy-web` | `ad1e96d8b791` | 2026-10-22T22:16 |
| authelia | `authelia/authelia:4.39.28` | `b44a326fced1` | 2026-10-22T22:16 |
| caddy | `caddy:2-alpine` | `f77f856a30f0` | 2026-10-22T22:16 |

## Verification

`deploy/versions.ps1 -Verifier` : sort en **code 1** des qu'un identifiant differe du
document - une mise a jour subie n'est pas une mise a jour acceptee. Le geste d'acceptation
est `-Accepter`, qui reecrit le document et laisse la trace.
