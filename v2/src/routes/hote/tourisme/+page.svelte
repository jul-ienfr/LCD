<script lang="ts">
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import { traductionsTourisme } from "@/lib/i18n-tourisme";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsTourisme(data.langue));
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <PageEntete
    surtitre={t.surtitre}
    titre={t.titre}
    description={t.description}
  />

  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok">
      {data.ok === "desactive" ? t.okDesactive : t.okEnregistre}
    </p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger">
      {data.erreur === "inattendu" ? t.erreurInattendue : data.erreur}
    </p>
  {/if}

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.lieux(data.lieux.length)}</h2>
    {#if data.lieux.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucunLieu}
      </p>
    {:else}
      <div class="overflow-x-auto rounded-2xl border border-bordure bg-surface">
        <table class="ui-tableau min-w-[860px]">
          <thead>
            <tr>
              <th>{t.lieu}</th>
              <th>{t.categorie}</th>
              <th>{t.commune}</th>
              <th>{t.acces}</th>
              <th>{t.prix}</th>
              <th>{t.extra}</th>
              <th>{t.statut}</th>
              <th>{t.action}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.lieux as lieu (lieu.id)}
              <tr>
                <td>
                  <p class="font-medium">{lieu.nom}</p>
                  <p class="font-mono text-xs text-encre-faine">{lieu.slug}</p>
                  {#if lieu.lien}
                    <a class="text-xs underline" href={lieu.lien} rel="noreferrer noopener" target="_blank">{t.site}</a>
                  {/if}
                </td>
                <td>{t.categories[lieu.categorie] ?? lieu.categorie}</td>
                <td>{lieu.commune ?? "—"}</td>
                <td>{lieu.acces ?? "—"}</td>
                <td>{lieu.prix ?? "—"}</td>
                <td>{lieu.extraId ?? "—"}</td>
                <td>
                  <span class={lieu.actif ? "ui-badge ui-badge--accent" : "ui-badge"}>
                    {lieu.actif ? t.actif : t.inactif}
                  </span>
                </td>
                <td>
                  {#if lieu.actif}
                    <form method="POST" action="?/desactiver">
                      <input name="slug" type="hidden" value={lieu.slug} />
                      <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">{t.desactiver}</button>
                    </form>
                  {:else}
                    <span class="text-xs text-encre-faine">{t.reactiverHint}</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <section class="ui-carte">
    <h2 class="text-lg font-semibold">{t.ajouter}</h2>
    <p class="mt-1 text-sm text-encre-douce">{t.aideAjout}</p>
    <form class="mt-4 space-y-3" method="POST" action="?/enregistrer">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label class="space-y-2">
          <span class="ui-label">{t.identifiant}</span>
          <input class="ui-champ font-mono text-sm" name="slug" placeholder="promenade-littoral" required />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.nom}</span>
          <input class="ui-champ" name="nom" required />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.categorie}</span>
          <select class="ui-champ" name="categorie">
            {#each data.categories as categorie (categorie.id)}
              <option value={categorie.id}>{t.categories[categorie.id] ?? categorie.id}</option>
            {/each}
          </select>
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.commune}</span>
          <input class="ui-champ" name="commune" />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.acces}</span>
          <input class="ui-champ" name="acces" placeholder="10 min à pied" />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.prixIndicatif}</span>
          <input class="ui-champ" name="prixIndicatif" placeholder="gratuit" />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.lien}</span>
          <input class="ui-champ" name="lien" type="url" />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.mode}</span>
          <input class="ui-champ" name="mode" placeholder="affiliation_10_15" />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.extraLie}</span>
          <input class="ui-champ" name="extraId" />
        </label>
        <label class="space-y-2 lg:col-span-2">
          <span class="ui-label">{t.logement}</span>
          <select class="ui-champ" name="logementId">
            <option value="">{t.tousLogements}</option>
            {#each data.logements as logement (logement.id)}
              <option value={logement.id}>{logement.nom}</option>
            {/each}
          </select>
        </label>
      </div>
      <button class="ui-bouton ui-bouton--primaire" type="submit">{t.enregistrer}</button>
    </form>
  </section>
</main>
