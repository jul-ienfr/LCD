<script lang="ts">
  import type { PageData } from "./$types";
  import {
    LIBELLES_TYPE_SINISTRE,
    statutSuivant,
    TYPES_SINISTRE,
  } from "@/domain/sinistre";
  import { formaterEuros } from "@/lib/format";
  import { traductionsExploitation } from "@/lib/i18n-exploitation";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsExploitation(data.langue));

  const classesStatut: Record<string, string> = {
    declare: "ui-badge ui-badge--alerte",
    expertise: "ui-badge ui-badge--accent",
    indemnise: "ui-badge ui-badge--ok",
    clos: "ui-badge",
  };

  function libelleEtape(statut: string): string {
    const suivant = statutSuivant(statut as never);
    if (suivant === "indemnise") return t.indemniser;
    if (suivant === "clos") return t.cloturer;
    return t.expertise;
  }
</script>

<svelte:head>
  <title>{t.sTitrePage}</title>
</svelte:head>

<main class="mx-auto max-w-7xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {t.sSurtitre}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.sTitre}</h1>
      <p class="text-encre-douce">{t.sDescription}</p>
    </div>
    <a class="text-sm underline" href="/hote">{t.tableauBord}</a>
  </header>

  {#if data.vide}
    <section class="ui-carte space-y-3">
      <p class="text-encre-douce">
        {t.sVide}
      </p>
      <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">
        {t.creerLogement}
      </a>
    </section>
  {:else if data.logement}
    {@const logement = data.logement}
    {#if data.logements.length > 1}
      <nav class="flex flex-wrap gap-2" aria-label={t.choisirLogement}>
        {#each data.logements as choix (choix.id)}
          <a
            class={choix.id === logement.id
              ? "ui-bouton ui-bouton--primaire ui-bouton--petit"
              : "ui-bouton ui-bouton--secondaire ui-bouton--petit"}
            href={`/hote/sinistres?logement=${choix.id}`}
          >
            {choix.nom}
          </a>
        {/each}
      </nav>
    {/if}

    {#if data.ok}
      <p class="ui-alerte ui-alerte--ok" role="status">
        {data.ok === "declare"
          ? t.sOkDeclare
          : t.sOkMaj}
      </p>
    {/if}
    {#if data.erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">
        {data.erreur === "inattendu"
          ? t.erreurInattendue
          : data.erreur}
      </p>
    {/if}

    <section class="grid gap-4 sm:grid-cols-4">
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.ouverts}
        </p>
        <p class="text-3xl font-extrabold">{data.resume.ouverts}</p>
      </article>
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.totalEstime}
        </p>
        <p class="text-2xl font-extrabold">
          {formaterEuros(data.resume.totalEstimeCentimes)}
        </p>
      </article>
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.dejaIndemnise}
        </p>
        <p class="text-2xl font-extrabold">
          {formaterEuros(data.resume.totalIndemniseCentimes)}
        </p>
      </article>
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.resteAttendu}
        </p>
        <p class="text-2xl font-extrabold">
          {formaterEuros(data.resume.resteAttenduCentimes)}
        </p>
      </article>
    </section>

    <section class="ui-carte space-y-4">
      <h2 class="text-lg font-semibold">{t.declarer}</h2>
      <form method="POST" action="?/declarer" class="space-y-3">
        <input type="hidden" name="logementId" value={logement.id} />
        <input type="hidden" name="ref" value={data.ref} />
        <div class="grid gap-3 sm:grid-cols-4">
          <label class="ui-label space-y-1">
            <span>{t.type}</span>
            <select class="ui-champ" name="type">
              {#each TYPES_SINISTRE as type (type)}
                <option value={type}>{t.sTypes[type] ?? LIBELLES_TYPE_SINISTRE[type]}</option>
              {/each}
            </select>
          </label>
          <label class="ui-label space-y-1">
            <span>{t.date}</span>
            <input
              class="ui-champ"
              name="date"
              required
              type="date"
              defaultValue={data.aujourdHui}
            />
          </label>
          <label class="ui-label space-y-1">
            <span>{t.montantEstime}</span>
            <input
              class="ui-champ"
              min="0"
              name="montantEstime"
              placeholder="1200"
              required
              step="0.01"
              type="number"
            />
          </label>
          <label class="ui-label space-y-1">
            <span>{t.franchise}</span>
            <input
              class="ui-champ"
              min="0"
              name="franchise"
              placeholder="150"
              step="0.01"
              type="number"
            />
          </label>
        </div>
        <label class="ui-label space-y-1">
          <span>{t.descriptionChamp}</span>
          <textarea
            class="ui-champ"
            name="description"
            placeholder={t.sDescPlaceholder}
            required
            rows="3"
            maxlength="2000"
          ></textarea>
        </label>
        <label class="ui-label space-y-1">
          <span>{t.numero}</span>
          <input
            class="ui-champ"
            name="numeroDeclaration"
            placeholder={t.numeroPlaceholder}
            maxlength="64"
          />
        </label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.declarerBtn}
        </button>
      </form>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">
        {t.dossiersDe(logement.nom, data.sinistres.length)}
      </h2>
      {#if data.sinistres.length === 0}
        <p
          class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce"
        >
          {t.sAucun}
        </p>
      {:else}
        <div class="ui-carte--plate overflow-x-auto rounded-2xl border border-bordure bg-surface">
          <table class="ui-tableau w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr>
                <th>{t.colDate}</th>
                <th>{t.colType}</th>
                <th>{t.colStatut}</th>
                <th>{t.colEstime}</th>
                <th>{t.colFranchise}</th>
                <th>{t.colAttendu}</th>
                <th>{t.colDescription}</th>
                <th>{t.colEtape}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.sinistres as sinistre (sinistre.id)}
                {@const suivant = statutSuivant(sinistre.statut)}
                <tr>
                  <td>{sinistre.date}</td>
                  <td>{t.sTypes[sinistre.type] ?? sinistre.libelleType}</td>
                  <td>
                    <span class={classesStatut[sinistre.statut] ?? "ui-badge"}>
                      {t.sStatuts[sinistre.statut] ?? sinistre.libelleStatut}
                    </span>
                  </td>
                  <td>{formaterEuros(sinistre.montantEstimeCentimes)}</td>
                  <td>{formaterEuros(sinistre.franchiseCentimes)}</td>
                  <td class="font-medium">
                    {formaterEuros(sinistre.montantAttenduCentimes)}
                  </td>
                  <td>
                    <p class="max-w-xs whitespace-pre-line text-encre-douce">
                      {sinistre.description}
                    </p>
                    {#if sinistre.numeroDeclaration}
                      <p class="mt-1 text-xs text-encre-faine">
                        {t.declarationNum(sinistre.numeroDeclaration)}
                      </p>
                    {/if}
                  </td>
                  <td>
                    {#if suivant}
                      <form
                        method="POST"
                        action="?/avancer"
                        class="space-y-2"
                      >
                        <input
                          type="hidden"
                          name="logementId"
                          value={logement.id}
                        />
                        <input type="hidden" name="id" value={sinistre.id} />
                        {#if suivant === "indemnise"}
                          <label class="ui-label space-y-1 text-xs">
                            <span>{t.indemniseMontant}</span>
                            <input
                              class="ui-champ w-28"
                              min="0"
                              name="montantIndemnise"
                              placeholder="900"
                              required
                              step="0.01"
                              type="number"
                            />
                          </label>
                        {/if}
                        <button
                          class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
                          type="submit"
                        >
                          {libelleEtape(sinistre.statut)}
                        </button>
                      </form>
                    {:else}
                      <span class="text-xs text-encre-faine">{t.dossierClos}</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <nav class="flex flex-wrap gap-4 text-sm">
      <a class="underline" href="/hote/audit">{t.audit}</a>
      <a class="underline" href="/hote/logements">{t.logements}</a>
      <a class="underline" href="/hote">{t.tableauBord}</a>
    </nav>
  {/if}
</main>
