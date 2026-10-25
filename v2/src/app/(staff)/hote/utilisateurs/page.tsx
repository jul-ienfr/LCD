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
  admin: "bg-encre text-fond",
  hote: "bg-accent-douce text-accent",
  comptable: "bg-alerte-douce text-alerte",
  presta: "bg-violet-100 text-violet-900",
  proprietaire: "bg-accent-douce text-accent",
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
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Utilisateurs</h1>
          <p className="text-encre-douce">
            Comptes de l’équipe, rôles et accès à la plateforme.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Comptes</p>
          <p className="mt-1 text-2xl font-semibold">{utilisateurs.length}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Actifs</p>
          <p className="mt-1 text-2xl font-semibold">{actifs}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Administrateurs actifs</p>
          <p className="mt-1 text-2xl font-semibold">{admins}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Créer un compte</h2>
        <p className="mt-1 text-sm text-encre-douce">
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
          <p className="text-xs text-encre-faine">
            La désactivation ferme immédiatement les sessions ouvertes.
          </p>
        </div>

        {tries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun utilisateur pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
            {tries.map((utilisateur) => {
              const soi = utilisateur.id === session.user.id;
              return (
                <li className="p-5" key={utilisateur.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        <span className="truncate">{utilisateur.name}</span>
                        {soi ? (
                          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-encre-douce">
                            Vous
                          </span>
                        ) : null}
                      </p>
                      <p className="break-all text-sm text-encre-douce">
                        {utilisateur.email}
                      </p>
                      <p className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span
                          className={`rounded-full px-3 py-1 font-medium ${
                            COULEURS_ROLE[utilisateur.role] ??
                            "bg-surface-2 text-encre-douce"
                          }`}
                        >
                          {libelleRole(utilisateur.role)}
                        </span>
                        <span
                          className={
                            utilisateur.actif
                              ? "rounded-full bg-accent-douce px-3 py-1 font-medium text-accent"
                              : "rounded-full bg-danger-douce px-3 py-1 font-medium text-danger"
                          }
                        >
                          {utilisateur.actif ? "Actif" : "Désactivé"}
                        </span>
                      </p>
                    </div>

                    <div className="w-full max-w-sm space-y-3">
                      {soi ? (
                        <p className="text-xs text-encre-faine">
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
