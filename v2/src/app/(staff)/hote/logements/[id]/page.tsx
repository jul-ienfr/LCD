import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { creerTokenCalendrier } from "@/lib/calendrier-token";
import { env } from "@/lib/env";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { BoutonCopier } from "./bouton-copier";
import { FormulaireGuide } from "./formulaire-guide";

export const instant = false;

export default async function PageGuideLogement({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const { id } = await params;

  const logement = await new DrizzleLogementRepository().trouverParId(
    tenantId,
    id,
  );
  if (!logement) notFound();

  const tokenCalendrier = creerTokenCalendrier({
    tenantId,
    logementId: logement.id,
  });
  const urlCalendrier = `${env.APP_URL.replace(/\/$/u, "")}/api/calendrier/${logement.id}?t=${encodeURIComponent(tokenCalendrier)}`;

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Logement {logement.code}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Guide — {logement.nom}
          </h1>
          <p className="text-encre-douce">
            Ces informations apparaissent dans l’espace voyageur signé.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote/logements">
          ← Logements
        </Link>
      </header>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <FormulaireGuide logement={logement} />
      </section>

      <section
        className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm"
        id="calendrier"
      >
        <h2 className="text-lg font-semibold">Abonnement calendrier</h2>
        <p className="mt-1 text-sm text-encre-douce">
          Ajoutez cette URL dans Google Calendar, Apple Calendar ou Outlook
          pour suivre les réservations et blocages de ce logement. Le flux ne
          contient ni nom de client ni montant.
        </p>
        <code className="mt-4 block break-all rounded-xl bg-surface-2 p-3 text-xs">
          {urlCalendrier}
        </code>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <BoutonCopier valeur={urlCalendrier} />
          <a
            className="rounded-full bg-encre px-4 py-2 text-sm font-medium text-fond"
            href={urlCalendrier}
          >
            Télécharger l’ICS
          </a>
        </div>
        <p className="mt-3 text-xs text-encre-faine">
          Lien signé, valable 10 ans. La rotation de{" "}
          <code>BETTER_AUTH_SECRET</code> l’invalide.
        </p>
      </section>

      <Link className="text-sm underline" href="/hote">
        Retour au tableau de bord
      </Link>
    </main>
  );
}
