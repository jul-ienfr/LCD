<script lang="ts">
  import ConfirmationAction from "@/lib/components/ui/confirmation-action.svelte";
  import { traductionsPrix } from "@/lib/i18n-prix";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const erreur = $derived((form as { erreur?: string } | null)?.erreur ?? data.erreur);
  const t = $derived(traductionsPrix((data as { langue?: string }).langue ?? "fr"));
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {t.surtitre}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.titre(data.moisLibelle)}</h1>
      {#if data.logement}
        <p class="text-encre-douce">
          {t.resume(data.logement.nom, data.logement.code, data.planNom, data.tarifs, data.restrictions)}
        </p>
      {/if}
    </div>
  </header>

  {#if data.vide}
    <p class="text-encre-douce">{t.videAide}</p>
    <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">{t.gererLogements}</a>
  {:else}
    {#if data.ok}
      <p class="ui-alerte ui-alerte--ok">
        {data.ok === "1"
          ? t.ok1
          : data.ok === "restriction"
            ? t.okRestriction
            : data.ok === "restriction-supprimee"
              ? t.okRestrictionSupprimee
              : data.ok === "restriction-plage"
                ? t.okRestrictionPlage
                : data.ok === "restriction-supprimee-plage"
                  ? t.okRestrictionSupprimeePlage
                  : data.ok === "cutoff"
                    ? t.okCutoff
                    : data.ok === "buffer"
                      ? t.okBuffer
                      : data.ok === "prix-plage"
                      ? t.okPrixPlage
                      : data.ok === "strategie"
                        ? t.okStrategie(data.prix)
                      : data.ok === "plan-cree"
                      ? t.okPlanCree
                      : data.ok === "plan-modifie"
                        ? t.okPlanModifie
                        : data.ok === "plan-supprime"
                          ? t.okPlanSupprime
                          : t.okDate(data.ok)}
      </p>
    {/if}
    {#if erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">
        {erreur === "prix"
          ? t.errPrix
          : erreur === "cutoff"
            ? t.errCutoff
            : erreur === "buffer"
              ? t.errBuffer
              : erreur === "strategie"
                ? t.errStrategie
              : erreur === "plan"
              ? t.errPlan
              : erreur}
      </p>
    {/if}

    <div class="flex flex-wrap items-center gap-3">
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.precedent}>{t.moisPrecedent}</a>
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.courant}>{t.moisCourant}</a>
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.suivant}>{t.moisSuivant}</a>

      <form class="ml-auto flex flex-wrap items-end gap-2" method="get" action="/hote/prix">
        <input name="mois" type="hidden" value={data.mois} />
        <label class="space-y-1 text-sm">
          <span class="ui-label">{t.logement}</span>
          <select class="ui-champ" name="logement">
            {#each data.logements as logement (logement.id)}
              <option value={logement.id} selected={logement.id === data.logement?.id}>
                {logement.nom}
              </option>
            {/each}
          </select>
        </label>
        <label class="space-y-1 text-sm">
          <span class="ui-label">{t.plan}</span>
          <select class="ui-champ" name="plan">
            <option value="" selected={data.planId === ""}>{t.tarifBase}</option>
            {#each data.plans as plan (plan.id)}
              <option value={plan.id} selected={plan.id === data.planId}>
                {plan.nom}{plan.actif ? "" : t.inactif}
              </option>
            {/each}
          </select>
        </label>
        <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">{t.afficher}</button>
      </form>
    </div>

    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{t.modeTitre}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.modeDescription}</p>
      </div>
      <form class="space-y-4" method="POST" action="?/strategie">
        <input name="logementId" type="hidden" value={data.logement?.id} />
        <input name="planId" type="hidden" value={data.planId} />
        <input name="mois" type="hidden" value={data.mois} />
        <div class="grid gap-3 md:grid-cols-3">
          {#each data.strategies as strategie (strategie.code)}
            <label class="flex min-h-11 min-w-11 cursor-pointer flex-col gap-2 rounded-xl border border-bordure bg-surface-2 p-4 has-[:checked]:border-accent has-[:checked]:bg-accent-douce">
              <span class="flex items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="strategiePrix"
                  value={strategie.code}
                  checked={data.strategiePrix === strategie.code}
                />
                {strategie.libelle}
              </span>
              <span class="text-sm text-encre-douce">{strategie.description}</span>
              <span class="text-xs font-medium text-encre-faine">
                {strategie.ajustement === 0
                  ? t.prixInchanges
                  : t.ajustementMois(strategie.ajustement)}
              </span>
            </label>
          {/each}
        </div>
        <label class="flex min-h-11 min-w-11 items-start gap-2 text-sm text-encre-douce">
          <input class="mt-1" type="checkbox" name="appliquerAuxPrix" value="oui" />
          <span>{t.appliquerAuxPrix(data.moisLibelle)}</span>
        </label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.enregistrerMode}
        </button>
      </form>
    </section>

    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{t.canalTitre}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.cutoffDescription}</p>
        <p class="mt-2 text-sm text-encre-douce">{t.bufferDescription}</p>
      </div>
      <form class="flex flex-wrap items-end gap-3" method="POST" action="?/definirCutoff">
        <input name="logementId" type="hidden" value={data.logement?.id} />
        <input name="planId" type="hidden" value={data.planId} />
        <input name="mois" type="hidden" value={data.mois} />
        <label class="space-y-2">
          <span class="ui-label">{t.cutoffJours}</span>
          {#key data.cutoffJours}
            <input
              class="ui-champ w-32"
              name="cutoffJours"
              type="number"
              min="0"
              max="365"
              step="1"
              value={data.cutoffJours}
            />
          {/key}
        </label>
        <button class="ui-bouton ui-bouton--secondaire" type="submit">
          {t.enregistrer}
        </button>
      </form>
      <form class="flex flex-wrap items-end gap-3" method="POST" action="?/definirBuffer">
        <input name="logementId" type="hidden" value={data.logement?.id} />
        <input name="planId" type="hidden" value={data.planId} />
        <input name="mois" type="hidden" value={data.mois} />
        <label class="space-y-2">
          <span class="ui-label">{t.preparationJours}</span>
          {#key data.bufferJours}
            <input
              class="ui-champ w-32"
              name="bufferJours"
              type="number"
              min="0"
              max="7"
              step="1"
              value={data.bufferJours}
            />
          {/key}
        </label>
        <button class="ui-bouton ui-bouton--secondaire" type="submit">
          {t.enregistrer}
        </button>
      </form>
    </section>

    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{t.plansTitre}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.plansDescription}</p>
      </div>

      {#if data.plans.length > 0}
        <ul class="space-y-2">
          {#each data.plans as plan (plan.id)}
            <li class="flex flex-wrap items-center gap-3 border-b border-bordure pb-2">
              <div class="min-w-0 flex-1">
                <p class="font-medium">
                  {plan.nom}
                  {#if plan.id === data.planId}
                    <span class="text-encre-faine">{t.affiche}</span>
                  {/if}
                  {#if !plan.actif}
                    <span class="ui-badge ui-badge--alerte">{t.inactifBadge}</span>
                  {/if}
                </p>
                <p class="text-sm text-encre-douce">
                  {plan.code} · {plan.mode === "derive"
                    ? t.derive(plan.ajustementPourcentage)
                    : t.prixIndependants} · {plan.externalRatePlanId
                    ? t.ratePlanValue(plan.externalRatePlanId)
                    : t.nonMappe} · {t.priorite(plan.priorite)}
                </p>
              </div>
              <details class="w-full">
                <summary class="cursor-pointer text-sm text-encre-douce">
                  {t.configurer}
                </summary>
                <form class="mt-2 flex flex-wrap items-end gap-2" method="POST" action="?/modifierPlan">
                  <input name="logementId" type="hidden" value={data.logement?.id} />
                  <input name="planId" type="hidden" value={plan.id} />
                  <input name="mois" type="hidden" value={data.mois} />
                  <label class="space-y-1 text-sm">
                    <span class="ui-label">{t.nom}</span>
                    <input class="ui-champ" name="nom" value={plan.nom} required />
                  </label>
                  <label class="space-y-1 text-sm">
                    <span class="ui-label">{t.mode}</span>
                    <select class="ui-champ" name="mode">
                      <option value="independant" selected={plan.mode === "independant"}>
                        {t.modeIndependant}
                      </option>
                      <option value="derive" selected={plan.mode === "derive"}>
                        {t.modeDerive}
                      </option>
                    </select>
                  </label>
                  <label class="space-y-1 text-sm">
                    <span class="ui-label">{t.ajustement}</span>
                    <input
                      class="ui-champ w-24"
                      name="ajustementPourcentage"
                      type="number"
                      min="-90"
                      max="500"
                      step="1"
                      value={plan.ajustementPourcentage}
                    />
                  </label>
                  <label class="flex min-h-11 min-w-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="heriteRestrictions"
                      value="true"
                      checked={plan.heriteRestrictions}
                    />
                    <span>{t.heriter}</span>
                  </label>
                  <label class="space-y-1 text-sm">
                    <span class="ui-label">{t.ratePlan}</span>
                    <input
                      class="ui-champ"
                      name="externalRatePlanId"
                      value={plan.externalRatePlanId ?? ""}
                      placeholder={t.optionnel}
                    />
                  </label>
                  <label class="space-y-1 text-sm">
                    <span class="ui-label">{t.prioriteLabel}</span>
                    <input
                      class="ui-champ w-24"
                      name="priorite"
                      type="number"
                      min="0"
                      max="1000"
                      step="1"
                      value={plan.priorite}
                    />
                  </label>
                  <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                    {t.enregistrerPlan}
                  </button>
                </form>
              </details>
              <a
                class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
                href={`/hote/prix?mois=${data.mois}&logement=${data.logement?.id}&plan=${plan.id}`}
              >
                {t.ouvrir}
              </a>
              <form method="POST" action="?/basculerPlan">
                <input name="logementId" type="hidden" value={data.logement?.id} />
                <input name="planId" type="hidden" value={plan.id} />
                <input name="mois" type="hidden" value={data.mois} />
                <input name="actif" type="hidden" value={plan.actif ? "1" : "0"} />
                <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                  {plan.actif ? t.desactiver : t.activer}
                </button>
              </form>
              <ConfirmationAction
                langue={data.langue}
                action="supprimerPlan"
                cible={plan.id}
                libelle={t.supprimer}
                champs={{
                  logementId: data.logement?.id ?? "",
                  planId: plan.id,
                  mois: data.mois,
                }}
              />
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-sm text-encre-douce">
          {t.aucunPlan}
        </p>
      {/if}

      <form class="flex flex-wrap items-end gap-3 border-t border-bordure pt-4" method="POST" action="?/creerPlan">
        <input name="logementId" type="hidden" value={data.logement?.id} />
        <input name="mois" type="hidden" value={data.mois} />
        <label class="space-y-2">
          <span class="ui-label">{t.nom}</span>
          <input class="ui-champ" name="nom" placeholder={t.nomExemple} required />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.code}</span>
          <input class="ui-champ" name="code" placeholder={t.codeExemple} required />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.mode}</span>
          <select class="ui-champ" name="mode">
            <option value="independant">{t.modeIndependant}</option>
            <option value="derive">{t.modeDerive}</option>
          </select>
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.ajustement}</span>
          <input class="ui-champ w-24" name="ajustementPourcentage" type="number" min="-90" max="500" step="1" value="0" />
        </label>
        <label class="flex min-h-11 min-w-11 items-center gap-2 text-sm">
          <input type="checkbox" name="heriteRestrictions" value="true" checked />
          <span>{t.heriter}</span>
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.ratePlan}</span>
          <input class="ui-champ" name="externalRatePlanId" placeholder={t.optionnel} />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.prioriteLabel}</span>
          <input class="ui-champ w-24" name="priorite" type="number" min="0" max="1000" step="1" value="0" />
        </label>
        <button class="ui-bouton ui-bouton--secondaire" type="submit">{t.creerPlan}</button>
      </form>
    </section>

    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{t.definirTitre(data.planNom)}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.definirDescription}</p>
      </div>
      <form class="flex flex-wrap items-end gap-3" method="POST" action="?/definir">
        <input name="logementId" type="hidden" value={data.logement?.id} />
        <input name="planId" type="hidden" value={data.planId} />
        <label class="space-y-2">
          <span class="ui-label">{t.date}</span>
          <input class="ui-champ" name="date" type="date" defaultValue={data.dateDefaut} required />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.prixNuit}</span>
          <input class="ui-champ" inputmode="decimal" name="prixEuros" placeholder="120" required />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.supplementPersonne}</span>
          <input class="ui-champ" inputmode="decimal" name="prixParPersonneEuros" placeholder="0" />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.personnesIncluses}</span>
          <input class="ui-champ" inputmode="numeric" name="personnesIncluses" type="number" min="0" max="20" step="1" defaultValue="2" />
        </label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">{t.enregistrerPrix}</button>
      </form>
      <p class="text-sm text-encre-douce">{t.supplementAide}</p>
    </section>

    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{t.plageTitre(data.planNom)}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.plageDescription}</p>
      </div>
      <form class="flex flex-wrap items-end gap-3" method="POST" action="?/definirPrixPlage">
        <input name="logementId" type="hidden" value={data.logement?.id} />
        <input name="planId" type="hidden" value={data.planId} />
        <label class="space-y-2">
          <span class="ui-label">{t.du}</span>
          <input class="ui-champ" name="dateDebutPrix" type="date" defaultValue={data.dateDefaut} required />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.au}</span>
          <input class="ui-champ" name="dateFinPrix" type="date" defaultValue={data.dateDefaut} required />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.prixNuit}</span>
          <input class="ui-champ" inputmode="decimal" name="prixPlageEuros" placeholder="120" required />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.supplementPersonne}</span>
          <input class="ui-champ" inputmode="decimal" name="prixParPersonnePlageEuros" placeholder="0" />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.personnesIncluses}</span>
          <input class="ui-champ" inputmode="numeric" name="personnesInclusesPlage" type="number" min="0" max="20" step="1" defaultValue="2" />
        </label>
        <fieldset class="basis-full space-y-2">
          <legend class="ui-label">{t.joursPlage}</legend>
          <div class="flex flex-wrap gap-3 text-sm">
            {#each t.jours as libelle, index (libelle)}
              <label class="flex min-h-11 min-w-11 items-center gap-1.5">
                <input type="checkbox" name="joursSemaine" value={index + 1} checked />
                {libelle}
              </label>
            {/each}
          </div>
          <p class="text-xs text-encre-douce">{t.joursAide}</p>
        </fieldset>
        <button class="ui-bouton ui-bouton--primaire" type="submit">{t.appliquerPrix}</button>
      </form>
    </section>

    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{t.reglesTitre(data.planNom)}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.reglesDescription}</p>
      </div>
      <form class="flex flex-wrap items-end gap-3" method="POST" action="?/restriction">
        <input name="logementId" type="hidden" value={data.logement?.id} />
        <input name="planId" type="hidden" value={data.planId} />
        <label class="space-y-2">
          <span class="ui-label">{t.du}</span>
          <input class="ui-champ" name="dateRegle" type="date" defaultValue={data.dateDefaut} required />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.auOptionnel}</span>
          <input class="ui-champ" name="dateFinRegle" type="date" />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.sejourMin}</span>
          <input class="ui-champ" name="sejourMin" type="number" min="1" max="365" inputmode="numeric" placeholder="2" />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.sejourMax}</span>
          <input class="ui-champ" name="sejourMax" type="number" min="1" max="365" inputmode="numeric" placeholder="21" />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.arrivee}</span>
          <select class="ui-champ" name="arriveeAutorisee">
            <option value="">{t.nonPrecise}</option>
            <option value="true">{t.autorisee}</option>
            <option value="false">{t.interdite}</option>
          </select>
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.depart}</span>
          <select class="ui-champ" name="departAutorisee">
            <option value="">{t.nonPrecise}</option>
            <option value="true">{t.autorise}</option>
            <option value="false">{t.interdit}</option>
          </select>
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.vente}</span>
          <select class="ui-champ" name="stopSell">
            <option value="">{t.nonPreciseF}</option>
            <option value="false">{t.ouverte}</option>
            <option value="true">{t.arretee}</option>
          </select>
        </label>
        <fieldset class="basis-full space-y-2">
          <legend class="ui-label">{t.joursPlage}</legend>
          <div class="flex flex-wrap gap-3 text-sm">
            {#each t.jours as libelle, index (libelle)}
              <label class="flex min-h-11 min-w-11 items-center gap-1.5">
                <input
                  type="checkbox"
                  name="joursSemaine"
                  value={index + 1}
                  checked
                />
                {libelle}
              </label>
            {/each}
          </div>
          <p class="text-xs text-encre-douce">{t.joursRegleAide}</p>
        </fieldset>
        <button class="ui-bouton ui-bouton--primaire" type="submit">{t.enregistrerRegle}</button>
        <button class="ui-bouton ui-bouton--secondaire" name="supprimer" value="1" type="submit">
          {t.effacerDate}
        </button>
      </form>
    </section>

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <section tabindex="0" aria-label="Tableau défilant"  class="overflow-x-auto rounded-2xl border border-bordure bg-surface">
      <table class="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr class="border-b border-bordure bg-fond">
            {#each data.jours as jour (jour)}
              <th class="p-2 text-left font-medium">{jour}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.grille as semaine, index (index)}
            <tr class="border-b border-bordure">
              {#each semaine as cellule, i (cellule?.date ?? `vide-${index}-${i}`)}
                <td class="p-2 align-top">
                  {#if cellule}
                    <a class="block rounded-lg p-2 hover:bg-surface-2" href={cellule.lien}>
                      <span class="block text-xs text-encre-faine">{cellule.jour}</span>
                      <span class="mt-1 block font-medium">{cellule.prix}</span>
                      {#if cellule.regle}
                        <span class="mt-1 block text-[11px] leading-4 text-encre-faine">{cellule.regle}</span>
                      {/if}
                    </a>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/if}
</main>

