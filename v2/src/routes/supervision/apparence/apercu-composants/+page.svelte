<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const themes = [
    { id: "sejour", nom: "Séjour" },
    { id: "ocean", nom: "Océan" },
    { id: "sable", nom: "Sable" },
    { id: "nuit", nom: "Nuit" },
    { id: "foret", nom: "Forêt" },
    { id: "ardoise", nom: "Ardoise" },
  ];

  const mode = $derived(data.mode);
  const themeAffiche = $derived(data.themeAffiche);

  /** Aperçu d'un autre thème que le thème actif : on force ses jetons. */
  const styleApercu = $derived.by(() => {
    if (!themeAffiche) return undefined;
    const palette = mode === "sombre" ? themeAffiche.sombre : themeAffiche.clair;
    return [
      `--fond:${palette.fond}`,
      `--surface:${palette.surface}`,
      `--surface-2:${palette.surface2}`,
      `--bordure:${palette.bordure}`,
      `--encre:${palette.encre}`,
      `--encre-douce:${palette.encreDouce}`,
      `--encre-faine:${palette.encreFaine}`,
      `--accent:${palette.accent}`,
      `--accent-fonce:${palette.accentFonce}`,
      `--accent-douce:${palette.accentDouce}`,
    ].join(";");
  });
</script>

