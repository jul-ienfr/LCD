<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Nuki — Intégrations</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Espace hôte · Intégrations
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">Serrures Nuki</h1>
    <p class="text-encre-douce">
      Programmez un code à six chiffres pour chaque séjour et révoquez-le à
      l'annulation. Le token Nuki reste côté serveur.
    </p>
    <p class="text-sm">
      <a class="inline-flex min-h-11 items-center underline" href="/hote/integrations">← Toutes les intégrations</a>
    </p>
  </header>

  {#if data.ok === "activee"}
    <p class="ui-alerte ui-alerte--ok">Intégration Nuki activée.</p>
  {:else if data.ok === "desactivee"}
    <p class="ui-alerte ui-alerte--ok">Intégration Nuki désactivée.</p>
  {/if}
  {#if data.erreur === "inattendu"}
    <p class="ui-alerte ui-alerte--danger">
      Modification impossible pour le moment.
    </p>
  {/if}

  <section class="ui-carte space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold">État de la connexion</h2>
        <p class="mt-1 text-sm text-encre-douce">
          {#if data.configuree}
            Le token <code>NUKI_API_TOKEN</code> est présent : les codes sont
            programmés sur la serrure.
          {:else}
            Aucun token <code>NUKI_API_TOKEN</code> : les codes sont générés en
            mode manuel et affichés dans le guide voyageur.
          {/if}
        </p>
        {#if data.majLe}
          <p class="mt-1 text-xs text-encre-faine">
            Dernière modification : {data.majLe}
          </p>
        {/if}
      </div>
      <span
        class={data.active
          ? "ui-etiquette border-ok text-ok"
          : "ui-etiquette"}
      >
        {data.active ? "Activée" : "Désactivée"}
      </span>
    </div>

    <form method="POST" action="?/basculer">
      {#if data.active}
        <input name="actif" type="hidden" value="false" />
        <button class="ui-bouton ui-bouton--secondaire" type="submit">
          Désactiver l'intégration
        </button>
      {:else}
        <input name="actif" type="hidden" value="true" />
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          Activer l'intégration
        </button>
      {/if}
    </form>
  </section>

  <section class="ui-carte space-y-3">
    <h2 class="text-lg font-semibold">Mise en service</h2>
    <ol class="list-decimal space-y-2 pl-5 text-sm text-encre-douce">
      <li>
        Créez un token dans le portail Nuki Web, puis renseignez
        <code>NUKI_API_TOKEN</code> dans l'environnement du serveur.
      </li>
      <li>
        Redémarrez l'application : la page passe alors en « connectée ».
      </li>
      <li>
        Ouvrez la fiche d'un logement, puis « Codes d'accès » pour créer ou
        révoquer un code.
      </li>
    </ol>
    <p class="text-xs text-encre-faine">
      Un code est valable de l'arrivée au départ et reste limité à six chiffres.
      La révocation est idempotente.
    </p>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">Logements actifs</h2>
    {#if data.logements.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        Aucun logement actif. Créez-en un depuis l'espace hôte.
      </p>
    {:else}
      <ul class="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
        {#each data.logements as logement (logement.id)}
          <li class="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p class="font-medium">{logement.nom}</p>
              <p class="font-mono text-xs text-encre-faine">{logement.code}</p>
            </div>
            <a
              class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
              href={`/hote/logements/${logement.id}/serrure`}
            >
              Codes d'accès
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
