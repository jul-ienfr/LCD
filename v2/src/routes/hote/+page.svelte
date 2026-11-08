<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const dateLongue = $derived(new Intl.DateTimeFormat(data.langue, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }));

  const acces = $derived([
    { href: "/hote/logements", libelle: data.t.accesLogements, detail: data.t.accesLogementsDetail },
    { href: "/hote/planning", libelle: data.t.accesPlanning, detail: data.t.accesPlanningDetail },
    { href: "/hote/menage", libelle: data.t.accesMenage, detail: data.t.accesMenageDetail },
    { href: "/hote/fils", libelle: data.t.accesFils, detail: data.t.accesFilsDetail },
    { href: "/hote/sorties", libelle: data.t.accesSorties, detail: data.t.accesSortiesDetail },
  ]);
</script>

<svelte:head>
  <title>{data.t.titre} — LCD Parc</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-10">
  <header class="ui-entete space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {dateLongue.format(new Date())}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{data.t.bonjour} {data.nom}</h1>
    <p class="text-encre-douce">
      {data.t.role} <span class="font-medium">{data.roleEffectif}</span> ·
      <span class="font-mono text-xs">{data.tenantId}</span>
    </p>
  </header>

  {#if data.apercu}
    <p class="ui-alerte ui-alerte--alerte" role="status">
      {data.t.apercu}
    </p>
  {/if}

  <section class="grid gap-4 sm:grid-cols-3">
    <article class="ui-carte ui-kpi">
      <p class="text-xs uppercase tracking-widest text-encre-faine">{data.t.logements}</p>
      <p class="text-3xl font-extrabold">{data.stats.logements}</p>
      <p class="text-xs text-encre-douce">{data.t.logementsNote}</p>
    </article>
    <article class="ui-carte ui-kpi">
      <p class="text-xs uppercase tracking-widest text-encre-faine">
        {data.t.reservations}
      </p>
      <p class="text-3xl font-extrabold">{data.stats.reservations}</p>
      <p class="text-xs text-encre-douce">{data.t.reservationsNote}</p>
    </article>
    <article class="ui-carte ui-kpi">
      <p class="text-xs uppercase tracking-widest text-encre-faine">{data.t.ca}</p>
      <p class="text-3xl font-extrabold">{data.stats.caMois}</p>
      <p class="text-xs text-encre-douce">{data.t.caNote}</p>
    </article>
  </section>

  <section class="grid gap-4 md:grid-cols-2">
    <article class="ui-carte space-y-3">
      <div class="flex items-baseline justify-between gap-2">
        <h2 class="text-lg font-semibold">{data.t.arrivees}</h2>
        <span class="ui-badge">{data.arrivees.length}</span>
      </div>
      {#if data.arrivees.length === 0}
        <p class="text-sm text-encre-douce">{data.t.aucuneArrivee}</p>
      {:else}
        <ul class="space-y-2">
          {#each data.arrivees as arrivee (arrivee.id)}
            <li class="flex items-center justify-between gap-3 border-b border-bordure pb-2 last:border-0">
              <span>
                <span class="block text-sm font-medium">{arrivee.logement}</span>
                <span class="block text-xs text-encre-faine">{arrivee.date}</span>
              </span>
              <span class="text-sm font-semibold">{arrivee.montant}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </article>

    <article class="ui-carte space-y-3">
      <div class="flex items-baseline justify-between gap-2">
        <h2 class="text-lg font-semibold">{data.t.departs}</h2>
        <span class="ui-badge">{data.departs.length}</span>
      </div>
      {#if data.departs.length === 0}
        <p class="text-sm text-encre-douce">{data.t.aucunDepart}</p>
      {:else}
        <ul class="space-y-2">
          {#each data.departs as depart (depart.id)}
            <li class="flex items-center justify-between gap-3 border-b border-bordure pb-2 last:border-0">
              <span>
                <span class="block text-sm font-medium">{depart.logement}</span>
                <span class="block text-xs text-encre-faine">{depart.date}</span>
                {#if depart.confirme}
                  <span class="ui-badge ui-badge--succes mt-1">{data.t.departConfirme}</span>
                {/if}
              </span>
              <span class="text-sm font-semibold">{depart.montant}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </article>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{data.t.acces}</h2>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each acces as lien (lien.href)}
        <a class="ui-carte ui-carte--liee space-y-1" href={lien.href}>
          <span class="block text-sm font-semibold">{lien.libelle}</span>
          <span class="block text-xs text-encre-faine">{lien.detail}</span>
        </a>
      {/each}
      {#if data.roleEffectif === "admin" || data.roleEffectif === "super_admin"}
        <a
          class="ui-carte ui-carte--liee space-y-1"
          href="/hote/reglages-groupe"
        >
          <span class="block text-sm font-semibold">{data.t.reglages}</span>
          <span class="block text-xs text-encre-faine">
            {data.t.reglagesDetail}
          </span>
        </a>
      {/if}
    </div>
  </section>
</main>
