import { sql } from "drizzle-orm";
import type { LanguePublique, SeoPage } from "@/domain/page-publique";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Toutes les tables métier portent tenant_id. Les index composites
// (tenant_id, ...) sont posés dès le départ : la multi-tenance n'est pas
// ajoutée après coup.
// Les migrations sont générées dans ./drizzle et ne sont jamais éditées
// après application (voir docs/78 §15).

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    nom: text("nom").notNull(),
    nature: text("nature").notNull().default("nom_propre"),
    regime: text("regime").notNull().default("micro_bic_non_classe"),
    tva: text("tva").notNull().default("non"),
    siren: text("siren"),
    adresse: text("adresse"),
    mentionsLegales: text("mentions_legales"),
    statut: text("statut").notNull().default("actif"),
    ventesSuspendues: boolean("ventes_suspendues").notNull().default(false),
    ventesSuspenduesMotif: text("ventes_suspendues_motif"),
    ventesSuspenduesLe: timestamp("ventes_suspendues_le", {
      withTimezone: true,
    }),
    lectureSeule: boolean("lecture_seule").notNull().default(false),
    // Flags de modules par tenant (spec 006, T011) : lus par
    // `feature-flags.ts`, modifiés par le super-admin sans redéploiement.
    flags: jsonb("flags").$type<Record<string, boolean>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("tenants_slug_uq").on(t.slug)],
);

// Table utilisateur compatible Better Auth (id texte, name, emailVerified,
// image, twoFactorEnabled) + champs métier (tenantId, role, actif).
// L'email est unique globalement : un compte = un utilisateur, même s'il
// change de tenant plus tard (le tenant est une propriété du compte).
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
    role: text("role").notNull().default("operateur"),
    actif: boolean("actif").notNull().default(true),
    rcExpireLe: date("rc_expire_le", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("users_email_uq").on(t.email),
    index("users_tenant_idx").on(t.tenantId),
  ],
);

export const logements = pgTable(
  "logements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    nom: text("nom").notNull(),
    adresse: text("adresse"),
    checkinHeure: text("checkin_heure"),
    checkinInstructions: text("checkin_instructions"),
    wifiSsid: text("wifi_ssid"),
    wifiPassword: text("wifi_password"),
    regles: text("regles"),
    urgenceTel: text("urgence_tel"),
    guideTexte: text("guide_texte"),
    guideLangueDefaut: text("guide_langue_defaut").notNull().default("fr"),
    guidePartenaireNom: text("guide_partenaire_nom"),
    guidePartenaireUrl: text("guide_partenaire_url"),
    coproVerifiee: boolean("copro_verifiee").notNull().default(false),
    coproVerifieeLe: timestamp("copro_verifiee_le", { withTimezone: true }),
    cutoffJours: integer("cutoff_jours").notNull().default(0),
  bufferJours: integer("buffer_jours").notNull().default(0),
    publication: text("publication").notNull().default("brouillon"),
    strategiePrix: text("strategie_prix").notNull().default("equilibre"),
    statut: text("statut").notNull().default("actif"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("logements_tenant_code_uq").on(t.tenantId, t.code),
    index("logements_tenant_statut_idx").on(t.tenantId, t.statut),
  ],
);

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "restrict" }),
    ref: text("ref").notNull(),
    clientNom: text("client_nom"),
    clientEmail: text("client_email"),
    voyageurs: integer("voyageurs").notNull().default(1),
    debut: text("debut").notNull(), // AAAA-MM-JJ
    fin: text("fin").notNull(), // AAAA-MM-JJ, exclusive
    statut: text("statut").notNull().default("brouillon"),
    montantCentimes: integer("montant_centimes").notNull().default(0),
    source: text("source").notNull().default("direct"),
    departConfirmeLe: timestamp("depart_confirme_le", { withTimezone: true }),
    departNote: text("depart_note"),
    fluxIcsId: uuid("flux_ics_id").references(() => fluxIcs.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("reservations_tenant_ref_uq").on(t.tenantId, t.ref),
    index("reservations_tenant_debut_idx").on(t.tenantId, t.debut),
    index("reservations_logement_idx").on(t.logementId, t.debut, t.fin),
    index("reservations_flux_ics_idx").on(t.fluxIcsId),
  ],
);

export const blocages = pgTable(
  "blocages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(),
    debut: text("debut").notNull(),
    fin: text("fin").notNull(),
    source: text("source").notNull().default("import-ics"),
    motif: text("motif"),
    fluxIcsId: uuid("flux_ics_id").references(() => fluxIcs.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("blocages_tenant_ref_uq").on(t.tenantId, t.ref),
    index("blocages_tenant_logement_idx").on(
      t.tenantId,
      t.logementId,
      t.debut,
      t.fin,
    ),
    index("blocages_flux_ics_idx").on(t.fluxIcsId),
  ],
);

export const canaux = pgTable(
  "canaux",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    libelle: text("libelle").notNull(),
    cle: text("cle").notNull(),
    externalListingId: text("external_listing_id"),
    actif: boolean("actif").notNull().default(true),
    exportActif: boolean("export_actif").notNull().default(true),
    bufferJours: integer("buffer_jours").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("canaux_tenant_logement_cle_uq").on(
      t.tenantId,
      t.logementId,
      t.cle,
    ),
    index("canaux_tenant_logement_idx").on(t.tenantId, t.logementId),
  ],
);

// Registre plateforme des fournisseurs de channel manager. Aucun tenant_id :
// seul le super-admin active ou désactive un fournisseur pour toute la plateforme.
export const fournisseursCanaux = pgTable("fournisseurs_canaux", {
  code: text("code").primaryKey(),
  actif: boolean("actif").notNull().default(false),
  ordre: integer("ordre").notNull().default(100),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  updatedBy: text("updated_by"),
});

// Fournisseur réellement utilisé pour un logement. Un seul fournisseur actif
// par logement ; le super-admin peut le changer sans toucher aux canaux iCal.
export const logementsFournisseurs = pgTable(
  "logements_fournisseurs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    fournisseurCode: text("fournisseur_code")
      .notNull()
      .references(() => fournisseursCanaux.code, { onDelete: "restrict" }),
    externalPropertyId: text("external_property_id"),
    externalRoomTypeId: text("external_room_type_id"),
    externalRatePlanId: text("external_rate_plan_id"),
    actif: boolean("actif").notNull().default(true),
    derniereSync: timestamp("derniere_sync", { withTimezone: true }),
    dernierStatut: text("dernier_statut"),
    dernierMessage: text("dernier_message"),
    derniereEmpreinte: text("derniere_empreinte"),
    // Disjoncteur (spec 006, FR-023) : compteur d'échecs consécutifs et
    // horodatage de la pause automatique. `disjoncteurOuvertLe` non nul =
    // l'affectation a été mise en pause par le disjoncteur, pas par un humain.
    echecsConsecutifs: integer("echecs_consecutifs").notNull().default(0),
    disjoncteurOuvertLe: timestamp("disjoncteur_ouvert_le", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("logements_fournisseurs_logement_uq").on(t.logementId),
    uniqueIndex("logements_fournisseurs_externe_uq").on(
      t.fournisseurCode,
      t.externalPropertyId,
    ),
    index("logements_fournisseurs_tenant_idx").on(t.tenantId),
    index("logements_fournisseurs_code_idx").on(t.fournisseurCode),
  ],
);

export const demandesSync = pgTable(
  "demandes_sync",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    revision: integer("revision").notNull().default(1),
    tentatives: integer("tentatives").notNull().default(0),
    disponibleA: timestamp("disponible_a", { withTimezone: true })
      .notNull()
      .defaultNow(),
    derniereErreur: text("derniere_erreur"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("demandes_sync_tenant_logement_uq").on(
      t.tenantId,
      t.logementId,
    ),
    index("demandes_sync_disponible_idx").on(t.disponibleA),
    index("demandes_sync_tenant_idx").on(t.tenantId),
  ],
);

// Journal des événements reçus d'un fournisseur de distribution (webhook,
// erreur de push…). Il sert à l'audit et au rejeu, jamais à l'état métier :
// la réservation reste la source de vérité.
export const evenementsCanal = pgTable(
  "evenements_canal",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementFournisseurId: uuid("logement_fournisseur_id")
      .notNull()
      .references(() => logementsFournisseurs.id, { onDelete: "cascade" }),
    fournisseurCode: text("fournisseur_code")
      .notNull()
      .references(() => fournisseursCanaux.code, { onDelete: "restrict" }),
    type: text("type").notNull(),
    externalId: text("external_id"),
    cleIdempotence: text("cle_idempotence").notNull(),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    statut: text("statut").notNull().default("recu"),
    message: text("message"),
    traiteAt: timestamp("traite_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("evenements_canal_cle_uq").on(t.cleIdempotence),
    index("evenements_canal_tenant_date_idx").on(t.tenantId, t.createdAt),
    index("evenements_canal_mapping_date_idx").on(
      t.logementFournisseurId,
      t.createdAt,
    ),
    index("evenements_canal_code_date_idx").on(
      t.fournisseurCode,
      t.createdAt,
    ),
    // Purge de rétention (FR-015) : filtre sur la seule date.
    index("evenements_canal_date_idx").on(t.createdAt),
  ],
);

export const fluxIcs = pgTable(
  "flux_ics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    canalId: uuid("canal_id").references(() => canaux.id, {
      onDelete: "cascade",
    }),
    libelle: text("libelle").notNull(),
    url: text("url").notNull(),
    actif: boolean("actif").notNull().default(true),
    intervalleMinutes: integer("intervalle_minutes").notNull().default(5),
    derniereSync: timestamp("derniere_sync", { withTimezone: true }),
    derniereTentative: timestamp("derniere_tentative", { withTimezone: true }),
    prochainEssai: timestamp("prochain_essai", { withTimezone: true }),
    dernierStatut: text("dernier_statut"),
    dernierMessage: text("dernier_message"),
    echecsConsecutifs: integer("echecs_consecutifs").notNull().default(0),
    videsConsecutifs: integer("vides_consecutifs").notNull().default(0),
    etag: text("etag"),
    derniereModification: text("derniere_modification"),
    empreinte: text("empreinte"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("flux_ics_tenant_logement_url_uq").on(
      t.tenantId,
      t.logementId,
      t.url,
    ),
    uniqueIndex("flux_ics_canal_uq").on(t.canalId),
    index("flux_ics_tenant_logement_idx").on(t.tenantId, t.logementId),
    index("flux_ics_prochain_essai_idx").on(t.actif, t.prochainEssai),
  ],
);

