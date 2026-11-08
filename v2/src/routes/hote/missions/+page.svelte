<script lang="ts">
  import type { PageData } from "./$types";
  import { traductionsMissions } from "@/lib/i18n-missions";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsMissions(data.langue));
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {t.espace}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.titre(data.moisLibelle)}</h1>
      <p class="text-encre-douce">{t.resume(data.missions.length, data.prestataires.length)}</p>
    </div>
  </header>

  <div class="flex flex-wrap items-center gap-3">
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.precedent}>{t.precedent}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.courant}>{t.courant}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.suivant}>{t.suivant}</a>
    <a class="ui-lien ml-auto text-sm" href="/presta">{t.espacePresta}</a>
  </div>

  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok">
      {#if data.okRef && data.okDate}
        {t.creeePour(data.okRef, data.okDate)}
      {:else}
        {t.creee}
      {/if}
    </p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger">{t.erreurs[data.erreur] ?? data.erreur}</p>
  {/if}

  {#if data.prestataires.length === 0}
    <p class="ui-alerte ui-alerte--alerte">
      {t.aucunPrestataire}
    </p>
  {:else if data.logements.length > 0}
    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{t.creer}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.creerAide}</p>
      </div>
      <form class="space-y-4" method="POST" action="?/creer">
        <input name="mois" type="hidden" value={data.mois} />
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="space-y-2">
            <span class="ui-label">{t.logement}</span>
            <select class="ui-champ" name="logementId" required>
              {#each data.logements as logement (logement.id)}
                <option value={logement.id}>{logement.nom} ({logement.code})</option>
              {/each}
            </select>
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.prestataire}</span>
            <select class="ui-champ" name="assignedUserId" required>
              {#each data.prestataires as prestataire (prestataire.id)}
                <option value={prestataire.id}>{prestataire.name} ({prestataire.email})</option>
              {/each}
            </select>
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.reference}</span>
            <input class="ui-champ font-mono" name="ref" required defaultValue={data.refDefaut} />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.type}</span>
            <select class="ui-champ" name="type">
              {#each data.types as type (type.id)}
                <option value={type.id}>{type.libelle}</option>
              {/each}
            </select>
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.date}</span>
            <input class="ui-champ" name="date" type="date" required defaultValue={data.dateDefaut} />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.heureFacultatif}</span>
            <input class="ui-champ" name="heure" type="time" value="10:00" />
          </label>
          <label class="space-y-2 sm:col-span-2">
            <span class="ui-label">{t.reservationLiee}</span>
            <select class="ui-champ" name="reservationId">
              <option value="">{t.aucune}</option>
              {#each data.reservations as reservation (reservation.id)}
                <option value={reservation.id}>{reservation.ref} — {reservation.debut} → {reservation.fin}</option>
              {/each}
            </select>
          </label>
        </div>
        <label class="block space-y-2">
          <span class="ui-label">{t.notesFacultatif}</span>
          <textarea class="ui-champ min-h-20" name="notes"></textarea>
        </label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">{t.creerMission}</button>
      </form>
    </section>
  {/if}

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.missionsMois}</h2>
    {#if data.missions.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucuneMission}
      </p>
    {:else}
      <ul class="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
        {#each data.missions as mission (mission.id)}
          <li class="p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-medium">{mission.ref} — {mission.type}</p>
              <span class="ui-badge">{mission.statut}</span>
            </div>
            <p class="mt-1 text-sm text-encre-douce">
              {mission.date}{mission.heure ? ` ${mission.heure}` : ""} · {mission.logement} · {mission.prestataire}
            </p>
            {#if mission.notes}
              <p class="mt-1 text-sm text-encre-faine">{mission.notes}</p>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
