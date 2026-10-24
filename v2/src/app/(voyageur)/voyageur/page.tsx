import Link from "next/link";
import { revalidatePath } from "next/cache";

async function declarerIncident(formData: FormData) {
  "use server";

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  // TODO v2 : brancher un cas d'usage application/use-cases/declarer-incident.
  // Le formulaire fonctionne sans JS : POST natif vers la Server Action.
  revalidatePath("/voyageur");
}

export default function PageVoyageur() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
          Espace voyageur
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Votre séjour</h1>
        <p className="text-stone-600">
          Cette page est rendue côté serveur. Le formulaire ci-dessous
          fonctionne même si JavaScript est désactivé.
        </p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Déclarer un incident</h2>
        <form action={declarerIncident} className="mt-4 space-y-4">
          <label className="block text-sm font-medium" htmlFor="message">
            Que s’est-il passé ?
          </label>
          <textarea
            className="min-h-32 w-full rounded-xl border border-stone-300 p-3 text-base"
            id="message"
            name="message"
            required
            placeholder="Ex. la clé ne fonctionne plus…"
          />
          <button
            className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white"
            type="submit"
          >
            Envoyer
          </button>
        </form>
      </section>

      <p className="text-sm text-stone-500">
        <Link className="underline" href="/">
          Retour à l’accueil
        </Link>
      </p>
    </main>
  );
}