export const icsSyncRuns = pgTable(
  "ics_sync_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    fluxIcsId: uuid("flux_ics_id")
      .notNull()
      .references(() => fluxIcs.id, { onDelete: "cascade" }),
    debut: timestamp("debut", { withTimezone: true }).notNull().defaultNow(),
    fin: timestamp("fin", { withTimezone: true }),
    statut: text("statut").notNull(),
    statutHttp: integer("statut_http"),
    dureeMs: integer("duree_ms"),
    evenements: integer("evenements").notNull().default(0),
    crees: integer("crees").notNull().default(0),
    misAJour: integer("mis_a_jour").notNull().default(0),
    annules: integer("annules").notNull().default(0),
    deja: integer("deja").notNull().default(0),
    conflits: integer("conflits").notNull().default(0),
    ignores: integer("ignores").notNull().default(0),
    message: text("message"),
    details: jsonb("details").$type<Record<string, unknown>>(),
  },
  (t) => [
    index("ics_sync_runs_flux_idx").on(t.fluxIcsId, t.debut),
    index("ics_sync_runs_tenant_idx").on(t.tenantId, t.debut),
  ],
);

export const verrousSysteme = pgTable("verrous_systeme", {
  nom: text("nom").primaryKey(),
  titulaire: text("titulaire").notNull(),
  expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
});

// File de jobs durable (spec 006, FR-025). Table plateforme : un job porte son
// tenant dans `payload`. Écriture avant exécution, réclamation à bail
// (`en_cours` + `verrouille_jusqua`), retry avec backoff, `echec` visible en
// supervision. `cle_idempotence` unique (hors NULL) : un rejeu debounce met à
// jour la même ligne au lieu d'en créer une seconde.
export const jobsOutbox = pgTable(
  "jobs_outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nom: text("nom").notNull(),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    cleIdempotence: text("cle_idempotence"),
    statut: text("statut").notNull().default("en_attente"),
    tentatives: integer("tentatives").notNull().default(0),
    tentativesMax: integer("tentatives_max").notNull().default(5),
    disponibleA: timestamp("disponible_a", { withTimezone: true })
      .notNull()
      .defaultNow(),
    verrouilleJusqua: timestamp("verrouille_jusqua", { withTimezone: true }),
    derniereErreur: text("derniere_erreur"),
    termineLe: timestamp("termine_le", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("jobs_outbox_cle_idempotence_uq").on(t.cleIdempotence),
    index("jobs_outbox_statut_disponible_idx").on(t.statut, t.disponibleA),
    index("jobs_outbox_nom_idx").on(t.nom),
  ],
);

export const webhooks = pgTable(
  "webhooks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    libelle: text("libelle").notNull(),
    url: text("url").notNull(),
    secret: text("secret").notNull(),
    events: text("events").notNull(),
    actif: boolean("actif").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("webhooks_tenant_url_uq").on(t.tenantId, t.url),
    index("webhooks_tenant_idx").on(t.tenantId),
  ],
);

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    webhookId: uuid("webhook_id")
      .notNull()
      .references(() => webhooks.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    statut: text("statut").notNull().default("pending"),
    tentatives: integer("tentatives").notNull().default(0),
    prochaineTentative: timestamp("prochaine_tentative", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    dernierCode: integer("dernier_code"),
    dernierMessage: text("dernier_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("webhook_deliveries_due_idx").on(t.statut, t.prochaineTentative),
    index("webhook_deliveries_tenant_idx").on(
      t.tenantId,
      t.createdAt,
    ),
    // Purge de rétention (FR-015) : filtre sur la seule date.
    index("webhook_deliveries_date_idx").on(t.createdAt),
  ],
);

export const plansTarifaires = pgTable(
  "plans_tarifaires",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    nom: text("nom").notNull(),
    code: text("code").notNull(),
    externalRatePlanId: text("external_rate_plan_id"),
    mode: text("mode").notNull().default("independant"),
    ajustementPourcentage: integer("ajustement_pourcentage")
      .notNull()
      .default(0),
    heriteRestrictions: boolean("herite_restrictions").notNull().default(true),
    priorite: integer("priorite").notNull().default(0),
    actif: boolean("actif").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("plans_tarifaires_tenant_logement_code_uq").on(
      t.tenantId,
      t.logementId,
      t.code,
    ),
    index("plans_tarifaires_tenant_logement_actif_idx").on(
      t.tenantId,
      t.logementId,
      t.actif,
    ),
  ],
);

export const tarifs = pgTable(
  "tarifs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    planTarifaireId: uuid("plan_tarifaire_id").references(
      () => plansTarifaires.id,
      { onDelete: "restrict" },
    ),
    date: date("date", { mode: "string" }).notNull(), // AAAA-MM-JJ
    prixCentimes: integer("prix_centimes").notNull(),
    prixParPersonneCentimes: integer("prix_par_personne_centimes"),
    personnesIncluses: integer("personnes_incluses").notNull().default(2),
    source: text("source").notNull().default("manuel"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("tarifs_tenant_logement_date_base_uq")
      .on(t.tenantId, t.logementId, t.date)
      .where(sql`${t.planTarifaireId} is null`),
    uniqueIndex("tarifs_tenant_logement_plan_date_uq")
      .on(t.tenantId, t.logementId, t.planTarifaireId, t.date)
      .where(sql`${t.planTarifaireId} is not null`),
    index("tarifs_tenant_date_idx").on(t.tenantId, t.date),
  ],
);

export const restrictionsSejour = pgTable(
  "restrictions_sejour",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    planTarifaireId: uuid("plan_tarifaire_id").references(
      () => plansTarifaires.id,
      { onDelete: "restrict" },
    ),
    date: date("date", { mode: "string" }).notNull(),
    sejourMin: integer("sejour_min"),
    sejourMax: integer("sejour_max"),
    arriveeAutorisee: boolean("arrivee_autorisee"),
    departAutorisee: boolean("depart_autorisee"),
    stopSell: boolean("stop_sell"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("restrictions_sejour_tenant_logement_date_base_uq")
      .on(t.tenantId, t.logementId, t.date)
      .where(sql`${t.planTarifaireId} is null`),
    uniqueIndex("restrictions_sejour_tenant_logement_plan_date_uq")
      .on(t.tenantId, t.logementId, t.planTarifaireId, t.date)
      .where(sql`${t.planTarifaireId} is not null`),
    index("restrictions_sejour_tenant_date_idx").on(t.tenantId, t.date),
  ],
);

export const extras = pgTable(
  "extras",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id").references(() => logements.id, {
      onDelete: "set null",
    }),
    code: text("code").notNull(),
    nom: text("nom").notNull(),
    description: text("description"),
    prixCentimes: integer("prix_centimes").notNull().default(0),
    actif: boolean("actif").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("extras_tenant_code_uq").on(t.tenantId, t.code),
    index("extras_tenant_actif_idx").on(t.tenantId, t.actif),
  ],
);

export const commandesExtras = pgTable(
  "commandes_extras",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    extraId: uuid("extra_id")
      .notNull()
      .references(() => extras.id, { onDelete: "restrict" }),
    quantite: integer("quantite").notNull().default(1),
    prixUnitaireCentimes: integer("prix_unitaire_centimes").notNull(),
    totalCentimes: integer("total_centimes").notNull(),
    ref: text("ref").notNull(),
    statut: text("statut").notNull().default("demandee"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("commandes_extras_tenant_ref_uq").on(t.tenantId, t.ref),
    index("commandes_extras_tenant_reservation_idx").on(
      t.tenantId,
      t.reservationId,
      t.createdAt,
    ),
    index("commandes_extras_tenant_statut_idx").on(t.tenantId, t.statut),
  ],
);

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    assignedUserId: text("assigned_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reservationId: uuid("reservation_id").references(() => reservations.id, {
      onDelete: "set null",
    }),
    logementId: uuid("logement_id").references(() => logements.id, {
      onDelete: "set null",
    }),
    ref: text("ref").notNull(),
    sujet: text("sujet").notNull(),
    priorite: text("priorite").notNull().default("normale"),
    statut: text("statut").notNull().default("ouvert"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("tickets_tenant_ref_uq").on(t.tenantId, t.ref),
    index("tickets_tenant_statut_idx").on(t.tenantId, t.statut),
    index("tickets_tenant_created_by_idx").on(t.tenantId, t.createdByUserId),
    index("tickets_tenant_assigned_idx").on(t.tenantId, t.assignedUserId),
  ],
);

export const ticketMessages = pgTable(
  "ticket_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    auteurUserId: text("auteur_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    auteurLabel: text("auteur_label").notNull().default("utilisateur"),
    contenu: text("contenu").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ticket_messages_ticket_idx").on(t.ticketId, t.createdAt),
    index("ticket_messages_tenant_idx").on(t.tenantId, t.createdAt),
  ],
);

export const prospects = pgTable(
  "prospects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    nom: text("nom").notNull(),
    email: text("email"),
    telephone: text("telephone"),
    source: text("source").notNull().default("manuel"),
    statut: text("statut").notNull().default("nouveau"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("prospects_tenant_statut_idx").on(t.tenantId, t.statut),
    index("prospects_tenant_email_idx").on(t.tenantId, t.email),
  ],
);

export const offres = pgTable(
  "offres",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    prospectId: uuid("prospect_id")
      .notNull()
      .references(() => prospects.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id").references(() => logements.id, {
      onDelete: "set null",
    }),
    titre: text("titre").notNull(),
    montantCentimes: integer("montant_centimes").notNull().default(0),
    statut: text("statut").notNull().default("brouillon"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("offres_tenant_prospect_idx").on(t.tenantId, t.prospectId),
    index("offres_tenant_statut_idx").on(t.tenantId, t.statut),
  ],
);

