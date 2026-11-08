<script lang="ts">
  import type { PageData } from "./$types";
  import { formaterEuros } from "@/lib/format";

  let { data }: { data: PageData } = $props();

  function dateLongue(iso: string): string {
    return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }
</script>

<svelte:head>
  <title>Contrat de séjour — LCD Parc</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if data.indisponible}
  <main class="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">LCD Parc</p>
    <h1 class="text-2xl font-semibold tracking-tight">Lien indisponible</h1>
    <p class="text-encre-douce">
      {#if data.indisponible === "invalide"}
        Ce lien est invalide ou expiré. Demandez un nouveau lien à votre hôte.
      {:else if data.indisponible === "reservation"}
        Cette réservation n’est plus disponible. Contactez votre hôte.
      {:else}
        Ce logement n’est plus disponible. Contactez votre hôte.
      {/if}
    </p>
    <a class="ui-lien text-sm" href="/">Retour à l’accueil</a>
  </main>
{:else if data.contrat}
  <main class="mx-auto max-w-3xl space-y-8 px-6 py-12 print:max-w-none print:px-0">
    <header class="flex flex-wrap items-start justify-between gap-4 border-b border-bordure pb-6">
      <div class="space-y-1">
        <h1 class="text-3xl font-semibold tracking-tight">Contrat de séjour</h1>
        <p class="text-lg font-medium">{data.contrat.logement.nom}</p>
        <p class="text-sm text-encre-douce">Référence {data.contrat.reference}</p>
      </div>
      <p class="text-xs text-encre-faine print:hidden">Imprimez avec Ctrl+P ou Cmd+P.</p>
    </header>

    <section class="grid gap-4 sm:grid-cols-2">
      <div class="ui-carte">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-encre-faine">L’hôte</h2>
        <p class="mt-2 font-medium">{data.contrat.hote.nom}</p>
        {#if data.contrat.hote.adresse}<p class="text-sm text-encre-douce">{data.contrat.hote.adresse}</p>{/if}
      </div>
      <div class="ui-carte">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-encre-faine">Le voyageur</h2>
        <p class="mt-2 font-medium">{data.contrat.voyageur.nom}</p>
        {#if data.contrat.voyageur.email}<p class="text-sm text-encre-douce">{data.contrat.voyageur.email}</p>{/if}
      </div>
    </section>

    <section class="ui-carte">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-encre-faine">Le logement</h2>
      <p class="mt-2 font-medium">{data.contrat.logement.nom}</p>
      {#if data.contrat.logement.adresse}<p class="text-sm text-encre-douce">{data.contrat.logement.adresse}</p>{/if}
      <dl class="mt-4 grid gap-3 sm:grid-cols-4">
        <div><dt class="text-xs uppercase tracking-wide text-encre-faine">Arrivée</dt><dd>{dateLongue(data.contrat.sejour.debut)}</dd></div>
        <div><dt class="text-xs uppercase tracking-wide text-encre-faine">Départ</dt><dd>{dateLongue(data.contrat.sejour.fin)}</dd></div>
        <div><dt class="text-xs uppercase tracking-wide text-encre-faine">Nuits</dt><dd>{data.contrat.sejour.nuits}</dd></div>
        <div><dt class="text-xs uppercase tracking-wide text-encre-faine">Voyageurs</dt><dd>{data.contrat.sejour.voyageurs}</dd></div>
      </dl>
    </section>

    <section class="ui-carte">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-encre-faine">Conditions financières</h2>
      <dl class="mt-3 space-y-2 text-sm">
        <div class="flex justify-between"><dt>Montant du séjour</dt><dd class="font-medium">{formaterEuros(data.contrat.montantCentimes)}</dd></div>
        {#if data.contrat.cautionCentimes !== null}
          <div class="flex justify-between"><dt>Dépôt de garantie</dt><dd class="font-medium">{formaterEuros(data.contrat.cautionCentimes)}</dd></div>
        {/if}
      </dl>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Clauses du séjour</h2>
      <ol class="list-decimal space-y-2 pl-5 text-sm text-encre-douce">
        {#each data.contrat.clauses as clause}
          <li>{clause}</li>
        {/each}
      </ol>
      <p class="text-xs text-encre-faine">
        Les conditions générales de vente et le règlement intérieur remis avec ce
        contrat en font partie intégrante.
      </p>
    </section>

    <section class="grid gap-6 border-t border-bordure pt-6 sm:grid-cols-2">
      <div class="space-y-8">
        <p class="text-sm font-semibold">Le voyageur — bon pour accord</p>
        <p class="text-xs text-encre-douce">Nom, date et signature :</p>
        <div class="h-16 border-b border-bordure"></div>
      </div>
      <div class="space-y-8">
        <p class="text-sm font-semibold">L’hôte</p>
        <p class="text-xs text-encre-douce">Nom, date et signature :</p>
        <div class="h-16 border-b border-bordure"></div>
      </div>
    </section>

    <footer class="flex flex-wrap items-center justify-between gap-3 text-xs text-encre-faine">
      <p>Contrat généré le {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}.</p>
      <a class="ui-lien print:hidden" href="/">LCD Parc</a>
    </footer>
  </main>
{/if}
