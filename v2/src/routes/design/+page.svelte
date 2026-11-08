<svelte:head>
  <title>Design system — LCD Parc</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-10 px-6 py-12">
  <header class="ui-entete space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Galerie · QA visuelle
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">Design system</h1>
    <p class="text-encre-douce">
      Tous les composants de base, rendus par le thème actif. Cette page doit
      rester lisible sans JavaScript et en mode sombre.
    </p>
  </header>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">Boutons</h2>
    <div class="flex flex-wrap gap-3">
      <button class="ui-bouton ui-bouton--primaire" type="button">Primaire</button>
      <button class="ui-bouton ui-bouton--secondaire" type="button">Secondaire</button>
      <button class="ui-bouton ui-bouton--encre" type="button">Encre</button>
      <button class="ui-bouton ui-bouton--fantome" type="button">Fantôme</button>
      <button class="ui-bouton ui-bouton--danger" type="button">Danger</button>
      <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="button">Petit</button>
    </div>
  </section>

  <section class="grid gap-4 md:grid-cols-3">
    {#each [["Carte", "Surface, bordure, rayon, ombre et densité viennent du thème."], ["KPI", "Une valeur, un libellé, aucune dépendance."], ["Badge", "Statut lisible, couleur sémantique fixe."]] as [titre, texte]}
      <article class="ui-carte space-y-2">
        <span class="ui-badge ui-badge--accent">Exemple</span>
        <h3 class="font-semibold">{titre}</h3>
        <p class="text-sm text-encre-douce">{texte}</p>
      </article>
    {/each}
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">Champs</h2>
    <div class="grid gap-4 md:grid-cols-2">
      <label class="space-y-2">
        <span class="ui-label">Nom</span>
        <input class="ui-champ" placeholder="Séjour" />
      </label>
      <label class="space-y-2">
        <span class="ui-label">Arrivée</span>
        <input class="ui-champ" type="date" />
      </label>
      <label class="space-y-2 md:col-span-2">
        <span class="ui-label">Message</span>
        <textarea class="ui-champ" rows="3" placeholder="Texte…"></textarea>
      </label>
    </div>
  </section>

  <section class="ui-carte space-y-3">
    <h2 class="text-xl font-semibold">Alertes</h2>
    <p class="ui-alerte">Information neutre.</p>
    <p class="ui-alerte ui-alerte--ok" role="status">Opération réussie.</p>
    <p class="ui-alerte ui-alerte--alerte">Attention requise.</p>
    <p class="ui-alerte ui-alerte--danger" role="alert">Erreur bloquante.</p>
  </section>

  <section class="ui-carte overflow-x-auto">
    <table class="ui-tableau">
      <thead>
        <tr><th>Logement</th><th>Ville</th><th>Statut</th></tr>
      </thead>
      <tbody>
        <tr><td>Santa Severa</td><td>Saint-Laurent-du-Var</td><td><span class="ui-badge ui-badge--ok">Actif</span></td></tr>
        <tr><td>Villa des Pins</td><td>Antibes</td><td><span class="ui-badge ui-badge--alerte">À vérifier</span></td></tr>
      </tbody>
    </table>
  </section>

  <nav class="ui-nav" aria-label="Navigation de démonstration">
    <a class="ui-nav-lien" href="/design" aria-current="page">Actif</a>
    <a class="ui-nav-lien" href="/design">Second</a>
    <a class="ui-nav-lien" href="/design">Troisième</a>
  </nav>
</main>
