import Link from "next/link";
import { connection } from "next/server";
import { FormulaireReinitialisation } from "./formulaire";

export const instant = false;

export default async function PageReinitialisation({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  await connection();
  const parametres = await searchParams;
  const token =
    typeof parametres.token === "string" ? parametres.token : null;
  const invalide = Boolean(parametres.error) || !token;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          LCD Parc
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Nouveau mot de passe
        </h1>
        <p className="text-encre-douce">
          Choisissez un mot de passe de 12 caractères minimum. Vos autres
          sessions seront fermées.
        </p>
      </header>

      {invalide || !token ? (
        <div className="space-y-4 rounded-2xl border border-danger bg-danger-douce p-5 text-sm text-danger">
          <p>
            Ce lien est invalide ou a expiré. Demandez un nouvel e-mail de
            réinitialisation.
          </p>
          <Link className="underline" href="/mot-de-passe-oublie">
            Demander un nouveau lien
          </Link>
        </div>
      ) : (
        <FormulaireReinitialisation token={token} />
      )}
    </main>
  );
}
