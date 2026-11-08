<script lang="ts">
  import NavSuperAdmin from "@/lib/components/nav-super-admin.svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const noms = $derived(
    new Map(data.fiches.map((fiche) => [fiche.code, fiche.nom])),
  );
  const actifs = $derived(data.fiches.filter((fiche) => fiche.actif));

  function capacite(
    capacites: PageData["fiches"][number]["capacites"],
  ): { libelle: string; actif: boolean }[] {
    return [
      { libelle: "Disponibilités", actif: capacites.ecritureDisponibilites },
      { libelle: "Tarifs", actif: capacites.ecritureTarifs },
      { libelle: "Restrictions", actif: capacites.ecritureRestrictions },
      { libelle: "Réservations", actif: capacites.lectureReservations },
      { libelle: "Webhooks", actif: capacites.webhooks },
      { libelle: "Marque blanche", actif: capacites.marqueBlanche },
    ];
  }

  function modeLibelle(mode: string): string {
    if (mode === "complet") return "Écriture complète";
    if (mode === "partiel") return "Écriture partielle";
    return "Lecture seule";
  }

  function modeClasse(mode: string): string {
    if (mode === "complet") return "ui-badge ui-badge--accent";
    if (mode === "partiel") return "ui-badge ui-badge--alerte";
    return "ui-badge";
  }

  function statutLibelle(statut: string): string {
    const libelles: Record<string, string> = {
      ok: "Synchronisé",
      partiel: "Partiel",
      inchange: "À jour",
      configuration_incomplete: "Configuration incomplète",
      lecture_seule: "Lecture seule",
      erreur: "Erreur",
    };
    return libelles[statut] ?? statut;
  }

  function statutClasse(statut: string): string {
    if (statut === "ok" || statut === "inchange") {
      return "ui-badge ui-badge--accent";
    }
    if (statut === "erreur" || statut === "configuration_incomplete") {
      return "ui-badge ui-badge--alerte";
    }
    return "ui-badge";
  }

  function santeLibelle(etat: string): string {
    const libelles: Record<string, string> = {
      ok: "À jour",
      partiel: "Partiel",
      retard: "En retard",
      erreur: "Erreur",
      jamais: "Jamais",
    };
    return libelles[etat] ?? etat;
  }

  function santeClasse(etat: string): string {
    if (etat === "ok") return "ui-badge ui-badge--accent";
    if (etat === "retard" || etat === "erreur") {
      return "ui-badge ui-badge--alerte";
    }
    return "ui-badge";
  }

  function ageLibelle(minutes: number | null): string {
    if (minutes === null) return "";
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)} h`;
  }

  const date = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
</script>

<svelte:head>
  <title>Fournisseurs — Supervision</title>
</svelte:head>

<main class="mx-auto max-w-7xl space-y-8 px-6 py-10">
  <header class="space-y-4">
    <NavSuperAdmin actif="fournisseurs" />
    <div class="ui-entete space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        Supervision · Réservé au super-admin
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">
        Fournisseurs channel manager
      </h1>
      <p class="max-w-3xl text-encre-douce">
        Un registre unique pour les cinq intégrations. Le super-admin active un
        fournisseur pour la plateforme, puis choisit celui réellement utilisé
        pour chaque logement. Les espaces hôtes ne peuvent pas modifier ce
        choix.
      </p>
    </div>
  </header>

  {#if data.message}
    <p class="ui-alerte ui-alerte--ok" role="status">{data.message}</p>
  {/if}
  {#if form?.message}
    <p
      class={form.ok ? "ui-alerte ui-alerte--ok" : "ui-alerte ui-alerte--danger"}
      role="status"
    >
      {form.message}
    </p>
  {/if}

  {#if !data.ownerDisponible}
    <p class="ui-alerte ui-alerte--danger">
      Connexion owner absente : renseignez <code>MIGRATION_DATABASE_URL</code>
      pour activer le registre et l’affectation cross-tenant.
    </p>
  {/if}

  {#if data.alertes.length > 0}
    <section
      class="ui-carte space-y-3 border-alerte"
      aria-labelledby="alertes-fournisseurs"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="alertes-fournisseurs" class="text-xl font-semibold">
          Centre de notifications
        </h2>
        <span class="ui-badge ui-badge--alerte">
          {data.alertes.length} alerte{data.alertes.length > 1 ? "s" : ""}
        </span>
      </div>
      <ul class="space-y-2">
        {#each data.alertes as alerte (alerte.id)}
          <li
            class="flex flex-wrap items-center gap-3 rounded-controle border border-bordure bg-surface p-3"
          >
            <span
              class={alerte.severite === "danger"
                ? "ui-badge ui-badge--alerte"
                : "ui-badge"}
            >
              {alerte.severite === "danger" ? "Erreur" : "Retard"}
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium">
                {alerte.logementNom} · {alerte.tenantNom}
              </p>
              <p class="text-xs text-encre-douce">{alerte.message}</p>
            </div>
            <a
              class="ui-lien text-sm"
              href={`#logement-${alerte.logementId}`}
            >
              Voir
            </a>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="ui-carte space-y-4">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 class="text-xl font-semibold">Demandes de synchronisation</h2>
      <span class="text-sm text-encre-douce">
        {data.demandes.length} en attente
      </span>
    </div>
    {#if !data.demandesOwnerDisponible}
      <p class="text-sm text-encre-douce">
        Connexion owner absente : impossible de lire la file.
      </p>
    {:else if data.demandes.length === 0}
      <p class="text-sm text-encre-douce">
        Aucune demande en attente : toutes les écritures locales ont été
        poussées ou sont en cours.
      </p>
    {:else}
      <ul class="divide-y divide-bordure">
        {#each data.demandes as demande (demande.id)}
          <li class="flex flex-wrap items-start justify-between gap-3 py-3">
            <div>
              <p class="font-medium">
                {demande.tenantNom} · {demande.logementNom}
              </p>
              <p class="text-xs text-encre-faine">
                Révision {demande.revision} · {demande.tentatives} tentative{demande.tentatives > 1 ? "s" : ""} · {date.format(new Date(demande.updatedAt))}
              </p>
              {#if demande.derniereErreur}
                <p class="mt-1 max-w-xl text-xs text-encre-faine">
                  {demande.derniereErreur}
                </p>
              {/if}
            </div>
            <span class="ui-badge ui-badge--alerte">En attente</span>
          </li>
        {/each}
      </ul>
      <form method="POST" action="?/rejouerDemandes">
        <button class="ui-bouton ui-bouton--secondaire" type="submit">
          Rejouer maintenant
        </button>
      </form>
    {/if}
  </section>

  <section class="space-y-4">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 class="text-xl font-semibold">1. Activer les fournisseurs</h2>
      <span class="text-sm text-encre-douce">
        {actifs.length} actif{actifs.length > 1 ? "s" : ""} sur
        {data.fiches.length}
      </span>
    </div>
    <div class="grid gap-4 lg:grid-cols-2">
      {#each data.fiches as fiche (fiche.code)}
        <article class="ui-carte space-y-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-lg font-semibold">{fiche.nom}</h3>
                <span class={modeClasse(fiche.mode)}>
                  {modeLibelle(fiche.mode)}
                </span>
                {#if fiche.actif}
                  <span class="ui-badge ui-badge--ok">Activé</span>
                {:else}
                  <span class="ui-badge">Désactivé</span>
                {/if}
              </div>
              <p class="mt-1 text-sm text-encre-douce">{fiche.prix}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <form method="POST" action="?/tester">
                <input type="hidden" name="code" value={fiche.code} />
                <button
                  class="ui-bouton ui-bouton--secondaire"
                  type="submit"
                  disabled={!fiche.configure}
                  title={fiche.configure
                    ? "Tester la connexion"
                    : "Clé serveur absente"}
                >
                  Tester
                </button>
              </form>
              <form method="POST" action="?/activer">
                <input type="hidden" name="code" value={fiche.code} />
                <input
                  type="hidden"
                  name="actif"
                  value={fiche.actif ? "false" : "true"}
                />
                <button
                  class={fiche.actif
                    ? "ui-bouton ui-bouton--fantome"
                    : "ui-bouton"}
                  type="submit"
                  disabled={!data.ownerDisponible}
                >
                  {fiche.actif ? "Désactiver" : "Activer"}
                </button>
              </form>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            {#each capacite(fiche.capacites) as cap (cap.libelle)}
              <span class={cap.actif ? "ui-badge ui-badge--accent" : "ui-badge"}>
                {cap.libelle}
              </span>
            {/each}
          </div>

          <dl class="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-xs uppercase tracking-wide text-encre-faine">
                Configuration serveur
              </dt>
              <dd class={fiche.configure ? "text-encre" : "text-encre-faine"}>
                {fiche.configure ? "Clé présente" : "Clé absente"}
              </dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-encre-faine">
                Webhook
              </dt>
              <dd class={fiche.webhookConfigure ? "text-encre" : "text-encre-faine"}>
                {fiche.webhookConfigure ? "Secret présent" : "Secret absent"}
              </dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-encre-faine">
                Logements affectés
              </dt>
              <dd class="tabular-nums">{fiche.affectations}</dd>
            </div>
          </dl>

          <div class="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p class="font-medium">Points forts</p>
              <ul class="mt-1 list-disc space-y-1 pl-5 text-encre-douce">
                {#each fiche.pointsForts as point (point)}
                  <li>{point}</li>
                {/each}
              </ul>
            </div>
            <div>
              <p class="font-medium">Limites</p>
              <ul class="mt-1 list-disc space-y-1 pl-5 text-encre-douce">
                {#each fiche.limites as limite (limite)}
                  <li>{limite}</li>
                {/each}
              </ul>
            </div>
          </div>

          <div class="flex flex-wrap gap-3 text-sm">
            <a class="ui-lien" href={fiche.site} target="_blank" rel="noreferrer">
              Site
            </a>
            <a
              class="ui-lien"
              href={fiche.documentation}
              target="_blank"
              rel="noreferrer"
            >
              Documentation API
            </a>
            {#if fiche.aVerifier}
              <span class="text-encre-faine">À auditer avant production.</span>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  </section>

  <section class="space-y-4">
    <div>
      <h2 class="text-xl font-semibold">2. Choisir le fournisseur par logement</h2>
      <p class="text-sm text-encre-douce">
        Un seul fournisseur actif par logement. Renseignez les identifiants
        externes remontés par le fournisseur. Les champs room type et rate plan
        sont nécessaires aux API qui distinguent chambre et plan tarifaire.
      </p>
    </div>

    {#if data.logements.length === 0}
      <p class="ui-alerte ui-alerte--alerte">
        Aucun logement à affecter pour le moment.
      </p>
    {:else}
      <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
        <table class="w-full min-w-[1100px] text-left text-sm">
          <thead class="border-b border-bordure text-xs uppercase tracking-wide text-encre-faine">
            <tr>
              <th class="p-4">Espace / logement</th>
              <th class="p-4">Fournisseur</th>
              <th class="p-4">Identifiants externes</th>
              <th class="p-4">Dernier état</th>
              <th class="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {#each data.logements as logement (logement.logementId)}
              <tr
                id={`logement-${logement.logementId}`}
                class="scroll-mt-24 border-b border-bordure align-top last:border-0"
              >
                <td class="p-4">
                  <span class="font-medium">{logement.logementNom}</span>
                  <br />
                  <span class="text-xs text-encre-faine">
                    {logement.tenantNom} · {logement.logementCode}
                  </span>
                </td>
                <td class="p-4">
                  <form method="POST" action="?/affecter" class="space-y-2">
                    <input
                      type="hidden"
                      name="tenantId"
                      value={logement.tenantId}
                    />
                    <input
                      type="hidden"
                      name="logementId"
                      value={logement.logementId}
                    />
                    <select
                      class="ui-champ"
                      name="fournisseurCode"
                      aria-label={`Fournisseur de ${logement.logementNom}`}
                    >
                      <option value="">— Choisir —</option>
                      {#each actifs as fiche (fiche.code)}
                        <option
                          value={fiche.code}
                          selected={logement.fournisseurCode === fiche.code}
                        >
                          {fiche.nom}
                        </option>
                      {/each}
                    </select>
                    {#if actifs.length === 0}
                      <p class="text-xs text-encre-faine">
                        Activez d’abord un fournisseur.
                      </p>
                    {/if}
                    <div class="grid gap-2 sm:grid-cols-3">
                      <input
                        class="ui-champ"
                        name="externalPropertyId"
                        value={logement.externalPropertyId ?? ""}
                        placeholder="Property ID"
                        aria-label="Identifiant propriété externe"
                      />
                      <input
                        class="ui-champ"
                        name="externalRoomTypeId"
                        value={logement.externalRoomTypeId ?? ""}
                        placeholder="Room type ID"
                        aria-label="Identifiant type de chambre"
                      />
                      <input
                        class="ui-champ"
                        name="externalRatePlanId"
                        value={logement.externalRatePlanId ?? ""}
                        placeholder="Rate plan ID"
                        aria-label="Identifiant plan tarifaire"
                      />
                    </div>
                    <button
                      class="ui-bouton ui-bouton--secondaire"
                      type="submit"
                    >
                      Affecter
                    </button>
                  </form>
                </td>
                <td class="p-4">
                  {#if logement.fournisseurCode}
                    <span class="ui-badge ui-badge--accent">
                      {noms.get(logement.fournisseurCode) ??
                        logement.fournisseurCode}
                    </span>
                    {#if !logement.actif}
                      <span class="ml-2 ui-badge">Suspendu</span>
                    {/if}
                    <p class="mt-2 text-xs text-encre-faine">
                      property: {logement.externalPropertyId ?? "—"}<br />
                      room: {logement.externalRoomTypeId ?? "—"}<br />
                      rate plan: {logement.externalRatePlanId ?? "—"}
                    </p>
                  {:else}
                    <span class="text-encre-faine">Non affecté</span>
                  {/if}
                </td>
                <td class="p-4">
                  {#if logement.derniereSync}
                    {date.format(new Date(logement.derniereSync))}
                  {:else}
                    <span class="text-encre-faine">Jamais synchronisé</span>
                  {/if}
                  {#if logement.dernierStatut}
                    <br />
                    <span class={statutClasse(logement.dernierStatut)}>
                      {statutLibelle(logement.dernierStatut)}
                    </span>
                  {/if}
                  {#if logement.sante}
                    <span class="ml-2 {santeClasse(logement.sante.etat)}">
                      {santeLibelle(logement.sante.etat)}
                    </span>
                    {#if logement.sante.ageMinutes !== null}
                      <span class="ml-2 text-xs text-encre-faine">
                        il y a {ageLibelle(logement.sante.ageMinutes)}
                      </span>
                    {/if}
                  {/if}
                  {#if logement.dernierMessage}
                    <p class="mt-1 max-w-xs text-xs text-encre-faine">
                      {logement.dernierMessage}
                    </p>
                  {/if}
                </td>
                <td class="p-4">
                  {#if logement.fournisseurCode}
                    <div class="flex flex-wrap gap-2">
                      <form
                        method="POST"
                        action="?/synchroniser"
                        onsubmit={(event) => {
                          if (
                            !confirm(
                              "Resynchroniser ce logement maintenant ? Le push ARI sera recalculé.",
                            )
                          ) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input
                          type="hidden"
                          name="tenantId"
                          value={logement.tenantId}
                        />
                        <input
                          type="hidden"
                          name="logementId"
                          value={logement.logementId}
                        />
                        <button
                          class="ui-bouton ui-bouton--secondaire"
                          type="submit"
                        >
                          Synchroniser
                        </button>
                      </form>
                      <form method="POST" action="?/basculer">
                        <input
                          type="hidden"
                          name="tenantId"
                          value={logement.tenantId}
                        />
                        <input
                          type="hidden"
                          name="logementId"
                          value={logement.logementId}
                        />
                        <input
                          type="hidden"
                          name="actif"
                          value={logement.actif ? "false" : "true"}
                        />
                        <button
                          class="ui-bouton ui-bouton--fantome"
                          type="submit"
                        >
                          {logement.actif ? "Suspendre" : "Reprendre"}
                        </button>
                      </form>
                      <form method="POST" action="?/retirer">
                        <input
                          type="hidden"
                          name="tenantId"
                          value={logement.tenantId}
                        />
                        <input
                          type="hidden"
                          name="logementId"
                          value={logement.logementId}
                        />
                        <button
                          class="ui-bouton ui-bouton--fantome"
                          type="submit"
                        >
                          Retirer
                        </button>
                      </form>
                    </div>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <section class="space-y-4">
    <div>
      <h2 class="text-xl font-semibold">3. Conseil par nombre de logements</h2>
      <p class="text-sm text-encre-douce">
        Le principal est le choix V2. L’alternative est utile pour un usage
        autonome ou une contrainte d’exploitation ; elle n’est pas forcément un
        pilote complet.
      </p>
    </div>
    <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
      <table class="w-full min-w-[760px] text-left text-sm">
        <thead class="border-b border-bordure text-xs uppercase tracking-wide text-encre-faine">
          <tr>
            <th class="p-4">Logements</th>
            <th class="p-4">Conseillé</th>
            <th class="p-4">Alternative</th>
            <th class="p-4">Pourquoi</th>
          </tr>
        </thead>
        <tbody>
          {#each data.recommandations as entree (`${entree.min}-${entree.max}`)}
            <tr class="border-b border-bordure last:border-0">
              <td class="p-4 font-medium">
                {entree.min}–{entree.max ?? "∞"}
              </td>
              <td class="p-4">{entree.principalNom}</td>
              <td class="p-4">{entree.alternativeNom ?? "—"}</td>
              <td class="p-4 text-encre-douce">{entree.motif}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="text-xs text-encre-faine">
      Prix publics indicatifs hors taxes, constatés le 25 octobre 2026. Host
      Port est en lecture seule : il importe les réservations mais ne reçoit pas
      d’ARI de la V2. Smoobu et Nobeds sont partiels : Smoobu ne pousse pas les
      disponibilités ; Nobeds ne documente ni CTA/CTD ni webhooks.
    </p>
  </section>
</main>