export const logementProprietaires = pgTable(
  "logement_proprietaires",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    commissionBp: integer("commission_bp").notNull().default(2000),
    chargesMensuellesCentimes: integer("charges_mensuelles_centimes")
      .notNull()
      .default(0),
    mode: text("mode").notNull().default("mandat_tiers"),
    statut: text("statut").notNull().default("actif"),
    dateDebut: date("date_debut", { mode: "string" }),
    dateFin: date("date_fin", { mode: "string" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("logement_proprietaires_uq").on(
      t.tenantId,
      t.logementId,
      t.userId,
    ),
    index("logement_proprietaires_user_idx").on(t.tenantId, t.userId),
    index("logement_proprietaires_logement_idx").on(
      t.tenantId,
      t.logementId,
    ),
  ],
);

export const missions = pgTable(
  "missions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id").references(() => reservations.id, {
      onDelete: "set null",
    }),
    assignedUserId: text("assigned_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    ref: text("ref").notNull(),
    type: text("type").notNull().default("menage"),
    date: date("date", { mode: "string" }).notNull(),
    heure: text("heure"),
    statut: text("statut").notNull().default("planifiee"),
    notes: text("notes"),
    // Pointage terrain (spec 006, FR-031) : horodatage retenu, source et
    // instant de réception serveur (diffère après un pointage hors ligne).
    dureePrevueMinutes: integer("duree_prevue_minutes"),
    debutReel: timestamp("debut_reel", { withTimezone: true }),
    finReelle: timestamp("fin_reelle", { withTimezone: true }),
    debutReelSource: text("debut_reel_source"),
    finReelleSource: text("fin_reelle_source"),
    debutReelRecuLe: timestamp("debut_reel_recu_le", { withTimezone: true }),
    finReelleRecuLe: timestamp("fin_reelle_recu_le", { withTimezone: true }),
    // Cycle de preuve de l'intervention (spec 006, FR-032/FR-033) : soumise →
    // validée ou refusée (motif obligatoire) → reprise.
    preuveStatut: text("preuve_statut").notNull().default("a_soumettre"),
    preuveMotifRefus: text("preuve_motif_refus"),
    preuveSoumiseLe: timestamp("preuve_soumise_le", { withTimezone: true }),
    preuveValideeLe: timestamp("preuve_validee_le", { withTimezone: true }),
    preuveValideePar: text("preuve_validee_par"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("missions_tenant_ref_uq").on(t.tenantId, t.ref),
    index("missions_tenant_date_idx").on(t.tenantId, t.date),
    index("missions_presta_idx").on(t.tenantId, t.assignedUserId, t.date),
  ],
);

// Historique du cycle de preuve (spec 006, FR-032) : une ligne par passage
// (soumission, validation, refus avec son motif), jamais modifiée.
export const preuvesInterventionTransitions = pgTable(
  "preuves_intervention_transitions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id, { onDelete: "cascade" }),
    de: text("de"),
    vers: text("vers").notNull(),
    motif: text("motif"),
    qui: text("qui").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("preuves_transitions_mission_idx").on(t.tenantId, t.missionId, t.createdAt),
  ],
);

export const preferencesSejour = pgTable(
  "preferences_sejour",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    menageFrequenceJ: integer("menage_frequence_j").notNull().default(0),
    lingeInclus: boolean("linge_inclus").notNull().default(true),
    heureArrivee: text("heure_arrivee"),
    consignes: text("consignes").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("preferences_sejour_tenant_reservation_uq").on(
      t.tenantId,
      t.reservationId,
    ),
  ],
);

export const messagesVoyageur = pgTable(
  "messages_voyageur",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id").references(() => reservations.id, {
      onDelete: "set null",
    }),
    ref: text("ref").notNull(),
    canal: text("canal").notNull().default("email"),
    destinataire: text("destinataire"),
    type: text("type").notNull().default("j1"),
    contenu: text("contenu").notNull(),
    statut: text("statut").notNull().default("brouillon"),
    envoyeAt: timestamp("envoye_at", { withTimezone: true }),
    filId: uuid("fil_id"),
    sens: text("sens").notNull().default("sortant"),
    externalId: text("external_id"),
    expediteur: text("expediteur"),
    luAt: timestamp("lu_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("messages_voyageur_tenant_ref_uq").on(t.tenantId, t.ref),
    index("messages_voyageur_tenant_logement_idx").on(
      t.tenantId,
      t.logementId,
      t.createdAt,
    ),
    index("messages_voyageur_tenant_fil_idx").on(
      t.tenantId,
      t.filId,
      t.createdAt,
    ),
  ],
);

export const filsVoyageur = pgTable(
  "fils_voyageur",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id").references(() => logements.id, {
      onDelete: "set null",
    }),
    reservationId: uuid("reservation_id").references(() => reservations.id, {
      onDelete: "set null",
    }),
    voyageurNom: text("voyageur_nom").notNull(),
    voyageurEmail: text("voyageur_email"),
    voyageurTelephone: text("voyageur_telephone"),
    langue: text("langue").notNull().default("fr"),
    cleRegroupement: text("cle_regroupement").notNull(),
    consentements: jsonb("consentements")
      .$type<{ email: boolean; sms: boolean; whatsapp: boolean }>()
      .notNull()
      .default({ email: true, sms: false, whatsapp: false }),
    statut: text("statut").notNull().default("ouvert"),
    assigneA: text("assigne_a"),
    dernierMessageAt: timestamp("dernier_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("fils_voyageur_tenant_cle_uq").on(t.tenantId, t.cleRegroupement),
    index("fils_voyageur_tenant_statut_idx").on(
      t.tenantId,
      t.statut,
      t.dernierMessageAt,
    ),
    index("fils_voyageur_tenant_logement_idx").on(t.tenantId, t.logementId),
    index("fils_voyageur_tenant_assigne_idx").on(t.tenantId, t.assigneA),
  ],
);

export const piecesJointesMessage = pgTable(
  "pieces_jointes_message",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messagesVoyageur.id, { onDelete: "cascade" }),
    nomFichier: text("nom_fichier").notNull(),
    typeMime: text("type_mime").notNull(),
    tailleOctets: integer("taille_octets").notNull(),
    cleStockage: text("cle_stockage").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("pieces_jointes_message_tenant_message_idx").on(t.tenantId, t.messageId),
  ],
);

export const automatisations = pgTable(
  "automatisations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    libelle: text("libelle").notNull(),
    declencheur: text("declencheur").notNull(),
    canal: text("canal").notNull().default("email"),
    sujet: text("sujet"),
    modele: text("modele").notNull(),
    conditions: jsonb("conditions")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    actif: boolean("actif").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("automatisations_tenant_code_uq").on(t.tenantId, t.code),
    index("automatisations_tenant_declencheur_idx").on(
      t.tenantId,
      t.declencheur,
      t.actif,
    ),
  ],
);

export const executionsAutomatisation = pgTable(
  "executions_automatisation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    automatisationId: uuid("automatisation_id")
      .notNull()
      .references(() => automatisations.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    filId: uuid("fil_id").references(() => filsVoyageur.id, {
      onDelete: "set null",
    }),
    messageId: uuid("message_id").references(() => messagesVoyageur.id, {
      onDelete: "set null",
    }),
    ref: text("ref").notNull(),
    statut: text("statut").notNull().default("brouillon"),
    details: jsonb("details")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("executions_automatisation_tenant_ref_uq").on(t.tenantId, t.ref),
    index("executions_automatisation_tenant_auto_idx").on(
      t.tenantId,
      t.automatisationId,
      t.createdAt,
    ),
    // Purge de rétention (FR-015) : filtre sur la seule date.
    index("executions_automatisation_date_idx").on(t.createdAt),
  ],
);

export const recommandationsPrix = pgTable(
  "recommandations_prix",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    jour: date("jour").notNull(),
    prixActuelCentimes: integer("prix_actuel_centimes"),
    prixRecommandeCentimes: integer("prix_recommande_centimes").notNull(),
    source: text("source").notNull().default("partenaire"),
    confiance: integer("confiance").notNull().default(0),
    facteurs: jsonb("facteurs")
      .$type<{ code: string; libelle: string; impactPourcent: number }[]>()
      .notNull()
      .default([]),
    statut: text("statut").notNull().default("proposee"),
    importeeLe: timestamp("importee_le", { withTimezone: true })
      .notNull()
      .defaultNow(),
    appliqueeLe: timestamp("appliquee_le", { withTimezone: true }),
    appliqueePar: text("appliquee_par"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("recommandations_prix_tenant_logement_jour_source_uq").on(
      t.tenantId,
      t.logementId,
      t.jour,
      t.source,
    ),
    index("recommandations_prix_tenant_statut_idx").on(
      t.tenantId,
      t.statut,
      t.jour,
    ),
  ],
);

export const filsInternes = pgTable(
  "fils_internes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id").references(() => logements.id, {
      onDelete: "set null",
    }),
    canal: text("canal").notNull(),
    sujet: text("sujet").notNull(),
    statut: text("statut").notNull().default("ouvert"),
    creePar: text("cree_par").notNull(),
    dernierMessageAt: timestamp("dernier_message_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("fils_internes_tenant_canal_idx").on(
      t.tenantId,
      t.canal,
      t.dernierMessageAt,
    ),
    index("fils_internes_tenant_logement_idx").on(t.tenantId, t.logementId),
  ],
);

export const messagesFilsInternes = pgTable(
  "messages_fils_internes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    filId: uuid("fil_id")
      .notNull()
      .references(() => filsInternes.id, { onDelete: "cascade" }),
    auteurEmail: text("auteur_email").notNull(),
    auteurRole: text("auteur_role").notNull(),
    corps: text("corps").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("messages_fils_internes_tenant_fil_idx").on(
      t.tenantId,
      t.filId,
      t.createdAt,
    ),
  ],
);

export const assistantConsommations = pgTable(
  "assistant_consommations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messagesVoyageur.id, { onDelete: "cascade" }),
    modele: text("modele").notNull(),
    coutCentimes: integer("cout_centimes").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("assistant_consommations_message_uq").on(t.messageId),
    index("assistant_consommations_tenant_date_idx").on(
      t.tenantId,
      t.createdAt,
    ),
  ],
);

export const dispatches = pgTable(
  "dispatches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id, { onDelete: "cascade" }),
    prestataireId: text("prestataire_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    ref: text("ref").notNull(),
    statut: text("statut").notNull().default("proposee"),
    message: text("message").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reponduAt: timestamp("repondu_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("dispatches_tenant_ref_uq").on(t.tenantId, t.ref),
    index("dispatches_tenant_mission_idx").on(t.tenantId, t.missionId),
    index("dispatches_tenant_presta_idx").on(
      t.tenantId,
      t.prestataireId,
      t.createdAt,
    ),
  ],
);

export const incidents = pgTable(
  "incidents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id").references(() => reservations.id, {
      onDelete: "set null",
    }),
    ref: text("ref").notNull(),
    message: text("message").notNull(),
    statut: text("statut").notNull().default("ouvert"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("incidents_tenant_ref_uq").on(t.tenantId, t.ref),
    index("incidents_tenant_reservation_idx").on(
      t.tenantId,
      t.reservationId,
      t.createdAt,
    ),
  ],
);

