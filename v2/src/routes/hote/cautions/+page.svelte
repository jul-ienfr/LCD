<script lang="ts">
  import type { PageData } from "./$types";
  import { traductionsFinance } from "@/lib/i18n-finance";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsFinance(data.langue));

  const classes: Record<string, string> = {
    attendue: "ui-badge ui-badge--alerte",
    recue: "ui-badge ui-badge--accent",
    restituee: "ui-badge",
    retenue: "ui-badge ui-badge--danger",
  };
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.espace}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.titre(data.moisLibelle)}</h1>
    <p class="text-encre-douce">{t.description}</p>
  </header>

  <div class="flex flex-wrap items-center gap-3">
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.precedent}>{t.precedent}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.courant}>{t.courant}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.suivant}>{t.suivant}</a>
    <a class="ui-lien ml-auto text-sm" href={`/hote/planning?mois=${data.mois}`}>{t.planning}</a>
  </div>

  {#if data.caution === "creee"}
    <p class="ui-alerte ui-alerte--ok">{t.creee}</p>
  {:else if data.caution === "ok"}
    <p class="ui-alerte ui-alerte--ok">{t.maj}</p>
  {:else if data.caution === "erreur"}
    <p class="ui-alerte ui-alerte--danger">{t.erreurMaj}</p>
  {/if}

  {#if data.validation === "en_attente"}
    <p class="ui-alerte ui-alerte--ok">
      {t.validationAttente}
    </p>
  {:else if data.validation === "approuvee"}
    <p class="ui-alerte ui-alerte--ok">{t.validationApprouvee}</p>
  {:else if data.validation === "rejetee"}
    <p class="ui-alerte ui-alerte--ok">{t.validationRejetee}</p>
  {:else if data.validation === "soi"}
    <p class="ui-alerte ui-alerte--danger">{t.validationSoi}</p>
  {:else if data.validation === "erreur"}
    <p class="ui-alerte ui-alerte--danger">{t.validationErreur}</p>
  {/if}

  {#if data.peutValider && data.validations.length > 0}
    <section class="ui-carte space-y-4 border-alerte">
      <div>
        <h2 class="text-lg font-semibold">{t.doubleTitre}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.doubleAide(data.seuilValidation)}</p>
      </div>
      <ul class="space-y-3">
        {#each data.validations as validation (validation.id)}
          <li class="rounded-xl border border-bordure bg-surface-2 p-4">
            <p class="font-medium">
              {t.retenueLigne(validation.reservation, validation.montant)}
            </p>
            <p class="mt-1 text-sm text-encre-douce">
              {t.demandePar(validation.demandeur, validation.demandeLe)}
              {#if validation.motif}· {t.motifCourt} : {validation.motif}{/if}
            </p>
            {#if validation.soi}
              <p class="mt-2 text-sm text-alerte">
                {t.demandeurAvert}
              </p>
            {:else}
              <div class="mt-3 flex flex-wrap items-end gap-3">
                <form method="POST" action="?/deciderValidation">
                  <input type="hidden" name="mois" value={data.mois} />
                  <input type="hidden" name="validationId" value={validation.id} />
                  <input type="hidden" name="decision" value="approuvee" />
                  <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="submit">
                    {t.approuverAppliquer}
                  </button>
                </form>
                <form class="flex flex-wrap items-end gap-2" method="POST" action="?/deciderValidation">
                  <input type="hidden" name="mois" value={data.mois} />
                  <input type="hidden" name="validationId" value={validation.id} />
                  <input type="hidden" name="decision" value="rejetee" />
                  <label class="text-xs text-encre-douce">
                    {t.motifRefus}
                    <input class="ui-champ ml-2" name="motifDecision" maxlength="500" />
                  </label>
                  <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                    {t.rejeter}
                  </button>
                </form>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="grid gap-4 sm:grid-cols-3">
    <div class="ui-carte">
      <p class="text-sm text-encre-faine">{t.cautionsMois}</p>
      <p class="mt-1 text-2xl font-semibold">{data.reservations.filter((r) => r.caution).length}</p>
    </div>
    <div class="ui-carte">
      <p class="text-sm text-encre-faine">{t.montantTotal}</p>
      <p class="mt-1 text-2xl font-semibold">{data.totalCaution}</p>
    </div>
    <div class="ui-carte">
      <p class="text-sm text-encre-faine">{t.retenu}</p>
      <p class="mt-1 text-2xl font-semibold">{data.totalRetenu}</p>
    </div>
  </section>

  {#if data.sansCaution.length > 0}
    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{t.creerTitre}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.creerAide}</p>
      </div>
      <form class="space-y-4" method="POST" action="?/creer">
        <input name="mois" type="hidden" value={data.mois} />
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="space-y-2">
            <span class="ui-label">{t.reservation}</span>
            <select class="ui-champ" name="reservationId" required>
              {#each data.sansCaution as reservation (reservation.id)}
                <option value={reservation.id}>
                  {reservation.ref} · {reservation.debut} → {reservation.fin}
                </option>
              {/each}
            </select>
          </label>
          <label class="space-y-2">
            <span class="ui-label">{t.montant}</span>
            <input class="ui-champ" inputmode="decimal" name="montantEuros" placeholder="500" required />
          </label>
        </div>
        <label class="block space-y-2">
          <span class="ui-label">{t.notesFacultatif}</span>
          <textarea class="ui-champ min-h-16" name="notes"></textarea>
        </label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">{t.creer}</button>
      </form>
    </section>
  {/if}

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.cautionsResas}</h2>
    {#if data.reservations.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucuneResa}
      </p>
    {:else}
      <ul class="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
        {#each data.reservations as reservation (reservation.id)}
          <li class="space-y-3 p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="font-medium">
                  {reservation.ref}{reservation.client ? ` — ${reservation.client}` : ""}
                </p>
                <p class="text-sm text-encre-douce">
                  {reservation.debut} → {reservation.fin}
                  {reservation.caution ? ` · ${reservation.caution.montant}` : ` · ${t.aucuneCaution}`}
                </p>
                {#if reservation.caution}
                  <p class="mt-1 text-xs text-encre-faine">
                    {reservation.caution.dateReception ? `${t.recueLe(reservation.caution.dateReception)} · ` : ""}
                    {reservation.caution.dateRestitution ? `${t.clotureeLe(reservation.caution.dateRestitution)} · ` : ""}
                    {reservation.caution.montantRetenu ? `${t.retenuLabel(reservation.caution.montantRetenu)} · ` : ""}
                    {reservation.caution.motif ? t.motifLabel(reservation.caution.motif) : ""}
                  </p>
                {/if}
              </div>
              <span class={reservation.caution ? classes[reservation.caution.statut] : "ui-badge"}>
                {reservation.caution ? t.statuts[reservation.caution.statut] : t.aCreer}
              </span>
            </div>

            {#if reservation.caution?.statut === "attendue"}
              <form method="POST" action="?/statut">
                <input name="cautionId" type="hidden" value={reservation.caution.id} />
                <input name="statut" type="hidden" value="recue" />
                <input name="mois" type="hidden" value={data.mois} />
                <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                  {t.marquerRecue}
                </button>
              </form>
            {:else if reservation.caution?.statut === "recue"}
              <div class="flex flex-wrap items-end gap-3">
                <form method="POST" action="?/statut">
                  <input name="cautionId" type="hidden" value={reservation.caution.id} />
                  <input name="statut" type="hidden" value="restituee" />
                  <input name="mois" type="hidden" value={data.mois} />
                  <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                    {t.restituer}
                  </button>
                </form>
                <form class="flex flex-wrap items-end gap-2" method="POST" action="?/statut">
                  <input name="cautionId" type="hidden" value={reservation.caution.id} />
                  <input name="statut" type="hidden" value="retenue" />
                  <input name="mois" type="hidden" value={data.mois} />
                  <label class="text-xs text-encre-douce">
                    {t.retenue}
                    <input class="ui-champ ml-2 w-24" inputmode="decimal" name="montantRetenuEuros" placeholder="100" required />
                  </label>
                  <label class="text-xs text-encre-douce">
                    {t.motifCourt}
                    <input class="ui-champ ml-2" name="motifRetenue" placeholder={t.motifPlaceholder} required />
                  </label>
                  <button class="ui-bouton ui-bouton--danger ui-bouton--petit" type="submit">{t.retenir}</button>
                </form>
                <p class="basis-full text-xs text-encre-faine">
                  {t.seuilAide(data.seuilValidation)}
                </p>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
