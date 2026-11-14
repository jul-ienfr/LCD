<script lang="ts">
  import type { PageData } from "./$types";
  import type { BadgeAction } from "./+page.server";
  import ChampErreur from "@/lib/components/ui/champ-erreur.svelte";

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

  /** T063 — tons de badge : urgent → danger, retard → alerte, reste → accent. */
  const tonBadge: Record<BadgeAction, string> = {
    urgences: "ui-badge--danger",
    impayes: "ui-badge--danger",
    retards: "ui-badge--alerte",
    messages: "ui-badge--accent",
  };

  const libelleBadge: Record<BadgeAction, string> = {
    urgences: "Incidents prioritaires ouverts",
    impayes: "Factures échues et échéances en retard",
    retards: "Départs non confirmés sous 7 jours",
    messages: "Messages voyageur non lus",
  };

  /* T063 — compteurs des quatre thèmes suivis, affichés dans le bloc et sur
     les entrées de navigation concernées. */
  const compteurs = $derived(
    [
      { href: "/hote/factures", badge: "impayes" as const, compteur: data.badges.impayes },
      { href: "/support", badge: "urgences" as const, compteur: data.badges.urgences },
      { href: "/hote/messages/fils", badge: "messages" as const, compteur: data.badges.messages },
      { href: "/hote/planning", badge: "retards" as const, compteur: data.badges.retards },
    ].map((entree) => ({ ...entree, actif: entree.compteur > 0 })),
  );

  const filtres = $derived([
    { valeur: "tout", libelle: "Tout" },
    { valeur: "urgent", libelle: "Urgent" },
    { valeur: "jour", libelle: "Aujourd'hui" },
  ] as const);

  /** Lien de filtre : conserve la recherche courante, sans JavaScript. */
  const lienFiltre = (valeur: string) =>
    valeur === "tout" ? "/hote" : `/hote?filtre=${valeur}`;

  const rechercheSoumise = $derived(data.recherche.length >= 2);
</script>