export const parametresFiscaux = pgTable("parametres_fiscaux", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  tauxTvaBp: integer("taux_tva_bp").notNull().default(1000),
  taxeSejourNuitPersonneCentimes: integer(
    "taxe_sejour_nuit_personne_centimes",
  )
    .notNull()
    .default(0),
  taxeSejourPlafondCentimes: integer("taxe_sejour_plafond_centimes"),
  prefixeFacture: text("prefixe_facture").notNull().default("FAC"),
  mentionsLegales: text("mentions_legales"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const factures = pgTable(
  "factures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "restrict" }),
    reservationId: uuid("reservation_id").references(() => reservations.id, {
      onDelete: "set null",
    }),
    numero: text("numero").notNull(),
    clientNom: text("client_nom").notNull(),
    clientEmail: text("client_email"),
    dateEmission: date("date_emission", { mode: "string" }).notNull(),
    echeance: date("echeance", { mode: "string" }),
    montantHtCentimes: integer("montant_ht_centimes").notNull().default(0),
    tvaCentimes: integer("tva_centimes").notNull().default(0),
    taxeSejourCentimes: integer("taxe_sejour_centimes").notNull().default(0),
    montantTtcCentimes: integer("montant_ttc_centimes").notNull().default(0),
    statut: text("statut").notNull().default("brouillon"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("factures_tenant_numero_uq").on(t.tenantId, t.numero),
    index("factures_tenant_date_idx").on(t.tenantId, t.dateEmission),
    index("factures_tenant_logement_idx").on(t.tenantId, t.logementId),
  ],
);

export const factureLignes = pgTable(
  "facture_lignes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    factureId: uuid("facture_id")
      .notNull()
      .references(() => factures.id, { onDelete: "cascade" }),
    designation: text("designation").notNull(),
    quantite: integer("quantite").notNull(),
    prixUnitaireCentimes: integer("prix_unitaire_centimes").notNull(),
    totalCentimes: integer("total_centimes").notNull(),
    ordre: integer("ordre").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("facture_lignes_facture_idx").on(t.factureId, t.ordre),
    index("facture_lignes_tenant_idx").on(t.tenantId),
  ],
);

export const relancesFactures = pgTable(
  "relances_factures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    factureId: uuid("facture_id")
      .notNull()
      .references(() => factures.id, { onDelete: "cascade" }),
    jour: date("jour", { mode: "string" }).notNull(),
    destinataire: text("destinataire").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("relances_factures_tenant_facture_jour_uq").on(
      t.tenantId,
      t.factureId,
      t.jour,
    ),
    index("relances_factures_tenant_jour_idx").on(t.tenantId, t.jour),
  ],
);

export const echeancesPaiement = pgTable(
  "echeances_paiement",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    montantCentimes: integer("montant_centimes").notNull(),
    exigibleLe: date("exigible_le", { mode: "string" }).notNull(),
    statut: text("statut").notNull().default("a_payer"),
    paiementId: uuid("paiement_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("echeances_paiement_reservation_type_uq").on(
      t.tenantId,
      t.reservationId,
      t.type,
    ),
    index("echeances_paiement_tenant_statut_idx").on(
      t.tenantId,
      t.statut,
      t.exigibleLe,
    ),
  ],
);

export const paiements = pgTable(
  "paiements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    factureId: uuid("facture_id").references(() => factures.id, {
      onDelete: "cascade",
    }),
    reservationId: uuid("reservation_id").references(() => reservations.id, {
      onDelete: "set null",
    }),
    echeanceId: uuid("echeance_id").references(() => echeancesPaiement.id, {
      onDelete: "set null",
    }),
    externalId: text("external_id"),
    ref: text("ref").notNull(),
    montantCentimes: integer("montant_centimes").notNull(),
    mode: text("mode").notNull().default("virement"),
    datePaiement: date("date_paiement", { mode: "string" }).notNull(),
    reference: text("reference"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("paiements_tenant_ref_uq").on(t.tenantId, t.ref),
    index("paiements_tenant_facture_idx").on(
      t.tenantId,
      t.factureId,
      t.datePaiement,
    ),
    index("paiements_tenant_date_idx").on(t.tenantId, t.datePaiement),
  ],
);

export const cautions = pgTable(
  "cautions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    montantCentimes: integer("montant_centimes").notNull(),
    mode: text("mode").notNull().default("virement"),
    empreinteId: text("empreinte_id"),
    empreinteStatut: text("empreinte_statut"),
    montantCaptureCentimes: integer("montant_capture_centimes")
      .notNull()
      .default(0),
    statut: text("statut").notNull().default("attendue"),
    dateReception: date("date_reception", { mode: "string" }),
    dateRestitution: date("date_restitution", { mode: "string" }),
    montantRetenuCentimes: integer("montant_retenu_centimes")
      .notNull()
      .default(0),
    motifRetenue: text("motif_retenue"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("cautions_tenant_reservation_uq").on(
      t.tenantId,
      t.reservationId,
    ),
    index("cautions_tenant_statut_idx").on(t.tenantId, t.statut),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    qui: text("qui").notNull(),
    action: text("action").notNull(),
    cible: text("cible"),
    ref: text("ref"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_logs_tenant_date_idx").on(t.tenantId, t.createdAt),
    // Purge de rétention (FR-015) : filtre sur la seule date.
    index("audit_logs_date_idx").on(t.createdAt),
  ],
);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    scope: text("scope").notNull(),
    key: text("key").notNull(),
    response: jsonb("response").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("idempotency_tenant_scope_key_uq").on(
      t.tenantId,
      t.scope,
      t.key,
    ),
    index("idempotency_expires_idx").on(t.expiresAt),
  ],
);

export const consommables = pgTable(
  "consommables",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    label: text("label").notNull(),
    stock: integer("stock").notNull().default(0),
    unite: text("unite").notNull().default("unité"),
    seuil: integer("seuil").notNull().default(0),
    cible: integer("cible").notNull().default(0),
    consoRotation: integer("conso_rotation").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("consommables_tenant_logement_code_uq").on(
      t.tenantId,
      t.logementId,
      t.code,
    ),
    index("consommables_logement_idx").on(t.tenantId, t.logementId),
  ],
);

export const mouvementsStock = pgTable(
  "mouvements_stock",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    consommableId: uuid("consommable_id")
      .notNull()
      .references(() => consommables.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    quantite: integer("quantite").notNull(),
    avant: integer("avant").notNull(),
    apres: integer("apres").notNull(),
    qui: text("qui").notNull(),
    ref: text("ref").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("mouvements_stock_tenant_ref_uq").on(t.tenantId, t.ref),
    index("mouvements_stock_logement_date_idx").on(
      t.tenantId,
      t.logementId,
      t.createdAt,
    ),
  ],
);

export const biens = pgTable(
  "biens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    qr: text("qr").notNull(),
    categorie: text("categorie").notNull(),
    label: text("label").notNull(),
    dateAchat: date("date_achat"),
    prixAchatCentimes: integer("prix_achat_centimes"),
    fournisseur: text("fournisseur"),
    garantieFin: date("garantie_fin"),
    lavagesNb: integer("lavages_nb").notNull().default(0),
    utilisationsNb: integer("utilisations_nb").notNull().default(0),
    derniereUtilisation: date("derniere_utilisation"),
    etat: integer("etat").notNull().default(5),
    photoUrl: text("photo_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("biens_tenant_logement_qr_uq").on(
      t.tenantId,
      t.logementId,
      t.qr,
    ),
    index("biens_logement_idx").on(t.tenantId, t.logementId),
  ],
);

export const bienEvenements = pgTable(
  "bien_evenements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    bienId: uuid("bien_id")
      .notNull()
      .references(() => biens.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    ref: text("ref").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("bien_evenements_tenant_ref_uq").on(t.tenantId, t.ref),
    index("bien_evenements_bien_date_idx").on(
      t.tenantId,
      t.bienId,
      t.createdAt,
    ),
  ],
);

export const avis = pgTable(
  "avis",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(),
    nom: text("nom").notNull(),
    note: integer("note").notNull(),
    commentaire: text("commentaire").default("").notNull(),
    statut: text("statut").default("publie").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("avis_tenant_reservation_uq").on(
      table.tenantId,
      table.reservationId,
    ),
    uniqueIndex("avis_tenant_ref_uq").on(table.tenantId, table.ref),
    index("avis_tenant_statut_idx").on(table.tenantId, table.statut),
  ],
);

export const memoireVoyageurs = pgTable(
  "memoire_voyageurs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    emailHash: text("email_hash").notNull(),
    nom: text("nom").notNull(),
    preferences: text("preferences").default("").notNull(),
    consentementAt: timestamp("consentement_at", { withTimezone: true })
      .notNull(),
    expireAt: timestamp("expire_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("memoire_voyageurs_tenant_email_uq").on(
      table.tenantId,
      table.emailHash,
    ),
    index("memoire_voyageurs_expire_idx").on(table.expireAt),
  ],
);

export const lieuxTourisme = pgTable(
  "lieux_tourisme",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id").references(() => logements.id, {
      onDelete: "cascade",
    }),
    slug: text("slug").notNull(),
    nom: text("nom").notNull(),
    categorie: text("categorie").notNull().default("visite"),
    commune: text("commune"),
    acces: text("acces"),
    prixIndicatif: text("prix_indicatif"),
    lien: text("lien"),
    mode: text("mode"),
    extraId: text("extra_id"),
    actif: boolean("actif").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("lieux_tourisme_tenant_slug_uq").on(t.tenantId, t.slug),
    index("lieux_tourisme_tenant_idx").on(t.tenantId, t.actif),
  ],
);

