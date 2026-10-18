// Onboarding 7 étapes (§L3, REQ-L-002) : miroir EXACT du doc, gates réels.
// Navigation sans JavaScript : l'étape n POST en GET vers /onboarding?etape=n+1
// avec les champs précédents portés en hidden ; les gates §L3 bloquent le
// bouton "continuer" tant que la checklist cible n'est pas complète.
// L'étape 7 crée le logement RÉELLEMENT via POST /parc/logements (copro
// verifiee:false posée par la passerelle = mise en ligne BLOQUÉE, REQ-L-001).
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { CarteCreation } from "./carte-creation";

export const instant = false;

export const metadata: Metadata = { title: "Onboarding" };

const ETAPES: { titre: string; court: string; texte: string }[] = [
  {
    titre: "1 · Visite (45 min)",
    court: "1 Visite",
    texte:
      "Sur place : règlement + PV, DPE, détecteurs, assurance, ≥2 prestas/métier à ~10 km, photos + mesures. DPE F/G = REFUSÉ sans plan travaux (passoire).",
  },
  {
    titre: "2 · Contrat",
    court: "2 Contrat",
    texte:
      "Mandat écrit + CGV (ou vente+maintenance), forfait §S1 acté, RC pro + RC prestas vérifiées (dispatch bloqué si expirée), sécurité enfants + literie + trousse secours.",
  },
  {
    titre: "3 · Pack",
    court: "3 Pack",
    texte:
      "Box préparée (image vitrine), ids créés, tarifs + extras saisis, prestas rattachés, langues, règlement adapté à SA copro, mini-bar imprimé.",
  },
  {
    titre: "4 · Install (½ j)",
    court: "4 Install",
    texte:
      "Box installée, Minut/CO2/clé, mini-bar + QR + prix, kit bienvenue + stocks, runbook plastifié, photos posées.",
  },
  {
    titre: "5 · Config",
    court: "5 Config",
    texte:
      "WireGuard + registre (FULL/PILOTAGE), OTA connectés, messages J-2 actifs + moyen de paiement tagué, PWA aux couleurs.",
  },
  {
    titre: "6 · Conformité",
    court: "6 Conformité",
    texte:
      "Cerfa déposé + n° récupéré, portail taxe, SIRET vérifié, assurance + DPE + détecteurs OK, affichage taxe en place.",
  },
  {
    titre: "7 · Go-live",
    court: "7 Go-live",
    texte:
      "Création du logement au registre. N° + DPE sur annonces seulement, résa test bout en bout, drill ménage 3 h, remise solennelle — jamais de go-live silencieux.",
  },
];

// Champs portés d'étape en étape (hidden, "1" si coché — absent si décoché,
// donc l'état se met à jour à chaque soumission).
const PORTES = [
  "dpe", "reglement_pv", "detecteurs", "assurance", "presta_ok", "photos",
  "forfait", "mandat", "rc_ok",
  "box_ok", "extras_ok", "prestas_ok2",
  "installe", "qr_ok",
  "wg_ok", "ota_ok", "j2_ok",
  "cerfa", "siret", "taxe",
] as const;

type SP = Partial<Record<(typeof PORTES)[number], string>>;

function paramUrl(sp: SP, etape: number, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams({ ...extra });
  for (const [k, v] of Object.entries(sp)) if (v) q.set(k, v);
  q.set("etape", String(etape));
  return `/onboarding?${q.toString()}`;
}

/** Gates §L3 : ce qui BLOQUE le passage de `de` vers la cible. */
function gates(de: number, cible: number, sp: SP): string[] {
  if (cible === 7) {
    const r: string[] = [];
    if (!sp.cerfa)
      r.push("Cerfa déposé + n° de déclaration récupéré requis — jamais de go-live sans numéro.");
    if (!sp.siret) r.push("SIRET vérifié requis.");
    if (!sp.taxe) r.push("Portail taxe séjour + affichage taxe requis.");
    return r;
  }
  if (cible >= 2) {
    const r: string[] = [];
    const dpe = (sp.dpe || "").toUpperCase();
    if (["F", "G"].includes(dpe))
      r.push(
        `DPE ${dpe} : logement REFUSÉ sans plan travaux (passoire — interdit touristique au 01/01/2028 pour G, F puis E jusqu'en 2034).`,
      );
    if (!dpe) r.push("Classe DPE requis (E minimum, F/G refusés).");
    if (!sp.reglement_pv) r.push("Règlement de copro lu + PV visite signé (sinon STOP).");
    if (!sp.detecteurs) r.push("Détecteurs fumée (+CO) installés requis.");
    if (!sp.assurance) r.push("Assurance habitation + RC LCD requises.");
    if (de >= 1 && !sp.presta_ok)
      r.push("≥ 2 prestataires / métier critique à ~10 km requis (sinon pas de FULL).");
    if (de >= 1 && !sp.photos)
      r.push("Photos + mesures + commerces locaux requis (annonces).");
    if ([2, 3].includes(cible)) {
      if (!sp.mandat) r.push("Mandat écrit + CGV signés requis (checklist 8 items §20.3).");
      if (!sp.rc_ok) r.push("RC pro à jour + RC prestas vérifiées requises.");
    }
    return r;
  }
  return [];
}

