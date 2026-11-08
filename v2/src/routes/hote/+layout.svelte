<script lang="ts">
  import type { LayoutData } from "./$types";
  import type { Snippet } from "svelte";
  import { LANGUES_STAFF } from "@/lib/i18n-staff";

  let {
    data,
    children,
  }: {
    data: LayoutData;
    children: Snippet;
  } = $props();

  const principaux = $derived([
    { href: "/hote", libelle: data.tNav.tableau },
    { href: "/hote/logements", libelle: data.tNav.logements },
    { href: "/hote/planning", libelle: data.tNav.planning },
    { href: "/hote/planning/canaux", libelle: data.tNav.canaux },
    { href: "/hote/menage", libelle: data.tNav.menage },
    { href: "/hote/factures", libelle: data.tNav.factures },
    { href: "/hote/compta", libelle: data.tNav.compta },
    { href: "/hote/messages", libelle: data.tNav.messages },
  ]);

  const operations = $derived([
    { href: "/hote/demandes", libelle: data.tNav.demandes },
    { href: "/hote/prix", libelle: data.tNav.prix },
    { href: "/hote/promotions", libelle: data.tNav.promotions },
    { href: "/hote/etats-des-lieux", libelle: data.tNav.etatsDesLieux },
    { href: "/hote/entretien", libelle: data.tNav.entretien },
    { href: "/hote/missions", libelle: data.tNav.missions },
    { href: "/hote/dispatch", libelle: data.tNav.dispatch },
    { href: "/hote/cautions", libelle: data.tNav.cautions },
    { href: "/hote/extras", libelle: data.tNav.extras },
    { href: "/hote/stocks", libelle: data.tNav.stocks },
    { href: "/hote/inventaire", libelle: data.tNav.inventaire },
    { href: "/hote/logements", libelle: data.tNav.guides },
  ]);

  const relation = $derived([
    { href: "/hote/assistant", libelle: data.tNav.assistant },
    { href: "/hote/avis", libelle: data.tNav.avis },
    { href: "/hote/questionnaires", libelle: data.tNav.questionnaires },
    { href: "/hote/objets-trouves", libelle: data.tNav.objetsTrouves },
    { href: "/hote/sinistres", libelle: data.tNav.sinistres },
    { href: "/hote/tranquillite", libelle: data.tNav.tranquillite },
    { href: "/hote/tourisme", libelle: data.tNav.tourisme },
    { href: "/hote/phrases", libelle: data.tNav.phrases },
  ]);

  const conformite = $derived([
    { href: "/hote/annonce", libelle: data.tNav.annonce },
    { href: "/hote/onboarding", libelle: data.tNav.onboarding },
    { href: "/hote/formation", libelle: data.tNav.formation },
    { href: "/hote/police", libelle: data.tNav.police },
    { href: "/hote/rgpd", libelle: data.tNav.rgpd },
  ]);

  const administration = $derived([
    { href: "/hote/recherche", libelle: data.tNav.recherche },
    { href: "/hote/acces", libelle: data.tNav.acces },
    { href: "/hote/proprietaires", libelle: data.tNav.proprietaires },
    { href: "/hote/entite", libelle: data.tNav.entite },
    { href: "/hote/integrations", libelle: data.tNav.integrations },
    { href: "/hote/audit", libelle: data.tNav.audit },
    { href: "/hote/utilisateurs", libelle: data.tNav.utilisateurs },
    { href: "/hote/securite", libelle: data.tNav.securite },
  ]);

  const roleLibelle = $derived(data.tNav.roles);

  const estAdmin = $derived(data.utilisateur.role === "admin" || data.superAdmin);
  const actif = (href: string) =>
    href === "/hote" ? data.chemin === href : data.chemin.startsWith(href);
  const groupeActif = (liens: { href: string }[]) => liens.some((lien) => actif(lien.href));
  const plusActif = $derived(
    groupeActif(operations) ||
      groupeActif(relation) ||
      groupeActif(conformite) ||
      (estAdmin && groupeActif(administration)),
  );
</script>

