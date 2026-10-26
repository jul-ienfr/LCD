import Link from "next/link";
import { connection } from "next/server";
import { libelleRole } from "@/domain/utilisateur";
import { lireApercuBrut } from "@/lib/apercu";

export const instant = false;

export default async function PageLectureSeule() {
  await connection();
  const apercu = await lireApercuBrut();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
        Aperçu
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Écriture bloquée
      </h1>
      <p className="text-encre-douce">
        L’aperçu « {apercu ? libelleRole(apercu.role) : "staff"} » est en
        lecture seule. Aucune modification n’a été enregistrée. Quittez
        l’aperçu pour reprendre les actions avec votre rôle réel.
      </p>
      <form action="/preview/quitter" method="post">
        <button
          className="rounded-full bg-encre px-6 py-3 text-sm font-semibold text-fond"
          type="submit"
        >
          Quitter l’aperçu
        </button>
      </form>
      <Link className="text-sm underline" href="/hote">
        Retour au pilotage
      </Link>
    </main>
  );
}
