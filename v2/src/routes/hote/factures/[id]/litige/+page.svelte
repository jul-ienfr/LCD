<script lang="ts">
  import { traductionsFactures } from "@/lib/i18n-factures";
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import Kpi from "@/lib/components/ui/kpi.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const t = $derived(traductionsFactures((data as { langue?: string }).langue ?? "fr"));
</script>

<svelte:head>
  <title>{t.litigeTitrePage(data.facture.numero)}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <PageEntete
    surtitre={t.litigeSurtitre(data.facture.numero)}
    titre={t.litigeTitre}
    description={t.litigeDescription}
  />

  {#if data.ok === "stripe"}
    <p class="ui-alerte ui-alerte--ok" role="status">
      {t.litigeStripeOk}
    </p>
  {:else if data.ok}
    <p class="ui-alerte ui-alerte--ok" role="status">{t.litigeEnregistre}</p>
  {/if}
  {#if data.erreur === "stripe"}
    <p class="ui-alerte ui-alerte--danger" role="alert">
      {t.litigeStripeErreur}
    </p>
  {:else if data.erreur}
    <p class="ui-alerte ui-alerte--danger" role="alert">{t.litigeEchec}</p>
  {/if}

  <section class="grid gap-4 sm:grid-cols-3">
    <Kpi libelle={t.kpiFacture} valeur={data.facture.montantTtcFormate} note={data.facture.clientNom} />
    <Kpi libelle={t.kpiEncaisse} valeur={data.totalPayeFormate} note={t.paiementsEnregistres} />
    <Kpi libelle={t.kpiConteste} valeur={data.montantContesteFormate} note={t.plafonne} />
  </section>

  <section class="ui-carte space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">{t.parametresDossier}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.parametresAide}</p>
      </div>
      <a class="ui-lien-action text-sm" href={`/hote/factures/${data.facture.id}`}>{t.retourFacture}</a>
    </div>

    <form class="grid gap-4 sm:grid-cols-2" method="GET">
      <label class="space-y-2">
        <span class="ui-label">{t.dateDossier}</span>
        <input class="ui-champ" type="date" name="date" value={data.dateLitige} required />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{t.montantConteste}</span>
        <input class="ui-champ" inputmode="decimal" name="montant" value={data.montantSaisie} />
        <span class="block text-xs text-encre-faine">{t.laisserVide}</span>
      </label>
      <label class="space-y-2 sm:col-span-2">
        <span class="ui-label">{t.motif}</span>
        <textarea class="ui-champ min-h-24" maxlength="2000" name="motif" placeholder={t.motifPlaceholder}>{data.motif}</textarea>
      </label>
      <div class="sm:col-span-2">
        <button class="ui-bouton ui-bouton--secondaire" type="submit">{t.actualiser}</button>
      </div>
    </form>
  </section>

  <section class="ui-carte space-y-4 print:border-0 print:shadow-none">
    <div class="flex flex-wrap items-start justify-between gap-3 print:hidden">
      <div>
        <h2 class="text-lg font-semibold">{t.dossierPreFilli}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.dossierAide}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="ui-bouton ui-bouton--secondaire" type="button" onclick={() => window.print()}>{t.imprimerBtn}</button>
        <form method="POST" action="?/enregistrer">
          <input type="hidden" name="reference" value={data.dossier.reference} />
          <input type="hidden" name="montantEuros" value={data.montantSaisie} />
          <input type="hidden" name="dateLitige" value={data.dateLitige} />
          <input type="hidden" name="motif" value={data.motif} />
          <button class="ui-bouton ui-bouton--primaire" type="submit">{t.enregistrerAudit}</button>
        </form>
      </div>
    </div>

    <div class="print:hidden">
      <label class="block space-y-2">
        <span class="ui-label">{t.texteDossier}</span>
        <textarea class="ui-champ min-h-96 font-mono text-xs" readonly value={data.dossier.texte}></textarea>
      </label>
    </div>

    <article class="hidden space-y-2 whitespace-pre-line text-sm print:block">
      {data.dossier.texte}
    </article>
  </section>

  <section class="ui-carte space-y-4 print:hidden">
    <div class="space-y-1">
      <h2 class="text-lg font-semibold">{t.stripeTitre}</h2>
      <p class="text-sm text-encre-douce">{t.stripeAide}</p>
    </div>
    <form class="space-y-4" method="POST" action="?/repondreStripe">
      <input name="texte" type="hidden" value={data.dossier.texte} />
      <label class="block space-y-2">
        <span class="ui-label">{t.stripeId}</span>
        <input
          class="ui-champ font-mono"
          name="disputeId"
          placeholder="dp_..."
          required
          pattern="dp_[A-Za-z0-9]+"
        />
      </label>
      <button class="ui-bouton ui-bouton--primaire" type="submit">
        {t.envoyerFermer}
      </button>
    </form>
    <p class="text-xs text-encre-faine">
      {t.pieces}
    </p>
  </section>
</main>
