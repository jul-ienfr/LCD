import Link from "next/link";

export default function PageHote() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
          Espace hôte
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Tableau de bord
        </h1>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-stone-600">
          Squelette v2 : ce panneau accueillera les logements, le planning et
          les prix. Le RBAC et le tenant seront branchés côté serveur.
        </p>
      </section>

      <p className="text-sm text-stone-500">
        <Link className="underline" href="/">
          Retour à l’accueil
        </Link>
      </p>
    </main>
  );
}
