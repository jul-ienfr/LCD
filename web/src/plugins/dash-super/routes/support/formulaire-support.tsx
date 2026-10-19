"use client";
// Composants clients du support F5 §P8 : ouverture de ticket (tout humain),
// clôture (staff, motif obligatoire — trace opposable du POURQUOI), écriture
// dans un fil de messagerie (ACL fail-closed côté passerelle). Même pattern
// que formulaire-rotation.tsx : server actions, formulaires natifs.
import { useActionState } from "react";
import {
  ouvrirTicket, majTicket, envoyerMessage, type ResultatAction,
} from "@/app/actions";
import type { Langue } from "@/lib/i18n";
import { t } from "../../i18n";

export function FormulaireTicket({ qui, lang }: { qui: string; lang: Langue }) {
  const [etat, action, enCours] = useActionState<ResultatAction | null, FormData>(
    ouvrirTicket, null,
  );
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="qui" value={qui} />
      <label className="champ">
        <span className="text-xs text-[var(--encre-faine)]">{t("super.sujet", lang)}</span>
        <input type="text" name="sujet" required maxLength={120} />
      </label>
      <label className="champ">
        <span className="text-xs text-[var(--encre-faine)]">{t("super.description", lang)}</span>
        <textarea name="description" required rows={3} maxLength={2000} />
      </label>
      <label className="champ">
        <span className="text-xs text-[var(--encre-faine)]">{t("super.priorite", lang)}</span>
        <select name="priorite" defaultValue="P2">
          <option value="P1">P1 (&lt; 4 h)</option>
          <option value="P2">P2 (&lt; 48 h)</option>
          <option value="P3">P3 (&lt; 5 j)</option>
        </select>
      </label>
      <button type="submit" className="bouton bouton-principal" disabled={enCours}>
        {t("super.ouvrir_ticket", lang)}
      </button>
      {etat && (
        <p
          className={`text-sm ${etat.ok ? "text-[var(--ok,green)]" : "text-[var(--danger)]"}`}
          role="status"
        >
          {etat.message}
        </p>
      )}
    </form>
  );
}

export function BoutonCloturer({ ref, lang }: { ref: string; lang: Langue }) {
  const [etat, action, enCours] = useActionState<ResultatAction | null, FormData>(
    majTicket, null,
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="ref" value={ref} />
      <input type="hidden" name="statut" value="cloture" />
      <label className="champ flex-1 min-w-[10rem]">
        <span className="text-xs text-[var(--encre-faine)]">{t("super.motif", lang)}</span>
        <input type="text" name="motif" required maxLength={200} />
      </label>
      <button type="submit" className="bouton" disabled={enCours}>
        {t("super.cloturer", lang)}
      </button>
      {etat && (
        <p
          className={`w-full text-sm ${etat.ok ? "text-[var(--ok,green)]" : "text-[var(--danger)]"}`}
          role="status"
        >
          {etat.message}
        </p>
      )}
    </form>
  );
}

export function FormulaireMessage({ qui, type, ref, lang }: {
  qui: string; type: string; ref: string; lang: Langue;
}) {
  const [etat, action, enCours] = useActionState<ResultatAction | null, FormData>(
    envoyerMessage, null,
  );
  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="qui" value={qui} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="ref" value={ref} />
      <label className="champ">
        <span className="text-xs text-[var(--encre-faine)]">{t("super.texte", lang)}</span>
        <textarea name="texte" required rows={2} maxLength={2000} />
      </label>
      <button type="submit" className="bouton self-start" disabled={enCours}>
        {t("super.envoyer", lang)}
      </button>
      {etat && (
        <p
          className={`text-sm ${etat.ok ? "text-[var(--ok,green)]" : "text-[var(--danger)]"}`}
          role="status"
        >
          {etat.message}
        </p>
      )}
    </form>
  );
}
