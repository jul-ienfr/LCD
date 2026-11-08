import assert from "node:assert/strict";
import { CreerCanal } from "@/application/use-cases/creer-canal";
import { CreerReservation } from "@/application/use-cases/creer-reservation";
import { EnregistrerFluxIcs } from "@/application/use-cases/enregistrer-flux-ics";
import { ImporterIcs } from "@/application/use-cases/importer-ics";
import { ModifierCanal } from "@/application/use-cases/modifier-canal";
import { SupprimerCanal } from "@/application/use-cases/supprimer-canal";
import { SynchroniserFluxIcs } from "@/application/use-cases/synchroniser-flux-ics";
import type { ReponseIcs } from "@/application/ports/flux-ics-repository";
import { parserIcs } from "@/domain/ics";
import { sql, sqlAdmin } from "@/infrastructure/db/client";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleCanalRepository } from "@/infrastructure/db/repositories/canal-repository";
import { DrizzleFluxIcsRepository } from "@/infrastructure/db/repositories/flux-ics-repository";
import { DrizzleImportIcsRepository } from "@/infrastructure/db/repositories/import-ics-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { acquerirVerrouIcs } from "@/infrastructure/db/verrou-systeme";

if (!sqlAdmin) {
  throw new Error("MIGRATION_DATABASE_URL est requis pour ce test.");
}
const owner = sqlAdmin;

