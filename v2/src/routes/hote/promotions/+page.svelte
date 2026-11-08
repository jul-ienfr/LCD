<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.t.pTitrePage}</title>
</svelte:head>

<div class="space-y-6">
  <header>
    <h1 class="text-2xl font-semibold">{data.t.pTitre}</h1>
    <p class="mt-1 text-sm text-encre-douce">{data.t.pDescription}</p>
  </header>

  {#if data.erreur}
    <p class="ui-alerte ui-alerte--erreur" role="alert">{data.erreur}</p>
  {:else if data.ok}
    <p class="ui-alerte" role="status">{data.t.pOk(data.ok)}</p>
  {/if}

  <section class="ui-carte space-y-4">
    <h2 class="text-lg font-semibold">{data.t.pNouvelle}</h2>
    <form class="grid gap-4 md:grid-cols-3" method="POST" action="?/creer">
      <label class="space-y-2">
        <span class="ui-label">{data.t.pCode}</span>
        <input class="ui-champ" name="code" placeholder="ETE-2027" required minlength="3" maxlength="32" />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{data.t.pType}</span>
        <select class="ui-champ" name="type">
          <option value="pourcentage">{data.t.pPourcentage}</option>
          <option value="montant">{data.t.pMontant}</option>
        </select>
      </label>
      <label class="space-y-2">
        <span class="ui-label">{data.t.pValeur}</span>
        <input class="ui-champ" inputmode="decimal" name="valeur" placeholder="15" required />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{data.t.pMinNuits}</span>
        <input class="ui-champ" inputmode="numeric" name="minNuits" type="number" min="1" max="60" step="1" />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{data.t.pMaxNuits}</span>
        <input class="ui-champ" inputmode="numeric" name="maxNuits" type="number" min="1" max="60" step="1" />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{data.t.pMinMontant}</span>
        <input class="ui-champ" inputmode="decimal" name="minMontantEuros" placeholder="500" />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{data.t.pDu}</span>
        <input class="ui-champ" name="debut" type="date" />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{data.t.pAu}</span>
        <input class="ui-champ" name="fin" type="date" />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{data.t.pLogement}</span>
        <select class="ui-champ" name="logementId">
          <option value="">{data.t.pTous}</option>
          {#each data.logements as logement (logement.id)}
            <option value={logement.id}>{logement.nom}</option>
          {/each}
        </select>
      </label>
      <label class="flex items-center gap-2">
        <input name="actif" type="checkbox" value="1" checked />
        <span class="ui-label">{data.t.pActive}</span>
      </label>
      <div class="md:col-span-3">
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {data.t.pCreer}
        </button>
      </div>
    </form>
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-lg font-semibold">
      {data.t.pListe(data.promotions.length)}
    </h2>
    {#if data.promotions.length === 0}
      <p class="text-sm text-encre-douce">{data.t.pAucune}</p>
    {:else}
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-encre-douce">
            <th class="py-2">{data.t.pColCode}</th>
            <th class="py-2">{data.t.pColRemise}</th>
            <th class="py-2">{data.t.pColConditions}</th>
            <th class="py-2">{data.t.pColValidite}</th>
            <th class="py-2">{data.t.pColStatut}</th>
          </tr>
        </thead>
        <tbody>
          {#each data.promotions as promotion (promotion.id)}
            <tr class="border-t border-bord">
              <td class="py-2 font-medium">{promotion.code}</td>
              <td class="py-2">{promotion.valeurAffichee}</td>
              <td class="py-2">
                {#if promotion.conditions.minNuits}
                  ≥ {data.t.pNuits(promotion.conditions.minNuits)}
                {/if}
                {#if promotion.conditions.maxNuits}
                  · ≤ {data.t.pNuits(promotion.conditions.maxNuits)}
                {/if}
                {#if promotion.conditions.minMontantCentimes}
                  · ≥ {promotion.conditions.minMontantCentimes / 100} €
                {/if}
                {#if promotion.conditions.logementId}
                  · {data.t.pCible}
                {/if}
              </td>
              <td class="py-2">
                {promotion.debut || "—"} → {promotion.fin || "—"}
              </td>
              <td class="py-2">
                <form method="POST" action="?/basculer">
                  <input name="id" type="hidden" value={promotion.id} />
                  <input name="actif" type="hidden" value={promotion.actif ? "0" : "1"} />
                  <button class="ui-bouton" type="submit">
                    {promotion.actif ? data.t.pDesactiver : data.t.pActiver}
                  </button>
                </form>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </section>
</div>
