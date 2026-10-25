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
    nature: text("nature").notNull().default("nom_propre"),
    regime: text("regime").notNull().default("micro_bic_non_classe"),
    tva: text("tva").notNull().default("non"),
    siren: text("siren"),
    adresse: text("adresse"),
    mentionsLegales: text("mentions_legales"),
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
    checkinHeure: text("checkin_heure"),
    checkinInstructions: text("checkin_instructions"),
    wifiSsid: text("wifi_ssid"),
    wifiPassword: text("wifi_password"),
    regles: text("regles"),
    urgenceTel: text("urgence_tel"),
    guideTexte: text("guide_texte"),
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
    libelle: text("libelle").notNull(),
    url: text("url").notNull(),
    actif: boolean("actif").notNull().default(true),
    derniereSync: timestamp("derniere_sync", { withTimezone: true }),
    dernierStatut: text("dernier_statut"),
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
    uniqueIndex("flux_ics_tenant_logement_url_uq").on(
      t.tenantId,
      t.logementId,
      t.url,
    ),
    index("flux_ics_tenant_logement_idx").on(t.tenantId, t.logementId),
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

export const paiements = pgTable(
  "paiements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    factureId: uuid("facture_id")
      .notNull()
      .references(() => factures.id, { onDelete: "cascade" }),
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