function evenement(uid: string, debut: string, fin: string, resume: string): string {
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART;VALUE=DATE:${debut.replaceAll("-", "")}`,
    `DTEND;VALUE=DATE:${fin.replaceAll("-", "")}`,
    `SUMMARY:${resume}`,
    "END:VEVENT",
  ].join("\r\n");
}

function calendrier(...evenements: string[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LCD//Test ICS//FR",
    ...evenements,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

const icsV1 = calendrier(
  evenement("event-a@test", "2027-01-01", "2027-01-04", "Reserved"),
  evenement("event-b@test", "2027-01-05", "2027-01-07", "Reserved"),
);
const icsV2 = calendrier(
  evenement("event-a@test", "2027-01-02", "2027-01-05", "Reserved"),
  evenement("event-c@test", "2027-01-10", "2027-01-12", "Not available"),
);
const icsV3 = calendrier(
  evenement("event-a@test", "2027-01-02", "2027-01-05", "Reserved"),
  evenement("event-c@test", "2027-01-10", "2027-01-12", "Not available"),
  evenement("event-e@test", "2027-01-20", "2027-01-22", "Reserved"),
);

const refs = (ics: string) =>
  Object.fromEntries(parserIcs(ics).evenements.map((e) => [e.uid, e.ref]));

const slug = `test-ics-${Date.now()}`;
let tenantId: string | null = null;

try {
  const [tenant] = await owner`
    insert into tenants (slug, nom) values (${slug}, 'Test ICS')
    returning id
  `;
  tenantId = tenant!.id;
  const [logement] = await owner`
    insert into logements (tenant_id, code, nom)
    values (${tenantId}, ${`ICS-${Date.now()}`}, 'Logement test ICS')
    returning id
  `;
  const logementId = logement!.id;

  const fluxRepo = new DrizzleFluxIcsRepository();
  const canalRepo = new DrizzleCanalRepository();
  const importRepo = new DrizzleImportIcsRepository();

  const canal = await new CreerCanal(canalRepo).executer({
    tenantId,
    logementId,
    code: "airbnb",
    libelle: "Airbnb test",
    externalListingId: "123456",
    bufferJours: 2,
    url: "https://example.com/canal-airbnb.ics",
  });
  assert.equal(canal.cle, "airbnb:123456");
  assert.equal(canal.bufferJours, 2);
  const fluxCanal = (await fluxRepo.listerParLogement(tenantId, logementId)).find(
    (entree) => entree.canalId === canal.id,
  );
  assert.ok(fluxCanal);
  assert.equal(fluxCanal.url, "https://example.com/canal-airbnb.ics");

  const fluxRenomme = await new EnregistrerFluxIcs(fluxRepo).executer({
    tenantId,
    logementId,
    canalId: canal.id,
    libelle: "Airbnb test",
    url: "https://example.com/canal-airbnb-v2.ics",
  });
  assert.equal(fluxRenomme.id, fluxCanal.id);
  assert.equal(fluxRenomme.url, "https://example.com/canal-airbnb-v2.ics");
  assert.equal(fluxRenomme.canalId, canal.id);

  const canalModifie = await new ModifierCanal(canalRepo).executer({
    tenantId,
    canalId: canal.id,
    libelle: "Airbnb test modifié",
    externalListingId: "123456",
    bufferJours: 1,
    actif: true,
    exportActif: false,
  });
  assert.equal(canalModifie.bufferJours, 1);
  assert.equal(canalModifie.exportActif, false);

  await new SupprimerCanal(canalRepo).executer(tenantId, canal.id);
  assert.equal(await canalRepo.trouverParId(tenantId, canal.id), null);
  assert.equal(
    (await fluxRepo.listerParLogement(tenantId, logementId)).some(
      (entree) => entree.canalId === canal.id,
    ),
    false,
  );

  const flux = await new EnregistrerFluxIcs(fluxRepo).executer({
    tenantId,
    logementId,
    libelle: "Flux test",
    url: "https://example.com/calendar.ics",
  });

  const reponses: ReponseIcs[] = [
    {
      nonModifie: false,
      texte: icsV1,
      etag: '"v1"',
      derniereModification: null,
      statutHttp: 200,
    },
    {
      nonModifie: false,
      texte: icsV2,
      etag: '"v2"',
      derniereModification: null,
      statutHttp: 200,
    },
    {
      nonModifie: false,
      texte: icsV3,
      etag: '"v3"',
      derniereModification: null,
      statutHttp: 200,
    },
    {
      nonModifie: true,
      texte: null,
      etag: '"v3"',
      derniereModification: null,
      statutHttp: 304,
    },
  ];
  const recuperateur = {
    async recuperer(): Promise<ReponseIcs> {
      const reponse = reponses.shift();
      if (!reponse) throw new Error("Réponse ICS de test épuisée.");
      return reponse;
    },
  };
  const synchroniser = new SynchroniserFluxIcs(
    fluxRepo,
    recuperateur,
    new ImporterIcs(importRepo),
  );

  const v1 = await synchroniser.executer({ tenantId, fluxId: flux.id, force: true });
  assert.equal(v1.crees, 2);
  assert.equal(v1.conflits, 0);

  let lignes = await owner`
    select ref, debut, fin, flux_ics_id
    from reservations where tenant_id = ${tenantId}
    order by debut
  `;
  assert.equal(lignes.length, 2);
  assert.equal(lignes[0]!.flux_ics_id, flux.id);
  assert.equal(lignes[1]!.flux_ics_id, flux.id);

  const v2 = await synchroniser.executer({ tenantId, fluxId: flux.id, force: true });
  assert.equal(v2.crees, 0);
  assert.equal(v2.blocages, 1);
  assert.equal(v2.misAJour, 1);
  assert.equal(v2.annules, 1);

  lignes = await owner`
    select ref, debut, fin, flux_ics_id
    from reservations where tenant_id = ${tenantId}
    order by debut
  `;
  const refsV2 = refs(icsV2);
  assert.equal(lignes.length, 1);
  assert.equal(lignes[0]!.ref, refsV2["event-a@test"]);
  assert.equal(lignes[0]!.debut, "2027-01-02");

  const blocages = await owner`
    select ref, motif, flux_ics_id
    from blocages where tenant_id = ${tenantId}
  `;
  assert.equal(blocages.length, 1);
  assert.equal(blocages[0]!.ref, refsV2["event-c@test"]);
  assert.equal(blocages[0]!.flux_ics_id, flux.id);

  const direct = await new CreerReservation(
    new DrizzleReservationRepository(),
    new DrizzleBlocageRepository(),
  ).executer({
    tenantId,
    logementId,
    ref: "DIR-ICS-CONFLIT",
    clientNom: "Direct",
    voyageurs: 2,
    debut: "2027-01-20",
    fin: "2027-01-22",
    montantCentimes: 40_000,
  });
  assert.equal(direct.ref, "DIR-ICS-CONFLIT");

  const v3 = await synchroniser.executer({ tenantId, fluxId: flux.id, force: true });
  assert.equal(v3.crees, 0);
  assert.equal(v3.conflits, 1);

  const refsV3 = refs(icsV3);
  const eExiste = await owner`
    select id from reservations
    where tenant_id = ${tenantId} and ref = ${refsV3["event-e@test"]}
  `;
  assert.equal(eExiste.length, 0);

  const v4 = await synchroniser.executer({ tenantId, fluxId: flux.id, force: true });
  assert.equal(v4.nonModifie, true);

  const runs = await fluxRepo.listerRuns(tenantId, flux.id, 10);
  assert.equal(runs.length, 4);
  const runConflit = runs.find((run) => run.conflits === 1);
  assert.ok(runConflit);
  assert.equal(runConflit.details?.conflits?.[0]?.ref, refsV3["event-e@test"]);

  const fluxFinal = await fluxRepo.trouverParId(tenantId, flux.id);
  assert.ok(fluxFinal?.derniereSync);
  assert.equal(fluxFinal.etag, '"v3"');
  assert.equal(fluxFinal.echecsConsecutifs, 0);

  await owner`
    delete from verrous_systeme
    where nom = 'ics-sync' and expire_le < now()
  `;
  const verrouA = await acquerirVerrouIcs(1);
  assert.ok(verrouA);
  assert.equal(await acquerirVerrouIcs(1), null);
  await owner`
    update verrous_systeme
    set expire_le = now() - interval '1 second'
    where nom = 'ics-sync'
  `;
  const verrouB = await acquerirVerrouIcs(1);
  assert.ok(verrouB);
  await verrouA.liberer();
  assert.equal(await verrouB.renouveler(), true);
  await verrouB.liberer();

  console.log(
    "SYNC ICS VALIDÉE : canaux, création, mise à jour, suppression, blocage, conflit, 304, historique, bail distribué et rattachement flux.",
  );
} finally {
  if (tenantId) {
    await owner`delete from ics_sync_runs where tenant_id = ${tenantId}`;
    await owner`delete from reservations where tenant_id = ${tenantId}`;
    await owner`delete from blocages where tenant_id = ${tenantId}`;
    await owner`delete from canaux where tenant_id = ${tenantId}`;
    await owner`delete from flux_ics where tenant_id = ${tenantId}`;
    await owner`delete from logements where tenant_id = ${tenantId}`;
    await owner`delete from tenants where id = ${tenantId}`;
  }
  await sql.end({ timeout: 5 });
  await owner.end({ timeout: 5 });
}
