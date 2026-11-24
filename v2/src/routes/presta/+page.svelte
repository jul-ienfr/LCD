<script lang="ts">
  /**
   * Espace prestataire : mes missions, mes offres, pointage et preuve
   * (FR-038, spec 006).
   *
   * Tout le texte vient du dictionnaire (`traductionsPresta`) dans la langue
   * servie par le serveur, y compris les retours d'action : chaque action
   * revient avec un code (`?ok=`, `?erreur=`) et la page affiche le message
   * correspondant — aucun échec silencieux. Les libellés composés (motif de
   * refus, pointage, durée) sont assemblés ici à partir des valeurs brutes.
   */
  import type { PageData } from "./$types";
  import ConfirmationAction from "@/lib/components/ui/confirmation-action.svelte";
  import {
    traductionsPresta,
    type CodeErreurPresta,
    type CodeRetourPresta,
  } from "@/lib/i18n-presta";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsPresta(data.langue));

  /** Ligne d'une offre : référence, date, heure et logement de la mission. */
  function ligneOffre(
    mission: {
      ref: string;
      date: string;
      heure: string | null;
      logement: string | null;
    } | null,
  ): string | null {
    if (!mission) return null;
    const heure = mission.heure ? ` ${mission.heure}` : "";
    const logement = mission.logement ? ` · ${mission.logement}` : "";
    return `${mission.ref} — ${mission.date}${heure}${logement}`;
  }

  const decisions = [
    { valeur: "accepter", classe: "ui-bouton ui-bouton--primaire ui-bouton--petit" },
    { valeur: "refuser", classe: "ui-bouton ui-bouton--secondaire ui-bouton--petit" },
  ] as const;
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-3xl space-y-8 px-5 py-8 sm:px-6 sm:py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.espace}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.bonjour} {data.nom}</h1>
    <p class="text-encre-douce">
      {t.resume(data.missions.length)} · {data.email}
    </p>
  </header>

  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok" role="status">
      {t.retours[data.ok as CodeRetourPresta] ?? t.retourEnregistre}
    </p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger" role="alert">
      {t.erreurs[data.erreur as CodeErreurPresta] ?? t.erreurs.inattendu}
    </p>
  {/if}

  {#if data.offres.length > 0}
    <section class="space-y-3" id="offres">
      <h2 class="text-lg font-semibold">{t.offresTitre(data.offres.length)}</h2>
      <ul class="space-y-3">
        {#each data.offres as offre (offre.id)}
          <li class="rounded-carte border border-accent bg-accent-douce p-4">
            <p class="font-mono text-xs text-accent">{offre.ref}</p>
            <p class="mt-1 text-sm">
              {ligneOffre(offre.mission) ?? t.missionAVenir}
            </p>
            {#if offre.message}
              <p class="mt-1 text-sm text-encre-douce">{offre.message}</p>
            {/if}
            <div class="mt-3 flex flex-wrap gap-2">
              {#each decisions as option (option.valeur)}
                <form method="POST" action="?/dispatch">
                  <input type="hidden" name="id" value={offre.id} />
                  <input type="hidden" name="decision" value={option.valeur} />
                  <button class={option.classe} type="submit">
                    {option.valeur === "accepter" ? t.accepter : t.refuser}
                  </button>
                </form>
              {/each}
            </div>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.mesMissions}</h2>
    {#if data.missions.length === 0}
      <p class="ui-carte border-dashed text-encre-douce">{t.aucuneMission}</p>
    {:else}
      <ul class="space-y-3">
        {#each data.missions as mission (mission.id)}
          <li class="ui-carte">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="font-medium">
                  {t.typesMission[mission.type]} · {mission.logement ?? t.logement}
                </p>
                <p class="text-sm text-encre-douce">
                  {mission.ref} · {mission.date}{mission.heure ? ` ${mission.heure}` : ""}
                </p>
              </div>
              <span class="ui-etiquette">{t.statutsMission[mission.statut]}</span>
            </div>

            {#if mission.pointage === "non_commence"}
              <p class="mt-2 text-sm text-encre-douce">
                {t.dureePrevue(mission.dureePrevue)}
              </p>
            {:else}
              <dl class="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div>
                  <dt class="text-xs uppercase tracking-wide text-encre-faine">
                    {t.debutPointe}
                  </dt>
                  <dd>
                    {mission.debutReel}
                    {#if mission.debutSource === "hors_ligne" && mission.debutRecuLe}
                      <span class="text-xs text-encre-faine">
                        {t.recuLe(mission.debutRecuLe)}
                      </span>
                    {/if}
                  </dd>
                </div>
                {#if mission.finReelle}
                  <div>
                    <dt class="text-xs uppercase tracking-wide text-encre-faine">
                      {t.finPointe}
                    </dt>
                    <dd>
                      {mission.finReelle}
                      {#if mission.finSource === "hors_ligne" && mission.finRecuLe}
                        <span class="text-xs text-encre-faine">
                          {t.recuLe(mission.finRecuLe)}
                        </span>
                      {/if}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs uppercase tracking-wide text-encre-faine">
                      {t.dureeReelle}
                    </dt>
                    <dd>
                      {mission.dureeReelle}
                      <span class="text-encre-faine">({t.prevu(mission.dureePrevue)})</span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs uppercase tracking-wide text-encre-faine">
                      {t.ecart}
                    </dt>
                    <dd>{mission.ecart}</dd>
                  </div>
                {/if}
              </dl>
            {/if}

            {#if mission.statut !== "annulee"}
              <div class="mt-3 space-y-2 border-t border-bordure pt-3">
                <p class="flex flex-wrap items-center gap-2 text-sm">
                  <span class="ui-etiquette">{t.preuveStatuts[mission.preuve]}</span>
                  {#if mission.preuveSoumiseLe}
                    <span class="text-encre-faine">
                      {t.preuveSoumiseLe(mission.preuveSoumiseLe)}
                    </span>
                  {/if}
                  {#if mission.preuveValideeLe}
                    <span class="text-encre-faine">
                      {t.preuveValideeLe(mission.preuveValideeLe, mission.preuveValideePar ?? "")}
                    </span>
                  {/if}
                </p>
                {#if mission.preuve === "refusee" && mission.preuveMotif}
                  <p class="ui-alerte ui-alerte--danger" role="alert">
                    {t.refusACorriger(mission.preuveMotif)}
                  </p>
                {/if}
                {#if mission.peutSoumettre}
                  <form method="POST" action="?/preuve">
                    <input type="hidden" name="missionId" value={mission.id} />
                    <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="submit">
                      {mission.preuve === "refusee"
                        ? t.corrigerResoumettre
                        : t.soumettrePreuve}
                    </button>
                  </form>
                {/if}
                {#if mission.historique.length > 0}
                  <ol class="space-y-1 text-xs text-encre-douce" aria-label={t.historiquePreuve}>
                    {#each mission.historique as etape (etape.id)}
                      <li>
                        {t.preuveStatuts[etape.statut]} — {etape.le} · {etape.qui}{#if etape.motif}: {etape.motif}{/if}
                      </li>
                    {/each}
                  </ol>
                {/if}
              </div>
            {/if}

            <div class="mt-3 flex flex-wrap items-end gap-3">
              {#if mission.pointage === "non_commence" && (mission.statut === "planifiee" || mission.statut === "en_cours")}
                <form class="space-y-2" method="POST" action="?/pointage">
                  <input type="hidden" name="missionId" value={mission.id} />
                  <input type="hidden" name="sens" value="debut" />
                  <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="submit">
                    {t.pointerDebut}
                  </button>
                  <details class="text-xs text-encre-douce">
                    <summary class="cursor-pointer">{t.pointageHorsLigneQuestion}</summary>
                    <label class="mt-2 block space-y-1">
                      <span>{t.heureReellePointage}</span>
                      <input class="ui-champ" name="horodatageLocal" type="datetime-local" />
                    </label>
                  </details>
                </form>
              {:else if mission.pointage === "en_cours" && mission.statut === "en_cours"}
                <form class="space-y-2" method="POST" action="?/pointage">
                  <input type="hidden" name="missionId" value={mission.id} />
                  <input type="hidden" name="sens" value="fin" />
                  <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="submit">
                    {t.pointerFin}
                  </button>
                  <details class="text-xs text-encre-douce">
                    <summary class="cursor-pointer">{t.pointageHorsLigneQuestion}</summary>
                    <label class="mt-2 block space-y-1">
                      <span>{t.heureReellePointage}</span>
                      <input class="ui-champ" name="horodatageLocal" type="datetime-local" />
                    </label>
                  </details>
                </form>
              {/if}
              {#if mission.transitions.includes("annulee")}
                <ConfirmationAction
                  langue={data.langue}
                  action="statut"
                  jeton="annuler"
                  cible={mission.id}
                  libelle={t.annulerMission}
                  champs={{ missionId: mission.id, statut: "annulee" }}
                  classe="ui-bouton ui-bouton--secondaire ui-bouton--petit"
                />
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
