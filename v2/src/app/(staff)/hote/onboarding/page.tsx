import Link from "next/link";
import { connection } from "next/server";
import {
  conformiteAnnonce,
} from "@/domain/annonce";
import { joursDuMois } from "@/domain/calendrier";
import { peutPublierLogement, type Logement } from "@/domain/logement";
import { DrizzleAnnoncesConformiteRepository } from "@/infrastructure/db/repositories/annonces-conformite-repository";
import { DrizzleFluxIcsRepository } from "@/infrastructure/db/repositories/flux-ics-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import {
  changerPublicationAction,
  verifierCoproAction,
} from "../annonce/actions";

export const instant = false;

interface Etape {
  code: string;
  titre: string;
  detail: string;
  fait: boolean;
  lien?: { href: string; label: string };
}

export default async function PageOnboarding({
  searchParams,
}: {
  searchParams: Promise<{
    logement?: string;
    copro?: string;
    publication?: string;
    erreur?: string;
  }>;
}) {
  await connection();
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;

  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const logement: Logement | undefined =
    logements.find((l) => l.id === params.logement) ?? logements[0];
  const tenant = await new DrizzleTenantRepository().trouver(tenantId);

  const conformite = logement
    ? await new DrizzleAnnoncesConformiteRepository().trouverParLogement(
        tenantId,
        logement.id,
      )
    : null;
  const resume = conformite ? conformiteAnnonce(conformite) : null;

  const mois = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
  })
    .format(new Date())
    .slice(0, 7);
  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  const tarifs =
    logement && premier && dernier
      ? await new DrizzleTarifRepository().listerParMois(
          tenantId,
          logement.id,
          premier,
          dernier,
        )
      : [];
  const flux = logement
    ? await new DrizzleFluxIcsRepository().listerParLogement(
        tenantId,
        logement.id,
      )
    : [];

  const editeurOk = Boolean(tenant?.siren && tenant.adresse);
  const annonceOk = Boolean(
    resume?.conforme && conformite?.numeroEnregistrement,
  );
  const coproOk = Boolean(logement?.coproVerifiee);
  const prixOk = tarifs.length > 0;
  const icsOk = flux.length > 0;
  const publie = logement?.publication === "publiee";
  const pret = editeurOk && annonceOk && coproOk && prixOk && publie;

  const etapes: Etape[] = [
    {
      code: "editeur",
      titre: "1 · Identité de l’éditeur",
      detail:
        "SIREN et adresse complets : ils figurent sur les factures et les mentions légales.",
      fait: editeurOk,
      lien: { href: "/hote/entite", label: "Compléter l’entité" },
    },
    {
      code: "logement",
      titre: "2 · Logement au registre",
      detail:
        "Code stable, nom et adresse du logement. Le code sert dans les liens et les exports.",
      fait: Boolean(logement),
      lien: { href: "/hote/logements", label: "Gérer les logements" },
    },
    {
      code: "annonce",
      titre: "3 · Conformité de l’annonce",
      detail:
        "Les neuf mentions obligatoires, les étiquettes DPE/GES et le numéro d’enregistrement mairie.",
      fait: annonceOk,
      lien: logement
        ? {
            href: `/hote/annonce?logement=${logement.id}`,
            label: "Compléter l’annonce",
          }
        : undefined,
    },
    {
      code: "copro",
      titre: "4 · Vérification copropriété",
      detail:
        "Règlement de copropriété, PV d’assemblée et accord du syndic vérifiés. Bloque la mise en ligne tant que ce n’est pas fait.",
      fait: coproOk,
      lien: logement
        ? {
            href: `/hote/annonce?logement=${logement.id}#copro`,
            label: "Ouvrir la vérification",
          }
        : undefined,
    },
    {
      code: "prix",
      titre: "5 · Prix du mois",
      detail:
        "Au moins une nuit tarifée sur le mois en cours. Sans prix, aucune demande ne peut être chiffrée.",
      fait: prixOk,
      lien: logement
        ? {
            href: `/hote/prix?logement=${logement.id}&mois=${mois}`,
            label: "Définir les prix",
          }
        : undefined,
    },
    {
      code: "ics",
      titre: "6 · Calendrier des plateformes",
      detail:
        "Flux ICS importé en lecture seule pour éviter les doubles réservations. Recommandé, pas bloquant pour la vente directe.",
      fait: icsOk,
      lien: logement
        ? {
            href: `/hote/planning/import?logement=${logement.id}`,
            label: "Importer un flux ICS",
          }
        : undefined,
    },
    {
      code: "golive",
      titre: "7 · Mise en ligne",
      detail:
        "Le logement est actif, vérifié, tarifé et publié : il apparaît sur la page de réservation publique.",
      fait: pret,
    },
  ];

  const faites = etapes.filter((etape) => etape.fait).length;
  const pourcentage = Math.round((faites / etapes.length) * 100);

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Nouveau logement · conformité
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Onboarding</h1>
          <p className="max-w-2xl text-encre-douce">
            Les conditions réelles avant qu’un logement puisse être proposé aux
            voyageurs. Aucune case n’est décorative : chaque étape est vérifiée
            sur les données enregistrées.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      {params.copro ? (
        <p
          className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
          role="status"
        >
          Vérification copropriété enregistrée.
        </p>
      ) : null}

      {params.publication ? (
        <p
          className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
          role="status"
        >
          Publication mise à jour.
        </p>
      ) : null}

      {params.erreur === "publication" ? (
        <p
          className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger"
          role="alert"
        >
          Publication refusée : vérifiez d’abord la copropriété et le statut
          actif du logement.
        </p>
      ) : null}

      {!logement ? (
        <section className="rounded-2xl border border-dashed border-bordure p-8 text-center">
          <h2 className="text-lg font-semibold">Aucun logement</h2>
          <p className="mt-2 text-sm text-encre-douce">
            Créez un premier logement pour démarrer l’onboarding.
          </p>
          <Link
            className="mt-5 inline-block rounded-full bg-encre px-5 py-3 text-sm font-medium text-fond"
            href="/hote/logements"
          >
            Créer un logement
          </Link>
        </section>
      ) : (
        <>
          {logements.length > 1 ? (
            <nav
              className="flex flex-wrap gap-2"
              aria-label="Choisir un logement"
            >
              {logements.map((item) => (
                <Link
                  key={item.id}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    item.id === logement.id
                      ? "border-accent bg-accent-douce font-semibold text-accent"
                      : "border-bordure bg-surface"
                  }`}
                  href={`/hote/onboarding?logement=${item.id}`}
                >
                  {item.nom}
                </Link>
              ))}
            </nav>
          ) : null}

          <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Avancement — {logement.nom}
                </h2>
                <p className="mt-1 text-sm text-encre-douce">
                  {faites} / {etapes.length} étapes · {pourcentage} %
                </p>
              </div>
              {pret ? (
                <span className="rounded-full bg-accent-douce px-3 py-1 text-xs font-semibold text-accent">
                  Prêt à réserver
                </span>
              ) : (
                <span className="rounded-full bg-alerte-douce px-3 py-1 text-xs font-semibold text-alerte">
                  Non publiable
                </span>
              )}
            </div>
            <div
              aria-hidden="true"
              className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2"
            >
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${pourcentage}%` }}
              />
            </div>
          </section>

          <ol className="space-y-3">
            {etapes.map((etape) => (
              <li
                key={etape.code}
                className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        etape.fait
                          ? "bg-accent text-fond"
                          : "border border-bordure text-encre-faine"
                      }`}
                    >
                      {etape.fait ? "✓" : ""}
                    </span>
                    <div>
                      <h3 className="font-semibold">{etape.titre}</h3>
                      <p className="mt-1 max-w-2xl text-sm text-encre-douce">
                        {etape.detail}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      etape.fait
                        ? "bg-accent-douce text-accent"
                        : "bg-alerte-douce text-alerte"
                    }`}
                  >
                    {etape.fait ? "Fait" : "À faire"}
                  </span>
                </div>

                {etape.code === "copro" ? (
                  <form
                    key={logement.id}
                    action={verifierCoproAction}
                    className="mt-4 flex flex-wrap items-center gap-4 border-t border-bordure pt-4"
                  >
                    <input type="hidden" name="logementId" value={logement.id} />
                    <input
                      type="hidden"
                      name="retour"
                      value="/hote/onboarding"
                    />
                    <label className="flex items-start gap-3 rounded-xl border border-bordure p-3 text-sm">
                      <input
                        className="mt-1"
                        defaultChecked={logement.coproVerifiee}
                        name="coproVerifiee"
                        type="checkbox"
                      />
                      <span>
                        <span className="font-medium">
                          Règlement, PV et accord du syndic vérifiés
                        </span>
                        <span className="mt-0.5 block text-encre-douce">
                          Décochez pour remasquer le logement.
                        </span>
                      </span>
                    </label>
                    <button
                      className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-fond"
                      type="submit"
                    >
                      Enregistrer
                    </button>
                  </form>
                ) : null}

                {etape.code === "golive" ? (
                  <div className="mt-4 border-t border-bordure pt-4">
                    <p className="text-sm text-encre-douce">
                      État de publication :{" "}
                      <span className="font-semibold">
                        {publie ? "publié" : "brouillon"}
                      </span>
                      . Un logement en brouillon n’apparaît jamais sur
                      `/reserver`, même vérifié.
                    </p>
                    <form
                      key={logement.id}
                      action={changerPublicationAction}
                      className="mt-3 flex flex-wrap items-center gap-3"
                    >
                      <input
                        type="hidden"
                        name="logementId"
                        value={logement.id}
                      />
                      <input
                        type="hidden"
                        name="retour"
                        value="/hote/onboarding"
                      />
                      <input
                        type="hidden"
                        name="publication"
                        value={publie ? "brouillon" : "publiee"}
                      />
                      <button
                        className="rounded-full bg-encre px-5 py-2.5 text-sm font-semibold text-fond disabled:opacity-50"
                        disabled={!publie && !peutPublierLogement(logement)}
                        type="submit"
                      >
                        {publie ? "Dépublier le logement" : "Publier le logement"}
                      </button>
                    </form>
                    {!publie && !peutPublierLogement(logement) ? (
                      <p className="mt-2 text-sm text-alerte">
                        Vérifiez la copropriété avant de publier.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {etape.lien ? (
                  <Link
                    className="mt-3 inline-block text-sm underline"
                    href={etape.lien.href}
                  >
                    {etape.lien.label}
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>

          <p className="text-sm text-encre-douce">
            {pret
              ? `Le logement est visible sur /reserver?tenant=${tenant?.slug ?? "lcd"}.`
              : "Tant que les étapes 1 à 5 ne sont pas complètes, le logement n’apparaît pas sur la page de réservation publique."}
          </p>
        </>
      )}

      <footer className="flex flex-wrap gap-4 border-t border-bordure pt-4 text-sm">
        <Link className="underline" href="/hote/annonce">
          Conformité de l’annonce
        </Link>
        <Link className="underline" href="/hote/logements">
          Logements
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </footer>
    </main>
  );
}
