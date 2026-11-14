<script lang="ts">
  import EntetePublique from "@/lib/components/entete-publique.svelte";
  import Alerte from "@/lib/components/ui/alerte.svelte";
  import BarreActionMobile from "@/lib/components/ui/barre-action-mobile.svelte";
  import ChampErreur from "@/lib/components/ui/champ-erreur.svelte";
  import FilAriane from "@/lib/components/ui/fil-ariane.svelte";
  import IndicateurEtapes from "@/lib/components/ui/indicateur-etapes.svelte";
  import ResumePrix from "@/lib/components/ui/resume-prix.svelte";
  import { traductionsReservation } from "@/lib/i18n/public/reservation";
  import { srcsetLogement } from "@/lib/photos-logement";
  import type { ActionData, PageData } from "./$types";

  /**
   * Tunnel de réservation directe (T037) : deux étapes explicites sur une seule
   * page, utilisables sans JavaScript.
   *
   * 1. dates et logement — formulaire GET, le prix se calcule côté serveur ;
   * 2. coordonnées et demande — formulaire POST, récapitulatif collant sur
   *    desktop et barre d'action fixe sur mobile.
   *
   * Les erreurs viennent du serveur sous forme de codes : la page les traduit
   * et propose toujours une sortie (revenir aux dates, réessayer, aide).
   */
  let { data, form }: { data: PageData; form: ActionData } = $props();

  const t = $derived(traductionsReservation(data.langue));

  const LOCALES: Record<string, string> = {
    fr: "fr-FR",
    en: "en-GB",
    it: "it-IT",
    es: "es-ES",
    de: "de-DE",
  };
  const formatJour = $derived(
    new Intl.DateTimeFormat(LOCALES[data.langue] ?? "fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }),
  );

  /**
   * Les `fail()` du serveur renvoient soit des erreurs par champ, soit une
   * erreur globale seule : on normalise en dictionnaire pour indexer sans
   * élargir le contrat côté serveur.
   */
  const erreurs = $derived<Record<string, string | undefined>>(
    (form?.erreurs ?? {}) as Record<string, string | undefined>,
  );
  const valeurs = $derived(form?.valeurs ?? null);
  const champDates = $derived(data.champDevis);

  /** Message d'erreur de dates à partir du code renvoyé par le serveur. */
  function messageDates(code: string | null): string | null {
    switch (code) {
      case "ARRIVEE_PASSEE":
        return t.erreurArriveePasse;
      case "DEPART_AVANT":
        return t.erreurDepartAvantArrivee;
      case "ARRIVEE_LOINTAINE":
        return t.erreurArriveeLointaine;
      case "SEJOUR_TROP_LONG":
        return t.erreurSejourTropLong;
      case "TARIF_MANQUANT":
        return t.erreurTarifManquant;
      case "DATES_INVALIDES":
      case "DATE_INVALIDE":
      case "PRIX_INVALIDE":
        return t.erreurDatesInvalides;
      default:
        // Tout autre refus de dates reste expliqué, sans jargon technique.
        return code ? t.erreurDatesInvalides : null;
    }
  }

  /** Message d'erreur d'envoi à partir du code renvoyé par l'action. */
  function messageEnvoi(code: string | undefined): string | null {
    switch (code) {
      case "NOM_INVALIDE":
        return t.erreurNom;
      case "EMAIL_INVALIDE":
        return t.erreurEmail;
      case "LOGEMENT_INTROUVABLE":
      case "TENANT_INVALIDE":
        return t.erreurLogement;
      case "RESERVATION_CHEVAUCHE":
      case "SEJOUR_NON_AUTORISE":
        return t.erreurSejour;
      case "CUTOFF":
        return t.erreurCutoff;
      case "VOYAGEURS_INVALIDE":
        return t.erreurVoyageurs;
      case "TARIF_MANQUANT":
        return t.erreurTarifManquant;
      case "SITE_INDISPONIBLE":
        return t.indisponibleTexte;
      case "VENTES_SUSPENDUES":
        return t.ventesSuspenduesTexte;
      default:
        return code ? t.erreurGenerique : null;
    }
  }

  const erreurDates = $derived(messageDates(data.erreurDevis));
  const erreurEnvoi = $derived(messageEnvoi(erreurs.global));
  const suffixeLangue = $derived(
    data.langue === "fr" ? "" : `&lang=${encodeURIComponent(data.langue)}`,
  );

  /** Format court et lisible d'une nuit : la date ISO ne sert qu'au récapitulatif. */
  function jourCourt(date: string): string {
    const valeur = new Date(`${date}T12:00:00Z`);
    return Number.isNaN(valeur.getTime()) ? date : formatJour.format(valeur);
  }

  /** Phrase d'estimation : construite d'un bloc, jamais coupée par un élément. */
  const phraseEstimation = $derived(
    data.devis
      ? `${data.devis.nuits} ${data.devis.nuits > 1 ? t.nuits : t.nuit} · ${data.devis.total} ${t.estime}`
      : "",
  );
  const phraseDates = $derived(`${t.dateDu} ${data.debut} ${t.dateAu} ${data.fin}`);

  const lienListe = $derived(
    `/reserver?tenant=${encodeURIComponent(data.slug)}${suffixeLangue}`,
  );
  const lienRecapitulatif = $derived(
    data.reservationOk
      ? `/reserver/${encodeURIComponent(data.reservationOk.ref)}?tenant=${encodeURIComponent(data.slug)}${suffixeLangue}`
      : lienListe,
  );
</script>

<svelte:head>
  <title>
    {data.indisponible
      ? `${t.indisponibleTitre} — LCD`
      : `${t.titre} — ${data.tenant?.nom ?? "LCD"}`}
  </title>
  <meta name="description" content={t.intro} />
</svelte:head>

<EntetePublique
  nom={data.tenant?.nom ?? "Réservation"}
  langue={data.langue}
  retourHref="/"
  retourLibelle={t.arianeAccueil}
/>

<main id="contenu" class="mx-auto max-w-5xl space-y-8 px-6 py-10">
  <FilAriane
    libelle={t.filAriane}
    elements={[
      { libelle: t.arianeAccueil, href: "/" },
      { libelle: t.arianeReserver },
    ]}
  />

  {#if data.indisponible || !data.tenant}
    <header class="space-y-4">
      <h1 class="text-3xl font-semibold tracking-tight">{t.indisponibleTitre}</h1>
      <p class="text-encre-douce">{t.indisponibleTexte}</p>
      <a class="ui-bouton ui-bouton--secondaire" href="/">{t.retourAccueil}</a>
    </header>
  {:else}
    <header class="space-y-3">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {data.tenant.nom} · {t.surtitre}
      </p>
      <h1 class="text-4xl font-semibold tracking-tight">{t.titre}</h1>
      <p class="max-w-2xl text-encre-douce">{t.intro}</p>
    </header>

    {#if data.reservationOk}
      <section
        class="ui-carte border-accent bg-accent-douce text-accent-fonce"
        role="status"
      >
        <h2 class="text-lg font-semibold">{t.demandeEnregistree}</h2>
        <p class="mt-2 text-sm">
          {t.referenceTitre} :
          <strong>{data.reservationOk.ref}</strong> · {data.reservationOk.debut}
          → {data.reservationOk.fin} · {data.reservationOk.montant}
        </p>
        <p class="mt-2 text-sm">{t.demandeEnregistreeTexte}</p>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <a class="ui-bouton ui-bouton--primaire" href={lienRecapitulatif}>
            {t.voirRecapitulatif}
          </a>
          {#if data.reservationOk.lienVoyageur}
            <a
              class="ui-bouton ui-bouton--secondaire"
              href={data.reservationOk.lienVoyageur}
            >
              {t.ouvrirEspaceSejour}
            </a>
          {/if}
        </div>
      </section>
    {/if}

    {#if data.ventesSuspendues}
      <Alerte ton="attention">
        <strong>{t.ventesSuspenduesTitre}</strong> — {t.ventesSuspenduesTexte}
      </Alerte>
    {/if}

    {#if data.erreur}
      <Alerte ton="attention">{data.erreur}</Alerte>
    {/if}

    {#if erreurEnvoi}
      <Alerte ton="danger">
        {erreurEnvoi}
        <span class="mt-3 flex flex-wrap items-center gap-3">
          {#if data.devis}
            <button
              class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
              type="submit"
              form="demande-reservation"
            >
              {t.reessayer}
            </button>
            <a class="ui-lien-action text-sm" href="#etape-1">{t.revenirDates}</a>
          {/if}
          <a class="ui-lien-action text-sm" href="/aide">{t.contacterHote}</a>
        </span>
      </Alerte>
    {/if}

    {#if !data.logement}
      <section class="space-y-4" aria-labelledby="titre-logements">
        <h2 id="titre-logements" class="text-xl font-semibold">
          {t.nosLogements}
        </h2>
        {#if data.logements.length === 0}
          <p class="ui-carte border-dashed text-encre-douce">{t.aucunLogement}</p>
        {:else}
          <ul class="grid gap-5 sm:grid-cols-2">
            {#each data.logements as logement, index (logement.id)}
              <li class="ui-carte ui-carte--liee ui-carte--media overflow-hidden">
                <a
                  class="block"
                  href={`/reserver?tenant=${encodeURIComponent(data.slug)}&logement=${logement.id}${suffixeLangue}`}
                >
                  <div class="ui-photo aspect-[4/3] overflow-hidden bg-surface-2">
                    <img
                      class="h-full w-full object-cover"
                      src={logement.photo}
                      srcset={srcsetLogement(logement.photo)}
                      sizes="(min-width: 640px) 46vw, 92vw"
                      alt={logement.nom}
                      width="1000"
                      height="750"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchpriority={index === 0 ? "high" : "auto"}
                      decoding="async"
                    />
                  </div>
                  <div class="space-y-2 p-4">
                    <h3 class="text-lg font-semibold">{logement.nom}</h3>
                    {#if logement.adresse}
                      <p class="text-sm text-encre-douce">{logement.adresse}</p>
                    {/if}
                    {#if logement.moyenne !== null}
                      <p class="text-sm">
                        <span class="text-accent">★</span>
                        {logement.moyenne}/5 · {logement.avis}
                        {t.avisSuffixe}
                      </p>
                    {/if}
                    <span class="ui-bouton ui-bouton--secondaire ui-bouton--petit">
                      {t.voirDisponibilites}
                    </span>
                  </div>
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {:else}
      <IndicateurEtapes
        langue={data.langue}
        libelle={t.etapesNom}
        active={data.devis ? "coordonnees" : "dates"}
        etapes={[
          { id: "dates", libelle: t.etape1 },
          { id: "coordonnees", libelle: t.etape2 },
        ]}
      />

      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div class="space-y-8">
          <section
            id="etape-1"
            class="ui-carte space-y-5"
            aria-labelledby="titre-etape-1"
          >
            <div>
              <h2 id="titre-etape-1" class="text-xl font-semibold">
                {t.titreEtape1}
              </h2>
              <p class="mt-1 text-sm text-encre-douce">{t.aideEtape1}</p>
            </div>

            {#if data.logement.photo}
              <div class="ui-photo overflow-hidden rounded-3xl">
                <img
                  class="aspect-[16/8] w-full object-cover"
                  src={data.logement.photo}
                  srcset={srcsetLogement(data.logement.photo)}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  alt={data.logement.nom}
                  width="1400"
                  height="700"
                  fetchpriority="high"
                  decoding="async"
                />
              </div>
            {/if}

            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 class="text-lg font-semibold">{data.logement.nom}</h3>
                {#if data.logement.adresse}
                  <p class="text-sm text-encre-douce">{data.logement.adresse}</p>
                {/if}
              </div>
              <a class="ui-lien-action text-sm" href={lienListe}>{t.changerLogement}</a>
            </div>

            <form class="grid gap-3 sm:grid-cols-4" method="GET">
              <input type="hidden" name="tenant" value={data.slug} />
              <input type="hidden" name="logement" value={data.logement.id} />
              <input
                type="hidden"
                name="utm_source"
                value={data.attribution.utm_source}
              />
              <input
                type="hidden"
                name="utm_medium"
                value={data.attribution.utm_medium}
              />
              <input
                type="hidden"
                name="utm_campaign"
                value={data.attribution.utm_campaign}
              />
              <input type="hidden" name="widget" value={data.attribution.widget} />
              <input type="hidden" name="code" value={data.attribution.code} />
              <input type="hidden" name="lang" value={data.langue} />
              <label class="space-y-2">
                <span class="ui-label">{t.arrivee}</span>
                <input
                  class="ui-champ"
                  name="debut"
                  type="date"
                  min={data.dateMin}
                  max={data.dateMax}
                  value={data.debut}
                  required
                  aria-invalid={champDates === "debut" ? "true" : undefined}
                  aria-describedby={champDates === "debut"
                    ? "erreur-debut"
                    : undefined}
                />
                <ChampErreur
                  id="erreur-debut"
                  message={champDates === "debut" ? (erreurDates ?? "") : ""}
                />
              </label>
              <label class="space-y-2">
                <span class="ui-label">{t.depart}</span>
                <input
                  class="ui-champ"
                  name="fin"
                  type="date"
                  min={data.dateMin}
                  max={data.dateMax}
                  value={data.fin}
                  required
                  aria-invalid={champDates === "fin" ? "true" : undefined}
                  aria-describedby={champDates === "fin" ? "erreur-fin" : undefined}
                />
                <ChampErreur
                  id="erreur-fin"
                  message={champDates === "fin" ? (erreurDates ?? "") : ""}
                />
              </label>
              <label class="space-y-2">
                <span class="ui-label">{t.voyageurs}</span>
                <input
                  class="ui-champ"
                  name="voyageurs"
                  type="number"
                  min="1"
                  max="20"
                  value={data.voyageurs}
                />
              </label>
              <div class="flex items-end">
                <button class="ui-bouton ui-bouton--primaire w-full" type="submit">
                  {t.calculerPrix}
                </button>
              </div>
            </form>

            <p class="text-xs text-encre-faine">{t.aideDates}</p>

            {#if erreurDates && !champDates}
              <Alerte ton="attention">
                {erreurDates}
                <a class="ui-lien-action" href="/aide">{t.contacterHote}</a>
              </Alerte>
            {/if}
            {#if erreurDates && champDates}
              <p class="text-sm">
                <a class="ui-lien-action" href="/aide">{t.contacterHote}</a>
              </p>
            {/if}
          </section>

          {#if data.devis}
            <section
              id="etape-2"
              class="ui-carte space-y-5"
              aria-labelledby="titre-etape-2"
            >
              <div>
                <h2 id="titre-etape-2" class="text-xl font-semibold">
                  {t.titreEtape2}
                </h2>
                <p class="mt-1 text-sm text-encre-douce">{t.aideEtape2}</p>
              </div>

              <form id="demande-reservation" method="POST" class="space-y-4">
                <input type="hidden" name="tenant" value={data.slug} />
                <input type="hidden" name="logementId" value={data.logement.id} />
                <input type="hidden" name="debut" value={data.debut} />
                <input type="hidden" name="fin" value={data.fin} />
                <input type="hidden" name="voyageurs" value={data.voyageurs} />
                <input type="hidden" name="ref" value={data.refFormulaire} />
                <input type="hidden" name="source" value={data.source} />
                <input
                  type="hidden"
                  name="utm_source"
                  value={data.attribution.utm_source}
                />
                <input
                  type="hidden"
                  name="utm_medium"
                  value={data.attribution.utm_medium}
                />
                <input
                  type="hidden"
                  name="utm_campaign"
                  value={data.attribution.utm_campaign}
                />
                <input
                  type="hidden"
                  name="widget"
                  value={data.attribution.widget}
                />
                <input type="hidden" name="code" value={data.attribution.code} />
                <input type="hidden" name="lang" value={data.langue} />

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="ui-label" for="nom">{t.nomComplet}</label>
                    <input
                      id="nom"
                      class="ui-champ"
                      name="nom"
                      autocomplete="name"
                      required
                      minlength="2"
                      value={valeurs?.nom ?? ""}
                      aria-invalid={erreurs.nom ? "true" : undefined}
                      aria-describedby={erreurs.nom ? "erreur-nom" : undefined}
                    />
                    <ChampErreur
                      id="erreur-nom"
                      message={messageEnvoi(erreurs.nom) ?? ""}
                    />
                  </div>
                  <div>
                    <label class="ui-label" for="email">{t.email}</label>
                    <input
                      id="email"
                      class="ui-champ"
                      name="email"
                      type="email"
                      autocomplete="email"
                      required
                      value={valeurs?.email ?? ""}
                      aria-invalid={erreurs.email ? "true" : undefined}
                      aria-describedby={erreurs.email ? "erreur-email" : undefined}
                    />
                    <ChampErreur
                      id="erreur-email"
                      message={messageEnvoi(erreurs.email) ?? ""}
                    />
                  </div>
                </div>

                <label class="hidden" aria-hidden="true">
                  <span>Site</span>
                  <input name="site" tabindex="-1" autocomplete="off" />
                </label>

                <button
                  class="ui-bouton ui-bouton--primaire w-full max-md:hidden"
                  type="submit"
                >
                  {t.envoyerDemande}
                </button>
                <p class="text-xs text-encre-faine">{t.aucunPaiement}</p>
              </form>

              <div class="rounded-controle border border-bordure bg-surface2 p-4">
                <h3 class="text-sm font-semibold">{t.suiteTitre}</h3>
                <ol class="mt-2 space-y-1 text-sm text-encre-douce">
                  <li>{t.suite1}</li>
                  <li>{t.suite2}</li>
                  <li>{t.suite3}</li>
                </ol>
              </div>
            </section>
          {/if}

          {#if data.avis.length > 0}
            <section class="space-y-3" id="avis">
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <h2 class="text-lg font-semibold">{t.avisTitre}</h2>
                <p class="text-sm text-encre-douce">
                  {data.moyenneLogement}/5 · {data.avis.length} {t.avisSuffixe}
                </p>
              </div>
              <ul class="space-y-3">
                {#each data.avis as avis (avis.id)}
                  <li class="ui-carte space-y-2">
                    <p class="font-medium">{avis.nom}</p>
                    <p class="text-sm">
                      {"★".repeat(avis.note)}<span class="text-encre-faine"
                        >{"★".repeat(5 - avis.note)}</span
                      >
                    </p>
                    <p class="text-xs text-encre-faine">{avis.date}</p>
                    {#if avis.commentaire}
                      <p class="whitespace-pre-line text-sm text-encre-douce">
                        {avis.commentaire}
                      </p>
                    {/if}
                  </li>
                {/each}
              </ul>
            </section>
          {/if}
        </div>

        {#if data.devis}
          <aside
            class="space-y-5 lg:sticky lg:top-24 lg:self-start"
            aria-labelledby="titre-recap"
          >
            <div class="ui-carte space-y-4">
              <h2 id="titre-recap" class="text-lg font-semibold">
                {t.resumeTitre}
              </h2>
              <dl class="grid gap-2 text-sm">
                <div class="flex items-baseline justify-between gap-4">
                  <dt class="text-encre-douce">{t.resumeDates}</dt>
                  <dd class="text-right font-semibold">{phraseDates}</dd>
                </div>
                <div class="flex items-baseline justify-between gap-4">
                  <dt class="text-encre-douce">{t.resumeVoyageurs}</dt>
                  <dd class="font-semibold tabular-nums">{data.voyageurs}</dd>
                </div>
                <div class="flex items-baseline justify-between gap-4">
                  <dt class="text-encre-douce">{t.resumeLogement}</dt>
                  <dd class="text-right font-semibold">{data.logement.nom}</dd>
                </div>
              </dl>

              <p
                class="rounded-controle border border-bordure bg-surface2 p-3 text-sm font-semibold"
              >
                {phraseEstimation}
              </p>

              <ResumePrix
                nuits={data.devis.nuits}
                voyageurs={data.voyageurs}
                prixNuitCentimes={data.devis.prixNuitCentimes}
                totalCentimes={data.devis.totalCentimes}
                taxeCentimes={data.taxe?.montantCentimes}
                langue={data.langue}
              />

              {#if data.taxe}
                <p class="text-xs text-encre-douce">
                  {t.taxeDueAvant}
                  <strong>{data.taxe.montant}</strong>
                  {t.taxeDueApres}
                </p>
              {:else}
                <p class="text-xs text-encre-douce">{t.taxeNonApplicable}</p>
              {/if}

              <a class="ui-lien-action text-sm" href="#etape-1">{t.modifierDates}</a>
            </div>

            <div class="ui-carte space-y-3">
              <h2 class="text-sm font-semibold uppercase tracking-widest text-encre-faine">
                {t.inclusTitre}
              </h2>
              <ul class="space-y-1 text-sm">
                <li>{t.inclusionNuitees}</li>
                <li>{t.inclusionSansPaiement}</li>
                <li>{t.inclusionSansEngagement}</li>
                <li>{t.inclusionConfirmation}</li>
              </ul>
              <p class="text-sm text-encre-douce">
                <strong>{t.nonInclusTitre}</strong> — {t.nonInclusExtras}
              </p>
              <p class="text-sm text-encre-douce">
                <strong>{t.delaiTitre}</strong> — {t.delaiTexte}
              </p>
            </div>

            <details class="ui-carte space-y-2 text-sm">
              <summary class="cursor-pointer font-medium">{t.detailNuits}</summary>
              <ul class="mt-3 divide-y divide-bordure">
                {#each data.devis.lignes as ligne (ligne.date)}
                  <li class="flex justify-between py-1.5">
                    <span>{jourCourt(ligne.date)}</span>
                    <span class="tabular-nums">{ligne.prix}</span>
                  </li>
                {/each}
              </ul>
              <p class="mt-2 text-xs text-encre-faine">{t.notePrixNuit}</p>
            </details>
          </aside>
        {/if}
      </div>

      {#if data.devis}
        <BarreActionMobile langue={data.langue} libelle={t.actionMobileNom}>
          {#snippet actions()}
            <div class="min-w-0 flex-1">
              <button
                class="ui-bouton ui-bouton--primaire w-full"
                type="submit"
                form="demande-reservation"
              >
                {t.envoyerDemande}
              </button>
            </div>
          {/snippet}
        </BarreActionMobile>
      {/if}
    {/if}
  {/if}
</main>