<div class="min-h-dvh bg-fond text-encre" lang={data.langue}>
  {#if data.apercu}
    <div class="border-b border-alerte bg-alerte-douce px-5 py-2 text-sm text-alerte">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        <span>
          {data.tNav.apercuLectureSeule(data.apercu.libelle)}
        </span>
        <form method="POST" action="/preview/quitter">
          <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
            {data.tNav.quitterApercu}
          </button>
        </form>
      </div>
    </div>
  {/if}
  <header class="sticky top-0 z-30 border-b border-bordure ui-verre">
    <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3 lg:px-8">
      <a class="flex items-center gap-2.5 font-semibold tracking-tight" href="/hote">
        {#if data.apparence.identite.logoUrl}
          <img
            class="size-8 rounded-lg object-contain"
            src={data.apparence.identite.logoUrl}
            alt=""
          />
        {:else}
          <span class="grid size-8 place-items-center rounded-lg bg-accent text-sm font-black text-sur-accent">
            {data.apparence.identite.nom.slice(0, 1)}
          </span>
        {/if}
        <span class="leading-tight">
          <span class="block text-sm font-semibold">{data.apparence.identite.nom}</span>
          <span class="block text-[0.65rem] font-medium uppercase tracking-[0.14em] text-encre-faine">
            {data.tNav.espaceHote}
          </span>
        </span>
      </a>

      <span class="ui-badge hidden sm:inline-flex">
        {roleLibelle[data.utilisateur.role] ?? data.utilisateur.role}
      </span>

      <nav
        class="order-last w-full md:order-none md:w-auto md:flex-1"
        aria-label={data.tNav.navigationPrincipale}
      >
        <ul class="flex flex-wrap items-center gap-1">
          {#each principaux as lien (lien.href)}
            <li>
              <a
                class="ui-nav-lien whitespace-nowrap"
                href={lien.href}
                aria-current={actif(lien.href) ? "page" : undefined}
              >
                {lien.libelle}
              </a>
            </li>
          {/each}
          <li class="shrink-0">
            <details class="ui-menu">
              <summary
                class="ui-bouton ui-bouton--petit {plusActif
                  ? 'ui-bouton--primaire'
                  : 'ui-bouton--secondaire'}"
              >
                {data.tNav.plus}
              </summary>
              <div class="ui-menu-panneau">
                <div class="ui-menu-groupe">
                  <p class="ui-menu-titre">{data.tNav.exploitation}</p>
                  {#each operations as lien (lien.href)}
                    <a
                      class="ui-menu-lien"
                      href={lien.href}
                      aria-current={actif(lien.href) ? "page" : undefined}
                    >
                      {lien.libelle}
                    </a>
                  {/each}
                </div>
                <div class="ui-menu-groupe">
                  <p class="ui-menu-titre">{data.tNav.relation}</p>
                  {#each relation as lien (lien.href)}
                    <a
                      class="ui-menu-lien"
                      href={lien.href}
                      aria-current={actif(lien.href) ? "page" : undefined}
                    >
                      {lien.libelle}
                    </a>
                  {/each}
                </div>
                <div class="ui-menu-groupe">
                  <p class="ui-menu-titre">{data.tNav.conformite}</p>
                  {#each conformite as lien (lien.href)}
                    <a
                      class="ui-menu-lien"
                      href={lien.href}
                      aria-current={actif(lien.href) ? "page" : undefined}
                    >
                      {lien.libelle}
                    </a>
                  {/each}
                </div>
                {#if estAdmin}
                  <div class="ui-menu-groupe">
                    <p class="ui-menu-titre">{data.tNav.administration}</p>
                    {#each administration as lien (lien.href)}
                      <a
                        class="ui-menu-lien"
                        href={lien.href}
                        aria-current={actif(lien.href) ? "page" : undefined}
                      >
                        {lien.libelle}
                      </a>
                    {/each}
                  </div>
                {/if}
              </div>
            </details>
          </li>
        </ul>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        {#if data.superAdmin}
          <a class="ui-bouton ui-bouton--fantome ui-bouton--petit" href="/supervision">
            {data.tNav.supervision}
          </a>
          <a class="ui-bouton ui-bouton--fantome ui-bouton--petit" href="/supervision/apparence">
            {data.tNav.apparence}
          </a>
        {/if}
        <form method="GET" action="/api/langue" class="flex items-center gap-1">
          <input type="hidden" name="retour" value={data.chemin} />
          <select class="ui-champ ui-champ--petit uppercase" name="lang" aria-label={data.tNav.langue}>
            {#each LANGUES_STAFF as langue (langue)}
              <option value={langue} selected={langue === data.langue}>{langue}</option>
            {/each}
          </select>
          <button class="ui-bouton ui-bouton--fantome ui-bouton--petit" type="submit">OK</button>
        </form>
        <a class="ui-bouton ui-bouton--fantome ui-bouton--petit" href="/">{data.tNav.voirSite}</a>
        <form method="POST" action="/logout">
          <button class="ui-bouton ui-bouton--fantome ui-bouton--petit" type="submit" aria-label={data.tNav.quitter}>
            {data.tNav.quitter}
          </button>
        </form>
      </div>
    </div>
  </header>

  {@render children()}
</div>
