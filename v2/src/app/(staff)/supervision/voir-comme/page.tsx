import Link from "next/link";
import { connection } from "next/server";
import { NavSuperAdmin } from "@/components/nav-super-admin";
import { ROLES_APERCU } from "@/domain/apercu";
import { libelleRole } from "@/domain/utilisateur";
import { lireApercu } from "@/lib/apercu";
import { requireSuperAdmin } from "@/lib/session";
import { demarrerApercuAction } from "./actions";

export const instant = false;

export default async function PageVoirComme({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  await connection();
  const session = await requireSuperAdmin();
  const params = await searchParams;
  const apercu = await lireApercu(session);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <NavSuperAdmin actif="/supervision/voir-comme" />

      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Plateforme
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Voir comme</h1>
        <p className="text-encre-douce">
          Aperçu du pilotage staff avec un rôle réduit. Le cookie est signé,
          limité à 2 h, lié à votre compte et n’ouvre aucune écriture : toutes
          les mutations sont refusées par le proxy et par les server actions.
        </p>
      </header>

      {params.erreur ? (
        <p className="rounded-xl border border-danger bg-danger-douce p-4 text-sm text-danger">
          {params.erreur === "role"
            ? "Rôle d’aperçu inconnu."
            : "Votre compte n’a pas d’e-mail exploitable."}
        </p>
      ) : null}

      {apercu ? (
        <section className="rounded-2xl border border-alerte bg-alerte-douce p-6 text-sm text-alerte">
          <p>
            Aperçu en cours : <strong>{libelleRole(apercu.role)}</strong> (
            {apercu.email}), jusqu’à{" "}
            {new Date(apercu.exp * 1000).toLocaleString("fr-FR")}.
          </p>
          <form action="/preview/quitter" className="mt-4" method="post">
            <button
              className="rounded-full border border-alerte px-5 py-2 font-semibold"
              type="submit"
            >
              Quitter l’aperçu
            </button>
          </form>
        </section>
      ) : (
        <form
          action={demarrerApercuAction}
          className="space-y-4 rounded-2xl border border-bordure bg-surface p-6"
        >
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Rôle à prévisualiser</span>
            <select
              className="w-full rounded-lg border border-bordure p-3"
              defaultValue="comptable"
              name="role"
            >
              {ROLES_APERCU.map((role) => (
                <option key={role} value={role}>
                  {libelleRole(role)}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-encre-faine">
            Les rôles externes (prestataire, propriétaire, commercial) ont leurs
            portails dédiés et ne sont pas prévisualisés ici.
          </p>
          <button
            className="rounded-full bg-encre px-6 py-3 text-sm font-semibold text-fond"
            type="submit"
          >
            Démarrer l’aperçu lecture seule
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/supervision">
          ← Supervision
        </Link>
        <Link className="underline" href="/journal?action=apercu">
          Journal des aperçus
        </Link>
      </div>
    </main>
  );
}
