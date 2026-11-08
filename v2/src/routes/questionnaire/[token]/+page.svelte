<script lang="ts">
  import { page } from "$app/state";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const ok = $derived(page.url.searchParams.get("ok"));
  const deja = $derived(page.url.searchParams.get("deja"));
  const erreur = $derived(page.url.searchParams.get("erreur"));
  const notes = $derived(
    (data.existant?.notes ?? {}) as Record<string, number>,
  );
</script>

<svelte:head>
  <title>Questionnaire de séjour — LCD Parc</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="mx-auto max-w-2xl space-y-8 px-6 py-12">
  {#if data.indisponible}
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">LCD Parc</p>
    <h1 class="text-2xl font-semibold tracking-tight">Lien indisponible</h1>
    <p class="text-encre-douce">
      {data.indisponible === "invalide"
        ? "Ce lien est invalide ou expiré. Demandez un nouveau lien à votre hôte."
        : "Ce séjour n’est plus disponible. Contactez votre hôte."}
    </p>
    <a class="ui-lien text-sm" href="/">Retour à l’accueil</a>
  {:else if data.reservation}
    <header class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Questionnaire de séjour</p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.logementNom ?? "Votre séjour"}</h1>
      <p class="text-encre-douce">
        Du {data.reservation.debut} au {data.reservation.fin} · {data.reservation.voyageurs}
        voyageur{data.reservation.voyageurs > 1 ? "s" : ""}
      </p>
    </header>

    {#if ok}<p class="ui-alerte ui-alerte--succes" role="status">Merci, vos réponses sont enregistrées.</p>{/if}
    {#if deja}<p class="ui-alerte" role="status">Vous avez déjà répondu à ce questionnaire.</p>{/if}
    {#if erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">
        {erreur === "inattendu" ? "Erreur inattendue. Réessayez." : erreur}
      </p>
    {/if}

    {#if data.existant}
      <section class="ui-carte space-y-4">
        <h2 class="text-lg font-semibold">Vos réponses</h2>
        <p class="text-sm text-encre-douce">
          Moyenne : {data.existant.moyenne?.toFixed(1)} / 5 ·
          <span aria-label={`${data.existant.moyenne?.toFixed(1)} sur 5`}>
            {"★".repeat(Math.round(data.existant.moyenne ?? 0))}<span class="text-encre-faine">{"★".repeat(5 - Math.round(data.existant.moyenne ?? 0))}</span>
          </span>
        </p>
        <dl class="grid gap-3 sm:grid-cols-2">
          {#each data.criteres as critere (critere.id)}
            <div class="flex items-center justify-between rounded-controle border border-bordure p-3 text-sm">
              <dt>{critere.label}</dt>
              <dd class="font-medium">{notes[critere.id]} / 5</dd>
            </div>
          {/each}
        </dl>
        {#if data.existant.commentaire}
          <p class="whitespace-pre-line rounded-controle border border-bordure bg-surface2 p-3 text-sm">{data.existant.commentaire}</p>
        {/if}
      </section>
    {:else}
      <form method="POST" class="ui-carte space-y-4">
        <input type="hidden" name="token" value={data.token} />
        <input type="hidden" name="ref" value={data.ref} />
        <p class="text-sm text-encre-douce">Notez chaque critère de 1 à 5. Une seule réponse par séjour.</p>
        {#each data.criteres as critere (critere.id)}
          <label class="ui-champ-groupe">
            <span class="ui-label">{critere.label}</span>
            <select class="ui-champ" name={`note-${critere.id}`} required>
              <option value="5">5 — Excellent</option>
              <option value="4">4 — Très bien</option>
              <option value="3">3 — Bien</option>
              <option value="2">2 — Moyen</option>
              <option value="1">1 — À améliorer</option>
            </select>
          </label>
        {/each}
        <label class="ui-champ-groupe">
          <span class="ui-label">Commentaire</span>
          <textarea class="ui-champ" name="commentaire" rows="4" maxlength="1000"></textarea>
        </label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">Envoyer mes réponses</button>
      </form>
    {/if}
  {/if}
</main>
