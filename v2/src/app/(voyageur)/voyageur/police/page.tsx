import Link from "next/link";
import { connection } from "next/server";
import { fichesRestantes } from "@/domain/fiche-police";
import { DrizzleFichesPoliceRepository } from "@/infrastructure/db/repositories/fiches-police-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { LANGUES, langueDepuisParam } from "@/lib/i18n";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";
import { enregistrerFichePoliceAction } from "./actions";

export const instant = false;

export default async function PagePolice({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; police?: string; lang?: string }>;
}) {
  await connection();

  const params = await searchParams;
  const langue = langueDepuisParam(params.lang);
  const token = params.t ?? "";
  const payload = token ? verifierTokenVoyageur(token) : null;
  const retour = `/voyageur?t=${encodeURIComponent(token)}&lang=${langue}`;

  if (!payload) {
    return (
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Fiche de police</h1>
        <p className="rounded-xl border border-alerte bg-alerte-douce p-4 text-alerte">
          Lien invalide ou expiré. Ouvrez votre espace voyageur depuis le
          message de votre hôte.
        </p>
        <Link className="text-sm underline" href="/voyageur">
          Retour à l’espace voyageur
        </Link>
      </main>
    );
  }

  const reservation = await new DrizzleReservationRepository().trouverParId(
    payload.tenantId,
    payload.reservationId,
  );
  if (!reservation || reservation.logementId !== payload.logementId) {
    return (
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Fiche de police</h1>
        <p className="rounded-xl border border-alerte bg-alerte-douce p-4 text-alerte">
          Séjour introuvable pour ce lien.
        </p>
        <Link className="text-sm underline" href="/voyageur">
          Retour à l’espace voyageur
        </Link>
      </main>
    );
  }

  const fiches = await new DrizzleFichesPoliceRepository().listerParReservation(
    payload.tenantId,
    reservation.id,
  );
  const restantes = fichesRestantes(reservation.voyageurs, fiches.length);
  const ref = crypto.randomUUID();

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Espace voyageur
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Fiche de police
        </h1>
        <p className="text-encre-douce">
          Séjour {reservation.ref} · {reservation.debut} → {reservation.fin}.
          Une fiche par personne hébergée, avant l’arrivée.
        </p>
        <nav aria-label="Langue" className="flex flex-wrap gap-2 pt-1">
          {LANGUES.map((code) => (
            <Link
              aria-current={code === langue ? "true" : undefined}
              className={
                code === langue
                  ? "rounded-full bg-encre px-3 py-1 text-xs font-medium text-fond"
                  : "rounded-full border border-bordure px-3 py-1 text-xs font-medium"
              }
              href={`/voyageur/police?t=${encodeURIComponent(token)}&lang=${code}`}
              key={code}
            >
              {code.toUpperCase()}
            </Link>
          ))}
        </nav>
      </header>

      {params.police === "ok" ? (
        <p className="rounded-xl border border-accent bg-accent-douce p-4 text-sm text-accent">
          Fiche enregistrée. Merci.
        </p>
      ) : null}
      {params.police === "erreur" ? (
        <p className="rounded-xl border border-danger bg-danger-douce p-4 text-sm text-danger">
          Fiche non enregistrée : vérifiez les champs obligatoires.
        </p>
      ) : null}
      {params.police === "complet" ? (
        <p className="rounded-xl border border-alerte bg-alerte-douce p-4 text-sm text-alerte">
          Toutes les fiches prévues pour ce séjour sont déjà remplies.
        </p>
      ) : null}

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          {fiches.length}/{reservation.voyageurs} fiche(s) reçue(s)
        </h2>
        {fiches.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm" role="list">
            {fiches.map((fiche) => (
              <li key={fiche.id}>
                {fiche.prenoms} {fiche.nom} — reçue le{" "}
                {fiche.createdAt.toISOString().slice(0, 10)}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-3 text-xs text-encre-faine">
          Données conservées 6 mois puis supprimées automatiquement. Aucune
          copie de passeport ou de carte d’identité n’est demandée ni stockée.
        </p>
      </section>

      {restantes > 0 ? (
        <form
          action={enregistrerFichePoliceAction}
          className="space-y-4 rounded-2xl border border-bordure bg-surface p-6 shadow-sm"
        >
          <input name="token" type="hidden" value={token} />
          <input name="langue" type="hidden" value={langue} />
          <input name="ref" type="hidden" value={ref} />
          <h2 className="text-lg font-semibold">
            Fiche {fiches.length + 1} sur {reservation.voyageurs}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Nom *</span>
              <input
                autoComplete="family-name"
                className="w-full rounded-lg border border-bordure p-2"
                maxLength={120}
                minLength={2}
                name="nom"
                required
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Prénoms *</span>
              <input
                autoComplete="given-name"
                className="w-full rounded-lg border border-bordure p-2"
                maxLength={120}
                minLength={2}
                name="prenoms"
                required
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Date de naissance *</span>
              <input
                className="w-full rounded-lg border border-bordure p-2"
                max={new Date().toISOString().slice(0, 10)}
                name="dateNaissance"
                required
                type="date"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Lieu de naissance *</span>
              <input
                className="w-full rounded-lg border border-bordure p-2"
                maxLength={160}
                minLength={2}
                name="lieuNaissance"
                required
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Nationalité *</span>
              <input
                autoComplete="country-name"
                className="w-full rounded-lg border border-bordure p-2"
                maxLength={80}
                minLength={2}
                name="nationalite"
                required
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Téléphone mobile *</span>
              <input
                autoComplete="tel"
                className="w-full rounded-lg border border-bordure p-2"
                maxLength={24}
                name="telephone"
                required
                type="tel"
              />
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="font-medium">Domicile habituel *</span>
            <input
              autoComplete="street-address"
              className="w-full rounded-lg border border-bordure p-2"
              maxLength={240}
              minLength={5}
              name="domicile"
              required
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Email (facultatif)</span>
            <input
              autoComplete="email"
              className="w-full rounded-lg border border-bordure p-2"
              maxLength={254}
              name="email"
              type="email"
            />
          </label>

          <p className="text-xs text-encre-faine">
            Champs obligatoires marqués *. La fiche est transmise de façon
            chiffrée à votre hôte et n’est pas utilisée à d’autres fins.
          </p>
          <button
            className="rounded-full bg-encre px-6 py-3 text-sm font-semibold text-fond"
            type="submit"
          >
            Enregistrer la fiche
          </button>
        </form>
      ) : null}

      <Link className="text-sm underline" href={retour}>
        ← Retour à mon séjour
      </Link>
    </main>
  );
}
