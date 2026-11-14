<script lang="ts">
  import EntetePublique from "@/lib/components/entete-publique.svelte";
  import Alerte from "@/lib/components/ui/alerte.svelte";
  import FilAriane from "@/lib/components/ui/fil-ariane.svelte";
  import {
    traductionsReservation,
    type TraductionsReservation,
  } from "@/lib/i18n/public/reservation";
  import type { ActionData, PageData } from "./$types";

  /**
   * Récapitulatif d'une réservation (T084) : la référence est lisible et
   * sélectionnable d'un clic, le séjour est rappelé en clair, et l'écran dit
   * quoi faire ensuite. Aucun décompte, aucune pression : le seul bouton
   * d'action est celui des échéances réellement payables.
   */
  let { data, form }: { data: PageData; form: ActionData } = $props();

  const t = $derived(traductionsReservation(data.langue));

  const LIBELLES_TYPE: Record<string, keyof TraductionsReservation> = {
    acompte: "echeanceTypeAcompte",
    solde: "echeanceTypeSolde",
    caution: "echeanceTypeCaution",
  };
  const LIBELLES_STATUT: Record<string, keyof TraductionsReservation> = {
    a_payer: "echeanceStatutAPayer",
    paye: "echeanceStatutPaye",
    annule: "echeanceStatutAnnule",
    rembourse: "echeanceStatutRembourse",
  };
  const MOTIFS: Record<string, keyof TraductionsReservation> = {
    lien: "lienIncomplet",
    site: "siteIndisponible",
    introuvable: "introuvableTexte",
  };

  function libelleType(code: string, secours: string): string {
    const cle = LIBELLES_TYPE[code];
    return cle ? t[cle] : secours;
  }
  function libelleStatut(code: string, secours: string): string {
    const cle = LIBELLES_STATUT[code];
    return cle ? t[cle] : secours;
  }
  function classe(statut: string): string {
    if (statut === "paye") return "ui-badge ui-badge--accent";
    if (statut === "a_payer") return "ui-badge ui-badge--alerte";
    return "ui-badge";
  }

  /** Rappel d'en-tête construit d'un bloc : une seule phrase, sans balise. */
  const phraseSejour = $derived(
    data.introuvable
      ? ""
      : `${t.dateDu} ${data.reservation.debut} ${t.dateAu} ${data.reservation.fin} · ${data.reservation.nuits} ${data.reservation.nuits > 1 ? t.nuits : t.nuit} · ${data.reservation.voyageurs} ${t.resumeVoyageurs}`,
  );
</script>

<svelte:head>
  <title>
    {data.introuvable ? t.introuvableTitre : t.titreSejour} — LCD
  </title>
</svelte:head>

<EntetePublique
  nom="LCD"
  langue={data.langue}
  retourHref="/"
  retourLibelle={t.retourAccueil}
/>

