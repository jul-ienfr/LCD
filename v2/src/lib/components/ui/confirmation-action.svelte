<script lang="ts">
  /**
   * Confirmation en deux étapes d'une action destructrice (FR-039, spec 006).
   *
   * Le premier geste ne détruit rien : c'est un lien qui recharge la page avec
   * `?confirmer=<action>&cible=<élément>` ; la zone de confirmation s'affiche
   * alors à la place du bouton, avec la question, le rappel que l'action est
   * définitive, un formulaire POST portant `confirmation=<action>` (seconde
   * étape) et un lien d'annulation qui retire les paramètres de confirmation.
   *
   * Sans JavaScript, tout fonctionne : lien, formulaire, redirections serveur.
   *
   * Props :
   * - `langue` : langue servie, pour le dictionnaire de confirmation ;
   * - `action` : nom de l'action serveur destructive (`supprimer`, ...) ;
   * - `jeton` : jeton de confirmation, si l'action porte plusieurs gestes ;
   * - `cible` : identifiant de l'élément visé (posé dans l'URL) ;
   * - `libelle` : libellé du bouton, déjà traduit par la page ;
   * - `champs` : champs cachés que l'action serveur relit (identifiants) ;
   * - `contenu` : champs supplémentaires à saisir dans la confirmation
   *   (motif, par exemple), rendus dans le formulaire de seconde étape ;
   * - `retour` : destination du lien d'annulation (défaut : page courante
   *   sans les paramètres de confirmation) ;
   * - `classe` : classes du bouton de premier niveau.
   */
  import { page } from "$app/state";
  import type { Snippet } from "svelte";
  import { traductionsConfirmation } from "@/lib/i18n-confirmation";

  let {
    langue,
    action,
    jeton = action,
    cible,
    libelle,
    champs = {},
    contenu,
    retour,
    classe = "ui-bouton ui-bouton--danger ui-bouton--petit",
  }: {
    langue: string | null | undefined;
    action: string;
    jeton?: string;
    cible: string;
    libelle: string;
    champs?: Record<string, string>;
    contenu?: Snippet;
    retour?: string;
    classe?: string;
  } = $props();

  const t = $derived(traductionsConfirmation(langue));
  const enConfirmation = $derived(
    page.url.searchParams.get("confirmer") === jeton &&
      page.url.searchParams.get("cible") === cible,
  );
  const question = $derived(t.question(libelle));

  const lienConfirmation = $derived.by(() => {
    const parametres = new URLSearchParams(page.url.search);
    parametres.set("confirmer", jeton);
    parametres.set("cible", cible);
    return `${page.url.pathname}?${parametres.toString()}`;
  });

  const lienAnnulation = $derived.by(() => {
    if (retour) return retour;
    const parametres = new URLSearchParams(page.url.search);
    parametres.delete("confirmer");
    parametres.delete("cible");
    const requete = parametres.toString();
    return requete ? `${page.url.pathname}?${requete}` : page.url.pathname;
  });
</script>

{#if enConfirmation}
  <div
    class="ui-alerte ui-alerte--danger space-y-2"
    role="group"
    aria-label={question}
    data-confirmation={jeton}
  >
    <p class="font-semibold">{t.titre}</p>
    <p>{question}</p>
    <p class="text-xs">{t.aide}</p>
    <div class="flex flex-wrap items-center gap-2">
      <form method="POST" action="?/{action}">
        <input type="hidden" name="confirmation" value={jeton} />
        {#each Object.entries(champs) as [nom, valeur] (nom)}
          <input type="hidden" name={nom} value={valeur} />
        {/each}
        {#if contenu}
          {@render contenu()}
        {/if}
        <button class="ui-bouton ui-bouton--danger ui-bouton--petit" type="submit">
          {t.confirmer}
        </button>
      </form>
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={lienAnnulation}>
        {t.annuler}
      </a>
    </div>
  </div>
{:else}
  <a class={classe} href={lienConfirmation} data-confirmation={jeton}>
    {libelle}
  </a>
{/if}
