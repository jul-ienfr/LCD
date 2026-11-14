<script lang="ts">
  import type { PageData } from "./$types";
  import { LIBELLES_CANAL_FIL } from "@/domain/fil-voyageur";
  import { messageFils } from "@/lib/i18n-fils";

  let { data }: { data: PageData } = $props();

  const t = $derived(data.t);

  function dateCourte(valeur: Date | string | null): string {
    if (!valeur) return "—";
    const date = valeur instanceof Date ? valeur : new Date(valeur);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
      <p class="max-w-3xl text-encre-douce">{t.description}</p>
    </div>
    <nav class="flex gap-3 text-sm">
      <a class="ui-lien-action" href="/hote/automatisations">{t.automatisations}</a>
      <a class="ui-lien-action" href="/hote">{t.titrePage}</a>
    </nav>
  </header>

  {#if data.ok}<p class="ui-alerte ui-alerte--succes" role="status">{messageFils(t, data.ok)}</p>{/if}
  {#if data.erreur}<p class="ui-alerte ui-alerte--danger" role="alert">{data.erreur}</p>{/if}

  <form class="ui-carte grid gap-3 sm:grid-cols-4" method="GET">
    <label class="ui-champ-groupe">
      <span class="ui-label">{t.colonneStatut}</span>
      <select class="ui-champ" name="statut">
        <option value="">{t.filtreTous}</option>
        <option value="ouvert" selected={data.filtres.statut === "ouvert"}>{t.statuts.ouvert}</option>
        <option value="en_attente" selected={data.filtres.statut === "en_attente"}>{t.statuts.en_attente}</option>
        <option value="clos" selected={data.filtres.statut === "clos"}>{t.statuts.clos}</option>
      </select>
    </label>
    <label class="ui-champ-groupe">
      <span class="ui-label">{t.recherche}</span>
      <input class="ui-champ" type="search" name="recherche" value={data.filtres.recherche} placeholder={t.recherchePlaceholder} />
    </label>
    <label class="ui-champ-groupe">
      <span class="ui-label">{t.colonneVoyageur}</span>
      <select class="ui-champ" name="logement">
        <option value="">{t.filtreTous}</option>
        {#each data.logements as logement (logement.id)}
          <option value={logement.id} selected={data.filtres.logement === logement.id}>{logement.nom}</option>
        {/each}
      </select>
    </label>
    <div class="flex items-end gap-2">
      <label class="ui-champ-groupe flex-1">
        <span class="ui-label">{t.assigneA}</span>
        <select class="ui-champ" name="assigne">
          <option value="">{t.filtreTous}</option>
          <option value="aucun" selected={data.filtres.assigne === "aucun"}>{t.nonAssigne}</option>
        </select>
      </label>
      <button class="ui-bouton" type="submit">{t.filtrer}</button>
    </div>
  </form>

  {#if data.lignes.length === 0}
    <p class="ui-carte border-dashed text-encre-douce">{t.vide}</p>
  {:else}
    <ul class="space-y-3">
      {#each data.lignes as ligne (ligne.id)}
        <li class="ui-carte space-y-3">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="space-y-1">
              <p class="text-lg font-semibold">
                {ligne.voyageurNom}
                {#if ligne.nonLus > 0}<span class="ui-etiquette border-accent bg-accent-douce text-accent">{ligne.nonLus} {t.nonLus}</span>{/if}
                {#if ligne.brouillons > 0}<span class="ui-etiquette-ui">{ligne.brouillons} {t.brouillon}</span>{/if}
              </p>
              <p class="text-sm text-encre-faine">
                {ligne.voyageurEmail ?? "—"} · {ligne.voyageurTelephone ?? "—"}
                {#if ligne.logement}· {ligne.logement}{/if}
              </p>
              <p class="text-sm text-encre-douce">
                {t.colonneDernier} : {ligne.dernierCanal ? LIBELLES_CANAL_FIL[ligne.dernierCanal] : "—"}
                — {dateCourte(ligne.dernierDate)}
              </p>
              {#if ligne.dernierContenu}
                <p class="max-w-2xl text-sm text-encre-douce">{ligne.dernierContenu.slice(0, 140)}</p>
              {/if}
            </div>
            <div class="flex flex-col items-end gap-2">
              <span class="ui-etiquette-ui">{t.statuts[ligne.statut] ?? ligne.statut}</span>
              <a class="ui-bouton" href={`/hote/messages/fils/${ligne.id}`}>{t.vueFil}</a>
            </div>
          </div>

          <div class="flex flex-wrap items-end gap-3 border-t border-bordure pt-3">
            <form method="POST" action="?/assigner" class="flex items-end gap-2">
              <input type="hidden" name="filId" value={ligne.id} />
              <label class="ui-champ-groupe">
                <span class="ui-label">{t.assigneA}</span>
                <input class="ui-champ" type="email" name="assigneA" placeholder={ligne.assigneA ?? t.nonAssigne} />
              </label>
              <button class="ui-bouton ui-bouton--fantome" type="submit">{t.assigner}</button>
            </form>
            <form method="POST" action="?/statut" class="flex items-end gap-2">
              <input type="hidden" name="filId" value={ligne.id} />
              <label class="ui-champ-groupe">
                <span class="ui-label">{t.colonneStatut}</span>
                <select class="ui-champ" name="statut">
                  <option value="ouvert" selected={ligne.statut === "ouvert"}>{t.statuts.ouvert}</option>
                  <option value="en_attente" selected={ligne.statut === "en_attente"}>{t.statuts.en_attente}</option>
                  <option value="clos" selected={ligne.statut === "clos"}>{t.statuts.clos}</option>
                </select>
              </label>
              <button class="ui-bouton ui-bouton--fantome" type="submit">{t.colonneStatut}</button>
            </form>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</main>
