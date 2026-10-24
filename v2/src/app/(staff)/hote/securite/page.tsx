import Link from "next/link";
import { connection } from "next/server";
import { requireRole } from "@/lib/session";
import { Formulaire2FA } from "./formulaire-2fa";
import { FormulaireMotDePasse } from "./formulaire-mot-de-passe";

export const instant = false;

export default async function PageSecurite({
  searchParams,
}: {
  searchParams: Promise<{ motdepasse?: string }>;
}) {
  await connection();
  const session = await requireRole(["admin", "hote"]);
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
          Espace hôte
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Sécurité</h1>
        <p className="text-stone-600">
          Compte : <span className="font-medium">{session.user.email}</span>
        </p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Authentification à deux facteurs
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          TOTP : compatible Google Authenticator, Aegis, 1Password, etc.
        </p>
        <div className="mt-5">
          <Formulaire2FA actif={Boolean(session.user.twoFactorEnabled)} />
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Mot de passe</h2>
        <p className="mt-1 text-sm text-stone-600">
          La modification déconnecte les autres sessions ouvertes.
        </p>
        {params.motdepasse === "ok" ? (
          <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
            Mot de passe modifié. Les autres sessions ont été déconnectées.
          </p>
        ) : null}
        <div className="mt-5">
          <FormulaireMotDePasse />
        </div>
      </section>

      <Link className="text-sm underline" href="/hote">
        Retour au tableau de bord
      </Link>
    </main>
  );
}
