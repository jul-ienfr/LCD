<script lang="ts">
  import Alerte from "@/lib/components/ui/alerte.svelte";
  import BarreActionMobile from "@/lib/components/ui/barre-action-mobile.svelte";
  import ChampErreur from "@/lib/components/ui/champ-erreur.svelte";
  import EtatChargement from "@/lib/components/ui/etat-chargement.svelte";
  import FilAriane from "@/lib/components/ui/fil-ariane.svelte";
  import IndicateurEtapes from "@/lib/components/ui/indicateur-etapes.svelte";
  import RechercheGlobale from "@/lib/components/ui/recherche-globale.svelte";
  import ResumePrix from "@/lib/components/ui/resume-prix.svelte";
  import SelecteurLangue from "@/lib/components/ui/selecteur-langue.svelte";
</script>

<svelte:head>
  <title>Design system — LCD Parc</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-10 px-6 py-12">
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

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">Tableau</h2>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="w-full min-w-0 overflow-x-auto"
      role="region"
      tabindex="0"
      aria-label="Tableau de démonstration"
    >
      <table class="ui-tableau">
        <caption class="sr-only">Exemple de tableau avec badge de statut</caption>
        <thead>
          <tr><th>Logement</th><th>Ville</th><th>Statut</th></tr>
        </thead>
        <tbody>
          <tr><td>Santa Severa</td><td>Saint-Laurent-du-Var</td><td><span class="ui-badge ui-badge--ok">Actif</span></td></tr>
          <tr><td>Villa des Pins</td><td>Antibes</td><td><span class="ui-badge ui-badge--alerte">À vérifier</span></td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <nav class="ui-nav" aria-label="Navigation de démonstration">
    <a class="ui-nav-lien" href="/design" aria-current="page">Actif</a>
    <a class="ui-nav-lien" href="/design">Second</a>
    <a class="ui-nav-lien" href="/design">Troisième</a>
  </nav>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">Typographie et largeur de lecture</h2>
    <p class="ui-titre-1">Titre de niveau 1</p>
    <p class="ui-titre-2">Titre de niveau 2</p>
    <p class="ui-titre-3">Titre de niveau 3</p>
    <p class="ui-lecture text-encre-douce">
      Le texte long reste lisible : la largeur est bornée à 68 caractères, la
      hauteur de ligne et l'espacement suivent le thème actif. Aucune information
      n'est portée par la seule couleur, et le contraste respecte WCAG 2.2 AA en
      clair comme en sombre.
    </p>
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">Cibles tactiles (44 px minimum)</h2>
    <p class="text-sm text-encre-douce">
      Les boutons, liens de navigation et entrées de menu font au moins
      <code>var(--hauteur-controle)</code> de haut. Les liens dans un paragraphe
      sont exclus de cette contrainte (WCAG 2.2, 2.5.8).
    </p>
    <div class="flex flex-wrap items-center gap-3">
      <button class="ui-bouton ui-bouton--primaire" type="button">Bouton</button>
      <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="button">
        Bouton petit
      </button>
      <a class="ui-cible ui-bouton ui-bouton--fantome" href="/design">Lien cible</a>
    </div>
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">
      Publication d’un thème : procédure et garde-fous
    </h2>
    <p class="text-sm text-encre-douce">
      Un seul thème est publié pour tout le site, par un super-admin, depuis
      <code>/supervision/apparence</code>. Les seuils ci-dessous sont
      <strong>bloquants</strong> : ils sont vérifiés avant toute publication.
    </p>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="w-full min-w-0 overflow-x-auto"
      role="region"
      tabindex="0"
      aria-label="Seuils bloquants de publication d’un thème"
    >
      <table class="ui-tableau w-full">
        <caption class="sr-only">Seuils bloquants de publication d’un thème</caption>
        <thead>
          <tr>
            <th scope="col">Contrôle</th>
            <th scope="col">Seuil</th>
            <th scope="col">Vérifié par</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Contraste du texte</td>
            <td>≥ 4,5:1 (clair et sombre)</td>
            <td><code>src/lib/theme/validation.ts</code></td>
          </tr>
          <tr>
            <td>Cible tactile</td>
            <td>≥ 44 px de hauteur de contrôle</td>
            <td><code>densite.hauteurControle</code></td>
          </tr>
          <tr>
            <td>Débordement horizontal</td>
            <td>0 px à 320 px de large</td>
            <td><code>scripts/mesurer-cibles.mjs</code></td>
          </tr>
          <tr>
            <td>Violations axe</td>
            <td>0 erreur bloquante</td>
            <td><code>scripts/audit-a11y.mjs</code></td>
          </tr>
        </tbody>
      </table>
    </div>
    <ol class="list-decimal space-y-2 pl-6 text-sm text-encre-douce">
      <li>
        <strong>Préparer</strong> — choisir un thème et un accent, puis
        « Enregistrer le brouillon » dans <code>/supervision/apparence</code>.
      </li>
      <li>
        <strong>Aperçu des composants</strong> —
        <a class="ui-lien-action" href="/supervision/apparence/apercu-composants"
          >aperçu des composants critiques</a
        >
        (boutons, champs, alertes, badges, tableau, liens) en clair et en
        sombre, thème par thème.
      </li>
      <li>
        <strong>Prévisualiser</strong> — le brouillon est appliqué au site pour
        le seul super-admin, via un cookie HMAC signé valable 30 minutes.
      </li>
      <li>
        <strong>Publier</strong> — si un contraste est sous 4,5:1 ou si une
        hauteur de contrôle est sous 44 px, la publication est refusée avec le
        détail : thème, mode, paire de couleurs, ratio mesuré et correction
        attendue. Corriger le thème dans
        <code>src/domain/apparence/registre.ts</code>, réenregistrer le
        brouillon, puis republier.
      </li>
      <li>
        <strong>Revenir</strong> — chaque publication est versionnée et
        réversible ; chaque étape est auditée.
      </li>
    </ol>
    <p class="text-sm text-encre-faine">
      Contrôle en ligne de commande :
      <code>npx vitest run tests/ergonomie/</code> puis
      <code>node scripts/audit-ergonomie.mjs --verifier</code> (sortie 1 si une
      route P1 régresse). Le rapport agrégé est déposé dans
      <code>v2/.artifacts/ergonomie/rapport-ergonomie.md</code>, le contrôle des
      six thèmes dans <code>contrastes.json</code>. Lighthouse n’est pas
      installé : le rapport indique <code>lighthouse: absent</code> et rappelle
      la commande exacte à lancer plus tard.
    </p>
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">Fil d'Ariane</h2>
    <FilAriane
      elements={[
        { libelle: "Tableau de bord", href: "/hote" },
        { libelle: "Logements", href: "/hote/logements" },
        { libelle: "Santa Severa" },
      ]}
    />
    <p class="text-sm text-encre-douce">
      Dernier élément non cliquable, marqué <code>aria-current="page"</code>.
      Masqué à l'impression.
    </p>
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">Indicateur d'étapes</h2>
    <IndicateurEtapes
      active="dates"
      etapes={[
        { id: "dates", libelle: "Dates et voyageurs" },
        { id: "logement", libelle: "Logement" },
        { id: "coordonnees", libelle: "Coordonnées" },
        { id: "envoi", libelle: "Demande envoyée" },
      ]}
    />
    <p class="text-sm text-encre-douce">
      Liste ordonnée sans JavaScript : l'étape en cours porte
      <code>aria-current="step"</code> et n'est jamais signalée par la couleur
      seule. Cibles 44 px, étapes inactives non cliquables.
    </p>
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">Résumé de prix</h2>
    <ResumePrix
      nuits={7}
      voyageurs={2}
      prixNuitCentimes={12000}
      totalCentimes={84000}
      taxeCentimes={1200}
      devise="EUR"
      inclusions={["Ménage final inclus", "Draps et serviettes fournis"]}
    />
    <p class="text-sm text-encre-douce">
      <code>&lt;dl&gt;</code> avec montants formatés côté serveur (aucun
      arrondi client), note « montant indicatif » et inclusions en liste.
    </p>
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">Sélecteur de langue</h2>
    <SelecteurLangue langue="fr" />
    <p class="text-sm text-encre-douce">
      Cinq liens GET <code>?lang=xx</code> qui conservent le chemin courant,
      avec <code>hreflang</code>, <code>lang</code>, un seul
      <code>aria-current</code> et des cibles 44 px. Fonctionne sans
      JavaScript.
    </p>
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">Puces de filtre</h2>
    <div class="flex flex-wrap gap-3">
      <span class="ui-puce-active" aria-current="true">Actif</span>
      <span class="ui-puce">Inactif</span>
      <span class="ui-puce">Inactif</span>
    </div>
    <p class="text-sm text-encre-douce">
      <code>ui-puce-active</code> (accent sur accent doux, ≥ 44 px) pour l'état
      sélectionné, <code>ui-puce</code> pour les autres. Jamais de contraste
      insuffisant : la règle est <em>hors</em> de <code>@layer components</code>
      pour ne pas perdre contre les utilitaires Tailwind.
    </p>
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">Barre d'actions mobile</h2>
    <BarreActionMobile
      appelerHref="tel:+33600000000"
      appelerLibelle="Appeler"
      ecrireHref="mailto:contact@lcd.test"
      ecrireLibelle="Écrire"
      guideHref="/aide"
      guideLibelle="Guide"
    />
    <p class="text-sm text-encre-douce">
      Visible sous <code>md</code> uniquement (<code>md:hidden</code>), jamais à
      l'impression, avec réserve d'espace dans le flux pour ne pas recouvrir le
      contenu et gestion de <code>env(safe-area-inset-bottom)</code>.
    </p>
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">Recherche globale</h2>
    <RechercheGlobale libelle="Rechercher (référence, logement, voyageur)" />
    <p class="text-sm text-encre-douce">
      Formulaire GET natif, soumettable sans JavaScript, cible 44 px.
    </p>
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">Erreurs et états</h2>
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <label class="ui-label" for="design-email">Courriel</label>
        <input
          class="ui-champ"
          id="design-email"
          aria-describedby="design-email-erreur"
          aria-invalid="true"
          value="adresse-incomplete"
        />
        <ChampErreur
          id="design-email-erreur"
          message="Cette adresse est incomplète : ajoutez le domaine après le arobase."
        />
      </div>
      <div class="space-y-2">
        <p class="ui-label">Chargement</p>
        <EtatChargement libelle="Chargement des factures" lignes={3} />
      </div>
    </div>
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">Alertes (composant)</h2>
    <Alerte ton="info">Information neutre.</Alerte>
    <Alerte ton="ok">Opération réussie.</Alerte>
    <Alerte ton="attention">Attention requise.</Alerte>
    <Alerte ton="danger">Erreur bloquante annoncée immédiatement.</Alerte>
  </section>
</main>
