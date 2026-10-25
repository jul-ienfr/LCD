export default function PagePublique() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          LCD Parc
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          La conciergerie, pilotée par le logiciel.
        </h1>
        <p className="max-w-2xl text-lg text-encre-douce">
          Un seul système pour l’hôte, le voyageur, le propriétaire et le
          prestataire. HTML d’abord : tout fonctionne sans JavaScript, même sur
          un vieux téléphone.
        </p>
      </header>

      <nav className="flex flex-wrap gap-3" aria-label="Accès rapides">
        <a
          className="rounded-full bg-encre px-5 py-3 text-sm font-medium text-fond"
          href="/reserver?tenant=lcd"
        >
          Réserver un séjour
        </a>
        <a
          className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
          href="/voyageur"
        >
          Espace voyageur
        </a>
        <a
          className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
          href="/hote"
        >
          Espace hôte
        </a>
      </nav>

      <footer className="text-sm text-encre-faine">
        Squelette v2 — architecture HTML-first, JS islands, PostgreSQL.
      </footer>
    </main>
  );
}
