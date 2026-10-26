import Link from "next/link";
import { connection } from "next/server";
import { DrizzleSessionsRepository } from "@/infrastructure/db/repositories/sessions-repository";
import { requireSession } from "@/lib/session";
import { Formulaire2FA } from "./formulaire-2fa";
import { FormulaireMotDePasse } from "./formulaire-mot-de-passe";
import { fermerAutresSessionsAction } from "./sessions-actions";

export const instant = false;

function formaterDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

function nomNavigateur(userAgent: string | null | undefined): string {
  if (!userAgent) return "Navigateur inconnu";
  if (/Edg\//.test(userAgent)) return "Microsoft Edge";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  if (/Chrome\//.test(userAgent)) return "Chrome";
  if (/Safari\//.test(userAgent)) return "Safari";
  return userAgent.slice(0, 80);
}

export default async function PageSecurite({
  searchParams,
}: {
  searchParams: Promise<{ motdepasse?: string; sessions?: string }>;
}) {
  await connection();
  // Chaque compte gère sa propre sécurité, quel que soit son rôle.
  const session = await requireSession();
  const params = await searchParams;
  const depotSessions = new DrizzleSessionsRepository();
  const affichees = await depotSessions.listerActivesParUtilisateur(
    session.user.id,
    10,
    session.session.id,
  );
  const totalSessions = Math.max(
    affichees.length,
    await depotSessions.compterSessionsActives(session.user.id),
  );
  const autresSessions = Math.max(0, totalSessions - 1);
  const retour =
    session.user.role === "presta"
      ? "/presta"
      : session.user.role === "proprietaire"
        ? "/proprio"
        : session.user.role === "commercial"
          ? "/commercial"
          : "/hote";

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Mon compte
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Sécurité</h1>
        <p className="text-encre-douce">
          Compte : <span className="font-medium">{session.user.email}</span>
        </p>
      </header>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Authentification à deux facteurs
        </h2>
        <p className="mt-1 text-sm text-encre-douce">
          TOTP : compatible Google Authenticator, Aegis, 1Password, etc.
        </p>
        <div className="mt-5">
          <Formulaire2FA actif={Boolean(session.user.twoFactorEnabled)} />
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Sessions actives</h2>
        <p className="mt-1 text-sm text-encre-douce">
          {totalSessions} session{totalSessions > 1 ? "s" : ""} ouverte
          {totalSessions > 1 ? "s" : ""}. Fermez les autres si vous avez
          utilisé un appareil partagé.
        </p>
        {params.sessions === "ok" ? (
          <p className="mt-4 rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent">
            Les autres sessions ont été fermées.
          </p>
        ) : null}
        {params.sessions === "erreur" ? (
          <p className="mt-4 rounded-xl border border-danger bg-danger-douce p-3 text-sm text-danger">
            La fermeture des sessions a échoué. Réessayez.
          </p>
        ) : null}
        <ul className="mt-4 divide-y divide-bordure rounded-xl border border-bordure">
          {affichees.map((element) => {
            const actuelle = element.id === session.session.id;
            return (
              <li
                className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
                key={element.id}
              >
                <div>
                  <p className="font-medium">
                    {nomNavigateur(element.userAgent)}
                    {actuelle ? (
                      <span className="ml-2 rounded-full bg-accent-douce px-2 py-0.5 text-xs text-accent">
                        Session actuelle
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-encre-faine">
                    {formaterDate(element.createdAt)} ·{" "}
                    {element.ipAddress ?? "IP inconnue"}
                  </p>
                </div>
                <p className="text-xs text-encre-douce">
                  Expire le {formaterDate(element.expiresAt)}
                </p>
              </li>
            );
          })}
        </ul>
        {totalSessions > affichees.length ? (
          <p className="mt-2 text-xs text-encre-faine">
            {affichees.length} sessions au maximum sont affichées.
          </p>
        ) : null}
        <form action={fermerAutresSessionsAction} className="mt-4">
          <button
            className="rounded-full border border-danger px-4 py-2 text-sm font-medium text-danger disabled:opacity-50"
            disabled={autresSessions === 0}
            type="submit"
          >
            Fermer les autres sessions
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Mot de passe</h2>
        <p className="mt-1 text-sm text-encre-douce">
          La modification déconnecte les autres sessions ouvertes.
        </p>
        {params.motdepasse === "ok" ? (
          <p className="mt-4 rounded-xl border border-accent bg-accent-douce p-3 text-sm text-accent">
            Mot de passe modifié. Les autres sessions ont été déconnectées.
          </p>
        ) : null}
        <div className="mt-5">
          <FormulaireMotDePasse />
        </div>
      </section>

      <Link className="text-sm underline" href={retour}>
        Retour à mon espace
      </Link>
    </main>
  );
}
