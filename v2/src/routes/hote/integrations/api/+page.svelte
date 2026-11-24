<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import ConfirmationAction from "@/lib/components/ui/confirmation-action.svelte";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Clés API — LCD</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Espace hôte · Intégrations
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">Clés API</h1>
    <p class="text-encre-douce">
      Donnez à un outil partenaire un accès en lecture à votre compte. Une clé
      n'est affichée qu'une seule fois : copiez-la immédiatement.
    </p>
    <p class="text-sm">
      <a class="inline-flex min-h-11 items-center underline" href="/hote/integrations">← Webhooks et intégrations</a>
      ·
      <a class="inline-flex min-h-11 items-center underline" href="/developpeurs">Guide développeurs</a>
      ·
      <a class="inline-flex min-h-11 items-center underline" href="/api/v1/openapi">Document OpenAPI</a>
    </p>
  </header>

  {#if data.ok === "revoquee"}
    <p class="ui-alerte ui-alerte--ok">La clé a été révoquée.</p>
  {/if}
  {#if data.erreur === "inattendu"}
    <p class="ui-alerte ui-alerte--danger">
      Opération impossible pour le moment. Réessayez.
    </p>
  {/if}

  {#if form?.cleClair}
    <section class="ui-carte space-y-3 border-2 border-encre" data-cle-creee>
      <h2 class="text-lg font-semibold">Clé « {form.nom} » créée</h2>
      <p class="text-sm text-encre-douce">
        Copiez cette clé maintenant : elle ne sera plus jamais affichée.
      </p>
      <p class="break-all rounded-xl bg-surface-2 p-3 font-mono text-sm" data-cle-clair>
        {form.cleClair}
      </p>
      <p class="text-xs text-encre-faine">
        En-tête à envoyer : <code>Authorization: Bearer …</code>
      </p>
    </section>
  {/if}

  {#if form?.erreur}
    <p class="ui-alerte ui-alerte--danger">{form.erreur}</p>
  {/if}

  <section class="ui-carte space-y-4">
    <div>
      <h2 class="text-lg font-semibold">Créer une clé</h2>
      <p class="mt-1 text-sm text-encre-douce">
        Choisissez uniquement les scopes nécessaires à l'outil.
      </p>
    </div>

    <form class="space-y-4" method="POST" action="?/creer">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-2">
          <span class="ui-label">Nom de la clé</span>
          <input
            class="ui-champ"
            maxlength="80"
            minlength="2"
            name="nom"
            placeholder="Zapier — reporting"
            required
          />
        </label>
        <label class="space-y-2">
          <span class="ui-label">Expiration</span>
          <select class="ui-champ" name="expiration">
            <option value="">Sans expiration</option>
            <option value="30">30 jours</option>
            <option value="90">90 jours</option>
            <option value="365">1 an</option>
          </select>
        </label>
      </div>

      <fieldset class="space-y-2">
        <legend class="text-sm font-medium">Scopes en lecture</legend>
        <div class="grid gap-2 sm:grid-cols-2">
          {#each data.scopes as scope (scope.id)}
            <label class="flex min-h-11 min-w-11 items-center gap-2 rounded-xl border border-bordure p-3 text-sm">
              <input name="scopes" type="checkbox" value={scope.id} />
              <span>{scope.libelle}</span>
              <code class="ml-auto text-xs text-encre-faine">{scope.id}</code>
            </label>
          {/each}
        </div>
      </fieldset>

      <button class="ui-bouton ui-bouton--primaire" type="submit">
        Générer la clé
      </button>
    </form>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">Clés existantes ({data.cles.length})</h2>
    {#if data.cles.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        Aucune clé pour le moment.
      </p>
    {:else}
      <ul class="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
        {#each data.cles as cle (cle.id)}
          <li class="p-4" data-cle={cle.id}>
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0 space-y-1">
                <p class="font-medium">
                  {cle.nom}
                  <span class="ml-2 font-mono text-xs text-encre-faine">{cle.prefixe}…</span>
                </p>
                <p class="text-xs text-encre-faine">{cle.scopes.join(" · ")}</p>
                <p class="text-xs text-encre-faine">
                  Créée le {cle.creeLe}
                  {#if cle.dernierUsageLe}· dernier appel {cle.dernierUsageLe}{/if}
                  {#if cle.expireLe}· expire le {cle.expireLe}{/if}
                </p>
                {#if cle.revoqueLe}
                  <p class="text-xs font-medium text-danger">Révoquée le {cle.revoqueLe}</p>
                {:else if !cle.utilisable}
                  <p class="text-xs font-medium text-danger">Expirée</p>
                {:else}
                  <p class="text-xs font-medium text-ok">Active</p>
                {/if}
              </div>
              {#if cle.utilisable}
                <ConfirmationAction
                  langue={data.langue}
                  action="revoquer"
                  cible={cle.id}
                  libelle="Révoquer"
                  champs={{ cleId: cle.id }}
                />
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