function Hidden({ sp }: { sp: SP }) {
  return (
    <>
      {Object.entries(sp)
        .filter(([, v]) => v)
        .map(([k]) => (
          <input key={k} type="hidden" name={k} value="1" />
        ))}
    </>
  );
}

function Gate({ nom, label, cocher }: { nom: string; label: string; cocher: boolean }) {
  return (
    <label className="flex items-start gap-2 rounded-xl bg-(--surface-2) px-3 py-2 text-sm">
      <input type="checkbox" name={nom} defaultChecked={cocher} className="mt-0.5" />
      <span>{label}</span>
    </label>
  );
}

export default async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const spAll = await searchParams;
  const sp: SP = {};
  for (const k of PORTES) if (spAll[k]) sp[k] = spAll[k] as string;
  const etape = Math.min(7, Math.max(1, Number(spAll.etape) || 1));
  const jar = await cookies();
  const quiDefaut = jar.get("lcd_qui")?.value || "";

  // Le bouton de l'étape n mène à n+1 : les gates sont évaluées SUR LA CIBLE.
  const cible = Math.min(7, etape + 1);
  const bloque = etape < 7 ? gates(etape, cible, sp) : gates(6, 7, sp);
  const forfaitOK = !!sp.forfait;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--encre-faine)">
          Nouveau logement · §L3 · REQ-L-002
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Onboarding</h1>
      </div>

      {/* Progression */}
      <ol className="flex flex-wrap gap-1.5" aria-label="Étapes">
        {ETAPES.map((e, i) => {
          const n = i + 1;
          const etat = n === etape ? "courant" : n < etape ? "fait" : "futur";
          return (
            <li key={n}>
              <Link
                href={paramUrl(sp, n)}
                className={`onglet ${etat === "fait" ? "border-(--ok)" : ""} ${etat === "futur" ? "opacity-70" : ""}`}
                aria-current={etat === "courant" ? "step" : undefined}
              >
                {etat === "fait" ? "✓ " : ""}{e.court}
              </Link>
            </li>
          );
        })}
      </ol>

      <section className="carte p-5 md:p-7">
        <h2 className="text-xl font-extrabold tracking-tight">{ETAPES[etape - 1].titre}</h2>
        <p className="mt-1 max-w-3xl text-sm text-(--encre-douce)">{ETAPES[etape - 1].texte}</p>

        {activiteBlocage(bloque)}
        {formulaireEtape(etape, sp, bloque, cible, forfaitOK, quiDefaut)}
      </section>

      <p className="text-xs text-(--encre-faine)">
        Jalon métier : pas de 2ᵉ logement FULL avant 1 mois de vitrine sans incident
        copro. Remise solennelle (photos avant/après + résa test + livret proprio +
        appel J+7 + bilan J+30) — jamais de go-live silencieux.
      </p>
    </div>
  );
}

