<script lang="ts">
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import Alerte from "@/lib/components/ui/alerte.svelte";
  import { traductionsStocks } from "@/lib/i18n-stocks";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const t = $derived(traductionsStocks(data.langue));

  const classes: Record<string, string> = {
    rupture: "ui-badge ui-badge--danger",
    bas: "ui-badge ui-badge--alerte",
    ok: "ui-badge ui-badge--accent",
  };
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

  {#if !data.logement}
    <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
      {t.videTexte}
    </p>
    <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">{t.creerLogement}</a>
  {:else}
    {#if data.logements.length > 1}
      <nav class="flex flex-wrap gap-2" aria-label={t.choisirLogement}>
        {#each data.logements as logement (logement.id)}
          <a
            class="rounded-full border px-4 py-2 text-sm {logement.id === data.logement.id ? 'border-accent bg-accent-douce font-semibold text-accent' : 'border-bordure bg-surface'}"
            href={`/hote/stocks?logement=${logement.id}`}
          >
            {logement.nom}
          </a>
        {/each}
      </nav>
    {/if}

    {#if data.ok}
      <Alerte ton="ok">
        {data.ok === "consommer"
          ? t.okConsommer
          : data.ok === "reassort"
            ? t.okReassort
            : t.okEnregistre}
      </Alerte>
    {/if}
    {#if data.erreur}
      <Alerte ton="danger">{data.erreur === "inattendu" ? t.erreurInattendue : data.erreur}</Alerte>
    {/if}

    <section class="grid gap-4 sm:grid-cols-3">
      <div class="ui-carte">
        <p class="text-sm text-encre-faine">{t.kpiReferences}</p>
        <p class="mt-1 text-3xl font-semibold">{data.items.length}</p>
      </div>
      <div class="ui-carte">
        <p class="text-sm text-encre-faine">{t.kpiRuptures}</p>
        <p class="mt-1 text-3xl font-semibold text-danger">{data.ruptures.length}</p>
      </div>
      <div class="ui-carte">
        <p class="text-sm text-encre-faine">{t.kpiArticles}</p>
        <p class="mt-1 text-3xl font-semibold">{data.totalArticles}</p>
      </div>
    </section>

    <section class="ui-carte flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">{t.rotationTitre}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.rotationAide}</p>
      </div>
      <form method="POST" action="?/consommer">
        <input name="logementId" type="hidden" value={data.logement.id} />
        <input name="ref" type="hidden" value={data.refRotation} />
        <button class="ui-bouton ui-bouton--primaire" type="submit">{t.consommerRotation}</button>
      </form>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">{t.consommablesDe(data.logement.nom)}</h2>
      {#if data.items.length === 0}
        <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
          {t.aucunConsommable}
        </p>
      {:else}
        <div class="overflow-x-auto rounded-2xl border border-bordure bg-surface">
          <table class="ui-tableau min-w-[760px]">
            <thead>
              <tr>
                <th>{t.colConsommable}</th>
                <th>{t.colStock}</th>
                <th>{t.colSeuil}</th>
                <th>{t.colCible}</th>
                <th>{t.colConso}</th>
                <th>{t.colStatut}</th>
                <th>{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.items as item (item.id)}
                <tr>
                  <td>
                    <p class="font-medium">{item.label}</p>
                    <p class="font-mono text-xs text-encre-faine">{item.code}</p>
                  </td>
                  <td>{item.stock} {item.unite}</td>
                  <td>{item.seuil}</td>
                  <td>{item.cible}</td>
                  <td>{item.consoRotation}</td>
                  <td><span class={classes[item.statut]}>{t.statuts[item.statut] ?? item.statut}</span></td>
                  <td>
                    <div class="flex flex-wrap gap-2">
                      <form method="POST" action="?/consommer">
                        <input name="logementId" type="hidden" value={data.logement.id} />
                        <input name="code" type="hidden" value={item.code} />
                        <input name="ref" type="hidden" value={item.refConsommer} />
                        <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">{t.consommer}</button>
                      </form>
                      <form method="POST" action="?/reassort">
                        <input name="logementId" type="hidden" value={data.logement.id} />
                        <input name="code" type="hidden" value={item.code} />
                        <input name="ref" type="hidden" value={item.refReassort} />
                        <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">{t.reassort}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <section class="grid gap-6 lg:grid-cols-2">
      <div class="ui-carte">
        <h2 class="text-lg font-semibold">{t.coursesTitre}</h2>
        {#if data.ruptures.length === 0 && data.bas.length === 0}
          <p class="mt-3 text-sm text-encre-douce">{t.aucunAchat}</p>
        {:else}
          <div class="mt-4 space-y-4">
            {#if data.ruptures.length > 0}
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-danger">{t.ruptures}</p>
                <ul class="mt-2 space-y-1 text-sm">
                  {#each data.ruptures as ligne (ligne.id)}
                    <li>{ligne.quantite} × {ligne.label} <span class="text-encre-faine">({ligne.unite})</span></li>
                  {/each}
                </ul>
              </div>
            {/if}
            {#if data.bas.length > 0}
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-alerte">{t.stocksBas}</p>
                <ul class="mt-2 space-y-1 text-sm">
                  {#each data.bas as ligne (ligne.id)}
                    <li>{ligne.quantite} × {ligne.label} <span class="text-encre-faine">({ligne.unite})</span></li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="ui-carte">
        <h2 class="text-lg font-semibold">{t.ajouterTitre}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.ajouterAide}</p>
        <form class="mt-4 space-y-3" method="POST" action="?/enregistrer">
          <input name="logementId" type="hidden" value={data.logement.id} />
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="space-y-2">
              <span class="ui-label">{t.code}</span>
              <input class="ui-champ font-mono text-sm" name="code" placeholder="papier-wc" required />
            </label>
            <label class="space-y-2">
              <span class="ui-label">{t.libelle}</span>
              <input class="ui-champ" name="label" placeholder="Papier toilette" required />
            </label>
            <label class="space-y-2">
              <span class="ui-label">{t.stockActuel}</span>
              <input class="ui-champ" min="0" name="stock" type="number" value="0" required />
            </label>
            <label class="space-y-2">
              <span class="ui-label">{t.unite}</span>
              <input class="ui-champ" name="unite" value="unité" />
            </label>
            <label class="space-y-2">
              <span class="ui-label">{t.seuilAlerte}</span>
              <input class="ui-champ" min="0" name="seuil" type="number" value="1" required />
            </label>
            <label class="space-y-2">
              <span class="ui-label">{t.cibleReassort}</span>
              <input class="ui-champ" min="0" name="cible" type="number" value="6" required />
            </label>
            <label class="space-y-2 sm:col-span-2">
              <span class="ui-label">{t.consoRotation}</span>
              <input class="ui-champ" min="0" name="consoRotation" type="number" value="1" required />
            </label>
          </div>
          <button class="ui-bouton ui-bouton--primaire" type="submit">{t.enregistrer}</button>
        </form>
      </div>
    </section>
  {/if}
</main>