<main id="contenu" class="mx-auto max-w-2xl space-y-8 px-6 py-12">
  <FilAriane
    libelle={t.filAriane}
    elements={[
      { libelle: t.arianeAccueil, href: "/" },
      { libelle: t.arianeReserver, href: "/reserver" },
    ]}
  />

  {#if data.introuvable}
    <header class="space-y-3">
      <h1 class="text-3xl font-semibold">{t.introuvableTitre}</h1>
      <p class="text-encre-douce">
        {t[MOTIFS[data.motif] ?? "introuvableTexte"]}
      </p>
    </header>
    <p class="flex flex-wrap items-center gap-4 text-sm">
      <a class="ui-lien-action" href="/aide">{t.contacterHote}</a>
      <a class="ui-lien-action" href="/reserver">{t.arianeReserver}</a>
    </p>
    <a class="ui-bouton ui-bouton--secondaire" href="/">{t.retourAccueil}</a>
  {:else}
    <header class="space-y-2">
      <h1 class="text-3xl font-semibold tracking-tight">{t.titreSejour}</h1>
      <p class="text-encre-douce">{phraseSejour}</p>
    </header>

    {#if data.paiement === "ok"}
      <p class="ui-alerte ui-alerte--ok" role="status">{t.paiementOk}</p>
    {:else if data.paiement === "annule"}
      <p class="ui-alerte ui-alerte--alerte" role="status">
        {t.paiementAnnule}
      </p>
    {/if}
    {#if form?.message}
      <Alerte ton="danger">
        {form.message}
        <span class="mt-3 flex flex-wrap items-center gap-3">
          <a class="ui-lien-action text-sm" href="#echeances">{t.echeancesTitre}</a>
          <a class="ui-lien-action text-sm" href="/aide">{t.contacterHote}</a>
        </span>
      </Alerte>
    {/if}

    <section class="ui-carte space-y-2" aria-labelledby="titre-reference">
      <h2
        id="titre-reference"
        class="text-sm font-semibold uppercase tracking-widest text-encre-faine"
      >
        {t.referenceTitre}
      </h2>
      <p class="font-mono text-xl font-semibold">
        <strong class="select-all">{data.reservation.ref}</strong>
      </p>
      <p class="text-xs text-encre-faine">{t.referenceAide}</p>
    </section>

    <section class="ui-carte space-y-3" aria-labelledby="titre-recap">
      <h2 id="titre-recap" class="text-lg font-semibold">{t.resumeTitre}</h2>
      <dl class="grid gap-2 text-sm">
        {#if data.reservation.logement}
          <div class="flex items-baseline justify-between gap-4">
            <dt class="text-encre-douce">{t.resumeLogement}</dt>
            <dd class="text-right font-semibold">
              {data.reservation.logement}
            </dd>
          </div>
        {/if}
        <div class="flex items-baseline justify-between gap-4">
          <dt class="text-encre-douce">{t.resumeDates}</dt>
          <dd class="text-right font-semibold">
            {t.dateDu}
            {data.reservation.debut}
            {t.dateAu}
            {data.reservation.fin}
          </dd>
        </div>
        <div class="flex items-baseline justify-between gap-4">
          <dt class="text-encre-douce">{t.resumeVoyageurs}</dt>
          <dd class="font-semibold tabular-nums">{data.reservation.voyageurs}</dd>
        </div>
        <div class="flex items-baseline justify-between gap-4">
          <dt class="text-encre-douce">{t.totalSejour}</dt>
          <dd class="text-right font-semibold">{data.reservation.montant}</dd>
        </div>
        {#if data.taxe}
          <div class="flex items-baseline justify-between gap-4">
            <dt class="text-encre-douce">{t.taxeDueAvant}</dt>
            <dd class="text-right font-semibold">{data.taxe.montant}</dd>
          </div>
        {/if}
      </dl>
      {#if data.taxe}
        <p class="text-xs text-encre-faine">{t.taxeDueApres}</p>
      {:else}
        <p class="text-xs text-encre-faine">{t.taxeNonApplicable}</p>
      {/if}
    </section>

    {#if data.echeances.length > 0}
      <section id="echeances" class="space-y-4" aria-labelledby="titre-echeances">
      <h2 id="titre-echeances" class="text-xl font-semibold">
        {t.echeancesTitre}
      </h2>
      {#each data.echeances as echeance (echeance.id)}
        <article
          class="ui-carte flex flex-wrap items-center justify-between gap-4"
        >
          <div class="space-y-1">
            <p class="font-semibold">
              {libelleType(echeance.type, echeance.typeLibelle)} · {echeance.montant}
            </p>
            <p class="text-sm text-encre-douce">
              {t.echeanceDu}
              {echeance.exigibleLe}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span class={classe(echeance.statut)}
              >{libelleStatut(echeance.statut, echeance.statutLibelle)}</span
            >
            {#if echeance.payable}
              {#if data.paiementEnLigne}
                <form method="POST" action="?/payer">
                  <input type="hidden" name="tenant" value={data.slug} />
                  <input type="hidden" name="echeance" value={echeance.id} />
                  <button
                    class="ui-bouton ui-bouton--primaire ui-bouton--petit"
                    type="submit"
                  >
                    {t.payer}
                  </button>
                </form>
              {:else}
                <p class="text-sm text-encre-douce">{t.paiementIndisponible}</p>
              {/if}
            {/if}
          </div>
        </article>
      {/each}
      {#if data.echeances.some((echeance) => echeance.type === "caution")}
        <p class="text-xs text-encre-faine">{t.cautionNote}</p>
      {/if}
      </section>
    {/if}

    <section class="ui-carte space-y-3" aria-labelledby="titre-etape-suivante">
      <h2 id="titre-etape-suivante" class="text-lg font-semibold">
        {t.prochaineEtapeTitre}
      </h2>
      {#if data.reservation.confirme}
        <p class="text-sm text-encre-douce">{t.sejourConfirme}</p>
      {:else}
        <p class="text-sm text-encre-douce">{t.prochaineEtapeTexte}</p>
        <p class="text-sm text-encre-douce">
          <strong>{t.delaiTitre}</strong> — {t.delaiTexte}
        </p>
      {/if}
      <p class="text-sm text-encre-douce">
        <strong>{t.contactTitre}</strong> — {t.contactTexte}
      </p>
      <p class="flex flex-wrap items-center gap-4 text-sm">
        <a class="ui-lien-action" href="/aide">{t.contacterHote}</a>
        <a
          class="ui-lien-action"
          href={`/reserver?tenant=${encodeURIComponent(data.slug)}`}
        >
          {t.arianeReserver}
        </a>
      </p>
    </section>
  {/if}
</main>