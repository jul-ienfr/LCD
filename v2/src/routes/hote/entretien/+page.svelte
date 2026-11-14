<script lang="ts">
  import { traductionsEntretienDomaine } from "@/lib/i18n-entretien-domaine";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const t = $derived(traductionsEntretienDomaine((data as { langue?: string }).langue ?? "fr"));
</script>

<svelte:head>
  <title>{t.eTitrePage}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {t.eSurtitre}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.eTitre}</h1>
      <p class="text-encre-douce">{t.eDescription}</p>
    </div>
    <a class="ui-lien-action text-sm" href="/hote">{t.eRetour}</a>
  </header>

  {#if data.vide}
    <section class="ui-carte space-y-3">
      <p class="text-encre-douce">
        {t.eVide}
      </p>
      <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">{t.eCreerLogement}</a>
    </section>
  {:else if data.logement}
    {#if data.logements.length > 1}
      <nav class="flex flex-wrap gap-2" aria-label={t.eChoisirLogement}>
        {#each data.logements as logement (logement.id)}
          <a
            class={logement.id === data.logement.id
              ? "ui-bouton ui-bouton--primaire ui-bouton--petit"
              : "ui-bouton ui-bouton--secondaire ui-bouton--petit"}
            href={`/hote/entretien?logement=${logement.id}`}
          >
            {logement.nom}
          </a>
        {/each}
      </nav>
    {/if}

    {#if data.ok}
      <p class="ui-alerte ui-alerte--ok" role="status">{t.eOk}</p>
    {/if}
    {#if data.erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">
        {data.erreur === "inattendu"
          ? t.eErreurInattendue
          : data.erreur}
      </p>
    {/if}

    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.eInterventions}
        </p>
        <p class="text-3xl font-extrabold">{data.entretiens.length}</p>
      </article>
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.eCoutCumule}
        </p>
        <p class="text-3xl font-extrabold">{data.total}</p>
      </article>
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.eReparations}
        </p>
        <p class="text-3xl font-extrabold">{data.comptes.reparation}</p>
      </article>
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.eControles}
        </p>
        <p class="text-3xl font-extrabold">{data.comptes.controle}</p>
      </article>
    </section>

    <section class="ui-carte space-y-4">
      <h2 class="text-lg font-semibold">
        {t.eNouvelle(data.logement.nom)}
      </h2>

      <form method="POST" action="?/creer" class="space-y-4">
        <input type="hidden" name="logementId" value={data.logement.id} />
        <input type="hidden" name="ref" value={data.ref} />

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label class="ui-champ-groupe">
            <span class="ui-label">{t.eType}</span>
            <select class="ui-champ" name="type">
              {#each data.types as type (type.valeur)}
                <option value={type.valeur}>{type.libelle}</option>
              {/each}
            </select>
          </label>
          <label class="ui-champ-groupe">
            <span class="ui-label">{t.eDate}</span>
            <input
              class="ui-champ"
              type="date"
              name="date"
              defaultValue={data.aujourdHui}
              required
            />
          </label>
          <label class="ui-champ-groupe">
            <span class="ui-label">{t.ePrestataire}</span>
            <input class="ui-champ" name="prestataire" placeholder={t.eOptionnel} />
          </label>
          <label class="ui-champ-groupe">
            <span class="ui-label">{t.eCout}</span>
            <input
              class="ui-champ"
              name="cout"
              inputmode="decimal"
              placeholder="0,00"
            />
          </label>
        </div>

        <label class="ui-champ-groupe">
          <span class="ui-label">{t.eTitreChamp}</span>
          <input
            class="ui-champ"
            name="titre"
            placeholder={t.eTitrePlaceholder}
            maxlength="120"
            required
          />
        </label>

        <label class="ui-champ-groupe">
          <span class="ui-label">{t.eDescriptionChamp}</span>
          <textarea
            class="ui-champ min-h-20"
            name="description"
            maxlength="2000"
          ></textarea>
        </label>

        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.eEnregistrer}
        </button>
      </form>
    </section>

    <section class="space-y-3">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <h2 class="text-lg font-semibold">{t.eHistorique}</h2>
        <div class="flex flex-wrap gap-4 text-sm">
          <a class="ui-lien-action" href={`/hote/etats-des-lieux?logement=${data.logement.id}`}>
            {t.eEtatsDesLieux}
          </a>
          <a class="ui-lien-action" href={`/hote/menage?logement=${data.logement.id}`}>
            {t.eMenage}
          </a>
        </div>
      </div>

      {#if data.entretiens.length === 0}
        <p class="ui-carte border-dashed text-encre-douce">
          {t.eAucune}
        </p>
      {:else}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div role="region" tabindex="0" aria-label="Tableau défilant"  class="overflow-x-auto rounded-carte border border-bordure bg-surface">
          <table class="ui-tableau min-w-[760px]">
            <thead>
              <tr>
                <th>{t.eColDate}</th>
                <th>{t.eColType}</th>
                <th>{t.eColIntervention}</th>
                <th>{t.eColPrestataire}</th>
                <th>{t.eColCout}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.entretiens as entretien (entretien.id)}
                <tr>
                  <td>{entretien.date}</td>
                  <td>{entretien.typeLabel}</td>
                  <td>
                    <p class="font-medium">{entretien.titre}</p>
                    <p class="text-xs text-encre-faine">{entretien.description}</p>
                  </td>
                  <td>{entretien.prestataire}</td>
                  <td>{entretien.cout}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  {/if}
</main>
