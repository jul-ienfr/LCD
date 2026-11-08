<script lang="ts">
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import { traductionsCompta } from "@/lib/i18n-compta";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsCompta(data.langue));
</script>

<svelte:head>
  <title>{t.rappTitrePage}</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
  <PageEntete
    surtitre={t.rappSurtitre}
    titre={t.rappTitre}
    description={t.rappDescription}
  />

  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger">{data.erreur}</p>
  {/if}

  <section class="ui-carte">
    <h2 class="text-lg font-semibold">{t.importerTitre}</h2>
    <form class="mt-3 flex flex-wrap items-end gap-3" enctype="multipart/form-data" method="POST" action="?/importer">
      <label class="space-y-2 text-sm">
        <span class="ui-label">{t.fichier}</span>
        <input accept=".csv,text/csv,text/plain" class="block rounded-lg border border-bordure p-2 text-sm" name="fichier" required type="file" />
      </label>
      <button class="ui-bouton ui-bouton--primaire" type="submit">{t.importer}</button>
    </form>
    <p class="mt-3 text-xs text-encre-faine">
      {t.colonnes}
    </p>
  </section>

  {#if data.selectionne}
    <section class="ui-carte space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">{t.importRef(data.selectionne.ref)}</h2>
          <p class="text-sm text-encre-douce">
            {data.selectionne.nomFichier} · {data.selectionne.periodeDebut} → {data.selectionne.periodeFin}
            · {data.selectionne.createdAt.toISOString().slice(0, 10)}
          </p>
        </div>
        <span class={data.selectionne.alerte ? "ui-badge ui-badge--danger" : "ui-badge ui-badge--accent"}>
          {data.selectionne.alerte ? t.alerteRapp : t.rapproche}
        </span>
      </div>

      <dl class="grid gap-3 text-sm sm:grid-cols-4">
        <div><dt class="text-encre-faine">{t.credits}</dt><dd class="font-semibold tabular-nums">{data.selectionne.credits}</dd></div>
        <div><dt class="text-encre-faine">{t.debits}</dt><dd class="tabular-nums">{data.selectionne.debits}</dd></div>
        <div><dt class="text-encre-faine">{t.attendus}</dt><dd class="tabular-nums">{data.selectionne.attendus}</dd></div>
        <div>
          <dt class="text-encre-faine">{t.ecart}</dt>
          <dd class={data.selectionne.ecartAlerte ? "font-semibold tabular-nums text-danger" : "tabular-nums"}>{data.selectionne.ecart}</dd>
        </div>
      </dl>

      {#if data.selectionne.alerte}
        <p class="ui-alerte ui-alerte--alerte">
          {data.selectionne.ecartAlerte ? t.ecartAlerte(data.selectionne.ecart) : ""}
          {data.anciennes > 0 ? t.orphelines(data.anciennes) : ""}
          {t.verifier}
        </p>
      {/if}

      <div class="overflow-x-auto">
        <table class="ui-tableau min-w-[720px]">
          <thead>
            <tr>
              <th>{t.rappColDate}</th>
              <th>{t.rappColLibelle}</th>
              <th class="text-right">{t.rappColMontant}</th>
              <th>{t.rappColStatut}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.lignes as ligne (ligne.id)}
              <tr>
                <td class="tabular-nums">{ligne.date}</td>
                <td>{ligne.libelle}</td>
                <td class="text-right tabular-nums {ligne.negatif ? 'text-encre-douce' : ''}">{ligne.montant}</td>
                <td>{ligne.statut}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if data.nonRapproches.length > 0}
        <div>
          <h3 class="font-semibold">{t.nonRetrouves(data.nonRapproches.length)}</h3>
          <ul class="mt-2 space-y-1 text-sm" role="list">
            {#each data.nonRapproches as paiement (paiement.id)}
              <li>{paiement.date} · {paiement.montant} · {paiement.mode}{paiement.reference ? ` · ${paiement.reference}` : ""}</li>
            {/each}
          </ul>
        </div>
      {/if}
    </section>
  {:else}
    <p class="rounded-2xl border border-bordure bg-surface p-6 text-sm text-encre-douce">
      {t.aucunReleve}
    </p>
  {/if}

  {#if data.recents.length > 1}
    <section class="ui-carte">
      <h2 class="text-lg font-semibold">{t.recents}</h2>
      <ul class="mt-3 space-y-2 text-sm" role="list">
        {#each data.recents as entree (entree.id)}
          <li>
            <a class="ui-lien" href={`/hote/compta/rapprochement?import=${entree.id}`}>{entree.ref}</a>
            · {entree.fichier} · {t.ecartOrphelines(entree.ecart, entree.orphelines)}
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</main>
