// Connexion (simulée, lab) : on choisit un compte humain déclaré côté
// gateway. Pas de mot de passe : c'est la sélection de RÔLE de démonstration.
// La gateway reste la vérité RBAC (le cookie ne prouve rien côté serveur).
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { loginAction, logoutAction } from "../actions";

export const instant = false;

export const metadata: Metadata = { title: "Connexion" };

const COMPTES: { qui: string; nom: string; role: string; cible: string; icone: string }[] = [
  { qui: "personne_01", nom: "Claire", role: "Super admin — fondatrice", cible: "/hote", icone: "👑" },
  { qui: "personne_02", nom: "Alex", role: "Admin — exploitant", cible: "/hote", icone: "🛠️" },
  { qui: "personne_03", nom: "Sam", role: "Opérateur — terrain", cible: "/hote", icone: "🧰" },
  { qui: "personne_04", nom: "Ruth", role: "Comptable — lecture/validate", cible: "/hote", icone: "📊" },
  { qui: "personne_05", nom: "Marc", role: "Propriétaire — portail tiers", cible: "/proprio?logement=log1&qui=personne_05", icone: "🏡" },
  { qui: "commercial_01", nom: "Inès", role: "Commercial — CRM/offres", cible: "/commercial", icone: "🤝" },
];

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const sp = await searchParams;
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
              <span className="text-xs text-(--encre-douce)">{c.role}</span>
              {courant === c.qui && (
                <span className="badge badge-accent mt-1">session active</span>
              )}
            </button>
          </form>
        ))}
      </div>

      <p className="text-center text-sm text-(--encre-faine)">
        Pas besoin de compte pour explorer :{" "}
        <Link href="/voyageur" className="text-(--accent-fonce) font-semibold underline">
          espace voyageur
        </Link>{" "}
        ouvert à tous.
      </p>
    </div>
  );
}
