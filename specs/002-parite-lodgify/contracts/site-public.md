# Contrat — Site public et widget

**Routes cibles**: `/site/[slug]`, `/site/[slug]/[page]`, `/reserver`, `/api/widget`
**Statut**: proposition.

## 1. Routes publiques

| route | rendu | JS |
| --- | --- | --- |
| `/site/[slug]` | accueil du tenant | aucun JS obligatoire |
| `/site/[slug]/logement/[id]` | page logement | aucun JS obligatoire |
| `/site/[slug]/region/[slug]` | page région | aucun JS obligatoire |
| `/site/[slug]/contact` | formulaire | aucun JS obligatoire |
| `/reserver` | tunnel | JS îlot pour Stripe uniquement |
| `/api/widget` | configuration du widget | JSON |
| `/api/sitemap/[tenant]` | sitemap | XML |

## 2. Modèle de page

```ts
export interface PagePublique {
  slug: string;
  type: "accueil" | "logement" | "region" | "contact";
  template: "sejour" | "ocean" | "sable";
  seo: { title: string; description: string; ogImage?: string };
  sections: SectionPublique[];
}

export type SectionPublique =
  | { type: "hero"; titre: string; sousTitre?: string; image?: string; cta?: Cta }
  | { type: "galerie"; images: string[] }
  | { type: "description"; titre?: string; html: string }
  | { type: "equipements"; items: string[] }
  | { type: "carte"; latitude: number; longitude: number; adresse?: string }
  | { type: "avis"; limite: number }
  | { type: "cta"; titre: string; texte?: string; lien: string };
```

## 3. Rendu

- `csr = false` sur toutes les routes publiques.
- HTML sémantique, images `srcset`, `loading="lazy"` hors hero.
- Aucune police bloquante ; Tailwind 4.
- Le tunnel `/reserver` peut charger Stripe.js, mais le formulaire de dates et
  le récapitulatif fonctionnent sans JS.
- Le widget est un iframe + un script de resize, sans cookie tiers.

## 4. SEO

- `title`, `meta description`, canonical, Open Graph.
- JSON-LD `LodgingBusiness` avec adresse, géo, prix, images.
- Sitemap par tenant, `robots.txt` par domaine.
- URLs localisées : `/fr/...`, `/en/...` ou paramètre `?lang=`.
- `hreflang` pour les six langues.
- Pages brouillon en `noindex`.

## 5. Domaine

- Le tenant déclare `domaine` dans `parametres_site`.
- Vérification DNS (CNAME ou TXT), statut dans `domaines`.
- TLS via Caddy on-demand ou certificat manuel documenté.
- Si le domaine échoue, le site reste servi sur `slug.lcd.example`.
- Redirection 301 de `www` vers apex (ou inverse, configurable).

## 6. Widget

```html
<script src="https://lcd.example/widget.js"
        data-tenant="slug"
        data-logement="id"
        data-langue="fr"></script>
```

- iframe vers `/reserver?embed=1&tenant=...`.
- Hauteur ajustée par `postMessage`.
- Aucun accès au DOM parent.
- Fonctionne sur WordPress, Wix, Squarespace.

## 7. Promotions

- Appliquées côté serveur, jamais seulement côté client.
- Vérification : code, dates, logement, nuits min, cumul.
- Le prix barré et le motif sont affichés.
- Une promotion expirée ne casse pas le tunnel.

## 8. Critères de contrat

- [ ] Site publié sur domaine de test, HTTPS valide.
- [ ] Page logement lisible sans JS.
- [ ] Sitemap et JSON-LD valides.
- [ ] Widget fonctionnel sur une page externe.
- [ ] Six langues avec repli fr.
- [ ] Score Lighthouse mobile ≥ 90 en performance/SEO (hors tunnel).
