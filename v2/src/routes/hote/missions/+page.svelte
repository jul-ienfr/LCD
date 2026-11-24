<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { traductionsMissions } from "@/lib/i18n-missions";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const erreur = $derived((form as { erreur?: string } | null)?.erreur ?? data.erreur);

  const t = $derived(traductionsMissions(data.langue));
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-8 px-6 py-12">
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
    <a class="ui-lien-action ml-auto text-sm" href="/presta">{t.espacePresta}</a>
  </div>

  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok" role="status">
      {#if data.ok === "preuve_validee"}
        {t.okPreuveValidee}
      {:else if data.ok === "preuve_refusee"}
        {t.okPreuveRefusee}
      {:else if data.okRef && data.okDate}
        {t.creeePour(data.okRef, data.okDate)}
      {:else}
        {t.creee}
      {/if}
    </p>
  {/if}
  {#if erreur}
    <p class="ui-alerte ui-alerte--danger" role="alert">{t.erreurs[erreur] ?? erreur}</p>
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
            {#if mission.pointage !== "non_commence"}
              <p class="mt-1 text-sm">
                {#if mission.finReelle}
                  {t.pointageFin(mission.debutReel ?? "?", mission.finReelle)}
                {:else}
                  {t.pointageDebut(mission.debutReel ?? "?")}
                {/if}
                {#if mission.debutHorsLigne || mission.finHorsLigne}
                  <span class="text-encre-faine">· {t.pointageHorsLigne}</span>
                {/if}
              </p>
              {#if mission.dureeReelle !== null}
                <p class="mt-1 text-sm text-encre-douce">
                  {t.dureeReelle(mission.dureeReelle, mission.dureePrevue, mission.ecart ?? "")}
                </p>
              {/if}
            {/if}
            {#if mission.notes}
              <p class="mt-1 text-sm text-encre-faine">{mission.notes}</p>
            {/if}

            <div class="mt-3 space-y-2 border-t border-bordure pt-3">
              {#if mission.preuve === "soumise"}
                <span class="ui-badge ui-badge--accent">{t.preuveStatuts.soumise}</span>
              {:else}
                <span class="ui-badge">{t.preuveStatuts[mission.preuve]}</span>
              {/if}
              {#if mission.preuveSoumiseLe}
                <span class="ml-2 text-xs text-encre-faine">{t.preuveSoumiseLe(mission.preuveSoumiseLe)}</span>
              {/if}
              {#if mission.preuveValideeLe && mission.preuveValideePar}
                <span class="ml-2 text-xs text-encre-faine">
                  {t.preuveValideeLe(mission.preuveValideeLe, mission.preuveValideePar)}
                </span>
              {/if}
              {#if mission.preuve === "refusee" && mission.preuveMotif}
                <p class="ui-alerte ui-alerte--danger">{t.preuveMotif(mission.preuveMotif)}</p>
              {/if}

              {#if mission.preuveAHacher}
                <form class="space-y-2" method="POST" action="?/preuve">
                  <input type="hidden" name="missionId" value={mission.id} />
                  <input type="hidden" name="mois" value={data.mois} />
                  <label class="block space-y-1">
                    <span class="ui-label">{t.motifRefus}</span>
                    <textarea
                      class="ui-champ min-h-16"
                      name="motif"
                      minlength={data.motifRefusMin}
                      maxlength={data.motifRefusMax}
                    ></textarea>
                    <span class="text-xs text-encre-faine">
                      {t.motifRefusAide(data.motifRefusMin, data.motifRefusMax)}
                    </span>
                  </label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      class="ui-bouton ui-bouton--primaire ui-bouton--petit"
                      type="submit"
                      name="decision"
                      value="valider"
                    >
                      {t.validerPreuve}
                    </button>
                    <button
                      class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
                      type="submit"
                      name="decision"
                      value="refuser"
                    >
                      {t.refuserPreuve}
                    </button>
                  </div>
                </form>
              {/if}

              {#if mission.historique.length > 0}
                <details>
                  <summary class="cursor-pointer text-xs text-encre-douce">
                    {t.preuveHistorique} ({mission.historique.length})
                  </summary>
                  <ol class="mt-1 space-y-1 text-xs text-encre-douce">
                    {#each mission.historique as etape (etape.id)}
                      <li>
                        {t.preuveStatuts[etape.statut]} — {etape.le} · {etape.qui}{#if etape.motif} : {etape.motif}{/if}
                      </li>
                    {/each}
                  </ol>
                </details>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
