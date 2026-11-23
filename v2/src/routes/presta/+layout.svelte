<script lang="ts">
  /**
   * En-tête de l'espace prestataire (FR-038, spec 006) : menu de l'espace et
   * choix de la langue, comme l'espace hôte.
   *
   * Tout est serveur : les liens sont de vrais liens, le sélecteur de langue
   * est un formulaire GET vers `/api/langue` (cookie + retour sur l'espace),
   * et la langue est lue par le serveur (`langueRequete`). Cibles ≥ 44 px
   * (`min-h-11`, `min-w-11`) et retour à la ligne : l'écran reste utilisable à
   * 320 px.
   */
  import type { LayoutData } from "./$types";
  import type { Snippet } from "svelte";
  import { LANGUES } from "@/lib/i18n";
  import { traductionsNavigation } from "@/lib/i18n-nav";
  import { traductionsPresta } from "@/lib/i18n-presta";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const t = $derived(traductionsPresta(data.langue));
  const tNav = $derived(traductionsNavigation(data.langue));
  const role = $derived(data.utilisateur?.role ?? "");
  const roleLibelle = $derived(tNav.roles[role] ?? role);
</script>

<div class="min-h-dvh bg-fond text-encre" lang={data.langue}>
  <header class="sticky top-0 z-30 border-b border-bordure ui-verre ui-safe-haut">
    <div class="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-5 py-3">
      <a
        class="flex min-h-11 items-center gap-2.5 font-semibold tracking-tight"
        href="/presta"
      >
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
            {t.espace}
          </span>
        </span>
      </a>

      <nav
        class="order-last w-full md:order-none md:w-auto md:flex-1"
        aria-label={t.navigationPrincipale}
        data-menu-presta
      >
        <ul class="flex flex-wrap items-center gap-1">
          <li>
            <a
              class="ui-nav-lien whitespace-nowrap"
              href="/presta"
              aria-current={data.chemin === "/presta" ? "page" : undefined}
            >
              {t.mesMissions}
            </a>
          </li>
          <li>
            <a class="ui-nav-lien whitespace-nowrap" href="/hote/securite">
              {t.securite}
            </a>
          </li>
          <li>
            <a class="ui-nav-lien whitespace-nowrap" href="/support">{t.support}</a>
          </li>
          <li>
            <a class="ui-nav-lien whitespace-nowrap" href="/">{t.site}</a>
          </li>
        </ul>
      </nav>

      <div class="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
        <span class="ui-badge hidden lg:inline-flex">{roleLibelle}</span>

        <details class="ui-menu">
          <summary class="ui-bouton ui-bouton--secondaire ui-bouton--petit">
            {t.monCompte}
          </summary>
          <div class="ui-menu-panneau">
            <div class="ui-menu-groupe">
              <p class="ui-menu-titre">
                {data.utilisateur?.email ?? ""} · {roleLibelle}
              </p>
              <form
                method="GET"
                action="/api/langue"
                class="flex items-center gap-2 px-2 py-1"
              >
                <input type="hidden" name="retour" value="/presta" />
                <label class="ui-label text-xs" for="presta-langue">{t.langue}</label>
                <select class="ui-champ uppercase" id="presta-langue" name="lang">
                  {#each LANGUES as langue (langue)}
                    <option value={langue} selected={langue === data.langue}>
                      {langue}
                    </option>
                  {/each}
                </select>
                <button
                  class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
                  type="submit"
                >
                  OK
                </button>
              </form>
              <form method="POST" action="/logout">
                <button class="ui-menu-lien w-full text-left" type="submit">
                  {t.quitter}
                </button>
              </form>
            </div>
          </div>
        </details>
      </div>
    </div>
  </header>

  {@render children()}
</div>