<svelte:head>
  <title>{data.t.titre} — LCD Parc</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-8 px-6 py-10">
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

  <!-- T062 — bloc « À faire maintenant » : avant les KPI, 5 actions maximum. -->
  <section class="ui-carte space-y-4" aria-labelledby="a-faire-maintenant">
    <div class="flex flex-wrap items-baseline justify-between gap-3">
      <h2 id="a-faire-maintenant" class="text-lg font-semibold">À faire maintenant</h2>
      <p class="text-sm text-encre-douce">
        {data.actions.length} action{data.actions.length > 1 ? "s" : ""} affichée{data.actions.length > 1 ? "s" : ""}{" "}
        {#if data.totalActions > data.actions.length}sur {data.totalActions}{/if}
      </p>
    </div>

    <ul class="flex flex-wrap gap-2" aria-label="Compteurs par thème">
      {#each compteurs as entree (entree.href)}
        <li>
          {#if entree.actif}
            <a class="ui-badge {tonBadge[entree.badge]}" href={entree.href} title={libelleBadge[entree.badge]}>
              {libelleBadge[entree.badge]}
              <span class="font-mono">{entree.compteur}</span>
              <span class="sr-only">— ouvrir</span>
            </a>
          {:else}
            <span class="ui-badge" title={libelleBadge[entree.badge]}>
              {libelleBadge[entree.badge]}
              <span class="font-mono">0</span>
              <span class="sr-only">— rien à traiter</span>
            </span>
          {/if}
        </li>
      {/each}
    </ul>

    <nav aria-label="Filtrer les actions">
      <ul class="flex flex-wrap items-center gap-2">
        {#each filtres as choix (choix.valeur)}
          <li>
            <a
              class="ui-bouton ui-bouton--petit {data.filtre === choix.valeur
                ? 'ui-bouton--primaire'
                : 'ui-bouton--secondaire'}"
              href={lienFiltre(choix.valeur)}
              aria-current={data.filtre === choix.valeur ? "true" : undefined}
            >
              {choix.libelle}
            </a>
          </li>
        {/each}
      </ul>
    </nav>

    {#if data.actions.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-5 text-sm text-encre-douce" role="status">
        {#if data.filtre === "tout"}
          Rien à traiter maintenant : aucune urgence, aucun impayé, aucun message non lu.
        {:else}
          Aucune action ne correspond à ce filtre. <a class="inline-flex min-h-11 items-center underline" href="/hote">Voir toutes les actions</a>.
        {/if}
      </p>
    {:else}
      <ol class="space-y-3">
        {#each data.actions as action (action.id)}
          <li class="flex flex-wrap items-start justify-between gap-3 border-b border-bordure pb-3 last:border-0 last:pb-0">
            <div class="min-w-0 space-y-1">
              <p class="flex flex-wrap items-center gap-2 text-sm font-semibold">
                {action.libelle}
                {#if action.badge && action.compteur}
                  <span class="ui-badge {tonBadge[action.badge]}">{action.compteur}</span>
                {/if}
              </p>
              <p class="text-sm text-encre-douce">{action.raison}</p>
            </div>
            <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit shrink-0" href={action.href}>
              Traiter
            </a>
          </li>
        {/each}
      </ol>
    {/if}
  </section>

  <!-- T066 — formulaire natif : erreur reliée au champ, résumé, état d'attente. -->
  <section class="ui-carte space-y-3" aria-labelledby="recherche-tableau-bord">
    <h2 id="recherche-tableau-bord" class="text-lg font-semibold">Retrouver un séjour</h2>
    <p class="text-sm text-encre-douce">
      Nom du voyageur, référence <span class="font-mono">RES-…</span> ou nom du logement.
    </p>

    {#if data.erreurs.recherche}
      <div class="ui-alerte ui-alerte--danger" role="alert" aria-labelledby="resume-erreurs">
        <p id="resume-erreurs" class="font-semibold">La recherche n'a pas pu être lancée.</p>
        <ul class="mt-1 list-inside list-disc text-sm">
          <li><a class="inline-flex min-h-11 items-center underline" href="#recherche-tableau-bord-champ">{data.erreurs.recherche}</a></li>
        </ul>
      </div>
    {/if}

    {#if rechercheSoumise && !data.erreurs.recherche}
      <p class="ui-alerte ui-alerte--succes" role="status" aria-live="polite">
        {data.resultats.length === 0
          ? "Aucun séjour ne correspond à cette recherche."
          : `${data.resultats.length} séjour${data.resultats.length > 1 ? "s" : ""} trouvé${data.resultats.length > 1 ? "s" : ""}.`}
      </p>
    {/if}

    <form class="flex flex-wrap items-end gap-2" method="get" action="/hote">
      <div class="min-w-0 flex-1">
        <label class="ui-label" for="recherche-tableau-bord-champ">Rechercher un séjour</label>
        <input
          id="recherche-tableau-bord-champ"
          class="ui-champ mt-1.5"
          type="search"
          name="recherche"
          value={data.recherche}
          autocomplete="off"
          enterkeyhint="search"
          minlength="2"
          maxlength="64"
          aria-invalid={data.erreurs.recherche ? "true" : undefined}
          aria-describedby={data.erreurs.recherche ? "recherche-tableau-bord-erreur" : undefined}
        />
        <ChampErreur id="recherche-tableau-bord-erreur" message={data.erreurs.recherche ?? ""} />
      </div>
      <button class="ui-bouton ui-bouton--primaire min-h-11" type="submit">Rechercher</button>
    </form>

    {#if rechercheSoumise && data.resultats.length > 0}
      <ul class="space-y-2">
        {#each data.resultats as resultat (resultat.id)}
          <li class="flex flex-wrap items-center justify-between gap-2 border-b border-bordure pb-2 last:border-0">
            <span class="min-w-0">
              <span class="block text-sm font-medium">{resultat.titre}</span>
              <span class="block text-xs text-encre-faine">{resultat.detail}</span>
            </span>
            <a class="ui-bouton ui-bouton--fantome ui-bouton--petit" href={resultat.href}>
              Voir au planning
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

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

  <!-- T065 — cartes empilées sous 640 px, tableau au-delà. -->
  <section class="grid gap-4 md:grid-cols-2">
    <article class="ui-carte space-y-3">
      <div class="flex items-baseline justify-between gap-2">
        <h2 class="text-lg font-semibold">Arrivées aujourd'hui</h2>
        <span class="ui-badge">{data.arriveesDuJour.length}</span>
      </div>
      {#if data.arriveesDuJour.length === 0}
        <p class="text-sm text-encre-douce">Aucune arrivée aujourd'hui.</p>
      {:else}
        <div class="space-y-2 md:hidden">
          {#each data.arriveesDuJour as arrivee (arrivee.id)}
            <div class="rounded-xl border border-bordure p-3">
              <p class="text-sm font-medium">{arrivee.voyageur || arrivee.logement}</p>
              <dl class="mt-1 space-y-0.5 text-xs text-encre-douce">
                <div class="flex justify-between gap-2">
                  <dt>Logement</dt>
                  <dd class="font-medium text-encre">{arrivee.logement}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt>Référence</dt>
                  <dd class="font-mono">{arrivee.ref}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt>Montant</dt>
                  <dd class="font-medium text-encre">{arrivee.montant}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt>Source</dt>
                  <dd>{arrivee.source}</dd>
                </div>
              </dl>
            </div>
          {/each}
        </div>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div role="region" tabindex="0" aria-label="Tableau défilant" class="hidden overflow-x-auto md:block">
          <table class="ui-tableau w-full text-sm">
            <caption class="sr-only">Arrivées du jour</caption>
            <thead>
              <tr>
                <th scope="col">Voyageur</th>
                <th scope="col">Logement</th>
                <th scope="col">Référence</th>
                <th scope="col">Montant</th>
              </tr>
            </thead>
            <tbody>
              {#each data.arriveesDuJour as arrivee (arrivee.id)}
                <tr>
                  <th scope="row" class="text-left font-medium">{arrivee.voyageur || "—"}</th>
                  <td>{arrivee.logement}</td>
                  <td class="font-mono text-xs">{arrivee.ref}</td>
                  <td class="text-right">{arrivee.montant}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </article>

    <article class="ui-carte space-y-3">
      <div class="flex items-baseline justify-between gap-2">
        <h2 class="text-lg font-semibold">Départs aujourd'hui</h2>
        <span class="ui-badge">{data.departsDuJour.length}</span>
      </div>
      {#if data.departsDuJour.length === 0}
        <p class="text-sm text-encre-douce">Aucun départ aujourd'hui.</p>
      {:else}
        <div class="space-y-2 md:hidden">
          {#each data.departsDuJour as depart (depart.id)}
            <div class="rounded-xl border border-bordure p-3">
              <p class="text-sm font-medium">{depart.voyageur || depart.logement}</p>
              <dl class="mt-1 space-y-0.5 text-xs text-encre-douce">
                <div class="flex justify-between gap-2">
                  <dt>Logement</dt>
                  <dd class="font-medium text-encre">{depart.logement}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt>Référence</dt>
                  <dd class="font-mono">{depart.ref}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt>Check-out</dt>
                  <dd>
                    {#if depart.confirme}
                      <span class="ui-badge ui-badge--succes">Confirmé</span>
                    {:else}
                      <span class="ui-badge ui-badge--alerte">À confirmer</span>
                    {/if}
                  </dd>
                </div>
              </dl>
            </div>
          {/each}
        </div>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div role="region" tabindex="0" aria-label="Tableau défilant" class="hidden overflow-x-auto md:block">
          <table class="ui-tableau w-full text-sm">
            <caption class="sr-only">Départs du jour</caption>
            <thead>
              <tr>
                <th scope="col">Voyageur</th>
                <th scope="col">Logement</th>
                <th scope="col">Référence</th>
                <th scope="col">Check-out</th>
              </tr>
            </thead>
            <tbody>
              {#each data.departsDuJour as depart (depart.id)}
                <tr>
                  <th scope="row" class="text-left font-medium">{depart.voyageur || "—"}</th>
                  <td>{depart.logement}</td>
                  <td class="font-mono text-xs">{depart.ref}</td>
                  <td>
                    {#if depart.confirme}
                      <span class="ui-badge ui-badge--succes">Confirmé</span>
                    {:else}
                      <span class="ui-badge ui-badge--alerte">À confirmer</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </article>
  </section>

  <section class="grid gap-4 md:grid-cols-2">
    <article id="arrivees-du-jour" class="ui-carte space-y-3">
      <div class="flex items-baseline justify-between gap-2">
        <h2 class="text-lg font-semibold">{data.t.arrivees}</h2>
        <span class="ui-badge">{data.arrivees.length}</span>
      </div>
      {#if data.arrivees.length === 0}
        <p class="text-sm text-encre-douce">{data.t.aucuneArrivee}</p>
      {:else}
        <div class="space-y-2 md:hidden">
          {#each data.arrivees as arrivee (arrivee.id)}
            <div class="rounded-xl border border-bordure p-3">
              <p class="text-sm font-medium">{arrivee.logement}</p>
              <dl class="mt-1 space-y-0.5 text-xs text-encre-douce">
                <div class="flex justify-between gap-2">
                  <dt>Date</dt>
                  <dd class="font-medium text-encre">{arrivee.date}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt>Montant</dt>
                  <dd class="font-medium text-encre">{arrivee.montant}</dd>
                </div>
              </dl>
            </div>
          {/each}
        </div>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div role="region" tabindex="0" aria-label="Tableau défilant" class="hidden overflow-x-auto md:block">
          <table class="ui-tableau w-full text-sm">
            <caption class="sr-only">{data.t.arrivees}</caption>
            <thead>
              <tr>
                <th scope="col">Logement</th>
                <th scope="col">Date</th>
                <th scope="col">Montant</th>
              </tr>
            </thead>
            <tbody>
              {#each data.arrivees as arrivee (arrivee.id)}
                <tr>
                  <th scope="row" class="text-left font-medium">{arrivee.logement}</th>
                  <td>{arrivee.date}</td>
                  <td class="text-right">{arrivee.montant}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </article>

    <article id="departs-du-jour" class="ui-carte space-y-3">
      <div class="flex items-baseline justify-between gap-2">
        <h2 class="text-lg font-semibold">{data.t.departs}</h2>
        <span class="ui-badge">{data.departs.length}</span>
      </div>
      {#if data.departs.length === 0}
        <p class="text-sm text-encre-douce">{data.t.aucunDepart}</p>
      {:else}
        <div class="space-y-2 md:hidden">
          {#each data.departs as depart (depart.id)}
            <div class="rounded-xl border border-bordure p-3">
              <p class="text-sm font-medium">{depart.logement}</p>
              <dl class="mt-1 space-y-0.5 text-xs text-encre-douce">
                <div class="flex justify-between gap-2">
                  <dt>Date</dt>
                  <dd class="font-medium text-encre">{depart.date}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt>Montant</dt>
                  <dd class="font-medium text-encre">{depart.montant}</dd>
                </div>
                {#if depart.confirme}
                  <div class="flex justify-between gap-2">
                    <dt>Check-out</dt>
                    <dd><span class="ui-badge ui-badge--succes">{data.t.departConfirme}</span></dd>
                  </div>
                {/if}
              </dl>
            </div>
          {/each}
        </div>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div role="region" tabindex="0" aria-label="Tableau défilant" class="hidden overflow-x-auto md:block">
          <table class="ui-tableau w-full text-sm">
            <caption class="sr-only">{data.t.departs}</caption>
            <thead>
              <tr>
                <th scope="col">Logement</th>
                <th scope="col">Date</th>
                <th scope="col">Montant</th>
                <th scope="col">Check-out</th>
              </tr>
            </thead>
            <tbody>
              {#each data.departs as depart (depart.id)}
                <tr>
                  <th scope="row" class="text-left font-medium">{depart.logement}</th>
                  <td>{depart.date}</td>
                  <td class="text-right">{depart.montant}</td>
                  <td>
                    {#if depart.confirme}
                      <span class="ui-badge ui-badge--succes">{data.t.departConfirme}</span>
                    {:else}
                      <span class="text-xs text-encre-faine">—</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
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
