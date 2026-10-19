// Connexion — deux régimes, un seul module (lib/identite.ts) :
// - Mode IdP (LCD_IDP=1, F3) : l'entrée sans-IdP a disparu — cette page
//   devient l'anneau vers le portail Authelia (1FA + 2FA exigés). Atteignable
//   seule en accès direct :3100 (démo/SAS local) : via Caddy, les anonymes
//   sont déjà redirigés par forward_auth AVANT le rendu.
// - Mode lab (P1) : sélection de compte humain déclaré côté gateway — le
//   cookie httpOnly ne prouve rien côté serveur : le RBAC réel reste la
//   passerelle, à chaque écriture.
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { loginAction, logoutAction } from "../actions";
import { lireIdentite, portailIdp } from "@/lib/identite";
import { PROFILS } from "@/lib/profils";

export const instant = false;

export const metadata: Metadata = { title: "Connexion" };

const COMPTES = Object.entries(PROFILS).map(([qui, p]) => ({
  qui,
  nom: p.nom,
  role: p.titre,
  cible: p.cible,
  icone: p.icone,
}));

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
  const id = await lireIdentite();

  // --- Mode IdP (F3) : anneau vers le portail, jamais de faux picker. -----
  if (id.modeIdp) {
    const moi = id.qui ? PROFILS[id.qui] : undefined;
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 py-4">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight">Connexion</h1>
          <p className="mt-2 text-sm text-[var(--encre-douce)]">
            Authentification unique via le portail IdP (Authelia) — le second
            facteur (TOTP) est exigé avant toute page protégée.
          </p>
        </div>

        {sp.erreur === "deconnexion" && (
          <p className="rounded-xl bg-(--ok-douce) p-3 text-sm text-(--ok)" role="status">
            Déconnecté — session IdP détruite. À bientôt !
            {moi ? ` (${moi.nom})` : ""}
          </p>
        )}
        {sp.erreur === "inconnu" && (
          <p className="rounded-xl bg-(--danger-douce) p-3 text-sm text-(--danger)" role="alert">
            Compte inconnu — choisissez un profil ci-dessous.
          </p>
        )}

        {id.quiReel ? (
          <div className="carte flex items-center gap-3 p-4" role="status">
            <span aria-hidden className="text-2xl">{moi?.icone || "🔐"}</span>
            <div className="flex-1">
              <p className="font-bold">
                Connecté : {moi ? moi.nom : id.quiReel}{" "}
                <span className="text-(--encre-faine)">
                  · {moi ? moi.titre : "sujet IdP"}
                </span>
              </p>
              <form action={logoutAction} className="mt-2">
                <button type="submit" className="bouton bouton-secondaire px-3 py-1.5 text-sm">
                  Se déconnecter (détruit la session IdP)
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="carte flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-sm text-[var(--encre-douce)]">
              Aucune session : ouvrez le portail, identifiez-vous (1FA), puis
              confirmez le second facteur — le portail vous ramène ici.
            </p>
            <a href={`${portailIdp()}/`} className="bouton px-5 py-2.5">
              Ouvrir le portail de connexion
            </a>
          </div>
        )}

        <p className="text-center text-sm text-[var(--encre-faine)]">
          Pas besoin de compte pour explorer :{" "}
          <Link href="/voyageur" className="text-(--accent-fonce) font-semibold underline">
            espace voyageur
          </Link>{" "}
          ouvert à tous (lien signé, sans session).
        </p>
      </div>
    );
  }

  // --- Mode lab (P1) : sélection de rôle de démonstration. -----------------
  const jar = await cookies();
  const courant = jar.get("lcd_qui")?.value || "";
  const moi = COMPTES.find((c) => c.qui === courant);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-4">
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight">Qui pilote ?</h1>
        <p className="mt-2 text-sm text-[var(--encre-douce)]">
          Démo : chaque profil voit un écran adapté à son rôle. Les droits réels
          sont revérifiés par la passerelle (RBAC), comme en production.
        </p>
      </div>

      {sp.erreur === "inconnu" && (
        <p className="rounded-xl bg-(--danger-douce) p-3 text-sm text-(--danger)" role="alert">
          Compte inconnu — choisissez un profil ci-dessous.
        </p>
      )}
      {sp.erreur === "deconnexion" && (
        <p className="rounded-xl bg-(--ok-douce) p-3 text-sm text-(--ok)" role="status">
          Déconnecté. À bientôt !{moi ? ` (${moi.nom})` : ""}
        </p>
      )}

      {moi && (
        <div className="carte flex items-center gap-3 p-4" role="status">
          <span aria-hidden className="text-2xl">{moi.icone}</span>
          <div className="flex-1">
            <p className="font-bold">
              Connecté : {moi.nom} <span className="text-(--encre-faine)">· {moi.role}</span>
            </p>
            <form action={logoutAction} className="mt-2">
              <button type="submit" className="bouton bouton-secondaire px-3 py-1.5 text-sm">
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COMPTES.map((c) => (
          <form action={loginAction} key={c.qui}>
            <input type="hidden" name="qui" value={c.qui} />
            <button
              type="submit"
              className={`carte h-full w-full cursor-pointer flex-col items-start gap-1 p-4 text-left transition hover:border-(--accent) hover:shadow-md ${courant === c.qui ? "border-2 border-(--accent)" : ""}`}
            >
              <span aria-hidden className="text-2xl">{c.icone}</span>
              <span className="font-bold">{c.nom}</span>
              <span className="text-xs text-[var(--encre-douce)]">{c.role}</span>
              {courant === c.qui && (
                <span className="badge badge-accent mt-1">session active</span>
              )}
            </button>
          </form>
        ))}
      </div>

      <p className="text-center text-sm text-[var(--encre-faine)]">
        Pas besoin de compte pour explorer :{" "}
        <Link href="/voyageur" className="text-(--accent-fonce) font-semibold underline">
          espace voyageur
        </Link>{" "}
        ouvert à tous.
      </p>
    </div>
  );
}