function activiteBlocage(bloque: string[]) {
  if (bloque.length === 0) return null;
  return (
    <div className="mt-4 rounded-xl bg-(--danger-douce) p-4 text-sm text-(--danger)" role="alert">
      <p className="font-bold">Étape bloquée tant que ces conditions ne sont pas remplies :</p>
      <ul className="mt-2 list-disc pl-5" role="list">
        {bloque.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs opacity-80">
        Cochez ci-dessous ce qui est vrai et « Enregistrer » : les cases décochées
        repartent décochées (l&apos;état se remet à jour à chaque soumission).
      </p>
    </div>
  );
}

function formulaireEtape(
  etape: number,
  sp: SP,
  bloque: string[],
  cible: number,
  forfaitOK: boolean,
  quiDefaut: string,
) {
  const disabled = bloque.length > 0;
  if (etape === 7) {
    return activiteEtape7(sp, bloque, quiDefaut);
  }
  return (
    <form method="get" action="/onboarding" className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="etape" value={cible} />
      <Hidden sp={sp} />
      <div className="flex flex-col gap-2">
        {etape === 1 && (
          <>
            <label className="text-sm font-medium sm:max-w-xs">
              Classe DPE *
              <select name="dpe" defaultValue={sp.dpe || ""} className="champ mt-1">
                <option value="">— choisir —</option>
                {["A", "B", "C", "D", "E", "F", "G"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
            <Gate nom="reglement_pv" label="Règlement copro lu + PV visite signé" cocher={!!sp.reglement_pv} />
            <Gate nom="detecteurs" label="Détecteurs fumée (obligatoire) + CO installés" cocher={!!sp.detecteurs} />
            <Gate nom="assurance" label="Assurance habitation + RC LCD actives" cocher={!!sp.assurance} />
            <Gate nom="presta_ok" label="≥2 prestas / métier critique à ~10 km" cocher={!!sp.presta_ok} />
            <Gate nom="photos" label="Photos + mesures + commerces locaux relevés" cocher={!!sp.photos} />
          </>
        )}
        {etape === 2 && (
          <>
            <label className="text-sm font-medium sm:max-w-xs">
              Forfait acté (§S1)
              <select name="forfait" defaultValue={forfaitOK ? (sp.forfait as string) : ""} className="champ mt-1">
                <option value="">— choisir —</option>
                <option value="kit">Kit (vente + maintenance)</option>
                <option value="pilotage">Pilotage (mandat + CGV)</option>
                <option value="full">Full service (mandat + CGV)</option>
              </select>
            </label>
            <Gate nom="mandat" label="Mandat écrit + CGV signés (checklist 8 items §20.3)" cocher={!!sp.mandat} />
            <Gate nom="rc_ok" label="RC pro à jour + RC prestas vérifiées" cocher={!!sp.rc_ok} />
          </>
        )}
        {etape === 3 && (
          <>
            <Gate nom="box_ok" label="Box préparée (image vitrine) + ids créés" cocher={!!sp.box_ok} />
            <Gate nom="extras_ok" label="Tarifs + extras saisis + literie/trousse vérifiées" cocher={!!sp.extras_ok} />
            <Gate nom="prestas_ok2" label="Prestas rattachés + langues + règlement adapté SA copro" cocher={!!sp.prestas_ok2} />
          </>
        )}
        {etape === 4 && (
          <>
            <Gate nom="installe" label="Install ½ j faite (box, Minut/CO2, clé, mini-bar, kit, runbook)" cocher={!!sp.installe} />
            <Gate nom="qr_ok" label="QR prix + QR wifi posés, photos EDL prises" cocher={!!sp.qr_ok} />
          </>
        )}
        {etape === 5 && (
          <>
            <Gate nom="wg_ok" label="WireGuard + registre + rotation secrets (FULL/PILOTAGE)" cocher={!!sp.wg_ok} />
            <Gate nom="ota_ok" label="OTA connectés (Airbnb/Booking en lecture)" cocher={!!sp.ota_ok} />
            <Gate nom="j2_ok" label="Messages J-2/J-1 actifs + paiement tagué + PWA couleurs" cocher={!!sp.j2_ok} />
          </>
        )}
        {etape === 6 && (
          <>
            <Gate nom="cerfa" label="Cerfa 12004*04 déposé, n° de déclaration récupéré" cocher={!!sp.cerfa} />
            <Gate nom="siret" label="SIRET vérifié (+ contrat Mandataire si gestion tiers)" cocher={!!sp.siret} />
            <Gate nom="taxe" label="Portail taxe séjour + affichage taxe en place" cocher={!!sp.taxe} />
          </>
        )}
      </div>
      {/* portage explicite du DPE (select, pas checkbox) à travers les étapes */}
      {etape >= 2 && <input type="hidden" name="dpe" value={(sp.dpe || "").toUpperCase()} />}
      {etape >= 3 && <input type="hidden" name="forfait" value={forfaitOK ? (sp.forfait as string) : ""} />}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="bouton bouton-principal disabled:cursor-not-allowed disabled:opacity-50"
          title={disabled ? "Corrigez les gates signalées d'abord" : ""}
        >
          {etape < 6 ? "Enregistrer et continuer →" : "Valider la conformité →"}
        </button>
        {etape > 1 && (
          <Link href={paramUrl(sp, etape - 1, { etape: String(etape - 1) })} className="bouton bouton-secondaire">
            ← Étape précédente
          </Link>
        )}
      </div>
    </form>
  );
}

function activiteEtape7(sp: SP, bloque: string[], quiDefaut: string) {
  if (bloque.length > 0) {
    return (
      <div className="mt-4 rounded-xl bg-(--danger-douce) p-4 text-sm text-(--danger)" role="alert">
        <p className="font-bold">Go-live impossible — conformité incomplète :</p>
        <ul className="mt-2 list-disc pl-5" role="list">
          {bloque.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="rounded-xl bg-(--alerte-douce) p-4 text-sm text-(--alerte)" role="status">
        <p className="font-bold">Rappel REQ-L-001 :</p>
        <p>
          Le logement sera créé <strong>copro verifiee=false</strong> → mise en ligne
          BLOQUÉE tant que le syndic n&apos;a pas confirmé. C&apos;est voulu : la
          prudence est un défaut de sécurité, pas un bug.
        </p>
      </div>
      <CarteCreation quiDefaut={quiDefaut} envoyer="Créer le logement réel" />
      <p className="text-xs text-(--encre-faine)">
        Après création : n° + DPE sur les annonces uniquement, résa test bout en bout,
        drill ménage 3 h — puis remise solennelle.
      </p>
    </div>
  );
}
