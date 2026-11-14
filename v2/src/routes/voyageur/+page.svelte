<script lang="ts">
  import { page } from "$app/state";
  import EntetePublique from "@/lib/components/entete-publique.svelte";
  import BandeauSynchro from "@/lib/components/voyageur/bandeau-synchro.svelte";
  /*
   * T052 : la barre est la brique partagée `ui/barre-action-mobile.svelte`
   * (trois actions nommées, `nav` nommé, cibles ≥ 44 px, sans JS, invisible à
   * l'impression). Aucun composant local ne la duplique.
   */
  import BarreActionMobile from "@/lib/components/ui/barre-action-mobile.svelte";
  import CarteEssentielle from "@/lib/components/voyageur/carte-essentielle.svelte";
  import SommaireSejour from "@/lib/components/voyageur/sommaire-sejour.svelte";
  import { traductionsVoyageur } from "@/lib/i18n/public/voyageur";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  /** Libellés du premier écran voyageur (T047), cinq langues + repli `fr`. */
  const tv = $derived(traductionsVoyageur(data.langue));
  /** Libellés historiques de `@/lib/i18n.ts` (formulaires et statuts). */
  const d = $derived(data.d);

  const incidentEtat = $derived(page.url.searchParams.get("incident"));
  const extrasEtat = $derived(page.url.searchParams.get("extras"));
  const avisEtat = $derived(page.url.searchParams.get("avis"));
  const preferencesEtat = $derived(page.url.searchParams.get("preferences"));
  const memoireEtat = $derived(page.url.searchParams.get("memoire"));
  const departEtat = $derived(page.url.searchParams.get("depart"));
  const base = $derived(
    data.token
      ? `/voyageur?t=${encodeURIComponent(data.token)}&lang=${data.langue}`
      : `/voyageur?lang=${data.langue}`,
  );

  // Sommaire ancré (T049) : uniquement les sections réellement affichées.
  const sections = $derived(
    [
      { id: "essentiel", libelle: tv.titre, present: true },
      { id: "guide", libelle: tv.guideLogement, present: true },
      { id: "actions", libelle: tv.actions, present: true },
      { id: "depart", libelle: tv.preparerDepart, present: true },
      { id: "avis", libelle: tv.laisserAvis, present: true },
      { id: "incident", libelle: tv.signalerIncident, present: true },
      { id: "extras", libelle: tv.extras, present: (data?.extras?.length ?? 0) > 0 },
      { id: "adresses", libelle: tv.adresses, present: (data?.lieux?.length ?? 0) > 0 },
      { id: "preferences", libelle: tv.preferencesSejour, present: true },
      {
        id: "memoire",
        libelle: tv.memoireVoyageur,
        present: Boolean(data?.reservation?.clientEmail),
      },
    ].filter((section) => section.present),
  );

  const adresseLogement = $derived(data.logement?.adresse?.trim() ?? "");
  const itineraire = $derived(
    adresseLogement
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(adresseLogement)}`
      : "",
  );
  const urgenceTel = $derived(data.logement?.urgenceTel?.trim() ?? "");
  // Aucun email d'hôte n'est exposé au voyageur : « écrire » ouvre le
  // formulaire d'incident natif (même canal que l'action dédiée, T051).
  const ecrireHref = "#incident";
</script>

<svelte:head>
  <title>{d.votreSejour} — LCD Parc</title>
  <meta name="description" content={tv.sousTitre} />
  <script src="/outbox.js" defer></script>
</svelte:head>

<EntetePublique
  logoUrl={data.identite.logoUrl}
  nom={data.identite.nom}
  retourLibelle={d.retourAccueil}
/>

<main id="contenu" class="mx-auto max-w-2xl px-6 pb-28 pt-8 sm:pt-12">
  {#if data.invalide}
    <header class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">{d.espaceVoyageur}</p>
      <h1 class="text-3xl font-semibold tracking-tight">{d.votreSejour}</h1>
      <p class="rounded-controle border border-danger bg-danger-douce p-4 text-danger">{d.lienInvalide}</p>
    </header>
  {:else if !data.token}
    <header class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">{d.espaceVoyageur}</p>
      <h1 class="text-3xl font-semibold tracking-tight">{d.votreSejour}</h1>
      <p class="text-encre-douce">{d.ouvrirLien}</p>
      <nav aria-label={d.langue} class="flex flex-wrap gap-2 pt-2">
        {#each ["fr", "en", "it", "es", "de"] as code}
          <a
            aria-current={code === data.langue ? "true" : undefined}
            class={code === data.langue ? "ui-puce-active" : "ui-puce"}
            href={`/voyageur?lang=${code}`}
          >{code.toUpperCase()}</a>
        {/each}
      </nav>
    </header>
    <section class="ui-carte mt-8">
      <h2 class="text-lg font-semibold">{d.besoinAide}</h2>
      <p class="mt-2 text-encre-douce">{d.aideTexte}</p>
    </section>
  {:else if data.reservation && data.logement}
    <!-- 1. En-tête : logement, dates, nuits (T047) -->
    <header class="space-y-2" id="essentiel">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">{d.espaceVoyageur}</p>
      <h1 class="text-3xl font-semibold tracking-tight">{tv.titre}</h1>
      <p class="text-encre-douce">{tv.sousTitre}</p>
      <p class="text-sm text-encre-douce">
        <span class="font-medium">{data.logement.nom}</span>
        {#if adresseLogement} — {adresseLogement}{/if}
        · {d.sejour} {data.reservation.ref}
      </p>
      <nav aria-label={d.langue} class="flex flex-wrap gap-2 pt-2">
        {#each ["fr", "en", "it", "es", "de"] as code}
          <a
            aria-current={code === data.langue ? "true" : undefined}
            class={code === data.langue ? "ui-puce-active" : "ui-puce"}
            href={`/voyageur?t=${encodeURIComponent(data.token)}&lang=${code}`}
          >{code.toUpperCase()}</a>
        {/each}
      </nav>
    </header>

    <SommaireSejour libelle={tv.sommaire} sections={sections} />

    <!-- 2. L'essentiel en un coup d'œil : dates, accès, Wi-Fi, horaires, urgence -->
    <section class="mt-8 space-y-4" aria-labelledby="titre-essentiel">
      <h2 id="titre-essentiel" class="text-lg font-semibold">{tv.essentiel}</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <CarteEssentielle
          id="carte-dates"
          icone="🗓"
          titre={tv.datesSejour}
          valeur={`${data.reservation.debut} → ${data.reservation.fin}`}
        />
        <CarteEssentielle
          id="carte-nuits"
          icone="🌙"
          titre={tv.nuits}
          valeur={`${data.reservation.nuits} · ${data.reservation.voyageurs} ${tv.voyageurs.toLowerCase()}`}
        />
        <CarteEssentielle
          id="carte-acces"
          icone="📍"
          titre={tv.adresse}
          valeur={adresseLogement || tv.adresseAbsente}
          action={itineraire || undefined}
          actionNom={tv.itineraireCarte}
          actionExterne
        />
        <CarteEssentielle
          id="carte-wifi"
          icone="📶"
          titre={tv.reseauWifi}
          valeur={data.logement.wifiSsid || d.guideACompleter}
          action={data.logement.wifiPassword ? "#guide" : undefined}
          actionNom={data.logement.wifiPassword ? `${tv.motDePasseWifi} : ${data.logement.wifiPassword}` : undefined}
        />
        <CarteEssentielle
          id="carte-horaires"
          icone="🕐"
          titre={tv.horaires}
          valeur={`${tv.heureArrivee} ${data.logement.checkinHeure ?? tv.guideACompleter} · ${tv.heureDepart} ${data.reservation.fin}`}
          action="#guide"
          actionNom={tv.guide}
        />
        <CarteEssentielle
          id="carte-urgence"
          icone="🚨"
          titre={tv.urgence}
          valeur={urgenceTel || d.aideTexte}
          action={urgenceTel ? `tel:${urgenceTel}` : undefined}
          actionNom={urgenceTel ? tv.appelerUrgence : undefined}
        />
      </div>
    </section>

    <!-- 3. Guide du logement : arrivée, équipements, consignes (T050) -->
    <section class="mt-8" id="guide">
      <details class="ui-carte" data-section-repliable open>
        <summary class="resume-section">
          <span class="min-w-0">
            <h2 class="text-lg font-semibold">{tv.guideLogement}</h2>
            <span class="block text-xs font-normal text-encre-faine">{tv.guideResume}</span>
          </span>
        </summary>
        <div class="mt-4">
          <dl class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            {#if data.logement.checkinHeure}
              <div><dt class="text-encre-faine">{d.checkin}</dt><dd class="font-medium">{data.logement.checkinHeure}</dd></div>
            {/if}
            {#if data.logement.wifiSsid}
              <div><dt class="text-encre-faine">{tv.reseauWifi}</dt><dd class="font-medium">{data.logement.wifiSsid}</dd></div>
            {/if}
            {#if data.logement.wifiPassword}
              <div><dt class="text-encre-faine">{tv.motDePasseWifi}</dt><dd class="font-mono font-medium">{data.logement.wifiPassword}</dd></div>
            {/if}
            {#if data.logement.urgenceTel}
              <div><dt class="text-encre-faine">{tv.urgence}</dt><dd class="font-medium">{data.logement.urgenceTel}</dd></div>
            {/if}
          </dl>
          {#if data.logement.checkinInstructions}
            <div class="mt-4"><h3 class="text-sm font-semibold">{tv.arrivee}</h3><p class="mt-1 whitespace-pre-line text-sm text-encre-douce">{data.logement.checkinInstructions}</p></div>
          {/if}
          {#if data.logement.regles}
            <div class="mt-4"><h3 class="text-sm font-semibold">{tv.regles}</h3><p class="mt-1 whitespace-pre-line text-sm text-encre-douce">{data.logement.regles}</p></div>
          {/if}
          {#if data.logement.guideTexte}
            <div class="mt-4"><h3 class="text-sm font-semibold">{tv.adresses}</h3><p class="mt-1 whitespace-pre-line text-sm text-encre-douce">{data.logement.guideTexte}</p></div>
          {/if}
          {#if data.logement.guidePartenaireUrl}
            <div class="mt-4">
              <h3 class="text-sm font-semibold">{data.logement.guidePartenaireNom ?? tv.guidePartenaire}</h3>
              <a class="ui-lien-action mt-1 inline-block text-sm" href={data.logement.guidePartenaireUrl} target="_blank" rel="noopener noreferrer">
                {tv.ouvrirGuidePartenaire} →
              </a>
            </div>
          {/if}
          {#if !data.logement.checkinHeure && !data.logement.wifiSsid && !data.logement.checkinInstructions && !data.logement.regles && !data.logement.guideTexte && !data.logement.guidePartenaireUrl}
            <p class="mt-3 text-sm text-encre-douce">{tv.guideACompleter}</p>
          {/if}
        </div>
      </details>
    </section>

    <!-- 4. Cartes d'action : incident, extra, départ, avis (T051) -->
    <section class="mt-8" id="actions" aria-labelledby="titre-actions">
      <h2 id="titre-actions" class="text-lg font-semibold">{tv.actions}</h2>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <CarteEssentielle
          id="action-incident-carte"
          icone="🛠"
          titre={tv.actionIncidentTitre}
          valeur={tv.actionIncidentTexte}
          action="#incident"
          actionNom={tv.actionIncidentLien}
        />
        <CarteEssentielle
          id="action-extra-carte"
          icone="🛎"
          titre={tv.actionExtraTitre}
          valeur={tv.actionExtraTexte}
          action="#extras"
          actionNom={tv.actionExtraLien}
        />
        <CarteEssentielle
          id="action-depart-carte"
          icone="🧳"
          titre={tv.actionDepartTitre}
          valeur={tv.actionDepartTexte}
          action="#depart"
          actionNom={tv.actionDepartLien}
        />
        <CarteEssentielle
          id="action-avis-carte"
          icone="⭐"
          titre={tv.actionAvisTitre}
          valeur={tv.actionAvisTexte}
          action="#avis"
          actionNom={tv.actionAvisLien}
        />
      </div>
    </section>

    <!-- 5. Préparer le départ -->
    <section class="mt-8" id="depart">
      <details class="ui-carte" data-section-repliable data-critique open>
        <summary class="resume-section">
          <span class="min-w-0">
            <h2 class="text-lg font-semibold">{d.departTitre}</h2>
            <span class="block text-xs font-normal text-encre-faine">{d.departTexte}</span>
          </span>
        </summary>
        <div class="mt-4">
          {#if departEtat === "ok"}<p class="ui-alerte ui-alerte--succes mt-3">{d.departOk}</p>{/if}
          {#if departEtat === "erreur"}<p class="ui-alerte ui-alerte--danger mt-3">{d.departErreur}</p>{/if}
          {#if departEtat === "checklist"}<p class="ui-alerte ui-alerte--danger mt-3">{d.departChecklistErreur}</p>{/if}
          {#if data.reservation.departConfirmeLe}
            <div class="mt-4 rounded-controle border border-ok bg-ok-douce p-4 text-sm">
              <p class="font-medium">{d.departDeja}</p>
              <p class="mt-1 text-encre-douce">
                {new Date(data.reservation.departConfirmeLe).toLocaleString(data.langue)}
              </p>
              {#if data.reservation.departNote}<p class="mt-2 whitespace-pre-line">{data.reservation.departNote}</p>{/if}
            </div>
          {:else}
            <form method="POST" action="?/depart" class="mt-4 space-y-3">
              <input type="hidden" name="token" value={data.token} />
              <input type="hidden" name="langue" value={data.langue} />
              <fieldset class="space-y-2">
                <legend class="ui-label">{d.departTexte}</legend>
                {#each d.departChecklist as etape, index (etape)}
                  <label class="flex min-h-11 min-w-11 items-start gap-2 text-sm text-encre-douce">
                    <input
                      class="mt-1"
                      type="checkbox"
                      name="checklist"
                      value={data.etapesDepart[index] ?? ""}
                      required
                    />
                    <span>{etape}</span>
                  </label>
                {/each}
              </fieldset>
              <label class="flex min-h-11 min-w-11 items-start gap-2 text-sm text-encre-douce">
                <input class="mt-1" type="checkbox" name="confirmation" required />
                <span>{d.departCle}</span>
              </label>
              <label class="ui-champ-groupe">
                <span class="ui-label">{d.departNote}</span>
                <textarea class="ui-champ" name="note" rows="2" maxlength="500"></textarea>
              </label>
              <button class="ui-bouton ui-bouton--primaire" type="submit">{d.departBouton}</button>
            </form>
          {/if}
        </div>
      </details>
    </section>

    <!-- 6. Laisser un avis -->
    <section class="mt-8" id="avis">
      <details class="ui-carte" data-section-repliable open>
        <summary class="resume-section">
          <span class="min-w-0">
            <h2 class="text-lg font-semibold">{d.avis}</h2>
            <span class="block text-xs font-normal text-encre-faine">{d.avisTexte}</span>
          </span>
        </summary>
        <div class="mt-4">
          <p class="mt-2 text-sm"><a class="ui-lien-action" href={`/questionnaire/${encodeURIComponent(data.token)}`}>{d.questionnaireLien}</a></p>
          {#if avisEtat === "ok"}<p class="ui-alerte ui-alerte--succes mt-3">{d.avisOk}</p>{/if}
          {#if avisEtat === "erreur"}<p class="ui-alerte ui-alerte--danger mt-3">{d.avisErreur}</p>{/if}
          {#if data.avis}
            <div class="mt-4 rounded-controle border border-bordure bg-surface-2 p-4">
              <p class="text-sm font-medium">{d.avisDeja}</p>
              <p class="mt-1 font-medium">{"★".repeat(data.avis.note)}<span class="text-encre-faine">{"★".repeat(5 - data.avis.note)}</span></p>
              {#if data.avis.commentaire}<p class="mt-1 whitespace-pre-line text-encre-douce">{data.avis.commentaire}</p>{/if}
            </div>
          {:else}
            <form method="POST" action="?/avis" class="mt-4 space-y-3">
              <input type="hidden" name="token" value={data.token} />
              <input type="hidden" name="langue" value={data.langue} />
              <input type="hidden" name="ref" value={data.refs.avis} />
              <label class="ui-champ-groupe">
                <span class="ui-label">{d.memoireNom}</span>
                <input class="ui-champ" name="nom" required value={data.reservation.clientNom ?? ""} />
              </label>
              <label class="ui-champ-groupe">
                <span class="ui-label">{d.avisNote}</span>
                <select class="ui-champ" name="note">
                  <option value="5">5 — excellent</option>
                  <option value="4">4 — très bien</option>
                  <option value="3">3 — correct</option>
                  <option value="2">2 — moyen</option>
                  <option value="1">1 — à améliorer</option>
                </select>
              </label>
              <label class="ui-champ-groupe">
                <span class="ui-label">{d.avisCommentaire}</span>
                <textarea class="ui-champ min-h-24" name="commentaire"></textarea>
              </label>
              <button class="ui-bouton ui-bouton--secondaire" type="submit">{d.avisEnvoyer}</button>
            </form>
          {/if}
        </div>
      </details>
    </section>

    <!-- 7. Signaler un incident : formulaire natif, rejouable hors ligne -->
    <section class="mt-8" id="incident">
      <details class="ui-carte" data-section-repliable data-critique open>
        <summary class="resume-section">
          <span class="min-w-0">
            <h2 class="text-lg font-semibold">{d.signalerIncident}</h2>
            <span class="block text-xs font-normal text-encre-faine">{tv.actionIncidentTexte}</span>
          </span>
        </summary>
        <div class="mt-4">
          {#if incidentEtat === "ok"}
            <p class="ui-alerte ui-alerte--succes" role="status">{d.incidentOk}</p>
          {:else if incidentEtat === "erreur"}
            <p class="ui-alerte ui-alerte--danger" role="alert">{d.incidentErreur}</p>
          {/if}
          <p class="mb-4 mt-1 text-sm text-encre-douce">{d.incidentTexte}</p>
          <form id="formulaire-incident" method="POST" action="?/incident" class="space-y-3">
            <input type="hidden" name="token" value={data.token} />
            <input type="hidden" name="langue" value={data.langue} />
            <input type="hidden" name="ref" value={data.refs.incident} />
            <label class="ui-champ-groupe">
              <span class="ui-label">{d.queSestIlPasse}</span>
              <textarea
                class="ui-champ"
                name="message"
                rows="3"
                required
                minlength="5"
                maxlength="500"
                placeholder={d.placeholderIncident}
                aria-describedby="incident-aide"
              ></textarea>
            </label>
            <p id="incident-aide" class="text-xs text-encre-faine">{d.decrivezProbleme}</p>
            <button class="ui-bouton ui-bouton--primaire" type="submit">{d.envoyer}</button>
          </form>
          {#if data.incidents.length === 0}
            <p class="mt-5 text-sm text-encre-douce">{d.aucunSignalement}</p>
          {:else}
            <div class="mt-5 border-t border-bordure pt-4">
              <h3 class="text-sm font-semibold">{d.vosSignalements}</h3>
              <ul class="mt-2 space-y-3 text-sm">
                {#each data.incidents as incident (incident.id)}
                  <li>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <p class="font-medium">{incident.ref}</p>
                      <span class="ui-etiquette">{data.statuts.incident[incident.statut] ?? incident.statut}</span>
                    </div>
                    <p class="mt-1 whitespace-pre-line text-encre-douce">{incident.message}</p>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      </details>
    </section>

    <!-- 8. Extras -->
    <section class="mt-8" id="extras">
      <details class="ui-carte" data-section-repliable open>
        <summary class="resume-section">
          <span class="min-w-0">
            <h2 class="text-lg font-semibold">{d.extras}</h2>
            {#if data.extras.length === 0}
              <span class="block text-xs font-normal text-encre-faine">{d.aucunExtra}</span>
            {/if}
          </span>
        </summary>
        <div class="mt-4">
          {#if extrasEtat === "ok"}<p class="ui-alerte ui-alerte--succes mt-2">{d.commandeEnregistree}</p>{/if}
          {#if extrasEtat === "erreur"}<p class="ui-alerte ui-alerte--danger mt-2">{d.commandeErreur}</p>{/if}
          {#if data.extras.length === 0}
            <p class="mt-3 text-sm text-encre-douce">{d.aucunExtra}</p>
          {:else}
            <ul class="mt-4 divide-y divide-bordure">
              {#each data.extras as extra (extra.id)}
                <li class="py-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p class="font-medium">{extra.nom}</p>
                      {#if extra.description}<p class="text-sm text-encre-douce">{extra.description}</p>{/if}
                    </div>
                    <p class="font-medium">{extra.prix}</p>
                  </div>
                  <form method="POST" action="?/extra" class="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="token" value={data.token} />
                    <input type="hidden" name="langue" value={data.langue} />
                    <input type="hidden" name="extraId" value={extra.id} />
                    <input type="hidden" name="ref" value={data.refs.extras[extra.id]} />
                    <label class="text-sm text-encre-douce">{d.quantite}
                      <input class="ml-2 w-16 rounded-controle border border-bordure p-1 text-center" type="number" name="quantite" min="1" max="20" value="1" />
                    </label>
                    <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">{d.commander}</button>
                  </form>
                </li>
              {/each}
            </ul>
          {/if}
          {#if data.commandes.length > 0}
            <div class="mt-5 border-t border-bordure pt-4">
              <h3 class="text-sm font-semibold">{d.vosCommandes}</h3>
              <ul class="mt-2 space-y-2 text-sm">
                {#each data.commandes as commande (commande.id)}
                  <li class="flex flex-wrap items-center justify-between gap-2">
                    <span>{commande.nom} × {commande.quantite}</span>
                    <span class="text-encre-faine">{data.statuts.commande[commande.statut] ?? commande.statut} · {commande.total}</span>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      </details>
    </section>

    <!-- 9. Bonnes adresses et lieux de tourisme -->
    {#if data.lieux.length > 0}
      <section class="mt-8" id="adresses">
        <!-- Déplié par défaut : les catégories et la liste des adresses sont
             consultables d'emblée (le pli reste une commodité d'impression). -->
        <details class="ui-carte" data-section-repliable open>
          <summary class="resume-section">
            <span class="font-semibold">{tv.adresses}</span>
            <span class="block text-xs font-normal text-encre-faine">{data.lieux.length} · {d.tourisme}</span>
          </summary>
          <div class="mt-4">
            <h2 class="text-lg font-semibold">{d.tourisme}</h2>
            <nav aria-label={d.tourisme} class="mt-3 flex flex-wrap gap-2">
              <a aria-current={!data.categorieActive ? "page" : undefined} class={data.categorieActive ? "ui-puce" : "ui-puce-active"} href={base}>
                {d.tousLesLieux}
              </a>
              {#each data.categories as categorie (categorie.id)}
                <a aria-current={data.categorieActive === categorie.id ? "page" : undefined} class={data.categorieActive === categorie.id ? "ui-puce-active" : "ui-puce"} href={`${base}&cat=${categorie.id}`}>
                  {categorie.label}
                </a>
              {/each}
            </nav>
            <ul class="mt-4 divide-y divide-bordure">
              {#each data.lieux as lieu (lieu.id)}
                <li class="py-3">
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p class="font-medium">{lieu.nom}</p>
                      <p class="text-xs text-encre-faine">{lieu.categorieLabel}{lieu.commune ? ` · ${lieu.commune}` : ""}</p>
                      {#if lieu.acces}<p class="mt-1 text-sm text-encre-douce">{lieu.acces}</p>{/if}
                    </div>
                    {#if lieu.prixIndicatif}<p class="text-sm font-medium">{lieu.prixIndicatif}</p>{/if}
                  </div>
                  <div class="mt-2 flex flex-wrap gap-3 text-sm">
                    {#if lieu.lien}<a class="ui-lien-action" href={lieu.lien} target="_blank" rel="noreferrer noopener">{lieu.nom}</a>{/if}
                    {#if lieu.extraId}<a class="ui-lien-action" href="#extras">{d.reserverExtra}</a>{/if}
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        </details>
      </section>
    {/if}

    <!-- 10. Fiche de police : obligatoire avant l'arrivée -->
    <section class="mt-8" id="police">
      <details class="ui-carte" data-section-repliable data-critique open>
        <summary class="resume-section">
          <span class="min-w-0">
            <h2 class="text-lg font-semibold">{tv.fichePolice}</h2>
            <span class="block text-xs font-normal text-encre-faine">{data.fichesPolice}/{data.reservation.voyageurs}</span>
          </span>
        </summary>
        <div class="mt-4">
          <p class="mt-2 text-sm text-encre-douce">
            Obligatoire avant l’arrivée : une fiche par personne hébergée.
            {data.fichesPolice}/{data.reservation.voyageurs} reçue(s). Données conservées
            6 mois, aucune pièce d’identité demandée.
          </p>
          <a class="ui-bouton ui-bouton--secondaire mt-3" href={`/voyageur/police?t=${encodeURIComponent(data.token)}&lang=${data.langue}`}>
            {data.fichesPolice >= data.reservation.voyageurs ? "Voir les fiches déposées" : "Remplir une fiche"}
          </a>
        </div>
      </details>
    </section>

    <!-- 11. Préférences de séjour -->
    <section class="mt-8" id="preferences">
      <details class="ui-carte" data-section-repliable open>
        <summary class="resume-section">
          <span class="min-w-0">
            <h2 class="text-lg font-semibold">{d.preferencesSejour}</h2>
            <span class="block text-xs font-normal text-encre-faine">{d.preferencesTexte}</span>
          </span>
        </summary>
        <div class="mt-4">
          {#if preferencesEtat === "ok"}<p class="ui-alerte ui-alerte--succes mt-3">{d.preferencesOk}</p>{/if}
          {#if preferencesEtat === "erreur"}<p class="ui-alerte ui-alerte--danger mt-3">{d.preferencesErreur}</p>{/if}
          <form method="POST" action="?/preferences" class="mt-4 space-y-3">
            <input type="hidden" name="token" value={data.token} />
            <input type="hidden" name="langue" value={data.langue} />
            <label class="ui-champ-groupe">
              <span class="ui-label">{d.menageFrequence}</span>
              <input
                class="ui-champ"
                name="menageFrequenceJ"
                type="number"
                min="0"
                max="30"
                value={data.preferences?.menageFrequenceJ ?? 0}
              />
            </label>
            <label class="flex min-h-11 min-w-11 items-center gap-2 text-sm">
              <input type="checkbox" name="lingeInclus" defaultChecked={data.preferences?.lingeInclus ?? true} />
              <span>{d.lingeInclus}</span>
            </label>
            <label class="ui-champ-groupe">
              <span class="ui-label">{d.heureArrivee}</span>
              <input
                class="ui-champ"
                name="heureArrivee"
                type="time"
                value={data.preferences?.heureArrivee ?? ""}
              />
            </label>
            <label class="ui-champ-groupe">
              <span class="ui-label">{d.consignesSejour}</span>
              <textarea class="ui-champ" name="consignes" rows="3" maxlength="500">{data.preferences?.consignes ?? ""}</textarea>
            </label>
            <button class="ui-bouton ui-bouton--primaire" type="submit">{d.preferencesEnregistrer}</button>
          </form>
        </div>
      </details>
    </section>

    <!-- 12. Mémoriser les préférences (empreinte d'email, jamais l'adresse) -->
    {#if data.reservation.clientEmail}
      <section class="mt-8" id="memoire">
        <details class="ui-carte" data-section-repliable open>
          <summary class="resume-section">
            <span class="min-w-0">
              <h2 class="text-lg font-semibold">{d.memoire}</h2>
              <span class="block text-xs font-normal text-encre-faine">{d.memoireTexte}</span>
            </span>
          </summary>
          <div class="mt-4">
            {#if memoireEtat === "ok"}<p class="ui-alerte ui-alerte--succes mt-3">{d.memoireOk}</p>{/if}
            {#if memoireEtat === "oublie"}<p class="ui-alerte ui-alerte--succes mt-3">{d.memoireOublie}</p>{/if}
            {#if memoireEtat === "erreur"}<p class="ui-alerte ui-alerte--danger mt-3">{d.memoireErreur}</p>{/if}
            {#if data.memoire}<p class="mt-3 text-xs text-encre-faine">{d.memoireOk} {data.memoire.expireAt}</p>{/if}
            <form method="POST" action="?/memoire" class="mt-4 space-y-3">
              <input type="hidden" name="token" value={data.token} />
              <input type="hidden" name="langue" value={data.langue} />
              <input type="hidden" name="intention" value="memoriser" />
              <label class="ui-champ-groupe">
                <span class="ui-label">{d.memoireNom}</span>
                <input class="ui-champ" name="nom" required value={data.memoire?.nom ?? data.reservation.clientNom ?? ""} />
              </label>
              <label class="ui-champ-groupe">
                <span class="ui-label">{d.memoireChamp}</span>
                <textarea class="ui-champ min-h-24" name="preferences">{data.memoire?.preferences ?? ""}</textarea>
              </label>
              <label class="flex min-h-11 min-w-11 items-start gap-2 text-sm text-encre-douce">
                <input class="mt-1" type="checkbox" name="consentement" required />
                <span>{d.memoireConsentement}</span>
              </label>
              <button class="ui-bouton ui-bouton--primaire" type="submit">
                {data.memoire ? d.memoireMettreAJour : d.memoireEnregistrer}
              </button>
            </form>
            {#if data.memoire}
              <form method="POST" action="?/memoire" class="mt-3">
                <input type="hidden" name="token" value={data.token} />
                <input type="hidden" name="langue" value={data.langue} />
                <input type="hidden" name="intention" value="oublier" />
                <button class="text-sm text-danger underline" type="submit">{d.memoireOublier}</button>
              </form>
            {/if}
          </div>
        </details>
      </section>
    {/if}

    <BandeauSynchro
      libelle={tv.derniereMiseAJour}
      iso={data.miseAJourLe}
      langue={data.langue}
      horsLigneLibelle={tv.horsLigneTitre}
    />

    <p class="mt-6 text-sm">
      <a class="ui-lien-action" href="/">{d.retourAccueil}</a>
    </p>
  {/if}
</main>

{#if data.token && data.reservation && data.logement}
  <!-- Barre d'action mobile : appeler, écrire, guide (T052) -->
  <BarreActionMobile
    appelerHref={urgenceTel ? `tel:${urgenceTel}` : "#actions"}
    appelerLibelle={tv.appeler}
    ecrireHref={ecrireHref}
    ecrireLibelle={tv.ecrire}
    guideHref="#guide"
    guideLibelle={tv.guide}
    libelle={tv.actionsRapides}
  />
{/if}

{#if data.token && data.reservation}
  <!-- Hors ligne : le contenu reste consultable, l'état est signalé (T054). -->
  <script>
    (() => {
      const bloc = document.querySelector("[data-hors-ligne]");
      const appliquer = () => {
        if (bloc) bloc.hidden = navigator.onLine !== false;
      };
      window.addEventListener("online", appliquer);
      window.addEventListener("offline", appliquer);
      appliquer();

      // Impression (T053) : un <details> replié n'est pas imprimable par le
      // navigateur ; on déplie donc les sections juste avant l'impression.
      window.addEventListener("beforeprint", () => {
        document
          .querySelectorAll("details[data-section-repliable]")
          .forEach((section) => section.setAttribute("open", ""));
      });

      // La page signée porte un jeton en paramètre : le précache du service
      // worker ne couvre que « /voyageur ». On met donc en cache l'URL exacte
      // affichée, afin qu'un rechargement hors ligne serve le séjour et non la
      // page de repli générique.
      if (!("caches" in window) || !("serviceWorker" in navigator)) return;
      navigator.serviceWorker.ready
        .then(() => fetch(window.location.href, { credentials: "same-origin" }))
        .then((reponse) => {
          if (!reponse || !reponse.ok) return;
          return caches
            .open("lcd-voyageur")
            .then((cache) => cache.put(window.location.href, reponse));
        })
        .catch(() => {});
    })();
  </script>
{/if}

<style>
  /* Cibles ≥ 44 px et hiérarchie lisible des sections repliables (T050). */
  :global(summary.resume-section) {
    display: flex;
    min-height: var(--hauteur-controle);
    cursor: pointer;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0;
  }

  :global(summary.resume-section):focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  /* T053 — impression : guide lisible, navigation et barres masquées. */
  @media print {
    main {
      padding: 0;
      max-width: none;
    }

    :global(details) {
      break-inside: avoid;
    }

    :global(details) > :global(summary) {
      display: none !important;
    }

    :global(details) > :global(div),
    :global(details) > :global(ul),
    :global(details) > :global(form) {
      display: block !important;
    }
  }
</style>
