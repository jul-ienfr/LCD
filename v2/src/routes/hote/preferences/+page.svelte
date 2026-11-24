<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { MODES_APPARENCE, DENSITES } from "@/lib/preferences";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const t = $derived(data.t);
  const codeErreur = $derived(
    (form as { erreur?: string } | null)?.erreur ?? null,
  );
  const erreur = $derived(
    codeErreur
      ? (t.erreurs[codeErreur as keyof typeof t.erreurs] ?? t.erreurs.inattendu)
      : null,
  );

  /** Valeur soumise conservée après un refus, sinon la préférence enregistrée. */
  function soumis(nom: string): unknown {
    const valeurs = (form as { valeurs?: Record<string, unknown> } | null)?.valeurs;
    return valeurs?.[nom];
  }

  function choisi(nom: string, valeur: string): boolean {
    const brut = soumis(nom);
    if (brut === undefined) return false;
    const liste = Array.isArray(brut) ? brut.map(String) : [String(brut)];
    return liste.includes(valeur);
  }

  const modeCourant = $derived(
    choisi("mode", "systeme")
      ? "systeme"
      : choisi("mode", "clair")
        ? "clair"
        : choisi("mode", "sombre")
          ? "sombre"
          : data.preferences.mode,
  );
  const densiteCourante = $derived(
    choisi("densite", "compacte")
      ? "compacte"
      : choisi("densite", "confortable")
        ? "confortable"
        : data.preferences.densite,
  );
  const langueCourante = $derived(
    (() => {
      const brut = soumis("langue");
      const texte = Array.isArray(brut) ? String(brut[0] ?? "") : String(brut ?? "");
      return texte || data.preferences.langue;
    })(),
  );
  const notificationsCourantes = $derived(
    soumis("notifications") === undefined
      ? data.preferences.notifications
      : choisi("notifications", "1"),
  );

  const libellesMode: Record<string, string> = $derived({
    systeme: t.modeSysteme,
    clair: t.modeClair,
    sombre: t.modeSombre,
  });
  const libellesDensite: Record<string, string> = $derived({
    confortable: t.densiteConfortable,
    compacte: t.densiteCompacte,
  });
</script>

<svelte:head>
  <title>{t.titre} — LCD</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-3xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">{t.surtitre}</p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
    <p class="text-encre-douce">{t.intro}</p>
  </header>

  {#if data.ok}
    <p class="ui-alerte ui-alerte--succes" role="status">{t.enregistre}</p>
  {/if}
  {#if erreur}
    <p class="ui-alerte ui-alerte--danger" role="alert">{erreur}</p>
  {/if}

  <form method="POST" action="?/enregistrer" class="space-y-8">
    <section class="ui-carte space-y-4">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold">{t.visuel}</h2>
        <p class="text-sm text-encre-douce">{t.visuelAide}</p>
      </div>

      <label class="ui-champ-groupe">
        <span class="ui-label">{t.langue}</span>
        <select class="ui-champ" name="langue">
          {#each data.langues as langue (langue)}
            <option value={langue} selected={langue === langueCourante}>{langue.toUpperCase()}</option>
          {/each}
        </select>
        <span class="text-sm text-encre-douce">{t.langueAide}</span>
      </label>

      <fieldset class="space-y-2">
        <legend class="ui-label">{t.mode}</legend>
        <p class="text-sm text-encre-douce">{t.modeAide}</p>
        <div class="flex flex-wrap gap-4">
          {#each MODES_APPARENCE as mode (mode)}
            <label class="inline-flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="mode"
                value={mode}
                checked={modeCourant === mode}
                required
              />
              <span>{libellesMode[mode]}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      <fieldset class="space-y-2">
        <legend class="ui-label">{t.densite}</legend>
        <p class="text-sm text-encre-douce">{t.densiteAide}</p>
        <div class="flex flex-wrap gap-4">
          {#each DENSITES as densite (densite)}
            <label class="inline-flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="densite"
                value={densite}
                checked={densiteCourante === densite}
                required
              />
              <span>{libellesDensite[densite]}</span>
            </label>
          {/each}
        </div>
      </fieldset>
    </section>

    <section class="ui-carte space-y-3">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold">{t.notifications}</h2>
        <p class="text-sm text-encre-douce">{t.notificationsAide}</p>
      </div>
      <label class="inline-flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          name="notifications"
          value="1"
          checked={notificationsCourantes}
        />
        <span>{t.notificationsActiver}</span>
      </label>
    </section>

    <div class="flex flex-wrap items-center gap-3">
      <button class="ui-bouton ui-bouton--primaire" type="submit">{t.enregistrer}</button>
      <a class="ui-lien-action text-sm" href="/hote">{t.retour}</a>
    </div>
  </form>

  <form method="POST" action="?/defauts" class="ui-carte space-y-2 border-dashed">
    <p class="text-sm text-encre-douce">{t.reinitialiserAide}</p>
    <button class="ui-bouton ui-bouton--secondaire" type="submit">{t.reinitialiser}</button>
  </form>
</main>
