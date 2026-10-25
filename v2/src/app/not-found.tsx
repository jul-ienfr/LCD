import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
        404
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Cette page n’existe pas.
      </h1>
      <p className="text-encre-douce">
        Le lien est peut-être ancien, ou l’adresse contient une erreur.
      </p>
      <Link className="underline" href="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
