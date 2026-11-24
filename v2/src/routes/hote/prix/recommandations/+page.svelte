<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const messagesOk: Record<string, string> = {
    import: "Import terminé : les recommandations attendent votre décision.",
    applique: "Prix appliqué et tracé.",
    ignore: "Recommandation ignorée.",
  };
  const messagesErreur: Record<string, string> = {
    logement: "Choisissez un logement.",
    PRICING_INDISPONIBLE:
      "Partenaire de revenue management indisponible : aucun prix n'a été modifié.",
    RECOMMANDATION_INVALIDE: "Recommandation introuvable ou invalide.",
  };
  const texteOk = $derived(
    data.messageOk ? (messagesOk[data.messageOk] ?? null) : null,
  );
  const codeErreur = $derived(
    (form as { erreur?: string } | null)?.erreur ?? data.messageErreur,
  );
  const texteErreur = $derived(
    codeErreur ? (messagesErreur[codeErreur] ?? "Action refusée.") : null,
  );
</script>

<svelte:head>
  <title>Recommandations de prix — LCD</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <h1 class="text-3xl font-semibold tracking-tight">Recommandations de prix</h1>
    <p class="text-encre-douce">
      Chaque jour reçoit un prix recommandé, son écart avec le prix actuel et
      les facteurs qui l'expliquent. Rien ne s'applique sans votre validation.
    </p>
  </header>

  {#if texteOk}
    <p class="ui-carte border-dashed">
      {texteOk}
      {#if data.joursImportes} ({data.joursImportes} jour(s)){/if}
      {#if data.prixApplique} — nouveau prix : {data.prixApplique}{/if}
      {#if data.prixBorne} — ramené dans les bornes du logement{/if}
    </p>
  {/if}
  {#if texteErreur}
    <p class="ui-carte ui-texte-danger" role="alert">{texteErreur}</p>
  {/if}

  <section class="ui-carte space-y-3">
    <h2 class="text-lg font-semibold">Sources disponibles</h2>
    <ul class="flex flex-wrap gap-2 text-sm">
      {#each data.partenaires as partenaire (partenaire.nom)}
        <li class="ui-etiquette-ui">
          {partenaire.nom} — {partenaire.disponible ? "actif" : "indisponible"}
        </li>
      {/each}
    </ul>
    <p class="text-sm text-encre-douce">
      Bornes appliquées : {data.bornesAffichees.min} à {data.bornesAffichees.max} la
      nuit. Un prix hors bornes est ramené dans le cadre et signalé.
    </p>
  </section>

  <form method="POST" action="?/importer" class="ui-carte flex flex-wrap items-end gap-3">
    <label class="ui-champ-groupe">
      <span class="ui-label">Logement</span>
      <select class="ui-champ" name="logementId">
        {#each data.logements as logement (logement.id)}
          <option value={logement.id}>{logement.nom}</option>
        {/each}
      </select>
    </label>
    <label class="ui-champ-groupe">
      <span class="ui-label">Du</span>
      <input class="ui-champ" type="date" name="debut" value={data.debut} />
    </label>
    <label class="ui-champ-groupe">
      <span class="ui-label">Au</span>
      <input class="ui-champ" type="date" name="fin" value={data.fin} />
    </label>
    <button class="ui-bouton" type="submit">Importer les recommandations</button>
    <button
      class="ui-bouton ui-bouton--secondaire"
      type="submit"
      name="horizon"
      value="548"
    >
      Importer sur 18 mois
    </button>
  </form>

  <nav class="flex flex-wrap gap-2 text-sm">
    {#each data.statuts as statut (statut)}
      <a
        class="ui-lien-action"
        class:font-semibold={statut === data.statut}
        href={`/hote/prix/recommandations?statut=${statut}&debut=${data.debut}&fin=${data.fin}`}
      >
        {statut === "proposee" ? "À décider" : statut}
      </a>
    {/each}
    <span class="text-encre-douce">{data.total} jour(s)</span>
  </nav>

  {#if data.lignes.length === 0}
    <p class="ui-carte border-dashed text-encre-douce">
      Aucune recommandation sur cette période. Lancez un import pour en obtenir.
    </p>
  {:else}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div role="region" tabindex="0" aria-label="Tableau défilant"  class="overflow-x-auto">
      <table class="ui-tableau w-full min-w-[420px] text-sm">
      <thead>
        <tr>
          <th scope="col">Jour</th>
          <th scope="col">Logement</th>
          <th scope="col">Prix actuel</th>
          <th scope="col">Prix recommandé</th>
          <th scope="col">Écart</th>
          <th scope="col">Confiance</th>
          <th scope="col">Pourquoi ce prix</th>
          <th scope="col">Décision</th>
        </tr>
      </thead>
      <tbody>
        {#each data.lignes as ligne (ligne.id)}
          <tr>
            <td>{ligne.jour}</td>
            <td>{ligne.logementNom}</td>
            <td>{ligne.prixActuelAffiche}</td>
            <td class="font-semibold">{ligne.prixRecommande}</td>
            <td class:ui-texte-danger={ligne.ecart !== null && ligne.ecart > 0}>
              {ligne.ecart === null ? "—" : `${ligne.ecart > 0 ? "+" : ""}${ligne.ecart} %`}
            </td>
            <td>{ligne.confiance} / 100</td>
            <td class="text-encre-douce">{ligne.explication}</td>
            <td>
              {#if ligne.statut === "proposee"}
                <div class="space-y-2">
                  <form method="POST" action="?/appliquer">
                    <input type="hidden" name="recommandationId" value={ligne.id} />
                    <input type="hidden" name="debut" value={data.debut} />
                    <input type="hidden" name="fin" value={data.fin} />
                    <input type="hidden" name="minCentimes" value={data.bornes.minCentimes} />
                    <input type="hidden" name="maxCentimes" value={data.bornes.maxCentimes} />
                    <button class="ui-bouton" type="submit">Appliquer</button>
                  </form>
                  <form method="POST" action="?/ignorer">
                    <input type="hidden" name="recommandationId" value={ligne.id} />
                    <input type="hidden" name="debut" value={data.debut} />
                    <input type="hidden" name="fin" value={data.fin} />
                    <button class="ui-bouton ui-bouton--fantome" type="submit">Ignorer</button>
                  </form>
                </div>
              {:else}
                <span class="ui-etiquette-ui">{ligne.statut}</span>
              {/if}
            </td>
          </tr>
        {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <p class="text-sm">
    <a class="ui-lien-action" href="/hote/prix">← Prix et restrictions</a>
  </p>
</main>

{#if data.comparaisonRevPar && data.comparaisonRevPar.periode}
  <section class="mx-auto max-w-6xl space-y-3 px-6 pb-12">
    <h2 class="text-lg font-semibold">RevPAR avant / après décision</h2>
    <p class="text-sm text-encre-douce">
      Réalisé du {data.comparaisonRevPar.periode.avant} face à la projection du
      {data.comparaisonRevPar.periode.apres}, sur {data.comparaisonRevPar.decisionsAppliquees}
      décision(s) appliquée(s). Projection estimée à partir du prix appliqué : elle
      ne remplace pas une mesure sur 30 jours de réservations réelles.
    </p>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div role="region" tabindex="0" aria-label="Tableau défilant"  class="overflow-x-auto">
      <table class="ui-tableau w-full min-w-[420px] text-sm">
      <thead>
        <tr>
          <th scope="col">Logement</th>
          <th scope="col">RevPAR réalisé (30 j)</th>
          <th scope="col">RevPAR projeté (30 j)</th>
          <th scope="col">Écart</th>
        </tr>
      </thead>
      <tbody>
        {#each data.comparaisonRevPar.lignes as ligne (ligne.logementId)}
          <tr>
            <td>{ligne.logementNom}</td>
            <td>{ligne.revParAvant ?? "—"}</td>
            <td>{ligne.revParApres ?? "—"}</td>
            <td>
              {ligne.ecartPourcent === null
                ? "à mesurer"
                : `${ligne.ecartPourcent > 0 ? "+" : ""}${ligne.ecartPourcent} %`}
            </td>
          </tr>
        {/each}
      </tbody>
      </table>
    </div>
  </section>
{/if}
