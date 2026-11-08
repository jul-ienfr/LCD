<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function classe(statut: string): string {
    if (statut === "paye") return "ui-badge ui-badge--accent";
    if (statut === "a_payer") return "ui-badge ui-badge--alerte";
    return "ui-badge";
  }
</script>

<svelte:head>
  <title>Votre réservation — LCD</title>
</svelte:head>

<main class="mx-auto max-w-2xl space-y-8 px-6 py-12">
  {#if data.introuvable}
    <h1 class="text-3xl font-semibold">Réservation introuvable</h1>
    <p class="text-encre-douce">{data.message}</p>
  {:else}
    <header class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        Réservation {data.reservation.ref}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">Votre séjour</h1>
      <p class="text-encre-douce">
        Du {data.reservation.debut} au {data.reservation.fin} ·
        {data.reservation.voyageurs} voyageur{data.reservation.voyageurs > 1
          ? "s"
          : ""} · total {data.reservation.montant}
      </p>
    </header>

    {#if data.paiement === "ok"}
      <p class="ui-alerte ui-alerte--ok" role="status">
        Paiement confirmé. Merci !
      </p>
    {:else if data.paiement === "annule"}
      <p class="ui-alerte ui-alerte--alerte" role="status">
        Paiement annulé. Vous pouvez réessayer.
      </p>
    {/if}
    {#if form?.message}
      <p class="ui-alerte ui-alerte--danger" role="alert">{form.message}</p>
    {/if}

    <section class="space-y-4">
      <h2 class="text-xl font-semibold">Échéances</h2>
      {#each data.echeances as echeance (echeance.id)}
        <article class="ui-carte flex flex-wrap items-center justify-between gap-4">
          <div class="space-y-1">
            <p class="font-semibold">
              {echeance.typeLibelle} · {echeance.montant}
            </p>
            <p class="text-sm text-encre-douce">
              Échéance du {echeance.exigibleLe}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span class={classe(echeance.statut)}>{echeance.statutLibelle}</span>
            {#if echeance.payable}
              {#if data.paiementEnLigne}
                <form method="POST" action="?/payer">
                  <input type="hidden" name="tenant" value={data.slug} />
                  <input type="hidden" name="echeance" value={echeance.id} />
                  <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="submit">
                    Payer
                  </button>
                </form>
              {:else}
                <span class="text-sm text-encre-faine">
                  Paiement en ligne bientôt disponible
                </span>
              {/if}
            {/if}
          </div>
        </article>
      {/each}
    </section>

    <p class="text-xs text-encre-faine">
      Une empreinte de caution n'est débitée qu'en cas de dommage constaté.
    </p>
  {/if}
</main>
