"use client";
// Formulaire de déclaration de rotation d'un slot de secret (F5 §S3.5-V5).
// Gesté par la Server Action `declarerRotation` (POST /v1/secrets/rotate).
// Ne saisit JAMAIS une valeur : seulement le nom du slot + la date ISO.
import { useActionState } from "react";
import { declarerRotation, type ResultatAction } from "@/app/actions";
import type { Langue } from "@/lib/i18n";
import { t } from "../../i18n";

export function FormulaireRotation({
  slots,
  quiDefaut,
  lang,
}: {
  slots: string[];
  quiDefaut: string;
  lang: Langue;
}) {
  const [etat, action, enCours] = useActionState<ResultatAction | null, FormData>(
    declarerRotation,
    null,
  );
  return (
    <details className="mt-4 rounded-xl border border-[var(--bordure)] bg-[var(--surface-2)] p-4">
      <summary className="cursor-pointer text-sm font-bold">
        {t("super.declarer_rotation", lang)}
      </summary>
      <p className="mt-3 text-xs text-[var(--encre-douce)]">
        {t("super.une_rotation", lang)}
      </p>
      <form action={action} className="mt-3 grid gap-3 sm:grid-cols-3">
        <input type="hidden" name="qui" value={quiDefaut} />
        <label className="champ">
          <span className="text-xs text-[var(--encre-faine)]">{t("super.slot", lang)}</span>
          <select name="slot" required defaultValue={slots[0] || ""}>
            {slots.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="champ">
          <span className="text-xs text-[var(--encre-faine)]">{t("super.date", lang)}</span>
          <input type="date" name="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </label>
        <div className="flex items-end">
          <button type="submit" className="bouton bouton-principal w-full" disabled={enCours}>
            {enCours ? "…" : t("envoyer", lang)}
          </button>
        </div>
      </form>
      {etat && (
        <p
          className={`mt-3 text-sm ${etat.ok ? "text-[var(--ok,green)]" : "text-[var(--danger)]"}`}
          role="status"
        >
          {etat.message}
        </p>
      )}
    </details>
  );
}
