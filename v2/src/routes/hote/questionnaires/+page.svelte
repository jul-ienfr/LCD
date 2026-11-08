<script lang="ts">
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import Kpi from "@/lib/components/ui/kpi.svelte";
  import { traductionsRelation } from "@/lib/i18n-relation";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsRelation(data.langue));
</script>

<svelte:head>
  <title>{t.qTitrePage}</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <PageEntete
    surtitre={t.qSurtitre}
    titre={t.qTitre}
    description={t.qDescription}
  />

  {#if !data.logement}
    <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
      {t.creerDAbord}
    </p>
    <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">{t.creerLogement}</a>
  {:else}
    {#if data.logements.length > 1}
      <nav class="flex flex-wrap gap-2" aria-label={t.choisirLogement}>
        {#each data.logements as logement (logement.id)}
          <a
            class="rounded-full border px-4 py-2 text-sm {logement.id === data.logement.id ? 'border-accent bg-accent-douce font-semibold text-accent' : 'border-bordure bg-surface'}"
            href={`/hote/questionnaires?logement=${logement.id}`}
          >
            {logement.nom}
          </a>
        {/each}
      </nav>
    {/if}

    <section class="grid gap-4 sm:grid-cols-3">
      <Kpi libelle={t.reponses} valeur={data.nombre} />
      <Kpi libelle={t.moyenneGlobale} valeur={data.globale} />
      <Kpi libelle={t.derniereReponse} valeur={data.derniere} />
    </section>

    <section class="ui-carte">
      <h2 class="text-lg font-semibold">{t.moyennesCritere}</h2>
      <dl class="mt-4 grid gap-3 sm:grid-cols-5">
        {#each data.criteres as critere (critere.id)}
          <div class="rounded-xl border border-bordure p-4 text-sm">
            <dt class="text-encre-faine">{critere.libelle}</dt>
            <dd class="mt-1 text-2xl font-semibold">{critere.moyenne}</dd>
          </div>
        {/each}
      </dl>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">{t.reponsesTitre}</h2>
      {#if data.reponses.length === 0}
        <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          {t.aucunQuestionnaire}
        </p>
      {:else}
        <div class="overflow-x-auto rounded-2xl border border-bordure bg-surface">
          <table class="ui-tableau min-w-[860px]">
            <thead>
              <tr>
                <th>{t.colDate}</th>
                {#each data.criteres as critere (critere.id)}
                  <th>{critere.libelle}</th>
                {/each}
                <th>{t.colMoyenne}</th>
                <th>{t.colCommentaire}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.reponses as reponse (reponse.id)}
                <tr>
                  <td>{reponse.date}</td>
                  {#each reponse.notes as note (note.id)}
                    <td>{note.valeur}</td>
                  {/each}
                  <td class="font-medium">{reponse.moyenne}</td>
                  <td>
                    {#if reponse.commentaire}
                      <p class="max-w-xs whitespace-pre-line text-encre-douce">{reponse.commentaire}</p>
                    {:else}
                      —
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  {/if}
</main>
