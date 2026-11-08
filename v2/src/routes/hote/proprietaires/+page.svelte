<script lang="ts">
  import type { PageData } from "./$types";
  import { traductionsProprietaires } from "@/lib/i18n-proprietaires";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsProprietaires(data.langue));

  const messages: Record<string, string> = $derived({
    commission: t.msgCommission,
    charges: t.msgCharges,
    mode: t.msgMode,
    statut: t.msgStatut,
    dates: t.msgDates,
    notes: t.msgNotes,
    logement: t.msgLogement,
    proprietaire: t.msgProprietaire,
    inattendu: t.msgInattendu,
  });
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {t.espace}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
      <p class="text-encre-douce">{t.description}</p>
    </div>
    <a class="ui-lien text-sm" href="/hote/entite">{t.entiteLien}</a>
  </header>

  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok">
      {data.ok === "retire"
        ? t.okRetire
        : data.okProprietaire && data.okLogement
          ? t.okRattache(data.okProprietaire, data.okLogement)
          : t.okEnregistre}
    </p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger">{messages[data.erreur] ?? data.erreur}</p>
  {/if}

  {#if data.proprietaires.length === 0}
    <p class="ui-alerte ui-alerte--alerte">{t.aucunProprietaire}</p>
  {:else}
    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{t.enregistrerMandat}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.aideMandat}</p>
      </div>
      <form class="space-y-4" method="POST" action="?/assigner">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label class="space-y-2">
            <span class="ui-label">{t.proprietaire}</span>
            <select class="ui-champ" name="userId" required>
              {#each data.proprietaires as proprietaire (proprietaire.id)}
                <option value={proprietaire.id}>{proprietaire.name} ({proprietaire.email})</option>
              {/each}
            </select>
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.logement}</span>
            <select class="ui-champ" name="logementId" required>
              {#each data.logements as logement (logement.id)}
                <option value={logement.id}>{logement.nom} ({logement.code})</option>
              {/each}
            </select>
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.commission}</span>
            <input class="ui-champ" inputmode="decimal" max="50" min="0" name="commission" step="0.5" type="number" value="20" />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.chargesMensuelles}</span>
            <input class="ui-champ" inputmode="decimal" min="0" max="10000" name="charges" step="0.01" type="number" value="0" />
          </label>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="space-y-2">
            <span class="ui-label">{t.mode}</span>
            <select class="ui-champ" name="mode">
              {#each data.modes as mode (mode.id)}
                <option value={mode.id}>{t.modes[mode.id] ?? mode.id}</option>
              {/each}
            </select>
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.statut}</span>
            <select class="ui-champ" name="statut">
              {#each data.statuts as statut (statut.id)}
                <option value={statut.id}>{t.statuts[statut.id] ?? statut.id}</option>
              {/each}
            </select>
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.debutFacultatif}</span>
            <input class="ui-champ" name="dateDebut" type="date" />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.finFacultatif}</span>
            <input class="ui-champ" name="dateFin" type="date" />
          </label>
        </div>
        <label class="block space-y-2">
          <span class="ui-label">{t.notesFacultatif}</span>
          <textarea class="ui-champ min-h-20" maxlength="1000" name="notes"></textarea>
        </label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">{t.enregistrer}</button>
      </form>
    </section>
  {/if}

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.mandats(data.assignations.length)}</h2>
    {#if data.assignations.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucunMandat}
      </p>
    {:else}
      <ul class="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
        {#each data.assignations as assignation (`${assignation.logementId}-${assignation.userId}`)}
          <li class="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p class="font-medium">{assignation.logement}</p>
              <p class="text-sm text-encre-douce">{assignation.proprietaire} · {assignation.email}</p>
              <p class="text-xs text-encre-faine">
                {t.modes[assignation.mode] ?? assignation.mode}
                · {t.statuts[assignation.statut] ?? assignation.statut}
                · {t.commission.replace(" (%)", "")} {assignation.commission}
                · {t.chargesCourt} {assignation.charges}/{t.chargesMois}
              </p>
              {#if assignation.dateDebut || assignation.dateFin}
                <p class="text-xs text-encre-faine">
                  {t.dates(assignation.dateDebut, assignation.dateFin)}
                </p>
              {/if}
              {#if assignation.notes}
                <p class="mt-1 text-xs text-encre-douce">{assignation.notes}</p>
              {/if}
            </div>
            <form method="POST" action="?/retirer">
              <input name="logementId" type="hidden" value={assignation.logementId} />
              <input name="userId" type="hidden" value={assignation.userId} />
              <button class="ui-bouton ui-bouton--danger ui-bouton--petit" type="submit">{t.retirer}</button>
            </form>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien" href="/proprio">{t.espaceProprio}</a>
  </nav>
</main>
