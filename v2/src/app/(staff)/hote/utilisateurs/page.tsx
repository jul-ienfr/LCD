import Link from "next/link";
import { connection } from "next/server";
import { libelleRole } from "@/domain/utilisateur";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { FormulaireCreationUtilisateur } from "./formulaire-creation";
import {
  FormulaireActivation,
  FormulaireMotDePasse,
  FormulaireRole,
} from "./formulaires";

export const instant = false;

const COULEURS_ROLE: Record<string, string> = {
  admin: "bg-stone-900 text-white",
  hote: "bg-sky-100 text-sky-900",
  comptable: "bg-amber-100 text-amber-900",
  presta: "bg-violet-100 text-violet-900",
  proprietaire: "bg-emerald-100 text-emerald-900",
  commercial: "bg-rose-100 text-rose-900",
};

export default async function PageUtilisateurs() {
  await connection();
  const session = await requireRole(["admin"]);
  const tenantId = tenantIdDeSession(session);

  const utilisateurs = await new DrizzleUserRepository().listerParTenant(
    tenantId,
  );
  const tries = [...utilisateurs].sort((a, b) => {
    const soiA = a.id === session.user.id ? 0 : 1;
    const soiB = b.id === session.user.id ? 0 : 1;
    return soiA - soiB || a.name.localeCompare(b.name);
  });

  const actifs = utilisateurs.filter((u) => u.actif).length;
  const admins = utilisateurs.filter(
    (u) => u.actif && u.role === "admin",
  ).length;

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Utilisateurs</h1>
          <p className="text-stone-600">
            Comptes de l’équipe, rôles et accès à la plateforme.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Comptes</p>
          <p className="mt-1 text-2xl font-semibold">{utilisateurs.length}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Actifs</p>
          <p className="mt-1 text-2xl font-semibold">{actifs}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">Administrateurs actifs</p>
          <p className="mt-1 text-2xl font-semibold">{admins}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Créer un compte</h2>
        <p className="mt-1 text-sm text-stone-600">
          Chaque compte est rattaché à votre organisation. Le rôle détermine les
          pages accessibles.
        </p>
        <div className="mt-5">
          <FormulaireCreationUtilisateur />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Comptes de l’équipe</h2>
          <p className="text-xs text-stone-500">
            La désactivation ferme immédiatement les sessions ouvertes.
          </p>
        </div>

        {tries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-stone-600">
            Aucun utilisateur pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {tries.map((utilisateur) => {
              const soi = utilisateur.id === session.user.id;
              return (
                <li className="p-5" key={utilisateur.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        <span className="truncate">{utilisateur.name}</span>
                        {soi ? (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                            Vous
                          </span>
                        ) : null}
                      </p>
                      <p className="break-all text-sm text-stone-600">
                        {utilisateur.email}
                      </p>
                      <p className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span
                          className={`rounded-full px-3 py-1 font-medium ${
                            COULEURS_ROLE[utilisateur.role] ??
                            "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {libelleRole(utilisateur.role)}
                        </span>
                        <span
                          className={
                            utilisateur.actif
                              ? "rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-900"
                              : "rounded-full bg-red-100 px-3 py-1 font-medium text-red-900"
                          }
                        >
                          {utilisateur.actif ? "Actif" : "Désactivé"}
                        </span>
                      </p>
                    </div>

                    <div className="w-full max-w-sm space-y-3">
                      {soi ? (
                        <p className="text-xs text-stone-500">
                          Votre propre mot de passe se change dans{" "}
                          <Link className="underline" href="/hote/securite">
                            Sécurité / 2FA
                          </Link>
                          .
                        </p>
                      ) : (
                        <>
                          <FormulaireActivation
                            actif={utilisateur.actif}
                            userId={utilisateur.id}
                          />
                          <details>
                            <summary className="cursor-pointer text-xs underline">
                              Changer le rôle
                            </summary>
                            <div className="mt-3">
                              <FormulaireRole
                                roleActuel={utilisateur.role}
                                userId={utilisateur.id}
                              />
                            </div>
                          </details>
                          <details>
                            <summary className="cursor-pointer text-xs underline">
                              Réinitialiser le mot de passe
                            </summary>
                            <div className="mt-3">
                              <FormulaireMotDePasse userId={utilisateur.id} />
                            </div>
                          </details>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/proprietaires">
          Propriétaires
        </Link>
        <Link className="underline" href="/hote/securite">
          Sécurité / 2FA
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