export const parametresSite = pgTable("parametres_site", {
  cle: text("cle").primaryKey(),
  valeur: text("valeur").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Apparence globale du site : une seule version publiée, un seul brouillon.
// Table plateforme (aucun tenant_id) : le super-admin change le thème de tous.
export const apparenceVersions = pgTable(
  "apparence_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    version: integer("version").notNull(),
    configuration: jsonb("configuration").notNull(),
    schemaVersion: integer("schema_version").notNull().default(2),
    statut: text("statut").notNull().default("archive"),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .notNull()
      .defaultNow(),
    creePar: text("cree_par").notNull(),
    publieLe: timestamp("publie_le", { withTimezone: true }),
    publiePar: text("publie_par"),
    motif: text("motif"),
  },
  (t) => [
    uniqueIndex("apparence_versions_version_uq").on(t.version),
    uniqueIndex("apparence_versions_publie_uq")
      .on(t.statut)
      .where(sql`${t.statut} = 'publie'`),
    uniqueIndex("apparence_versions_brouillon_uq")
      .on(t.statut)
      .where(sql`${t.statut} = 'brouillon'`),
  ],
);

export const configVersions = pgTable(
  "config_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(),
    action: text("action").notNull(),
    auteurEmail: text("auteur_email").notNull(),
    lignes: jsonb("lignes").$type<unknown[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("config_versions_tenant_ref_uq").on(t.tenantId, t.ref),
    index("config_versions_tenant_created_idx").on(t.tenantId, t.createdAt),
  ],
);

export const sinistres = pgTable(
  "sinistres",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(),
    type: text("type").notNull(),
    date: date("date").notNull(),
    description: text("description").notNull(),
    montantEstimeCentimes: integer("montant_estime_centimes")
      .notNull()
      .default(0),
    franchiseCentimes: integer("franchise_centimes").notNull().default(0),
    statut: text("statut").notNull().default("declare"),
    montantIndemniseCentimes: integer("montant_indemnise_centimes"),
    numeroDeclaration: text("numero_declaration"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("sinistres_tenant_ref_uq").on(t.tenantId, t.ref),
    index("sinistres_tenant_logement_date_idx").on(
      t.tenantId,
      t.logementId,
      t.date,
    ),
  ],
);

export const rgpdRegistres = pgTable(
  "rgpd_registres",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    dpoNom: text("dpo_nom"),
    dpoContact: text("dpo_contact"),
    hebergement: text("hebergement").notNull().default("Union européenne"),
    entrees: jsonb("entrees")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("rgpd_registres_tenant_uq").on(t.tenantId)],
);

export const annoncesConformite = pgTable(
  "annonces_conformite",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    mentions: jsonb("mentions")
      .$type<Record<string, boolean>>()
      .notNull()
      .default({}),
    dpeClasse: text("dpe_classe"),
    gesClasse: text("ges_classe"),
    classement: text("classement"),
    numeroEnregistrement: text("numero_enregistrement"),
    numeroCerfa: text("numero_cerfa"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("annonces_conformite_tenant_logement_uq").on(
      t.tenantId,
      t.logementId,
    ),
  ],
);

export const preuvesTranquillite = pgTable(
  "preuves_tranquillite",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(),
    type: text("type").notNull(),
    date: date("date").notNull(),
    moment: text("moment"),
    valeurDb: integer("valeur_db"),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("preuves_tranquillite_tenant_ref_uq").on(t.tenantId, t.ref),
    index("preuves_tranquillite_tenant_logement_date_idx").on(
      t.tenantId,
      t.logementId,
      t.date,
    ),
  ],
);

export const objetsTrouves = pgTable(
  "objets_trouves",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id").references(() => reservations.id, {
      onDelete: "set null",
    }),
    ref: text("ref").notNull(),
    description: text("description").notNull(),
    lieu: text("lieu").notNull(),
    trouveLe: date("trouve_le").notNull(),
    statut: text("statut").notNull().default("trouve"),
    voyageurNom: text("voyageur_nom"),
    contact: text("contact"),
    fraisCentimes: integer("frais_centimes").notNull().default(0),
    envoyeLe: date("envoye_le"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("objets_trouves_tenant_ref_uq").on(t.tenantId, t.ref),
    index("objets_trouves_tenant_logement_statut_idx").on(
      t.tenantId,
      t.logementId,
      t.statut,
    ),
  ],
);

export const formationsProgressions = pgTable(
  "formations_progressions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    moduleCode: text("module_code").notNull(),
    etapesFaites: jsonb("etapes_faites")
      .$type<string[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("formations_progressions_tenant_user_module_uq").on(
      t.tenantId,
      t.userId,
      t.moduleCode,
    ),
    index("formations_progressions_tenant_user_idx").on(t.tenantId, t.userId),
  ],
);

export const phrases = pgTable(
  "phrases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id").references(() => logements.id, {
      onDelete: "cascade",
    }),
    ref: text("ref").notNull(),
    categorie: text("categorie").notNull().default("general"),
    titre: text("titre").notNull(),
    contenu: text("contenu").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("phrases_tenant_ref_uq").on(t.tenantId, t.ref),
    index("phrases_tenant_logement_idx").on(t.tenantId, t.logementId),
  ],
);

export const questionnaires = pgTable(
  "questionnaires",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(),
    noteAccueil: integer("note_accueil").notNull(),
    noteProprete: integer("note_proprete").notNull(),
    noteEquipement: integer("note_equipement").notNull(),
    noteLiterie: integer("note_literie").notNull(),
    noteCommunication: integer("note_communication").notNull(),
    commentaire: text("commentaire").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("questionnaires_tenant_reservation_uq").on(
      t.tenantId,
      t.reservationId,
    ),
    uniqueIndex("questionnaires_tenant_ref_uq").on(t.tenantId, t.ref),
    index("questionnaires_tenant_logement_idx").on(
      t.tenantId,
      t.logementId,
      t.createdAt,
    ),
  ],
);

export const menages = pgTable(
  "menages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id").references(() => reservations.id, {
      onDelete: "set null",
    }),
    ref: text("ref").notNull(),
    date: date("date").notNull(),
    statut: text("statut").notNull().default("planifie"),
    notes: text("notes").notNull().default(""),
    score: integer("score"),
    coutCentimes: integer("cout_centimes"),
    dureeMinutes: integer("duree_minutes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("menages_tenant_ref_uq").on(t.tenantId, t.ref),
    index("menages_tenant_logement_date_idx").on(
      t.tenantId,
      t.logementId,
      t.date,
    ),
  ],
);

export const menageTaches = pgTable(
  "menage_taches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    menageId: uuid("menage_id")
      .notNull()
      .references(() => menages.id, { onDelete: "cascade" }),
    libelle: text("libelle").notNull(),
    fait: boolean("fait").notNull().default(false),
    ordre: integer("ordre").notNull().default(0),
  },
  (t) => [
    index("menage_taches_tenant_menage_idx").on(t.tenantId, t.menageId),
  ],
);

export const photosMenage = pgTable(
  "photos_menage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    menageId: uuid("menage_id")
      .notNull()
      .references(() => menages.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(),
    phase: text("phase").notNull(),
    chemin: text("chemin").notNull(),
    contentType: text("content_type").notNull(),
    tailleOctets: integer("taille_octets").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("photos_menage_tenant_ref_uq").on(t.tenantId, t.ref),
    index("photos_menage_tenant_menage_idx").on(t.tenantId, t.menageId),
    index("photos_menage_tenant_logement_created_idx").on(
      t.tenantId,
      t.logementId,
      t.createdAt,
    ),
  ],
);

export const entretiens = pgTable(
  "entretiens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(),
    date: date("date").notNull(),
    type: text("type").notNull().default("entretien"),
    titre: text("titre").notNull(),
    description: text("description").notNull().default(""),
    prestataire: text("prestataire"),
    coutCentimes: integer("cout_centimes").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("entretiens_tenant_ref_uq").on(t.tenantId, t.ref),
    index("entretiens_tenant_logement_idx").on(
      t.tenantId,
      t.logementId,
      t.date,
    ),
  ],
);

export const etatsDesLieux = pgTable(
  "etats_des_lieux",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id").references(() => reservations.id, {
      onDelete: "set null",
    }),
    ref: text("ref").notNull(),
    type: text("type").notNull().default("sortie"),
    date: date("date").notNull(),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("etats_des_lieux_tenant_ref_uq").on(t.tenantId, t.ref),
    index("etats_des_lieux_tenant_date_idx").on(t.tenantId, t.date),
    index("etats_des_lieux_logement_idx").on(t.tenantId, t.logementId),
  ],
);

export const etatDesLieuxLignes = pgTable(
  "etat_des_lieux_lignes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    etatDesLieuxId: uuid("etat_des_lieux_id")
      .notNull()
      .references(() => etatsDesLieux.id, { onDelete: "cascade" }),
    bienId: uuid("bien_id").references(() => biens.id, {
      onDelete: "set null",
    }),
    qr: text("qr").notNull(),
    libelle: text("libelle").notNull(),
    etatReference: integer("etat_reference").notNull(),
    prixReferenceCentimes: integer("prix_reference_centimes"),
    etatConstate: integer("etat_constate"),
    manquant: boolean("manquant").notNull().default(false),
    commentaire: text("commentaire").notNull().default(""),
  },
  (t) => [
    index("etat_des_lieux_lignes_etat_idx").on(
      t.tenantId,
      t.etatDesLieuxId,
    ),
  ],
);

export type ParametreSiteRow = typeof parametresSite.$inferSelect;export type NewParametreSiteRow = typeof parametresSite.$inferInsert;
export type ApparenceVersionRow = typeof apparenceVersions.$inferSelect;
export type NewApparenceVersionRow = typeof apparenceVersions.$inferInsert;
export type ConsommableRow = typeof consommables.$inferSelect;
export type NewConsommableRow = typeof consommables.$inferInsert;
export type MouvementStockRow = typeof mouvementsStock.$inferSelect;
export type NewMouvementStockRow = typeof mouvementsStock.$inferInsert;
export type BienRow = typeof biens.$inferSelect;
export type NewBienRow = typeof biens.$inferInsert;
export type BienEvenementRow = typeof bienEvenements.$inferSelect;
export type NewBienEvenementRow = typeof bienEvenements.$inferInsert;
export type EtatDesLieuxRow = typeof etatsDesLieux.$inferSelect;
export type NewEtatDesLieuxRow = typeof etatsDesLieux.$inferInsert;
export type EntretienRow = typeof entretiens.$inferSelect;
export type NewEntretienRow = typeof entretiens.$inferInsert;
export type MenageRow = typeof menages.$inferSelect;
export type NewMenageRow = typeof menages.$inferInsert;
export type MenageTacheRow = typeof menageTaches.$inferSelect;
export type NewMenageTacheRow = typeof menageTaches.$inferInsert;
export type QuestionnaireRow = typeof questionnaires.$inferSelect;
export type NewQuestionnaireRow = typeof questionnaires.$inferInsert;
export type PhraseRow = typeof phrases.$inferSelect;
export type NewPhraseRow = typeof phrases.$inferInsert;
export type ProgressionFormationRow =
  typeof formationsProgressions.$inferSelect;
