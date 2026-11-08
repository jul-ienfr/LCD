<svelte:head>
  <title>Aide — LCD Parc</title>
  <meta
    name="description"
    content="Rôles, espaces, fonctionnement hors ligne et limites connues de la plateforme LCD."
  />
</svelte:head>

<main class="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
  <header class="space-y-3">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Centre d’aide
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">
      Comment fonctionne la plateforme
    </h1>
    <p class="max-w-2xl text-encre-douce">
      Un seul système pour l’hôte, le voyageur, le propriétaire et le
      prestataire. Les pages publiques et l’espace voyageur restent consultables
      sans JavaScript ; les formulaires sont de vrais formulaires HTML.
    </p>
  </header>

  <section class="space-y-3">
    <h2 class="text-xl font-semibold">Les 7 rôles</h2>
    <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
      <table class="ui-tableau">
        <thead>
          <tr><th>Rôle</th><th>Accès</th></tr>
        </thead>
        <tbody>
          {#each [
            ["Super-administrateur", "Apparence globale, supervision de la plateforme et journal d’audit, en plus des droits d’administration."],
            ["Administrateur", "Paramétrage de l’établissement, utilisateurs, sécurité, intégrations, facturation et pilotage complet."],
            ["Hôte", "Logements, planning, prix, ménage, messages, avis, états des lieux et opérations du quotidien."],
            ["Comptable", "Factures, paiements, exports comptables et paramètres fiscaux, sans accès aux autres modules."],
            ["Prestataire", "Missions assignées, pointage, photos avant/après et clôture des interventions."],
            ["Propriétaire", "Relevé de ses logements, charges, commissions et documents, en lecture seule."],
            ["Commercial", "Prospects, pipeline, simulateur de rentabilité et offres, sans accès à l’exploitation."]
          ] as [role, acces]}
            <tr><td class="font-medium">{role}</td><td class="text-encre-douce">{acces}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="text-sm text-encre-douce">
      Un utilisateur peut cumuler plusieurs rôles. Les droits sont revérifiés à
      chaque action côté serveur, pas seulement à l’affichage.
    </p>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-semibold">Les espaces</h2>
    <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
      <table class="ui-tableau">
        <thead>
          <tr><th>Adresse</th><th>Rôles</th><th>Contenu</th></tr>
        </thead>
        <tbody>
          {#each [
            ["/hote", "Administrateur, hôte", "Tableau de bord : indicateurs, arrivées et départs, tâches du jour, raccourcis."],
            ["/hote/logements", "Administrateur, hôte", "Fiches logements, équipements, accès, propriétaires et conformité des annonces."],
            ["/hote/planning", "Administrateur, hôte", "Calendrier des séjours, blocages, imports ICS et résolution des conflits."],
            ["/hote/menage", "Administrateur, hôte, prestataire", "Ménages à faire, checklists, preuves photo, temps pointé et clôture."],
            ["/reserver", "Public", "Demande de réservation directe, devis et disponibilités."],
            ["/voyageur", "Voyageur (lien signé)", "Guide du séjour, accès, messages, incidents et questionnaire de départ, sans compte."],
            ["/supervision/apparence", "Super-administrateur", "Thème global unique, identité, aperçu signé, publication et retour arrière."]
          ] as [chemin, roles, contenu]}
            <tr>
              <td class="font-mono text-xs">{chemin}</td>
              <td class="text-encre-douce">{roles}</td>
              <td class="text-encre-douce">{contenu}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="ui-carte space-y-3">
    <h2 class="text-xl font-semibold">Hors ligne et vieux téléphones</h2>
    <p class="text-sm text-encre-douce">
      L’espace voyageur et les pages publiques sont rendus côté serveur : ils
      s’affichent sans JavaScript et sans installation. Une fois la page ouverte,
      le contenu déjà chargé reste consultable si le réseau tombe ; les écritures
      rejouables sont mises en file avec une référence stable pour éviter les
      doublons au retour du réseau.
    </p>
    <p class="text-sm text-encre-douce">
      Les documents sensibles (contrats, factures, liens voyageur) reposent sur
      des liens signés à durée limitée : ne les transférez pas à des tiers.
    </p>
  </section>

  <section class="ui-carte space-y-3">
    <h2 class="text-xl font-semibold">Ce qui est réel — et les limites</h2>
    <ul class="list-disc space-y-1 pl-5 text-sm text-encre-douce">
      <li>
        Les réservations, contrats, factures, paiements, ménages et incidents sont
        enregistrés en base et tracés dans le journal d’audit.
      </li>
      <li>
        Aucune écriture n’est envoyée automatiquement aux plateformes de
        réservation : les calendriers ICS sont importés en lecture seule et les
        conflits sont signalés.
      </li>
      <li>
        Aucun encaissement de carte bancaire n’est réalisé par la plateforme : les
        cautions et paiements sont suivis, pas débités.
      </li>
      <li>
        L’envoi d’e-mails dépend de la configuration de l’établissement ; il peut
        être désactivé.
      </li>
      <li>
        L’instance est mono-établissement et n’utilise pas encore de canal de
        synchronisation bidirectionnel avec les OTA.
      </li>
    </ul>
  </section>

  <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-bordure pt-4 text-sm text-encre-faine">
    <div class="flex flex-wrap gap-4">
      <a class="ui-lien" href="/legales">Mentions légales &amp; CGV</a>
      <a class="ui-lien" href="/reserver">Réserver un séjour</a>
    </div>
    <a class="ui-lien" href="/">Retour à l’accueil</a>
  </footer>
</main>
