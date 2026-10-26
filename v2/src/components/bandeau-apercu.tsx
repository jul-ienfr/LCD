import { libelleRole } from "@/domain/utilisateur";
import type { RoleApercu } from "@/domain/apercu";

export function BandeauApercu({
  role,
  email,
}: {
  role: RoleApercu;
  email: string;
}) {
  return (
    <div className="sticky top-0 z-50 border-b border-alerte bg-alerte-douce px-4 py-3 text-sm text-alerte">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p>
          <strong>Aperçu lecture seule</strong> — rôle « {libelleRole(role)} »
          pour {email}. Les écritures sont bloquées.
        </p>
        <form action="/preview/quitter" method="post">
          <button
            className="rounded-full border border-alerte px-4 py-1.5 text-xs font-semibold"
            type="submit"
          >
            Quitter l’aperçu
          </button>
        </form>
      </div>
    </div>
  );
}
