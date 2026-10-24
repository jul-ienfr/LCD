import Link from "next/link";
import { connection } from "next/server";
import { requireRole } from "@/lib/session";
import { Formulaire2FA } from "./formulaire-2fa";

export const instant = false;

export default async function PageSecurite() {
  await connection();
  const session = await requireRole(["admin", "hote"]);

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

      <Link className="text-sm underline" href="/hote">
        Retour au tableau de bord
      </Link>
    </main>
  );
}
