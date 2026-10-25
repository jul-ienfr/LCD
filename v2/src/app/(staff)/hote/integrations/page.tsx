import Link from "next/link";
import { connection } from "next/server";
import {
  LIBELLES_EVENEMENT_WEBHOOK,
  type StatutLivraisonWebhook,
} from "@/domain/webhook";
import { DrizzleWebhookRepository } from "@/infrastructure/db/repositories/webhook-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { FormulaireWebhook } from "./formulaire";
import { supprimerWebhookAction } from "./actions";

export const instant = false;

const LIBELLES_STATUT: Record<StatutLivraisonWebhook, string> = {
  pending: "en attente",
  success: "livré",
  failed: "échec",
};

export default async function PageIntegrations() {
  await connection();

  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const repo = new DrizzleWebhookRepository();
  const [webhooks, livraisons] = await Promise.all([
    repo.listerParTenant(tenantId),
    repo.listerLivraisonsParTenant(tenantId, 20),
  ]);

  const secretDefaut = `${crypto.randomUUID()}${crypto.randomUUID()}`;

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Intégrations
          </h1>
          <p className="text-encre-douce">
            Webhooks signés vers Home Assistant, Moli ou un autre outil.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Ajouter un webhook</h2>
        <p className="mt-1 text-sm text-encre-douce">
          Les livraisons sont tentées immédiatement par le cron horaire, avec
          jusqu’à 5 essais.
        </p>
        <div className="mt-5">
          <FormulaireWebhook secretDefaut={secretDefaut} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {webhooks.length} webhook{webhooks.length > 1 ? "s" : ""}
        </h2>
        {webhooks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun webhook configuré.
          </p>
        ) : (
          <ul className="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
            {webhooks.map((webhook) => (
              <li className="p-4" key={webhook.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{webhook.libelle}</p>
                    <p className="truncate text-xs text-encre-faine">
                      {webhook.url}
                    </p>
                    <p className="mt-1 text-xs text-encre-faine">
                      {webhook.events
                        .map((evenement) => LIBELLES_EVENEMENT_WEBHOOK[evenement])
                        .join(" · ")}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-encre-faine">
                      secret : {webhook.secret}
                    </p>
                  </div>
                  <form action={supprimerWebhookAction}>
                    <input
                      name="webhookId"
                      type="hidden"
                      value={webhook.id}
                    />
                    <button
                      className="rounded-full border border-danger px-3 py-2 text-xs font-medium text-danger"
                      type="submit"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Dernières livraisons</h2>
        {livraisons.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucune livraison pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-bordure bg-fond text-left">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Événement</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium">Essais</th>
                  <th className="p-3 font-medium">Détail</th>
                </tr>
              </thead>
              <tbody>
                {livraisons.map((livraison) => (
                  <tr
                    className="border-b border-bordure"
                    key={livraison.id}
                  >
                    <td className="p-3">
                      {livraison.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="p-3">
                      {LIBELLES_EVENEMENT_WEBHOOK[livraison.eventType]}
                    </td>
                    <td className="p-3">
                      {LIBELLES_STATUT[livraison.statut]}
                    </td>
                    <td className="p-3">{livraison.tentatives}</td>
                    <td className="p-3 text-xs text-encre-faine">
                      {livraison.dernierCode
                        ? `${livraison.dernierCode} `
                        : ""}
                      {livraison.dernierMessage ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
        <Link className="underline" href="/hote/planning">
          Planning
        </Link>
      </nav>
    </main>
  );
}
