<script lang="ts">
  import type { PageData } from "./$types";
  import {
    SEUIL_DB_JOUR,
    SEUIL_DB_NUIT,
    TYPES_PREUVE,
  } from "@/domain/preuve-tranquillite";
  import { traductionsTranquillite } from "@/lib/i18n-tranquillite";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsTranquillite(data.langue));

  const classesType: Record<string, string> = {
    db: "ui-badge ui-badge--accent",
    attestation: "ui-badge ui-badge--ok",
    intervention: "ui-badge ui-badge--alerte",
  };
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {t.surtitre}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
      <p class="text-encre-douce">{t.description}</p>
    </div>
    <a class="text-sm underline" href="/hote">{t.retour}</a>
  </header>

  {#if data.vide}
    <section class="ui-carte space-y-3">
      <p class="text-encre-douce">{t.videTexte}</p>
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
            href={`/hote/tranquillite?logement=${choix.id}`}
          >
            {choix.nom}
          </a>
        {/each}
      </nav>
    {/if}

    {#if data.ok}
      <p class="ui-alerte ui-alerte--ok" role="status">
        {data.ok === "supprime" ? t.okSupprime : t.okEnregistre}
      </p>
    {/if}
    {#if data.erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">
        {data.erreur === "inattendu" ? t.erreurInattendue : data.erreur}
      </p>
    {/if}

    <section class="grid gap-4 sm:grid-cols-4">
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.evenements}
        </p>
        <p class="text-3xl font-extrabold">{data.resume.total}</p>
      </article>
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.mesures}
        </p>
        <p class="text-3xl font-extrabold">{data.resume.mesures}</p>
      </article>
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.depassements}
        </p>
        <p class="text-3xl font-extrabold">{data.resume.depassements}</p>
      </article>
      <article class="ui-carte ui-kpi">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {t.maxReleve}
        </p>
        <p class="text-3xl font-extrabold">
          {data.resume.maxDb === null ? "—" : `${data.resume.maxDb} dB`}
        </p>
      </article>
    </section>

    <section class="ui-carte space-y-4">
      <h2 class="text-lg font-semibold">{t.ajouter}</h2>
      <form method="POST" action="?/enregistrer" class="space-y-3">
        <input type="hidden" name="logementId" value={logement.id} />
        <input type="hidden" name="ref" value={data.ref} />
        <div class="grid gap-3 sm:grid-cols-4">
          <label class="ui-label space-y-1">
            <span>{t.type}</span>
            <select class="ui-champ" name="type">
              {#each TYPES_PREUVE as type (type)}
                <option value={type}>{t.types[type] ?? type}</option>
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
            <span>{t.moment}</span>
            <select class="ui-champ" name="moment">
              <option value="jour">{t.jour}</option>
              <option value="nuit">{t.nuit}</option>
            </select>
          </label>
          <label class="ui-label space-y-1">
            <span>{t.mesure}</span>
            <input
              class="ui-champ"
              max="120"
              min="1"
              name="valeurDb"
              placeholder="62"
              type="number"
            />
          </label>
        </div>
        <label class="ui-label space-y-1">
          <span>{t.note}</span>
          <textarea
            class="ui-champ"
            name="note"
            placeholder={t.notePlaceholder}
            rows="3"
            maxlength="1000"
          ></textarea>
        </label>
        <p class="text-xs text-encre-douce">
          {t.seuils(SEUIL_DB_JOUR, SEUIL_DB_NUIT)}
        </p>
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.enregistrer}
        </button>
      </form>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">
        {t.carnetDe(logement.nom, data.recentes)}
      </h2>
      {#if data.preuves.length === 0}
        <p
          class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce"
        >
          {t.aucunePreuve}
        </p>
      {:else}
        <div class="overflow-x-auto rounded-2xl border border-bordure bg-surface">
          <table class="ui-tableau w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr>
                <th>{t.date}</th>
                <th>{t.type}</th>
                <th>{t.mesureCol}</th>
                <th>{t.note}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {#each data.preuves as preuve (preuve.id)}
                <tr>
                  <td>{preuve.date}</td>
                  <td>
                    <span class={classesType[preuve.type] ?? "ui-badge"}>
                      {t.types[preuve.type] ?? preuve.type}
                    </span>
                  </td>
                  <td>
                    {#if preuve.type === "db"}
                      <span class={preuve.depassement ? "font-semibold text-danger" : ""}>
                        {preuve.valeurDb} dB ({t.moments[preuve.moment ?? "jour"] ?? preuve.moment} · {t.seuil}
                        {preuve.seuil} dB)
                        {preuve.depassement ? ` — ${t.depassement}` : ""}
                      </span>
                    {:else}
                      —
                    {/if}
                  </td>
                  <td>
                    {#if preuve.note}
                      <p class="max-w-md whitespace-pre-line text-encre-douce">
                        {preuve.note}
                      </p>
                    {:else}
                      —
                    {/if}
                  </td>
                  <td>
                    <form method="POST" action="?/supprimer">
                      <input
                        type="hidden"
                        name="logementId"
                        value={logement.id}
                      />
                      <input type="hidden" name="id" value={preuve.id} />
                      <button
                        class="ui-bouton ui-bouton--fantome ui-bouton--petit text-danger"
                        type="submit"
                      >
                        {t.supprimer}
                      </button>
                    </form>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <details class="ui-carte">
      <summary class="cursor-pointer text-lg font-semibold">
        {t.lettreTitre}
      </summary>
      <p class="mt-3 text-sm text-encre-douce">{t.lettreAide}</p>
      <label class="ui-label mt-3 space-y-1">
        <span>{t.brouillon}</span>
        <textarea
          class="ui-champ h-80 font-mono text-xs"
          readonly
          value={data.lettre}
        ></textarea>
      </label>
    </details>

    <nav class="flex flex-wrap gap-4 text-sm">
      <a class="underline" href="/hote/audit">{t.journal}</a>
      <a class="underline" href="/hote">{t.tableau}</a>
    </nav>
  {/if}
</main>