export type NewProgressionFormationRow =
  typeof formationsProgressions.$inferInsert;
export type ObjetTrouveRow = typeof objetsTrouves.$inferSelect;
export type NewObjetTrouveRow = typeof objetsTrouves.$inferInsert;
export type PreuveTranquilliteRow = typeof preuvesTranquillite.$inferSelect;
export type NewPreuveTranquilliteRow =
  typeof preuvesTranquillite.$inferInsert;
export type AnnonceConformiteRow = typeof annoncesConformite.$inferSelect;
export type NewAnnonceConformiteRow =
  typeof annoncesConformite.$inferInsert;
export type RgpdRegistreRow = typeof rgpdRegistres.$inferSelect;
export type NewRgpdRegistreRow = typeof rgpdRegistres.$inferInsert;
export type SinistreRow = typeof sinistres.$inferSelect;
export type NewSinistreRow = typeof sinistres.$inferInsert;
export type DispatchRow = typeof dispatches.$inferSelect;
export type NewDispatchRow = typeof dispatches.$inferInsert;
export type MessageVoyageurRow = typeof messagesVoyageur.$inferSelect;
export type NewMessageVoyageurRow = typeof messagesVoyageur.$inferInsert;
export type FilVoyageurRow = typeof filsVoyageur.$inferSelect;
export type NewFilVoyageurRow = typeof filsVoyageur.$inferInsert;
export type PieceJointeMessageRow = typeof piecesJointesMessage.$inferSelect;
export type NewPieceJointeMessageRow = typeof piecesJointesMessage.$inferInsert;
export type AutomatisationRow = typeof automatisations.$inferSelect;
export type NewAutomatisationRow = typeof automatisations.$inferInsert;
export type ExecutionAutomatisationRow =
  typeof executionsAutomatisation.$inferSelect;
export type NewExecutionAutomatisationRow =
  typeof executionsAutomatisation.$inferInsert;
export type PreferenceSejourRow = typeof preferencesSejour.$inferSelect;
export type NewPreferenceSejourRow = typeof preferencesSejour.$inferInsert;
export type EtatDesLieuxLigneRow = typeof etatDesLieuxLignes.$inferSelect;
export type NewEtatDesLieuxLigneRow = typeof etatDesLieuxLignes.$inferInsert;
export type LieuTourismeRow = typeof lieuxTourisme.$inferSelect;
export type NewLieuTourismeRow = typeof lieuxTourisme.$inferInsert;
export type TenantRow = typeof tenants.$inferSelect;
export type NewTenantRow = typeof tenants.$inferInsert;
export type LogementRow = typeof logements.$inferSelect;
export type NewLogementRow = typeof logements.$inferInsert;
export type ReservationRow = typeof reservations.$inferSelect;
export type NewReservationRow = typeof reservations.$inferInsert;
export type BlocageRow = typeof blocages.$inferSelect;
export type NewBlocageRow = typeof blocages.$inferInsert;
export type FluxIcsRow = typeof fluxIcs.$inferSelect;
export type NewFluxIcsRow = typeof fluxIcs.$inferInsert;
export type WebhookRow = typeof webhooks.$inferSelect;
export type NewWebhookRow = typeof webhooks.$inferInsert;
export type WebhookDeliveryRow = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDeliveryRow = typeof webhookDeliveries.$inferInsert;
export type TarifRow = typeof tarifs.$inferSelect;
export type NewTarifRow = typeof tarifs.$inferInsert;
export type ParametresFiscauxRow =
  typeof parametresFiscaux.$inferSelect;
export type NewParametresFiscauxRow =
  typeof parametresFiscaux.$inferInsert;
export type ExtraRow = typeof extras.$inferSelect;
export type NewExtraRow = typeof extras.$inferInsert;
export type CommandeExtraRow = typeof commandesExtras.$inferSelect;
export type NewCommandeExtraRow = typeof commandesExtras.$inferInsert;
export type TicketRow = typeof tickets.$inferSelect;
export type NewTicketRow = typeof tickets.$inferInsert;
export type TicketMessageRow = typeof ticketMessages.$inferSelect;
export type NewTicketMessageRow = typeof ticketMessages.$inferInsert;
export type ProspectRow = typeof prospects.$inferSelect;
export type NewProspectRow = typeof prospects.$inferInsert;
export type OffreRow = typeof offres.$inferSelect;
export type NewOffreRow = typeof offres.$inferInsert;
export type LogementProprietaireRow =
  typeof logementProprietaires.$inferSelect;
export type NewLogementProprietaireRow =
  typeof logementProprietaires.$inferInsert;
export const fichesPolice = pgTable(
  "fiches_police",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(),
    nom: text("nom").notNull(),
    prenoms: text("prenoms").notNull(),
    nationalite: text("nationalite").notNull(),
    dateNaissance: text("date_naissance").notNull(),
    lieuNaissance: text("lieu_naissance").notNull(),
    domicile: text("domicile").notNull(),
    telephone: text("telephone").notNull(),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    purgeAt: timestamp("purge_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("fiches_police_tenant_ref_uq").on(
      table.tenantId,
      table.ref,
    ),
    index("fiches_police_tenant_reservation_idx").on(
      table.tenantId,
      table.reservationId,
    ),
    index("fiches_police_purge_idx").on(table.purgeAt),
  ],
);

export const importsBanque = pgTable(
  "imports_banque",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(),
    nomFichier: text("nom_fichier").notNull(),
    periodeDebut: text("periode_debut").notNull(),
    periodeFin: text("periode_fin").notNull(),
    totalCreditsCentimes: integer("total_credits_centimes").notNull(),
    totalDebitsCentimes: integer("total_debits_centimes").notNull(),
    attendusCentimes: integer("attendus_centimes").notNull(),
    ecartBp: integer("ecart_bp").notNull(),
    lignesTotal: integer("lignes_total").notNull(),
    lignesRapprochees: integer("lignes_rapprochees").notNull(),
    lignesOrphelines: integer("lignes_orphelines").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("imports_banque_tenant_ref_uq").on(table.tenantId, table.ref),
    index("imports_banque_tenant_date_idx").on(
      table.tenantId,
      table.createdAt,
    ),
  ],
);

