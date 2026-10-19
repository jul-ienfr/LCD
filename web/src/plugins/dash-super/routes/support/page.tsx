// Page /support (dash-super) — F5 §P8 : file unique de tickets (SLA
// P1<4h / P2<48h / P3<5j) + messagerie interne 3 fils (proprio/presta/
// voyageur). Staff (super_admin) : TOUS les tickets et TOUS les fils. Un
// client ne voit que les siens (ACL fail-closed côté passerelle). Jamais
// WhatsApp/SMS perso : tout ici, au journal, avec ref.
export const instant = false;
import { gwGet } from "@/lib/gateway";
import type { Langue } from "@/lib/i18n";
import { t } from "../../i18n";
import { languePage } from "@/lib/langue";
import { lireIdentite } from "@/lib/identite";
import { Onglets } from "@/app/onglets";
import { FormulaireTicket, BoutonCloturer, FormulaireMessage } from "./formulaire-support";

type Ticket = {
  ref?: string; qui?: string; sujet?: string; description?: string;
  priorite?: string; statut?: string; ouvert_le?: string; logement_id?: string;
};
type RepTickets = { tickets?: Ticket[]; total?: number; sla_h?: Record<string, number> };
type Fil = {
  fil_id?: string; type?: string; ref?: string; auteurs?: string[];
  dernier_ts?: string; nb_messages?: number;
};
type RepFils = { fils?: Fil[]; total?: number; operateur?: boolean };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Langue = languePage(sp);
  const qui = (await lireIdentite()).qui;

  let repT: RepTickets | null = null;
  let repF: RepFils | null = null;
  let erreur = "";
  try {
    [repT, repF] = await Promise.all([
      gwGet<RepTickets>(`/v1/tickets?qui=${encodeURIComponent(qui)}`),
      gwGet<RepFils>(`/v1/messagerie?qui=${encodeURIComponent(qui)}`),
    ]);
  } catch (e) {
    erreur = e instanceof Error ? e.message : String(e);
  }

  if (!repT || !repF) {
    return (
      <div className="flex flex-col gap-4">
        <Onglets lang={lang} ici="/support" />
        <div className="carte border-[var(--danger)] p-6" role="alert">
          <h1 className="text-xl font-extrabold">{t("super.injoignable", lang)}</h1>
          <p className="mt-2 text-sm text-[var(--encre-douce)]">{erreur}</p>
        </div>
      </div>
    );
  }

  const tickets = repT.tickets || [];
  const fils = repF.fils || [];

  return (
    <div className="flex flex-col gap-5">
      <Onglets lang={lang} ici="/support" />

      <section className="hero" aria-label={t("super.titre_support", lang)}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
          {t("super.titre_support", lang)}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
          {tickets.length} {t("super.tickets", lang)}
          <span className="ml-2 text-base font-semibold opacity-80">
            · {fils.length} {t("super.fils", lang)}
          </span>
        </h1>
        <p className="mt-2 text-sm opacity-80">{t("super.sla", lang)}</p>
      </section>

      <section className="carte p-5 md:p-6">
        <h2 className="mb-3 text-lg font-bold">{t("super.tickets", lang)}</h2>
        <FormulaireTicket qui={qui} lang={lang} />
        {tickets.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--encre-douce)]">{t("super.aucun_ticket", lang)}</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {tickets.map((tk) => (
              <article key={tk.ref} className="border border-[var(--bordure)] p-4">
                <p className="flex flex-wrap items-center gap-2">
                  <code className="text-xs">{tk.ref || "—"}</code>
                  <span className="badge">{tk.priorite || "—"}</span>
                  <span className="badge">{tk.statut || "—"}</span>
                  {tk.logement_id && <span className="badge">{tk.logement_id}</span>}
                </p>
                <h3 className="mt-2 font-bold">{tk.sujet || "—"}</h3>
                <p className="mt-1 text-sm text-[var(--encre-douce)]">{tk.description || ""}</p>
                <p className="mt-1 text-xs opacity-70">
                  {tk.qui || "—"} · {tk.ouvert_le || "—"}
                </p>
                {tk.statut === "ouvert" && (
                  <div className="mt-3">
                    <BoutonCloturer ref={tk.ref || ""} lang={lang} />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="carte p-5 md:p-6">
        <h2 className="mb-3 text-lg font-bold">{t("super.fils", lang)}</h2>
        {fils.length === 0 ? (
          <p className="text-sm text-[var(--encre-douce)]">{t("super.aucun_fil", lang)}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {fils.map((fil) => (
              <article key={fil.fil_id} className="border border-[var(--bordure)] p-4">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="badge">{fil.type || "—"}</span>
                  <code className="text-xs">{fil.ref || "—"}</code>
                  <span className="text-xs opacity-70">
                    {fil.nb_messages ?? 0} {t("super.nb_messages", lang)}
                  </span>
                  <span className="text-xs opacity-70">{fil.dernier_ts || ""}</span>
                </p>
                <FormulaireMessage qui={qui} type={fil.type || ""} ref={fil.ref || ""} lang={lang} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
