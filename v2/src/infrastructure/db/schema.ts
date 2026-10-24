import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
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
    statut: text("statut").notNull().default("actif"),
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
    voyageurs: integer("voyageurs").notNull().default(1),
    debut: text("debut").notNull(), // AAAA-MM-JJ
    fin: text("fin").notNull(), // AAAA-MM-JJ, exclusive
    statut: text("statut").notNull().default("brouillon"),
    montantCentimes: integer("montant_centimes").notNull().default(0),
    source: text("source").notNull().default("direct"),
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
    date: date("date", { mode: "string" }).notNull(), // AAAA-MM-JJ
    prixCentimes: integer("prix_centimes").notNull(),
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
    uniqueIndex("tarifs_tenant_logement_date_uq").on(
      t.tenantId,
      t.logementId,
      t.date,
    ),
    index("tarifs_tenant_date_idx").on(t.tenantId, t.date),
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
  (t) => [index("audit_logs_tenant_date_idx").on(t.tenantId, t.createdAt)],
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

export type TenantRow = typeof tenants.$inferSelect;
export type NewTenantRow = typeof tenants.$inferInsert;
export type LogementRow = typeof logements.$inferSelect;
export type NewLogementRow = typeof logements.$inferInsert;
export type ReservationRow = typeof reservations.$inferSelect;
export type NewReservationRow = typeof reservations.$inferInsert;
export type TarifRow = typeof tarifs.$inferSelect;
export type NewTarifRow = typeof tarifs.$inferInsert;
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
export type MissionRow = typeof missions.$inferSelect;
export type NewMissionRow = typeof missions.$inferInsert;
export type IncidentRow = typeof incidents.$inferSelect;
export type NewIncidentRow = typeof incidents.$inferInsert;
export type FactureRow = typeof factures.$inferSelect;
export type NewFactureRow = typeof factures.$inferInsert;
export type FactureLigneRow = typeof factureLignes.$inferSelect;
export type NewFactureLigneRow = typeof factureLignes.$inferInsert;
