<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { traductionsPlanning } from "@/lib/i18n-planning";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const t = $derived(traductionsPlanning(data.langue));
  const jours = $derived(t.jours);
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-10">
  <header class="ui-entete space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.espace}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.titre(data.moisLabel)}</h1>
    {#if data.logement}
      <p class="text-encre-douce">
        {t.resume(data.logement.nom, data.logement.code, data.reservations.length, data.blocages.length)}
      </p>
    {/if}
  </header>

  <section
    class="ui-carte space-y-3"
    class:border-alerte={data.stopVentes.actif}
    class:bg-alerte-douce={data.stopVentes.actif}
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">
          {data.stopVentes.actif ? t.ventesSuspendues : t.stopGlobal}
        </h2>
        <p class="mt-1 text-sm text-encre-douce">
          {#if data.stopVentes.actif}
            {t.depuis(data.stopVentes.depuis ?? "—")}
            {#if data.stopVentes.motif}{t.motif(data.stopVentes.motif)}{/if}.
            {t.ventesSuspenduesAide}
          {:else}
            {t.stopAide}
          {/if}
        </p>
      </div>
      <form method="POST" action="?/basculerVentes" class="flex flex-wrap items-end gap-2">
        <input type="hidden" name="mois" value={data.mois} />
        <input type="hidden" name="logementId" value={data.logement?.id ?? ""} />
        {#if data.stopVentes.actif}
          <input type="hidden" name="suspendre" value="non" />
          <button class="ui-bouton ui-bouton--secondaire" type="submit">
            {t.reprendre}
          </button>
        {:else}
          <input type="hidden" name="suspendre" value="oui" />
          <label class="space-y-1 text-sm">
            <span class="ui-label">{t.motifFacultatif}</span>
            <input
              class="ui-champ"
              name="motif"
              maxlength="300"
              placeholder={t.motifPlaceholder}
            />
          </label>
          <button class="ui-bouton ui-bouton--primaire" type="submit">
            {t.toutArreter}
          </button>
        {/if}
      </form>
    </div>
    {#if form?.message}
      <p class={form.ok ? "ui-alerte ui-alerte--ok" : "ui-alerte ui-alerte--danger"} role="status">
        {form.message}
      </p>
    {/if}
    {#if data.ventes === "stop"}
      <p class="ui-alerte ui-alerte--ok" role="status">{t.ventesStop}</p>
    {:else if data.ventes === "reprise"}
      <p class="ui-alerte ui-alerte--ok" role="status">{t.ventesReprise}</p>
    {/if}
  </section>

  {#if data.vide}
    <section class="ui-carte space-y-3">
      <p class="text-encre-douce">
        {t.vide}
      </p>
      <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">
        {t.gererLogements}
      </a>
    </section>
  {:else if data.logement}
    <div class="flex flex-wrap items-center gap-2">
      <a
        class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
        href={`/hote/planning?mois=${data.moisPrecedent}&logement=${data.logement.id}`}
      >
        {t.moisPrecedent}
      </a>
      <a
        class="ui-bouton ui-bouton--fantome ui-bouton--petit"
        href={`/hote/planning?mois=${data.aujourdHui.slice(0, 7)}&logement=${data.logement.id}`}
      >
        {t.moisCourant}
      </a>
      <a
        class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
        href={`/hote/planning?mois=${data.moisSuivant}&logement=${data.logement.id}`}
      >
        {t.moisSuivant}
      </a>
      <a
        class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
        href={`/hote/planning/import?logement=${data.logement.id}`}
      >
        {t.importerOta}
      </a>
      <a
        class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
        href={`/hote/planning/canaux?logement=${data.logement.id}`}
      >
        {t.canaux}
      </a>

      <form class="ml-auto flex flex-wrap items-end gap-2" method="GET" action="/hote/planning">
        <input type="hidden" name="mois" value={data.mois} />
        <label class="space-y-1">
          <span class="ui-label">{t.logement}</span>
          <select class="ui-champ py-2" name="logement">
            {#each data.logements as logement (logement.id)}
              <option value={logement.id} selected={logement.id === data.logement.id}>
                {logement.nom}
              </option>
            {/each}
          </select>
        </label>
        <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
          {t.afficher}
        </button>
      </form>
    </div>

    <section class="ui-carte space-y-4">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold">{t.creerReservation}</h2>
        <p class="text-sm text-encre-douce">{t.chevauchement}</p>
      </div>

      <form method="POST" action="?/creer" class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label class="space-y-2">
            <span class="ui-label">{t.logement}</span>
            <select class="ui-champ" name="logementId" required>
              {#each data.logements as logement (logement.id)}
                <option value={logement.id} selected={logement.id === data.logement.id}>
                  {logement.nom} ({logement.code})
                </option>
              {/each}
            </select>
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.reference}</span>
            <input class="ui-champ" name="ref" placeholder="resa-2026-001" required />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.clientFacultatif}</span>
            <input class="ui-champ" name="clientNom" placeholder={t.clientPlaceholder} />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.voyageurs}</span>
            <input class="ui-champ" name="voyageurs" type="number" min="1" max="20" value="2" />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.debut}</span>
            <input class="ui-champ" name="debut" type="date" defaultValue={data.debutDefaut} required />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.finExclusive}</span>
            <input class="ui-champ" name="fin" type="date" defaultValue={data.finDefaut} required />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.montant}</span>
            <input class="ui-champ" name="montantEuros" inputmode="decimal" value="0" />
          </label>
        </div>

        {#if data.creation}
          <p class="ui-alerte ui-alerte--ok" role="status">
            {t.creation(data.creation.ref, data.creation.debut, data.creation.fin)}
          </p>
        {/if}
        {#if form?.message}
          <p
            class={form.ok ? "ui-alerte ui-alerte--ok" : "ui-alerte ui-alerte--danger"}
            role="status"
          >
            {form.message}
          </p>
        {/if}

        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.creer}
        </button>
      </form>
    </section>

    <section class="overflow-x-auto rounded-carte border border-bordure bg-surface">
      <table class="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr class="border-b border-bordure bg-fond">
            {#each jours as jour}
              <th class="p-2 text-left font-medium">{jour}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.grille as semaine, index}
            <tr class="border-b border-bordure last:border-0">
              {#each semaine as date, colonne}
                <td class="p-2 align-top">
                  {#if date}
                    {@const duJour = data.reservations.filter((r) => r.debut <= date && date < r.fin)}
                    {@const blocageJour = data.blocages.filter((b) => b.debut <= date && date < b.fin)}
                    <div class="min-h-20 rounded-lg border border-bordure p-2">
                      <span class="block text-xs text-encre-faine">{date.slice(8)}</span>
                      <ul class="mt-1 space-y-1">
                        {#if blocageJour.length > 0}
                          <li class="rounded bg-alerte-douce px-2 py-1 text-xs text-alerte">
                            {t.bloquee}
                          </li>
                        {/if}
                        {#each duJour.slice(0, 2) as reservation (reservation.id)}
                          <li class="truncate rounded bg-surface2 px-2 py-1 text-xs">
                            {reservation.ref}
                          </li>
                        {/each}
                        {#if duJour.length > 2}
                          <li class="text-xs text-encre-faine">+{duJour.length - 2}</li>
                        {/if}
                      </ul>
                    </div>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">{t.reservationsMois}</h2>
      {#if data.reservations.length === 0}
        <p class="ui-carte border-dashed text-encre-douce">
          {t.aucuneReservation}
        </p>
      {:else}
        <ul class="divide-y divide-bordure overflow-hidden rounded-carte border border-bordure bg-surface">
          {#each data.reservations as reservation (reservation.id)}
            <li class="space-y-1 p-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="font-medium">
                  {reservation.ref}
                  {reservation.clientNom ? ` — ${reservation.clientNom}` : ""}
                </p>
                <span class="ui-badge">{reservation.statut}</span>
              </div>
              <p class="text-sm text-encre-douce">
                {reservation.debut} → {reservation.fin} · {t.nuits(reservation.nuits)} · {t.voyageurCount(reservation.voyageurs)} · {reservation.montant}
              </p>
              <div class="flex flex-wrap gap-3 text-sm">
                <a class="ui-lien" href={reservation.lienVoyageur} target="_blank" rel="noreferrer">
                  {t.lienVoyageur}
                </a>
                <a class="ui-lien" href={reservation.lienContrat} target="_blank" rel="noreferrer">
                  {t.contrat}
                </a>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">{t.blocagesOta}</h2>
      {#if data.blocages.length === 0}
        <p class="ui-carte border-dashed text-encre-douce">
          {t.aucunBlocage}
        </p>
      {:else}
        <ul class="divide-y divide-bordure overflow-hidden rounded-carte border border-bordure bg-surface">
          {#each data.blocages as blocage (blocage.id)}
            <li class="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p class="font-medium">{blocage.motif ?? t.indisponibiliteOta}</p>
                <p class="text-sm text-encre-douce">{blocage.debut} → {blocage.fin}</p>
              </div>
              <span class="ui-badge ui-badge--alerte">{t.bloque}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
</main>
