<script lang="ts">
  import NavSuperAdmin from "@/lib/components/nav-super-admin.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const classes: Record<string, string> = {
    configure: "ui-badge ui-badge--ok",
    absent: "ui-badge",
    defaut_local: "ui-badge ui-badge--alerte",
    alerte: "ui-badge ui-badge--danger",
  };
</script>

<svelte:head>
  <title>Secrets et connecteurs — Supervision</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
  <NavSuperAdmin actif="/secrets" />

  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Plateforme
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">Secrets et connecteurs</h1>
    <p class="text-encre-douce">
      État de configuration uniquement : aucune valeur de secret n’est lue par la
      page ni rendue au navigateur.
    </p>
  </header>

  <div class="flex flex-wrap gap-2 text-xs">
    {#each data.compte as entree (entree.etat)}
      <span class={classes[entree.etat]}>
        {entree.libelle} : {entree.nombre}
      </span>
    {/each}
  </div>

  {#if data.alerteProduction}
    <p class="ui-alerte ui-alerte--danger">
      {data.nombreAlertes} alerte(s) en production : corriger les variables
      d’environnement avant d’ouvrir l’accès public.
    </p>
  {/if}

  <div class="overflow-x-auto rounded-2xl border border-bordure bg-surface">
    <table class="ui-tableau min-w-[680px]">
      <thead>
        <tr>
          <th>Variable</th>
          <th>État</th>
          <th>Constat</th>
        </tr>
      </thead>
      <tbody>
        {#each data.items as item (item.cle)}
          <tr>
            <td class="font-mono text-xs">{item.cle}</td>
            <td><span class={classes[item.etat]}>{item.libelle}</span></td>
            <td class="text-encre-douce">{item.note}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <section class="ui-carte text-sm text-encre-douce">
    <h2 class="text-lg font-semibold text-encre">Rotation</h2>
    <p class="mt-2">
      Les secrets se modifient dans l’environnement d’hébergement, jamais dans
      l’interface. Après rotation : redémarrer l’application, vérifier
      <code>/api/ready</code> puis se reconnecter. Les sessions Better Auth peuvent
      être révoquées depuis <a class="ui-lien" href="/hote/securite">Sécurité</a>.
    </p>
    <p class="mt-2">
      <code>MIGRATION_DATABASE_URL</code> donne un accès owner : le restreindre au
      runtime de supervision et aux migrations, jamais au navigateur.
    </p>
  </section>
</main>
