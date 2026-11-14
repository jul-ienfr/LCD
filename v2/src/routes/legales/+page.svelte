<script lang="ts">
  import type { PageData } from "./$types";
  import {
    LIBELLES_NATURE,
    LIBELLES_REGIME,
    LIBELLES_TVA,
  } from "@/domain/entite";

  let { data }: { data: PageData } = $props();

  const libelle = (
    table: Record<string, string>,
    valeur: string | null | undefined,
  ) => (valeur ? (table[valeur] ?? valeur) : "—");

  const contactPublic = $derived(
    data.identite.emailContact ||
      data.identite.telephoneContact ||
      data.identite.adresseContact,
  );
  const sirenManquant = $derived(!data.editeur?.siren);
  const adresseManquante = $derived(!data.editeur?.adresse);
</script>

<svelte:head>
  <title>Mentions légales &amp; CGV — LCD Parc</title>
  <meta
    name="description"
    content="Éditeur de la plateforme, mandat de conciergerie, données personnelles et mentions LCEN."
  />
</svelte:head>

<main id="contenu" class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Transparence · LCEN art. 6 III · RGPD
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">Mentions légales &amp; CGV</h1>
    <p class="text-encre-douce">
      Les informations ci-dessous proviennent du registre réel de
      l’établissement. Ce qui n’est pas renseigné est affiché « à compléter » :
      aucun numéro ni éditeur n’est inventé.
    </p>
  </header>

  <section class="ui-carte space-y-3">
    <h2 class="text-xl font-semibold">Éditeur de la plateforme</h2>
    {#if !data.editeur}
      <p class="rounded-controle border border-bordure bg-fond px-4 py-3 text-sm text-encre-douce">
        Aucun éditeur actif n’est configuré pour cet espace. Renseignez l’entité
        juridique depuis l’espace hôte avant d’exploiter la plateforme.
      </p>
    {:else}
      <dl class="grid gap-3 text-sm sm:grid-cols-2">
        <div><dt class="text-encre-faine">Dénomination</dt><dd class="font-medium">{data.editeur.nom}</dd></div>
        <div><dt class="text-encre-faine">Forme juridique</dt><dd>{libelle(LIBELLES_NATURE, data.editeur.nature)}</dd></div>
        <div><dt class="text-encre-faine">Régime fiscal</dt><dd>{libelle(LIBELLES_REGIME, data.editeur.regime)}</dd></div>
        <div><dt class="text-encre-faine">TVA</dt><dd>{libelle(LIBELLES_TVA, data.editeur.tva)}</dd></div>
        <div>
          <dt class="text-encre-faine">SIREN</dt>
          <dd class={sirenManquant ? "text-encre-faine" : "tabular-nums"}>
            {data.editeur.siren ?? "À compléter"}
          </dd>
        </div>
        <div>
          <dt class="text-encre-faine">Adresse</dt>
          <dd class={adresseManquante ? "text-encre-faine" : ""}>
            {data.editeur.adresse ?? "À compléter"}
          </dd>
        </div>
        {#if contactPublic}
          <div class="sm:col-span-2">
            <dt class="text-encre-faine">Contact</dt>
            <dd class="flex flex-wrap gap-x-4 gap-y-1">
              {#if data.identite.emailContact}
                <a class="ui-lien-action" href={`mailto:${data.identite.emailContact}`}>
                  {data.identite.emailContact}
                </a>
              {/if}
              {#if data.identite.telephoneContact}
                <a
                  class="ui-lien-action"
                  href={`tel:${data.identite.telephoneContact.replace(/[^+0-9]/gu, "")}`}
                >
                  {data.identite.telephoneContact}
                </a>
              {/if}
              {#if data.identite.adresseContact}
                <span>{data.identite.adresseContact}</span>
              {/if}
            </dd>
          </div>
        {/if}
      </dl>
      {#if sirenManquant || adresseManquante}
        <p class="rounded-controle border border-bordure bg-fond px-4 py-3 text-sm text-encre-douce">
          Mentions incomplètes : le SIREN et l’adresse de l’éditeur sont
          obligatoires pour une exploitation commerciale (LCEN). Ils seront
          affichés dès leur saisie dans l’espace hôte.
        </p>
      {/if}
      {#if data.editeur.mentionsLegales}
        <div class="space-y-1 border-t border-bordure pt-3 text-sm">
          <h3 class="font-medium">Mentions complémentaires</h3>
          <p class="whitespace-pre-line text-encre-douce">{data.editeur.mentionsLegales}</p>
        </div>
      {/if}
    {/if}
  </section>

  <section class="ui-carte space-y-3">
    <h2 class="text-xl font-semibold">Mandat de conciergerie</h2>
    <p class="text-sm text-encre-douce">
      La plateforme distingue deux modes d’exploitation : la gestion en propre
      (l’hôte est propriétaire ou mandataire de ses logements) et le mandat de
      conciergerie (un tiers gère les logements pour le compte d’un
      propriétaire). Le périmètre, la durée, la commission et les obligations de
      chaque partie sont fixés dans le contrat signé entre les parties. Cette
      page n’est pas un mandat et ne vaut pas acceptation des CGV.
    </p>
    <p class="text-sm text-encre-douce">
      Les documents contractuels et les factures sont émis depuis la plateforme
      avec l’identité de l’éditeur ci-dessus. Toute réservation reste soumise à
      la disponibilité réelle du logement et aux conditions du séjour.
    </p>
    <p class="text-sm text-encre-douce">
      Forfaits indicatifs par logement et par mois : <strong>Kit 149 €</strong>
      (plancher), <strong>Pilotage 190 €</strong>,
      <strong>Full service 290 €</strong>, hors extras facturés au réel. La
      commission de conciergerie est déduite avant reversement au propriétaire ;
      aucun cumul de commissions plateforme n’est appliqué. Les relevés de
      l’espace propriétaire sont indicatifs : le rapprochement comptable et sa
      validation restent du ressort de l’expert-comptable.
    </p>
  </section>

  <section class="ui-carte space-y-3">
    <h2 class="text-xl font-semibold">Cookies et mesure d’audience</h2>
    <p class="text-sm text-encre-douce">
      Les cookies strictement nécessaires restent actifs : session authentifiée,
      protection des formulaires (CSRF), préférence d’affichage « version
      légère » et file d’attente hors ligne des signalements voyageur. Ils ne
      requièrent pas de consentement.
    </p>
    <p class="text-sm text-encre-douce">
      Avec votre accord, le site peut enregistrer des événements de navigation
      (pages vues, clics, soumissions, conversions et campagnes) dans un journal
      first-party pseudonymisé, et charger des outils de mesure d’audience
      (Google Analytics, Matomo, Plausible) ainsi que des pixels publicitaires
      (Meta, Google Ads, TikTok) configurés par l’hôte. L’adresse IP n’est
      jamais stockée en clair : seule une empreinte salée est conservée. Le
      journal est purgé au-delà de 13 mois.
    </p>
    <p class="text-sm text-encre-douce">
      Vous pouvez accepter, refuser ou modifier vos choix à tout moment depuis
      <a class="inline-flex min-h-11 items-center underline" href="/consentement">la page de préférences</a>. Le
      refus ne bloque pas l’accès au site. En l’absence de choix, aucun traceur
      non essentiel n’est chargé.
    </p>
  </section>

  <section class="ui-carte space-y-3">
    <h2 class="text-xl font-semibold">Médiation de la consommation</h2>
    <p class="text-sm text-encre-douce">
      En cas de litige non résolu par une réclamation écrite préalable, le
      consommateur peut recourir gratuitement à un médiateur de la consommation.
      {#if data.mediateur}
        Le médiateur désigné par l’éditeur est
        <strong>{data.mediateur.nom}</strong>{#if data.mediateur.adresse}
          , {data.mediateur.adresse}{/if}{#if data.mediateur.url}
          — <a class="ui-lien-action" href={data.mediateur.url} rel="noopener noreferrer">{data.mediateur.url}</a>{/if}.
      {:else}
        Le médiateur n’est pas encore désigné : le consommateur peut saisir le
        médiateur compétent pour le secteur du tourisme ou, en dernier recours,
        les tribunaux compétents.
      {/if}
      Les voies de recours amiables restent gratuites pour le consommateur.
    </p>
    <p class="text-sm text-encre-douce">
      Cette page ne constitue ni un mandat ni une acceptation des conditions
      générales : les CGV complètes sont remises et signées avec le contrat
      écrit.
    </p>
  </section>

  <section class="ui-carte space-y-3">
    <h2 class="text-xl font-semibold">Données personnelles &amp; RGPD</h2>
    <p class="text-sm text-encre-douce">
      Les données collectées servent à gérer les séjours, les contrats, la
      facturation, la relation avec les voyageurs, les propriétaires et les
      prestataires, ainsi qu’à la sécurité des comptes. Les bases légales sont
      l’exécution du contrat, l’obligation légale (comptabilité, fiscalité) et
      l’intérêt légitime (sécurité, prévention de la fraude).
    </p>
    <ul class="list-disc space-y-1 pl-5 text-sm text-encre-douce">
      <li>Factures et pièces comptables : conservées 10 ans (obligation légale).</li>
      <li>Journaux techniques et d’audit : durée limitée, consultables par les administrateurs habilités.</li>
      <li>Sessions : conservées jusqu’à expiration ou fermeture explicite ; les autres sessions peuvent être révoquées depuis la page Sécurité.</li>
      <li>Aucune donnée de carte bancaire n’est stockée par la plateforme ; les prestataires de paiement traitent les transactions.</li>
    </ul>
    <p class="text-sm text-encre-douce">
      Vous pouvez demander l’accès, la rectification, l’effacement ou la
      portabilité de vos données, et vous opposer à certains traitements. Les
      demandes sont tracées dans le registre RGPD de l’établissement. En cas de
      désaccord, vous pouvez saisir la CNIL.
    </p>
  </section>

  <section class="ui-carte space-y-3">
    <h2 class="text-xl font-semibold">État de l’édition (LCEN)</h2>
    <p class="text-sm text-encre-douce">
      Cette instance est une édition beta. Elle est hébergée par le prestataire
      d’infrastructure de l’éditeur ; l’emplacement de la base de données est
      précisé dans la politique de confidentialité. Les notifications e-mail
      peuvent être désactivées et aucun encaissement de paiement n’est réalisé
      par la plateforme tant que l’éditeur n’a pas complété ses obligations
      (SIREN, assurance, carte professionnelle lorsque requise).
    </p>
    <p class="text-sm text-encre-douce">
      Une réservation effectuée sur cette édition ne constitue pas un engagement
      ferme tant que le contrat et les conditions du séjour ne sont pas confirmés
      par l’éditeur.
    </p>
  </section>

  <footer class="flex flex-wrap items-center justify-between gap-3 text-sm text-encre-faine">
    <p>Version du {new Date().toISOString().slice(0, 10)}.</p>
    <div class="flex flex-wrap gap-4">
      <a class="ui-lien-action inline-flex min-h-11 min-w-11 items-center justify-center" href="/aide">Aide</a>
      <a class="ui-lien-action inline-flex min-h-11 items-center" href="/">Retour à l’accueil</a>
    </div>
  </footer>
</main>
