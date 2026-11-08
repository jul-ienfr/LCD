<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>{data.t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">{data.t.espace}</p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.t.titre(data.moisLabel)}</h1>
      <p class="text-encre-douce">{data.t.resume(data.factures.length, data.totalMois)}</p>
    </div>
    <a class="ui-lien text-sm" href="/hote">{data.t.retour}</a>
  </header>

  <div class="flex flex-wrap items-center gap-3 text-sm">
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/hote/factures?mois=${data.moisPrecedent}`}>{data.t.precedent}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/hote/factures?mois=${data.moisCourant}`}>{data.t.courant}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/hote/factures?mois=${data.moisSuivant}`}>{data.t.suivant}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/api/exports/factures?mois=${data.mois}`}>{data.t.exportCsv}</a>
  </div>

  {#if data.relance}
    <p
      class={data.relanceKo
        ? "ui-alerte ui-alerte--danger"
        : "ui-alerte ui-alerte--succes"}
      role="status"
    >
      {data.relance}
    </p>
  {/if}

  {#if data.aRelancer > 0}
    <section class="ui-carte space-y-3">
      <p class="text-sm text-alerte">
        {data.t.aRelancer(data.aRelancer)}
      </p>
      <p class="text-xs text-encre-douce">{data.t.aRelancerAide}</p>
      <form method="POST" action="?/relancer">
        <input type="hidden" name="mois" value={data.mois} />
        <button class="ui-bouton ui-bouton--secondaire" type="submit">
          {data.t.relancerBtn}
        </button>
      </form>
    </section>
  {/if}

  {#if data.logements.length === 0}
    <section class="ui-carte border-dashed">
      <h2 class="text-lg font-semibold">{data.t.creer}</h2>
      <p class="mt-2 text-encre-douce">{data.t.creerVide}</p>
      <a class="ui-bouton ui-bouton--primaire mt-4" href="/hote/logements">{data.t.gererLogements}</a>
    </section>
  {:else}
    <section class="ui-carte">
      <h2 class="text-lg font-semibold">{data.t.creer}</h2>
      <p class="mt-1 text-sm text-encre-douce">{data.t.creerAide}</p>
      {#if form?.message}
        <p class="ui-alerte ui-alerte--danger mt-4" role="alert">{form.message}</p>
      {/if}
      <form method="POST" action="?/creer" class="mt-5 grid gap-4 sm:grid-cols-2">
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.logement}</span>
          <select class="ui-champ" name="logementId" required>
            {#each data.logements as logement (logement.id)}
              <option value={logement.id}>{logement.nom} — {logement.code}</option>
            {/each}
          </select>
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.reservationFacultatif}</span>
          <select class="ui-champ" name="reservationId">
            <option value="">{data.t.aucune}</option>
            {#each data.reservations as reservation (reservation.id)}
              <option value={reservation.id}>{reservation.ref} — {reservation.clientNom ?? data.t.sansNom} ({reservation.debut} → {reservation.fin})</option>
            {/each}
          </select>
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.numero}</span>
          <input
            class="ui-champ font-mono"
            name="numero"
            placeholder={data.numeroDefaut}
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.dateEmission}</span>
          <input class="ui-champ" type="date" name="dateEmission" defaultValue={data.dateDefaut} required />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.client}</span>
          <input
            class="ui-champ"
            name="clientNom"
            placeholder={data.t.clientPlaceholder}
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.emailClient}</span>
          <input class="ui-champ" type="email" name="clientEmail" />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.designation}</span>
          <input class="ui-champ" name="designation" placeholder={data.t.designationPlaceholder} />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.quantite}</span>
          <input class="ui-champ" type="number" name="quantite" min="1" />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.prixUnitaire}</span>
          <input class="ui-champ" name="prixUnitaireEuros" inputmode="decimal" placeholder="120,00" />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.echeance}</span>
          <input class="ui-champ" type="date" name="echeance" />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.tva}</span>
          <input class="ui-champ" name="tvaEuros" inputmode="decimal" placeholder={`Auto (${data.tauxTva} %)`} />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.taxeSejour}</span>
          <input class="ui-champ" name="taxeEuros" inputmode="decimal" placeholder={data.t.auto} />
        </label>
        <label class="ui-champ-groupe sm:col-span-2">
          <span class="ui-label">{data.t.notes}</span>
          <textarea class="ui-champ" name="notes" rows="2"></textarea>
        </label>
        <div class="sm:col-span-2">
          <button class="ui-bouton ui-bouton--primaire" type="submit">{data.t.creerBtn}</button>
        </div>
      </form>
    </section>
  {/if}

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{data.t.duMois}</h2>
    {#if data.factures.length === 0}
      <p class="ui-carte border-dashed text-encre-douce">{data.t.aucuneFacture}</p>
    {:else}
      <ul class="divide-y divide-bordure rounded-carte border border-bordure bg-surface">
        {#each data.factures as facture (facture.id)}
          <li class="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <a class="font-medium underline" href={`/hote/factures/${facture.id}`}>{facture.numero}</a>
              <p class="text-sm text-encre-douce">{facture.clientNom} · {facture.dateEmission} · {facture.statut}</p>
            </div>
            <p class="font-medium">{facture.montant}</p>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien" href="/hote/planning">{data.t.planning}</a>
    <a class="ui-lien" href="/hote">{data.t.tableauBord}</a>
  </nav>
</main>
