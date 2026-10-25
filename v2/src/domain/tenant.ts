// Domaine pur : aucun import Next, Drizzle, Stripe, Brevo ou autre.
// Les types et règles ici doivent rester testables sans base ni réseau.

import type {
  NatureEntite,
  RegimeEntite,
  TvaEntite,
} from "./entite";

export type TenantId = string;

export type StatutTenant = "actif" | "suspendu" | "archive";

export interface Tenant {
  id: TenantId;
  slug: string;
  nom: string;
  nature: NatureEntite;
  regime: RegimeEntite;
  tva: TvaEntite;
  siren: string | null;
  adresse: string | null;
  mentionsLegales: string | null;
  statut: StatutTenant;
  createdAt: Date;
  updatedAt: Date;
}

export function slugValide(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(slug);
}
