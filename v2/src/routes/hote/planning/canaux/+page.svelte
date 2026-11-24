<script lang="ts">
  import ConfirmationAction from "@/lib/components/ui/confirmation-action.svelte";
  import { traductionsCanaux } from "@/lib/i18n-canaux";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const t = $derived(traductionsCanaux((data as { langue?: string }).langue ?? "fr"));

  function classeStatut(statut: string | null): string {
    if (statut === "ok") return "ui-alerte ui-alerte--ok";
    if (statut === "partiel") return "ui-alerte";
    if (statut === "erreur") return "ui-alerte ui-alerte--danger";
    return "text-sm text-encre-faine";
  }
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
      <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
      <p class="text-encre-douce">{t.description}</p>
    </div>
    <div class="flex flex-wrap gap-4 text-sm">
      <a class="ui-lien-action" href={`/hote/planning?logement=${data.logement?.id ?? ""}`}>
        {t.retourPlanning}
      </a>
      <a class="ui-lien-action" href={`/hote/planning/import?logement=${data.logement?.id ?? ""}`}>
        {t.importIcs}
      </a>
    </div>
  </header>

  {#if form?.message}
    <p
      class={form.ok ? "ui-alerte ui-alerte--ok" : "ui-alerte ui-alerte--danger"}
      role="status"
    >
      {form.message}
    </p>
  {/if}

  <p class="ui-alerte" role="note">
    {t.notice}
  </p>

  {#if data.fournisseur}
    <section class="ui-carte space-y-2" aria-label={t.fournisseurTitre}>
      <div class="flex flex-wrap items-center gap-2">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.fournisseurTitre}
        </p>
        <span class="ui-badge ui-badge--accent">{data.fournisseur.nom}</span>
        <span class="ui-badge">{data.fournisseur.modeLibelle}</span>
      </div>
      <p class="text-sm text-encre-douce">
        {t.reserveSuperAdmin}
      </p>
      {#if data.fournisseur.externalPropertyId || data.fournisseur.derniereSync}
        <p class="text-xs text-encre-faine">
          {t.identifiantExterne} : {data.fournisseur.externalPropertyId ?? "—"}
          · {t.derniereSync} : {data.fournisseur.derniereSync ?? t.jamais}
        </p>
      {/if}
      {#if data.fournisseur.dernierStatut}
        <p class="text-xs text-encre-faine">
          {t.etat} : {data.fournisseur.dernierStatut}
          {#if data.fournisseur.dernierMessage}
            · {data.fournisseur.dernierMessage}
          {/if}
        </p>
      {/if}
    </section>
  {:else}
    <p class="ui-alerte" role="status">
      {t.aucunFournisseur}
    </p>
  {/if}

  {#if data.vide}
    <section class="ui-carte space-y-3">
      <p class="text-encre-douce">{t.videLogement}</p>
      <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">
        {t.creerLogement}
      </a>
    </section>
  {:else if data.logement}
    {#if data.logements.length > 1}
      <form method="GET" class="flex flex-wrap items-end gap-3">
        <label class="ui-champ-groupe min-w-64 flex-1">
          <span class="ui-label">{t.logement}</span>
          <select class="ui-champ" name="logement">
            {#each data.logements as logement (logement.id)}
              <option value={logement.id} selected={logement.id === data.logement.id}>
                {logement.nom}
              </option>
            {/each}
          </select>
        </label>
        <button class="ui-bouton ui-bouton--secondaire" type="submit">
          {t.afficher}
        </button>
      </form>
    {/if}

    {#if data.sante}
      <section class="grid gap-3 sm:grid-cols-4" aria-label={t.santeCanaux}>
        <div class="ui-carte">
          <p class="text-xs uppercase tracking-widest text-encre-faine">{t.canaux}</p>
          <p class="mt-1 text-2xl font-semibold">{data.sante.total}</p>
        </div>
        <div class="ui-carte">
          <p class="text-xs uppercase tracking-widest text-encre-faine">{t.exportsActifs}</p>
          <p class="mt-1 text-2xl font-semibold">{data.sante.exportsActifs}</p>
        </div>
        <div class="ui-carte">
          <p class="text-xs uppercase tracking-widest text-encre-faine">{t.importsIcal}</p>
          <p class="mt-1 text-2xl font-semibold">{data.sante.imports}</p>
        </div>
        <div class="ui-carte">
          <p class="text-xs uppercase tracking-widest text-encre-faine">{t.erreursRetard}</p>
          <p class={data.sante.enErreur + data.sante.enRetard > 0 ? "mt-1 text-2xl font-semibold text-danger" : "mt-1 text-2xl font-semibold"}>
            {data.sante.enErreur} / {data.sante.enRetard}
          </p>
        </div>
      </section>
    {/if}

    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{t.ajouterCanal(data.logement.nom)}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.ajouterCanalAide}</p>
      </div>

      <form method="POST" action="?/creer" class="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="logementId" value={data.logement.id} />
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.plateforme}</span>
          <select class="ui-champ" name="code" required>
            <option value="">{t.choisir}</option>
            {#each data.catalogue as fiche (fiche.code)}
              <option value={fiche.code}>
                {fiche.nom}{fiche.aVerifier ? ` — ${t.icalVerifier}` : ""}
              </option>
            {/each}
          </select>
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.nomAffiche}</span>
          <input
            class="ui-champ"
            name="libelle"
            maxlength="80"
            placeholder={t.placeholderLibelle}
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.identifiantAnnonceFacultatif}</span>
          <input
            class="ui-champ"
            name="externalListingId"
            maxlength="120"
            placeholder={t.placeholderId}
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.urlImportFacultatif}</span>
          <input
            class="ui-champ font-mono text-xs"
            type="url"
            name="url"
            placeholder={t.placeholderUrl}
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.bufferApresDepart}</span>
          <input
            class="ui-champ"
            type="number"
            name="bufferJours"
            min="0"
            max="7"
            value="0"
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.intervalleImport}</span>
          <input
            class="ui-champ"
            type="number"
            name="intervalleMinutes"
            min="1"
            max="1440"
            value="5"
          />
        </label>
        <label class="flex min-h-11 min-w-11 items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" name="exportActif" checked />
          {t.publierExport}
        </label>
        <label class="ui-champ-groupe sm:col-span-2">
          <span class="ui-label">{t.notesInternesFacultatif}</span>
          <textarea class="ui-champ" name="notes" rows="2" maxlength="500"></textarea>
        </label>
        <div class="sm:col-span-2">
          <button class="ui-bouton ui-bouton--primaire" type="submit">
            {t.ajouter}
          </button>
        </div>
      </form>
    </section>

    <section class="space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 class="text-lg font-semibold">{t.canauxDe(data.logement.nom)}</h2>
          <p class="text-sm text-encre-douce">{t.sansImport(data.sante?.sansImport ?? 0)}</p>
        </div>
      </div>

      {#if data.canaux.length === 0}
        <div class="ui-carte">
          <p class="text-encre-douce">
            {t.aucunCanal}
          </p>
        </div>
      {/if}

      {#each data.canaux as canal (canal.id)}
        <article class="ui-carte space-y-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-lg font-semibold">{canal.libelle}</h3>
                <span class="text-xs uppercase tracking-widest text-encre-faine">
                  {canal.nomCatalogue}
                </span>
                {#if canal.aVerifier}
                  <span class="ui-alerte text-xs" role="note">{t.icalVerifierBadge}</span>
                {/if}
                {#if canal.api === "partenaire"}
                  <span class="text-xs text-encre-faine">{t.apiNative}</span>
                {/if}
              </div>
              <p class="text-sm text-encre-douce">{canal.description}</p>
            </div>
            <div class="flex flex-wrap gap-2 text-xs">
              <span class={canal.actif ? "ui-alerte ui-alerte--ok" : "ui-alerte"}>
                {canal.actif ? t.canalActif : t.canalDesactive}
              </span>
              <span class={canal.exportActif ? "ui-alerte ui-alerte--ok" : "ui-alerte"}>
                {canal.exportActif ? t.exportActif : t.exportCoupe}
              </span>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <p class="text-xs uppercase tracking-widest text-encre-faine">
                {t.importIcal}
              </p>
              {#if canal.flux}
                <p class={classeStatut(canal.flux.dernierStatut)}>
                  {canal.flux.dernierStatut ?? t.jamaisSynchronise}
                  {#if canal.flux.enRetard} · {t.enRetard}{/if}
                </p>
                <p class="text-sm text-encre-douce">
                  {t.derniereSyncLabel} :
                  {canal.flux.derniereSync ?? t.jamais}<br />
                  {t.prochainEssai} : {canal.flux.prochainEssai}<br />
                  {t.intervalle} : {canal.flux.intervalleMinutes} min
                </p>
                {#if canal.flux.dernierMessage}
                  <p class="text-sm text-encre-douce">{canal.flux.dernierMessage}</p>
                {/if}
                {#if canal.flux.echecsConsecutifs > 0}
                  <p class="text-sm text-danger">
                    {t.echecs(canal.flux.echecsConsecutifs)}
                  </p>
                {/if}
              {:else}
                <p class="text-sm text-encre-douce">
                  {t.aucunFlux}
                </p>
              {/if}
            </div>

            <div class="space-y-2">
              <p class="text-xs uppercase tracking-widest text-encre-faine">
                {t.exportVers}
              </p>
              <label class="ui-champ-groupe">
                <span class="ui-label">{t.urlSignee}</span>
                <input
                  class="ui-champ font-mono text-xs"
                  readonly
                  value={canal.abonnement}
                />
              </label>
              <div class="flex flex-wrap gap-3 text-sm">
                {#if canal.actif && canal.exportActif}
                  <a class="ui-lien-action" href={canal.abonnement}>{t.telecharger}</a>
                {:else}
                  <span class="text-encre-faine">{t.exportDesactive}</span>
                {/if}
                <span class="text-encre-faine">
                  {t.buffer(canal.bufferJours)}
                </span>
              </div>
            </div>
          </div>

          {#if canal.externalListingId || canal.notes}
            <dl class="grid gap-2 text-sm sm:grid-cols-2">
              {#if canal.externalListingId}
                <div>
                  <dt class="text-encre-faine">{t.identifiantAnnonce}</dt>
                  <dd class="font-mono">{canal.externalListingId}</dd>
                </div>
              {/if}
              {#if canal.notes}
                <div>
                  <dt class="text-encre-faine">{t.notes}</dt>
                  <dd>{canal.notes}</dd>
                </div>
              {/if}
            </dl>
          {/if}

          <div class="flex flex-wrap gap-3">
            {#if canal.flux}
              <form method="POST" action="?/synchroniser">
                <input type="hidden" name="logementId" value={data.logement.id} />
                <input type="hidden" name="canalId" value={canal.id} />
                <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                  {t.synchroniser}
                </button>
              </form>
              <ConfirmationAction
                langue={data.langue}
                action="supprimerFlux"
                cible={canal.id}
                libelle={t.retirerImport}
                champs={{ logementId: data.logement.id, canalId: canal.id }}
                classe="ui-bouton ui-bouton--secondaire ui-bouton--petit"
              />
            {/if}
          </div>

          <details class="border-t border-encre-faine/20 pt-4">
            <summary class="flex min-h-11 cursor-pointer items-center text-sm font-medium">
              {t.modifierCanal}
            </summary>
            <form method="POST" action="?/modifier" class="mt-4 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="logementId" value={data.logement.id} />
              <input type="hidden" name="canalId" value={canal.id} />
              <label class="ui-champ-groupe">
                <span class="ui-label">{t.nomAffiche}</span>
                <input
                  class="ui-champ"
                  name="libelle"
                  maxlength="80"
                  required
                  value={canal.libelle}
                />
              </label>
              <label class="ui-champ-groupe">
                <span class="ui-label">{t.identifiantAnnonce}</span>
                <input
                  class="ui-champ"
                  name="externalListingId"
                  maxlength="120"
                  value={canal.externalListingId ?? ""}
                />
              </label>
              <label class="ui-champ-groupe">
                <span class="ui-label">{t.bufferApresDepart}</span>
                <input
                  class="ui-champ"
                  type="number"
                  name="bufferJours"
                  min="0"
                  max="7"
                  value={canal.bufferJours}
                />
              </label>
              <label class="ui-champ-groupe">
                <span class="ui-label">{t.urlImportFacultatif}</span>
                <input
                  class="ui-champ font-mono text-xs"
                  type="url"
                  name="url"
                  placeholder={t.laisserVide}
                  value={canal.flux?.url ?? ""}
                />
              </label>
              <label class="ui-champ-groupe">
                <span class="ui-label">{t.intervalleImport}</span>
                <input
                  class="ui-champ"
                  type="number"
                  name="intervalleMinutes"
                  min="1"
                  max="1440"
                  value={canal.flux?.intervalleMinutes ?? 5}
                />
              </label>
              <label class="flex min-h-11 min-w-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="actif"
                  checked={canal.actif}
                />
                {t.canalActifLabel}
              </label>
              <label class="flex min-h-11 min-w-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="exportActif"
                  checked={canal.exportActif}
                />
                {t.exportActifLabel}
              </label>
              <p class="text-xs text-encre-faine sm:col-span-2">
                {t.desactiverAide}
              </p>
              <label class="ui-champ-groupe sm:col-span-2">
                <span class="ui-label">{t.notesInternes}</span>
                <textarea class="ui-champ" name="notes" rows="2" maxlength="500" defaultValue={canal.notes ?? ""}></textarea>
              </label>
              <div class="sm:col-span-2">
                <button class="ui-bouton ui-bouton--primaire" type="submit">
                  {t.enregistrer}
                </button>
              </div>
            </form>

            <details class="mt-4">
              <summary class="flex min-h-11 cursor-pointer items-center text-sm text-danger">
                {t.supprimerCanal}
              </summary>
              <p class="mt-2 text-sm text-encre-douce">
                {t.supprimerAide}
              </p>
              <ConfirmationAction
                langue={data.langue}
                action="supprimer"
                cible={canal.id}
                libelle={t.confirmerSuppression}
                champs={{ logementId: data.logement.id, canalId: canal.id }}
                classe="ui-bouton ui-bouton--secondaire ui-bouton--petit"
              />
            </details>
          </details>
        </article>
      {/each}
    </section>
  {/if}
</main>
