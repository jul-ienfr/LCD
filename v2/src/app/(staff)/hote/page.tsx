import Link from "next/link";
import { connection } from "next/server";
import { requireSession } from "@/lib/session";
import { BoutonDeconnexion } from "./bouton-deconnexion";

// Route staff bloquante : session avant rendu.
export const instant = false;

export default async function PageHote() {
  await connection();
  const session = await requireSession();

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
          Espace hôte
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Bonjour {session.user.name}
        </h1>
        <p className="text-stone-600">
          Rôle : <span className="font-medium">{session.user.role}</span>
        </p>
        <div className="pt-2">
          <BoutonDeconnexion />
        </div>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Première tranche verticale</h2>
        <p className="mt-2 text-stone-600">
          Le socle auth + tenant + logements est branché. La suite : planning,
          prix, puis portail voyageur.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            className="inline-block rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white"
            href="/hote/logements"
          >
            Gérer les logements
          </Link>
          <Link
            className="inline-block rounded-full border border-stone-300 px-5 py-3 text-sm font-medium"
            href="/hote/planning"
          >
            Planning
          </Link>
          <Link
            className="inline-block rounded-full border border-stone-300 px-5 py-3 text-sm font-medium"
            href="/hote/prix"
          >
            Prix
          </Link>
          <Link
            className="inline-block rounded-full border border-stone-300 px-5 py-3 text-sm font-medium"
            href="/hote/securite"
          >
            Sécurité / 2FA
          </Link>
        </div>
      </section>

      <Link className="text-sm underline" href="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
