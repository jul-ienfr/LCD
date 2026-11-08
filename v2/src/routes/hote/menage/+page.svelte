<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { traductionsMenage } from "@/lib/i18n-menage";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const t = $derived(traductionsMenage(data.langue));
</script>

<svelte:head>
  <title>{t.titrePageListe}</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-10">
  <header class="ui-entete space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.espaceExploitation}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
    <p class="text-encre-douce">{t.description}</p>
  </header>

  {#if data.vide}
    <section class="ui-carte space-y-3">
      <p class="text-encre-douce">
        {t.videLogement}
      </p>
      <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">
        {t.creerLogement}
      </a>
    </section>
  {:else if data.logement}
    {#if data.logements.length > 1}
      <nav class="flex flex-wrap gap-2" aria-label={t.choisirLogement}>
        {#each data.logements as logement (logement.id)}
          <a
            class={logement.id === data.logement.id
              ? "ui-bouton ui-bouton--primaire ui-bouton--petit"
              : "ui-bouton ui-bouton--secondaire ui-bouton--petit"}
            href={`/hote/menage?logement=${logement.id}`}
          >
            {logement.nom}
          </a>
        {/each}
      </nav>
    {/if}

    {#if form?.message}
      <p
        class={form.ok ? "ui-alerte ui-alerte--ok" : "ui-alerte ui-alerte--danger"}
        role="status"
      >
        {form.message}
      </p>
    {/if}

    <section class="grid gap-4 sm:grid-cols-3">
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.scoreMoyen}
        </p>
        <p class="text-3xl font-extrabold">
          {data.statistiques.scoreMoyen === null
            ? "—"
            : `${data.statistiques.scoreMoyen.toFixed(1)} / 5`}
        </p>
        {#if data.statistiques.alerteQualite}
          <span class="ui-badge ui-badge--danger">{t.alerteQualite}</span>
        {/if}
      </article>
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.coutMoyen}
        </p>
        <p class="text-3xl font-extrabold">
          {data.statistiques.coutMoyenCentimes === null
            ? "—"
            : new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(data.statistiques.coutMoyenCentimes / 100)}
        </p>
      </article>
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.dureeMoyenne}
        </p>
        <p class="text-3xl font-extrabold">
          {data.statistiques.dureeMoyenneMinutes === null
            ? "—"
            : `${Math.round(data.statistiques.dureeMoyenneMinutes)} ${t.minutes}`}
        </p>
      </article>
    </section>

    <section class="ui-carte space-y-4">
      <h2 class="text-lg font-semibold">
        {t.planifierMenage(data.logement.nom)}
      </h2>
      <form method="POST" action="?/planifier" class="space-y-4">
        <input type="hidden" name="logementId" value={data.logement.id} />
        <input type="hidden" name="ref" value={data.ref} />
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label class="space-y-2">
            <span class="ui-label">{t.date}</span>
            <input
              class="ui-champ"
              name="date"
              type="date"
              defaultValue={data.sejourChoisi?.date ?? data.aujourdHui}
              required
            />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.sejour}</span>
            <select class="ui-champ" name="reservationId">
              <option value="">{t.aucunSejour}</option>
              {#each data.sejours as sejour (sejour.id)}
                <option value={sejour.id} selected={sejour.id === data.sejourChoisi?.id}>
                  {sejour.clientNom ?? sejour.ref} · {sejour.debut} → {sejour.fin}
                </option>
              {/each}
            </select>
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.notes}</span>
            <input class="ui-champ" name="notes" placeholder={t.optionnel} />
          </label>
        </div>
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.planifier}
        </button>
      </form>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">{t.menages}</h2>
      {#if data.menages.length === 0}
        <p class="ui-carte border-dashed text-encre-douce">
          {t.aucunMenage}
        </p>
      {:else}
        <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
          <table class="ui-tableau min-w-[720px]">
            <thead>
              <tr>
                <th>{t.colDate}</th>
                <th>{t.colSejour}</th>
                <th>{t.colAvancement}</th>
                <th>{t.colStatut}</th>
                <th>{t.colNotes}</th>
                <th>{t.colQualite}</th>
                <th>{t.colCout}</th>
                <th>{t.colDuree}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {#each data.menages as menage (menage.id)}
                <tr>
                  <td>{menage.date}</td>
                  <td>{menage.sejour}</td>
                  <td>{menage.avancement}</td>
                  <td>{menage.statut}</td>
                  <td>{menage.notes}</td>
                  <td>{menage.score}</td>
                  <td>{menage.cout}</td>
                  <td>{menage.duree}</td>
                  <td><a class="ui-lien text-xs" href={`/hote/menage/${menage.id}`}>{t.ouvrir}</a></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  {/if}
</main>
