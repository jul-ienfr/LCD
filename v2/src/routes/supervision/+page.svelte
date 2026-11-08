<script lang="ts">
  import NavSuperAdmin from "@/lib/components/nav-super-admin.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const totals = $derived(
    data.situation
      ? [
          ["Espaces", data.situation.totals.tenants],
          ["Logements", data.situation.totals.logements],
          ["Réservations", data.situation.totals.reservations],
          ["Comptes actifs", data.situation.totals.utilisateurs],
          ["Audits 24 h", data.situation.totals.audits24h],
        ]
      : [],
  );
</script>

<svelte:head>
  <title>Supervision — LCD Parc</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-10">
  <header class="space-y-4">
    <NavSuperAdmin actif="tenants" />
    <div class="ui-entete space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        Plateforme
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">Supervision</h1>
      <p class="text-encre-douce">
        Vue agrégée, lecture seule, de tous les espaces. Réservée aux
        super-administrateurs et à l’allowlist d’exploitation.
      </p>
    </div>
  </header>

  {#if !data.situation}
    <p class="ui-alerte ui-alerte--danger">
      Connexion owner absente : renseignez <code>MIGRATION_DATABASE_URL</code>
      pour activer la supervision cross-tenant.
    </p>
  {:else}
    <dl class="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {#each totals as [libelle, valeur] (libelle)}
        <div class="ui-carte">
          <dt class="text-xs uppercase tracking-wide text-encre-faine">
            {libelle}
          </dt>
          <dd class="text-2xl font-semibold tabular-nums">{valeur}</dd>
        </div>
      {/each}
    </dl>

    <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
      <table class="w-full min-w-[760px] text-left text-sm">
        <thead class="border-b border-bordure text-xs uppercase tracking-wide text-encre-faine">
          <tr>
            <th class="p-4">Espace</th>
            <th class="p-4">Statut</th>
            <th class="p-4 text-right">Logements</th>
            <th class="p-4 text-right">Réservations</th>
            <th class="p-4 text-right">Comptes</th>
            <th class="p-4 text-right">Audits 24 h</th>
            <th class="p-4">Journal</th>
          </tr>
        </thead>
        <tbody>
          {#each data.situation.lignes as ligne (ligne.tenantId)}
            <tr class="border-b border-bordure last:border-0">
              <td class="p-4">
                <span class="font-medium">{ligne.nom}</span>
                <br />
                <span class="text-xs text-encre-faine">{ligne.slug}</span>
              </td>
              <td class="p-4">{ligne.statut}</td>
              <td class="p-4 text-right tabular-nums">{ligne.logements}</td>
              <td class="p-4 text-right tabular-nums">{ligne.reservations}</td>
              <td class="p-4 text-right tabular-nums">{ligne.utilisateurs}</td>
              <td class="p-4 text-right tabular-nums">{ligne.audits24h}</td>
              <td class="p-4">
                <a class="ui-lien" href={`/journal?tenant=${ligne.tenantId}`}>
                  Consulter
                </a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <section class="grid gap-4 md:grid-cols-2">
    <a class="ui-carte space-y-2 transition hover:border-accent" href="/supervision/apparence">
      <span class="ui-badge ui-badge--accent">Global</span>
      <h2 class="text-lg font-semibold">Apparence du site</h2>
      <p class="text-sm text-encre-douce">
        Thème unique, accent, identité, aperçu signé, publication versionnée et
        retour arrière.
      </p>
    </a>
    <a class="ui-carte ui-carte--liee space-y-2" href="/supervision/assistant">
      <span class="ui-badge ui-badge--accent">Assistant</span>
      <h2 class="text-lg font-semibold">Routage LLM</h2>
      <p class="text-sm text-encre-douce">
        Modèles standard/premium, règles de routage et kill-switch global de la
        génération.
      </p>
    </a>
    <a class="ui-carte ui-carte--liee space-y-2" href="/supervision/fournisseurs">
      <span class="ui-badge ui-badge--accent">Channel manager</span>
      <h2 class="text-lg font-semibold">Fournisseurs</h2>
      <p class="text-sm text-encre-douce">
        Activer Beds24, Channex, Smoobu, Host Port ou Nobeds, puis choisir le
        fournisseur réellement utilisé par logement.
      </p>
    </a>
    <a class="ui-carte ui-carte--liee space-y-2" href="/journal">
      <span class="ui-badge">Audit</span>
      <h2 class="text-lg font-semibold">Journal d’audit</h2>
      <p class="text-sm text-encre-douce">
        Tous les changements sont tracés (acteur, cible, horodatage), filtrables
        et exportables en CSV.
      </p>
    </a>
    <a class="ui-carte ui-carte--liee space-y-2" href="/api/exports/tenant">
      <span class="ui-badge">Données</span>
      <h2 class="text-lg font-semibold">Export complet</h2>
      <p class="text-sm text-encre-douce">
        Archive JSON du tenant pour sauvegarde ou audit externe. Action tracée
        dans le journal.
      </p>
    </a>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">Santé système</h2>
    <div class="grid gap-3 md:grid-cols-3">
      <article class="ui-carte space-y-2">
        <div class="flex items-center justify-between gap-2">
          <h3 class="font-semibold">Disque</h3>
          <span class:ui-badge--accent={data.sante.disque.ok} class="ui-badge">
            {data.sante.disque.ok ? "OK" : "Alerte"}
          </span>
        </div>
        <p class="text-sm text-encre-douce">
          {#if data.sante.disque.libreGo !== null}
            {data.sante.disque.libreGo} Go libres sur
            {data.sante.disque.totalGo} Go
          {:else}
            Indisponible
          {/if}
        </p>
        <p class="text-xs text-encre-faine">
          Seuil {data.sante.disque.seuilGo} Go · {data.sante.disque.chemin}
        </p>
        {#if data.sante.disque.erreur}
          <p class="text-xs text-danger">{data.sante.disque.erreur}</p>
        {/if}
      </article>

      <article class="ui-carte space-y-2">
        <div class="flex items-center justify-between gap-2">
          <h3 class="font-semibold">Certificat TLS</h3>
          <span class:ui-badge--accent={data.sante.tls.ok} class="ui-badge">
            {data.sante.tls.ok ? "OK" : "Alerte"}
          </span>
        </div>
        <p class="text-sm text-encre-douce">
          {#if data.sante.tls.joursRestants !== null}
            Expire dans {data.sante.tls.joursRestants} jour(s)
          {:else}
            Non vérifié
          {/if}
        </p>
        <p class="text-xs text-encre-faine">
          Seuil {data.sante.tls.seuilJours} jours · {data.sante.tls.hote ?? "—"}
        </p>
        {#if data.sante.tls.erreur}
          <p class="text-xs text-encre-faine">{data.sante.tls.erreur}</p>
        {/if}
      </article>

      <article class="ui-carte space-y-2">
        <div class="flex items-center justify-between gap-2">
          <h3 class="font-semibold">Box terrain</h3>
          <span class:ui-badge--accent={data.sante.box.ok} class="ui-badge">
            {data.sante.box.ok ? "OK" : "Alerte"}
          </span>
        </div>
        <p class="text-sm text-encre-douce">
          {#if data.sante.box.configure && data.sante.box.ageMinutes !== null}
            Dernier heartbeat il y a {data.sante.box.ageMinutes} min
          {:else}
            Aucun heartbeat reçu
          {/if}
        </p>
        <p class="text-xs text-encre-faine">
          Seuil {data.sante.box.seuilMinutes} min ·
          <code>POST /api/box/heartbeat</code>
        </p>
      </article>
    </div>
  </section>

  <section class="ui-carte space-y-3">
    <h2 class="text-lg font-semibold">Dernières publications</h2>
    {#if data.versions.length === 0}
      <p class="text-sm text-encre-douce">Aucune version publiée.</p>
    {:else}
      <ul class="space-y-2 text-sm">
        {#each data.versions as version (version.id)}
          <li class="flex flex-wrap items-center justify-between gap-2 border-b border-bordure pb-2 last:border-0">
            <span>Version {version.version} · {version.statut}</span>
            <span class="text-xs text-encre-faine">
              {version.publieLe
                ? new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(version.publieLe))
                : "—"}
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
