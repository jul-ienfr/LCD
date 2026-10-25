import Link from "next/link";
import { connection } from "next/server";
import {
  aujourdHuiIso,
  eligibleAuDon,
  FORFAIT_OBJET_CENTIMES,
  JOURS_AVANT_DON,
  joursRestantsAvantDon,
  LIBELLES_STATUT_OBJET,
} from "@/domain/objet-trouve";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleObjetsTrouvesRepository } from "@/infrastructure/db/repositories/objets-trouves-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import {
  cloturerObjetTrouveAction,
  enregistrerObjetTrouveAction,
  envoyerObjetTrouveAction,
  reclamerObjetTrouveAction,
} from "./actions";

export const instant = false;

const CLASSES_STATUT: Record<string, string> = {
  trouve: "bg-alerte-douce text-alerte",
  reclame: "bg-accent-douce text-accent",
  envoye: "bg-surface-2 text-encre-douce",
  donne: "bg-surface-2 text-encre-faine",
};

export default async function PageObjetsTrouves({
  searchParams,
}: {
  searchParams: Promise<{ logement?: string; ok?: string; erreur?: string }>;
}) {
  await connection();
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;

  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const logement =
    logements.find((l) => l.id === params.logement) ?? logements[0];
  const objets = logement
    ? await new DrizzleObjetsTrouvesRepository().listerParLogement(
        tenantId,
        logement.id,
      )
    : [];

  if (!logement) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Objets trouvés
        </h1>
        <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          Créez d’abord un logement pour tenir son registre.
        </p>
        <Link className="text-sm underline" href="/hote/logements">
          Créer un logement
        </Link>
      </main>
    );
  }

  const enAttente = objets.filter(
    (o) => o.statut === "trouve" || o.statut === "reclame",
  ).length;
  const reclames = objets.filter((o) => o.statut === "reclame").length;
  const envoyes = objets.filter((o) => o.statut === "envoye").length;
  const pretsAuDon = objets.filter((o) => eligibleAuDon(o)).length;

  const messageOk =
    params.ok === "trouve"
      ? "Objet enregistré."
      : params.ok === "reclame"
        ? `Objet réclamé : ${formaterEuros(FORFAIT_OBJET_CENTIMES)} de frais.`
        : params.ok === "envoye"
          ? "Objet marqué envoyé."
          : params.ok === "donne"
            ? "Objet donné ou remis au stock."
            : null;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte · Relation voyageur
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Objets trouvés
          </h1>
          <p className="text-encre-douce">
            Registre par logement : réclamation, envoi, don après{" "}
            {JOURS_AVANT_DON} jours.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      {logements.length > 1 ? (
        <nav className="flex flex-wrap gap-2" aria-label="Choisir un logement">
          {logements.map((l) => (
            <Link
              key={l.id}
              className={`rounded-full border px-4 py-2 text-sm ${
                l.id === logement.id
                  ? "border-accent bg-accent-douce font-semibold text-accent"
                  : "border-bordure bg-surface"
              }`}
              href={`/hote/objets-trouves?logement=${l.id}`}
            >
              {l.nom}
            </Link>
          ))}
        </nav>
      ) : null}

      {messageOk ? (
        <p
          className="rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent"
          role="status"
        >
          {messageOk}
        </p>
      ) : null}
      {params.erreur ? (
        <p
          className="rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger"
          role="alert"
        >
          {params.erreur === "inattendu"
            ? "Erreur inattendue. Réessayez."
            : params.erreur}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">En attente</p>
          <p className="mt-1 text-3xl font-semibold">{enAttente}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Réclamés</p>
          <p className="mt-1 text-3xl font-semibold">{reclames}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Envoyés</p>
          <p className="mt-1 text-3xl font-semibold">{envoyes}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Prêts au don</p>
          <p className="mt-1 text-3xl font-semibold">{pretsAuDon}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Déclarer un objet trouvé</h2>
        <form action={enregistrerObjetTrouveAction} className="mt-4 space-y-3">
          <input type="hidden" name="logementId" value={logement.id} />
          <input type="hidden" name="ref" value={`objet-${crypto.randomUUID()}`} />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-1 text-sm font-medium sm:col-span-2">
              <span>Description</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="description"
                placeholder="Chargeur USB blanc"
                required
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Lieu</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="lieu"
                placeholder="Salon"
                required
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-1 text-sm font-medium">
              <span>Trouvé le</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                defaultValue={aujourdHuiIso()}
                name="trouveLe"
                required
                type="date"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Voyageur (optionnel)</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="voyageurNom"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Contact (optionnel)</span>
              <input
                className="w-full rounded-xl border border-bordure bg-surface p-3 text-sm"
                name="contact"
              />
            </label>
          </div>
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-fond"
            type="submit"
          >
            Enregistrer l’objet
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Registre de {logement.nom}</h2>
        {objets.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun objet déclaré. Les objets trouvés apparaîtront ici avec leur
            suivi.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {objets.map((objet) => (
              <li
                className="space-y-3 rounded-2xl border border-bordure bg-surface p-5 shadow-sm"
                key={objet.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${CLASSES_STATUT[objet.statut]}`}
                  >
                    {LIBELLES_STATUT_OBJET[objet.statut]}
                  </span>
                  <span className="text-xs text-encre-faine">
                    Trouvé le {objet.trouveLe}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{objet.description}</p>
                  <p className="mt-0.5 text-sm text-encre-douce">
                    {objet.lieu}
                    {objet.voyageurNom ? ` · ${objet.voyageurNom}` : ""}
                    {objet.contact ? ` · ${objet.contact}` : ""}
                  </p>
                </div>
                {objet.fraisCentimes > 0 ? (
                  <p className="text-sm">
                    Frais de réclamation :{" "}
                    <span className="font-semibold">
                      {formaterEuros(objet.fraisCentimes)}
                    </span>
                  </p>
                ) : null}
                {objet.envoyeLe ? (
                  <p className="text-sm text-encre-douce">
                    Envoyé le {objet.envoyeLe}
                  </p>
                ) : null}

                {objet.statut === "trouve" || objet.statut === "reclame" ? (
                  <details className="rounded-xl border border-bordure p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      {objet.statut === "reclame"
                        ? "Modifier la réclamation"
                        : "Réclamer cet objet"}
                    </summary>
                    <form
                      action={reclamerObjetTrouveAction}
                      className="mt-3 space-y-2"
                    >
                      <input
                        type="hidden"
                        name="logementId"
                        value={logement.id}
                      />
                      <input type="hidden" name="id" value={objet.id} />
                      <label className="block space-y-1 text-sm">
                        <span>Nom du voyageur</span>
                        <input
                          className="w-full rounded-lg border border-bordure bg-surface p-2 text-sm"
                          defaultValue={objet.voyageurNom ?? ""}
                          name="voyageurNom"
                          required
                        />
                      </label>
                      <label className="block space-y-1 text-sm">
                        <span>Contact</span>
                        <input
                          className="w-full rounded-lg border border-bordure bg-surface p-2 text-sm"
                          defaultValue={objet.contact ?? ""}
                          name="contact"
                          required
                        />
                      </label>
                      <button
                        className="rounded-full border border-bordure px-4 py-2 text-sm font-medium"
                        type="submit"
                      >
                        Marquer réclamé ({formaterEuros(FORFAIT_OBJET_CENTIMES)})
                      </button>
                    </form>
                  </details>
                ) : null}

                <div className="flex flex-wrap gap-3 text-sm">
                  {objet.statut === "reclame" ? (
                    <form action={envoyerObjetTrouveAction}>
                      <input
                        type="hidden"
                        name="logementId"
                        value={logement.id}
                      />
                      <input type="hidden" name="id" value={objet.id} />
                      <button className="underline" type="submit">
                        Marquer envoyé
                      </button>
                    </form>
                  ) : null}
                  {objet.statut === "trouve" ||
                  objet.statut === "reclame" ? (
                    eligibleAuDon(objet) ? (
                      <form action={cloturerObjetTrouveAction}>
                        <input
                          type="hidden"
                          name="logementId"
                          value={logement.id}
                        />
                        <input type="hidden" name="id" value={objet.id} />
                        <button className="underline" type="submit">
                          Donner / remettre au stock
                        </button>
                      </form>
                    ) : (
                      <p className="text-encre-faine">
                        Don possible dans{" "}
                        {joursRestantsAvantDon(objet)} jour
                        {joursRestantsAvantDon(objet) > 1 ? "s" : ""}.
                      </p>
                    )
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href={`/hote/phrases?logement=${logement.id}`}>
          Phrases types
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