export const lignesBanque = pgTable(
  "lignes_banque",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    importId: uuid("import_id")
      .notNull()
      .references(() => importsBanque.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(),
    dateOperation: text("date_operation").notNull(),
    libelle: text("libelle").notNull(),
    montantCentimes: integer("montant_centimes").notNull(),
    paiementId: uuid("paiement_id").references(() => paiements.id, {
      onDelete: "set null",
    }),
    statut: text("statut").notNull().default("orpheline"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("lignes_banque_tenant_ref_uq").on(table.tenantId, table.ref),
    index("lignes_banque_import_idx").on(table.importId),
    index("lignes_banque_tenant_statut_idx").on(table.tenantId, table.statut),
  ],
);

// Compteur anti-bot du login : clé = HMAC(IP + email). Aucune donnée
// nominative en clair, purgeable sans impact métier. Trois échecs dans la
// fenêtre déclenchent le CAPTCHA ; Better Auth garde sa propre limite IP.
export const tentativesConnexion = pgTable(
  "tentatives_connexion",
  {
    cle: text("cle").primaryKey(),
    echecs: integer("echecs").notNull().default(0),
    dernierEchec: timestamp("dernier_echec", { withTimezone: true })
      .notNull()
      .defaultNow(),
    bloqueJusqua: timestamp("bloque_jusqua", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("tentatives_connexion_dernier_idx").on(t.dernierEchec)],
);

// Double validation humaine (4 yeux) des gestes financiers sensibles :
// retenue de caution au-delà du seuil, reversement, débit. Le demandeur ne
// peut jamais approuver sa propre demande ; l'exécution n'a lieu qu'après
// approbation d'un second compte habilité.
export const validationsSensibles = pgTable(
  "validations_sensibles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    cibleId: text("cible_id").notNull(),
    ref: text("ref").notNull(),
    montantCentimes: integer("montant_centimes").notNull().default(0),
    payload: jsonb("payload").notNull().default({}),
    demandeurId: text("demandeur_id").notNull(),
    demandeurEmail: text("demandeur_email").notNull(),
    statut: text("statut").notNull().default("en_attente"),
    decideurId: text("decideur_id"),
    decideurEmail: text("decideur_email"),
    motifDecision: text("motif_decision"),
    decideLe: timestamp("decide_le", { withTimezone: true }),
    payeeLe: timestamp("payee_le", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("validations_sensibles_pending_uq")
      .on(t.tenantId, t.type, t.cibleId)
      .where(sql`${t.statut} = 'en_attente'`),
    index("validations_sensibles_tenant_statut_idx").on(
      t.tenantId,
      t.statut,
      t.createdAt,
    ),
  ],
);

export type MissionRow = typeof missions.$inferSelect;
export type NewMissionRow = typeof missions.$inferInsert;
export type IncidentRow = typeof incidents.$inferSelect;
export type NewIncidentRow = typeof incidents.$inferInsert;
export type FactureRow = typeof factures.$inferSelect;
export type NewFactureRow = typeof factures.$inferInsert;
export type FactureLigneRow = typeof factureLignes.$inferSelect;
export type NewFactureLigneRow = typeof factureLignes.$inferInsert;
export type PaiementRow = typeof paiements.$inferSelect;
export type NewPaiementRow = typeof paiements.$inferInsert;
export type CautionRow = typeof cautions.$inferSelect;
export type NewCautionRow = typeof cautions.$inferInsert;
export type FichePoliceRow = typeof fichesPolice.$inferSelect;
export type NewFichePoliceRow = typeof fichesPolice.$inferInsert;
export type ImportBanqueRow = typeof importsBanque.$inferSelect;
export type NewImportBanqueRow = typeof importsBanque.$inferInsert;
export type LigneBanqueRow = typeof lignesBanque.$inferSelect;
export type NewLigneBanqueRow = typeof lignesBanque.$inferInsert;

export const sitesTenants = pgTable(
  "sites_tenants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    template: text("template").notNull().default("sejour"),
    langues: jsonb("langues").$type<LanguePublique[]>().notNull().default(["fr"]),
    seoDefaut: jsonb("seo_defaut").$type<SeoPage>().notNull().default({
      title: "",
      description: "",
      ogImage: null,
    }),
    statut: text("statut").notNull().default("brouillon"),
    publieAt: timestamp("publie_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("sites_tenants_tenant_uq").on(t.tenantId)],
);

export const pagesSite = pgTable(
  "pages_site",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sitesTenants.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    type: text("type").notNull(),
    logementId: uuid("logement_id").references(() => logements.id, {
      onDelete: "cascade",
    }),
    template: text("template").notNull().default("sejour"),
    statut: text("statut").notNull().default("brouillon"),
    seo: jsonb("seo").$type<SeoPage>().notNull().default({
      title: "",
      description: "",
      ogImage: null,
    }),
    langues: jsonb("langues")
      .$type<Partial<Record<LanguePublique, string>>>()
      .notNull()
      .default({}),
    publieAt: timestamp("publie_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("pages_site_tenant_slug_uq").on(t.tenantId, t.slug),
    index("pages_site_tenant_site_idx").on(t.tenantId, t.siteId),
  ],
);

export const sectionsSite = pgTable(
  "sections_site",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pagesSite.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    position: integer("position").notNull().default(0),
    contenu: jsonb("contenu")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    visible: boolean("visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("sections_site_page_position_idx").on(t.tenantId, t.pageId, t.position)],
);

export const domaines = pgTable(
  "domaines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    domaine: text("domaine").notNull(),
    statut: text("statut").notNull().default("en_attente"),
    verificationToken: text("verification_token"),
    certificatAt: timestamp("certificat_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("domaines_domaine_uq").on(t.domaine),
    index("domaines_tenant_idx").on(t.tenantId),
  ],
);

export const promotions = pgTable(
  "promotions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id").references(() => logements.id, {
      onDelete: "cascade",
    }),
    type: text("type").notNull(),
    valeur: integer("valeur").notNull(),
    code: text("code"),
    conditions: jsonb("conditions")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    actif: boolean("actif").notNull().default(true),
    debutAt: timestamp("debut_at", { withTimezone: true }),
    finAt: timestamp("fin_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("promotions_tenant_code_uq").on(t.tenantId, t.code),
    index("promotions_tenant_actif_idx").on(t.tenantId, t.actif),
  ],
);

export const demandesSejour = pgTable(
  "demandes_sejour",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(),
    logementId: uuid("logement_id").references(() => logements.id, {
      onDelete: "set null",
    }),
    nom: text("nom").notNull(),
    email: text("email").notNull(),
    telephone: text("telephone"),
    arrivee: date("arrivee", { mode: "string" }),
    depart: date("depart", { mode: "string" }),
    voyageurs: integer("voyageurs").notNull().default(1),
    message: text("message"),
    statut: text("statut").notNull().default("nouvelle"),
    motifRefus: text("motif_refus"),
    reservationId: uuid("reservation_id").references(() => reservations.id, {
      onDelete: "set null",
    }),
    source: text("source").notNull().default("site"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("demandes_sejour_tenant_ref_uq").on(t.tenantId, t.ref),
    index("demandes_sejour_tenant_statut_idx").on(
      t.tenantId,
      t.statut,
      t.createdAt,
    ),
  ],
);

// --- US5 Reporting : relevés propriétaires (T503) ---

export const relevesProprietaires = pgTable(
  "releves_proprietaires",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    proprietaireId: text("proprietaire_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    proprietaireNom: text("proprietaire_nom").notNull(),
    moisDebut: text("mois_debut").notNull(),
    moisFin: text("mois_fin").notNull(),
    periode: text("periode").notNull().default("mensuel"),
    lignes: jsonb("lignes")
      .$type<
        {
          logementId: string;
          logementNom: string;
          sejours: number;
          caCentimes: number;
          commissionCentimes: number;
          chargesCentimes: number;
          netCentimes: number;
        }[]
      >()
      .notNull()
      .default([]),
    totalCaCentimes: integer("total_ca_centimes").notNull(),
    totalCommissionCentimes: integer("total_commission_centimes").notNull(),
    totalChargesCentimes: integer("total_charges_centimes").notNull(),
    totalNetCentimes: integer("total_net_centimes").notNull(),
    genereAt: timestamp("genere_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("releves_proprietaires_tenant_proprietaire_periode_uq").on(
      t.tenantId,
      t.proprietaireId,
      t.moisDebut,
      t.periode,
    ),
    index("releves_proprietaires_tenant_genere_idx").on(
      t.tenantId,
      t.genereAt,
    ),
  ],
);

export const envoisReleves = pgTable(
  "envois_releves",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    releveId: uuid("releve_id")
      .notNull()
      .references(() => relevesProprietaires.id, { onDelete: "cascade" }),
    proprietaireId: text("proprietaire_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    canal: text("canal").notNull().default("email"),
    destinataire: text("destinataire").notNull(),
    envoiRef: text("envoi_ref").notNull(),
    envoyeAt: timestamp("envoye_at", { withTimezone: true }).notNull(),
    statut: text("statut").notNull().default("envoye"),
    erreur: text("erreur"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("envois_releves_tenant_ref_uq").on(t.tenantId, t.envoiRef),
    index("envois_releves_releve_idx").on(t.tenantId, t.releveId),
  ],
);

// --- US5 Reporting : paiements propriétaires / payouts (T515) ---
export const paiementsProprietaires = pgTable(
  "paiements_proprietaires",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    proprietaireId: text("proprietaire_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    releveId: uuid("releve_id").references(() => relevesProprietaires.id, {
      onDelete: "set null",
    }),
    ref: text("ref").notNull(),
    montantAttenduCentimes: integer("montant_attendu_centimes").notNull(),
    montantPayeCentimes: integer("montant_paye_centimes"),
    mode: text("mode").notNull().default("virement"),
    statut: text("statut").notNull().default("en_attente"),
    datePaiement: date("date_paiement", { mode: "string" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("paiements_proprietaires_tenant_ref_uq").on(
      t.tenantId,
      t.ref,
    ),
    index("paiements_proprietaires_tenant_proprietaire_idx").on(
      t.tenantId,
      t.proprietaireId,
      t.createdAt,
    ),
    index("paiements_proprietaires_releve_idx").on(
      t.tenantId,
      t.releveId,
    ),
    index("paiements_proprietaires_tenant_statut_idx").on(
      t.tenantId,
      t.statut,
      t.createdAt,
    ),
  ],
);

// --- US6 Expérience voyageur : guide structuré + accès serrure (T601) ---
export const guideContenus = pgTable(
  "guide_contenus",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    section: text("section").notNull(),
    langue: text("langue").notNull(),
    titre: text("titre").notNull(),
    corps: text("corps").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("guide_contenus_tenant_logement_section_langue_uq").on(
      t.tenantId,
      t.logementId,
      t.section,
      t.langue,
    ),
    index("guide_contenus_tenant_logement_idx").on(
      t.tenantId,
      t.logementId,
    ),
  ],
);

export const accesSerrure = pgTable(
  "acces_serrure",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id").references(() => reservations.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull().default("numerique"),
    code: text("code"),
    statut: text("statut").notNull().default("actif"),
    fournisseur: text("fournisseur"),
    expireLe: timestamp("expire_le", { withTimezone: true }),
    note: text("note"),
    /** Référence stable et rejouable (migration 0097). */
    ref: text("ref").notNull(),
    /** Fenêtre d'ouverture du code (migration 0097). */
    valideDe: timestamp("valide_de", { withTimezone: true }).notNull(),
    valideA: timestamp("valide_a", { withTimezone: true }).notNull(),
    revoqueLe: timestamp("revoque_le", { withTimezone: true }),
    revoquePar: text("revoque_par"),
    /** Identifiant du code chez la serrure connectée (Nuki). */
    externalId: text("external_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("acces_serrure_tenant_logement_idx").on(
      t.tenantId,
      t.logementId,
      t.createdAt,
    ),
    index("acces_serrure_tenant_reservation_idx").on(
      t.tenantId,
      t.reservationId,
    ),
    index("acces_serrure_tenant_statut_idx").on(
      t.tenantId,
      t.statut,
      t.createdAt,
    ),
    uniqueIndex("acces_serrure_tenant_ref_uq").on(t.tenantId, t.ref),
    index("acces_serrure_tenant_logement_statut_idx").on(
      t.tenantId,
      t.logementId,
      t.statut,
    ),
  ],
);

// --- US6 Expérience voyageur : demandes d'extras + avis (T608, T609) ---
export const demandesExtra = pgTable(
  "demandes_extra",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(),
    type: text("type").notNull(),
    prixCentimes: integer("prix_centimes").notNull(),
    message: text("message"),
    statut: text("statut").notNull().default("demande"),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .notNull()
      .defaultNow(),
    decideeLe: timestamp("decidee_le", { withTimezone: true }),
    decideePar: text("decidee_par"),
    motifRefus: text("motif_refus"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("demandes_extra_tenant_ref_uq").on(t.tenantId, t.ref),
    index("demandes_extra_tenant_statut_idx").on(
      t.tenantId,
      t.statut,
      t.creeLe,
    ),
  ],
);

export const avisVoyageur = pgTable(
  "avis_voyageur",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    logementId: uuid("logement_id")
      .notNull()
      .references(() => logements.id, { onDelete: "cascade" }),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(),
    note: integer("note"),
    commentaire: text("commentaire"),
    statut: text("statut").notNull().default("invite"),
    inviteLe: timestamp("invite_le", { withTimezone: true })
      .notNull()
      .defaultNow(),
    recuLe: timestamp("recu_le", { withTimezone: true }),
    publieLe: timestamp("publie_le", { withTimezone: true }),
    reponseHote: text("reponse_hote"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("avis_voyageur_tenant_ref_uq").on(t.tenantId, t.ref),
    uniqueIndex("avis_voyageur_tenant_reservation_uq").on(
      t.tenantId,
      t.reservationId,
    ),
    index("avis_voyageur_tenant_logement_statut_idx").on(
      t.tenantId,
      t.logementId,
      t.statut,
    ),
  ],
);

// --- US7 API et intégrations (T702) ---
export const clesApi = pgTable(
  "cles_api",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    nom: text("nom").notNull(),
    /** `lcd_` + 8 caractères, non secret. */
    prefixe: text("prefixe").notNull(),
    /** SHA-256 hexadécimal de la clé complète, unique globalement. */
    hash: text("hash").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull().default([]),
    expireLe: timestamp("expire_le", { withTimezone: true }),
    dernierUsageLe: timestamp("dernier_usage_le", { withTimezone: true }),
    revoqueLe: timestamp("revoque_le", { withTimezone: true }),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("cles_api_hash_uq").on(t.hash),
    index("cles_api_tenant_cree_idx").on(t.tenantId, t.creeLe),
  ],
);

export const integrationsTenant = pgTable(
  "integrations_tenant",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    fournisseur: text("fournisseur").notNull(),
    actif: boolean("actif").notNull().default(true),
    config: jsonb("config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .notNull()
      .defaultNow(),
    majLe: timestamp("maj_le", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("integrations_tenant_fournisseur_uq").on(
      t.tenantId,
      t.fournisseur,
    ),
  ],
);

export type ClesApiRow = typeof clesApi.$inferSelect;
export type NewClesApiRow = typeof clesApi.$inferInsert;
export type IntegrationsTenantRow = typeof integrationsTenant.$inferSelect;
export type NewIntegrationsTenantRow = typeof integrationsTenant.$inferInsert;

// --- T720 : suivi d'audience, publicité et événements first-party ---
export const suiviConfiguration = pgTable("suivi_configuration", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  actif: boolean("actif").notNull().default(false),
  configuration: jsonb("configuration")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  majLe: timestamp("maj_le", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const suiviEvenements = pgTable(
  "suivi_evenements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    visiteurId: text("visiteur_id").notNull(),
    sessionId: text("session_id").notNull(),
    type: text("type").notNull(),
    nom: text("nom").notNull(),
    page: text("page").notNull(),
    referrer: text("referrer"),
    campagne: jsonb("campagne")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    valeurCentimes: bigint("valeur_centimes", { mode: "number" }),
    metadata: jsonb("metadata")
      .$type<Record<string, string | number | boolean>>()
      .notNull()
      .default({}),
    consentement: jsonb("consentement")
      .$type<Record<string, boolean | string>>()
      .notNull()
      .default({}),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("suivi_evenements_tenant_cree_idx").on(t.tenantId, t.creeLe),
    index("suivi_evenements_tenant_type_cree_idx").on(
      t.tenantId,
      t.type,
      t.creeLe,
    ),
    index("suivi_evenements_tenant_visiteur_idx").on(
      t.tenantId,
      t.visiteurId,
      t.creeLe,
    ),
  ],
);

// Journal d'exécution des tâches planifiées (spec 006, FR-001). Une ligne par
// exécution, y compris les échecs : c'est la source du contrôle d'absence
// (2× la cadence, FR-002) et de la vue /supervision. Table plateforme : les
// tâches sont globales, pas par tenant.
export const executionsTaches = pgTable(
  "executions_taches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tache: text("tache").notNull(),
    declencheur: text("declencheur").notNull().default("cron"),
    debut: timestamp("debut", { withTimezone: true }).notNull().defaultNow(),
    fin: timestamp("fin", { withTimezone: true }),
    statut: text("statut").notNull().default("en_cours"),
    compteurs: jsonb("compteurs")
      .$type<Record<string, number>>()
      .notNull()
      .default({}),
    erreur: text("erreur"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("executions_taches_tache_idx").on(t.tache, t.debut),
    index("executions_taches_debut_idx").on(t.debut),
  ],
);

// Alertes d'exploitation (spec 006, FR-003). Une alerte par incident (clé
// stable), acquittable ; la notification email est anti-tempête via
// `derniere_notification`. Table plateforme : l'exploitation n'est pas
// multi-tenant.
export const alertesExploitation = pgTable(
  "alertes_exploitation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cle: text("cle").notNull(),
    source: text("source").notNull(),
    severite: text("severite").notNull().default("avertissement"),
    message: text("message").notNull(),
    statut: text("statut").notNull().default("ouverte"),
    runbook: text("runbook"),
    details: jsonb("details")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    ouverteLe: timestamp("ouverte_le", { withTimezone: true })
      .notNull()
      .defaultNow(),
    derniereNotification: timestamp("derniere_notification", {
      withTimezone: true,
    }),
    derniereNotificationErreur: text("derniere_notification_erreur"),
    acquitteeLe: timestamp("acquittee_le", { withTimezone: true }),
    resolueLe: timestamp("resolue_le", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("alertes_exploitation_cle_uq").on(t.cle),
    index("alertes_exploitation_statut_idx").on(t.statut, t.ouverteLe),
  ],
);

// Journaux applicatifs (spec 006, FR-016). Les lignes structurées de
// `logInfo`/`logErreur` (stdout) sont aussi persistées ici pour être lues
// depuis la supervision, sans SSH. Table plateforme : un incident
// d'exploitation est global. Le contexte est masqué avant écriture (clés
// sensibles, cf. `src/lib/telemetry.ts`) et la purge est bornée (0109).
export const journauxApplicatifs = pgTable(
  "journaux_applicatifs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    niveau: text("niveau").notNull().default("info"),
    message: text("message").notNull(),
    contexte: jsonb("contexte")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    requestId: text("request_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("journaux_applicatifs_created_at_idx").on(t.createdAt),
    index("journaux_applicatifs_niveau_idx").on(t.niveau, t.createdAt),
  ],
);

// Trace des événements Stripe (spec 006, FR-024). Une ligne par événement
// reçu (`evt_...`), clé d'idempotence ; le rejeu des échecs relit l'événement
// normalisé stocké ici. Table plateforme : Stripe est global, pas par tenant.
export const evenementsStripe = pgTable(
  "evenements_stripe",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    evenementId: text("evenement_id").notNull(),
    type: text("type").notNull(),
    objetId: text("objet_id"),
    statut: text("statut").notNull().default("recu"),
    evenement: jsonb("evenement")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    erreur: text("erreur"),
    tentatives: integer("tentatives").notNull().default(1),
    recuLe: timestamp("recu_le", { withTimezone: true })
      .notNull()
      .defaultNow(),
    derniereTentativeLe: timestamp("derniere_tentative_le", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    traiteLe: timestamp("traite_le", { withTimezone: true }),
    rejoueLe: timestamp("rejoue_le", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("evenements_stripe_evenement_id_uq").on(t.evenementId),
    index("evenements_stripe_statut_idx").on(t.statut, t.recuLe),
  ],
);

// Journal de correspondance V1 → V2 (spec 005, US3). Une ligne par
// enregistrement source traité ; la clé primaire rend l'import idempotent et
// interdit deux écritures concurrentes sur la même correspondance.
export const migrationV1 = pgTable(
  "migration_v1",
  {
    source: text("source").notNull(),
    cleSource: text("cle_source").notNull(),
    cible: text("cible").notNull(),
    idCible: text("id_cible").notNull(),
    empreinte: text("empreinte").notNull(),
    statut: text("statut").notNull(),
    motif: text("motif"),
    creeLe: timestamp("cree_le", { withTimezone: true })
      .notNull()
      .defaultNow(),
    majLe: timestamp("maj_le", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.source, t.cleSource, t.cible] }),
    index("migration_v1_statut_idx").on(t.statut),
  ],
);

export type MigrationV1Row = typeof migrationV1.$inferSelect;

export type ExecutionTacheRow = typeof executionsTaches.$inferSelect;
export type NewExecutionTacheRow = typeof executionsTaches.$inferInsert;
export type AlerteExploitationRow = typeof alertesExploitation.$inferSelect;
export type NewAlerteExploitationRow = typeof alertesExploitation.$inferInsert;
export type JournalApplicatifRow = typeof journauxApplicatifs.$inferSelect;

export type SuiviConfigurationRow = typeof suiviConfiguration.$inferSelect;
export type NewSuiviConfigurationRow =
  typeof suiviConfiguration.$inferInsert;
export type SuiviEvenementRow = typeof suiviEvenements.$inferSelect;
export type NewSuiviEvenementRow = typeof suiviEvenements.$inferInsert;

export type DemandeExtraRow = typeof demandesExtra.$inferSelect;
export type NewDemandeExtraRow = typeof demandesExtra.$inferInsert;
export type AvisVoyageurRow = typeof avisVoyageur.$inferSelect;
export type NewAvisVoyageurRow = typeof avisVoyageur.$inferInsert;

export type SiteTenantRow = typeof sitesTenants.$inferSelect;
export type NewSiteTenantRow = typeof sitesTenants.$inferInsert;
export type PageSiteRow = typeof pagesSite.$inferSelect;
export type NewPageSiteRow = typeof pagesSite.$inferInsert;
export type SectionSiteRow = typeof sectionsSite.$inferSelect;
export type NewSectionSiteRow = typeof sectionsSite.$inferInsert;
export type DomaineRow = typeof domaines.$inferSelect;
export type NewDomaineRow = typeof domaines.$inferInsert;
export type PromotionRow = typeof promotions.$inferSelect;
export type NewPromotionRow = typeof promotions.$inferInsert;
export type DemandeSejourRow = typeof demandesSejour.$inferSelect;
export type ReleveProprietaireRow = typeof relevesProprietaires.$inferSelect;
export type NewReleveProprietaireRow = typeof relevesProprietaires.$inferInsert;
export type EnvoiReleveRow = typeof envoisReleves.$inferSelect;
export type NewEnvoiReleveRow = typeof envoisReleves.$inferInsert;
export type PaiementProprietaireRow =
  typeof paiementsProprietaires.$inferSelect;
export type NewPaiementProprietaireRow =
  typeof paiementsProprietaires.$inferInsert;
export type GuideContenuRow = typeof guideContenus.$inferSelect;
export type NewGuideContenuRow = typeof guideContenus.$inferInsert;
export type AccesSerrureRow = typeof accesSerrure.$inferSelect;
export type NewAccesSerrureRow = typeof accesSerrure.$inferInsert;
