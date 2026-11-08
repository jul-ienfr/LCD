<script lang="ts">
  import { page } from "$app/state";
  import type { PageData } from "./$types";
  import { formaterEuros } from "@/lib/format";

  let { data }: { data: PageData } = $props();
  const paiement = $derived(page.url.searchParams.get("paiement"));
</script>

<svelte:head>
  <title>Facture — LCD Parc</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if data.indisponible}
  <main class="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">LCD Parc</p>
    <h1 class="text-2xl font-semibold tracking-tight">Lien indisponible</h1>
    <p class="text-encre-douce">
      {data.indisponible === "invalide"
        ? "Ce lien est invalide ou expiré. Demandez un nouveau lien à votre hôte."
        : "Cette facture n’est plus disponible en ligne. Contactez votre hôte pour obtenir une version à jour."}
    </p>
    <a class="ui-lien text-sm" href="/">Retour à l’accueil</a>
  </main>
{:else if data.facture}
  <main class="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
    <header class="flex flex-wrap items-start justify-between gap-4 border-b border-bordure pb-5">
      <div>
        <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Facture</p>
        <h1 class="mt-1 break-all font-mono text-xl font-semibold sm:text-2xl">{data.facture.numero}</h1>
        <p class="mt-2 text-sm text-encre-douce">Émise le {data.facture.dateEmission}{data.facture.echeance ? ` · échéance ${data.facture.echeance}` : ""}</p>
        <a class="ui-bouton ui-bouton--secondaire mt-3" download href={`/api/factures/${data.facture.id}/pdf?t=${encodeURIComponent(data.token)}`}>
          Télécharger le PDF
        </a>
      </div>
      <div class="text-left text-sm text-encre-douce sm:text-right">
        <p class="font-semibold text-encre">{data.tenant.nom}</p>
        <p>Conciergerie locative</p>
        {#if data.tenant.siren}<p class="font-mono text-xs">SIREN {data.tenant.siren}</p>{/if}
        {#if data.tenant.adresse}<p class="mt-1">{data.tenant.adresse}</p>{/if}
      </div>
    </header>

    {#if paiement === "ok"}<p class="ui-alerte ui-alerte--succes">Paiement reçu. La confirmation peut prendre quelques secondes ; rechargez la page si le statut n’est pas encore à jour.</p>{/if}
    {#if paiement === "annule"}<p class="ui-alerte ui-alerte--alerte">Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.</p>{/if}
    {#if paiement === "erreur"}<p class="ui-alerte ui-alerte--danger">Le paiement en ligne n’a pas pu être ouvert. Contactez votre hôte.</p>{/if}

    <section class="grid gap-4 sm:grid-cols-2">
      <div class="ui-carte">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-encre-faine">Client</h2>
        <p class="mt-1 font-medium">{data.facture.clientNom}</p>
        {#if data.facture.clientEmail}<p class="break-all text-sm text-encre-douce">{data.facture.clientEmail}</p>{/if}
      </div>
      <div class="ui-carte">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-encre-faine">Statut</h2>
        <p class="mt-1 font-medium">{data.facture.statutLibelle}</p>
        <p class="text-sm text-encre-douce">Reste à payer : {formaterEuros(data.reste)}</p>
      </div>
    </section>

    <section class="ui-carte">
      <h2 class="text-lg font-semibold">Détail</h2>
      <ul class="mt-3 divide-y divide-bordure">
        {#each data.facture.lignes as ligne (ligne.id)}
          <li class="py-3">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="font-medium">{ligne.designation}</p>
                <p class="text-sm text-encre-douce">{ligne.quantite} × {formaterEuros(ligne.prixUnitaireCentimes)}</p>
              </div>
              <p class="font-medium">{formaterEuros(ligne.totalCentimes)}</p>
            </div>
          </li>
        {/each}
      </ul>
      <dl class="ml-auto mt-4 max-w-xs space-y-1 border-t border-bordure pt-4 text-sm">
        <div class="flex justify-between gap-4"><dt class="text-encre-douce">Total HT</dt><dd>{formaterEuros(data.facture.montantHtCentimes)}</dd></div>
        <div class="flex justify-between gap-4"><dt class="text-encre-douce">TVA</dt><dd>{formaterEuros(data.facture.tvaCentimes)}</dd></div>
        <div class="flex justify-between gap-4"><dt class="text-encre-douce">Taxe de séjour</dt><dd>{formaterEuros(data.facture.taxeSejourCentimes)}</dd></div>
        <div class="flex justify-between gap-4 border-t border-bordure pt-2 text-base font-semibold"><dt>Total TTC</dt><dd>{formaterEuros(data.facture.montantTtcCentimes)}</dd></div>
        {#if data.paiements.length > 0}
          <div class="flex justify-between gap-4 pt-2"><dt class="text-encre-douce">Déjà payé</dt><dd>{formaterEuros(data.totalPaye)}</dd></div>
          <div class="flex justify-between gap-4 font-medium"><dt>Reste à payer</dt><dd>{formaterEuros(data.reste)}</dd></div>
        {/if}
      </dl>
    </section>

    {#if data.paiements.length > 0}
      <section class="ui-carte">
        <h2 class="text-lg font-semibold">Paiements reçus</h2>
        <ul class="mt-3 divide-y divide-bordure">
          {#each data.paiements as p (p.id)}
            <li class="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span>{p.date} · {p.mode}{p.reference ? ` · ${p.reference}` : ""}</span>
              <span class="font-medium">{formaterEuros(p.montantCentimes)}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if data.stripeConfigured && data.facture.statut === "emise" && data.reste > 0}
      <section class="ui-carte">
        <h2 class="text-lg font-semibold">Payer en ligne</h2>
        <p class="mt-1 text-sm text-encre-douce">Paiement sécurisé par carte bancaire via Stripe. Montant : {formaterEuros(data.reste)}.</p>
        <form method="POST" action="?/payer" class="mt-4">
          <input type="hidden" name="token" value={data.token} />
          <button class="ui-bouton ui-bouton--primaire" type="submit">Payer {formaterEuros(data.reste)}</button>
        </form>
      </section>
    {/if}

    <footer class="border-t border-bordure pt-4 text-xs text-encre-faine">
      <p>Document consultable sans compte. La taxe de séjour est suivie séparément du chiffre d’affaires.</p>
      {#if data.tenant.mentionsLegales}<p class="mt-2 whitespace-pre-line">{data.tenant.mentionsLegales}</p>{/if}
      {#if data.tenant.mediation}<p class="mt-2">{data.tenant.mediation}</p>{/if}
    </footer>
  </main>
{/if}
