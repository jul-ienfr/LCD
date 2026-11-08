<script lang="ts">
  import NavSuperAdmin from "@/lib/components/nav-super-admin.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const base = $derived(
    data.etat
      ? [
          ["Version PostgreSQL", data.etat.versionBase],
          ["Connexion owner", data.etat.utilisateur],
          ["Superutilisateur PostgreSQL", data.etat.superutilisateur ? "oui" : "non"],
          ["Taille", data.etat.tailleBase],
          ["Tables publiques", `${data.etat.tables}`],
          ["Tables avec RLS", `${data.etat.tablesRls} / ${data.etat.tables}`],
          ["Espaces", `${data.etat.tenants}`],
        ]
      : [],
  );

  const runtime = $derived([
    ["Version applicative", data.runtime.version],
    ["Environnement", data.runtime.environnement],
    ["URL publique", data.runtime.url],
    ["Node.js", data.runtime.node],
    ["Plateforme", data.runtime.plateforme],
    ["Uptime", data.runtime.uptime],
    ["2FA obligatoire", data.runtime.deuxFacteurs],
  ]);
</script>

<svelte:head>
  <title>Système — Supervision</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
  <NavSuperAdmin actif="/systeme" />

  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Plateforme
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">Système</h1>
    <p class="text-encre-douce">
      Versions, base, migrations et isolation RLS — lecture seule via la
      connexion owner.
    </p>
  </header>

  {#if !data.etat}
    <p class="ui-alerte ui-alerte--alerte">
      <code>MIGRATION_DATABASE_URL</code> absent : diagnostic base indisponible. La
      page ne se rabat pas sur la connexion applicative.
    </p>
  {:else}
    <section class="ui-carte">
      <h2 class="text-lg font-semibold">Base de données</h2>
      <dl class="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {#each base as [libelle, valeur] (libelle)}
          <div>
            <dt class="text-encre-faine">{libelle}</dt>
            <dd class="font-medium">{valeur}</dd>
          </div>
        {/each}
      </dl>
      {#if data.etat.tablesRls < data.etat.tables}
        <p class="ui-alerte ui-alerte--alerte mt-4">
          {data.etat.tables - data.etat.tablesRls} table(s) publique(s) sans RLS :
          vérifier qu’elles sont globales (tenants, catalogue), pas métier.
        </p>
      {/if}
    </section>

    <section class="ui-carte">
      <h2 class="text-lg font-semibold">Migrations</h2>
      <p class="mt-2 text-sm text-encre-douce">
        {data.etat.migrations} appliquée(s) sur {data.attendues} attendues
        {data.etat.derniereMigration ? ` · dernière le ${data.etat.derniereMigration}` : ""}
        {data.derniereAttendue ? ` · journal : ${data.derniereAttendue}` : ""}.
      </p>
      <p class="mt-2 text-sm font-medium {data.etat.migrations === data.attendues ? 'text-accent' : 'text-danger'}">
        {data.etat.migrations === data.attendues
          ? "Schéma à jour."
          : "Écart entre le journal Drizzle et la base : appliquer les migrations avant de servir."}
      </p>
    </section>

    <section class="ui-carte">
      <h2 class="text-lg font-semibold">Runtime</h2>
      <dl class="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        {#each runtime as [libelle, valeur] (libelle)}
          <div>
            <dt class="text-encre-faine">{libelle}</dt>
            <dd class="font-medium">{valeur}</dd>
          </div>
        {/each}
      </dl>
    </section>
  {/if}
</main>
