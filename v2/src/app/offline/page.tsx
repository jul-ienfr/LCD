import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
        Hors ligne
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Vous êtes hors connexion.
      </h1>
      <p className="text-encre-douce">
        Cette page n’est pas encore disponible en cache. Reconnectez-vous au
        réseau, puis réessayez. Les pages déjà consultées restent accessibles.
      </p>
      <Link className="underline" href="/voyageur">
        Ouvrir mon séjour
      </Link>
      <Link className="underline" href="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