<svelte:head>
  <title>Aperçu des composants — Supervision</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-8 px-6 py-10">
  <header class="ui-entete space-y-3">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Supervision · Réservé au super-admin
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">Aperçu des composants</h1>
    <p class="max-w-2xl text-encre-douce">
      Les composants critiques rendus par le thème actif, en clair et en sombre.
      Contrôlez les contrastes, la hauteur des cibles (44 px minimum) et la
      lisibilité des états avant de publier une version.
    </p>
    <p>
      <a class="ui-lien-action" href="/supervision/apparence">← Retour à l’apparence</a>
    </p>
  </header>

  <nav class="ui-carte flex flex-wrap items-center gap-3" aria-label="Choix de l’aperçu">
    <span class="ui-label">Mode</span>
    <a
      class="ui-bouton {mode === "clair" ? "ui-bouton--encre" : "ui-bouton--secondaire"}"
      href="?mode=clair"
      aria-current={mode === "clair" ? "page" : undefined}>Clair</a
    >
    <a
      class="ui-bouton {mode === "sombre" ? "ui-bouton--encre" : "ui-bouton--secondaire"}"
      href="?mode=sombre"
      aria-current={mode === "sombre" ? "page" : undefined}>Sombre</a
    >
    <span class="ui-label ml-4">Thème</span>
    <a
      class="ui-bouton {themeAffiche ? 'ui-bouton--secondaire' : 'ui-bouton--encre'}"
      href="?mode={mode}"
      aria-current={themeAffiche ? undefined : "page"}>Actif</a
    >
    {#each themes as theme (theme.id)}
      <a
        class="ui-bouton {(themeAffiche?.id ?? '') === theme.id
          ? 'ui-bouton--encre'
          : 'ui-bouton--secondaire'}"
        href="?mode={mode}&themeId={theme.id}"
        aria-current={(themeAffiche?.id ?? "") === theme.id ? "page" : undefined}
        >{theme.nom}</a
      >
    {/each}
  </nav>

  <p class="ui-alerte ui-alerte--attention" role="status">
    Mode <strong>{mode}</strong>
    {#if themeAffiche}· thème forcé <strong>{themeAffiche.nom}</strong>{:else}· thème actif du site{/if}
    . Les jetons de couleur sont appliqués localement à cet aperçu.
  </p>

  <div class="space-y-8" style={styleApercu}>
    <section class="ui-carte space-y-4">
      <h2 class="text-xl font-semibold">Boutons</h2>
      <div class="flex flex-wrap gap-3">
        <button class="ui-bouton ui-bouton--primaire" type="button">Primaire</button>
        <button class="ui-bouton ui-bouton--secondaire" type="button">Secondaire</button>
        <button class="ui-bouton ui-bouton--encre" type="button">Encre</button>
        <button class="ui-bouton ui-bouton--fantome" type="button">Fantôme</button>
        <button class="ui-bouton ui-bouton--danger" type="button">Danger</button>
        <button class="ui-bouton ui-bouton--large ui-bouton--primaire" type="button">
          Large
        </button>
        <button class="ui-bouton ui-bouton--primaire" type="button" disabled>
          Désactivé
        </button>
      </div>
      <p class="text-sm text-encre-douce">
        Chaque bouton doit mesurer au moins 44 px de haut (largeur ou hauteur) et
        rester lisible dans les deux modes.
      </p>
    </section>

    <section class="ui-carte space-y-4">
      <h2 class="text-xl font-semibold">Champs et formulaire</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <label class="space-y-2">
          <span class="ui-label">Arrivée</span>
          <input class="ui-champ" type="date" name="arrivee" />
        </label>
        <label class="space-y-2">
          <span class="ui-label">Voyageurs</span>
          <select class="ui-champ" name="voyageurs">
            <option value="1">1 voyageur</option>
            <option value="2">2 voyageurs</option>
            <option value="4">4 voyageurs</option>
          </select>
        </label>
        <label class="space-y-2 md:col-span-2">
          <span class="ui-label">Message</span>
          <textarea class="ui-champ" name="message" rows="3" placeholder="Bonjour…"
          ></textarea>
        </label>
        <label class="flex min-h-11 min-w-11 items-center gap-3 text-sm md:col-span-2">
          <input type="checkbox" name="consentement" />
          <span>J’accepte de recevoir une réponse par e-mail.</span>
        </label>
      </div>
      <div class="flex flex-wrap gap-3">
        <button class="ui-bouton ui-bouton--primaire" type="button">Envoyer</button>
        <button class="ui-bouton ui-bouton--secondaire" type="button">Annuler</button>
      </div>
      <p class="text-sm text-encre-douce">
        Chaque champ porte un libellé visible ; les erreurs sont décrites dans
        une alerte bloquante.
      </p>
    </section>

    <section class="ui-carte space-y-4">
      <h2 class="text-xl font-semibold">Alertes et états</h2>
      <p class="ui-alerte ui-alerte--ok" role="status">Succès : demande envoyée.</p>
      <p class="ui-alerte ui-alerte--attention" role="status">
        Attention : vérifiez les dates avant de valider.
      </p>
      <p class="ui-alerte ui-alerte--danger" role="alert">
        Erreur : le logement n’est plus disponible à ces dates.
      </p>
      <p class="text-sm text-encre-faine">État vide : aucune donnée pour le moment.</p>
      <p class="text-sm text-encre-faine">Chargement : mise à jour en cours…</p>
    </section>

    <section class="ui-carte space-y-4">
      <h2 class="text-xl font-semibold">Badges</h2>
      <div class="flex flex-wrap gap-3">
        <span class="ui-badge ui-badge--accent">Accent</span>
        <span class="ui-badge ui-badge--ok">Confirmé</span>
        <span class="ui-badge ui-badge--alerte">En attente</span>
        <span class="ui-badge ui-badge--danger">Annulé</span>
      </div>
      <p class="text-sm text-encre-douce">
        Les badges portent une information courte ; leur contraste doit rester
        supérieur à 4,5:1.
      </p>
    </section>

    <section class="ui-carte space-y-4">
      <h2 class="text-xl font-semibold">Tableau</h2>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div role="region" tabindex="0" aria-label="Tableau défilant"  class="overflow-x-auto">
        <table class="ui-tableau w-full">
          <caption class="sr-only">Exemple de tableau de séjours</caption>
          <thead>
            <tr>
              <th scope="col">Logement</th>
              <th scope="col">Arrivée</th>
              <th scope="col">Statut</th>
              <th scope="col">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Studio Vieux-Port</td>
              <td>2026-12-04</td>
              <td><span class="ui-badge ui-badge--ok">Confirmé</span></td>
              <td>412 €</td>
            </tr>
            <tr>
              <td>Loft Bellecour</td>
              <td>2026-12-11</td>
              <td><span class="ui-badge ui-badge--alerte">En attente</span></td>
              <td>688 €</td>
            </tr>
            <tr>
              <td>Maison Calanques</td>
              <td>2026-12-20</td>
              <td><span class="ui-badge ui-badge--danger">Annulé</span></td>
              <td>1 240 €</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-sm text-encre-douce">
        Le tableau défile horizontalement plutôt que de casser la page à 320 px.
      </p>
    </section>

    <section class="ui-carte space-y-3">
      <h2 class="text-xl font-semibold">Liens</h2>
      <p class="text-encre-douce">
        Un lien de texte inline comme <a class="ui-lien" href="/design">celui-ci</a>
        est exclu du seuil 44 px, contrairement à un lien-bouton.
      </p>
      <p>
        <a class="ui-bouton ui-bouton--secondaire" href="/design">
          Lien-bouton vers le design system
        </a>
      </p>
    </section>
  </div>
</main>
